import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

interface ReportJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
  jobTitle: string;
}

export function ReportJobDialog({ isOpen, onClose, jobId, jobTitle }: ReportJobDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof reportJobSchema>>({
    resolver: zodResolver(reportJobSchema),
    defaultValues: {
      jobId,
      reason: undefined,
      comments: ""
    }
  });

  const reportJobMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof reportJobSchema>) => {
      return await apiRequest("POST", "/api/job-reports", formData);
    },
    onSuccess: () => {
      toast({
        title: "Job Reported",
        description: "Thank you for your report. Our team will review it shortly.",
        variant: "default"
      });
      form.reset({
        jobId,
        reason: undefined,
        comments: ""
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to report job: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: z.infer<typeof reportJobSchema>) => {
    reportJobMutation.mutate(data);
  };

  // Get readable labels for each reason value
  const getReasonLabel = (reason: string): string => {
    const labels: Record<string, string> = {
      "ghost_listing": "Ghost Listing (Job doesn't exist)",
      "duplicate": "Duplicate Listing",
      "fraudulent": "Fraudulent Job Posting",
      "inappropriate": "Inappropriate Content",
      "misleading": "Misleading Information",
      "other": "Other"
    };
    return labels[reason] || reason;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Report Job Listing</DialogTitle>
          <DialogDescription>
            Report issues with the job listing "{jobTitle}" to help us maintain quality listings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for reporting</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reportJobSchema.shape.reason.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {getReasonLabel(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Please select the most appropriate reason
                  </FormDescription>
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
                      placeholder="Please provide additional details about this issue..."
                      className="resize-none min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please provide specific details to help us understand the issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={reportJobMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {reportJobMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}