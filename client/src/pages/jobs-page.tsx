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
import { useState, useEffect } from "react";
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
const JOB_TYPES = ["All", "Full-time", "Part-time", "Contract", "Internship", "Remote"];
const EXPERIENCE_LEVELS = ["All", "Entry Level", "Mid Level", "Senior", "Executive"];
const DATE_POSTED = ["All", "Today", "Last 3 Days", "Last Week", "Last Month"];
const EDUCATION_LEVELS = ["All", "High School", "Associate", "Bachelor's", "Master's", "Doctorate"];

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [industryType, setIndustryType] = useState("All");
  const [location, setLocation] = useState("All");
  const [minSalary, setMinSalary] = useState<string>("");
  const [maxSalary, setMaxSalary] = useState<string>("");
  const [jobType, setJobType] = useState("All");
  const [experienceLevel, setExperienceLevel] = useState("All");
  const [datePosted, setDatePosted] = useState("All");
  const [education, setEducation] = useState("All");
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
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/jobs");
      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return res.json();
    },
    retry: 1
  });

  // Handle job fetch errors
  useEffect(() => {
    if (jobsError) {
      toast({
        title: "Error loading jobs",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [jobsError, toast]);

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

  // Type assertion to ensure jobs is treated as an array
  const filteredJobs = (Array.isArray(jobs) ? jobs : []).filter((job: Job) => {
    // First check if job is active
    if (!job.isActive) return false;

    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase()) ||
      job.jobIdentifier.toLowerCase().includes(search.toLowerCase());

    const matchesIndustry = industryType === "All" || job.type === industryType;
    const matchesLocation = location === "All" || job.location === location;
    
    // New filters
    const matchesJobType = jobType === "All" || 
      (job.type && job.type.toLowerCase().includes(jobType.toLowerCase()));
    
    const matchesExperienceLevel = experienceLevel === "All" || 
      (job.description && job.description.toLowerCase().includes(experienceLevel.toLowerCase()));
    
    // Education filter
    const matchesEducation = education === "All" || 
      (job.requirements && job.requirements.toLowerCase().includes(education.toLowerCase()));
    
    // Date posted filter
    let matchesDatePosted = true;
    if (datePosted !== "All" && job.lastCheckedAt) {
      const jobDate = new Date(job.lastCheckedAt);
      const now = new Date();
      const daysDifference = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 3600 * 24));
      
      switch (datePosted) {
        case "Today":
          matchesDatePosted = daysDifference < 1;
          break;
        case "Last 3 Days":
          matchesDatePosted = daysDifference <= 3;
          break;
        case "Last Week":
          matchesDatePosted = daysDifference <= 7;
          break;
        case "Last Month":
          matchesDatePosted = daysDifference <= 30;
          break;
      }
    }

    // Salary filter
    let matchesSalary = true;
    if (job.salary) {
      // Extract numeric value from salary string
      const salaryValue = parseInt(job.salary.replace(/[^0-9]/g, ''));
      
      if (!isNaN(salaryValue)) {
        const minSalaryValue = minSalary ? parseInt(minSalary) : 0;
        const maxSalaryValue = maxSalary ? parseInt(maxSalary) : Infinity;
        
        matchesSalary = salaryValue >= minSalaryValue && salaryValue <= maxSalaryValue;
      }
    }

    return matchesSearch && matchesIndustry && matchesLocation && 
           matchesJobType && matchesExperienceLevel && matchesDatePosted && 
           matchesSalary && matchesEducation;
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
      <div className="flex flex-col gap-6">
        {/* Header with title and credits */}
        <motion.div 
          className="flex items-center justify-between"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Jobs</h1>
          </div>
          {user && <ApplicationCreditsCard />}
        </motion.div>

        {/* Filters Section - Now at the top */}
        <motion.div 
          variants={itemVariants}
          className="w-full"
        >
          <Card className="overflow-hidden border border-gray-200/30 dark:border-gray-700/30">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 via-gray-50/10 to-gray-200/20 dark:from-gray-800/20 dark:via-gray-900/10 dark:to-gray-700/20" />
              <CardContent className="pt-6 pb-6 relative">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Filters</h2>
                </div>
                
                {/* Main search and location row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {/* Search - Larger */}
                  <div className="md:col-span-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Search job titles, companies, or keywords..."
                        className="pl-10 py-6 text-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="md:col-span-1">
                    <Select
                      value={location}
                      onValueChange={setLocation}
                    >
                      <SelectTrigger className="h-[52px]">
                        <SelectValue placeholder="Location" />
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
                </div>
                
                {/* Filter buttons row */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {/* Date Posted */}
                  <div className="w-auto">
                    <Select
                      value={datePosted}
                      onValueChange={setDatePosted}
                    >
                      <SelectTrigger className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-w-[140px]">
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-muted-foreground">Date posted</span>
                          <SelectValue placeholder="Any time" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_POSTED.map((date) => (
                          <SelectItem key={date} value={date}>
                            {date}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Job Type */}
                  <div className="w-auto">
                    <Select
                      value={jobType}
                      onValueChange={setJobType}
                    >
                      <SelectTrigger className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-w-[140px]">
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-muted-foreground">Job Type</span>
                          <SelectValue placeholder="Any type" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Company/Industry */}
                  <div className="w-auto">
                    <Select
                      value={industryType}
                      onValueChange={setIndustryType}
                    >
                      <SelectTrigger className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-w-[140px]">
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-muted-foreground">Company</span>
                          <SelectValue placeholder="Any company" />
                        </div>
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

                  {/* Experience Level */}
                  <div className="w-auto">
                    <Select
                      value={experienceLevel}
                      onValueChange={setExperienceLevel}
                    >
                      <SelectTrigger className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-w-[140px]">
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-muted-foreground">Experience</span>
                          <SelectValue placeholder="Any level" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Education */}
                  <div className="w-auto">
                    <Select
                      value={education}
                      onValueChange={setEducation}
                    >
                      <SelectTrigger className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-w-[140px]">
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-muted-foreground">Education</span>
                          <SelectValue placeholder="Any degree" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Salary Range - Now as direct input fields */}
                  <div className="w-auto flex gap-2">
                    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2">
                      <span className="text-xs text-muted-foreground block mb-1">Min Salary</span>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground mr-1">$</span>
                        <Input
                          type="number"
                          placeholder="No min"
                          value={minSalary}
                          onChange={(e) => setMinSalary(e.target.value)}
                          className="w-24 h-6 border-0 p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2">
                      <span className="text-xs text-muted-foreground block mb-1">Max Salary</span>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground mr-1">$</span>
                        <Input
                          type="number"
                          placeholder="No max"
                          value={maxSalary}
                          onChange={(e) => setMaxSalary(e.target.value)}
                          className="w-24 h-6 border-0 p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIndustryType("All");
                      setLocation("All");
                      setMinSalary("");
                      setMaxSalary("");
                      setSearch("");
                      setJobType("All");
                      setExperienceLevel("All");
                      setDatePosted("All");
                      setEducation("All");
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>

        {/* Jobs count */}
        <motion.div 
          className="flex justify-between items-center"
          variants={fadeInVariants}
        >
          <p className="text-sm text-muted-foreground">
            Found <span className="font-semibold text-foreground">{filteredJobs.length}</span> active jobs
          </p>
        </motion.div>

        {/* Jobs List Section - Now in 2 columns */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
        >
          {filteredJobs.map((job: Job, index: number) => (
            <motion.div
              key={job.id}
              variants={itemVariants}
              custom={index}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={cn("h-full")}
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
              className="text-center py-8 md:col-span-2"
              variants={fadeInVariants}
            >
              <p className="text-muted-foreground">
                No active jobs found matching your criteria. Try adjusting your filters.
              </p>
            </motion.div>
          )}
        </motion.div>
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