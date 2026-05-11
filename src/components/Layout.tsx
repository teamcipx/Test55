import { Outlet, Link } from "react-router";
import { HelpCircle, LogIn, Menu, X, Globe, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import SupportWidget from "./SupportWidget";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-cyan-500/30 flex flex-col">
      {/* Navigation */}
      <header className="relative z-20 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-900/20">A</div>
                <span className="text-xl font-serif tracking-tight text-white">
                  AKTO<span className="text-cyan-500 font-sans font-bold text-xs uppercase tracking-[0.2em] ml-1">Forum</span>
                </span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <Link to="/features" className="text-sm font-medium text-zinc-400 hover:text-cyan-400 transition-colors">Features</Link>
              <Link to="/community" className="text-sm font-medium text-zinc-400 hover:text-cyan-400 transition-colors">Community</Link>
              <Link 
                to="/login" 
                className="px-4 py-2 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-colors"
              >
                Log In
              </Link>
              <Link 
                to="/signup" 
                className="px-5 py-2 rounded-full bg-cyan-600 text-white hover:bg-cyan-500 text-sm font-medium transition-colors"
              >
                Join Community
              </Link>
            </div>

            <div className="flex md:hidden">
              <button
                type="button"
                className="text-neutral-400 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Notice */}
      <div className="relative z-10 bg-cyan-950/30 border-b border-cyan-900/50 py-2 px-4 flex items-center justify-center gap-3 shrink-0">
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
        <p className="text-xs font-medium text-cyan-200 tracking-wide uppercase text-center">
          Notice: All new registrations require manual administrator approval to ensure high-quality discussion.
        </p>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 h-16 md:h-12 border-t border-zinc-900 bg-zinc-950 px-4 md:px-8 py-4 md:py-0 shrink-0">
        <div className="max-w-7xl mx-auto h-full flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-zinc-600 uppercase tracking-widest">
          <div>&copy; {new Date().getFullYear()} AKTO FORUM. ALL RIGHTS RESERVED.</div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <Link to="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            <Link to="/contact" className="hover:text-zinc-400 transition-colors">Contact</Link>
            <span className="text-cyan-800">Status: 100% Operational</span>
          </div>
        </div>
      </footer>

      {/* Help Widget */}
      <SupportWidget />
    </div>
  );
}
