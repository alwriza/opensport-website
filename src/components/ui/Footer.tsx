import { Link } from "react-router-dom";

export default function Footer() {
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
                            OPENsport is an AI-driven football platform designed to identify talent,
                            track development, and support smarter decisions in football.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 uppercase tracking-wide text-sm">Platform</h3>
                        <ul className="space-y-3">
                            <li><Link to="/player-dashboard" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Player Profiles</Link></li>
                            <li><Link to="/training" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Performance Tracking</Link></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">AI Analysis</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Talent Discovery</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Development Insights</a></li>
                        </ul>
                    </div>

                    {/* For */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 uppercase tracking-wide text-sm">For</h3>
                        <ul className="space-y-3">
                            <li><Link to="/player-dashboard" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Players</Link></li>
                            <li><Link to="/coach-dashboard" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Coaches</Link></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Scouts</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Academies</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Clubs</a></li>
                        </ul>
                    </div>

                    {/* About */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 uppercase tracking-wide text-sm">About</h3>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Mission</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">How It Works</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Methodology</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Partners</a></li>
                            <li><a href="mailto:contact@opensport.app" className="text-gray-400 hover:text-[#9FE870] transition-colors text-sm">Contact</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-xs">
                        © 2026 OPENsport, Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link to="/terms" className="text-gray-500 hover:text-[#9FE870] text-xs transition-colors">Terms of Service</Link>
                        <Link to="/privacy" className="text-gray-500 hover:text-[#9FE870] text-xs transition-colors">Privacy Policy</Link>
                    </div>
                </div>

                {/* Legal Text */}
                <div className="mt-6 text-gray-600 text-xs leading-relaxed max-w-4xl">
                    <p>
                        OPENsport™, OPENsport Platform™, OPENsport AI™, Deep Profiles™, Performance Analysis™,
                        Talent Scout™, and other product names are trademarks or registered trademarks of OPENsport, Inc.
                        All other trademarks are the property of their respective owners.
                    </p>
                </div>
            </div>
        </footer>
    );
}