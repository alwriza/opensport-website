-- Create training exercises table
CREATE TABLE public.training_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.player_registrations(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL, -- 'passing', 'shooting', 'dribbling', 'defending'
  difficulty TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercise results table
CREATE TABLE public.exercise_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.training_exercises(id) ON DELETE CASCADE,
  technique_score NUMERIC,
  speed_score NUMERIC,
  control_score NUMERIC,
  overall_score NUMERIC,
  feedback JSONB, -- Store detailed feedback with visual overlay data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI recommendations table
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.player_registrations(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL, -- 'exercise', 'diet', 'tactical'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL, -- 'high', 'medium', 'low'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'skipped'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly reports table
CREATE TABLE public.weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.player_registrations(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  progress_summary TEXT,
  strengths JSONB,
  areas_for_improvement JSONB,
  exercises_completed INTEGER DEFAULT 0,
  average_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_exercises
CREATE POLICY "Anyone can view training exercises"
  ON public.training_exercises FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create training exercises"
  ON public.training_exercises FOR INSERT
  WITH CHECK (true);

-- RLS Policies for exercise_results
CREATE POLICY "Anyone can view exercise results"
  ON public.exercise_results FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create exercise results"
  ON public.exercise_results FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ai_recommendations
CREATE POLICY "Anyone can view recommendations"
  ON public.ai_recommendations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create recommendations"
  ON public.ai_recommendations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update recommendations"
  ON public.ai_recommendations FOR UPDATE
  USING (true);

-- RLS Policies for weekly_reports
CREATE POLICY "Anyone can view weekly reports"
  ON public.weekly_reports FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create weekly reports"
  ON public.weekly_reports FOR INSERT
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_training_exercises_updated_at
  BEFORE UPDATE ON public.training_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at
  BEFORE UPDATE ON public.ai_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();