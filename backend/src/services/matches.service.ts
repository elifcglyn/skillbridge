import { getPrismaClient } from "../lib/prisma.js";

type GetAiPicksParams = {
  userId: string;
  limit?: number;
};

type AiPickRow = {
  id: string;
  user_id: string | null;
  matched_user_id: string | null;
  skill_name: string | null;
  matched_skill_name: string | null;
  status: string | null;
  match_score: number | null;
  distance_km: unknown;
  created_at: Date | null;
  other_user_id: string | null;
  other_full_name: string | null;
  other_first_name: string | null;
  other_last_name: string | null;
  other_avatar_url: string | null;
  other_university: string | null;
  other_department: string | null;
  other_teaches: string[] | null;
  other_learns: string[] | null;
};

type ProfilePickRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  university: string | null;
  department: string | null;
  teaches: string[] | null;
  learns: string[] | null;
  skill_points: number | null;
};

function normalizeLimit(limit?: number) {
  if (!limit) {
    return 10;
  }

  return Math.min(Math.max(limit, 1), 50);
}

function normalizeSkillList(value: string[] | null | undefined) {
  return (value ?? [])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSkillKey(value: string) {
  return value.toLocaleLowerCase("tr-TR");
}

function getProfileName(profile: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}) {
  const explicitName = profile.full_name?.trim();
  if (explicitName) return explicitName;

  const composedName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return composedName || "SkillBridge Kullanıcısı";
}

export async function getAiPicks({ userId, limit }: GetAiPicksParams) {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);

  const matches = await prisma.$queryRaw<AiPickRow[]>`
    SELECT
      matches.id,
      matches.user_id,
      matches.matched_user_id,
      matches.skill_name,
      matches.matched_skill_name,
      matches.status,
      matches.match_score,
      matches.distance_km,
      matches.created_at,
      CASE
        WHEN matches.user_id::text = ${userId} THEN matches.matched_user_id
        ELSE matches.user_id
      END AS other_user_id,
      profiles.full_name AS other_full_name,
      profiles.first_name AS other_first_name,
      profiles.last_name AS other_last_name,
      profiles.avatar_url AS other_avatar_url,
      profiles.university AS other_university,
      profiles.department AS other_department,
      profiles.teaches AS other_teaches,
      profiles.learns AS other_learns
    FROM public.matches
    LEFT JOIN public.profiles
      ON profiles.id = CASE
        WHEN matches.user_id::text = ${userId} THEN matches.matched_user_id
        ELSE matches.user_id
      END
    WHERE user_id::text = ${userId}
       OR matched_user_id::text = ${userId}
    ORDER BY match_score DESC NULLS LAST, created_at DESC NULLS LAST
    LIMIT ${take};
  `;

  if (matches.length > 0) {
    return matches.map((match) => {
      const isCurrentUserOwner = match.user_id === userId;
      const otherUserId = match.other_user_id ?? (isCurrentUserOwner ? match.matched_user_id : match.user_id);

      return {
        matchId: match.id,
        userId: match.user_id,
        matchedUserId: match.matched_user_id,
        otherUserId,
        name: getProfileName({
          full_name: match.other_full_name,
          first_name: match.other_first_name,
          last_name: match.other_last_name,
        }),
        avatarUrl: match.other_avatar_url,
        university: match.other_university,
        department: match.other_department,
        teaches: normalizeSkillList(match.other_teaches),
        learns: normalizeSkillList(match.other_learns),
        skillName: match.skill_name ?? "",
        matchedSkillName: match.matched_skill_name ?? "",
        status: match.status ?? "recommended",
        matchScore: match.match_score ?? 0,
        distanceKm: match.distance_km?.toString() ?? null,
        createdAt: match.created_at,
      };
    });
  }

  const profiles = await prisma.$queryRaw<ProfilePickRow[]>`
    SELECT
      id,
      full_name,
      first_name,
      last_name,
      avatar_url,
      university,
      department,
      teaches,
      learns,
      skill_points
    FROM public.profiles
    WHERE id::text <> ${userId}
      AND coalesce(profile_public, true) = true
    ORDER BY coalesce(skill_points, 0) DESC, created_at DESC
    LIMIT 100;
  `;

  const [currentProfile] = await prisma.$queryRaw<ProfilePickRow[]>`
    SELECT
      id,
      full_name,
      first_name,
      last_name,
      avatar_url,
      university,
      department,
      teaches,
      learns,
      skill_points
    FROM public.profiles
    WHERE id::text = ${userId}
    LIMIT 1;
  `;

  const currentLearnKeys = new Set(
    normalizeSkillList(currentProfile?.learns).map(normalizeSkillKey),
  );
  const currentTeachKeys = new Set(
    normalizeSkillList(currentProfile?.teaches).map(normalizeSkillKey),
  );

  return profiles
    .map((profile) => {
      const teaches = normalizeSkillList(profile.teaches);
      const learns = normalizeSkillList(profile.learns);
      const teachOverlap = teaches.filter((skill) => currentLearnKeys.has(normalizeSkillKey(skill)));
      const learnOverlap = learns.filter((skill) => currentTeachKeys.has(normalizeSkillKey(skill)));
      const overlapScore = teachOverlap.length * 24 + learnOverlap.length * 16;
      const activityScore = Math.min(15, Math.round(Number(profile.skill_points ?? 0) / 200));
      const matchScore = Math.min(99, 60 + overlapScore + activityScore);

      return {
        matchId: `profile-${profile.id}`,
        userId,
        matchedUserId: profile.id,
        otherUserId: profile.id,
        name: getProfileName(profile),
        avatarUrl: profile.avatar_url,
        university: profile.university,
        department: profile.department,
        teaches,
        learns,
        skillName: teachOverlap[0] ?? currentProfile?.learns?.[0] ?? "",
        matchedSkillName: learns[0] ?? "",
        status: "recommended",
        matchScore,
        distanceKm: null,
        createdAt: null,
      };
    })
    .sort((left, right) => right.matchScore - left.matchScore || left.name.localeCompare(right.name, "tr"))
    .slice(0, take);
}

export async function getAiPicksLegacy({ userId, limit }: GetAiPicksParams) {
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
      created_at,
      NULL::uuid AS other_user_id,
      NULL::text AS other_full_name,
      NULL::text AS other_first_name,
      NULL::text AS other_last_name,
      NULL::text AS other_avatar_url,
      NULL::text AS other_university,
      NULL::text AS other_department,
      NULL::text[] AS other_teaches,
      NULL::text[] AS other_learns
    FROM public.matches
    WHERE user_id::text = ${userId}
       OR matched_user_id::text = ${userId}
    ORDER BY match_score DESC NULLS LAST, created_at DESC NULLS LAST
    LIMIT ${take};
  `;

  return matches.map((match) => {
    const isCurrentUserOwner = match.user_id === userId;

    return {
      matchId: match.id,
      userId: match.user_id,
      matchedUserId: match.matched_user_id,
      otherUserId: isCurrentUserOwner ? match.matched_user_id : match.user_id,
      skillName: match.skill_name ?? "",
      matchedSkillName: match.matched_skill_name ?? "",
      status: match.status ?? "recommended",
      matchScore: match.match_score ?? 0,
      distanceKm: match.distance_km?.toString() ?? null,
      createdAt: match.created_at,
    };
  });
}
