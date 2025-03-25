import { useQuery, useMutation } from "@tanstack/react-query";
import type { Feedback as FeedbackType, Job, EnhancedFeedback } from "@shared/schema";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { format } from "date-fns";
import { Star, Archive, ArchiveX, MessageSquarePlus, Trash2, Flag, Briefcase, Eye, XCircleIcon } from "lucide-react";
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
import { JobModal } from "@/components/JobModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

// Use the EnhancedFeedback type from our declarations
type Feedback = EnhancedFeedback;

export function FeedbackManagement() {
  const { toast } = useToast();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [internalNote, setInternalNote] = useState("");
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [jobDetailLoading, setJobDetailLoading] = useState<number | null>(null);

  const { data: feedbackList = [] } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: true
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

  const deactivateJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await apiRequest("PATCH", `/api/admin/jobs/${jobId}/deactivate`, {});
      if (!response.ok) {
        throw new Error(`Failed to deactivate job: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job has been deactivated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate job",
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

  const getCategoryIcon = (category: string) => {
    if (category.startsWith('job_report_')) {
      return <Flag className="h-4 w-4 text-red-500" />;
    }
    // Default icon for regular feedback
    return null;
  };

  const formatCategoryLabel = (category: string): string => {
    if (category === 'job_report_ghost') return 'Ghost Listing';
    if (category === 'job_report_duplicate') return 'Duplicate Listing';
    if (category === 'job_report_misleading') return 'Misleading Info';
    if (category === 'job_report_inappropriate') return 'Inappropriate';
    if (category === 'job_report_other') return 'Job Issue - Other';
    return category.charAt(0).toUpperCase() + category.slice(1); // Capitalize regular categories
  };

  const getCategoryStyle = (category: string): string => {
    if (category.startsWith('job_report_')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
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

  const getJobById = (jobId?: number) => {
    if (!jobId) return null;
    return jobs.find(job => job.id === jobId) || null;
  };

  const handleViewJob = (jobId?: number) => {
    if (!jobId) return;

    setJobDetailLoading(jobId);
    const job = getJobById(jobId);
    
    if (job) {
      setSelectedJob(job);
      setShowJobDetailsModal(true);
      setJobDetailLoading(null);
    } else {
      toast({
        title: "Job Not Found",
        description: "The job details could not be found",
        variant: "destructive"
      });
      setJobDetailLoading(null);
    }
  };

  const handleDeactivateJob = (jobId?: number) => {
    if (!jobId) return;
    
    const job = getJobById(jobId);
    if (!job) {
      toast({
        title: "Job Not Found",
        description: "The job details could not be found",
        variant: "destructive"
      });
      return;
    }
    
    if (!job.isActive) {
      toast({
        title: "Job Already Inactive",
        description: "This job is already marked as inactive",
      });
      return;
    }
    
    deactivateJobMutation.mutate(jobId);
  };

  const activeFeedback = feedbackList.filter(f => !f.archived);
  const archivedFeedback = feedbackList.filter(f => f.archived);
  
  // Split active feedback into job reports and regular feedback
  const jobReports = activeFeedback.filter(f => f.category.startsWith('job_report_'));
  const regularActiveFeedback = activeFeedback.filter(f => !f.category.startsWith('job_report_'));
  
  // Split regular active feedback into new and commented
  const newFeedback = regularActiveFeedback.filter(f => !f.internalNotes || f.internalNotes.trim() === '');
  const commentedFeedback = regularActiveFeedback.filter(f => f.internalNotes && f.internalNotes.trim() !== '');

  // Group job reports by job ID for better organization
  const reportsByJob = jobReports.reduce((grouped, report) => {
    const jobId = report.metadata?.jobId;
    if (jobId) {
      if (!grouped[jobId]) {
        grouped[jobId] = [];
      }
      grouped[jobId].push(report);
    } else {
      // Reports without jobId
      if (!grouped["unknown"]) {
        grouped["unknown"] = [];
      }
      grouped["unknown"].push(report);
    }
    return grouped;
  }, {} as Record<string, Feedback[]>);

  const formatReportTypeForDisplay = (reportType: string) => {
    // First check for category-based report types
    if (reportType === 'job_report_ghost' || reportType === 'ghost_listing') return 'Ghost Listing';
    if (reportType === 'job_report_duplicate' || reportType === 'duplicate') return 'Duplicate Listing';
    if (reportType === 'job_report_misleading' || reportType === 'misleading') return 'Misleading Information';
    if (reportType === 'job_report_inappropriate' || reportType === 'inappropriate') return 'Inappropriate Content';
    if (reportType === 'job_report_other' || reportType === 'other') return 'Other Issue';
    
    // For numeric or unknown types, provide a fallback
    if (!reportType || reportType === '') return 'Unknown Issue';
    if (!isNaN(Number(reportType))) return `Report #${reportType}`;
    
    // Default formatting for any other values
    return reportType.charAt(0).toUpperCase() + reportType.slice(1).replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Job Reports Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Flag className="mr-2 h-5 w-5 text-red-500" />
            Job Reports
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({jobReports.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {jobReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No job reports.
                </div>
              ) : (
                Object.entries(reportsByJob).map(([jobIdStr, reports]) => {
                  const jobId = jobIdStr !== "unknown" ? parseInt(jobIdStr) : undefined;
                  const job = jobId ? getJobById(jobId) : null;
                  
                  return (
                    <div key={jobIdStr} className="space-y-2">
                      {job && (
                        <div className="p-3 bg-muted rounded-md mb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-base font-semibold">
                                {job.title}
                                <span className="ml-2 text-xs font-mono text-muted-foreground">
                                  {job.jobIdentifier}
                                </span>
                              </h3>
                              <p className="text-sm text-muted-foreground mb-1">
                                {job.company} • {job.location}
                              </p>
                              <div className="flex gap-2 items-center mt-1">
                                <Badge variant={job.isActive ? "default" : "secondary"}>
                                  {job.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline">
                                  {job.type}
                                </Badge>
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                                  {reports.length} {reports.length === 1 ? "Report" : "Reports"}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewJob(jobId)}
                                      disabled={jobDetailLoading === jobId}
                                    >
                                      {jobDetailLoading === jobId ? (
                                        <span className="flex items-center">
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          Loading...
                                        </span>
                                      ) : (
                                        <span className="flex items-center">
                                          <Eye className="h-3 w-3 mr-1" />
                                          View Job
                                        </span>
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    View full job details
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {job.isActive && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeactivateJob(jobId)}
                                        disabled={deactivateJobMutation.isPending}
                                      >
                                        <span className="flex items-center">
                                          <XCircleIcon className="h-3 w-3 mr-1" />
                                          Deactivate
                                        </span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Mark this job as inactive
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3 pl-3 border-l-2 border-red-200">
                        {reports.map((feedback) => (
                          <Card key={feedback.id} className="p-4 border border-red-100">
                            <div className="space-y-3">
                              {/* Header with actions */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className="bg-red-50 text-red-800 border-red-200 px-2 py-1"
                                  >
                                    {formatReportTypeForDisplay(feedback.metadata?.reportType || '')}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Report #{feedback.id} • {format(new Date(feedback.metadata?.reportTimestamp || feedback.createdAt), "MMM d, yyyy")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleAddNote(feedback)}
                                    title="Add internal note"
                                  >
                                    <MessageSquarePlus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleToggleArchive(feedback)}
                                    title="Archive report"
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                    onClick={() => handleDelete(feedback)}
                                    title="Delete report"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* User comment - displayed prominently */}
                              {(feedback.comment || feedback.metadata?.comment) && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                  <p className="text-sm font-medium text-amber-800 mb-1">Additional Details:</p>
                                  <p className="text-sm whitespace-pre-wrap">{feedback.comment || feedback.metadata?.comment}</p>
                                </div>
                              )}
                              
                              {/* Job details section */}
                              <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                  <div className="col-span-2">
                                    <span className="font-medium">Job Title:</span>{" "}
                                    {feedback.metadata?.jobTitle || "Unknown Job"}
                                  </div>
                                  
                                  <div className="col-span-2">
                                    <span className="font-medium">Company:</span>{" "}
                                    {feedback.metadata?.companyName || "Unknown Company"}
                                  </div>
                                  
                                  <div>
                                    <span className="font-medium">Job ID:</span>{" "}
                                    {feedback.metadata?.jobIdentifier || `Job #${feedback.metadata?.jobId || "Unknown"}`}
                                  </div>
                                  
                                  <div>
                                    <span className="font-medium">Reported By:</span>{" "}
                                    User #{feedback.userId}
                                  </div>
                                  
                                  <div>
                                    <span className="font-medium">Date Reported:</span>{" "}
                                    {format(new Date(feedback.metadata?.reportTimestamp || feedback.createdAt), "MMM d, yyyy")}
                                  </div>
                                  
                                  <div>
                                    <span className="font-medium">Status:</span>{" "}
                                    <Badge variant="outline" className={getStatusColor(feedback.status)}>
                                      {feedback.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Internal notes section if any */}
                              {feedback.internalNotes && (
                                <div className="p-3 bg-muted rounded-md">
                                  <p className="text-xs font-medium mb-1">Internal Notes:</p>
                                  <p className="text-sm">{feedback.internalNotes}</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* New Feedback Card */}
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
                        <Badge variant="outline" className={`mb-2 ${getCategoryStyle(feedback.category)}`}>
                          {getCategoryIcon(feedback.category)}
                          {formatCategoryLabel(feedback.category)}
                        </Badge>
                        <h3 className="text-base font-semibold mb-1">{feedback.subject || "No Subject"}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{feedback.comment || feedback.metadata?.comment}</p>
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
                        <p className="text-sm text-muted-foreground mb-2">{feedback.comment || feedback.metadata?.comment}</p>
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
                        <h3 className="text-base font-semibold mb-1">
                          Job Report: {formatReportTypeForDisplay(feedback.metadata?.reportType || '')}
                        </h3>
                        
                        {/* User comment - displayed prominently */}
                        {(feedback.comment || feedback.metadata?.comment) && (
                          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <p className="text-sm font-medium text-amber-800 mb-1">User Feedback:</p>
                            <p className="text-sm">{feedback.comment || feedback.metadata?.comment}</p>
                          </div>
                        )}
                        
                        {/* Report metadata with enhanced details */}
                        <div className="space-y-3">
                          {/* Report header with type prominently displayed */}
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="bg-red-50 text-red-800 border-red-200 px-2 py-1 text-xs"
                            >
                              {formatReportTypeForDisplay(feedback.metadata?.reportType || '')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Report #{feedback.id} • {format(new Date(feedback.metadata?.reportTimestamp || feedback.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          
                          {/* User additional details section - highlighted */}
                          {(feedback.comment || feedback.metadata?.comment) && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                              <p className="text-sm font-medium text-amber-800 mb-1">Additional Details:</p>
                              <p className="text-sm whitespace-pre-wrap">{feedback.comment || feedback.metadata?.comment}</p>
                            </div>
                          )}
                          
                          {/* Job details section */}
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-md space-y-2">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              <div className="col-span-2">
                                <span className="font-medium">Job Title:</span>{" "}
                                {feedback.metadata?.jobTitle || "Unknown Job"}
                              </div>
                              
                              <div className="col-span-2">
                                <span className="font-medium">Company:</span>{" "}
                                {feedback.metadata?.companyName || "Unknown Company"}
                              </div>
                              
                              <div>
                                <span className="font-medium">Job ID:</span>{" "}
                                {feedback.metadata?.jobIdentifier || `Job #${feedback.metadata?.jobId || "Unknown"}`}
                              </div>
                              
                              <div>
                                <span className="font-medium">Reported By:</span>{" "}
                                User #{feedback.userId}
                              </div>
                            </div>
                          </div>
                          
                          {/* Internal notes section if any */}
                          {feedback.internalNotes && (
                            <div className="p-3 bg-muted rounded-md">
                              <p className="text-xs font-medium mb-1">Internal Notes:</p>
                              <p className="text-sm">{feedback.internalNotes}</p>
                            </div>
                          )}
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
              <p className="text-sm text-muted-foreground">{feedbackToDelete.comment || feedbackToDelete.metadata?.comment}</p>
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

      {/* Job Modal for viewing job details */}
      {selectedJob && (
        <JobModal
          isOpen={showJobDetailsModal}
          onClose={() => setShowJobDetailsModal(false)}
          job={selectedJob}
        />
      )}
    </div>
  );
}