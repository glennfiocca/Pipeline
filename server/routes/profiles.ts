import { Router } from "express";
import { storage } from "../storage";
import { insertProfileSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Get profile by ID
router.get("/:id", async (req, res) => {
  try {
    const profile = await storage.getProfile(Number(req.params.id));
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Create new profile
router.post("/", async (req, res) => {
  try {
    const profileData = insertProfileSchema.parse(req.body);
    const profile = await storage.createProfile(profileData);
    res.status(201).json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid profile data", 
        errors: error.errors 
      });
    }
    console.error("Error creating profile:", error);
    res.status(500).json({ message: "Failed to create profile" });
  }
});

// Update profile
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existingProfile = await storage.getProfile(id);
    
    if (!existingProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const profileData = insertProfileSchema.partial().parse(req.body);
    const updatedProfile = await storage.updateProfile(id, profileData);
    res.json(updatedProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid profile data", 
        errors: error.errors 
      });
    }
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
