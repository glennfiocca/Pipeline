import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../../storage';

const router = express.Router();

// Ensure uploads directory exists in a persistent location
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads with proper storage configuration
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with user ID and timestamp
    const userId = req.user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${file.fieldname}-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    // Only allow PDFs
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
router.post("/api/profiles", upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'transcript', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Parse the profile data from FormData
    let profileData;
    try {
      profileData = JSON.parse(req.body.profile);
      console.log("Received profile data:", JSON.stringify(profileData));
    } catch (error) {
      console.error("Error parsing profile data:", error);
      return res.status(400).json({ message: "Invalid profile data format" });
    }

    // Clean up old files and set new URLs
    const existingProfile = await storage.getProfileByUserId(userId);

    // Handle resume file
    if ((req.files as any)?.resume?.[0]) {
      // Remove old resume if it exists
      if (existingProfile?.resumeUrl) {
        const oldPath = path.join(uploadsDir, path.basename(existingProfile.resumeUrl));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      profileData.resumeUrl = `/public/uploads/${(req.files as any).resume[0].filename}`;
    } else if (existingProfile?.resumeUrl) {
      // Keep existing resume URL if no new file uploaded
      profileData.resumeUrl = existingProfile.resumeUrl;
    }

    // Handle transcript file
    if ((req.files as any)?.transcript?.[0]) {
      // Remove old transcript if it exists
      if (existingProfile?.transcriptUrl) {
        const oldPath = path.join(uploadsDir, path.basename(existingProfile.transcriptUrl));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      profileData.transcriptUrl = `/public/uploads/${(req.files as any).transcript[0].filename}`;
    } else if (existingProfile?.transcriptUrl) {
      // Keep existing transcript URL if no new file uploaded
      profileData.transcriptUrl = existingProfile.transcriptUrl;
    }

    profileData.userId = userId;

    // Ensure all array fields are properly initialized
    const arrayFields = ['education', 'experience', 'skills', 'certifications', 'languages', 'publications', 'projects'];
    arrayFields.forEach(field => {
      profileData[field] = Array.isArray(profileData[field]) ? profileData[field] : [];
    });

    // Ensure boolean fields are properly set
    profileData.visaSponsorship = profileData.visaSponsorship === true || profileData.visaSponsorship === "true";
    profileData.willingToRelocate = profileData.willingToRelocate === true || profileData.willingToRelocate === "true";

    console.log("Processing profile data:", JSON.stringify(profileData));

    // Check if profile exists and update/create accordingly
    let result;
    try {
      if (existingProfile) {
        console.log(`Updating existing profile with ID ${existingProfile.id}`);
        result = await storage.updateProfile(existingProfile.id, profileData);
      } else {
        console.log("Creating new profile");
        result = await storage.createProfile(profileData);
      }

      console.log("Profile saved successfully:", result);
      return res.status(200).json(result);
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      return res.status(400).json({
        message: "Invalid profile data",
        error: dbError.message,
        details: "Check the console for more information about the error"
      });
    }
  } catch (error: any) {
    console.error("Error saving profile:", error);
    return res.status(500).json({ message: "Failed to save profile", error: error.message });
  }
});

export default router;