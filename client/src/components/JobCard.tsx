import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, DollarSign, CheckCircle2, Eye } from "lucide-react";
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
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-primary">
              {job.title}
            </CardTitle>
            <div className="mt-2 flex items-center text-muted-foreground">
              <Building2 className="mr-2 h-4 w-4" />
              <span>{job.company}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant={isApplied ? "outline" : "default"}
            size="sm"
            onClick={() => onApply(job.id)}
            disabled={isApplied || isApplying}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {isApplied ? "Applied" : isApplying ? "Applying..." : "Quick Apply"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
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

        <div>
          <p className="text-sm text-muted-foreground">
            {job.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}