import { Application, Job } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { AdminMessageDialog } from "./AdminMessageDialog";
import { AlertCircle, ArrowLeft, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const APPLICATION_STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "Withdrawn"];

interface UserApplicationsProps {
  username: string;
  applications: (Application & { job: Job })[];
  onBack: () => void;
}

export function UserApplications({ username, applications, onBack }: UserApplicationsProps) {
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<{
    id: number;
    username: string;
    companyName: string;
  } | null>(null);

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
      <CardHeader className="flex flex-row items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle>Applications for {username}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No applications found for this user
              </div>
            ) : (
              applications.map((app) => (
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
            )}
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