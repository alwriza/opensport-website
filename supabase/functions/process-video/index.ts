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
        const { video_id } = await req.json()
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
            body: JSON.stringify({ video_url: signedUrl, video_id: video_id }),
        })

        if (!mlResponse.ok) {
            throw new Error(`ML Worker failed: ${mlResponse.statusText}`)
        }

        const analysisResult = await mlResponse.json()

        // 4. Save results
        const { error: saveError } = await supabaseClient
            .from('analyses')
            .insert({
                user_id: video.user_id,
                video_id: video.id,
                stability: analysisResult.scores.stability,
                power: analysisResult.scores.power,
                technique: analysisResult.scores.technique,
                balance: analysisResult.scores.balance,
                overall: analysisResult.scores.overall,
                feedback: analysisResult.feedback,
                tags: analysisResult.tags,
                processing_time_ms: analysisResult.processing_time_ms
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
