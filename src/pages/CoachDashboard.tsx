import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Star,
  Stethoscope,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { CreateTeamModal } from "@/components/ui/CreateTeamModal";
import { InvitePlayersModal } from "@/components/ui/InvitePlayersModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



export default function CoachDashboard() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState('All');
  const [filterAgeRange, setFilterAgeRange] = useState<[number, number]>([0, 100]);
  const [filterScoreRange, setFilterScoreRange] = useState<[number, number]>([0, 100]);
  const [filterRecency, setFilterRecency] = useState('All');
  const [playerFlags, setPlayerFlags] = useState<Record<string, { needsReview?: boolean, injuryNote?: boolean, topProspect?: boolean }>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const POSITIONS = ['All', 'Forward', 'Midfielder', 'Defender', 'Goalkeeper'];


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

  const getRecentScores = (analyses: any[]) => {
    if (!analyses) return [];
    return analyses.slice(0, 3).map(a => a.overall);
  };

  const calculateTrendValue = (scores: number[]) => {
    if (scores.length < 2) return 0;
    return scores[0] - scores[1];
  };



  // 1. Get coach's DB ID
  const { data: coachDbId } = useQuery({
    queryKey: ['coach-db-id', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return (data as { id: string } | null)?.id || null;
    },
    enabled: !!user,
  });

  // 2. Get coach's teams
  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['coach-teams', coachDbId],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .eq('coach_id', coachDbId) as any;

      if (error) throw error;
      if (!data) return [];
      return data.map((ct: any) => ct.teams);
    },
    enabled: !!coachDbId,
  });

  // Derived state to handle auto-selection of the first team
  const activeTeamId = selectedTeamId || teams[0]?.id;

  const selectedTeam = useMemo(() =>
    teams.find(t => t.id === activeTeamId) || null,
    [teams, activeTeamId]);

  // 3. Get team roster with optimized stats fetching
  const { data: roster = [], isLoading: loadingRoster } = useQuery({
    queryKey: ['team-roster', activeTeamId],
    queryFn: async () => {
      if (!activeTeamId) return [];

      // Fetch roster members
      const { data: rosterData, error: rosterError } = await (supabase
        .from('team_rosters') as any)
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
        .eq('team_id', activeTeamId);

      if (rosterError) throw rosterError;
      if (!rosterData || rosterData.length === 0) return [];

      // OPTIMIZATION: Fetch ALL recent analyses for ALL players in one go
      const playerIds = rosterData.map(r => r.player_id);
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('user_id, overall, stability, power, technique, balance, created_at')
        .in('user_id', playerIds)
        .order('created_at', { ascending: false });

      if (analysesError) throw analysesError;

      // Group analyses by player
      const analysesByPlayer: Record<string, any[]> = {};
      (analysesData || []).forEach((analysis: any) => {
        if (!analysesByPlayer[analysis.user_id]) {
          analysesByPlayer[analysis.user_id] = [];
        }
        if (analysesByPlayer[analysis.user_id].length < 3) {
          analysesByPlayer[analysis.user_id].push(analysis);
        }
      });

      return (rosterData as any[]).map(item => {
        const playerAnalyses = analysesByPlayer[item.player_id] || [];
        const recentScores = getRecentScores(playerAnalyses);
        const latestAnalysis = playerAnalyses[0] || {};

        return {
          ...item.users,
          roster_id: item.id,
          jersey_number: item.jersey_number,
          latest_score: recentScores[0] || null,
          last_upload: latestAnalysis.created_at || null,
          recent_scores: recentScores,
          trend: calculateTrendValue(recentScores),
          metrics: {
            stability: latestAnalysis.stability || 0,
            power: latestAnalysis.power || 0,
            technique: latestAnalysis.technique || 0,
            balance: latestAnalysis.balance || 0
          }
        };
      });
    },
    enabled: !!activeTeamId,
    refetchInterval: 7000,
  });

  const filteredRoster = useMemo(() => {
    const filtered = roster.filter(player => {
      // Name search
      const matchesSearch = searchQuery === '' ||
        player.name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Position filter
      const matchesPosition = filterPosition === 'All' ||
        player.position?.toLowerCase() === filterPosition.toLowerCase();

      // Age filter
      const age = player.age || 0;
      const matchesAge = age >= filterAgeRange[0] && age <= filterAgeRange[1];

      // Score filter
      const score = player.latest_score || 0;
      const matchesScore = score >= filterScoreRange[0] && score <= filterScoreRange[1];

      // Recency filter
      let matchesRecency = true;
      if (filterRecency !== 'All' && player.last_upload) {
        const uploadDate = new Date(player.last_upload);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));

        if (filterRecency === 'Today') matchesRecency = diffDays === 0;
        else if (filterRecency === 'This Week') matchesRecency = diffDays <= 7;
        else if (filterRecency === 'This Month') matchesRecency = diffDays <= 30;
      } else if (filterRecency !== 'All') {
        matchesRecency = false;
      }

      return matchesSearch && matchesPosition && matchesAge && matchesScore && matchesRecency;
    });

    // Apply Sorting
    return [...filtered].sort((a, b) => {
      let valA: any, valB: any;

      switch (sortBy) {
        case 'name':
          valA = a.name?.toLowerCase() || '';
          valB = b.name?.toLowerCase() || '';
          break;
        case 'age':
          valA = a.age || 0;
          valB = b.age || 0;
          break;
        case 'overall':
          valA = a.latest_score || 0;
          valB = b.latest_score || 0;
          break;
        case 'stability':
          valA = a.metrics?.stability || 0;
          valB = b.metrics?.stability || 0;
          break;
        case 'power':
          valA = a.metrics?.power || 0;
          valB = b.metrics?.power || 0;
          break;
        case 'technique':
          valA = a.metrics?.technique || 0;
          valB = b.metrics?.technique || 0;
          break;
        case 'balance':
          valA = a.metrics?.balance || 0;
          valB = b.metrics?.balance || 0;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [roster, searchQuery, filterPosition, filterAgeRange, filterScoreRange, filterRecency, sortBy, sortOrder]);

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

      if (activeTeamId) {
        queryClient.invalidateQueries({ queryKey: ['team-roster', activeTeamId] });
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

      if (activeTeamId) {
        queryClient.invalidateQueries({ queryKey: ['team-roster', activeTeamId] });
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

      if (activeTeamId) {
        queryClient.invalidateQueries({ queryKey: ['team-roster', activeTeamId] });
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
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: "Team Deleted",
        description: `${teamName} has been deleted`,
      });

      queryClient.invalidateQueries({ queryKey: ['coach-teams', coachDbId] });
      if (activeTeamId === teamId) {
        setSelectedTeamId(null);
      }

    } catch (error: any) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Could not delete team",
        variant: "destructive"
      });
    }
  };

  const toggleFlag = (playerId: string, flag: 'needsReview' | 'injuryNote' | 'topProspect') => {
    setPlayerFlags(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [flag]: !prev[playerId]?.[flag]
      }
    }));
  };

  if (!isLoaded || loadingTeams) {
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
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
          <Select value={selectedTeamId || teams[0]?.id} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-full md:w-64 bg-background border-muted-foreground/20">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team: any) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Team Roster</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-lg border bg-background w-full md:w-64 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`${showFilters ? 'bg-muted' : ''} transition-all`}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>

                  <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Players
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">Position</label>
                    <Select value={filterPosition} onValueChange={setFilterPosition}>
                      <SelectTrigger className="w-full bg-background border-muted-foreground/20">
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map(pos => (
                          <SelectItem key={pos} value={pos}>
                            {pos === 'All' ? 'All Positions' : pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">Age Range</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        className="w-1/2 px-3 py-2 rounded-lg border bg-background"
                        value={filterAgeRange[0]}
                        onChange={(e) => setFilterAgeRange([Math.max(0, parseInt(e.target.value) || 0), filterAgeRange[1]])}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        className="w-1/2 px-3 py-2 rounded-lg border bg-background"
                        value={filterAgeRange[1]}
                        onChange={(e) => setFilterAgeRange([filterAgeRange[0], Math.max(0, parseInt(e.target.value) || 100)])}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">Score Range</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        className="w-1/2 px-3 py-2 rounded-lg border bg-background"
                        value={filterScoreRange[0]}
                        onChange={(e) => setFilterScoreRange([Math.max(0, parseInt(e.target.value) || 0), filterScoreRange[1]])}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        className="w-1/2 px-3 py-2 rounded-lg border bg-background"
                        value={filterScoreRange[1]}
                        onChange={(e) => setFilterScoreRange([filterScoreRange[0], Math.max(0, parseInt(e.target.value) || 100)])}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">Last Upload</label>
                    <Select value={filterRecency} onValueChange={setFilterRecency}>
                      <SelectTrigger className="w-full bg-background border-muted-foreground/20">
                        <SelectValue placeholder="Last Upload" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Time</SelectItem>
                        <SelectItem value="Today">Today</SelectItem>
                        <SelectItem value="This Week">This Week</SelectItem>
                        <SelectItem value="This Month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full bg-background border-muted-foreground/20">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="age">Age</SelectItem>
                        <SelectItem value="overall">Overall Score</SelectItem>
                        <SelectItem value="stability">Stability</SelectItem>
                        <SelectItem value="power">Power</SelectItem>
                        <SelectItem value="technique">Technique</SelectItem>
                        <SelectItem value="balance">Balance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">Order</label>
                    <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as 'asc' | 'desc')}>
                      <SelectTrigger className="w-full bg-background border-muted-foreground/20">
                        <SelectValue placeholder="Order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3 text-xs uppercase text-muted-foreground">Age</th>
                    <th className="text-left p-3 text-xs uppercase text-muted-foreground">Pos</th>
                    <th className="text-left p-3 text-xs uppercase text-muted-foreground">Overall</th>
                    <th className="text-left p-3 text-xs uppercase text-muted-foreground">Trend (Last 3)</th>
                    <th className="text-left p-3 text-xs uppercase text-muted-foreground">Recency</th>
                    <th className="text-left p-3 text-xs uppercase text-muted-foreground">Flags</th>
                    <th className="text-left p-3 text-xs uppercase text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.length > 0 ? (
                    filteredRoster.map((player) => {
                      const flags = playerFlags[player.id] || {};
                      return (
                        <tr
                          key={player.id}
                          className={`border-b hover:bg-muted/50 ${player.status === 'pending' ? 'bg-yellow-50/50' : ''}`}
                        >
                          <td className="p-3 text-muted-foreground font-mono">{player.jersey_number || '-'}</td>
                          <td className="p-3">
                            <div className="font-medium">{player.name}</div>
                            {player.status === 'pending' && <Badge variant="secondary" className="mt-1">Pending Approval</Badge>}
                          </td>
                          <td className="p-3">{player.age || '-'}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono">{player.position || '-'}</Badge>
                          </td>
                          <td className="p-3">
                            {player.latest_score ? (
                              <div className="flex items-center gap-2">
                                <span className={`text-xl font-bold ${getScoreColor(player.latest_score)}`}>
                                  {player.latest_score.toFixed(1)}
                                </span>
                                {player.trend !== 0 && (
                                  <span className={`text-xs ${player.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {player.trend > 0 ? '▲' : '▼'}{Math.abs(player.trend).toFixed(1)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No data</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1 items-center">
                              {player.recent_scores?.map((score: number, idx: number) => (
                                <div
                                  key={idx}
                                  className={`h-6 w-8 rounded text-[10px] flex items-center justify-center font-bold text-white ${getScoreBgColor(score)}`}
                                  title={`Upload ${idx + 1}: ${score.toFixed(1)}`}
                                >
                                  {score.toFixed(0)}
                                </div>
                              ))}
                              {!player.recent_scores?.length && <span className="text-muted-foreground text-xs italic">N/A</span>}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              {player.last_upload
                                ? new Date(player.last_upload).toLocaleDateString()
                                : <span className="text-muted-foreground">Never</span>}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleFlag(player.id, 'needsReview')}
                                className={`p-1 rounded transition-colors ${flags.needsReview ? 'text-orange-500 bg-orange-100' : 'text-muted-foreground/30 hover:text-muted-foreground'}`}
                                title="Needs Review"
                              >
                                <AlertCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => toggleFlag(player.id, 'injuryNote')}
                                className={`p-1 rounded transition-colors ${flags.injuryNote ? 'text-red-500 bg-red-100' : 'text-muted-foreground/30 hover:text-muted-foreground'}`}
                                title="Injury Note"
                              >
                                <Stethoscope className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => toggleFlag(player.id, 'topProspect')}
                                className={`p-1 rounded transition-colors ${flags.topProspect ? 'text-yellow-500 bg-yellow-100' : 'text-muted-foreground/30 hover:text-muted-foreground'}`}
                                title="Top Prospect"
                              >
                                <Star className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3">
                            {player.status === 'pending' ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprovePlayer(player.id, player.roster_id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeclinePlayer(player.roster_id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                  View
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
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        {(searchQuery || filterPosition !== 'All') ? (
                          <div>
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="mb-4">
                              No players found
                              {searchQuery && ` for "${searchQuery}"`}
                              {filterPosition !== 'All' && ` in position ${filterPosition}`}
                            </p>
                            <Button
                              variant="link"
                              onClick={() => {
                                setSearchQuery('');
                                setFilterPosition('All');
                              }}
                            >
                              Clear all filters
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-6">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="mb-4">No players in team yet</p>
                            <Button onClick={() => setShowInviteModal(true)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Invite Players
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
              queryClient.invalidateQueries({ queryKey: ['coach-teams', coachDbId] });
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
              queryClient.invalidateQueries({ queryKey: ['team-roster', activeTeamId] });
            }}
          />
        )
      }
    </div >
  );
}
