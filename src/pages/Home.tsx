import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cloud,
  Cpu,
  GraduationCap,
  Loader,
  MapPin,
  Mail,
  Sprout,
  TrendingUp,
  UserPlus,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { SectionHeading } from "@/components/ui/section-heading";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const FEATURE_ICONS = { ai: Cpu, analytics: BarChart3, training: GraduationCap } as const;

const STEPS = [
  { key: "step1", icon: UserPlus },
  { key: "step2", icon: Video },
  { key: "step3", icon: TrendingUp },
  { key: "step4", icon: Sprout },
] as const;

const TRACTION = [
  { key: "mvp", icon: CheckCircle2, tone: "done" },
  { key: "dataset", icon: CheckCircle2, tone: "done" },
  { key: "v2", icon: Loader, tone: "active" },
  { key: "cloud", icon: Cloud, tone: "next" },
] as const;

const IMPACT_CARDS = [
  { key: "global", image: "/global-reach.png" },
  { key: "fairPlay", image: "/fair-play.png" },
  { key: "equalAccess", image: "/equal-access.png" },
] as const;

const TEAM = ["cto", "ceo"] as const;

export default function Home() {
  const { t } = useTranslation("home");
  const { user } = useCurrentUser();

  const aboutRef = useScrollReveal();
  const tractionRef = useScrollReveal();
  const impactRef = useScrollReveal();
  const howItWorksRef = useScrollReveal();
  const quoteRef = useScrollReveal();
  const teamRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const heroStats = ["videos", "speed", "languages"] as const;
  const marquee = t("marquee", { returnObjects: true }) as string[];
  const marqueeItems = Array.isArray(marquee) ? marquee : [];

  return (
    <div className="bg-background">
      {/* ================= HERO ================= */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        {/* Backdrop: stadium photo, darkened, with a faint pitch grid over it */}
        <div className="absolute inset-0">
          <img
            src="/stadium-bg.png"
            alt=""
            className="h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70" />
          <div className="absolute inset-0 bg-grid opacity-40 mask-fade-edges" />
        </div>

        {/* Lime glow anchored behind the headline */}
        <div
          aria-hidden
          className="absolute -left-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-[120px]"
        />

        <div className="section-container relative z-10 py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {t("hero.badge")}
            </span>

            <h1 className="mt-7 font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              <span className="block text-foreground">{t("hero.title.line1")}</span>
              <span className="block text-gradient-primary">{t("hero.title.line2")}</span>
              <span className="mt-1 block text-foreground">{t("hero.title.line3")}</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Button asChild size="xl" variant="hero">
                  <Link to="/player-dashboard">
                    {t("hero.cta.dashboard")}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="xl" variant="hero">
                    <Link to="/login">
                      {t("hero.cta.start")}
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="xl" variant="outline">
                    <Link to="/login">{t("hero.cta.coaches")}</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Proof strip */}
            <dl className="mt-14 grid max-w-xl grid-cols-3 gap-4 border-t border-border pt-8">
              {heroStats.map((key) => (
                <div key={key}>
                  <dt className="font-display text-3xl font-bold text-primary sm:text-4xl">
                    {t(`hero.stats.${key}.value`)}
                  </dt>
                  <dd className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">
                    {t(`hero.stats.${key}.label`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute inset-x-0 bottom-7 hidden justify-center lg:flex">
          <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-subtle-foreground">
            <span className="h-8 w-px animate-pulse bg-gradient-to-b from-transparent to-primary" />
            {t("hero.scrollHint")}
          </span>
        </div>
      </section>

      {/* ================= CAPABILITY TICKER ================= */}
      {marqueeItems.length > 0 && (
        <div className="overflow-hidden border-y border-border bg-surface-1 py-4">
          <div className="flex w-max animate-marquee items-center">
            {/* Duplicated once so the -50% translate loops seamlessly */}
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="flex shrink-0 items-center gap-10 pr-10 text-sm font-semibold uppercase tracking-[0.18em] text-subtle-foreground"
              >
                {item}
                <span className="h-1 w-1 rounded-full bg-primary/60" />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ================= WHAT IS OPENSPORT ================= */}
      <section ref={aboutRef} className="scroll-reveal section-container py-24 lg:py-32">
        <SectionHeading
          eyebrow="OPENsport"
          title={
            <>
              {t("about.titleStart")} <span className="text-primary">{t("about.titleHighlight")}</span>
            </>
          }
          description={t("about.description")}
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(FEATURE_ICONS) as Array<keyof typeof FEATURE_ICONS>).map((key) => {
            const Icon = FEATURE_ICONS[key];
            return (
              <SpotlightCard key={key} className="flex flex-col gap-4 p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {t(`about.features.${key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`about.features.${key}.description`)}
                </p>
              </SpotlightCard>
            );
          })}
        </div>
      </section>

      {/* ================= TRACTION / ROADMAP ================= */}
      <section ref={tractionRef} className="scroll-reveal relative border-y border-border bg-surface-1/50">
        <div className="absolute inset-0 bg-spotlight" aria-hidden />
        <div className="section-container relative py-24 lg:py-28">
          <SectionHeading
            eyebrow="Roadmap"
            title={t("traction.title")}
            description={t("traction.subtitle")}
            size="md"
          />

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRACTION.map(({ key, icon: Icon, tone }, i) => (
              <li
                key={key}
                className={`relative rounded-2xl border p-6 transition-colors ${
                  tone === "active"
                    ? "border-primary/40 bg-primary/[0.06]"
                    : "border-border bg-card hover:border-border-strong"
                }`}
              >
                {/* Connector between milestones on wide screens */}
                {i < TRACTION.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute -right-2 top-1/2 hidden h-px w-4 bg-border lg:block"
                  />
                )}

                <div className="flex items-center justify-between gap-2">
                  <Icon
                    className={`h-5 w-5 ${tone === "next" ? "text-subtle-foreground" : "text-primary"} ${
                      tone === "active" ? "animate-spin [animation-duration:3s]" : ""
                    }`}
                  />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {t(`traction.items.${key}.status`)}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                  {t(`traction.items.${key}.label`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`traction.items.${key}.description`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= COMMUNITY IMPACT ================= */}
      <section ref={impactRef} id="mission" className="scroll-reveal section-container py-24 lg:py-32">
        <SectionHeading eyebrow="Mission" title={t("impact.title")} description={t("impact.description")} />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {IMPACT_CARDS.map(({ key, image }) => (
            <article
              key={key}
              className="group relative isolate overflow-hidden rounded-3xl border border-border transition-colors duration-300 hover:border-primary/40"
            >
              <div className="relative h-[24rem] bg-surface-2">
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 lg:p-7">
                <h3 className="font-display text-2xl font-bold leading-tight text-foreground">
                  {t(`impact.cards.${key}.title`)}
                </h3>
                <p className="mt-2.5 text-sm font-medium leading-relaxed text-foreground/80">
                  {t(`impact.cards.${key}.subtitle`)}
                </p>
                {/* Expands on hover so the card stays scannable at rest */}
                <p className="mt-2 max-h-0 overflow-hidden text-sm leading-relaxed text-muted-foreground opacity-0 transition-all duration-500 group-hover:max-h-32 group-hover:opacity-100">
                  {t(`impact.cards.${key}.description`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section
        ref={howItWorksRef}
        id="how-it-works"
        className="scroll-reveal relative border-y border-border bg-surface-1/50 py-24 lg:py-32"
      >
        <div className="section-container">
          <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
            <div className="lg:sticky lg:top-28">
              <SectionHeading
                eyebrow="Process"
                title={
                  <>
                    {t("howItWorks.title.line1")}
                    <br />
                    <span className="text-primary">{t("howItWorks.title.line2")}</span>
                  </>
                }
                description={t("howItWorks.description")}
              />
            </div>

            <div className="relative h-[560px]">
              <Carousel
                orientation="vertical"
                opts={{ loop: true, align: "start" }}
                plugins={[
                  AutoScroll({
                    playOnInit: true,
                    speed: 0.5,
                    stopOnInteraction: false,
                    stopOnMouseEnter: true,
                  }),
                ]}
                className="h-full"
              >
                <CarouselContent className="h-full">
                  {STEPS.map(({ key, icon: Icon }, i) => (
                    <CarouselItem key={key} className="basis-auto pt-4">
                      <div className="flex h-[264px] flex-col justify-center rounded-2xl border border-border bg-card p-7 transition-colors duration-500 hover:border-primary/30">
                        <div className="flex items-center justify-between">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" />
                          </span>
                          <span className="font-display text-4xl font-bold text-surface-3">
                            0{i + 1}
                          </span>
                        </div>
                        <h3 className="mt-6 font-display text-xl font-semibold text-foreground">
                          {t(`howItWorks.steps.${key}.title`)}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {t(`howItWorks.steps.${key}.description`)}
                        </p>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {/* Fade the list into the section background at both ends */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-background to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-background to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= QUOTE ================= */}
      <section ref={quoteRef} className="scroll-reveal section-container py-24 lg:py-28">
        <figure className="relative mx-auto max-w-4xl rounded-3xl border border-border bg-card px-6 py-14 text-center sm:px-14">
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 font-display text-7xl leading-none text-primary"
          >
            &ldquo;
          </span>

          <blockquote className="font-display text-xl font-medium leading-relaxed text-foreground sm:text-2xl lg:text-3xl">
            {t("quote.text")}
          </blockquote>

          <figcaption className="mt-8">
            <p className="font-semibold text-foreground">{t("quote.author")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("quote.role")}</p>
          </figcaption>
        </figure>
      </section>

      {/* ================= TEAM ================= */}
      <section ref={teamRef} className="scroll-reveal border-t border-border bg-surface-1/50">
        <div className="section-container py-24 lg:py-28">
          <SectionHeading
            eyebrow="Team"
            title={t("team.title")}
            description={
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                {t("team.location")}
              </span>
            }
            size="md"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {TEAM.map((key) => {
              const name = t(`team.members.${key}.name`);
              const initials = name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("");
              return (
                <SpotlightCard key={key} className="p-7">
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 font-display text-lg font-bold text-primary">
                      {initials}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{name}</h3>
                      <p className="text-sm font-medium text-primary">{t(`team.members.${key}.role`)}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                    {t(`team.members.${key}.bio`)}
                  </p>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section ref={ctaRef} className="scroll-reveal section-container py-24 lg:py-32">
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card px-6 py-16 text-center sm:px-14">
          <div aria-hidden className="absolute inset-0 bg-spotlight" />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-56 bg-grid opacity-30 mask-fade-t"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("contact.headline1")}
              <br />
              <span className="text-primary">{t("contact.headline2")}</span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("contact.subtext")}
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" variant="hero">
                <Link to={user ? "/player-dashboard" : "/register"}>
                  {user ? t("hero.cta.dashboard") : t("contact.cta.primary")}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link to="/demo">{t("contact.cta.secondary")}</Link>
              </Button>
            </div>

            <a
              href="mailto:contact@opensport.app"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              {t("contact.emailLabel")}
              <span className="text-foreground">contact@opensport.app</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
