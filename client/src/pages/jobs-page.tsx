import { useQuery, useMutation } from "@tanstack/react-query";
import { JobCard } from "@/components/JobCard";
import { CompanyCard } from "@/components/company-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Job, Application } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { JobModal } from "@/components/JobModal";
import { Loader2 } from "lucide-react";
import { ApplicationCreditsCard } from "@/components/ApplicationCreditsCard";
import { useLocation } from "wouter";

const INDUSTRY_TYPES = ["All", "STEM", "Finance", "Healthcare", "Consulting", "Legal Tech", "Clean Tech"];
const LOCATIONS = [
  "All",
  "San Francisco, CA",
  "New York, NY",
  "Boston, MA",
  "Seattle, WA",
  "Austin, TX",
  "Chicago, IL",
  "Remote",
  "Los Angeles, CA",
  "Washington, DC"
];

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [industryType, setIndustryType] = useState("All");
  const [location, setLocation] = useState("All");
  const [salaryRange, setSalaryRange] = useState([80000, 200000]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Always fetch jobs regardless of auth status
  const { data: jobs = [], isLoading: isLoadingJobs, error: jobsError } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    retry: 1,
    onError: (error: Error) => {
      toast({
        title: "Error loading jobs",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  });

  // Only fetch applications if user is logged in
  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: !!user, // Only run query if user is logged in
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      if (!user) {
        throw new Error("You must be logged in to apply for jobs");
      }

      const now = new Date().toISOString();
      const res = await apiRequest(
        "POST",
        "/api/applications",
        {
          jobId,
          profileId: user.id,
          status: "Applied",
          appliedAt: now,
          applicationData: {
            submittedDate: now,
            source: "Pipeline Platform"
          },
          notes: "",
          statusHistory: [
            {
              status: "Applied",
              date: now
            }
          ],
          lastStatusUpdate: now
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit application");
      }

      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application submitted",
        description: "Your application has been successfully submitted."
      });
      setSelectedJob(null);
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      if (error.message.includes("must be logged in")) {
        navigate("/auth/login");
        toast({
          title: "Authentication required",
          description: "Please log in to apply for jobs",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  });

  const filteredJobs = jobs.filter((job) => {
    // First check if job is active
    if (!job.isActive) return false;

    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase()) ||
      job.jobIdentifier.toLowerCase().includes(search.toLowerCase());

    const matchesIndustry = industryType === "All" || job.type === industryType;
    const matchesLocation = location === "All" || job.location === location;

    return matchesSearch && matchesIndustry && matchesLocation;
  });

  // Show loading state
  if (isLoadingJobs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show error state if jobs failed to load
  if (jobsError) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-semibold">Unable to load jobs</h2>
          <p className="text-muted-foreground">Please try again later</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Jobs</h1>
          <div className="flex items-center gap-4">
            {user && <ApplicationCreditsCard />}
            <Input
              placeholder="Search jobs..."
              className="max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Filters Section */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select
                    value={industryType}
                    onValueChange={setIndustryType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={location}
                    onValueChange={setLocation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Salary Range</Label>
                  <div className="pt-2">
                    <Slider
                      min={80000}
                      max={200000}
                      step={10000}
                      value={salaryRange}
                      onValueChange={setSalaryRange}
                      className="my-4"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${salaryRange[0].toLocaleString()}</span>
                      <span>${salaryRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIndustryType("All");
                    setLocation("All");
                    setSalaryRange([80000, 200000]);
                    setSearch("");
                  }}
                >
                  Reset Filters
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Featured Companies</h2>
                {filteredJobs.slice(0, 3).map((job) => (
                  <CompanyCard key={job.id} job={job} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Jobs List Section */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Found {filteredJobs.length} active jobs
              </p>
            </div>

            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={() => applyMutation.mutate(job.id)}
                onViewDetails={() => setSelectedJob(job)}
                isApplying={applyMutation.isPending && selectedJob?.id === job.id}
                isApplied={user ? applications.some((app) => app.jobId === job.id) : false}
              />
            ))}

            {filteredJobs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No active jobs found matching your criteria. Try adjusting your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <JobModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={(jobId) => applyMutation.mutate(jobId)}
        isApplied={selectedJob && user ? applications.some((app) => app.jobId === selectedJob.id && app.status !== "Withdrawn") : false}
        isApplying={applyMutation.isPending}
        previouslyApplied={selectedJob && user ? applications.some((app) => app.jobId === selectedJob.id && app.status === "Withdrawn") : false}
      />
    </div>
  );
}