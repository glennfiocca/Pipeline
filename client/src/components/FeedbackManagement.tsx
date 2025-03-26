import { useQuery, useMutation } from "@tanstack/react-query";
import type { Feedback } from "@shared/schema";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { format } from "date-fns";
import { Star, Archive, ArchiveX, MessageSquarePlus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

export function FeedbackManagement() {
  const { toast } = useToast();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [internalNote, setInternalNote] = useState("");
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);

  const { data: feedbackList = [] } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Feedback> }) => {
      const response = await apiRequest("PATCH", `/api/admin/feedback/${id}`, updates);
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
      setShowNoteDialog(false);
      setSelectedFeedback(null);
      setInternalNote("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`Attempting to delete feedback with ID: ${id}`);
      const response = await apiRequest("DELETE", `/api/admin/feedback/${id}`);
      
      if (!response.ok) {
        console.error(`Delete request failed with status: ${response.status}`);
        throw new Error(`Failed to delete feedback: ${response.status}`);
      }
      
      console.log("Delete request successful");
      return { success: true, message: "Feedback deleted successfully" };
    },
    onSuccess: () => {
      console.log("Delete mutation succeeded, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      queryClient.refetchQueries({ queryKey: ["/api/feedback"] });
      
      toast({
        title: "Success",
        description: "Feedback deleted successfully",
      });
      setFeedbackToDelete(null);
    },
    onError: (error: Error) => {
      console.error("Delete feedback error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete feedback",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "received":
        return "bg-blue-500/10 text-blue-500";
      case "resolved":
        return "bg-green-500/10 text-green-500";
      case "rejected":
        return "bg-red-500/10 text-red-500";
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const handleAddNote = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setInternalNote(feedback.internalNotes || "");
    setShowNoteDialog(true);
  };

  const handleSaveNote = () => {
    if (!selectedFeedback) return;
    updateFeedbackMutation.mutate({
      id: selectedFeedback.id,
      updates: { internalNotes: internalNote }
    });
  };

  const handleToggleArchive = (feedback: Feedback) => {
    updateFeedbackMutation.mutate({
      id: feedback.id,
      updates: { archived: !feedback.archived }
    });
  };

  const handleDelete = (feedback: Feedback) => {
    setFeedbackToDelete(feedback);
  };

  const confirmDelete = () => {
    if (feedbackToDelete) {
      deleteFeedbackMutation.mutate(feedbackToDelete.id);
    }
  };

  const activeFeedback = feedbackList.filter(f => !f.archived);
  const archivedFeedback = feedbackList.filter(f => f.archived);
  
  // Split active feedback into new and commented
  const newFeedback = activeFeedback.filter(f => !f.internalNotes || f.internalNotes.trim() === '');
  const commentedFeedback = activeFeedback.filter(f => f.internalNotes && f.internalNotes.trim() !== '');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            New Feedback
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({newFeedback.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {newFeedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No new feedback submissions.
                </div>
              ) : (
                newFeedback.map((feedback) => (
                  <Card key={feedback.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= feedback.rating
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="outline" className={getStatusColor(feedback.status)}>
                            {feedback.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleAddNote(feedback)}
                          >
                            <MessageSquarePlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleArchive(feedback)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(feedback)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {feedback.category}
                        </Badge>
                        <h3 className="text-base font-semibold mb-1">{feedback.subject || "No Subject"}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{feedback.comment}</p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {format(new Date(feedback.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Commented Feedback
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({commentedFeedback.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {commentedFeedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No commented feedback submissions.
                </div>
              ) : (
                commentedFeedback.map((feedback) => (
                  <Card key={feedback.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= feedback.rating
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="outline" className={getStatusColor(feedback.status)}>
                            {feedback.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleAddNote(feedback)}
                          >
                            <MessageSquarePlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleArchive(feedback)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(feedback)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {feedback.category}
                        </Badge>
                        <h3 className="text-base font-semibold mb-1">{feedback.subject || "No Subject"}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{feedback.comment}</p>
                        {feedback.internalNotes && (
                          <div className="mt-2 p-2 bg-muted rounded-md">
                            <p className="text-xs font-medium">Internal Notes:</p>
                            <p className="text-sm text-muted-foreground">{feedback.internalNotes}</p>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {format(new Date(feedback.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Archived Feedback
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({archivedFeedback.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {archivedFeedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No archived feedback.
                </div>
              ) : (
                archivedFeedback.map((feedback) => (
                  <Card key={feedback.id} className="p-4 bg-muted/50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= feedback.rating
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="outline" className={getStatusColor(feedback.status)}>
                            {feedback.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleArchive(feedback)}
                          >
                            <ArchiveX className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(feedback)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {feedback.category}
                        </Badge>
                        <h3 className="text-base font-semibold mb-1">{feedback.subject}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{feedback.comment}</p>
                        {feedback.internalNotes && (
                          <div className="mt-2 p-2 bg-background rounded-md">
                            <p className="text-xs font-medium">Internal Notes:</p>
                            <p className="text-sm text-muted-foreground">{feedback.internalNotes}</p>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {format(new Date(feedback.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Internal Notes</DialogTitle>
            <DialogDescription>
              Add internal notes to this feedback submission.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Add internal notes here..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog 
        open={!!feedbackToDelete} 
        onOpenChange={(open) => {
          if (!open) setFeedbackToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feedback? This action is irreversible and all data associated with this feedback will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {feedbackToDelete && (
            <div className="mt-4 p-3 border rounded-md bg-muted">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= (feedbackToDelete?.rating || 0)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <Badge variant="outline" className="mb-2">
                {feedbackToDelete.category}
              </Badge>
              <h4 className="text-sm font-medium mb-1">{feedbackToDelete.subject}</h4>
              <p className="text-sm text-muted-foreground">{feedbackToDelete.comment}</p>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}