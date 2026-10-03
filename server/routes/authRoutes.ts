import express from "express";
import { signup, login, getMe, updateProfile } from "../controllers/authController.ts";
import authMiddleware from "../middleware/authMiddleware.ts";

const router = express.Router();

router.post("/signup", signup);
router.post("/register", signup);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);

export default router;
