import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/ui/navbar";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "./pages/Home";
import PlayerDashboard from "./pages/PlayerDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import Training from "./pages/Training";
import Ranking from "./pages/Ranking";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import JoinTeam from "./pages/JoinTeam";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Footer from "@/components/ui/Footer";
import TrackSelectionModal from "@/components/modals/TrackSelectionModal";


const queryClient = new QueryClient();

/**
 * TrackGuard — checks if signed-in user has chosen a track.
 * Shows TrackSelectionModal if user_track is null/undefined.
 * Per docs: "Show modal on any page load until track is set."
 */
function TrackGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [dismissed, setDismissed] = useState(false);

  const { data: dbUser, isLoading } = useQuery({
    queryKey: ["track-check", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase.from("users") as any)
        .select("user_track")
        .eq("clerk_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && isLoaded,
    staleTime: 60_000,
  });

  const needsTrackSelection =
    isLoaded && user && !isLoading && dbUser && !dbUser.user_track && !dismissed;

  return (
    <>
      {children}
      <TrackSelectionModal
        open={!!needsTrackSelection}
        onComplete={() => setDismissed(true)}
      />
    </>
  );
}

/**
 * TrackProtectedRoute — redirects Individual users away from /player-dashboard
 * and vice-versa where appropriate.
 */
function PlayerTrackRoute({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  const { data: dbUser, isLoading } = useQuery({
    queryKey: ["track-route", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase.from("users") as any)
        .select("user_track, is_admin")
        .eq("clerk_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  // Admin can access everything
  if (dbUser?.is_admin) return <>{children}</>;

  // Individual trying to access /player-dashboard → redirect to /coach-dashboard
  if (!isLoading && dbUser?.user_track === "individual") {
    return <Navigate to="/coach-dashboard" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-background">
          <Navbar />
          <SignedIn>
            <TrackGuard>
              <Routes>
                <Route path="/" element={<Home />} />

                {/* Protected Routes */}
                <Route
                  path="/player-dashboard"
                  element={
                    <PlayerTrackRoute>
                      <PlayerDashboard />
                    </PlayerTrackRoute>
                  }
                />
                <Route path="/coach-dashboard" element={<CoachDashboard />} />
                <Route path="/training" element={<Training />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/join-team" element={<JoinTeam />} />

                {/* <Route path="/about" element={<About />} /> */}
                <Route path="/register" element={<Register />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TrackGuard>
          </SignedIn>
          <SignedOut>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/training" element={<Training />} />
              <Route path="*" element={<RedirectToSignIn />} />
            </Routes>
          </SignedOut>
        </div>
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
