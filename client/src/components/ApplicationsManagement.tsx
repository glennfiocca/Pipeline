import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, User, Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { ChevronRight, Loader2, MessageSquare, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AdminMessageDialog } from "./AdminMessageDialog";

const APPLICATION_STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "Withdrawn", "Archived"];

interface ApplicationsByStatus {
  applied: Application[];
  interviewing: Application[];
  accepted: Application[];
  rejected: Application[];
  withdrawn: Application[];
  archived: Application[];
}

export function ApplicationsManagement() {
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<{
    id: number;
    username: string;
    companyName: string;
  } | null>(null);

  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: true,
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Group applications by status, considering archived jobs
  const groupedApplications = applications.reduce((acc, app) => {
    const job = jobs.find(j => j.id === app.jobId);
    if (!job) return acc;

    // If the job is archived, put the application in the archived bucket
    if (!job.isActive) {
      if (!acc.archived) acc.archived = [];
      acc.archived.push(app);
    } else {
      // Otherwise group by application status
      const status = app.status.toLowerCase();
      if (!acc[status]) acc[status] = [];
      acc[status].push(app);
    }

    return acc;
  }, {} as Record<string, Application[]>);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: string }) => {
      const now = new Date().toISOString();
      const response = await apiRequest(
        "PATCH",
        `/api/applications/${applicationId}/status`,
        { 
          status,
          statusHistory: [{
            status,
            date: now
          }]
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update application status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Success",
        description: "Application status updated successfully",
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

  if (isLoadingApps || isLoadingJobs || isLoadingUsers) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications Management</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {APPLICATION_STATUSES.map(status => {
              const applicationsInStatus = groupedApplications[status.toLowerCase()] || [];
              if (applicationsInStatus.length === 0) return null;

              return (
                <div key={status} className="space-y-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {status}
                    {status === "Archived" && <Archive className="h-4 w-4" />}
                    <Badge variant="secondary">{applicationsInStatus.length}</Badge>
                  </h2>
                  {applicationsInStatus.map(app => {
                    const job = jobs.find(j => j.id === app.jobId);
                    const user = users.find(u => u.id === app.profileId);
                    if (!job || !user) return null;

                    return (
                      <div
                        key={app.id}
                        className="p-4 rounded-lg border space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{job.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {job.company} - Applied by {user.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Applied on {format(new Date(app.appliedAt), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={getStatusColor(app.status)}>
                              {app.status}
                            </Badge>
                            {!job.isActive ? (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Archive className="h-3 w-3" />
                                Job Archived
                              </Badge>
                            ) : (
                              <Select
                                defaultValue={app.status}
                                onValueChange={(newStatus) => {
                                  updateStatusMutation.mutate({
                                    applicationId: app.id,
                                    status: newStatus,
                                  });
                                }}
                                disabled={updateStatusMutation.isPending}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Change status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {APPLICATION_STATUSES.filter(s => s !== "Archived").map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>

      {selectedApplication && (
        <AdminMessageDialog
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          applicationId={selectedApplication.id}
          username={selectedApplication.username}
          companyName={selectedApplication.companyName}
        />
      )}
    </Card>
  );
}