import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";

interface TermsAcceptanceModalProps {
    open: boolean;
    userId: string;
    onAccept: () => void;
}

export function TermsAcceptanceModal({ open, userId, onAccept }: TermsAcceptanceModalProps) {
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleAccept = async () => {
        if (!termsAccepted || !privacyAccepted) {
            toast({
                title: "Please accept both agreements",
                description: "You must accept Terms of Service and Privacy Policy to continue",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const now = new Date().toISOString();

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
                title: "Error",
                description: "Could not save acceptance. Please try again.",
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
                    <DialogTitle className="text-2xl">Welcome to OpenSport!</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <p className="text-muted-foreground">
                        Before you start your football journey, please review and accept our terms:
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
                                I have read and agree to the{" "}

                                <a
                                    href="/terms"
                                    target="_blank"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Terms of Service
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </label>
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
                                I have read and agree to the{" "}
                                <a
                                    href="/privacy"
                                    target="_blank"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Privacy Policy
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </label>
                        </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                            <strong>What we collect:</strong> Videos you upload, analysis results, and training progress.
                            Your data is encrypted and never sold to third parties.
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
                        {loading ? "Saving..." : "Accept and Continue"}
                    </Button>
                </DialogFooter>
            </DialogContent >
        </Dialog >
    );
}