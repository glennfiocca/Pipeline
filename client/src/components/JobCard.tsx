import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, DollarSign, Briefcase } from "lucide-react";
import type { Job } from "@shared/schema";

interface JobCardProps {
  job: Job;
  onApply: (jobId: number) => void;
}

export function JobCard({ job, onApply }: JobCardProps) {
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
          <Badge variant={job.type === "Full-time" ? "default" : "secondary"}>
            {job.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <DollarSign className="mr-2 h-4 w-4" />
            <span>{job.salary}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Briefcase className="mr-2 h-4 w-4" />
            <span>{job.source}</span>
          </div>
        </div>

        <CardDescription className="mt-4">
          {job.description}
        </CardDescription>

        <div className="mt-4">
          <h4 className="mb-2 font-medium">Requirements:</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {job.requirements.split(';').map((req, index) => (
              <li key={index} className="ml-2">
                {req.trim()}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 bg-muted/10 pt-6">
        <Button variant="outline" onClick={() => window.open(job.sourceUrl, '_blank')}>
          View Original
        </Button>
        <Button onClick={() => onApply(job.id)}>
          Apply Now
        </Button>
      </CardFooter>
    </Card>
  );
}
