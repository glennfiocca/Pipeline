import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex items-center justify-center">
        <div className="container px-4 md:px-6 py-10 md:py-14">
          <div className="flex flex-col items-center justify-center max-w-3xl mx-auto space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl/none">
                One Application, Any Job
              </h1>
              <h2 className="text-xl sm:text-2xl text-muted-foreground">
                Your Career Pipeline Starts Here
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md justify-center">
              <Link href="/jobs" className="w-full sm:w-auto">
                <Button size="lg" className="w-full">
                  Browse Jobs
                </Button>
              </Link>
              <Link href={user ? "/profile" : "/auth/register"} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full">
                  {user ? "Create Profile" : "Sign Up to Create Profile"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}