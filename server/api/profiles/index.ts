import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../../storage';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
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
      profileData.resumeUrl = `/uploads/${(req.files as any).resume[0].filename}`;
    } else {
      // Keep existing resume URL if no new file uploaded and it's not a blob URL
      if (existingProfile?.resumeUrl && !existingProfile.resumeUrl.startsWith('blob:')) {
        profileData.resumeUrl = existingProfile.resumeUrl;
      } else {
        profileData.resumeUrl = null;
      }
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
      profileData.transcriptUrl = `/uploads/${(req.files as any).transcript[0].filename}`;
    } else {
      // Keep existing transcript URL if no new file uploaded and it's not a blob URL
      if (existingProfile?.transcriptUrl && !existingProfile.transcriptUrl.startsWith('blob:')) {
        profileData.transcriptUrl = existingProfile.transcriptUrl;
      } else {
        profileData.transcriptUrl = null;
      }
    }

    profileData.userId = userId;

    // Sanitize array fields
    const sanitizeArrayField = (field: any[]) => {
      return Array.isArray(field) ? field.map(item => {
        const sanitized: any = {};
        Object.entries(item).forEach(([key, value]) => {
          if (key === 'isPresent') {
            sanitized[key] = value === true || value === "true";
          } else if (value !== undefined && value !== null) {
            sanitized[key] = value;
          } else if (typeof value === 'string') {
            sanitized[key] = "";
          }
        });

        if (sanitized.isPresent === true) {
          sanitized.endDate = "";
        }

        return sanitized;
      }) : [];
    };

    profileData.education = sanitizeArrayField(profileData.education || []);
    profileData.experience = sanitizeArrayField(profileData.experience || []);
    profileData.skills = sanitizeArrayField(profileData.skills || []);
    profileData.certifications = sanitizeArrayField(profileData.certifications || []);
    profileData.languages = sanitizeArrayField(profileData.languages || []);
    profileData.publications = sanitizeArrayField(profileData.publications || []);
    profileData.projects = sanitizeArrayField(profileData.projects || []);

    // Ensure boolean fields are properly set
    profileData.visaSponsorship = profileData.visaSponsorship === true || profileData.visaSponsorship === "true";
    profileData.willingToRelocate = profileData.willingToRelocate === true || profileData.willingToRelocate === "true";

    // Ensure all required string fields have values
    const requiredStringFields = [
      'name', 'email', 'phone', 'title', 'bio', 'location',
      'address', 'city', 'state', 'zipCode', 'country',
      'workAuthorization', 'availability', 'citizenshipStatus'
    ];

    requiredStringFields.forEach(field => {
      profileData[field] = profileData[field] || "";
    });

    console.log("Processing sanitized profile data:", JSON.stringify(profileData));

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

// Add a route to serve uploaded files with proper Content-Type
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  // Set proper headers for PDF files
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=' + filename);
  res.sendFile(filePath);
});

export default router;