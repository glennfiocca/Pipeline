import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import type { Application } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function ApplicationCreditsCard() {
  const { user } = useAuth();

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: !!user, // Only fetch if user is logged in
  });

  const today = new Date().toISOString().split('T')[0];
  const applicationsToday = applications?.filter(app => 
    app.appliedAt.startsWith(today)
  )?.length ?? 0;

  const remainingCredits = 10 - applicationsToday;
  const resetTime = format(new Date().setHours(24, 0, 0, 0), "h:mm a");

  if (!user) return null; // Don't render if not logged in

  return (
    <Card className="w-auto inline-flex items-center p-2 bg-primary/5 border-none shadow-none">
      <CardContent className="p-2 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" />
        <span className="text-sm">
          <span className="font-medium">{remainingCredits}</span> applications remaining
          <span className="text-muted-foreground"> · Resets at {resetTime}</span>
        </span>
      </CardContent>
    </Card>
  );
}