import { JobList } from "@/components/JobList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function HomePage() {
  return (
    <div className="w-full max-w-[2000px] mx-auto py-6 sm:py-8 lg:py-12">
      <header className="mb-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Job Listings</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Find your next opportunity from our curated list of positions
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title, company, or skills..."
              className="pl-10"
            />
          </div>
          <Button className="sm:w-auto">
            Filter
          </Button>
        </div>
      </header>

      <main>
        <JobList />
      </main>
    </div>
  );
}
