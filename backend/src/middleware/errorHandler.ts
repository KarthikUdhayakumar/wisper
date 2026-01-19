import { type NextFunction, type Request, type Response } from "express";

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.log(err);
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        message: err.message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}