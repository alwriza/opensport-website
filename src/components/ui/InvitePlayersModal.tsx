import { useState } from "react";
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
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // Copy invite code to clipboard
    const copyInviteCode = () => {
        navigator.clipboard.writeText(team.invite_code);
        toast({
            title: "Copied!",
            description: "Invite code copied to clipboard",
        });
    };

    // Copy invite link to clipboard
    const copyInviteLink = () => {
        const link = `${window.location.origin}/join-team?code=${team.invite_code}`;
        navigator.clipboard.writeText(link);
        toast({
            title: "Copied!",
            description: "Invite link copied to clipboard",
        });
    };

    // Send email invitation
    const handleEmailInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('team_invitations')
                .insert({
                    team_id: team.id,
                    email: email,
                    invite_code: team.invite_code,
                    status: 'pending'
                });

            if (error) throw error;

            toast({
                title: "Invitation Sent! 📧",
                description: `Invitation sent to ${email}`,
            });

            setEmail("");
            onSuccess();

        } catch (error: any) {
            console.error('Error sending invitation:', error);
            toast({
                title: "Error",
                description: error.message || "Could not send invitation",
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
            const { error } = await supabase
                .from('team_invitations')
                .insert({
                    team_id: team.id,
                    phone: phone,
                    invite_code: team.invite_code,
                    status: 'pending'
                });

            if (error) throw error;

            toast({
                title: "Invitation Sent! 📱",
                description: `Invitation sent to ${phone}`,
            });

            setPhone("");
            onSuccess();

        } catch (error: any) {
            console.error('Error sending invitation:', error);
            toast({
                title: "Error",
                description: error.message || "Could not send invitation",
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
                    <DialogTitle>Invite Players to {team.name}</DialogTitle>
                    <DialogDescription>
                        Choose how you want to invite players to your team
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="code" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="code">Code</TabsTrigger>
                        <TabsTrigger value="email">Email</TabsTrigger>
                        <TabsTrigger value="link">Link</TabsTrigger>
                    </TabsList>

                    {/* Invite Code Tab */}
                    <TabsContent value="code" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Team Invite Code</Label>
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
                                Share this code with players. They can enter it in their player dashboard to join the team.
                            </p>
                        </div>
                    </TabsContent>

                    {/* Email Invite Tab */}
                    <TabsContent value="email">
                        <form onSubmit={handleEmailInvite} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Player Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="player@example.com"
                                    required
                                />
                                <p className="text-sm text-muted-foreground">
                                    An invitation email will be sent to this address
                                </p>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email Invitation
                            </Button>
                        </form>
                    </TabsContent>

                    {/* Link Invite Tab */}
                    <TabsContent value="link" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Shareable Link</Label>
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
                                Share this link with players via WhatsApp, Telegram, or any messaging app
                            </p>
                        </div>

                        <Button className="w-full" onClick={copyInviteLink}>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Copy Invite Link
                        </Button>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}