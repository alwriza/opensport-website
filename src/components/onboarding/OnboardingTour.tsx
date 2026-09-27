import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Dumbbell, ScanLine, Shield, UserRound, Users, Video, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { PoseFigure } from "@/components/redesign/primitives";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { finishOnboarding, shouldStartOnboarding, type OnboardingRole } from "@/lib/onboarding";
import "./onboarding.css";

type TourStep = { key: string; target: string };
type Rect = { x: number; y: number; width: number; height: number };
type Geometry = { highlight: Rect; card: { left: number; top: number }; hasTeam: boolean; ready: boolean };

const steps: Record<OnboardingRole, TourStep[]> = {
  player: [
    { key: "player.upload", target: "player-upload" },
    { key: "player.results", target: "player-results" },
    { key: "player.training", target: "player-training" },
  ],
  coach: [
    { key: "coach.team", target: "coach-team" },
    { key: "coach.invite", target: "coach-invite" },
    { key: "coach.workspace", target: "coach-workspace" },
  ],
};

function routeState(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function WelcomeArtwork({ role }: { role: OnboardingRole }) {
  const { t } = useTranslation("onboarding");
  const items = role === "player"
    ? [{ icon: Video, label: "record" }, { icon: ScanLine, label: "analyse" }, { icon: Dumbbell, label: "improve" }]
    : [{ icon: Shield, label: "create" }, { icon: Users, label: "invite" }, { icon: ScanLine, label: "follow" }];

  return <div className="onboarding-art" aria-hidden="true">
    <span className="onboarding-art-brand">OPENsport</span>
    <div className="onboarding-art-flow" key={role}>
      {items.map(({ icon: Icon, label }, index) => <div className="onboarding-art-node" key={label} style={{ "--node-delay": `${index * 180}ms` } as CSSProperties}>
        <span className="onboarding-art-icon"><Icon /></span>
        <span>{t(`art.${label}`)}</span>
        {index < items.length - 1 && <ArrowRight className="onboarding-art-arrow" />}
      </div>)}
    </div>
    <div className="onboarding-art-pitch"><span /><span /><span /></div>
  </div>;
}

function RecordingArtwork() {
  return <div className="onboarding-recording" aria-hidden="true">
    <svg viewBox="0 0 300 130" fill="none">
      <path d="M12 116H288" stroke="var(--hairline)" />
      <rect x="22" y="27" width="35" height="64" rx="3" stroke="var(--pitch)" strokeWidth="2" />
      <circle cx="39.5" cy="59" r="7" stroke="var(--pitch)" strokeWidth="1.5" />
      <path d="M65 59H182" stroke="var(--pitch)" strokeDasharray="4 5" />
      <path d="M175 53L183 59L175 65" stroke="var(--pitch)" strokeWidth="1.5" />
      <text x="104" y="46" fill="var(--ink-60)" fontSize="12" fontFamily="IBM Plex Mono, monospace">90°</text>
      <circle cx="273" cy="109" r="7" stroke="var(--pitch)" strokeWidth="1.5" />
    </svg>
    <PoseFigure />
  </div>;
}

export function OnboardingTour() {
  const { t } = useTranslation("onboarding");
  const { user, isLoaded } = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isDemo = location.pathname.startsWith("/demo");
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<OnboardingRole>("player");
  const [stepIndex, setStepIndex] = useState(-1);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const openedFor = useRef<string | null>(null);
  const shownFor = useRef(new Set<string>());
  const initialScroll = useRef(0);
  const returnFocus = useRef<HTMLElement | null>(null);
  const takingAction = useRef(false);
  const actionTimer = useRef<number>();
  const maskId = useId();
  const step = steps[role][stepIndex];
  const hasTeam = geometry?.hasTeam ?? false;

  useEffect(() => {
    const request = routeState(location.state);
    const replay = request.onboarding === "replay";
    if (!isLoaded && !isDemo || replay && !isDemo && !user) return;
    if (!replay && (open || !shouldStartOnboarding(user, { isDemo }) || shownFor.current.has(user!.id))) return;
    if (!replay && (request.upload || request.profile)) return;
    if (!replay && !["/player-dashboard", "/coach-dashboard"].includes(location.pathname)) return;

    const launch = () => {
      if (!replay && (!document.querySelector("[data-onboarding-dashboard]") || document.querySelector("[role=dialog]"))) return;
      const selectedRole = request.onboardingRole === "coach" || location.pathname.includes("coach-dashboard") ? "coach" : "player";
      initialScroll.current = window.scrollY;
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      openedFor.current = isDemo ? "demo" : user?.id ?? null;
      takingAction.current = false;
      if (!isDemo && user) shownFor.current.add(user.id);
      setRole(selectedRole);
      setStepIndex(-1);
      setGeometry(null);
      setOpen(true);
      observer.disconnect();
      if (request.onboarding) {
        const remaining = { ...request };
        delete remaining.onboarding;
        delete remaining.onboardingRole;
        navigate({ pathname: location.pathname, search: location.search, hash: location.hash }, { replace: true, state: Object.keys(remaining).length ? remaining : null });
      }
    };
    const observer = new MutationObserver(launch);
    observer.observe(document.body, { childList: true, subtree: true });
    launch();
    return () => observer.disconnect();
  }, [isDemo, isLoaded, location, navigate, open, user]);

  useEffect(() => {
    if (!open) return;
    const dashboard = ["/player-dashboard", "/coach-dashboard", "/demo", "/demo/coach-dashboard"].includes(location.pathname);
    const sameAccount = isDemo ? openedFor.current === "demo" : openedFor.current === user?.id;
    if (!dashboard || !sameAccount) setOpen(false);
  }, [isDemo, location.pathname, open, user?.id]);

  useLayoutEffect(() => {
    if (!open || !step) return;
    let scrolled = false;
    const update = () => {
      const target = document.querySelector<HTMLElement>(`[data-onboarding="${step.target}"]`);
      const card = cardRef.current;
      if (!target || !card) { setGeometry(null); return; }
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const compact = viewportWidth < 1024 || viewportHeight < 600;
      const navigationBottom = document.querySelector(".design-navigation")?.getBoundingClientRect().bottom ?? 0;
      const targetTop = Math.max(24, navigationBottom + 24);
      let rect = target.getBoundingClientRect();
      if (!scrolled) {
        scrolled = true;
        if (compact || rect.top < targetTop || rect.bottom > viewportHeight - 24) {
          const targetOffset = compact ? targetTop : Math.max(targetTop, (viewportHeight - Math.min(rect.height, viewportHeight - targetTop - 24)) / 2);
          window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - targetOffset), behavior: "instant" });
          rect = target.getBoundingClientRect();
        }
      }
      const cardWidth = card.offsetWidth;
      const cardHeight = card.offsetHeight;
      const margin = 16;
      const gap = 24;
      let left = (viewportWidth - cardWidth) / 2;
      let top = compact ? viewportHeight - cardHeight - margin : (viewportHeight - cardHeight) / 2;
      if (!compact) {
        if (viewportWidth - rect.right >= cardWidth + gap + margin) {
          left = rect.right + gap;
          top = rect.top;
        } else if (rect.left >= cardWidth + gap + margin) {
          left = rect.left - cardWidth - gap;
          top = rect.top;
        } else if (viewportHeight - rect.bottom >= cardHeight + gap + margin) {
          top = rect.bottom + gap;
        } else if (rect.top >= cardHeight + gap + margin) {
          top = rect.top - cardHeight - gap;
        }
      }
      left = Math.max(margin, Math.min(left, viewportWidth - cardWidth - margin));
      top = Math.max(margin, Math.min(top, viewportHeight - cardHeight - margin));
      const x = Math.max(8, rect.left - 8);
      const y = Math.max(navigationBottom + 8, rect.top - 8);
      const right = Math.min(viewportWidth - 8, rect.right + 8);
      const bottom = Math.min(viewportHeight - 8, compact ? top - 16 : viewportHeight, rect.bottom + 8);
      const next: Geometry = {
        highlight: { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) },
        card: { left, top },
        hasTeam: document.querySelector("[data-onboarding-dashboard=coach]")?.getAttribute("data-onboarding-has-team") === "true",
        ready: !!document.querySelector(`[data-onboarding-dashboard="${role}"]`),
      };
      setGeometry(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const resizeObserver = new ResizeObserver(update);
    if (cardRef.current) resizeObserver.observe(cardRef.current);
    const observer = new MutationObserver(update);
    const root = document.getElementById("root");
    if (root) observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-onboarding-has-team", "data-onboarding-dashboard"] });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [location.pathname, open, role, step]);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
      titleRef.current?.focus({ preventScroll: true });
    }
  }, [open, stepIndex]);

  useEffect(() => () => { window.clearTimeout(actionTimer.current); }, []);

  const dashboardPath = (selectedRole: OnboardingRole) => selectedRole === "coach"
    ? `${isDemo ? "/demo" : ""}/coach-dashboard`
    : isDemo ? "/demo" : "/player-dashboard";

  const start = () => {
    setStepIndex(0);
    const pathname = dashboardPath(role);
    const params = new URLSearchParams(pathname === location.pathname ? location.search : "");
    if (role === "coach") params.set("tab", "overview");
    navigate({ pathname, search: params.toString() ? `?${params}` : "" }, { replace: true, state: null });
  };

  const finish = (status: "completed" | "skipped", takeAction = false) => {
    takingAction.current = takeAction;
    if (!isDemo && user?.id === openedFor.current) void finishOnboarding(user, status, role);
    setOpen(false);
    if (!takeAction) return;
    // Let the tutorial release its focus trap before opening the real action dialog.
    actionTimer.current = window.setTimeout(() => {
      if (role === "player") navigate(dashboardPath(role), { state: { upload: Date.now() } });
      else if (isDemo) navigate(`${dashboardPath(role)}?tab=squad`);
      else document.querySelector<HTMLButtonElement>(`[data-onboarding="${hasTeam ? "coach-invite" : "coach-create"}"]`)?.click();
    }, 180);
  };

  const lastStep = stepIndex === steps[role].length - 1;
  const actionLabel = stepIndex < 0 ? "start" : !lastStep ? "next" : role === "player" ? "upload" : isDemo ? "openSquad" : hasTeam ? "invitePlayers" : "createTeam";
  const descriptionKey = role === "coach" && !hasTeam ? `${step?.key}.emptyDescription` : `${step?.key}.description`;
  const highlight = geometry?.highlight;
  const position = step && geometry ? { left: geometry.card.left, top: geometry.card.top, transform: "none" } : undefined;

  return <Dialog.Root open={open} onOpenChange={value => { if (!value) finish("skipped"); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="onboarding-overlay">
        <svg width="100%" height="100%" aria-hidden="true">
          <defs><mask id={maskId}><rect width="100%" height="100%" fill="white" />{step && highlight && <rect {...highlight} fill="black" rx="3" />}</mask></defs>
          <rect width="100%" height="100%" fill="#14150F" opacity=".76" mask={`url(#${maskId})`} />
        </svg>
        {step && highlight && highlight.height > 0 && <div className="onboarding-highlight" style={{ left: highlight.x, top: highlight.y, width: highlight.width, height: highlight.height }} />}
      </Dialog.Overlay>
      <Dialog.Content ref={cardRef} className={`onboarding-card ${step ? "onboarding-card-step" : "onboarding-card-welcome"}`} style={position}
        onInteractOutside={event => event.preventDefault()}
        onOpenAutoFocus={event => { event.preventDefault(); titleRef.current?.focus({ preventScroll: true }); }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          if (takingAction.current) return;
          window.scrollTo({ top: initialScroll.current, behavior: "instant" });
          const previous = returnFocus.current;
          const target = previous && previous !== document.body && document.contains(previous) ? previous : document.querySelector<HTMLElement>(".design-account");
          target?.focus({ preventScroll: true });
        }}>
        <Dialog.Close className="onboarding-close" aria-label={t("actions.close")}><X /></Dialog.Close>
        {!step ? <div className="onboarding-welcome">
          <WelcomeArtwork role={role} />
          <div className="onboarding-welcome-copy" ref={scrollRef}>
            <span className="onboarding-eyebrow">{t("welcome.eyebrow")}</span>
            <Dialog.Title ref={titleRef} tabIndex={-1} className="onboarding-title">{t("welcome.title")}</Dialog.Title>
            <Dialog.Description className="onboarding-description">{t("welcome.description")}</Dialog.Description>
            <div className="onboarding-role-options" role="group" aria-label={t("welcome.title")}>
              {(["player", "coach"] as const).map(option => <button key={option} className="onboarding-role-option" aria-pressed={role === option} onClick={() => setRole(option)}>
                {option === "player" ? <UserRound /> : <Users />}
                <span><strong>{t(`welcome.${option}Title`)}</strong><small>{t(`welcome.${option}Description`)}</small></span>
                <span className="onboarding-role-check" aria-hidden="true">{role === option ? "✓" : ""}</span>
              </button>)}
            </div>
            <p className="onboarding-duration">{t("welcome.duration")}</p>
          </div>
          <div className="onboarding-footer">
            <div className="onboarding-actions">
              <button className="onboarding-quiet" onClick={() => finish("skipped")}>{t("actions.skip")}</button>
              <button className="design-button" onClick={start}>{t("actions.start")}<ArrowRight /></button>
            </div>
          </div>
        </div> : <>
        <div className="onboarding-step-content" ref={scrollRef} key={`${role}-${stepIndex}`}>
          <div className="onboarding-progress">
            <span className="onboarding-eyebrow">{t("progress.step", { current: stepIndex + 1, total: steps[role].length })}</span>
            <ol aria-hidden="true">{steps[role].map((item, index) => <li key={item.key} data-current={index === stepIndex} data-complete={index < stepIndex} />)}</ol>
          </div>
          <Dialog.Title ref={titleRef} tabIndex={-1} className="onboarding-title">{t(`${step.key}.title`)}</Dialog.Title>
          <Dialog.Description className="onboarding-description">{t(descriptionKey)}</Dialog.Description>
          {step.key === "player.upload" && <RecordingArtwork />}
          <p className="onboarding-tip">{t(`${step.key}.tip`)}</p>
          {!geometry && <p className="onboarding-waiting" role="status">{t("status.loading", { ns: "common" })}</p>}
        </div>
        <div className="onboarding-footer">
          <div className="onboarding-actions">
            <button className="onboarding-quiet" onClick={() => setStepIndex(stepIndex - 1)}>{t("actions.back")}</button>
            <button className="design-button" disabled={lastStep && !geometry?.ready} onClick={() => lastStep ? finish("completed", true) : setStepIndex(stepIndex + 1)}>{t(`actions.${actionLabel}`)}<ArrowRight /></button>
          </div>
          <button className="onboarding-skip" onClick={() => finish("skipped")}>{t("actions.skip")}</button>
        </div></>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
