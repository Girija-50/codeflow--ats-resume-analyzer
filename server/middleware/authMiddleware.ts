import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }
  return secret;
}

export default function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  if (!token) {
    return res.status(401).json({ error: "Access denied. Please log in or sign up first." });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      id: string;
      email?: string;
      name?: string;
    };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}
