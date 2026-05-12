import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, User as UserIcon, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadToImgBB } from '../lib/imgbb';
import { Link } from 'react-router';
import { formatDistanceToNow } from 'date-fns';

export default function Stories({ currentUser }: { currentUser: any }) {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  
  const [activeStoryGroup, setActiveStoryGroup] = useState<any | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*, author:user_id(*)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      // Group by user
      const grouped = (data || []).reduce((acc: any, story: any) => {
        if (!acc[story.user_id]) {
          acc[story.user_id] = {
            author: story.author,
            stories: []
          };
        }
        acc[story.user_id].stories.push(story);
        return acc;
      }, {});
      
      setStories(Object.values(grouped));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostStory = async () => {
    if ((!imageFile && !textContent.trim()) || !currentUser) return;
    setUploading(true);
    
    let uploadedImageUrl = null;
    if (imageFile) {
       try {
         uploadedImageUrl = await uploadToImgBB(imageFile);
       } catch (err: any) {
         alert("Upload failed: " + err.message);
         setUploading(false);
         return;
       }
    }
    
    // expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error } = await supabase.from('stories').insert({
      user_id: currentUser.id,
      image_url: uploadedImageUrl,
      text_content: textContent.trim() || null,
      expires_at: expiresAt.toISOString()
    });
    
    if (error) {
      alert("Failed to post story: " + error.message);
    } else {
      setUploadModalOpen(false);
      setImageFile(null);
      setImagePreview(null);
      setTextContent('');
      fetchStories();
    }
    
    setUploading(false);
  };

  return (
    <div className="mb-8">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {currentUser && (
          <div className="flex flex-col items-center gap-2 shrink-0 snap-start">
            <button 
              onClick={() => setUploadModalOpen(true)}
              className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 bg-zinc-900 flex items-center justify-center hover:border-cyan-500 hover:text-cyan-500 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
            <span className="text-xs text-zinc-400 font-medium tracking-wide">Add Story</span>
          </div>
        )}
        
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="flex flex-col items-center gap-2 shrink-0">
               <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse border-2 border-zinc-900" />
               <div className="w-12 h-3 bg-zinc-800 animate-pulse rounded" />
             </div>
          ))
        ) : (
          stories.map((group, idx) => (
            <button 
              key={idx}
              onClick={() => { setActiveStoryGroup(group); setActiveStoryIndex(0); }}
              className="flex flex-col items-center gap-2 shrink-0 group snap-start"
            >
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 to-cyan-500">
                <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-zinc-900 flex items-center justify-center">
                  {group.author?.avatar_url ? (
                    <img src={group.author.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-zinc-500" />
                  )}
                </div>
              </div>
              <span className="text-xs text-zinc-400 font-medium tracking-wide group-hover:text-amber-400 transition-colors truncate w-16 text-center">
                {group.author?.display_name || group.author?.username || 'User'}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-6 relative">
             <button onClick={() => setUploadModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2 rounded-full hover:bg-zinc-800">
               <X className="w-5 h-5"/>
             </button>
             
             <h2 className="text-xl font-serif text-amber-500 mb-6 drop-shadow-md">Create Story</h2>
             
             <div className="space-y-4">
               {imagePreview ? (
                 <div className="relative rounded-2xl overflow-hidden border border-zinc-800 aspect-[9/16] bg-black flex items-center justify-center">
                   <img src={imagePreview} className="max-w-full max-h-full object-contain" alt="Preview"/>
                   <button onClick={() => {setImageFile(null); setImagePreview(null)}} className="absolute top-2 right-2 bg-red-500/80 text-white p-2 rounded-full backdrop-blur-sm hover:bg-red-500">
                     <X className="w-4 h-4"/>
                   </button>
                 </div>
               ) : (
                 <button onClick={() => fileInputRef.current?.click()} className="w-full aspect-[9/16] rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 flex flex-col items-center justify-center gap-4 text-zinc-500 hover:text-cyan-500 hover:border-cyan-900/50 transition-colors">
                   <ImageIcon className="w-8 h-8" />
                   <span className="text-sm font-medium">Add Photo</span>
                   <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={e => {
                     if (e.target.files && e.target.files[0]) {
                       setImageFile(e.target.files[0]);
                       setImagePreview(URL.createObjectURL(e.target.files[0]));
                     }
                   }} />
                 </button>
               )}
               
               <textarea 
                 value={textContent}
                 onChange={e => setTextContent(e.target.value)}
                 className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none resize-none"
                 placeholder="Add text to your story (optional)..."
                 rows={3}
               />
               
               <button 
                 onClick={handlePostStory}
                 disabled={uploading || (!imageFile && !textContent.trim())}
                 className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] flex justify-center disabled:opacity-50 transition-all font-mono tracking-widest uppercase text-sm"
               >
                 {uploading ? (
                   <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> POSTING...</span>
                 ) : (
                   "POST STORY"
                 )}
               </button>
             </div>
          </div>
        </div>
      )}
      
      {/* Viewer Modal */}
      {activeStoryGroup && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          {/* Progress Bars */}
          <div className="absolute top-4 inset-x-4 flex gap-1 z-10">
            {activeStoryGroup.stories.map((s: any, idx: number) => (
              <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                 <div className={`h-full bg-white transition-all ${idx < activeStoryIndex ? 'w-full' : idx === activeStoryIndex ? 'w-full animate-[story-progress_5s_linear]' : 'w-0'}`} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 inset-x-4 flex items-center justify-between z-10 drop-shadow-md">
            <Link to={`/user/${activeStoryGroup.author?.username || activeStoryGroup.author?.id}`} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border-2 border-white/20">
                {activeStoryGroup.author?.avatar_url ? (
                  <img src={activeStoryGroup.author.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-6 h-6 text-zinc-500" />
                )}
              </div>
              <div>
                <span className="font-medium text-white shadow-black drop-shadow-md">{activeStoryGroup.author?.display_name || activeStoryGroup.author?.username || 'User'}</span>
                <span className="text-xs text-white/70 block">{formatDistanceToNow(new Date(activeStoryGroup.stories[activeStoryIndex].created_at))} ago</span>
              </div>
            </Link>
            
            <button onClick={() => { setActiveStoryGroup(null); setActiveStoryIndex(0); }} className="text-white p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Story Content */}
          <div className="flex-1 relative flex items-center justify-center">
             {activeStoryGroup.stories[activeStoryIndex].image_url && (
                <img src={activeStoryGroup.stories[activeStoryIndex].image_url} className="absolute inset-0 w-full h-full object-cover" />
             )}
             
             {/* Gradient overlay for text readability */}
             {activeStoryGroup.stories[activeStoryIndex].text_content && (
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8 text-center">
                 <p className="text-white text-2xl font-serif md:text-4xl leading-relaxed drop-shadow-xl font-bold">
                   {activeStoryGroup.stories[activeStoryIndex].text_content}
                 </p>
               </div>
             )}
          </div>
          
          {/* Navigation Overlay Areas */}
          <div 
             className="absolute inset-y-0 left-0 w-1/3 z-10" 
             onClick={() => {
               if (activeStoryIndex > 0) setActiveStoryIndex(prev => prev - 1);
               else setActiveStoryGroup(null);
             }}
          />
          <div 
             className="absolute inset-y-0 right-0 w-2/3 z-10" 
             onClick={() => {
               if (activeStoryIndex < activeStoryGroup.stories.length - 1) setActiveStoryIndex(prev => prev + 1);
               else setActiveStoryGroup(null); // Or go to next person's story
             }}
          />
        </div>
      )}
    </div>
  );
}
