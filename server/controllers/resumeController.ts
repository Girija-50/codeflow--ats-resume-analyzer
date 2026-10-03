import type { Response } from "express";
import { parseResume } from "../utils/resumeParser.ts";
import { extractKeywords } from "../utils/keywordExtractor.ts";
import { calculateATSScore, analyzeKeywordsDetailed } from "../utils/atsScore.ts";
import { analyzeWithGemini, generateProductionCode } from "../utils/aiAnalyzer.ts";
import { Resume } from "../models/db.ts";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.ts";

export const uploadResume = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file was uploaded" });
    }

    const uint8Array = new Uint8Array(
      req.file.buffer.buffer,
      req.file.buffer.byteOffset,
      req.file.buffer.byteLength
    );

    const text = await parseResume(uint8Array);

    return res.json({
      success: true,
      fileName: req.file.originalname,
      preview: text.slice(0, 500),
      text,
      characters: text.length,
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to parse PDF file",
    });
  }
};

export const analyzeResume = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resumeText, jobDescription, fileName, jobTitle } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({
        error: "Both resume text and job description are required for ATS analysis.",
      });
    }

    // Step 1: Extract keywords and calculate baseline ATS score
    const jdKeywords = extractKeywords(jobDescription);
    const resumeKeywords = extractKeywords(resumeText);
    const rawScore = calculateATSScore(jdKeywords, resumeKeywords);

    const detailed = analyzeKeywordsDetailed(jobDescription, resumeText);
    const atsScore = Math.max(rawScore, detailed.atsScore);

    // Step 2: AI-powered analysis with Gemini
    const suggestions = await analyzeWithGemini(resumeText, jobDescription);

    const inferredTitle =
      jobTitle ||
      jobDescription
        .split(/[.\n]/)[0]
        ?.trim()
        .slice(0, 60) ||
      "Target Job Analysis";

    // Step 3: Store ONLY when the user analyzes (no sample data!)
    const savedResume = await Resume.create({
      userId: req.user!.id,
      fileName: fileName || "My_Resume.pdf",
      jobTitle: inferredTitle,
      jobDescription,
      text: resumeText,
      atsScore,
      matchedKeywords: detailed.matchedKeywords,
      missingKeywords: detailed.missingKeywords,
      suggestions,
    });

    return res.json({
      success: true,
      atsScore,
      matchedKeywords: detailed.matchedKeywords,
      missingKeywords: detailed.missingKeywords,
      suggestions,
      savedResume,
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to analyze resume",
    });
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userResumes = await Resume.find({ userId: req.user!.id });
    return res.json({
      success: true,
      resumes: userResumes,
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to load history",
    });
  }
};

export const deleteHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Resume.findByIdAndDelete(id, req.user!.id);
    if (!deleted) {
      return res.status(404).json({ error: "Record not found or not owned by you" });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete record",
    });
  }
};

export const generateCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topic, language, userContext } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }
    const result = await generateProductionCode(topic, language, userContext);
    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Code generation failed",
    });
  }
};
