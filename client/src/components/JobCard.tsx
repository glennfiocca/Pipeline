import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Loader2, CheckCircle2, AtSign } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { Job } from "@shared/schema";
import { useState } from "react";
import { ApplicationCreditsDialog } from "./ApplicationCreditsDialog";

interface JobCardProps {
  job: Job;
  onApply: () => void;
  onViewDetails: () => void;
  isApplied?: boolean;
  isApplying?: boolean;
  previouslyApplied?: boolean;
}

export function JobCard({ 
  job, 
  onApply, 
  onViewDetails, 
  isApplied, 
  isApplying,
  previouslyApplied 
}: JobCardProps) {
  const { user } = useAuth();
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

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
    <>
      <Card className="w-full transition-shadow hover:shadow-md relative border-2 border-border/50 h-full flex flex-col">
        <div className="absolute top-2 right-2">
          <span className="text-xs text-muted-foreground font-mono">
            {job.jobIdentifier}
          </span>
        </div>
        <CardContent className="p-4 flex flex-col h-full">
          <div className="mb-2">
            <h3 className="text-lg font-semibold line-clamp-2 mb-1">{job.title}</h3>
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center overflow-hidden">
                <AtSign className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-sm truncate">{job.company}</span>
              </div>
              <Badge variant="default" className="text-xs ml-2 flex-shrink-0">
                {job.type}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-auto mt-2">
            <Badge variant="secondary" className="flex items-center text-xs">
              <MapPin className="mr-1 h-3 w-3" />
              {job.location}
            </Badge>
            <Badge variant="secondary" className="flex items-center text-xs">
              <DollarSign className="mr-1 h-3 w-3" />
              {job.salary}
            </Badge>
          </div>

          <div className="flex gap-2 mt-4">
            {user ? (
              <Button 
                variant={previouslyApplied ? "default" : isApplied ? "outline" : "default"}
                onClick={handleApplyClick}
                disabled={isButtonDisabled}
                className="flex-1 py-1 px-2 h-8 text-sm"
                size="sm"
              >
                {isApplying ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                )}
                {buttonText}
              </Button>
            ) : (
              <Link href="/auth/login" className="flex-1">
                <Button variant="default" className="w-full h-8 text-sm" size="sm">
                  Sign in to Apply
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              onClick={onViewDetails}
              className="flex-1 h-8 text-sm"
              size="sm"
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <ApplicationCreditsDialog
        isOpen={showCreditsDialog}
        onClose={() => setShowCreditsDialog(false)}
        onConfirm={() => {
          onApply();
          setShowCreditsDialog(false);
        }}
        jobTitle={job.title}
      />
    </>
  );
}