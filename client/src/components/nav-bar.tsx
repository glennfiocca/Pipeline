import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, HomeIcon, UserCircleIcon, BarChartIcon, LogOutIcon, ShieldIcon, Menu, InfoIcon, Gift } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavCreditsCard } from "@/components/NavCreditsCard";
import { NavReferralButton } from "@/components/NavReferralButton";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient } from "@/lib/queryClient";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState("");

  // Specify longer durations for auth page transitions
  const authPaths = ["/auth/login", "/auth/register"];
  const isAuthPath = (path: string) => authPaths.includes(path);
  
  const handleNavigation = (path: string) => {
    // Start the navigation process immediately
    setIsNavigating(true);
    setNavigatingTo(path);
    
    // Define animation durations for consistent experience
    const isAuth = isAuthPath(path);
    const overlayFadeInDuration = isAuth ? 250 : 200;
    const navigationDelay = isAuth ? 220 : 180;
    
    // Begin navigating almost immediately, but give the overlay animation time to start
    setTimeout(() => {
      setLocation(path);
      
      // Keep overlay visible briefly during the destination page transition
      setTimeout(() => {
        setIsNavigating(false);
      }, isAuth ? 250 : 150);
    }, navigationDelay);
  };

  const NavLinks = () => (
    <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
      <Link href="/">
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "w-full md:w-auto justify-start md:justify-center relative group",
            location === "/" && "font-medium"
          )}
        >
          <HomeIcon className="h-4 w-4 mr-2" />
          Home
          <span className={cn(
            "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-out",
            location === "/" ? "w-full" : "w-0 group-hover:w-full"
          )}></span>
        </Button>
      </Link>
      <Link href="/jobs">
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "w-full md:w-auto justify-start md:justify-center relative group",
            location === "/jobs" && "font-medium"
          )}
        >
          <BriefcaseIcon className="h-4 w-4 mr-2" />
          Jobs
          <span className={cn(
            "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-out",
            location === "/jobs" ? "w-full" : "w-0 group-hover:w-full"
          )}></span>
        </Button>
      </Link>
      {user && (
        <>
          <Link href="/profile">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full md:w-auto justify-start md:justify-center relative group",
                location === "/profile" && "font-medium"
              )}
            >
              <UserCircleIcon className="h-4 w-4 mr-2" />
              Profile
              <span className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-out",
                location === "/profile" ? "w-full" : "w-0 group-hover:w-full"
              )}></span>
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full md:w-auto justify-start md:justify-center relative group",
                location === "/dashboard" && "font-medium"
              )}
            >
              <BarChartIcon className="h-4 w-4 mr-2" />
              Dashboard
              <span className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-out",
                location === "/dashboard" ? "w-full" : "w-0 group-hover:w-full"
              )}></span>
            </Button>
          </Link>
          {user.isAdmin && (
            <Link href="/admin/dashboard">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "w-full md:w-auto justify-start md:justify-center relative group",
                  location === "/admin/dashboard" && "font-medium"
                )}
              >
                <ShieldIcon className="h-4 w-4 mr-2" />
                Admin
                <span className={cn(
                  "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-out",
                  location === "/admin/dashboard" ? "w-full" : "w-0 group-hover:w-full"
                )}></span>
              </Button>
            </Link>
          )}
        </>
      )}
      <Link href="/how-it-works">
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "w-full md:w-auto justify-start md:justify-center relative group",
            location === "/how-it-works" && "font-medium"
          )}
        >
          <InfoIcon className="h-4 w-4 mr-2" />
          How It Works
          <span className={cn(
            "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-out",
            location === "/how-it-works" ? "w-full" : "w-0 group-hover:w-full"
          )}></span>
        </Button>
      </Link>
      {user && (
        <NavReferralButton />
      )}
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isNavigating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isAuthPath(navigatingTo) ? 0.5 : 0.3 
            }}
            exit={{ 
              opacity: 0,
              transition: { 
                duration: 0.25,
                ease: "easeInOut"
              } 
            }}
            transition={{ 
              duration: 0.18,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="fixed inset-0 bg-background z-50"
          />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4 sm:px-6 lg:px-8 max-w-[2000px]">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <img 
                src="/Black logo - no background.png" 
                alt="Pipeline Logo" 
                className="h-8 md:h-10"
              />
            </Link>
          </div>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <div className="px-2 py-6">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <NavLinks />
          )}

          <div className="flex-1 flex justify-end items-center space-x-2">
            {user && (
              <>
                <NavCreditsCard />
                <NotificationsDialog />
              </>
            )}
            {user ? (
              <Button 
                variant="ghost" 
                size="sm"
                disabled={logoutMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  
                  // Cancel any requests before logout
                  queryClient.cancelQueries();
                  
                  // Perform the logout
                  logoutMutation.mutate();
                }}
                className={cn(
                  "ml-2 relative group",
                  logoutMutation.isPending && "opacity-70 pointer-events-none"
                )}
              >
                <LogOutIcon className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
                <span className="absolute bottom-0 left-0 h-0.5 bg-primary w-0 group-hover:w-full transition-all duration-300 ease-out"></span>
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={cn(
                    "relative group",
                    location === "/auth/login" && "font-medium",
                    navigatingTo === "/auth/login" && isNavigating ? "opacity-70" : ""
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation("/auth/login");
                  }}
                >
                  Login
                  <span className={cn(
                    "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-out",
                    location === "/auth/login" ? "w-full" : "w-0 group-hover:w-full"
                  )}></span>
                </Button>
                <Button 
                  size="sm"
                  className={cn(
                    "relative group",
                    location === "/auth/register" && "font-medium",
                    navigatingTo === "/auth/register" && isNavigating ? "opacity-70" : ""
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation("/auth/register");
                  }}
                >
                  Sign Up
                  <span className={cn(
                    "absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-300 ease-out",
                    location === "/auth/register" ? "w-full" : "w-0 group-hover:w-full"
                  )}></span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}