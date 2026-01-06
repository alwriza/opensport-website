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

    // Get player data
    const { data: player, error: playerError } = await supabase
      .from('player_registrations')
      .select('*')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      throw new Error('Player not found');
    }

    // Get player analysis
    const { data: analysis } = await supabase
      .from('player_analysis')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get recent exercise results
    const { data: exercises } = await supabase
      .from('training_exercises')
      .select(`
        *,
        exercise_results (*)
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('Generating recommendations for:', player.full_name);

    const recommendationPrompt = `You are an expert football/soccer coach creating personalized training recommendations.

Player Profile:
- Name: ${player.full_name}
- Position: ${player.position}
- Age: ${new Date().getFullYear() - new Date(player.date_of_birth).getFullYear()} years
- Height: ${player.height}cm
- Weight: ${player.weight}kg

${analysis ? `
Latest Performance Analysis:
- Speed: ${analysis.speed_score}/100
- Dribbling: ${analysis.dribbling_score}/100
- Passing: ${analysis.passing_score}/100
- Shooting: ${analysis.shooting_score}/100
- Defending: ${analysis.defending_score}/100
- Overall: ${analysis.overall_score}/100
` : ''}

${exercises && exercises.length > 0 ? `
Recent Training History: ${exercises.length} exercises completed
Average Performance: ${exercises.reduce((sum: number, ex: any) => {
      const results = ex.exercise_results || [];
      const avgScore = results.length > 0
        ? results.reduce((s: number, r: any) => s + (r.overall_score || 0), 0) / results.length
        : 0;
      return sum + avgScore;
    }, 0) / exercises.length
        }/100
` : 'No training history yet'}

Based on this data, provide 5-7 personalized recommendations across these categories:
1. **Exercise Recommendations**: Specific drills to improve weak areas
2. **Diet Recommendations**: Nutritional advice for the player's position and physical attributes
3. **Tactical Recommendations**: Position-specific tactical insights

For each recommendation, provide:
- Type: 'exercise', 'diet', or 'tactical'
- Title: Brief, actionable title
- Description: Detailed explanation (2-3 sentences)
- Priority: 'high', 'medium', or 'low'

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "type": "exercise",
      "title": "string",
      "description": "string",
      "priority": "high"
    }
  ]
}`;

    // Call Lovable AI for recommendations
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert football coach. Respond only with valid JSON.' },
          { role: 'user', content: recommendationPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate recommendations');
    }

    const aiData = await aiResponse.json();
    const recommendationsText = aiData.choices[0].message.content;

    // Extract JSON from response
    let recommendationsJson;
    try {
      const jsonMatch = recommendationsText.match(/\{[\s\S]*\}/);
      recommendationsJson = JSON.parse(jsonMatch ? jsonMatch[0] : recommendationsText);
    } catch (e) {
      console.error('Failed to parse AI response:', recommendationsText);
      throw new Error('Failed to parse AI recommendations');
    }

    // Delete old pending recommendations
    await supabase
      .from('ai_recommendations')
      .delete()
      .eq('player_id', playerId)
      .eq('status', 'pending');

    // Save new recommendations to database
    const recommendationsToInsert = recommendationsJson.recommendations.map((rec: any) => ({
      player_id: playerId,
      recommendation_type: rec.type,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      status: 'pending'
    }));

    const { data: savedRecommendations, error: saveError } = await supabase
      .from('ai_recommendations')
      .insert(recommendationsToInsert)
      .select();

    if (saveError) {
      console.error('Error saving recommendations:', saveError);
      throw new Error('Failed to save recommendations');
    }

    console.log('Recommendations generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: savedRecommendations,
        message: 'Recommendations generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-recommendations function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
