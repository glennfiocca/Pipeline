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
  const [isOpen, setIsOpen] = useState(propIsOpen || false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Track unread count
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Close dialog from parent
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
      if (propIsOpen) {
        setIsMinimized(false);
      }
    }
  }, [propIsOpen]);

  // Function to calculate max height for the dialog
  const getMaxDialogHeight = () => {
    // Return a value that's responsive to window height
    const windowHeight = window.innerHeight;
    return Math.min(700, windowHeight - 80); // 80px buffer from edges
  };

  const queryKey = [`/api/applications/${applicationId}/messages`];

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey,
    enabled: isOpen && applicationId > 0,
    refetchInterval: isOpen && !isMinimized ? 5000 : false,
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest(
        "PATCH",
        `/api/applications/${applicationId}/messages/${messageId}/read`,
        {}
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to mark message as read");
      }

      return response.json();
    },
    onSuccess: (updatedMessage) => {
      queryClient.setQueryData<Message[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map(message => 
          message.id === updatedMessage.id 
            ? { ...message, isRead: true } 
            : message
        );
      });
    }
  });

  // Count unread messages
  useEffect(() => {
    if (messages) {
      const count = messages.filter(m => !m.isRead && m.isFromAdmin).length;
      setUnreadCount(count);
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageEndRef.current && !isMinimized) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Auto-focus textarea when opening
  useEffect(() => {
    if (isOpen && !isMinimized && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  // Create a new message
  const createMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest(
        "POST",
        `/api/applications/${applicationId}/messages`,
        {
          applicationId,
          content,
          isFromAdmin: false,
          senderUsername: user?.username || "You"
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData<Message[]>(queryKey, (old) => [...(old || []), newMessage]);
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

  const handleSend = () => {
    const trimmedMessage = newMessage.trim();
    if (trimmedMessage) {
      createMessageMutation.mutate(trimmedMessage);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Force a re-render when window is resized
      setIsExpanded(prevExpanded => {
        // This triggers a re-render without actually changing the value
        return prevExpanded;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          className="fixed bottom-4 right-4 w-64 bg-background border rounded-lg shadow-lg cursor-pointer z-[9999] pointer-events-auto overflow-hidden"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center justify-between p-2 bg-primary text-primary-foreground">
            <span className="font-medium text-sm truncate">
              Message - {jobTitle} at {company}
            </span>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" 
                onClick={(e) => {
                  e.stopPropagation(); // This is needed to prevent the minimized container from expanding
                  handleClose();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="p-2 bg-muted/30 text-xs">
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) : (
        <div 
          className={cn(
            "fixed bottom-4 right-4 bg-background border rounded-lg shadow-xl flex flex-col z-[9999] pointer-events-auto",
            isExpanded 
              ? "w-[min(800px,calc(100vw-32px))]" 
              : "w-[min(500px,calc(100vw-32px))]"
          )}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            height: isExpanded 
              ? `min(${getMaxDialogHeight()}px, calc(100vh - 32px))` 
              : `min(600px, calc(100vh - 32px))`,
            maxHeight: 'calc(100vh - 32px)'
          }}
        >
          {/* Header - Fixed height */}
          <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground rounded-t-lg">
            <span className="font-medium truncate">
              Message - {jobTitle} at {company}
            </span>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" 
                onClick={handleMinimize}
                title="Minimize"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" 
                onClick={handleMaximize}
                title={isExpanded ? "Reduce size" : "Expand"}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" 
                onClick={handleClose}
                title="Close"
              >
                <X className="h-4 w-4" />
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

          {/* Message container - flexible height with proper scrolling */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-1">
              <div className="space-y-4 p-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  <>
                    {messages.map((message) => (
                      message.content && (
                        <div
                          key={message.id}
                          className={cn(
                            "p-4 rounded-lg shadow-sm border border-border/30",
                            message.isFromAdmin
                              ? "bg-muted/50 ml-8" 
                              : "bg-primary/5 mr-8"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!message.isRead && message.isFromAdmin) {
                              markAsReadMutation.mutate(message.id);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">
                              {message.isFromAdmin ? company : message.senderUsername || "You"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.createdAt), "MMM d, yyyy h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {!message.isRead && message.isFromAdmin && (
                            <div className="mt-2 text-xs font-medium text-primary">New</div>
                          )}
                        </div>
                      )
                    ))}
                    <div ref={messageEndRef} />
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Compose area - Fixed height with responsive design */}
          <div className="p-3 border-t bg-muted/20">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="resize-none h-[80px] focus-visible:ring-0 border border-input/50 shadow-sm bg-background p-2 rounded-md"
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
                disabled={!newMessage.trim() || createMessageMutation.isPending}
                size="sm"
                className="transition-all"
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