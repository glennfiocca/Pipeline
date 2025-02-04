import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const getJob = (jobId: number) => jobs.find((job) => job.id === jobId);

  const stats = {
    total: applications.length,
    applied: applications.filter((app) => app.status === "applied").length,
    interviewing: applications.filter((app) => app.status === "interviewing").length,
    accepted: applications.filter((app) => app.status === "accepted").length,
  };

  return (
    <div className="container py-10">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="text-2xl font-bold">{stats.applied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviewing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviewing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.slice(0, 5).map((application) => {
              const job = getJob(application.jobId);
              if (!job) return null;
              return (
                <div key={application.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{job.title}</div>
                    <div className="text-sm text-muted-foreground">{job.company}</div>
                  </div>
                  <Badge>{application.status}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
