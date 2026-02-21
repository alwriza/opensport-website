import { Link } from "react-router-dom";
import { Youtube, Instagram, Linkedin } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
    const { t } = useTranslation("footer");
    return (
        <footer className="bg-[#0A1628] border-t border-gray-800">
            <div className="container mx-auto px-6 py-16">
                <div className="grid md:grid-cols-4 gap-12 mb-12 items-start">
                    {/* Logo & Description */}
                    <div className="md:col-span-1">
                        <div className="flex mb-4">
                            <img src="logo.svg" alt="OPENsport" className="h-10 w-auto object-contain" />
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed ml-1">
                            {t("description")}
                        </p>
                        <div className="flex gap-4 mt-6 ml-1">
                            <a href="https://www.instagram.com/opensport.ai?igsh=MTZ5eHd0ajUwcGVkOA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#9FE870] transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="https://www.tiktok.com/@opensport_ai?_r=1&_t=ZM-933B8Y8fumJ" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#9FE870] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-music">
                                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                </svg>
                            </a>
                            <a href="https://www.youtube.com/@opensport_app" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#9FE870] transition-colors">
                                <Youtube className="h-5 w-5" />
                            </a>
                            <a href="https://www.linkedin.com/in/opensport" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#9FE870] transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                        <p className="text-gray-400 text-sm mt-4 ml-1 select-all">
                            contact@opensport.app
                        </p>
                    </div>

                    {/* Platform */}
                    <div className="pt-1">
                        <h3 className="text-white font-semibold mb-4 uppercase tracking-wide text-sm">{t("platform.title")}</h3>
                        <ul className="space-y-3">
                            <li><Link to="/player-dashboard" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("platform.playerProfiles")}</Link></li>
                            <li><Link to="/training" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("platform.performanceTracking")}</Link></li>
                        </ul>
                    </div>

                    {/* For */}
                    <div className="pt-1">
                        <h3 className="text-white font-semibold mb-4 uppercase tracking-wide text-sm">{t("for.title")}</h3>
                        <ul className="space-y-3">
                            <li><Link to="/player-dashboard" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("for.players")}</Link></li>
                            <li><Link to="/coach-dashboard" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("for.coaches")}</Link></li>
                        </ul>
                    </div>

                    {/* About */}
                    <div className="pt-1">
                        <h3 className="text-white font-semibold mb-4 uppercase tracking-wide text-sm">{t("about.title")}</h3>
                        <ul className="space-y-3">
                            <li><a href="/#mission" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("about.mission")}</a></li>
                            <li><a href="/#how-it-works" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("about.howItWorks")}</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-xs">
                        {t("copyright")}
                    </p>
                    <div className="flex gap-6">
                        <Link to="/terms" className="text-gray-500 hover:text-[#9FE870] text-xs transition-colors">{t("links.terms")}</Link>
                        <Link to="/privacy" className="text-gray-500 hover:text-[#9FE870] text-xs transition-colors">{t("links.privacy")}</Link>
                    </div>
                </div>

                {/* Legal Text */}
                <div className="mt-6 text-gray-600 text-xs leading-relaxed max-w-4xl">
                    <p>
                        {t("trademarks")}
                    </p>
                </div>
            </div>
        </footer>
    );
}