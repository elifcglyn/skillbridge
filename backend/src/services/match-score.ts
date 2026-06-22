export type MatchScoreProfile = {
  teaches?: string[] | null;
  learns?: string[] | null;
  university?: string | null;
  department?: string | null;
  bio?: string | null;
  skillPoints?: number | null;
};

export type MatchScoreResult = {
  score: number;
  teachOverlap: string[];
  learnOverlap: string[];
  commonSkillCount: number;
};

export type RankedMatchCandidate = {
  matchScore: number;
  commonSkillCount?: number;
  name?: string;
};

function normalizeText(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeSkillList(value?: string[] | null) {
  const uniqueSkills = new Map<string, string>();

  for (const skill of value ?? []) {
    if (typeof skill !== "string") continue;

    const cleanedSkill = skill.trim();
    const key = normalizeText(cleanedSkill);
    if (key && !uniqueSkills.has(key)) {
      uniqueSkills.set(key, cleanedSkill);
    }
  }

  return [...uniqueSkills.values()];
}

function skillsMatch(left: string, right: string) {
  const leftKey = normalizeText(left);
  const rightKey = normalizeText(right);

  if (!leftKey || !rightKey) return false;
  if (leftKey === rightKey) return true;

  const leftTokens = leftKey.split(" ");
  const rightTokens = rightKey.split(" ");
  const [shorterTokens, longerTokens] = leftTokens.length <= rightTokens.length
    ? [leftTokens, rightTokens]
    : [rightTokens, leftTokens];

  if (shorterTokens.length === 1 && shorterTokens[0].length < 3) {
    return false;
  }

  const longerTokenSet = new Set(longerTokens);
  return shorterTokens.every((token) => longerTokenSet.has(token));
}

function findSkillOverlap(source: string[], targets: string[]) {
  return source.filter((skill) =>
    targets.some((targetSkill) => skillsMatch(skill, targetSkill)),
  );
}

function valuesMatch(left?: string | null, right?: string | null) {
  const leftKey = normalizeText(left);
  return Boolean(leftKey && leftKey === normalizeText(right));
}

export function compareMatchCandidates(
  left: RankedMatchCandidate,
  right: RankedMatchCandidate,
) {
  return right.matchScore - left.matchScore
    || (right.commonSkillCount ?? 0) - (left.commonSkillCount ?? 0)
    || (left.name ?? "").localeCompare(right.name ?? "", "tr");
}

export function calculateMatchScore(
  currentUser: MatchScoreProfile,
  candidate: MatchScoreProfile,
): MatchScoreResult {
  const currentLearns = normalizeSkillList(currentUser.learns);
  const currentTeaches = normalizeSkillList(currentUser.teaches);
  const candidateTeaches = normalizeSkillList(candidate.teaches);
  const candidateLearns = normalizeSkillList(candidate.learns);

  const teachOverlap = findSkillOverlap(candidateTeaches, currentLearns);
  const learnOverlap = findSkillOverlap(candidateLearns, currentTeaches);
  const commonSkillCount = teachOverlap.length + learnOverlap.length;

  if (teachOverlap.length === 0) {
    return { score: 0, teachOverlap, learnOverlap, commonSkillCount };
  }

  const teachingCoverage = teachOverlap.length / currentLearns.length;
  const learningCoverage = candidateLearns.length > 0
    ? learnOverlap.length / candidateLearns.length
    : 0;

  const skillScore = teachingCoverage * 70 + learningCoverage * 20;
  const universityScore = valuesMatch(
    currentUser.university,
    candidate.university,
  ) ? 5 : 0;
  const departmentScore = valuesMatch(
    currentUser.department,
    candidate.department,
  ) ? 2 : 0;
  const candidateSkillPoints = Number(candidate.skillPoints ?? 0);
  const activityScore = Number.isFinite(candidateSkillPoints)
    ? Math.min(3, Math.max(0, Math.round(candidateSkillPoints / 200)))
    : 0;

  return {
    score: Math.min(
      100,
      Math.max(
        0,
        Math.round(
          skillScore + universityScore + departmentScore + activityScore,
        ),
      ),
    ),
    teachOverlap,
    learnOverlap,
    commonSkillCount,
  };
}
