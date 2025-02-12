import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { JobCard } from "./JobCard";
import { JobModal } from "./JobModal";
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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { data: jobs = [mockJob], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const handleApply = (jobId: number) => {
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
    <>
      <ScrollArea className="h-[calc(100vh-4rem)] w-full px-4">
        <div className="grid gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs?.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={() => handleApply(job.id)}
              onViewDetails={() => setSelectedJob(job)}
              isApplied={false}
              isApplying={false}
            />
          ))}
        </div>
      </ScrollArea>

      <JobModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={(jobId) => handleApply(jobId)}
        isApplied={false}
        isApplying={false}
      />
    </>
  );
}