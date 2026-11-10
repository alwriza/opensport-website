import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { registrationFunctions, supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

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
      const value = identifier.trim();

      if (kind === "nickname") {
        // Emails are not readable from the browser; the login function resolves
        // the nickname server-side and returns a session.
        const { data, error } = await registrationFunctions.invoke<{ access_token?: string; refresh_token?: string; error?: string }>("login", {
          body: { nickname: value, password },
        });
        let code = data?.error;
        if (error instanceof FunctionsHttpError) {
          const response = await error.context.json().catch(() => null);
          code = typeof response?.error === "string" ? response.error : "invalid_credentials";
        } else if (error) {
          throw error;
        }
        if (code || !data?.access_token || !data.refresh_token) {
          throw new Error(code === "email_not_confirmed" ? "Email not confirmed" : t("checkCredentials"));
        }
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        if (sessionError) throw sessionError;
      } else {
        const { error } =
          kind === "phone"
            ? await supabase.auth.signInWithPassword({ phone: value, password })
            : await supabase.auth.signInWithPassword({ email: value, password });
        if (error) throw error;
      }

      navigate("/player-dashboard");
    } catch (err) {
      toast({
        title: t("loginFailed"),
        description: (err as Error).message || t("checkCredentials"),
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
          <CardTitle>{t("signIn")}</CardTitle>
          <CardDescription>{t("identifierDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex justify-between items-center">
                <Label htmlFor="password">{t("passwordLabel")}</Label>
                <Link to="/forgot-password" className="text-xs text-primary underline">
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("signIn")}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-4">
            {t("dontHaveAccount")}{" "}
            <Link to="/register" className="text-primary underline">{t("signUp")}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
