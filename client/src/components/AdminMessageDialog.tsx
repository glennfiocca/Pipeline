import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { Send, Loader2 } from "lucide-react";

interface Message {
  id: number;
  applicationId: number;
  content: string;
  isFromAdmin: boolean;
  isRead: boolean;
  createdAt: string;
  senderUsername: string;
}

interface AdminMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  companyName: string;
  username: string;
}

export function AdminMessageDialog({ 
  isOpen, 
  onClose, 
  applicationId, 
  companyName,
  username 
}: AdminMessageDialogProps) {
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  const queryKey = ["/api/applications", applicationId, "messages"];

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey,
    enabled: isOpen && applicationId > 0,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const messageData = {
        applicationId,
        content,
        isFromAdmin: true,
        senderUsername: username
      };

      console.log('Sending message data:', messageData);

      const response = await apiRequest(
        "POST",
        `/api/applications/${applicationId}/messages`,
        messageData
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(errorText || "Failed to send message");
      }

      const data = await response.json();
      console.log('Message response:', data);
      return data;
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
      console.error("Message error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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
      const date = parseISO(dateString);
      if (!isValid(date)) {
        throw new Error("Invalid date format");
      }
      return format(date, "MMM d, h:mm a");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Messages with {username}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ScrollArea className="h-[400px] pr-4">
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
                      className={`flex flex-col ${
                        message.isFromAdmin ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.isFromAdmin
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {message.senderUsername} • {formatMessageDate(message.createdAt)}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex items-end gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[80px]"
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
      </DialogContent>
    </Dialog>
  );
}