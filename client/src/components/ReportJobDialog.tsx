import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface ReportJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
  jobTitle: string;
}

// Schema for the report form
const reportJobSchema = z.object({
  reason: z.enum(["ghost_listing", "duplicate", "fraudulent", "inappropriate", "misleading", "other"], {
    required_error: "Please select a reason for reporting this job"
  }),
  comments: z.string().min(5, "Please provide additional details").max(500, "Comments must be less than 500 characters")
});

type ReportJobFormData = z.infer<typeof reportJobSchema>;

export function ReportJobDialog({ isOpen, onClose, jobId, jobTitle }: ReportJobDialogProps) {
  const { toast } = useToast();
  
  // Define form
  const form = useForm<ReportJobFormData>({
    resolver: zodResolver(reportJobSchema),
    defaultValues: {
      reason: undefined,
      comments: ""
    }
  });

  // Define mutation for reporting job
  const reportJobMutation = useMutation({
    mutationFn: async (formData: ReportJobFormData) => {
      const res = await apiRequest(
        "POST",
        "/api/reported-jobs",
        {
          jobId,
          reason: formData.reason,
          comments: formData.comments
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to report job");
      }

      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Job reported",
        description: "Thank you for reporting this job. Our team will review it shortly."
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to report job",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ReportJobFormData) => {
    reportJobMutation.mutate(data);
  };

  // Helper function to get reason label
  const getReasonLabel = (reason: string): string => {
    const reasonMap: Record<string, string> = {
      ghost_listing: "Ghost Listing (No Longer Available)",
      duplicate: "Duplicate Posting",
      fraudulent: "Fraudulent Job",
      inappropriate: "Inappropriate Content",
      misleading: "Misleading Information",
      other: "Other Issue"
    };
    return reasonMap[reason] || reason;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Report Job
          </DialogTitle>
          <DialogDescription>
            Report this job listing if you believe it's inappropriate, fraudulent, or contains errors.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for reporting</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ghost_listing">Ghost Listing (No Longer Available)</SelectItem>
                      <SelectItem value="duplicate">Duplicate Posting</SelectItem>
                      <SelectItem value="fraudulent">Fraudulent Job</SelectItem>
                      <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                      <SelectItem value="misleading">Misleading Information</SelectItem>
                      <SelectItem value="other">Other Issue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide more information about the issue..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={reportJobMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={reportJobMutation.isPending}
              >
                {reportJobMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}