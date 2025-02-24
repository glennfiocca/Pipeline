import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, HomeIcon, UserCircleIcon, BarChartIcon, LogOutIcon, ShieldIcon, ActivityIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsDialog } from "@/components/NotificationsDialog";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between mx-auto px-4 md:px-6 lg:px-8">
        <div className="mr-4 hidden md:flex">
          <Link href="/">
            <Button variant="ghost" className="mr-2 px-2">
              <ActivityIcon className="h-8 w-8 mr-2" />
              <span className="hidden text-3xl font-bold sm:inline-block">Pipeline</span>
            </Button>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex justify-start space-x-2 md:w-auto">
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
                {user.isAdmin && (
                  <Link href="/admin/dashboard">
                    <Button variant="ghost" size="sm">
                      <ShieldIcon className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <NotificationsDialog />
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
              </>
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