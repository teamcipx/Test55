import { ArrowRight, Users, Shield, Zap } from "lucide-react";
import { Link } from "react-router";

export default function Home() {
  return (
    <div className="flex flex-col h-full bg-[#050505] min-h-[calc(100vh-104px)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center px-4 md:px-10 py-16 md:py-24 bg-gradient-to-br from-zinc-950 via-zinc-950 to-cyan-950/20 md:border-b border-zinc-900">
        <div className="max-w-7xl mx-auto w-full">
          <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300 font-bold uppercase tracking-widest mb-8">
            <span className="flex h-2 w-2 rounded-full bg-cyan-500 mr-2 animate-pulse"></span>
            Now accepting professional memberships
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-6 leading-tight">
            The ultimate space for <br className="hidden md:block" />
            <span className="italic text-cyan-500">
              passionate professionals.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 font-medium max-w-2xl mb-10 leading-relaxed">
            Join a curated community of experts, gamers, and developers. Connect, collaborate, and elevate your skills in a secure environment. Powered by Supabase & Vercel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/signup" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-cyan-600 text-white font-bold uppercase tracking-widest hover:bg-cyan-500 transition-colors text-xs"
            >
              Apply for Access
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/features" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-xs font-bold uppercase tracking-widest"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Site Features Section */}
      <section className="py-16 md:py-24 px-4 md:px-10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-12">
            <h2 className="text-3xl lg:text-4xl font-serif text-white mb-4">Why join Akto Forum?</h2>
            <p className="text-zinc-400 max-w-xl text-lg">We provide a premium toolkit and a safe environment for high-quality discussions.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="h-10 w-10 bg-cyan-900/30 text-cyan-400 rounded flex items-center justify-center mb-6 border border-cyan-800/50">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">Curated Community</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every member is vetted by our admins to preserve the quality of interactions and prevent spam.
              </p>
            </div>
            
            <div className="flex flex-col p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="h-10 w-10 bg-cyan-900/30 text-cyan-400 rounded flex items-center justify-center mb-6 border border-cyan-800/50">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">Secure & Private</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                State-of-the-art security keeps your data safe. Granular privacy controls put you in charge.
              </p>
            </div>
            
            <div className="flex flex-col p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="h-10 w-10 bg-cyan-900/30 text-cyan-400 rounded flex items-center justify-center mb-6 border border-cyan-800/50">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">Lightning Fast</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Optimized for performance. Find what you need instantly and never wait for pages to load.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
