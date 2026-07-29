import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoContext } from "@/demo";
import { MockPlayer } from "@/data/mockRanking";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Trophy, Search, SlidersHorizontal, X, ArrowUpDown, ArrowUp, ArrowDown,
    User, Eye, BarChart3, TrendingUp, TrendingDown, Minus, Shield,
    Zap, Activity, Move, Star, Clock, Bookmark, Bell, Users, SortAsc,
    ChevronLeft, ChevronRight, AlertTriangle,
} from "lucide-react";

type SortField = "rank" | "aiScore" | "growth" | "age" | "name" | "totalVideos";
type SortDir = "asc" | "desc";

interface Filters {
    position: string;
    ageGroup: string;
    country: string;
    search: string;
}

export default function Ranking() {
    const { t } = useTranslation("ranking");
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const demo = useDemoContext();

    const { data: rankingPlayers = [] } = useQuery({
        queryKey: ["global-ranking"],
        queryFn: async () => {
            if (demo) {
                const { MOCK_PLAYERS } = await import("@/data/mockRanking");
                return MOCK_PLAYERS;
            }
            const { data, error } = await supabase.from("global_rankings").select("*").order("best_score", { ascending: false }).limit(200);
            if (error) throw error;
            return (data || []).map((r: any, i: number) => ({
                id: r.user_id || `player-${i}`,
                rank: i + 1,
                name: r.name || "Unknown",
                age: r.age || 16,
                position: r.position || "MID",
                team: r.team || null,
                city: r.city || "",
                country: r.country || "",
                avatarUrl: r.avatar_url || null,
                aiScore: r.best_score || 70,
                growth: r.growth ?? 0,
                totalVideos: r.total_analyses || 0,
                lastActive: r.last_active || "recently",
                trend: "stable",
            })) as MockPlayer[];
        },
    });

    const [compareDialogOpen, setCompareDialogOpen] = useState(false);

    const page = parseInt(searchParams.get("page") || "1");
    const tab = searchParams.get("tab") || "rankings";
    const sub = searchParams.get("sub") || "global";
    const sortField = (searchParams.get("sort") as SortField) || "rank";
    const sortDir = (searchParams.get("dir") as SortDir) || "asc";

    const [filters, setFilters] = useState<Filters>({
        position: searchParams.get("position") || "all",
        ageGroup: searchParams.get("ageGroup") || "all",
        country: searchParams.get("country") || "",
        search: searchParams.get("search") || "",
    });
    const [compareIds, setCompareIds] = useState<string[]>([]);
    const [previewPlayer, setPreviewPlayer] = useState<MockPlayer | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const PAGE_SIZE = 20;

    const updateURL = useCallback((updates: Record<string, string>) => {
        const p = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([k, v]) => {
            if (v && v !== "all") p.set(k, v);
            else p.delete(k);
        });
        setSearchParams(p, { replace: true });
    }, [searchParams, setSearchParams]);

    const toggleCompare = (id: string) => {
        setCompareIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const filtered = useMemo(() => {
        let list = [...rankingPlayers];

        if (filters.search) {
            const q = filters.search.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q));
        }
        if (filters.position !== "all") {
            list = list.filter(p => p.position === filters.position);
        }
        if (filters.ageGroup !== "all") {
            list = list.filter(p => {
                const age = p.age;
                switch (filters.ageGroup) {
                    case "U14": return age <= 14;
                    case "U15": return age === 15;
                    case "U16": return age === 16;
                    case "U17": return age === 17;
                    case "U18": return age === 18;
                    case "U19+": return age >= 19;
                    default: return true;
                }
            });
        }
        if (filters.country) {
            const q = filters.country.toLowerCase();
            list = list.filter(p => p.country.toLowerCase().includes(q));
        }

        if (sub === "improved") list.sort((a, b) => b.growth - a.growth);
        else if (sub === "gems") list = list.filter(p => p.totalVideos <= 5 && p.aiScore >= 75);
        else if (sub === "trending") list = list.filter(p => p.trend === "up");

        list.sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;
            switch (sortField) {
                case "rank": return (a.rank - b.rank) * dir;
                case "aiScore": return (a.aiScore - b.aiScore) * dir;
                case "growth": return (a.growth - b.growth) * dir;
                case "age": return (a.age - b.age) * dir;
                case "name": return a.name.localeCompare(b.name) * dir;
                case "totalVideos": return (a.totalVideos - b.totalVideos) * dir;
                default: return 0;
            }
        });

        return list;
    }, [filters, sub, sortField, sortDir]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            updateURL({ dir: sortDir === "asc" ? "desc" : "asc", page: "1" });
        } else {
            updateURL({ sort: field, dir: "desc", page: "1" });
        }
    };

    const SortHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
        <button onClick={() => toggleSort(field)} className={`flex items-center gap-1 hover:text-primary transition-colors ${className}`}>
            {label}
            {sortField === field ? (
                sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
            ) : (
                <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
        </button>
    );

    const rankColor = (score: number) => {
        if (score >= 90) return "text-emerald-400";
        if (score >= 80) return "text-primary";
        if (score >= 70) return "text-amber-400";
        if (score >= 60) return "text-orange-400";
        return "text-red-400";
    };

    const renderStars = (score: number) => {
        const full = Math.floor(score / 20);
        return (
            <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < full ? "text-primary fill-primary" : "text-white/10"}`} />
                ))}
            </div>
        );
    };

    return (
        <div className="container px-4 md:px-6 py-6 md:py-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-gradient flex items-center gap-3">
                        <Trophy className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                        {t("title")}
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg">{t("subtitle")}</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={v => updateURL({ tab: v, page: "1" })}>
                <TabsList className="bg-card/50 border border-white/5 p-1 gap-1">
                    <TabsTrigger value="rankings" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" /> {t("tabs.rankings")}
                    </TabsTrigger>
                    <TabsTrigger value="saved" className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4" /> {t("tabs.saved")}
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" /> {t("tabs.alerts")}
                    </TabsTrigger>
                </TabsList>

                {/* Rankings Tab */}
                <TabsContent value="rankings" className="space-y-6 mt-6">
                    {/* Sub-category pills */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: "global", label: t("sub.global"), icon: Trophy },
                            { key: "improved", label: t("sub.improved"), icon: TrendingUp },
                            { key: "gems", label: t("sub.gems"), icon: Star },
                            { key: "trending", label: t("sub.trending"), icon: BarChart3 },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => updateURL({ sub: key, page: "1" })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                                    sub === key
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                        : "bg-card/50 text-muted-foreground border-white/5 hover:text-foreground hover:border-white/20"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Search + Filters */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("search.placeholder")}
                                value={filters.search}
                                onChange={e => {
                                    setFilters(prev => ({ ...prev, search: e.target.value }));
                                    updateURL({ search: e.target.value, page: "1" });
                                }}
                                className="pl-10 bg-card/50 border-white/5"
                            />
                            {filters.search && (
                                <button
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, search: "" }));
                                        updateURL({ search: "", page: "1" });
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="border-white/5 bg-card/50 gap-2">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    {t("filters.title")}
                                    {(filters.position !== "all" || filters.ageGroup !== "all" || filters.country) && (
                                        <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                                            {[filters.position !== "all", filters.ageGroup !== "all", !!filters.country].filter(Boolean).length}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-full max-w-sm border-r border-white/5 bg-background">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2">
                                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                                        {t("filters.title")}
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="space-y-6 mt-6">
                                    {/* Position */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-muted-foreground">{t("filters.position")}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {[{ value: "all", label: t("filters.allPositions"), icon: Users },
                                              { value: "GK", label: "GK", icon: Shield },
                                              { value: "DEF", label: "DEF", icon: Shield },
                                              { value: "MID", label: "MID", icon: Activity },
                                              { value: "FWD", label: "FWD", icon: Zap },
                                            ].map(({ value, label, icon: Icon }) => (
                                                <button
                                                    key={value}
                                                    onClick={() => {
                                                        setFilters(prev => ({ ...prev, position: value }));
                                                        updateURL({ position: value, page: "1" });
                                                    }}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all ${
                                                        filters.position === value
                                                            ? "bg-primary/20 text-primary border-primary/40"
                                                            : "bg-card/50 text-muted-foreground border-white/5 hover:text-foreground"
                                                    }`}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    {/* Age Group */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-muted-foreground">{t("filters.ageGroup")}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {["all", "U14", "U15", "U16", "U17", "U18", "U19+"].map(age => (
                                                <button
                                                    key={age}
                                                    onClick={() => {
                                                        setFilters(prev => ({ ...prev, ageGroup: age }));
                                                        updateURL({ ageGroup: age, page: "1" });
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                                                        filters.ageGroup === age
                                                            ? "bg-primary/20 text-primary border-primary/40"
                                                            : "bg-card/50 text-muted-foreground border-white/5 hover:text-foreground"
                                                    }`}
                                                >
                                                    {age === "all" ? t("filters.allAges") : age}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    {/* Country */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">{t("filters.country")}</label>
                                        <Input
                                            placeholder={t("filters.countryPlaceholder")}
                                            value={filters.country}
                                            onChange={e => {
                                                setFilters(prev => ({ ...prev, country: e.target.value }));
                                                updateURL({ country: e.target.value, page: "1" });
                                            }}
                                            className="bg-card/50 border-white/5"
                                        />
                                    </div>

                                    <Button
                                        variant="ghost"
                                        className="w-full text-muted-foreground hover:text-foreground"
                                        onClick={() => {
                                            setFilters({ position: "all", ageGroup: "all", country: "", search: "" });
                                            updateURL({ position: "all", ageGroup: "all", country: "", search: "all", page: "1" });
                                        }}
                                    >
                                        {t("filters.reset")}
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-white/5 overflow-hidden bg-card/30 backdrop-blur-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                                        <th className="w-10 p-3 text-center">
                                            <button
                                                onClick={() => {
                                                    if (compareIds.length === paged.length) setCompareIds([]);
                                                    else setCompareIds(paged.map(p => p.id));
                                                }}
                                                className={`w-4 h-4 rounded border transition-all mx-auto ${
                                                    compareIds.length === paged.length && paged.length > 0
                                                        ? "bg-primary border-primary"
                                                        : "border-white/20 hover:border-primary/50"
                                                }`}
                                            >
                                                {compareIds.length === paged.length && paged.length > 0 && (
                                                    <span className="text-[8px] font-bold text-black flex items-center justify-center">✓</span>
                                                )}
                                            </button>
                                        </th>
                                        <th className="w-14 p-3 text-center">
                                            <SortHeader field="rank" label={t("table.rank")} className="justify-center w-full" />
                                        </th>
                                        <th className="p-3 text-left min-w-[220px]">
                                            <SortHeader field="name" label={t("table.player")} />
                                        </th>
                                        <th className="p-3 text-center w-20">
                                            <SortHeader field="age" label={t("table.age")} className="justify-center w-full" />
                                        </th>
                                        <th className="p-3 text-center w-16">{t("table.position")}</th>
                                        <th className="p-3 text-left hidden md:table-cell min-w-[140px]">{t("table.team")}</th>
                                        <th className="p-3 text-left hidden lg:table-cell min-w-[130px]">{t("table.location")}</th>
                                        <th className="p-3 text-center w-24">
                                            <SortHeader field="aiScore" label={t("table.score")} className="justify-center w-full" />
                                        </th>
                                        <th className="p-3 text-center w-20">
                                            <SortHeader field="growth" label={t("table.growth")} className="justify-center w-full" />
                                        </th>
                                        <th className="p-3 text-center w-16">
                                            <SortHeader field="totalVideos" label={t("table.videos")} className="justify-center w-full" />
                                        </th>
                                        <th className="p-3 text-left hidden xl:table-cell w-28">{t("table.lastActive")}</th>
                                        <th className="p-3 text-center w-16">{t("table.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paged.map((player) => {
                                        const isCompareActive = compareIds.includes(player.id);
                                        return (
                                            <tr
                                                key={player.id}
                                                className={`border-b border-white/5 transition-colors hover:bg-white/5 cursor-pointer ${
                                                    isCompareActive ? "bg-primary/5" : ""
                                                }`}
                                                onClick={() => { setPreviewPlayer(player); setPreviewOpen(true); }}
                                            >
                                                <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => toggleCompare(player.id)}
                                                        className={`w-4 h-4 rounded border transition-all ${
                                                            isCompareActive
                                                                ? "bg-primary border-primary"
                                                                : "border-white/20 hover:border-primary/50"
                                                        }`}
                                                    >
                                                        {isCompareActive && (
                                                            <span className="text-[8px] font-bold text-black flex items-center justify-center">✓</span>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`text-sm font-bold ${player.rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                                                        #{player.rank}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-white/10 shrink-0">
                                                            <AvatarImage src={player.avatarUrl || ""} />
                                                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                                                {player.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-foreground truncate">{player.name}</div>
                                                            <div className="text-xs text-muted-foreground md:hidden">
                                                                {player.position} ┬╖ U{player.age}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center text-sm text-muted-foreground">U{player.age}</td>
                                                <td className="p-3 text-center">
                                                    <Badge variant="outline" className="text-xs border-white/10 bg-white/5 font-medium">
                                                        {player.position}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-sm hidden md:table-cell text-muted-foreground">
                                                    {player.team || <span className="text-white/20">тАФ</span>}
                                                </td>
                                                <td className="p-3 text-sm hidden lg:table-cell text-muted-foreground">
                                                    {player.city}, {player.country}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <span className={`text-lg font-black ${rankColor(player.aiScore)}`}>
                                                                    {player.aiScore.toFixed(0)}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="bottom" className="bg-card border-white/10">
                                                                <div className="text-xs space-y-1">
                                                                    <p className="font-medium">{t("tooltip.score")}</p>
                                                                    {renderStars(player.aiScore)}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {player.growth > 0 ? (
                                                            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                                                        ) : player.growth < 0 ? (
                                                            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                                                        ) : (
                                                            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                                                        )}
                                                        <span className={`text-sm font-medium ${
                                                            player.growth > 0 ? "text-emerald-400" :
                                                            player.growth < 0 ? "text-red-400" : "text-muted-foreground"
                                                        }`}>
                                                            {player.growth > 0 ? "+" : ""}{player.growth.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center text-sm text-muted-foreground">{player.totalVideos}</td>
                                                <td className="p-3 text-sm hidden xl:table-cell text-muted-foreground">
                                                    {player.lastActive}
                                                </td>
                                                <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-primary/20 hover:text-primary"
                                                                    onClick={() => navigate(`/player/${player.id}`)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="left" className="bg-card border-white/10">
                                                                <p className="text-xs">{t("tooltip.viewProfile")}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            {t("pagination.showing", { from: (page - 1) * PAGE_SIZE + 1, to: Math.min(page * PAGE_SIZE, filtered.length), total: filtered.length })}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => updateURL({ page: String(page - 1) })}
                                className="border-white/5 bg-card/50 gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                {t("pagination.prev")}
                            </Button>
                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 7) {
                                        pageNum = i + 1;
                                    } else if (page <= 4) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 3) {
                                        pageNum = totalPages - 6 + i;
                                    } else {
                                        pageNum = page - 3 + i;
                                    }
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => updateURL({ page: String(pageNum) })}
                                            className={`w-9 ${
                                                pageNum === page
                                                    ? "bg-primary text-primary-foreground"
                                                    : "border-white/5 bg-card/50"
                                            }`}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => updateURL({ page: String(page + 1) })}
                                className="border-white/5 bg-card/50 gap-1"
                            >
                                {t("pagination.next")}
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Saved Tab */}
                <TabsContent value="saved" className="mt-6">
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Bookmark className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                        <h2 className="text-2xl font-bold text-foreground">{t("saved.empty")}</h2>
                        <p className="text-muted-foreground mt-2 max-w-md">
                            {t("saved.description")}
                        </p>
                    </div>
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="mt-6">
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Bell className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                        <h2 className="text-2xl font-bold text-foreground">{t("alerts.empty")}</h2>
                        <p className="text-muted-foreground mt-2 max-w-md">
                            {t("alerts.description")}
                        </p>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Compare Tray */}
            {compareIds.length >= 2 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl">
                    <div className="container max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-primary text-primary-foreground">
                                {compareIds.length} {t("compare.selected")}
                            </Badge>
                            <div className="flex -space-x-2">
                                {compareIds.slice(0, 5).map(id => {
                                    const p = rankingPlayers.find(x => x.id === id);
                                    if (!p) return null;
                                    return (
                                        <Avatar key={id} className="h-8 w-8 border-2 border-background">
                                            <AvatarFallback className="bg-primary/20 text-primary text-xs">{p.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    );
                                })}
                                {compareIds.length > 5 && (
                                    <div className="h-8 w-8 rounded-full bg-card border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                                        +{compareIds.length - 5}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setCompareIds([])} className="text-muted-foreground">
                                {t("compare.clear")}
                            </Button>
                            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" onClick={() => setCompareDialogOpen(true)}>
                                <BarChart3 className="h-4 w-4" />
                                {t("compare.button")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Preview Sheet */}
            <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
                <SheetContent side="right" className="w-full max-w-md border-l border-white/5 bg-background p-0">
                    {previewPlayer && (
                        <ScrollArea className="h-full">
                            <div className="p-6 space-y-6">
                                {/* Player Header */}
                                <div className="flex flex-col items-center text-center pt-4">
                                    <Avatar className="h-20 w-20 border-2 border-primary/20 mb-4">
                                        <AvatarImage src={previewPlayer.avatarUrl || ""} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                                            {previewPlayer.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="text-xl font-bold">{previewPlayer.name}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                        <Badge variant="outline" className="border-white/10">{previewPlayer.position}</Badge>
                                        <span>U{previewPlayer.age}</span>
                                        <span>{previewPlayer.city}</span>
                                    </div>
                                    {previewPlayer.team && (
                                        <p className="text-sm text-muted-foreground mt-1">{previewPlayer.team}</p>
                                    )}
                                </div>

                                {/* Score Highlight */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-primary/10 p-4 rounded-xl text-center border border-primary/20">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("preview.score")}</p>
                                        <p className={`text-3xl font-black ${rankColor(previewPlayer.aiScore)}`}>
                                            {previewPlayer.aiScore.toFixed(0)}
                                        </p>
                                    </div>
                                    <div className="bg-card/50 p-4 rounded-xl text-center border border-white/5">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("preview.rank")}</p>
                                        <p className="text-3xl font-bold text-foreground">#{previewPlayer.rank}</p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("preview.stats")}</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-card/30 p-3 rounded-lg border border-white/5">
                                            <p className="text-xs text-muted-foreground">{t("preview.growth")}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                {previewPlayer.growth > 0 ? (
                                                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-red-400" />
                                                )}
                                                <span className="text-lg font-bold">{previewPlayer.growth > 0 ? "+" : ""}{previewPlayer.growth.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="bg-card/30 p-3 rounded-lg border border-white/5">
                                            <p className="text-xs text-muted-foreground">{t("preview.videos")}</p>
                                            <p className="text-lg font-bold mt-1">{previewPlayer.totalVideos}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Skills Breakdown */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("preview.skills")}</h4>
                                    {[
                                        { label: t("scores.stability"), value: Math.min(100, previewPlayer.aiScore + Math.round(Math.random() * 10 - 5)), icon: Shield, color: "text-emerald-400" },
                                        { label: t("scores.power"), value: Math.min(100, previewPlayer.aiScore + Math.round(Math.random() * 10 - 5)), icon: Zap, color: "text-amber-400" },
                                        { label: t("scores.technique"), value: Math.min(100, previewPlayer.aiScore + Math.round(Math.random() * 10 - 5)), icon: Activity, color: "text-blue-400" },
                                        { label: t("scores.balance"), value: Math.min(100, previewPlayer.aiScore + Math.round(Math.random() * 10 - 5)), icon: Move, color: "text-purple-400" },
                                    ].map(({ label, value, icon: Icon, color }) => (
                                        <div key={label} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-full">
                                                    <Icon className={`h-4 w-4 ${color}`} />
                                                </div>
                                                <span className="font-medium">{label}</span>
                                            </div>
                                            <Badge variant="outline" className="text-base px-3 py-1 bg-background/50 border-white/10">
                                                {value}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-white/5"
                                        onClick={() => setPreviewOpen(false)}
                                    >
                                        {t("preview.close")}
                                    </Button>
                                    <Button
                                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                                        onClick={() => { setPreviewOpen(false); navigate(`/player/${previewPlayer.id}`); }}
                                    >
                                        <Eye className="h-4 w-4" />
                                        {t("preview.viewProfile")}
                                    </Button>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </SheetContent>
            </Sheet>

            {/* Compare Overlay */}
            {compareDialogOpen && compareIds.length >= 2 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCompareDialogOpen(false)}>
                    <div className="bg-card border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                {t("compare.title", "Сравнение игроков")}
                            </h2>
                            <button onClick={() => setCompareDialogOpen(false)} className="text-muted-foreground hover:text-white p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-0">
                            {compareIds.slice(0, 2).map((id, idx) => {
                                const p = rankingPlayers.find(x => x.id === id);
                                if (!p) return null;
                                const other = compareIds.slice(0, 2).find(x => x !== id);
                                const otherP = other ? rankingPlayers.find(x => x.id === other) : null;
                                return (
                                    <div key={id} className={`p-6 space-y-5 ${idx === 0 ? "border-r border-white/5" : ""}`}>
                                        <div className="flex flex-col items-center text-center">
                                            <Avatar className="h-16 w-16 border-2 border-primary/20 mb-3">
                                                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                                    {p.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <h3 className="text-lg font-bold">{p.name}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <Badge variant="outline" className="text-xs border-white/10">{p.position}</Badge>
                                                <span>U{p.age}</span>
                                                <span>{p.city}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {[
                                                { label: t("table.score", "Score"), key: "aiScore", better: "higher" },
                                                { label: t("preview.growth", "Growth"), key: "growth", better: "higher" },
                                                { label: t("table.videos", "Videos"), key: "totalVideos", better: "higher" },
                                                { label: t("table.rank", "Rank"), key: "rank", better: "lower" },
                                            ].map(({ label, key, better }) => {
                                                const val = (p as any)[key] ?? 0;
                                                const otherVal = otherP ? (otherP as any)[key] ?? 0 : 0;
                                                const isBetter = better === "higher" ? val > otherVal : val < otherVal;
                                                const isWorse = better === "higher" ? val < otherVal : val > otherVal;
                                                return (
                                                    <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                                        <span className="text-xs text-muted-foreground">{label}</span>
                                                        <div className="flex items-center gap-2">
                                                            {isBetter && <span className="text-emerald-400 text-xs font-bold">▲</span>}
                                                            {isWorse && <span className="text-red-400 text-xs font-bold">▼</span>}
                                                            <span className={`text-base font-black ${key === "aiScore" ? "text-primary" : "text-white"}`}>
                                                                {typeof val === "number" ? (key === "rank" ? `#${val}` : val.toFixed(1)) : val}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end p-4 border-t border-white/5 gap-3">
                            <Button variant="outline" size="sm" onClick={() => setCompareDialogOpen(false)} className="border-white/5">
                                {t("compare.clear", "Close")}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setCompareIds([]); setCompareDialogOpen(false); }} className="text-muted-foreground">
                                {t("compare.clear", "Clear selection")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom padding for compare tray */}
            {compareIds.length >= 2 && <div className="h-20" />}
        </div>
    );
}
