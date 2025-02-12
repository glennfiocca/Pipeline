import { useQuery } from "@tanstack/react-query";
import { JobCard } from "./JobCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@shared/schema";

// Mock data for testing
const mockJob: Job = {
  id: 1,
  title: "Leveraged Finance Analyst",
  company: "J.P. Morgan",
  location: "New York, New York, USA",
  type: "Full Time",
  salary: "$225k/yr",
  description: "A global leader in investment banking, consumer and small business banking, commercial banking, financial...",
  requirements: "Bachelor's degree in Engineering, Economics, Finance, Business Administration, Accounting, or related field;2+ years of experience in investment finance or related occupation;Strong analytical and problem-solving skills",
  source: "Bloomberg",
  sourceUrl: "https://bloomberg.com/careers",
  published: true,
  isActive: true,
  lastCheckedAt: new Date().toISOString(),
  deactivatedAt: null
};

export function JobList() {
  const { data: jobs = [mockJob], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const handleApply = (jobId: number) => {
    console.log("Applying for job:", jobId);
  };

  const handleSave = (jobId: number) => {
    console.log("Saving job:", jobId);
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
            onSave={handleSave}
          />
        ))}
      </div>
    </ScrollArea>
  );
}