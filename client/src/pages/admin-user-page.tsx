import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Profile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, ArrowLeft, User as UserIcon, Mail, CreditCard, Calendar, FileText, Trash2, Send, NotebookIcon, ArrowRightIcon, FileDown, Search } from "lucide-react";
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
                <TabsTrigger value="messages">Messages</TabsTrigger>
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
                                                app.status === "Interviewing" ? "bg-yellow-500/10 text-yellow-500" :
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
                                <div className="mt-3 text-sm bg-muted/50 p-2 rounded-md">
                                  <div className="font-medium">Notes:</div>
                                  <p className="text-muted-foreground">{app.notes}</p>
                                </div>
                              )}
                              
                              {app.nextStep && (
                                <div className="mt-2 text-sm bg-primary/5 p-2 rounded-md">
                                  <div className="font-medium">Next Step:</div>
                                  <p className="text-muted-foreground">
                                    {app.nextStep}
                                    {app.nextStepDueDate && (
                                      <span className="ml-2 text-xs bg-background px-1.5 py-0.5 rounded-full">
                                        Due: {format(new Date(app.nextStepDueDate), "MMM d, yyyy")}
                                      </span>
                                    )}
                                  </p>
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

              <TabsContent value="messages">
                <div className="flex flex-col h-[500px]">
                  <div className="flex-1 overflow-hidden" ref={scrollRef}>
                    <ScrollArea className="h-full">
                      <div className="space-y-4 p-4">
                        {applications.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">
                            No applications found for this user. Messages are tied to applications.
                          </p>
                        ) : (
                          applications.map((app: Application) => {
                            const job = jobs.find((j: Job) => j.id === app.jobId);
                            if (!job) return null;
                            
                            return (
                              <div key={app.id} className="mb-8">
                                <h3 className="text-lg font-medium mb-2">
                                  Messages for {job.title} at {job.company}
                                </h3>
                                <MessageThread 
                                  applicationId={app.id} 
                                  companyName={job.company} 
                                  username={user.username} 
                                  queryClient={queryClient}
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                {selectedJob.title} at {selectedJob.company}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notes</h4>
                <Textarea 
                  placeholder="Add notes about this application"
                  defaultValue={selectedApplication.notes || ""}
                  className="min-h-[100px]"
                  id="application-notes"
                />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Next Step</h4>
                <Input 
                  placeholder="e.g., Schedule interview, Check references"
                  defaultValue={selectedApplication.nextStep || ""}
                  id="next-step"
                />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Due Date for Next Step</h4>
                <div className="w-[280px]">
                  <Input
                    type="date"
                    id="next-step-due-date"
                    value={selectedDueDate ? 
                      selectedDueDate.toISOString().split('T')[0] : 
                      (selectedApplication.nextStepDueDate ? 
                        new Date(selectedApplication.nextStepDueDate).toISOString().split('T')[0] : 
                        '')}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDueDate(new Date(e.target.value + 'T00:00:00'));
                      } else {
                        setSelectedDueDate(undefined);
                      }
                    }}
                  />
                </div>
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
                onClick={() => {
                  const notesElement = document.getElementById('application-notes') as HTMLTextAreaElement;
                  const nextStepElement = document.getElementById('next-step') as HTMLInputElement;
                  const nextStepDueDateElement = document.getElementById('next-step-due-date') as HTMLInputElement;
                  
                  // Use the selectedDueDate state or get it from the input field
                  const nextStepDueDate = nextStepDueDateElement.value ? 
                    new Date(nextStepDueDateElement.value + 'T00:00:00').toISOString() : null;
                  
                  updateApplicationStatusMutation.mutate({
                    applicationId: selectedApplication.id,
                    notes: notesElement?.value,
                    nextStep: nextStepElement?.value,
                    nextStepDueDate
                  });
                }}
                disabled={updateApplicationStatusMutation.isPending}
              >
                {updateApplicationStatusMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
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