import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Register() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", phone: "", nickname: "" });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const canSubmit = termsAccepted && privacyAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ error?: string }>("register", {
        body: { ...form, terms_accepted: termsAccepted, privacy_accepted: privacyAccepted },
      });

      if (error) {
        const message = (error as { context?: { error?: string } })?.context?.error || error.message || "Registration failed";
        throw new Error(message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: t("accountCreated"),
        description: t("verificationSent"),
      });

      navigate("/verify-email", { state: { email: form.email } });
    } catch (err) {
      const msg = (err as Error).message || "";
      let description = t("somethingWentWrong");
      if (msg.includes("nickname")) description = t("nicknameTaken");
      else if (msg.includes("phone")) description = t("phoneTaken");
      else if (msg) description = msg;

      toast({ title: t("registrationFailed"), description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("createYourAccount")}</CardTitle>
          <CardDescription>{t("joinDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("emailPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <PasswordInput
                id="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t("passwordPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phoneLabel")}</Label>
              <Input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t("phonePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">{t("nicknameLabel")}</Label>
              <Input
                id="nickname"
                required
                autoComplete="nickname"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder={t("nicknamePlaceholder")}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  {t("termsLabel")}{" "}
                  <Link to="/terms" target="_blank" className="text-primary underline inline-flex items-center gap-0.5">
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                  className="mt-1"
                />
                <label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                  {t("privacyLabel")}{" "}
                  <Link to="/privacy" target="_blank" className="text-primary underline inline-flex items-center gap-0.5">
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("createAccount")}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-4">
            {t("alreadyHaveAccount")}{" "}
            <Link to="/login" className="text-primary underline">{t("signIn")}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
