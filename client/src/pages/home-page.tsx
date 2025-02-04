import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Your Career Pipeline Starts Here
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  Discover and apply to the best STEM and Finance jobs with one click. Let Pipeline streamline your job search.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/jobs">
                  <Button size="lg">
                    Browse Jobs
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" size="lg">
                    Create Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
