import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import type { Application } from "@shared/schema";

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
  // Get today's applications
  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const today = new Date().toISOString().split('T')[0];
  const applicationsToday = applications.filter(app => 
    app.appliedAt.startsWith(today)
  ).length;

  const remainingCredits = 10 - applicationsToday;
  const resetTime = format(new Date().setHours(24, 0, 0, 0), "h:mm a");

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Use Application Credit
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              You are about to use 1 application credit to apply for{" "}
              <strong>{jobTitle}</strong>.
            </p>

            <div className="rounded-md bg-primary/10 p-4 space-y-2">
              <p className="font-semibold text-primary">Application Credits:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You have {remainingCredits} credits remaining today</li>
                <li>Credits reset at {resetTime}</li>
                <li>Unused credits do not roll over</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Note: Each user is limited to 10 applications per 24-hour period to ensure
              quality applications and fair distribution of opportunities.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={remainingCredits <= 0}
          >
            {remainingCredits > 0
              ? "Use Credit & Apply"
              : "No Credits Remaining"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}