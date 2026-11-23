import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { researchErrorText, useAddMatch, type NewMatch } from "@/hooks/useResearch";
import { CAMERA_TYPE_LABEL, fmtTime } from "@/lib/research/keymap";
import { parseYouTubeId, youtubeErrorText, type YTPlayer } from "@/lib/research/youtube";
import { YouTubePlayer } from "./YouTubePlayer";

type Choices = Pick<NewMatch, "format" | "camera_type" | "quality" | "surface" | "lighting">;

const OPTIONS: { [K in keyof Choices]: { label: string; items: Record<Choices[K], string> } } = {
  format: { label: "Формат", items: { "11x11": "11 на 11", "8x8": "8 на 8", "7x7": "7 на 7" } },
  camera_type: { label: "Камера", items: CAMERA_TYPE_LABEL },
  quality: { label: "Качество", items: { "720p": "720p", "1080p": "1080p", "4k": "4K" } },
  surface: { label: "Покрытие", items: { artificial: "искусственное", natural: "натуральное" } },
  lighting: { label: "Свет", items: { day: "день", floodlights: "прожекторы" } },
};

/** Segment the tool creates: from 2 to 12 minutes after kickoff (see the migration). */
const NEEDED_AFTER_KICKOFF_S = 720;

export function AddMatchForm() {
  const { toast } = useToast();
  const addMatch = useAddMatch();

  const [url, setUrl] = useState("");
  const [player, setPlayer] = useState<YTPlayer | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [kickoff, setKickoff] = useState<number | null>(null);
  const [choices, setChoices] = useState<Partial<Choices>>({});
  const [league, setLeague] = useState("");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [notes, setNotes] = useState("");

  const videoId = parseYouTubeId(url);

  const changeUrl = (value: string) => {
    setUrl(value);
    setPlayer(null);
    setDuration(null);
    setVideoError(null);
    setKickoff(null);
  };

  const reset = () => {
    changeUrl("");
    setChoices({});
    setLeague("");
    setTeamA("");
    setTeamB("");
    setNotes("");
  };

  const tooShort = duration !== null && kickoff !== null && kickoff + NEEDED_AFTER_KICKOFF_S > duration;
  const missing = [
    !videoId && "ссылка",
    duration === null && "видео не загрузилось",
    kickoff === null && "начало игры",
    !league.trim() && "лига",
    !teamA.trim() && "цвет команды A",
    !teamB.trim() && "цвет команды B",
    ...(Object.keys(OPTIONS) as (keyof Choices)[]).filter((k) => !choices[k]).map((k) => OPTIONS[k].label.toLowerCase()),
  ].filter(Boolean) as string[];
  const canSubmit = missing.length === 0 && !videoError && !tooShort && !addMatch.isPending;

  const submit = () => {
    if (!canSubmit || !videoId || duration === null || kickoff === null) return;
    addMatch.mutate(
      {
        youtube_id: videoId,
        url: url.trim(),
        duration_s: duration,
        league,
        team_a_color: teamA,
        team_b_color: teamB,
        kickoff_s: kickoff,
        notes,
        ...(choices as Choices),
      },
      {
        onSuccess: (id) => {
          toast({ title: `Матч ${id} добавлен`, description: "Он появился в таблице ниже." });
          reset();
        },
        onError: (e) => toast({ title: "Не удалось добавить", description: researchErrorText(e), variant: "destructive" }),
      },
    );
  };

  return (
    <div className="grid gap-6 rounded-lg border p-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="research-url">Ссылка на YouTube</Label>
          <Input id="research-url" value={url} onChange={(e) => changeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
          {url.trim() && !videoId && <p className="text-sm text-destructive">Это не ссылка на видео YouTube.</p>}
        </div>

        {videoId && (
          <>
            <YouTubePlayer
              videoId={videoId}
              startS={0}
              controls
              onReady={(p) => {
                setPlayer(p);
                const d = p.getDuration();
                if (d > 0) setDuration(d);
                else setVideoError("Не удалось узнать длину видео. Прямые трансляции не подходят — нужна запись.");
              }}
              onError={(code) => setVideoError(youtubeErrorText(code))}
              onLoadFailed={setVideoError}
            />
            {videoError && (
              <Alert variant="destructive"><AlertDescription>{videoError}</AlertDescription></Alert>
            )}
            {duration !== null && !videoError && (
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  Длина видео: {fmtTime(duration)}. Поставьте видео на первый удар с центра поля и нажмите кнопку.
                </p>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="secondary" disabled={!player} onClick={() => player && setKickoff(player.getCurrentTime())}>
                    Начало игры
                  </Button>
                  <span className="font-mono text-sm">{kickoff === null ? "не отмечено" : fmtTime(kickoff)}</span>
                </div>
                {tooShort && (
                  <p className="text-sm text-destructive">После начала игры в видео должно оставаться не меньше 12 минут.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="research-league">Лига или турнир</Label>
          <Input id="research-league" value={league} onChange={(e) => setLeague(e.target.value)} placeholder="Например: любительская лига Алматы" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(OPTIONS) as (keyof Choices)[]).map((key) => (
            <div key={key} className="space-y-1.5">
              <Label>{OPTIONS[key].label}</Label>
              <Select value={choices[key] ?? ""} onValueChange={(v) => setChoices((c) => ({ ...c, [key]: v }))}>
                <SelectTrigger><SelectValue placeholder="выберите" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OPTIONS[key].items).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="research-team-a">Цвет формы команды A</Label>
            <Input id="research-team-a" value={teamA} onChange={(e) => setTeamA(e.target.value)} placeholder="белые" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="research-team-b">Цвет формы команды B</Label>
            <Input id="research-team-b" value={teamB} onChange={(e) => setTeamB(e.target.value)} placeholder="красные" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="research-notes">Заметки (необязательно)</Label>
          <Textarea id="research-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <Button className="w-full" disabled={!canSubmit} onClick={submit}>
          {addMatch.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Добавить матч
        </Button>
        {missing.length > 0 && url.trim() && (
          <p className="text-sm text-muted-foreground">Не хватает: {missing.join(", ")}.</p>
        )}
      </div>
    </div>
  );
}
