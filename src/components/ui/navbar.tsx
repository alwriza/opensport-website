import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { t, i18n } = useTranslation("navbar");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setMobileMenuOpen(false);
  };

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
    { code: 'kk', label: 'KZ' }
  ];

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

            <div className="h-8 w-px bg-gray-800" /> {/* Divider */}

            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/player-dashboard">
                <Button className="bg-[#9FE870] hover:bg-[#8DD760] text-black font-semibold px-8 h-12 text-base rounded-full whitespace-nowrap">
                  {t("buttons.getStarted")}
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
              />
            </SignedIn>
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
                <SignedOut>
                  <SignInButton mode="modal" forceRedirectUrl="/player-dashboard">
                    <Button className="w-full bg-[#9FE870] hover:bg-[#8DD760] text-black font-semibold h-11 rounded-full">
                      {t("buttons.getStarted")}
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <div className="flex justify-center">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}