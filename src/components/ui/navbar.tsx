import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const { t, i18n } = useTranslation("navbar");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSignedIn } = useCurrentUser();

  const isActive = (path: string) => location.pathname === path;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
    { code: 'kk', label: 'KZ' }
  ];

  const initials = (user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-none mx-auto px-8">
        <div className="flex items-center justify-between h-20 gap-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
            <img src="/logo.svg" alt="OPENsport" className="w-full h-14" />
          </Link>

          {/* Navigation Items */}
          <nav className="hidden lg:flex items-center gap-12 flex-1 justify-center">
            <Link
              to="/"
              className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              {t("nav.home")}
            </Link>

            <Link
              to="/player-dashboard"
              className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/player-dashboard') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              {t("nav.playerDashboard")}
            </Link>

            <Link
              to="/coach-dashboard"
              className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/coach-dashboard') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              {t("nav.coachDashboard")}
            </Link>

            <Link
              to="/training"
              className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/training') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              {t("nav.training")}
            </Link>

            <Link
              to="/ranking"
              className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/ranking') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              {t("nav.ranking")}
            </Link>
          </nav>

          {/* CTA Button & Language Switcher & User/Auth */}
          <div className="hidden lg:flex items-center gap-6 shrink-0">
            {/* Language Switcher (Desktop) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:text-white hover:bg-white/10">
                  <Globe className="h-5 w-5" />
                  <span className="sr-only">Switch Language</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/95 border-gray-800 text-gray-200">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`cursor-pointer hover:bg-white/10 hover:text-white ${i18n.language === lang.code ? 'text-[#9FE870] font-bold' : ''}`}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/demo" className="text-sm font-medium text-gray-400 hover:text-[#9FE870] transition-colors whitespace-nowrap">
              {t("nav.demo", "Demo")}
            </Link>

            <div className="h-8 w-px bg-gray-800" /> {/* Divider */}

            {!isSignedIn ? (
              <Button
                onClick={() => navigate("/login")}
                className="bg-[#9FE870] hover:bg-[#8DD760] text-black font-semibold px-8 h-12 text-base rounded-full whitespace-nowrap"
              >
                {t("buttons.getStarted")}
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-[#9FE870]/20 text-[#9FE870] font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/95 border-gray-800 text-gray-200">
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-white/10 hover:text-white">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white p-2"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 border-t border-gray-800">
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-2 ${isActive('/') ? 'text-white' : 'text-gray-400'}`}
              >
                {t("nav.home")}
              </Link>
              <Link
                to="/player-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-2 ${isActive('/player-dashboard') ? 'text-white' : 'text-gray-400'}`}
              >
                {t("nav.playerDashboard")}
              </Link>
              <Link
                to="/coach-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-2 ${isActive('/coach-dashboard') ? 'text-white' : 'text-gray-400'}`}
              >
                {t("nav.coachDashboard")}
              </Link>
              <Link
                to="/training"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-2 ${isActive('/training') ? 'text-white' : 'text-gray-400'}`}
              >
                {t("nav.training")}
              </Link>
              <Link
                to="/ranking"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-2 ${isActive('/ranking') ? 'text-white' : 'text-gray-400'}`}
              >
                {t("nav.ranking")}
              </Link>

              {/* Mobile Language Switcher */}
              <div className="py-4 border-t border-b border-gray-800 flex gap-4 justify-center">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${i18n.language === lang.code
                      ? 'bg-[#9FE870]/20 text-[#9FE870]'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <Link to="/demo" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium py-2 text-gray-400">
                  {t("nav.demo", "Demo")}
                </Link>

                {isSignedIn && (
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={handleSignOut}>
                      Sign out
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}