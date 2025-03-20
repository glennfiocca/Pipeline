import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Star, ArrowRight, Briefcase, MousePointerClick, MessageSquare, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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

  // Testimonials data with application statuses
  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Software Engineer",
      company: "TechCorp",
      avatar: "/avatars/alex.jpg",
      content: "Pipeline helped me land my dream job in just 2 weeks. The one-click apply feature saved me countless hours!",
      rating: 5,
      status: "Accepted" // Adding status for color association
    },
    {
      name: "Sarah Chen",
      role: "Marketing Manager",
      company: "BrandGrowth",
      avatar: "/avatars/sarah.jpg",
      content: "I was skeptical at first, but Pipeline's matching algorithm found me opportunities I wouldn't have discovered otherwise.",
      rating: 5,
      status: "Interviewing" // Adding status for color association
    },
    {
      name: "Michael Rodriguez",
      role: "Product Designer",
      company: "CreativeStudio",
      avatar: "/avatars/michael.jpg",
      content: "The streamlined application process is a game-changer. I applied to 15 jobs in the time it used to take me to apply to just one.",
      rating: 5,
      status: "Applied" // Adding status for color association
    }
  ];

  // Company logos with simplified data
  const companyLogos = [
    { name: "Google", primaryColor: "#4285F4" },
    { name: "Microsoft", primaryColor: "#00A4EF" },
    { name: "Amazon", primaryColor: "#FF9900" },
    { name: "Apple", primaryColor: "#000000" },
    { name: "Meta", primaryColor: "#0668E1" },
    { name: "Netflix", primaryColor: "#E50914" }
  ];

  // Function to get status color for subtle UI elements
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "interviewing":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "accepted":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "withdrawn":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return <MousePointerClick className="h-4 w-4" />;
      case "interviewing":
        return <MessageSquare className="h-4 w-4" />;
      case "accepted":
        return <Sparkles className="h-4 w-4" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      <main className="flex-1">
        {/* Hero section with colorful background and stronger value proposition */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-green-500/10 animate-gradient" />
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <Badge variant="outline" className="mb-4 py-1.5 px-4 text-sm font-medium bg-blue-500/5 border-blue-500/20">
                  Job searching, simplified
                </Badge>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 mx-auto max-w-5xl">
                  One Application, <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent">Any Job</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-4xl mx-auto px-4 md:px-8 lg:px-0">
                  Stop wasting time on repetitive applications.
                  Apply once, reach hundreds of employers.
                </p>
              </motion.div>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Link href={user ? "/profile" : "/auth/register"} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-14 text-lg group bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    Get Started <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/how-it-works" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full h-14 text-lg border-blue-500/20 hover:bg-blue-500/5">
                    See How It Works
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-sm text-muted-foreground"
              >
                <p>Join over <span className="font-medium text-green-500">100,000+</span> job seekers who've simplified their job search</p>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Key stats section with colored accents */}
        <section className="py-12 bg-gradient-to-r from-blue-500/5 via-background to-purple-500/5">
          <div className="container mx-auto px-4">
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                { label: "Jobs Available", value: "10,000+", color: "text-blue-500" },
                { label: "Companies", value: "500+", color: "text-purple-500" },
                { label: "Success Rate", value: "92%", color: "text-green-500" },
                { label: "Time Saved", value: "85%", color: "text-yellow-500" }
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className="text-center p-4 rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className={`text-3xl md:text-4xl font-bold mb-2 ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* Testimonials section with color accents */}
        <section className="py-16 bg-gradient-to-br from-green-500/5 via-background to-blue-500/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of satisfied job seekers who've transformed their career search
              </p>
            </div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {testimonials.map((testimonial, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className={cn(
                    "rounded-xl p-6 shadow-sm border", 
                    getStatusColor(testimonial.status)
                  )}
                >
                  <div className="flex items-center mb-4">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role} at {testimonial.company}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn(
                          "h-4 w-4", 
                          i < testimonial.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                        )} />
                      ))}
                    </div>
                    <Badge variant="outline" className={cn("flex items-center gap-1", getStatusColor(testimonial.status))}>
                      {getStatusIcon(testimonial.status)}
                      {testimonial.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm">{testimonial.content}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* Company logos section with colorful divider */}
        <section className="py-16 relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-purple-500/5 to-background"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">
                Featured Companies
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Top organizations working with our platform to find exceptional talent
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
              {companyLogos.map((company, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-lg shadow-md border p-4 flex flex-col items-center justify-center h-32 hover:border-blue-500/50 hover:shadow-[0_0_8px_rgba(59,130,246,0.2)] transition-all"
                >
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: company.primaryColor }}
                  >
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-medium text-center">{company.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Final CTA section with colorful background */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-green-500/10" />
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-block mb-6">
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                    <Sparkles className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Start your success story</span>
                  </div>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Ready to transform your job search?
                </h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-4xl mx-auto px-4 md:px-8">
                  Join Pipeline today and experience the future of job applications
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href={user ? "/profile" : "/auth/register"} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                      {user ? "Go to Dashboard" : "Sign Up Now"}
                    </Button>
                  </Link>
                  <Link href="/jobs" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full h-14 text-lg border-blue-500/20 hover:bg-blue-500/5">
                      Browse Jobs
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}