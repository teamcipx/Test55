import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { User, ShieldAlert, BadgeCheck, MessageSquare, Heart, Clock, ArrowLeft, Send, Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import UserBadges from "../components/UserBadges";
import AdBanner from "../components/ads/AdBanner";
import AdPopup from "../components/ads/AdPopup";

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [profileLikes, setProfileLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'comments'>('activity');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
  }, []);

  useEffect(() => {
    if (hasSupabaseConfig && id) {
      fetchUserProfile();
      fetchProfileComments();
      fetchProfileLikes();
    }
  }, [id, currentUser]);

  const fetchProfileLikes = async () => {
    if (!profile?.id && !id) return;
    const targetId = profile?.id || id;
    const { count } = await supabase
      .from('profile_likes')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', targetId);
    
    setProfileLikes(count || 0);

    if (currentUser) {
      const { data } = await supabase
        .from('profile_likes')
        .select('*')
        .eq('profile_id', targetId)
        .eq('user_id', currentUser.id)
        .single();
      
      setHasLiked(!!data);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser || (!profile?.id && !id)) return;
    const targetId = profile?.id || id;
    
    if (hasLiked) {
      setProfileLikes(prev => prev - 1);
      setHasLiked(false);
      const { error } = await supabase.from('profile_likes').delete().eq('profile_id', targetId).eq('user_id', currentUser.id);
      if (error) alert("Could not remove like. " + error.message);
    } else {
      setProfileLikes(prev => prev + 1);
      setHasLiked(true);
      const { error } = await supabase.from('profile_likes').insert({ profile_id: targetId, user_id: currentUser.id });
      if (error) {
         setProfileLikes(prev => prev - 1);
         setHasLiked(false);
         alert("Unable to like: Database may need update. " + error.message);
      }
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Fetch profile
      // Check if id is actually a username (no dashes)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
      
      let query = supabase.from('profiles').select('*');
      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.ilike('username', id || '');
      }

      const { data: profileData, error: profileError } = await query.single();
        
      if (profileError) throw profileError;
      if (profileData) {
        setProfile(profileData);
        
        // Fetch user's posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*, author:author_id(*)')
          .eq('author_id', profileData.id)
          .in('type', ['post', 'thread'])
          .order('created_at', { ascending: false });
          
        if (postsData) setPosts(postsData);
      }
    } catch (err: any) {
      console.error(err);
      setError('User not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileComments = async () => {
    if (!profile?.id && !id) return;
    const targetId = profile?.id || id;
    
    const { data } = await supabase
      .from('profile_comments')
      .select('*, author:author_id(*)')
      .eq('profile_id', targetId)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim() || (!profile?.id && !id)) return;
    const targetId = profile?.id || id;
    
    setSubmitting(true);
    const { data, error } = await supabase.from('profile_comments').insert({
      profile_id: targetId,
      author_id: currentUser.id,
      content: newComment.trim()
    }).select('*, author:author_id(*)').single();
    
    if (!error && data) {
      setComments([data, ...comments]);
      setNewComment('');
    } else if (error) {
      alert("Unable to post comment: " + error.message + " (Have you run the latest supabase_setup.sql?)");
    }
    setSubmitting(false);
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
      <AdPopup />
      <Link to="/community" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Profile Header */}
      <div className={`bg-zinc-900/40 border rounded-3xl p-6 md:p-10 backdrop-blur-sm mb-8 relative overflow-hidden ${profile.is_premium ? 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.15)] bg-gradient-to-b from-amber-500/5 to-zinc-900/40' : 'border-zinc-800'}`}>
        {/* Background glow based on role */}
        <div className={`absolute top-0 right-0 w-96 h-96 blur-[120px] rounded-full pointer-events-none opacity-20 ${profile.is_admin ? 'bg-red-500' : profile.is_premium ? 'bg-amber-500 opacity-40' : 'bg-cyan-500'}`} />
        
        {/* VIP Watermark */}
        {profile.is_premium && (
          <div className="absolute -bottom-10 -right-10 text-amber-500/5 pointer-events-none">
            <Crown className="w-64 h-64" />
          </div>
        )}
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 relative z-10">
          <div className="shrink-0 relative">
            <div className={`w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden shadow-2xl ${profile.is_premium ? 'p-1.5 bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-700 shadow-amber-500/40' : 'border-4 border-zinc-800 bg-zinc-900'}`}>
              <div className={`w-full h-full rounded-full overflow-hidden bg-zinc-900 ${profile.is_premium ? 'border-[4px] border-[#0a0a0a]' : ''}`}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <User className="w-16 h-16" />
                  </div>
                )}
              </div>
            </div>
            {isUserOnline(profile.last_seen) && (
              <div className="absolute bottom-5 right-5 w-6 h-6 bg-emerald-500 border-4 border-[#0a0a0a] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" title="Online now" />
            )}
            {profile.is_premium && (
              <div className="absolute -bottom-2 md:-bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-black px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center gap-1 border-2 border-[#0a0a0a]">
                <Crown className="w-3 h-3 fill-black" /> VIP
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left pt-2 md:pt-4">
            <h1 className={`text-3xl md:text-5xl font-serif mb-2 tracking-tight ${profile.is_premium ? 'bg-clip-text text-transparent bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 drop-shadow-md font-bold' : 'text-white'}`}>
              {profile.display_name || "User"}
            </h1>
            <p className="text-zinc-400 font-mono text-sm mb-5">@{profile.username || "unknown"}</p>
            
            {profile.bio && (
              <p className="text-zinc-300 text-sm mb-4 max-w-lg mx-auto md:mx-0">{profile.bio}</p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
              <UserBadges user={profile} />
              
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
              {profile.relationship_status && (
                <div className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full text-xs font-medium uppercase tracking-wider">
                  ❤️ {profile.relationship_status}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
              <Link 
                to={`/inbox?u=${profile.id}`}
                className="flex items-center gap-2 bg-white text-zinc-900 hover:bg-zinc-200 px-5 py-2 rounded-full text-sm font-bold transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </Link>
              
              <button 
                onClick={handleToggleLike}
                disabled={!currentUser}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors border ${hasLiked ? 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20' : 'bg-transparent text-white border-zinc-700 hover:border-zinc-500 disabled:opacity-50'}`}
              >
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-red-500' : ''}`} /> 
                {profileLikes} {profileLikes === 1 ? 'Like' : 'Likes'}
              </button>
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

      <div className="flex gap-4 border-b border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'activity' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Activity <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-xs text-zinc-400">{posts.length}</span>
          {activeTab === 'activity' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'comments' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Comments <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-xs text-zinc-400">{comments.length}</span>
          {activeTab === 'comments' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === 'activity' && (
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
      )}

      {activeTab === 'comments' && (
        <div className="space-y-6">
          {currentUser ? (
            <form onSubmit={handlePostComment} className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex gap-4">
              <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-zinc-800 border border-zinc-700">
                 <User className="w-full h-full p-2 text-zinc-500" />
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Leave a comment..."
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none min-h-[80px] resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 text-center text-sm text-zinc-400">
               Please <Link to="/login" className="text-cyan-500 hover:underline">log in</Link> to leave a comment.
            </div>
          )}

          <div className="space-y-4">
            {comments.length === 0 ? (
               <p className="text-center text-zinc-500 py-8">No comments yet. Be the first to say hi!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start gap-4">
                     <Link to={`/user/${comment.author_id}`} className={`shrink-0 w-10 h-10 rounded-full overflow-hidden ${comment.author?.is_premium ? 'p-0.5 bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-700' : 'border border-zinc-700 hover:border-cyan-500 bg-zinc-800'} transition-all`}>
                        {comment.author?.avatar_url ? (
                          <img src={comment.author.avatar_url} className={`w-full h-full rounded-full object-cover ${comment.author?.is_premium ? 'border-2 border-[#0a0a0a]' : ''}`} />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${comment.author?.is_premium ? 'border-2 border-[#0a0a0a] rounded-full bg-zinc-900' : ''}`}>
                             <User className="w-full h-full p-2 text-zinc-500" />
                          </div>
                        )}
                     </Link>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/user/${comment.author_id}`} className={`font-medium text-sm transition-colors ${comment.author?.is_premium ? 'bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 font-bold hover:to-amber-400' : 'text-white hover:text-cyan-400'}`}>
                             {comment.author?.display_name || comment.author?.username || 'User'}
                          </Link>
                          <span className="text-zinc-600 text-xs">• {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                        </div>
                        <p className="text-zinc-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
