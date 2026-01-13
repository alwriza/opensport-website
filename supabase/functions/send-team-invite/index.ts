import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Обработка CORS (уже работает, но оставим для стабильности)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email, team_name, invite_code, origin } = await req.json()
        console.log(`[LOG] Начинаем процесс для: ${email}, Команда: ${team_name}`);

        // 2. Инициализация Supabase Admin (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Поиск пользователя (Используем ilike для игнорирования регистра)
        console.log("[LOG] Ищем пользователя в БД...");
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, name')
            .ilike('email', email.trim())
            .maybeSingle()

        if (userError) throw new Error(`Ошибка БД: ${userError.message}`);

        if (!userData) {
            console.log("[LOG] Пользователь не найден");
            return new Response(JSON.stringify({ error: "USER_NOT_REGISTERED" }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 4. Отправка через Resend API напрямую через fetch (самый надежный способ в Edge)
        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (!resendKey) throw new Error("RESEND_API_KEY не установлен в секретах Supabase");

        console.log("[LOG] Отправляем запрос в Resend...");
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
                from: 'OpenSport <onboarding@opensport.app>', // Смени на свой домен после верификации
                to: [email],
                subject: `Приглашение в команду ${team_name}`,
                html: `
          <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0A1628; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background-color: #1F2937; border: 1px solid #2d3748; border-radius: 16px; padding: 40px; text-align: center; }
        .logo { color: #93DA97; font-size: 24px; font-weight: bold; margin-bottom: 30px; letter-spacing: -0.02em; }
        .title { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 16px; }
        .description { color: #9CA3AF; font-size: 16px; line-height: 1.5; margin-bottom: 32px; }
        .invite-box { background-color: #0A1628; border-radius: 12px; padding: 20px; margin-bottom: 32px; border: 1px dashed #4B5563; }
        .code-label { color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
        .code-value { color: #93DA97; font-size: 32px; font-weight: 800; letter-spacing: 4px; }
        .btn { background-color: #93DA97; color: #0A1628; padding: 16px 32px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: transform 0.2s; }
        .footer { margin-top: 32px; color: #4B5563; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">OPENSPORT</div>
          <h1 class="title">Вас пригласили!</h1>
          <p class="description">
            Тренер пригласил вас присоединиться к команде <strong>${team_name}</strong>. 
            Ваш путь к профессиональной аналитике ударов начинается здесь.
          </p>
          
          <div class="invite-box">
            <div class="code-label">Код приглашения</div>
            <div class="code-value">${invite_code}</div>
          </div>

          <a href="${origin}/join-team?code=${invite_code}" class="btn">Принять приглашение</a>
          
          <div class="footer">
            Если кнопка не работает, введите код вручную в приложении.<br>
            &copy; 2026 OpenSport AI. Все права защищены.
          </div>
        </div>
      </div>
    </body>
    </html>
        `,
            }),
        })

        const resendResult = await resendResponse.json()
        console.log("[LOG] Ответ от Resend:", resendResult);

        if (!resendResponse.ok) throw new Error(`Resend Error: ${JSON.stringify(resendResult)}`);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error("[ERROR] Критическая ошибка:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})