import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: t("passwordsDontMatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({ title: t("passwordUpdated"), description: t("canSignIn") });
      navigate("/login");
    } catch (err: any) {
      toast({
        title: t("couldNotUpdatePassword"),
        description: err.message || t("resetLinkExpired"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t("setNewPassword")} description={t("chooseNewPassword")}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">{t("newPasswordLabel")}</Label>
          <PasswordInput
            id="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">{t("confirmPasswordLabel")}</Label>
          <PasswordInput
            id="confirm"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={mismatch}
            className={mismatch ? "border-destructive focus-visible:border-destructive" : undefined}
          />
          {mismatch && <p className="text-xs text-destructive">{t("passwordsDontMatch")}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading || mismatch}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("updatePassword")}
        </Button>
      </form>
    </AuthLayout>
  );
}
