import { z } from "zod";

// Schema for job report
export const reportJobSchema = z.object({
  jobId: z.number(),
  reason: z.enum([
    "ghost_listing",
    "duplicate",
    "fraudulent",
    "inappropriate",
    "misleading",
    "other"
  ], {
    required_error: "Please select a reason for reporting this job"
  }),
  comments: z.string().min(5, "Please provide at least 5 characters of detail").max(500, "Comments must be less than 500 characters")
});

export type ReportJobSchema = z.infer<typeof reportJobSchema>;