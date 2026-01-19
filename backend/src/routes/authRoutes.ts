import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { callback, getMe } from "../controllers/authController";

const router = Router();

router.get("/me", protectRoute, getMe);
router.post("/callback", callback);

export default router;