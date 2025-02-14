import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { format } from "date-fns";
import { Mail } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MessageDialogProps {
  applicationId: number;
  jobTitle: string;
  company: string;
}

export function MessageDialog({ applicationId, jobTitle, company }: MessageDialogProps) {
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [`/api/applications/${applicationId}/messages`],
    enabled: isOpen,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: [`/api/applications/${applicationId}/messages/unread`],
  });

  const createMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest(
        "POST",
        `/api/applications/${applicationId}/messages`,
        { content }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({
        queryKey: [`/api/applications/${applicationId}/messages`],
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

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/messages/${messageId}/read`,
        {}
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to mark message as read");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/applications/${applicationId}/messages`],
      });
    },
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;
    createMessageMutation.mutate(newMessage.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="relative">
          <Mail className="h-4 w-4 mr-2" />
          Messages
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Messages - {jobTitle} at {company}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-full">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "p-4 rounded-lg",
                      message.isFromAdmin
                        ? "bg-muted ml-8"
                        : "bg-primary/10 mr-8"
                    )}
                    onClick={() => {
                      if (!message.isRead && !message.isFromAdmin) {
                        markAsReadMutation.mutate(message.id);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">
                        {message.isFromAdmin ? "Admin" : "You"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.metadata && Object.keys(message.metadata).length > 0 && (
                      <div className="mt-2 text-sm">
                        {message.metadata.interviewDate && (
                          <p className="text-muted-foreground">
                            Interview scheduled for:{" "}
                            {format(
                              new Date(message.metadata.interviewDate),
                              "MMM d, yyyy h:mm a"
                            )}
                          </p>
                        )}
                        {message.metadata.interviewLocation && (
                          <p className="text-muted-foreground">
                            Location: {message.metadata.interviewLocation}
                          </p>
                        )}
                        {message.metadata.interviewType && (
                          <p className="text-muted-foreground">
                            Type: {message.metadata.interviewType}
                          </p>
                        )}
                        {message.metadata.additionalNotes && (
                          <p className="text-muted-foreground mt-2">
                            Additional Notes: {message.metadata.additionalNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="mt-4 flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={createMessageMutation.isPending}
            >
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
