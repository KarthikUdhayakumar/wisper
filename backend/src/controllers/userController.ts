import type { NextFunction, Response } from "express"
import type { AuthRequest } from "../middleware/auth"
import { User } from "../models/User";

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId;
        const users = await User.find({ _id: { $ne: userId } }).select("name email avatar");
        return res.status(200).json({ users });
    } catch (error) {
        console.log(error);
        res.status(500);
        next(error);
    }
}