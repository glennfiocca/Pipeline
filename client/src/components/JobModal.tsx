import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, DollarSign, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { Job } from "@shared/schema";
import { useState, ReactNode } from "react";
import { ApplicationCreditsDialog } from "./ApplicationCreditsDialog";

interface JobModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (jobId: number) => void;
  isApplied?: boolean;
  isApplying?: boolean;
  previouslyApplied?: boolean;
  applicationControls?: ReactNode;
  alreadyApplied?: boolean;
}

export function JobModal({ 
  job, 
  isOpen, 
  onClose, 
  onApply, 
  isApplied, 
  isApplying,
  previouslyApplied,
  applicationControls,
  alreadyApplied
}: JobModalProps) {
  const { user } = useAuth();
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

  if (!job) return null;

  const buttonText = isApplying 
    ? "Applying..." 
    : previouslyApplied 
    ? "Reapply" 
    : isApplied 
    ? "Applied" 
    : "Apply";

  const isButtonDisabled = isApplying || (isApplied && !previouslyApplied);

  const handleApplyClick = () => {
    if (!user) return;
    setShowCreditsDialog(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center">
              <Building2 className="mr-2 h-3 w-3" />
              {job.company}
            </Badge>
            <Badge variant="secondary" className="flex items-center">
              <MapPin className="mr-2 h-3 w-3" />
              {job.location}
            </Badge>
            <Badge variant="secondary" className="flex items-center">
              <DollarSign className="mr-2 h-3 w-3" />
              {job.salary}
            </Badge>
            <Badge variant="default">
              {job.type}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <div className="text-muted-foreground whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Requirements</h3>
              <div className="text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  {job.requirements.split(';').map((req, index) => (
                    <li key={index}>{req.trim()}</li>
                  ))}
                </ul>
              </div>
            </div>

            {job.benefits && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Benefits</h3>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {job.benefits}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 mt-6">
          {user && !applicationControls ? (
            <Button
              onClick={handleApplyClick}
              disabled={isButtonDisabled}
              className="flex-1"
            >
              {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {buttonText}
            </Button>
          ) : user && applicationControls ? (
            applicationControls
          ) : (
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full">Sign in to Apply</Button>
            </Link>
          )}
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <ApplicationCreditsDialog
        isOpen={showCreditsDialog}
        onClose={() => setShowCreditsDialog(false)}
        onConfirm={() => {
          onApply && onApply(job.id);
          setShowCreditsDialog(false);
        }}
        jobTitle={job.title}
      />
    </Dialog>
  );
}