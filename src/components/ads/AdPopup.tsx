import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';

export default function AdPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkUserAndShowAd = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single();
        if (profile?.is_premium) {
          return; // Don't show ad for premium users
        }
      }

      // Show after 5 seconds of being on the feed
      const timer = setTimeout(() => {
        // Only show if haven't shown recently (in session)
        if (!sessionStorage.getItem('feed_ad_shown')) {
          setIsOpen(true);
          sessionStorage.setItem('feed_ad_shown', 'true');
        }
      }, 5000);

      return () => clearTimeout(timer);
    };

    checkUserAndShowAd();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-300">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black text-white rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="relative aspect-video bg-zinc-800">
          <img 
            src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600" 
            alt="Ad Content" 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Sponsored
          </div>
        </div>
        
        <div className="p-5">
          <h3 className="text-xl font-bold text-white mb-2">Upgrade to VIP Mazhabi</h3>
          <p className="text-zinc-400 text-sm mb-4">
            Unlock exclusive Mazhabi content, remove all ads, and get a verified badge on your profile today.
          </p>
          
          <Link 
            to="/premium"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg transition-colors"
          >
            Claim VIP Offer <ExternalLink className="w-4 h-4" />
          </Link>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full text-center text-zinc-500 text-xs mt-3 hover:text-zinc-300"
          >
            No thanks, maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
