import { useState, useMemo } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDemoContext, useDemoMutationGuard } from "@/demo";
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
  Trophy,
  Loader2,
} from "lucide-react";
import { CreateTeamModal } from "@/components/ui/CreateTeamModal";
import { InvitePlayersModal } from "@/components/ui/InvitePlayersModal";
import { PlayerProfileOverlay } from "@/components/ui/PlayerProfileOverlay";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberInput } from "@/components/ui/NumberInput";
import { useTranslation } from "react-i18next";



export default function CoachDashboard() {
  const { t } = useTranslation("dashboard");
  const { user, isLoaded } = useCurrentUser();
  const demo = useDemoContext();
  const { guard: guardMutation } = useDemoMutationGuard();
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
  const [selectedPlayerProfileId, setSelectedPlayerProfileId] = useState<string | null>(null);

  const POSITIONS = ['All', 'Forward', 'Midfielder', 'Defender', 'Goalkeeper'];


  // Helper functions for styling
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-amber-400";
    return "text-destructive";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-primary";
    if (score >= 60) return "bg-amber-400";
    return "bg-destructive";
  };

  const getRecentScores = (analyses: any[]) => {
    if (!analyses) return [];
    return analyses.slice(0, 3).map(a => a.overall);
  };

  const calculateTrendValue = (scores: number[]) => {
    if (scores.length < 2) return 0;
    return scores[0] - scores[1];
  };



  // 1. Get coach's DB profile
  const { data: coachProfile } = useQuery({
    queryKey: ['coach-profile', user?.id],
    queryFn: async () => {
      if (demo) return demo.coachProfile;
      if (!user) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user || !!demo,
  });

  const coachDbId = (coachProfile as any)?.id;

  // 2. Get coach's teams
  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['coach-teams', coachDbId],
    queryFn: async () => {
      if (demo) return demo.teams;
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
    enabled: !!coachDbId || !!demo,
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
      if (demo) return demo.roster;
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
            club,
            height,
            weight
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
    enabled: !!activeTeamId || !!demo,
    refetchInterval: demo ? false : 7000,
  });

  const isLoading = !isLoaded || loadingTeams || loadingRoster;

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
        title: t("coach.toasts.approveSuccess.title"),
        description: t("coach.toasts.approveSuccess.description"),
      });

      if (activeTeamId) {
        queryClient.invalidateQueries({ queryKey: ['team-roster', activeTeamId] });
      }
    } catch (error: any) {
      console.error('Error approving player:', error);
      toast({
        title: t("coach.toasts.approveError.title"),
        description: error.message || t("coach.toasts.approveError.description"),
        variant: "destructive"
      });
    }
  };

  const handleDeclinePlayer = async (rosterId: string) => {
    if (!confirm(t("coach.confirms.declinePlayer"))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('team_rosters')
        .delete()
        .eq('id', rosterId);

      if (error) throw error;

      toast({
        title: t("coach.toasts.declineSuccess.title"),
        description: t("coach.toasts.declineSuccess.description"),
      });

      if (activeTeamId) {
        queryClient.invalidateQueries({ queryKey: ['team-roster', activeTeamId] });
      }
    } catch (error: any) {
      console.error('Error declining player:', error);
      toast({
        title: t("coach.toasts.declineError.title"),
        description: error.message || t("coach.toasts.declineError.description"),
        variant: "destructive"
      });
    }
  };

  const handleRemovePlayer = async (rosterId: string, playerName: string) => {
    if (!confirm(t("coach.confirms.removePlayer", { name: playerName }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('team_rosters')
        .delete()
        .eq('id', rosterId);

      if (error) throw error;

      toast({
        title: t("coach.toasts.removeSuccess.title"),
        description: t("coach.toasts.removeSuccess.description", { name: playerName }),
      });

      if (activeTeamId) {
        queryClient.invalidateQueries({ queryKey: ['team-roster', activeTeamId] });
      }
    } catch (error: any) {
      console.error('Error removing player:', error);
      toast({
        title: t("coach.toasts.removeError.title"),
        description: error.message || t("coach.toasts.removeError.description"),
        variant: "destructive"
      });
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(t("coach.confirms.deleteTeam", { name: teamName }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: t("coach.toasts.deleteTeamSuccess.title"),
        description: t("coach.toasts.deleteTeamSuccess.description", { name: teamName }),
      });

      queryClient.invalidateQueries({ queryKey: ['coach-teams', coachDbId] });
      if (activeTeamId === teamId) {
        setSelectedTeamId(null);
      }

    } catch (error: any) {
      console.error('Error deleting team:', error);
      toast({
        title: t("coach.toasts.deleteTeamError.title"),
        description: error.message || t("coach.toasts.deleteTeamError.description"),
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

  const resetFilters = () => {
    setSearchQuery('');
    setFilterPosition('All');
    setFilterAgeRange([0, 100]);
    setFilterScoreRange([0, 100]);
    setFilterRecency('All');
    setSortBy('name');
    setSortOrder('asc');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
      case 'advanced': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-black uppercase tracking-widest opacity-40">{t("coach.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card p-8">
      <div className="container mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-gradient">
              {t("coach.title")}
            </h1>
            <p className="text-muted-foreground font-medium">
              {t("coach.welcome", { name: user?.firstName || user?.username })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={activeTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-[200px] bg-card border-white/5">
                <SelectValue placeholder={t("coach.selectTeam")} />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTeam && (
              <Button
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive font-bold"
                onClick={() => handleDeleteTeam(selectedTeam.id, selectedTeam.name)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("coach.deleteTeam")}
              </Button>
            )}
            <Button
              className="bg-primary hover:bg-primary/90 text-black font-bold"
              onClick={() => { if (guardMutation()) return; setShowCreateModal(true); }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("coach.createTeam")}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("stats.totalPlayers")}</p>
                  <p className="text-2xl font-bold">{roster.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("stats.avgScore")}</p>
                  <p className="text-2xl font-bold">
                    {roster.length > 0
                      ? (roster.reduce((acc: number, p: any) => acc + (p.latest_score || 0), 0) / roster.length).toFixed(1)
                      : '0.0'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("stats.activeThisWeek")}</p>
                  <p className="text-2xl font-bold">
                    {roster.filter((p: any) => {
                      if (!p.last_upload) return false;
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(p.last_upload) > weekAgo;
                    }).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("stats.topPerformer")}</p>
                  <p className="text-lg font-bold">
                    {roster.length > 0
                      ? roster.reduce((max: any, p: any) => (p.latest_score || 0) > (max.latest_score || 0) ? p : max, roster[0])?.name
                      : '-'}
                  </p>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Roster Header */}
        <Card className="bg-card border-white/5 shadow-xl shadow-black/20 overflow-hidden">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-white">{t("tabs.roster")}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={t("coach.searchPlayers")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-lg border bg-background w-full md:w-64 focus:ring-2 focus:ring-primary/20 transition-all text-white"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`${showFilters ? 'bg-muted' : ''} transition-all`}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {t("coach.filters.title")}
                    <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>

                  <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t("coach.invitePlayers")}
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">{t("coach.filters.position")}</label>
                    <Select value={filterPosition} onValueChange={setFilterPosition}>
                      <SelectTrigger className="w-full bg-background border-muted-foreground/20">
                        <SelectValue placeholder={t("coach.filters.position")} />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map(pos => (
                          <SelectItem key={pos} value={pos}>
                            {pos === 'All' ? t("coach.filters.allPositions") : pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">{t("coach.filters.ageRange")}</label>
                    <div className="flex gap-2">
                      <NumberInput
                        placeholder={t("coach.filters.min")}
                        className="w-1/2 bg-background text-white"
                        value={filterAgeRange[0]}
                        onChange={(val) => setFilterAgeRange([val, filterAgeRange[1]])}
                        min={0}
                        max={100}
                      />
                      <NumberInput
                        placeholder={t("coach.filters.max")}
                        className="w-1/2 bg-background text-white"
                        value={filterAgeRange[1]}
                        onChange={(val) => setFilterAgeRange([filterAgeRange[0], val])}
                        min={0}
                        max={120}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">{t("coach.filters.performance")}</label>
                    <div className="flex gap-2">
                      <NumberInput
                        placeholder={t("coach.filters.minScore")}
                        className="w-1/2 bg-background text-white"
                        value={filterScoreRange[0]}
                        onChange={(val) => setFilterScoreRange([val, filterScoreRange[1]])}
                        min={0}
                        max={100}
                      />
                      <NumberInput
                        placeholder={t("coach.filters.maxScore")}
                        className="w-1/2 bg-background text-white"
                        value={filterScoreRange[1]}
                        onChange={(val) => setFilterScoreRange([filterScoreRange[0], val])}
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">{t("coach.filters.lastUpload")}</label>
                    <Select value={filterRecency} onValueChange={setFilterRecency}>
                      <SelectTrigger className="w-full bg-background border-muted-foreground/20">
                        <SelectValue placeholder={t("coach.filters.lastUpload")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">{t("coach.filters.recency.all")}</SelectItem>
                        <SelectItem value="Today">{t("coach.filters.recency.today")}</SelectItem>
                        <SelectItem value="This Week">{t("coach.filters.recency.thisWeek")}</SelectItem>
                        <SelectItem value="This Month">{t("coach.filters.recency.thisMonth")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">{t("coach.filters.sortBy")}</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full bg-background border-muted-foreground/20">
                        <SelectValue placeholder={t("coach.filters.sortBy")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">{t("coach.filters.sorting.name")}</SelectItem>
                        <SelectItem value="age">{t("coach.filters.sorting.age")}</SelectItem>
                        <SelectItem value="overall">{t("coach.filters.sorting.overall")}</SelectItem>
                        <SelectItem value="stability">{t("coach.filters.sorting.stability")}</SelectItem>
                        <SelectItem value="power">{t("coach.filters.sorting.power")}</SelectItem>
                        <SelectItem value="technique">{t("coach.filters.sorting.technique")}</SelectItem>
                        <SelectItem value="balance">{t("coach.filters.sorting.balance")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col justify-end space-y-2">
                    <Button variant="ghost" onClick={resetFilters} className="text-xs font-bold uppercase tracking-widest h-10 px-4">
                      {t("coach.filters.reset")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300 whitespace-nowrap">{t("coach.rosterTable.num")}</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300 whitespace-nowrap">{t("coach.rosterTable.name")}</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300 whitespace-nowrap">{t("coach.rosterTable.age")}</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300 whitespace-nowrap">{t("coach.rosterTable.pos")}</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300 whitespace-nowrap">{t("coach.rosterTable.performance")}</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300 whitespace-nowrap">{t("coach.rosterTable.history")}</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300 whitespace-nowrap">{t("coach.rosterTable.actions")}</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300 whitespace-nowrap">{t("coach.rosterTable.flagsTitle")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRoster.length > 0 ? (
                    filteredRoster.map((player, idx) => {
                      const trend = calculateTrendValue(getRecentScores(player.analyses));
                      const recentScores = getRecentScores(player.analyses);
                      const flags = playerFlags[player.id] || {};

                      return (
                        <tr key={player.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-4 text-muted-foreground font-mono text-xs text-center">{idx + 1}</td>
                          <td className="p-4">
                            <div className="font-bold text-white group-hover:text-primary transition-colors">{player.name}</div>
                            {player.status === 'pending' && (
                              <Badge className="mt-1 bg-amber-400 text-black border-none font-black text-[8px] px-1 py-0 h-4 uppercase tracking-tighter">
                                {t("coach.rosterTable.pending")}
                              </Badge>
                            )}
                            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tight opacity-70 mt-1">
                              {player.last_upload ? `${t("coach.filters.lastUpload")}: ${new Date(player.last_upload).toLocaleDateString()}` : t("coach.rosterTable.noData")}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground font-medium">{player.age || '-'}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="font-mono text-[10px] border-white/10 text-muted-foreground bg-white/5 uppercase">{player.position || '-'}</Badge>
                          </td>
                          <td className="p-4">
                            {player.latest_score ? (
                              <div className="flex items-center gap-2">
                                <span className={`text-xl font-black ${getScoreColor(player.latest_score)}`}>
                                  {player.latest_score.toFixed(1)}
                                </span>
                                {trend !== 0 && (
                                  <span className={`text-xs font-bold ${trend > 0 ? 'text-primary' : 'text-destructive'}`}>
                                    {trend > 0 ? '▲' : '▼'}{Math.abs(trend).toFixed(1)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-30">
                                {t("coach.rosterTable.noData")}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1.5 items-center">
                              {recentScores.map((score, sIdx) => (
                                <div
                                  key={sIdx}
                                  className={`h-7 w-9 rounded-lg text-[10px] flex items-center justify-center font-black text-white shadow-sm border border-black/20 ${getScoreBgColor(score)}`}
                                  title={`Score: ${score.toFixed(1)}`}
                                >
                                  {score.toFixed(0)}
                                </div>
                              ))}
                              {recentScores.length === 0 && (
                                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest italic opacity-40">N/A</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {player.status === 'pending' ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-primary text-black hover:bg-primary/90 h-8 font-black text-[10px] uppercase px-3"
                                    onClick={() => handleApprovePlayer(player.id, player.roster_id)}
                                  >
                                    {t("coach.approve")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-white/10 hover:bg-white/5 h-8 font-black text-[10px] uppercase px-3 text-white"
                                    onClick={() => handleDeclinePlayer(player.roster_id)}
                                  >
                                    {t("coach.decline")}
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-xl bg-white/5 border-white/10 hover:bg-primary hover:text-black hover:border-primary transition-all text-white font-bold"
                                    onClick={() => setSelectedPlayerProfileId(player.id)}
                                  >
                                    {t("player.viewResults")}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemovePlayer(player.roster_id, player.name)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-xl transition-all ${flags.needsReview ? 'text-blue-400 bg-blue-400/10' : 'text-white/10 hover:text-white/30'}`}
                                onClick={() => toggleFlag(player.id, 'needsReview')}
                                title={t("coach.rosterTable.flags.needsReview")}
                              >
                                <Stethoscope className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-xl transition-all ${flags.topProspect ? 'text-primary bg-primary/10' : 'text-white/10 hover:text-white/30'}`}
                                onClick={() => toggleFlag(player.id, 'topProspect')}
                                title={t("coach.rosterTable.flags.topProspect")}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-xl transition-all ${flags.injuryNote ? 'text-destructive bg-destructive/10' : 'text-white/10 hover:text-white/30'}`}
                                onClick={() => toggleFlag(player.id, 'injuryNote')}
                                title={t("coach.rosterTable.flags.injuryNote")}
                              >
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center max-w-xs mx-auto">
                          <Users className="h-12 w-12 opacity-10 mb-4" />
                          <p className="text-sm font-bold uppercase tracking-widest opacity-40">{t("coach.rosterTable.noPlayers")}</p>
                          {(searchQuery || filterPosition !== 'All') && (
                            <Button
                              variant="link"
                              className="text-primary mt-2"
                              onClick={resetFilters}
                            >
                              {t("coach.rosterTable.clearFilters")}
                            </Button>
                          )}
                        </div>
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

      {/* Player Profile Overlay */}
      {
        selectedPlayerProfileId && (
          <PlayerProfileOverlay
            player={filteredRoster.find(p => p.id === selectedPlayerProfileId)}
            isOpen={!!selectedPlayerProfileId}
            onClose={() => setSelectedPlayerProfileId(null)}
            teamName={selectedTeam?.name}
          />
        )
      }

    </div >
  );
}
