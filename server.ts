import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getJwtSecret } from "./server/middleware/authMiddleware.ts";
import authRoutes from "./server/routes/authRoutes.ts";
import resumeRoutes from "./server/routes/resumeRoutes.ts";

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    getJwtSecret();
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: "15mb" }));

  // API Routes
  app.use("/auth", authRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/resume", resumeRoutes);
  app.use("/api/resume", resumeRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "CodeFlow" });
  });

  // Serve the production build whenever it exists (or NODE_ENV=production),
  // otherwise fall back to Vite dev middleware for local development.
  const distPath = path.join(process.cwd(), "dist");
  const hasBuild = fs.existsSync(path.join(distPath, "index.html"));
  const isProduction = process.env.NODE_ENV === "production" || hasBuild;

  if (isProduction) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CodeFlow server running on http://0.0.0.0:${PORT}`);
    console.log(isProduction ? "Serving production build from dist/" : "Running in development mode (Vite middleware)");
  });
}

startServer();
