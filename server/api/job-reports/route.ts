import { Response, Request } from "express";
import { storage } from "../../storage";
import { z } from "zod";

// Schema for job report request validation
const reportJobSchema = z.object({
  jobId: z.number(),
  reason: z.enum(["ghost_listing", "duplicate", "fraudulent", "inappropriate", "misleading", "other"]),
  comments: z.string().min(5).max(500)
});

export async function POST(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. Please log in to report jobs." });
    }

    // Validate request body
    const validationResult = reportJobSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: "Invalid request data", errors: validationResult.error.format() });
    }

    const { jobId, reason, comments } = validationResult.data;
    const userId = req.user.id;

    // Check if job exists
    const job = await storage.getJob(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Create the report
    const report = await storage.reportJob({
      userId,
      jobId,
      reason,
      comments,
      status: "pending"
    });

    return res.status(201).json(report);
  } catch (error) {
    console.error("Error reporting job:", error);
    return res.status(500).json({ message: "Failed to report job" });
  }
}

export async function GET(req: Request, res: Response) {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!(req.user as any).isAdmin) {
      return res.status(403).json({ message: "Forbidden. Admin access required." });
    }

    // Get reported jobs with job and user details
    const reportedJobs = await storage.getReportedJobsWithDetails();
    return res.json(reportedJobs);
  } catch (error) {
    console.error("Error fetching reported jobs:", error);
    return res.status(500).json({ message: "Failed to fetch reported jobs" });
  }
}

export async function PATCH(req: Request, res: Response) {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!(req.user as any).isAdmin) {
      return res.status(403).json({ message: "Forbidden. Admin access required." });
    }

    const { id, status, adminNotes } = req.body;
    
    if (!id || !status) {
      return res.status(400).json({ message: "Report ID and status are required" });
    }
    
    // Update the report status
    const updatedReport = await storage.updateReportStatus(
      Number(id), 
      status, 
      adminNotes, 
      req.user.id
    );

    return res.json(updatedReport);
  } catch (error) {
    console.error("Error updating reported job:", error);
    return res.status(500).json({ message: "Failed to update report status" });
  }
}

export async function DELETE(req: Request, res: Response) {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!(req.user as any).isAdmin) {
      return res.status(403).json({ message: "Forbidden. Admin access required." });
    }

    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "Report ID is required" });
    }
    
    // Delete the report
    await storage.deleteJobReport(Number(id));

    return res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting reported job:", error);
    return res.status(500).json({ message: "Failed to delete report" });
  }
}