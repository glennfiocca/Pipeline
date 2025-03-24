import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flag } from "lucide-react";

interface JobReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportType: string, comment: string) => void;
  jobTitle: string;
  jobId: number;
}

const reportSchema = z.object({
  reportType: z.enum(["ghost_listing", "duplicate", "misleading", "inappropriate", "other"]),
  comment: z.string().min(10, "Please provide more details about your report").max(500, "Comment is too long"),
});

type ReportFormData = z.infer<typeof reportSchema>;

export function JobReportDialog({
  isOpen,
  onClose,
  onSubmit,
  jobTitle,
}: JobReportDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: "ghost_listing",
      comment: "",
    },
  });

  const handleSubmit = (values: ReportFormData) => {
    setIsSubmitting(true);
    try {
      onSubmit(values.reportType, values.comment);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" /> Report Job Listing
          </DialogTitle>
          <DialogDescription>
            Help us maintain quality by reporting issues with this job listing.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm font-medium mb-4">
            Job: <span className="font-semibold">{jobTitle}</span>
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Reason</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ghost_listing">Ghost Listing (No longer active)</SelectItem>
                        <SelectItem value="duplicate">Duplicate Listing</SelectItem>
                        <SelectItem value="misleading">Misleading Information</SelectItem>
                        <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide more details about the issue..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 