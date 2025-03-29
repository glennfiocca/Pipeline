import { useQuery, useMutation } from "@tanstack/react-query";
import type { Feedback } from "@shared/schema";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { format } from "date-fns";
import { Star, Archive, ArchiveX, MessageSquarePlus, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

export function FeedbackManagement() {
  const { toast } = useToast();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [internalNote, setInternalNote] = useState("");
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  
  // References for the intersection observers
  const activeObserverRef = useRef<IntersectionObserver | null>(null);
  const archivedObserverRef = useRef<IntersectionObserver | null>(null);
  const activeLoadMoreRef = useRef<HTMLDivElement>(null);
  const archivedLoadMoreRef = useRef<HTMLDivElement>(null);
  
  // State for pagination
  const [activePageSize, setActivePageSize] = useState(10);
  const [archivedPageSize, setArchivedPageSize] = useState(10);
  const [isActiveLoading, setIsActiveLoading] = useState(false);
  const [isArchivedLoading, setIsArchivedLoading] = useState(false);

  const { data: feedbackList = [] } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
  });

  const activeFeedback = feedbackList.filter(f => !f.archived);
  const archivedFeedback = feedbackList.filter(f => f.archived);
  
  // Sort feedback by date (newest first)
  const sortedActiveFeedback = [...activeFeedback].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const sortedArchivedFeedback = [...archivedFeedback].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Paginated feedback
  const paginatedActiveFeedback = sortedActiveFeedback.slice(0, activePageSize);
  const paginatedArchivedFeedback = sortedArchivedFeedback.slice(0, archivedPageSize);
  
  // Has more items
  const hasMoreActive = paginatedActiveFeedback.length < sortedActiveFeedback.length;
  const hasMoreArchived = paginatedArchivedFeedback.length < sortedArchivedFeedback.length;

  // Set up intersection observers for infinite scroll
  useEffect(() => {
    // Active feedback observer
    if (activeObserverRef.current) {
      activeObserverRef.current.disconnect();
    }
    
    activeObserverRef.current = new IntersectionObserver(entries => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMoreActive && !isActiveLoading) {
        loadMoreActive();
      }
    }, { threshold: 0.5 });
    
    if (activeLoadMoreRef.current) {
      activeObserverRef.current.observe(activeLoadMoreRef.current);
    }
    
    // Archived feedback observer
    if (archivedObserverRef.current) {
      archivedObserverRef.current.disconnect();
    }
    
    archivedObserverRef.current = new IntersectionObserver(entries => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMoreArchived && !isArchivedLoading) {
        loadMoreArchived();
      }
    }, { threshold: 0.5 });
    
    if (archivedLoadMoreRef.current) {
      archivedObserverRef.current.observe(archivedLoadMoreRef.current);
    }
    
    return () => {
      if (activeObserverRef.current) {
        activeObserverRef.current.disconnect();
      }
      if (archivedObserverRef.current) {
        archivedObserverRef.current.disconnect();
      }
    };
  }, [
    activePageSize, 
    archivedPageSize, 
    hasMoreActive, 
    hasMoreArchived, 
    isActiveLoading, 
    isArchivedLoading, 
    sortedActiveFeedback.length, 
    sortedArchivedFeedback.length
  ]);
  
  // Functions to load more feedback
  const loadMoreActive = () => {
    setIsActiveLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      setActivePageSize(prev => prev + 10);
      setIsActiveLoading(false);
    }, 500);
  };
  
  const loadMoreArchived = () => {
    setIsArchivedLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      setArchivedPageSize(prev => prev + 10);
      setIsArchivedLoading(false);
    }, 500);
  };

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

  // Render feedback card function for reuse
  const renderFeedbackCard = (feedback: Feedback, isArchived: boolean = false) => (
    <Card key={feedback.id} className={`p-4 ${isArchived ? 'bg-muted/50' : ''}`}>
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
              {isArchived ? <ArchiveX className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
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
            <div className={`mt-2 p-2 ${isArchived ? 'bg-background' : 'bg-muted'} rounded-md`}>
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
  );

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="active" 
        className="w-full"
        onValueChange={(value) => setActiveTab(value as "active" | "archived")}
      >
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="active">Active Feedback ({activeFeedback.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived Feedback ({archivedFeedback.length})</TabsTrigger>
        </TabsList>
      
        <TabsContent value="active">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Active Feedback
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({sortedActiveFeedback.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paginatedActiveFeedback.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No active feedback submissions.
                    </div>
                  ) : (
                    <>
                      {paginatedActiveFeedback.map((feedback) => renderFeedbackCard(feedback))}
                      
                      {hasMoreActive && (
                        <div 
                          ref={activeLoadMoreRef} 
                          className="py-4 flex justify-center"
                        >
                          {isActiveLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">Loading more feedback...</span>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              onClick={loadMoreActive}
                              className="text-sm"
                            >
                              Load more
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="archived">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Archived Feedback
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({sortedArchivedFeedback.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paginatedArchivedFeedback.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No archived feedback.
                    </div>
                  ) : (
                    <>
                      {paginatedArchivedFeedback.map((feedback) => renderFeedbackCard(feedback, true))}
                      
                      {hasMoreArchived && (
                        <div 
                          ref={archivedLoadMoreRef} 
                          className="py-4 flex justify-center"
                        >
                          {isArchivedLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">Loading more feedback...</span>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              onClick={loadMoreArchived}
                              className="text-sm"
                            >
                              Load more
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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