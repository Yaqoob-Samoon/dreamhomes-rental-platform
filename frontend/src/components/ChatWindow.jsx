import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare, Check, CheckCheck, Lock } from 'lucide-react';
import api from '../api';

// Presentational helpers only — no business logic here.
const isSameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const formatDayLabel = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

const ChatWindow = ({ receiverId, propertyId, receiverName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token || !receiverId) {
      setLoading(false);
      return;
    }

    const fetchHistoryAndConnect = async () => {
      try {
        const res = await api.get(`/chat/history/${receiverId}`);
        setMessages(res.data);

        const profileRes = await api.get('/auth/users/me');
        setCurrentUserId(profileRes.data.id);

        await api.put(`/chat/mark-read/${receiverId}`);
      } catch (err) {
        console.error("Error fetching chat data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryAndConnect();

    const wsUrl = `ws://localhost:8000/api/chat/ws?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log("Connected to Secure Live Chat");

    ws.current.onmessage = (event) => {
      const incomingMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, incomingMessage]);

      if (incomingMessage.sender_id === parseInt(receiverId)) {
        api.put(`/chat/mark-read/${receiverId}`).catch(console.error);
      }
    };

    ws.current.onclose = () => console.log("Disconnected from Live Chat");

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [receiverId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws.current) return;

    const messagePayload = {
      receiver_id: receiverId,
      property_id: propertyId,
      message: newMessage,
    };

    ws.current.send(JSON.stringify(messagePayload));
    setNewMessage('');
  };

  // Scoped styles for the custom scrollbar + subtle entrance motion.
  // Presentational only; does not touch component state or logic.
  const chatStyles = `
    .chat-scroll::-webkit-scrollbar { width: 6px; }
    .chat-scroll::-webkit-scrollbar-track { background: transparent; }
    .chat-scroll::-webkit-scrollbar-thumb {
      background-color: rgba(27,27,24,0.14);
      border-radius: 9999px;
    }
    .chat-scroll::-webkit-scrollbar-thumb:hover {
      background-color: rgba(27,27,24,0.28);
    }
    .chat-scroll { scrollbar-width: thin; scrollbar-color: rgba(27,27,24,0.14) transparent; }

    @keyframes chatMessageIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .chat-message-in { animation: chatMessageIn 0.28s ease-out both; }

    @media (prefers-reduced-motion: reduce) {
      .chat-message-in { animation: none; }
    }
  `;

  if (!token) {
    return (
      <div className="p-10 bg-[#FAF8F4] rounded-3xl text-center border border-[#E7E2D9]/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="w-12 h-12 rounded-full bg-white shadow-sm ring-1 ring-[#EDE9DF] flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-5 h-5 text-[#B5AE9C]" strokeWidth={1.75} />
        </div>
        <p className="text-[#1B1B18] font-medium text-sm tracking-tight">
          Log in to message the landlord.
        </p>
      </div>
    );
  }

  const initial = (receiverName || 'L').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col bg-white border border-[#E7E2D9]/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[28px] overflow-hidden h-[550px] font-sans">
      <style>{chatStyles}</style>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1B1B18]/95 backdrop-blur-md text-white px-6 py-4 flex items-center gap-3.5 shrink-0 border-b border-white/[0.06]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A7460] to-[#2C4A3B] ring-1 ring-white/10 flex items-center justify-center shrink-0 font-semibold text-[15px] text-white shadow-inner">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[15px] truncate tracking-tight leading-tight">
            {receiverName || 'Landlord'}
          </h3>
          <p className="text-[12px] text-white/45 flex items-center gap-1.5 mt-0.5">
            <Lock className="w-3 h-3" strokeWidth={2} />
            Private conversation
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        className="chat-scroll flex-1 px-5 py-5 overflow-y-auto bg-[#FAF8F4] space-y-1"
        role="log"
        aria-live="polite"
        aria-label="Message history"
      >
        {loading ? (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`h-9 rounded-2xl bg-[#E7E2D9]/60 animate-pulse ${
                    i % 2 ? 'w-40 rounded-tr-md' : 'w-52 rounded-tl-md'
                  }`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center h-full flex flex-col items-center justify-center px-6">
            <div className="w-12 h-12 rounded-full bg-white shadow-[0_4px_16px_rgb(0,0,0,0.05)] ring-1 ring-[#EDE9DF] flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-[#B5AE9C]" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-[#1B1B18] text-sm tracking-tight">No messages yet</p>
            <p className="text-[#8C8676] text-[13px] mt-1 leading-relaxed max-w-[220px]">
              Send a message to reach {receiverName || 'the landlord'} about this listing.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = String(msg.sender_id) === String(currentUserId);
            const prev = messages[index - 1];
            const showDayDivider = !prev || !isSameDay(prev.created_at, msg.created_at);

            return (
              <div key={index} className="chat-message-in">
                {showDayDivider && (
                  <div className="flex items-center justify-center py-3">
                    <span className="text-[11px] font-medium text-[#B5AE9C] bg-[#FAF8F4] px-2">
                      {formatDayLabel(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} py-0.5`}>
                  <div
                    className={`group max-w-[75%] px-4 py-2.5 shadow-[0_1px_2px_rgb(0,0,0,0.04)] transition-transform duration-200 motion-reduce:transition-none hover:-translate-y-[1px] ${
                      isMe
                        ? 'bg-gradient-to-br from-[#232320] to-[#161614] text-white rounded-2xl rounded-tr-md'
                        : 'bg-white border border-[#EDE9DF] text-[#1B1B18] rounded-2xl rounded-tl-md'
                    }`}
                  >
                    <p className="text-[14.5px] leading-relaxed break-words">{msg.message}</p>

                    <div
                      className={`flex items-center justify-end gap-1 mt-1 ${
                        isMe ? 'text-white/40' : 'text-[#B5AE9C]'
                      }`}
                    >
                      <span className="text-[10.5px] tabular-nums">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe &&
                        (msg.is_read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#6FA98A]" strokeWidth={2} />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-white/35" strokeWidth={2} />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3.5 bg-white/90 backdrop-blur-sm border-t border-[#E7E2D9]/80 shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2 items-center relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            aria-label="Message"
            className="flex-1 bg-[#FAF8F4] text-[#1B1B18] text-sm rounded-full pl-4 pr-12 py-3 border border-[#E7E2D9] placeholder:text-[#B5AE9C] outline-none transition-all duration-200 focus:bg-white focus:border-[#3F6652]/40 focus:ring-4 focus:ring-[#3F6652]/10 focus:shadow-[0_4px_16px_rgb(0,0,0,0.04)]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            aria-label="Send message"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex justify-center items-center rounded-full text-white transition-all duration-200 motion-reduce:transition-none bg-gradient-to-br from-[#232320] to-[#161614] hover:from-[#3F6652] hover:to-[#2C4A3B] active:scale-90 disabled:bg-none disabled:bg-[#EDE9DF] disabled:text-[#C3BDAC] disabled:cursor-not-allowed shadow-sm disabled:shadow-none"
          >
            <Send className="w-4 h-4" strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;