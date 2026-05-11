import React, { useState, useEffect } from "react";
import { supabase, hasSupabaseConfig } from "../../lib/supabase";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!hasSupabaseConfig) return;
    setLoading(true);
    const { data, error } = await supabase!.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const updateApproval = async (id: string, isApproved: boolean) => {
    if (!hasSupabaseConfig) return;
    const { error } = await supabase!.from('profiles').update({ is_approved: isApproved }).eq('id', id);
    if (!error) {
      setUsers(users.map(u => u.id === id ? { ...u, is_approved: isApproved } : u));
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-serif text-white">Member Approvals</h1>
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!user.is_approved ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => updateApproval(user.id, true)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => updateApproval(user.id, false)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                          Revoke
                        </button>
                      )}
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
  );
}
