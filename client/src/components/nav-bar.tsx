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

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

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
              onClick={() => logoutMutation.mutate()}
              className={cn(
                "ml-2 relative group"
              )}
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Logout
              <span className="absolute bottom-0 left-0 h-0.5 bg-primary w-0 group-hover:w-full transition-all duration-300 ease-out"></span>
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/login">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={cn(
                    "relative group",
                    location === "/auth/login" && "font-medium"
                  )}
                >
                  Login
                  <span className={cn(
                    "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-out",
                    location === "/auth/login" ? "w-full" : "w-0 group-hover:w-full"
                  )}></span>
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button 
                  size="sm"
                  className={cn(
                    "relative group",
                    location === "/auth/register" && "font-medium"
                  )}
                >
                  Sign Up
                  <span className={cn(
                    "absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-300 ease-out",
                    location === "/auth/register" ? "w-full" : "w-0 group-hover:w-full"
                  )}></span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}