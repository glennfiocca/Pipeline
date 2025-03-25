import { useQuery, useMutation } from "@tanstack/react-query";
import { JobCard } from "@/components/JobCard";
import { CompanyCard } from "@/components/company-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Job, Application, SavedJob } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { JobModal } from "@/components/JobModal";
import { Loader2, Search, Filter, Briefcase, Bookmark } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<string>("all");
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
  
  // Fetch saved jobs if user is logged in
  const { 
    data: savedJobs = [], 
    isLoading: isLoadingSavedJobs 
  } = useQuery<(SavedJob & { job: Job })[]>({
    queryKey: ["/api/saved-jobs"],
    enabled: !!user, // Only run query if user is logged in
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
  });
  
  // Check if a job is saved
  const isJobSaved = (jobId: number): boolean => {
    if (!user || !savedJobs.length) return false;
    return savedJobs.some(savedJob => savedJob.jobId === jobId);
  };
  
  // Mutation to save a job
  const saveJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      if (!user) {
        throw new Error("You must be logged in to save jobs");
      }

      const res = await apiRequest(
        "POST",
        "/api/saved-jobs",
        { jobId }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save job");
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-jobs"] });
      toast({
        title: "Job saved",
        description: "This job has been added to your saved jobs."
      });
    },
    onError: (error: Error) => {
      if (error.message.includes("must be logged in")) {
        navigate("/auth/login");
        toast({
          title: "Authentication required",
          description: "Please log in to save jobs",
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

  // Mutation to unsave a job
  const unsaveJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      if (!user) {
        throw new Error("You must be logged in to manage saved jobs");
      }

      const res = await apiRequest(
        "DELETE",
        `/api/saved-jobs/${jobId}`
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to remove saved job");
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-jobs"] });
      toast({
        title: "Job removed",
        description: "This job has been removed from your saved jobs."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle saving/unsaving a job
  const handleSaveJob = (jobId: number) => {
    if (isJobSaved(jobId)) {
      unsaveJobMutation.mutate(jobId);
    } else {
      saveJobMutation.mutate(jobId);
    }
  };

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

  const reportJobMutation = useMutation({
    mutationFn: async ({ jobId, reportType, comment }: { jobId: number; reportType: string; comment: string }) => {
      // Map report types to feedback categories
      const categoryMap: Record<string, string> = {
        "ghost_listing": "job_report_ghost",
        "duplicate": "job_report_duplicate",
        "misleading": "job_report_misleading",
        "inappropriate": "job_report_inappropriate",
        "other": "job_report_other"
      };
      
      const category = categoryMap[reportType] || "job_report_other";
      
      // Get a user-friendly report type label for the subject
      const reportTypeLabels: Record<string, string> = {
        "ghost_listing": "Ghost Listing",
        "duplicate": "Duplicate Listing",
        "misleading": "Misleading Information",
        "inappropriate": "Inappropriate Content",
        "other": "Other Issue"
      };
      
      // Get the job info from the jobs array
      const reportedJob = jobs.find(j => j.id === jobId);
      const jobIdentifier = reportedJob?.jobIdentifier || `Job #${jobId}`;
      const jobTitle = reportedJob?.title || 'Unknown Job';
      const companyName = reportedJob?.company || 'Unknown Company';
      
      // Create a detailed subject line
      const subject = `Report: ${reportTypeLabels[reportType] || reportType} - ${jobTitle}`;
      
      // Create feedback with comprehensive job reference in metadata
      const feedback = {
        rating: 1, // Low rating for reports
        subject,
        category,
        comment,
        status: "received",
        metadata: {
          jobId: String(jobId),
          reportType,
          jobIdentifier,
          jobTitle,
          companyName,
          reportTimestamp: new Date().toISOString()
        }
      };
      
      const res = await apiRequest("POST", "/api/feedback", feedback);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to report job");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Reported",
        description: "Thank you for your feedback. Our team will review this report.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to report job",
        variant: "destructive",
      });
    },
  });

  const handleReportJob = (jobId: number, reportType: string, comment: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to report jobs.",
        variant: "destructive",
      });
      return;
    }
    
    reportJobMutation.mutate({ 
      jobId,  // This is numeric and expected by the mutation function 
      reportType, 
      comment 
    });
  };

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
      className="container mx-auto px-4 py-2 max-w-7xl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Filters Section */}
      <motion.div 
        variants={itemVariants}
        className="w-full mb-4"
      >
        <Card className="overflow-hidden border border-gray-200/30 dark:border-gray-700/30 shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 via-gray-50/10 to-gray-200/20 dark:from-gray-800/20 dark:via-gray-900/10 dark:to-gray-700/20" />
            <CardContent className="p-4 relative">
              {/* Header and search row */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search job titles, companies, or keywords..."
                      className="pl-10 h-11 w-full"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={location}
                    onValueChange={setLocation}
                  >
                    <SelectTrigger className="h-11 min-w-[180px] bg-gray-50 dark:bg-gray-800/50">
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
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0"
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
                    title="Reset all filters"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </Button>
                </div>
              </div>
              
              {/* Advanced filters grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {/* Date Posted */}
                <div>
                  <Select
                    value={datePosted}
                    onValueChange={setDatePosted}
                  >
                    <SelectTrigger className="h-10 w-full bg-gray-50 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70">
                      <div className="flex flex-col items-start truncate">
                        <span className="text-xs text-muted-foreground">Date posted</span>
                        <SelectValue placeholder="Any time" className="text-sm" />
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
                <div>
                  <Select
                    value={jobType}
                    onValueChange={setJobType}
                  >
                    <SelectTrigger className="h-10 w-full bg-gray-50 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70">
                      <div className="flex flex-col items-start truncate">
                        <span className="text-xs text-muted-foreground">Job Type</span>
                        <SelectValue placeholder="Any type" className="text-sm" />
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
                <div>
                  <Select
                    value={industryType}
                    onValueChange={setIndustryType}
                  >
                    <SelectTrigger className="h-10 w-full bg-gray-50 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70">
                      <div className="flex flex-col items-start truncate">
                        <span className="text-xs text-muted-foreground">Industry</span>
                        <SelectValue placeholder="Any industry" className="text-sm" />
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
                <div>
                  <Select
                    value={experienceLevel}
                    onValueChange={setExperienceLevel}
                  >
                    <SelectTrigger className="h-10 w-full bg-gray-50 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70">
                      <div className="flex flex-col items-start truncate">
                        <span className="text-xs text-muted-foreground">Experience</span>
                        <SelectValue placeholder="Any level" className="text-sm" />
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
                <div>
                  <Select
                    value={education}
                    onValueChange={setEducation}
                  >
                    <SelectTrigger className="h-10 w-full bg-gray-50 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70">
                      <div className="flex flex-col items-start truncate">
                        <span className="text-xs text-muted-foreground">Education</span>
                        <SelectValue placeholder="Any degree" className="text-sm" />
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

                {/* Salary Range - Combined into one dropdown */}
                <div className="relative group">
                  <div className="h-10 w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/70 rounded-md px-3 py-1 cursor-pointer flex flex-col justify-center">
                    <span className="text-xs text-muted-foreground">Salary range</span>
                    <div className="text-sm truncate">
                      {minSalary || maxSalary ? 
                        `${minSalary ? '$'+minSalary : 'Any'} - ${maxSalary ? '$'+maxSalary : 'Any'}` : 
                        'Any range'}
                    </div>
                  </div>
                  
                  {/* Dropdown panel */}
                  <div className="absolute top-full left-0 mt-1 z-10 w-64 bg-white dark:bg-gray-900 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-3 hidden group-hover:block hover:block">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="min-salary" className="text-xs">Minimum salary</Label>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-muted-foreground mr-1">$</span>
                          <Input
                            id="min-salary"
                            type="number"
                            placeholder="No minimum"
                            value={minSalary}
                            onChange={(e) => setMinSalary(e.target.value)}
                            className="h-8"
                            min="0"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="max-salary" className="text-xs">Maximum salary</Label>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-muted-foreground mr-1">$</span>
                          <Input
                            id="max-salary"
                            type="number"
                            placeholder="No maximum"
                            value={maxSalary}
                            onChange={(e) => setMaxSalary(e.target.value)}
                            className="h-8"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Active filters display */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {search && (
                  <div className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1 flex items-center gap-1.5">
                    <span>"{search}"</span>
                    <button onClick={() => setSearch("")} className="hover:bg-primary/20 rounded-full p-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
                {location !== "All" && (
                  <div className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1 flex items-center gap-1.5">
                    <span>{location}</span>
                    <button onClick={() => setLocation("All")} className="hover:bg-primary/20 rounded-full p-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
                {datePosted !== "All" && (
                  <div className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1 flex items-center gap-1.5">
                    <span>{datePosted}</span>
                    <button onClick={() => setDatePosted("All")} className="hover:bg-primary/20 rounded-full p-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
                {jobType !== "All" && (
                  <div className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1 flex items-center gap-1.5">
                    <span>{jobType}</span>
                    <button onClick={() => setJobType("All")} className="hover:bg-primary/20 rounded-full p-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
                {industryType !== "All" && (
                  <div className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1 flex items-center gap-1.5">
                    <span>{industryType}</span>
                    <button onClick={() => setIndustryType("All")} className="hover:bg-primary/20 rounded-full p-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
                {experienceLevel !== "All" && (
                  <div className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1 flex items-center gap-1.5">
                    <span>{experienceLevel}</span>
                    <button onClick={() => setExperienceLevel("All")} className="hover:bg-primary/20 rounded-full p-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
                {education !== "All" && (
                  <div className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1 flex items-center gap-1.5">
                    <span>{education}</span>
                    <button onClick={() => setEducation("All")} className="hover:bg-primary/20 rounded-full p-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
                {(minSalary || maxSalary) && (
                  <div className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1 flex items-center gap-1.5">
                    <span>Salary: {minSalary ? '$'+minSalary : '$0'} - {maxSalary ? '$'+maxSalary : 'Any'}</span>
                    <button onClick={() => {setMinSalary(""); setMaxSalary("");}} className="hover:bg-primary/20 rounded-full p-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Jobs count and tabs */}
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4"
        variants={fadeInVariants}
      >
        <p className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">
            {activeTab === "saved" && user ? savedJobs.length : filteredJobs.length}
          </span> {activeTab === "saved" ? "saved" : "active"} jobs
        </p>
        
        {user && (
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-[400px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>All Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                <span>Saved Jobs</span>
                {savedJobs.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center rounded-full px-1.5 text-xs">
                    {savedJobs.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </motion.div>

      {/* Jobs List Section - Now in 3 columns */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        variants={containerVariants}
      >
        {activeTab === "all" && filteredJobs.map((job: Job, index: number) => (
          <motion.div
            key={job.id}
            variants={itemVariants}
            custom={index}
            whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
            transition={{ type: "spring", stiffness: 400 }}
            className={cn("h-full")}
          >
            <JobCard
              job={job}
              onApply={() => applyMutation.mutate(job.id)}
              onViewDetails={() => setSelectedJob(job)}
              onSaveJob={() => handleSaveJob(job.id)}
              onReportJob={(reportType, comment) => handleReportJob(job.id, reportType, comment)}
              isApplying={applyMutation.isPending && selectedJob?.id === job.id}
              isApplied={user ? applications.some((app) => app.jobId === job.id) : false}
              previouslyApplied={user ? applications.some((app) => app.jobId === job.id && app.status === "Withdrawn") : false}
              isSaved={isJobSaved(job.id)}
            />
          </motion.div>
        ))}
        
        {activeTab === "saved" && user && savedJobs.map((savedJob, index) => (
          <motion.div
            key={savedJob.jobId}
            variants={itemVariants}
            custom={index}
            whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
            transition={{ type: "spring", stiffness: 400 }}
            className={cn("h-full")}
          >
            <JobCard
              job={savedJob.job}
              onApply={() => applyMutation.mutate(savedJob.jobId)}
              onViewDetails={() => setSelectedJob(savedJob.job)}
              onSaveJob={() => handleSaveJob(savedJob.jobId)}
              onReportJob={(reportType, comment) => handleReportJob(savedJob.jobId, reportType, comment)}
              isApplying={applyMutation.isPending && selectedJob?.id === savedJob.jobId}
              isApplied={applications.some((app) => app.jobId === savedJob.jobId)}
              previouslyApplied={applications.some((app) => app.jobId === savedJob.jobId && app.status === "Withdrawn")}
              isSaved={true}
            />
          </motion.div>
        ))}

        {activeTab === "all" && filteredJobs.length === 0 && (
          <motion.div 
            className="text-center py-8 md:col-span-2 lg:col-span-3"
            variants={fadeInVariants}
          >
            <p className="text-muted-foreground">
              No active jobs found matching your criteria. Try adjusting your filters.
            </p>
          </motion.div>
        )}
        
        {activeTab === "saved" && (savedJobs.length === 0 || !user) && (
          <motion.div 
            className="text-center py-8 md:col-span-2 lg:col-span-3"
            variants={fadeInVariants}
          >
            <p className="text-muted-foreground">
              {!user ? "Please log in to save jobs." : "You haven't saved any jobs yet."}
            </p>
            {user && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setActiveTab("all")}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Browse Jobs
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>

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