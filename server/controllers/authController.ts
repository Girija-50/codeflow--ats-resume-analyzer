import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/db.ts";
import { getJwtSecret, type AuthenticatedRequest } from "../middleware/authMiddleware.ts";

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, headline, bio, avatar } = req.body;
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        error: "A valid email and a password between 8 and 128 characters are required",
      });
    }
    const user = await User.create({
      name: name || email.split("@")[0],
      email,
      password,
      headline: headline || "Software Engineer",
      bio: bio || "",
      avatar: avatar || "",
    });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        headline: user.headline,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Signup failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string" || password.length > 128) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        headline: user.headline,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Login failed",
    });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User profile not found" });
    }
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      headline: user.headline,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt,
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to load profile",
    });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { name, headline, bio, avatar } = req.body;
    const updated = await User.updateProfile(req.user.id, {
      name,
      headline,
      bio,
      avatar,
    });

    return res.json({
      success: true,
      user: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        headline: updated.headline,
        bio: updated.bio,
        avatar: updated.avatar,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Failed to update profile",
    });
  }
};
