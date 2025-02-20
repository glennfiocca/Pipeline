import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { CreditCard } from "lucide-react";
import type { User } from "@shared/schema";

interface ManageCreditsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  user: User;
}

export function ManageCreditsDialog({
  isOpen,
  onClose,
  onConfirm,
  user,
}: ManageCreditsDialogProps) {
  const [amount, setAmount] = useState<number>(0);

  const handleSubmit = () => {
    onConfirm(amount);
    setAmount(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manage Banked Credits
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-4">
              <p>
                Add or remove banked credits for user: <strong>{user.username}</strong>
              </p>
              <div className="rounded-md bg-primary/10 p-4">
                <p className="font-semibold text-primary mb-2">Current Credits:</p>
                <p>Banked credits available: {user.bankedCredits}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  Enter a positive number to add credits or a negative number to remove credits.
                </p>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount..."
                />
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={amount === 0}>
            Update Credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
