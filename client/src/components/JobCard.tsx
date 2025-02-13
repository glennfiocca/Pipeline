import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, DollarSign, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { Job } from "@shared/schema";

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
    <Card className="w-full transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
          <div className="flex items-center text-muted-foreground">
            <Building2 className="mr-2 h-4 w-4" />
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
              variant={getButtonVariant()}
              onClick={onApply}
              disabled={isButtonDisabled()}
              className="flex-1"
            >
              {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getButtonText()}
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
  );
}