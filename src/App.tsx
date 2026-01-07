import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Navbar } from "@/components/ui/navbar";
import Home from "./pages/Home";
import PlayerDashboard from "./pages/PlayerDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import Training from "./pages/Training";
import About from "./pages/About";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import JoinTeam from "./pages/JoinTeam";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Public Auth Routes */}
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />

            {/* Protected Routes */}
            <Route
              path="/player-dashboard"
              element={
                <>
                  <SignedIn>
                    <PlayerDashboard />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/coach-dashboard"
              element={
                <>
                  <SignedIn>
                    <CoachDashboard />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/training"
              element={
                <>
                  <SignedIn>
                    <Training />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/join-team"
              element={
                <>
                  <SignedIn>
                    <JoinTeam />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />

            {/* <Route path="/about" element={<About />} /> */}
            <Route path="/register" element={<Register />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
