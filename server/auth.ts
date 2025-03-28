import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { insertUserSchema, type User as SchemaUser } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";

// Correctly extend Express.User interface
declare global {
  namespace Express {
    interface User extends SchemaUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPLIT_ID || 'development-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: app.get("env") === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax'
    }
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    // Access with type safety since we know user has an 'id' property
    done(null, (user as SchemaUser & { id: number }).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Register endpoint that redirects to the standard endpoint
  app.post("/api/register", async (req, res) => {
    try {
      // Log incoming registration data
      console.log("Received registration request at /api/register:", req.body);
      console.log("Referral code in request:", req.body.referredBy);
      
      // Simply redirect to the standard endpoint in routes.ts
      // by modifying the URL and forwarding the request
      req.url = "/api/auth/register";
      
      console.log("Redirecting to /api/auth/register with body:", req.body);
      app._router.handle(req, res);
    } catch (error) {
      console.error("Registration redirect error:", error);
      return res.status(500).json({
        error: "Registration failed",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Login endpoint with JSON responses
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Internal server error during login" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          console.error("Session creation error:", err);
          return res.status(500).json({ error: "Error creating session" });
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Error during logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // User info endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });
}