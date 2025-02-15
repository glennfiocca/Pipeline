import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, Job, Profile, User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { MessageDialog } from "@/components/MessageDialog";
import { Users, Mail, User as UserIcon, Edit, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormRegister, FieldErrors } from "react-hook-form";
import { insertJobSchema, insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import * as z from 'zod';
import type { SubmitHandler } from "react-hook-form";

type ApplicationUpdateForm = {
  status?: string;
  notes?: string;
  nextStep?: string;
  nextStepDueDate?: string;
};

type JobUpdateForm = {
  title?: string;
  company?: string;
  description?: string;
  salary?: string;
  location?: string;
  requirements?: string;
  type?: string;
  isActive?: boolean;
};

type UserUpdateForm = {
  username?: string;
  email?: string;
  isAdmin?: boolean;
};

type NewJobForm = z.infer<typeof insertJobSchema>;
type NewUserForm = z.infer<typeof insertUserSchema>;

type FormFields = {
  register: UseFormRegister<any>;
  formState: { errors: FieldErrors<any> };
};

export default function AdminDashboardPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState<ApplicationUpdateForm>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobFormData, setJobFormData] = useState<JobUpdateForm>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<UserUpdateForm>({});
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);

  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ["/api/admin/applications"],
    enabled: !!user?.isAdmin,
    retry: false
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user?.isAdmin,
    retry: false
  });

  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery<Profile[]>({
    queryKey: ["/api/admin/profiles"],
    enabled: !!user?.isAdmin,
    retry: false
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
    retry: false
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ApplicationUpdateForm }) => {
      const res = await apiRequest("PATCH", `/api/admin/applications/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update application");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({
        title: "Application updated",
        description: "The application has been updated successfully.",
      });
      setSelectedApplication(null);
      setFormData({});
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: JobUpdateForm }) => {
      const res = await apiRequest("PATCH", `/api/admin/jobs/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update job");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job updated",
        description: "The job has been updated successfully.",
      });
      setSelectedJob(null);
      setJobFormData({});
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
        const error = await res.json();
        throw new Error(error.message || "Failed to delete job");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job deleted",
        description: "The job has been deleted successfully.",
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

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UserUpdateForm }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      setSelectedUser(null);
      setUserFormData({});
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "The user has been permanently deleted.",
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

  const UserCard = ({ user }: { user: User }) => {
    const profile = profiles.find(p => p.email.toLowerCase() === user.email.toLowerCase());

    return (
      <div key={user.id} className="p-4 rounded-lg border space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="font-medium flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              {user.username}
              {user.isAdmin && (
                <Badge variant="secondary" className="ml-2">
                  Admin
                </Badge>
              )}
            </div>
            {profile ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                {profile.name || 'No name provided'}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                No profile found
              </div>
            )}
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedUser(user)}
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
                  <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p className="font-medium text-destructive">
                      ⚠️ This action cannot be undone!
                    </p>
                    <p>
                      Are you absolutely sure you want to delete the account for {user.username}?
                      This will permanently remove:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>User account and authentication details</li>
                      <li>Associated profile information</li>
                      <li>All application history</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteUserMutation.mutate(user.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    );
  };

  const JobCard = ({ job }: { job: Job }) => (
    <div
      key={job.id}
      className="flex items-center justify-between p-4 rounded-lg border"
    >
      <div>
        <h3 className="font-medium">{job.title}</h3>
        <p className="text-sm text-muted-foreground">
          {job.company} - {job.location}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSelectedJob(job)}
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
              <AlertDialogTitle>Delete Job Listing</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p className="font-medium text-destructive">
                  ⚠️ This action cannot be undone!
                </p>
                <p>
                  Are you absolutely sure you want to delete this job listing for {job.title} at {job.company}?
                  This will permanently remove:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Job listing details</li>
                  <li>Associated applications</li>
                  <li>All related messages and communication history</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteJobMutation.mutate(job.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Job
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  if (!user || isLoadingUsers || isLoadingProfiles || isLoadingApps || isLoadingJobs) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user.isAdmin) {
    setLocation("/");
    return null;
  }

  const handleInputChange = (field: keyof ApplicationUpdateForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!selectedApplication || Object.keys(formData).length === 0) return;
    updateApplicationMutation.mutate({
      id: selectedApplication.id,
      data: formData
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return "bg-blue-500/10 text-blue-500";
      case "interviewing":
        return "bg-yellow-500/10 text-yellow-500";
      case "accepted":
        return "bg-green-500/10 text-green-500";
      case "rejected":
        return "bg-red-500/10 text-red-500";
      case "withdrawn":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const stats = {
    "Total Users": users.length,
    "Total Applications": applications.length,
    "Applied": applications.filter(app => app.status.toLowerCase() === "applied").length,
    "Interviewing": applications.filter(app => app.status.toLowerCase() === "interviewing").length,
    "Accepted": applications.filter(app => app.status.toLowerCase() === "accepted").length,
    "Rejected": applications.filter(app => app.status.toLowerCase() === "rejected").length,
    "Withdrawn": applications.filter(app => app.status.toLowerCase() === "withdrawn").length,
  };

  const handleJobInputChange = (field: keyof JobUpdateForm, value: string | boolean) => {
    setJobFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleJobSubmit = () => {
    if (!selectedJob || Object.keys(jobFormData).length === 0) return;
    updateJobMutation.mutate({
      id: selectedJob.id,
      data: jobFormData
    });
  };

  const handleUserInputChange = (field: keyof UserUpdateForm, value: string | boolean) => {
    setUserFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserSubmit = () => {
    if (!selectedUser || Object.keys(userFormData).length === 0) return;
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: userFormData
    });
  };

  const createJobMutation = useMutation({
    mutationFn: async (data: NewJobForm) => {
      const res = await apiRequest("POST", "/api/jobs", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create job");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job created",
        description: "The job has been created successfully.",
      });
      setShowNewJobDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: NewUserForm) => {
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User created",
        description: "The user has been created successfully.",
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


  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
            {Object.entries(stats).map(([status, count]) => (
              <Card
                key={status}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedStatus === status && "ring-2 ring-primary"
                }`}
                onClick={() => setSelectedStatus(status)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{status}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedStatus === "Total Users" ? (
            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User List
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {users.map((user) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            selectedStatus && selectedStatus !== "Total Users" && (
              <Card className="mt-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Applications
                      {selectedStatus && (
                        <span className="text-sm font-normal ml-2">
                          ({selectedStatus})
                        </span>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {applications
                        .filter(app => !selectedStatus ||
                          selectedStatus === "Total Applications" ||
                          app.status.toLowerCase() === selectedStatus.toLowerCase()
                        )
                        .map((application) => {
                          const job = jobs.find(j => j.id === application.jobId);
                          const profile = profiles.find(p => p.id === application.profileId);
                          if (!job || !profile) return null;

                          return (
                            <div
                              key={application.id}
                              className="p-4 rounded-lg border space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {job.title}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {job.company} - {job.location}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Applied by: {profile.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Applied on {format(new Date(application.appliedAt), "MMM d, yyyy")}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge className={getStatusColor(application.status)}>
                                    {application.status}
                                  </Badge>
                                  <MessageDialog
                                    applicationId={application.id}
                                    jobTitle={job.title}
                                    company={job.company}
                                    isAdmin={true}
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedApplication(application)}
                                  >
                                    Manage
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )
          )}

          {selectedApplication && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
              <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
                <h2 className="text-lg font-semibold">Update Application Status</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      defaultValue={selectedApplication.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Interviewing">Interviewing</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      defaultValue={selectedApplication.notes || ""}
                      placeholder="Add notes about the application..."
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Next Step</label>
                    <Input
                      defaultValue={selectedApplication.nextStep || ""}
                      placeholder="e.g., Technical Interview"
                      onChange={(e) => handleInputChange('nextStep', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Next Step Due Date</label>
                    <Input
                      type="date"
                      defaultValue={selectedApplication.nextStepDueDate?.split("T")[0] || ""}
                      onChange={(e) => handleInputChange('nextStepDueDate', e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedApplication(null);
                        setFormData({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={Object.keys(formData).length === 0 || updateApplicationMutation.isPending}
                    >
                      {updateApplicationMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="database">
          <div className="space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Jobs Management</CardTitle>
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
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Users Management</CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewUserDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Job</DialogTitle>
              <DialogDescription>
                Make changes to the job listing here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  defaultValue={selectedJob.title}
                  onChange={(e) => handleJobInputChange('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  defaultValue={selectedJob.company}
                  onChange={(e) => handleJobInputChange('company', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  defaultValue={selectedJob.description}
                  onChange={(e) => handleJobInputChange('description', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  defaultValue={selectedJob.salary}
                  onChange={(e) => handleJobInputChange('salary', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  defaultValue={selectedJob.location}
                  onChange={(e) => handleJobInputChange('location', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  defaultValue={selectedJob.requirements}
                  onChange={(e) => handleJobInputChange('requirements', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  defaultValue={selectedJob.type}
                  onChange={(e) => handleJobInputChange('type', e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  defaultChecked={selectedJob.isActive}
                  onCheckedChange={(checked) => handleJobInputChange('isActive', checked === true)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedJob(null);
                  setJobFormData({});
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleJobSubmit}
                disabled={Object.keys(jobFormData).length === 0 || updateJobMutation.isPending}
              >
                {updateJobMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Make changes to user information here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  defaultValue={selectedUser.username}
                  onChange={(e) => handleUserInputChange('username', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={selectedUser.email}
                  onChange={(e) => handleUserInputChange('email', e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAdmin"
                  defaultChecked={selectedUser.isAdmin}
                  onCheckedChange={(checked: boolean) => handleUserInputChange('isAdmin', checked)}
                />
                <Label htmlFor="isAdmin">Administrator</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedUser(null);
                  setUserFormData({});
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUserSubmit}
                disabled={Object.keys(userFormData).length === 0 || updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Add a new job listing to the platform. Fill in all the required information below.
            </DialogDescription>
          </DialogHeader>
          <Form {...useForm<NewJobForm>({
            resolver: zodResolver(insertJobSchema),
            defaultValues: {
              title: "",
              company:"",
              description: "",
              salary: "",
              location: "",
              requirements: "",
              type: "",
              isActive: true,
            }
          })}
          onSubmit={(data: NewJobForm) => createJobMutation.mutate(data)}
          >
            {({ register, formState: { errors }}: FormFields) => (
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <FormField
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewJobDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createJobMutation.isPending}>
                    {createJobMutation.isPending ? "Creating..." : "Create Job"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform. The user will receive their login credentials via email.
            </DialogDescription>
          </DialogHeader>
          <Form {...useForm<NewUserForm>({
            resolver: zodResolver(insertUserSchema),
            defaultValues: {
              username: "",
              email: "",
              password: "",
              isAdmin: false,
            }
          })}
          onSubmit={(data: NewUserForm) => createUserMutation.mutate(data)}
          >
            {({ register, formState: { errors }}: FormFields) => (
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <FormField
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="isAdmin"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Administrator Access</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewUserDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}