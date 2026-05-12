import { Outlet, Link, useLocation } from "react-router";
import { Users, Settings, MessageSquare, ShieldAlert, Menu, X, Play, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function AdminLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Back to Feed", path: "/community", icon: ArrowLeft },
    { name: "Members & Approvals", path: "/admin/users", icon: Users },
    { name: "Support Tickets", path: "/admin/support", icon: MessageSquare },
    { name: "Premium Videos", path: "/admin/videos", icon: Play },
    { name: "System Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans flex flex-col">
      <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 px-4 md:px-8 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-900/20">H</div>
            <span className="text-xl font-serif tracking-tight text-white hidden sm:block">
              HIJABII<span className="text-cyan-500 font-sans font-bold text-xs uppercase tracking-[0.2em] ml-1">Admin</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest">
          <ShieldAlert className="w-4 h-4" />
          <span className="hidden sm:inline">Admin Mode</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`absolute inset-y-0 left-0 z-10 w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="flex-1 py-6 px-4 space-y-2">
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {mobileMenuOpen && (
          <div 
            className="absolute inset-0 bg-black/50 z-0 md:hidden" 
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#050505] to-cyan-950/10 pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
