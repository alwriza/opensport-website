import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { video_id, camera_angle, shot_type, foot_part, kicking_foot } = await req.json()
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get video record
        const { data: video, error: videoError } = await supabaseClient
            .from('videos')
            .select('*')
            .eq('id', video_id)
            .single()

        if (videoError || !video) throw new Error('Video not found')

        // 2. Create signed URL
        const { data: { signedUrl }, error: signError } = await supabaseClient
            .storage
            .from('videos')
            .createSignedUrl(video.storage_path, 3600) // 1 hour

        if (signError) throw new Error('Could not create signed URL')

        // 3. Call ML Worker
        const mlWorkerUrl = Deno.env.get('ML_WORKER_URL')
        if (!mlWorkerUrl) throw new Error('ML_WORKER_URL not configured')

        const mlResponse = await fetch(`${mlWorkerUrl}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                video_url: signedUrl,
                video_id: video_id,
                camera_angle: camera_angle || 'unknown',
                shot_type: shot_type || 'unknown',
                foot_part: foot_part || 'unknown',
                kicking_foot: kicking_foot || 'unknown'
            }),
        })

        if (!mlResponse.ok) {
            const errorText = await mlResponse.text()
            throw new Error(`ML Worker failed: ${mlResponse.status} - ${errorText}`)
        }

        const analysisResult = await mlResponse.json()

        if (analysisResult.status === 'error' || !analysisResult.is_kick) {
            throw new Error(analysisResult.message || "No kicks detected in the video.")
        }

        // 4. Save results
        const { error: saveError } = await supabaseClient
            .from('analyses')
            .insert({
                user_id: video.user_id,
                video_id: video.id,
                stability: analysisResult.scores?.stability || 0,
                power: analysisResult.scores?.power || 0,
                technique: analysisResult.scores?.technique || 0,
                balance: analysisResult.scores?.balance || 0,
                overall: analysisResult.scores?.overall || 0,
                feedback: analysisResult.feedback || '',
                tags: analysisResult.tags || [],
                processing_time_ms: analysisResult.processing_time_ms || 0
            })

        if (saveError) throw saveError

        // 5. Update video status
        await supabaseClient
            .from('videos')
            .update({ status: 'completed' })
            .eq('id', video_id)

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
