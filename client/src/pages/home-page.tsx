import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex items-center justify-center">
        <div className="container px-4 md:px-6 lg:px-8 py-10 md:py-14 lg:py-20">
          <div className="flex flex-col items-center justify-center mx-auto space-y-12 md:space-y-16 lg:space-y-20 text-center">
            <div className="space-y-4 md:space-y-6">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl/none max-w-3xl lg:max-w-5xl mx-auto">
                One Application, Any Job
              </h1>
              <h2 className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground max-w-2xl lg:max-w-4xl mx-auto">
                Your Career Pipeline Starts Here
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-8 sm:gap-16 lg:gap-24 xl:gap-32 w-full">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 border-primary flex items-center justify-center mb-2 md:mb-4 transition-transform hover:scale-110 hover:border-4 hover:shadow-lg">
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold">1</span>
                </div>
                <span className="font-medium text-base md:text-lg lg:text-xl">Signup</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 border-primary flex items-center justify-center mb-2 md:mb-4 transition-transform hover:scale-110 hover:border-4 hover:shadow-lg">
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold">2</span>
                </div>
                <span className="font-medium text-base md:text-lg lg:text-xl">Make a Profile</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 border-primary flex items-center justify-center mb-2 md:mb-4 transition-transform hover:scale-110 hover:border-4 hover:shadow-lg">
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold">3</span>
                </div>
                <span className="font-medium text-base md:text-lg lg:text-xl">Apply</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md lg:max-w-lg xl:max-w-xl justify-center">
              <Link href="/jobs" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-lg lg:text-xl py-6 lg:py-8">
                  Browse Jobs
                </Button>
              </Link>
              <Link href={user ? "/profile" : "/auth/register"} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full text-lg lg:text-xl py-6 lg:py-8">
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