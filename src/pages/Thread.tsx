import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { User, MessageSquare, Heart, Share2, Image as ImageIcon, Send, X, ArrowLeft, Trash2 } from "lucide-react";
import { uploadToImgBB } from "../lib/imgbb";
import AdBanner from "../components/ads/AdBanner";
import UserBadges from "../components/UserBadges";

// Remove invalid links from text
function formatPostContent(html: string) {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const links = temp.querySelectorAll('a');
  links.forEach(a => {
    try {
      const url = new URL(a.href);
      if (!url.hostname.endsWith('hijab.site')) {
        const textNode = document.createTextNode(a.textContent || '');
        a.parentNode?.replaceChild(textNode, a);
      }
    } catch {
      const textNode = document.createTextNode(a.textContent || '');
      a.parentNode?.replaceChild(textNode, a);
    }
  });

  // Format mentions (@username)
  let content = temp.innerHTML;
  content = content.replace(/(^|\s)@([\w\.\-]+)/g, '$1<a href="/user/$2" class="text-amber-400 font-bold hover:underline">@$2</a>');
  
  return content;
}

export default function Thread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Reply states
  const [replyContent, setReplyContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (hasSupabaseConfig && id) {
      supabase.auth.getUser().then(async ({ data }) => {
        if (!data.user) {
          navigate('/login');
          return;
        }
        setCurrentUser(data.user);
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single();
        setIsAdmin(profile?.is_admin || false);
      });
      fetchThread();
    }
  }, [id, navigate]);

  const handleDeletePost = async (postId: string, isMainThread: boolean) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      const { error } = await supabase.rpc('delete_post_with_relations', { post_id_to_delete: postId });
      if (error) throw error;
      if (isMainThread) {
        navigate('/community');
      } else {
        fetchThread();
      }
    } catch (err: any) {
      console.error(err);
      alert('Error deleting: ' + err.message);
    }
  };

  const fetchThread = async () => {
    setLoading(true);
    
    const { data: threadData, error } = await supabase
      .from('posts')
      .select('*, author:author_id(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(error);
      alert('Error fetching thread: ' + error.message);
    }
      
    if (threadData) {
      // Fetch replies
      const { data: repliesData } = await supabase
        .from('posts')
        .select('*, author:author_id(*)')
        .eq('thread_id', id)
        .order('created_at', { ascending: true });
        
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         const { data: userLikes } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
         const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
         setThread({...threadData, has_liked: likedPostIds.has(threadData.id)});
         if (repliesData) {
           setReplies(repliesData.map(r => ({...r, has_liked: likedPostIds.has(r.id)})));
         }
      } else {
         setThread(threadData);
         if (repliesData) setReplies(repliesData);
      }
    }
    
    setLoading(false);
  };

  const handleReplySubmit = async () => {
    if (!currentUser) return alert('Please login to reply');
    if (!replyContent.trim() && !imageFile) return;

    setReplying(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadToImgBB(imageFile);
      }

      const cleanContent = formatPostContent(replyContent);

      const { error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        author_id: currentUser.id,
        type: 'reply',
        thread_id: id,
        content: cleanContent,
        image_url: imageUrl,
      });

      if (error) throw error;
      
      // Update replies count on thread
      await supabase.rpc('increment_replies_count', { row_id: id });

      setReplyContent('');
      setImageFile(null);
      setImagePreview(null);
      fetchThread();
    } catch (err: any) {
      console.error(err);
      alert('Error saving reply: ' + err.message);
    } finally {
      setReplying(false);
    }
  };

  const toggleLike = async (postId: string, isReply: boolean = false) => {
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
        if (isReply) {
          setReplies(replies.map(r => r.id === postId ? { ...r, likes_count: Math.max(0, r.likes_count - 1), has_liked: false } : r));
        } else if (thread) {
          setThread({ ...thread, likes_count: Math.max(0, thread.likes_count - 1), has_liked: false });
        }
      } else {
        // Like
        await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
        
        // Add notification for the like
        const post = isReply ? replies.find(r => r.id === postId) : thread;
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
        if (isReply) {
          setReplies(replies.map(r => r.id === postId ? { ...r, likes_count: r.likes_count + 1, has_liked: true } : r));
        } else if (thread) {
          setThread({ ...thread, likes_count: thread.likes_count + 1, has_liked: true });
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("Error liking: " + err.message);
    }
  };

  const handleShare = async (postId: string, isReply: boolean = false) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/thread/${id}#reply-${postId}`);
      alert('Link copied to clipboard!');
      
      const newCount = ((isReply ? replies.find(r => r.id === postId)?.shares_count : thread?.shares_count) || 0) + 1;
      await supabase.from('posts').update({ shares_count: newCount }).eq('id', postId);
      
      if (isReply) {
        setReplies(replies.map(r => r.id === postId ? { ...r, shares_count: newCount } : r));
      } else if (thread) {
        setThread({ ...thread, shares_count: newCount });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" /></div>;
  }

  if (!thread) {
    return (
      <div className="max-w-4xl mx-auto w-full py-10 px-4 text-center">
        <h2 className="text-xl text-zinc-400">Thread not found.</h2>
        <Link to="/community" className="text-cyan-500 hover:text-cyan-400 mt-4 inline-block">Back to Community</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-6 md:py-10 px-4 min-h-[calc(100vh-104px)]">
      <Link to="/community" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Discussions
      </Link>

      {/* Main Thread Post */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 md:p-8 mb-8 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/user/${thread.author_id}`} className="shrink-0">
            <div className={`w-12 h-12 rounded-full overflow-hidden ${thread.author?.is_premium ? 'p-0.5 bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-700' : 'border border-zinc-700 hover:border-cyan-500'} transition-all`}>
              <img 
                src={thread.author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80"} 
                alt="avatar" 
                className={`w-full h-full rounded-full object-cover ${thread.author?.is_premium ? 'border-2 border-[#0a0a0a]' : ''}`} 
              />
            </div>
          </Link>
          <div>
            <h4 className="font-medium flex items-center gap-2">
              <Link to={`/user/${thread.author_id}`} className={`transition-colors ${thread.author?.is_premium ? 'bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 font-bold hover:to-amber-400' : 'text-white hover:text-cyan-400'}`}>
                {thread.author?.display_name || "User"}
              </Link>
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-cyan-900/30 text-cyan-400 border border-cyan-800/50">Thread Creator</span>
            </h4>
            <UserBadges user={thread.author} />
            <p className="text-xs text-zinc-500 mt-1">{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</p>
          </div>
        </div>

        {thread.title && <h1 className="text-3xl font-serif text-white mb-6 leading-tight">{thread.title}</h1>}
        
        <div 
          className="prose prose-invert prose-p:my-4 prose-a:text-cyan-400 max-w-none text-zinc-300 leading-relaxed text-base md:text-lg"
          dangerouslySetInnerHTML={{ __html: thread.content || '' }} 
        />
        
        {(() => {
          const temp = document.createElement('div');
          temp.innerHTML = thread.content || '';
          const textLength = temp.textContent?.length || 0;
          if (textLength > 1000) {
            return <AdBanner />;
          }
          return null;
        })()}

        {thread.image_url && (
          <div className="mt-6 rounded-xl overflow-hidden border border-zinc-800">
            <img src={thread.image_url} alt="Thread media" className="w-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-8 mt-8 pt-6 border-t border-zinc-800">
          <button onClick={() => toggleLike(thread.id, false)} className={`flex items-center gap-2 transition-colors font-medium group ${thread.has_liked ? 'text-red-500' : 'text-zinc-400 hover:text-red-400'}`}>
            <div className="p-2 rounded-full group-hover:bg-red-500/10"><Heart className={`w-5 h-5 ${thread.has_liked ? 'fill-current' : ''}`} /></div> {thread.likes_count}
          </button>
          <div className="flex items-center gap-2 text-zinc-400 font-medium group cursor-default">
            <div className="p-2 rounded-full"><MessageSquare className="w-5 h-5" /></div> {thread.replies_count}
          </div>
          <button onClick={() => handleShare(thread.id, false)} className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors font-medium group">
            <div className="p-2 rounded-full group-hover:bg-emerald-500/10"><Share2 className="w-5 h-5" /></div> {thread.shares_count || 0}
          </button>
          <div className="flex-1" />
          {isAdmin && (
            <button 
              onClick={() => handleDeletePost(thread.id, true)}
              className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors font-medium text-sm"
              title="Delete thread"
            >
              <Trash2 className="w-5 h-5" /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          Replies <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs">{replies.length}</span>
        </h3>
      </div>

      {/* Replies */}
      <div className="space-y-4 mb-8">
        {replies.map(reply => (
          <div key={reply.id} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 flex gap-4">
            <Link to={`/user/${reply.author_id}`} className="shrink-0">
              <div className={`w-10 h-10 rounded-full overflow-hidden ${reply.author?.is_premium ? 'p-0.5 bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-700' : 'border border-zinc-700 hover:border-cyan-500'} transition-all`}>
                <img 
                  src={reply.author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40"} 
                  alt="avatar" 
                  className={`w-full h-full rounded-full object-cover ${reply.author?.is_premium ? 'border-2 border-[#0a0a0a]' : ''}`} 
                />
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-2 w-full flex-wrap">
                <Link to={`/user/${reply.author_id}`} className={`font-medium text-sm transition-colors ${reply.author?.is_premium ? 'bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 font-bold hover:to-amber-400' : 'text-zinc-200 hover:text-cyan-400'}`}>
                  {reply.author?.display_name || "User"}
                </Link>
                <span className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest">{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
              </div>
              <div className="-mt-1 mb-2">
                <UserBadges user={reply.author} />
              </div>
              <div 
                className="text-sm text-zinc-300 leading-relaxed prose prose-invert prose-p:my-1 prose-a:text-cyan-400"
                dangerouslySetInnerHTML={{ __html: reply.content || '' }} 
              />
              {reply.image_url && (
                <div className="mt-3 rounded-lg overflow-hidden border border-zinc-800 max-w-sm">
                  <img src={reply.image_url} alt="Reply media" className="w-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-4 mt-3">
                <button onClick={() => toggleLike(reply.id, true)} className={`flex items-center gap-1.5 transition-colors text-xs font-medium content-center ${reply.has_liked ? 'text-red-500' : 'text-zinc-500 hover:text-red-400'}`}>
                  <Heart className={`w-3.5 h-3.5 ${reply.has_liked ? 'fill-current' : ''}`} /> {reply.likes_count > 0 && reply.likes_count}
                </button>
                <button onClick={() => handleShare(reply.id, true)} className="flex items-center gap-1.5 text-zinc-500 hover:text-emerald-400 transition-colors text-xs font-medium content-center">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => handleDeletePost(reply.id, false)}
                    className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 transition-colors text-xs font-medium content-center"
                    title="Delete reply"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {replies.length === 0 && (
          <div className="text-center p-8 text-zinc-500 border border-zinc-800/50 rounded-xl border-dashed">
            No replies yet.
          </div>
        )}
      </div>

      {/* Reply Box */}
      {currentUser ? (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
              {currentUser?.user_metadata?.avatar_url ? (
                 <img src={currentUser.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-zinc-500"><User className="w-5 h-5"/></div>
              )}
            </div>
            <div className="flex-1">
              <textarea 
                placeholder="Write a reply... (Only hijab.site links allowed)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none min-h-[100px] resize-y mb-3"
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
              />
              
              {imagePreview && (
                <div className="relative w-max mb-3">
                  <img src={imagePreview} className="max-w-[200px] rounded-lg border border-zinc-700" alt="Preview"/>
                  <button onClick={() => {setImageFile(null); setImagePreview(null)}} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X className="w-4 h-4"/></button>
                </div>
              )}

              <div className="flex justify-between items-center">
                <label className="cursor-pointer text-cyan-500 hover:text-cyan-400 p-2 rounded-full hover:bg-cyan-500/10 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    if(e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                      setImagePreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
                
                <button 
                  onClick={handleReplySubmit}
                  disabled={replying || (!replyContent.trim() && !imageFile)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                >
                  {replying ? 'Replying...' : 'Post Reply'} <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-6 border border-zinc-800 rounded-xl bg-zinc-900/20 text-zinc-400">
          Please <Link to="/login" className="text-cyan-400 hover:underline">log in</Link> to join the conversation.
        </div>
      )}
    </div>
  );
}
