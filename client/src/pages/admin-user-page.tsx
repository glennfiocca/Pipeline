import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Profile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, ArrowLeft, User as UserIcon, Mail, CreditCard, Calendar, FileText, Trash2, Send } from "lucide-react";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { useState, useRef, useEffect } from "react";
import { ManageCreditsDialog } from "@/components/ManageCreditsDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

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
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
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

  const { data: applications = [], isLoading: isLoadingApplications } = useQuery({
    queryKey: ["/api/admin/applications", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/applications");
      if (!res.ok) {
        throw new Error("Failed to fetch applications");
      }
      return res.json();
    },
    select: (data) => {
      return data.filter((app) => 
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

  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/applications/${applicationId}`, { status });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update application status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications", userId] });
      toast({
        title: "Success",
        description: "Application status updated successfully",
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

  if (isLoadingUser || isLoadingProfile || isLoadingApplications || isLoadingJobs) {
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
                    {applications.map((app) => {
                      const job = jobs.find(j => j.id === app.jobId);
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
                    <p>No applications found for this user</p>
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
                          applications.map((app) => {
                            const job = jobs.find(j => j.id === app.jobId);
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
      queryClient.setQueryData<Message[]>(queryKey, old => [...(old || []), newMessage]);
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