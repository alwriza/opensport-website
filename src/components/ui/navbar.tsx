import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart3, Dumbbell, Home, LogOut, Swords, Trophy, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NavShell, { type NavLinkItem } from "@/components/ui/NavShell";

export default function Navbar() {
  const { t } = useTranslation("navbar");
  const navigate = useNavigate();
  const { user, isSignedIn } = useCurrentUser();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const links: NavLinkItem[] = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/player-dashboard", label: t("nav.playerDashboard"), icon: User },
    { to: "/coach-dashboard", label: t("nav.coachDashboard"), icon: Users },
    { to: "/training", label: t("nav.training"), icon: Dumbbell },
    { to: "/ranking", label: t("nav.ranking"), icon: Trophy },
    { to: "/duels", label: t("nav.duels"), icon: Swords },
  ];

  const email = user?.email ?? "";
  const initials = (email || "?").slice(0, 2).toUpperCase();

  const trailing = isSignedIn ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full ring-offset-background transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="h-9 w-9 ring-primary/40">
            <AvatarFallback className="bg-primary/15 text-primary">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[13rem]">
        {email && (
          <>
            <DropdownMenuLabel className="truncate px-2.5 text-xs font-normal text-muted-foreground">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => navigate("/player-dashboard")} className="cursor-pointer gap-2">
          <BarChart3 className="h-4 w-4" />
          {t("nav.playerDashboard")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          {t("buttons.signOut", "Sign out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <>
      <Button variant="ghost" size="sm" className="rounded-full" onClick={() => navigate("/demo")}>
        {t("nav.demo", "Demo")}
      </Button>
      <Button size="pill" onClick={() => navigate("/login")}>
        {t("buttons.getStarted")}
      </Button>
    </>
  );

  const mobileTrailing = isSignedIn ? (
    <Button variant="outline" className="w-full" onClick={handleSignOut}>
      <LogOut className="h-4 w-4" />
      {t("buttons.signOut", "Sign out")}
    </Button>
  ) : (
    <>
      <Button variant="outline" className="w-full" onClick={() => navigate("/demo")}>
        {t("nav.demo", "Demo")}
      </Button>
      <Button className="w-full" onClick={() => navigate("/login")}>
        {t("buttons.getStarted")}
      </Button>
    </>
  );

  return <NavShell homeHref="/" links={links} trailing={trailing} mobileTrailing={mobileTrailing} />;
}
