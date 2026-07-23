import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

export default function DemoNavbar() {
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
    { code: 'kk', label: 'KK' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-none mx-auto px-8">
        <div className="flex items-center justify-between h-20 gap-16">
          <Link to="/demo" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
            <img src="/logo.svg" alt="OPENsport" className="w-full h-14" />
          </Link>

          <nav className="hidden lg:flex items-center gap-12 flex-1 justify-center">
            <Link to="/demo" className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/demo') ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              {t("nav.playerDashboard")}
            </Link>
            <Link to="/demo/coach-dashboard" className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/demo/coach-dashboard') ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              {t("nav.coachDashboard")}
            </Link>
            <Link to="/demo/training" className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/demo/training') ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              {t("nav.training")}
            </Link>
            <Link to="/demo/ranking" className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/demo/ranking') ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              {t("nav.leaderboard")}
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-6 shrink-0">
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
            <Link to="/">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:text-white hover:border-white h-12 rounded-full">
                На главную
              </Button>
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-white p-2">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-6 border-t border-gray-800">
            <nav className="flex flex-col gap-4">
              <Link to="/demo" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium py-2 ${isActive('/demo') ? 'text-white' : 'text-gray-400'}`}>
                {t("nav.playerDashboard")}
              </Link>
              <Link to="/demo/coach-dashboard" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium py-2 ${isActive('/demo/coach-dashboard') ? 'text-white' : 'text-gray-400'}`}>
                {t("nav.coachDashboard")}
              </Link>
              <Link to="/demo/training" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium py-2 ${isActive('/demo/training') ? 'text-white' : 'text-gray-400'}`}>
                {t("nav.training")}
              </Link>
              <Link to="/demo/ranking" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium py-2 ${isActive('/demo/ranking') ? 'text-white' : 'text-gray-400'}`}>
                {t("nav.leaderboard")}
              </Link>
              <div className="py-4 border-t border-b border-gray-800 flex gap-4 justify-center">
                {languages.map((lang) => (
                  <button key={lang.code} onClick={() => changeLanguage(lang.code)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${i18n.language === lang.code ? 'bg-[#9FE870]/20 text-[#9FE870]' : 'text-gray-400 hover:text-white'}`}>
                    {lang.label}
                  </button>
                ))}
              </div>
              <div className="pt-4">
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:text-white hover:border-white rounded-full">
                    На главную
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
