import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  category: z.enum(["bug", "feature", "general", "ui", "other"]),
  comment: z.string().min(10, "Please provide more detailed feedback"),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackDialogProps {
  feedbackId?: number;
  readOnly?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export function FeedbackDialog({ feedbackId, readOnly = false, open, onClose }: FeedbackDialogProps) {
  const [isOpen, setIsOpen] = useState(open || false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [hoveredStar, setHoveredStar] = useState(0);

  // Update isOpen when the open prop changes
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  // Fetch feedback data if feedbackId is provided
  const { data: feedbackData } = useQuery({
    queryKey: ["/api/feedback", feedbackId],
    enabled: !!feedbackId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/feedback/${feedbackId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }
      return response.json();
    },
  });

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: feedbackData?.rating || 0,
      category: feedbackData?.category || "general",
      comment: feedbackData?.comment || "",
    },
    values: feedbackData,
  });

  // Update form values when feedbackData changes
  useEffect(() => {
    if (feedbackData) {
      form.reset(feedbackData);
    }
  }, [feedbackData, form]);

  const createFeedbackMutation = useMutation({
    mutationFn: async (values: FeedbackFormData) => {
      const response = await apiRequest(
        "POST",
        "/api/feedback",
        {
          ...values,
          userId: user?.id,
          status: "received"
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit feedback");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank you for your feedback!",
        description: "We appreciate your input.",
      });
      form.reset();
      setIsOpen(false);
      if (onClose) onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FeedbackFormData) => {
    createFeedbackMutation.mutate(values);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open && onClose) onClose();
    }}>
      {!feedbackId && (
        <DialogTrigger asChild>
          <Button
            variant="default"
            className="fixed right-0 top-1/2 -translate-y-1/2 -rotate-90 origin-right translate-x-[-32px] transition-transform hover:translate-x-[-40px] shadow-md flex gap-2 items-center z-50 rounded-t-lg rounded-b-none"
          >
            <MessageSquarePlus className="h-4 w-4 rotate-90" />
            Feedback
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{feedbackId ? "Feedback Details" : "Share your feedback"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className="text-2xl"
                          onMouseEnter={() => !readOnly && setHoveredStar(star)}
                          onMouseLeave={() => !readOnly && setHoveredStar(0)}
                          onClick={() => !readOnly && field.onChange(star)}
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= (hoveredStar || field.value)
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="ui">UI/UX</SelectItem>
                      <SelectItem value="general">General</SelectItem>
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
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us more about your experience..."
                      {...field}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!readOnly && (
              <Button
                type="submit"
                className="w-full"
                disabled={createFeedbackMutation.isPending}
              >
                {createFeedbackMutation.isPending && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground mr-2" />
                )}
                Submit Feedback
              </Button>
            )}
            {readOnly && (
              <Button
                type="button"
                className="w-full"
                onClick={handleClose}
              >
                Close
              </Button>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}