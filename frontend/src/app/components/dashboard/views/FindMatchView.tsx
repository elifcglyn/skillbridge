import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, MessageSquare, RotateCcw, Search, Sparkles } from "lucide-react";
import { apiGet, withQuery } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const SKILL_OPTIONS = [
  "İngilizce",
  "React",
  "Python",
  "Gitar",
  "UI/UX Tasarım",
  "İstatistik",
  "Fotoğrafçılık",
  "Excel",
  "Matematik",
  "İspanyolca",
];

type Step = "select" | "spinning" | "result";

interface FindMatchViewProps {
  onNavigate: (view: string) => void;
}

type AiPick = {
  matchId: string;
  otherUserId: string;
  name: string;
  avatarUrl: string | null;
  university: string | null;
  teaches: string[];
  learns: string[];
  skillName: string;
  matchScore: number;
};

function avatarFor(name: string, avatarUrl?: string | null) {
  return avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=random&color=fff&size=200`;
}

export function FindMatchView({ onNavigate }: FindMatchViewProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [customSkill, setCustomSkill] = useState("");
  const [me, setMe] = useState({ name: "Sen", avatar: "" });
  const [loading, setLoading] = useState(true);
  const [aiPicks, setAiPicks] = useState<AiPick[]>([]);
  const [matchedUser, setMatchedUser] = useState<AiPick | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAiPicks() {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAiPicks([]);
          return;
        }

        const myName = user.user_metadata?.first_name || "Sen";
        setMe({ name: myName, avatar: avatarFor(myName) });

        const response = await apiGet<{ data: AiPick[] }>(
          withQuery("/api/matches/ai-picks", { userId: user.id, limit: 50 }),
        );
        setAiPicks(response.data ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "AI Picks yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }

    loadAiPicks();
  }, []);

  const otherSuggestions = useMemo(
    () => aiPicks.filter((pick) => pick.otherUserId !== matchedUser?.otherUserId).slice(0, 3),
    [aiPicks, matchedUser?.otherUserId],
  );

  const handleSkillSelect = (skill: string) => {
    const searchTerm = skill.toLocaleLowerCase("tr-TR").trim();
    setSelectedSkill(skill);
    setStep("spinning");

    const found =
      aiPicks.find((pick) =>
        [...pick.teaches, pick.skillName]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase("tr-TR").includes(searchTerm)),
      )
      ?? aiPicks[0]
      ?? null;

    window.setTimeout(() => {
      setMatchedUser(found);
      setStep("result");
    }, 700);
  };

  const reset = () => {
    setStep("select");
    setSelectedSkill(null);
    setMatchedUser(null);
  };

  if (loading) {
    return <div className="p-6 flex justify-center text-muted-foreground animate-pulse h-full items-center">AI Picks hazırlanıyor...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {error && <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

      <AnimatePresence mode="wait">
        {step === "select" && (
          <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: "var(--sb-gradient)" }}>
                <Sparkles className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-foreground mb-2">Ne öğrenmek istiyorsun?</h2>
              <p className="text-muted-foreground text-sm">Beceri seç, API tarafından hesaplanan en uygun eşleşmeyi gösterelim.</p>
            </div>

            <div className="max-w-md mx-auto mb-6">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={customSkill}
                  onChange={(event) => setCustomSkill(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && customSkill.trim()) handleSkillSelect(customSkill.trim());
                  }}
                  placeholder="Örn: React, Python, İngilizce..."
                  className="w-full pl-10 pr-24 py-3.5 rounded-2xl border border-border bg-card text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
                <button
                  onClick={() => customSkill.trim() && handleSkillSelect(customSkill.trim())}
                  disabled={!customSkill.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-40 hover:scale-105 active:scale-95"
                  style={{ background: "var(--sb-gradient)" }}>
                  Ara
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {SKILL_OPTIONS.map((skill) => (
                <button key={skill} onClick={() => handleSkillSelect(skill)} className="px-5 py-3 rounded-2xl border border-border bg-card font-medium text-sm text-foreground hover:border-primary hover:shadow-md hover:-translate-y-0.5">
                  {skill}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "spinning" && (
          <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary mb-6 shadow-xl" />
            <h3 className="text-xl font-bold text-foreground mb-1">Eşleşme aranıyor...</h3>
            <p className="text-muted-foreground text-sm">"{selectedSkill}" için API sonucu değerlendiriliyor</p>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!matchedUser ? (
              <div className="p-8 rounded-3xl border border-dashed border-border bg-card text-center">
                <h2 className="text-xl font-extrabold text-foreground mb-2">Uygun eşleşme bulunamadı</h2>
                <p className="text-sm text-muted-foreground mb-4">Profil becerilerini güncelledikten sonra tekrar dene.</p>
                <button onClick={reset} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted">Geri dön</button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-extrabold text-foreground">Eşleşme bulundu</h2>
                </div>

                <div className="relative p-6 rounded-3xl border border-border bg-card shadow-lg mb-6 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-24 opacity-10" style={{ background: "var(--sb-gradient)" }} />
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex-1 flex flex-col items-center text-center">
                      <img src={me.avatar} alt={me.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md mb-2 border-2 border-background" />
                      <span className="font-bold text-sm text-foreground">{me.name}</span>
                      <span className="text-xs text-muted-foreground">Sen</span>
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0 z-20">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-xl ring-4 ring-background" style={{ background: "var(--sb-gradient)" }}>
                        %{matchedUser.matchScore}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 font-bold">Uyum</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center text-center">
                      <img src={avatarFor(matchedUser.name, matchedUser.avatarUrl)} alt={matchedUser.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md mb-2 border-2 border-background" />
                      <span className="font-bold text-sm text-foreground">{matchedUser.name}</span>
                      <span className="text-xs text-muted-foreground">{matchedUser.university || "Kampüs içi"}</span>
                    </div>
                  </div>

                  <div className="relative z-10 mt-5 pt-4 border-t border-border flex items-center justify-center gap-2 text-sm">
                    <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-xs">
                      Öğretiyor: {matchedUser.teaches.join(", ") || matchedUser.skillName || "Belirtilmemiş"}
                    </span>
                  </div>

                  <div className="relative z-10 flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        localStorage.setItem("active_chat_partner_id", matchedUser.otherUserId);
                        onNavigate("messages");
                      }}
                      className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm text-foreground hover:bg-muted flex items-center justify-center gap-1.5 shadow-sm">
                      <MessageSquare size={16} /> Mesaj Gönder
                    </button>
                    <button onClick={() => onNavigate("calendar")} className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02]" style={{ background: "var(--sb-gradient)" }}>
                      <Calendar size={16} /> Görüşme Planla
                    </button>
                  </div>
                </div>

                {otherSuggestions.length > 0 && (
                  <div className="mb-4 text-xs text-muted-foreground text-center">
                    {otherSuggestions.length} alternatif API önerisi daha var.
                  </div>
                )}

                <button onClick={reset} className="w-full py-3.5 rounded-xl border border-dashed border-border text-muted-foreground font-medium text-sm hover:border-primary hover:text-primary hover:bg-primary/5 flex items-center justify-center gap-2">
                  <RotateCcw size={15} /> Başka bir beceri seç
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
