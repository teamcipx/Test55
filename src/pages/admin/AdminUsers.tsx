import React, { useState, useEffect } from "react";
import { supabase, hasSupabaseConfig } from "../../lib/supabase";
import { CheckCircle2, XCircle, Clock, Crown } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [premiumRequests, setPremiumRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!hasSupabaseConfig) return;
    setLoading(true);
    const { data, error } = await supabase!.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);

    // Fetch premium requests
    const { data: reqData } = await supabase!.from('premium_requests').select('*, user:user_id(*)').order('created_at', { ascending: false });
    if (reqData) setPremiumRequests(reqData);

    setLoading(false);
  };

  const updateApproval = async (id: string, isApproved: boolean) => {
    if (!hasSupabaseConfig) return;
    const { error } = await supabase!.from('profiles').update({ is_approved: isApproved }).eq('id', id);
    if (!error) {
      setUsers(users.map(u => u.id === id ? { ...u, is_approved: isApproved } : u));
    }
  };

  const updateModerator = async (id: string, isModerator: boolean) => {
    if (!hasSupabaseConfig) return;
    const { error } = await supabase!.from('profiles').update({ is_moderator: isModerator }).eq('id', id);
    if (!error) {
      setUsers(users.map(u => u.id === id ? { ...u, is_moderator: isModerator } : u));
    }
  };

  const updatePremiumRequest = async (requestId: string, userId: string, action: 'approved' | 'rejected') => {
    if (!hasSupabaseConfig) return;

    // Update request
    if (requestId !== 'manual') {
      await supabase.from('premium_requests').update({ status: action }).eq('id', requestId);
    }

    if (action === 'approved') {
       // update user profile, set expiry to 30 days from now
       const expiryDate = new Date();
       expiryDate.setDate(expiryDate.getDate() + 30);
       
       const { error } = await supabase.from('profiles').update({ 
         is_premium: true,
         premium_expires_at: expiryDate.toISOString() 
       }).eq('id', userId);

       if (error) {
         if (error.code === '42703') {
           // Fallback if premium_expires_at column doesn't exist yet
           await supabase.from('profiles').update({ 
             is_premium: true
           }).eq('id', userId);
           alert("Notice: 'premium_expires_at' column is missing in your Supabase database. User was upgraded, but expiry date won't be saved. Please run the updated SQL setup.");
         } else {
           alert("Error updating user profile: " + error.message);
         }
       }
       
       setUsers(users.map(u => u.id === userId ? { ...u, is_premium: true, premium_expires_at: expiryDate.toISOString() } : u));
    } else {
       const { error } = await supabase.from('profiles').update({ 
         is_premium: false,
         premium_expires_at: null
       }).eq('id', userId);

       if (error && error.code === '42703') {
         await supabase.from('profiles').update({ is_premium: false }).eq('id', userId);
       }
       
       setUsers(users.map(u => u.id === userId ? { ...u, is_premium: false, premium_expires_at: null } : u));
    }

    setPremiumRequests(premiumRequests.map(r => r.id === requestId ? { ...r, status: action } : r));
  };

  return (
    <div className="space-y-12">
      {/* Premium Approvals */}
      <div>
        <div className="mb-6 border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-serif text-white flex items-center gap-2"><Crown className="w-6 h-6 text-amber-500" /> Premium Upgrades</h1>
          <p className="text-zinc-500 text-sm mt-1">Review Binance Pay transactions for premium memberships.</p>
        </div>

        {loading ? (
          <div className="text-zinc-500 text-sm">Loading requests...</div>
        ) : (
          <div className="bg-zinc-900/50 border border-amber-500/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-[10px] uppercase tracking-widest bg-amber-500/5 border-b border-amber-500/20 text-zinc-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Transaction ID</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {premiumRequests.map(req => (
                    <tr key={req.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={req.user?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"} alt="" className="w-8 h-8 rounded object-cover border border-zinc-800" />
                          <div>
                            <div className="font-medium text-white">{req.user?.display_name}</div>
                            <div className="text-[10px] uppercase text-zinc-500 mt-0.5">@{req.user?.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{req.transaction_id}</td>
                      <td className="px-6 py-4 text-xs">{new Date(req.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        {req.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                            Approved
                          </span>
                        ) : req.status === 'rejected' ? (
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => updatePremiumRequest(req.id, req.user_id, 'approved')}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => updatePremiumRequest(req.id, req.user_id, 'rejected')}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600 block text-right w-full">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {premiumRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                        No premium requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Standard Approvals */}
      <div>
        <div className="mb-6 border-b border-zinc-800 pb-4">
          <h2 className="text-2xl font-serif text-white">Member Approvals</h2>
          <p className="text-zinc-500 text-sm mt-1">Review and manage pending registrations to maintain community quality.</p>
        </div>

        {loading ? (
          <div className="text-zinc-500 text-sm">Loading members...</div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-[10px] uppercase tracking-widest bg-zinc-900 border-b border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Applicant</th>
                    <th className="px-6 py-4 font-medium">Details</th>
                    <th className="px-6 py-4 font-medium">Links</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"} alt="" className="w-10 h-10 rounded object-cover border border-zinc-800" />
                          <div>
                            <div className="font-medium text-white">{user.real_name}</div>
                            <div className="text-[10px] uppercase text-zinc-500 mt-0.5">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div><span className="text-zinc-600">Age:</span> {user.age}</div>
                          <div><span className="text-zinc-600">Country:</span> {user.country}</div>
                          <div><span className="text-zinc-600">Interest:</span> {user.interest}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <a href={user.telegram_or_fb} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 truncate max-w-[150px] inline-block">Social Link</a>
                          <div className="truncate max-w-[150px]">{user.phone || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_approved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-500/10 text-zinc-400 text-xs font-medium border border-zinc-500/20">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {user.is_premium ? (
                            <button 
                              onClick={() => updatePremiumRequest('manual', user.id, 'rejected')}
                              className="px-3 py-1.5 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                              Revoke VIP
                            </button>
                          ) : (
                            <button 
                              onClick={() => updatePremiumRequest('manual', user.id, 'approved')}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                              Make VIP
                            </button>
                          )}
                          {!user.is_admin && (
                            <button 
                              onClick={() => updateModerator(user.id, !user.is_moderator)}
                              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${user.is_moderator ? 'bg-fuchsia-500/20 text-fuchsia-400 hover:bg-fuchsia-500/30' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
                            >
                              {user.is_moderator ? 'Revoke Mod' : 'Make Mod'}
                            </button>
                          )}
                          {!user.is_approved ? (
                            <button 
                              onClick={() => updateApproval(user.id, true)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Approve
                            </button>
                          ) : (
                            <button 
                              onClick={() => updateApproval(user.id, false)}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                        No members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
