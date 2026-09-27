import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return new Response(JSON.stringify({ error: "missing_authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const { team_id } = await req.json()
    if (!team_id) return new Response(JSON.stringify({ error: "team_id_required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const { data: coach } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle()
    if (!coach) return new Response(JSON.stringify({ error: "coach_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const { data: roster, error: rosterError } = await supabase
      .from("team_rosters")
      .select("player_id, jersey_number, status, users:player_id(id, name, email, nickname, avatar_url, position, age)")
      .eq("team_id", team_id)

    if (rosterError) throw rosterError

    const playerIds = roster?.map(r => r.player_id) ?? []
    if (playerIds.length === 0) return new Response(JSON.stringify({ squad: [], flags: [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const { data: flags } = await supabase.from("player_flags").select("*").in("player_id", playerIds)

    const { data: matches } = await supabase.from("matches").select("id, starting_xi").eq("team_id", team_id)
    const matchIds = matches?.map(m => m.id) ?? []
    const startingXiByMatch = new Map((matches ?? []).map(m => [m.id, m.starting_xi ?? []]))

    const { data: matchStats } = matchIds.length
      ? await supabase.from("player_match_stats").select("*").in("match_id", matchIds).in("player_id", playerIds)
      : { data: [] as any[] }

    const squad = roster?.map(r => {
      const flag = flags?.find(f => f.player_id === r.player_id)
      const myStats = (matchStats ?? []).filter(s => s.player_id === r.player_id)
      const starts = myStats.filter(s => (startingXiByMatch.get(s.match_id) ?? []).includes(r.player_id)).length
      const ratings = myStats.map(s => s.coach_rating).filter((v): v is number => v != null)
      const statSources: Record<string, string> = {}
      if (myStats.length > 0) {
        ["goals", "assists", "yellow_cards", "red_cards", "coach_rating"].forEach(f => { statSources[f] = "coach" })
      }
      return {
        ...r.users,
        player_id: r.player_id,
        team_id,
        jersey_number: r.jersey_number ?? null,
        status: r.status ?? "active",
        starts,
        appearances: myStats.length,
        goals: myStats.reduce((a, s) => a + (s.goals ?? 0), 0),
        assists: myStats.reduce((a, s) => a + (s.assists ?? 0), 0),
        penalties: 0,
        yellow_cards: myStats.reduce((a, s) => a + (s.yellow_cards ?? 0), 0),
        red_cards: myStats.reduce((a, s) => a + (s.red_cards ?? 0), 0),
        coach_rating: ratings.length ? Math.round((ratings.reduce((a, v) => a + v, 0) / ratings.length) * 10) / 10 : 0,
        stat_sources: statSources,
        flag: flag ?? null,
      }
    }) ?? []

    return new Response(JSON.stringify({ squad, flags }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})