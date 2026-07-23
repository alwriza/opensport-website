import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoContext } from "@/demo";

export function useMyTeams(playerId: string | undefined) {
  const demo = useDemoContext();

  return useQuery({
    queryKey: ['my-teams', playerId],
    queryFn: async () => {
      if (demo) return demo.myTeams;
      if (!playerId) return [];
      const { data, error } = await supabase
        .from('team_rosters')
        .select(`
          id as roster_id,
          team_id,
          teams (name, age_group, clubs (name))
        `)
        .eq('player_id', playerId)
        .in('status', ['active', 'pending']);
      if (error) throw error;
      return (data || []).map((item: any) => ({
        roster_id: item.roster_id,
        team_id: item.team_id,
        team_name: item.teams?.name,
        age_group: item.teams?.age_group,
        club_name: item.teams?.clubs?.name,
        status: item.status,
      }));
    },
    enabled: !!playerId || !!demo,
    refetchInterval: false,
  });
}

export function useCoachTeams(coachId: string | undefined) {
  const demo = useDemoContext();

  return useQuery({
    queryKey: ['coach-teams', coachId],
    queryFn: async () => {
      if (demo) return demo.teams;
      if (!coachId) return [];
      const { data, error } = await supabase
        .from('team_coaches')
        .select(`
          teams (*, clubs (name))
        `)
        .eq('coach_id', coachId);
      if (error) throw error;
      return (data || []).map((item: any) => item.teams).filter(Boolean);
    },
    enabled: !!coachId || !!demo,
  });
}

export function useTeamRoster(teamId: string | undefined) {
  const demo = useDemoContext();

  return useQuery({
    queryKey: ['team-roster', teamId],
    queryFn: async () => {
      if (demo) return demo.roster;
      if (!teamId) return [];
      const { data: rosterData, error: rosterError } = await supabase
        .from('team_rosters')
        .select(`
          id as roster_id,
          jersey_number,
          status,
          player_id,
          users (id, name, position, age)
        `)
        .eq('team_id', teamId);
      if (rosterError) throw rosterError;
      if (!rosterData) return [];
      const playerIds = rosterData.map((r: any) => r.player_id);
      const { data: analysesData } = await supabase
        .from('analyses')
        .select('user_id, overall, created_at')
        .in('user_id', playerIds)
        .order('created_at', { ascending: false });
      const analysesByPlayer: Record<string, any[]> = {};
      (analysesData || []).forEach((a: any) => {
        if (!analysesByPlayer[a.user_id]) analysesByPlayer[a.user_id] = [];
        if (analysesByPlayer[a.user_id].length < 3) analysesByPlayer[a.user_id].push(a);
      });
      return rosterData.map((item: any) => {
        const pa = analysesByPlayer[item.player_id] || [];
        const scores = pa.map((a: any) => a.overall);
        return {
          id: item.player_id,
          name: item.users?.name,
          position: item.users?.position,
          age: item.users?.age,
          roster_id: item.roster_id,
          jersey_number: item.jersey_number,
          status: item.status,
          latest_score: scores[0] || null,
          recent_scores: scores,
          trend: scores.length >= 2 ? scores[0] - scores[1] : 0,
          last_upload: pa[0]?.created_at || null,
          metrics: { stability: 0, power: 0, technique: 0, balance: 0 },
        };
      });
    },
    enabled: !!teamId || !!demo,
  });
}
