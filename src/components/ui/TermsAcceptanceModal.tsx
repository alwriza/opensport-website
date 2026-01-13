import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TermsAcceptanceModalProps {
    open: boolean;
    userId: string;
    onAccept: () => void;
}

export function TermsAcceptanceModal({ open, userId, onAccept }: TermsAcceptanceModalProps) {
    const { t } = useTranslation("dashboard");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleAccept = async () => {
        if (!termsAccepted || !privacyAccepted) {
            toast({
                title: t("legal.toasts.incomplete.title"),
                description: t("legal.toasts.incomplete.description"),
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const now = new Date().toISOString();

            // @ts-ignore - Supabase type inference issue
            const { error } = await supabase
                .from('users')
                .update({
                    terms_accepted_at: now,
                    privacy_accepted_at: now
                })
                .eq('id', userId);

            if (error) throw error;

            onAccept();
        } catch (error) {
            console.error('Error accepting terms:', error);
            toast({
                title: t("legal.toasts.error.title"),
                description: t("legal.toasts.error.description"),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent
                className="max-w-2xl"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl">{t("legal.title")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <p className="text-muted-foreground">
                        {t("legal.description")}
                    </p>

                    {/* Terms Checkbox */}
                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:border-primary transition-colors">
                        <Checkbox
                            id="terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <label htmlFor="terms" className="text-sm font-medium cursor-pointer leading-relaxed">
                                {t("legal.readMore")}{" "}
                            </label>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open('/terms', '_blank');
                                }}
                                className="text-primary hover:underline inline-flex items-center gap-1 font-bold bg-transparent border-none p-0 cursor-pointer text-sm"
                            >
                                {t("player.profile.terms")}
                                <ExternalLink className="h-3 w-3" />
                            </button>
                        </div>
                    </div>

                    {/* Privacy Checkbox */}
                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:border-primary transition-colors">
                        <Checkbox
                            id="privacy"
                            checked={privacyAccepted}
                            onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <label htmlFor="privacy" className="text-sm font-medium cursor-pointer leading-relaxed">
                                {t("legal.readMore")}{" "}
                            </label>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open('/privacy', '_blank');
                                }}
                                className="text-primary hover:underline inline-flex items-center gap-1 font-bold bg-transparent border-none p-0 cursor-pointer text-sm"
                            >
                                {t("player.profile.privacy")}
                                <ExternalLink className="h-3 w-3" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                            <strong>{t("legal.collect")}</strong> {t("legal.collectDescription")}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleAccept}
                        disabled={!termsAccepted || !privacyAccepted || loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? t("legal.saving") : t("legal.accept")}
                    </Button>
                </DialogFooter>
            </DialogContent >
        </Dialog >
    );
}