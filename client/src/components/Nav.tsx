import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

const Nav = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navStyles = {
    wrapper: "bg-background sticky top-0 border-b z-50 shadow-sm",
    container: "w-full flex h-24 items-center justify-between px-12 mx-auto",
    logoContainer: "flex items-center flex-shrink-0",
    logoText: "text-4xl font-bold",
    navItems: "flex flex-1 justify-evenly items-center mx-24",
    navLink: "text-lg font-medium transition-colors hover:text-primary hover:scale-105 transition-transform px-4",
    rightSection: "flex items-center gap-8",
    authButton: "text-lg px-8 py-2.5 min-w-[120px]",
    notificationBell: "text-4xl hover:scale-110 transition-transform"
  };

  return (
    <nav className={navStyles.wrapper}>
      <div className={navStyles.container}>
        <Link href="/" className={navStyles.logoContainer}>
          <span className={navStyles.logoText}>Pipeline</span>
        </Link>

        <div className={navStyles.navItems}>
          <Link href="/jobs" className={navStyles.navLink}>
            Jobs
          </Link>
          {user && (
            <>
              <Link href="/applications" className={navStyles.navLink}>
                Applications
              </Link>
              <Link href="/profile" className={navStyles.navLink}>
                Profile
              </Link>
              {user.isAdmin && (
                <Link href="/admin" className={navStyles.navLink}>
                  Admin
                </Link>
              )}
            </>
          )}
        </div>

        <div className={navStyles.rightSection}>
          {user ? (
            <>
              <NotificationBell className={navStyles.notificationBell} />
              <Button 
                variant="ghost" 
                className={navStyles.authButton}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className={navStyles.authButton}
                onClick={() => router.push('/login')}
              >
                Login
              </Button>
              <Button 
                variant="default"
                className={`${navStyles.authButton} bg-primary hover:bg-primary/90`}
                onClick={() => router.push('/signup')}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Nav; 