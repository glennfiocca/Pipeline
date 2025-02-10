import { useQuery } from "@tanstack/react-query";
import { JobCard } from "./JobCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@shared/schema";

export function JobList() {
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const handleApply = (jobId: number) => {
    // TODO: Implement job application logic
    console.log("Applying for job:", jobId);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[400px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-full px-4">
      <div className="grid gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs?.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onApply={handleApply}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
