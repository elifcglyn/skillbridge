import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { Search, Send, CheckCheck } from "lucide-react";

export function MessagesView() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loadingConv, setLoadingConv] = useState(true);

  // 1. ADIM: Profilleri ve "En Son Mesajları" Çek
  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyUserId(user.id);

      // A) Profilleri getir
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .not("id", "eq", user.id);

      // B) Benim dahil olduğum tüm mesajları getir (Son mesajları bulmak için)
      const { data: allMyMessages } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (profiles) {
        const formattedConv = profiles.map((p) => {
          // Bu kişiyle olan en son mesajı bul
          const lastMsgData = allMyMessages?.find(
            (m) => (m.sender_id === p.id && m.receiver_id === user.id) || (m.sender_id === user.id && m.receiver_id === p.id)
          );

          return {
            id: p.id,
            name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Kullanıcı",
            avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.first_name || "U"}&background=random&color=fff`,
            online: true,
            lastMsg: lastMsgData ? lastMsgData.content : "Sohbeti başlatmak için tıklayın...",
            time: lastMsgData ? new Date(lastMsgData.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
          };
        });

        setConversations(formattedConv);
        if (formattedConv.length > 0) setActiveConv(formattedConv[0]);
      }
      setLoadingConv(false);
    };

    initChat();
  }, []);

  // 2. ADIM: Aktif Sohbet Değiştiğinde Geçmişi Getir ve Realtime Dinle
  useEffect(() => {
    if (!myUserId || !activeConv?.id) return;

    const fetchMessageHistory = async () => {
      const { data: historyData } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${myUserId},receiver_id.eq.${activeConv.id}),and(sender_id.eq.${activeConv.id},receiver_id.eq.${myUserId})`)
        .order("created_at", { ascending: true });

      if (historyData) {
        setMessages(historyData.map((msg) => ({
          id: msg.id,
          from: msg.sender_id === myUserId ? "me" : "other",
          text: msg.content,
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })));
      }
    };

    fetchMessageHistory();

    const channel = supabase
      .channel(`chat_room`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new;
        const msgTime = new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // A) Eğer mesaj aktif konuştuğum kişiyeyse ana ekrana ekle
        const isBelongsToCurrentChat =
          (newMsg.sender_id === myUserId && newMsg.receiver_id === activeConv.id) ||
          (newMsg.sender_id === activeConv.id && newMsg.receiver_id === myUserId);

        if (isBelongsToCurrentChat) {
          setMessages((prev) => [...prev, { id: newMsg.id, from: newMsg.sender_id === myUserId ? "me" : "other", text: newMsg.content, time: msgTime }]);
        }

        // B) Sol menüdeki "Son Mesaj" yazısını canlı güncelle
        setConversations((prevConvs) =>
          prevConvs.map((conv) => {
            if (conv.id === newMsg.sender_id || conv.id === newMsg.receiver_id) {
              return { ...conv, lastMsg: newMsg.content, time: msgTime };
            }
            return conv;
          })
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myUserId, activeConv?.id]);

  // 3. ADIM: Mesaj Gönder
  const sendMessage = async () => {
    if (!message.trim() || !myUserId || !activeConv?.id) return;
    const textToSend = message;
    setMessage("");

    await supabase.from("messages").insert([{ content: textToSend, sender_id: myUserId, receiver_id: activeConv.id, is_read: false }]);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-extrabold text-foreground mb-3">Mesajlar</h2>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
            <Search size={14} className="text-muted-foreground" />
            <input placeholder="Konuşmaları ara..." className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConv ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Kişiler yükleniyor...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Kayıtlı başka kullanıcı bulunamadı.</div>
          ) : (
            conversations.map((conv) => (
              <button key={conv.id} onClick={() => setActiveConv(conv)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-all border-b border-border/50 ${activeConv?.id === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                <div className="relative flex-shrink-0">
                  <img src={conv.avatar} alt={conv.name} className="w-11 h-11 rounded-xl object-cover" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-card" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-foreground truncate block">{conv.name}</span>
                    <span className="text-xs text-muted-foreground">{conv.time}</span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate block mt-0.5">{conv.lastMsg}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-background">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-card">
            <img src={activeConv.avatar} alt={activeConv.name} className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <div className="font-bold text-foreground">{activeConv.name}</div>
              <div className="text-xs text-muted-foreground">Çevrimiçi</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Henüz mesaj yok. İlk mesajı sen gönder!</div>
            ) : (
              messages.map((msg, i) => (
                <motion.div key={msg.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${msg.from === "me" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.from !== "me" && <img src={activeConv.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />}
                  <div className={`max-w-sm group relative ${msg.from === "me" ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === "me" ? "text-white rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm"}`}
                      style={msg.from === "me" ? { background: "var(--sb-gradient)" } : {}}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${msg.from === "me" ? "flex-row-reverse" : ""}`}>
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                      {msg.from === "me" && <CheckCheck size={12} className="text-primary" />}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-end gap-2">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Bir mesaj yazın..." rows={1}
                className="w-full px-4 py-2.5 rounded-2xl border border-border bg-muted text-sm text-foreground outline-none resize-none" />
              <button onClick={sendMessage} className="p-2.5 rounded-xl text-white transition-all hover:scale-105 flex-shrink-0" style={{ background: "var(--sb-gradient)" }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground bg-background">
          Sohbete başlamak için sol menüden birini seçin.
        </div>
      )}
    </div>
  );
}