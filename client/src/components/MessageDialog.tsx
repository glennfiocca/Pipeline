import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { format } from "date-fns";
import { Mail, Loader2, Minimize2, Maximize2, X, Users, Paperclip, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { createPortal } from "react-dom";

interface MessageDialogProps {
  applicationId: number;
  jobTitle: string;
  company: string;
  isAdmin?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function MessageDialog({
  applicationId,
  jobTitle,
  company,
  isAdmin,
  isOpen: propIsOpen,
  onClose
}: MessageDialogProps) {
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
      if (propIsOpen) {
        setIsMinimized(false);
      }
    }
  }, [propIsOpen]);

  const queryKey = [`/api/applications/${applicationId}/messages`];

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey,
    enabled: isOpen,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: [`/api/applications/${applicationId}/messages/unread`],
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

  const createMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.username) {
        throw new Error("User not authenticated");
      }

      const messageData = {
        applicationId,
        content,
        isFromAdmin: false,
        senderUsername: user.username
      };

      const res = await apiRequest(
        "POST",
        `/api/applications/${applicationId}/messages`,
        messageData
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData([queryKey],
        (old: Message[] | undefined) => [...(old || []), newMessage]
      );
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

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/messages/${messageId}/read`,
        {}
      );
      if (!res.ok) {
        throw new Error("Failed to mark message as read");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/applications/${applicationId}/messages/unread`],
      });
    },
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;
    createMessageMutation.mutate(newMessage.trim());
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsExpanded(false);
  };

  const handleMaximize = () => {
    setIsExpanded(!isExpanded);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleOpen = () => {
    setIsOpen(true);
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

  if (!isOpen) {
    return (
      <Button 
        variant="ghost" 
        className="relative"
        onClick={handleOpen}
      >
        <Mail className="h-4 w-4 mr-2" />
        Messages
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>
    );
  }

  // Gmail-like compose box in the bottom right
  const content = (
    <>
      {/* Overlay that closes the dialog when clicked */}
      <div 
        className="fixed inset-0 bg-black/5 z-[9998] pointer-events-auto" 
        onClick={(e) => {
          // Only close if the click was directly on the backdrop itself
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
        aria-hidden="true"
      />
      
      {/* Main dialog content - ensure it's above the backdrop */}
      {isMinimized ? (
        <div 
          className="fixed bottom-4 right-4 w-64 bg-background border rounded-t-lg shadow-lg cursor-pointer z-[9999] pointer-events-auto"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center justify-between p-2 bg-primary text-primary-foreground rounded-t-lg">
            <span className="font-medium text-sm truncate">
              Message - {jobTitle} at {company}
            </span>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-primary-foreground" 
                onClick={(e) => {
                  e.stopPropagation(); // This is needed to prevent the minimized container from expanding
                  handleClose();
                }}
              >
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
              New Message - {jobTitle} at {company}
            </span>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-primary-foreground" 
                onClick={handleMinimize}
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-primary-foreground" 
                onClick={handleMaximize}
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-primary-foreground" 
                onClick={handleClose}
              >
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
                <span>{company}</span>
              </div>
            </div>

            {/* Subject */}
            <div className="px-4 py-2">
              <span className="text-sm font-medium w-16">Subject:</span>
              <span className="ml-2">{jobTitle} Application</span>
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
              <div className="space-y-4 p-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((message) => (
                    message.content && (
                      <div
                        key={message.id}
                        className={cn(
                          "p-4 rounded-lg",
                          message.isFromAdmin
                            ? "bg-muted ml-8 border border-border/50"
                            : "bg-primary/10 mr-8"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!message.isRead && !message.isFromAdmin) {
                            markAsReadMutation.mutate(message.id);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">
                            {message.isFromAdmin ? company : message.senderUsername}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    )
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Compose area - Fixed height */}
          <div className="p-3 border-t bg-muted/20" style={{ height: '156px' }}>
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="resize-none h-[100px] focus-visible:ring-0 border-0 shadow-none bg-transparent p-0"
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
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
                onClick={handleSend}
                disabled={createMessageMutation.isPending}
                size="sm"
              >
                {createMessageMutation.isPending ? (
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