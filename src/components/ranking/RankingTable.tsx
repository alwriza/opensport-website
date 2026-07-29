import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Trophy, Medal, GitCompare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";

interface RankingPlayer {
    user_id: string;
    name: string;
    avatar_url: string | null;
    age: number | null;
    position: string | null;
    city: string | null;
    country: string | null;
    best_score: number;
    total_analyses: number;
}

interface RankingTableProps {
    players: RankingPlayer[];
    isLoading: boolean;
    onPlayerClick: (player: RankingPlayer) => void;
    page: number;
    pageSize: number;
    selectedForCompare: string[];
    onToggleCompare: (userId: string) => void;
}

export function RankingTable({ players, isLoading, onPlayerClick, page, pageSize, selectedForCompare, onToggleCompare }: RankingTableProps) {
    const { t } = useTranslation("ranking");

    const getRankIcon = (index: number) => {
        const rank = (page - 1) * pageSize + index + 1;
        if (rank === 1) return <span className="text-2xl">🥇</span>;
        if (rank === 2) return <span className="text-2xl">🥈</span>;
        if (rank === 3) return <span className="text-2xl">🥉</span>;
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-emerald-500 font-bold";
        if (score >= 80) return "text-primary font-bold";
        if (score >= 70) return "text-amber-500 font-bold";
        if (score >= 60) return "text-orange-500 font-bold";
        return "text-destructive font-bold";
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl bg-card/50" />
                ))}
            </div>
        );
    }

    if (players.length === 0) {
        return (
            <div className="text-center py-12 bg-card/50 rounded-xl border border-white/5">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-xl font-medium text-foreground">{t("empty.title")}</h3>
                <p className="text-muted-foreground mt-2">{t("empty.description")}</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-white/5 overflow-hidden bg-card/30 backdrop-blur-sm">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-white/5">
                        <TableHead className="w-[80px] text-center">{t("table.rank")}</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>{t("table.player")}</TableHead>
                        <TableHead className="w-[80px] text-center">{t("table.age")}</TableHead>
                        <TableHead className="w-[100px] text-center">{t("table.position")}</TableHead>
                        <TableHead className="hidden md:table-cell">{t("table.location")}</TableHead>
                        <TableHead className="w-[100px] text-center">{t("table.score")}</TableHead>
                        <TableHead className="w-[100px] text-center">{t("table.actions")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {players.map((player, index) => (
                        <TableRow
                            key={player.user_id}
                            className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                            onClick={() => onPlayerClick(player)}
                        >
                            <TableCell className="text-center font-medium">
                                {getRankIcon(index)}
                            </TableCell>

                            <TableCell className="text-center">
                                <Checkbox
                                    checked={selectedForCompare.includes(player.user_id)}
                                    onCheckedChange={() => onToggleCompare(player.user_id)}
                                    disabled={!selectedForCompare.includes(player.user_id) && selectedForCompare.length >= 2}
                                />
                            </TableCell>

                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-white/10">
                                        <AvatarImage src={player.avatar_url || ""} />
                                        <AvatarFallback className="bg-primary/20 text-primary">
                                            {player.name?.charAt(0) || <User className="h-5 w-5" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-foreground">{player.name}</span>
                                        <span className="text-xs text-muted-foreground md:hidden">
                                            {player.city && player.country ? `${player.city}, ${player.country}` : t("location.unknown")}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>

                            <TableCell className="text-center text-muted-foreground">
                                {player.age ? `U${player.age}` : "-"}
                            </TableCell>

                            <TableCell className="text-center">
                                {player.position ? (
                                    <span className="px-2 py-1 rounded-md bg-white/5 text-xs font-medium border border-white/10">
                                        {player.position}
                                    </span>
                                ) : "-"}
                            </TableCell>

                            <TableCell className="hidden md:table-cell text-muted-foreground">
                                {player.city && player.country
                                    ? `${player.city}, ${player.country}`
                                    : <span className="text-muted-foreground/50">-</span>
                                }
                            </TableCell>

                            <TableCell className="text-center">
                                <span className={`text-lg ${getScoreColor(player.best_score)}`}>
                                    {player.best_score.toFixed(1)}
                                </span>
                            </TableCell>

                            <TableCell className="text-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPlayerClick(player);
                                    }}
                                    className="hover:bg-primary/20 hover:text-primary"
                                >
                                    {t("table.view")}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
