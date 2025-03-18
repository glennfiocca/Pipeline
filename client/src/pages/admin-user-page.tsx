import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Profile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, ArrowLeft, User as UserIcon, Mail, CreditCard, Calendar, FileText, Trash2, Send, NotebookIcon, ArrowRightIcon, FileDown, Search, CheckCircle2, XCircle, PlusCircle, AlertCircle, Clock, CalendarIcon, ListTodo, FileEdit, Save, CheckIcon } from "lucide-react";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { useState, useRef, useEffect } from "react";
import { ManageCreditsDialog } from "@/components/ManageCreditsDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { NewUserForm } from "@/components/NewUserForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Add these interfaces at the top of the file, after imports
interface Application {
  id: number;
  jobId: number;
  profileId: number;
  userId: number;
  status: string;
  appliedAt: string;
  coverLetter?: string;
  applicationData: any;
  lastStatusUpdate: string;
  statusHistory: Array<{ status: string; date: string }>;
  notes?: string;
  nextStep?: string;
  nextStepDueDate?: string;
}

interface Job {
  id: number;
  title: string;
  company: string;
  isActive: boolean;
}

// Add this interface for multiple next steps
interface NextStep {
  id: string; // Using string IDs for new steps
  description: string;
  dueDate?: string;
  completed?: boolean;
}

// Add a new function to parse next steps from string format
const parseNextSteps = (stepText?: string, dueDate?: string): NextStep[] => {
  if (!stepText) return [];
  
  // If the stepText contains bullet points or numbered lists, split by those
  if (stepText.includes('•') || /^\d+\.\s/.test(stepText)) {
    const steps = stepText.split(/(?:^|\n)(?:•|\d+\.\s)/m)
      .filter(step => step.trim().length > 0)
      .map((step, index) => ({
        id: `step-${Date.now()}-${index}`,
        description: step.trim(),
        dueDate: dueDate || undefined,
        completed: false
      }));
    return steps;
  }
  
  // Otherwise treat as a single step
  return [{
    id: `step-${Date.now()}`,
    description: stepText.trim(),
    dueDate: dueDate || undefined,
    completed: false
  }];
};

// Add a new function to format next steps back to string
const formatNextStepsToString = (steps: NextStep[]): string => {
  if (steps.length === 0) return '';
  if (steps.length === 1) return steps[0].description;
  
  // Format as bullet points if multiple steps
  return steps.map(step => `• ${step.description}`).join('\n');
};

export default function AdminUserPage() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showManageCreditsDialog, setShowManageCreditsDialog] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationDetailsDialogOpen, setApplicationDetailsDialogOpen] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(undefined);
  
  // Add search state for applications
  const [applicationsSearch, setApplicationsSearch] = useState("");
  
  const editUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setShowEditUserDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const manageUserCreditsMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/users/${userId}/credits`,
        { amount }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update user credits");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      toast({
        title: "Success",
        description: "User credits updated successfully",
      });
      setShowManageCreditsDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user credits",
        variant: "destructive",
      });
    },
  });
  
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/admin/users/${userId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to fetch user:", errorData);
        return null;
      }
      return res.json();
    },
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery<Profile>({
    queryKey: [`/api/admin/profiles/${userId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/profiles/${userId}`);
      if (!res.ok) {
        return null;
      }
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["/api/admin/applications", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/applications");
      if (!res.ok) {
        throw new Error("Failed to fetch applications");
      }
      const data = await res.json();
      return data.filter((app: Application) => 
        app.profileId === Number(userId) || 
        app.userId === Number(userId)
      );
    },
    enabled: !!userId,
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/jobs");
      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return res.json();
    },
    enabled: !!userId,
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setLocation("/admin/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleExportUserPdf = async () => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate the PDF.",
      });

      if (!user || !profile) {
        throw new Error("User or profile data not found");
      }
      
      // Create a new PDF document
      const doc = new jsPDF();
      const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
      
      // Add title and timestamp
      doc.setFontSize(20);
      doc.text("User Profile", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${timestamp}`, 14, 30);
      
      // Add user info
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`${user.username} (${user.email})`, 14, 40);
      
      // Add profile sections
      doc.setFontSize(12);
      let yPos = 50;
      
      // User Information
      doc.setFontSize(14);
      doc.text("User Information", 14, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.text(`Username: ${user.username}`, 14, yPos); yPos += 6;
      doc.text(`Email: ${user.email}`, 14, yPos); yPos += 6;
      doc.text(`Credits: ${user.bankedCredits} banked credits`, 14, yPos); yPos += 6;
      doc.text(`Admin: ${user.isAdmin ? 'Yes' : 'No'}`, 14, yPos); yPos += 6;
      if (user.createdAt) {
        doc.text(`Joined: ${format(new Date(user.createdAt), "MMM d, yyyy")}`, 14, yPos); 
        yPos += 6;
      }
      
      // Personal Information
      if (profile) {
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Personal Information", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        if (profile.name) doc.text(`Name: ${profile.name}`, 14, yPos); yPos += 6;
        if (profile.email) doc.text(`Email: ${profile.email}`, 14, yPos); yPos += 6;
        if (profile.phone) doc.text(`Phone: ${profile.phone}`, 14, yPos); yPos += 6;
        if (profile.title) doc.text(`Title: ${profile.title}`, 14, yPos); yPos += 6;
        if (profile.location) doc.text(`Location: ${profile.location}`, 14, yPos); yPos += 6;
        if (profile.bio) {
          doc.text("Bio:", 14, yPos); yPos += 6;
          const bioLines = doc.splitTextToSize(profile.bio, 180);
          doc.text(bioLines, 14, yPos);
          yPos += bioLines.length * 6 + 4;
        }
        
        // Address
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Address", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        const address = [
          profile.address,
          profile.city,
          profile.state,
          profile.zipCode,
          profile.country
        ].filter(Boolean).join(", ");
        
        if (address) {
          doc.text(`Address: ${address}`, 14, yPos);
          yPos += 6;
        }
        
        // Work Information
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Work Information", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        if (profile.workAuthorization) doc.text(`Work Authorization: ${profile.workAuthorization}`, 14, yPos); yPos += 6;
        if (profile.availability) doc.text(`Availability: ${profile.availability}`, 14, yPos); yPos += 6;
        if (profile.citizenshipStatus) doc.text(`Citizenship Status: ${profile.citizenshipStatus}`, 14, yPos); yPos += 6;
        if (profile.visaSponsorship !== undefined) doc.text(`Visa Sponsorship: ${profile.visaSponsorship ? 'Yes' : 'No'}`, 14, yPos); yPos += 6;
        if (profile.willingToRelocate !== undefined) doc.text(`Willing to Relocate: ${profile.willingToRelocate ? 'Yes' : 'No'}`, 14, yPos); yPos += 6;
        if (profile.salaryExpectation) doc.text(`Salary Expectation: ${profile.salaryExpectation}`, 14, yPos); yPos += 6;
        
        if (profile.preferredLocations && Array.isArray(profile.preferredLocations) && profile.preferredLocations.length > 0) {
          doc.text(`Preferred Locations: ${profile.preferredLocations.join(", ")}`, 14, yPos);
          yPos += 6;
        }
        
        // Skills
        if (profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0) {
          yPos += 4;
          doc.setFontSize(14);
          doc.text("Skills", 14, yPos);
          yPos += 8;
          
          doc.setFontSize(12);
          const skillsText = profile.skills.join(", ");
          
          if (skillsText) {
            const splitSkills = doc.splitTextToSize(skillsText, 180);
            doc.text(splitSkills, 14, yPos);
            yPos += splitSkills.length * 6 + 4;
          }
        }
        
        // Check if we need a new page for education
        if (yPos > 250 && profile.education && Array.isArray(profile.education) && profile.education.length > 0) {
          doc.addPage();
          yPos = 20;
        }
        
        // Education
        if (profile.education && Array.isArray(profile.education) && profile.education.length > 0) {
          yPos += 4;
          doc.setFontSize(14);
          doc.text("Education", 14, yPos);
          yPos += 8;
          
          doc.setFontSize(12);
          profile.education.forEach((edu) => {
            if (edu.institution) doc.text(`Institution: ${edu.institution}`, 14, yPos); yPos += 6;
            if (edu.degree) doc.text(`Degree: ${edu.degree}`, 14, yPos); yPos += 6;
            if (edu.field) doc.text(`Field: ${edu.field}`, 14, yPos); yPos += 6;
            if (edu.startDate) doc.text(`Start Date: ${edu.startDate}`, 14, yPos); yPos += 6;
            if (edu.endDate) doc.text(`End Date: ${edu.endDate}`, 14, yPos); yPos += 6;
            if (edu.isPresent) doc.text(`Current: Yes`, 14, yPos); yPos += 6;
            if (edu.gpa) doc.text(`GPA: ${edu.gpa}`, 14, yPos); yPos += 6;
            if (edu.description) {
              const splitDesc = doc.splitTextToSize(`Description: ${edu.description}`, 180);
              doc.text(splitDesc, 14, yPos);
              yPos += splitDesc.length * 6;
            }
            yPos += 4;
          });
        }
      }
      
      // Save the PDF
      const fileName = `${user.username}_profile_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Profile exported successfully",
        description: `Saved as ${fileName}`,
      });
    } catch (error) {
      console.error("Error exporting profile:", error);
      toast({
        title: "Failed to export profile",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ 
      applicationId, 
      status,
      notes,
      nextStep,
      nextStepDueDate
    }: { 
      applicationId: number; 
      status?: string;
      notes?: string;
      nextStep?: string;
      nextStepDueDate?: string | null;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/applications/${applicationId}`, { 
        status,
        notes,
        nextStep,
        nextStepDueDate
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update application");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications", userId] });
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
      setApplicationDetailsDialogOpen(false);
      setSelectedDueDate(undefined);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingUser || isLoadingProfile || isLoadingJobs) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">User not found</h2>
            <p className="text-muted-foreground mb-4">The requested user could not be found.</p>
            <Button onClick={() => setLocation("/admin/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/admin/dashboard")}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-3xl font-bold">User Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-muted-foreground mr-3" />
              <div>
                <div className="font-medium">{user.username}</div>
                {user.isAdmin && (
                  <Badge variant="outline" className="mt-1">
                    Administrator
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-muted-foreground mr-3" />
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div>{user.email}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-muted-foreground mr-3" />
              <div>
                <div className="text-sm text-muted-foreground">Credits</div>
                <div>{user.bankedCredits} banked credits</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-muted-foreground mr-3" />
              <div>
                <div className="text-sm text-muted-foreground">Joined</div>
                <div>{user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "Unknown"}</div>
              </div>
            </div>

            <Separator className="my-4" />
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditUserDialog(true)}>
                Edit User
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowManageCreditsDialog(true)}>
                Manage Credits
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportUserPdf}>
                <FileDown className="h-4 w-4 mr-1" /> Export PDF
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete the user and all associated data.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteUserMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile">
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                {profile ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-sm text-muted-foreground">Full Name</div>
                          <div>{profile.name || "Not provided"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Phone</div>
                          <div>{profile.phone || "Not provided"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Location</div>
                          <div>{profile.location || "Not provided"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Title</div>
                          <div>{profile.title || "Not provided"}</div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Online Profiles</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-sm text-muted-foreground">LinkedIn</div>
                          <div>{profile.linkedinUrl || "Not provided"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">GitHub</div>
                          <div>{profile.githubUrl || "Not provided"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Portfolio</div>
                          <div>{profile.portfolioUrl || "Not provided"}</div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Bio</h3>
                      <p className="text-sm">{profile.bio || "No bio provided"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>User has not created a profile yet</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="applications">
                {applications.length > 0 ? (
                  <div className="space-y-3">
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search applications by job title or company..."
                          className="pl-9"
                          value={applicationsSearch}
                          onChange={(e) => setApplicationsSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {applications
                      .filter((app: Application) => {
                        const job = jobs.find((j: Job) => j.id === app.jobId);
                        if (!job) return false;
                        
                        return (
                          applicationsSearch === "" || 
                          job.title.toLowerCase().includes(applicationsSearch.toLowerCase()) ||
                          job.company.toLowerCase().includes(applicationsSearch.toLowerCase()) ||
                          app.status.toLowerCase().includes(applicationsSearch.toLowerCase())
                        );
                      })
                      .map((app: Application) => {
                        const job = jobs.find((j: Job) => j.id === app.jobId);
                        return (
                          <Card key={app.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{job?.title || "Unknown Job"}</h4>
                                  <p className="text-sm text-muted-foreground">{job?.company || "Unknown Company"}</p>
                                  <div className="flex items-center mt-1">
                                    <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      Applied on {format(new Date(app.appliedAt), "MMM d, yyyy")}
                                    </span>
                                  </div>
                                  {job && !job.isActive && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      Job Archived
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Select 
                                    defaultValue={app.status}
                                    onValueChange={(value) => {
                                      updateApplicationStatusMutation.mutate({
                                        applicationId: app.id,
                                        status: value
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-[140px]">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Applied">Applied</SelectItem>
                                      <SelectItem value="Interviewing">Interviewing</SelectItem>
                                      <SelectItem value="Accepted">Accepted</SelectItem>
                                      <SelectItem value="Rejected">Rejected</SelectItem>
                                      <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Badge className={app.status === "Applied" ? "bg-blue-500/10 text-blue-500" : 
                                                app.status === "Interviewing" ? "bg-purple-500/10 text-purple-500" :
                                                app.status === "Accepted" ? "bg-green-500/10 text-green-500" :
                                                app.status === "Rejected" ? "bg-red-500/10 text-red-500" :
                                                "bg-gray-500/10 text-gray-500"}>
                                    {app.status}
                                  </Badge>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex items-center gap-1 mt-1 w-full"
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setSelectedJob(job);
                                      setChatDialogOpen(true);
                                    }}
                                  >
                                    <Send className="h-3 w-3" />
                                    Chat with User
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex items-center gap-1 mt-1 w-full"
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setSelectedJob(job);
                                      setApplicationDetailsDialogOpen(true);
                                      setSelectedDueDate(undefined);
                                    }}
                                  >
                                    <NotebookIcon className="h-3 w-3" />
                                    Edit Details
                                  </Button>
                                </div>
                              </div>
                              
                              {app.notes && (
                                <div className="mt-3 text-sm bg-muted/50 p-3 rounded-md space-y-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                      <NotebookIcon className="h-5 w-5 text-primary" />
                                      Internal Notes
                                    </h3>
                                    <Button variant="ghost" size="sm" className="h-8 gap-1">
                                      <FileEdit className="h-4 w-4" />
                                      Edit
                                    </Button>
                                  </div>
                                  
                                  <Textarea 
                                    placeholder="Add internal notes about this application"
                                    value={app.notes}
                                    onChange={(e) => {
                                      updateApplicationStatusMutation.mutate({
                                        applicationId: app.id,
                                        notes: e.target.value
                                      });
                                    }}
                                    className="min-h-[120px]"
                                  />
                                  
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    <p>Use <kbd className="px-1 py-0.5 bg-muted rounded">!</kbd> for important notes and <kbd className="px-1 py-0.5 bg-muted rounded">?</kbd> for questions. These will be highlighted for admins.</p>
                                  </div>
                                </div>
                              )}
                              
                              {app.nextStep && (
                                <div className="mt-2 text-sm bg-primary/5 p-3 rounded-md space-y-2">
                                  <div className="font-medium flex items-center gap-1.5">
                                    <ArrowRightIcon className="h-4 w-4 text-primary" />
                                    Next Steps:
                                  </div>
                                  {app.nextStep.split(/(?:^|\n)(?:•|\d+\.\s)/m)
                                    .filter(step => step.trim().length > 0)
                                    .map((step, index) => (
                                      <div 
                                        key={index}
                                        className="flex items-start gap-2 p-2 rounded bg-background/50"
                                      >
                                        <div className="mt-0.5">
                                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-xs font-medium text-primary">{index + 1}</span>
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">{step.trim()}</p>
                                          {app.nextStepDueDate && index === 0 && (
                                            <div className="flex items-center gap-1 mt-1 text-xs">
                                              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                              <span className="text-muted-foreground">
                                                Due: {format(new Date(app.nextStepDueDate), "MMM d, yyyy")}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  }
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No applications found</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="documents">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Resume</h3>
                    {profile?.resumeUrl ? (
                      <Button variant="outline" size="sm">
                        View Resume
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">No resume uploaded</p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Academic Transcript</h3>
                    {profile?.transcriptUrl ? (
                      <Button variant="outline" size="sm">
                        View Transcript
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">No transcript uploaded</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          {user && (
            <NewUserForm
              initialData={user}
              onSubmit={(data) => {
                editUserMutation.mutate(data);
              }}
              onCancel={() => {
                setShowEditUserDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {user && (
        <ManageCreditsDialog
          isOpen={showManageCreditsDialog}
          onClose={() => setShowManageCreditsDialog(false)}
          user={user}
          onConfirm={(amount) => {
            manageUserCreditsMutation.mutate(amount);
          }}
        />
      )}
      
      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedJob ? `Chat - ${selectedJob.title} at ${selectedJob.company}` : 'Chat'}
            </DialogTitle>
            <DialogDescription>
              Chat with {user?.username || 'user'} about their application
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && selectedJob && (
            <MessageThread 
              applicationId={selectedApplication.id} 
              companyName={selectedJob.company} 
              username={user?.username || ''} 
              queryClient={queryClient}
            />
          )}
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setChatDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Application Details Dialog */}
      {applicationDetailsDialogOpen && selectedApplication && selectedJob && (
        <Dialog open={applicationDetailsDialogOpen} onOpenChange={(open) => {
          setApplicationDetailsDialogOpen(open);
          if (!open) {
            // Reset the selectedDueDate when closing the dialog
            setSelectedDueDate(undefined);
          }
        }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                {selectedJob.title} at {selectedJob.company}
              </DialogDescription>
            </DialogHeader>
            
            {/* Add state for multiple next steps */}
            {(() => {
              // Use an IIFE to handle local state within JSX
              const [nextSteps, setNextSteps] = useState<NextStep[]>(() => 
                parseNextSteps(selectedApplication.nextStep, selectedApplication.nextStepDueDate)
              );
              const [activeNotes, setActiveNotes] = useState(selectedApplication.notes || '');
              
              // Function to add a new next step
              const addNextStep = () => {
                setNextSteps([
                  ...nextSteps,
                  {
                    id: `step-${Date.now()}`,
                    description: '',
                    completed: false
                  }
                ]);
              };
              
              // Function to remove a next step
              const removeNextStep = (id: string) => {
                setNextSteps(nextSteps.filter(step => step.id !== id));
              };
              
              // Function to update a next step
              const updateNextStep = (id: string, data: Partial<NextStep>) => {
                setNextSteps(nextSteps.map(step => 
                  step.id === id ? { ...step, ...data } : step
                ));
              };
              
              // Function to handle saving the application details
              const handleSave = () => {
                // Format the next steps back to string
                const nextStepString = formatNextStepsToString(nextSteps);
                
                // Get the due date from the first next step (for backward compatibility)
                const nextStepDueDate = nextSteps.length > 0 && nextSteps[0].dueDate ? 
                  nextSteps[0].dueDate : null;
                
                updateApplicationStatusMutation.mutate({
                  applicationId: selectedApplication.id,
                  notes: activeNotes,
                  nextStep: nextStepString,
                  nextStepDueDate
                });
              };
              
              return (
                <div className="space-y-6 py-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <NotebookIcon className="h-5 w-5 text-primary" />
                        Internal Notes
                      </h3>
                      <Button variant="ghost" size="sm" className="h-8 gap-1">
                        <FileEdit className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                    
                    <Textarea 
                      placeholder="Add internal notes about this application"
                      value={activeNotes}
                      onChange={(e) => setActiveNotes(e.target.value)}
                      className="min-h-[120px]"
                    />
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Use <kbd className="px-1 py-0.5 bg-muted rounded">!</kbd> for important notes and <kbd className="px-1 py-0.5 bg-muted rounded">?</kbd> for questions. These will be highlighted for admins.</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ListTodo className="h-5 w-5 text-primary" />
                        Next Steps
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1"
                        onClick={addNextStep}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add Step
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {nextSteps.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                          No next steps defined yet
                        </div>
                      ) : (
                        nextSteps.map((step, index) => (
                          <div 
                            key={step.id}
                            className="border rounded-lg p-3 space-y-3 bg-background relative"
                          >
                            <div className="absolute top-2 right-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => removeNextStep(step.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium mb-1.5 block">
                                Step {index + 1}
                              </label>
                              <div className="flex items-start gap-2">
                                <div className="mt-2">
                                  <button 
                                    type="button"
                                    onClick={() => updateNextStep(step.id, { completed: !step.completed })}
                                    className={cn(
                                      "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                      step.completed 
                                        ? "bg-primary border-primary text-primary-foreground" 
                                        : "border-muted-foreground/30 hover:border-primary"
                                    )}
                                  >
                                    {step.completed && <CheckIcon className="h-3 w-3" />}
                                  </button>
                                </div>
                                <Input 
                                  value={step.description}
                                  onChange={(e) => updateNextStep(step.id, { description: e.target.value })}
                                  placeholder="Describe the next step..."
                                  className="flex-1"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Due Date
                              </label>
                              <Input 
                                type="date"
                                value={step.dueDate ? new Date(step.dueDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => updateNextStep(step.id, { 
                                  dueDate: e.target.value ? new Date(e.target.value + 'T00:00:00').toISOString() : undefined 
                                })}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setApplicationDetailsDialogOpen(false);
                      setSelectedDueDate(undefined);
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={updateApplicationStatusMutation.isPending}
                      className="gap-1.5"
                    >
                      {updateApplicationStatusMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface Message {
  id: number;
  applicationId: number;
  content: string;
  isFromAdmin: boolean;
  isRead: boolean;
  createdAt: string;
  senderUsername: string;
}

interface MessageThreadProps {
  applicationId: number;
  companyName: string;
  username: string;
  queryClient: any;
}

function MessageThread({ applicationId, companyName, username, queryClient }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const queryKey = [`/api/applications/${applicationId}/messages`];

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/applications/${applicationId}/messages`);
      if (!res.ok) {
        return [];
      }
      return res.json();
    },
    refetchInterval: 10000, // Auto-refresh messages every 10 seconds
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const messageData = {
        applicationId,
        content,
        isFromAdmin: true,
        senderUsername: companyName
      };

      const response = await apiRequest(
        "POST",
        `/api/applications/${applicationId}/messages`,
        messageData
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData([queryKey], (old: Message[] | undefined) => [...(old || []), newMessage]);
      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await sendMessageMutation.mutateAsync(newMessage.trim());
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
    }
  };

  const formatMessageDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, h:mm a");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="h-[400px] flex flex-col">
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  message.content && (
                    <div
                      key={message.id}
                      className={cn(
                        "p-4 rounded-lg",
                        message.isFromAdmin
                          ? "bg-primary text-primary-foreground ml-8"
                          : "bg-muted mr-8"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">
                          {message.isFromAdmin ? companyName : username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t">
          <div className="flex items-end gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message as the employer..."
              className="min-h-[80px] flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 