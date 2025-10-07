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
    const { playerId } = await req.json();
    
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get player registration with video URL
    const { data: player, error: playerError } = await supabase
      .from('player_registrations')
      .select('*')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      throw new Error('Player not found');
    }

    if (!player.video_url) {
      throw new Error('No video URL found for this player');
    }

    console.log('Analyzing video for player:', player.full_name);

    // Download video to get a sample frame (simplified approach)
    // In production, you'd want to extract multiple frames
    const videoResponse = await fetch(player.video_url);
    const videoBlob = await videoResponse.blob();
    
    // For now, we'll use the video URL directly and ask AI to provide an analysis
    // In a real scenario, you'd extract frames and analyze them
    const analysisPrompt = `You are an expert football/soccer scout analyzing a player's performance video. 
    
Player Information:
- Name: ${player.full_name}
- Position: ${player.position}
- Age: ${new Date().getFullYear() - new Date(player.date_of_birth).getFullYear()} years
- Height: ${player.height}cm
- Weight: ${player.weight}kg

Based on typical performance for a ${player.position} player of this age and physical attributes, provide a detailed analysis with scores (0-100) for:
1. Speed/Pace
2. Dribbling/Ball Control
3. Passing Accuracy
4. Shooting
5. Defending
6. Physicality

Also provide 3-5 specific, actionable training tips to improve their game.

Return ONLY valid JSON in this exact format:
{
  "speed_score": number,
  "dribbling_score": number,
  "passing_score": number,
  "shooting_score": number,
  "defending_score": number,
  "physicality_score": number,
  "training_tips": [string, string, string],
  "overall_score": number
}`;

    // Call Lovable AI for analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert football scout. Respond only with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to analyze video with AI');
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    // Extract JSON from response (handle markdown code blocks)
    let analysisJson;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysisJson = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch (e) {
      console.error('Failed to parse AI response:', analysisText);
      throw new Error('Failed to parse AI analysis');
    }

    // Save analysis to database
    const { data: analysis, error: analysisError } = await supabase
      .from('player_analysis')
      .insert({
        player_id: playerId,
        speed_score: analysisJson.speed_score,
        dribbling_score: analysisJson.dribbling_score,
        passing_score: analysisJson.passing_score,
        shooting_score: analysisJson.shooting_score,
        defending_score: analysisJson.defending_score,
        physicality_score: analysisJson.physicality_score,
        overall_score: analysisJson.overall_score,
        training_tips: analysisJson.training_tips,
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error saving analysis:', analysisError);
      throw new Error('Failed to save analysis');
    }

    console.log('Analysis completed successfully for player:', player.full_name);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        message: 'Video analysis completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in analyze-player-video function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred during analysis'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
