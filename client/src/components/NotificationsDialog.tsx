import { Bell, Loader2, MessageSquare, BriefcaseIcon } from "lucide-react";
import { format } from "date-fns";
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
import { useState } from "react";
import { JobModal } from "@/components/JobModal";
import { useQuery } from "@tanstack/react-query";
import { Job, Application } from "@shared/schema";
import { MessageDialog } from "@/components/MessageDialog";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import { apiRequest } from "@/lib/queryClient";

export function NotificationsDialog() {
  const { notifications = [], unreadCount = 0, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const { data: selectedJob } = useQuery<Job>({
    queryKey: [`/api/jobs/${selectedJobId}`],
    enabled: !!selectedJobId,
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const selectedApplication = applications?.find(app => app.jobId === selectedJobId);

  const getNotificationTitle = (notification: any) => {
    const company = notification.metadata?.company || '';
    const jobTitle = notification.metadata?.jobTitle || '';
    
    switch (notification.type) {
      case 'message_received':
        return `New Message - ${jobTitle} at ${company}`;
      case 'status_change':
      case 'application_status':
        return `Status Update - ${jobTitle} at ${company}`;
      default:
        return notification.title;
    }
  };

  const getNotificationActions = (notification: any) => {
    if (!notification) return null;

    const buttonBaseClass = "mt-3 w-full flex items-center justify-center gap-2";

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
              setLocation(`/dashboard?messageId=${notification.metadata?.applicationId}`);
              setIsOpen(false);
            }}
          >
            <MessageSquare className="h-4 w-4" />
            View Message Thread
          </Button>
        );

      case 'status_change':
      case 'application_status':
        return (
          <Button 
            variant="secondary" 
            size="sm" 
            className={buttonBaseClass}
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(notification.id);
              setLocation(`/dashboard?applicationId=${notification.metadata?.applicationId}`);
              setIsOpen(false);
            }}
          >
            <BriefcaseIcon className="h-4 w-4 mr-2" />
            View Application Details
          </Button>
        );

      case 'application_submitted':
        return (
          <Button 
            variant="secondary" 
            size="sm" 
            className={buttonBaseClass}
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(notification.id);
              setLocation(`/dashboard?applicationId=${notification.metadata?.applicationId}`);
              setIsOpen(false);
            }}
          >
            <BriefcaseIcon className="h-4 w-4 mr-2" />
            View Application
          </Button>
        );

      default:
        return null;
    }
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
            {notifications?.length > 0 && (
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
            ) : !notifications || notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No notifications
              </div>
            ) : (
              <div className="space-y-4">
                {(notifications || []).map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      !notification.isRead ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {getNotificationTitle(notification)}
                      </span>
                      <span className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </span>
                      <span className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.createdAt), "PPp")}
                      </span>
                      {getNotificationActions(notification)}
                    </div>
                    {!notification.isRead && (
                      <Badge variant="secondary" className="mt-2">New</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

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