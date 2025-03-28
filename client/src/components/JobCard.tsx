import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Loader2, CheckCircle2, AtSign, Bookmark, BookmarkCheck, Flag, Building, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { Job } from "@shared/schema";
import { useState } from "react";
import { ApplicationCreditsDialog } from "./ApplicationCreditsDialog";
import { ReportJobDialog } from "./ReportJobDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface JobCardProps {
  job: Job;
  onApply: () => void;
  onViewDetails: () => void;
  onSaveJob?: () => void;
  isApplied?: boolean;
  isApplying?: boolean;
  previouslyApplied?: boolean;
  isSaved?: boolean;
}

export function JobCard({ 
  job, 
  onApply, 
  onViewDetails, 
  onSaveJob,
  isApplied, 
  isApplying,
  previouslyApplied,
  isSaved = false
}: JobCardProps) {
  const { user } = useAuth();
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [localSaved, setLocalSaved] = useState(isSaved);

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

  const handleSaveClick = () => {
    if (!user) return;
    setLocalSaved(!localSaved);
    if (onSaveJob) {
      onSaveJob();
    }
  };
  
  const handleReportClick = () => {
    if (!user) return;
    setShowReportDialog(true);
  };

  return (
    <>
      <Card className="w-full transition-shadow hover:shadow-md relative border-2 border-border/50 h-full flex flex-col">
        <CardContent className="p-4 flex flex-col h-full">
          {/* First line: Job title, Save button, Report button, Pipeline ID */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold line-clamp-2">{job.title}</h3>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              {user ? (
                <>
                  <TooltipProvider delayDuration={0} skipDelayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleSaveClick}
                        >
                          {localSaved ? (
                            <BookmarkCheck className="h-4 w-4 text-primary" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-card border shadow-sm">
                        <p className="text-xs font-medium">
                          {localSaved ? "Unsave job" : "Save job"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider delayDuration={0} skipDelayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleReportClick}
                        >
                          <Flag className="h-4 w-4 text-amber-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-card border shadow-sm">
                        <p className="text-xs font-medium">
                          Report job
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              ) : (
                <>
                  <TooltipProvider delayDuration={0} skipDelayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/auth/login">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-card border shadow-sm">
                        <p className="text-xs font-medium">
                          Sign in to save job
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider delayDuration={0} skipDelayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/auth/login">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <Flag className="h-4 w-4 text-amber-500" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-card border shadow-sm">
                        <p className="text-xs font-medium">
                          Sign in to report job
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              <span className="text-xs text-muted-foreground font-mono">
                {job.jobIdentifier}
              </span>
            </div>
          </div>

          {/* Second line: Company and Location */}
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary" className="flex items-center text-xs">
              <Building2 className="mr-1 h-3 w-3" />
              {job.company}
            </Badge>
            <Badge variant="secondary" className="flex items-center text-xs">
              <MapPin className="mr-1 h-3 w-3" />
              {job.location}
            </Badge>
          </div>

          {/* Third line: Salary and job type */}
          <div className="flex flex-wrap gap-2 mb-auto">
            <Badge variant="secondary" className="flex items-center text-xs">
              <DollarSign className="mr-1 h-3 w-3" />
              {job.salary}
            </Badge>
            <Badge variant="default" className="text-xs flex-shrink-0">
              {job.type}
            </Badge>
          </div>

          {/* Action buttons */}
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
                <Button 
                  variant="outline" 
                  className="w-full h-8 text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300" 
                  size="sm"
                >
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

      <ReportJobDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        jobId={job.id}
        jobTitle={job.title}
      />
    </>
  );
}