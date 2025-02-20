import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Archive, Loader2 } from "lucide-react";

// Include "Archived" in the statuses
const APPLICATION_STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "Archived"];

export function ApplicationsManagement() {
  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Modified grouping logic to prioritize archived jobs
  const groupedApplications = applications.reduce((acc, app) => {
    const job = jobs.find(j => j.id === app.jobId);
    if (!job) return acc;

    // If job is archived, put in archived bucket regardless of current status
    if (!job.isActive) {
      acc.archived = acc.archived || [];
      acc.archived.push({ app, job });
    } else {
      // Otherwise, group by application status
      const status = app.status.toLowerCase();
      acc[status] = acc[status] || [];
      acc[status].push({ app, job });
    }

    return acc;
  }, {} as Record<string, Array<{ app: Application; job: Job }>>);

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
        <div className="grid grid-cols-5 gap-4">
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
        const statusLower = status.toLowerCase();
        const appsInStatus = groupedApplications[statusLower] || [];
        const count = appsInStatus.length;

        return (
          <Card key={status}>
            <CardHeader className="p-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {status}
                  {status === "Archived" && <Archive className="h-4 w-4" />}
                </div>
                <Badge variant="secondary">
                  {count}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-4">
                  {appsInStatus.map(({ app, job }) => (
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
                          {status === "Archived" && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Archive className="h-3 w-3" />
                              Job Archived
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Applied on {format(new Date(app.appliedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
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