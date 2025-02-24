import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 lg:py-16">
        <div className="w-full max-w-[2000px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-8 sm:space-y-12 lg:space-y-16">
            <div className="space-y-4 text-center max-w-[90vw]">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl/none">
                One Application, Any Job
              </h1>
              <h2 className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground">
                Your Career Pipeline Starts Here
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl">
              {[
                { number: 1, text: "Signup" },
                { number: 2, text: "Make a Profile" },
                { number: 3, text: "Apply" },
              ].map((step) => (
                <div key={step.number} className="flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full border-2 border-primary flex items-center justify-center mb-4 transition-transform hover:scale-110 hover:border-4 hover:shadow-lg">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold">{step.number}</span>
                  </div>
                  <span className="text-lg sm:text-xl lg:text-2xl font-medium">{step.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg justify-center">
              <Link href="/jobs" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-12 sm:h-14 text-lg">
                  Browse Jobs
                </Button>
              </Link>
              <Link href={user ? "/profile" : "/auth/register"} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-12 sm:h-14 text-lg">
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