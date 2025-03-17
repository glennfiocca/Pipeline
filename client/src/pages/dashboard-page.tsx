import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Loader2, AlertCircle, ChevronRight, 
  CalendarIcon, MapPinIcon, NotebookIcon, ArrowRightIcon, BriefcaseIcon, XCircleIcon,
  MessageSquare, Sparkles, Search, MousePointerClick, LayoutDashboard,
  CheckCircle2, Circle, CircleDot,
  Clock,
  PlusCircle,
  Pencil,
  Info
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/components/ui/use-toast";
import { queryClient } from "@/lib/queryClient";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import { MessageDialog } from "@/components/MessageDialog";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { useLocation } from "wouter";
import { JobModal } from "@/components/JobModal";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

interface StatusHistoryItem {
  status: string;
  date: string;
}

// Define the application stages in order
const APPLICATION_STAGES = ["Applied", "Interviewing", "Accepted"];

// Component for the application progress tracker
const ApplicationProgressTracker = ({ 
  currentStatus, 
  statusHistory 
}: { 
  currentStatus: string; 
  statusHistory?: StatusHistoryItem[];
}) => {
  // Determine the current stage index (0-based)
  const getCurrentStageIndex = () => {
    if (currentStatus === "Rejected" || currentStatus === "Withdrawn") {
      // For rejected/withdrawn, find the last valid stage from history
      if (statusHistory && statusHistory.length > 0) {
        for (let i = statusHistory.length - 2; i >= 0; i--) {
          const status = statusHistory[i].status;
          if (APPLICATION_STAGES.includes(status)) {
            return APPLICATION_STAGES.indexOf(status);
          }
        }
      }
      return -1; // No valid previous stage found
    }
    
    return APPLICATION_STAGES.indexOf(currentStatus);
  };

  const currentStageIndex = getCurrentStageIndex();
  
  // Get the appropriate icon for each stage
  const getStageIcon = (stage: string, index: number) => {
    if (currentStatus === "Rejected" && index > currentStageIndex) {
      // Show "blocked" icon for stages after the last valid stage if rejected
      return <XCircleIcon className="h-4 w-4" />;
    } else if (index < currentStageIndex) {
      // Completed stage
      return <CheckCircle2 className="h-4 w-4" />;
    } else if (index === currentStageIndex) {
      // Current stage
      return <CircleDot className="h-4 w-4" />;
    } else {
      // Future stage
      return <Circle className="h-4 w-4" />;
    }
  };

  // Get the color class for each stage
  const getStageColorClass = (index: number) => {
    if (currentStatus === "Rejected") {
      return index <= currentStageIndex 
        ? "text-red-500" 
        : "text-muted-foreground/30";
    } else if (currentStatus === "Withdrawn") {
      return index <= currentStageIndex 
        ? "text-gray-500" 
        : "text-muted-foreground/30";
    } else {
      if (index < currentStageIndex) {
        return "text-green-500"; // Completed
      } else if (index === currentStageIndex) {
        if (currentStatus === "Applied") return "text-blue-500";
        if (currentStatus === "Interviewing") return "text-yellow-500";
        if (currentStatus === "Accepted") return "text-green-500";
        return "text-primary";
      } else {
        return "text-muted-foreground/30"; // Future stage
      }
    }
  };

  // Get the date for a specific stage from history
  const getStageDate = (stage: string) => {
    if (!statusHistory) return null;
    
    // Find the first occurrence of this stage in history
    const historyItem = statusHistory.find(item => item.status === stage);
    return historyItem ? new Date(historyItem.date) : null;
  };

  return (
    <div className="mt-4 pt-3 border-t border-border/40">
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-4 left-0 right-0 h-[2px] bg-muted-foreground/20"></div>
        
        {/* Filled progress bar */}
        <div 
          className={cn(
            "absolute top-4 left-0 h-[2px] transition-all duration-500",
            currentStatus === "Rejected" ? "bg-red-500" : 
            currentStatus === "Withdrawn" ? "bg-gray-500" : 
            "bg-primary"
          )}
          style={{ 
            width: currentStageIndex >= 0 
              ? `${((currentStageIndex + 1) / APPLICATION_STAGES.length) * 100}%` 
              : '0%' 
          }}
        ></div>
        
        {/* Stage markers */}
        <div className="flex justify-between relative">
          {/* Start marker */}
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center bg-background border-2",
              currentStatus === "Rejected" || currentStatus === "Withdrawn" 
                ? "border-red-500/50 text-red-500" 
                : "border-primary/50 text-primary"
            )}>
              <MousePointerClick className="h-4 w-4" />
            </div>
            <span className="text-xs mt-2 font-medium">Start</span>
          </div>
          
          {/* Application stages */}
          {APPLICATION_STAGES.map((stage, index) => (
            <div key={stage} className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center bg-background border-2",
                getStageColorClass(index),
                index <= currentStageIndex 
                  ? currentStatus === "Rejected" 
                    ? "border-red-500/50" 
                    : currentStatus === "Withdrawn"
                      ? "border-gray-500/50"
                      : "border-primary/50" 
                  : "border-muted-foreground/20"
              )}>
                {getStageIcon(stage, index)}
              </div>
              <span className={cn(
                "text-xs mt-2 font-medium",
                getStageColorClass(index)
              )}>
                {stage}
              </span>
              {getStageDate(stage) && (
                <span className="text-[10px] text-muted-foreground mt-1">
                  {format(getStageDate(stage)!, "MMM d")}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Status indicator for rejected/withdrawn */}
        {(currentStatus === "Rejected" || currentStatus === "Withdrawn") && (
          <div className="mt-3 flex items-center justify-center">
            <Badge variant="outline" className={
              currentStatus === "Rejected" 
                ? "bg-red-500/10 text-red-500 border-red-500/20" 
                : "bg-gray-500/10 text-gray-500 border-gray-500/20"
            }>
              {currentStatus === "Rejected" ? (
                <XCircleIcon className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {currentStatus}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

// Modify NextStepItem to not use hooks directly
interface NextStepItemProps {
  step: string;
  dueDate?: string;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
  isReadOnly?: boolean;
  isLoading?: boolean;
}

const NextStepItem = ({ 
  step, 
  dueDate, 
  isCompleted = false,
  onToggleComplete,
  isReadOnly = true,
  isLoading = false
}: NextStepItemProps) => {
  // Calculate days remaining until due date
  const getDaysRemaining = () => {
    if (!dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDateTime = new Date(dueDate);
    dueDateTime.setHours(0, 0, 0, 0);
    
    const diffTime = dueDateTime.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const daysRemaining = getDaysRemaining();
  
  // Determine urgency level
  const getUrgencyColor = () => {
    if (daysRemaining === null) return "";
    
    if (daysRemaining < 0) return "text-red-500 bg-red-50 dark:bg-red-950/20";
    if (daysRemaining === 0) return "text-red-500 bg-red-50 dark:bg-red-950/20";
    if (daysRemaining <= 2) return "text-orange-500 bg-orange-50 dark:bg-orange-950/20";
    if (daysRemaining <= 5) return "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    return "text-green-500 bg-green-50 dark:bg-green-950/20";
  };
  
  const getUrgencyLabel = () => {
    if (daysRemaining === null) return null;
    
    if (daysRemaining < 0) return `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}`;
    if (daysRemaining === 0) return "Due today";
    if (daysRemaining === 1) return "Due tomorrow";
    return `${daysRemaining} days left`;
  };
  
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-all",
        isCompleted ? "bg-muted/30 line-through text-muted-foreground" : "bg-primary/5",
        isLoading && "opacity-70 cursor-wait pointer-events-none"
      )}
      onClick={(e) => {
        // Prevent click propagation to parent
        e.stopPropagation();
      }}
    >
      {!isReadOnly && (
        <div className="mt-0.5">
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent propagation here too
              if (onToggleComplete && !isLoading) onToggleComplete();
            }}
            disabled={isLoading}
            className={cn(
              "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
              isCompleted 
                ? "bg-primary border-primary text-primary-foreground" 
                : "border-muted-foreground/30 hover:border-primary",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : null}
          </button>
        </div>
      )}
      
      <div className="flex-1">
        <div className={cn("font-medium text-sm", isLoading && "text-muted-foreground")}>
          {step}
          {isLoading && (
            <span className="ml-2 text-xs text-muted-foreground inline-flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Updating...
            </span>
          )}
        </div>
        
        {dueDate && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {format(new Date(dueDate), "MMM d, yyyy")}
              </span>
            </div>
            
            {daysRemaining !== null && !isLoading && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                getUrgencyColor(),
                isCompleted && "opacity-50"
              )}>
                {getUrgencyLabel()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Also add a new NotesDisplay component for better notes presentation
const NotesDisplay = ({ notes }: { notes: string }) => {
  // Split notes by line breaks to handle them separately
  const noteLines = notes.split('\n').filter(line => line.trim().length > 0);
  
  return (
    <div 
      className="space-y-2"
      onClick={(e) => e.stopPropagation()} // Prevent click propagation
    >
      {noteLines.map((line, index) => {
        // Check if line contains any indicators that might deserve special treatment
        const isImportant = line.toLowerCase().includes('important') || 
                           line.toLowerCase().includes('critical') ||
                           line.toLowerCase().includes('!');
                           
        const isQuestion = line.includes('?');
        
        return (
          <div 
            key={index}
            className={cn(
              "px-3 py-2 rounded text-sm",
              isImportant ? "bg-yellow-50 border-l-2 border-yellow-500 dark:bg-yellow-950/20" : 
              isQuestion ? "bg-blue-50 border-l-2 border-blue-500 dark:bg-blue-950/20" : 
              "bg-muted/30"
            )}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

// Add a function to parse next steps from string format
const parseNextSteps = (stepText?: string): Array<{ step: string; completed?: boolean }> => {
  if (!stepText || typeof stepText !== 'string') return [];
  
  // Split by line breaks
  return stepText.split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      // Check if the step is marked as completed (has a [x] or [X] prefix)
      const completedMatch = line.match(/^\s*\[(x|X)\]\s*(.+)$/);
      if (completedMatch) {
        return {
          step: completedMatch[2].trim(),
          completed: true
        };
      }
      
      // Check if the step has an incomplete checkbox
      const incompleteMatch = line.match(/^\s*\[\s*\]\s*(.+)$/);
      if (incompleteMatch) {
        return {
          step: incompleteMatch[1].trim(),
          completed: false
        };
      }
      
      // Regular step without checkbox notation
      return {
        step: line.trim(),
        completed: false
      };
    });
};

export default function DashboardPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null);
  const [activeFeedbackId, setActiveFeedbackId] = useState<number | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [visibleCount, setVisibleCount] = useState(10); // Number of applications to show initially
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [location] = useLocation();
  // Add state to track completed steps locally using a Set
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  // Add state to track which steps are currently loading using a Set
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set());

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const messageId = params.get('messageId');
    const feedbackId = params.get('feedbackId');
    const readonly = params.get('readonly');

    if (messageId) {
      setActiveMessageId(parseInt(messageId));
    }
    if (feedbackId) {
      setActiveFeedbackId(parseInt(feedbackId));
      setIsReadOnly(readonly === 'true');
    }
  }, [location]);

  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const getJob = (jobId: number) => jobs.find((job) => job.id === jobId);

  // Function to check if an application is for an archived job
  const isArchivedJob = (application: Application) => {
    const job = getJob(application.jobId);
    return job && !job.isActive;
  };

  const stats = {
    Applied: (applications || []).filter((app) => app.status === "Applied" && !isArchivedJob(app)).length,
    Interviewing: (applications || []).filter((app) => app.status === "Interviewing" && !isArchivedJob(app)).length,
    Accepted: (applications || []).filter((app) => app.status === "Accepted" && !isArchivedJob(app)).length,
    Rejected: (applications || []).filter((app) => app.status === "Rejected" && !isArchivedJob(app)).length,
    Inactive: (applications || []).filter((app) => isArchivedJob(app)).length,
    total: applications?.length || 0,
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return "bg-blue-500/10 text-blue-500";
      case "interviewing":
        return "bg-yellow-500/10 text-yellow-500";
      case "accepted":
        return "bg-green-500/10 text-green-500";
      case "rejected":
        return "bg-red-500/10 text-red-500";
      case "withdrawn":
        return "bg-gray-500/10 text-gray-500";
      case "archived":
      case "inactive":
        return "bg-purple-500/10 text-purple-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const filteredApplications = selectedStatus
    ? selectedStatus === "Inactive"
      ? applications.filter(app => isArchivedJob(app))
      : applications.filter(app => app.status === selectedStatus && !isArchivedJob(app))
    : applications;

  // Get the applications to display based on the visible count
  const visibleApplications = filteredApplications.slice(0, visibleCount);

  // Handle scroll to load more applications
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      
      // If we're near the bottom (within 200px), load more applications
      if (scrollTop + clientHeight >= scrollHeight - 200 && visibleCount < filteredApplications.length) {
        setVisibleCount(prev => Math.min(prev + 10, filteredApplications.length));
      }
    }
  }, [visibleCount, filteredApplications.length]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(10);
  }, [selectedStatus]);

  const withdrawMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/applications/${applicationId}/status`,
        { status: "Withdrawn" }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to withdraw application");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application withdrawn",
        description: "Your application has been withdrawn successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
  };

  // Function to check if step is completed
  const isStepCompleted = (application: Application, step: string): boolean => {
    try {
      // First check local state
      if (completedSteps.has(`${application.id}-${step}`)) {
        return true;
      }
      
      // Then check application data
      if (application.nextStep && typeof application.nextStep === 'string') {
        const parsedSteps = parseNextSteps(application.nextStep);
        const matchingStep = parsedSteps.find(s => s.step === step);
        return matchingStep?.completed || false;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking step completion:", error);
      return false;
    }
  };
  
  // Function to toggle step completion locally
  const toggleStepCompletionLocally = (applicationId: number, step: string, completed: boolean) => {
    const key = `${applicationId}-${step}`;
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (completed) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
    
    toast({
      title: completed ? "Step marked as completed" : "Step marked as incomplete",
      description: "This change is saved locally while we update the server.",
    });
  };

  // Improve the mutation function with better error handling and fallback
  const updateNextStepMutation = useMutation({
    mutationFn: async ({ applicationId, step, completed }: { applicationId: number; step: string; completed: boolean }) => {
      try {
        // Set loading state for this step
        const stepKey = `${applicationId}-${step}`;
        setLoadingSteps(prev => {
          const newSet = new Set(prev);
          newSet.add(stepKey);
          return newSet;
        });
        
        const response = await apiRequest(
          "PATCH", 
          `/api/applications/${applicationId}/next-step-status`,
          { 
            stepDescription: step,
            isCompleted: completed 
          }
        );
        
        // Handle empty response (204 No Content)
        if (response.status === 204) {
          return { success: true, message: "Step updated successfully" };
        }
        
        // Check content type to determine if it's JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        } else {
          // Return a success message for non-JSON responses
          return { success: true, message: "Step updated successfully" };
        }
      } catch (error) {
        console.error("Error updating next step:", error);
        // Use our fallback implementation
        toggleStepCompletionLocally(applicationId, step, completed);
        throw new Error("Failed to update next step on the server. Updated locally instead.");
      } finally {
        // Clear loading state regardless of outcome
        const stepKey = `${applicationId}-${step}`;
        setLoadingSteps(prev => {
          const newSet = new Set(prev);
          newSet.delete(stepKey);
          return newSet;
        });
      }
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.completed ? "Step marked as completed" : "Step marked as incomplete",
        description: "Great job making progress on your application!",
      });
      
      // Update the completed steps in the local state to match the server
      const stepKey = `${variables.applicationId}-${variables.step}`;
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        if (variables.completed) {
          newSet.add(stepKey);
        } else {
          newSet.delete(stepKey);
        }
        return newSet;
      });
      
      // Refresh the application data
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error, variables) => {
      toast({
        title: "Error updating step",
        description: "Please try again later or contact support if the issue persists.",
        variant: "destructive",
      });
      console.error("Error updating next step:", error);
    }
  });

  if (isLoadingApps || isLoadingJobs) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Status descriptions for hover cards
  const statusDescriptions = {
    Applied: {
      title: "Applied Applications",
      description: "Jobs you've submitted your application for. The first step in your job search journey.",
      icon: <MousePointerClick className="h-4 w-4 mr-2" />
    },
    Interviewing: {
      title: "Interview Stage",
      description: "Congratulations! These employers are interested in your profile and want to learn more about you.",
      icon: <MessageSquare className="h-4 w-4 mr-2" />
    },
    Accepted: {
      title: "Job Offers",
      description: "Success! These employers have extended job offers to you. Time to celebrate your achievement!",
      icon: <Sparkles className="h-4 w-4 mr-2" />
    },
    Rejected: {
      title: "Rejected Applications",
      description: "These opportunities weren't the right fit. Use this as a learning experience for future applications.",
      icon: <AlertCircle className="h-4 w-4 mr-2" />
    },
    Inactive: {
      title: "Inactive Listings",
      description: "These job listings are no longer active. The position may have been filled or removed by the employer.",
      icon: <XCircleIcon className="h-4 w-4 mr-2" />
    },
    total: {
      title: "All Applications",
      description: "Your complete application history across all statuses.",
      icon: <Search className="h-4 w-4 mr-2" />
    }
  };

  return (
    <div className="container mx-auto px-4 py-2 max-w-7xl flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header section with title and filter button */}
      <motion.div 
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Application Dashboard</h1>
        </div>
        {selectedStatus && (
          <Button variant="outline" size="sm" onClick={() => setSelectedStatus(null)} className="h-9">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Clear Filter
          </Button>
        )}
      </motion.div>

      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {Object.entries(stats).map(([status, count]) => (
          <motion.div key={status} variants={itemVariants}>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md rounded-lg border-[1px] hover:scale-105 duration-300",
                    selectedStatus === status && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedStatus(status === "total" ? null : status)}
                >
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-sm font-medium">
                      {status === "total" ? "Total Applications" : status}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className={cn(
                      "text-4xl font-bold text-center py-3 rounded-md",
                      status !== "total" ? getStatusColor(status) : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      {count}
                    </div>
                  </CardContent>
                </Card>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center">
                    {statusDescriptions[status as keyof typeof statusDescriptions]?.icon}
                    {statusDescriptions[status as keyof typeof statusDescriptions]?.title}
                  </h4>
                  <p className="text-sm">
                    {statusDescriptions[status as keyof typeof statusDescriptions]?.description}
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Applications Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex-1 flex flex-col"
      >
        <div className="bg-card rounded-t-lg shadow-sm border border-b-0">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {selectedStatus ? `${selectedStatus} Applications` : "Your Applications"}
            </h2>
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex-1 overflow-auto bg-background rounded-b-lg border border-t-0 shadow-sm" 
          onScroll={handleScroll}
        >
          <motion.div 
            className="space-y-3 p-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {visibleApplications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="mb-3">
                  <BriefcaseIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                </div>
                No applications {selectedStatus && `with status "${selectedStatus}"`} yet.
                {!selectedStatus && " Start applying to jobs to track your progress here!"}
              </div>
            ) : (
              <>
                {visibleApplications.map((application) => {
                  const job = getJob(application.jobId);
                  if (!job) return null;

                  const statusHistory = application.statusHistory as StatusHistoryItem[];

                  return (
                    <motion.div
                      key={application.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.01 }}
                      className={cn(
                        "p-4 rounded-lg border space-y-3 cursor-pointer hover:bg-accent/30 transition-colors",
                        !job.isActive && "bg-muted/30",
                        application.status === "Interviewing" && "border-yellow-500/30",
                        application.status === "Accepted" && "border-green-500/30",
                        application.status === "Rejected" && "border-red-500/30"
                      )}
                      onClick={() => handleJobClick(job)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2 text-lg">
                            {job.title}
                            {!job.isActive && (
                              <div className="flex items-center text-muted-foreground text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Listing no longer active
                              </div>
                            )}
                          </div>
                          <div className="text-sm font-medium">{job.company}</div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              Applied {format(new Date(application.appliedAt), "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="h-3.5 w-3.5" />
                              {job.location}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(!job.isActive ? "inactive" : application.status)}>
                          {!job.isActive ? "Inactive" : application.status}
                        </Badge>
                      </div>

                      {/* Replace Status History with Application Progress Tracker */}
                      {statusHistory && statusHistory.length > 0 && (
                        <ApplicationProgressTracker 
                          currentStatus={!job.isActive ? "Inactive" : application.status}
                          statusHistory={statusHistory}
                        />
                      )}

                      {/* Notes Section */}
                      {application.notes && (
                        <div 
                          className="mt-3 space-y-1.5"
                          onClick={(e) => e.stopPropagation()} // Prevent propagation
                        >
                          <div className="flex items-center gap-1.5">
                            <NotebookIcon className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm">Notes</h4>
                          </div>
                          
                          <NotesDisplay notes={application.notes} />
                        </div>
                      )}

                      {/* Next Steps Section */}
                      {application.nextStep && (
                        <div 
                          className="mt-3 space-y-1.5"
                          onClick={(e) => e.stopPropagation()} // Prevent propagation
                        >
                          <div className="flex items-center gap-1.5">
                            <ArrowRightIcon className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm">Next Steps</h4>
                          </div>
                          
                          <div className="space-y-2">
                            {application.nextStep.split('\n').map((step: string, index: number) => {
                              if (step.trim()) {
                                // Extract any due date from the step text (format: YYYY-MM-DD)
                                const dueDateMatch = step.match(/\b(\d{4}-\d{2}-\d{2})\b/);
                                const dueDate = dueDateMatch ? dueDateMatch[1] : undefined;
                                
                                // Remove the date from the display text if found
                                const stepText = dueDateMatch 
                                  ? step.replace(dueDateMatch[0], '').trim() 
                                  : step.trim();
                                
                                const stepIsCompleted = isStepCompleted(application, stepText);
                                const stepKey = `${application.id}-${stepText}`;
                                const isLoading = loadingSteps.has(stepKey);
                                
                                return (
                                  <NextStepItem
                                    key={`step-${index}`}
                                    step={stepText}
                                    dueDate={dueDate}
                                    isCompleted={stepIsCompleted}
                                    isLoading={isLoading}
                                    isReadOnly={false}
                                    onToggleComplete={() => {
                                      try {
                                        updateNextStepMutation.mutate({
                                          applicationId: application.id, 
                                          step: stepText,
                                          completed: !stepIsCompleted
                                        });
                                      } catch (e) {
                                        // If the mutation throws, fall back to local state
                                        toggleStepCompletionLocally(application.id, stepText, !stepIsCompleted);
                                        
                                        // Clear loading state
                                        setLoadingSteps(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(stepKey);
                                          return newSet;
                                        });
                                      }
                                    }}
                                  />
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {visibleCount < filteredApplications.length && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </motion.div>

      {activeMessageId && (
        <MessageDialog
          applicationId={activeMessageId}
          jobTitle={jobs.find(j => j.id === applications.find(a => a.id === activeMessageId)?.jobId)?.title || ""}
          company={jobs.find(j => j.id === applications.find(a => a.id === activeMessageId)?.jobId)?.company || ""}
          onClose={() => setActiveMessageId(null)}
          isOpen={true}
        />
      )}

      {activeFeedbackId && (
        <FeedbackDialog
          feedbackId={activeFeedbackId}
          readOnly={isReadOnly} 
          open={true}
          onClose={() => {
            setActiveFeedbackId(null);
            setIsReadOnly(false);
          }}
        />
      )}

      {selectedJob && (
        <JobModal
          job={selectedJob}
          isOpen={true}
          onClose={() => setSelectedJob(null)}
          alreadyApplied={true}
          applicationControls={
            <div className="flex items-center gap-4">
              <MessageDialog
                applicationId={applications.find(app => app.jobId === selectedJob.id)?.id || 0}
                jobTitle={selectedJob.title}
                company={selectedJob.company}
              />
              <WithdrawDialog
                onWithdraw={() =>
                  withdrawMutation.mutate(
                    applications.find(app => app.jobId === selectedJob.id)?.id || 0
                  )
                }
                isPending={withdrawMutation.isPending}
              />
            </div>
          }
        />
      )}
    </div>
  );
}