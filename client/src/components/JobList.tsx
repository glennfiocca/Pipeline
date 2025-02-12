import { useQuery } from "@tanstack/react-query";
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
    enabled: !!user, // Only fetch applications if user is logged in
  });

  const isJobApplied = (jobId: number) => {
    if (!user) return false;
    return applications.some(app => 
      app.jobId === jobId && app.status !== "Withdrawn"
    );
  };

  const handleApply = async (jobId: number) => {
    if (!user) return;

    try {
      await apiRequest("POST", "/api/applications", {
        jobId,
        profileId: user.id,
        status: "Applied",
        appliedAt: new Date().toISOString(),
        applicationData: {}
      });

      // Invalidate the applications query to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });

      toast({
        title: "Application submitted",
        description: "Your application has been successfully submitted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          {jobs?.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={() => handleApply(job.id)}
              onViewDetails={() => setSelectedJob(job)}
              isApplied={isJobApplied(job.id)}
              isApplying={false}
            />
          ))}
        </div>
      </ScrollArea>

      <JobModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={handleApply}
        isApplied={selectedJob ? isJobApplied(selectedJob.id) : false}
        isApplying={false}
      />
    </>
  );
}