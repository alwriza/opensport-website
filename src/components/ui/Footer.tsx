import { useDesignCopy } from "@/hooks/useDesignCopy";
import { Link, useLocation } from "react-router-dom";
import { Brand } from "@/components/redesign/primitives";

export default function Footer() {
  const copy = useDesignCopy();
  const { pathname } = useLocation();
  if (!["/", "/demo/home", "/terms", "/privacy", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/about"].includes(pathname)) return null;
  const homePath = pathname.startsWith("/demo") ? "/demo/home" : "/";

  return (
    <footer className="design-footer">
      <div className="design-footer-brand">
        <Brand to={homePath} />
        <p>{copy("Objective football talent evaluation from a smartphone. Built in Almaty, Kazakhstan.")}</p>
        <a className="design-mono" href="mailto:contact@opensport.app">contact@opensport.app</a>
      </div>
      <div className="design-footer-column">
        <span className="design-eyebrow">{copy("Platform")}</span>
        <Link to="/demo">{copy("Player profiles")}</Link>
        <Link to="/demo/coach-dashboard">{copy("Coach dashboard")}</Link>
        <Link to="/demo/ranking">{copy("National ranking")}</Link>
      </div>
      <div className="design-footer-column">
        <span className="design-eyebrow">{copy("Company")}</span>
        <Link to="/about">{copy("Mission")}</Link>
        <Link to="/about#science">{copy("The method")}</Link>
        <a href="mailto:contact@opensport.app?subject=League%20pilot">Pilots &amp; partners</a>
      </div>
      <div className="design-footer-legal">
        <span className="design-mono">© {new Date().getFullYear()} OPENsport, Inc.</span>
        <div>
          <Link to="/terms">{copy("Terms")}</Link>
          <Link to="/privacy">{copy("Privacy")}</Link>
        </div>
      </div>
    </footer>
  );
}
