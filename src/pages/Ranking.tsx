import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/section-heading";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoContext } from "@/demo";
import type { MockPlayer } from "@/data/mockRanking";
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

const DEMO_RANKING = [
    { id: "demo-r1", rank: 1, name: "Marcus Silva", age: 17, position: "FWD", team: "Kaizer Chiefs", city: "Barcelona", country: "Spain", avatarUrl: null, aiScore: 94.2, growth: 5.8, totalVideos: 28, lastActive: "today", trend: "up" },
    { id: "demo-r2", rank: 2, name: "Amelia Johnson", age: 16, position: "MID", team: "Arsenal Youth", city: "London", country: "UK", avatarUrl: null, aiScore: 91.5, growth: 3.2, totalVideos: 22, lastActive: "today", trend: "up" },
    { id: "demo-r3", rank: 3, name: "Carlos Rodriguez", age: 18, position: "DEF", team: "Real Madrid B", city: "Madrid", country: "Spain", avatarUrl: null, aiScore: 88.7, growth: -1.4, totalVideos: 19, lastActive: "1 day ago", trend: "stable" },
    { id: "demo-r4", rank: 4, name: "Sofia Andersson", age: 17, position: "GK", team: "AIK Youth", city: "Stockholm", country: "Sweden", avatarUrl: null, aiScore: 85.3, growth: 7.1, totalVideos: 31, lastActive: "today", trend: "up" },
    { id: "demo-r5", rank: 5, name: "Kwame Asante", age: 16, position: "MID", team: "Accra Lions", city: "Accra", country: "Ghana", avatarUrl: null, aiScore: 82.1, growth: 2.5, totalVideos: 15, lastActive: "2 days ago", trend: "stable" },
    { id: "demo-r6", rank: 6, name: "Luca Ferrari", age: 19, position: "FWD", team: "AC Milan U19", city: "Milan", country: "Italy", avatarUrl: null, aiScore: 79.8, growth: -3.2, totalVideos: 24, lastActive: "3 days ago", trend: "down" },
    { id: "demo-r7", rank: 7, name: "Yuki Tanaka", age: 15, position: "MID", team: "FC Tokyo U18", city: "Tokyo", country: "Japan", avatarUrl: null, aiScore: 77.4, growth: 6.3, totalVideos: 20, lastActive: "today", trend: "up" },
    { id: "demo-r8", rank: 8, name: "Oliver Schmidt", age: 18, position: "DEF", team: "Bayern U19", city: "Munich", country: "Germany", avatarUrl: null, aiScore: 76.2, growth: 1.8, totalVideos: 17, lastActive: "1 day ago", trend: "stable" },
    { id: "demo-r9", rank: 9, name: "Emma Dubois", age: 16, position: "FWD", team: "PSG Youth", city: "Paris", country: "France", avatarUrl: null, aiScore: 74.9, growth: 4.1, totalVideos: 26, lastActive: "today", trend: "up" },
    { id: "demo-r10", rank: 10, name: "Rafael Santos", age: 17, position: "MID", team: "Flamengo U20", city: "Rio de Janeiro", country: "Brazil", avatarUrl: null, aiScore: 73.5, growth: -0.5, totalVideos: 23, lastActive: "2 days ago", trend: "stable" },
    { id: "demo-r11", rank: 11, name: "James Murphy", age: 15, position: "DEF", team: null, city: "Dublin", country: "Ireland", avatarUrl: null, aiScore: 71.8, growth: 8.2, totalVideos: 14, lastActive: "today", trend: "up" },
    { id: "demo-r12", rank: 12, name: "Aisha Patel", age: 18, position: "GK", team: "Mumbai FC", city: "Mumbai", country: "India", avatarUrl: null, aiScore: 70.2, growth: -2.1, totalVideos: 18, lastActive: "3 days ago", trend: "down" },
    { id: "demo-r13", rank: 13, name: "Noah van Dijk", age: 16, position: "FWD", team: "Ajax U17", city: "Amsterdam", country: "Netherlands", avatarUrl: null, aiScore: 68.6, growth: 3.9, totalVideos: 21, lastActive: "1 day ago", trend: "stable" },
    { id: "demo-r14", rank: 14, name: "Ivan Petrov", age: 17, position: "MID", team: "Spartak U19", city: "Moscow", country: "Russia", avatarUrl: null, aiScore: 67.1, growth: 1.2, totalVideos: 16, lastActive: "2 days ago", trend: "stable" },
    { id: "demo-r15", rank: 15, name: "Chen Wei", age: 15, position: "DEF", team: "Shanghai U18", city: "Shanghai", country: "China", avatarUrl: null, aiScore: 65.8, growth: 5.5, totalVideos: 12, lastActive: "today", trend: "up" },
    { id: "demo-r16", rank: 16, name: "Hugo Morales", age: 20, position: "MID", team: null, city: "Mexico City", country: "Mexico", avatarUrl: null, aiScore: 64.3, growth: -4.8, totalVideos: 29, lastActive: "1 week ago", trend: "down" },
    { id: "demo-r17", rank: 17, name: "Oscar Johansson", age: 18, position: "FWD", team: "Malmö Youth", city: "Oslo", country: "Norway", avatarUrl: null, aiScore: 62.9, growth: 0.3, totalVideos: 13, lastActive: "3 days ago", trend: "stable" },
    { id: "demo-r18", rank: 18, name: "Fatima Al-Rashid", age: 16, position: "MID", team: "Al-Ahli U19", city: "Dubai", country: "UAE", avatarUrl: null, aiScore: 61.4, growth: 2.7, totalVideos: 19, lastActive: "1 day ago", trend: "up" },
    { id: "demo-r19", rank: 19, name: "David Kim", age: 17, position: "DEF", team: "Seoul FC U18", city: "Seoul", country: "South Korea", avatarUrl: null, aiScore: 60.0, growth: -1.1, totalVideos: 25, lastActive: "2 days ago", trend: "down" },
    { id: "demo-r20", rank: 20, name: "Liam O'Brien", age: 19, position: "GK", team: "NYC Academy", city: "New York", country: "USA", avatarUrl: null, aiScore: 58.7, growth: 4.3, totalVideos: 11, lastActive: "today", trend: "up" },
    { id: "demo-r21", rank: 21, name: "Петр Соколов", age: 16, position: "FWD", team: "Локомотив U17", city: "Москва", country: "Россия", avatarUrl: null, aiScore: 57.2, growth: 6.1, totalVideos: 9, lastActive: "today", trend: "up" },
    { id: "demo-r22", rank: 22, name: "Juan Martinez", age: 17, position: "MID", team: "Boca Juniors U20", city: "Buenos Aires", country: "Argentina", avatarUrl: null, aiScore: 55.8, growth: -0.8, totalVideos: 14, lastActive: "3 days ago", trend: "stable" },
    { id: "demo-r23", rank: 23, name: "Ahmed Hassan", age: 15, position: "DEF", team: "Al Ahly Youth", city: "Cairo", country: "Egypt", avatarUrl: null, aiScore: 54.3, growth: 7.5, totalVideos: 8, lastActive: "today", trend: "up" },
    { id: "demo-r24", rank: 24, name: "Mia Larsen", age: 18, position: "FWD", team: "FC Copenhagen U19", city: "Copenhagen", country: "Denmark", avatarUrl: null, aiScore: 52.9, growth: 2.2, totalVideos: 16, lastActive: "1 day ago", trend: "stable" },
    { id: "demo-r25", rank: 25, name: "Omar Farouk", age: 16, position: "GK", team: "Zamalek U18", city: "Cairo", country: "Egypt", avatarUrl: null, aiScore: 51.5, growth: -3.5, totalVideos: 22, lastActive: "4 days ago", trend: "down" },
    { id: "demo-r26", rank: 26, name: "Elena Torres", age: 17, position: "MID", team: null, city: "Bogotá", country: "Colombia", avatarUrl: null, aiScore: 50.0, growth: 1.5, totalVideos: 7, lastActive: "2 days ago", trend: "stable" },
    { id: "demo-r27", rank: 27, name: "Tommy Chen", age: 15, position: "FWD", team: "HKFC Youth", city: "Hong Kong", country: "China", avatarUrl: null, aiScore: 48.6, growth: 8.9, totalVideos: 6, lastActive: "today", trend: "up" },
    { id: "demo-r28", rank: 28, name: "Sara Johansson", age: 19, position: "DEF", team: "Hammarby U20", city: "Stockholm", country: "Sweden", avatarUrl: null, aiScore: 47.2, growth: -2.0, totalVideos: 20, lastActive: "5 days ago", trend: "down" },
    { id: "demo-r29", rank: 29, name: "Khalid Al-Rashid", age: 16, position: "MID", team: "Al-Hilal U19", city: "Riyadh", country: "Saudi Arabia", avatarUrl: null, aiScore: 45.8, growth: 3.0, totalVideos: 10, lastActive: "1 day ago", trend: "up" },
    { id: "demo-r30", rank: 30, name: "Leo Fischer", age: 17, position: "FWD", team: "RB Leipzig U19", city: "Berlin", country: "Germany", avatarUrl: null, aiScore: 44.3, growth: 0.0, totalVideos: 13, lastActive: "3 days ago", trend: "stable" },
];

export default function Ranking() {
    const { t } = useTranslation("ranking");
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const demo = useDemoContext();

    const { data: rankingPlayers = [] } = useQuery({
        queryKey: ["global-ranking"],
        queryFn: async () => {
            if (demo) return DEMO_RANKING;
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
                trend: (r.growth ?? 0) > 1 ? "up" : (r.growth ?? 0) < -1 ? "down" : "stable",
            })) as MockPlayer[];
        },
        placeholderData: (prev) => prev ?? (demo ? DEMO_RANKING : undefined),
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
    const [savedIds, setSavedIds] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem("ranking_saved_players") || "[]"); } catch { return []; }
    });
    const PAGE_SIZE = 20;

    useEffect(() => {
        localStorage.setItem("ranking_saved_players", JSON.stringify(savedIds));
    }, [savedIds]);

    const toggleSaved = (id: string) => {
        setSavedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

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
    }, [rankingPlayers, filters, sub, sortField, sortDir]);

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
        if (score >= 70) return "text-warning";
        if (score >= 60) return "text-chart-4";
        return "text-destructive";
    };

    const renderStars = (score: number) => {
        const full = Math.floor(score / 20);
        return (
            <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < full ? "text-primary fill-primary" : "text-surface-3"}`} />
                ))}
            </div>
        );
    };

    return (
        <div className="relative mx-auto min-h-screen max-w-[1600px] space-y-6 px-4 py-8 md:px-6 md:py-10">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-20 h-72 bg-spotlight" />

            {/* Header */}
            <PageHeader className="relative" icon={Trophy} title={t("title")} description={t("subtitle")} />

            {/* Tabs */}
            <Tabs value={tab} onValueChange={v => updateURL({ tab: v, page: "1" })}>
                <TabsList>
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
                                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                                    sub === key
                                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                                        : "border-border bg-surface-2 text-muted-foreground hover:border-border-strong hover:text-foreground"
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
                                className="pl-10"
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
                                <Button variant="outline" className="gap-2">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    {t("filters.title")}
                                    {(filters.position !== "all" || filters.ageGroup !== "all" || filters.country) && (
                                        <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                                            {[filters.position !== "all", filters.ageGroup !== "all", !!filters.country].filter(Boolean).length}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-full max-w-sm">
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
                                                            : "bg-surface-1 text-muted-foreground border-border hover:text-foreground"
                                                    }`}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator className="bg-surface-2" />

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
                                                            : "bg-surface-1 text-muted-foreground border-border hover:text-foreground"
                                                    }`}
                                                >
                                                    {age === "all" ? t("filters.allAges") : age}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator className="bg-surface-2" />

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
                                            className="bg-surface-1 border-border"
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
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-surface-2 text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                                        <th className="w-10 p-3 text-center">
                                            <button
                                                onClick={() => {
                                                    if (compareIds.length === paged.length) setCompareIds([]);
                                                    else setCompareIds(paged.map(p => p.id));
                                                }}
                                                className={`mx-auto flex h-[18px] w-[18px] items-center justify-center rounded-md border transition-all ${
                                                    compareIds.length === paged.length && paged.length > 0
                                                        ? "bg-primary border-primary"
                                                        : "border-border-strong bg-surface-2 hover:border-primary/60"
                                                }`}
                                            >
                                                {compareIds.length === paged.length && paged.length > 0 && (
                                                    <span className="text-[10px] font-bold text-primary-foreground">✓</span>
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
                                                className={`cursor-pointer border-b border-border transition-colors hover:bg-surface-2 ${
                                                    isCompareActive ? "bg-primary/10" : ""
                                                }`}
                                                onClick={() => { setPreviewPlayer(player); setPreviewOpen(true); }}
                                            >
                                                <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => toggleCompare(player.id)}
                                                        className={`flex h-[18px] w-[18px] items-center justify-center rounded-md border transition-all ${
                                                            isCompareActive
                                                                ? "bg-primary border-primary"
                                                                : "border-border-strong bg-surface-2 hover:border-primary/60"
                                                        }`}
                                                    >
                                                        {isCompareActive && (
                                                            <span className="text-[10px] font-bold text-primary-foreground">✓</span>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span
                                                        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-sm font-bold tabular ${
                                                            player.rank <= 3
                                                                ? "border border-primary/30 bg-primary/15 text-primary"
                                                                : "text-muted-foreground"
                                                        }`}
                                                    >
                                                        {player.rank}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-border shrink-0">
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
                                                    <Badge variant="outline" className="text-xs border-border bg-surface-2 font-medium">
                                                        {player.position}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-sm hidden md:table-cell text-muted-foreground">
                                                    {player.team || <span className="text-subtle-foreground">тАФ</span>}
                                                </td>
                                                <td className="p-3 text-sm hidden lg:table-cell text-muted-foreground">
                                                    {player.city}, {player.country}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <span className={`font-display text-lg font-bold tabular ${rankColor(player.aiScore)}`}>
                                                                    {player.aiScore.toFixed(0)}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="bottom" className="bg-card border-border">
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
                                                            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                                                        ) : (
                                                            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                                                        )}
                                                        <span className={`text-sm font-medium ${
                                                            player.growth > 0 ? "text-emerald-400" :
                                                            player.growth < 0 ? "text-destructive" : "text-muted-foreground"
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
                                                    <div className="flex items-center justify-center gap-1">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className={`h-8 w-8 hover:bg-primary/20 hover:text-primary ${savedIds.includes(player.id) ? "text-primary" : ""}`}
                                                                        onClick={() => toggleSaved(player.id)}
                                                                    >
                                                                        <Bookmark className={`h-4 w-4 ${savedIds.includes(player.id) ? "fill-primary" : ""}`} />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="left" className="bg-card border-border">
                                                                    <p className="text-xs">{savedIds.includes(player.id) ? t("saved.remove", "Убрать из сохранённых") : t("saved.add", "Сохранить")}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
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
                                                                <TooltipContent side="left" className="bg-card border-border">
                                                                    <p className="text-xs">{t("tooltip.viewProfile")}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
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
                                className="border-border bg-surface-1 gap-1"
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
                                                    : "border-border bg-surface-1"
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
                                className="border-border bg-surface-1 gap-1"
                            >
                                {t("pagination.next")}
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Saved Tab */}
                <TabsContent value="saved" className="mt-6">
                    {savedIds.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Bookmark className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                            <h2 className="text-2xl font-bold text-foreground">{t("saved.empty")}</h2>
                            <p className="text-muted-foreground mt-2 max-w-md">
                                {t("saved.description")}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rankingPlayers.filter(p => savedIds.includes(p.id)).map(player => (
                                <div key={player.id} className="rounded-2xl border border-border bg-surface-1 p-4 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => { setPreviewPlayer(player); setPreviewOpen(true); }}>
                                    <Avatar className="h-10 w-10 border border-border shrink-0">
                                        <AvatarImage src={player.avatarUrl || ""} />
                                        <AvatarFallback className="bg-primary/20 text-primary text-xs">{player.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-foreground truncate">{player.name}</div>
                                        <div className="text-xs text-muted-foreground">{player.position} · U{player.age} · #{player.rank}</div>
                                    </div>
                                    <span className={`font-display text-lg font-bold tabular ${rankColor(player.aiScore)}`}>{player.aiScore.toFixed(0)}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive" onClick={e => { e.stopPropagation(); toggleSaved(player.id); }}>
                                        <Bookmark className="h-4 w-4 fill-current" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="mt-6">
                    {(() => {
                        const risers = [...rankingPlayers].filter(p => p.growth > 0).sort((a, b) => b.growth - a.growth).slice(0, 5);
                        const fallers = [...rankingPlayers].filter(p => p.growth < 0).sort((a, b) => a.growth - b.growth).slice(0, 3);
                        if (risers.length === 0 && fallers.length === 0) {
                            return (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <Bell className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                                    <h2 className="text-2xl font-bold text-foreground">{t("alerts.empty")}</h2>
                                    <p className="text-muted-foreground mt-2 max-w-md">
                                        {t("alerts.description")}
                                    </p>
                                </div>
                            );
                        }
                        return (
                            <div className="space-y-3">
                                {risers.map(p => (
                                    <div key={`up-${p.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 p-4">
                                        <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground"><span className="font-semibold">{p.name}</span> поднялся в рейтинге</p>
                                            <p className="text-xs text-muted-foreground">Прогресс за период: +{p.growth.toFixed(1)} · сейчас #{p.rank}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/player/${p.id}`)}>{t("tooltip.viewProfile")}</Button>
                                    </div>
                                ))}
                                {fallers.map(p => (
                                    <div key={`down-${p.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 p-4">
                                        <TrendingDown className="h-5 w-5 text-destructive shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground"><span className="font-semibold">{p.name}</span> снизил показатели</p>
                                            <p className="text-xs text-muted-foreground">Изменение: {p.growth.toFixed(1)} · сейчас #{p.rank}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/player/${p.id}`)}>{t("tooltip.viewProfile")}</Button>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </TabsContent>
            </Tabs>

            {/* Compare Tray */}
            {compareIds.length >= 2 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl shadow-2xl">
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
                <SheetContent side="right" className="w-full max-w-md border-l border-border bg-background p-0">
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
                                        <Badge variant="outline" className="border-border">{previewPlayer.position}</Badge>
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
                                        <p className={`text-3xl font-bold ${rankColor(previewPlayer.aiScore)}`}>
                                            {previewPlayer.aiScore.toFixed(0)}
                                        </p>
                                    </div>
                                    <div className="bg-surface-1 p-4 rounded-xl text-center border border-border">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("preview.rank")}</p>
                                        <p className="text-3xl font-bold text-foreground">#{previewPlayer.rank}</p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("preview.stats")}</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-card p-3 rounded-lg border border-border">
                                            <p className="text-xs text-muted-foreground">{t("preview.growth")}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                {previewPlayer.growth > 0 ? (
                                                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-destructive" />
                                                )}
                                                <span className="text-lg font-bold">{previewPlayer.growth > 0 ? "+" : ""}{previewPlayer.growth.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="bg-card p-3 rounded-lg border border-border">
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
                                        { label: t("scores.power"), value: Math.min(100, previewPlayer.aiScore + Math.round(Math.random() * 10 - 5)), icon: Zap, color: "text-warning" },
                                        { label: t("scores.technique"), value: Math.min(100, previewPlayer.aiScore + Math.round(Math.random() * 10 - 5)), icon: Activity, color: "text-chart-2" },
                                        { label: t("scores.balance"), value: Math.min(100, previewPlayer.aiScore + Math.round(Math.random() * 10 - 5)), icon: Move, color: "text-chart-6" },
                                    ].map(({ label, value, icon: Icon, color }) => (
                                        <div key={label} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-2 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-surface-2 rounded-full">
                                                    <Icon className={`h-4 w-4 ${color}`} />
                                                </div>
                                                <span className="font-medium">{label}</span>
                                            </div>
                                            <Badge variant="outline" className="text-base px-3 py-1 bg-background/50 border-border">
                                                {value}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-border"
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
                    <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                {t("compare.title", "Сравнение игроков")}
                            </h2>
                            <button onClick={() => setCompareDialogOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
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
                                    <div key={id} className={`p-6 space-y-5 ${idx === 0 ? "border-r border-border" : ""}`}>
                                        <div className="flex flex-col items-center text-center">
                                            <Avatar className="h-16 w-16 border-2 border-primary/20 mb-3">
                                                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                                    {p.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <h3 className="text-lg font-bold">{p.name}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <Badge variant="outline" className="text-xs border-border">{p.position}</Badge>
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
                                                    <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border">
                                                        <span className="text-xs text-muted-foreground">{label}</span>
                                                        <div className="flex items-center gap-2">
                                                            {isBetter && <span className="text-emerald-400 text-xs font-bold">▲</span>}
                                                            {isWorse && <span className="text-destructive text-xs font-bold">▼</span>}
                                                            <span className={`text-base font-bold ${key === "aiScore" ? "text-primary" : "text-foreground"}`}>
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
                        <div className="flex justify-end p-4 border-t border-border gap-3">
                            <Button variant="outline" size="sm" onClick={() => setCompareDialogOpen(false)} className="border-border">
                                {t("compare.close", "Закрыть")}
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
