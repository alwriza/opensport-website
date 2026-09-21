import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Navbar from "@/components/ui/navbar";
import DemoNavbar from "@/components/ui/DemoNavbar";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollProgress from "@/components/ScrollProgress";
import BackToTop from "@/components/BackToTop";
import Home from "./pages/Home";
import PlayerDashboard from "./pages/PlayerDashboard";
import Training from "./pages/Training";
import Ranking from "./pages/Ranking";
import Duels from "./pages/Duels";

const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const CoachDashboard = lazy(() => import("./pages/CoachDashboard"));

import NotFound from "./pages/NotFound";
import JoinTeam from "./pages/JoinTeam";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import DemoJoinTeam from "./pages/DemoJoinTeam";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Footer from "@/components/ui/Footer";
import { DemoProvider } from "@/demo/DemoContext";

const queryClient = new QueryClient();

/** Shared full-height spinner for route-level suspense and auth checks. */
function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useCurrentUser();
  if (!isLoaded) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Auth screens are self-contained full-bleed layouts — no site chrome there. */
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

function AppNavbar() {
  const location = useLocation();
  if (AUTH_ROUTES.includes(location.pathname)) return null;
  if (location.pathname.startsWith("/demo")) {
    return <DemoNavbar />;
  }
  return <Navbar />;
}

function AppFooter() {
  const location = useLocation();
  if (AUTH_ROUTES.includes(location.pathname)) return null;
  return <Footer />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={200}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <ScrollProgress />
        <div className="flex min-h-screen flex-col bg-background">
          <AppNavbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />

              {/* Auth Routes */}
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Routes */}
              <Route path="/player-dashboard" element={<ProtectedRoute><PlayerDashboard /></ProtectedRoute>} />
              <Route path="/coach-dashboard" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CoachDashboard /></Suspense></ProtectedRoute>} />
              <Route path="/player/:id" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><PlayerProfile /></Suspense></ProtectedRoute>} />
              <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
              <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
              <Route path="/duels" element={<ProtectedRoute><Duels /></ProtectedRoute>} />
              <Route path="/join-team" element={<ProtectedRoute><JoinTeam /></ProtectedRoute>} />

              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />

              {/* Demo Routes (no auth required) */}
              <Route path="/demo" element={<DemoProvider><Outlet /></DemoProvider>}>
                <Route index element={<PlayerDashboard />} />
                <Route path="home" element={<Home />} />
                <Route path="coach-dashboard" element={<Suspense fallback={<PageLoader />}><CoachDashboard /></Suspense>} />
                <Route path="player/:id" element={<Suspense fallback={<PageLoader />}><PlayerProfile /></Suspense>} />
                <Route path="training" element={<Training />} />
                <Route path="ranking" element={<Ranking />} />
                <Route path="duels" element={<Duels />} />
                <Route path="join-team" element={<DemoJoinTeam />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <AppFooter />
        </div>
        <BackToTop />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
