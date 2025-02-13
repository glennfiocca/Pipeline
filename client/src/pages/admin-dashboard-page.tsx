import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, Job, Profile } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function AdminDashboardPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-admin users
  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ["/api/admin/applications"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ["/api/admin/profiles"],
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
      nextStep,
      nextStepDueDate,
    }: {
      id: number;
      status?: string;
      notes?: string;
      nextStep?: string;
      nextStepDueDate?: string;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/applications/${id}`,
        { status, notes, nextStep, nextStepDueDate }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update application");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({
        title: "Application updated",
        description: "The application has been updated successfully.",
      });
      setSelectedApplication(null);
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
      case "screening":
        return "bg-purple-500/10 text-purple-500";
      case "interviewing":
        return "bg-yellow-500/10 text-yellow-500";
      case "offered":
        return "bg-orange-500/10 text-orange-500";
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

  const getJob = (jobId: number) => jobs.find((job) => job.id === jobId);
  const getProfile = (profileId: number) => profiles.find((profile) => profile.id === profileId);

  const filteredApplications = selectedStatus
    ? applications.filter((app) => app.status === selectedStatus)
    : applications;

  const stats = {
    Total: applications.length,
    Applied: applications.filter((app) => app.status === "Applied").length,
    Screening: applications.filter((app) => app.status === "Screening").length,
    Interviewing: applications.filter((app) => app.status === "Interviewing").length,
    Offered: applications.filter((app) => app.status === "Offered").length,
    Accepted: applications.filter((app) => app.status === "Accepted").length,
    Rejected: applications.filter((app) => app.status === "Rejected").length,
    Withdrawn: applications.filter((app) => app.status === "Withdrawn").length,
  };

  if (isLoadingApps) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {selectedStatus && (
          <Button variant="ghost" onClick={() => setSelectedStatus(null)}>
            Clear Filter
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
        {Object.entries(stats).map(([status, count]) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedStatus === status && "ring-2 ring-primary"
            }`}
            onClick={() => setSelectedStatus(status === "Total" ? null : status)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{status}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                status !== "Total" && getStatusColor(status)
              }`}>
                {count}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>
            {selectedStatus ? `${selectedStatus} Applications` : "All Applications"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredApplications.map((application) => {
                const job = getJob(application.jobId);
                const profile = getProfile(application.profileId);
                if (!job || !profile) return null;

                return (
                  <div
                    key={application.id}
                    className="p-4 rounded-lg border space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {profile.name} - {job.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {job.company} - {job.location}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Applied on {format(new Date(application.appliedAt), "MMM d, yyyy")}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(application.status)}>
                          {application.status}
                        </Badge>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedApplication(application)}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedApplication && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <h2 className="text-lg font-semibold">Update Application Status</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  defaultValue={selectedApplication.status}
                  onValueChange={(value) =>
                    updateApplicationMutation.mutate({
                      id: selectedApplication.id,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Screening">Screening</SelectItem>
                    <SelectItem value="Interviewing">Interviewing</SelectItem>
                    <SelectItem value="Offered">Offered</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  defaultValue={selectedApplication.notes || ""}
                  placeholder="Add notes about the application..."
                  onChange={(e) =>
                    updateApplicationMutation.mutate({
                      id: selectedApplication.id,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Next Step</label>
                <Input
                  defaultValue={selectedApplication.nextStep || ""}
                  placeholder="e.g., Technical Interview"
                  onChange={(e) =>
                    updateApplicationMutation.mutate({
                      id: selectedApplication.id,
                      nextStep: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Next Step Due Date</label>
                <Input
                  type="date"
                  defaultValue={selectedApplication.nextStepDueDate?.split("T")[0] || ""}
                  onChange={(e) =>
                    updateApplicationMutation.mutate({
                      id: selectedApplication.id,
                      nextStepDueDate: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedApplication(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}