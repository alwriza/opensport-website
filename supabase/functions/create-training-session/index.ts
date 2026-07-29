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

    const { team_id, name, date, time, duration_minutes, location, objective, player_ids, exercises } = await req.json()
    if (!team_id || !name || !date || !time || !duration_minutes) {
      return new Response(JSON.stringify({ error: "team_id, name, date, time, duration_minutes required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
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

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("training_sessions")
      .insert({ team_id, coach_id: coach.id, name, date, time, duration_minutes, location, objective })
      .select()
      .single()
    if (sessionError) throw sessionError

    if (exercises && Array.isArray(exercises)) {
      const exercisesWithSession = exercises.map((ex, i) => ({
        session_id: session.id,
        name: ex.name,
        category: ex.category,
        duration_minutes: ex.duration_minutes,
        notes: ex.notes,
        order: i
      }))
      const { error: exError } = await supabaseAdmin.from("training_session_exercises").insert(exercisesWithSession)
      if (exError) console.error("exercise insert error:", exError)
    }

    if (player_ids && Array.isArray(player_ids)) {
      const playersToInsert = player_ids.map(pid => ({
        session_id: session.id,
        player_id: pid,
        status: "assigned"
      }))
      const { error: plError } = await supabaseAdmin.from("training_session_players").insert(playersToInsert)
      if (plError) console.error("player insert error:", plError)
    }

    return new Response(JSON.stringify({ success: true, session }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})