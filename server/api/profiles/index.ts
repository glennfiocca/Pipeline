// POST handler for creating/updating profiles
app.post("/api/profiles", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profileData = req.body;
    
    // Ensure userId is set
    profileData.userId = userId;
    
    // Check if profile exists
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId)
    });
    
    let result;
    if (existingProfile) {
      // Update existing profile
      result = await db.update(profiles)
        .set(profileData)
        .where(eq(profiles.userId, userId))
        .returning();
    } else {
      // Create new profile with only the provided fields
      result = await db.insert(profiles)
        .values(profileData)
        .returning();
    }
    
    return res.status(200).json(result[0]);
  } catch (error) {
    console.error("Error saving profile:", error);
    return res.status(500).json({ message: "Failed to save profile", error: error.message });
  }
}); 