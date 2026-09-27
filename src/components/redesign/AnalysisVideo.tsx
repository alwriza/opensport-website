import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDemoContext } from "@/demo";
import { useDesignCopy } from "@/hooks/useDesignCopy";

export type AnalysisVideoRecord = { id: string; filename: string; storage_path?: string; };

export function AnalysisVideo({ video, onUpload, onOpenResults, emptyMessage, title, showCaption = true }: {
  video?: AnalysisVideoRecord; onUpload?: () => void; onOpenResults?: () => void; emptyMessage?: string; title?: string; showCaption?: boolean;
}) {
  const copy = useDesignCopy();
  const demo = useDemoContext();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { data: url, isLoading, isError, refetch } = useQuery({
    queryKey: ["video-playback", video?.id, !!demo],
    enabled: !!video,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      if (!video) return null;
      if (demo) {
        const sample = demo.videos.find(item => item.id === video.id);
        return sample ? `/${sample.storage_path}` : null;
      }
      let path = video.storage_path;
      if (!path) {
        const { data, error } = await supabase.from("videos").select("storage_path").eq("id", video.id).single();
        if (error) throw error;
        path = data.storage_path;
      }
      const { data, error } = await supabase.storage.from("videos").createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  return <section className="design-analysis-video">
    <div className="design-section-heading"><h2>{title || copy("Analysis video")}</h2></div>
    <div className="design-video-frame">
      {!video ? <div className="design-video-message"><Video /><p>{emptyMessage || copy("Upload a video to get your first technique breakdown.")}</p>{onUpload && <button className="design-button" onClick={onUpload}>{copy("Upload video")}</button>}</div>
        : isLoading ? <Loader2 className="animate-spin" aria-label={copy("Loading video")} />
        : isError || !url || failedUrl === url ? <div className="design-video-message"><p>{copy("Could not load the video.")}</p><button className="design-link" onClick={() => { setFailedUrl(null); void refetch(); }}>{copy("Try again")}</button></div>
        : <video key={url} src={url} controls playsInline preload="metadata" onError={() => setFailedUrl(url)} aria-label={video.filename} />}
    </div>
    {video && showCaption && <div className="design-video-caption"><span className="design-mono">{video.filename}</span>{onOpenResults && <button className="design-link" onClick={onOpenResults}>{copy("Full report →")}</button>}</div>}
  </section>;
}
