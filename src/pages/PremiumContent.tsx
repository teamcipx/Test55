import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Play, Lock, Crown } from "lucide-react";
import { supabase, hasSupabaseConfig } from "../lib/supabase";

export default function PremiumContent() {
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    if (hasSupabaseConfig) {
      supabase.from('settings').select('value').eq('id', 'premium_videos').single().then(s => {
         if (s.data && Array.isArray(s.data.value)) {
            setVideos(s.data.value);
         } else {
            setVideos([
               { id: 1, title: "Exclusive Interview: The Founders", duration: "45:12", img: "https://images.unsplash.com/photo-1516280440502-c6722d56abf0?auto=format&fit=crop&w=500" },
               { id: 2, title: "Behind the Scenes 2026", duration: "12:05", img: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=500" },
               { id: 3, title: "Next-Gen UI Masterclass", duration: "1:20:00", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500" }
            ]);
         }
      });

      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
          navigate('/login');
          return;
        }
        supabase.from('profiles').select('is_premium').eq('id', data.user.id).single().then(res => {
          if (res.data) setIsPremium(res.data.is_premium);
          setLoading(false);
        });
      });
    }
  }, [navigate]);

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto w-full py-12 px-4 min-h-screen">
      <div className="mb-10 flex items-center justify-between">
         <div>
            <h1 className="text-3xl md:text-4xl font-serif text-white mb-2 flex items-center gap-3">
               Premium Content <Crown className="w-8 h-8 text-amber-500" />
            </h1>
            <p className="text-zinc-400">Exclusive videos and masterclasses for premium members.</p>
         </div>
         {!isPremium && (
            <Link to="/premium" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-6 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform">
               Upgrade
            </Link>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {videos.map(video => (
            <div key={video.id} className="relative group rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
               <div className="relative aspect-video">
                  <img 
                     src={video.img} 
                     alt={video.title} 
                     className={`w-full h-full object-cover transition-all duration-500 ${!isPremium ? 'blur-md grayscale opacity-50' : 'group-hover:scale-105'}`}
                  />
                  {!isPremium ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10">
                        <div className="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mb-3">
                           <Lock className="w-5 h-5 text-amber-500" />
                        </div>
                        <span className="text-white font-medium shadow-black drop-shadow-md">Premium Only</span>
                     </div>
                  ) : (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors z-10">
                        <div className="w-14 h-14 rounded-full bg-cyan-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-300">
                           <Play className="w-6 h-6 ml-1" />
                        </div>
                     </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-[10px] font-medium text-white z-20">
                     {video.duration}
                  </div>
               </div>
               <div className="p-4">
                  <h3 className="text-white font-medium line-clamp-1">{video.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                     <span className="flex items-center gap-1 text-amber-500"><Crown className="w-3 h-3" /> Premium Video</span>
                     <span>•</span>
                     <span>1080p HD</span>
                  </div>
               </div>
               
               {/* Click overlay for non-premium */}
               {!isPremium && (
                  <Link to="/premium" className="absolute inset-0 z-30 cursor-pointer" title="Upgrade to watch" />
               )}
            </div>
         ))}
      </div>
    </div>
  );
}
