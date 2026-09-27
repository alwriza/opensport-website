import { SkillIcon } from "@/components/training/SkillIcon";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDemoContext } from "@/demo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";
import { Play, Target, Loader2, Lock, CheckCircle, Trophy, ChevronRight, ExternalLink, Clock, Users } from "lucide-react";

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
  const { t } = useTranslation(["training", "common"]);
  const { user, isLoaded } = useCurrentUser();
  const demo = useDemoContext();
  const { toast } = useToast();

  // Existing state for library and analysis

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
  const [coachAssignments, setCoachAssignments] = useState<any[]>([]);
  const [assignment, setAssignment] = useState<(typeof coachAssignments)[number] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchParams] = useSearchParams();
  const skillDetailsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when skill is selected
  useEffect(() => {
    if (selectedSkill && skillDetailsRef.current) {
      const navbarOffset = 24;
      const elementPosition = skillDetailsRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, [selectedSkill]);

  // Handle URL parameters for auto-opening
  useEffect(() => {
    const skillParam = searchParams.get('skill');
    const levelParam = searchParams.get('level');
    const tabParam = searchParams.get('tab');

    if (tabParam === 'exercises' || tabParam === 'interactive') {
      setActiveTab(tabParam);
    }

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

  // Demo mode: fill all state from demo data
  useEffect(() => {
    if (!demo) return;
    setSkills(demo.skills);
    setSkillLevels(demo.skillLevels);
    setPlayerProgress(demo.trainingStats.progress as any);
    setSkillProgress(demo.trainingStats.skills as any[]);
    setDbUserId("demo-user-id");
    setIsLoadingTraining(false);
  }, [demo]);

  // Pre-calculated stats for UI
  const userXP = playerProgress?.total_xp || 0;
  const userLevel = playerProgress?.level || 1;
  const streak = playerProgress?.current_streak || 0;
  const xpProgress = (userXP % 500 / 500) * 100;

  // 1. Fetch DB User ID from Clerk ID
  useEffect(() => {
    if (demo) return;
    const getDbUserId = async () => {
      if (!isLoaded || !user) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (error) throw error;
        if (data) setDbUserId((data as any).id);
      } catch (error) {
        console.error("Error fetching db user id:", error);
      }
    };
    getDbUserId();
  }, [isLoaded, user]);

  // 2. Fetch all Training Data
  useEffect(() => {
    if (demo) return;
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

  // 3. Fetch Coach Assignments
  useEffect(() => {
    if (demo) return;
    const fetchAssignments = async () => {
      if (!dbUserId) return;
      try {
        const { data, error } = await supabase
          .from("training_session_players")
          .select("*, training_sessions(*, training_session_exercises(*, exercises(name, description)))")
          .eq("player_id", dbUserId)
          .eq("status", "assigned")
          .order("created_at", { ascending: false });
        if (!error && data) setCoachAssignments(data);
      } catch (error) { console.error("Could not load assigned training", error); }
    };
    fetchAssignments();
  }, [dbUserId, demo]);

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
    if (demo) { toast({ title: "Demo Mode", description: "Not available in demo", variant: "destructive" }); return; }
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
      const completedLevels: any[] = [...(currentProgress?.completed_levels || [])];

      if (!completedLevels.includes(levelName)) {
        completedLevels.push(levelName);
      }

      const allLevelsCompleted = completedLevels.length === 3;

      if (currentProgress) {
        // @ts-ignore
        await (supabase
          .from('player_skill_progress' as any) as any)
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

      // Use local date to avoid timezone issues
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
      const lastActivity = playerProgress?.last_activity_date;
      let newStreak = playerProgress?.current_streak || 0;

      if (!lastActivity) {
        newStreak = 1;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

        if (lastActivity === yesterdayStr) {
          newStreak += 1;
        } else if (lastActivity !== today) {
          newStreak = 1;
        }
      }

      const longestStreak = Math.max(newStreak, playerProgress?.longest_streak || 0);

      // @ts-ignore
      await (supabase
        .from('player_progress' as any) as any)
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
        title: t("toasts.levelCompleted.title"),
        description: t("toasts.levelCompleted.description", { xp: level.xp_reward }),
      });

    } catch (error) {
      console.error('Error completing level:', error);
      toast({
        title: t("common:errors.generic"),
        description: t("toasts.error.completeLevel"),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="design-page design-secondary-page space-y-8">
      {/* Header with Stats */}
      <div className="space-y-6">
        <div className="design-training-header flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="editorial-eyebrow mb-3">OPENSPORT / TRAINING</p>
            <h1 className="mb-3 text-4xl font-extrabold uppercase tracking-[-.04em] md:text-6xl">{t("header.title")}</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {t("header.subtitle")}
            </p>
          </div>

          <div className="design-training-stats">
            <div><span className="design-eyebrow">{t("stats.level")}</span><strong>{userLevel}</strong></div>
            <div><span className="design-eyebrow">{t("stats.streak")}</span><strong>{streak}</strong></div>
            <div><span className="design-eyebrow">{t("stats.xp")}</span><strong>{userXP}</strong></div>
          </div>
        </div>
        <div className="pb-6 border-b">
          <div className="flex items-center justify-between mb-3 text-sm"><span>{t("progress.levelProgress", { level:userLevel })}</span><span className="design-mono text-xs text-muted-foreground">{t("progress.xpToNext", { current:userXP % 500, total:500 })}</span></div>
          <Progress value={xpProgress} className="h-[3px]" />
        </div>
      </div>

      {/* Coach Assignments */}
      {coachAssignments.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t("coachAssignments.title", "Тренировки от тренера")}
            </CardTitle>
            <CardDescription>
              {t("coachAssignments.description", "У вас есть назначенные тренером тренировки")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {coachAssignments.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-sm bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{a.training_sessions?.name || `Session #${a.session_id?.slice(0, 8)}`}</p>
                    <p className="text-xs text-muted-foreground">{a.training_sessions?.description || ""}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setAssignment(a)}>
                  <Play className="h-3.5 w-3.5" />
                  {t("coachAssignments.start", "Начать")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!assignment} onOpenChange={open => { if (!open) setAssignment(null); }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{assignment?.training_sessions?.name || t("coachAssignments.title")}</DialogTitle><DialogDescription>{assignment?.training_sessions?.objective || assignment?.training_sessions?.description}</DialogDescription></DialogHeader>
          <p className="design-eyebrow">{assignment?.training_sessions?.date} · {assignment?.training_sessions?.duration_minutes} min</p>
          {assignment?.training_sessions?.training_session_exercises?.map((exercise: { id:string; duration_minutes:number; notes?:string; exercises?:{ name:string; description:string } }) => <div key={exercise.id} className="design-drill"><span className="design-drill-category">{exercise.duration_minutes} min</span><h3 className="design-drill-title">{exercise.exercises?.name || "Exercise"}</h3><p className="text-sm text-muted-foreground">{exercise.notes || exercise.exercises?.description}</p></div>)}
          <Button variant="outline" onClick={() => setAssignment(null)}>{t("modal.close")}</Button>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start gap-7 rounded-none bg-transparent border-b h-auto p-0">
          <TabsTrigger value="interactive" className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground font-medium">
            <Trophy className="h-4 w-4 mr-2" />
            {t("tabs.skillTree")}
          </TabsTrigger>
          <TabsTrigger value="exercises" className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground font-medium">
            <Target className="h-4 w-4 mr-2" />
            {t("tabs.library")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-6">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl font-bold">{t("skillTree.title")}</CardTitle>
              <CardDescription>{t("skillTree.description")}</CardDescription>
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
                        className={`group relative p-4 md:p-8 rounded-sm border transition-all duration-300 text-center flex flex-col items-center gap-2 md:gap-4 ${unlocked
                          ? 'bg-card border-border hover:border-primary '
                          : 'bg-background/5 border-transparent opacity-40 cursor-not-allowed'
                          } ${isFullyCompleted ? ' border-primary' : ''}`}
                      >
                        <div className={`transition-transform group-hover:scale-110 ${!unlocked && 'grayscale opacity-50'}`}>
                          <SkillIcon icon={skill.icon} size="lg" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{skill.name}</h3>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">{skill.category}</p>
                        </div>

                        {unlocked ? (
                          <div className="w-full mt-2">
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5 px-1">
                              <span>{t("skillTree.progress")}</span>
                              <span>{Math.round((completedCount / (levels.length || 1)) * 100)}%</span>
                            </div>
                            <Progress value={(completedCount / (levels.length || 1)) * 100} className="h-1.5" />
                            {isFullyCompleted && (
                              <div className="absolute top-4 right-4 text-primary bg-primary/10 p-1.5 rounded-none">
                                <CheckCircle className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 text-muted-foreground">
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
            <div ref={skillDetailsRef} className="pb-36">
              <Card className="mt-8 mb-12 border border-primary/20 bg-background p-8 rounded-none animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 space-y-4">
                    <div className="mb-4"><SkillIcon icon={selectedSkill.icon} size="xl" /></div>
                    <h2 className="text-3xl font-bold">{selectedSkill.name}</h2>
                    <p className="text-slate-600 leading-relaxed font-medium">{selectedSkill.description}</p>
                    <Button variant="outline" onClick={() => setSelectedSkill(null)} className="w-full rounded-sm">
                      {t("skillTree.back")}
                    </Button>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("skillTree.availableTiers")}</h3>
                    <div className="grid gap-3">
                      {getLevelsForSkill(selectedSkill.id).map((level) => {
                        const unlocked = isLevelUnlocked(selectedSkill.id, level.level_order);
                        const isCompleted = getSkillProgress(selectedSkill.id)?.completed_levels.includes(level.level_name);

                        return (
                          <div
                            key={level.id}
                            className={`p-5 rounded-sm border flex items-center justify-between transition-all ${unlocked
                              ? 'border-border bg-background hover:border-primary/30'
                              : 'border-transparent bg-secondary/40 opacity-40'
                              }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-sm flex items-center justify-center font-bold ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                                }`}>
                                {isCompleted ? <CheckCircle className="h-6 w-6" /> : level.level_order}
                              </div>
                              <div>
                                <p className="font-bold text-foreground capitalize">{t("skillTree.tier", { name: level.level_name })}</p>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{level.video_title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-primary">+{level.xp_reward} XP</span>
                              <Button
                                size="sm"
                                disabled={!unlocked}
                                className="rounded-sm px-6"
                                onClick={() => {
                                  setSelectedLevel(level);
                                  setShowVideoModal(true);
                                }}
                              >
                                {isCompleted ? t("skillTree.review") : t("skillTree.train")}
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
          <div className="space-y-6">
            <section className="design-library-filters" aria-label={t("library.categories")}>
              <h2 className="design-eyebrow">{t("library.categories")}</h2>
              <div className="design-category-options">
                {['all', 'passing', 'technical', 'dribbling', 'shooting', 'defensive', 'physical', 'mental'].map(cat => <Button key={cat} variant={categoryFilter === cat ? 'default' : 'ghost'} aria-pressed={categoryFilter === cat} onClick={() => setCategoryFilter(cat)} className="text-xs font-semibold px-4 h-10">{t(`library.cat.${cat}`)}</Button>)}
              </div>
            </section>
            <div>
              <div className="design-exercise-grid">
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
                        className="group overflow-hidden border-border hover:border-primary/50 transition-all cursor-pointer rounded-sm"
                        onClick={() => {
                          setSelectedLevel(level);
                          setShowVideoModal(true);
                        }}
                      >
                        <div className="aspect-video bg-secondary relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-10 w-10 text-muted-foreground group-hover:scale-125 group-hover:text-primary transition-all duration-300" />
                          </div>
                          {isCompleted && (
                            <div className="absolute top-3 right-3 bg-primary text-primary-foreground p-1.5 rounded-none ">
                              <CheckCircle className="h-3 w-3" />
                            </div>
                          )}
                          <Badge className="absolute bottom-3 left-3 bg-primary text-primary-foreground border-none text-[10px] font-bold uppercase">
                            {level.duration_minutes} {t("library.min")}
                          </Badge>
                        </div>
                        <CardHeader className="p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <SkillIcon icon={skill?.icon || '⚽'} size="sm" />
                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
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
                            <span className="font-mono text-xs font-medium text-primary">+{level.xp_reward} XP</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          </div>
        </TabsContent>

      </Tabs >

      {/* Video Modal UI */}
      {
        selectedLevel && (
          <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
            <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden bg-background text-foreground border-border rounded-sm">
              <div className="aspect-video w-full">
                {/* Replace URL with proper embed if needed */}
                <iframe
                  src={selectedLevel.youtube_url.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                  title={selectedLevel.video_title}
                />
              </div>
              <div className="p-8 bg-background space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedLevel.video_title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest">
                        {t("skillTree.tier", { name: selectedLevel.level_name })}
                      </Badge>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{selectedLevel.duration_minutes} {t("library.min")}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{t("modal.reward")}</p>
                    <p className="text-2xl font-bold">+{selectedLevel.xp_reward} XP</p>
                  </div>
                </div>

                <div className="h-px bg-secondary" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                    <a href={selectedLevel.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
                      {t("modal.watchOnYoutube")}
                    </a>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowVideoModal(false)} className="rounded-sm px-8">
                      {t("modal.close")}
                    </Button>
                    <Button
                      className="rounded-sm px-12 "
                      onClick={() => {
                        completeLevel(selectedLevel.id, selectedLevel.skill_id, selectedLevel.level_name);
                        setShowVideoModal(false);
                      }}
                    >
                      {t("modal.markCompleted")}
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
