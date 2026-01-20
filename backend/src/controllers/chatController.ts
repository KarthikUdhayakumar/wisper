import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { Chat } from "../models/Chat";
import { Types } from "mongoose";

export async function getChats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId;
        const chats = await Chat.find({ participants: userId }).populate("participants", "name email avatar").populate("lastMessage").sort({ updatedAt: 1 });
        const processedChat = chats.map(chat => {
            const otherParticipant = chat.participants.find(participant => participant._id.toString() !== userId);
            return {
                _id: chat._id,
                participant: otherParticipant ?? null,
                lastMessage: chat.lastMessage,
                lastMessageAt: chat.updatedAt,
                createdAt: chat.createdAt
            }
        })
        return res.status(200).json({ processedChat });
    } catch (error) {
        console.log(error);
        res.status(500);
        next(error);
    }
}

export async function getOrCreateChat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId;
        const { participantId } = req.params;

        if (!participantId) {
            res.status(400).json({ message: "Participant ID is required" });
            return;
        }

        if (!Types.ObjectId.isValid(participantId as string)) {
            return res.status(400).json({ message: "Invalid participant ID" });
        }

        if (userId === participantId) return res.status(400).json({ message: "Cannot create chat with yourself" });

        let chat = await Chat.findOne({ participants: { $all: [userId, participantId] } });
        if (!chat) {
            const newChat = new Chat({
                participants: [userId, participantId]
            });
            chat = await newChat.save();
        }
        chat.populate("participants", "name email avatar");
        const otherParticipant = chat.participants.find(participant => participant._id.toString() !== userId);
        const processedChat = {
            _id: chat._id,
            participant: otherParticipant ?? null,
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.updatedAt,
            createdAt: chat.createdAt
        }
        return res.status(200).json({ processedChat });
    } catch (error) {
        console.log(error);
        res.status(500);
        next(error);
    }
}