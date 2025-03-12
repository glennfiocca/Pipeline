import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, DollarSign, CheckCircle2, ExternalLink, Loader2, AtSign } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { Job } from "@shared/schema";
import { useState, ReactNode } from "react";
import { ApplicationCreditsDialog } from "./ApplicationCreditsDialog";
import { motion, AnimatePresence } from "framer-motion";

interface JobModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (jobId: number) => void;
  isApplied?: boolean;
  isApplying?: boolean;
  previouslyApplied?: boolean;
  applicationControls?: ReactNode;
  alreadyApplied?: boolean;
}

export function JobModal({ 
  job, 
  isOpen, 
  onClose, 
  onApply, 
  isApplied, 
  isApplying,
  previouslyApplied,
  applicationControls,
  alreadyApplied
}: JobModalProps) {
  const { user } = useAuth();
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

  if (!job) return null;

  const buttonText = isApplying 
    ? "Applying..." 
    : previouslyApplied 
    ? "Reapply" 
    : isApplied 
    ? "Applied" 
    : "Apply";

  const isButtonDisabled = isApplying || (isApplied && !previouslyApplied);

  const handleApplyClick = () => {
    if (!user) return;
    setShowCreditsDialog(true);
  };

  // Animation variants
  const contentVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300 }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto p-0">
        <motion.div
          className="p-6"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={contentVariants}
        >
          <DialogHeader>
            <motion.div variants={itemVariants}>
              <DialogTitle className="text-2xl">{job.title}</DialogTitle>
            </motion.div>
          </DialogHeader>

          <motion.div className="space-y-6 mt-4" variants={itemVariants}>
            <motion.div className="flex flex-wrap gap-2" variants={itemVariants}>
              <Badge variant="secondary" className="flex items-center">
                <AtSign className="mr-2 h-3 w-3" />
                {job.company}
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <MapPin className="mr-2 h-3 w-3" />
                {job.location}
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <DollarSign className="mr-2 h-3 w-3" />
                {job.salary}
              </Badge>
              <Badge variant="default">
                {job.type}
              </Badge>
            </motion.div>

            <div className="space-y-6">
              <motion.div variants={itemVariants}>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                  Description
                </h3>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {job.description}
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                  Requirements
                </h3>
                <div className="text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    {job.requirements.split(';').map((req, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (index * 0.05) }}
                      >
                        {req.trim()}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {(job as any).benefits && (
                <motion.div variants={itemVariants}>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    Benefits
                  </h3>
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {(job as any).benefits}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div 
            className="flex gap-2 mt-8"
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {user && !applicationControls ? (
              <Button
                onClick={handleApplyClick}
                disabled={isButtonDisabled}
                className="flex-1"
              >
                {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {buttonText}
              </Button>
            ) : user && applicationControls ? (
              applicationControls
            ) : (
              <Link href="/auth/login" className="flex-1">
                <Button className="w-full">Sign in to Apply</Button>
              </Link>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>

      <ApplicationCreditsDialog
        isOpen={showCreditsDialog}
        onClose={() => setShowCreditsDialog(false)}
        onConfirm={() => {
          onApply && onApply(job.id);
          setShowCreditsDialog(false);
        }}
        jobTitle={job.title}
      />
    </Dialog>
  );
}