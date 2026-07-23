import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDemoContext } from "@/demo";

export function useScoreboard() {
  const demo = useDemoContext();

  if (demo) {
    return {
      stats: demo.playerStats as any[],
      loading: false,
    };
  }

  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("player_stats")
          .select("*")
          .order("highest_rating", { ascending: false })
          .limit(50);
        if (error) throw error;
        setStats((data as any) || []);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return { stats, loading };
}
