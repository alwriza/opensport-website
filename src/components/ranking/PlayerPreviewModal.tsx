import { useDesignCopy } from "@/hooks/useDesignCopy";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MetricList, type ScoreValues } from "@/components/redesign/primitives";
import type { RankingPlayer } from "@/types/ranking";
import { supabase } from "@/integrations/supabase/client";
import { useDemoContext } from "@/demo";

export function PlayerPreviewModal({ player, isOpen, onClose, onCompare, selectedForComparison }: {
  player: RankingPlayer | null; isOpen: boolean; onClose: () => void; onCompare: (id: string) => void; selectedForComparison: boolean;
}) {
  const demo = useDemoContext();
  const copy = useDesignCopy();
  const { data: analysis, isLoading, isError } = useQuery<ScoreValues | null>({
    queryKey: ["ranking-player-analysis", player?.id, !!demo],
    enabled: isOpen && !!player,
    queryFn: async () => {
      if (!player) return null;
      if (demo) return demo.roster.find(person => person.name === player.name)?.metrics ?? null;
      const { data: videos, error } = await supabase.from("videos").select("id").eq("user_id", player.id).eq("status", "completed");
      if (error) throw error;
      if (!videos?.length) return null;
      const { data, error: analysisError } = await supabase.from("analyses").select("stability, power, technique, balance").in("video_id", videos.map(video => video.id)).order("overall", { ascending: false }).limit(1).maybeSingle();
      if (analysisError) throw analysisError;
      return data;
    },
  });
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{player?.name}</DialogTitle>
      </DialogHeader>
      {player && <>
        <p className="design-eyebrow">{player.position} · {player.age != null ? `U${player.age}` : "Age not set"} · {player.city || "City not set"}</p>
        <div className="flex justify-between border-y py-5">
          <div>
            <span className="design-eyebrow">Best score</span>
            <p className="design-mono text-4xl mt-2">{player.aiScore.toFixed(1)}<small className="text-sm text-muted-foreground"> /100</small></p>
          </div>
          <div>
            <span className="design-eyebrow">Rank</span>
            <p className="design-mono text-4xl mt-2">{player.rank}</p>
          </div>
        </div>
        {isLoading ? <Loader2 className="animate-spin my-4" /> : analysis ? <MetricList scores={analysis} /> : <p className="text-sm text-muted-foreground">{isError ? "Could not load the technique breakdown." : "No detailed analysis available."}</p>}
        <div className="flex gap-3">
          <button className="design-button design-button-outline" onClick={() => onCompare(player.id)}>{copy(selectedForComparison ? "Remove from comparison" : "Compare")}</button>
          <Link className="design-button flex-1" to={`${demo ? "/demo" : ""}/player/${player.id}`} onClick={onClose}>{copy("Open profile →")}</Link>
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}
