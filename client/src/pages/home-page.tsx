import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  One Application, Any Job
                </h1>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-muted-foreground">
                  Your Career Pipeline Starts Here
                </h2>
              </div>
              <div className="space-x-4">
                <Link href="/jobs">
                  <Button size="lg">
                    Browse Jobs
                  </Button>
                </Link>
                <Link href={user ? "/profile" : "/auth/register"}>
                  <Button variant="outline" size="lg">
                    {user ? "Create Profile" : "Sign Up to Create Profile"}
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