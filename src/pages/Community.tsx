import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { User, MessageSquare, Heart, Share2, Image as ImageIcon, Send, X, FileText, Trash2 } from "lucide-react";
import { uploadToImgBB } from "../lib/imgbb";
import AdBanner from "../components/ads/AdBanner";
import AdPopup from "../components/ads/AdPopup";
import UserBadges from "../components/UserBadges";
import Stories from "../components/Stories";

// Remove invalid links from text
function formatPostContent(html: string) {
  if (!html) return '';
  // Basic parsing to strip links unless they have hijab.site
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const links = temp.querySelectorAll('a');
  links.forEach(a => {
    try {
      const url = new URL(a.href);
      if (!url.hostname.endsWith('hijab.site')) {
        // Strip the link, keep the text
        const textNode = document.createTextNode(a.textContent || '');
        a.parentNode?.replaceChild(textNode, a);
      }
    } catch {
      // Invalid URL, just remove link
      const textNode = document.createTextNode(a.textContent || '');
      a.parentNode?.replaceChild(textNode, a);
    }
  });
  
  // Format mentions (@username)
  let content = temp.innerHTML;
  content = content.replace(/(^|\s)@([\w\.\-]+)/g, '$1<a href="/user/$2" class="text-amber-400 font-bold hover:underline">@$2</a>');
  
  return content;
}

export default function Community() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Create Post / Thread states
  const [postMode, setPostMode] = useState<'normal'|'thread'>('normal');
  const [content, setContent] = useState('');
  const [threadTitle, setThreadTitle] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  const [activeFeed, setActiveFeed] = useState<'forYou' | 'recent'>('forYou');

  const navigate = useNavigate();

  useEffect(() => {
    if (hasSupabaseConfig) {
      supabase.auth.getUser().then(async ({ data }) => {
        if (!data.user) {
          navigate('/login');
          return;
        }
        setCurrentUser(data.user);
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single();
        setIsAdmin(profile?.is_admin || false);
      });
      fetchPosts(activeFeed);
    }
  }, [activeFeed, navigate]);

  const fetchPosts = async (feedType: 'forYou' | 'recent' = 'forYou') => {
    setLoading(true);
    let query = supabase.from('posts').select('*, author:author_id(*)').neq('type', 'reply');
    
    if (feedType === 'forYou') {
      query = query.order('likes_count', { ascending: false }).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: postsData } = await query;
      
    if (postsData) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         const { data: userLikes } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
         const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
         setPosts(postsData.map(p => ({...p, has_liked: likedPostIds.has(p.id)})));
      } else {
         setPosts(postsData);
      }
    }
    setLoading(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this post? This will delete all replies and likes as well.')) return;
    try {
      const { error } = await supabase.rpc('delete_post_with_relations', { post_id_to_delete: postId });
      if (error) throw error;
      fetchPosts();
    } catch (err: any) {
      console.error(err);
      alert('Error deleting post: ' + err.message);
    }
  };

  const handlePostSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return alert('Please login to post');
    if (postMode === 'normal' && !content.trim() && !imageFile) return;
    if (postMode === 'thread' && !threadTitle.trim()) {
      alert('Thread title is required');
      return;
    }

    setPublishing(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadToImgBB(imageFile);
      }

      // Format content to strip invalid links
      const cleanContent = formatPostContent(content);

      if (postMode === 'normal') {
        const { error } = await supabase.from('posts').insert({
          user_id: currentUser.id,
          author_id: currentUser.id,
          type: 'post',
          content: cleanContent,
          image_url: imageUrl,
        });
        if (error) throw error;
      } else {
        if (!threadTitle.trim()) {
          alert('Thread title is required');
          setPublishing(false);
          return;
        }
        const { error } = await supabase.from('posts').insert({
          user_id: currentUser.id,
          author_id: currentUser.id,
          type: 'thread',
          title: threadTitle,
          content: cleanContent,
        });
        if (error) throw error;
      }

      setContent('');
      setThreadTitle('');
      setImageFile(null);
      setImagePreview(null);
      fetchPosts();
    } catch (err: any) {
      console.error(err);
      alert('Error creating post: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const toggleExpand = (postId: string) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const renderContent = (post: any) => {
    const isExpanded = expandedPosts[post.id];
    const textHTML = post.content || '';
    
    // Simplistic strip tags for normal mode length check 
    // real implementation might vary if thread HTML gets huge, but they are viewed in thread anyway.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textHTML;
    const textLength = tempDiv.textContent?.length || 0;

    const shouldTruncate = textLength > 300 && !isExpanded;

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
          <button 
            onClick={() => toggleExpand(post.id)}
            className="text-cyan-400 font-medium text-xs hover:underline mt-2 uppercase tracking-wide"
          >
            Read More
          </button>
        )}
        {isExpanded && textLength > 300 && (
           <button 
           onClick={() => toggleExpand(post.id)}
           className="text-zinc-500 font-medium text-xs hover:underline mt-2 uppercase tracking-wide"
         >
           Show Less
         </button>
        )}
      </div>
    );
  };

  const toggleLike = async (postId: string) => {
    if (!currentUser) return alert('Please login to like');
    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        await supabase.from('likes').delete().eq('id', existingLike.id);
        
        // Optimistic UI update
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return { ...p, likes_count: Math.max(0, p.likes_count - 1), has_liked: false };
          }
          return p;
        }));
      } else {
        // Like
        await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
        
        // Add notification for the like
        const post = posts.find(p => p.id === postId);
        if (post && post.user_id !== currentUser.id) {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: currentUser.id,
            type: 'like',
            reference_id: postId,
            content: 'liked your post'
          });
        }
        
        // Optimistic UI update
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return { ...p, likes_count: p.likes_count + 1, has_liked: true };
          }
          return p;
        }));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleShare = async (postId: string) => {
    // In a real app we'd trigger a share dialog. Here we just increment shares_count and copy to clipboard.
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/thread/${postId}`);
      alert('Link copied to clipboard!');
      
      const post = posts.find(p => p.id === postId);
      if (post) {
        const newCount = (post.shares_count || 0) + 1;
        await supabase.from('posts').update({ shares_count: newCount }).eq('id', postId);
        setPosts(posts.map(p => p.id === postId ? { ...p, shares_count: newCount } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isUserOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const diff = new Date().getTime() - new Date(lastSeen).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 md:py-10 px-4 min-h-screen">
      <AdPopup />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Community Discussions</h1>
          <p className="text-zinc-400 text-sm">Join the conversation securely.</p>
        </div>
      </div>
      
      <Stories currentUser={currentUser} />

      {/* Editor Box */}
      {currentUser && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 mb-8">
          <div className="flex gap-4 border-b border-zinc-800 pb-4 mb-4">
            <button 
              onClick={() => setPostMode('normal')}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-colors ${postMode === 'normal' ? 'bg-cyan-900/30 text-cyan-400' : 'text-zinc-400 hover:text-white'}`}
            >
              <MessageSquare className="w-4 h-4" /> Normal Post
            </button>
            <button 
              onClick={() => setPostMode('thread')}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-colors ${postMode === 'thread' ? 'bg-cyan-900/30 text-cyan-400' : 'text-zinc-400 hover:text-white'}`}
            >
              <FileText className="w-4 h-4" /> New Thread
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                {currentUser?.user_metadata?.avatar_url ? (
                   <img src={currentUser.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-zinc-500"><User className="w-5 h-5"/></div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                {postMode === 'thread' ? (
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Thread Title"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-cyan-500 outline-none"
                      value={threadTitle}
                      onChange={e => setThreadTitle(e.target.value)}
                    />
                    <textarea 
                      placeholder="Write your thread... (Only hijab.site links allowed)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-cyan-500 outline-none min-h-[150px] resize-y"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                    />
                  </div>
                ) : (
                  <textarea 
                    placeholder="What's on your mind? (Only hijab.site links allowed)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-cyan-500 outline-none min-h-[100px] resize-y"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                )}
              </div>
            </div>

            {imagePreview && postMode === 'normal' && (
              <div className="relative w-max ml-13">
                <img src={imagePreview} className="max-w-[200px] rounded-lg border border-zinc-700" alt="Preview"/>
                <button onClick={() => {setImageFile(null); setImagePreview(null)}} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X className="w-4 h-4"/></button>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 ml-13 border-t border-zinc-800 mt-2">
              <div className="flex gap-2">
                {postMode === 'normal' && (
                  <label className="cursor-pointer text-cyan-500 hover:text-cyan-400 p-2 rounded-full hover:bg-cyan-500/10 transition-colors">
                    <ImageIcon className="w-5 h-5" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if(e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        setImagePreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }} />
                  </label>
                )}
              </div>
              <button 
                onClick={handlePostSubmit}
                disabled={publishing}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
              >
                {publishing ? 'Posting...' : (postMode === 'thread' ? 'Publish Thread' : 'Post')} <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Options */}
      <div className="flex gap-4 border-b border-zinc-800 mb-6">
        <button
          onClick={() => setActiveFeed('forYou')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeFeed === 'forYou' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          For You
          {activeFeed === 'forYou' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveFeed('recent')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeFeed === 'recent' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Recent
          {activeFeed === 'recent' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center p-12 text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/20">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No posts yet. Be the first to start a discussion!</p>
          </div>
        ) : (
          posts.map((post, ind) => (
            <React.Fragment key={post.id}>
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <Link to={`/user/${post.author_id}`} className="shrink-0 relative block">
                    <div className={`w-10 h-10 rounded-full overflow-hidden ${post.author?.is_premium ? 'p-0.5 bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-700' : 'border border-zinc-700 hover:border-cyan-500'} transition-all`}>
                      <img 
                        src={post.author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80"} 
                        alt="avatar" 
                        className={`w-full h-full rounded-full object-cover ${post.author?.is_premium ? 'border-2 border-[#0a0a0a]' : ''}`} 
                      />
                    </div>
                    {isUserOnline(post.author?.last_seen) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full" />
                    )}
                  </Link>
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2">
                       <Link to={`/user/${post.author_id}`} className={`transition-colors ${post.author?.is_premium ? 'bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 font-bold hover:to-amber-400' : 'text-white hover:text-cyan-400'}`}>
                         {post.author?.display_name || "User"}
                       </Link>
                       {post.type === 'thread' && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-cyan-900/30 text-cyan-400 border border-cyan-800/50">Thread</span>}
                       {post.type === 'reply' && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">Reply</span>}
                    </h4>
                    <UserBadges user={post.author} />
                    <p className="text-xs text-zinc-500 mt-0.5">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-zinc-500 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {renderContent(post)}
              
              {post.image_url && (
                <div className="mt-4 rounded-xl overflow-hidden border border-zinc-800">
                  <img src={post.image_url} alt="Post media" className="w-full max-h-[500px] object-cover" />
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
                <div className="flex items-center gap-6">
                  <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-2 transition-colors text-sm font-medium group ${post.has_liked ? 'text-red-500' : 'text-zinc-400 hover:text-red-400'}`}>
                    <div className="p-1.5 rounded-full group-hover:bg-red-500/10"><Heart className={`w-4 h-4 ${post.has_liked ? 'fill-current' : ''}`} /></div> {post.likes_count}
                  </button>
                  <Link to={`/thread/${post.type === 'reply' ? post.thread_id : post.id}`} className="flex items-center gap-2 text-zinc-400 hover:text-cyan-400 transition-colors text-sm font-medium group">
                    <div className="p-1.5 rounded-full group-hover:bg-cyan-500/10"><MessageSquare className="w-4 h-4" /></div> {post.replies_count}
                  </Link>
                  <button onClick={() => handleShare(post.id)} className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors text-sm font-medium group">
                    <div className="p-1.5 rounded-full group-hover:bg-emerald-500/10"><Share2 className="w-4 h-4" /></div> {post.shares_count || 0}
                  </button>
                </div>
                
                <Link to={`/thread/${post.type === 'reply' ? post.thread_id : post.id}`} className="inline-flex text-xs text-cyan-500 hover:text-cyan-400 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 uppercase tracking-wider font-bold transition-colors">
                  View full post
                </Link>
              </div>
            </div>
            
            {/* Show AdBanner after every 2 posts */}
            {(ind + 1) % 2 === 0 && <AdBanner />}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
}
