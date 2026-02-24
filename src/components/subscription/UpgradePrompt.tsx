import { Rocket, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    /** Show inline (no modal) for small spaces */
    inline?: boolean;
}

/**
 * UpgradePrompt — shown when user hits a subscription limit or locked feature.
 * Can render as a modal dialog or inline block.
 */
export function UpgradePrompt({
    open,
    onClose,
    title = "Upgrade Required",
    description = "Upgrade your plan to unlock this feature.",
    inline = false,
}: UpgradePromptProps) {
    const navigate = useNavigate();

    const handleViewPlans = () => {
        onClose();
        navigate("/pricing");
    };

    if (inline) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Lock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Button
                    size="sm"
                    className="shrink-0 bg-primary text-black font-bold hover:bg-primary/90"
                    onClick={handleViewPlans}
                >
                    Upgrade
                </Button>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-md bg-background border-white/10">
                <DialogHeader className="items-center text-center space-y-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Rocket className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-2">
                    <Button
                        className="w-full bg-primary text-black font-bold hover:bg-primary/90"
                        onClick={handleViewPlans}
                    >
                        View Plans
                    </Button>
                    <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
                        Maybe Later
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default UpgradePrompt;
