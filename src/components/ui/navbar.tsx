import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Trophy } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/player-dashboard", label: "Player Dashboard" },
    { path: "/coach-dashboard", label: "Coach Dashboard" },
    { path: "/training", label: "Training" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Trophy className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">AI Scout</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive(item.path)
                  ? "text-primary"
                  : "text-muted-foreground"
                }`}
            >
              {item.label}
            </Link>
          ))}
          <Button variant="default" size="sm" asChild className="rounded-full px-6">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Navigation Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background animate-in slide-in-from-top-2">
          <div className="container px-6 py-6 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block text-base font-medium transition-colors hover:text-primary ${isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground"
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button variant="default" size="lg" asChild className="w-full mt-4">
              <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
