import { Outlet, Link, useLocation } from "react-router";
import { Users, Settings, MessageSquare, ShieldAlert } from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { name: "Members & Approvals", path: "/admin/users", icon: Users },
    { name: "Support Tickets", path: "/admin/support", icon: MessageSquare },
    { name: "System Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans flex flex-col">
      <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 px-8 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-900/20">A</div>
          <span className="text-xl font-serif tracking-tight text-white">
            AKTO<span className="text-cyan-500 font-sans font-bold text-xs uppercase tracking-[0.2em] ml-1">Admin</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest">
          <ShieldAlert className="w-4 h-4" />
          Admin Mode
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 flex flex-col">
          <nav className="flex-1 py-6 px-4 space-y-2">
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#050505] to-cyan-950/10 pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
