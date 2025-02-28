import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import type { User } from "@shared/schema";
import { useState } from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

type NewUserForm = z.infer<typeof insertUserSchema>;

interface UserFormProps {
  onSubmit: (data: NewUserForm) => void;
  onCancel: () => void;
  initialData?: User | null;
}

export function NewUserForm({ onSubmit, onCancel, initialData }: UserFormProps) {
  const [showAdminConfirmation, setShowAdminConfirmation] = useState(false);
  const [pendingAdminChange, setPendingAdminChange] = useState<boolean | null>(null);

  // Create an edit mode schema that makes password fields truly optional
  const editModeSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    isAdmin: z.boolean(),
  }).refine(data => {
    // Only validate passwords match if password is provided and not empty
    if (data.password && data.password.length > 0) {
      return data.password === data.confirmPassword;
    }
    return true;
  }, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const form = useForm<NewUserForm>({
    resolver: zodResolver(initialData ? editModeSchema : insertUserSchema),
    defaultValues: initialData
      ? {
          username: initialData.username,
          email: initialData.email,
          isAdmin: initialData.isAdmin,
          password: "",
          confirmPassword: "",
        }
      : {
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          isAdmin: false,
        },
  });

  const handleSubmit = async (data: NewUserForm) => {
    try {
      // If editing and no password provided or empty, remove password fields
      if (initialData && (!data.password || data.password === '')) {
        const { password, confirmPassword, ...restData } = data;
        await onSubmit(restData as NewUserForm);
      } else {
        await onSubmit(data);
      }
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleAdminConfirmation = () => {
    if (pendingAdminChange !== null) {
      form.setValue("isAdmin", pendingAdminChange);
      setPendingAdminChange(null);
    }
    setShowAdminConfirmation(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {initialData ? (
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password (optional)</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : (
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="isAdmin"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    // If changing from non-admin to admin, show confirmation
                    if (checked === true && field.value === false) {
                      setShowAdminConfirmation(true);
                      setPendingAdminChange(true);
                    } else {
                      field.onChange(checked);
                    }
                  }}
                />
              </FormControl>
              <FormLabel>Administrator Access</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {initialData ? "Update User" : "Create User"}
          </Button>
        </DialogFooter>
      </form>

      {/* Admin Access Confirmation Dialog */}
      <AlertDialog open={showAdminConfirmation} onOpenChange={setShowAdminConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              Administrator Access Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Granting administrator access will give this user full access to the admin dashboard, 
                including sensitive company and user data.
              </p>
              <div className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-500 mt-2">
                <p>This user will be able to:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>View and edit all user accounts</li>
                  <li>Access sensitive company information</li>
                  <li>Manage job postings and applications</li>
                  <li>Grant admin access to other users</li>
                </ul>
              </div>
              <p className="font-medium">Are you sure you want to continue?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAdminChange(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAdminConfirmation}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Grant Admin Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}