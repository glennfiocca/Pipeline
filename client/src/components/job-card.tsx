import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, DollarSign, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { Job } from "@shared/schema";

interface JobCardProps {
  job: Job;
  onApply: () => void;
  onViewDetails: () => void;
  isApplied?: boolean;
  isApplying?: boolean;
}

export function JobCard({ job, onApply, onViewDetails, isApplied, isApplying }: JobCardProps) {
  const { user } = useAuth();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{job.title}</span>
          <Badge variant="secondary">{job.type}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Building2 className="mr-2 h-4 w-4" />
            {job.company}
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            {job.location}
          </div>
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="mr-2 h-4 w-4" />
            {job.salary}
          </div>
          <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
            {job.description}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {user ? (
          <Button 
            onClick={onApply} 
            className="flex-1"
            disabled={isApplied || isApplying}
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : isApplied ? (
              "Applied"
            ) : (
              "Apply"
            )}
          </Button>
        ) : (
          <Link href="/auth/login" className="flex-1">
            <Button className="w-full">
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
      </CardFooter>
    </Card>
  );
}
