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

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const userId = req.user?.id || 'unknown';
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
router.post("/api/profiles", upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'transcript', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Parse and validate profile data
    let profileData;
    try {
      profileData = typeof req.body.profile === 'string' ? JSON.parse(req.body.profile) : req.body.profile;
      console.log("Received profile data:", JSON.stringify(profileData));
    } catch (error) {
      console.error("Error parsing profile data:", error);
      return res.status(400).json({ message: "Invalid profile data format" });
    }

    // Handle file uploads and clean up old files
    const existingProfile = await storage.getProfileByUserId(userId);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Process resume file
    if (files?.resume?.[0]) {
      if (existingProfile?.resumeUrl) {
        const oldPath = path.join(uploadsDir, path.basename(existingProfile.resumeUrl));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      profileData.resumeUrl = `/public/uploads/${files.resume[0].filename}`;
    } else if (existingProfile?.resumeUrl) {
      profileData.resumeUrl = existingProfile.resumeUrl;
    }

    // Process transcript file
    if (files?.transcript?.[0]) {
      if (existingProfile?.transcriptUrl) {
        const oldPath = path.join(uploadsDir, path.basename(existingProfile.transcriptUrl));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      profileData.transcriptUrl = `/public/uploads/${files.transcript[0].filename}`;
    } else if (existingProfile?.transcriptUrl) {
      profileData.transcriptUrl = existingProfile.transcriptUrl;
    }

    // Ensure required fields and proper data types
    profileData.userId = userId;
    profileData.education = Array.isArray(profileData.education) ? profileData.education : [];
    profileData.experience = Array.isArray(profileData.experience) ? profileData.experience : [];
    profileData.skills = Array.isArray(profileData.skills) ? profileData.skills : [];
    profileData.certifications = Array.isArray(profileData.certifications) ? profileData.certifications : [];
    profileData.languages = Array.isArray(profileData.languages) ? profileData.languages : [];
    profileData.publications = Array.isArray(profileData.publications) ? profileData.publications : [];
    profileData.projects = Array.isArray(profileData.projects) ? profileData.projects : [];
    profileData.preferredLocations = Array.isArray(profileData.preferredLocations) ? profileData.preferredLocations : [];
    profileData.referenceList = Array.isArray(profileData.referenceList) ? profileData.referenceList : [];

    // Convert boolean fields
    profileData.visaSponsorship = Boolean(profileData.visaSponsorship);
    profileData.willingToRelocate = Boolean(profileData.willingToRelocate);

    console.log("Processing profile data:", JSON.stringify(profileData));

    // Update or create profile
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