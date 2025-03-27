import * as React from "react";
import { Tabs as BaseTabs, TabsContent as BaseTabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

export const AnimatedTabs = BaseTabs;

export const AnimatedTabsContent = React.forwardRef<
  React.ElementRef<typeof BaseTabsContent>,
  React.ComponentPropsWithoutRef<typeof BaseTabsContent> & {
    activeValue?: string;
  }
>(({ className, activeValue, value, children, ...props }, ref) => {
  // Animation variants for tab content - optimized for smoother transitions
  const tabContentVariants = {
    hidden: { 
      opacity: 0, 
      y: 6,
      scale: 0.99
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.25, 
        ease: [0.25, 0.1, 0.25, 1.0], // optimized ease curve
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      y: -4,
      scale: 0.99,
      transition: {
        duration: 0.18,
        ease: [0.3, 0.0, 0.2, 1.0] // optimized exit ease
      }
    }
  };

  // Child element variants for staggered animations
  const childVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };

  // Only render and animate if this tab is active or matches activeValue if provided
  const isActive = activeValue ? activeValue === value : true;

  return (
    <BaseTabsContent value={value} className={className} {...props} ref={ref} asChild>
      <AnimatePresence mode="wait" initial={false}>
        {isActive && (
          <motion.div
            key={`tab-content-${value}`}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout="position"
          >
            {/* We can apply the React.Children API to wrap each direct child with animations */}
            {React.Children.map(children, (child, index) => {
              // Skip null children or non-elements
              if (!React.isValidElement(child)) return child;
              
              // Wrap each child with motion.div for staggered animations
              return (
                <motion.div 
                  variants={childVariants}
                  key={`tab-item-${index}`}
                >
                  {child}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </BaseTabsContent>
  );
});

AnimatedTabsContent.displayName = "AnimatedTabsContent";

export { TabsList, TabsTrigger } from "@/components/ui/tabs"; 