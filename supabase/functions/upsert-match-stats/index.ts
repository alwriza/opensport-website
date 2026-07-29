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

    const { match_id, player_stats } = await req.json()
    if (!match_id || !player_stats || !Array.isArray(player_stats)) {
      return new Response(JSON.stringify({ error: "match_id and player_stats[] required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_SECRET_KEY") ?? ""
    )

    const results = []
    for (const stat of player_stats) {
      const { player_id, minutes, goals, assists, yellow_cards, red_cards, coach_rating, source } = stat

      const { data: existing } = await supabaseAdmin
        .from("player_match_stats")
        .select("id")
        .eq("match_id", match_id)
        .eq("player_id", player_id)
        .maybeSingle()

      if (existing) {
        const { data, error } = await supabaseAdmin
          .from("player_match_stats")
          .update({ minutes, goals, assists, yellow_cards, red_cards, coach_rating, source: source ?? "coach", updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single()
        results.push(data ?? { id: existing.id, updated: true })
        if (error) console.error("update error:", error)
      } else {
        const { data, error } = await supabaseAdmin
          .from("player_match_stats")
          .insert({ match_id, player_id, minutes, goals, assists, yellow_cards, red_cards, coach_rating, source: source ?? "coach" })
          .select()
          .single()
        results.push(data ?? { id: null, error: error?.message })
        if (error) console.error("insert error:", error)
      }
    }

    return new Response(JSON.stringify({ success: true, stats: results }), {
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