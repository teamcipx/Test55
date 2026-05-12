import React, { useState, useEffect } from "react";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { Link } from "react-router";
import { LayoutDashboard, MessageSquare, Heart, Users, Activity, ChevronRight, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [stats, setStats] = useState({ posts: 0, likes: 0, profileViews: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (hasSupabaseConfig) {
      fetchDashboardData();
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch stats
    const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', user.id);
    const { count: likeCount } = await supabase.from('profile_likes').select('*', { count: 'exact', head: true }).eq('profile_id', user.id);

    setStats({
      posts: postCount || 0,
      likes: likeCount || 0,
      profileViews: Math.floor(Math.random() * 100) + 10 // Fake stat for now
    });

    // Fetch recent activity
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentPosts) setRecentActivity(recentPosts);

    setLoading(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("App installation prompt is not available right now. You can install this app using your browser's 'Add to Home Screen' or 'Install' menu option.");
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  return (
    <div className="max-w-6xl mx-auto w-full py-8 text-white px-4 md:px-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-cyan-950/30 flex items-center justify-center border border-cyan-900/50">
          <LayoutDashboard className="w-6 h-6 text-cyan-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-serif">Dashboard</h1>
          <p className="text-zinc-400">Overview of your activity</p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold border border-amber-400 px-4 py-2 rounded-lg text-sm transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            <Download className="w-4 h-4" /> Install App
          </button>
          <Link to="/community" className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-lg text-sm transition-colors">
            <Activity className="w-4 h-4" /> Go to Feed
          </Link>
        </div>
      </div>

      <div className="md:hidden flex flex-col gap-3 mb-6">
        <button 
          onClick={handleInstallClick}
          className="flex items-center justify-center w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold border border-amber-400 px-4 py-3 rounded-lg text-sm transition-transform active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        >
          <Download className="w-4 h-4" /> Install App
        </button>
        <Link to="/community" className="flex items-center justify-center w-full gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-lg text-sm transition-colors">
          <Activity className="w-4 h-4" /> Go to Feed
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4 text-zinc-400">
                <MessageSquare className="w-5 h-5 text-cyan-500" />
                <h3 className="font-medium">Total Posts</h3>
              </div>
              <div className="text-3xl font-serif">{stats.posts}</div>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4 text-zinc-400">
                <Heart className="w-5 h-5 text-red-500" />
                <h3 className="font-medium">Profile Likes</h3>
              </div>
              <div className="text-3xl font-serif">{stats.likes}</div>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4 text-zinc-400">
                <Activity className="w-5 h-5 text-amber-500" />
                <h3 className="font-medium">Profile Views</h3>
              </div>
              <div className="text-3xl font-serif">{stats.profileViews}</div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-serif">Recent Activity</h2>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">No recent activity found.</div>
              ) : (
                recentActivity.map((activity, i) => (
                  <div key={i} className="p-6 hover:bg-zinc-800/50 transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                         <span className="text-sm text-cyan-500 font-medium">{activity.type === 'thread' ? 'Created Thread' : 'Replied'}</span>
                         <span className="text-xs text-zinc-500">{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                      </div>
                      <p className="text-zinc-300 mt-1 line-clamp-1" dangerouslySetInnerHTML={{ __html: activity.content || activity.title || 'No content' }}></p>
                    </div>
                    {activity.type === 'thread' || activity.type === 'normal' || activity.type === 'reply' ? (
                       <Link to={`/thread/${activity.type === 'reply' ? activity.thread_id : activity.id}`} className="shrink-0 p-2 text-zinc-500 hover:text-white transition-colors">
                          <ChevronRight className="w-5 h-5" />
                       </Link>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
