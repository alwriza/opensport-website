import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { ArrowRight, UserPlus, Video, TrendingUp, Sprout, CheckCircle2, Loader, Cloud, Cpu, BarChart3, GraduationCap } from "lucide-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Home() {
  const { t } = useTranslation(["home", "navbar", "buttons"]);

  const aboutRef = useScrollReveal();
  const tractionRef = useScrollReveal();
  const impactRef = useScrollReveal();
  const howItWorksRef = useScrollReveal();
  const quoteRef = useScrollReveal();

  const tractionItems = [
    { key: "mvp", icon: CheckCircle2 },
    { key: "dataset", icon: CheckCircle2 },
    { key: "v2", icon: Loader },
    { key: "cloud", icon: Cloud },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Stadium Background */}
      <section className="relative min-h-[90vh] flex items-center justify-start px-6 md:px-12">
        {/* Background Image */}
        <div className="absolute inset-0 bg-black">
          <img src="/stadium-bg.png" alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8">
            <span className="block text-white">{t("hero.title.line1")}{" "}</span>
            <span className="block text-[#9FE870]">{t("hero.title.line2")}</span>
            <span className="block text-white mt-2">{t("hero.title.line3")}</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-12 leading-relaxed">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/player-dashboard">
                <Button size="lg" className="bg-[#9FE870] hover:bg-[#8DD760] text-black font-semibold px-8 h-14 text-lg rounded-full">
                  {t("hero.cta.start")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignInButton>
              <SignInButton mode="modal" forceRedirectUrl="/coach-dashboard">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-[#9FE870] text-[#9FE870] hover:bg-[#9FE870] hover:text-black font-semibold px-8 h-14 text-lg rounded-full"
                >
                  {t("hero.cta.coaches")}
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link to="/player-dashboard">
                <Button size="lg" className="bg-[#9FE870] hover:bg-[#8DD760] text-black font-semibold px-8 h-14 text-lg rounded-full">
                  {t("hero.cta.dashboard")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* ===== What is OpenSport? Section ===== */}
      <section ref={aboutRef} className="scroll-reveal bg-[#0A1628] py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="text-white">{t("about.titleStart")} </span>
            <span className="text-[#9FE870]">{t("about.titleHighlight")}</span>
          </h2>
          <p className="text-gray-300 text-xl md:text-2xl leading-relaxed max-w-3xl mb-14">
            {t("about.description")}
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
              <div className="w-12 h-12 rounded-xl bg-[#9FE870]/10 flex items-center justify-center">
                <Cpu className="h-6 w-6 text-[#9FE870]" />
              </div>
              <h3 className="text-white font-semibold text-lg">{t("about.features.ai.title")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t("about.features.ai.description")}</p>
            </div>
            <div className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
              <div className="w-12 h-12 rounded-xl bg-[#9FE870]/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-[#9FE870]" />
              </div>
              <h3 className="text-white font-semibold text-lg">{t("about.features.analytics.title")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t("about.features.analytics.description")}</p>
            </div>
            <div className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
              <div className="w-12 h-12 rounded-xl bg-[#9FE870]/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-[#9FE870]" />
              </div>
              <h3 className="text-white font-semibold text-lg">{t("about.features.training.title")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t("about.features.training.description")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Technology & Traction Section ===== */}
      <section ref={tractionRef} className="scroll-reveal bg-[#0A1628] py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            <span className="text-[#9FE870]">{t("traction.title")}</span>
          </h2>
          <p className="text-gray-400 text-lg mb-14 max-w-2xl">{t("traction.subtitle")}</p>

          <div className="space-y-4">
            {tractionItems.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-6 py-5 rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-[#9FE870]/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#9FE870]/10 flex items-center justify-center shrink-0">
                  <Icon className="h-6 w-6 text-[#9FE870]" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1">
                  <span className="text-white font-semibold text-lg shrink-0 min-w-[180px]">
                    {t(`traction.items.${key}.label`)}
                  </span>
                  <span className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    {t(`traction.items.${key}.description`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ===== Community Impact Section ===== */}
      <section ref={impactRef} id="mission" className="scroll-reveal bg-[#0A1628] py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="text-[#9FE870]">{t("impact.title")}</span>
          </h2>

          <p className="text-gray-400 text-xl leading-relaxed mb-16 max-w-3xl">
            {t("impact.description")}
          </p>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 - Global Reach */}
            <div className="group relative rounded-3xl overflow-hidden border-2 border-[#9FE870]/20 hover:border-[#9FE870] transition-all duration-300">
              <div className="relative h-80 bg-gradient-to-br from-gray-900 to-gray-800">
                <img src="/global-reach.png" alt="" className="w-full h-full object-fit" />
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent">
                <h3 className="text-3xl font-bold text-white mb-3">{t("impact.cards.global.title")}</h3>
                <p className="text-gray-300 leading-relaxed mb-4">{t("impact.cards.global.subtitle")}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{t("impact.cards.global.description")}</p>
              </div>
            </div>

            {/* Card 2 - Fair Play */}
            <div className="group relative rounded-3xl overflow-hidden border-2 border-[#9FE870]/20 hover:border-[#9FE870] transition-all duration-300">
              <div className="relative h-80 bg-gradient-to-br from-gray-900 to-gray-800">
                <img src="/fair-play.png" alt="" className="w-full h-full object-fit" />
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent">
                <h3 className="text-3xl font-bold text-white mb-3">{t("impact.cards.fairPlay.title")}</h3>
                <p className="text-gray-300 leading-relaxed mb-4">{t("impact.cards.fairPlay.subtitle")}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{t("impact.cards.fairPlay.description")}</p>
              </div>
            </div>

            {/* Card 3 - Equal Access */}
            <div className="group relative rounded-3xl overflow-hidden border-2 border-[#9FE870]/20 hover:border-[#9FE870] transition-all duration-300">
              <div className="relative h-80 bg-gradient-to-br from-gray-900 to-gray-800">
                <img src="/equal-access.png" alt="" className="w-full h-full object-fit" />
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent">
                <h3 className="text-3xl font-bold text-white mb-3">{t("impact.cards.equalAccess.title")}</h3>
                <p className="text-gray-300 leading-relaxed mb-4">{t("impact.cards.equalAccess.subtitle")}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{t("impact.cards.equalAccess.description")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== How It Works Section ===== */}
      <section ref={howItWorksRef} id="how-it-works" className="scroll-reveal relative bg-[#0A1628] py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left - Text Content (Fixed) */}
            <div className="lg:sticky lg:top-32">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                <span className="text-white">{t("howItWorks.title.line1")}</span>
                <br />
                <span className="text-[#9FE870]">{t("howItWorks.title.line2")}</span>
              </h2>

              <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                {t("howItWorks.description")}
              </p>
            </div>

            {/* Right - Vertical Auto-Scroll Carousel */}
            <div className="relative h-[600px]">
              <Carousel
                orientation="vertical"
                opts={{
                  loop: true,
                  align: "start"
                }}
                plugins={[
                  AutoScroll({
                    playOnInit: true,
                    speed: 0.5,
                    stopOnInteraction: false,
                    stopOnMouseEnter: false,
                  })
                ]}
                className="h-full"
              >
                <CarouselContent className="h-full">
                  {/* Step 1 */}
                  <CarouselItem className="pt-4 basis-auto">
                    <div className="h-[280px] flex flex-col justify-center p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-[#9FE870]/30 transition-all duration-500">
                      <div className="w-14 h-14 rounded-xl bg-[#9FE870]/10 flex items-center justify-center mb-6">
                        <UserPlus className="h-7 w-7 text-[#9FE870]" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">{t("howItWorks.steps.step1.title")}</h3>
                      <p className="text-gray-400 leading-relaxed">{t("howItWorks.steps.step1.description")}</p>
                    </div>
                  </CarouselItem>

                  {/* Step 2 */}
                  <CarouselItem className="pt-4 basis-auto">
                    <div className="h-[280px] flex flex-col justify-center p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-[#9FE870]/30 transition-all duration-500">
                      <div className="w-14 h-14 rounded-xl bg-[#9FE870]/10 flex items-center justify-center mb-6">
                        <Video className="h-7 w-7 text-[#9FE870]" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">{t("howItWorks.steps.step2.title")}</h3>
                      <p className="text-gray-400 leading-relaxed">{t("howItWorks.steps.step2.description")}</p>
                    </div>
                  </CarouselItem>

                  {/* Step 3 */}
                  <CarouselItem className="pt-4 basis-auto">
                    <div className="h-[280px] flex flex-col justify-center p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-[#9FE870]/30 transition-all duration-500">
                      <div className="w-14 h-14 rounded-xl bg-[#9FE870]/10 flex items-center justify-center mb-6">
                        <TrendingUp className="h-7 w-7 text-[#9FE870]" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">{t("howItWorks.steps.step3.title")}</h3>
                      <p className="text-gray-400 leading-relaxed">{t("howItWorks.steps.step3.description")}</p>
                    </div>
                  </CarouselItem>

                  {/* Step 4 */}
                  <CarouselItem className="pt-4 basis-auto">
                    <div className="h-[280px] flex flex-col justify-center p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-[#9FE870]/30 transition-all duration-500">
                      <div className="w-14 h-14 rounded-xl bg-[#9FE870]/10 flex items-center justify-center mb-6">
                        <Sprout className="h-7 w-7 text-[#9FE870]" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">{t("howItWorks.steps.step4.title")}</h3>
                      <p className="text-gray-400 leading-relaxed">{t("howItWorks.steps.step4.description")}</p>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>

              {/* Gradient Fade Overlays */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0A1628] to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0A1628] to-transparent pointer-events-none z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Quote Section - Arsene Wenger ===== */}
      <section ref={quoteRef} className="scroll-reveal relative bg-[#0A1628] py-24 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="text-[#9FE870] text-8xl font-serif mb-8">&ldquo;</div>

          <blockquote className="text-2xl md:text-3xl text-white font-normal leading-relaxed mb-8 max-w-4xl mx-auto">
            {t("quote.text")}
          </blockquote>

          <div className="text-gray-400">
            <p className="font-semibold text-lg text-white mb-1">{t("quote.author")}</p>
            <p className="text-sm">{t("quote.role")}</p>
          </div>
        </div>
      </section>

    </div>
  );
}