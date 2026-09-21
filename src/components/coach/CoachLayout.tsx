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
            {/* Offset matches the site header height, or the bar hides under it */}
            <div className="sticky top-16 z-30 border-b border-border bg-background/90 backdrop-blur-xl lg:top-[72px]">
                <div className="mx-auto max-w-[1600px] px-4 md:px-6">
                    <div className="no-scrollbar flex gap-1.5 overflow-x-auto py-3">
                        {TABS.map(({ key, icon: Icon, labelKey }) => (
                            <button
                                key={key}
                                onClick={() => onTabChange(key)}
                                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                                    activeTab === key
                                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                                        : "border-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {t(labelKey)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-6">{children}</div>
        </div>
    );
}
