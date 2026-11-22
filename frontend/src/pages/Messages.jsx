import { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await api.get('/chat/inbox');
        setConversations(res.data);
      } catch (error) {
        console.error("Error fetching inbox", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-100px)]">
      {/* Single unified frame: sidebar + chat share one border/shadow/radius */}
      <div className="h-full flex bg-white border border-ink-900/8 shadow-card-hover rounded-3xl overflow-hidden">

        {/* 📱 Sidebar: Inbox List — fixed width, not a fraction of the page */}
        <div className={`w-full md:w-[340px] shrink-0 border-r border-ink-900/6 flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-5 py-4 border-b border-ink-900/6 shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2 text-ink-900">
              <MessageSquare className="w-[18px] h-[18px] text-brand-600" strokeWidth={2} />
              Inbox
            </h2>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            {conversations.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center h-full justify-center">
                <div className="w-14 h-14 rounded-full bg-ink-50 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-ink-300" strokeWidth={1.5} />
                </div>
                <p className="font-medium text-ink-500 text-sm">No messages yet</p>
                <p className="text-ink-400 text-xs mt-0.5">Conversations will show up here</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedUser?.other_user_id === conv.other_user_id;
                return (
                  <div
                    key={conv.other_user_id}
                    onClick={() => {
                      setSelectedUser(conv);
                      // Optimistically clear badge on click
                      conv.unread_count = 0;
                    }}
                    className={`px-4 py-3.5 border-b border-ink-900/[0.04] cursor-pointer transition-colors duration-150 flex items-center justify-between gap-3 ${isSelected ? 'bg-brand-50' : 'hover:bg-ink-50/80'}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${isSelected ? 'bg-brand-600 text-white' : 'bg-ink-900 text-white'}`}>
                        {(conv.other_user_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-ink-900 text-sm truncate">{conv.other_user_name}</h4>
                        <p className={`text-[13px] truncate mt-0.5 ${conv.unread_count > 0 ? 'text-ink-800 font-medium' : 'text-ink-400'}`}>
                          {conv.last_message}
                        </p>
                      </div>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="bg-brand-600 text-white text-[10px] font-bold min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 💬 Main Chat Area */}
        <div className={`flex-1 min-w-0 flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              {/* Mobile Back Button */}
              <button
                onClick={() => setSelectedUser(null)}
                className="md:hidden m-3 mb-0 flex items-center gap-1.5 text-ink-700 font-medium text-sm bg-ink-50 px-3.5 py-2.5 rounded-xl w-fit shrink-0"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2} /> Back to Inbox
              </button>
              <div className="flex-1 min-h-0">
                <ChatWindow
                  receiverId={selectedUser.other_user_id}
                  receiverName={selectedUser.other_user_name}
                  propertyId={selectedUser.property_id}
                />
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="bg-ink-50 p-5 rounded-full mb-4">
                <MessageSquare className="w-9 h-9 text-brand-500" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-ink-800">Select a conversation</p>
              <p className="text-sm text-ink-400 mt-1">Choose a chat from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;