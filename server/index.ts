import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import path from "path";

const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Setup auth first
setupAuth(app);

// Then setup routes
const server = registerRoutes(app);

// Error handler for JSON parsing
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON Parse Error:', err);
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      details: err.message
    });
  }
  next(err);
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Global error handler caught:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

// Setup Vite last, after all API routes are registered
if (app.get("env") === "development") {
  setupVite(app, server);
} else {
  serveStatic(app);
}

const PORT = 5000;
server.listen(PORT, "0.0.0.0", () => {
  log(`serving on port ${PORT}`);
});