import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoContext } from "@/demo";

export function useLatestAnalysis(videoId: string | undefined) {
  const demo = useDemoContext();

  return useQuery({
    queryKey: ['analysis', videoId],
    queryFn: async () => {
      if (demo) return demo.latestAnalysis;
      if (!videoId) return null;
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('video_id', videoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!videoId || !!demo,
  });
}

export function useLatestRecommendations(scores: any, userId: string | undefined) {
  const demo = useDemoContext();

  return useQuery({
    queryKey: ['latest-recommendations', scores?.id],
    queryFn: async () => {
      if (demo) return demo.latestRecommendations as any[];
      if (!userId || !scores) return [];
      const skills = ['Balance & Core', 'Speed & Acceleration', 'Shooting Precision'];
      const results = [];
      for (const skillName of skills) {
        const { data: skillData } = await supabase
          .from('skills')
          .select('id')
          .eq('name', skillName)
          .single();
        if (skillData) {
          const { data: levels } = await supabase
            .from('skill_levels')
            .select('*')
            .eq('skill_id', (skillData as any).id)
            .order('level_order', { ascending: true });
          if (levels && levels.length > 0) results.push(levels[0]);
        }
      }
      return results;
    },
    enabled: !!userId || !!demo,
  });
}
