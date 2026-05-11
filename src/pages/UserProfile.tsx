import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { User, ShieldAlert, BadgeCheck, MessageSquare, Heart, Clock, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasSupabaseConfig && id) {
      fetchUserProfile();
    }
  }, [id]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profileError) throw profileError;
      if (profileData) {
        setProfile(profileData);
        
        // Fetch user's posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*, author:author_id(*)')
          .eq('author_id', id)
          .in('type', ['post', 'thread'])
          .order('created_at', { ascending: false });
          
        if (postsData) setPosts(postsData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (post: any) => {
    const textHTML = post.content || '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textHTML;
    const textLength = tempDiv.textContent?.length || 0;
    const shouldTruncate = textLength > 300;

    return (
      <div className="mt-3 text-sm text-zinc-300 leading-relaxed space-y-4">
        {post.type === 'thread' && (
          <h3 className="text-xl font-serif text-white">{post.title}</h3>
        )}
        <div 
          className={`prose prose-invert prose-p:my-2 prose-a:text-cyan-400 max-w-none ${shouldTruncate ? 'line-clamp-6' : ''}`}
          dangerouslySetInnerHTML={{ __html: textHTML }} 
        />
        {shouldTruncate && (
          <Link to={`/thread/${post.type === 'thread' ? post.id : post.thread_id}`} className="text-cyan-400 font-medium text-xs hover:underline mt-2 uppercase tracking-wide inline-block">
            Read More
          </Link>
        )}
      </div>
    );
  };

  const isUserOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const diff = new Date().getTime() - new Date(lastSeen).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  if (loading) {
    return <div className="flex justify-center p-12 min-h-screen"><div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" /></div>;
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto w-full py-10 px-4 text-center min-h-screen">
        <h2 className="text-xl text-zinc-400 mb-4">{error || "User not found."}</h2>
        <Link to="/community" className="text-cyan-500 hover:text-cyan-400 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Community
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-8 md:py-12 px-4 min-h-[calc(100vh-104px)]">
      <Link to="/community" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Profile Header */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-10 backdrop-blur-sm mb-8 relative overflow-hidden">
        {/* Background glow based on role */}
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-20 ${profile.is_admin ? 'bg-red-500' : 'bg-cyan-500'}`} />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 relative z-10">
          <div className="shrink-0 relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-zinc-800 overflow-hidden bg-zinc-900 shadow-2xl">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <User className="w-16 h-16" />
                </div>
              )}
            </div>
            {isUserOnline(profile.last_seen) && (
              <div className="absolute bottom-4 right-4 w-6 h-6 bg-emerald-500 border-4 border-[#050505] rounded-full" title="Online now" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">{profile.display_name || "User"}</h1>
            <p className="text-zinc-400 font-mono text-sm mb-4">@{profile.username || "unknown"}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
              {profile.is_admin && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-bold uppercase tracking-widest">
                  <ShieldAlert className="w-4 h-4" /> Admin
                </div>
              )}
              {profile.is_approved && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-xs font-bold uppercase tracking-widest">
                  <BadgeCheck className="w-4 h-4" /> Verified Member
                </div>
              )}
              {profile.country && (
                <div className="px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 rounded-full text-xs font-medium">
                  🌍 {profile.country}
                </div>
              )}
              {profile.age && (
                <div className="px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 rounded-full text-xs font-medium">
                  {profile.age} yrs
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center md:justify-start gap-3 mb-6">
              <Link 
                to={`/inbox?u=${profile.id}`}
                className="flex items-center gap-2 bg-white text-zinc-900 hover:bg-zinc-200 px-5 py-2 rounded-full text-sm font-bold transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </Link>
            </div>
            
            {profile.interest && (
              <div>
                <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Interests</h4>
                <p className="text-sm text-zinc-300">{profile.interest}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif text-white flex items-center gap-2">
          Activity <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs text-zinc-400">{posts.length}</span>
        </h2>
      </div>

      {/* User Posts */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center p-12 border border-zinc-800/50 rounded-xl bg-zinc-900/20 text-zinc-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No recent activity.</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 hover:border-cyan-900/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  {post.type === 'thread' && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-900/30 text-cyan-400 border border-cyan-800/50">Thread</span>
                  )}
                  {post.type === 'post' && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-800 text-zinc-400">Post</span>
                  )}
                </div>
                {post.type === 'thread' && (
                  <Link to={`/thread/${post.id}`} className="text-xs text-cyan-500 hover:text-cyan-400 px-2 py-1 rounded bg-cyan-500/10 uppercase tracking-widest font-bold transition-colors">
                    View Thread
                  </Link>
                )}
              </div>
              
              {renderContent(post)}
              
              {post.image_url && (
                <div className="mt-4 rounded-xl overflow-hidden border border-zinc-800 w-max max-w-full">
                  <img src={post.image_url} alt="Post media" className="max-h-[300px] object-cover" />
                </div>
              )}
              
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-zinc-800/50 text-zinc-500 text-sm">
                <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {post.likes_count}</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> {post.replies_count}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
