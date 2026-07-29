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

    const { id, player_id, team_id, date, categories, notes } = await req.json()
    if (!player_id || !team_id || !categories) {
      return new Response(JSON.stringify({ error: "player_id, team_id, categories required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const { data: coach } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle()
    if (!coach) return new Response(JSON.stringify({ error: "coach_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_SECRET_KEY") ?? ""
    )

    let result
    if (id) {
      const { data, error } = await supabaseAdmin
        .from("player_evaluations")
        .update({ date: date ?? new Date().toISOString().split("T")[0], categories, notes, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("coach_id", coach.id)
        .select()
        .single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabaseAdmin
        .from("player_evaluations")
        .insert({ player_id, coach_id: coach.id, team_id, date: date ?? new Date().toISOString().split("T")[0], categories, notes })
        .select()
        .single()
      if (error) throw error
      result = data
    }

    return new Response(JSON.stringify({ success: true, evaluation: result }), {
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