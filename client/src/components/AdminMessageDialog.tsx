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
import { format } from "date-fns";
import { Send, Loader2 } from "lucide-react";

interface Message {
  id: number;
  applicationId: number;
  sender: string;
  content: string;
  timestamp: string;
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

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", applicationId],
    enabled: isOpen,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const messageData = {
        applicationId,
        content,
        sender: companyName,
        timestamp: new Date().toISOString()
      };

      const response = await apiRequest(
        "POST",
        `/api/messages`,
        messageData
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", applicationId] });
      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
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
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                      message.sender === companyName
                        ? "items-end"
                        : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === companyName
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {message.sender} • {format(new Date(message.timestamp), "MMM d, h:mm a")}
                    </div>
                  </div>
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