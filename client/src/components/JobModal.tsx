import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, DollarSign, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { Job } from "@shared/schema";

interface JobModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (jobId: number) => void;
  isApplied?: boolean;
  isApplying?: boolean;
  previouslyApplied?: boolean;
}

export function JobModal({ 
  job, 
  isOpen, 
  onClose, 
  onApply, 
  isApplied, 
  isApplying,
  previouslyApplied
}: JobModalProps) {
  const { user } = useAuth();

  if (!job) return null;

  const getButtonText = () => {
    if (isApplying) return "Applying...";
    if (previouslyApplied) return "Reapply";
    if (isApplied) return "Applied";
    return "Apply";
  };

  const getButtonVariant = () => {
    if (previouslyApplied) return "default";
    if (isApplied) return "outline";
    return "default";
  };

  const isButtonDisabled = () => {
    if (isApplying) return true;
    if (isApplied && !previouslyApplied) return true;
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{job.title}</DialogTitle>
          <DialogDescription>
            <div className="flex items-center text-lg text-foreground mt-2">
              <Building2 className="mr-2 h-5 w-5" />
              <span>{job.company}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
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
              <p className="text-muted-foreground whitespace-pre-wrap">
                {job.description}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Requirements</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {job.requirements.split(';').map((req, index) => (
                  <li key={index}>
                    {req.trim()}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            {user ? (
              <Button
                variant={getButtonVariant()}
                onClick={() => onApply(job.id)}
                disabled={isButtonDisabled()}
                className="w-full"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {getButtonText()}
                  </>
                )}
              </Button>
            ) : (
              <Link href="/auth/login" className="w-full">
                <Button variant="default" className="w-full">
                  Sign in to Apply
                </Button>
              </Link>
            )}
          </div>

          {job.source && (
            <div className="text-center">
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary"
              >
                View on {job.source}
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}