import { getPrismaClient } from "../lib/prisma.js";
import { createNotificationSafely } from "./notifications.service.js";
import {
  calculateMatchScore,
  compareMatchCandidates,
  type MatchScoreProfile,
} from "./match-score.js";

type GetAiPicksParams = {
  userId: string;
  limit?: number;
  skillName?: string;
};

type SelectMatchParams = {
  userId: string;
  otherUserId: string;
  skillName: string;
};

type SelectedMatchRow = {
  id: string;
  user_id: string | null;
  matched_user_id: string | null;
  skill_name: string | null;
  status: string | null;
  match_score: number | null;
  was_created: boolean;
};

type CalendarMatchRow = {
  id: string;
  other_user_id: string;
  skill_name: string | null;
  status: string | null;
  match_score: number | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
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
  other_bio: string | null;
  other_teaches: string[] | null;
  other_learns: string[] | null;
  other_skill_points: number | null;
};

type ProfilePickRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  university: string | null;
  department: string | null;
  bio: string | null;
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

export async function getAiPicks({
  userId,
  limit,
  skillName,
}: GetAiPicksParams) {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);
  const requestedSkill = skillName?.trim();

  const [matches, profiles, currentProfiles] = await Promise.all([
    prisma.$queryRaw<AiPickRow[]>`
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
        profiles.bio AS other_bio,
        coalesce(
          nullif(profiles.teaches, ARRAY[]::text[]),
          ARRAY(
            SELECT btrim(user_skills.name)
            FROM public.user_skills
            WHERE user_skills.user_id = profiles.id
              AND btrim(coalesce(user_skills.name, '')) <> ''
              AND (
                lower(coalesce(user_skills.kind, '')) IN ('teach', 'teaches')
              )
            ORDER BY user_skills.sort_order, user_skills.created_at
          )
        ) AS other_teaches,
        coalesce(
          nullif(profiles.learns, ARRAY[]::text[]),
          ARRAY(
            SELECT btrim(user_skills.name)
            FROM public.user_skills
            WHERE user_skills.user_id = profiles.id
              AND btrim(coalesce(user_skills.name, '')) <> ''
              AND (
                lower(coalesce(user_skills.kind, '')) IN ('learn', 'learns')
              )
            ORDER BY user_skills.sort_order, user_skills.created_at
          )
        ) AS other_learns,
        profiles.skill_points AS other_skill_points
      FROM public.matches
      LEFT JOIN public.profiles
        ON profiles.id = CASE
          WHEN matches.user_id::text = ${userId} THEN matches.matched_user_id
          ELSE matches.user_id
        END
      WHERE user_id::text = ${userId}
         OR matched_user_id::text = ${userId}
      ORDER BY created_at DESC NULLS LAST
      LIMIT ${take};
    `,
    prisma.$queryRaw<ProfilePickRow[]>`
      SELECT
        id,
        full_name,
        first_name,
        last_name,
        avatar_url,
        university,
        department,
        bio,
        coalesce(
          nullif(profiles.teaches, ARRAY[]::text[]),
          ARRAY(
            SELECT btrim(user_skills.name)
            FROM public.user_skills
            WHERE user_skills.user_id = profiles.id
              AND btrim(coalesce(user_skills.name, '')) <> ''
              AND (
                lower(coalesce(user_skills.kind, '')) IN ('teach', 'teaches')
              )
            ORDER BY user_skills.sort_order, user_skills.created_at
          )
        ) AS teaches,
        coalesce(
          nullif(profiles.learns, ARRAY[]::text[]),
          ARRAY(
            SELECT btrim(user_skills.name)
            FROM public.user_skills
            WHERE user_skills.user_id = profiles.id
              AND btrim(coalesce(user_skills.name, '')) <> ''
              AND (
                lower(coalesce(user_skills.kind, '')) IN ('learn', 'learns')
              )
            ORDER BY user_skills.sort_order, user_skills.created_at
          )
        ) AS learns,
        skill_points
      FROM public.profiles
      WHERE id::text <> ${userId}
        AND coalesce(profile_public, true) = true
      ORDER BY coalesce(skill_points, 0) DESC, created_at DESC
      LIMIT 100;
    `,
    prisma.$queryRaw<ProfilePickRow[]>`
      SELECT
        id,
        full_name,
        first_name,
        last_name,
        avatar_url,
        university,
        department,
        bio,
        coalesce(
          nullif(profiles.teaches, ARRAY[]::text[]),
          ARRAY(
            SELECT btrim(user_skills.name)
            FROM public.user_skills
            WHERE user_skills.user_id = profiles.id
              AND btrim(coalesce(user_skills.name, '')) <> ''
              AND (
                lower(coalesce(user_skills.kind, '')) IN ('teach', 'teaches')
              )
            ORDER BY user_skills.sort_order, user_skills.created_at
          )
        ) AS teaches,
        coalesce(
          nullif(profiles.learns, ARRAY[]::text[]),
          ARRAY(
            SELECT btrim(user_skills.name)
            FROM public.user_skills
            WHERE user_skills.user_id = profiles.id
              AND btrim(coalesce(user_skills.name, '')) <> ''
              AND (
                lower(coalesce(user_skills.kind, '')) IN ('learn', 'learns')
              )
            ORDER BY user_skills.sort_order, user_skills.created_at
          )
        ) AS learns,
        skill_points
      FROM public.profiles
      WHERE id::text = ${userId}
      LIMIT 1;
    `,
  ]);

  const currentProfile = currentProfiles[0];
  const currentScoreProfile: MatchScoreProfile = {
    teaches: currentProfile?.teaches,
    learns: requestedSkill ? [requestedSkill] : currentProfile?.learns,
    university: currentProfile?.university,
    department: currentProfile?.department,
    bio: currentProfile?.bio,
    skillPoints: currentProfile?.skill_points,
  };

  const persistedPicks = matches.map((match) => {
      const isCurrentUserOwner = match.user_id === userId;
      const otherUserId = match.other_user_id ?? (isCurrentUserOwner ? match.matched_user_id : match.user_id);
      const score = calculateMatchScore(currentScoreProfile, {
        teaches: match.other_teaches,
        learns: match.other_learns,
        university: match.other_university,
        department: match.other_department,
        bio: match.other_bio,
        skillPoints: match.other_skill_points,
      });
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
        bio: match.other_bio,
        teaches: normalizeSkillList(match.other_teaches),
        learns: normalizeSkillList(match.other_learns),
        skillName: score.teachOverlap[0] ?? match.skill_name ?? "",
        matchedSkillName: score.learnOverlap[0] ?? match.matched_skill_name ?? "",
        status: match.status ?? "recommended",
        matchScore: score.score,
        commonSkillCount: score.commonSkillCount,
        matchType: "skill" as const,
        distanceKm: match.distance_km?.toString() ?? null,
        createdAt: match.created_at,
      };
    })
    .filter((pick) =>
      Boolean(
        pick.otherUserId
        && pick.otherUserId !== userId
      ),
    );

  const persistedPeerIds = new Set(
    persistedPicks
      .map((pick) => pick.otherUserId)
      .filter((peerId): peerId is string => Boolean(peerId)),
  );

  const recommendedPicks = profiles
    .filter((profile) => !persistedPeerIds.has(profile.id))
    .map((profile) => {
      const teaches = normalizeSkillList(profile.teaches);
      const learns = normalizeSkillList(profile.learns);
      const score = calculateMatchScore(currentScoreProfile, {
        teaches,
        learns,
        university: profile.university,
        department: profile.department,
        bio: profile.bio,
        skillPoints: profile.skill_points,
      });
      return {
        matchId: `profile-${profile.id}`,
        userId,
        matchedUserId: profile.id,
        otherUserId: profile.id,
        name: getProfileName(profile),
        avatarUrl: profile.avatar_url,
        university: profile.university,
        department: profile.department,
        bio: profile.bio,
        teaches,
        learns,
        skillName: score.teachOverlap[0] ?? "",
        matchedSkillName: score.learnOverlap[0] ?? "",
        status: "recommended",
        matchScore: score.score,
        commonSkillCount: score.commonSkillCount,
        matchType: "skill" as const,
        distanceKm: null,
        createdAt: null,
      };
    })
    .sort(compareMatchCandidates);

  const allPicks = [...persistedPicks, ...recommendedPicks];
  const skillMatches = allPicks
    .filter((pick) => pick.matchScore > 0)
    .sort(compareMatchCandidates);

  return skillMatches.slice(0, take);
}

export async function selectMatch({
  userId,
  otherUserId,
  skillName,
}: SelectMatchParams) {
  const prisma = getPrismaClient();
  const cleanedSkillName = skillName.trim();

  const targetProfiles = await prisma.$queryRaw<ProfilePickRow[]>`
    SELECT
      id,
      full_name,
      first_name,
      last_name,
      avatar_url,
      university,
      department,
      bio,
      coalesce(
        nullif(profiles.teaches, ARRAY[]::text[]),
        ARRAY(
          SELECT btrim(user_skills.name)
          FROM public.user_skills
          WHERE user_skills.user_id = profiles.id
            AND btrim(coalesce(user_skills.name, '')) <> ''
            AND (
              lower(coalesce(user_skills.kind, '')) IN ('teach', 'teaches')
            )
          ORDER BY user_skills.sort_order, user_skills.created_at
        )
      ) AS teaches,
      coalesce(
        nullif(profiles.learns, ARRAY[]::text[]),
        ARRAY(
          SELECT btrim(user_skills.name)
          FROM public.user_skills
          WHERE user_skills.user_id = profiles.id
            AND btrim(coalesce(user_skills.name, '')) <> ''
            AND (
              lower(coalesce(user_skills.kind, '')) IN ('learn', 'learns')
            )
          ORDER BY user_skills.sort_order, user_skills.created_at
        )
      ) AS learns,
      skill_points
    FROM public.profiles
    WHERE id::text = ${otherUserId}
      AND id::text <> ${userId}
      AND (
        coalesce(profile_public, true) = true
        OR EXISTS (
          SELECT 1
          FROM public.matches
          WHERE (
              user_id::text = ${userId}
              AND matched_user_id::text = ${otherUserId}
            )
            OR (
              user_id::text = ${otherUserId}
              AND matched_user_id::text = ${userId}
            )
        )
      )
    LIMIT 1;
  `;

  if (targetProfiles.length === 0) {
    throw new Error("MATCH_TARGET_NOT_AVAILABLE");
  }

  const [currentProfile] = await prisma.$queryRaw<ProfilePickRow[]>`
    SELECT
      id,
      full_name,
      first_name,
      last_name,
      avatar_url,
      university,
      department,
      bio,
      coalesce(
        nullif(profiles.teaches, ARRAY[]::text[]),
        ARRAY(
          SELECT btrim(user_skills.name)
          FROM public.user_skills
          WHERE user_skills.user_id = profiles.id
            AND btrim(coalesce(user_skills.name, '')) <> ''
            AND (
              lower(coalesce(user_skills.kind, '')) IN ('teach', 'teaches')
            )
          ORDER BY user_skills.sort_order, user_skills.created_at
        )
      ) AS teaches,
      coalesce(
        nullif(profiles.learns, ARRAY[]::text[]),
        ARRAY(
          SELECT btrim(user_skills.name)
          FROM public.user_skills
          WHERE user_skills.user_id = profiles.id
            AND btrim(coalesce(user_skills.name, '')) <> ''
            AND (
              lower(coalesce(user_skills.kind, '')) IN ('learn', 'learns')
            )
          ORDER BY user_skills.sort_order, user_skills.created_at
        )
      ) AS learns,
      skill_points
    FROM public.profiles
    WHERE id::text = ${userId}
    LIMIT 1;
  `;

  const targetProfile = targetProfiles[0];
  const currentScoreProfile = {
    teaches: currentProfile?.teaches,
    learns: [cleanedSkillName],
    university: currentProfile?.university,
    department: currentProfile?.department,
    bio: currentProfile?.bio,
    skillPoints: currentProfile?.skill_points,
  };
  const targetScoreProfile = {
    teaches: targetProfile.teaches,
    learns: targetProfile.learns,
    university: targetProfile.university,
    department: targetProfile.department,
    bio: targetProfile.bio,
    skillPoints: targetProfile.skill_points,
  };
  const normalizedScore = calculateMatchScore(
    currentScoreProfile,
    targetScoreProfile,
  ).score;

  if (normalizedScore === 0) {
    throw new Error("MATCH_SKILL_NOT_AVAILABLE");
  }

  const rows = await prisma.$queryRaw<SelectedMatchRow[]>`
    WITH existing_match AS (
      SELECT id
      FROM public.matches
      WHERE (
          user_id::text = ${userId}
          AND matched_user_id::text = ${otherUserId}
        )
        OR (
          user_id::text = ${otherUserId}
          AND matched_user_id::text = ${userId}
        )
      ORDER BY created_at DESC NULLS LAST
      LIMIT 1
    ),
    updated_match AS (
      UPDATE public.matches
      SET
        skill_name = ${cleanedSkillName},
        matched_skill_name = ${cleanedSkillName},
        match_score = ${normalizedScore},
        status = CASE
          WHEN lower(coalesce(status::text, 'recommended')) IN ('rejected', 'declined', 'cancelled')
            THEN 'recommended'
          ELSE status
        END
      WHERE id = (SELECT id FROM existing_match)
      RETURNING
        id,
        user_id,
        matched_user_id,
        skill_name,
        status::text,
        match_score,
        false AS was_created
    ),
    inserted_match AS (
      INSERT INTO public.matches (
        user_id,
        matched_user_id,
        skill_name,
        matched_skill_name,
        match_score,
        status
      )
      SELECT
        ${userId}::uuid,
        ${otherUserId}::uuid,
        ${cleanedSkillName},
        ${cleanedSkillName},
        ${normalizedScore},
        'recommended'
      WHERE NOT EXISTS (SELECT 1 FROM updated_match)
      RETURNING
        id,
        user_id,
        matched_user_id,
        skill_name,
        status::text,
        match_score,
        true AS was_created
    )
    SELECT * FROM updated_match
    UNION ALL
    SELECT * FROM inserted_match
    LIMIT 1;
  `;

  const match = rows[0];

  if (match.was_created) {
    await createNotificationSafely({
      userId: otherUserId,
      actorId: userId,
      type: "MATCH",
      title: "Yeni beceri eşleşmesi",
      message: `${cleanedSkillName} becerisi için yeni bir eşleşmen var.`,
      metadata: {
        matchId: match.id,
        peerId: userId,
        skillName: cleanedSkillName,
      },
      relatedUrl: "matches",
    });
  }

  return {
    matchId: match.id,
    otherUserId,
    skillName: match.skill_name ?? cleanedSkillName,
    status: match.status ?? "recommended",
    matchScore: match.match_score ?? normalizedScore,
  };
}

export async function listSelectedMatches(userId: string) {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRaw<CalendarMatchRow[]>`
    WITH matched_rows AS (
      SELECT
        matches.id,
        CASE
          WHEN matches.user_id::text = ${userId}
            THEN matches.matched_user_id
          ELSE matches.user_id
        END AS other_user_id,
        coalesce(nullif(matches.skill_name, ''), nullif(matches.matched_skill_name, ''), 'Beceri paylaşımı') AS skill_name,
        matches.status::text AS status,
        matches.match_score,
        matches.created_at
      FROM public.matches
      WHERE (
          matches.user_id::text = ${userId}
          OR matches.matched_user_id::text = ${userId}
        )
        AND lower(coalesce(matches.status::text, 'recommended'))
          NOT IN ('rejected', 'declined', 'cancelled')
    )
    SELECT DISTINCT ON (matched_rows.other_user_id)
      matched_rows.id,
      matched_rows.other_user_id,
      matched_rows.skill_name,
      matched_rows.status,
      matched_rows.match_score,
      profiles.full_name,
      profiles.first_name,
      profiles.last_name,
      profiles.avatar_url
    FROM matched_rows
    JOIN public.profiles ON profiles.id = matched_rows.other_user_id
    ORDER BY matched_rows.other_user_id, matched_rows.created_at DESC NULLS LAST;
  `;

  return rows.map((row) => ({
    matchId: row.id,
    otherUserId: row.other_user_id,
    name: getProfileName(row),
    avatarUrl: row.avatar_url,
    skillName: row.skill_name ?? "Beceri paylaşımı",
    status: row.status ?? "recommended",
    matchScore: row.match_score ?? 0,
  }));
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
      NULL::text AS other_bio,
      NULL::text[] AS other_teaches,
      NULL::text[] AS other_learns,
      NULL::integer AS other_skill_points
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
