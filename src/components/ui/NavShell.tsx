import { Link, useLocation } from "react-router-dom";
import { Globe, Menu, X, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NavLinkItem {
  to: string;
  label: string;
  icon?: LucideIcon;
}

interface NavShellProps {
  /** Where the logo points. */
  homeHref: string;
  links: NavLinkItem[];
  /** Rendered at the trailing edge on desktop (CTA, avatar menu, …). */
  trailing?: React.ReactNode;
  /** Rendered at the foot of the mobile drawer. */
  mobileTrailing?: React.ReactNode;
  /** Small label next to the logo, e.g. "Demo". */
  badge?: string;
}

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "kk", label: "KZ" },
];

/**
 * Shared site header. Transparent while the page is at the top so it floats
 * over the hero, then condenses into a frosted bar once you scroll.
 */
export default function NavShell({ homeHref, links, trailing, mobileTrailing, badge }: NavShellProps) {
  const { i18n } = useTranslation("navbar");
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer whenever navigation happens
  useEffect(() => setOpen(false), [location.pathname]);

  // Freeze the page behind the open drawer
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (path: string) => location.pathname === path;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setOpen(false);
  };

  const activeLang = LANGUAGES.find((l) => i18n.language?.startsWith(l.code))?.label ?? "EN";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-6 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        {/* Logo */}
        <Link to={homeHref} className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80">
          <img src="/logo.svg" alt="OPENsport" className="h-8 w-auto lg:h-9" />
          {badge && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              {badge}
            </span>
          )}
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                isActive(link.to)
                  ? "bg-surface-2 text-foreground"
                  : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
              )}
            >
              {link.label}
              {isActive(link.to) && (
                <span className="absolute inset-x-3.5 -bottom-px h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop trailing controls */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 rounded-full px-3">
                <Globe className="h-4 w-4" />
                <span className="text-xs font-semibold">{activeLang}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[7rem]">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={cn(
                    "cursor-pointer font-medium",
                    i18n.language?.startsWith(lang.code) && "text-primary",
                  )}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {trailing}
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-foreground transition-colors hover:border-border-strong lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-x-0 top-16 z-50 origin-top overflow-y-auto border-t border-border bg-background/95 backdrop-blur-xl transition-all duration-300 lg:hidden",
          open
            ? "pointer-events-auto max-h-[calc(100vh-4rem)] opacity-100"
            : "pointer-events-none max-h-0 opacity-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-5">
          {links.map((link, i) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{ transitionDelay: open ? `${i * 35}ms` : "0ms" }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all",
                  isActive(link.to)
                    ? "border border-primary/25 bg-primary/10 text-primary"
                    : "border border-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                {link.label}
              </Link>
            );
          })}

          <div className="my-4 flex justify-center gap-2 border-y border-border py-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-bold transition-colors",
                  i18n.language?.startsWith(lang.code)
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {mobileTrailing && <div className="flex flex-col gap-3 pb-4">{mobileTrailing}</div>}
        </nav>
      </div>
    </header>
  );
}
