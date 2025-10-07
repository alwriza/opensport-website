import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Dumbbell, Lightbulb, TrendingUp, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  exercise_type: string;
  difficulty: string;
  video_url: string | null;
  created_at: string;
}

interface ExerciseResult {
  technique_score: number;
  speed_score: number;
  control_score: number;
  overall_score: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    coaching_tips: string[];
    visual_cues: string[];
  };
}

interface Recommendation {
  id: string;
  recommendation_type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function Training() {
  const [playerId, setPlayerId] = useState<string>("");
  const [exercises, setExercises] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedExerciseType, setSelectedExerciseType] = useState("passing");
  const [selectedDifficulty, setSelectedDifficulty] = useState("intermediate");
  const { toast } = useToast();

  useEffect(() => {
    fetchPlayerData();
  }, []);

  const fetchPlayerData = async () => {
    try {
      // Get first player
      const { data: players } = await supabase
        .from('player_registrations')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (players && players.length > 0) {
        const id = players[0].id;
        setPlayerId(id);
        await Promise.all([
          fetchExercises(id),
          fetchRecommendations(id)
        ]);
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async (id: string) => {
    const { data } = await supabase
      .from('training_exercises')
      .select(`
        *,
        exercise_results (*)
      `)
      .eq('player_id', id)
      .order('created_at', { ascending: false });

    setExercises(data || []);
  };

  const fetchRecommendations = async (id: string) => {
    const { data } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('player_id', id)
      .order('created_at', { ascending: false });

    setRecommendations(data || []);
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !playerId) return;

    setUploading(true);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${playerId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('player-videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('player-videos')
        .getPublicUrl(filePath);

      // Create exercise record
      const { data: exercise, error: exerciseError } = await supabase
        .from('training_exercises')
        .insert({
          player_id: playerId,
          exercise_type: selectedExerciseType,
          difficulty: selectedDifficulty,
          video_url: publicUrl
        })
        .select()
        .single();

      if (exerciseError) throw exerciseError;

      toast({
        title: "Video Uploaded",
        description: "Your exercise video has been uploaded successfully!",
      });

      // Automatically analyze the exercise
      await analyzeExercise(exercise.id);
      await fetchExercises(playerId);

    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const analyzeExercise = async (exerciseId: string) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-exercise', {
        body: { exerciseId, exerciseType: selectedExerciseType }
      });

      if (error) throw error;

      toast({
        title: "Analysis Complete",
        description: "Your exercise has been analyzed!",
      });

      await fetchExercises(playerId);
    } catch (error) {
      console.error('Error analyzing exercise:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze exercise. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const generateRecommendations = async () => {
    if (!playerId) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: { playerId }
      });

      if (error) throw error;

      toast({
        title: "Recommendations Generated",
        description: "Your personalized recommendations are ready!",
      });

      await fetchRecommendations(playerId);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate recommendations.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const updateRecommendationStatus = async (id: string, status: string) => {
    try {
      await supabase
        .from('ai_recommendations')
        .update({ status })
        .eq('id', id);

      await fetchRecommendations(playerId);

      toast({
        title: "Status Updated",
        description: `Recommendation marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating recommendation:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Interactive Training</h1>
          <p className="text-muted-foreground">AI-powered exercises and personalized recommendations</p>
        </div>

        <Tabs defaultValue="exercises" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exercises" className="gap-2">
              <Dumbbell className="h-4 w-4" />
              Exercises
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              AI Feedback
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Training Exercise</CardTitle>
                <CardDescription>Upload a video of your drill for AI analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exercise Type</label>
                    <Select value={selectedExerciseType} onValueChange={setSelectedExerciseType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passing">Passing</SelectItem>
                        <SelectItem value="shooting">Shooting</SelectItem>
                        <SelectItem value="dribbling">Dribbling</SelectItem>
                        <SelectItem value="defending">Defending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty</label>
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a video clip (max 60 seconds)
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={uploading || analyzing}
                    className="hidden"
                    id="video-upload"
                  />
                  <Button asChild disabled={uploading || analyzing}>
                    <label htmlFor="video-upload" className="cursor-pointer">
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : analyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        'Select Video'
                      )}
                    </label>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Exercises</CardTitle>
                <CardDescription>Your training history</CardDescription>
              </CardHeader>
              <CardContent>
                {exercises.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No exercises yet. Upload your first video!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {exercises.map((exercise) => (
                      <div key={exercise.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold capitalize">{exercise.exercise_type}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {exercise.difficulty} • {new Date(exercise.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {exercise.exercise_results && exercise.exercise_results.length > 0 && (
                            <Badge variant="secondary">
                              Score: {exercise.exercise_results[0].overall_score}
                            </Badge>
                          )}
                        </div>
                        {exercise.video_url && (
                          <video controls className="w-full rounded-lg max-h-64 mt-2">
                            <source src={exercise.video_url} type="video/mp4" />
                          </video>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            {exercises.filter(e => e.exercise_results && e.exercise_results.length > 0).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Feedback Yet</h3>
                  <p className="text-muted-foreground">
                    Upload and analyze exercises to see AI feedback
                  </p>
                </CardContent>
              </Card>
            ) : (
              exercises
                .filter(e => e.exercise_results && e.exercise_results.length > 0)
                .map((exercise) => {
                  const result = exercise.exercise_results[0];
                  return (
                    <Card key={exercise.id}>
                      <CardHeader>
                        <CardTitle className="capitalize">{exercise.exercise_type} Analysis</CardTitle>
                        <CardDescription>
                          {exercise.difficulty} • {new Date(exercise.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Technique</p>
                            <div className="flex items-center gap-2">
                              <Progress value={result.technique_score} className="flex-1" />
                              <span className="text-sm font-medium">{result.technique_score}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Speed</p>
                            <div className="flex items-center gap-2">
                              <Progress value={result.speed_score} className="flex-1" />
                              <span className="text-sm font-medium">{result.speed_score}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Control</p>
                            <div className="flex items-center gap-2">
                              <Progress value={result.control_score} className="flex-1" />
                              <span className="text-sm font-medium">{result.control_score}</span>
                            </div>
                          </div>
                        </div>

                        {result.feedback && (
                          <div className="space-y-4 pt-4 border-t">
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Strengths
                              </h4>
                              <ul className="space-y-1">
                                {result.feedback.strengths?.map((strength: string, i: number) => (
                                  <li key={i} className="text-sm text-muted-foreground ml-6">• {strength}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                                Areas for Improvement
                              </h4>
                              <ul className="space-y-1">
                                {result.feedback.improvements?.map((improvement: string, i: number) => (
                                  <li key={i} className="text-sm text-muted-foreground ml-6">• {improvement}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-blue-500" />
                                Coaching Tips
                              </h4>
                              <ul className="space-y-1">
                                {result.feedback.coaching_tips?.map((tip: string, i: number) => (
                                  <li key={i} className="text-sm text-muted-foreground ml-6">• {tip}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>AI Recommendations</CardTitle>
                    <CardDescription>Personalized training, diet, and tactical advice</CardDescription>
                  </div>
                  <Button onClick={generateRecommendations} disabled={generating}>
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate New'
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="text-center py-12">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Recommendations Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate personalized recommendations based on your performance
                    </p>
                    <Button onClick={generateRecommendations} disabled={generating}>
                      {generating ? 'Generating...' : 'Generate Recommendations'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                              >
                                {rec.priority}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {rec.recommendation_type}
                              </Badge>
                            </div>
                            <h3 className="font-semibold mb-1">{rec.title}</h3>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {rec.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateRecommendationStatus(rec.id, 'completed')}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateRecommendationStatus(rec.id, 'skipped')}
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {rec.status === 'completed' && (
                              <Badge variant="default">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
