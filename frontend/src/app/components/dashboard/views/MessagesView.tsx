import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Check, CheckCheck, Search, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type MatchRow = {
  user_id: string | null;
  matched_user_id: string | null;
  status: string | null;
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
  createdAt: string;
  isRead: boolean;
};

type MessagesViewProps = {
  initialPeerId?: string | null;
  onMessagesRead?: () => void | Promise<void>;
};

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
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

function profileName(profile: ProfileRow) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Kullanıcı";
}

function buildAvatar(profile: ProfileRow) {
  const name = profileName(profile);
  return profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
}

function toChatMessage(message: MessageRow, userId: string): ChatMessage {
  return {
    id: message.id,
    from: message.sender_id === userId ? "me" : "other",
    text: message.content || "",
    time: formatTime(message.created_at),
    createdAt: message.created_at,
    isRead: message.is_read === true,
  };
}

function upsertChatMessage(messages: ChatMessage[], nextMessage: ChatMessage) {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);
  const nextMessages = [...messages];

  if (existingIndex >= 0) {
    nextMessages[existingIndex] = nextMessage;
  } else {
    nextMessages.push(nextMessage);
  }

  return nextMessages.sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

export function MessagesView({ initialPeerId, onMessagesRead }: MessagesViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlinePeerIds, setOnlinePeerIds] = useState<Set<string>>(new Set());
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const markConversationRead = async (partnerId: string, userId = myUserId) => {
    if (!userId) return;

    const { error: updateError } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", userId)
      .eq("sender_id", partnerId)
      .eq("is_read", false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setConversations((items) =>
      items.map((item) => (item.id === partnerId ? { ...item, unreadCount: 0 } : item)),
    );
    setMessages((items) =>
      items.map((item) => (item.from === "other" ? { ...item, isRead: true } : item)),
    );

    await onMessagesRead?.();
  };

  useEffect(() => {
    let mounted = true;

    const initChat = async () => {
      setLoadingConv(true);
      setError(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user || !mounted) return;

        setMyUserId(user.id);

        const { data: matchRows, error: matchesError } = await supabase
          .from("matches")
          .select("user_id,matched_user_id,status")
          .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`);

        if (matchesError) throw matchesError;

        const peerIds = Array.from(
          new Set(
            ((matchRows ?? []) as MatchRow[])
              .filter(
                (match) =>
                  !["rejected", "declined", "cancelled"].includes(
                    (match.status || "recommended").toLowerCase(),
                  ),
              )
              .map((match) => {
                return match.user_id === user.id
                  ? match.matched_user_id
                  : match.user_id;
              })
              .filter((peerId): peerId is string => Boolean(peerId)),
          ),
        );

        if (peerIds.length === 0) {
          if (!mounted) return;
          setConversations([]);
          setActiveConv(null);
          return;
        }

        const [{ data: profiles, error: profilesError }, { data: messageRows, error: messagesError }] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("id,first_name,last_name,avatar_url")
              .in("id", peerIds),
            supabase
              .from("messages")
              .select("id,sender_id,receiver_id,content,created_at,is_read")
              .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
              .order("created_at", { ascending: false }),
          ]);

        if (profilesError) throw profilesError;
        if (messagesError) throw messagesError;
        if (!mounted) return;

        const profileById = new Map(
          ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
        );
        const allMessages = (messageRows ?? []) as MessageRow[];
        const formatted = sortConversations(
          peerIds.map((peerId) => {
            const profile =
              profileById.get(peerId) ??
              ({ id: peerId, first_name: null, last_name: null, avatar_url: null } satisfies ProfileRow);
            const peerMessages = allMessages.filter((row) => isBetweenUsers(row, user.id, peerId));
            const lastMessage = peerMessages[0];
            const unreadCount = peerMessages.filter(
              (row) => row.sender_id === peerId && row.receiver_id === user.id && row.is_read !== true,
            ).length;

            return {
              id: peerId,
              name: profileName(profile),
              avatar: buildAvatar(profile),
              lastMsg: lastMessage?.content || "Sohbeti başlatmak için tıklayın...",
              time: formatTime(lastMessage?.created_at),
              lastMessageAt: lastMessage?.created_at ?? null,
              unreadCount,
            };
          }),
        );

        setConversations(formatted);

        if (initialPeerId) {
          const requestedConversation = formatted.find((conversation) => conversation.id === initialPeerId);

          if (requestedConversation) {
            setActiveConv(requestedConversation);
            setMobileChatOpen(true);
          } else {
            setActiveConv(null);
            setError("Bu kullanıcıyla mesajlaşmak için önce bir beceri eşleşmesi oluşturmalısınız.");
          }
        } else {
          setActiveConv(
            formatted.find((conversation) => conversation.unreadCount > 0) || formatted[0] || null,
          );
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Mesajlar yüklenemedi.");
        }
      } finally {
        if (mounted) setLoadingConv(false);
      }
    };

    initChat();

    return () => {
      mounted = false;
    };
  }, [initialPeerId]);

  useEffect(() => {
    if (!myUserId) return;

    const presenceChannel = supabase.channel("messages_presence", {
      config: {
        presence: {
          key: myUserId,
        },
      },
    });

    const syncPresence = () => {
      const presenceState = presenceChannel.presenceState();
      setOnlinePeerIds(new Set(Object.keys(presenceState).filter((userId) => userId !== myUserId)));
    };

    presenceChannel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: myUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [myUserId]);

  useEffect(() => {
    if (!myUserId || !activeConv?.id) {
      setMessages([]);
      return;
    }

    let mounted = true;
    setLoadingMessages(true);
    setError(null);

    const fetchMessageHistory = async () => {
      const { data: historyData, error: historyError } = await supabase
        .from("messages")
        .select("id,sender_id,receiver_id,content,created_at,is_read")
        .or(
          `and(sender_id.eq.${myUserId},receiver_id.eq.${activeConv.id}),and(sender_id.eq.${activeConv.id},receiver_id.eq.${myUserId})`,
        )
        .order("created_at", { ascending: true });

      if (!mounted) return;

      if (historyError) {
        setError(historyError.message);
        setLoadingMessages(false);
        return;
      }

      setMessages(
        ((historyData ?? []) as MessageRow[]).map((historyMessage) =>
          toChatMessage(historyMessage, myUserId),
        ),
      );
      setLoadingMessages(false);
      await markConversationRead(activeConv.id, myUserId);
    };

    fetchMessageHistory();

    const channel = supabase
      .channel(`chat_room_${myUserId}_${activeConv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const newMessage = payload.new as MessageRow;
        const peerId =
          newMessage.sender_id === myUserId
            ? newMessage.receiver_id
            : newMessage.receiver_id === myUserId
              ? newMessage.sender_id
              : null;

        if (!peerId || !conversations.some((conversation) => conversation.id === peerId)) return;

        const isCurrentChat = peerId === activeConv.id;
        const isIncoming = newMessage.receiver_id === myUserId;

        if (isCurrentChat) {
          setMessages((items) => upsertChatMessage(items, toChatMessage(newMessage, myUserId)));
        }

        setConversations((items) =>
          sortConversations(
            items.map((conversation) =>
              conversation.id === peerId
                ? {
                    ...conversation,
                    lastMsg: newMessage.content || "",
                    time: formatTime(newMessage.created_at),
                    lastMessageAt: newMessage.created_at,
                    unreadCount:
                      isIncoming && !isCurrentChat
                        ? conversation.unreadCount + 1
                        : conversation.unreadCount,
                  }
                : conversation,
            ),
          ),
        );

        if (isCurrentChat && isIncoming) {
          await markConversationRead(peerId, myUserId);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updatedMessage = payload.new as MessageRow;

        if (!isBetweenUsers(updatedMessage, myUserId, activeConv.id)) return;

        setMessages((items) => upsertChatMessage(items, toChatMessage(updatedMessage, myUserId)));
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [myUserId, activeConv?.id, conversations.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = searchQuery.toLocaleLowerCase("tr-TR").trim();
    if (!normalizedQuery) return conversations;

    return conversations.filter(
      (conversation) =>
        conversation.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        conversation.lastMsg.toLocaleLowerCase("tr-TR").includes(normalizedQuery),
    );
  }, [conversations, searchQuery]);

  const selectConversation = (conversation: Conversation) => {
    setActiveConv(conversation);
    setMobileChatOpen(true);
    setError(null);
  };

  const sendMessage = async () => {
    const textToSend = message.trim();
    if (!textToSend || !myUserId || !activeConv?.id || sending) return;

    setSending(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("messages")
        .insert([
          {
            content: textToSend,
            sender_id: myUserId,
            receiver_id: activeConv.id,
            is_read: false,
          },
        ])
        .select("id,sender_id,receiver_id,content,created_at,is_read")
        .single();

      if (insertError) throw insertError;

      const insertedMessage = data as MessageRow;
      setMessages((items) => upsertChatMessage(items, toChatMessage(insertedMessage, myUserId)));
      setConversations((items) =>
        sortConversations(
          items.map((conversation) =>
            conversation.id === activeConv.id
              ? {
                  ...conversation,
                  lastMsg: insertedMessage.content || "",
                  time: formatTime(insertedMessage.created_at),
                  lastMessageAt: insertedMessage.created_at,
                }
              : conversation,
          ),
        ),
      );
      setMessage("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div
        className={`${
          mobileChatOpen ? "hidden md:flex" : "flex"
        } w-full md:w-72 flex-shrink-0 flex-col border-r border-border bg-card`}>
        <div className="p-4 border-b border-border">
          <h2 className="font-extrabold text-foreground mb-3">Mesajlar</h2>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
            <Search size={14} className="text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Konuşmaları ara..."
              className="flex-1 bg-transparent text-sm outline-none min-w-0"
            />
          </div>
          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConv ? (
            <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
              Konuşmalar yükleniyor...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-sm font-semibold text-foreground">Henüz eşleşmen yok</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Beceri seçerek eşleştiğin kişiler burada görünecek.
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Aramana uygun konuşma bulunamadı.
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isOnline = onlinePeerIds.has(conversation.id);

              return (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-all border-b border-border/50 ${
                    activeConv?.id === conversation.id
                      ? "bg-primary/5 border-l-2 border-l-primary"
                      : ""
                  }`}>
                  <div className="relative flex-shrink-0">
                    <img
                      src={conversation.avatar}
                      alt={conversation.name}
                      className="w-11 h-11 rounded-xl object-cover"
                    />
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate block">
                        {conversation.name}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{conversation.time}</span>
                        {conversation.unreadCount > 0 && (
                          <span className="text-[10px] min-w-[18px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs truncate block mt-0.5 ${
                        conversation.unreadCount > 0
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                      }`}>
                      {conversation.lastMsg}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {activeConv ? (
        <div
          className={`${
            mobileChatOpen ? "flex" : "hidden md:flex"
          } flex-1 min-w-0 flex-col bg-background`}>
          <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-border bg-card">
            <button
              type="button"
              onClick={() => setMobileChatOpen(false)}
              className="md:hidden p-2 -ml-2 rounded-xl hover:bg-muted"
              aria-label="Konuşma listesine dön">
              <ArrowLeft size={18} />
            </button>
            <img
              src={activeConv.avatar}
              alt={activeConv.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div>
              <div className="font-bold text-foreground">{activeConv.name}</div>
              <div className="text-xs text-muted-foreground">
                {onlinePeerIds.has(activeConv.id) ? "Çevrimiçi" : "Çevrimdışı"}
              </div>
            </div>
          </div>

          {error && mobileChatOpen && (
            <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700 md:hidden">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground animate-pulse">
                Mesajlar yükleniyor...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center">
                Henüz mesaj yok. İlk mesajı sen gönder!
              </div>
            ) : (
              messages.map((chatMessage) => (
                <motion.div
                  key={chatMessage.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${
                    chatMessage.from === "me" ? "flex-row-reverse" : "flex-row"
                  }`}>
                  {chatMessage.from !== "me" && (
                    <img
                      src={activeConv.avatar}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-sm ${
                      chatMessage.from === "me" ? "items-end" : "items-start"
                    } flex flex-col`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                        chatMessage.from === "me"
                          ? "text-white rounded-br-sm"
                          : "bg-card border border-border text-foreground rounded-bl-sm"
                      }`}
                      style={chatMessage.from === "me" ? { background: "var(--sb-gradient)" } : {}}>
                      {chatMessage.text}
                    </div>
                    <div
                      className={`flex items-center gap-1 mt-1 ${
                        chatMessage.from === "me" ? "flex-row-reverse" : ""
                      }`}>
                      <span className="text-xs text-muted-foreground">{chatMessage.time}</span>
                      {chatMessage.from === "me" &&
                        (chatMessage.isRead ? (
                          <CheckCheck size={12} className="text-primary" aria-label="Okundu" />
                        ) : (
                          <Check size={12} className="text-muted-foreground" aria-label="Gönderildi" />
                        ))}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 sm:p-4 border-t border-border bg-card">
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
                disabled={sending}
                placeholder="Bir mesaj yazın..."
                rows={1}
                className="w-full px-4 py-2.5 rounded-2xl border border-border bg-muted text-sm text-foreground outline-none resize-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!message.trim() || sending}
                className="p-2.5 rounded-xl text-white transition-all hover:scale-105 flex-shrink-0 disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: "var(--sb-gradient)" }}
                aria-label="Mesaj gönder">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground bg-background text-center px-6">
          {conversations.length > 0
            ? "Sohbete başlamak için sol menüden birini seçin."
            : "Bir beceri eşleşmesi oluşturduğunda burada mesajlaşabilirsiniz."}
        </div>
      )}
    </div>
  );
}
