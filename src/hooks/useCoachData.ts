import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useDemoContext } from "@/demo"
import {
  MOCK_SQUAD,
  MOCK_MATCHES,
  MOCK_EVALUATIONS,
  MOCK_TRAINING_SESSIONS,
  MOCK_TRAINING_PLANS,
  MOCK_EXERCISES,
  MOCK_FLAGS,
  MOCK_EXTENDED_STATS,
  MOCK_UPCOMING,
} from "@/data/mockCoachData"
import type { TeamMember, Match, PlayerEvaluation, TrainingSession, TrainingPlan, Exercise, PlayerFlag, ExtendedPlayerStats, UpcomingEvent } from "@/types/coach"

function useCoachIdentity() {
  const demo = useDemoContext()
  const { data: coachUser } = useQuery({
    queryKey: ["coach-identity"],
    queryFn: async () => {
      if (demo) return { id: demo.coachProfile.id, auth_user_id: demo.user.id }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle()
      return data ? { id: data.id, auth_user_id: user.id } : null
    },
    staleTime: 1000 * 60 * 5,
  })
  return coachUser
}

export function useCoachSquad(teamId: string | undefined) {
  const demo = useDemoContext()
  return useQuery<TeamMember[]>({
    queryKey: ["coach-squad", teamId],
    queryFn: async () => {
      if (demo) return MOCK_SQUAD as TeamMember[]
      if (!teamId) return []
      const { data, error } = await supabase.functions.invoke("get-team-squad", { body: { team_id: teamId } })
      if (error) throw error
      return data.squad ?? []
    },
    enabled: !!teamId || !!demo,
  })
}

export function useCoachMatches(teamId: string | undefined) {
  const demo = useDemoContext()
  return useQuery<Match[]>({
    queryKey: ["coach-matches", teamId],
    queryFn: async () => {
      if (demo) return MOCK_MATCHES as Match[]
      if (!teamId) return []
      const { data, error } = await supabase.functions.invoke("get-team-matches", { body: { team_id: teamId } })
      if (error) throw error
      return data.matches ?? []
    },
    enabled: !!teamId || !!demo,
  })
}

export function usePlayerEvaluations(playerId: string | undefined, teamId?: string) {
  const demo = useDemoContext()
  return useQuery<PlayerEvaluation[]>({
    queryKey: ["player-evaluations", playerId, teamId],
    queryFn: async () => {
      if (demo) return MOCK_EVALUATIONS as PlayerEvaluation[]
      if (!playerId && !teamId) return []
      const { data, error } = await supabase.functions.invoke("get-player-evaluations", {
        body: { player_id: playerId, team_id: teamId }
      })
      if (error) throw error
      return data.evaluations ?? []
    },
    enabled: (!!playerId || !!teamId) || !!demo,
  })
}

export function useTrainingSessions(teamId: string | undefined) {
  const demo = useDemoContext()
  return useQuery<TrainingSession[]>({
    queryKey: ["training-sessions", teamId],
    queryFn: async () => {
      if (demo) return MOCK_TRAINING_SESSIONS as TrainingSession[]
      if (!teamId) return []
      const { data, error } = await supabase
        .from("training_sessions")
        .select("*, training_session_exercises(*), training_session_players(*)")
        .eq("team_id", teamId)
        .order("date", { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!teamId || !!demo,
  })
}

export function useTrainingPlans(teamId: string | undefined) {
  const demo = useDemoContext()
  return useQuery<TrainingPlan[]>({
    queryKey: ["training-plans", teamId],
    queryFn: async () => {
      if (demo) return MOCK_TRAINING_PLANS as TrainingPlan[]
      if (!teamId) return []
      const { data, error } = await supabase
        .from("training_plans")
        .select("*")
        .eq("team_id", teamId)
        .order("start_date", { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!teamId || !!demo,
  })
}

export function useExercises() {
  const demo = useDemoContext()
  return useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: async () => {
      if (demo) return MOCK_EXERCISES as Exercise[]
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("category")
      if (error) throw error
      return data ?? []
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function usePlayerFlags(playerId: string | undefined) {
  const demo = useDemoContext()
  return useQuery<PlayerFlag[]>({
    queryKey: ["player-flags", playerId],
    queryFn: async () => {
      if (demo) return MOCK_FLAGS as PlayerFlag[]
      if (!playerId) return []
      const { data, error } = await supabase
        .from("player_flags")
        .select("*")
        .eq("player_id", playerId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!playerId || !!demo,
  })
}

export function useExtendedPlayerStats(teamId: string | undefined) {
  const demo = useDemoContext()
  return useQuery<ExtendedPlayerStats[]>({
    queryKey: ["extended-player-stats", teamId],
    queryFn: async () => {
      if (demo) return MOCK_EXTENDED_STATS as ExtendedPlayerStats[]
      if (!teamId) return []
      const { data, error } = await supabase
        .from("player_match_stats")
        .select("*, users:player_id(id, name, nickname, avatar_url, position)")
        .in("match_id", supabase.from("matches").select("id").eq("team_id", teamId).eq("status", "completed"))
      if (error) throw error
      return data ?? []
    },
    enabled: !!teamId || !!demo,
  })
}

export function useUpcomingEvents(teamId: string | undefined) {
  const demo = useDemoContext()
  return useQuery<UpcomingEvent[]>({
    queryKey: ["upcoming-events", teamId],
    queryFn: async () => {
      if (demo) return MOCK_UPCOMING as UpcomingEvent[]
      if (!teamId) return []
      const { data: matches, error } = await supabase
        .from("matches")
        .select("*")
        .eq("team_id", teamId)
        .eq("status", "scheduled")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(5)
      if (error) throw error
      return (matches ?? []).map(m => ({
        id: m.id,
        type: "match" as const,
        title: `vs ${m.opponent}`,
        date: m.date,
        time: m.time,
        description: m.competition ?? "Match",
      }))
    },
    enabled: !!teamId || !!demo,
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useTeamFlags(teamId: string | undefined) {
  const demo = useDemoContext()
  return useQuery<PlayerFlag[]>({
    queryKey: ["team-flags", teamId],
    queryFn: async () => {
      if (demo) return MOCK_FLAGS as PlayerFlag[]
      return []
    },
    enabled: !!teamId || !!demo,
  })
}

export function useCreateMatch() {
  const demo = useDemoContext()
  const queryClient = useQueryClient()
  const coach = useCoachIdentity()

  return useMutation({
    mutationFn: async (match: {
      team_id: string, date: string, time: string, opponent: string,
      home_away: "home" | "away", competition?: string, location?: string
    }) => {
      if (demo) return { id: "demo-match-id", ...match, created_by: coach?.id }
      const { data, error } = await supabase
        .from("matches")
        .insert({ ...match, created_by: coach?.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (demo) return
      queryClient.invalidateQueries({ queryKey: ["coach-matches", data.team_id] })
      queryClient.invalidateQueries({ queryKey: ["upcoming-events", data.team_id] })
    },
  })
}

export function useUpsertMatchStats() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { match_id: string, player_stats: any[] }) => {
      const { data, error } = await supabase.functions.invoke("upsert-match-stats", { body: params })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-matches"] })
      queryClient.invalidateQueries({ queryKey: ["extended-player-stats"] })
    },
  })
}

export function useUpsertEvaluation() {
  const demo = useDemoContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (evalData: {
      id?: string, player_id: string, team_id: string,
      date?: string, categories: any, notes?: string
    }) => {
      if (demo) return { success: true, evaluation: { id: "demo-eval-id", ...evalData } }
      const { data, error } = await supabase.functions.invoke("upsert-evaluation", { body: evalData })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      if (demo) return
      queryClient.invalidateQueries({ queryKey: ["player-evaluations"] })
    },
  })
}

export function useCreateTrainingSession() {
  const demo = useDemoContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (session: {
      team_id: string, name: string, date: string, time: string,
      duration_minutes: number, location?: string, objective?: string,
      player_ids?: string[], exercises?: any[]
    }) => {
      if (demo) return { session: { id: "demo-session-id", ...session } }
      const { data, error } = await supabase.functions.invoke("create-training-session", { body: session })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (demo) return
      queryClient.invalidateQueries({ queryKey: ["training-sessions", data.session?.team_id] })
    },
  })
}