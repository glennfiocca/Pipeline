import { Bell, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useState } from "react";
import { JobModal } from "@/components/JobModal";
import { useQuery } from "@tanstack/react-query";
import { Job, Application } from "@shared/schema";

export function NotificationsDialog() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Fetch job data when selectedJobId changes
  const { data: selectedJob } = useQuery<Job>({
    queryKey: [`/api/jobs/${selectedJobId}`],
    enabled: !!selectedJobId,
  });

  // Fetch user's applications
  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  // Check if user has already applied for the selected job
  const hasApplied = selectedJobId 
    ? applications.some(app => app.jobId === selectedJobId)
    : false;

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Close the notifications dialog
    setIsOpen(false);

    // Navigate based on notification type
    switch (notification.type) {
      case 'new_company_message':
        // Navigate to the specific message in the application chat
        setLocation(`/dashboard?messageId=${notification.metadata.applicationId}`);
        break;
      case 'application_status_change':
        // Set the selected job ID to trigger the job data fetch
        setSelectedJobId(notification.metadata.jobId);
        break;
      case 'admin_feedback':
        // Navigate to the feedback view (read-only)
        setLocation(`/dashboard?feedbackId=${notification.relatedId}&readonly=true`);
        break;
      default:
        console.warn('Unknown notification type:', notification.type);
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
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
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Notifications</DialogTitle>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
                  Mark all as read
                </Button>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-accent ${
                      !notification.isRead ? "bg-muted/50" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleNotificationClick(notification);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {notification.content}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), "PPp")}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <Badge variant="secondary" className="ml-2">New</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedJob && (
        <JobModal
          job={selectedJob}
          isOpen={true}
          onClose={() => setSelectedJobId(null)}
          onApply={() => {}}
          alreadyApplied={hasApplied}
        />
      )}
    </>
  );
}