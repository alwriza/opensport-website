import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function JoinTeam() {
    const { t } = useTranslation("team");
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isLoaded } = useCurrentUser();
    const { toast } = useToast();

    const [inviteCode, setInviteCode] = useState(searchParams.get('code') || "");
    const [loading, setLoading] = useState(false);
    const [teamInfo, setTeamInfo] = useState<any>(null);
    const [dbUserId, setDbUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded) return;

        if (!user) {
            toast({
                title: t("join.toasts.signIn.title"),
                description: t("join.toasts.signIn.description"),
                variant: "destructive"
            });
            navigate('/login');
            return;
        }

        fetchDbUserId();
    }, [isLoaded, user]);

    const fetchDbUserId = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        setDbUserId(data ? (data as any).id : null);
    };

    const verifyInviteCode = async () => {
        if (!inviteCode) {
            toast({
                title: t("join.toasts.enterCode.title"),
                description: t("join.toasts.enterCode.description"),
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // Codes are not readable from the browser; the server resolves them.
            const { data: found, error: teamError } = await (supabase as unknown as SupabaseClient)
                .rpc('find_team_by_invite_code', { p_code: inviteCode });
            const row = (found as { id: string; name: string; age_group: string; club_name: string | null }[] | null)?.[0];
            const team = row && { id: row.id, name: row.name, age_group: row.age_group, clubs: { name: row.club_name } };

            if (teamError || !team) {
                toast({
                    title: t("join.toasts.invalidCode.title"),
                    description: t("join.toasts.invalidCode.description"),
                    variant: "destructive"
                });
                return;
            }

            setTeamInfo(team);

        } catch (error: any) {
            console.error('Error verifying code:', error);
            toast({
                title: t("join.toasts.error.title"),
                description: t("join.toasts.error.description"),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const joinTeam = async () => {
        if (!teamInfo || !dbUserId) return;

        setLoading(true);
        try {
            // The server checks the code again, refuses coaches of the team and
            // existing members, and adds the player as active.
            const { data: result, error: joinError } = await (supabase as unknown as SupabaseClient)
                .rpc('join_team_by_invite_code', { p_code: inviteCode });
            if (joinError) throw joinError;
            const outcome = result as { ok: boolean; reason?: string };
            if (!outcome.ok) {
                const key =
                    outcome.reason === 'coach_of_team' ? 'restricted'
                    : outcome.reason === 'already_active' ? 'alreadyIn'
                    : outcome.reason === 'already_declined' ? 'declined'
                    : outcome.reason === 'invalid_code' ? 'invalidCode'
                    : null;
                if (key) {
                    toast({
                        title: t(`join.toasts.${key}.title`),
                        description: t(`join.toasts.${key}.description`),
                        variant: key === 'restricted' || key === 'invalidCode' ? 'destructive' : undefined,
                    });
                } else if (outcome.reason?.startsWith('already_')) {
                    toast({ title: t("join.toasts.alreadyIn.title"), description: t("join.toasts.alreadyIn.description") });
                } else {
                    throw new Error(outcome.reason || 'join_failed');
                }
                return;
            }

            toast({
                title: t("join.toasts.success.title"),
                description: t("join.toasts.success.description", { teamName: teamInfo.name }),
            });

            // Redirect to player dashboard
            setTimeout(() => {
                navigate('/player-dashboard');
            }, 1500);

        } catch (error: any) {
            console.error('Error joining team:', error);
            toast({
                title: t("join.toasts.genericError.title"),
                description: error.message || t("join.toasts.genericError.description"),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-card flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        {t("join.title")}
                    </CardTitle>
                    <CardDescription>
                        {t("join.description")}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {!teamInfo ? (
                        <>
                            {/* Enter Code Form */}
                            <div className="space-y-2">
                                <Label htmlFor="inviteCode">{t("join.label")}</Label>
                                <Input
                                    id="inviteCode"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    placeholder={t("join.placeholder")}
                                    className="text-2xl font-bold text-center tracking-wider"
                                    maxLength={6}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={verifyInviteCode}
                                disabled={loading || !inviteCode}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("join.button")}
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* Team Info */}
                            <div className="bg-muted rounded-lg p-4 space-y-2">
                                <div className="flex items-center justify-center mb-4">
                                    <CheckCircle className="h-12 w-12 text-green-600" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">{t("join.joining")}</p>
                                    <h3 className="text-xl font-bold">{teamInfo.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {teamInfo.clubs?.name} • {teamInfo.age_group}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setTeamInfo(null)}
                                >
                                    {t("join.cancel")}
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={joinTeam}
                                    disabled={loading}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t("join.confirm")}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}