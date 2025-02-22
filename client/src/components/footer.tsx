import { Link } from "wouter";
import { FeedbackDialog } from "./FeedbackDialog";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t mt-auto">
      <div className="container max-w-screen-2xl py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 xl:gap-16">
          <div className="space-y-3 lg:space-y-4">
            <h3 className="font-semibold text-lg lg:text-xl">Pipeline</h3>
            <p className="text-sm lg:text-base text-muted-foreground">
              Smart job searching platform powered by AI and advanced matching algorithms.
            </p>
            <div className="pt-2">
              <FeedbackDialog />
            </div>
          </div>

          <div className="space-y-3 lg:space-y-4">
            <h3 className="font-semibold text-lg lg:text-xl">Legal</h3>
            <ul className="space-y-2 lg:space-y-3">
              <li>
                <Link href="/terms" className="text-sm lg:text-base text-muted-foreground hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm lg:text-base text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm lg:text-base text-muted-foreground hover:text-primary">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 lg:space-y-4">
            <h3 className="font-semibold text-lg lg:text-xl">Resources</h3>
            <ul className="space-y-2 lg:space-y-3">
              <li>
                <Link href="/help" className="text-sm lg:text-base text-muted-foreground hover:text-primary">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm lg:text-base text-muted-foreground hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm lg:text-base text-muted-foreground hover:text-primary">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 lg:space-y-4">
            <h3 className="font-semibold text-lg lg:text-xl">Connect</h3>
            <ul className="space-y-2 lg:space-y-3">
              <li>
                <Link href="/contact" className="text-sm lg:text-base text-muted-foreground hover:text-primary">
                  Contact Us
                </Link>
              </li>
              <li>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm lg:text-base text-muted-foreground hover:text-primary"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm lg:text-base text-muted-foreground hover:text-primary"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 lg:mt-12 pt-8 lg:pt-12 border-t text-center text-sm lg:text-base text-muted-foreground">
          <p>&copy; {currentYear} Pipeline. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}