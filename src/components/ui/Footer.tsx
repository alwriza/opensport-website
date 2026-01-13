import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
    const { t } = useTranslation("footer");
    return (
        <footer className="bg-[#0A1628] border-t border-gray-800">
            <div className="container mx-auto px-6 py-16">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    {/* Logo & Description */}
                    <div className="md:col-span-1">
                        <div className="flex mb-4">
                            <img src="logo.svg" alt="" className="w-100 h-400" />
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed ml-1">
                            {t("description")}
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 uppercase tracking-wide text-sm">{t("platform.title")}</h3>
                        <ul className="space-y-3">
                            <li><Link to="/player-dashboard" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("platform.playerProfiles")}</Link></li>
                            <li><Link to="/training" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("platform.performanceTracking")}</Link></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("platform.aiAnalysis")}</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("platform.talentDiscovery")}</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("platform.developmentInsights")}</a></li>
                        </ul>
                    </div>

                    {/* For */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 uppercase tracking-wide text-sm">{t("for.title")}</h3>
                        <ul className="space-y-3">
                            <li><Link to="/player-dashboard" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("for.players")}</Link></li>
                            <li><Link to="/coach-dashboard" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("for.coaches")}</Link></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("for.scouts")}</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("for.academies")}</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("for.clubs")}</a></li>
                        </ul>
                    </div>

                    {/* About */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 uppercase tracking-wide text-sm">{t("about.title")}</h3>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("about.mission")}</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("about.howItWorks")}</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("about.methodology")}</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("about.partners")}</a></li>
                            <li><a href="mailto:contact@opensport.app" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">{t("about.contact")}</a></li>
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