import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Users, TrendingUp, Clock, Award, Plus, Search, Filter, UserPlus,
    ChevronDown, Star, Stethoscope, AlertCircle, Trophy, Loader2, CalendarDays,
    Footprints, AlertTriangle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useCoachSquad, useUpcomingEvents, useTeamFlags } from "@/hooks/useCoachData";

export function OverviewTab({ teamId }: { teamId?: string }) {
    const { t } = useTranslation("dashboard");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPosition, setFilterPosition] = useState("All");
    const [showFilters, setShowFilters] = useState(false);

    const { data: squad = [], isLoading: squadLoading } = useCoachSquad(teamId);
    const { data: upcoming = [] } = useUpcomingEvents(teamId);
    const { data: flags = [] } = useTeamFlags(teamId);

    const POSITIONS = ["All", "Forward", "Midfielder", "Defender", "Goalkeeper"];
    const positionsMap: Record<string, string> = {
        "FWD": "Forward", "MID": "Midfielder", "DEF": "Defender", "GK": "Goalkeeper",
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-primary";
        if (score >= 60) return "text-amber-400";
        return "text-destructive";
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return "bg-primary";
        if (score >= 60) return "bg-amber-400";
        return "bg-destructive";
    };

    const filteredRoster = useMemo(() => {
        return squad.filter(p => {
            const matchesSearch = searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPosition = filterPosition === "All" || positionsMap[p.position] === filterPosition;
            return matchesSearch && matchesPosition;
        });
    }, [squad, searchQuery, filterPosition]);

    const roster = squad;
    const avgScore = roster.length > 0 ? (roster.reduce((a, p) => a + p.coach_rating, 0) / roster.length * 10).toFixed(1) : "0.0";

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-gradient">
                        {t("coach.title")}
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        {t("coach.welcome", { name: "Coach" })}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Select defaultValue="team-1">
                        <SelectTrigger className="w-[200px] bg-card border-white/5">
                            <SelectValue placeholder={t("coach.selectTeam")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="team-1">U18 Team Alpha</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className="bg-primary hover:bg-primary/90 text-black font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("coach.createTeam")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
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
                <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
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
                <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
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
                <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("stats.topPerformer")}</p>
                                <p className="text-lg font-bold">{roster.reduce((max, p) => p.coach_rating > max.coach_rating ? p : max).name}</p>
                            </div>
                            <Award className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
                    <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            {t("coach.overview.upcoming")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {upcoming.length > 0 ? upcoming.slice(0, 3).map(event => (
                            <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className={`p-2 rounded-lg ${event.type === "training" ? "bg-primary/20 text-primary" : "bg-amber-400/20 text-amber-400"}`}>
                                    {event.type === "training" ? <Footprints className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {event.date} at {event.time}
                                        {event.location && ` · ${event.location}`}
                                    </p>
                                </div>
                                <Badge variant="outline" className="border-white/10 text-xs">
                                    {event.type === "training" ? t("coach.overview.training") : t("coach.overview.match")}
                                </Badge>
                            </div>
                        )) : (
                            <p className="text-muted-foreground text-sm py-4 text-center">{t("coach.overview.noUpcoming")}</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card border-white/5 shadow-xl shadow-black/20">
                    <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                            {t("coach.overview.attention")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {flags.map(flag => (
                            <div key={flag.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <Avatar className="h-10 w-10 border border-white/10">
                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                        {((flag as any).player_name ?? "?").charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white">{(flag as any).player_name ?? "Player"}</p>
                                    <p className="text-xs text-muted-foreground truncate">{flag.note}</p>
                                </div>
                                <Badge className={`text-[10px] uppercase ${
                                    flag.type === "high_potential" ? "bg-primary/20 text-primary" :
                                    flag.type === "injured" ? "bg-red-400/20 text-red-400" :
                                    flag.type === "watch" ? "bg-amber-400/20 text-amber-400" :
                                    flag.type === "needs_improvement" ? "bg-blue-400/20 text-blue-400" :
                                    "bg-white/10 text-muted-foreground"
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

            <Card className="bg-card border-white/5 shadow-xl shadow-black/20 overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle className="text-white">{t("tabs.roster")}</CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t("coach.searchPlayers")}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 w-full md:w-64 bg-background border-white/5"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`border-white/5 ${showFilters ? "bg-white/5" : ""}`}
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    {t("coach.filters.title")}
                                    <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                                </Button>
                                <Button>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {t("coach.invitePlayers")}
                                </Button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-white/5 rounded-lg bg-white/5">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-muted-foreground">{t("coach.filters.position")}</label>
                                    <Select value={filterPosition} onValueChange={setFilterPosition}>
                                        <SelectTrigger className="bg-background border-white/5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {POSITIONS.map(pos => (
                                                <SelectItem key={pos} value={pos}>{pos === "All" ? t("coach.filters.allPositions") : pos}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300">{t("coach.rosterTable.num")}</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300">{t("coach.rosterTable.name")}</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300">{t("coach.rosterTable.age")}</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300">{t("coach.rosterTable.pos")}</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300">{t("coach.rosterTable.performance")}</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300">{t("coach.rosterTable.actions")}</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-300">{t("coach.rosterTable.flagsTitle")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredRoster.map((player, idx) => (
                                    <tr key={player.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border border-white/10">
                                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{player.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-primary transition-colors">{player.name}</div>
                                                    {player.status === "pending" && (
                                                        <Badge className="mt-1 bg-amber-400 text-black border-none font-black text-[8px] px-1 py-0 h-4 uppercase">
                                                            {t("coach.rosterTable.pending")}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground font-medium">{player.age}</td>
                                        <td className="p-4">
                                            <Badge variant="outline" className="font-mono text-[10px] border-white/10 text-muted-foreground bg-white/5 uppercase">{player.position}</Badge>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xl font-black ${getScoreColor(player.coach_rating * 10)}`}>
                                                {(player.coach_rating * 10).toFixed(0)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <Button variant="outline" size="sm" className="h-8 bg-white/5 border-white/10 hover:bg-primary hover:text-black hover:border-primary text-white font-bold">
                                                {t("player.viewResults")}
                                            </Button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/10 hover:text-white/30">
                                                    <Stethoscope className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/10 hover:text-primary hover:bg-primary/10">
                                                    <Star className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/10 hover:text-destructive hover:bg-destructive/10">
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
    );
}
