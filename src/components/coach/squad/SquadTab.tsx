import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCoachSquad } from "@/hooks/useCoachData";
import type { MetricSource, TeamMember } from "@/types/coach";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

type SortField = "name" | "position" | "age" | "starts" | "appearances" | "goals" | "assists" | "coach_rating";
type SortDir = "asc" | "desc";

const SOURCE_LABELS: Record<MetricSource, string> = { manual: "M", coach: "C", opensport_ai: "AI", import: "I" };
const SOURCE_COLORS: Record<MetricSource, string> = {
    manual: "text-blue-400 bg-blue-400/10", coach: "text-primary bg-primary/10",
    opensport_ai: "text-purple-400 bg-purple-400/10", import: "text-amber-400 bg-amber-400/10",
};

const COLUMNS = [
    { key: "starts", label: "Starts", field: "starts" },
    { key: "appearances", label: "App", field: "appearances" },
    { key: "goals", label: "Goals", field: "goals" },
    { key: "penalties", label: "Pens", field: "penalties" },
    { key: "assists", label: "Assists", field: "assists" },
    { key: "yellow_cards", label: "YC", field: "yellow_cards" },
    { key: "red_cards", label: "RC", field: "red_cards" },
    { key: "coach_rating", label: "Rating", field: "coach_rating" },
];

export function SquadTab({ teamId }: { teamId?: string }) {
    const { t } = useTranslation("dashboard");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [editingCell, setEditingCell] = useState<{ pid: string; field: string } | null>(null);
    const [editValue, setEditValue] = useState("");

    const { data: fetchedSquad = [], isLoading } = useCoachSquad(teamId);
    const [squadData, setSquadData] = useState<TeamMember[]>([]);

    useEffect(() => {
        if (fetchedSquad.length > 0 && squadData.length === 0) {
            setSquadData(fetchedSquad);
        }
    }, [fetchedSquad, squadData.length]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("desc"); }
    };

    const filtered = useMemo(() => {
        let list = [...squadData];
        if (debouncedSearch) list = list.filter(p => p.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
        list.sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;
            const av = (a as any)[sortField] ?? 0;
            const bv = (b as any)[sortField] ?? 0;
            return (av < bv ? -1 : 1) * dir;
        });
        return list;
    }, [squadData, debouncedSearch, sortField, sortDir]);

    const startEdit = (pid: string, field: string, val: number) => {
        setEditingCell({ pid, field });
        setEditValue(String(val));
    };

    const commitEdit = () => {
        if (!editingCell) return;
        const val = parseInt(editValue);
        if (isNaN(val)) { setEditingCell(null); return; }
        setSquadData(prev => prev.map(p =>
            p.id === editingCell.pid
                ? { ...p, [editingCell.field]: val, stat_sources: { ...p.stat_sources, [editingCell.field]: "coach" as MetricSource } }
                : p
        ));
        setEditingCell(null);
    };

    const renderCell = (player: TeamMember, field: string) => {
        const value = (player as any)[field] ?? 0;
        const isEditing = editingCell?.pid === player.id && editingCell?.field === field;
        const source = player.stat_sources?.[field] as MetricSource | undefined;
        return (
            <div className="flex items-center justify-center gap-1.5">
                {isEditing ? (
                    <Input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingCell(null); }}
                        className="w-16 h-8 text-center bg-background border-primary/40 text-sm"
                        autoFocus
                    />
                ) : (
                    <>
                        <span className="text-sm font-medium tabular-nums cursor-pointer hover:text-primary transition-colors" onClick={() => startEdit(player.id, field, value)}>
                            {field === "coach_rating" ? value : value}
                        </span>
                        {source && <span className={`text-[9px] font-bold px-1 rounded ${SOURCE_COLORS[source]}`}>{SOURCE_LABELS[source]}</span>}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("coach.searchPlayers")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card/50 border-white/5" />
            </div>

            <Card className="bg-card border-white/5 shadow-xl shadow-black/20 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-300 min-w-[180px]">{t("coach.squad.player")}</th>
                                    <th className="p-3 text-center">
                                        <button onClick={() => toggleSort("position")} className="flex items-center gap-1 mx-auto text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-primary">
                                            Pos {sortField === "position" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                                        </button>
                                    </th>
                                    <th className="p-3 text-center">
                                        <button onClick={() => toggleSort("age")} className="flex items-center gap-1 mx-auto text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-primary">
                                            Age {sortField === "age" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                                        </button>
                                    </th>
                                    {COLUMNS.map(col => (
                                        <th key={col.key} className="p-3 text-center">
                                            <button onClick={() => toggleSort(col.key as SortField)} className="flex items-center gap-1 mx-auto text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-primary">
                                                {col.label} {sortField === col.key ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                                            </button>
                                        </th>
                                    ))}
                                    <th className="p-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-300">{t("coach.squad.video")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map(player => (
                                    <tr key={player.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border border-white/10">
                                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{player.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-bold text-white text-sm group-hover:text-primary transition-colors">{player.name}</div>
                                                    <span className="text-[10px] text-muted-foreground">#{player.jersey_number}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <Badge variant="outline" className="border-white/10 text-muted-foreground bg-white/5 text-xs">{player.position}</Badge>
                                        </td>
                                        <td className="p-3 text-center text-sm text-muted-foreground">{player.age}</td>
                                        {COLUMNS.map(col => (
                                            <td key={col.key} className="p-3 text-center">{renderCell(player, col.field)}</td>
                                        ))}
                                        <td className="p-3 text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground text-sm">{t("coach.rosterTable.noPlayers")}</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
