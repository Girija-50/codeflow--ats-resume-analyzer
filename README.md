# CodeFlow

CodeFlow is a full-stack resume analyzer and code-generation app built with React, Vite, and Express.

## Run locally

Requirements: Node.js 24.15.0 and npm.

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and set `JWT_SECRET` to a random value at least 32 characters long.
3. Set `GEMINI_API_KEY` to enable Gemini-powered analysis and code generation. Without it, the app uses its deterministic fallback.
4. Start the development server with `npm run dev`.

Run `npm run lint` and `npm run build` to validate and build the app.

## Deploy to Render

The included `render.yaml` configures a free Render web service without a persistent disk or paid resources. Render generates `JWT_SECRET`; set `GEMINI_API_KEY` in the service's Environment settings to enable Gemini features. Do not commit `.env` files, `.data`, or logs.

To deploy, push the project to a Git repository, then create a Render Blueprint from that repository and apply the `render.yaml` configuration. The service exposes `/api/health` for its health check. Free services may spin down when idle, so the first request afterward can take time.

The free deployment stores account and resume data in temporary local storage. Render can discard this data on restarts, redeploys, and instance replacement. Do not use this free configuration for important or sensitive resume data; choose persistent storage and a paid plan before relying on it.
