import React, { useState, useEffect, useRef } from "react";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Send, User, Search, ArrowLeft, Clock, Video, X, Loader2, Check, CheckCheck, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uploadToImgBB } from "../lib/imgbb";

export default function Inbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeUserId = searchParams.get('u');
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasSupabaseConfig) {
      supabase.auth.getUser().then(({ data }) => {
        setCurrentUser(data.user);
        if (data.user) {
          fetchConversations(data.user.id);
          supabase.from('profiles').select('is_premium').eq('id', data.user.id).single().then(res => {
            if (res.data) setCurrentUserProfile(res.data);
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    if (activeUserId && currentUser) {
      fetchChat(currentUser.id, activeUserId);
      markMessagesAsRead(currentUser.id, activeUserId);
    } else {
      setMessages([]);
      setActiveChatUser(null);
    }
  }, [activeUserId, currentUser]);

  useEffect(() => {
    if (!currentUser || !hasSupabaseConfig) return;
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages' },
        (payload) => {
          // fetch conversations to get updated latest message and unread counts
          fetchConversations(currentUser.id);
          
          // if chat is open and a new message comes in or is updated
          if (activeUserId) {
            fetchChat(currentUser.id, activeUserId);
            // If the incoming message is for the active chat and we are the receiver, mark as read
            if (payload.eventType === 'INSERT' && payload.new.receiver_id === currentUser.id && payload.new.sender_id === activeUserId) {
               markMessagesAsRead(currentUser.id, activeUserId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, activeUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async (userId: string) => {
    setLoading(true);
    // Fetch all messages involving the user
    const { data } = await supabase
      .from('direct_messages')
      .select('*, sender:sender_id(*), receiver:receiver_id(*)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (data) {
      // Group by the other user to create unique conversations
      const convosMap = new Map();
      data.forEach(msg => {
        const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
        const otherUserId = otherUser.id;
        
        if (!convosMap.has(otherUserId)) {
          convosMap.set(otherUserId, {
            user: otherUser,
            latestMessage: msg,
            unreadCount: msg.receiver_id === userId && !msg.is_read ? 1 : 0
          });
        } else {
          // just increment unread if older message is unread
          const current = convosMap.get(otherUserId);
          if (msg.receiver_id === userId && !msg.is_read) {
            current.unreadCount += 1;
          }
        }
      });
      setConversations(Array.from(convosMap.values()));
    }
    setLoading(false);
  };

  const fetchChat = async (userId: string, otherUserId: string) => {
    // Also fetch user profile if they have no messages yet
    if (conversations.length === 0 || !conversations.find(c => c.user.id === otherUserId)) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherUserId).single();
      if (profile) setActiveChatUser(profile);
    } else {
      const existing = conversations.find(c => c.user.id === otherUserId);
      if (existing) setActiveChatUser(existing.user);
    }

    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const markMessagesAsRead = async (userId: string, otherUserId: string) => {
    await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', otherUserId)
      .eq('is_read', false);
      
    // update local state
    setConversations(prev => prev.map(c => {
      if (c.user.id === otherUserId) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    }));
    
    // Force layout badge update
    window.dispatchEvent(new Event('force-update-counts'));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || !currentUser || !activeUserId) return;
    
    setSending(true);
    let uploadedImageUrl = null;

    if (imageFile) {
      try {
        uploadedImageUrl = await uploadToImgBB(imageFile);
      } catch (err: any) {
        alert("Failed to upload image: " + err.message);
        setSending(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: activeUserId,
        content: newMessage.trim(),
        image_url: uploadedImageUrl
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert('Failed to send message: ' + error.message);
    } else if (data) {
      setMessages([...messages, data]);
      setNewMessage("");
      setImageFile(null);
      setImagePreview(null);
      // Refresh conversations snippet
      fetchConversations(currentUser.id);
    }
    setSending(false);
  };

  const isUserOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const diff = new Date().getTime() - new Date(lastSeen).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  const handleVideoCall = () => {
    if (!currentUserProfile?.is_premium) {
      const wantPremium = window.confirm("Video call is a Premium feature. Would you like to upgrade to Premium?");
      if (wantPremium) {
        navigate('/premium');
      }
      return;
    }
    setShowVideoCall(true);
  };

  if (!currentUser) {
    return <div className="text-center py-20 text-zinc-400">Please sign in to view your inbox.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-4 h-[calc(100vh-100px)] flex gap-6 relative">
      
      {/* Sidebar - Conversations list */}
      <div className={`w-full md:w-1/3 flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden ${activeUserId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
          <h2 className="text-xl font-serif text-white">Inbox</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Loading messages...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No messages yet.</div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {conversations.map((convo) => (
                <Link 
                  key={convo.user.id} 
                  to={`/inbox?u=${convo.user.id}`}
                  className={`block p-4 hover:bg-zinc-800/50 transition-colors ${activeUserId === convo.user.id ? 'bg-zinc-800/80 border-l-2 border-cyan-500' : ''}`}
                >
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <img 
                        src={convo.user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40"} 
                        alt="avatar" 
                        className="w-12 h-12 rounded-full object-cover border border-zinc-700 bg-zinc-800" 
                      />
                      {isUserOnline(convo.user.last_seen) && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-900 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-zinc-200 font-medium text-sm truncate">{convo.user.display_name || "User"}</h4>
                        <span className="text-[10px] text-zinc-500 shrink-0 ml-2">
                          {formatDistanceToNow(new Date(convo.latestMessage.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-xs truncate ${convo.unreadCount > 0 ? 'text-white font-medium' : 'text-zinc-500'}`}>
                          {convo.latestMessage.sender_id === currentUser.id ? 'You: ' : ''}
                          {convo.latestMessage.content}
                        </p>
                        {convo.unreadCount > 0 && (
                          <span className="bg-cyan-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {convo.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`w-full md:w-2/3 flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden ${!activeUserId ? 'hidden md:flex' : 'flex'}`}>
        {!activeUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950/20">
            <Send className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Link to="/inbox" className="md:hidden text-zinc-400 hover:text-white mr-2">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                {activeChatUser && (
                  <Link to={`/user/${activeChatUser.id}`} className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={activeChatUser.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40"} 
                        alt="avatar" 
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700 bg-zinc-800" 
                      />
                      {isUserOnline(activeChatUser.last_seen) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-zinc-200 font-medium hover:text-cyan-400 transition-colors">{activeChatUser.display_name || "User"}</h3>
                      <p className="text-xs text-zinc-500">@{activeChatUser.username} {isUserOnline(activeChatUser.last_seen) && "• Active now"}</p>
                    </div>
                  </Link>
                )}
              </div>
              <div className="flex items-center">
                 <button onClick={handleVideoCall} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors">
                    <Video className="w-5 h-5" />
                 </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-cyan-600 text-white rounded-br-sm' : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'}`}>
                        {msg.image_url && (
                           <img src={msg.image_url} alt="Attachment" className="max-w-full rounded-lg mb-2 object-cover max-h-60" />
                        )}
                        {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                        <div className={`flex items-center gap-1 text-[9px] mt-1 ${isMe ? 'text-cyan-200' : 'text-zinc-500'}`}>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            msg.is_read ? <CheckCheck className="w-3 h-3 text-cyan-200" /> : <Check className="w-3 h-3 text-cyan-200/50" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
               {imagePreview && (
                  <div className="relative w-max mb-3">
                     <img src={imagePreview} className="h-20 rounded-lg border border-zinc-700" alt="Preview"/>
                     <button type="button" onClick={() => {setImageFile(null); setImagePreview(null)}} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X className="w-3 h-3"/></button>
                  </div>
               )}
              <form onSubmit={sendMessage} className="flex gap-3">
                <button
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="w-10 h-10 shrink-0 text-cyan-500 hover:bg-cyan-500/10 rounded-full flex items-center justify-center transition-colors"
                >
                   <ImageIcon className="w-5 h-5" />
                   <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                      if(e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        setImagePreview(URL.createObjectURL(e.target.files[0]));
                      }
                   }} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                />
                <button 
                  type="submit"
                  disabled={sending || (!newMessage.trim() && !imageFile)}
                  className="w-10 h-10 shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {showVideoCall && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm rounded-2xl overflow-hidden flex flex-col items-center justify-center">
          <div className="relative w-full h-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8">
             <div className="w-32 h-32 rounded-full bg-zinc-800 overflow-hidden mb-8 border-4 border-zinc-700 animate-pulse relative">
                <img 
                  src={activeChatUser?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40"} 
                  alt="avatar" 
                  className="w-full h-full object-cover opacity-50"
               />
               <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
               </div>
             </div>
             <h2 className="text-2xl font-serif text-white mb-2">Calling {activeChatUser?.display_name}...</h2>
             <p className="text-zinc-400 mb-12">Waiting for answer</p>
             
             <div className="flex gap-6">
                <button className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors" onClick={() => setShowVideoCall(false)}>
                  <X className="w-8 h-8" />
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
