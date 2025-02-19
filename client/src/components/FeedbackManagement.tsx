import { useQuery } from "@tanstack/react-query";
import type { Feedback } from "@shared/schema";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { format } from "date-fns";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function FeedbackManagement() {
  const { data: feedbackList = [] } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "received":
        return "bg-blue-500/10 text-blue-500";
      case "resolved":
        return "bg-green-500/10 text-green-500";
      case "rejected":
        return "bg-red-500/10 text-red-500";
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {feedbackList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No feedback submissions yet.
              </div>
            ) : (
              feedbackList.map((feedback) => (
                <Card key={feedback.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= feedback.rating
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="outline" className={getStatusColor(feedback.status)}>
                          {feedback.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(feedback.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {feedback.category}
                      </Badge>
                      <p className="text-sm text-muted-foreground">{feedback.comment}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}