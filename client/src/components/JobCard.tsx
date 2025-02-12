import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, DollarSign } from "lucide-react";
import type { Job } from "@shared/schema";

interface JobCardProps {
  job: Job;
  onApply: (jobId: number) => void;
  onViewDetails: () => void;
  isApplied?: boolean;
  isApplying?: boolean;
}

export function JobCard({ job, onApply, onViewDetails, isApplied, isApplying }: JobCardProps) {
  return (
    <Card className="w-full transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">
            {job.title}
          </h3>
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
          {job.description}
        </p>

        <div className="flex gap-4">
          <Button
            onClick={() => onApply(job.id)}
            disabled={isApplied || isApplying}
            className="flex-1"
          >
            {isApplied ? "Applied" : isApplying ? "Applying..." : "Quick Apply"}
          </Button>
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
