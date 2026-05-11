import React, { useState, useEffect } from "react";
import { supabase, hasSupabaseConfig } from "../../lib/supabase";
import { Save, Plus, Trash2, Key, Bell } from "lucide-react";

export default function AdminSettings() {
  const [keys, setKeys] = useState<string[]>([]);
  const [notice, setNotice] = useState({ title: '', message: '', active: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!hasSupabaseConfig) return;
    setLoading(true);
    
    // Fetch keys
    const { data: keysData } = await supabase!.from('settings').select('value').eq('id', 'imgbb_keys').maybeSingle();
    if (keysData && Array.isArray(keysData.value)) {
      setKeys(keysData.value);
    } else {
      setKeys([""]);
    }

    // Fetch notice
    const { data: noticeData } = await supabase!.from('settings').select('value').eq('id', 'global_notice').maybeSingle();
    if (noticeData && noticeData.value) {
      setNotice(noticeData.value as any);
    }

    setLoading(false);
  };

  const saveSettings = async () => {
    if (!hasSupabaseConfig) return;
    setSaving(true);
    
    const validKeys = keys.filter(k => k.trim() !== "");
    await supabase!.from('settings').upsert([
      { id: 'imgbb_keys', value: validKeys },
      { id: 'global_notice', value: notice }
    ]);
    
    setSaving(false);
    alert("Settings saved successfully.");
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-serif text-white">System Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage global configuration and API keys.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-cyan-900/30 text-cyan-400 rounded-lg flex items-center justify-center border border-cyan-800/50">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">ImgBB API Keys</h2>
            <p className="text-xs text-zinc-500">Provide multiple keys. If one fails (e.g. limit reached), the system will fallback to the next.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-zinc-500 text-sm">Loading...</div>
        ) : (
          <div className="space-y-4">
            {keys.map((key, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input 
                  type="text" 
                  value={key} 
                  onChange={(e) => {
                    const newKeys = [...keys];
                    newKeys[index] = e.target.value;
                    setKeys(newKeys);
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                  placeholder="Enter ImgBB API Key"
                />
                <button 
                  onClick={() => setKeys(keys.filter((_, i) => i !== index))}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-4 pt-4">
              <button 
                onClick={() => setKeys([...keys, ""])}
                className="flex items-center gap-2 text-xs font-medium text-cyan-500 hover:text-cyan-400"
              >
                <Plus className="w-4 h-4" /> Add Another Key
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-900/30 text-amber-500 rounded-lg flex items-center justify-center border border-amber-800/50">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Global Notice</h2>
            <p className="text-xs text-zinc-500">Display a persistent notification banner on the main site.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-zinc-500 text-sm">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-white">Active</label>
              <input 
                type="checkbox" 
                checked={notice.active}
                onChange={e => setNotice({...notice, active: e.target.checked})}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-zinc-900" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Title</label>
              <input 
                type="text" 
                value={notice.title}
                onChange={e => setNotice({...notice, title: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                placeholder="e.g. System Maintenance"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Message</label>
              <textarea 
                value={notice.message}
                onChange={e => setNotice({...notice, message: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none min-h-[100px] resize-y"
                placeholder="Enter the notice message..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-8 border-t border-zinc-800 pt-6">
        <button 
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-md text-sm font-bold uppercase tracking-widest disabled:opacity-50 transition-colors shadow-lg shadow-cyan-900/20"
        >
          {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Configuration</>}
        </button>
      </div>
    </div>
  );
}
