import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, HomeIcon, UserCircleIcon, BarChartIcon, LogOutIcon, ShieldIcon, Menu, InfoIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  const NavLinks = () => (
    <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
      <Link href="/">
        <Button variant="ghost" size="sm" className="w-full md:w-auto justify-start md:justify-center">
          <HomeIcon className="h-4 w-4 mr-2" />
          Home
        </Button>
      </Link>
      <Link href="/jobs">
        <Button variant="ghost" size="sm" className="w-full md:w-auto justify-start md:justify-center">
          <BriefcaseIcon className="h-4 w-4 mr-2" />
          Jobs
        </Button>
      </Link>
      {user && (
        <>
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="w-full md:w-auto justify-start md:justify-center">
              <UserCircleIcon className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="w-full md:w-auto justify-start md:justify-center">
              <BarChartIcon className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          {user.isAdmin && (
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm" className="w-full md:w-auto justify-start md:justify-center">
                <ShieldIcon className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
        </>
      )}
      <Link href="/how-it-works">
        <Button variant="ghost" size="sm" className="w-full md:w-auto justify-start md:justify-center">
          <InfoIcon className="h-4 w-4 mr-2" />
          How It Works
        </Button>
      </Link>
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
          {user && <NotificationsDialog />}
          {user ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="ml-2"
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Logout
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}