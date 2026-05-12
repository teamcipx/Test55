import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, Star, Video, MessageSquare, Zap, BadgeCheck, Check, CreditCard, Clock, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { supabase, hasSupabaseConfig } from "../lib/supabase";

export default function Premium() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (hasSupabaseConfig) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setCurrentUser(data.user);
          fetchProfileAndStatus(data.user.id);
        } else {
          navigate("/login");
        }
      });
    }
  }, [navigate]);

  const fetchProfileAndStatus = async (userId: string) => {
    setLoading(true);
    // Fetch profile
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profileData) setProfile(profileData);

    // Fetch pending or recent requests
    const { data: requests } = await supabase
      .from('premium_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (requests && requests.length > 0) {
      if (requests[0].status === 'pending') {
        setRequestStatus('pending');
      } else if (requests[0].status === 'approved' || profileData?.is_premium) {
        setRequestStatus('active');
      }
    } else if (profileData?.is_premium) {
      setRequestStatus('active');
    }

    setLoading(false);
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !transactionId.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('premium_requests').insert({
        user_id: currentUser.id,
        binance_pay_id: '1024032723',
        transaction_id: transactionId.trim(),
        amount: 0.50,
        status: 'pending'
      });

      if (error) throw error;
      setSuccess(true);
      setRequestStatus('pending');
    } catch (err: any) {
      console.error(err);
      alert('Error submitting request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto w-full py-12 px-4 min-h-screen">
      <div className="text-center mb-12">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 mb-6 shadow-[0_0_40px_rgba(245,158,11,0.3)]"
        >
          <Star className="w-8 h-8 text-white fill-white" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-serif text-white mb-4"
        >
          Upgrade to <span className="bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">Premium</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-zinc-400 max-w-2xl mx-auto text-lg"
        >
          Get exclusive features, stand out in the community, and unlock the full potential of your account for just $0.50/month.
        </motion.p>
      </div>

      {requestStatus === 'active' ? (
        <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-2xl p-8 text-center max-w-2xl mx-auto mb-12">
           <BadgeCheck className="w-16 h-16 text-amber-500 mx-auto mb-4" />
           <h2 className="text-3xl font-serif text-white mb-2 flex flex-col items-center gap-2">
             <span>You are VIP</span>
             <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-amber-500 text-sm font-bold uppercase tracking-widest">
                <Star className="w-4 h-4 fill-amber-500" /> VIP
             </div>
           </h2>
           <p className="text-zinc-400 mt-4 text-lg">Enjoy all your exclusive benefits.</p>
           {profile?.premium_expires_at && (
             <div className="inline-flex items-center gap-2 mt-6 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300">
               <Clock className="w-4 h-4 text-amber-500" />
               Expires: <span className="text-white font-medium">{new Date(profile.premium_expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
             </div>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-4xl mx-auto">
          {/* Features List */}
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Premium Benefits
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Premium Profile & Verified Badge</h4>
                  <p className="text-sm text-zinc-400">Stand out with a special profile card and a verified badge next to your name.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Chat & Video Call (Beta)</h4>
                  <p className="text-sm text-zinc-400">Unlimited direct messaging and access to our exclusive video call feature.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Exclusive Video Gallery</h4>
                  <p className="text-sm text-zinc-400">Access premium-only content and galleries.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Z++ Security & Live Support</h4>
                  <p className="text-sm text-zinc-400">Enhanced account protection and priority live support access.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-medium">No Ads Experience</h4>
                  <p className="text-sm text-zinc-400">Browse the community without any annoying advertisements.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            {requestStatus === 'pending' || success ? (
              <div className="text-center py-12 relative z-10">
                <Clock className="w-16 h-16 text-amber-500 mx-auto mb-6" />
                <h3 className="text-2xl font-serif text-white mb-2">Reviewing Payment</h3>
                <p className="text-zinc-400 mb-6">
                  We are manually verifying your transaction. This usually takes a few hours. 
                  You will be upgraded automatically once approved.
                </p>
                <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Status: Pending
                </div>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Monthly Plan</p>
                    <h3 className="text-4xl font-bold text-white">$0.50<span className="text-lg text-zinc-500 font-normal">/mo</span></h3>
                  </div>
                  <div className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/20">
                    BEST VALUE
                  </div>
                </div>

                <div className="bg-zinc-950 rounded-xl p-4 mb-6 border border-zinc-800">
                  <p className="text-sm text-zinc-400 mb-3">How to pay:</p>
                  <ol className="text-sm text-zinc-300 space-y-2 list-decimal list-inside">
                    <li>Open your Binance app</li>
                    <li>Go to Binance Pay</li>
                    <li>Send exactly <strong>$0.50 USDT</strong> to Pay ID:</li>
                  </ol>
                  <div className="bg-zinc-800 text-amber-400 font-mono text-center py-3 rounded-lg mt-3 text-lg font-bold tracking-widest cursor-pointer hover:bg-zinc-700 transition-colors" onClick={() => {
                    navigator.clipboard.writeText("1024032723");
                    alert("Pay ID copied to clipboard!");
                  }}>
                    1024032723
                  </div>
                  <p className="text-xs text-center text-zinc-500 mt-2">Click to copy Pay ID</p>
                </div>

                <form onSubmit={handleUpgrade} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Transaction ID (Required)</label>
                    <input 
                      type="text" 
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Paste Binance Transaction ID here"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting || !transactionId.trim()}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                       <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" /> Submit for Review
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-2 justify-center text-xs text-zinc-500 mt-4">
                    <Shield className="w-3.5 h-3.5" /> Manual verification required
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
