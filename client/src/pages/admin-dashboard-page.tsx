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
import { Users, Mail, User as UserIcon, Edit, Trash2, Plus, CreditCard } from "lucide-react";
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

  // Auth check before any other hooks
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

  // Queries
  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: true,
    select: (data) => data.sort((a, b) => {
      // Sort by active status first, then by creation date
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

  // Create mutations
  const createJobMutation = useMutation({
    mutationFn: async (data: NewJobForm) => {
      const jobData = {
        ...data,
        jobIdentifier: `PL${Date.now()}`, // Generate a temporary identifier
        source: "Pipeline",
        sourceUrl: window.location.origin,
        lastCheckedAt: new Date().toISOString(),
        isActive: true,
        published: true
      };

      const response = await apiRequest("POST", "/api/jobs", jobData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create job");
      }

      return response.json();
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
        description: error.message,
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

  // Edit mutations
  const editJobMutation = useMutation({
    mutationFn: async (data: Partial<Job>) => {
      if (!selectedJob && !data.id) throw new Error("No job selected");
      const jobId = data.id || selectedJob?.id;

      // Add deactivatedAt when archiving, remove it when restoring
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

  // Delete mutations
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

  // Add mutation for managing credits
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


  if (isLoadingJobs || isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="active-jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active-jobs">Active Jobs</TabsTrigger>
          <TabsTrigger value="archived-jobs">Archived Jobs</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
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
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {user.bankedCredits || 0} banked credits
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedUserCredits({ user, action: 'manage_credits' })}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditUser(user)}
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
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationsManagement />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackManagement />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
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
                try {
                  await createJobMutation.mutateAsync(data);
                } catch (error) {
                  console.error("Error submitting form:", error);
                }
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
              try {
                createUserMutation.mutate(data);
              } catch (error) {
                console.error("Error submitting form:", error);
              }
            }}
            onCancel={() => setShowNewUserDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialogs */}
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
                try {
                  editJobMutation.mutate(data);
                } catch (error) {
                  console.error("Error submitting form:", error);
                }
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
              try {
                editUserMutation.mutate(data);
              } catch (error) {
                console.error("Error submitting form:", error);
              }
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
    </div>
  );
}