import express from "express";
import authMiddleware from "../middleware/authMiddleware.ts";
import { upload } from "../middleware/upload.ts";
import {
  uploadResume,
  analyzeResume,
  getHistory,
  deleteHistory,
  generateCode,
} from "../controllers/resumeController.ts";

const router = express.Router();

router.post("/upload", authMiddleware as any, upload.single("resume") as any, uploadResume as any);
router.post("/analyze", authMiddleware as any, analyzeResume as any);
router.get("/history", authMiddleware as any, getHistory as any);
router.delete("/history/:id", authMiddleware as any, deleteHistory as any);
router.post("/generate-code", authMiddleware as any, generateCode as any);

export default router;
