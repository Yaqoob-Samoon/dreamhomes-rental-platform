import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Bot, X, Send, Loader2, MessageSquare, BedDouble } from 'lucide-react';

const AIChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi! Main aap ka AI Assistant hoon. Aap kis tarah ka ghar dhoondh rahe hain? (e.g. "Karachi mein 80k ka 3 bed apartment")',
      properties: []
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');
    
    // 1. Add user message to UI
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // 2. Call your new NLP Backend API
      // Note: Agar aap ki properties router par /properties prefix laga hai toh url yeh hoga:
      const res = await api.post('/properties/assistant/chat', { message: userMsg });
      
      // 3. Add bot response & properties to UI
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: res.data.reply,
        properties: res.data.properties || []
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: "Maaf kijiye ga, network error aa gaya. Thori der baad try karein." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] rounded-3xl shadow-2xl border border-[#E7E2D9] mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-[#1B1B18] text-white p-4 flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="bg-[#3F6652] p-2 rounded-full relative">
                <Bot className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#3F6652] rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Assistant</h3>
                <p className="text-xs text-slate-300">Online | Smart Search</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#FAF8F4] space-y-5">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                
                {/* Text Message */}
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-[14px] ${
                  msg.sender === 'user' 
                    ? 'bg-[#3F6652] text-white rounded-br-none' 
                    : 'bg-white border border-[#E7E2D9] text-[#1B1B18] rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>

                {/* Property Cards (If any) */}
                {msg.properties && msg.properties.length > 0 && (
                  <div className="mt-3 space-y-3 w-[90%]">
                    {msg.properties.map(prop => (
                      <Link to={`/property/${prop.id}`} key={prop.id} className="block bg-white border border-[#E7E2D9] rounded-xl overflow-hidden hover:shadow-md transition-all group">
                        <div className="h-28 bg-slate-100 relative">
                          {prop.images?.length > 0 ? (
                            <img src={prop.images[0].image_url} className="w-full h-full object-cover" alt="property" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">No Image</div>
                          )}
                          <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-1 rounded text-xs font-bold text-[#1B1B18]">
                            PKR {prop.rent.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs font-bold text-[#1B1B18] truncate mb-1">{prop.title}</h4>
                          <div className="flex justify-between items-center text-[10px] text-[#736E60]">
                            <span>{prop.city}</span>
                            <span className="flex items-center gap-1"><BedDouble className="w-3 h-3"/> {prop.bedrooms} Bed</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white border border-[#E7E2D9] p-3.5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#3F6652]" />
                  <span className="text-xs text-[#736E60] font-medium">Searching database...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#E7E2D9] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[#FAF8F4] border border-[#E7E2D9] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#3F6652] focus:ring-1 focus:ring-[#3F6652] transition-all"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !inputText.trim()}
              className="bg-[#1B1B18] text-white p-2.5 rounded-full hover:bg-[#3F6652] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* FLOATING BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#1B1B18] text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:bg-[#3F6652] hover:scale-105 transition-all duration-300 flex items-center justify-center group relative"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          
          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-[#1B1B18] px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-[#E7E2D9]">
            Ask AI Assistant
          </div>
        </button>
      )}
    </div>
  );
};

export default AIChatbotWidget;