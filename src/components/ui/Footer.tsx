import { Link } from "react-router-dom";
import { Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";

const SOCIALS = [
    {
        label: "Instagram",
        href: "https://www.instagram.com/opensport.ai?igsh=MTZ5eHd0ajUwcGVkOA%3D%3D&utm_source=qr",
        Icon: Instagram,
    },
    {
        label: "TikTok",
        href: "https://www.tiktok.com/@opensport_ai?_r=1&_t=ZM-933B8Y8fumJ",
        Icon: TikTokIcon,
    },
    { label: "YouTube", href: "https://www.youtube.com/@opensport_app", Icon: Youtube },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/opensport", Icon: Linkedin },
];

/** lucide has no TikTok glyph, so the note mark stands in for it. */
function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
        >
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
    );
}

export default function Footer() {
    const { t } = useTranslation("footer");

    const columns = [
        {
            title: t("platform.title"),
            links: [
                { to: "/player-dashboard", label: t("platform.playerProfiles") },
                { to: "/training", label: t("platform.performanceTracking") },
            ],
        },
        {
            title: t("for.title"),
            links: [
                { to: "/player-dashboard", label: t("for.players") },
                { to: "/coach-dashboard", label: t("for.coaches") },
            ],
        },
    ];

    return (
        <footer className="relative border-t border-border bg-surface-1/60">
            {/* Faint grid so the footer reads as part of the product, not a dead zone */}
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.15]" />

            <div className="section-container relative py-14 lg:py-16">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <img src="/logo.svg" alt="OPENsport" className="h-9 w-auto" />
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                            {t("description")}
                        </p>

                        <a
                            href="mailto:contact@opensport.app"
                            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            <Mail className="h-4 w-4" />
                            contact@opensport.app
                        </a>

                        <div className="mt-5 flex gap-2">
                            {SOCIALS.map(({ label, href, Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                                >
                                    <Icon className="h-[18px] w-[18px]" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {columns.map((col) => (
                        <nav key={col.title}>
                            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle-foreground">
                                {col.title}
                            </h3>
                            <ul className="mt-4 space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.to}
                                            className="text-sm text-muted-foreground transition-colors hover:text-primary"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}

                    <nav>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle-foreground">
                            {t("about.title")}
                        </h3>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <a
                                    href="/#mission"
                                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                                >
                                    {t("about.mission")}
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/#how-it-works"
                                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                                >
                                    {t("about.howItWorks")}
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-7 sm:flex-row sm:justify-between">
                    <p className="text-xs text-subtle-foreground">{t("copyright")}</p>
                    <div className="flex gap-6">
                        <Link to="/terms" className="text-xs text-subtle-foreground transition-colors hover:text-primary">
                            {t("links.terms")}
                        </Link>
                        <Link to="/privacy" className="text-xs text-subtle-foreground transition-colors hover:text-primary">
                            {t("links.privacy")}
                        </Link>
                    </div>
                </div>

                <p className="mt-6 max-w-4xl text-xs leading-relaxed text-subtle-foreground/70">
                    {t("trademarks")}
                </p>
            </div>
        </footer>
    );
}
