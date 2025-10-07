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
    const { exerciseId, exerciseType } = await req.json();
    
    if (!exerciseId) {
      throw new Error('Exercise ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get exercise data
    const { data: exercise, error: exerciseError } = await supabase
      .from('training_exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (exerciseError || !exercise) {
      throw new Error('Exercise not found');
    }

    console.log('Analyzing exercise:', exercise.exercise_type, 'at difficulty:', exercise.difficulty);

    // Create context-aware prompt based on exercise type
    const exercisePrompts = {
      passing: 'Analyze passing technique focusing on: foot placement, ball contact, follow-through, accuracy, and weight of pass.',
      shooting: 'Analyze shooting technique focusing on: approach angle, plant foot position, striking technique, power, and accuracy.',
      dribbling: 'Analyze dribbling technique focusing on: ball control, touch frequency, body positioning, change of direction, and speed.',
      defending: 'Analyze defending technique focusing on: body positioning, timing of tackle, jockeying technique, awareness, and recovery.'
    };

    const analysisPrompt = `You are an expert football/soccer coach analyzing a training exercise video.

Exercise Details:
- Type: ${exercise.exercise_type}
- Difficulty: ${exercise.difficulty}
- Player ID: ${exercise.player_id}

${exercisePrompts[exercise.exercise_type as keyof typeof exercisePrompts] || 'Analyze the overall technique.'}

Based on a ${exercise.difficulty} level player performing ${exercise.exercise_type}, provide:
1. Technique Score (0-100): Quality of form and execution
2. Speed Score (0-100): Quickness and explosiveness
3. Control Score (0-100): Ball control and precision
4. Overall Score (0-100): Combined performance rating

Also provide detailed feedback including:
- What was done well
- Areas for improvement
- Specific coaching tips (3-5 points)
- Visual cues to focus on

Return ONLY valid JSON in this exact format:
{
  "technique_score": number,
  "speed_score": number,
  "control_score": number,
  "overall_score": number,
  "feedback": {
    "strengths": [string, string],
    "improvements": [string, string],
    "coaching_tips": [string, string, string],
    "visual_cues": [string, string]
  }
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
          { role: 'system', content: 'You are an expert football coach. Respond only with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to analyze exercise with AI');
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    // Extract JSON from response
    let analysisJson;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysisJson = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch (e) {
      console.error('Failed to parse AI response:', analysisText);
      throw new Error('Failed to parse AI analysis');
    }

    // Save results to database
    const { data: result, error: resultError } = await supabase
      .from('exercise_results')
      .insert({
        exercise_id: exerciseId,
        technique_score: analysisJson.technique_score,
        speed_score: analysisJson.speed_score,
        control_score: analysisJson.control_score,
        overall_score: analysisJson.overall_score,
        feedback: analysisJson.feedback,
      })
      .select()
      .single();

    if (resultError) {
      console.error('Error saving results:', resultError);
      throw new Error('Failed to save results');
    }

    console.log('Exercise analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        message: 'Exercise analyzed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in analyze-exercise function:', error);
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
