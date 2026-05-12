import React, { useState, useEffect } from "react";
import { supabase, hasSupabaseConfig } from "../../lib/supabase";
import { Play, Plus, Trash2, Save } from "lucide-react";

export default function AdminVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hasSupabaseConfig) fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    const { data } = await supabase.from('settings').select('value').eq('id', 'premium_videos').single();
    if (data && Array.isArray(data.value)) {
      setVideos(data.value);
    } else {
      // Default videos
      setVideos([
        { id: 1, title: "Exclusive Interview: The Founders", duration: "45:12", img: "https://images.unsplash.com/photo-1516280440502-c6722d56abf0?auto=format&fit=crop&w=500" }
      ]);
    }
    setLoading(false);
  };

  const saveVideos = async () => {
    setSaving(true);
    const { error } = await supabase.from('settings').upsert({ id: 'premium_videos', value: videos });
    if (error) alert("Error saving: " + error.message);
    else alert("Saved successfully!");
    setSaving(false);
  };

  const addVideo = () => {
    setVideos([...videos, { id: Date.now(), title: "New Video", duration: "00:00", img: "" }]);
  };

  const updateVideo = (id: number, field: string, value: string) => {
    setVideos(videos.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const deleteVideo = (id: number) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-white">Manage Premium Videos</h2>
        <div className="flex gap-3">
          <button onClick={addVideo} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded transition-colors text-sm font-bold">
            <Plus className="w-4 h-4" /> Add Video
          </button>
          <button onClick={saveVideos} disabled={saving} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded transition-colors text-sm font-bold disabled:opacity-50">
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {videos.map((video, idx) => (
          <div key={video.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex gap-5">
            <div className="w-32 h-24 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
              {video.img ? (
                <img src={video.img} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                   <Play className="w-6 h-6 mb-1" />
                   <span className="text-[10px]">No Image</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-[10px] uppercase text-zinc-500">Title</label>
                <input 
                  type="text" 
                  value={video.title} 
                  onChange={(e) => updateVideo(video.id, 'title', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm outline-none focus:border-cyan-500" 
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] uppercase text-zinc-500">Image URL</label>
                  <input 
                    type="text" 
                    value={video.img} 
                    onChange={(e) => updateVideo(video.id, 'img', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm outline-none focus:border-cyan-500" 
                  />
                </div>
                <div className="w-32">
                  <label className="text-[10px] uppercase text-zinc-500">Duration</label>
                  <input 
                    type="text" 
                    value={video.duration} 
                    onChange={(e) => updateVideo(video.id, 'duration', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm outline-none focus:border-cyan-500" 
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={() => deleteVideo(video.id)}
              className="shrink-0 text-zinc-500 hover:text-red-500 mt-2 transition-colors self-start p-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
