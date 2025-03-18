import { Bell, Loader2, MessageSquare, BriefcaseIcon, Clock, ArrowRightCircle, Calendar, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { JobModal } from "@/components/JobModal";
import { useQuery } from "@tanstack/react-query";
import { Job, Application } from "@shared/schema";
import { MessageDialog } from "@/components/MessageDialog";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export function NotificationsDialog() {
  const { notifications = [], unreadCount = 0, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Keep track of notifications that have been deleted during this session
  const [deletedNotificationIds, setDeletedNotificationIds] = useState<Set<number>>(() => {
    try {
      // Initialize from localStorage if available
      const storedIds = localStorage.getItem(`deleted-notifications-${user?.id}`);
      if (storedIds) {
        return new Set(JSON.parse(storedIds));
      }
    } catch (err) {
      console.error("Failed to load deleted notifications from localStorage", err);
    }
    return new Set();
  });
  
  // Save deleted notification IDs to localStorage when they change
  useEffect(() => {
    if (user?.id && deletedNotificationIds.size > 0) {
      try {
        // Convert Set to Array before storing
        const idsArray = Array.from(deletedNotificationIds);
        localStorage.setItem(
          `deleted-notifications-${user.id}`, 
          JSON.stringify(idsArray)
        );
      } catch (err) {
        console.error("Failed to save deleted notifications to localStorage", err);
      }
    }
  }, [deletedNotificationIds, user?.id]);
  
  // Filtered notifications list that excludes any deleted notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => !deletedNotificationIds.has(notification.id));
  }, [notifications, deletedNotificationIds]);

  // Force refetch notifications when the dialog opens
  useEffect(() => {
    if (isOpen) {
      // This will trigger a refetch of notifications
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    }
  }, [isOpen]);

  const { data: selectedJob } = useQuery<Job>({
    queryKey: [`/api/jobs/${selectedJobId}`],
    enabled: !!selectedJobId,
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const selectedApplication = applications?.find(app => app.jobId === selectedJobId);

  const handleDeleteClick = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation(); // Prevent other click handlers from firing
    console.log(`Delete button clicked for notification ID: ${notificationId}`);
    setNotificationToDelete(notificationId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (notificationToDelete) {
      console.log(`Confirming deletion of notification ID: ${notificationToDelete}`);
      // Add to our local set of deleted notifications
      setDeletedNotificationIds(prev => {
        const newSet = new Set(prev);
        newSet.add(notificationToDelete);
        return newSet;
      });
      
      // Call the actual delete API
      deleteNotification(notificationToDelete);
      setDeleteConfirmOpen(false);
      setNotificationToDelete(null);
    }
  };
  
  // Close the alert dialog and reset state when canceled
  const handleDeleteCancel = () => {
    console.log('Delete canceled');
    setDeleteConfirmOpen(false);
    setNotificationToDelete(null);
  };

  const getNotificationIcon = (notification: any) => {
    switch (notification.type) {
      case 'message_received':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'application_status':
      case 'status_change':
        return <ArrowRightCircle className="h-5 w-5 text-purple-500" />;
      case 'next_steps_added':
      case 'next_steps_updated':
        return <ArrowRightCircle className="h-5 w-5 text-indigo-500" />;
      case 'interview_scheduled':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'application_accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'application_rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'application_submitted':
      case 'application_confirmation':
        return <BriefcaseIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTitle = (notification: any) => {
    const company = notification.metadata?.company || '';
    const jobTitle = notification.metadata?.jobTitle || '';
    
    switch (notification.type) {
      case 'message_received':
        return `New Message - ${jobTitle} at ${company}`;
      case 'status_change':
      case 'application_status':
        const newStatus = notification.metadata?.newStatus || '';
        return `Status Update: ${newStatus} - ${jobTitle} at ${company}`;
      case 'next_steps_added':
        return `Next Steps Added - ${jobTitle} at ${company}`;
      case 'next_steps_updated':
        return `Next Steps Updated - ${jobTitle} at ${company}`;
      case 'interview_scheduled':
        return `Interview Scheduled - ${jobTitle} at ${company}`;
      case 'application_accepted':
        return `Application Accepted - ${jobTitle} at ${company}`;
      case 'application_rejected':
        return `Application Not Selected - ${jobTitle} at ${company}`;
      default:
        return notification.title;
    }
  };

  const getFormattedTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        formatted: format(date, "PPp")
      };
    } catch (e) {
      return {
        relative: "Unknown time",
        formatted: "Unknown time"
      };
    }
  };

  const getNotificationActions = (notification: any) => {
    if (!notification) return null;

    const buttonBaseClass = "mt-3 w-full flex items-center justify-center gap-2";
    const applicationId = notification.metadata?.applicationId;

    // Default action is to view application details
    if (applicationId) {
      switch (notification.type) {
        case 'message_received':
          return (
            <Button 
              variant="secondary" 
              size="sm" 
              className={buttonBaseClass}
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
                setLocation(`/dashboard?messageId=${applicationId}`);
                setIsOpen(false);
              }}
            >
              <MessageSquare className="h-4 w-4" />
              View Message Thread
            </Button>
          );
  
        case 'application_submitted':
        case 'application_confirmation':
        case 'status_change':
        case 'application_status':
        case 'next_steps_added':
        case 'next_steps_updated':
        case 'interview_scheduled':
        case 'application_accepted':
        case 'application_rejected':
          return (
            <Button 
              variant="secondary" 
              size="sm" 
              className={buttonBaseClass}
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
                setLocation(`/dashboard?applicationId=${applicationId}`);
                setIsOpen(false);
              }}
            >
              <BriefcaseIcon className="h-4 w-4 mr-2" />
              View Application Details
            </Button>
          );
  
        default:
          return null;
      }
    }
    
    return null;
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Notifications</DialogTitle>
            {filteredNotifications?.length > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : !filteredNotifications || filteredNotifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No notifications
              </div>
            ) : (
              <div className="space-y-4">
                {(filteredNotifications || []).map((notification: any) => {
                  const timeInfo = getFormattedTime(notification.createdAt);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        !notification.isRead ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {getNotificationIcon(notification)}
                            <span className="font-medium">
                              {getNotificationTitle(notification)}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteClick(e, notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {notification.content || notification.message}
                        </span>
                        <div className="flex items-center text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3 mr-1" />
                          <span title={timeInfo.formatted}>{timeInfo.relative}</span>
                        </div>
                        {getNotificationActions(notification)}
                      </div>
                      {!notification.isRead && (
                        <Badge variant="secondary" className="mt-2">New</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedJob && selectedApplication && (
        <JobModal
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => {
            setSelectedJobId(null);
            setIsOpen(false);
          }}
          alreadyApplied={true}
          applicationControls={
            <div className="flex items-center gap-4 w-full justify-center">
              <MessageDialog
                applicationId={selectedApplication.id}
                jobTitle={selectedJob.title}
                company={selectedJob.company}
              />
              {selectedApplication.status !== "Withdrawn" && (
                <WithdrawDialog
                  onWithdraw={async () => {
                    const res = await apiRequest(
                      "PATCH",
                      `/api/applications/${selectedApplication.id}`,
                      { status: "Withdrawn" }
                    );
                    if (res.ok) {
                      setSelectedJobId(null);
                      setIsOpen(false);
                    }
                  }}
                  isPending={false}
                />
              )}
            </div>
          }
        />
      )}
    </>
  );
}