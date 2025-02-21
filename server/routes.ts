
import express from "express";
import { Server } from "http";
import { db } from "./db";
import { jobs, users, applications, feedback, notifications, referrals } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./utils/password";

export function registerRoutes(app: express.Express): Server {
  const server = new Server(app);

  // User routes
  app.post("/api/users", async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await hashPassword(password);
    
    try {
      const newUser = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        isAdmin: false,
        credits: 5
      }).returning();
      
      res.json(newUser[0]);
    } catch (error) {
      res.status(400).json({ error: "User creation failed" });
    }
  });

  // Basic health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });

  return server;
}
