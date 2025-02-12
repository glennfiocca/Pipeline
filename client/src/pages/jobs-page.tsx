import { useQuery, useMutation } from "@tanstack/react-query";
import { JobCard } from "@/components/job-card";
import { CompanyCard } from "@/components/company-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Job, Application, type InsertApplication } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { JobModal } from "@/components/JobModal";

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

// Mock data for testing
const mockJobs: Job[] = [{
  id: 1,
  title: "Leveraged Finance Analyst",
  company: "J.P. Morgan",
  location: "New York, NY",
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
}];

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [industryType, setIndustryType] = useState("All");
  const [location, setLocation] = useState("All");
  const [salaryRange, setSalaryRange] = useState([80000, 200000]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { toast } = useToast();

  const { data: jobs = mockJobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["/api/profiles"],
  });

  const parseSalary = (salaryStr: string): [number, number] => {
    const matches = salaryStr.match(/\$(\d{1,3}(?:,\d{3})*)/g);
    if (!matches || matches.length !== 2) return [0, 0];
    return matches.map(s => parseInt(s.replace(/[$,]/g, ''))) as [number, number];
  };

  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      if (!profiles || !profiles.length) {
        throw new Error("Please create a profile before applying to jobs");
      }

      const application: InsertApplication = {
        jobId,
        profileId: profiles[0].id,
        status: "Applied",
        appliedAt: new Date().toISOString(),
        applicationData: {},
        statusHistory: [{ status: "Applied", date: new Date().toISOString() }],
        lastStatusUpdate: new Date().toISOString(),
      };

      const res = await apiRequest("POST", "/api/applications", application);
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

  const filteredJobs = jobs.filter((job) => {
    if (!job.isActive) return false;

    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase());

    const matchesIndustry = industryType === "All" || job.type === industryType;

    const matchesLocation = location === "All" || job.location === location;

    // For testing, let's consider the mock job always matches salary range
    const matchesSalary = true;

    return matchesSearch && matchesIndustry && matchesLocation && matchesSalary;
  });

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
                {jobs
                  .filter(job => job.isActive)
                  .slice(0, 3)
                  .map((job) => (
                    <CompanyCard key={job.id} job={job} />
                  ))}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Found {filteredJobs.length} active jobs
              </p>
            </div>

            {isLoading ? (
              <div>Loading...</div>
            ) : (
              filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={() => applyMutation.mutate(job.id)}
                  onViewDetails={() => setSelectedJob(job)}
                  isApplying={applyMutation.isPending && applyMutation.variables === job.id}
                  isApplied={applications.some((app) => app.jobId === job.id)}
                />
              ))
            )}

            {filteredJobs.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No active jobs found matching your criteria. Try adjusting your filters.
                </p>
              </div>
            )}

            <JobModal
              job={selectedJob}
              isOpen={!!selectedJob}
              onClose={() => setSelectedJob(null)}
              onApply={(jobId) => applyMutation.mutate(jobId)}
              isApplied={selectedJob ? applications.some((app) => app.jobId === selectedJob.id) : false}
              isApplying={applyMutation.isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}