import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { JobCard } from "./JobCard";
import { JobModal } from "./JobModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Job, Application } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function JobList() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: applications = [], isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: !!user,
  });

  const getApplicationStatus = (jobId: number) => {
    if (!applications.length) return { isApplied: false, previouslyApplied: false };

    // Get all applications for this job, sorted by date
    const jobApplications = applications
      .filter(app => app.jobId === jobId)
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

    if (!jobApplications.length) return { isApplied: false, previouslyApplied: false };

    const latestApplication = jobApplications[0];

    // If the latest application is withdrawn, user can reapply
    if (latestApplication.status === "Withdrawn") {
      return { isApplied: false, previouslyApplied: true };
    }

    // If the latest application is not withdrawn, user has an active application
    return { isApplied: true, previouslyApplied: false };
  };

  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest(
        "POST",
        "/api/applications",
        {
          jobId,
          profileId: user!.id,
          status: "Applied",
          appliedAt: new Date().toISOString(),
          applicationData: {}
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit application");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application submitted",
        description: "Your application has been successfully submitted.",
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

  if (isLoadingJobs) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[400px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[calc(100vh-4rem)] w-full px-4">
        <div className="grid gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs?.map((job) => {
            const { isApplied, previouslyApplied } = getApplicationStatus(job.id);
            return (
              <JobCard
                key={job.id}
                job={job}
                onApply={() => applyMutation.mutate(job.id)}
                onViewDetails={() => setSelectedJob(job)}
                isApplied={isApplied}
                isApplying={applyMutation.isPending}
                previouslyApplied={previouslyApplied}
              />
            );
          })}
        </div>
      </ScrollArea>

      <JobModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={(jobId) => applyMutation.mutate(jobId)}
        isApplied={selectedJob ? getApplicationStatus(selectedJob.id).isApplied : false}
        isApplying={applyMutation.isPending}
        previouslyApplied={selectedJob ? getApplicationStatus(selectedJob.id).previouslyApplied : false}
      />
    </>
  );
}