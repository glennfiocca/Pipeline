import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, Job, User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { ChevronLeft, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { AdminMessageDialog } from "@/components/AdminMessageDialog";
import { useAuth } from "@/hooks/use-auth";

const APPLICATION_STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "Withdrawn"];

export default function UserApplicationsPage() {
  const [location, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const username = location.split('/').pop() as string;

  const [selectedApplication, setSelectedApplication] = useState<{
    id: number;
    username: string;
    companyName: string;
  } | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      setLocation('/');
    }
  }, [currentUser, setLocation]);

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

      // Update the application status
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

      const application = await response.json();

      // Create a notification for the status change
      const notifRes = await apiRequest(
        "POST",
        "/api/notifications",
        {
          userId: application.profileId,
          type: "status_change",
          title: "Application Status Updated",
          message: `Your application status has been updated to ${status}.`,
          metadata: {
            applicationId,
            status,
            jobId: application.jobId
          },
          read: false,
          createdAt: now
        }
      );

      if (!notifRes.ok) {
        console.error("Failed to create notification");
      }

      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
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

  // Find the user and their applications
  const targetUser = users.find(u => u.username === username);
  if (!targetUser) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">User not found</h2>
              <p className="text-muted-foreground">The requested user does not exist.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setLocation('/admin')}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter applications for this user
  const userApplications = applications.filter(app => {
    const appUser = users.find(u => u.id === app.profileId);
    return appUser && appUser.username === username;
  }).map(app => {
    const job = jobs.find(j => j.id === app.jobId);
    return { ...app, job };
  }).filter(app => app.job) as (Application & { job: Job })[];

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
    <div className="container mx-auto px-4 py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-2"
              onClick={() => setLocation('/admin')}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to All Users
            </Button>
            <CardTitle className="flex items-center gap-2">
              Applications for {username}
              <Badge variant="secondary">
                {userApplications.length} applications
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {userApplications.length > 0 ? (
                userApplications.map((app) => (
                  <div
                    key={app.id}
                    className={cn(
                      "p-4 rounded-lg border space-y-2",
                      !app.job.isActive && "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {app.job.title}
                          {!app.job.isActive && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Archived Job
                            </Badge>
                          )}
                        </h4>
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
                          className="text-primary hover:text-primary-foreground"
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
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No applications found for this user.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedApplication && (
        <AdminMessageDialog
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          applicationId={selectedApplication.id}
          username={selectedApplication.username}
          companyName={selectedApplication.companyName}
        />
      )}
    </div>
  );
}