import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, User, Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Archive } from "lucide-react";

const APPLICATION_STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "Archived"];

export function ApplicationsManagement() {
  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Group applications by status, handling archived jobs specially
  const groupedApplications = applications.reduce((acc, app) => {
    const job = jobs.find(j => j.id === app.jobId);
    if (!job) return acc;

    // If the job is archived, put it in the archived bucket regardless of status
    if (!job.isActive) {
      acc.archived = acc.archived || [];
      acc.archived.push(app);
      return acc;
    }

    // Otherwise group by the application's status
    const status = app.status.toLowerCase();
    acc[status] = acc[status] || [];
    acc[status].push(app);

    return acc;
  }, {} as Record<string, Application[]>);

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
      case "archived":
        return "bg-purple-500/10 text-purple-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  if (isLoadingApps || isLoadingJobs) {
    return (
      <div className="flex justify-center p-8">
        <div className="space-y-4">
          {APPLICATION_STATUSES.map((status) => (
            <Card key={status} className="w-48">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{status}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-4">
      {APPLICATION_STATUSES.map((status) => {
        const appsInStatus = groupedApplications[status.toLowerCase()] || [];
        const count = appsInStatus.length;

        return (
          <Card key={status}>
            <CardHeader className="p-4">
              <CardTitle className="text-lg flex items-center justify-between">
                {status}
                <Badge variant="secondary">
                  {count}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-4">
                  {appsInStatus.map((app) => {
                    const job = jobs.find(j => j.id === app.jobId);
                    if (!job) return null;

                    return (
                      <div
                        key={app.id}
                        className="p-4 rounded-lg border space-y-2"
                      >
                        <div>
                          <h4 className="font-medium">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {job.company}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusColor(app.status)}>
                              {app.status}
                            </Badge>
                            {!job.isActive && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Archive className="h-3 w-3" />
                                Archived
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Applied on {format(new Date(app.appliedAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {count === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No applications
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}