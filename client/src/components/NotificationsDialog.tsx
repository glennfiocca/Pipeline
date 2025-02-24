import { Bell, Loader2 } from "lucide-react";
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

  const handleNotificationClick = async (notification: any) => {
    if (!notification) return;

    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.type !== 'application_status') {
      setIsOpen(false);
    }

    switch (notification.type) {
      case 'message_received':
        setLocation(`/dashboard?messageId=${notification.metadata?.applicationId}`);
        break;
      case 'application_status':
        setSelectedJobId(notification.metadata?.jobId);
        break;
      case 'application_confirmation':
        setLocation(`/dashboard`);
        break;
      default:
        console.warn('Unknown notification type:', notification.type);
    }
  };

  const selectedApplication = applications.find(app => app.jobId === selectedJobId);

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
              <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
                Mark all as read
              </Button>
            )}
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`w-full p-4 rounded-lg border transition-colors ${
                      !notification.isRead ? "bg-muted/50" : ""
                    }`}
                  >
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <span className="block font-medium text-sm">
                            {notification.title}
                          </span>
                          <span className="block text-sm text-muted-foreground mt-1">
                            {notification.content}
                          </span>
                          <span className="block text-xs text-muted-foreground mt-2">
                            {format(new Date(notification.createdAt), "PPp")}
                          </span>
                        </div>
                        {!notification.isRead && (
                          <Badge variant="secondary">New</Badge>
                        )}
                      </div>
                    </button>
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