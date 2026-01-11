import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";
import { Play, TrendingUp, Target, Brain, Loader2, Filter, Lock, CheckCircle, Circle, Trophy, Flame, Star, Zap, ChevronRight, ExternalLink } from "lucide-react";

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

interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  order_index: number;
}

interface SkillLevel {
  id: string;
  skill_id: string;
  level_name: 'beginner' | 'intermediate' | 'advanced';
  level_order: number;
  youtube_url: string;
  video_title: string;
  duration_minutes: number;
  target_metrics: string[];
  xp_reward: number;
}

interface PlayerProgress {
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
}

interface SkillProgress {
  skill_id: string;
  completed_levels: string[];
  is_completed: boolean;
}

const Training = () => {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  // Existing state for library and analysis
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ExerciseResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // New Training System state
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress | null>(null);
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [isLoadingTraining, setIsLoadingTraining] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeTab, setActiveTab] = useState("interactive");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchParams] = useSearchParams();
  const skillDetailsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when skill is selected
  useEffect(() => {
    if (selectedSkill && skillDetailsRef.current) {
      skillDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedSkill]);

  // Handle URL parameters for auto-opening
  useEffect(() => {
    const skillParam = searchParams.get('skill');
    const levelParam = searchParams.get('level');

    if (skillParam && skills.length > 0) {
      const skill = skills.find(s => s.id === skillParam);
      if (skill) {
        setSelectedSkill(skill);

        if (levelParam && skillLevels.length > 0) {
          const level = skillLevels.find(
            l => l.skill_id === skillParam && l.level_name === levelParam
          );
          if (level) {
            setSelectedLevel(level);
            setShowVideoModal(true);
          }
        }
      }
    }
  }, [searchParams, skills, skillLevels]);

  // Pre-calculated stats for UI
  const userXP = playerProgress?.total_xp || 0;
  const userLevel = playerProgress?.level || 1;
  const streak = playerProgress?.current_streak || 0;
  const xpToNextLevel = userLevel * 500; // Simple scaling
  const xpProgress = (userXP % 500 / 500) * 100;

  // 1. Fetch DB User ID from Clerk ID
  useEffect(() => {
    const getDbUserId = async () => {
      if (!isLoaded || !user) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single();

        if (error) throw error;
        if (data) setDbUserId(data.id);
      } catch (error) {
        console.error("Error fetching db user id:", error);
      }
    };
    getDbUserId();
  }, [isLoaded, user]);

  // 2. Fetch all Training Data
  useEffect(() => {
    const fetchTrainingData = async () => {
      if (!dbUserId) return;
      setIsLoadingTraining(true);
      try {
        // Fetch skills
        const { data: skillsData } = await supabase
          .from('skills')
          .select('*')
          .order('order_index');

        // Fetch skill levels
        const { data: levelsData } = await supabase
          .from('skill_levels')
          .select('*')
          .order('level_order');

        // Fetch player progress
        let { data: progressData } = await supabase
          .from('player_progress' as any)
          .select('*')
          .eq('player_id', dbUserId)
          .single();

        // Auto-create progress if missing
        if (!progressData) {
          const { data: newProgress } = await supabase
            .from('player_progress' as any)
            .insert({
              player_id: dbUserId,
              total_xp: 0,
              level: 1,
              current_streak: 0
            } as any)
            .select()
            .single();
          progressData = newProgress;
        }
        // Fetch skill-specific progress
        const { data: skillProgData } = await supabase
          .from('player_skill_progress' as any)
          .select('*')
          .eq('player_id', dbUserId);

        setSkills(skillsData || []);
        setSkillLevels(levelsData || []);
        setPlayerProgress(progressData);
        setSkillProgress((skillProgData || []) as any[]);
      } catch (error) {
        console.error("Error fetching training data:", error);
        toast({
          title: "Error",
          description: "Failed to load training progress",
          variant: "destructive"
        });
      } finally {
        setIsLoadingTraining(false);
      }
    };

    fetchTrainingData();
  }, [dbUserId, toast]);

  // Existing library fetch
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

  // Helper: Get levels for a skill
  const getLevelsForSkill = (skillId: string) => {
    return skillLevels.filter(level => level.skill_id === skillId);
  };

  // Helper: Get progress for a skill
  const getSkillProgress = (skillId: string) => {
    return skillProgress.find(sp => sp.skill_id === skillId);
  };

  // Helper: Check if skill is unlocked (sequential logic)
  const isSkillUnlocked = (skillOrderIndex: number) => {
    if (skillOrderIndex === 1) return true;
    const previousSkill = skills.find(s => s.order_index === skillOrderIndex - 1);
    if (!previousSkill) return false;
    const progress = getSkillProgress(previousSkill.id);
    return progress?.is_completed || false;
  };

  // Helper: Check if level is unlocked within a skill
  const isLevelUnlocked = (skillId: string, levelOrder: number) => {
    if (levelOrder === 1) return true;
    const progress = getSkillProgress(skillId);
    if (!progress) return false;
    const previousLevelName = levelOrder === 2 ? 'beginner' : 'intermediate';
    return (progress.completed_levels as any).includes(previousLevelName);
  };

  // Complete level function
  const completeLevel = async (skillLevelId: string, skillId: string, levelName: string) => {
    if (!dbUserId) return;

    try {
      const level = skillLevels.find(l => l.id === skillLevelId);
      if (!level) return;

      // 1. Record completion
      await supabase
        .from('level_completions' as any)
        .insert({
          player_id: dbUserId,
          skill_level_id: skillLevelId,
          xp_earned: level.xp_reward
        } as any);

      // 2. Update skill progress
      const currentProgress = getSkillProgress(skillId);
      const completedLevels = [...(currentProgress?.completed_levels || [])];

      if (!completedLevels.includes(levelName)) {
        completedLevels.push(levelName);
      }

      const allLevelsCompleted = completedLevels.length === 3;

      if (currentProgress) {
        await supabase
          .from('player_skill_progress' as any)
          .update({
            completed_levels: completedLevels,
            is_completed: allLevelsCompleted,
            completed_at: allLevelsCompleted ? new Date().toISOString() : null
          } as any)
          .eq('player_id', dbUserId)
          .eq('skill_id', skillId);
      } else {
        await (supabase as any)
          .from('player_skill_progress')
          .insert({
            player_id: dbUserId,
            skill_id: skillId,
            completed_levels: completedLevels,
            is_completed: allLevelsCompleted
          });
      }

      // 3. Update player XP and Streak
      const newXP = (playerProgress?.total_xp || 0) + level.xp_reward;
      const newLevel = Math.floor(newXP / 500) + 1;

      const today = new Date().toISOString().split('T')[0];
      const lastActivity = playerProgress?.last_activity_date;
      let newStreak = playerProgress?.current_streak || 0;

      if (!lastActivity) {
        newStreak = 1;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActivity === yesterdayStr) {
          newStreak += 1;
        } else if (lastActivity !== today) {
          newStreak = 1;
        }
      }

      const longestStreak = Math.max(newStreak, playerProgress?.longest_streak || 0);

      await supabase
        .from('player_progress' as any)
        .update({
          total_xp: newXP,
          level: newLevel,
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: today
        } as any)
        .eq('player_id', dbUserId);

      // 4. Refresh local state
      // Simply re-fetch or update manually
      // For simplicity, we can let the effect handle it by triggering a refresh or just updating manually
      setPlayerProgress(prev => prev ? {
        ...prev,
        total_xp: newXP,
        level: newLevel,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: today
      } : null);

      setSkillProgress(prev => {
        const existing = prev.find(p => p.skill_id === skillId);
        if (existing) {
          return prev.map(p => p.skill_id === skillId ? {
            ...p,
            completed_levels: completedLevels,
            is_completed: allLevelsCompleted
          } : p);
        }
        return [...prev, {
          skill_id: skillId,
          completed_levels: completedLevels,
          is_completed: allLevelsCompleted
        }];
      });

      toast({
        title: "Level Completed! 🎉",
        description: `+${level.xp_reward} XP earned!`,
      });

    } catch (error) {
      console.error('Error completing level:', error);
      toast({
        title: "Error",
        description: "Could not complete level",
        variant: "destructive"
      });
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
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
      case 'advanced': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'from-success to-success/70';
      case 2: return 'from-info to-cyber-blue';
      case 3: return 'from-warning to-gold';
      case 4: return 'from-xp to-primary';
      default: return 'from-muted to-muted-foreground';
    }
  };

  return (
    <div className="container px-4 md:px-6 py-6 md:py-8 space-y-8 max-w-7xl mx-auto">
      {/* Header with Stats */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">Training Center</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Master your skills with AI-powered training programs
            </p>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-3 md:flex gap-2 md:gap-4 w-full md:w-auto">
            <Card className="glass-card">
              <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-xp flex items-center justify-center flex-shrink-0">
                  <Star className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold tracking-wider">Level</p>
                  <p className="text-lg md:text-2xl font-bold">{userLevel}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-premium flex items-center justify-center flex-shrink-0">
                  <Flame className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold tracking-wider">Streak</p>
                  <p className="text-lg md:text-2xl font-bold">{streak}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-skill flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold tracking-wider">XP</p>
                  <p className="text-lg md:text-2xl font-bold">{userXP}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* XP Progress Bar */}
        <Card className="bg-gradient-card border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">Level {userLevel} Progress</span>
              <span className="text-sm text-muted-foreground">{userXP % 500}/500 XP to next level</span>
            </div>
            <Progress value={xpProgress} className="h-3 bg-muted" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="interactive" className="rounded-lg data-[state=active]:bg-gradient-premium data-[state=active]:text-primary ">
            <Trophy className="h-4 w-4 mr-2" />
            Skill Tree
          </TabsTrigger>
          <TabsTrigger value="exercises" className="rounded-lg data-[state=active]:bg-gradient-premium data-[state=active]:text-primary">
            <Target className="h-4 w-4 mr-2" />
            Exercise Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-6">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl font-bold">Your Potential Skill Tree</CardTitle>
              <CardDescription>Master fundamental nodes to unlock elite training programs</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {isLoadingTraining ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {skills.map((skill) => {
                    const unlocked = isSkillUnlocked(skill.order_index);
                    const progress = getSkillProgress(skill.id);
                    const levels = getLevelsForSkill(skill.id);
                    const completedCount = progress?.completed_levels.length || 0;
                    const isFullyCompleted = progress?.is_completed;

                    return (
                      <button
                        key={skill.id}
                        onClick={() => unlocked && setSelectedSkill(skill)}
                        disabled={!unlocked}
                        className={`group relative p-4 md:p-8 rounded-3xl border-2 transition-all duration-300 text-center flex flex-col items-center gap-2 md:gap-4 ${unlocked
                          ? 'bg-white border-slate-100 hover:border-primary hover:shadow-2xl hover:-translate-y-1'
                          : 'bg-slate-50 border-transparent opacity-60 cursor-not-allowed'
                          } ${isFullyCompleted ? 'ring-4 ring-primary/10 border-primary' : ''}`}
                      >
                        <div className={`text-5xl transition-transform group-hover:scale-110 ${!unlocked && 'grayscale'}`}>
                          {skill.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{skill.name}</h3>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-1">{skill.category}</p>
                        </div>

                        {unlocked ? (
                          <div className="w-full mt-2">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5 px-1">
                              <span>PROGRESS</span>
                              <span>{Math.round((completedCount / (levels.length || 1)) * 100)}%</span>
                            </div>
                            <Progress value={(completedCount / (levels.length || 1)) * 100} className="h-1.5" />
                            {isFullyCompleted && (
                              <div className="absolute top-4 right-4 text-primary bg-primary/10 p-1.5 rounded-full">
                                <CheckCircle className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 text-slate-300">
                            <Lock className="h-6 w-6" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Skill View Modal/Section could go here */}
          {selectedSkill && (
            <div ref={skillDetailsRef}>
              <Card className="mt-8 border-2 border-primary/20 bg-white p-8 rounded-[2rem] shadow-xl animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 space-y-4">
                    <div className="text-7xl mb-4">{selectedSkill.icon}</div>
                    <h2 className="text-3xl font-bold">{selectedSkill.name}</h2>
                    <p className="text-slate-600 leading-relaxed font-medium">{selectedSkill.description}</p>
                    <Button variant="outline" onClick={() => setSelectedSkill(null)} className="w-full rounded-2xl">
                      Back to Tree
                    </Button>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Available Training Tiers</h3>
                    <div className="grid gap-3">
                      {getLevelsForSkill(selectedSkill.id).map((level) => {
                        const unlocked = isLevelUnlocked(selectedSkill.id, level.level_order);
                        const isCompleted = getSkillProgress(selectedSkill.id)?.completed_levels.includes(level.level_name);

                        return (
                          <div
                            key={level.id}
                            className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${unlocked
                              ? 'border-slate-100 bg-white hover:border-primary/30'
                              : 'border-transparent bg-slate-50 opacity-40'
                              }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${isCompleted ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                {isCompleted ? <CheckCircle className="h-6 w-6" /> : level.level_order}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 capitalize">{level.level_name} Tier</p>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{level.video_title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-primary">+{level.xp_reward} XP</span>
                              <Button
                                size="sm"
                                disabled={!unlocked}
                                className="rounded-xl px-6"
                                onClick={() => {
                                  setSelectedLevel(level);
                                  setShowVideoModal(true);
                                }}
                              >
                                {isCompleted ? 'Review' : 'Train'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="exercises" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Categories</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {['all', 'passing', 'technical', 'dribbling', 'shooting', 'defensive', 'physical', 'mental'].map(cat => (
                    <Button
                      key={cat}
                      variant={categoryFilter === cat ? 'default' : 'ghost'}
                      onClick={() => setCategoryFilter(cat)}
                      className="justify-start text-xs font-bold uppercase tracking-widest px-4 h-10 rounded-xl"
                    >
                      {cat}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skillLevels
                  .filter(level => {
                    if (categoryFilter === 'all') return true;
                    const skill = skills.find(s => s.id === level.skill_id);
                    return skill?.category.toLowerCase() === categoryFilter.toLowerCase();
                  })
                  .map(level => {
                    const skill = skills.find(s => s.id === level.skill_id);
                    const isCompleted = getSkillProgress(skill?.id || '')?.completed_levels.includes(level.level_name);

                    return (
                      <Card
                        key={level.id}
                        className="group overflow-hidden border-slate-100 hover:border-primary/50 transition-all cursor-pointer hover:shadow-xl rounded-3xl"
                        onClick={() => {
                          setSelectedLevel(level);
                          setShowVideoModal(true);
                        }}
                      >
                        <div className="aspect-video bg-slate-900 relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-10 w-10 text-white/50 group-hover:scale-125 group-hover:text-primary transition-all duration-300" />
                          </div>
                          {isCompleted && (
                            <div className="absolute top-3 right-3 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                              <CheckCircle className="h-3 w-3" />
                            </div>
                          )}
                          <Badge className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md border-none text-[10px] font-bold uppercase">
                            {level.duration_minutes} MIN
                          </Badge>
                        </div>
                        <CardHeader className="p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{skill?.icon}</span>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                              {level.level_name}
                            </Badge>
                          </div>
                          <CardTitle className="text-sm font-bold line-clamp-2 leading-tight">
                            {level.video_title}
                          </CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary pt-2">
                            {skill?.name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-5 pb-5 pt-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">+{level.xp_reward} XP</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          </div>
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

      {/* Video Modal UI */}
      {
        selectedLevel && (
          <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-900 border-none shadow-2xl rounded-[2.5rem]">
              <div className="aspect-video w-full">
                {/* Replace URL with proper embed if needed */}
                <iframe
                  src={selectedLevel.youtube_url.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                  title={selectedLevel.video_title}
                />
              </div>
              <div className="p-8 bg-white space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedLevel.video_title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest">
                        {selectedLevel.level_name} tier
                      </Badge>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{selectedLevel.duration_minutes} Minutes</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">REWARD</p>
                    <p className="text-2xl font-bold">+{selectedLevel.xp_reward} XP</p>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ExternalLink className="h-4 w-4" />
                    <a href={selectedLevel.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
                      Watch on YouTube
                    </a>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowVideoModal(false)} className="rounded-2xl px-8">
                      Close
                    </Button>
                    <Button
                      className="rounded-2xl px-12 shadow-xl shadow-primary/20"
                      onClick={() => {
                        completeLevel(selectedLevel.id, selectedLevel.skill_id, selectedLevel.level_name);
                        setShowVideoModal(false);
                      }}
                    >
                      Mark as Completed
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )
      }
    </div >
  );
};

export default Training;
