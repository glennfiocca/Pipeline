import { createContext, useContext, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Notification } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  isLoading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    staleTime: 0,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notifications/${id}/mark-read`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`Attempting to delete notification with ID: ${id}`);
      
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      console.log(`Delete response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage = "Failed to delete notification";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("Delete notification error:", errorData);
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }
      
      console.log(`Successfully deleted notification with ID: ${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      console.log(`Updating cache after successful deletion of ID: ${deletedId}`);
      
      queryClient.setQueryData<Notification[]>(["/api/notifications"], (oldData) => {
        if (!oldData) return [];
        const filteredData = oldData.filter(n => n.id !== deletedId);
        console.log(`Filtered ${oldData.length} notifications to ${filteredData.length}`);
        return filteredData;
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      
      toast({
        title: "Success",
        description: "Notification deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to delete notification:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  const value = {
    notifications,
    unreadCount,
    markAsRead: (id: number) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: number) => deleteNotificationMutation.mutate(id),
    isLoading,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}