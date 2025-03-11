import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, Job, Profile, User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Users, Mail, User as UserIcon, Edit, Trash2, Plus, CreditCard, FileDown, Eye, FileText, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewJobForm } from "@/components/NewJobForm";
import { NewUserForm } from "@/components/NewUserForm";
import type { z } from 'zod';
import { insertJobSchema, insertUserSchema } from "@shared/schema";
import { ApplicationsManagement } from "@/components/ApplicationsManagement";
import { FeedbackManagement } from "@/components/FeedbackManagement";
import { ManageCreditsDialog } from "@/components/ManageCreditsDialog";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
type NewJobForm = z.infer<typeof insertJobSchema>;
type NewUserForm = z.infer<typeof insertUserSchema>;
type SelectedUserCredits = {
  user: User;
  action: 'manage_credits';
} | null;
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditJobDialog, setShowEditJobDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [selectedUserCredits, setSelectedUserCredits] = useState<SelectedUserCredits>(null);
  const [selectedUserDocuments, setSelectedUserDocuments] = useState<{ user: User; profile: any } | null>(null);
  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: true,
    select: (data) => data.sort((a, b) => {
      if (a.isActive === b.isActive) {
        return new Date(b.lastCheckedAt).getTime() - new Date(a.lastCheckedAt).getTime();
      }
      return a.isActive ? -1 : 1;
    })
  });
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: true
  });
  const createJobMutation = useMutation({
    mutationFn: async (formInput: NewJobForm) => {
      try {
        const formData = {
          ...formInput,
          jobIdentifier: formInput.jobIdentifier || `PL${Math.floor(100000 + Math.random() * 900000)}`,
          source: formInput.source || "Pipeline",
          sourceUrl: formInput.sourceUrl || window.location.origin,
          isActive: formInput.isActive ?? true,
          lastCheckedAt: new Date().toISOString()
        };
        console.log('Submitting job data:', JSON.stringify(formData, null, 2));
        const res = await apiRequest("POST", "/api/jobs", formData);
        if (!res.ok) {
          const error = await res.text();
          console.error('Job creation failed:', error);
          try {
            const errorJson = JSON.parse(error);
            throw new Error(errorJson.message || "Failed to create job");
          } catch (e) {
            throw new Error(`Failed to create job: ${error}`);
          }
        }
        const data = await res.json();
        return data;
      } catch (error: unknown) {
        const err = error as Error;
        console.error('Job creation error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      setShowNewJobDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    },
  });
  const createUserMutation = useMutation({
    mutationFn: async (data: NewUserForm) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setShowNewUserDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const editJobMutation = useMutation({
    mutationFn: async (data: Partial<Job>) => {
      if (!selectedJob && !data.id) throw new Error("No job selected");
      const jobId = data.id || selectedJob?.id;
      const updateData = {
        ...data,
        deactivatedAt: data.isActive === false ? new Date().toISOString() : null
      };
      const res = await apiRequest("PATCH", `/api/admin/jobs/${jobId}`, updateData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update job");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      setShowEditJobDialog(false);
      setSelectedJob(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const editUserMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (!selectedUser) throw new Error("No user selected");
      const res = await apiRequest("PATCH", `/api/admin/users/${selectedUser.id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setShowEditUserDialog(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const deleteJobMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/jobs/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete job");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
    },
  });
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
  });
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditUserDialog(true);
  };
  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setShowEditJobDialog(true);
  };
  const manageUserCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: number; amount: number }) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User credits updated successfully",
      });
      setSelectedUserCredits(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const handleExportProfile = async (userId: number) => {
    try {
      toast({
        title: "Exporting profile...",
        description: "Please wait while we generate the PDF.",
      });
      
      // Fetch the user's profile
      const response = await apiRequest("GET", `/api/admin/profiles/${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      
      const profile = await response.json();
      
      // Get the user details
      const user = users.find(u => u.id === userId);
      
      if (!profile || !user) {
        throw new Error("Profile or user not found");
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
      
      // Personal Information
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
      
      if (profile.preferredLocations && profile.preferredLocations.length > 0) {
        doc.text(`Preferred Locations: ${profile.preferredLocations.join(", ")}`, 14, yPos);
        yPos += 6;
      }
      
      // Document Links
      yPos += 4;
      doc.setFontSize(14);
      doc.text("Documents", 14, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      if (profile.resumeUrl) {
        doc.text("Resume: Available in user profile", 14, yPos);
        yPos += 6;
      } else {
        doc.text("Resume: Not provided", 14, yPos);
        yPos += 6;
      }
      
      if (profile.transcriptUrl) {
        doc.text("Academic Transcript: Available in user profile", 14, yPos);
        yPos += 6;
      } else {
        doc.text("Academic Transcript: Not provided", 14, yPos);
        yPos += 6;
      }
      
      // Add instructions for accessing documents
      yPos += 4;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("To view documents: Click the 'eye' icon on the user's card in the admin dashboard", 14, yPos);
      yPos += 5;
      doc.text("to open the document viewer and access the resume and transcript files.", 14, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      yPos += 8;
      
      // Online Profiles
      yPos += 4;
      doc.setFontSize(14);
      doc.text("Online Profiles", 14, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      if (profile.linkedinUrl) {
        doc.text("LinkedIn: ", 14, yPos);
        doc.setTextColor(0, 0, 255);
        doc.text(profile.linkedinUrl, 50, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;
      }
      
      if (profile.portfolioUrl) {
        doc.text("Portfolio: ", 14, yPos);
        doc.setTextColor(0, 0, 255);
        doc.text(profile.portfolioUrl, 50, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;
      }
      
      if (profile.githubUrl) {
        doc.text("GitHub: ", 14, yPos);
        doc.setTextColor(0, 0, 255);
        doc.text(profile.githubUrl, 50, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;
      }
      
      // Skills
      if (profile.skills && profile.skills.length > 0) {
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Skills", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        const skillsText = Array.isArray(profile.skills) 
          ? profile.skills.join(", ") 
          : typeof profile.skills === 'string' 
            ? profile.skills 
            : '';
        
        if (skillsText) {
          const splitSkills = doc.splitTextToSize(skillsText, 180);
          doc.text(splitSkills, 14, yPos);
          yPos += splitSkills.length * 6 + 4;
        }
      }
      
      // Languages
      if (profile.languages && profile.languages.length > 0) {
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Languages", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        profile.languages.forEach((lang: any) => {
          const langText = `${lang.language} (${lang.proficiency})`;
          doc.text(langText, 14, yPos);
          yPos += 6;
        });
        yPos += 4;
      }
      
      // Check if we need a new page for education
      if (yPos > 250 && profile.education && profile.education.length > 0) {
        doc.addPage();
        yPos = 20;
      }
      
      // Education
      if (profile.education && profile.education.length > 0) {
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Education", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        profile.education.forEach((edu: any) => {
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
      
      // Check if we need a new page for experience
      if (yPos > 250 && profile.experience && profile.experience.length > 0) {
        doc.addPage();
        yPos = 20;
      }
      
      // Experience
      if (profile.experience && profile.experience.length > 0) {
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Experience", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        profile.experience.forEach((exp: any) => {
          if (exp.company) doc.text(`Company: ${exp.company}`, 14, yPos); yPos += 6;
          if (exp.position) doc.text(`Position: ${exp.position}`, 14, yPos); yPos += 6;
          if (exp.startDate) doc.text(`Start Date: ${exp.startDate}`, 14, yPos); yPos += 6;
          if (exp.endDate) doc.text(`End Date: ${exp.endDate}`, 14, yPos); yPos += 6;
          if (exp.isPresent) doc.text(`Current: Yes`, 14, yPos); yPos += 6;
          if (exp.description) {
            const splitDesc = doc.splitTextToSize(`Description: ${exp.description}`, 180);
            doc.text(splitDesc, 14, yPos);
            yPos += splitDesc.length * 6;
          }
          yPos += 4;
        });
      }
      
      // Check if we need a new page for certifications
      if (yPos > 250 && profile.certifications && profile.certifications.length > 0) {
        doc.addPage();
        yPos = 20;
      }
      
      // Certifications
      if (profile.certifications && profile.certifications.length > 0) {
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Certifications", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        profile.certifications.forEach((cert: any) => {
          if (cert.name) doc.text(`Name: ${cert.name}`, 14, yPos); yPos += 6;
          if (cert.issuer) doc.text(`Issuer: ${cert.issuer}`, 14, yPos); yPos += 6;
          if (cert.issueDate) doc.text(`Issue Date: ${cert.issueDate}`, 14, yPos); yPos += 6;
          if (cert.expiryDate) doc.text(`Expiry Date: ${cert.expiryDate}`, 14, yPos); yPos += 6;
          if (cert.credentialId) doc.text(`Credential ID: ${cert.credentialId}`, 14, yPos); yPos += 6;
          if (cert.credentialUrl) {
            doc.text(`Credential URL: `, 14, yPos);
            doc.setTextColor(0, 0, 255);
            doc.text(cert.credentialUrl, 80, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 6;
          }
          yPos += 4;
        });
      }
      
      // Check if we need a new page for publications
      if (yPos > 250 && profile.publications && profile.publications.length > 0) {
        doc.addPage();
        yPos = 20;
      }
      
      // Publications
      if (profile.publications && profile.publications.length > 0) {
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Publications", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        profile.publications.forEach((pub: any) => {
          if (pub.title) doc.text(`Title: ${pub.title}`, 14, yPos); yPos += 6;
          if (pub.publisher) doc.text(`Publisher: ${pub.publisher}`, 14, yPos); yPos += 6;
          if (pub.publicationDate) doc.text(`Publication Date: ${pub.publicationDate}`, 14, yPos); yPos += 6;
          if (pub.authors) doc.text(`Authors: ${pub.authors}`, 14, yPos); yPos += 6;
          if (pub.description) {
            const splitDesc = doc.splitTextToSize(`Description: ${pub.description}`, 180);
            doc.text(splitDesc, 14, yPos);
            yPos += splitDesc.length * 6;
          }
          if (pub.url) {
            doc.text(`URL: `, 14, yPos);
            doc.setTextColor(0, 0, 255);
            doc.text(pub.url, 40, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 6;
          }
          yPos += 4;
        });
      }
      
      // Check if we need a new page for projects
      if (yPos > 250 && profile.projects && profile.projects.length > 0) {
        doc.addPage();
        yPos = 20;
      }
      
      // Projects
      if (profile.projects && profile.projects.length > 0) {
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Projects", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        profile.projects.forEach((proj: any) => {
          if (proj.name) doc.text(`Name: ${proj.name}`, 14, yPos); yPos += 6;
          if (proj.role) doc.text(`Role: ${proj.role}`, 14, yPos); yPos += 6;
          if (proj.startDate) doc.text(`Start Date: ${proj.startDate}`, 14, yPos); yPos += 6;
          if (proj.endDate) doc.text(`End Date: ${proj.endDate}`, 14, yPos); yPos += 6;
          if (proj.description) {
            const splitDesc = doc.splitTextToSize(`Description: ${proj.description}`, 180);
            doc.text(splitDesc, 14, yPos);
            yPos += splitDesc.length * 6;
          }
          if (proj.url) {
            doc.text(`URL: `, 14, yPos);
            doc.setTextColor(0, 0, 255);
            doc.text(proj.url, 40, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 6;
          }
          if (proj.technologies && proj.technologies.length > 0) {
            doc.text(`Technologies: ${proj.technologies.join(", ")}`, 14, yPos); 
            yPos += 6;
          }
          if (proj.achievements && proj.achievements.length > 0) {
            doc.text(`Achievements: ${proj.achievements.join(", ")}`, 14, yPos); 
            yPos += 6;
          }
          yPos += 4;
        });
      }
      
      // Check if we need a new page for military info
      if (yPos > 250 && (profile.veteranStatus || profile.militaryBranch || profile.militaryServiceDates)) {
        doc.addPage();
        yPos = 20;
      }
      
      // Military Information
      if (profile.veteranStatus || profile.militaryBranch || profile.militaryServiceDates) {
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Military Information", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        if (profile.veteranStatus) doc.text(`Veteran Status: ${profile.veteranStatus}`, 14, yPos); yPos += 6;
        if (profile.militaryBranch) doc.text(`Military Branch: ${profile.militaryBranch}`, 14, yPos); yPos += 6;
        if (profile.militaryServiceDates) doc.text(`Service Dates: ${profile.militaryServiceDates}`, 14, yPos); yPos += 6;
      }
      
      // Security Clearance
      if (profile.securityClearance || profile.clearanceType || profile.clearanceExpiry) {
        yPos += 4;
        doc.setFontSize(14);
        doc.text("Security Clearance", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        if (profile.securityClearance) doc.text(`Security Clearance: ${profile.securityClearance}`, 14, yPos); yPos += 6;
        if (profile.clearanceType) doc.text(`Clearance Type: ${profile.clearanceType}`, 14, yPos); yPos += 6;
        if (profile.clearanceExpiry) doc.text(`Clearance Expiry: ${profile.clearanceExpiry}`, 14, yPos); yPos += 6;
      }
      
      // Check if we need a new page for references
      if (yPos > 250 && profile.referenceList && profile.referenceList.length > 0) {
        doc.addPage();
        yPos = 20;
      }
      
      // References
      if (profile.referenceList && profile.referenceList.length > 0) {
        yPos += 4;
        doc.setFontSize(14);
        doc.text("References", 14, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        profile.referenceList.forEach((ref: any) => {
          if (ref.name) doc.text(`Name: ${ref.name}`, 14, yPos); yPos += 6;
          if (ref.title) doc.text(`Title: ${ref.title}`, 14, yPos); yPos += 6;
          if (ref.company) doc.text(`Company: ${ref.company}`, 14, yPos); yPos += 6;
          if (ref.email) doc.text(`Email: ${ref.email}`, 14, yPos); yPos += 6;
          if (ref.phone) doc.text(`Phone: ${ref.phone}`, 14, yPos); yPos += 6;
          if (ref.relationship) doc.text(`Relationship: ${ref.relationship}`, 14, yPos); yPos += 6;
          yPos += 4;
        });
      }
      
      // Save the PDF
      const fileName = `${user.username}_profile_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Profile exported successfully",
        description: `Saved as ${fileName}`,
        variant: "success",
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

  // Helper function to convert PDF data to a data URI
  const getDataUri = async (pdfData: Uint8Array): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(new Blob([pdfData], { type: 'application/pdf' }));
    });
  };

  if (isLoadingJobs || isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      <Tabs defaultValue="active-jobs" className="space-y-4">
        <TabsList className="mb-4">
          <TabsTrigger value="active-jobs">Active Jobs</TabsTrigger>
          <TabsTrigger value="archived-jobs">Archived Jobs</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="user-view">User View</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="active-jobs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Active Jobs Management</CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowNewJobDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.filter(job => job.isActive).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <h3 className="font-medium">
                        {job.title}
                        <span className="ml-2 text-sm text-muted-foreground">
                          (ID: {job.jobIdentifier})
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {job.company} - {job.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => editJobMutation.mutate({ id: job.id, isActive: false })}
                      >
                        Archive
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditJob(job)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Job</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this job? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteJobMutation.mutate(job.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="archived-jobs">
          <Card>
            <CardHeader>
              <CardTitle>Archived Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.filter(job => !job.isActive).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <h3 className="font-medium">
                        {job.title}
                        <span className="ml-2 text-sm text-muted-foreground">
                          (ID: {job.jobIdentifier})
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {job.company} - {job.location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Archived on: {job.deactivatedAt ? format(new Date(job.deactivatedAt), "MMM d, yyyy") : "Unknown"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => editJobMutation.mutate({ id: job.id, isActive: true })}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditJob(job)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Job</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this archived job? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteJobMutation.mutate(job.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {jobs.filter(job => !job.isActive).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No archived jobs found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>
                Users Management 
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({users.length} users)
                </span>
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowNewUserDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((user) => (
                  <Card key={user.id} className="overflow-hidden w-auto">
                    <CardContent className="p-3">
                      <div className="flex items-center mb-1.5">
                        <UserIcon className="h-5 w-5 text-muted-foreground mr-2" />
                        <span className="font-medium text-base">{user.username}</span>
                        {user.isAdmin && (
                          <Badge variant="outline" className="ml-2 text-xs py-0">
                            Admin
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        <div className="flex items-center mb-1">
                          <Mail className="h-4 w-4 mr-2" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          <span>{user.bankedCredits} banked credits</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-start mt-1.5 border-t pt-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 mr-1.5"
                          onClick={() => setSelectedUserCredits({ user, action: 'manage_credits' })}
                          title="Manage Credits"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 mr-1.5"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 mr-1.5"
                          onClick={async () => {
                            try {
                              const profileResponse = await apiRequest("GET", `/api/admin/profiles/${user.id}`);
                              if (profileResponse.ok) {
                                const profile = await profileResponse.json();
                                setSelectedUserDocuments({ user, profile });
                              } else {
                                toast({
                                  title: "Error",
                                  description: "Could not fetch user documents",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Error fetching user documents:", error);
                              toast({
                                title: "Error",
                                description: "Could not fetch user documents",
                                variant: "destructive",
                              });
                            }
                          }}
                          title="View Documents & Export Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the user and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUserMutation.mutate(user.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="user-view">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>
                User View
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({users.length} users)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <Card 
                    key={user.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
                    onClick={() => {
                      setLocation(`/admin/users/${user.id}`);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center mb-2">
                        <UserIcon className="h-5 w-5 text-muted-foreground mr-2" />
                        <span className="font-medium text-base">{user.username}</span>
                        {user.isAdmin && (
                          <Badge variant="outline" className="ml-2 text-xs py-0">
                            Admin
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        <div className="flex items-center mb-1">
                          <Mail className="h-4 w-4 mr-2" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          <span>{user.bankedCredits} banked credits</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end mt-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="applications">
          <ApplicationsManagement />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackManagement />
        </TabsContent>
      </Tabs>
      <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Add a new job listing to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <NewJobForm
              onSubmit={async (data) => {
                createJobMutation.mutate(data);
              }}
              onCancel={() => setShowNewJobDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform.
            </DialogDescription>
          </DialogHeader>
          <NewUserForm
            onSubmit={(data) => {
              createUserMutation.mutate(data);
            }}
            onCancel={() => setShowNewUserDialog(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={showEditJobDialog} onOpenChange={setShowEditJobDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>
              Update job listing information.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <NewJobForm
              initialData={selectedJob}
              onSubmit={(data) => {
                editJobMutation.mutate(data);
              }}
              onCancel={() => {
                setShowEditJobDialog(false);
                setSelectedJob(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <NewUserForm
            initialData={selectedUser}
            onSubmit={(data) => {
              editUserMutation.mutate(data);
            }}
            onCancel={() => {
              setShowEditUserDialog(false);
              setSelectedUser(null);
            }}
          />
        </DialogContent>
      </Dialog>
      {selectedUserCredits && (
        <ManageCreditsDialog
          isOpen={true}
          onClose={() => setSelectedUserCredits(null)}
          user={selectedUserCredits.user}
          onConfirm={(amount) => {
            manageUserCreditsMutation.mutate({
              userId: selectedUserCredits.user.id,
              amount
            });
          }}
        />
      )}
      {selectedUserDocuments && (
        <Dialog open={!!selectedUserDocuments} onOpenChange={() => setSelectedUserDocuments(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Documents for {selectedUserDocuments.user.username}</DialogTitle>
              <DialogDescription>
                View and download user documents
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Resume</h3>
                {selectedUserDocuments.profile.resumeUrl ? (
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-muted-foreground">Resume document</span>
                      <a 
                        href={selectedUserDocuments.profile.resumeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-500 hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Open in new tab
                      </a>
                    </div>
                    <div className="aspect-[16/9] w-full bg-muted rounded-md overflow-hidden">
                      <iframe 
                        src={selectedUserDocuments.profile.resumeUrl} 
                        className="w-full h-full" 
                        title="Resume"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No resume uploaded</p>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Academic Transcript</h3>
                {selectedUserDocuments.profile.transcriptUrl ? (
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-muted-foreground">Transcript document</span>
                      <a 
                        href={selectedUserDocuments.profile.transcriptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-500 hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Open in new tab
                      </a>
                    </div>
                    <div className="aspect-[16/9] w-full bg-muted rounded-md overflow-hidden">
                      <iframe 
                        src={selectedUserDocuments.profile.transcriptUrl} 
                        className="w-full h-full" 
                        title="Academic Transcript"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No transcript uploaded</p>
                )}
              </div>
              
              {/* Additional documents could be added here */}
              
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedUserDocuments(null)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => handleExportProfile(selectedUserDocuments.user.id)}
                >
                  Export Profile PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}