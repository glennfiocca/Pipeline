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
import { ChevronRight, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { AdminMessageDialog } from "./AdminMessageDialog";
import { useLocation } from "wouter";
import { UserApplications } from "./UserApplications";

const APPLICATION_STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "Withdrawn"];

interface ApplicationsByUser {
  [username: string]: (Application & { job: Job })[];
}

export function ApplicationsManagement() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  // Extract username from URL if present
  useEffect(() => {
    // Check if we're on the admin applications page with a username
    const match = location.match(/\/admin\/applications\/(.+)/);
    if (match && match[1]) {
      setSelectedUsername(decodeURIComponent(match[1]));
    } else {
      setSelectedUsername(null);
    }
  }, [location]);

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

  // If we have a selected username, show that user's applications
  if (selectedUsername) {
    const userApps = applications.filter(app => {
      const user = users.find(u => u.id === app.profileId);
      return user?.username === selectedUsername;
    }).map(app => {
      const job = jobs.find(j => j.id === app.jobId);
      return { ...app, job: job! };
    });

    return (
      <UserApplications 
        username={selectedUsername}
        applications={userApps}
        onBack={() => setLocation("/admin")}
      />
    );
  }

  // Group applications by username
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
              <div 
                key={username}
                className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-accent/10 transition-colors"
                onClick={() => setLocation(`/admin/applications/${encodeURIComponent(username)}`)}
              >
                <div className="flex items-center">
                  <h3 className="font-medium">{username}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {userApps.length} applications
                  </Badge>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}