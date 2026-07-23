import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import Navbar from "@/components/ui/navbar";
import DemoNavbar from "@/components/ui/DemoNavbar";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "./pages/Home";
import PlayerDashboard from "./pages/PlayerDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import Training from "./pages/Training";
import Ranking from "./pages/Ranking";
import About from "./pages/About";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import JoinTeam from "./pages/JoinTeam";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import DemoJoinTeam from "./pages/DemoJoinTeam";
import Footer from "@/components/ui/Footer";
import { DemoProvider } from "@/demo/DemoContext";

const queryClient = new QueryClient();

function AppNavbar() {
  const location = useLocation();
  if (location.pathname.startsWith("/demo")) {
    return <DemoNavbar />;
  }
  return <Navbar />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-background">
          <AppNavbar />
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Public Auth Routes */}
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />

            {/* Protected Routes */}
            <Route path="/player-dashboard" element={<><SignedIn><PlayerDashboard /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
            <Route path="/coach-dashboard" element={<><SignedIn><CoachDashboard /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
            <Route path="/training" element={<><SignedIn><Training /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
            <Route path="/ranking" element={<><SignedIn><Ranking /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
            <Route path="/join-team" element={<><SignedIn><JoinTeam /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />

            {/* <Route path="/about" element={<About />} /> */}
            <Route path="/register" element={<Register />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* Demo Routes (no Clerk auth required) */}
            <Route path="/demo" element={<DemoProvider><Outlet /></DemoProvider>}>
              <Route index element={<PlayerDashboard />} />
              <Route path="coach-dashboard" element={<CoachDashboard />} />
              <Route path="training" element={<Training />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="join-team" element={<DemoJoinTeam />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
