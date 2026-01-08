import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  Clock,
  Award,
  Plus,
  Search,
  Filter,
  UserPlus,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { CreateTeamModal } from "@/components/ui/CreateTeamModal";
import { InvitePlayersModal } from "@/components/ui/InvitePlayersModal";



export default function CoachDashboard() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [coachDbId, setCoachDbId] = useState<string | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);



  // Helper functions for styling
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  const calculateTrend = (analyses: any[]) => {
    if (!analyses || analyses.length < 2) return 0;
    const recent = analyses[0]?.overall || 0;
    const previous = analyses[1]?.overall || 0;
    return recent - previous;
  };

  const getDbUserId = async () => {
    if (!user) return null;

    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single();

    return data?.id || null;
  };

  const fetchRoster = async (teamId: string, isBackgroundRefresh = false) => {
    console.log('Fetching roster for team:', teamId);

    // ✅ Только показывай loading если НЕ фоновое обновление
    if (!isBackgroundRefresh) {
      setRefreshing(true);
    }

    const { data, error } = await supabase
      .from('team_rosters')
      .select(`
      id,
      player_id,
      jersey_number,
      status,
      users (
        id,
        name,
        age,
        position,
        club
      )
    `)
      .eq('team_id', teamId)
      .eq('status', 'active');

    if (!error && data) {
      const playersWithStats = await Promise.all(
        data.map(async (item) => {
          const { data: analyses } = await supabase
            .from('analyses')
            .select('overall, created_at')
            .eq('user_id', item.player_id)
            .order('created_at', { ascending: false })
            .limit(3);

          return {
            ...item.users,
            roster_id: item.id,
            jersey_number: item.jersey_number,
            latest_score: analyses?.[0]?.overall || null,
            last_upload: analyses?.[0]?.created_at || null,
            trend: calculateTrend(analyses || [])
          };
        })
      );

      setRoster(playersWithStats);
    }

    // ✅ Убери loading state
    setRefreshing(false);
  };

  const fetchCoachData = async () => {
    try {
      // 0. Get coach DB user ID first
      const dbUserId = await getDbUserId();
      setCoachDbId(dbUserId); // ✅ ДОБАВЛЕНО: Сохраняем coach ID

      // 1. Get coach's teams
      const { data: coachTeams, error: teamsError } = await supabase
        .from('team_coaches')
        .select(`
        team_id,
        role,
        teams (
          id,
          name,
          age_group,
          season,
          invite_code,
          clubs (name)
        )
      `)
        .eq('coach_id', dbUserId) as any;

      if (teamsError) throw teamsError;

      setTeams(coachTeams?.map(ct => ct.teams) || []);

      if (coachTeams && coachTeams.length > 0) {
        setSelectedTeam(coachTeams[0].teams);
        await fetchRoster(coachTeams[0].team_id, false);
      }

    } catch (error: any) {
      console.error('Error fetching coach data:', error);
      toast({
        title: "Error",
        description: "Could not load teams",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (!selectedTeam?.id) return;

    fetchRoster(selectedTeam.id, false);

    const interval = setInterval(() => {
      fetchRoster(selectedTeam.id, true);
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedTeam]);







  const handleApprovePlayer = async (playerId: string, rosterId: string) => {
    try {
      const { error } = await (supabase
        .from('team_rosters') as any)
        .update({ status: 'active' })
        .eq('id', rosterId);

      if (error) throw error;

      toast({
        title: "Player Approved",
        description: "The player has been added to the team roster.",
      });

      if (selectedTeam) {
        fetchRoster(selectedTeam.id, false);
      }
    } catch (error: any) {
      console.error('Error approving player:', error);
      toast({
        title: "Error",
        description: "Could not approve player",
        variant: "destructive"
      });
    }
  };

  const handleDeclinePlayer = async (rosterId: string) => {
    if (!confirm("Are you sure you want to decline this player's request?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('team_rosters')
        .delete()
        .eq('id', rosterId);

      if (error) throw error;

      toast({
        title: "Request Declined",
        description: "The player's request has been removed.",
      });

      if (selectedTeam) {
        fetchRoster(selectedTeam.id);
      }
    } catch (error: any) {
      console.error('Error declining player:', error);
      toast({
        title: "Error",
        description: "Could not decline player",
        variant: "destructive"
      });
    }
  };

  const handleRemovePlayer = async (rosterId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to remove ${playerName} from the team?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('team_rosters')
        .delete()
        .eq('id', rosterId);

      if (error) throw error;

      toast({
        title: "Player Removed",
        description: `${playerName} has been removed from the team`,
      });

      if (selectedTeam) {
        fetchRoster(selectedTeam.id);
      }
    } catch (error: any) {
      console.error('Error removing player:', error);
      toast({
        title: "Error",
        description: "Could not remove player",
        variant: "destructive"
      });
    }
  };


  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(
      `Are you sure you want to delete "${teamName}"?\n\n` +
      `This will:\n` +
      `- Remove all players from the team\n` +
      `- Delete all team data\n` +
      `- This action cannot be undone!`
    )) {
      return;
    }

    try {
      // Delete team (CASCADE will delete team_coaches and team_rosters)
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: "Team Deleted",
        description: `${teamName} has been deleted`,
      });

      // Refresh teams list
      await fetchCoachData();

    } catch (error: any) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Could not delete team",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Coach Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your teams and track player performance
          </p>
        </header>

        {/* Team Selector */}
        <div className="mb-6 flex items-center gap-4">
          <select
            className="px-4 py-2 rounded-lg border bg-background"
            value={selectedTeam?.id || ''}
            onChange={(e) => {
              const team = teams.find(t => t.id === e.target.value);
              setSelectedTeam(team);
              fetchRoster(e.target.value);
            }}
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.clubs?.name} - {team.name}
              </option>
            ))}
          </select>

          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>

          {selectedTeam && (
            <Button
              variant="destructive"
              onClick={() => handleDeleteTeam(selectedTeam.id, selectedTeam.name)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Team
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-2xl font-bold">{roster.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">
                    {roster.length > 0
                      ? (roster.reduce((sum, p) => sum + (p.latest_score || 0), 0) / roster.length).toFixed(1)
                      : '0'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold">
                    {roster.filter(p => {
                      if (!p.last_upload) return false;
                      const uploadDate = new Date(p.last_upload);
                      const today = new Date();
                      return uploadDate.toDateString() === today.toDateString();
                    }).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Performers</p>
                  <p className="text-2xl font-bold">
                    {roster.filter(p => p.latest_score >= 80).length}
                  </p>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roster Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Roster</CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Players
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Age</th>
                    <th className="text-left p-3">Position</th>
                    <th className="text-left p-3">Latest Score</th>
                    <th className="text-left p-3">Trend</th>
                    <th className="text-left p-3">Last Upload</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((player) => (
                    <tr
                      key={player.id}
                      className={`border-b hover:bg-muted/50 ${player.status === 'pending' ? 'bg-yellow-50' : ''
                        }`}
                    >
                      <td className="p-3">{player.jersey_number || '-'}</td>
                      <td className="p-3 font-medium">{player.name}</td>
                      <td className="p-3">{player.age || '-'}</td>
                      <td className="p-3">{player.position || '-'}</td>
                      <td className="p-3">
                        {player.latest_score ? (
                          <span className={`font-bold ${getScoreColor(player.latest_score)}`}>
                            {player.latest_score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No data</span>
                        )}
                      </td>
                      <td className="p-3">
                        {player.trend !== 0 && (
                          <span className={player.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                            {player.trend > 0 ? '↑' : '↓'} {Math.abs(player.trend).toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {player.last_upload
                          ? new Date(player.last_upload).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="p-3">
                        {player.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprovePlayer(player.id, player.roster_id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclinePlayer(player.roster_id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              View Profile
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemovePlayer(player.roster_id, player.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {roster.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No players in this team yet</p>
                <Button onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Players
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
      {
        showCreateModal && coachDbId && (
          <CreateTeamModal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            coachId={coachDbId}
            onSuccess={() => {
              fetchCoachData(); // Refresh teams
            }}
          />
        )
      }
      {
        showInviteModal && selectedTeam && (
          <InvitePlayersModal
            open={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            team={selectedTeam}
            onSuccess={() => {
              fetchRoster(selectedTeam.id); // Refresh roster
            }}
          />
        )
      }
    </div>

  );
}