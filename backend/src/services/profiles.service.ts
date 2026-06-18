import { getPrismaClient } from "../lib/prisma.js";

export type ProfilePayload = {
  userId: string;
  firstName?: string;
  lastName?: string;
  university?: string;
  department?: string;
  bio?: string;
  teaches?: string[];
  learns?: string[];
  profilePublic?: boolean;
  avatarUrl?: string | null;
};

type ProfileRow = {
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
  profile_public: boolean | null;
  skill_points: number | null;
  coin_balance: number;
  created_at: Date;
};

function cleanText(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableText(value?: string | null) {
  if (value === null) return null;
  const cleaned = cleanText(value);
  return cleaned || null;
}

function cleanSkillList(value?: string[]) {
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeProfile(row: ProfileRow) {
  const fullName = row.full_name?.trim()
    || [row.first_name, row.last_name].filter(Boolean).join(" ").trim()
    || "SkillBridge Kullanıcısı";

  return {
    id: row.id,
    fullName,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    avatarUrl: row.avatar_url,
    university: row.university ?? "",
    department: row.department ?? "",
    bio: row.bio ?? "",
    teaches: row.teaches ?? [],
    learns: row.learns ?? [],
    profilePublic: row.profile_public ?? true,
    skillPoints: row.skill_points ?? 0,
    coinBalance: row.coin_balance,
    createdAt: row.created_at,
  };
}

export async function getProfile(userId: string) {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRaw<ProfileRow[]>`
    SELECT
      id,
      full_name,
      first_name,
      last_name,
      avatar_url,
      university,
      department,
      bio,
      teaches,
      learns,
      profile_public,
      skill_points,
      coin_balance,
      created_at
    FROM public.profiles
    WHERE id::text = ${userId}
    LIMIT 1;
  `;

  return rows[0] ? normalizeProfile(rows[0]) : null;
}

export async function upsertProfile(payload: ProfilePayload) {
  const prisma = getPrismaClient();
  const firstName = cleanText(payload.firstName);
  const lastName = cleanText(payload.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || null;
  const teaches = cleanSkillList(payload.teaches);
  const learns = cleanSkillList(payload.learns);
  const profilePublic = payload.profilePublic ?? true;

  const rows = await prisma.$queryRaw<ProfileRow[]>`
    INSERT INTO public.profiles (
      id,
      full_name,
      first_name,
      last_name,
      avatar_url,
      university,
      department,
      bio,
      teaches,
      learns,
      profile_public
    )
    VALUES (
      ${payload.userId}::uuid,
      ${fullName},
      ${firstName || null},
      ${lastName || null},
      ${cleanNullableText(payload.avatarUrl)},
      ${cleanNullableText(payload.university)},
      ${cleanNullableText(payload.department)},
      ${cleanNullableText(payload.bio)},
      ${teaches}::text[],
      ${learns}::text[],
      ${profilePublic}
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      avatar_url = coalesce(EXCLUDED.avatar_url, public.profiles.avatar_url),
      university = EXCLUDED.university,
      department = EXCLUDED.department,
      bio = EXCLUDED.bio,
      teaches = EXCLUDED.teaches,
      learns = EXCLUDED.learns,
      profile_public = EXCLUDED.profile_public
    RETURNING
      id,
      full_name,
      first_name,
      last_name,
      avatar_url,
      university,
      department,
      bio,
      teaches,
      learns,
      profile_public,
      skill_points,
      coin_balance,
      created_at;
  `;

  return normalizeProfile(rows[0]);
}
