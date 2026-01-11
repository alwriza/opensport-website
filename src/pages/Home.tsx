import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { ArrowRight, UserPlus, Video, TrendingUp, Sprout } from "lucide-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Stadium Background */}
      <section className="relative min-h-[90vh] flex items-center justify-start px-6 md:px-12">
        {/* Background Image - YOU ADD THIS */}
        <div className="absolute inset-0 bg-black">
          <img src="public/stadium-bg.png" alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8">
            <span className="block text-white">DISCOVER{" "}</span>
            <span className="block text-[#9FE870]">TALENT</span>
            <span className="block text-white mt-2">UNLOCK POTENTIAL</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-12 leading-relaxed">
            We use advanced AI to evaluate football talent objectively, breaking geographic barriers and creating equal opportunities for all.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/player-dashboard">
                <Button size="lg" className="bg-[#9FE870] hover:bg-[#8DD760] text-black font-semibold px-8 h-14 text-lg rounded-full">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignInButton>
              <SignInButton mode="modal" forceRedirectUrl="/coach-dashboard">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-[#9FE870] text-[#9FE870] hover:bg-[#9FE870] hover:text-black font-semibold px-8 h-14 text-lg rounded-full"
                >
                  For Coaches
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link to="/player-dashboard">
                <Button size="lg" className="bg-[#9FE870] hover:bg-[#8DD760] text-black font-semibold px-8 h-14 text-lg rounded-full">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Community Impact Section */}
      <section className="bg-black py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="text-[#9FE870]">COMMUNITY IMPACT</span>
          </h2>

          <p className="text-gray-400 text-xl leading-relaxed mb-16 max-w-3xl">
            From grassroots football to elite academies, OPENsport's AI-powered platform helps you
            evaluate talent, unlock potential, and make smarter development decisions.
          </p>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 - Global Reach */}
            <div className="group relative rounded-3xl overflow-hidden border-2 border-[#9FE870]/20 hover:border-[#9FE870] transition-all duration-300">
              {/* Image Background - YOU ADD THIS */}
              <div className="relative h-80 bg-gradient-to-br from-gray-900 to-gray-800">
                <img src="public/global-reach.png" alt="" className="w-full h-full object-fit" />
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent">
                <h3 className="text-3xl font-bold text-white mb-3">GLOBAL REACH</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Connecting football talent from every corner of the world.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  No borders, no limits — players can be seen, evaluated, and discovered globally.
                </p>
              </div>
            </div>

            {/* Card 2 - Fair Play */}
            <div className="group relative rounded-3xl overflow-hidden border-2 border-[#9FE870]/20 hover:border-[#9FE870] transition-all duration-300">
              <div className="relative h-80 bg-gradient-to-br from-gray-900 to-gray-800">
                <img src="public/fair-play.png" alt="" className="w-full h-full object-fit" />
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent">
                <h3 className="text-3xl font-bold text-white mb-3">FAIR PLAY</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Objective, AI-driven analysis for every player.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Performance is measured by data, not reputation, location, or background.
                </p>
              </div>
            </div>

            {/* Card 3 - Equal Access */}
            <div className="group relative rounded-3xl overflow-hidden border-2 border-[#9FE870]/20 hover:border-[#9FE870] transition-all duration-300">
              <div className="relative h-80 bg-gradient-to-br from-gray-900 to-gray-800">
                <img src="public/equal-access.png" alt="" className="w-full h-full object-fit" />
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent">
                <h3 className="text-3xl font-bold text-white mb-3">EQUAL ACCESS</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Equal opportunities for every football player.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Upload a video, get professional analysis, and receive feedback regardless of resources or connections.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative bg-[#0A1628] py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left - Text Content (Fixed) */}
            <div className="lg:sticky lg:top-32">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                <span className="text-white">HOW IT</span>
                <br />
                <span className="text-[#9FE870]">WORKS?</span>
              </h2>

              <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                OPENsport products are designed to improve how football talent is discovered and developed.
                From player profiling and performance insights to talent visibility and structured development
                pathways, each product is built to bring clarity, objectivity, and structure into the football
                ecosystem.
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
                    speed: 1,
                    stopOnInteraction: false,
                    stopOnMouseEnter: true,
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
                      <h3 className="text-2xl font-semibold text-white mb-3">Sign Up</h3>
                      <p className="text-gray-400 leading-relaxed">
                        Create an account and get instant access to the platform. Join thousands of players
                        already improving their skills.
                      </p>
                    </div>
                  </CarouselItem>

                  {/* Step 2 */}
                  <CarouselItem className="pt-4 basis-auto">
                    <div className="h-[280px] flex flex-col justify-center p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-[#9FE870]/30 transition-all duration-500">
                      <div className="w-14 h-14 rounded-xl bg-[#9FE870]/10 flex items-center justify-center mb-6">
                        <Video className="h-7 w-7 text-[#9FE870]" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">Upload Your Video</h3>
                      <p className="text-gray-400 leading-relaxed">
                        Upload a match or training video directly from your phone or computer. Our AI handles
                        the rest.
                      </p>
                    </div>
                  </CarouselItem>

                  {/* Step 3 */}
                  <CarouselItem className="pt-4 basis-auto">
                    <div className="h-[280px] flex flex-col justify-center p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-[#9FE870]/30 transition-all duration-500">
                      <div className="w-14 h-14 rounded-xl bg-[#9FE870]/10 flex items-center justify-center mb-6">
                        <TrendingUp className="h-7 w-7 text-[#9FE870]" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">Get Analyzed</h3>
                      <p className="text-gray-400 leading-relaxed">
                        Receive AI-powered performance analysis with detailed metrics, insights, and personalized
                        feedback within 60 seconds.
                      </p>
                    </div>
                  </CarouselItem>

                  {/* Step 4 */}
                  <CarouselItem className="pt-4 basis-auto">
                    <div className="h-[280px] flex flex-col justify-center p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-[#9FE870]/30 transition-all duration-500">
                      <div className="w-14 h-14 rounded-xl bg-[#9FE870]/10 flex items-center justify-center mb-6">
                        <Sprout className="h-7 w-7 text-[#9FE870]" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">Improve & Connect</h3>
                      <p className="text-gray-400 leading-relaxed">
                        Track your progress over time, follow personalized training plans, and connect with
                        coaches and opportunities.
                      </p>
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

      {/* Quote Section - Arsene Wenger */}
      <section className="relative bg-[#0A1628] py-24 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          {/* Quote Marks */}
          <div className="text-[#9FE870] text-8xl font-serif mb-8">"</div>

          <blockquote className="text-2xl md:text-3xl text-white font-normal leading-relaxed mb-8 max-w-4xl mx-auto">
            Talent can be wasted if it is not guided properly. Development is about education,
            patience, and creating the right environment for young players to express themselves.
          </blockquote>

          <div className="text-gray-400">
            <p className="font-semibold text-lg text-white mb-1">Arsene Wenger</p>
            <p className="text-sm">Head Coach & Football Thinker</p>
          </div>
        </div>
      </section>
    </div>
  );
}