import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react";

import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
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
      const { data, error } = await supabase.functions.invoke("register", {
        body: { ...form, terms_accepted: termsAccepted, privacy_accepted: privacyAccepted },
      });

      if (error) {
        const message = (error as any)?.context?.error || error.message || "Registration failed";
        throw new Error(message);
      }

      if ((data as any)?.error) {
        throw new Error((data as any).error);
      }

      toast({
        title: t("accountCreated"),
        description: t("verificationSent"),
      });

      navigate("/verify-email", { state: { email: form.email } });
    } catch (err: any) {
      const msg = err.message || "";
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
    <AuthLayout
      title={t("createYourAccount")}
      description={t("joinDescription")}
      footer={
        <>
          {t("alreadyHaveAccount")}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("signIn")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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

        <div className="grid gap-5 sm:grid-cols-2">
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
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface-1 p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
              {t("termsLabel")}{" "}
              <Link
                to="/terms"
                target="_blank"
                className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="privacy" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
              {t("privacyLabel")}{" "}
              <Link
                to="/privacy"
                target="_blank"
                className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            </label>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading || !canSubmit}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("createAccount")}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
