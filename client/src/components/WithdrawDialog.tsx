import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

interface WithdrawDialogProps {
  onWithdraw: () => void;
  isPending: boolean;
}

export function WithdrawDialog({ onWithdraw, isPending }: WithdrawDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-500 hover:text-red-600"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Withdraw"
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Warning: Irreversible Action
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to withdraw this application? This action <strong>cannot</strong> be undone.
            </p>
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 mt-2">
              <p>Please note:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Once withdrawn, you will not be able to apply for this role again</li>
                <li>Your application history will be permanently marked as withdrawn</li>
                <li>The employer will be notified of your withdrawal</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onWithdraw}
            className="bg-red-500 hover:bg-red-600"
          >
            Withdraw Application
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}