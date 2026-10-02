import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChartNoAxesColumn, ChevronDown, Dumbbell, Globe, Home, LogOut, Menu, Play, Upload, UserRound, Users } from "lucide-react";
import { Brand } from "@/components/redesign/primitives";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDesignCopy } from "@/hooks/useDesignCopy";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = ["en", "ru", "kk"] as const;
type AccountRouteState = { profile?: number; onboarding?: "replay"; onboardingRole?: "player" | "coach" };

export default function Navbar() {
  const copy = useDesignCopy();
  const { i18n, t } = useTranslation("navbar");
  const { t: onboardingCopy } = useTranslation("onboarding");
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSignedIn } = useCurrentUser();
  const [accountOpen, setAccountOpen] = useState(false);
  const navigationRef = useRef<HTMLDivElement>(null);
  const openingDialog = useRef(false);
  const demo = location.pathname === "/demo" || location.pathname.startsWith("/demo/");
  const landing = ["/", "/demo/home", "/about"].includes(location.pathname);
  const workspace = demo || isSignedIn;
  const homePath = demo ? "/demo/home" : "/";
  const playerPath = demo ? "/demo" : "/player-dashboard";
  const demoActionPath = isSignedIn ? "/player-dashboard" : "/register";
  const demoActionLabel = t(isSignedIn ? "controls.returnToAccount" : "controls.demoAction");
  const route = (path: string) => `${demo ? "/demo" : ""}${path}`;
  const language = (i18n.resolvedLanguage || i18n.language).split("-")[0];
  const languageCode = language === "kk" ? "KZ" : language.toUpperCase();
  const accountName = user?.user_metadata?.nickname || user?.user_metadata?.name || t("controls.account");
  const items = [
    { to: homePath, label: t("nav.home"), icon: Home },
    { to: playerPath, label: t("controls.myProfile"), icon: UserRound },
    { to: route("/coach-dashboard"), label: t("controls.coachWorkspace"), icon: Users },
    { to: route("/training"), label: t("nav.training"), icon: Dumbbell },
    { to: route("/ranking"), label: t("nav.ranking"), icon: ChartNoAxesColumn },
    { to: route("/duels"), label: t("nav.duels") },
  ];
  const marketingItems = [
    { to: `${homePath}#how`, label: copy("How it works") },
    { to: `${homePath}#pipeline`, label: copy("Pipeline") },
    { to: `${homePath}#roles`, label: copy("Who it is for") },
    { to: `${homePath}#science`, label: copy("Science") },
    { to: "/about", label: copy("About") },
  ];

  useEffect(() => { setAccountOpen(false); }, [location.pathname]);

  // Share the actual sticky height with anchor scrolling and the guided tour.
  useLayoutEffect(() => {
    const element = navigationRef.current;
    if (!element) return;
    const update = () => document.documentElement.style.setProperty("--navigation-height", `${element.offsetHeight}px`);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => { observer.disconnect(); document.documentElement.style.removeProperty("--navigation-height"); };
  }, []);

  const openAccountRoute = (path: string, state?: AccountRouteState) => {
    openingDialog.current = !!state;
    setAccountOpen(false);
    if (state) requestAnimationFrame(() => navigate(path, { state }));
    else navigate(path);
  };

  const signOut = async () => {
    setAccountOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) { toast({ title: t("controls.signOutError"), variant: "destructive" }); return; }
    navigate("/");
  };

  const languageChoices = <DropdownMenuRadioGroup value={language} onValueChange={value => { void i18n.changeLanguage(value); }}>
    {languages.map(code => <DropdownMenuRadioItem key={code} value={code}>{t(`controls.languages.${code}`)}</DropdownMenuRadioItem>)}
  </DropdownMenuRadioGroup>;

  return <>
    <div ref={navigationRef} className="design-navigation" data-workspace={demo || isSignedIn && !landing ? "true" : undefined}>
      <header className={`design-header ${landing ? "design-header-dark" : ""}`}>
        <Brand to={homePath} />
        <nav className="design-header-nav" aria-label={t("controls.mainNavigation")}>
          {demo || !landing && isSignedIn
            ? items.map(item => <NavLink key={item.to} to={item.to} end className={({ isActive }) => isActive ? "active" : ""}>{item.label}</NavLink>)
            : marketingItems.map(item => <Link key={item.to} to={item.to}>{item.label}</Link>)}
        </nav>
        <div className="design-header-controls">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild><button className="design-language" aria-label={`${t("controls.language")}: ${t(`controls.languages.${language}`)}`}><Globe aria-hidden="true" /><span>{languageCode}</span><ChevronDown aria-hidden="true" /></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="design-navigation-menu">{languageChoices}</DropdownMenuContent>
          </DropdownMenu>
          {!workspace && <>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild><button className="design-demo-trigger" aria-label={t("controls.tryDemo")}><Play aria-hidden="true" /><span className="design-demo-full-label">{t("controls.tryDemo")}</span><span className="design-demo-short-label">{t("nav.demo")}</span><ChevronDown aria-hidden="true" /></button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="design-navigation-menu design-demo-menu">
                <DropdownMenuLabel>{t("controls.guestDescription")}</DropdownMenuLabel>
                <DropdownMenuItem asChild><Link to="/demo"><UserRound aria-hidden="true" />{t("controls.playerDemo")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/demo/coach-dashboard"><Users aria-hidden="true" />{t("controls.coachDemo")}</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link className="design-auth-link" to="/login">{t("controls.signIn")}</Link>
            <Link className="design-button design-header-primary" to="/register">{t("controls.register")}</Link>
          </>}
          {demo && <Link className="design-button design-header-primary" to={demoActionPath}>{demoActionLabel}</Link>}
          {isSignedIn && !demo && landing && <Link className="design-button design-header-primary" to={playerPath}>{t("controls.myProfile")}</Link>}
          <DropdownMenu modal={false} open={accountOpen} onOpenChange={setAccountOpen}>
            <DropdownMenuTrigger asChild>
              <button className={`design-account ${!workspace ? "design-guest-menu-trigger" : ""}`} aria-label={workspace && !demo ? t("controls.account") : t("controls.menu")}>
                {workspace && !demo ? <UserRound aria-hidden="true" /> : <Menu aria-hidden="true" />}
                <span className="design-account-name">{demo ? t("controls.menu") : accountName}</span><ChevronDown className="design-account-chevron" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="design-navigation-menu design-account-menu" onCloseAutoFocus={event => {
              if (openingDialog.current) event.preventDefault();
              openingDialog.current = false;
            }}>
              <DropdownMenuLabel>{demo ? t("controls.demoNavigation") : workspace ? accountName : t("controls.mainNavigation")}</DropdownMenuLabel>
              {workspace ? items.map(({ to, label, icon: Icon }) => <DropdownMenuItem key={to} asChild><NavLink to={to} end>{Icon && <Icon aria-hidden="true" />}{label}</NavLink></DropdownMenuItem>)
                : marketingItems.map(item => <DropdownMenuItem key={item.to} asChild><Link to={item.to}>{item.label}</Link></DropdownMenuItem>)}
              <DropdownMenuSeparator />
              {workspace && <>
                <DropdownMenuItem onSelect={() => openAccountRoute(playerPath, { profile: Date.now() })}>{copy("Edit profile")}</DropdownMenuItem>
                <DropdownMenuItem data-onboarding-replay onSelect={() => {
                  const role = location.pathname.includes("coach-dashboard") ? "coach" : "player";
                  openAccountRoute(role === "coach" ? route("/coach-dashboard") : playerPath, { onboarding: "replay", onboardingRole: role });
                }}>{onboardingCopy("actions.replay")}</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><Globe className="mr-2 h-4 w-4" aria-hidden="true" />{t("controls.language")} · {languageCode}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="design-navigation-menu">{languageChoices}</DropdownMenuSubContent>
              </DropdownMenuSub>
              {!workspace && <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t("controls.guestDescription")}</DropdownMenuLabel>
                <DropdownMenuItem asChild><Link to="/demo"><UserRound aria-hidden="true" />{t("controls.playerDemo")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/demo/coach-dashboard"><Users aria-hidden="true" />{t("controls.coachDemo")}</Link></DropdownMenuItem>
              </>}
              <DropdownMenuSeparator />
              {demo ? <>
                <DropdownMenuItem asChild><Link to={demoActionPath}>{demoActionLabel}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/"><LogOut aria-hidden="true" />{t("controls.exitDemo")}</Link></DropdownMenuItem>
              </> : isSignedIn ? <DropdownMenuItem onSelect={() => { void signOut(); }}><LogOut aria-hidden="true" />{t("controls.signOut")}</DropdownMenuItem> : <>
                <DropdownMenuItem asChild><Link to="/login">{t("controls.signIn")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/register">{t("controls.register")}</Link></DropdownMenuItem>
              </>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {demo && <aside className="design-demo-bar" aria-label={t("controls.demoLabel")}>
        <div className="design-demo-context"><span className="design-demo-badge">{t("controls.demoLabel")}</span><p className="design-demo-description">{t("controls.demoDescription")}</p><p className="design-demo-description-short">{t("controls.demoShort")}</p></div>
        <Link className="design-demo-exit" to="/">{t("controls.exitDemo")}<LogOut aria-hidden="true" /></Link>
      </aside>}
    </div>
    {!landing && workspace && <nav className="design-mobile-nav" aria-label={t("controls.quickNavigation")}>
      {items.slice(0, 2).map(({ to, icon: Icon }, index) => <NavLink key={to} to={to} end className={({ isActive }) => isActive ? "active" : ""}>{Icon && <Icon aria-hidden="true" />}<span>{index === 0 ? t("nav.home") : t("nav.playerDashboard")}</span></NavLink>)}
      <button className="design-upload-nav" aria-label={t("controls.uploadVideo")} onClick={() => navigate(playerPath, { state: { upload: Date.now() } })}><Upload aria-hidden="true" /><span>{t("controls.mobileUpload")}</span></button>
      {items.slice(3, 5).map(({ to, icon: Icon }, index) => <NavLink key={to} to={to} end className={({ isActive }) => isActive ? "active" : ""}>{Icon && <Icon aria-hidden="true" />}<span>{copy(index === 0 ? "Train" : "Rank")}</span></NavLink>)}
    </nav>}
  </>;
}
