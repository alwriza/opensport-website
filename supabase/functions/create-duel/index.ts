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
      return new Response(
        JSON.stringify({ error: "missing_authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { opponentNickname } = await req.json();
    if (!opponentNickname || typeof opponentNickname !== "string") {
      return new Response(
        JSON.stringify({ error: "opponent_nickname_required" }),
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
      console.error("auth.getUser failed:", authError, "user:", user);
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = user.id;

    const { data: challenger, error: challengerError } = await supabaseAnon
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (challengerError || !challenger) {
      return new Response(
        JSON.stringify({ error: "challenger_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const challengerId = challenger.id;

    const { data: opponent, error: opponentError } = await supabaseAnon
      .from("users")
      .select("id")
      .eq("nickname", opponentNickname)
      .maybeSingle();

    if (opponentError || !opponent) {
      return new Response(
        JSON.stringify({ error: "user_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const opponentId = opponent.id;

    if (opponentId === challengerId) {
      return new Response(
        JSON.stringify({ error: "cannot_challenge_yourself" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_SECRET_KEY") ?? ""
    );

    const { data: existingDuel } = await supabaseAdmin
      .from("duels")
      .select("id")
      .eq("challenger_id", challengerId)
      .eq("opponent_id", opponentId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingDuel) {
      return new Response(
        JSON.stringify({ error: "duel_already_pending" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deadlineAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: duel, error: insertError } = await supabaseAdmin
      .from("duels")
      .insert({
        challenger_id: challengerId,
        opponent_id: opponentId,
        status: "pending",
        deadline_at: deadlineAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error("duel insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "duel_creation_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, duel }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-duel error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
