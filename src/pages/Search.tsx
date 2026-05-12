import React, { useState, useEffect } from "react";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { Link, useSearchParams } from "react-router";
import { Search as SearchIcon, User, Layers, MessageSquare, FileText } from "lucide-react";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'people' | 'threads' | 'posts'>('people');

  useEffect(() => {
    if (!hasSupabaseConfig || !query) return;

    const performSearch = async () => {
      setLoading(true);

      // Search Profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%,real_name.ilike.%${query}%`)
        .limit(20);
      
      if (profiles) setPeople(profiles);

      // Search Threads
      const { data: threadsData } = await supabase
        .from('threads')
        .select('*, author:author_id(*)')
        .ilike('title', `%${query}%`)
        .limit(20);
      
      if (threadsData) setThreads(threadsData);

      // Search Posts
      const { data: postsData } = await supabase
        .from('thread_posts')
        .select('*, author:author_id(*), thread:thread_id(*)')
        .ilike('content', `%${query}%`)
        .limit(20);
        
      if (postsData) setPosts(postsData);

      setLoading(false);
    };

    performSearch();
  }, [query]);

  if (!query) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-serif text-white mb-4">Search</h1>
        <p className="text-zinc-400">Please enter a search query.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-cyan-950/30 flex items-center justify-center border border-cyan-900/50">
          <SearchIcon className="w-6 h-6 text-cyan-500" />
        </div>
        <div>
          <h1 className="text-3xl font-serif text-white">Search Results</h1>
          <p className="text-zinc-400">Showing results for "{query}"</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab('people')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'people' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" /> People
            <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded textxs">{people.length}</span>
          </div>
          {activeTab === 'people' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('threads')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'threads' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" /> Threads
            <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded textxs">{threads.length}</span>
          </div>
          {activeTab === 'threads' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'posts' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Posts
            <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded textxs">{posts.length}</span>
          </div>
          {activeTab === 'posts' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-t-full" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Searching...</div>
      ) : (
        <div>
          {activeTab === 'people' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {people.length === 0 ? (
                <p className="text-zinc-500 py-8">No people found.</p>
              ) : (
                people.map(person => (
                  <Link key={person.id} to={`/user/${person.id}`} className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-cyan-500/50 transition-colors">
                    <img src={person.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"} alt="" className="w-12 h-12 rounded-full object-cover border border-zinc-700 bg-zinc-800" />
                    <div>
                      <div className="font-medium text-white">{person.display_name || person.real_name}</div>
                      <div className="text-xs text-zinc-500">@{person.username}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'threads' && (
            <div className="space-y-4">
              {threads.length === 0 ? (
                <p className="text-zinc-500 py-8">No threads found.</p>
              ) : (
                threads.map(thread => (
                  <Link key={thread.id} to={`/thread/${thread.id}`} className="block bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 hover:border-cyan-500/50 transition-colors">
                    <h3 className="font-medium text-white text-lg mb-2">{thread.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                         <img src={thread.author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"} alt="" className="w-5 h-5 rounded-full object-cover" />
                         <span>{thread.author?.display_name || 'User'}</span>
                      </div>
                      <span>•</span>
                      <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {thread.reply_count}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <p className="text-zinc-500 py-8">No posts found.</p>
              ) : (
                posts.map(post => (
                  <Link key={post.id} to={`/thread/${post.thread_id}`} className="block bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 hover:border-cyan-500/50 transition-colors">
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                      <div className="flex items-center gap-1.5">
                         <img src={post.author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"} alt="" className="w-5 h-5 rounded-full object-cover" />
                         <span className="font-medium text-zinc-300">{post.author?.display_name || 'User'}</span>
                      </div>
                      <span>•</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      {post.thread && (
                         <>
                           <span>•</span>
                           <span className="text-cyan-500 truncate max-w-[200px]">In: {post.thread.title}</span>
                         </>
                      )}
                    </div>
                    <div className="text-zinc-300 text-sm line-clamp-3" dangerouslySetInnerHTML={{ __html: post.content }} />
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
