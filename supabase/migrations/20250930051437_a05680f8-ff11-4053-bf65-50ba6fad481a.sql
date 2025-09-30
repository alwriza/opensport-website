-- Create player_registrations table
CREATE TABLE public.player_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality TEXT NOT NULL,
  position TEXT NOT NULL,
  academy TEXT NOT NULL,
  height NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.player_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anyone to insert and view registrations
CREATE POLICY "Anyone can register as a player" 
ON public.player_registrations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view player registrations" 
ON public.player_registrations 
FOR SELECT 
USING (true);

-- Create player_analysis table for storing AI analysis results
CREATE TABLE public.player_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.player_registrations(id) ON DELETE CASCADE,
  overall_score NUMERIC,
  speed_score NUMERIC,
  dribbling_score NUMERIC,
  passing_score NUMERIC,
  shooting_score NUMERIC,
  defending_score NUMERIC,
  physicality_score NUMERIC,
  training_tips TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on player_analysis
ALTER TABLE public.player_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player analysis" 
ON public.player_analysis 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_player_registrations_updated_at
BEFORE UPDATE ON public.player_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_analysis_updated_at
BEFORE UPDATE ON public.player_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for player videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('player-videos', 'player-videos', true);

-- Create storage policies for video uploads
CREATE POLICY "Anyone can upload player videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'player-videos');

CREATE POLICY "Anyone can view player videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'player-videos');