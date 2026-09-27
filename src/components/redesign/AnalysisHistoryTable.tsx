import { useDesignCopy } from "@/hooks/useDesignCopy";
import { formatDuration } from "@/lib/format";

type HistoryVideo = { id: string; filename: string; uploaded_at: string; duration: number | null; status: string; };

export function AnalysisHistoryTable({ videos, onOpen, emptyMessage }: {
  videos: HistoryVideo[]; onOpen: (id: string) => void; emptyMessage?: string;
}) {
  const copy = useDesignCopy();
  return <div className="design-table-scroll">
    <table className="design-table design-history-table">
      <thead><tr>{["File", "Date", "Length", "Status", "Action"].map(label => <th key={label}>{copy(label)}</th>)}</tr></thead>
      <tbody>{videos.map(video => {
        const ready = video.status === "completed";
        return <tr key={video.id} className={ready ? "design-clickable-row" : ""} tabIndex={ready ? 0 : undefined}
          aria-label={ready ? `${copy("Open")} ${video.filename}` : undefined}
          onClick={ready ? () => onOpen(video.id) : undefined}
          onKeyDown={ready ? event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onOpen(video.id); } } : undefined}>
          <td>{video.filename}</td><td>{new Date(video.uploaded_at).toLocaleDateString()}</td><td className="design-mono">{formatDuration(video.duration)}</td>
          <td className={ready ? "design-status" : video.status === "failed" ? "text-destructive" : "text-muted-foreground"}>{copy(ready ? "Complete" : video.status === "failed" ? "Failed" : "Processing")}</td>
          <td>{ready && <button className="design-link" onClick={event => { event.stopPropagation(); onOpen(video.id); }}>{copy("Open")} →</button>}</td>
        </tr>;
      })}</tbody>
    </table>
    {!videos.length && <div className="design-empty">{emptyMessage || copy("Upload a video to get your first technique breakdown.")}</div>}
  </div>;
}
