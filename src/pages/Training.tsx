import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Play, TrendingUp, Target, Brain, Loader2, Filter } from "lucide-react";

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

const Training = () => {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ExerciseResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('training_exercises')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExercises(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading exercises",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const handleAnalyzeExercise = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-exercise', {
        body: { 
          exerciseId: exercise.id,
          videoUrl: exercise.video_url,
          exerciseType: exercise.exercise_type
        }
      });

      if (error) throw error;

      setAnalysisResult(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "Exercise analyzed successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: { 
          playerId: 'demo-player',
          exerciseResults: analysisResult ? [analysisResult] : []
        }
      });

      if (error) throw error;
      setRecommendations(data.recommendations || []);
    } catch (error: any) {
      toast({
        title: "Error fetching recommendations",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesDifficulty = filterDifficulty === "all" || ex.difficulty === filterDifficulty;
    const matchesType = filterType === "all" || ex.exercise_type === filterType;
    return matchesDifficulty && matchesType;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Training Library</h1>
        <p className="text-muted-foreground">
          Browse AI-analyzed training exercises and get personalized recommendations
        </p>
      </div>

      <Tabs defaultValue="exercises" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="exercises">Exercise Library</TabsTrigger>
          <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Exercises
              </CardTitle>
              <CardDescription>Browse through our library of training exercises</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <select 
                  value={filterDifficulty} 
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="all">All Types</option>
                  <option value="passing">Passing</option>
                  <option value="shooting">Shooting</option>
                  <option value="dribbling">Dribbling</option>
                  <option value="defending">Defending</option>
                  <option value="agility">Agility</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {isLoadingExercises ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredExercises.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No exercises found matching your filters.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map((exercise) => (
                <Card key={exercise.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    {exercise.video_url ? (
                      <video 
                        src={exercise.video_url} 
                        className="w-full h-full object-cover"
                        poster="/placeholder.svg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Play className="h-16 w-16 text-primary/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="h-12 w-12 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${getDifficultyColor(exercise.difficulty)} text-white`}>
                        {exercise.difficulty}
                      </Badge>
                      <span className="text-sm text-muted-foreground capitalize">
                        {exercise.exercise_type}
                      </span>
                    </div>
                    <CardTitle className="text-lg capitalize">
                      {exercise.exercise_type} Training
                    </CardTitle>
                    <CardDescription>
                      AI-analyzed exercise for skill improvement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleAnalyzeExercise(exercise)}
                      disabled={isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing && selectedExercise?.id === exercise.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "View Analysis"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          {analysisResult ? (
            <>
              {selectedExercise && (
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">Analyzing: {selectedExercise.exercise_type}</CardTitle>
                    <CardDescription>Difficulty: {selectedExercise.difficulty}</CardDescription>
                  </CardHeader>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Scores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Technique</span>
                      <span className="font-medium">{analysisResult.technique_score}/100</span>
                    </div>
                    <Progress value={analysisResult.technique_score} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Speed</span>
                      <span className="font-medium">{analysisResult.speed_score}/100</span>
                    </div>
                    <Progress value={analysisResult.speed_score} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Control</span>
                      <span className="font-medium">{analysisResult.control_score}/100</span>
                    </div>
                    <Progress value={analysisResult.control_score} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Overall Score</span>
                      <span>{analysisResult.overall_score}/100</span>
                    </div>
                    <Progress value={analysisResult.overall_score} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Coaching Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Strengths</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResult.feedback.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="text-sm">{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-amber-600">Areas for Improvement</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResult.feedback.improvements.map((improvement: string, idx: number) => (
                        <li key={idx} className="text-sm">{improvement}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-blue-600">Coaching Tips</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResult.feedback.coaching_tips.map((tip: string, idx: number) => (
                        <li key={idx} className="text-sm">{tip}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select an exercise from the library to view AI analysis and feedback
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Personalized AI Recommendations
              </CardTitle>
              <CardDescription>
                Based on your training data and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchRecommendations} className="w-full">
                Generate Recommendations
              </Button>
            </CardContent>
          </Card>

          {recommendations.length > 0 && (
            <div className="grid gap-4">
              {recommendations.map((rec, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                    <CardDescription className="capitalize">
                      {rec.recommendation_type} • Priority: {rec.priority}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{rec.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Training;
