import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, User, Trophy, Activity, Zap, Move, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

interface PlayerPreviewModalProps {
    player: any; // Using any for now to avoid duplicate interface, or import shared one
    isOpen: boolean;
    onClose: () => void;
}

interface Analysis {
    stability: number;
    power: number;
    technique: number;
    balance: number;
}

export function PlayerPreviewModal({ player, isOpen, onClose }: PlayerPreviewModalProps) {
    const { t } = useTranslation("ranking");

    const { data: bestAnalysis, isLoading } = useQuery<Analysis | null>({
        queryKey: ['best-analysis', player?.user_id],
        queryFn: async () => {
            if (!player?.user_id) return null;
            const { data, error } = await supabase
                .from('analyses')
                .select('*')
                .eq('user_id', player.user_id)
                .order('overall', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            return data as Analysis;
        },
        enabled: !!player?.user_id && isOpen,
    });

    if (!player) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-card border-white/10 text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="text-center">{t("modal.title")}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-4 py-4">
                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                        <AvatarImage src={player.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                            {player.name?.charAt(0) || <User className="h-10 w-10" />}
                        </AvatarFallback>
                    </Avatar>

                    <div className="text-center space-y-1">
                        <h3 className="text-2xl font-bold">{player.name}</h3>
                        <p className="text-muted-foreground flex items-center justify-center gap-2">
                            <span className="font-medium text-foreground">{player.position || "-"}</span>
                            <span>•</span>
                            <span>U{player.age || "??"}</span>
                            <span>•</span>
                            <span>{player.city}, {player.country}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-primary/10 p-4 rounded-xl text-center border border-primary/20">
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">{t("modal.bestScore")}</p>
                            <p className="text-4xl font-black text-primary">{player.best_score?.toFixed(1) || "0.0"}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl text-center border border-white/10">
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">{t("modal.totalAnalyses")}</p>
                            <p className="text-4xl font-bold text-white">{player.total_analyses || 0}</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : bestAnalysis ? (
                        <div className="w-full space-y-3">
                            <h4 className="font-medium text-muted-foreground text-sm uppercase mb-2">{t("modal.breakdown")}</h4>

                            <div className="space-y-3">
                                <ScoreRow
                                    label={t("scores.stability")}
                                    value={bestAnalysis.stability}
                                    icon={<Shield className="h-4 w-4 text-emerald-400" />}
                                />
                                <ScoreRow
                                    label={t("scores.power")}
                                    value={bestAnalysis.power}
                                    icon={<Zap className="h-4 w-4 text-amber-400" />}
                                />
                                <ScoreRow
                                    label={t("scores.technique")}
                                    value={bestAnalysis.technique}
                                    icon={<Activity className="h-4 w-4 text-blue-400" />}
                                />
                                <ScoreRow
                                    label={t("scores.balance")}
                                    value={bestAnalysis.balance}
                                    icon={<Move className="h-4 w-4 text-purple-400" />}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted-foreground">
                            {t("modal.noData")}
                        </div>
                    )}

                    <div className="flex gap-3 w-full pt-4">
                        <Button className="flex-1" variant="outline" onClick={onClose}>
                            {t("modal.close")}
                        </Button>
                        <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                            {t("modal.viewProfile")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ScoreRow({ label, value, icon }: { label: string, value: number, icon: any }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-full">
                    {icon}
                </div>
                <span className="font-medium">{label}</span>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1 bg-background/50 border-white/10">
                {value?.toFixed(0)}
            </Badge>
        </div>
    );
}
