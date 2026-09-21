import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BarChart3, Cpu, GraduationCap } from "lucide-react";

const HIGHLIGHT_ICONS = [Cpu, BarChart3, GraduationCap] as const;
const HIGHLIGHT_KEYS = ["ai", "analytics", "training"] as const;

interface AuthLayoutProps {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Rendered under the form — "already have an account?" and friends. */
  footer?: React.ReactNode;
}

/**
 * Two-pane shell for every auth screen: brand story on the left (desktop
 * only), the form on the right. Keeps sign-in, sign-up and recovery on one
 * visual footing instead of three lonely cards on a black page.
 */
export default function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  const { t } = useTranslation("home");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* --- Brand pane --- */}
      <aside className="relative hidden overflow-hidden border-r border-border lg:flex lg:flex-col lg:justify-between">
        <img src="/stadium-bg.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/60" />
        <div className="absolute inset-0 bg-grid opacity-30 mask-fade-edges" />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/15 blur-[110px]"
        />

        <div className="relative p-10 xl:p-14">
          <Link to="/" className="inline-block transition-opacity hover:opacity-80">
            <img src="/logo.svg" alt="OPENsport" className="h-9 w-auto" />
          </Link>
        </div>

        <div className="relative px-10 pb-14 xl:px-14">
          <h2 className="font-display text-3xl font-bold leading-tight text-foreground xl:text-4xl">
            {t("hero.title.line1")} <span className="text-primary">{t("hero.title.line2")}</span>
            <br />
            {t("hero.title.line3")}
          </h2>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHT_KEYS.map((key, i) => {
              const Icon = HIGHLIGHT_ICONS[i];
              return (
                <li key={key} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{t(`about.features.${key}.title`)}</p>
                    <p className="mt-0.5 line-clamp-2 max-w-sm text-sm text-muted-foreground">
                      {t(`about.features.${key}.description`)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-12 flex gap-8 border-t border-border pt-7">
            {(["videos", "speed", "languages"] as const).map((key) => (
              <div key={key}>
                <p className="font-display text-2xl font-bold text-primary">{t(`hero.stats.${key}.value`)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(`hero.stats.${key}.label`)}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* --- Form pane --- */}
      <section className="relative flex flex-col justify-center px-5 py-12 sm:px-8 lg:px-12 xl:px-20">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/[0.07] blur-[100px] lg:hidden"
        />

        <div className="relative mx-auto w-full max-w-md">
          {/* Mobile logo — the brand pane is hidden at this width */}
          <Link to="/" className="mb-10 inline-block lg:hidden">
            <img src="/logo.svg" alt="OPENsport" className="h-8 w-auto" />
          </Link>

          <Link
            to="/"
            className="mb-7 hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary lg:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" />
            opensport.app
          </Link>

          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-7 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </section>
    </div>
  );
}
