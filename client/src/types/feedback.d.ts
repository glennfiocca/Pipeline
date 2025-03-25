// Define the feedback metadata type to fix TypeScript errors
import { Feedback } from "@shared/schema";

declare module "@shared/schema" {
  interface FeedbackMetadata {
    jobId?: string | number; // Allow both string and number for flexibility
    reportType?: string;
    jobIdentifier?: string;
    jobTitle?: string;
    companyName?: string;
    reportTimestamp?: string;
    [key: string]: any; // Allow for additional properties
  }

  interface EnhancedFeedback extends Feedback {
    metadata: FeedbackMetadata;
  }
} 