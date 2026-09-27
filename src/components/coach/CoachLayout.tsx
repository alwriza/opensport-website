import { useTranslation } from "react-i18next";

const TABS = ["overview", "squad", "statistics", "matches", "evaluations", "training"] as const;
export type CoachTab = (typeof TABS)[number];

export function CoachLayout({ children, activeTab, onTabChange }: {
  children: React.ReactNode; activeTab: CoachTab; onTabChange: (tab: CoachTab) => void;
}) {
  const { t } = useTranslation("dashboard");
  return <>
    <nav className="design-coach-tabs" aria-label="Team sections" data-onboarding="coach-workspace">
      {TABS.map(tab => <button key={tab} className={activeTab === tab ? "active" : ""} aria-current={activeTab === tab ? "page" : undefined} onClick={() => onTabChange(tab)}>{t(`coach.tabs.${tab}`)}</button>)}
    </nav>
    <div className={`design-coach-content ${activeTab !== "overview" ? "design-coach-panel" : ""}`}>
      {children}
    </div>
  </>;
}
