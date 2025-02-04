import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, HomeIcon, UserCircleIcon, BarChartIcon } from "lucide-react";

export function NavBar() {
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
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
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
          </div>
        </div>
      </div>
    </nav>
  );
}
