import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DEMO_MATCH_PHOTO } from "@/demo/matchDemo";
import { MATCH_EXAMPLE_ID } from "@/lib/matchExample";
import { cn } from "@/lib/utils";

/** "See a sample report" call-out on the match analysis page. */
export function ExampleCard({ prominent }: { prominent: boolean }) {
  const { t } = useTranslation("match");
  return (
    <Link
      to={`/match-analysis/${MATCH_EXAMPLE_ID}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border transition-colors sm:flex-row",
        prominent ? "border-primary/40 bg-primary/5 hover:border-primary" : "bg-card hover:border-primary/50",
      )}
    >
      <div className="relative h-36 shrink-0 overflow-hidden sm:h-auto sm:w-56">
        <img src={DEMO_MATCH_PHOTO} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 p-5">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground" />
          </span>
          {t("example.eyebrow")}
        </span>
        <p className="text-lg font-semibold">{t("example.title")}</p>
        <p className="text-sm text-muted-foreground">{t("example.text")}</p>
        {/* Styled like a button; the whole card is the link. */}
        <span className={cn(buttonVariants({ variant: prominent ? "default" : "outline", size: "sm" }), "mt-1 w-fit")}>
          {t("example.button")} <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
