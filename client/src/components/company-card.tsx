import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Job } from "@shared/schema";

interface CompanyCardProps {
  job: Job;
}

export function CompanyCard({ job }: CompanyCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={`https://avatar.vercel.sh/${job.company}`} />
          <AvatarFallback>{job.company[0]}</AvatarFallback>
        </Avatar>
        <CardTitle>{job.company}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm font-medium">About</div>
          <p className="text-sm text-muted-foreground">
            {job.description.split(' ').slice(0, 20).join(' ')}...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
