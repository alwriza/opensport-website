import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoContext } from "@/demo";

export function useTrainingStats(userId: string | undefined) {
  const demo = useDemoContext();

  return useQuery({
    queryKey: ['training-stats', userId],
    queryFn: async () => {
      if (demo) return demo.trainingStats;
      if (!userId) return null;
      const { data: progress } = await supabase
        .from('player_progress')
        .select('*')
        .eq('player_id', userId)
        .maybeSingle();
      const { data: skillProgress } = await supabase
        .from('player_skill_progress')
        .select('*')
        .eq('player_id', userId);
      return { progress, skills: skillProgress || [] };
    },
    enabled: !!userId || !!demo,
  });
}
