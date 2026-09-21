import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Users, TrendingUp, Clock, Award, Search, Filter, UserPlus,
    ChevronDown, ChevronUp, Star, Stethoscope, AlertCircle, Trophy, Loader2, CalendarDays,
    Footprints, AlertTriangle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useCoachSquad, useUpcomingEvents, useTeamFlags } from "@/hooks/useCoachData";
import { InvitePlayersModal } from "@/components/ui/InvitePlayersModal";

export function OverviewTab({ teamId, team }: { teamId?: string; team?: { id: string; name: string; invite_code: string } }) {
    const { t } = useTranslation("dashboard");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPosition, setFilterPosition] = useState("All");
    const [filterAgeRange, setFilterAgeRange] = useState<[number, number]>([0, 100]);
    const [filterScoreRange, setFilterScoreRange] = useState<[number, number]>([0, 100]);
    const [showFilters, setShowFilters] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [sortBy, setSortBy] = useState<"name" | "age" | "performance">("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const { data: squad = [], isLoading: squadLoading } = useCoachSquad(teamId);
    const { data: upcoming = [] } = useUpcomingEvents(teamId);
    const { data: flags = [] } = useTeamFlags(teamId);

    const POSITIONS = ["All", "Forward", "Midfielder", "Defender", "Goalkeeper"];
    const positionsMap: Record<string, string> = {
        "FWD": "Forward", "MID": "Midfielder", "DEF": "Defender", "GK": "Goalkeeper",
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-primary";
        if (score >= 60) return "text-warning";
        return "text-destructive";
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return "bg-primary";
        if (score >= 60) return "bg-warning";
        return "bg-destructive";
    };

    const filteredRoster = useMemo(() => {
        const filtered = squad.filter(p => {
            const matchesSearch = searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPosition = filterPosition === "All" || positionsMap[p.position] === filterPosition;
            const age = p.age || 0;
            const matchesAge = age >= filterAgeRange[0] && age <= filterAgeRange[1];
            const score = (p.coach_rating || 0) * 10;
            const matchesScore = score >= filterScoreRange[0] && score <= filterScoreRange[1];
            return matchesSearch && matchesPosition && matchesAge && matchesScore;
        });

        return [...filtered].sort((a, b) => {
            let valA: any, valB: any;
            switch (sortBy) {
                case "name": valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
                case "age": valA = a.age || 0; valB = b.age || 0; break;
                case "performance": valA = a.coach_rating || 0; valB = b.coach_rating || 0; break;
            }
            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [squad, searchQuery, filterPosition, filterAgeRange, filterScoreRange, sortBy, sortOrder]);

    const resetFilters = () => {
        setSearchQuery("");
        setFilterPosition("All");
        setFilterAgeRange([0, 100]);
        setFilterScoreRange([0, 100]);
        setSortBy("name");
        setSortOrder("asc");
    };

    const roster = squad;
    const avgScore = roster.length > 0 ? (roster.reduce((a, p) => a + p.coach_rating, 0) / roster.length * 10).toFixed(1) : "0.0";

    return (
        <>
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-display text-3xl font-bold tracking-tight text-gradient md:text-4xl lg:text-5xl">
                        {t("coach.title")}
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        {t("coach.welcome", { name: "Coach" })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="bg-card border-border shadow-xl shadow-black/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("stats.totalPlayers")}</p>
                                <p className="text-2xl font-bold">{roster.length}</p>
                            </div>
                            <Users className="h-8 w-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-xl shadow-black/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("stats.avgScore")}</p>
                                <p className="text-2xl font-bold">{avgScore}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-xl shadow-black/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("stats.activeThisWeek")}</p>
                                <p className="text-2xl font-bold">{roster.filter(p => p.status === "active").length}</p>
                            </div>
                            <Clock className="h-8 w-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-xl shadow-black/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("stats.topPerformer")}</p>
                                <p className="text-lg font-bold">{roster.length > 0 ? roster.reduce((max, p) => p.coach_rating > max.coach_rating ? p : max).name : "—"}</p>
                            </div>
                            <Award className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border shadow-xl shadow-black/20">
                    <CardHeader>
                        <CardTitle className="text-foreground text-lg flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            {t("coach.overview.upcoming")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {upcoming.length > 0 ? upcoming.slice(0, 3).map(event => (
                            <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-2 border border-border">
                                <div className={`p-2 rounded-lg ${event.type === "training" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"}`}>
                                    {event.type === "training" ? <Footprints className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {event.date} at {event.time}
                                        {event.location && ` · ${event.location}`}
                                    </p>
                                </div>
                                <Badge variant="outline" className="border-border text-xs">
                                    {event.type === "training" ? t("coach.overview.training") : t("coach.overview.match")}
                                </Badge>
                            </div>
                        )) : (
                            <p className="text-muted-foreground text-sm py-4 text-center">{t("coach.overview.noUpcoming")}</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-xl shadow-black/20">
                    <CardHeader>
                        <CardTitle className="text-foreground text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-warning" />
                            {t("coach.overview.attention")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {flags.map(flag => (
                            <div key={flag.id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-2 border border-border">
                                <Avatar className="h-10 w-10 border border-border">
                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                        {((flag as any).player_name ?? "?").charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground">{(flag as any).player_name ?? "Player"}</p>
                                    <p className="text-xs text-muted-foreground truncate">{flag.note}</p>
                                </div>
                                <Badge className={`text-[10px] uppercase ${
                                    flag.type === "high_potential" ? "bg-primary/20 text-primary" :
                                    flag.type === "injured" ? "bg-destructive/15 text-destructive" :
                                    flag.type === "watch" ? "bg-warning/20 text-warning" :
                                    flag.type === "needs_improvement" ? "bg-chart-2/20 text-chart-2" :
                                    "bg-surface-3 text-muted-foreground"
                                } border-none`}>
                                    {flag.type.replace(/_/g, " ")}
                                </Badge>
                            </div>
                        ))}
                        {flags.length === 0 && (
                            <p className="text-muted-foreground text-sm py-4 text-center">{t("coach.overview.noFlags")}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-card border-border shadow-xl shadow-black/20 overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle className="text-foreground">{t("tabs.roster")}</CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t("coach.searchPlayers")}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 w-full md:w-64 bg-background border-border"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`border-border ${showFilters ? "bg-surface-2" : ""}`}
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    {t("coach.filters.title")}
                                    <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                                </Button>
                                <Button onClick={() => setShowInvite(true)} disabled={!team}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {t("coach.invitePlayers")}
                                </Button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 border border-border rounded-lg bg-surface-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-muted-foreground">{t("coach.filters.position")}</label>
                                    <Select value={filterPosition} onValueChange={setFilterPosition}>
                                        <SelectTrigger className="bg-background border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {POSITIONS.map(pos => (
                                                <SelectItem key={pos} value={pos}>{pos === "All" ? t("coach.filters.allPositions") : pos}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-muted-foreground">{t("coach.filters.ageRange")}</label>
                                    <div className="flex gap-2">
                                        <Input type="number" placeholder={t("coach.filters.min")} className="w-1/2 bg-background border-border"
                                            value={filterAgeRange[0]} min={0} max={100}
                                            onChange={e => setFilterAgeRange([Number(e.target.value) || 0, filterAgeRange[1]])} />
                                        <Input type="number" placeholder={t("coach.filters.max")} className="w-1/2 bg-background border-border"
                                            value={filterAgeRange[1]} min={0} max={100}
                                            onChange={e => setFilterAgeRange([filterAgeRange[0], Number(e.target.value) || 100])} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-muted-foreground">{t("coach.filters.performance")}</label>
                                    <div className="flex gap-2">
                                        <Input type="number" placeholder={t("coach.filters.minScore")} className="w-1/2 bg-background border-border"
                                            value={filterScoreRange[0]} min={0} max={100}
                                            onChange={e => setFilterScoreRange([Number(e.target.value) || 0, filterScoreRange[1]])} />
                                        <Input type="number" placeholder={t("coach.filters.maxScore")} className="w-1/2 bg-background border-border"
                                            value={filterScoreRange[1]} min={0} max={100}
                                            onChange={e => setFilterScoreRange([filterScoreRange[0], Number(e.target.value) || 100])} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-muted-foreground">{t("coach.filters.sortBy")}</label>
                                    <div className="flex gap-2">
                                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                            <SelectTrigger className="bg-background border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="name">{t("coach.filters.sorting.name")}</SelectItem>
                                                <SelectItem value="age">{t("coach.filters.sorting.age")}</SelectItem>
                                                <SelectItem value="performance">{t("coach.filters.sorting.overall")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="icon" className="shrink-0 border-border bg-background"
                                            onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}>
                                            {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-end space-y-2">
                                    <Button variant="ghost" onClick={resetFilters} className="text-xs font-bold uppercase tracking-widest h-10 px-4 border border-border">
                                        {t("coach.filters.reset")}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-surface-2">
                                    <th className="text-left p-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("coach.rosterTable.num")}</th>
                                    <th className="text-left p-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("coach.rosterTable.name")}</th>
                                    <th className="text-left p-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("coach.rosterTable.age")}</th>
                                    <th className="text-left p-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("coach.rosterTable.pos")}</th>
                                    <th className="text-left p-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("coach.rosterTable.performance")}</th>
                                    <th className="text-left p-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("coach.rosterTable.actions")}</th>
                                    <th className="text-left p-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("coach.rosterTable.flagsTitle")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredRoster.map((player, idx) => (
                                    <tr key={player.id} className="hover:bg-surface-2 transition-colors group">
                                        <td className="p-4 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border border-border">
                                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{player.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-bold text-foreground group-hover:text-primary transition-colors">{player.name}</div>
                                                    {player.status === "pending" && (
                                                        <Badge className="mt-1 bg-warning text-primary-foreground border-none font-bold text-[8px] px-1 py-0 h-4 uppercase">
                                                            {t("coach.rosterTable.pending")}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground font-medium">{player.age}</td>
                                        <td className="p-4">
                                            <Badge variant="outline" className="font-mono text-[10px] border-border text-muted-foreground bg-surface-2 uppercase">{player.position}</Badge>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xl font-bold ${getScoreColor(player.coach_rating * 10)}`}>
                                                {(player.coach_rating * 10).toFixed(0)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <Button variant="outline" size="sm" className="h-8 bg-surface-2 border-border hover:bg-primary hover:text-black hover:border-primary text-foreground font-bold">
                                                {t("player.viewResults")}
                                            </Button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-surface-3 hover:text-subtle-foreground">
                                                    <Stethoscope className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-surface-3 hover:text-primary hover:bg-primary/10">
                                                    <Star className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-surface-3 hover:text-destructive hover:bg-destructive/10">
                                                    <AlertCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
        {team && (
            <InvitePlayersModal
                open={showInvite}
                onClose={() => setShowInvite(false)}
                team={team}
                onSuccess={() => setShowInvite(false)}
            />
        )}
        </>
    );
}
