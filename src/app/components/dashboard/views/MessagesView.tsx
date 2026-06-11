import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Send, Paperclip, Smile, Phone, Video, MoreVertical,
  Mic, Image, CheckCheck
} from "lucide-react";

const CONVERSATIONS = [
  { id: 1, name: "Aria Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop", lastMsg: "See you tomorrow at 3pm! 🐍", time: "2m", unread: 2, online: true, typing: false },
  { id: 2, name: "Marcus Rivera", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop", lastMsg: "¿Cómo te fue con el ejercicio?", time: "18m", unread: 0, online: true, typing: true },
  { id: 3, name: "Zara Ahmed", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop", lastMsg: "I shared the Figma file with you", time: "1h", unread: 1, online: false, typing: false },
  { id: 4, name: "Leo Nakamura", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop", lastMsg: "Great progress on the chord transitions!", time: "3h", unread: 0, online: false, typing: false },
  { id: 5, name: "Priya Sharma", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop", lastMsg: "The session was amazing, thank you!", time: "1d", unread: 0, online: true, typing: false },
];

const MESSAGES = [
  { id: 1, from: "other", text: "Hey Alex! Ready for tomorrow's Python session?", time: "3:10 PM", reactions: [] },
  { id: 2, from: "me", text: "Absolutely! I've been practicing the list comprehensions we covered last time", time: "3:12 PM", reactions: ["👍"] },
  { id: 3, from: "other", text: "Perfect! Today we'll cover decorators and context managers. These will level up your code significantly.", time: "3:14 PM", reactions: [] },
  { id: 4, from: "me", text: "Sounds great. Should I prepare anything specific?", time: "3:15 PM", reactions: [] },
  { id: 5, from: "other", text: "Just review the 'with' statement basics. I'll send you a warm-up exercise now 🐍", time: "3:16 PM", reactions: ["🔥"] },
  { id: 6, from: "other", text: "See you tomorrow at 3pm! 🐍", time: "3:17 PM", reactions: [] },
  { id: 7, from: "me", text: "Perfect, see you then! 🚀", time: "3:18 PM", reactions: [] },
];

export function MessagesView() {
  const [activeConv, setActiveConv] = useState(CONVERSATIONS[0]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(MESSAGES);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages([...messages, {
      id: messages.length + 1,
      from: "me",
      text: message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      reactions: [],
    }]);
    setMessage("");
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-extrabold text-foreground mb-3">Messages</h2>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
            <Search size={14} className="text-muted-foreground" />
            <input placeholder="Search conversations..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {CONVERSATIONS.map(conv => (
            <button key={conv.id} onClick={() => setActiveConv(conv)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-all border-b border-border/50 ${activeConv.id === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
              <div className="relative flex-shrink-0">
                <img src={conv.avatar} alt={conv.name} className="w-11 h-11 rounded-xl object-cover" />
                {conv.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-card" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground truncate">{conv.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{conv.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  {conv.typing ? (
                    <span className="text-xs text-primary font-medium">typing...</span>
                  ) : (
                    <span className="text-xs text-muted-foreground truncate">{conv.lastMsg}</span>
                  )}
                  {conv.unread > 0 && (
                    <span className="text-xs font-bold text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-1" style={{ background: "var(--sb-gradient)", fontSize: 10 }}>
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-card">
          <div className="relative">
            <img src={activeConv.avatar} alt={activeConv.name} className="w-10 h-10 rounded-xl object-cover" />
            {activeConv.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-card" />}
          </div>
          <div>
            <div className="font-bold text-foreground">{activeConv.name}</div>
            <div className="text-xs text-muted-foreground">{activeConv.online ? "Online" : "Offline"}</div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Phone size={17} />
            </button>
            <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Video size={17} />
            </button>
            <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <MoreVertical size={17} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Date divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground px-2 bg-background">Today</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {messages.map((msg, i) => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 ${msg.from === "me" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.from !== "me" && (
                <img src={activeConv.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              )}
              <div className={`max-w-sm group relative ${msg.from === "me" ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === "me"
                  ? "text-white rounded-br-sm"
                  : "bg-card border border-border text-foreground rounded-bl-sm"}`}
                  style={msg.from === "me" ? { background: "var(--sb-gradient)" } : {}}>
                  {msg.text}
                </div>
                <div className={`flex items-center gap-1 mt-1 ${msg.from === "me" ? "flex-row-reverse" : ""}`}>
                  <span className="text-xs text-muted-foreground">{msg.time}</span>
                  {msg.from === "me" && <CheckCheck size={12} className="text-primary" />}
                </div>
                {msg.reactions.length > 0 && (
                  <div className={`flex gap-1 mt-1 ${msg.from === "me" ? "self-end" : "self-start"}`}>
                    {msg.reactions.map((r, ri) => (
                      <span key={ri} className="text-sm bg-card border border-border rounded-full px-1.5 py-0.5 shadow-sm">{r}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-end gap-2">
            <div className="flex gap-1 flex-shrink-0">
              <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"><Paperclip size={17} /></button>
              <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"><Image size={17} /></button>
            </div>
            <div className="flex-1 relative">
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-2.5 rounded-2xl border border-border bg-muted text-sm text-foreground outline-none focus:border-primary transition-all resize-none"
                style={{ maxHeight: 120 }} />
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"><Smile size={17} /></button>
              <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"><Mic size={17} /></button>
              <button onClick={sendMessage}
                className="p-2.5 rounded-xl text-white transition-all hover:shadow-md hover:scale-105"
                style={{ background: "var(--sb-gradient)" }}>
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-0.5">
            {["📅 Schedule a session", "🔗 Share meeting link", "📁 Send file", "👍 Great!"].map(action => (
              <button key={action} className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted hover:border-primary/30 transition-all text-muted-foreground">
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
