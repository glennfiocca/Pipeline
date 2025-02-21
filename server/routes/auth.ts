import { Router } from "express";
import { db } from "../db";
import { users, insertUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateReferralCode } from "../utils/referral";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const data = insertUserSchema.parse(req.body);
    
    // Check for referral code in the query
    const referralCode = req.query.ref as string;
    let referringUser = null;
    
    if (referralCode) {
      referringUser = await db.query.users.findFirst({
        where: eq(users.referralCode, referralCode)
      });
      
      if (referringUser) {
        // Store referral info in session
        req.session.referralCode = referralCode;
      }
    }
    
    // Create new user
    const newUser = await db.insert(users).values({
      ...data,
      referralCode: generateReferralCode(),
      bankedCredits: referralCode && referringUser ? 5 : 0,
      referredBy: referringUser?.id.toString()
    }).returning();

    // Award credits to referring user if exists
    if (referringUser) {
      await db.update(users)
        .set({ bankedCredits: referringUser.bankedCredits + 5 })
        .where(eq(users.id, referringUser.id));
    }

    // Clear referral code from session
    delete req.session.referralCode;
    
    res.json(newUser[0]);
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({ error: "Failed to create user" });
  }
});

export default router;
