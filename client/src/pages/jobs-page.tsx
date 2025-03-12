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
import { Loader2, Search, Filter, Briefcase } from "lucide-react";
import { ApplicationCreditsCard } from "@/components/ApplicationCreditsCard";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

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
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  // Show error state if jobs failed to load
  if (jobsError) {
    return (
      <div className="container py-10">
        <motion.div 
          className="flex flex-col items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold">Unable to load jobs</h2>
          <p className="text-muted-foreground">Please try again later</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-10 max-w-7xl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col gap-8">
        <motion.div 
          className="flex items-center justify-between"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Jobs</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && <ApplicationCreditsCard />}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                className="max-w-sm pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Filters Section */}
          <motion.div 
            className="space-y-6"
            variants={itemVariants}
          >
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="overflow-hidden border border-gray-200/30 dark:border-gray-700/30">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 via-gray-50/10 to-gray-200/20 dark:from-gray-800/20 dark:via-gray-900/10 dark:to-gray-700/20" />
                  <CardContent className="pt-6 space-y-4 relative">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="h-4 w-4 text-primary" />
                      <h2 className="font-semibold">Filters</h2>
                    </div>
                    
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
                </div>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="overflow-hidden border border-gray-200/30 dark:border-gray-700/30">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 via-gray-50/10 to-gray-200/20 dark:from-gray-800/20 dark:via-gray-900/10 dark:to-gray-700/20" />
                  <CardContent className="pt-6 relative">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                      Featured Companies
                    </h2>
                    <div className="space-y-4">
                      {filteredJobs.slice(0, 3).map((job) => (
                        <CompanyCard key={job.id} job={job} />
                      ))}
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Jobs List Section */}
          <motion.div 
            className="md:col-span-2 space-y-6"
            variants={itemVariants}
          >
            <motion.div 
              className="flex justify-between items-center"
              variants={fadeInVariants}
            >
              <p className="text-sm text-muted-foreground">
                Found <span className="font-semibold text-foreground">{filteredJobs.length}</span> active jobs
              </p>
            </motion.div>

            <motion.div 
              className="space-y-6"
              variants={containerVariants}
            >
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  variants={itemVariants}
                  custom={index}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <JobCard
                    job={job}
                    onApply={() => applyMutation.mutate(job.id)}
                    onViewDetails={() => setSelectedJob(job)}
                    isApplying={applyMutation.isPending && selectedJob?.id === job.id}
                    isApplied={user ? applications.some((app) => app.jobId === job.id) : false}
                  />
                </motion.div>
              ))}

              {filteredJobs.length === 0 && (
                <motion.div 
                  className="text-center py-8"
                  variants={fadeInVariants}
                >
                  <p className="text-muted-foreground">
                    No active jobs found matching your criteria. Try adjusting your filters.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
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
    </motion.div>
  );
}