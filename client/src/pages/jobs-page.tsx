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
import { Job, Application, Profile } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { JobModal } from "@/components/JobModal";

// Sample industry types and locations
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
export const mockJobs: Job[] = [
  {
    id: 1,
    title: "Senior Software Engineer",
    company: "Google",
    location: "Mountain View, CA",
    type: "Full-Time",
    salary: "$200k-$350k/yr",
    description: "Join our team to work on cutting-edge technology that impacts billions of users...",
    requirements: "Bachelor's degree in Computer Science;5+ years of experience in software development;Strong coding skills in multiple languages",
    source: "Google Careers",
    sourceUrl: "https://careers.google.com",
    published: true,
    isActive: true,
    lastCheckedAt: new Date().toISOString(),
    deactivatedAt: null
  },
  {
    id: 2,
    title: "Leveraged Finance Analyst",
    company: "J.P. Morgan",
    location: "New York, NY",
    type: "Full-Time",
    salary: "$225k/yr",
    description: "A global leader in investment banking, consumer and small business banking, commercial banking, financial...",
    requirements: "Bachelor's degree in Engineering, Economics, Finance, Business Administration, Accounting, or related field;2+ years of experience in investment finance or related occupation;Strong analytical and problem-solving skills",
    source: "Bloomberg",
    sourceUrl: "https://bloomberg.com/careers",
    published: true,
    isActive: true,
    lastCheckedAt: new Date().toISOString(),
    deactivatedAt: null
  },
  {
    id: 3,
    title: "Product Manager",
    company: "Meta",
    location: "Menlo Park, CA",
    type: "Full-Time",
    salary: "$180k-$250k/yr",
    description: "Shape the future of social connection by leading product development at Meta...",
    requirements: "5+ years of product management experience;Experience with consumer products;Strong analytical and communication skills",
    source: "Meta Careers",
    sourceUrl: "https://metacareers.com",
    published: true,
    isActive: true,
    lastCheckedAt: new Date().toISOString(),
    deactivatedAt: null
  },
  {
    id: 4,
    title: "Data Scientist",
    company: "Netflix",
    location: "Los Gatos, CA",
    type: "Full-Time",
    salary: "$170k-$280k/yr",
    description: "Help shape the future of entertainment by leveraging data to drive decisions...",
    requirements: "PhD or Master's in Computer Science, Statistics, or related field;3+ years of experience with machine learning;Expert in Python and SQL",
    source: "Netflix Jobs",
    sourceUrl: "https://jobs.netflix.com",
    published: true,
    isActive: true,
    lastCheckedAt: new Date().toISOString(),
    deactivatedAt: null
  },
  {
    id: 5,
    title: "Cloud Solutions Architect",
    company: "Amazon Web Services",
    location: "Seattle, WA",
    type: "Full-Time",
    salary: "$160k-$270k/yr",
    description: "Design and implement scalable cloud solutions for enterprise customers...",
    requirements: "Bachelor's degree in Computer Science or related field;5+ years of experience with cloud platforms;Strong system design skills",
    source: "AWS Careers",
    sourceUrl: "https://aws.amazon.com/careers",
    published: true,
    isActive: true,
    lastCheckedAt: new Date().toISOString(),
    deactivatedAt: null
  },
  {
    id: 6,
    title: "Machine Learning Engineer",
    company: "OpenAI",
    location: "San Francisco, CA",
    type: "Full-Time",
    salary: "$200k-$400k/yr",
    description: "Work on cutting-edge AI research and development to advance artificial general intelligence...",
    requirements: "PhD in Computer Science, Machine Learning, or related field;Strong background in deep learning;Publications in top-tier conferences",
    source: "OpenAI Careers",
    sourceUrl: "https://openai.com/careers",
    published: true,
    isActive: true,
    lastCheckedAt: new Date().toISOString(),
    deactivatedAt: null
  },
  {
    id: 7,
    title: "VP of Machine Learning",
    company: "Scale AI",
    location: "San Francisco, CA",
    type: "Full-Time",
    salary: "$300k-$500k/yr",
    description: "Scale AI is seeking a visionary VP of Machine Learning to lead our AI initiatives. You'll drive the development of cutting-edge ML solutions, oversee a team of talented engineers, and shape the future of AI infrastructure.",
    requirements: "Ph.D. in Computer Science, Machine Learning, or related field;10+ years of experience in ML/AI;Proven track record of leading large-scale AI initiatives;Strong publication record in top-tier conferences",
    source: "Scale AI Careers",
    sourceUrl: "https://scale.ai/careers",
    published: true,
    isActive: true,
    lastCheckedAt: new Date().toISOString(),
    deactivatedAt: null
  }
];

// Pre-populate the jobs cache
queryClient.setQueryData(["/api/jobs"], mockJobs);

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [industryType, setIndustryType] = useState("All");
  const [location, setLocation] = useState("All");
  const [salaryRange, setSalaryRange] = useState([80000, 200000]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { toast } = useToast();

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    placeholderData: mockJobs,
    staleTime: Infinity, // Never mark the data as stale
    cacheTime: Infinity, // Keep the data cached indefinitely
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"]
  });

  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ["/api/profiles"]
  });

  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      if (!profiles || !profiles.length) {
        throw new Error("Please create a profile before applying to jobs");
      }

      const res = await apiRequest(
        "POST",
        "/api/applications",
        {
          jobId,
          profileId: profiles[0].id,
          status: "Applied",
          appliedAt: new Date().toISOString(),
          applicationData: {},
          statusHistory: [{ status: "Applied", date: new Date().toISOString() }],
          lastStatusUpdate: new Date().toISOString()
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
        description: "Your application has been successfully submitted."
      });
      setSelectedJob(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const filteredJobs = jobs.filter((job) => {
    if (!job.isActive) return false;

    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase());

    const matchesIndustry = industryType === "All" || job.type === industryType;
    const matchesLocation = location === "All" || job.location === location;
    const matchesSalary = true; // For testing purposes

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

            {isLoading ? (
              <div>Loading...</div>
            ) : (
              filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={() => applyMutation.mutate(job.id)}
                  onViewDetails={() => setSelectedJob(job)}
                  isApplying={applyMutation.isPending && selectedJob?.id === job.id}
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
          </div>
        </div>
      </div>

      <JobModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={(jobId) => applyMutation.mutate(jobId)}
        isApplied={selectedJob ? applications.some((app) => app.jobId === selectedJob.id) : false}
        isApplying={applyMutation.isPending}
      />
    </div>
  );
}