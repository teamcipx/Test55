import React, { useState, useEffect } from "react";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { Link } from "react-router";
import { Bell, MessageSquare, Heart, CornerDownRight, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (hasSupabaseConfig) {
      supabase.auth.getUser().then(({ data }) => {
        setCurrentUser(data.user);
        if (data.user) fetchNotifications(data.user.id);
      });
    }
  }, []);

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (data) {
      setNotifications(data);
      // Mark as read globally when viewed
      supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false).then();
    }
    setLoading(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <div className="p-2 bg-blue-500/10 text-blue-400 rounded-full"><MessageSquare className="w-4 h-4" /></div>;
      case 'like':
        return <div className="p-2 bg-red-500/10 text-red-500 rounded-full"><Heart className="w-4 h-4" /></div>;
      case 'reply':
        return <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-full"><CornerDownRight className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 bg-zinc-800 text-zinc-400 rounded-full"><Bell className="w-4 h-4" /></div>;
    }
  };

  const getNotificationLink = (notification: any) => {
    if (notification.type === 'message') return `/inbox?u=${notification.actor_id}`;
    if (notification.reference_id && (notification.type === 'reply' || notification.type === 'like')) return `/thread/${notification.reference_id}`;
    return '#';
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-3xl mx-auto w-full py-8 md:py-12 px-4 min-h-[calc(100vh-100px)]">
      <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 bg-cyan-900/30 text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-800/50">
          <Bell className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-serif text-white">Notifications</h1>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
            <Check className="w-12 h-12 mb-3 opacity-20" />
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {notifications.map(notif => (
              <Link 
                key={notif.id}
                to={getNotificationLink(notif)}
                className={`block p-4 sm:p-5 hover:bg-zinc-800/50 transition-colors ${!notif.is_read ? 'bg-cyan-950/10' : ''}`}
              >
                <div className="flex gap-4 items-start">
                  {notif.actor?.avatar_url ? (
                    <img src={notif.actor.avatar_url} alt="actor" className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700" />
                  ) : (
                    getNotificationIcon(notif.type)
                  )}
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-zinc-300">
                      <span className="font-semibold text-white mr-1">{notif.actor?.display_name || "Someone"}</span>
                      {notif.content}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
