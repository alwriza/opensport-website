import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const { t } = useTranslation("auth");
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast({
        title: t("somethingWentWrong"),
        description: (err as Error).message || "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("resetYourPassword")}</CardTitle>
          <CardDescription>
            {sent
              ? t("resetLinkSent")
              : t("enterEmailForReset")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="break-all text-sm font-medium" role="status">{email}</p>
              <Button asChild variant="outline" className="w-full"><Link to="/login">{t("signIn")}</Link></Button>
            </div>
          ) : <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("sendResetLink")}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-4">
              {t("rememberedPassword")}{" "}
              <Link to="/login" className="text-primary underline">{t("signIn")}</Link>
            </p>
          </>}
        </CardContent>
      </Card>
    </div>
  );
}
