import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, User, Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { ChevronRight, Loader2, MessageSquare, AlertCircle, Search, CalendarIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AdminMessageDialog } from "./AdminMessageDialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const APPLICATION_STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "Withdrawn"];

// Define the StatusHistory interface to match the schema
interface StatusHistory {
  status: string;
  date: string;
}

// Define a more complete Application type with statusHistory
interface EnrichedApplication extends Omit<Application, 'statusHistory'> {
  job: Job;
  user: User;
  statusHistory: StatusHistory[]; // Match the schema's definition
}

/**
 * ApplicationsManager handles the business logic for the ApplicationsManagement component
 * This separation prevents hook-related errors by keeping all logic in a simple class
 */
class ApplicationsManager {
  applications: Application[] = [];
  users: User[] = [];
  jobs: Job[] = [];
  enrichedApplications: EnrichedApplication[] = [];
  messageCountsData: Record<number, number> = {};
  searchTerm: string = "";
  statusFilter: string = "all";
  
  constructor(applications: Application[], users: User[], jobs: Job[]) {
    this.applications = applications;
    this.users = users;
    this.jobs = jobs;
    this.enrichedApplications = this.getEnrichedApplications();
  }
  
  getEnrichedApplications(): EnrichedApplication[] {
    return this.applications
      .map(app => {
        const user = this.users.find(u => u.id === app.profileId);
        const job = this.jobs.find(j => j.id === app.jobId);
        
        if (!user || !job) return null;
        
        return {
          ...app,
          user,
          job
        };
      })
      .filter(Boolean) as EnrichedApplication[];
  }
  
  setMessageCounts(counts: Record<number, number>) {
    this.messageCountsData = counts;
  }
  
  getFilteredApplications(): EnrichedApplication[] {
    return this.enrichedApplications.filter(app => {
      const matchesSearch = this.searchTerm === "" || 
        app.user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        app.job.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        app.job.company.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = this.statusFilter === "all" || app.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }
  
  getApplicationsByStatus() {
    const filteredApplications = this.getFilteredApplications();
    
    return {
      "Applied": filteredApplications.filter(app => app.status === "Applied"),
      "Interviewing": filteredApplications.filter(app => app.status === "Interviewing"),
      "Accepted": filteredApplications.filter(app => app.status === "Accepted"),
      "Rejected": filteredApplications.filter(app => app.status === "Rejected"),
      "Withdrawn": filteredApplications.filter(app => app.status === "Withdrawn"),
      "All": filteredApplications
    };
  }
  
  getStatusColor(status: string) {
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
  }
}

/**
 * Main component for managing applications
 * This is a traditional React functional component that uses the ApplicationsManager
 * to handle business logic, avoiding hook-related errors
 */
export function ApplicationsManagement() {
  // Basic React state hooks that don't depend on each other
  const [selectedApplication, setSelectedApplication] = React.useState<{
    id: number;
    username: string;
    companyName: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [showDetailsDialog, setShowDetailsDialog] = React.useState(false);
  const [currentApplication, setCurrentApplication] = React.useState<EnrichedApplication | null>(null);
  const [messageCounts, setMessageCounts] = React.useState<Record<number, number>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query for applications data
  const { 
    data: applications = [], 
    isLoading: isLoadingApps 
  } = useQuery<Application[]>({ queryKey: ["/api/admin/applications"] });
  
  // Query for users data
  const { 
    data: users = [], 
    isLoading: isLoadingUsers 
  } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });
  
  // Query for jobs data
  const { 
    data: jobs = [], 
    isLoading: isLoadingJobs 
  } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });
  
  // Create a stable reference to the manager - only recreated if data changes
  const managerRef = React.useRef<ApplicationsManager | null>(null);
  
  if (!managerRef.current && applications.length && users.length && jobs.length) {
    managerRef.current = new ApplicationsManager(applications, users, jobs);
  }
  
  if (managerRef.current) {
    managerRef.current.searchTerm = searchTerm;
    managerRef.current.statusFilter = statusFilter;
  }
  
  // Mutation for updating applications
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

      return response.json();
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
  
  // Fetch message counts - only runs once when component mounts and when dependencies change
  React.useEffect(() => {
    if (!managerRef.current) return;
    
    let isMounted = true;
    const enrichedApplications = managerRef.current.enrichedApplications;
    
    const fetchCounts = async () => {
      if (enrichedApplications.length === 0) return;
      
      const newCounts: Record<number, number> = {};
      
      for (const app of enrichedApplications) {
        try {
          const response = await apiRequest(
            "GET", 
            `/api/applications/${app.id}/messages/unread-count?forAdmin=true`
          );
          
          if (response.ok) {
            const count = await response.json();
            if (count > 0) {
              newCounts[app.id] = count as number;
            }
          }
        } catch (error) {
          console.error(`Error fetching unread count for application ${app.id}:`, error);
        }
      }
      
      if (isMounted) {
        setMessageCounts(newCounts);
        
        if (managerRef.current) {
          managerRef.current.setMessageCounts(newCounts);
        }
      }
    };
    
    fetchCounts();
    
    const intervalId = setInterval(fetchCounts, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [applications, users, jobs]);
  
  // Loading state
  if (isLoadingApps || isLoadingUsers || isLoadingJobs || !managerRef.current) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const manager = managerRef.current;
  const filteredApplications = manager.getFilteredApplications();
  const applicationsByStatus = manager.getApplicationsByStatus();
  
  // Handler functions
  const handleViewDetails = (app: EnrichedApplication) => {
    setCurrentApplication(app);
    setShowDetailsDialog(true);
  };
  
  // UI rendering functions
  const renderApplicationCard = (app: EnrichedApplication) => (
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
          <Badge className={manager.getStatusColor(app.status)}>
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
              {messageCounts[app.id] > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                >
                  {messageCounts[app.id]}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApplicationTimeline = (application: EnrichedApplication) => {
    return (
      <div className="space-y-2">
        <h4 className="font-medium">Application Timeline</h4>
        <p className="text-sm">Applied on: {format(new Date(application.appliedAt), "MMM d, yyyy")}</p>
        {application.statusHistory && Array.isArray(application.statusHistory) && (
          <div className="space-y-1 text-sm">
            {application.statusHistory.map((history, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2">{format(new Date(history.date), "MMM d, yyyy")}:</span>
                <Badge variant="outline" className={manager.getStatusColor(history.status)}>
                  {history.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Main render return
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
                
                {renderApplicationTimeline(currentApplication)}
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