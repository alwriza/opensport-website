import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
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
      let phone = identifier.trim();

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
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t("identifierPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">{t("passwordLabel")}</Label>
                <a href="/forgot-password" className="text-xs text-primary underline">
                  {t("forgotPassword")}
                </a>
              </div>
              <Input
                id="password"
                type="password"
                required
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
            <a href="/register" className="text-primary underline">{t("signUp")}</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
