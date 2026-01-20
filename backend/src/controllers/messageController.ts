import type { NextFunction, Response } from "express"
import type { AuthRequest } from "../middleware/auth"
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { chatId } = req.params;
        const userId = req.userId;

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: "Chat not found" });

        const messages = await Message.find({ chat: chatId }).populate("sender", "name avatar email").sort({ createdAt: 1 });
        return res.status(200).json({ messages });
    } catch (error) {
        console.log(error);
        res.status(500);
        next(error);
    }
}