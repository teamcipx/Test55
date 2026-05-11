import React, { useState } from "react";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { Mail, Send, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabaseConfig) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error: submitError } = await supabase.from('contact_messages').insert([formData]);
      if (submitError) throw submitError;
      
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while sending your message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-12 px-4 min-h-[calc(100vh-140px)]">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-cyan-900/30 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-800/50">
          <Mail className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-serif text-white mb-2">Contact Us</h1>
        <p className="text-zinc-400">Have a question or feedback? Send us a message.</p>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden">
        {success ? (
          <div className="absolute inset-0 z-10 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Message Sent</h3>
            <p className="text-zinc-400">Thank you for reaching out. We will get back to you as soon as possible.</p>
            <button 
              onClick={() => setSuccess(false)}
              className="mt-6 text-sm text-cyan-500 hover:text-cyan-400"
            >
              Send another message
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Your Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-shadow"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Email Address <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-shadow"
                placeholder="john@example.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Subject <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-shadow"
              placeholder="How can we help you?"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Message <span className="text-red-500">*</span></label>
            <textarea 
              required
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-shadow min-h-[150px] resize-y"
              placeholder="Write your message here..."
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Message'} <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
