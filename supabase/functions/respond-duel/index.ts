import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("respond-duel: missing Authorization header");
      return new Response(
        JSON.stringify({ error: "missing_authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { duelId, action } = await req.json();
    if (!duelId || typeof duelId !== "string") {
      console.error("respond-duel: invalid duelId", duelId);
      return new Response(
        JSON.stringify({ error: "duel_id_required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!action || !["accept", "decline"].includes(action)) {
      console.error("respond-duel: invalid action", action);
      return new Response(
        JSON.stringify({ error: "action_must_be_accept_or_decline" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      console.error("respond-duel: auth.getUser failed:", authError, "user:", user);
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = user.id;

    const { data: respondent, error: respondentError } = await supabaseAnon
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (respondentError || !respondent) {
      console.error("respond-duel: respondent not found for auth_user_id:", authUserId, respondentError);
      return new Response(
        JSON.stringify({ error: "respondent_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const respondentId = respondent.id;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_SECRET_KEY") ?? ""
    );

    const { data: duel, error: duelError } = await supabaseAdmin
      .from("duels")
      .select("*")
      .eq("id", duelId)
      .maybeSingle();

    if (duelError || !duel) {
      console.error("respond-duel: duel not found:", duelId, duelError);
      return new Response(
        JSON.stringify({ error: "duel_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (duel.opponent_id !== respondentId) {
      console.error("respond-duel: user is not the opponent:", { duelId, respondentId, opponentId: duel.opponent_id });
      return new Response(
        JSON.stringify({ error: "not_your_duel" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (duel.status !== "pending") {
      console.error("respond-duel: duel not pending:", { duelId, status: duel.status });
      return new Response(
        JSON.stringify({ error: "duel_not_pending" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newStatus = action === "accept" ? "active" : "declined";

    const { data: updatedDuel, error: updateError } = await supabaseAdmin
      .from("duels")
      .update({ status: newStatus })
      .eq("id", duelId)
      .select()
      .single();

    if (updateError) {
      console.error("respond-duel: update failed:", duelId, updateError);
      return new Response(
        JSON.stringify({ error: "duel_update_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, duel: updatedDuel }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("respond-duel error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
