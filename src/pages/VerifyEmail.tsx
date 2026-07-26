import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function VerifyEmail() {
  const { t } = useTranslation("auth");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = (location.state as any)?.email || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6 || !email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (error) throw error;

      toast({ title: t("emailConfirmed"), description: t("welcomeMessage") });
      navigate("/player-dashboard");
    } catch (err: any) {
      toast({
        title: t("invalidCode"),
        description: err.message || t("codeIncorrect"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast({ title: t("codeSent"), description: t("checkEmailNewCode") });
    } catch (err: any) {
      toast({ title: t("couldNotResend"), description: err.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("noEmailFound")}</CardTitle>
            <CardDescription>
              {t("startFromRegistration")} <a href="/register" className="text-primary underline">{t("registrationPage")}</a>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("confirmYourEmail")}</CardTitle>
          <CardDescription>
            {t("enterCodeSentTo")} <span className="text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button onClick={handleVerify} className="w-full" disabled={loading || code.length !== 6}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("verify")}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t("didntGetCode")}{" "}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary underline disabled:opacity-50"
            >
              {resending ? t("sending") : t("resendCode")}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
