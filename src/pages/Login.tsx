import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2 } from "lucide-react";

import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function classifyIdentifier(value: string): "email" | "phone" | "nickname" {
  if (value.includes("@")) return "email";
  if (/^\+?[0-9\s-]{7,}$/.test(value)) return "phone";
  return "nickname";
}

export default function Login() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const kind = classifyIdentifier(identifier.trim());
      let email = identifier.trim();
      const phone = identifier.trim();

      if (kind === "nickname") {
        const { data: profile, error: lookupError } = await supabase
          .from("users")
          .select("email")
          .eq("nickname", identifier.trim())
          .maybeSingle();

        if (lookupError) throw lookupError;
        if (!profile?.email) {
          throw new Error(t("noAccountFound"));
        }
        email = profile.email;
      }

      const { error } =
        kind === "phone"
          ? await supabase.auth.signInWithPassword({ phone, password })
          : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      navigate("/player-dashboard");
    } catch (err: any) {
      toast({
        title: t("loginFailed"),
        description: err.message || t("checkCredentials"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("signIn")}
      description={t("identifierDescription")}
      footer={
        <>
          {t("dontHaveAccount")}{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            {t("signUp")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="identifier">{t("identifierLabel")}</Label>
          <Input
            id="identifier"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t("identifierPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              {t("forgotPassword")}
            </Link>
          </div>
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("signIn")}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
