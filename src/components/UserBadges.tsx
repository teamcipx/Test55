import React from 'react';
import { ShieldCheck, Crown, CheckCircle2, Star, Clock, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function UserBadges({ user }: { user: any }) {
  if (!user) return null;

  const isNew = new Date(user.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
  const isOld = new Date(user.created_at).getTime() < Date.now() - 365 * 24 * 60 * 60 * 1000;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1 relative z-10">
      {user.is_admin && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider title='Admin'">
          <ShieldCheck className="w-3 h-3" /> Admin
        </div>
      )}

      {user.is_moderator && !user.is_admin && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 text-[10px] font-bold uppercase tracking-wider title='Moderator'">
          <ShieldAlert className="w-3 h-3" /> Mod
        </div>
      )}
      
      {user.is_premium && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(245,158,11,0.3)] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-black text-[10px] font-extrabold uppercase tracking-widest title='VIP Member'">
          <Crown className="w-3 h-3 fill-black" /> VIP
        </div>
      )}

      {user.is_approved && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500 text-[10px] font-bold uppercase tracking-wider title='Verified'">
          <CheckCircle2 className="w-3 h-3" /> Verified
        </div>
      )}

      {isNew && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider title='New User'">
          <Star className="w-3 h-3" /> New
        </div>
      )}

      {isOld && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider title='Veteran Member'">
          <Clock className="w-3 h-3" /> Old
        </div>
      )}
    </div>
  );
}
