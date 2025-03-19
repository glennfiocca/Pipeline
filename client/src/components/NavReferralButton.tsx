import { useState, useEffect } from "react";
import { Gift, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

export function NavReferralButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // If user is logged in, try to get their referral code
    if (user) {
      const fetchReferralCode = async () => {
        try {
          const response = await fetch(`/api/users/${user.id}/referral-code`, {
            method: 'GET',
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.referralCode) {
              setReferralCode(data.referralCode);
            }
          }
        } catch (error) {
          console.error("Error fetching referral code:", error);
        }
      };
      
      fetchReferralCode();
    }
  }, [user]);

  if (!user) return null;

  const copyReferralLink = async () => {
    // If no referral code exists, generate one
    if (!referralCode) {
      try {
        const response = await fetch(`/api/users/${user.id}/referral-code`, {
          method: 'POST',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate referral code');
        }
        
        const data = await response.json();
        if (!data.referralCode) {
          throw new Error('No referral code received');
        }
        
        setReferralCode(data.referralCode);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not generate your referral link. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    // Create the referral link using either the referral code or username as fallback
    const codeToUse = referralCode || user.username;
    const referralLink = `${window.location.origin}/auth/register?ref=${codeToUse}`;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not copy to clipboard. Try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full md:w-auto justify-start md:justify-center"
            onClick={copyReferralLink}
          >
            <Gift className="h-4 w-4 mr-2" />
            Refer a Friend
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-card border shadow-md">
          <div className="p-2 max-w-xs">
            <p className="font-medium text-sm">
              Share with friends & earn rewards
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You both get 5 bonus credits when they sign up!
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 