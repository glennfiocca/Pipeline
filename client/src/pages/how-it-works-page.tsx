import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, ArrowRight, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function HowItWorksPage() {
  const { user } = useAuth();

  return (
    <div className="py-16 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          How Pipeline Works
        </h1>
        <h2 className="text-2xl font-medium text-muted-foreground">
          Three steps to smarter job hunting
        </h2>
      </div>

      {/* Three steps with numbers and curved arrows */}
      <div className="relative mb-24">
        <div className="grid md:grid-cols-3 gap-12 md:gap-6 relative z-10">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
              <span className="text-6xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
            <p className="text-muted-foreground">
              Build your professional profile with your skills and experience
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <span className="text-6xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Browse Jobs</h3>
            <p className="text-muted-foreground">
              Find opportunities that match your skills and preferences
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <span className="text-6xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">One-Click Apply</h3>
            <p className="text-muted-foreground">
              Apply to multiple positions with a single click
            </p>
          </div>
        </div>
        
        {/* Curved arrows (visible on medium screens and up) */}
        <div className="hidden md:block absolute w-full h-full top-0 left-0 pointer-events-none">
          {/* Arrow from step 1 to step 2 */}
          <svg className="absolute top-12 left-[30%] w-[15%]" height="40" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0,20 Q60,0 120,20 L115,15 M115,25 L120,20" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="text-primary"
            />
          </svg>
          
          {/* Arrow from step 2 to step 3 */}
          <svg className="absolute top-12 left-[63%] w-[15%]" height="40" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0,20 Q60,40 120,20 L115,15 M115,25 L120,20" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="text-primary"
            />
          </svg>
        </div>
      </div>

      {/* Simple explanation section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          A simple and effective job search process that works for everyone
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <div className="flex items-start mb-4">
              <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-medium">Simplified Applications</h3>
                <p className="text-muted-foreground">
                  No more filling out the same information repeatedly
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-medium">Direct Communication</h3>
                <p className="text-muted-foreground">
                  Chat with recruiters and company representatives without leaving the platform
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <div className="flex items-start mb-4">
              <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-medium">Track Your Progress</h3>
                <p className="text-muted-foreground">
                  Monitor all your applications in one place
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-medium">Secure and Fast</h3>
                <p className="text-muted-foreground">
                  Your data is protected while you apply with speed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="text-center">
        {user ? (
          <Link href="/profile">
            <Button size="lg" className="mr-4">
              Go to Profile <UserCircle className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/auth/register">
            <Button size="lg" className="mr-4">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
        <Link href="/jobs">
          <Button variant="outline" size="lg">
            Browse Jobs
          </Button>
        </Link>
      </div>
    </div>
  );
} 