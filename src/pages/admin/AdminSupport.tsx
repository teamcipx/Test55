import React, { useState, useEffect, useRef } from "react";
import { supabase, hasSupabaseConfig } from "../../lib/supabase";
import { MessageSquare, User, Send, Paperclip, ExternalLink, Image as ImageIcon } from "lucide-react";
import { uploadToImgBB } from "../../lib/imgbb";

type TicketUser = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  last_message: string;
  updated_at: string;
};

export default function AdminSupport() {
  const [users, setUsers] = useState<TicketUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // In a real app we'd query distinct users who have sent messages.
  // For simplicity, we fetch all profiles and check if there are messages, or better:
  // query messages and group by user_id.

  useEffect(() => {
    fetchConversations();
    
    if (hasSupabaseConfig) {
      const sub = supabase!
        .channel('admin:messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
          fetchConversations(); // refresh list
          if (selectedUserId && (payload.new as any).user_id === selectedUserId) {
            setMessages(prev => [...prev, payload.new]);
          }
        })
        .subscribe();
      return () => { supabase!.removeChannel(sub); };
    }
  }, [selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    if (!hasSupabaseConfig) return;
    
    // Simplistic approach: Fetch all unique users from messages
    // In production, use a RPC or a specific view.
    const { data: msgs } = await supabase!.from('messages').select('user_id, created_at, content');
    if (!msgs) return;

    const userIds = [...new Set(msgs.map(m => m.user_id))];
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase!.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
      
      if (profiles) {
        const conversations = profiles.map(p => {
          const userMsgs = msgs.filter(m => m.user_id === p.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          return {
            id: p.id,
            user_id: p.id,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            last_message: userMsgs[0]?.content || "Image attached",
            updated_at: userMsgs[0]?.created_at || new Date().toISOString()
          };
        }).sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setUsers(conversations);
      }
    }
  };

  const fetchMessagesForUser = async (userId: string) => {
    const { data } = await supabase!
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    fetchMessagesForUser(userId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || (!inputValue.trim() && !imageFile) || uploading) return;

    setUploading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadToImgBB(imageFile);
      }

      const { error } = await supabase!.from('messages').insert({
        user_id: selectedUserId,
        is_admin: true,
        content: inputValue.trim(),
        image_url: imageUrl,
      });

      if (!error) {
        setInputValue("");
        setImageFile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => 
      urlRegex.test(part) ? 
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline break-all">{part}</a> 
        : <span key={i} className="break-words">{part}</span>
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Sidebar: Conversations List */}
      <div className={`w-full md:w-1/3 border-r border-zinc-800 flex-col ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-white font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-500" />
            Support Conversations
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">No support tickets found.</div>
          ) : (
            users.map(u => (
              <button 
                key={u.id} 
                onClick={() => handleSelectUser(u.id)}
                className={`w-full text-left p-4 border-b border-zinc-800/50 hover:bg-zinc-900 transition-colors flex items-center gap-3 ${selectedUserId === u.id ? 'bg-zinc-900 border-l-2 border-l-cyan-500' : ''}`}
              >
                <img src={u.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80"} alt={u.display_name || "User"} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{u.display_name || "User"}</div>
                  <div className="text-xs text-zinc-500 truncate">{u.last_message || "Message..."}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`w-full md:w-2/3 flex-col bg-[#050505] ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        {selectedUserId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3 shrink-0">
              <button 
                onClick={() => setSelectedUserId(null)}
                className="md:hidden flex items-center justify-center p-2 -ml-2 text-zinc-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-8 h-8 rounded-full bg-cyan-900/30 text-cyan-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="text-sm font-medium text-white">Chatting with member</div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.is_admin ? 'items-end self-end ml-auto' : 'items-start self-start'}`}>
                  <div className={`p-3 rounded-xl text-sm ${msg.is_admin ? 'bg-cyan-900/50 text-white border border-cyan-800 rounded-tr-sm' : 'bg-zinc-900 text-slate-200 border border-zinc-800 rounded-tl-sm'}`}>
                    {msg.image_url && (
                      <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                        <img src={msg.image_url} alt="Attachment" className="max-w-[300px] max-h-[300px] rounded mb-2 object-contain" />
                      </a>
                    )}
                    {msg.content && <div>{renderTextWithLinks(msg.content)}</div>}
                  </div>
                  <span className="text-[10px] text-zinc-600 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
              {imageFile && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-zinc-950 rounded text-xs text-zinc-400 border border-zinc-700 w-max max-w-full">
                  <ImageIcon className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className="truncate">{imageFile.name}</span>
                  <button onClick={() => setImageFile(null)} className="hover:text-white shrink-0"><User className="hidden" /> {/* Dummy Use, using raw SVG below*/} <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <label className="cursor-pointer p-2 text-zinc-400 hover:text-cyan-400 transition-colors">
                  <Paperclip className="w-5 h-5" />
                  <input type="file" className="hidden" accept="image/*" onChange={e => { if (e.target.files) setImageFile(e.target.files[0]) }} />
                </label>
                <input 
                  type="text" 
                  placeholder="Type a reply to the user..." 
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={uploading || (!inputValue.trim() && !imageFile)}
                  className="p-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
            <MessageSquare className="w-12 h-12 mb-4 text-zinc-800" />
            <p>Select a user conversation from the sidebar to view and reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
