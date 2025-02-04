import { useQuery, useMutation } from "@tanstack/react-query";
import { JobCard } from "@/components/job-card";
import { CompanyCard } from "@/components/company-card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Job } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("POST", "/api/applications", {
        jobId,
        status: "applied",
        appliedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully.",
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

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Jobs</h1>
          <Input
            placeholder="Search jobs..."
            className="max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={() => applyMutation.mutate(job.id)}
                />
              ))
            )}
          </div>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Featured Companies</h2>
            {jobs.slice(0, 3).map((job) => (
              <CompanyCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
