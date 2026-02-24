import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Trophy, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserTrack } from "@/types/subscription";

interface TrackSelectionModalProps {
    open: boolean;
    onComplete: () => void;
}

/**
 * TrackSelectionModal — shown after Clerk signup when user_track is null.
 * User MUST choose a track. No skip button per docs.
 * Player → /player-dashboard (free tier active)
 * Individual → /pricing (must purchase BASIC or PRO)
 */
export function TrackSelectionModal({ open, onComplete }: TrackSelectionModalProps) {
    const { user } = useUser();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selected, setSelected] = useState<UserTrack | null>(null);

    const { mutate: saveTrack, isPending } = useMutation({
        mutationFn: async (track: UserTrack) => {
            if (!user) throw new Error("Not authenticated");

            const { error } = await (supabase.from("users") as any)
                .update({
                    user_track: track,
                    subscription_tier: track === "player" ? "free" : undefined,
                    subscription_status: track === "player" ? "none" : undefined,
                })
                .eq("clerk_id", user.id);

            if (error) throw error;
            return track;
        },
        onSuccess: (track) => {
            queryClient.invalidateQueries({ queryKey: ["subscription-user", user?.id] });
            queryClient.invalidateQueries({ queryKey: ["db-user", user?.id] });
            onComplete();
            if (track === "player") {
                navigate("/player-dashboard");
            } else {
                navigate("/pricing");
            }
        },
    });

    const tracks: {
        id: UserTrack;
        icon: typeof Trophy;
        title: string;
        subtitle: string;
        label: string;
        features: string[];
        badgeColor: string;
    }[] = [
            {
                id: "player",
                icon: Trophy,
                title: "Player",
                subtitle: "I want to improve my skills",
                label: "FREE to start",
                features: [
                    "Upload & analyze your kicks",
                    "Track personal progress",
                    "Training recommendations",
                    "Global ranking position",
                ],
                badgeColor: "text-primary",
            },
            {
                id: "individual",
                icon: Shield,
                title: "Coach / Scout",
                subtitle: "I manage or discover players",
                label: "From $25/mo",
                features: [
                    "Browse full player database",
                    "Compare & watchlist players",
                    "Team match analysis",
                    "Export scouting reports",
                ],
                badgeColor: "text-amber-400",
            },
        ];

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent
                className="max-w-lg bg-background border-white/10 [&>button]:hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="text-center space-y-1">
                    <DialogTitle className="text-2xl font-black tracking-tight">
                        Choose your role
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        This determines your dashboard and features. You can switch later.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    {tracks.map(({ id, icon: Icon, title, subtitle, label, features, badgeColor }) => (
                        <button
                            key={id}
                            onClick={() => setSelected(id)}
                            className={cn(
                                "relative flex flex-col gap-4 rounded-2xl border p-5 text-left transition-all duration-200",
                                selected === id
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/40"
                                    : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                                    <Icon className={cn("h-6 w-6", badgeColor)} />
                                </div>
                                <span className={cn("text-xs font-bold", badgeColor)}>{label}</span>
                            </div>

                            <div>
                                <h3 className="font-bold text-base">{title}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                            </div>

                            <ul className="space-y-1.5">
                                {features.map((f) => (
                                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <ChevronRight className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {selected === id && (
                                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                    <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <Button
                    disabled={!selected || isPending}
                    onClick={() => selected && saveTrack(selected)}
                    className="w-full mt-2 bg-primary text-black font-bold h-12 rounded-xl hover:bg-primary/90 disabled:opacity-50"
                >
                    {isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting up your account…</>
                    ) : (
                        `Continue as ${selected === "player" ? "Player" : selected === "individual" ? "Coach / Scout" : "…"}`
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export default TrackSelectionModal;
