import type { AuthRequest } from "../middleware/auth";
import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User";
import { clerkClient, getAuth } from "@clerk/express";

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId
        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ user });
    } catch (error) {
        console.log(error);
        res.status(500);
        next();
    }
}

export const callback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId: clerkId } = getAuth(req);
        if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

        let user = await User.findOne({ clerkId });
        if (user) return res.status(404).json({ message: "User aleady exists" });

        const clerkUser = await clerkClient.users.getUser(clerkId)

        user = await User.create({
            clerkId,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            avatar: clerkUser.imageUrl
        });
        return res.status(201).json({ user });

    } catch (error) {
        console.log(error);
        res.status(500);
        next();
    }
}


