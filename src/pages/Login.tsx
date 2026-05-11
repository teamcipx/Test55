import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogIn, AlertCircle } from "lucide-react";
import { supabase, hasSupabaseConfig } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (hasSupabaseConfig) {
      supabase!.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate("/dashboard");
        }
      });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!hasSupabaseConfig) {
      setError("Database is not configured. Please add Supabase credentials to .env");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Check if user is approved
      if (data.user) {
        const { data: profile } = await supabase!
          .from('profiles')
          .select('is_approved')
          .eq('id', data.user.id)
          .single();

        if (profile && !profile.is_approved) {
          await supabase!.auth.signOut();
          navigate("/pending-approval");
          return;
        }

        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-104px)] flex flex-col justify-center py-12 px-4 -mt-2">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1510257321033-6bc31289fe80?auto=format&fit=crop&q=80" 
          alt="Dark portrait" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/80 to-[#050505]"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto w-full">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-zinc-500">Sign in to your Hijabii account</p>
          </div>

          {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md mb-6 flex items-start gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-[10px] uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-600 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-xs text-zinc-500 uppercase tracking-widest text-center border-t border-zinc-800/50 pt-6">
          Not a member yet?{" "}
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
            Apply for access
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
