import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
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
    } catch (err) {
      toast({
        title: t("couldNotUpdatePassword"),
        description: (err as Error).message || t("resetLinkExpired"),
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
          <CardTitle>{t("setNewPassword")}</CardTitle>
          <CardDescription>{t("chooseNewPassword")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                aria-invalid={mismatch}
                aria-describedby={mismatch ? "password-mismatch" : undefined}
                className={mismatch ? "border-destructive" : undefined}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {mismatch && <p id="password-mismatch" className="text-sm text-destructive" role="status">{t("passwordsDontMatch")}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading || mismatch}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("updatePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
