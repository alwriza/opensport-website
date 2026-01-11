import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-black/95 backdrop-blur-sm border-b border-gray-800">
      {/* ✅ ИЗМЕНЕНИЕ 1: max-w-none вместо container, меньше px */}
      <div className="max-w-none mx-auto px-8">
        {/* ✅ ИЗМЕНЕНИЕ 2: justify-between вместо justify-evenly */}
        <div className="flex items-center justify-between h-20 gap-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
            <img src="logo.svg" alt="" className="w-full h-14" />
          </Link>

          {/* ✅ Navigation Items - в одной группе с gap между собой */}
          <nav className="hidden lg:flex items-center gap-12 flex-1 justify-center">
            <Link
              to="/"
              className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Home
            </Link>

            <Link
              to="/player-dashboard"
              className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/player-dashboard') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Player Dashboard
            </Link>

            <Link
              to="/coach-dashboard"
              className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/coach-dashboard') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Coach Dashboard
            </Link>

            <Link
              to="/training"
              className={`text-lg font-medium transition-colors whitespace-nowrap ${isActive('/training') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Training
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block shrink-0">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/player-dashboard">
                <Button className="bg-[#9FE870] hover:bg-[#8DD760] text-black font-semibold px-8 h-12 text-base rounded-full whitespace-nowrap">
                  Get Started
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
                Home
              </Link>
              <Link
                to="/player-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-2 ${isActive('/player-dashboard') ? 'text-white' : 'text-gray-400'}`}
              >
                Player Dashboard
              </Link>
              <Link
                to="/coach-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-2 ${isActive('/coach-dashboard') ? 'text-white' : 'text-gray-400'}`}
              >
                Coach Dashboard
              </Link>
              <Link
                to="/training"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-2 ${isActive('/training') ? 'text-white' : 'text-gray-400'}`}
              >
                Training
              </Link>

              <div className="pt-4 border-t border-gray-800">
                <SignedOut>
                  <SignInButton mode="modal" forceRedirectUrl="/player-dashboard">
                    <Button className="w-full bg-[#9FE870] hover:bg-[#8DD760] text-black font-semibold h-11 rounded-full">
                      Get Started
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