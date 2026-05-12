import React, { useState, useEffect } from "react";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { Bell, X } from "lucide-react";

export default function GlobalNotice() {
  const [notice, setNotice] = useState<{ title: string, message: string, active: boolean } | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (hasSupabaseConfig) {
      fetchNotice();
      
      // Subscribe to settings changes to update notice in real-time
      const subscription = supabase
        .channel('public:settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: "id=eq.global_notice" }, payload => {
          const newData = payload.new as any;
          if (newData && newData.value) {
            setNotice(newData.value as any);
            setVisible(true);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, []);

  const fetchNotice = async () => {
    const { data } = await supabase.from('settings').select('value').eq('id', 'global_notice').maybeSingle();
    if (data && data.value) {
      setNotice(data.value as any);
    }
  };

  if (!notice || !notice.active || !visible) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-b border-amber-500/20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="bg-amber-500/20 text-amber-500 p-1.5 rounded-md mt-0.5 sm:mt-0 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            {notice.title && <strong className="text-amber-500 text-sm block sm:inline sm:mr-2">{notice.title}</strong>}
            <span className="text-amber-100/80 text-sm whitespace-pre-wrap">{notice.message}</span>
          </div>
        </div>
        <button 
          onClick={() => setVisible(false)}
          className="text-amber-500/50 hover:text-amber-500 transition-colors p-1 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
