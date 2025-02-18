import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import type { Feedback } from "@shared/schema";

export function FeedbackManagement() {
  const { toast } = useToast();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);

  const responseForm = useForm({
    defaultValues: {
      adminResponse: "",
      status: "resolved"
    }
  });

  const { data: feedbackList = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, status, adminResponse }: { id: number; status: string; adminResponse: string }) => {
      const response = await apiRequest("PATCH", `/api/feedback/${id}`, { status, adminResponse });
      if (!response.ok) {
        throw new Error("Failed to update feedback");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      toast({
        title: "Success",
        description: "Feedback updated successfully",
      });
      setShowResponseDialog(false);
      setSelectedFeedback(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRespond = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    responseForm.reset({
      adminResponse: feedback.adminResponse || "",
      status: feedback.status || "pending"
    });
    setShowResponseDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Management</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {feedbackList.map((feedback) => (
              <div
                key={feedback.id}
                className="p-4 rounded-lg border space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">
                      Feedback #{feedback.id}
                      <Badge 
                        variant={feedback.status === "resolved" ? "secondary" : "default"}
                        className="ml-2"
                      >
                        {feedback.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Submitted on {format(new Date(feedback.createdAt), "PPP")}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2 space-y-2">
                  <p className="text-sm">{feedback.message}</p>
                  {feedback.adminResponse && (
                    <div className="mt-2 p-2 bg-muted rounded-md">
                      <p className="text-sm font-medium">Admin Response:</p>
                      <p className="text-sm">{feedback.adminResponse}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleRespond(feedback)}
                  >
                    Respond
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Respond to Feedback</DialogTitle>
              <DialogDescription>
                Provide a response to the user's feedback.
              </DialogDescription>
            </DialogHeader>

            <Form {...responseForm}>
              <form
                onSubmit={responseForm.handleSubmit((data) => {
                  if (selectedFeedback) {
                    updateFeedbackMutation.mutate({
                      id: selectedFeedback.id,
                      ...data
                    });
                  }
                })}
                className="space-y-4"
              >
                <FormField
                  control={responseForm.control}
                  name="adminResponse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowResponseDialog(false);
                      setSelectedFeedback(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Submit Response
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
