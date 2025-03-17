import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Loader2, AlertCircle, ChevronRight, 
  CalendarIcon, MapPinIcon, NotebookIcon, ArrowRightIcon, BriefcaseIcon, XCircleIcon,
  MessageSquare, Sparkles, Search, MousePointerClick
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
          <BriefcaseIcon className="h-6 w-6 text-primary" />
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

                      {statusHistory && statusHistory.length > 0 && (
                        <div className="mt-2 text-sm">
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="flex items-center gap-1 mb-1 px-2 h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <ChevronRight className="h-3 w-3 transition-transform ui-expanded:rotate-90" />
                                Status History
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent onClick={(e) => e.stopPropagation()} className="pl-2 border-l-2 border-muted ml-1">
                              {statusHistory.map((history, index) => (
                                <div key={index} className="flex items-center text-muted-foreground py-1">
                                  <span className="mr-2 text-xs">
                                    {format(new Date(history.date), "MMM d, yyyy")}:
                                  </span>
                                  <Badge variant="outline" className={getStatusColor(!job.isActive && index === statusHistory.length - 1 ? "inactive" : history.status)}>
                                    {!job.isActive && index === statusHistory.length - 1 ? "Inactive" : history.status}
                                  </Badge>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}

                      {application.notes && (
                        <div className="mt-2 text-sm bg-muted/50 p-2 rounded-md">
                          <div className="font-medium flex items-center gap-1">
                            <NotebookIcon className="h-3.5 w-3.5" />
                            Notes:
                          </div>
                          <p className="text-muted-foreground">{application.notes}</p>
                        </div>
                      )}

                      {application.nextStep && (
                        <div className="mt-2 text-sm bg-primary/5 p-2 rounded-md">
                          <div className="font-medium flex items-center gap-1">
                            <ArrowRightIcon className="h-3.5 w-3.5" />
                            Next Step:
                          </div>
                          <p className="text-muted-foreground">
                            {application.nextStep}
                            {application.nextStepDueDate && (
                              <span className="ml-2 text-xs bg-background px-1.5 py-0.5 rounded-full">
                                Due: {format(new Date(application.nextStepDueDate), "MMM d, yyyy")}
                              </span>
                            )}
                          </p>
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