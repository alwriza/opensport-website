import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dumbbell, Home, LogOut, Swords, Trophy, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import NavShell, { type NavLinkItem } from "@/components/ui/NavShell";

export default function DemoNavbar() {
  const { t } = useTranslation("navbar");
  const navigate = useNavigate();

  const links: NavLinkItem[] = [
    { to: "/demo/home", label: t("nav.home"), icon: Home },
    { to: "/demo", label: t("nav.playerDashboard"), icon: User },
    { to: "/demo/coach-dashboard", label: t("nav.coachDashboard"), icon: Users },
    { to: "/demo/training", label: t("nav.training"), icon: Dumbbell },
    { to: "/demo/ranking", label: t("nav.leaderboard"), icon: Trophy },
    { to: "/demo/duels", label: t("nav.duels"), icon: Swords },
  ];

  const exitLabel = t("buttons.exitDemo", "Exit demo");

  return (
    <NavShell
      homeHref="/demo"
      badge={t("nav.demo", "Demo")}
      links={links}
      trailing={
        <Button variant="outline" size="pill" onClick={() => navigate("/")}>
          <LogOut className="h-4 w-4" />
          {exitLabel}
        </Button>
      }
      mobileTrailing={
        <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
          <LogOut className="h-4 w-4" />
          {exitLabel}
        </Button>
      }
    />
  );
}
