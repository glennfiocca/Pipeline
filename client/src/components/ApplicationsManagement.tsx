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
import { ChevronRight, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AdminMessageDialog } from "./AdminMessageDialog";

const APPLICATION_STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "Withdrawn"];

interface ApplicationsByUser {
  [username: string]: (Application & { job: Job })[];
}

export function ApplicationsManagement() {
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<{
    id: number;
    username: string;
    companyName: string;
  } | null>(null);

  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ["/api/admin/applications"],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: string }) => {
      const now = new Date().toISOString();
      const response = await apiRequest(
        "PATCH",
        `/api/applications/${applicationId}/status`,
        { 
          status,
          statusHistory: {
            status,
            date: now
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update application status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
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

  if (isLoadingApps || isLoadingUsers || isLoadingJobs) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const applicationsByUser = applications.reduce((acc, app) => {
    const user = users.find(u => u.id === app.profileId);
    const job = jobs.find(j => j.id === app.jobId);

    if (!user || !job) return acc;

    const username = user.username;
    if (!acc[username]) {
      acc[username] = [];
    }

    acc[username].push({ ...app, job });
    return acc;
  }, {} as ApplicationsByUser);

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
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications Management</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {Object.entries(applicationsByUser).map(([username, userApps]) => (
              <Collapsible key={username}>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-2 transition-transform ui-expanded:rotate-90" />
                      <h3 className="font-medium">{username}</h3>
                      <Badge variant="secondary" className="ml-2">
                        {userApps.length} applications
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="space-y-2 mt-2 ml-4">
                    {userApps.map((app) => (
                      <div
                        key={app.id}
                        className="p-4 rounded-lg border space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{app.job.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {app.job.company}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Applied on {format(new Date(app.appliedAt), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={getStatusColor(app.status)}>
                              {app.status}
                            </Badge>
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
                                {APPLICATION_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSelectedApplication({
                                id: app.id,
                                username,
                                companyName: app.job.company
                              })}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {app.notes && (
                          <div>
                            <p className="text-sm font-medium">Notes:</p>
                            <p className="text-sm text-muted-foreground">{app.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
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