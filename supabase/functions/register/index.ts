import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, phone, nickname, terms_accepted, privacy_accepted } = await req.json();

    if (!email || !password || !phone || !nickname) {
      return new Response(
        JSON.stringify({ error: "email, password, phone and nickname are required" }),
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

    const { data: existingNickname } = await supabase
      .from("users")
      .select("id")
      .eq("nickname", nickname)
      .maybeSingle();

    if (existingNickname) {
      return new Response(
        JSON.stringify({ error: "Nickname already taken" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      phone,
      email_confirm: false,
      user_metadata: { phone, nickname },
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
