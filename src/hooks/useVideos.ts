import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoContext } from "@/demo";

export function useVideos(userId: string | undefined) {
  const demo = useDemoContext();

  return useQuery({
    queryKey: ['videos', userId],
    queryFn: async () => {
      if (demo) return demo.videos;
      if (!userId) return [];
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId || !!demo,
  });
}
