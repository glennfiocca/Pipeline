import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application as BaseApplication, User, Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { ChevronRight, Loader2, MessageSquare, AlertCircle, Search, CalendarIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { AdminMessageDialog } from "./AdminMessageDialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";

// Define interface for status history items
interface StatusHistoryItem {
  status: string;
  date: string;
}

// Extend the Application type with properly typed statusHistory
interface Application extends BaseApplication {
  statusHistory: StatusHistoryItem[];
}

const APPLICATION_STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "Withdrawn"];

interface ApplicationsByUser {
  [username: string]: (Application & { job: Job })[];
}

export function ApplicationsManagement() {
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<{
    id: number;
    username: string;
    companyName: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<(Application & { job: Job, user: User }) | null>(null);
  const [unreadMessageCounts, setUnreadMessageCounts] = useState<{[applicationId: number]: number}>({});
  
  // Store processed data in state instead of calculating during render
  const [enrichedApplications, setEnrichedApplications] = useState<(Application & { job: Job, user: User })[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<(Application & { job: Job, user: User })[]>([]);
  const [applicationsByStatus, setApplicationsByStatus] = useState<{[key: string]: (Application & { job: Job, user: User })[]}>(
    {
      "Applied": [],
      "Interviewing": [],
      "Accepted": [],
      "Rejected": [],
      "Withdrawn": [],
      "All": []
    }
  );

  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ["/api/admin/applications"],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Process data whenever applications, users, or jobs change
  useEffect(() => {
    if (!applications.length || !users.length || !jobs.length) {
      return;
    }

    // Combine application data with user and job data
    const combinedApps = applications
      .map(app => {
        const user = users.find(u => u.id === app.profileId);
        const job = jobs.find(j => j.id === app.jobId);
        
        if (!user || !job) return null;
        
        return {
          ...app,
          user,
          job
        };
      })
      .filter(Boolean) as (Application & { job: Job, user: User })[];
    
    setEnrichedApplications(combinedApps);
  }, [applications, users, jobs]);

  // Filter applications whenever search term, status filter, or enriched applications change
  useEffect(() => {
    const filtered = enrichedApplications.filter(app => {
      const matchesSearch = searchTerm === "" || 
        app.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job.company.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    setFilteredApplications(filtered);

    // Group applications by status for the tabbed view
    setApplicationsByStatus({
      "Applied": filtered.filter(app => app.status === "Applied"),
      "Interviewing": filtered.filter(app => app.status === "Interviewing"),
      "Accepted": filtered.filter(app => app.status === "Accepted"),
      "Rejected": filtered.filter(app => app.status === "Rejected"),
      "Withdrawn": filtered.filter(app => app.status === "Withdrawn"),
      "All": filtered
    });
  }, [enrichedApplications, searchTerm, statusFilter]);

  // Get unread message counts for all applications
  useEffect(() => {
    // Define the fetch function
    const fetchUnreadCounts = async () => {
      if (!enrichedApplications || enrichedApplications.length === 0) {
        // If no applications, set empty counts and return
        setUnreadMessageCounts({});
        return;
      }
      
      try {
        const counts: {[applicationId: number]: number} = {};
        
        // Process applications in batches to avoid too many simultaneous requests
        const batchSize = 5;
        for (let i = 0; i < enrichedApplications.length; i += batchSize) {
          const batch = enrichedApplications.slice(i, i + batchSize);
          
          // Use Promise.all to fetch counts for a batch in parallel
          await Promise.all(
            batch.map(async (app) => {
              try {
                const response = await apiRequest(
                  "GET", 
                  `/api/applications/${app.id}/messages/unread-count?forAdmin=true`
                );
                
                if (response.ok) {
                  const count = await response.json();
                  if (count > 0) {
                    counts[app.id] = count as number;
                  }
                }
              } catch (err) {
                console.error(`Error fetching unread count for application ${app.id}:`, err);
              }
            })
          );
        }
        
        // Update state with all counts at once
        setUnreadMessageCounts(counts);
      } catch (error) {
        console.error("Error fetching unread message counts:", error);
        setUnreadMessageCounts({});
      }
    };
    
    // Call the fetch function immediately
    fetchUnreadCounts();
    
    // Set up the interval for polling
    const intervalId = setInterval(fetchUnreadCounts, 30000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [enrichedApplications]);

  // Define mutation after all state is defined
  const updateApplicationMutation = useMutation({
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
      const now = new Date().toISOString();
      
      // Update the application
      const response = await apiRequest(
        "PATCH",
        `/api/admin/applications/${applicationId}`,
        { 
          status,
          notes,
          nextStep,
          nextStepDueDate
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update application");
      }

      const application = await response.json();
      
      // Get the job information for notification metadata
      const jobRes = await apiRequest("GET", `/api/jobs/${application.jobId}`);
      if (!jobRes.ok) {
        console.error("Failed to fetch job details for notification");
        throw new Error("Failed to fetch job details");
      }
      const job = await jobRes.json();

      // Create notifications based on what was updated
      
      // 1. Status change notification
      if (status) {
        let notificationType = 'application_status';
        let notificationTitle = 'Application Status Updated';
        let notificationContent = `Your application for ${job.title} at ${job.company} has been moved to ${status}`;
        
        // Special handling for accepted/rejected
        if (status === 'Accepted') {
          notificationType = 'application_accepted';
          notificationTitle = 'Application Accepted';
          notificationContent = `Congratulations! Your application for ${job.title} at ${job.company} has been accepted.`;
        } else if (status === 'Rejected') {
          notificationType = 'application_rejected';
          notificationTitle = 'Application Not Selected';
          notificationContent = `We regret to inform you that your application for ${job.title} at ${job.company} was not selected to move forward.`;
        }
        
        const notifRes = await apiRequest(
          "POST",
          "/api/notifications",
          {
            userId: application.profileId,
            type: notificationType,
            title: notificationTitle,
            content: notificationContent,
            isRead: false,
            relatedId: applicationId,
            relatedType: 'application',
            metadata: {
              applicationId,
              status,
              oldStatus: application.status,
              newStatus: status,
              jobId: application.jobId,
              jobTitle: job.title,
              company: job.company
            }
          }
        );

        if (!notifRes.ok) {
          console.error("Failed to create status notification");
        }
      }

      // 2. Next Steps notification - if next steps were added or updated
      if (nextStep && nextStep !== application.nextStep) {
        const isNewSteps = !application.nextStep; // Check if this is the first time next steps are being added
        const notifRes = await apiRequest(
          "POST",
          "/api/notifications",
          {
            userId: application.profileId,
            type: isNewSteps ? 'next_steps_added' : 'next_steps_updated',
            title: isNewSteps ? 'Next Steps Added' : 'Next Steps Updated',
            content: `Next steps have been ${isNewSteps ? 'added to' : 'updated for'} your application for ${job.title} at ${job.company}.`,
            isRead: false,
            relatedId: applicationId,
            relatedType: 'application',
            metadata: {
              applicationId,
              nextSteps: nextStep.split('\n').filter(step => step.trim()),
              jobId: application.jobId,
              jobTitle: job.title,
              company: job.company
            }
          }
        );

        if (!notifRes.ok) {
          console.error("Failed to create next steps notification");
        }
      }

      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
      setShowDetailsDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Event handler for viewing application details
  const handleViewDetails = useCallback((app: Application & { job: Job, user: User }) => {
    setCurrentApplication(app);
    setShowDetailsDialog(true);
  }, []);

  // Function to get status color
  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return "bg-blue-500/10 text-blue-500";
      case "interviewing":
        return "bg-purple-500/10 text-purple-500";
      case "accepted":
        return "bg-green-500/10 text-green-500";
      case "rejected":
        return "bg-red-500/10 text-red-500";
      case "withdrawn":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  }, []);

  // Application card renderer
  const renderApplicationCard = useCallback((app: Application & { job: Job, user: User }) => (
    <div
      key={app.id}
      className={cn(
        "p-4 rounded-lg border space-y-2 hover:bg-accent/10 transition-colors",
        !app.job.isActive && "bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium flex items-center gap-2">
            {app.job.title}
            {!app.job.isActive && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Archived Job
              </Badge>
            )}
          </h4>
          <p className="text-sm text-muted-foreground">
            {app.job.company}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Applied on {format(new Date(app.appliedAt), "MMM d, yyyy")}
          </p>
          <p className="text-xs font-medium mt-1">
            Applicant: {app.user.username}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={getStatusColor(app.status)}>
            {app.status}
          </Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(app)}
              className="text-primary"
            >
              View Details
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedApplication({
                id: app.id,
                username: app.user.username,
                companyName: app.job.company
              })}
              className="relative text-primary hover:text-primary-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              {unreadMessageCounts[app.id] > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                >
                  {unreadMessageCounts[app.id]}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  ), [handleViewDetails, getStatusColor, unreadMessageCounts, setSelectedApplication]);

  if (isLoadingApps || isLoadingUsers || isLoadingJobs) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by applicant, job title, or company..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {APPLICATION_STATUSES.map((status) => (
                  <SelectItem 
                    key={status} 
                    value={status}
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="All" className="w-full">
          <TabsList className="mb-4 w-full justify-start">
            <TabsTrigger value="All">All ({filteredApplications.length})</TabsTrigger>
            <TabsTrigger value="Applied">Applied ({applicationsByStatus.Applied.length})</TabsTrigger>
            <TabsTrigger value="Interviewing">Interviewing ({applicationsByStatus.Interviewing.length})</TabsTrigger>
            <TabsTrigger value="Accepted">Accepted ({applicationsByStatus.Accepted.length})</TabsTrigger>
            <TabsTrigger value="Rejected">Rejected ({applicationsByStatus.Rejected.length})</TabsTrigger>
            <TabsTrigger value="Withdrawn">Withdrawn ({applicationsByStatus.Withdrawn.length})</TabsTrigger>
          </TabsList>
          
          {Object.entries(applicationsByStatus).map(([status, apps]) => (
            <TabsContent key={status} value={status} className="mt-0">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {apps.length > 0 ? (
                    apps.map(app => renderApplicationCard(app))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No applications found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {selectedApplication && (
        <AdminMessageDialog
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          applicationId={selectedApplication.id}
          username={selectedApplication.username}
          companyName={selectedApplication.companyName}
        />
      )}

      {currentApplication && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{currentApplication.job.title}</h3>
                  <p className="text-muted-foreground">{currentApplication.job.company}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Applicant</h4>
                  <p>{currentApplication.user.username}</p>
                  <p className="text-sm text-muted-foreground">{currentApplication.user.email}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Application Timeline</h4>
                  <p className="text-sm">Applied on: {format(new Date(currentApplication.appliedAt), "MMM d, yyyy")}</p>
                  {currentApplication.statusHistory && (
                    <div className="space-y-1 text-sm">
                      {currentApplication.statusHistory.map((history, index) => (
                        <div key={index} className="flex items-center">
                          <span className="mr-2">{format(new Date(history.date), "MMM d, yyyy")}:</span>
                          <Badge variant="outline" className={getStatusColor(history.status)}>
                            {history.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Current Status</h4>
                  <Select 
                    defaultValue={currentApplication.status}
                    onValueChange={(value) => {
                      updateApplicationMutation.mutate({
                        applicationId: currentApplication.id,
                        status: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Internal Notes</h4>
                  <Textarea 
                    placeholder="Add internal notes about this application"
                    defaultValue={currentApplication.notes || ""}
                    className="min-h-[100px]"
                    id="application-notes"
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Next Step</h4>
                  <Input 
                    placeholder="e.g., Schedule interview, Check references"
                    defaultValue={currentApplication.nextStep || ""}
                    id="next-step"
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Due Date for Next Step</h4>
                  <DatePicker 
                    date={currentApplication.nextStepDueDate ? new Date(currentApplication.nextStepDueDate) : undefined}
                    setDate={(date) => {
                      // This will be handled in the save function
                    }}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  const notesElement = document.getElementById('application-notes') as HTMLTextAreaElement;
                  const nextStepElement = document.getElementById('next-step') as HTMLInputElement;
                  
                  // Get the date from the DatePicker component
                  let nextStepDueDate = null;
                  if (document.querySelector('.date-picker-value')) {
                    const dateValue = document.querySelector('.date-picker-value')?.getAttribute('data-value');
                    nextStepDueDate = dateValue || null;
                  }
                  
                  try {
                    await updateApplicationMutation.mutateAsync({
                      applicationId: currentApplication.id,
                      notes: notesElement?.value,
                      nextStep: nextStepElement?.value,
                      nextStepDueDate
                    });
                    setShowDetailsDialog(false);
                  } catch (error) {
                    console.error("Error updating application:", error);
                  }
                }}
                disabled={updateApplicationMutation.isPending}
              >
                {updateApplicationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}