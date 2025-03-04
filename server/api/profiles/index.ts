import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../../storage';
import { insertProfileSchema } from '../../validation/profile';

const router = express.Router();

// Ensure uploads directory exists in a persistent location
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const userId = (req.user as any)?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${file.fieldname}-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET handler for fetching a profile by userId
router.get("/api/profiles/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const profile = await storage.getProfileByUserId(userId);
    console.log("Retrieved profile for userId:", userId, profile);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.status(200).json(profile);
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
});

// POST handler for creating/updating profiles with file upload support
router.post("/", async (req: any, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    console.log("Received profile data:", req.body);

    // Validate incoming data with insertProfileSchema
    const safeParse = insertProfileSchema.safeParse({
      ...req.body,
      userId: req.user.id // Force userId from session
    });

    // Handle invalid data
    if (!safeParse.success) {
      console.error("Validation error:", safeParse.error.format());
      return res.status(400).json({
        error: "Invalid profile data",
        details: safeParse.error.format()
      });
    }

    // Use the validated data for DB operations
    const profileData = safeParse.data;

    // Check if profile already exists
    let existingProfile = await storage.getProfileByUserId(req.user.id);
    let profile;

    try {
      if (existingProfile) {
        // Update existing profile
        profile = await storage.updateProfile(existingProfile.id, profileData);
        console.log("Updated profile:", profile);
      } else {
        // Create new profile
        profile = await storage.createProfile(profileData);
        console.log("Created new profile:", profile);
      }

      if (!profile) {
        throw new Error("Failed to save profile");
      }

      // Fetch the complete profile to return
      const savedProfile = await storage.getProfileByUserId(req.user.id);
      if (!savedProfile) {
        throw new Error("Failed to fetch saved profile");
      }

      res.json(savedProfile);
    } catch (error) {
      console.error("Database operation failed:", error);
      throw error; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    res.status(500).json({
      error: "Failed to save profile",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;