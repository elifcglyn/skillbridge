import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCheck, Search, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  created_at: string;
  is_read: boolean | null;
};

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  lastMsg: string;
  time: string;
  lastMessageAt: string | null;
  unreadCount: number;
};

type ChatMessage = {
  id: string;
  from: "me" | "other";
  text: string;
  time: string;
};

type MessagesViewProps = {
  onMessagesRead?: () => void | Promise<void>;
};

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort((left, right) => {
    const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
    const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
    return rightTime - leftTime || left.name.localeCompare(right.name, "tr");
  });
}

function isBetweenUsers(message: MessageRow, firstUserId: string, secondUserId: string) {
  return (
    (message.sender_id === firstUserId && message.receiver_id === secondUserId) ||
    (message.sender_id === secondUserId && message.receiver_id === firstUserId)
  );
}

function buildAvatar(profile: ProfileRow) {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "User";
  return profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
}

export function MessagesView({ onMessagesRead }: MessagesViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loadingConv, setLoadingConv] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const markConversationRead = async (partnerId: string, userId = myUserId) => {
    if (!userId) return;

    const { error: updateError } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", userId)
      .eq("sender_id", partnerId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setConversations((items) =>
      items.map((item) => (item.id === partnerId ? { ...item, unreadCount: 0 } : item)),
    );

    await onMessagesRead?.();
  };

  const markAllIncomingMessagesRead = async (userId: string) => {
    const { error: updateError } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", userId);

    if (updateError) {
      setError(updateError.message);
      return false;
    }

    await onMessagesRead?.();
    return true;
  };

  useEffect(() => {
    const initChat = async () => {
      setLoadingConv(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        setLoadingConv(false);
        return;
      }

      setMyUserId(user.id);
      const clearedUnreadMessages = await markAllIncomingMessagesRead(user.id);

      const [{ data: profiles, error: profilesError }, { data: allMyMessages, error: messagesError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url")
            .not("id", "eq", user.id),
          supabase
            .from("messages")
            .select("id,sender_id,receiver_id,content,created_at,is_read")
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order("created_at", { ascending: false }),
        ]);

      if (profilesError || messagesError) {
        setError(profilesError?.message || messagesError?.message || "Mesajlar yüklenemedi.");
        setLoadingConv(false);
        return;
      }

      const messageRows = (allMyMessages ?? []) as MessageRow[];
      const formatted = sortConversations(
        ((profiles ?? []) as ProfileRow[]).map((profile) => {
          const messagesWithProfile = messageRows.filter((row) => isBetweenUsers(row, user.id, profile.id));
          const lastMessage = messagesWithProfile[0];
          const unreadCount = clearedUnreadMessages
            ? 0
            : messagesWithProfile.filter(
                (row) => row.sender_id === profile.id && row.receiver_id === user.id && row.is_read !== true,
              ).length;
          const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Kullanıcı";

          return {
            id: profile.id,
            name,
            avatar: buildAvatar(profile),
            online: true,
            lastMsg: lastMessage?.content || "Sohbeti başlatmak için tıklayın...",
            time: formatTime(lastMessage?.created_at),
            lastMessageAt: lastMessage?.created_at ?? null,
            unreadCount,
          };
        }),
      );

      setConversations(formatted);

      if (formatted.length > 0) {
        const preferredPartnerId = localStorage.getItem("active_chat_partner_id");
        const preferredConversation = formatted.find((conv) => conv.id === preferredPartnerId);
        const firstUnreadConversation = formatted.find((conv) => conv.unreadCount > 0);
        setActiveConv(preferredConversation || firstUnreadConversation || formatted[0]);

        if (preferredPartnerId) {
          localStorage.removeItem("active_chat_partner_id");
        }
      }

      setLoadingConv(false);
    };

    initChat();
  }, []);

  useEffect(() => {
    if (!myUserId || !activeConv?.id) return;

    const fetchMessageHistory = async () => {
      setError(null);

      const { data: historyData, error: historyError } = await supabase
        .from("messages")
        .select("id,sender_id,receiver_id,content,created_at,is_read")
        .or(`and(sender_id.eq.${myUserId},receiver_id.eq.${activeConv.id}),and(sender_id.eq.${activeConv.id},receiver_id.eq.${myUserId})`)
        .order("created_at", { ascending: true });

      if (historyError) {
        setError(historyError.message);
        return;
      }

      setMessages(
        ((historyData ?? []) as MessageRow[]).map((msg) => ({
          id: msg.id,
          from: msg.sender_id === myUserId ? "me" : "other",
          text: msg.content || "",
          time: formatTime(msg.created_at),
        })),
      );

      await markConversationRead(activeConv.id, myUserId);
    };

    fetchMessageHistory();

    const channel = supabase
      .channel(`chat_room_${myUserId}_${activeConv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const newMsg = payload.new as MessageRow;
        const peerId =
          newMsg.sender_id === myUserId
            ? newMsg.receiver_id
            : newMsg.receiver_id === myUserId
              ? newMsg.sender_id
              : null;

        if (!peerId) return;

        const msgTime = formatTime(newMsg.created_at);
        const isCurrentChat = peerId === activeConv.id;
        const isIncoming = newMsg.receiver_id === myUserId;

        if (isCurrentChat) {
          setMessages((prev) => [
            ...prev,
            {
              id: newMsg.id,
              from: newMsg.sender_id === myUserId ? "me" : "other",
              text: newMsg.content || "",
              time: msgTime,
            },
          ]);
        }

        setConversations((prevConvs) =>
          sortConversations(
            prevConvs.map((conv) => {
              if (conv.id !== peerId) return conv;
              return {
                ...conv,
                lastMsg: newMsg.content || "",
                time: msgTime,
                lastMessageAt: newMsg.created_at,
                unreadCount: isIncoming && !isCurrentChat ? conv.unreadCount + 1 : conv.unreadCount,
              };
            }),
          ),
        );

        if (isCurrentChat && isIncoming) {
          const { error: updateError } = await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("id", newMsg.id);

          if (updateError) {
            setError(updateError.message);
            return;
          }

          await onMessagesRead?.();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myUserId, activeConv?.id]);

  const selectConversation = (conversation: Conversation) => {
    setActiveConv(conversation);
    localStorage.setItem("active_chat_partner_id", conversation.id);
  };

  const sendMessage = async () => {
    if (!message.trim() || !myUserId || !activeConv?.id) return;
    const textToSend = message.trim();
    setMessage("");

    const { error: insertError } = await supabase
      .from("messages")
      .insert([{ content: textToSend, sender_id: myUserId, receiver_id: activeConv.id, is_read: false }]);

    if (insertError) {
      setError(insertError.message);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-extrabold text-foreground mb-3">Mesajlar</h2>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
            <Search size={14} className="text-muted-foreground" />
            <input placeholder="Konuşmaları ara..." className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConv ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Kişiler yükleniyor...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Kayıtlı başka kullanıcı bulunamadı.</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-all border-b border-border/50 ${
                  activeConv?.id === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                }`}>
                <div className="relative flex-shrink-0">
                  <img src={conv.avatar} alt={conv.name} className="w-11 h-11 rounded-xl object-cover" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-card" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold text-sm text-foreground truncate block">{conv.name}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                      {conv.unreadCount > 0 && (
                        <span className="text-[10px] min-w-[18px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs truncate block mt-0.5 ${conv.unreadCount > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                    {conv.lastMsg}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

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
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${msg.from === "me" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.from !== "me" && <img src={activeConv.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />}
                  <div className={`max-w-sm group relative ${msg.from === "me" ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.from === "me" ? "text-white rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm"
                      }`}
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
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Bir mesaj yazın..."
                rows={1}
                className="w-full px-4 py-2.5 rounded-2xl border border-border bg-muted text-sm text-foreground outline-none resize-none"
              />
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
