import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** First client IP of the request; hashed in the database, never stored raw. */
function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return req.headers.get("cf-connecting-ip") || forwarded || req.headers.get("x-real-ip") || null;
}

/** `player` + 6 random digits, retried until free (1M combinations, so a clash is rare). */
async function generateNickname(taken: (value: string) => Promise<boolean>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `player${crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000}`;
    if (!(await taken(candidate))) return candidate;
  }
  throw new Error("could not generate a free nickname");
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, phone, nickname, terms_accepted, privacy_accepted, referral_visit_id } = await req.json();

    // Sign-up asks for email and password only. Phone and nickname are still
    // accepted from older clients; without a nickname one is generated, because
    // duels find opponents by nickname.
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!terms_accepted || !privacy_accepted) {
      return new Response(
        JSON.stringify({ error: "You must accept Terms of Service and Privacy Policy" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_SECRET_KEY") ?? ""
    );

    const nicknameTaken = async (value: string) => {
      const { data } = await supabase.from("users").select("id").eq("nickname", value).maybeSingle();
      return !!data;
    };

    let finalNickname: string;
    if (nickname) {
      if (await nicknameTaken(nickname)) {
        return new Response(
          JSON.stringify({ error: "Nickname already taken" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      finalNickname = nickname;
    } else {
      finalNickname = await generateNickname(nicknameTaken);
    }

    if (phone) {
      const { data: existingPhone } = await supabase
        .from("users")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (existingPhone) {
        return new Response(
          JSON.stringify({ error: "Phone already registered" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      ...(phone ? { phone } : {}),
      email_confirm: false,
      user_metadata: phone ? { phone, nickname: finalNickname } : { nickname: finalNickname },
    });

    if (authError) {
      console.error("Auth admin createUser error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (authUser?.user) {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("users")
        .update({
          terms_accepted_at: now,
          privacy_accepted_at: now,
        })
        .eq("auth_user_id", authUser.user.id);

      if (updateError) {
        console.error("Failed to set terms acceptance:", updateError);
      }

      // Creator referral: the database checks the visit, the 14-day window and the
      // creator's status, and links the account once. It must never block sign-up.
      if (typeof referral_visit_id === "string" && UUID_RE.test(referral_visit_id)) {
        const { data: referral, error: referralError } = await supabase.rpc("attach_referral", {
          p_auth_user_id: authUser.user.id,
          p_visit_id: referral_visit_id,
          p_ip: clientIp(req),
        });
        if (referralError) console.error("attach_referral error:", referralError);
        else if (!referral?.ok) console.log("Referral not attached:", referral?.reason);
      }
    }

    if (resendError) {
      console.error("Resend confirmation email error:", resendError);
      return new Response(
        JSON.stringify({
          user: authUser.user,
          message: "User created but confirmation email could not be sent. You can request a new code on the sign-in page.",
          resendError: resendError.message,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
      );
    }

    return new Response(
      JSON.stringify({ user: authUser.user, message: "User created successfully. Confirmation code sent to email." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    );
  } catch (err) {
    console.error("register error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
