import { JobList } from "@/components/JobList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col py-4">
      <header className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold">Job Listings</h1>
        <p className="text-lg text-muted-foreground">
          Find your next opportunity from our curated list of positions
        </p>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title, company, or skills..."
              className="pl-10"
            />
          </div>
          <Button>
            Filter
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <JobList />
      </main>
    </div>
  );
}
