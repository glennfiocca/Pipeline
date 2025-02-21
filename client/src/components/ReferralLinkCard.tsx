import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ReferralLinkCard() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user?.referralCode) return null;

  const referralLink = `${window.location.origin}/auth?ref=${user.referralCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy referral link",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Refer Friends</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your referral link with friends. When they sign up, you'll both receive 5 bonus credits!
        </p>
        <div className="flex space-x-2">
          <Input
            readOnly
            value={referralLink}
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={copyLink}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Available credits: {user.bankedCredits}
        </div>
      </CardContent>
    </Card>
  );
}