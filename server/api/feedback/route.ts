export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rating, subject, category, comment } = body;
    
    // Validate the feedback data
    const result = insertFeedbackSchema.safeParse({
      rating,
      subject,
      category,
      comment,
      status: "received"
    });
    
    if (!result.success) {
      return Response.json({ error: result.error.errors }, { status: 400 });
    }
    
    // Insert the feedback into the database
    const feedback = await db.insert(feedbackTable).values({
      rating,
      subject,
      category,
      comment,
      status: "received",
      userId: req.user?.id || null
    }).returning();
    
    return Response.json(feedback[0]);
  } catch (error) {
    console.error("Error creating feedback:", error);
    return Response.json({ error: "Failed to create feedback" }, { status: 500 });
  }
} 