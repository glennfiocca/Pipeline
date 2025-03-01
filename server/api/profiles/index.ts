import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const app = express.Router();

// GET handler for fetching a profile by userId
app.get("/api/profiles/:userId", async (req, res) => {
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
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
});

// POST handler for creating/updating profiles with improved error handling
app.post("/api/profiles", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profileData = req.body;
    console.log("Received profile data:", JSON.stringify(profileData));

    // Ensure userId is set
    profileData.userId = userId;

    // Ensure all array fields are properly initialized and sanitized
    const sanitizeArrayField = (field: any[]) => {
      return Array.isArray(field) ? field.map(item => {
        // Remove any undefined or null values
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

        // If isPresent is true, ensure endDate is empty
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

    // Ensure all required string fields have at least empty string values
    profileData.name = profileData.name || "";
    profileData.email = profileData.email || "";
    profileData.phone = profileData.phone || "";
    profileData.title = profileData.title || "";
    profileData.bio = profileData.bio || "";
    profileData.location = profileData.location || "";
    profileData.address = profileData.address || "";
    profileData.city = profileData.city || "";
    profileData.state = profileData.state || "";
    profileData.zipCode = profileData.zipCode || "";
    profileData.country = profileData.country || "";
    profileData.workAuthorization = profileData.workAuthorization || "US Citizen";
    profileData.availability = profileData.availability || "2 Weeks";
    profileData.citizenshipStatus = profileData.citizenshipStatus || "US Citizen";

    console.log("Processing sanitized profile data:", JSON.stringify(profileData));

    // Check if profile exists
    const existingProfile = await storage.getProfileByUserId(userId);

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
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(400).json({ 
        message: "Invalid profile data", 
        error: dbError.message,
        details: "Check the console for more information about the error"
      });
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    return res.status(500).json({ message: "Failed to save profile", error: error.message });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// Add file upload endpoint
app.post("/api/profiles/upload", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Return the file path that can be stored in the profile
    const filePath = `/uploads/${req.file.filename}`;
    return res.status(200).json({ 
      message: "File uploaded successfully",
      url: filePath
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({ 
      message: "Failed to upload file",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});

export default app;