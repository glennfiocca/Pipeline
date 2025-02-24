import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CreditCard, HelpCircle } from "lucide-react";
import type { Application } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ApplicationCreditsCard() {
  const { user } = useAuth();

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: !!user,
  });

  const today = new Date().toISOString().split('T')[0];
  const applicationsToday = applications?.filter(app => 
    app.appliedAt.startsWith(today)
  )?.length ?? 0;

  const remainingDailyCredits = 10 - applicationsToday;
  const resetTime = format(new Date().setHours(24, 0, 0, 0), "h:mm a");

  if (!user) return null;

  return (
    <Card className="w-auto inline-flex items-center p-2 bg-primary/5 border-none shadow-none">
      <CardContent className="p-2 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" />
        <span className="text-sm">
          <span className="font-medium">{remainingDailyCredits}</span> daily credits remaining
          <span className="text-muted-foreground"> · Resets at {resetTime}</span>
        </span>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                You get 10 free application credits every day at reset time. Use them wisely!
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}