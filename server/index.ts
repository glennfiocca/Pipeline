import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Move JSON middleware before any route handling
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Global middleware to set JSON content type for API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});

// Setup routes and auth before static file handling
const server = registerRoutes(app);

// Error handler for JSON parsing
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
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

// Setup Vite or serve static files after all API routes are registered
if (app.get("env") === "development") {
  setupVite(app, server);
} else {
  serveStatic(app);
}

const PORT = 5000;
server.listen(PORT, "0.0.0.0", () => {
  log(`serving on port ${PORT}`);
});