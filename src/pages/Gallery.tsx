import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { ImageIcon, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AdBanner from "../components/ads/AdBanner";

export default function Gallery() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasSupabaseConfig) {
      fetchGallery();
    }
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:author_id(*)')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false });
      
    if (data) {
      setImages(data);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-4 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-cyan-950/30 flex items-center justify-center border border-cyan-900/50">
          <ImageIcon className="w-6 h-6 text-cyan-500" />
        </div>
        <div>
          <h1 className="text-3xl font-serif text-white">Gallery</h1>
          <p className="text-zinc-400">All pictures shared by the community.</p>
        </div>
      </div>
      
      <div className="mb-6">
        <AdBanner />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center p-12 border border-zinc-800/50 rounded-xl bg-zinc-900/20 text-zinc-500">
           <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
           <p>No images found in the gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map(post => (
            <Link to={`/thread/${post.type === 'reply' ? post.thread_id : post.id}`} key={post.id} className="relative group rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 aspect-square block">
              <img src={post.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Gallery item" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <div className="flex items-center gap-2">
                   {post.author?.avatar_url ? (
                     <img src={post.author.avatar_url} className="w-5 h-5 rounded-full object-cover" />
                   ) : (
                     <User className="w-5 h-5 p-1 rounded-full bg-zinc-800 text-zinc-500" />
                   )}
                   <span className="text-xs text-white font-medium truncate">{post.author?.display_name || post.author?.username}</span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-1">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
