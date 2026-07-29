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

    const { team_id, status, limit = 50, offset = 0 } = await req.json()
    if (!team_id) return new Response(JSON.stringify({ error: "team_id_required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    let query = supabase.from("matches").select("*").eq("team_id", team_id).order("date", { ascending: false }).range(offset, offset + limit - 1)

    if (status) query = query.eq("status", status)

    const { data: matches, error: matchError } = await query
    if (matchError) throw matchError

    const matchIds = matches?.map(m => m.id) ?? []
    let stats = []
    if (matchIds.length > 0) {
      const { data: statsData } = await supabase
        .from("player_match_stats")
        .select("*, users:player_id(id, name, nickname, avatar_url, position)")
        .in("match_id", matchIds)
      stats = statsData ?? []
    }

    const matchesWithStats = matches?.map(m => ({
      ...m,
      player_stats: stats.filter(s => s.match_id === m.id)
    })) ?? []

    return new Response(JSON.stringify({ matches: matchesWithStats }), {
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