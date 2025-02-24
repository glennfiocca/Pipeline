import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow, isAfter, startOfTomorrow } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CreditCard, HelpCircle } from "lucide-react";
import type { Application } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

export function ApplicationCreditsCard() {
  const { user } = useAuth();
  const [timeToReset, setTimeToReset] = useState<string>("");
  const [remainingDailyCredits, setRemainingDailyCredits] = useState<number>(10);

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    // Get user's timezone, fallback to browser's timezone if not set
    const userTimezone = user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const calculateCredits = () => {
      const now = new Date();
      const zonedNow = toZonedTime(now, userTimezone);
      const lastResetDate = user.lastCreditReset ? toZonedTime(new Date(user.lastCreditReset), userTimezone) : zonedNow;

      // Get start of tomorrow for reset time
      const tomorrow = startOfTomorrow();
      const zonedTomorrow = toZonedTime(tomorrow, userTimezone);

      // If last reset was before today, count only today's applications
      const today = zonedNow.toISOString().split('T')[0];
      const applicationsToday = applications.filter(app => {
        const appDate = toZonedTime(new Date(app.appliedAt), userTimezone);
        return appDate.toISOString().startsWith(today);
      }).length;

      setRemainingDailyCredits(10 - applicationsToday);

      // Calculate time until next reset
      const timeLeft = formatDistanceToNow(zonedTomorrow, { addSuffix: true });
      setTimeToReset(timeLeft);
    };

    calculateCredits();
    // Update countdown every minute
    const interval = setInterval(calculateCredits, 60000);
    return () => clearInterval(interval);
  }, [user, applications]);

  if (!user) return null;

  return (
    <Card className="w-auto inline-flex items-center p-2 bg-primary/5 border-none shadow-none">
      <CardContent className="p-2 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" />
        <span className="text-sm">
          <span className="font-medium">{remainingDailyCredits}</span> daily credits remaining ·
          <span className="text-muted-foreground"> Resets {timeToReset}</span>
        </span>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                You get 10 free application credits every day at midnight in your timezone. Use them wisely!
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}