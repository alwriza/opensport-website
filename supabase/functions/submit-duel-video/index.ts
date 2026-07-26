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
      console.error("submit-duel-video: missing Authorization header");
      return new Response(
        JSON.stringify({ error: "missing_authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { duelId, videoId } = await req.json();
    if (!duelId || typeof duelId !== "string") {
      console.error("submit-duel-video: invalid duelId", duelId);
      return new Response(
        JSON.stringify({ error: "duel_id_required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!videoId || typeof videoId !== "string") {
      console.error("submit-duel-video: invalid videoId", videoId);
      return new Response(
        JSON.stringify({ error: "video_id_required" }),
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
      console.error("submit-duel-video: auth.getUser failed:", authError, "user:", user);
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = user.id;

    const { data: submitter, error: submitterError } = await supabaseAnon
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (submitterError || !submitter) {
      console.error("submit-duel-video: submitter not found for auth_user_id:", authUserId, submitterError);
      return new Response(
        JSON.stringify({ error: "submitter_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const submitterId = submitter.id;

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
      console.error("submit-duel-video: duel not found:", duelId, duelError);
      return new Response(
        JSON.stringify({ error: "duel_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (duel.challenger_id !== submitterId && duel.opponent_id !== submitterId) {
      console.error("submit-duel-video: user not part of duel:", { duelId, submitterId, challengerId: duel.challenger_id, opponentId: duel.opponent_id });
      return new Response(
        JSON.stringify({ error: "not_your_duel" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (duel.status !== "active") {
      console.error("submit-duel-video: duel not active:", { duelId, status: duel.status });
      return new Response(
        JSON.stringify({ error: "duel_not_active" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: video, error: videoError } = await supabaseAdmin
      .from("videos")
      .select("id, user_id, duel_id")
      .eq("id", videoId)
      .eq("user_id", submitterId)
      .maybeSingle();

    if (videoError || !video) {
      console.error("submit-duel-video: video not found or not owned:", { videoId, submitterId, videoError });
      return new Response(
        JSON.stringify({ error: "video_not_yours" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (video.duel_id) {
      console.error("submit-duel-video: video already bound to duel:", { videoId, duelId: video.duel_id });
      return new Response(
        JSON.stringify({ error: "video_already_in_duel" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: bindVideoError } = await supabaseAdmin
      .from("videos")
      .update({ duel_id: duelId })
      .eq("id", videoId);

    if (bindVideoError) {
      console.error("submit-duel-video: failed to bind video to duel:", bindVideoError);
      return new Response(
        JSON.stringify({ error: "video_bind_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isChallenger = duel.challenger_id === submitterId;
    const duelUpdateField = isChallenger ? { challenger_video_id: videoId } : { opponent_video_id: videoId };

    const { data: updatedDuel, error: duelUpdateError } = await supabaseAdmin
      .from("duels")
      .update(duelUpdateField)
      .eq("id", duelId)
      .select()
      .single();

    if (duelUpdateError) {
      console.error("submit-duel-video: duel update failed:", duelId, duelUpdateError);
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
    console.error("submit-duel-video error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
