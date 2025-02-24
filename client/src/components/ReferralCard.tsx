import { useState } from "react";
import { Copy, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function ReferralCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyReferralLink = async () => {
    if (!user?.username) return;

    // Use username as the referral code for backwards compatibility
    const referralCode = user.referralCode || user.username;
    const referralLink = `${window.location.origin}/auth/register?ref=${referralCode}`;
    
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Refer Friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your referral link with friends. When they sign up, you'll both receive 5 bonus credits!
        </p>
        <Button
          variant="outline"
          onClick={copyReferralLink}
          className="w-full"
        >
          <Copy className="h-4 w-4 mr-2" />
          {copied ? "Copied!" : "Copy Referral Link"}
        </Button>
      </CardContent>
    </Card>
  );
}