import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, HomeIcon, UserCircleIcon, BarChartIcon, LogOutIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/">
            <a className="mr-6 flex items-center space-x-2">
              <BriefcaseIcon className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">Pipeline</span>
            </a>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2">
          <div className="w-full flex justify-start space-x-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <HomeIcon className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="ghost" size="sm">
                <BriefcaseIcon className="h-4 w-4 mr-2" />
                Jobs
              </Button>
            </Link>
            {user && (
              <>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <UserCircleIcon className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <BarChartIcon className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await logoutMutation.mutateAsync();
                  setLocation("/auth/login");
                }}
              >
                <LogOutIcon className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}