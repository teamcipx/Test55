import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { HelpCircle, LogIn, Menu, X, Globe, LogOut, User as UserIcon, ShieldAlert, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import SupportWidget from "./SupportWidget";
import { supabase, hasSupabaseConfig } from "../lib/supabase";

import GlobalNotice from "./GlobalNotice";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
      if (session?.user) {
         fetchProfile(session.user.id);
      } else {
         setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-cyan-500/30 flex flex-col">
      {/* Navigation */}
      <header className="relative z-20 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-900/20">H</div>
                <span className="text-xl font-serif tracking-tight text-white">
                  HIJABII
                </span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <Link to="/features" className="text-sm font-medium text-zinc-400 hover:text-cyan-400 transition-colors">Features</Link>
              <Link to="/community" className="text-sm font-medium text-zinc-400 hover:text-cyan-400 transition-colors">Discussions</Link>
              <Link to="/galleries" className="text-sm font-medium text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[9px] font-bold uppercase tracking-wider">18+</span>
                Galleries
              </Link>
              
              <div className="w-px h-4 bg-zinc-800 mx-2" />

              {userSession ? (
                <>
                  <Link to="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  {profile?.is_admin && (
                    <Link to="/admin" className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" /> Admin
                    </Link>
                  )}
                  <Link to="/profile" className="text-sm font-medium text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4" /> Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-500 text-sm font-medium transition-colors ml-2"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            <div className="flex md:hidden items-center gap-4">
              {profile?.is_admin && (
                <Link to="/admin" className="text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </Link>
              )}
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

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-4 shadow-xl">
            <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-zinc-400 hover:text-cyan-400">Features</Link>
            <Link to="/community" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-zinc-400 hover:text-cyan-400">Discussions</Link>
            <Link to="/galleries" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-cyan-400">
              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[9px] font-bold uppercase tracking-wider">18+</span>
              Galleries
            </Link>
            
            <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
              {userSession ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-cyan-400 p-2 bg-zinc-900/50 rounded">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-cyan-400 p-2 bg-zinc-900/50 rounded">
                    <UserIcon className="w-4 h-4" /> Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-center px-4 py-2 mt-2 rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-colors block"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-4 py-2 rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-colors block"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/signup" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-5 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-500 text-sm font-medium transition-colors block"
                  >
                    Join Community
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Notice */}
      <GlobalNotice />

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 h-16 md:h-12 border-t border-zinc-900 bg-zinc-950 px-4 md:px-8 py-4 md:py-0 shrink-0">
        <div className="max-w-7xl mx-auto h-full flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-zinc-600 uppercase tracking-widest">
          <div>&copy; {new Date().getFullYear()} HIJABII. ALL RIGHTS RESERVED.</div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <Link to="/about" className="hover:text-zinc-400 transition-colors">About Us</Link>
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
