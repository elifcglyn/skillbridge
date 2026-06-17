import { getPrismaClient } from "../lib/prisma.js";

type GetMessagesHistoryParams = {
  userId: string;
  otherUserId: string;
  limit?: number;
};

type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: Date;
};

function normalizeLimit(limit?: number) {
  if (!limit) {
    return 50;
  }

  return Math.min(Math.max(Math.floor(limit), 1), 100);
}

export async function getMessagesHistory({
  userId,
  otherUserId,
  limit,
}: GetMessagesHistoryParams) {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);

  const messages = await prisma.$queryRaw<MessageRow[]>`
    SELECT
      id,
      sender_id,
      receiver_id,
      content,
      is_read,
      created_at
    FROM public.messages
    WHERE (
        sender_id::text = ${userId}
        AND receiver_id::text = ${otherUserId}
      )
      OR (
        sender_id::text = ${otherUserId}
        AND receiver_id::text = ${userId}
      )
    ORDER BY created_at ASC
    LIMIT ${take};
  `;

  return messages.map((message) => ({
    id: message.id,
    senderId: message.sender_id,
    receiverId: message.receiver_id,
    content: message.content,
    isRead: message.is_read,
    createdAt: message.created_at,
  }));
}