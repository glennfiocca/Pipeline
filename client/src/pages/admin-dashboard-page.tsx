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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { insertJobSchema, insertUserSchema } from "@shared/schema";
import type { z } from 'zod';
import { DialogFooter } from "@/components/ui/dialog";

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

  // Queries
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

  // Mutations
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

  // Loading state
  if (!user || isLoadingUsers || isLoadingProfiles || isLoadingApps || isLoadingJobs) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Auth check
  if (!user.isAdmin) {
    setLocation("/");
    return null;
  }

  // Event handlers
  const handleInputChange = (field: keyof ApplicationUpdateForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleJobInputChange = (field: keyof JobUpdateForm, value: string | boolean) => {
    setJobFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserInputChange = (field: keyof UserUpdateForm, value: string | boolean) => {
    setUserFormData(prev => ({
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

  const handleJobSubmit = () => {
    if (!selectedJob || Object.keys(jobFormData).length === 0) return;
    updateJobMutation.mutate({
      id: selectedJob.id,
      data: jobFormData
    });
  };

  const handleUserSubmit = () => {
    if (!selectedUser || Object.keys(userFormData).length === 0) return;
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: userFormData
    });
  };

  // Utility functions
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

  // Stats calculation
  const stats = {
    "Total Users": users.length,
    "Total Applications": applications.length,
    "Applied": applications.filter(app => app.status.toLowerCase() === "applied").length,
    "Interviewing": applications.filter(app => app.status.toLowerCase() === "interviewing").length,
    "Accepted": applications.filter(app => app.status.toLowerCase() === "accepted").length,
    "Rejected": applications.filter(app => app.status.toLowerCase() === "rejected").length,
    "Withdrawn": applications.filter(app => app.status.toLowerCase() === "withdrawn").length,
  };

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
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this user? This action cannot be undone.
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
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Job Dialog */}
      <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Add a new job listing to the platform. Fill in all the required information below.
            </DialogDescription>
          </DialogHeader>
          <NewJobForm 
            onSubmit={(data) => createJobMutation.mutate(data)}
            onCancel={() => setShowNewJobDialog(false)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewJobDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New User Dialog */}
      <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform. The user will receive their login credentials via email.
            </DialogDescription>
          </DialogHeader>
          <NewUserForm
            onSubmit={(data) => createUserMutation.mutate(data)}
            onCancel={() => setShowNewUserDialog(false)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewUserDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
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
                disabled={Object.keys(jobFormData).length === 0}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit User Dialog */}
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
                  onCheckedChange={(checked) => handleUserInputChange('isAdmin', checked === true)}
                />
                <Label htmlFor="isAdmin">Administrator Access</Label>
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
                disabled={Object.keys(userFormData).length === 0}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}