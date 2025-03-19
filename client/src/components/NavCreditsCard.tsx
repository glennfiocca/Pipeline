import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, startOfTomorrow } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CreditCard } from "lucide-react";
import type { Application } from "@shared/schema";
import { useAuth } from "../hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function NavCreditsCard() {
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
      
      // Get start of tomorrow for reset time
      const tomorrow = startOfTomorrow();
      const zonedTomorrow = toZonedTime(tomorrow, userTimezone);

      // If last reset was before today, count only today's applications
      const today = zonedNow.toISOString().split('T')[0];
      const applicationsToday = applications?.filter(app => {
        const appDate = toZonedTime(new Date(app.appliedAt), userTimezone);
        return appDate.toISOString().startsWith(today);
      })?.length || 0;

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
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-accent/50 transition-colors">
            <CreditCard className="h-4 w-4 text-primary" />
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium px-2 py-0 h-5">
              {remainingDailyCredits}/{user.bankedCredits}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-card border shadow-md">
          <div className="p-2 max-w-xs">
            <p className="font-medium text-sm">
              {remainingDailyCredits} daily credits / {user.bankedCredits} banked credits
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Daily credits reset {timeToReset}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              You get 10 free application credits every day at midnight in your timezone. 
              Banked credits never expire and can be used when you run out of daily credits.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 