import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateMatchScore,
  compareMatchCandidates,
} from "./match-score.js";

test("beceri kesişimi yoksa bonus verileri olsa bile skor sıfırdır", () => {
  const result = calculateMatchScore(
    {
      learns: ["Diksiyon"],
      teaches: ["Excel"],
      university: "Ankara Üniversitesi",
      department: "İletişim",
    },
    {
      teaches: ["İngilizce", "Python"],
      learns: ["Excel"],
      university: "Ankara Üniversitesi",
      department: "İletişim",
      skillPoints: 1_000,
    },
  );

  assert.equal(result.score, 0);
  assert.deepEqual(result.teachOverlap, []);
});

test("ana beceri kesişimi olan aday sıfırdan büyük skor alır", () => {
  const result = calculateMatchScore(
    { learns: ["İngilizce"] },
    { teaches: ["İngilizce", "Python"] },
  );

  assert.equal(result.score, 70);
  assert.equal(result.commonSkillCount, 1);
});

test("Türkçe karakterler, büyük-küçük harf ve boşluklar güvenli karşılaştırılır", () => {
  const result = calculateMatchScore(
    { learns: ["  İNGİLİZCE "] },
    { teaches: ["ingilizce"] },
  );

  assert.equal(result.score, 70);
  assert.deepEqual(result.teachOverlap, ["ingilizce"]);
});

test("beceri adı varyasyonları kelime bazında eşleşir", () => {
  assert.equal(
    calculateMatchScore(
      { learns: ["İngilizce"] },
      { teaches: ["Akademik İngilizce"] },
    ).score,
    70,
  );
  assert.equal(
    calculateMatchScore(
      { learns: ["UI/UX Tasarım"] },
      { teaches: ["UI Tasarım"] },
    ).score,
    70,
  );
  assert.equal(
    calculateMatchScore(
      { learns: ["React"] },
      { teaches: ["React.js"] },
    ).score,
    70,
  );
});

test("benzer görünen ancak farklı beceri kelimeleri eşleşmez", () => {
  assert.equal(
    calculateMatchScore(
      { learns: ["Java"] },
      { teaches: ["JavaScript"] },
    ).score,
    0,
  );
});

test("adayların gerçek beceri ve bonus verileri farklı yüzdeler üretir", () => {
  const currentUser = {
    learns: ["İngilizce", "Python"],
    teaches: ["Diksiyon"],
    university: "Ankara Üniversitesi",
    department: "İletişim",
  };

  const partialMatch = calculateMatchScore(currentUser, {
    teaches: ["İngilizce"],
  });
  const strongMatch = calculateMatchScore(currentUser, {
    teaches: ["İngilizce", "Python"],
    learns: ["Diksiyon"],
    university: "Ankara Üniversitesi",
    department: "İletişim",
    skillPoints: 600,
  });

  assert.equal(partialMatch.score, 35);
  assert.equal(strongMatch.score, 100);
  assert.ok(strongMatch.score > partialMatch.score);
});

test("eşit skorda daha fazla ortak becerisi olan aday üstte sıralanır", () => {
  const candidates = [
    { name: "Bir Ortak", matchScore: 70, commonSkillCount: 1 },
    { name: "İki Ortak", matchScore: 70, commonSkillCount: 2 },
  ];

  candidates.sort(compareMatchCandidates);

  assert.equal(candidates[0]?.name, "İki Ortak");
});

test("boş veya eksik beceri listeleri hata üretmeden sıfır döndürür", () => {
  assert.equal(calculateMatchScore({}, {}).score, 0);
  assert.equal(
    calculateMatchScore(
      { learns: null, teaches: undefined },
      { teaches: null, learns: undefined },
    ).score,
    0,
  );
});
