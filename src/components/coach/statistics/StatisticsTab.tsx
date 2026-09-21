import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useExtendedPlayerStats, useCoachSquad } from "@/hooks/useCoachData";
import type { ExtendedPlayerStats } from "@/types/coach";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";

type SortDir = "asc" | "desc";

const GROUPS: { label: string; columns: { key: keyof ExtendedPlayerStats; label: string }[] }[] = [
    { label: "MATCHES", columns: [
        { key: "games", label: "G" }, { key: "starts", label: "GS" }, { key: "minutes", label: "MIN" },
        { key: "wins", label: "W" }, { key: "draws", label: "D" }, { key: "losses", label: "L" },
    ]},
    { label: "ATTACK", columns: [
        { key: "goals", label: "G" }, { key: "assists", label: "A" }, { key: "shots", label: "SH" }, { key: "shots_on_target", label: "SoT" },
    ]},
    { label: "DISCIPLINE", columns: [
        { key: "yellow_cards", label: "YC" }, { key: "red_cards", label: "RC" },
    ]},
    { label: "TRAINING", columns: [
        { key: "training_sessions", label: "SES" }, { key: "training_minutes", label: "MIN" }, { key: "exercises_completed", label: "EX" },
    ]},
    { label: "OPENSPORT AI", columns: [
        { key: "ai_score", label: "AI" }, { key: "ai_passing", label: "PAS" }, { key: "ai_shooting", label: "SHO" },
        { key: "ai_dribbling", label: "DRB" }, { key: "ai_balance", label: "BAL" }, { key: "ai_stability", label: "STA" },
        { key: "improvement_pct", label: "Δ%" },
    ]},
];

const ALL_COLUMNS = GROUPS.flatMap(g => g.columns);

export function StatisticsTab({ teamId }: { teamId?: string }) {
    const { t } = useTranslation("dashboard");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<keyof ExtendedPlayerStats>("games");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const { data: extendedStats = [], isLoading } = useExtendedPlayerStats(teamId);

    const stats = useMemo(() => {
        let list = [...extendedStats];
        if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        list.sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;
            const av = (a as any)[sortField] ?? 0;
            const bv = (b as any)[sortField] ?? 0;
            return (av < bv ? -1 : 1) * dir;
        });
        return list;
    }, [extendedStats, search, sortField, sortDir]);

    const toggleSort = (field: keyof ExtendedPlayerStats) => {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("desc"); }
    };

    const getValColor = (val: number, field: keyof ExtendedPlayerStats) => {
        if (field === "improvement_pct") return val >= 0 ? "text-emerald-400" : "text-destructive";
        if (["yellow_cards", "red_cards", "losses"].includes(field)) {
            if (val > 3) return "text-destructive";
            if (val > 1) return "text-warning";
            return "text-muted-foreground";
        }
        if (val >= 80) return "text-primary";
        if (val >= 60) return "text-warning";
        return "text-muted-foreground";
    };

    const formatVal = (val: number, field: keyof ExtendedPlayerStats) => {
        if (field === "improvement_pct") return `${val >= 0 ? "+" : ""}${val}%`;
        if (field === "minutes" || field === "training_minutes") return val;
        return val;
    };

    return (
        <div className="space-y-6">
            <div className="relative max-w-sm">
                <Input
                    placeholder={t("coach.searchPlayers")}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-surface-1 border-border"
                />
            </div>

            <Card className="bg-card border-border shadow-xl shadow-black/20 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-surface-2">
                                    <th rowSpan={2} className="p-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground min-w-[160px] border-r border-border">{t("coach.squad.player")}</th>
                                    <th rowSpan={2} className="p-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-r border-border">{t("coach.squad.pos")}</th>
                                    {GROUPS.map(group => (
                                        <th key={group.label} colSpan={group.columns.length} className="p-2 text-center text-[9px] font-semibold uppercase tracking-widest text-primary bg-primary/5 border-r border-border">
                                            {group.label}
                                        </th>
                                    ))}
                                </tr>
                                <tr className="border-b border-border bg-surface-2">
                                    {ALL_COLUMNS.map(col => (
                                        <th key={col.key} className="p-2 text-center">
                                            <button
                                                onClick={() => toggleSort(col.key)}
                                                className="flex items-center justify-center gap-0.5 mx-auto text-[9px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {col.label}
                                                {sortField === col.key ? (
                                                    sortDir === "asc" ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />
                                                ) : <div className="h-2.5 w-2.5" />}
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.map(player => (
                                    <tr key={player.player_id} className="hover:bg-surface-2 transition-colors">
                                        <td className="p-3 border-r border-border">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-7 w-7 border border-border">
                                                    <AvatarFallback className="bg-primary/20 text-primary text-[10px]">{player.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-bold text-foreground text-sm">{player.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center border-r border-border">
                                            <Badge variant="outline" className="border-border text-muted-foreground bg-surface-2 text-[10px]">{player.position}</Badge>
                                        </td>
                                        {ALL_COLUMNS.map(col => {
                                            const val = (player as any)[col.key] ?? 0;
                                            return (
                                                <td key={col.key} className={`p-2 text-center text-sm tabular-nums font-medium ${getValColor(val, col.key)}`}>
                                                    {formatVal(val, col.key)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {stats.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground text-sm">{t("coach.rosterTable.noPlayers")}</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
