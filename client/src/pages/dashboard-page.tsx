import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import { ApplicationCreditsCard } from "@/components/ApplicationCreditsCard";
import { MessageDialog } from "@/components/MessageDialog";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { useLocation } from "wouter";
import { JobModal } from "@/components/JobModal";

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
  const { toast } = useToast();
  const [location] = useLocation();

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
    Applied: applications.filter((app) => app.status === "Applied" && !isArchivedJob(app)).length,
    Interviewing: applications.filter((app) => app.status === "Interviewing" && !isArchivedJob(app)).length,
    Accepted: applications.filter((app) => app.status === "Accepted" && !isArchivedJob(app)).length,
    Rejected: applications.filter((app) => app.status === "Rejected" && !isArchivedJob(app)).length,
    Archived: applications.filter((app) => isArchivedJob(app)).length,
    total: applications.length,
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
        return "bg-purple-500/10 text-purple-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const filteredApplications = selectedStatus
    ? selectedStatus === "Archived"
      ? applications.filter(app => isArchivedJob(app))
      : applications.filter(app => app.status === selectedStatus && !isArchivedJob(app))
    : applications;

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

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Application Dashboard</h1>
        <div className="flex items-center gap-4">
          <ApplicationCreditsCard />
          {selectedStatus && (
            <Button variant="ghost" onClick={() => setSelectedStatus(null)}>
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Object.entries(stats).map(([status, count]) => (
          <Card
            key={status}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedStatus === status && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedStatus(status === "total" ? null : status)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {status === "total" ? "Total Applications" : status}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                status !== "total" && getStatusColor(status)
              )}>
                {count}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>
            {selectedStatus ? `${selectedStatus} Applications` : "Your Applications"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No applications {selectedStatus && `with status "${selectedStatus}"`} yet.
                  {!selectedStatus && " Start applying to jobs to track your progress here!"}
                </div>
              ) : (
                filteredApplications.map((application) => {
                  const job = getJob(application.jobId);
                  if (!job) return null;

                  return (
                    <div
                      key={application.id}
                      className={cn(
                        "p-4 rounded-lg border space-y-3 cursor-pointer hover:bg-accent/50 transition-colors",
                        !job.isActive && "bg-muted/30"
                      )}
                      onClick={() => handleJobClick(job)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            {job.title}
                            {!job.isActive && (
                              <div className="flex items-center text-muted-foreground text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Listing no longer active
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{job.company}</div>
                          <div className="text-xs text-muted-foreground">
                            Applied on {format(new Date(application.appliedAt), "MMM d, yyyy")}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground">
                            {job.location}
                          </div>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                      </div>

                      {application.statusHistory && Array.isArray(application.statusHistory) && (
                        <div className="mt-2 text-sm">
                          <div className="font-medium mb-1">Status History:</div>
                          {(application.statusHistory as StatusHistoryItem[]).map((history, index) => (
                            <div key={index} className="flex items-center text-muted-foreground">
                              <span className="mr-2">
                                {format(new Date(history.date), "MMM d, yyyy")}:
                              </span>
                              <Badge variant="outline" className={getStatusColor(history.status)}>
                                {history.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      {application.notes && (
                        <div className="mt-2 text-sm">
                          <div className="font-medium">Notes:</div>
                          <p className="text-muted-foreground">{application.notes}</p>
                        </div>
                      )}

                      {application.nextStep && (
                        <div className="mt-2 text-sm">
                          <div className="font-medium">Next Step:</div>
                          <p className="text-muted-foreground">
                            {application.nextStep}
                            {application.nextStepDueDate && (
                              <span className="ml-2">
                                (Due: {format(new Date(application.nextStepDueDate), "MMM d, yyyy")})
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

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
          isReadOnly={isReadOnly}
          isOpen={true}
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