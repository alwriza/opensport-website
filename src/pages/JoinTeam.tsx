import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, CheckCircle } from "lucide-react";

export default function JoinTeam() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();
    const { toast } = useToast();

    const [inviteCode, setInviteCode] = useState(searchParams.get('code') || "");
    const [loading, setLoading] = useState(false);
    const [teamInfo, setTeamInfo] = useState<any>(null);
    const [dbUserId, setDbUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded) return;

        if (!user) {
            toast({
                title: "Please sign in",
                description: "You need to be signed in to join a team",
                variant: "destructive"
            });
            navigate('/sign-in');
            return;
        }

        fetchDbUserId();
    }, [isLoaded, user]);

    const fetchDbUserId = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', user.id)
            .single();

        setDbUserId(data?.id || null);
    };

    const verifyInviteCode = async () => {
        if (!inviteCode) {
            toast({
                title: "Enter invite code",
                description: "Please enter a team invite code",
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
                    title: "Invalid code",
                    description: "Team not found with this invite code",
                    variant: "destructive"
                });
                return;
            }

            setTeamInfo(team);

        } catch (error: any) {
            console.error('Error verifying code:', error);
            toast({
                title: "Error",
                description: "Could not verify invite code",
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
            // Check if already in team
            const { data: existing } = await supabase
                .from('team_rosters')
                .select('id, status')
                .eq('team_id', teamInfo.id)
                .eq('player_id', dbUserId)
                .single();

            if (existing) {
                if (existing.status === 'active') {
                    toast({
                        title: "Already in team",
                        description: "You are already a member of this team",
                    });
                } else if (existing.status === 'declined') {
                    toast({
                        title: "Previously declined",
                        description: "You previously declined this team invitation",
                    });
                }
                return;
            }

            // ✅ СРАЗУ ДОБАВЛЯЕМ КАК ACTIVE (код = автоматический approve)
            const { error: rosterError } = await supabase
                .from('team_rosters')
                .insert({
                    team_id: teamInfo.id,
                    player_id: dbUserId,
                    status: 'active'  // ✅ Правильно!
                });

            if (rosterError) throw rosterError;

            toast({
                title: "Joined Team! 🎉",
                description: `You are now a member of ${teamInfo.name}`,
            });

            // Redirect to player dashboard
            setTimeout(() => {
                navigate('/player-dashboard');
            }, 1500);

        } catch (error: any) {
            console.error('Error joining team:', error);
            toast({
                title: "Error",
                description: error.message || "Could not join team",
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
                        Join Team
                    </CardTitle>
                    <CardDescription>
                        Enter the invite code provided by your coach
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {!teamInfo ? (
                        <>
                            {/* Enter Code Form */}
                            <div className="space-y-2">
                                <Label htmlFor="inviteCode">Team Invite Code</Label>
                                <Input
                                    id="inviteCode"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    placeholder="ABC123"
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
                                Verify Code
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
                                    <p className="text-sm text-muted-foreground">You're joining</p>
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
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={joinTeam}
                                    disabled={loading}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Join Team
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}