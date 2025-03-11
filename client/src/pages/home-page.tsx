import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserPlus, FileText, Send, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { user } = useAuth();

  // Animation variants
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
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 lg:py-16">
        <div className="w-full max-w-[2000px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-8 sm:space-y-12 lg:space-y-16">
            {/* Hero section with animated background */}
            <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden p-8 sm:p-12">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 animate-gradient" />
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              
              <motion.div 
                className="space-y-4 text-center relative z-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <motion.h1 
                  className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl/none"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  One Application, Any Job
                </motion.h1>
                <motion.h2 
                  className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Your Career Pipeline Starts Here
                </motion.h2>
              </motion.div>
            </div>

            {/* Steps section with animations */}
            <motion.div 
              className="w-full max-w-4xl"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full">
                {[
                  { 
                    number: 1, 
                    text: "Signup", 
                    description: "Create your account in seconds",
                    icon: "UserPlus",
                    hoverContent: "Quick and secure signup process with social login options"
                  },
                  { 
                    number: 2, 
                    text: "Make a Profile", 
                    description: "Showcase your skills and experience",
                    icon: "FileText",
                    hoverContent: "Our AI-powered profile builder helps highlight your strengths" 
                  },
                  { 
                    number: 3, 
                    text: "Apply", 
                    description: "One-click applications to top jobs",
                    icon: "Send",
                    hoverContent: "Apply to multiple positions without repetitive form filling" 
                  },
                ].map((step) => (
                  <motion.div 
                    key={step.number}
                    variants={itemVariants}
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                    className="flex flex-col items-center bg-card p-6 rounded-lg border shadow-sm transition-all relative overflow-visible group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <motion.div 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative z-10"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {step.icon === "UserPlus" && <UserPlus className="h-8 w-8 text-primary" />}
                      {step.icon === "FileText" && <FileText className="h-8 w-8 text-primary" />}
                      {step.icon === "Send" && <Send className="h-8 w-8 text-primary" />}
                    </motion.div>
                    
                    <span className="text-xl font-semibold mb-1 relative z-10">{step.text}</span>
                    <span className="text-sm text-muted-foreground text-center relative z-10">{step.description}</span>
                    
                    <div className="relative z-50">
                      <HoverCard openDelay={100} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <Button variant="ghost" size="sm" className="mt-4 relative z-10">
                            Learn More <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent 
                          side="bottom" 
                          align="center" 
                          className="w-80 z-50 shadow-lg"
                          sideOffset={5}
                        >
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Step {step.number}: {step.text}</h4>
                            <p className="text-sm">{step.hoverContent}</p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA buttons with animations */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 w-full max-w-lg justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Link href="/jobs" className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="w-full h-12 sm:h-14 text-lg">
                    Browse Jobs
                  </Button>
                </motion.div>
              </Link>
              <Link href={user ? "/profile" : "/auth/register"} className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outline" size="lg" className="w-full h-12 sm:h-14 text-lg">
                    {user ? "Create Profile" : "Sign Up to Create Profile"}
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}