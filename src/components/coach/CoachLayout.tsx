import { useTranslation } from "react-i18next";
import { Trophy, Users, BarChart3, CalendarDays, ClipboardCheck, Dumbbell } from "lucide-react";

const TABS = [
    { key: "overview", icon: Trophy, labelKey: "coach.tabs.overview" },
    { key: "squad", icon: Users, labelKey: "coach.tabs.squad" },
    { key: "statistics", icon: BarChart3, labelKey: "coach.tabs.statistics" },
    { key: "matches", icon: CalendarDays, labelKey: "coach.tabs.matches" },
    { key: "evaluations", icon: ClipboardCheck, labelKey: "coach.tabs.evaluations" },
    { key: "training", icon: Dumbbell, labelKey: "coach.tabs.training" },
] as const;

export type CoachTab = (typeof TABS)[number]["key"];

interface CoachLayoutProps {
    children: React.ReactNode;
    activeTab: CoachTab;
    onTabChange: (tab: CoachTab) => void;
}

export function CoachLayout({ children, activeTab, onTabChange }: CoachLayoutProps) {
    const { t } = useTranslation("dashboard");

    return (
        <div className="min-h-screen">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex gap-1 overflow-x-auto py-3">
                        {TABS.map(({ key, icon: Icon, labelKey }) => (
                            <button
                                key={key}
                                onClick={() => onTabChange(key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                                    activeTab === key
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-white/5"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {t(labelKey)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-6">
                {children}
            </div>
        </div>
    );
}