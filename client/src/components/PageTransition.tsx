import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  isAuth?: boolean;
}

export function PageTransition({ children, isAuth = false }: PageTransitionProps) {
  // Different animation variants for different page types
  const authVariants = {
    initial: { 
      opacity: 0,
      y: 12,
      scale: 0.98
    },
    animate: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.35, // Faster initial animation
        ease: [0.25, 0.1, 0.25, 1.0], // More natural ease curve
        staggerChildren: 0.08, // Slightly faster staggering
        delayChildren: 0.1 // Reduced delay to start children animations sooner
      }
    },
    exit: {
      opacity: 0,
      y: -8,
      transition: {
        duration: 0.2 // Faster exit for smoother page transitions
      }
    }
  };

  const defaultVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.25, // Slightly faster for better responsiveness
        ease: [0.25, 0.1, 0.25, 1.0] // More natural ease curve
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: 0.15 // Faster exit for smoother transitions
      }
    }
  };

  const variants = isAuth ? authVariants : defaultVariants;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// Child animation components for staggered animations
export function TransitionChild({ 
  children, 
  delay = 0,
  className = ""
}: { 
  children: ReactNode; 
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 12 }, // Reduced distance for smoother animations
        animate: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.4, // Slightly faster animation
            ease: [0.25, 0.1, 0.25, 1.0], // Consistent easing curve
            delay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
} 