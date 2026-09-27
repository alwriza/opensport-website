import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
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
import type { TeamMember, Match, PlayerMatchStat, PlayerEvaluation, TrainingSession, TrainingPlan, Exercise, PlayerFlag, ExtendedPlayerStats, UpcomingEvent } from "@/types/coach"

// The generated client schema predates the coach-table migration. Keep new
// aggregation reads typed against the migrated columns at this boundary.
type CoachReadTable<Row> = { Row: { [Key in keyof Row]: Row[Key] }; Insert: never; Update: never; Relationships: [] }
type CoachReadDatabase = {
  public: {
    Tables: {
      matches: CoachReadTable<Match>
      player_match_stats: CoachReadTable<Omit<PlayerMatchStat, "player_name">>
      training_sessions: CoachReadTable<Omit<TrainingSession, "assigned_players" | "exercises">>
      training_session_players: CoachReadTable<{ session_id: string; player_id: string; exercises_completed: number | null }>
      metric_observations: CoachReadTable<{ player_id: string; metric: string; value: number; recorded_at: string }>
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
const coachReadClient = supabase as unknown as SupabaseClient<CoachReadDatabase>

function useCoachIdentity() {
  const demo = useDemoContext()
  const { data: coachUser } = useQuery({
    queryKey: ["coach-identity", !!demo],
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
    queryKey: ["training-sessions", teamId, !!demo],
    queryFn: async () => {
      if (demo) return MOCK_TRAINING_SESSIONS as TrainingSession[]
      if (!teamId) return []
      const { data, error } = await supabase
        .from("training_sessions")
        .select("*, training_session_exercises(*), training_session_players(*)")
        .eq("team_id", teamId)
        .order("date", { ascending: false })
      if (error) throw error
      return (data ?? []).map((s: any) => ({
        ...s,
        exercises: (s.training_session_exercises ?? []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)).map((e: any) => ({
          id: e.id, exercise_id: e.id, exercise_name: e.name, category: e.category,
          duration_minutes: e.duration_minutes, notes: e.notes ?? "", order: e.order,
        })),
        assigned_players: (s.training_session_players ?? []).map((sp: any) => sp.player_id),
      }))
    },
    enabled: !!teamId || !!demo,
  })
}

export function useTrainingPlans(teamId: string | undefined) {
  const demo = useDemoContext()
  return useQuery<TrainingPlan[]>({
    queryKey: ["training-plans", teamId, !!demo],
    queryFn: async () => {
      if (demo) return MOCK_TRAINING_PLANS as TrainingPlan[]
      if (!teamId) return []
      const { data, error } = await supabase
        .from("training_plans")
        .select("*, training_plan_sessions(session_id)")
        .eq("team_id", teamId)
        .order("start_date", { ascending: false })
      if (error) throw error
      return (data ?? []).map((p: any) => ({
        ...p,
        session_ids: (p.training_plan_sessions ?? []).map((s: any) => s.session_id),
      }))
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
    queryKey: ["extended-player-stats", teamId, !!demo],
    queryFn: async () => {
      if (demo) return MOCK_EXTENDED_STATS as ExtendedPlayerStats[]
      if (!teamId) return []

      const { data: roster, error: rosterError } = await supabase
        .from("team_rosters")
        .select("player_id, users:player_id(id, name, position, age)")
        .eq("team_id", teamId)
      if (rosterError) throw rosterError
      const players = (roster ?? []).filter((r: any) => r.users).map((r: any) => ({
        player_id: r.player_id, name: r.users.name, position: r.users.position, age: r.users.age,
      }))
      if (players.length === 0) return []
      const playerIds = players.map(p => p.player_id)

      const { data: matches, error: matchesError } = await coachReadClient
        .from("matches")
        .select("id, status, home_away, score_home, score_away, starting_xi")
        .eq("team_id", teamId)
      if (matchesError) throw matchesError
      const matchById = new Map((matches ?? []).map(m => [m.id, m]))
      const matchIds = (matches ?? []).map(m => m.id)

      const { data: matchStats, error: statsError } = matchIds.length
        ? await coachReadClient.from("player_match_stats").select("*").in("match_id", matchIds)
        : { data: [], error: null }
      if (statsError) throw statsError

      const { data: sessions, error: sessionsError } = await coachReadClient.from("training_sessions").select("id, duration_minutes, status").eq("team_id", teamId)
      if (sessionsError) throw sessionsError
      const sessionById = new Map((sessions ?? []).map(s => [s.id, s]))
      const sessionIds = (sessions ?? []).map(s => s.id)

      const { data: sessionPlayers, error: playersError } = sessionIds.length
        ? await coachReadClient.from("training_session_players").select("*").in("session_id", sessionIds).in("player_id", playerIds)
        : { data: [], error: null }
      if (playersError) throw playersError

      const { data: metrics, error: metricsError } = await coachReadClient
        .from("metric_observations")
        .select("player_id, metric, value, recorded_at")
        .in("player_id", playerIds)
        .order("recorded_at", { ascending: true })
      if (metricsError) throw metricsError

      return players.map(p => {
        const myStats = (matchStats ?? []).filter(s => s.player_id === p.player_id)
        const myMetrics = (metrics ?? []).filter(m => m.player_id === p.player_id)

        let starts = 0, wins = 0, draws = 0, losses = 0
        myStats.forEach(s => {
          const m = matchById.get(s.match_id)
          if (!m) return
          if ((m.starting_xi ?? []).includes(p.player_id)) starts++
          if (m.status === "completed" && m.score_home != null && m.score_away != null) {
            const mine = m.home_away === "home" ? m.score_home : m.score_away
            const theirs = m.home_away === "home" ? m.score_away : m.score_home
            if (mine > theirs) wins++; else if (mine === theirs) draws++; else losses++
          }
        })

        const mySessionPlayers = (sessionPlayers ?? []).filter(sp => sp.player_id === p.player_id)
        const completedSessionPlayers = mySessionPlayers.filter(sp => sessionById.get(sp.session_id)?.status === "completed")

        const latestMetric = (metric: string) => {
          const rows = myMetrics.filter(m => m.metric === metric)
          return rows.length ? rows[rows.length - 1].value : 0
        }
        const sumMetric = (metric: string) => myMetrics.filter(m => m.metric === metric).reduce((total, observation) => total + Number(observation.value), 0)
        const aiScoreSeries = myMetrics.filter(m => m.metric === "ai_score")
        const improvementPct = aiScoreSeries.length >= 2
          ? Math.round(((aiScoreSeries[aiScoreSeries.length - 1].value - aiScoreSeries[0].value) / Math.max(1, aiScoreSeries[0].value)) * 100)
          : 0

        return {
          player_id: p.player_id, name: p.name, position: p.position, age: p.age,
          games: myStats.length, starts, minutes: myStats.reduce((total, stat) => total + (stat.minutes ?? 0), 0),
          wins, draws, losses,
          goals: myStats.reduce((total, stat) => total + (stat.goals ?? 0), 0),
          assists: myStats.reduce((total, stat) => total + (stat.assists ?? 0), 0),
          shots: sumMetric("shots"), shots_on_target: sumMetric("shots_on_target"),
          yellow_cards: myStats.reduce((total, stat) => total + (stat.yellow_cards ?? 0), 0),
          red_cards: myStats.reduce((total, stat) => total + (stat.red_cards ?? 0), 0),
          training_sessions: completedSessionPlayers.length,
          training_minutes: completedSessionPlayers.reduce((total, playerSession) => total + (sessionById.get(playerSession.session_id)?.duration_minutes ?? 0), 0),
          exercises_completed: mySessionPlayers.reduce((total, playerSession) => total + (playerSession.exercises_completed ?? 0), 0),
          ai_score: latestMetric("ai_score"), ai_passing: latestMetric("ai_passing"), ai_shooting: latestMetric("ai_shooting"),
          ai_dribbling: latestMetric("ai_dribbling"), ai_balance: latestMetric("ai_balance"), ai_stability: latestMetric("ai_stability"),
          improvement_pct: improvementPct,
        } as ExtendedPlayerStats
      })
    },
    enabled: !!teamId || !!demo,
  })
}

export function useUpcomingEvents(teamId: string | undefined) {
  const demo = useDemoContext()
  return useQuery<UpcomingEvent[]>({
    queryKey: ["upcoming-events", teamId, !!demo],
    queryFn: async () => {
      if (demo) return MOCK_UPCOMING as UpcomingEvent[]
      if (!teamId) return []
      const today = new Date().toISOString().split("T")[0]
      const [{ data: matches, error: matchError }, { data: sessions, error: sessionError }] = await Promise.all([
        coachReadClient.from("matches").select("*").eq("team_id", teamId).eq("status", "scheduled").gte("date", today).order("date", { ascending: true }).limit(5),
        coachReadClient.from("training_sessions").select("*").eq("team_id", teamId).eq("status", "scheduled").gte("date", today).order("date", { ascending: true }).limit(5),
      ])
      if (matchError) throw matchError
      if (sessionError) throw sessionError
      const matchEvents = (matches ?? []).map(m => ({
        id: m.id,
        type: "match" as const,
        title: `vs ${m.opponent}`,
        date: m.date,
        time: m.time,
        location: m.location,
        description: m.competition ?? "Match",
      }))
      const sessionEvents = (sessions ?? []).map(s => ({
        id: s.id,
        type: "training" as const,
        title: s.name,
        date: s.date,
        time: s.time,
        location: s.location,
        description: s.objective ?? s.location ?? "Training",
      }))
      return [...matchEvents, ...sessionEvents].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)).slice(0, 5)
    },
    enabled: !!teamId || !!demo,
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useTeamFlags(teamId: string | undefined) {
  const demo = useDemoContext()
  return useQuery<PlayerFlag[]>({
    queryKey: ["team-flags", teamId, !!demo],
    queryFn: async () => {
      if (demo) return MOCK_FLAGS as PlayerFlag[]
      if (!teamId) return []
      const { data: roster, error: rosterError } = await supabase.from("team_rosters").select("player_id").eq("team_id", teamId)
      if (rosterError) throw rosterError
      const playerIds = (roster ?? []).map((r: any) => r.player_id).filter(Boolean)
      if (playerIds.length === 0) return []
      const { data, error } = await supabase
        .from("player_flags")
        .select("*, users:player_id(name)")
        .in("player_id", playerIds)
      if (error) throw error
      return (data ?? []).map((f: any) => ({ ...f, player_name: f.users?.name ?? "Player" })) as PlayerFlag[]
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
      queryClient.invalidateQueries({ queryKey: ["upcoming-events", data.session?.team_id] })
    },
  })
}
