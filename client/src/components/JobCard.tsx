import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, DollarSign, BookmarkPlus, CheckCircle2 } from "lucide-react";
import type { Job } from "@shared/schema";

interface JobCardProps {
  job: Job;
  onApply: (jobId: number) => void;
  onSave?: (jobId: number) => void;
  isApplied?: boolean;
}

export function JobCard({ job, onApply, onSave, isApplied }: JobCardProps) {
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
          <div className="flex gap-2">
            {onSave && (
              <Button variant="outline" size="sm" onClick={() => onSave(job.id)}>
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
            <Button
              variant={isApplied ? "outline" : "default"}
              size="sm"
              onClick={() => onApply(job.id)}
              disabled={isApplied}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isApplied ? "Applied" : "Apply"}
            </Button>
          </div>
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

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">
              {job.description}
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Requirements</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {job.requirements.split(';').map((req, index) => (
                <li key={index}>
                  {req.trim()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/10 pt-6">
        <div className="flex w-full justify-between items-center text-sm text-muted-foreground">
          <span>Posted {new Date(job.lastCheckedAt).toLocaleDateString()}</span>
          {job.source && (
            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              View on {job.source}
            </a>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}