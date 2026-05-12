import React, { useState, useEffect, useRef } from "react";
import { HelpCircle, X, Send, Paperclip, MessageSquare, ExternalLink, Image as ImageIcon } from "lucide-react";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { uploadToImgBB } from "../lib/imgbb";

type Message = {
  id: string;
  user_id: string;
  is_admin: boolean;
  content: string;
  image_url?: string;
  created_at: string;
};

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'select' | 'chat'>('select');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasSupabaseConfig) {
      supabase!.auth.getUser().then(({ data }) => {
        setUser(data.user);
        if (data.user) {
          supabase!.from('profiles').select('*').eq('id', data.user.id).single().then(res => {
            if (res.data) setUserProfile(res.data);
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    if (mode === 'chat' && user) {
      fetchMessages();
      const subscription = supabase!
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` }, payload => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();
      
      return () => {
        supabase!.removeChannel(subscription);
      };
    }
  }, [mode, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase!
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
      if (error) console.error("Could not fetch messages:", error.message);
    } catch(err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!inputValue.trim() && !imageFile) || uploading) return;

    setUploading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadToImgBB(imageFile);
      }

      const { error } = await supabase!.from('messages').insert({
        user_id: user.id,
        is_admin: false,
        content: inputValue.trim(),
        image_url: imageUrl,
      });

      if (!error) {
        setInputValue("");
        setImageFile(null);
      } else {
        console.error("Supabase insert error:", error);
        alert("Action blocked: please ensure you have set up the support database tables and have correct permissions.");
      }
    } catch (err: any) {
      console.error("Failed to send message", err);
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => 
      urlRegex.test(part) ? 
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{part}</a> 
        : part
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-cyan-600 border border-cyan-500 hover:bg-cyan-500 text-white p-3.5 rounded-full shadow-lg shadow-cyan-900/20 group flex items-center justify-center transition-all duration-300 hover:scale-105"
          title="Need Help?"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl shadow-cyan-900/20 w-80 md:w-96 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
            <h3 className="text-white font-medium flex items-center gap-2 text-sm uppercase tracking-widest">
              <MessageSquare className="w-4 h-4 text-cyan-500" />
              Support
            </h3>
            <button 
              onClick={() => { setIsOpen(false); setMode('select'); }}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="h-96 flex flex-col bg-[#050505]">
            {mode === 'select' ? (
              <div className="flex-1 flex flex-col justify-center p-6 gap-4">
                <p className="text-zinc-400 text-sm text-center mb-4">How would you like to contact us?</p>
                <a 
                  href="https://t.me/yourtelegramid" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-cyan-500 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0088cc]/20 text-[#0088cc] flex items-center justify-center">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white text-sm font-medium">Telegram</div>
                    <div className="text-zinc-500 text-xs">Fastest response</div>
                  </div>
                </a>
                <button 
                  onClick={() => user ? setMode('chat') : alert('Please log in for live support.')}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors group ${userProfile?.is_premium ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500' : 'bg-zinc-900 border-zinc-800 hover:border-cyan-500'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userProfile?.is_premium ? 'bg-amber-500/20 text-amber-500' : 'bg-cyan-900/30 text-cyan-500'}`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white text-sm font-medium flex items-center gap-2">Live Chat {userProfile?.is_premium && <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">Priority</span>}</div>
                    <div className="text-zinc-500 text-xs">{userProfile?.is_premium ? 'Priority queue for premium members' : 'Chat with admin here'}</div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-zinc-500 text-xs mt-10">
                      Send a message to start the conversation.
                    </div>
                  )}
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.is_admin ? 'items-start self-start' : 'items-end self-end ml-auto'}`}>
                      <div className={`p-3 rounded-xl text-sm ${msg.is_admin ? 'bg-zinc-900 text-slate-200 border border-zinc-800 rounded-tl-sm' : 'bg-cyan-900/50 text-white border border-cyan-800 rounded-tr-sm'}`}>
                        {msg.image_url && (
                          <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                            <img src={msg.image_url} alt="Attachment" className="max-w-full rounded mb-2 w-48 object-cover" />
                          </a>
                        )}
                        {msg.content && <div>{renderTextWithLinks(msg.content)}</div>}
                      </div>
                      <span className="text-[10px] text-zinc-600 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 bg-zinc-900 border-t border-zinc-800">
                  {imageFile && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-zinc-950 rounded text-xs text-zinc-400 border border-zinc-700">
                      <ImageIcon className="w-4 h-4 text-cyan-500" />
                      <span className="flex-1 truncate">{imageFile.name}</span>
                      <button onClick={() => setImageFile(null)} className="hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <label className="cursor-pointer p-2 text-zinc-400 hover:text-cyan-400 transition-colors">
                      <Paperclip className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setImageFile(e.target.files[0])} />
                    </label>
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      disabled={uploading || (!inputValue.trim() && !imageFile)}
                      className="p-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
