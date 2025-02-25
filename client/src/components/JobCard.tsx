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
      <Card className="w-full transition-shadow hover:shadow-md relative">
        <div className="absolute top-2 right-2">
          <span className="text-xs text-muted-foreground font-mono">
            {job.jobIdentifier}
          </span>
        </div>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
            <div className="flex items-center text-muted-foreground">
              <AtSign className="mr-1 h-4 w-4" />
              <span>{job.company}</span>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
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

          <p className="text-sm text-muted-foreground mb-6">
            {job.description.length > 150 
              ? `${job.description.substring(0, 150)}...` 
              : job.description}
          </p>

          <div className="flex gap-4">
            {user ? (
              <Button 
                variant={previouslyApplied ? "default" : isApplied ? "outline" : "default"}
                onClick={handleApplyClick}
                disabled={isButtonDisabled}
                className="flex-1"
              >
                {isApplying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                {buttonText}
              </Button>
            ) : (
              <Link href="/auth/login" className="flex-1">
                <Button variant="default" className="w-full">
                  Sign in to Apply
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              onClick={onViewDetails}
              className="flex-1"
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