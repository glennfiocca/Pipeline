import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Job } from "@shared/schema";
import { motion } from "framer-motion";

interface CompanyCardProps {
  job: Job;
}

export function CompanyCard({ job }: CompanyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
    >
      <Card className="overflow-hidden border border-gray-200/30 dark:border-gray-700/30">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 via-gray-50/10 to-gray-200/20 dark:from-gray-800/20 dark:via-gray-900/10 dark:to-gray-700/20" />
          <CardHeader className="flex flex-row items-center gap-4 relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={`https://avatar.vercel.sh/${job.company}`} />
                <AvatarFallback>{job.company[0]}</AvatarFallback>
              </Avatar>
            </motion.div>
            <CardTitle>{job.company}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                About
              </div>
              <p className="text-sm text-muted-foreground">
                {job.description.split(' ').slice(0, 20).join(' ')}...
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}
