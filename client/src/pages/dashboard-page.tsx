import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const getJob = (jobId: number) => jobs.find((job) => job.id === jobId);

  const stats = {
    total: applications.length,
    applied: applications.filter((app) => app.status === "applied").length,
    interviewing: applications.filter((app) => app.status === "interviewing").length,
    accepted: applications.filter((app) => app.status === "accepted").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-500/10 text-blue-500";
      case "interviewing":
        return "bg-yellow-500/10 text-yellow-500";
      case "accepted":
        return "bg-green-500/10 text-green-500";
      case "rejected":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
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
      <h1 className="text-3xl font-bold mb-8">Application Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.applied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviewing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.interviewing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No applications yet. Start applying to jobs to track your progress here!
              </div>
            ) : (
              applications.map((application) => {
                const job = getJob(application.jobId);
                if (!job) return null;
                return (
                  <div key={application.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <div className="font-medium">{job.title}</div>
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
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}