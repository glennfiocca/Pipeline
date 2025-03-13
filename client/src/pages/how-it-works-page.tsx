import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  CheckCircle, ArrowRight, UserCircle, Zap, 
  Search, MousePointerClick, Sparkles, Shield, 
  BarChart, MessageSquare, Database, Lock, 
  Cpu, LineChart, BrainCircuit, Layers, 
  Briefcase, GraduationCap, Users, Building,
  ChevronDown, ChevronUp, PlusCircle, Laptop
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HowItWorksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("process");

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

  // Process steps with detailed information
  const processSteps = [
    {
      number: 1,
      title: "Create Your Profile",
      description: "Build a comprehensive professional profile that showcases your skills, experience, and career goals.",
      icon: <UserCircle className="h-8 w-8 text-primary" />,
      details: [
        "Import data from LinkedIn or upload your resume to get started quickly",
        "AI-powered skill extraction identifies your key competencies",
        "Customize your profile with projects, certifications, and achievements",
        "Set job preferences including location, salary, and work environment",
        "Create multiple profile versions tailored to different career paths"
      ],
      image: "/screenshots/profile-builder.webp"
    },
    {
      number: 2,
      title: "Discover Opportunities",
      description: "Our intelligent matching system finds the perfect job opportunities based on your unique profile.",
      icon: <Search className="h-8 w-8 text-primary" />,
      details: [
        "Advanced AI algorithms analyze thousands of job listings in real-time",
        "Personalized job recommendations based on your skills and preferences",
        "Filter results by industry, company size, remote options, and more",
        "Receive match scores showing how well you align with each position",
        "Get insights into skill gaps and suggestions for improvement"
      ],
      image: "/screenshots/job-matching.webp"
    },
    {
      number: 3,
      title: "One-Click Apply",
      description: "Apply to multiple positions with a single click, eliminating repetitive form filling.",
      icon: <MousePointerClick className="h-8 w-8 text-primary" />,
      details: [
        "Apply to multiple jobs simultaneously with just one click",
        "Automatic form filling based on your profile information",
        "Customizable cover letters generated for each application",
        "Document management system for resumes and supporting materials",
        "Real-time application tracking and status updates"
      ],
      image: "/screenshots/one-click-apply.webp"
    },
    {
      number: 4,
      title: "Track & Manage",
      description: "Monitor all your applications in one place and stay organized throughout your job search.",
      icon: <BarChart className="h-8 w-8 text-primary" />,
      details: [
        "Centralized dashboard showing all application statuses",
        "Automated follow-up reminders and scheduling tools",
        "Interview preparation resources tailored to each position",
        "Feedback collection and performance analytics",
        "Salary negotiation guidance and offer comparison tools"
      ],
      image: "/screenshots/application-tracking.webp"
    },
    {
      number: 5,
      title: "Connect & Communicate",
      description: "Engage directly with recruiters and hiring managers through our integrated messaging system.",
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      details: [
        "Secure in-platform messaging with recruiters and hiring managers",
        "Automated interview scheduling and calendar integration",
        "Video interview capabilities with preparation tools",
        "Document sharing and collaborative workspaces",
        "Post-interview feedback collection and analysis"
      ],
      image: "/screenshots/messaging.webp"
    }
  ];

  // Technical features with detailed explanations
  const technicalFeatures = [
    {
      title: "AI-Powered Matching",
      description: "Our proprietary algorithm uses advanced machine learning to match candidates with the perfect opportunities.",
      icon: <BrainCircuit className="h-6 w-6 text-primary" />,
      details: "Pipeline's matching engine analyzes over 50 data points from your profile and compares them against millions of job listings using natural language processing and semantic analysis. The system continuously learns from successful placements to improve match quality over time."
    },
    {
      title: "Secure Data Handling",
      description: "Enterprise-grade security protocols protect your sensitive personal and professional information.",
      icon: <Lock className="h-6 w-6 text-primary" />,
      details: "We employ end-to-end encryption, regular security audits, and strict access controls to ensure your data remains private. Our platform is GDPR and CCPA compliant, giving you full control over your information with the ability to export or delete your data at any time."
    },
    {
      title: "Intelligent Form Filling",
      description: "Our system automatically formats your information for each application, saving you countless hours.",
      icon: <Zap className="h-6 w-6 text-primary" />,
      details: "Pipeline's form recognition technology identifies and maps your profile data to application fields across thousands of different company websites and application systems. The platform can even generate tailored responses to common screening questions based on your experience."
    },
    {
      title: "Real-time Analytics",
      description: "Comprehensive insights into your job search performance and market positioning.",
      icon: <LineChart className="h-6 w-6 text-primary" />,
      details: "Track application success rates, interview conversions, and offer statistics. Our analytics dashboard provides actionable insights on which skills are most in-demand for your target roles and how your qualifications compare to other candidates in your field."
    },
    {
      title: "Scalable Infrastructure",
      description: "Built on a modern cloud architecture that ensures reliability and performance at any scale.",
      icon: <Database className="h-6 w-6 text-primary" />,
      details: "Our platform leverages containerized microservices, serverless computing, and distributed databases to handle millions of applications daily with sub-second response times. Automatic scaling ensures optimal performance even during peak usage periods."
    },
    {
      title: "Cross-platform Compatibility",
      description: "Access Pipeline seamlessly across all your devices with our responsive design.",
      icon: <Laptop className="h-6 w-6 text-primary" />,
      details: "Whether you're using a desktop, tablet, or smartphone, Pipeline provides a consistent and optimized experience. Our progressive web app technology allows for offline functionality and instant updates without requiring manual installation."
    }
  ];

  // Use cases for different types of job seekers
  const useCases = [
    {
      title: "Recent Graduates",
      description: "Launch your career with confidence",
      icon: <GraduationCap className="h-6 w-6 text-primary" />,
      details: "Pipeline helps recent graduates showcase academic projects, internships, and relevant coursework to compensate for limited work experience. Our AI highlights transferable skills and matches you with entry-level positions and training programs that align with your career goals."
    },
    {
      title: "Mid-Career Professionals",
      description: "Take your career to the next level",
      icon: <Briefcase className="h-6 w-6 text-primary" />,
      details: "For experienced professionals, Pipeline emphasizes your proven track record and specialized expertise. The platform identifies opportunities for advancement and helps you position yourself effectively against the competition with targeted application materials."
    },
    {
      title: "Career Changers",
      description: "Transition to a new industry seamlessly",
      icon: <Layers className="h-6 w-6 text-primary" />,
      details: "Changing careers? Pipeline identifies your transferable skills and helps you present them in the context of your target industry. Our system connects you with companies known for valuing diverse professional backgrounds and provides resources for addressing potential skill gaps."
    },
    {
      title: "Freelancers & Contractors",
      description: "Find your next gig efficiently",
      icon: <Users className="h-6 w-6 text-primary" />,
      details: "Pipeline's flexible profile options allow freelancers to showcase project-based work and specialized skills. The platform includes filters for contract duration, remote work options, and project types to help you find opportunities that match your working style."
    },
    {
      title: "Executive Leadership",
      description: "Discover strategic leadership opportunities",
      icon: <Building className="h-6 w-6 text-primary" />,
      details: "For executive roles, Pipeline emphasizes leadership achievements, strategic vision, and industry expertise. Our discrete matching process connects you with executive search firms and board opportunities while maintaining confidentiality throughout your search."
    }
  ];

  // Frequently asked questions
  const faqs = [
    {
      question: "How much does Pipeline cost?",
      answer: "Pipeline offers a free basic tier that includes profile creation and limited job applications. Our Premium plan ($19.99/month) provides unlimited applications, advanced analytics, and priority matching. Enterprise solutions for organizations are available with custom pricing."
    },
    {
      question: "How is Pipeline different from traditional job boards?",
      answer: "Unlike traditional job boards where you search and apply manually, Pipeline automates the entire process. Our AI matching technology finds opportunities tailored to your profile, and our one-click application system eliminates repetitive form filling across multiple platforms."
    },
    {
      question: "Is my data secure on Pipeline?",
      answer: "Absolutely. We employ enterprise-grade security measures including end-to-end encryption, regular security audits, and strict access controls. Your data is never sold to third parties, and you maintain complete control over your information with the ability to export or delete it at any time."
    },
    {
      question: "Can I use Pipeline if I'm not actively job searching?",
      answer: "Yes! Many professionals use Pipeline in 'passive' mode to stay aware of exceptional opportunities that match their unique skills and preferences. You can set specific criteria for roles that would tempt you to make a move while maintaining complete privacy."
    },
    {
      question: "How does the one-click apply feature work?",
      answer: "Our system maintains updated application processes for thousands of companies. When you click 'Apply,' Pipeline automatically formats your profile information to match each company's specific application fields, attaches appropriate documents, and submits the application on your behalf."
    },
    {
      question: "Can I customize my applications for different positions?",
      answer: "Yes! Pipeline allows you to create multiple profile versions tailored to different career paths or job types. Before submission, you can review and customize each application, including the option to generate position-specific cover letters and highlight relevant experiences."
    }
  ];

  return (
    <div className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hero section with animated gradient background */}
      <div className="relative mb-16 p-8 md:p-12 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 animate-gradient-slow" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        
        <div className="relative text-center max-w-3xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground"
          >
            How Pipeline Works
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground"
          >
            A detailed look at our revolutionary job application platform and how it transforms your career search experience
          </motion.p>
        </div>
      </div>

      {/* Tabs for different sections */}
      <div className="mb-12">
        <Tabs defaultValue="process" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="process">The Process</TabsTrigger>
              <TabsTrigger value="features">Technical Features</TabsTrigger>
              <TabsTrigger value="usecases">Use Cases</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Process Tab Content */}
          <TabsContent value="process" className="mt-0">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">The Complete Pipeline Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our comprehensive platform guides you through every step of your job search journey, from profile creation to offer acceptance
              </p>
            </div>
            
            <div className="space-y-16 md:space-y-24">
              {processSteps.map((step, index) => (
                <motion.div 
                  key={step.number}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={cn(
                    "grid md:grid-cols-2 gap-8 items-center",
                    index % 2 === 1 ? "md:grid-flow-dense" : ""
                  )}
                >
                  {/* Text content */}
                  <div className={index % 2 === 1 ? "md:col-start-2" : ""}>
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                        <span className="text-xl font-bold text-primary">{step.number}</span>
                      </div>
                      <h3 className="text-2xl font-bold">{step.title}</h3>
                    </div>
                    
                    <p className="text-lg text-muted-foreground mb-6">
                      {step.description}
                    </p>
                    
                    <ul className="space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Image/illustration */}
                  <div className={cn(
                    "rounded-xl overflow-hidden shadow-lg border border-border",
                    index % 2 === 1 ? "md:col-start-1" : ""
                  )}>
                    <img 
                      src={step.image} 
                      alt={`${step.title} illustration`} 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
          
          {/* Technical Features Tab Content */}
          <TabsContent value="features" className="mt-0">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Technical Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Powered by cutting-edge technology to deliver a seamless and efficient job search experience
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {technicalFeatures.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          {feature.icon}
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                      </div>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{feature.details}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {/* Technical architecture diagram */}
            <motion.div 
              className="mt-16 p-8 rounded-xl border border-border bg-card"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-bold mb-6 text-center">Pipeline's Technical Architecture</h3>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Architecture diagram visualization</p>
              </div>
            </motion.div>
          </TabsContent>
          
          {/* Use Cases Tab Content */}
          <TabsContent value="usecases" className="mt-0">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Pipeline for Every Career Stage</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See how Pipeline adapts to the unique needs of different job seekers
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {useCases.map((useCase, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card rounded-xl p-6 border border-border"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      {useCase.icon}
                    </div>
                    <h3 className="text-xl font-bold">{useCase.title}</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{useCase.description}</p>
                  <p className="text-sm">{useCase.details}</p>
                </motion.div>
              ))}
            </div>
            
            {/* User journey visualization */}
            <motion.div 
              className="mt-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-bold mb-6 text-center">Complete User Journey</h3>
              <div className="relative overflow-hidden rounded-xl border border-border p-4">
                <div className="flex justify-between items-center relative z-10">
                  {["Sign Up", "Profile Creation", "Job Discovery", "Application", "Interview", "Offer"].map((stage, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <span className="text-xs text-center">{stage}</span>
                    </div>
                  ))}
                </div>
                
                {/* Connecting line */}
                <div className="absolute top-8 left-10 right-10 h-0.5 bg-primary/20"></div>
              </div>
            </motion.div>
          </TabsContent>
          
          {/* FAQ Tab Content */}
          <TabsContent value="faq" className="mt-0">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about using Pipeline for your job search
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <AccordionItem value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
              
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <p className="text-sm text-center">
                  Have more questions? <Link href="/contact" className="text-primary hover:underline">Contact our support team</Link>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* CTA section */}
      <motion.div 
        className="mt-16 text-center bg-card rounded-xl p-8 md:p-12 border border-border relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Job Search?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of professionals who've simplified their job search with Pipeline
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={user ? "/profile" : "/auth/register"}>
              <Button size="lg" className="w-full sm:w-auto">
                {user ? "Go to Dashboard" : "Create Your Profile"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Browse Available Jobs
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 