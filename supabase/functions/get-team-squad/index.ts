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
      .select("player_id, users:player_id(id, name, email, nickname, avatar_url, position, age, foot, medical_group)")
      .eq("team_id", team_id)

    if (rosterError) throw rosterError

    const playerIds = roster?.map(r => r.player_id) ?? []
    if (playerIds.length === 0) return new Response(JSON.stringify({ squad: [], flags: [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const { data: flags } = await supabase.from("player_flags").select("*").in("player_id", playerIds)

    const squad = roster?.map(r => {
      const flag = flags?.find(f => f.player_id === r.player_id)
      return { ...r.users, flag: flag ?? null }
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