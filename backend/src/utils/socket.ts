import { verifyToken } from "@clerk/express";
import type { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { User } from "../models/User";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";

export interface SocketWithUserId extends Socket {
    userId?: string;
}

const onlineUsers = new Map<string, string>();

export const initializeSocket = (server: HttpServer) => {
    const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        process.env.FRONTEND_URL
    ].filter(Boolean) as string[];

    const io = new SocketServer(server, {
        cors: {
            origin: allowedOrigins
        }
    })

    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }
        try {
            const session = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
            const clerkId = session.sub;
            const user = await User.findOne({ clerkId });
            if (!user) return next(new Error("User not found"));
            (socket as SocketWithUserId).userId = user._id.toString();
            next();
        } catch (error: any) {
            return next(new Error(error));
        }
    })

    io.on("connection", (socket) => {
        const userId = (socket as SocketWithUserId).userId as string;

        socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });
        onlineUsers.set(userId!, socket.id);

        socket.broadcast.emit("user-online", { userId });

        socket.join(`user:${userId}`);

        socket.on("join-chat", (chatId: string) => {
            socket.join(`chat:${chatId}`);
        });

        socket.on("leave-chat", (chatId: string) => {
            socket.leave(`chat:${chatId}`);
        });

        socket.on("send-message", async (data: { chatId: string; text: string }) => {
            try {
                const { chatId, text } = data;

                const chat = await Chat.findOne({
                    _id: chatId,
                    participants: userId,
                });

                if (!chat) {
                    socket.emit("socket-error", { message: "Chat not found" });
                    return;
                }

                const message = await Message.create({
                    chat: chatId,
                    sender: userId,
                    text,
                });

                chat.lastMessage = message._id;
                chat.lastMessageAt = new Date();
                await chat.save();

                await message.populate("sender", "name email avatar");

                io.to(`chat:${chatId}`).emit("new-message", message);

                for (const participantId of chat.participants) {
                    io.to(`user:${participantId}`).emit("new-message", message);
                }
            } catch (error) {
                socket.emit("socket-error", { message: "Failed to send message" });
            }
        });

        socket.on("typing", async (data) => { });

        socket.on("disconnect", () => {
            onlineUsers.delete(userId);

            socket.broadcast.emit("user-offline", { userId });

        });
    });
}
