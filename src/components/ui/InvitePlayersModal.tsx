import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Mail, Link as LinkIcon } from "lucide-react";

interface InvitePlayersModalProps {
    open: boolean;
    onClose: () => void;
    team: {
        id: string;
        name: string;
        invite_code: string;
    };
    onSuccess: () => void;
}

export function InvitePlayersModal({ open, onClose, team, onSuccess }: InvitePlayersModalProps) {
    const { t } = useTranslation("team");
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // Copy invite code to clipboard
    const copyInviteCode = () => {
        navigator.clipboard.writeText(team.invite_code);
        toast({
            title: t("inviteModal.codeTab.copyToast.title"),
            description: t("inviteModal.codeTab.copyToast.description"),
        });
    };

    // Copy invite link to clipboard
    const copyInviteLink = () => {
        const link = `${window.location.origin}/join-team?code=${team.invite_code}`;
        navigator.clipboard.writeText(link);
        toast({
            title: t("inviteModal.linkTab.copyToast.title"),
            description: t("inviteModal.linkTab.copyToast.description"),
        });
    };

    // Send email invitation
    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const { error } = await supabase.functions.invoke('send-team-invite', {
                body: {
                    email,
                    team_name: team.name,
                    invite_code: team.invite_code,
                    origin: window.location.origin,
                },
            });

            if (error) {
                if (error.status === 404) {
                    toast({
                        title: t("inviteModal.emailTab.toasts.userNotFound.title"),
                        description: t("inviteModal.emailTab.toasts.userNotFound.description"),
                        variant: "default"
                    });
                } else {
                    toast({
                        title: t("inviteModal.emailTab.toasts.error.title"),
                        description: error.message || t("inviteModal.emailTab.toasts.error.description"),
                        variant: "destructive"
                    });
                }
                return;
            }

            toast({
                title: t("inviteModal.emailTab.toasts.success.title"),
                description: t("inviteModal.emailTab.toasts.success.description", { email }),
            });

            // Also record the invitation in the database for tracking
            // @ts-ignore
            await (supabase
                .from('team_invitations') as any)
                .insert({
                    team_id: team.id,
                    email: email,
                    invite_code: team.invite_code,
                    status: 'pending'
                });

            setEmail("");
            onSuccess();

        } catch (error: any) {
            console.error('Error sending invitation:', error);
            toast({
                title: t("createTeamModal.errors.title"),
                description: error.message || t("join.toasts.genericError.description"),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Send phone invitation
    const handlePhoneInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone) return;

        setLoading(true);
        try {
            // @ts-ignore
            const { error } = await (supabase
                .from('team_invitations') as any)
                .insert({
                    team_id: team.id,
                    phone: phone,
                    invite_code: team.invite_code,
                    status: 'pending'
                });

            if (error) throw error;

            toast({
                title: t("inviteModal.emailTab.toasts.success.title"),
                description: t("inviteModal.phoneTab.toast.success", { phone }),
            });

            setPhone("");
            onSuccess();

        } catch (error: any) {
            console.error('Error sending invitation:', error);
            toast({
                title: t("createTeamModal.errors.title"),
                description: error.message || t("join.toasts.genericError.description"),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("inviteModal.title", { teamName: team.name })}</DialogTitle>
                    <DialogDescription>
                        {t("inviteModal.description")}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="code" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="code">{t("inviteModal.tabs.code")}</TabsTrigger>
                        <TabsTrigger value="email">{t("inviteModal.tabs.email")}</TabsTrigger>
                        <TabsTrigger value="link">{t("inviteModal.tabs.link")}</TabsTrigger>
                    </TabsList>

                    {/* Invite Code Tab */}
                    <TabsContent value="code" className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("inviteModal.codeTab.label")}</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={team.invite_code}
                                    readOnly
                                    className="text-2xl font-bold text-center tracking-wider"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyInviteCode}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t("inviteModal.codeTab.description")}
                            </p>
                        </div>
                    </TabsContent>

                    {/* Email Invite Tab */}
                    <TabsContent value="email">
                        <form onSubmit={handleSendEmail} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t("inviteModal.emailTab.label")}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t("inviteModal.emailTab.placeholder")}
                                    required
                                />
                                <p className="text-sm text-muted-foreground">
                                    {t("inviteModal.emailTab.description")}
                                </p>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Mail className="mr-2 h-4 w-4" />
                                {loading ? t("inviteModal.emailTab.loading") : t("inviteModal.emailTab.button")}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* Link Invite Tab */}
                    <TabsContent value="link" className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("inviteModal.linkTab.label")}</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={`${window.location.origin}/join-team?code=${team.invite_code}`}
                                    readOnly
                                    className="text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyInviteLink}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t("inviteModal.linkTab.description")}
                            </p>
                        </div>

                        <Button className="w-full" onClick={copyInviteLink}>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            {t("inviteModal.linkTab.button")}
                        </Button>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t("inviteModal.close")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}