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
import { apiRequest } from "@/lib/queryClient";
import { Star, MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  category: z.enum(["bug", "feature", "general", "ui", "other"]),
  comment: z.string().min(10, "Please provide more detailed feedback"),
});

interface FeedbackDialogProps {
  feedbackId?: number;
  isReadOnly?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function FeedbackDialog({ feedbackId, isReadOnly = false, isOpen: propIsOpen, onClose }: FeedbackDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [hoveredStar, setHoveredStar] = useState(0);

  const { data: feedback } = useQuery({
    queryKey: [`/api/feedback/${feedbackId}`],
    enabled: !!feedbackId,
  });

  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      category: "general",
      comment: "",
    },
  });

  useEffect(() => {
    if (feedback) {
      form.reset({
        rating: feedback.rating || 0,
        category: feedback.category || "general",
        comment: feedback.comment || "",
      });
    }
  }, [feedback, form]);

  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
    }
  }, [propIsOpen]);

  const createFeedbackMutation = useMutation({
    mutationFn: async (values: z.infer<typeof feedbackSchema>) => {
      const response = await apiRequest(
        "POST",
        "/api/feedback",
        {
          ...values,
          userId: user?.id,
          status: "pending",
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
        description: "We appreciate your input and will review it shortly.",
      });
      form.reset();
      setIsOpen(false);
      onClose?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof feedbackSchema>) => {
    if (isReadOnly) return;
    createFeedbackMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) onClose?.();
    }}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="fixed right-0 top-1/2 -translate-y-1/2 -rotate-90 origin-right translate-x-[-32px] transition-transform hover:translate-x-[-40px] shadow-md flex gap-2 items-center z-50 rounded-t-lg rounded-b-none"
        >
          <MessageSquarePlus className="h-4 w-4 rotate-90" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly ? "Feedback Details" : "Share your feedback"}
          </DialogTitle>
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
                          onMouseEnter={() => !isReadOnly && setHoveredStar(star)}
                          onMouseLeave={() => !isReadOnly && setHoveredStar(0)}
                          onClick={() => !isReadOnly && field.onChange(star)}
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
                    disabled={isReadOnly}
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
                      disabled={isReadOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isReadOnly && (
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}