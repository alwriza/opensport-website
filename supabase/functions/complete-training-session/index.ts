import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "missing_authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { session_id, player_id, exercises_completed, duration_minutes } = await req.json();
    if (!session_id) return new Response(JSON.stringify({ error: "session_id_required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_SECRET_KEY") ?? ""
    );

    if (player_id) {
      const xp = (exercises_completed ?? 0) * 10 + Math.floor((duration_minutes ?? 0) / 5);
      const { data, error } = await supabaseAdmin
        .from("training_session_players")
        .update({ status: "completed", exercises_completed: exercises_completed ?? 0, duration_minutes: duration_minutes ?? 0, xp_earned: xp })
        .eq("session_id", session_id)
        .eq("player_id", player_id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, record: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("training_sessions")
      .update({ status: "completed" })
      .eq("id", session_id)
      .select()
      .single();
    if (sessionError) throw sessionError;

    const { data: players } = await supabaseAdmin
      .from("training_session_players")
      .select("*")
      .eq("session_id", session_id);

    return new Response(JSON.stringify({ success: true, session, players }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});