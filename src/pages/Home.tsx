import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { ArrowRight, UserPlus, Video, TrendingUp, Sprout } from "lucide-react";

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
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                <span className="text-white">HOW IT</span>
                <br />
                <span className="text-[#9FE870]">WORKS?</span>
              </h2>

              <p className="text-gray-400 text-lg leading-relaxed mb-12 max-w-xl">
                OPENsport products are designed to improve how football talent is discovered and developed.
                From player profiling and performance insights to talent visibility and structured development
                pathways, each product is built to bring clarity, objectivity, and structure into the football
                ecosystem — helping players get noticed, academies evaluate potential, and clubs make better decisions.
              </p>

              {/* Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Step 1 */}
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-800/50 flex items-center justify-center">
                    <UserPlus className="h-7 w-7 text-[#9FE870]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Sign Up</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Create an account and get instant access to the platform.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-800/50 flex items-center justify-center">
                    <Video className="h-7 w-7 text-[#9FE870]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Create Profile & Upload your video</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Upload a match or training video directly from your phone or computer.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-800/50 flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-[#9FE870]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Get Analyzed</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Receive AI-powered performance analysis, insights, and personalized feedback.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-800/50 flex items-center justify-center">
                    <Sprout className="h-7 w-7 text-[#9FE870]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Improve & Connect</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Track progress, improve performance, and connect with opportunities.
                  </p>
                </div>
              </div>
            </div>

            {/* Right - Placeholder for 3D Graphic */}
            <div className="relative hidden lg:block">
              {/* YOU ADD 3D GRAPHIC HERE LATER */}
              <div className="w-full h-[600px] rounded-2xl bg-gradient-to-br from-[#9FE870]/10 to-transparent border border-[#9FE870]/20 flex items-center justify-center">
                <p className="text-gray-600 text-sm">[3D Graphic Placeholder]</p>
              </div>
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