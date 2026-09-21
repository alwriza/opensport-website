import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
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
            // Find team by invite code
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .select(`
          id,
          name,
          age_group,
          clubs (name)
        `)
                .eq('invite_code', inviteCode.toUpperCase())
                .single();

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
            // Check if user is a coach for this team
            const { data: isCoach } = await supabase
                .from('team_coaches')
                .select('id')
                .eq('team_id', teamInfo.id)
                .eq('coach_id', dbUserId)
                .maybeSingle();

            if (isCoach) {
                toast({
                    title: t("join.toasts.restricted.title"),
                    description: t("join.toasts.restricted.description"),
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }

            // Check if already in team
            const { data: existing } = await supabase
                .from('team_rosters')
                .select('id, status')
                .eq('team_id', teamInfo.id)
                .eq('player_id', dbUserId)
                .single();

            if (existing) {
                // @ts-ignore
                if (existing.status === 'active') {
                    toast({
                        title: t("join.toasts.alreadyIn.title"),
                        description: t("join.toasts.alreadyIn.description"),
                    });
                    // @ts-ignore
                } else if (existing.status === 'declined') {
                    toast({
                        title: t("join.toasts.declined.title"),
                        description: t("join.toasts.declined.description"),
                    });
                }
                return;
            }

            // ✅ СРАЗУ ДОБАВЛЯЕМ КАК ACTIVE (код = автоматический approve)
            // @ts-ignore
            const { error: rosterError } = await (supabase
                .from('team_rosters') as any)
                .insert({
                    team_id: teamInfo.id,
                    player_id: dbUserId,
                    status: 'active'  // ✅ Правильно!
                });

            if (rosterError) throw rosterError;

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
        <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-12">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-20 mask-fade-edges" />
            <Card className="relative w-full max-w-md">
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
                                    className="h-14 text-center font-display text-2xl font-bold tracking-[0.3em]"
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
                            <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/[0.06] p-5">
                                <div className="flex items-center justify-center mb-4">
                                    <CheckCircle className="h-12 w-12 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">{t("join.joining")}</p>
                                    <h3 className="font-display text-xl font-bold">{teamInfo.name}</h3>
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