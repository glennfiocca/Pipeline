import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  CheckCircle, ArrowRight, UserCircle, Zap, 
  Search, MousePointerClick, Sparkles, Shield, 
  BarChart, MessageSquare
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export default function HowItWorksPage() {
  const { user } = useAuth();

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="py-16 max-w-5xl mx-auto">
      {/* Hero section with animated gradient background */}
      <div className="relative mb-16 p-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-indigo-500/20 animate-gradient-slow" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        
        <div className="relative text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl font-bold tracking-tight sm:text-6xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            Pipeline in Action
          </motion.h1>
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-medium text-muted-foreground"
          >
            Revolutionizing your job search experience
          </motion.h2>
        </div>
      </div>

      {/* Three steps with interactive elements */}
      <motion.div 
        className="relative mb-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid md:grid-cols-3 gap-12 md:gap-6 relative z-10">
          {/* Step 1 */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col items-center text-center group"
          >
            <div className="w-28 h-28 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 relative overflow-hidden group-hover:bg-blue-500/20 transition-colors duration-300 shadow-lg">
              <span className="text-6xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">1</span>
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
            <p className="text-muted-foreground">
              Build your professional profile with your skills and experience
            </p>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-4">
                  <Sparkles className="h-4 w-4 mr-2" /> Learn More
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Smart Profile Builder</h4>
                  <p className="text-sm">
                    Our intelligent system helps you highlight your strengths and matches you with the perfect opportunities.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col items-center text-center group"
          >
            <div className="w-28 h-28 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6 relative overflow-hidden group-hover:bg-yellow-500/20 transition-colors duration-300 shadow-lg">
              <span className="text-6xl font-bold text-yellow-600 group-hover:scale-110 transition-transform duration-300">2</span>
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Browse Jobs</h3>
            <p className="text-muted-foreground">
              Find opportunities that match your skills and preferences
            </p>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-4">
                  <Search className="h-4 w-4 mr-2" /> Learn More
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">AI-Powered Matching</h4>
                  <p className="text-sm">
                    Our algorithm analyzes thousands of jobs to find the perfect match for your unique skill set and career goals.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col items-center text-center group"
          >
            <div className="w-28 h-28 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 relative overflow-hidden group-hover:bg-green-500/20 transition-colors duration-300 shadow-lg">
              <span className="text-6xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-300">3</span>
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2">One-Click Apply</h3>
            <p className="text-muted-foreground">
              Apply to multiple positions with a single click
            </p>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-4">
                  <MousePointerClick className="h-4 w-4 mr-2" /> Learn More
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Effortless Applications</h4>
                  <p className="text-sm">
                    Apply to jobs in seconds, not hours. Our system automatically formats your information for each application.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </motion.div>
        </div>
        
        {/* Animated curved arrows (visible on medium screens and up) */}
        <div className="hidden md:block absolute w-full h-full top-0 left-0 pointer-events-none">
          {/* Arrow from step 1 to step 2 */}
          <svg className="absolute top-14 left-[30%] w-[15%]" height="40" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              d="M0,20 Q60,0 120,20 L115,15 M115,25 L120,20" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="text-blue-500"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            />
          </svg>
          
          {/* Arrow from step 2 to step 3 */}
          <svg className="absolute top-14 left-[63%] w-[15%]" height="40" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              d="M0,20 Q60,40 120,20 L115,15 M115,25 L120,20" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="text-yellow-500"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
            />
          </svg>
        </div>
      </motion.div>

      {/* Features section with animated cards */}
      <motion.div 
        className="mb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
          A smarter way to land your dream job
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-start mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 mr-3 flex-shrink-0">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">Simplified Applications</h3>
                  <p className="text-muted-foreground">
                    No more filling out the same information repeatedly
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 mr-3 flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">Secure and Fast</h3>
                  <p className="text-muted-foreground">
                    Your data is protected while you apply with speed
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-green-500/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/20 shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-start mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 mr-3 flex-shrink-0">
                  <BarChart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">Track Your Progress</h3>
                  <p className="text-muted-foreground">
                    Monitor all your applications in one place
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 mr-3 flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">Direct Communication</h3>
                  <p className="text-muted-foreground">
                    Chat with recruiters without leaving the platform
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats section */}
      <motion.div 
        className="mb-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {[
          { label: "Companies", value: "500+", color: "blue" },
          { label: "Jobs Posted", value: "10k+", color: "yellow" },
          { label: "Successful Hires", value: "2.5k+", color: "green" },
          { label: "User Satisfaction", value: "98%", color: "indigo" }
        ].map((stat, index) => (
          <div 
            key={index} 
            className={cn(
              "rounded-xl p-6 text-center",
              stat.color === "blue" && "bg-blue-500/10 border border-blue-500/20",
              stat.color === "yellow" && "bg-yellow-500/10 border border-yellow-500/20",
              stat.color === "green" && "bg-green-500/10 border border-green-500/20",
              stat.color === "indigo" && "bg-indigo-500/10 border border-indigo-500/20"
            )}
          >
            <div 
              className={cn(
                "text-3xl font-bold mb-1",
                stat.color === "blue" && "text-blue-600",
                stat.color === "yellow" && "text-yellow-600",
                stat.color === "green" && "text-green-600",
                stat.color === "indigo" && "text-indigo-600"
              )}
            >
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* CTA buttons - keeping as is per request */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
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
      </motion.div>
    </div>
  );
} 