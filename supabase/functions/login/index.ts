import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sign in with a nickname. The email behind a nickname is resolved here with the
 * service role, so it is never sent to the browser (users.email is not readable
 * through the API). Any failure returns the same generic error, so the endpoint
 * does not reveal which nicknames exist.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { nickname, password } = await req.json();
    if (typeof nickname !== "string" || typeof password !== "string" || !nickname.trim() || !password) {
      return json({ error: "invalid_credentials" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const admin = createClient(url, Deno.env.get("SERVICE_ROLE_SECRET_KEY") ?? "");
    const { data: profile } = await admin.from("users").select("email").eq("nickname", nickname.trim()).maybeSingle();
    if (!profile?.email) return json({ error: "invalid_credentials" }, 401);

    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { auth: { persistSession: false } });
    const { data, error } = await anon.auth.signInWithPassword({ email: profile.email, password });
    if (error || !data.session) {
      // Keep Supabase's "email not confirmed" distinct: the user can act on it.
      const code = error?.message?.toLowerCase().includes("not confirmed") ? "email_not_confirmed" : "invalid_credentials";
      return json({ error: code }, 401);
    }

    return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch (err) {
    console.error("login error:", err);
    return json({ error: "invalid_credentials" }, 400);
  }
});
