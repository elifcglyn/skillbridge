export type MatchScoreProfile = {
  teaches?: string[] | null;
  learns?: string[] | null;
  university?: string | null;
  department?: string | null;
  skillPoints?: number | null;
};

export type MatchScoreResult = {
  score: number;
  teachOverlap: string[];
  learnOverlap: string[];
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

  const shorterLength = Math.min(leftKey.length, rightKey.length);
  return shorterLength >= 4
    && (leftKey.includes(rightKey) || rightKey.includes(leftKey));
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

  if (teachOverlap.length === 0) {
    return { score: 0, teachOverlap, learnOverlap };
  }

  const teachingCoverage = teachOverlap.length / currentLearns.length;
  const learningCoverage = candidateLearns.length > 0
    ? learnOverlap.length / candidateLearns.length
    : 0;

  const skillScore = teachingCoverage * 55 + learningCoverage * 35;
  const universityScore = valuesMatch(
    currentUser.university,
    candidate.university,
  ) ? 3 : 0;
  const departmentScore = valuesMatch(
    currentUser.department,
    candidate.department,
  ) ? 2 : 0;
  const activityScore = Math.min(
    5,
    Math.max(0, Math.round(Number(candidate.skillPoints ?? 0) / 200)),
  );

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
  };
}
