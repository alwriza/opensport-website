import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, MailOpen } from "lucide-react";

import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
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
      <AuthLayout
        title={t("noEmailFound")}
        description={t("startFromRegistration")}
      >
        <Button asChild size="lg" className="w-full">
          <Link to="/register">{t("registrationPage")}</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t("confirmYourEmail")}
      description={
        <>
          {t("enterCodeSentTo")} <span className="font-medium text-foreground">{email}</span>
        </>
      }
      footer={
        <>
          {t("didntGetCode")}{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-primary hover:underline disabled:opacity-50"
          >
            {resending ? t("sending") : t("resendCode")}
          </button>
        </>
      }
    >
      <div className="space-y-7">
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
            <MailOpen className="h-7 w-7" />
          </span>
        </div>

        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button onClick={handleVerify} size="lg" className="w-full" disabled={loading || code.length !== 6}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("verify")}
        </Button>
      </div>
    </AuthLayout>
  );
}
