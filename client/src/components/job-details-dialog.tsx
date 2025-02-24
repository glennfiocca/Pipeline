export function JobDetailsDialog({ job, isOpen, onClose }: JobDetailsDialogProps) {
  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{job.title}</span>
            <Badge variant="secondary">{job.type}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center text-muted-foreground">
            <Building2 className="mr-2 h-4 w-4" />
            <span>{job.company}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{job.location}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="mr-2 h-4 w-4" />
            <span>{job.salary}</span>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <div className="text-muted-foreground whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Requirements</h4>
            <div className="text-muted-foreground whitespace-pre-wrap">
              {job.requirements}
            </div>
          </div>

          {job.benefits && (
            <div className="space-y-2">
              <h4 className="font-medium">Benefits</h4>
              <div className="text-muted-foreground whitespace-pre-wrap">
                {job.benefits}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 