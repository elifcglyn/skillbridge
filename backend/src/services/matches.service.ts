import { getPrismaClient } from "../lib/prisma.js";

type GetAiPicksParams = {
  userId: string;
  limit?: number;
};

type AiPickRow = {
  id: string;
  user_id: string;
  matched_user_id: string;
  skill_name: string;
  matched_skill_name: string;
  status: string;
  match_score: number;
  distance_km: unknown;
  created_at: Date;
};

function normalizeLimit(limit?: number) {
  if (!limit) {
    return 10;
  }

  return Math.min(Math.max(limit, 1), 50);
}

export async function getAiPicks({ userId, limit }: GetAiPicksParams) {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);

  const matches = await prisma.$queryRaw<AiPickRow[]>`
    SELECT
      id,
      user_id,
      matched_user_id,
      skill_name,
      matched_skill_name,
      status,
      match_score,
      distance_km,
      created_at
    FROM public.matches
    WHERE user_id::text = ${userId}
       OR matched_user_id::text = ${userId}
    ORDER BY match_score DESC, created_at DESC
    LIMIT ${take};
  `;

  return matches.map((match) => {
    const isCurrentUserOwner = match.user_id === userId;

    return {
      matchId: match.id,
      userId: match.user_id,
      matchedUserId: match.matched_user_id,
      otherUserId: isCurrentUserOwner ? match.matched_user_id : match.user_id,
      skillName: match.skill_name,
      matchedSkillName: match.matched_skill_name,
      status: match.status,
      matchScore: match.match_score,
      distanceKm: match.distance_km?.toString() ?? null,
      createdAt: match.created_at,
    };
  });
}