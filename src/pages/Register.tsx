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

export default function Register() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", phone: "", nickname: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("register", {
        body: form,
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
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("emailPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
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
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder={t("nicknamePlaceholder")}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("createAccount")}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-4">
            {t("alreadyHaveAccount")}{" "}
            <a href="/login" className="text-primary underline">{t("signIn")}</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
