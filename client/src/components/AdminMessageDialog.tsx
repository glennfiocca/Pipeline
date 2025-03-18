import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { Send, Loader2, Minimize2, Maximize2, X, Users, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const queryKey = [`/api/applications/${applicationId}/messages`];

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey,
    enabled: isOpen && applicationId > 0,
  });

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const messageData = {
        applicationId,
        content,
        isFromAdmin: true,
        senderUsername: companyName
      };

      const response = await apiRequest(
        "POST",
        `/api/applications/${applicationId}/messages`,
        messageData
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData([queryKey], (old: Message[] | undefined) => [...(old || []), newMessage]);
      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
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

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsExpanded(false);
  };

  const handleMaximize = () => {
    setIsExpanded(!isExpanded);
    setIsMinimized(false);
  };

  // Add event handlers to stop propagation
  const handleContentClick = (e: React.MouseEvent) => {
    // Stop click events from propagating to elements behind the dialog
    e.stopPropagation();
  };

  // Add onMouseDown handler to prevent blur events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  // Use createPortal to render this component at the root level
  const content = (
    <>
      {/* Overlay that closes the dialog when clicked */}
      <div 
        className="fixed inset-0 bg-black/5 z-[9998] pointer-events-auto" 
        onClick={(e) => {
          // Only close if the click was directly on the backdrop itself
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        aria-hidden="true"
      />
      
      {/* Actual dialog content */}
      {isMinimized ? (
        <div 
          className="fixed bottom-4 right-4 w-64 bg-background border rounded-t-lg shadow-lg cursor-pointer z-[9999] pointer-events-auto"
          onClick={(e) => {
            // This is a separate element, no need to call stopPropagation
            setIsMinimized(false);
          }}
        >
          <div className="flex items-center justify-between p-2 bg-primary text-primary-foreground rounded-t-lg">
            <span className="font-medium text-sm truncate">
              Message to {username}
            </span>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground" onClick={(e) => {
                e.stopPropagation(); // This is needed to prevent the minimized container from expanding
                onClose();
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className={cn(
            "fixed bottom-4 right-4 bg-background border rounded-t-lg shadow-lg flex flex-col z-[9999] pointer-events-auto",
            isExpanded 
              ? "w-[600px] h-[80vh]" 
              : "w-[400px] h-[500px]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed height */}
          <div className="flex items-center justify-between p-2 bg-primary text-primary-foreground rounded-t-lg">
            <span className="font-medium">
              New Message to {username}
            </span>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground" onClick={handleMinimize}>
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground" onClick={handleMaximize}>
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground" onClick={onClose}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Headers - Fixed height */}
          <div className="border-b">
            {/* Recipients */}
            <div className="px-4 py-2 flex items-center">
              <span className="text-sm font-medium w-16">To:</span>
              <div className="flex items-center bg-muted/30 px-2 py-1 rounded text-sm">
                <Users className="h-3 w-3 mr-1" />
                <span>{username}</span>
              </div>
            </div>

            {/* Subject */}
            <div className="px-4 py-2">
              <span className="text-sm font-medium w-16">From:</span>
              <span className="ml-2">{companyName}</span>
            </div>
          </div>

          {/* Message container with explicit heights - this is key for scrolling */}
          <div className="flex flex-col" style={{ height: 'calc(100% - 162px)' }}>
            {/* Message thread - with explicit height */}
            <div 
              className="overflow-y-auto h-full"
              ref={scrollRef}
              onClick={(e) => e.stopPropagation()}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {messages.map((message) => (
                    message.content && (
                      <div
                        key={message.id}
                        className={cn(
                          "p-4 rounded-lg",
                          message.isFromAdmin
                            ? "bg-primary/10 mr-8"
                            : "bg-muted ml-8 border border-border/50"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">
                            {message.isFromAdmin ? companyName : username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Compose area - Fixed height */}
          <div className="p-3 border-t bg-muted/20" style={{ height: '156px' }}>
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="resize-none h-[100px] focus-visible:ring-0 border-0 shadow-none bg-transparent p-0"
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              autoFocus={!isMinimized}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Paperclip className="h-3 w-3 mr-1" />
                  Attach
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                size="sm"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Send className="h-3 w-3 mr-1" />
                )}
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Use createPortal to render at the document body level
  return createPortal(content, document.body);
}