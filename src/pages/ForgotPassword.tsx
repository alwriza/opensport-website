import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, MailCheck } from "lucide-react";

import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
    } catch (err: any) {
      toast({
        title: t("somethingWentWrong"),
        description: err.message || "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("resetYourPassword")}
      description={sent ? t("resetLinkSent") : t("enterEmailForReset")}
      footer={
        !sent && (
          <>
            {t("rememberedPassword")}{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              {t("signIn")}
            </Link>
          </>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-primary/25 bg-primary/[0.06] px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <MailCheck className="h-7 w-7" />
          </span>
          <p className="text-sm text-muted-foreground">
            {t("resetLinkSent")} <span className="font-medium text-foreground">{email}</span>
          </p>
          <Button asChild variant="outline">
            <Link to="/login">{t("signIn")}</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("sendResetLink")}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
