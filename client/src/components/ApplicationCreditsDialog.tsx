import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import type { Application } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface ApplicationCreditsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  jobTitle: string;
}

export function ApplicationCreditsDialog({
  isOpen,
  onClose,
  onConfirm,
  jobTitle,
}: ApplicationCreditsDialogProps) {
  const { user } = useAuth();

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: !!user && isOpen,
  });

  const today = new Date().toISOString().split('T')[0];
  const applicationsToday = applications?.filter(app =>
    app.appliedAt.startsWith(today)
  )?.length ?? 0;

  const remainingDailyCredits = 10 - applicationsToday;
  const resetTime = format(new Date().setHours(24, 0, 0, 0), "h:mm a");

  const handleConfirm = () => {
    if (remainingDailyCredits > 0) {
      onConfirm();
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Use Application Credit
          </AlertDialogTitle>
          <div className="space-y-4">
            <div>
              You are about to use 1 application credit to apply for{" "}
              <strong>{jobTitle}</strong>
            </div>

            <div className="rounded-md bg-primary/10 p-4">
              <div className="font-semibold text-primary mb-2">
                Application Credits:
              </div>
              <ul className="list-disc list-inside space-y-1">
                <li>Daily credits remaining: {remainingDailyCredits}</li>
                <li>Daily credits reset at {resetTime}</li>
                <li>Daily credits do not roll over</li>
              </ul>
            </div>

            <div className="text-sm text-muted-foreground">
              Each user gets 10 free applications per 24-hour period.
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={remainingDailyCredits <= 0}
          >
            {remainingDailyCredits > 0
              ? "Use Credit & Apply"
              : "No Credits Available"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}