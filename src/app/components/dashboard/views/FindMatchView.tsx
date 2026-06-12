import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Sparkles, ArrowRight, MessageSquare, Calendar, RotateCcw, Search } from "lucide-react";

const SKILL_OPTIONS = [
  "İngilizce", "React", "Python", "Gitar", "UI/UX Tasarım",
  "İstatistik", "Fotoğrafçılık", "Excel", "Matematik", "İspanyolca"
];

// Mock eşleşme havuzu - Supabase hazır olunca buradan çekilecek
const MOCK_POOL = [
  { name: "Ayşe Kara", teaches: "İngilizce", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop", match: 96, university: "Kırklareli Üniversitesi" },
  { name: "Mert Yıldız", teaches: "React", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop", match: 89, university: "Kırklareli Üniversitesi" },
  { name: "Zeynep Arslan", teaches: "Python", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop", match: 93, university: "Kırklareli Üniversitesi" },
  { name: "Burak Şahin", teaches: "Gitar", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop", match: 85, university: "Kırklareli Üniversitesi" },
  { name: "Selin Öztürk", teaches: "UI/UX Tasarım", avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop", match: 91, university: "Kırklareli Üniversitesi" },
];

// Şu an giriş yapan kullanıcıyı temsil eden mock kart (Profilim'den gelecek)
const ME = {
  name: "Sen",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
};

type Step = "select" | "spinning" | "result";
interface FindMatchViewProps {
  onNavigate: (view: string) => void;
}

export function FindMatchView({ onNavigate }: FindMatchViewProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [customSkill, setCustomSkill] = useState("");
  const [matchedUser, setMatchedUser] = useState<typeof MOCK_POOL[0] | null>(null);

  const handleSkillSelect = (skill: string) => {
    setSelectedSkill(skill);
    setStep("spinning");


    const found = MOCK_POOL.find(p => p.teaches === skill)
      || MOCK_POOL[Math.floor(Math.random() * MOCK_POOL.length)];

    setTimeout(() => {
      setMatchedUser(found);
      setStep("result");
    }, 1500);
  };

  const reset = () => {
    setStep("select");
    setSelectedSkill(null);
    setMatchedUser(null);
  };

  // Önerilen diğer eşleşmeler (seçilen kişi hariç)
  const otherSuggestions = MOCK_POOL.filter(p => p.name !== matchedUser?.name).slice(0, 3);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <AnimatePresence mode="wait">

        {/* ADIM 1: Ne öğrenmek istiyorsun? */}
        {step === "select" && (
          <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--sb-gradient)" }}>
                <Sparkles className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-foreground mb-2">Ne öğrenmek istiyorsun?</h2>
              <p className="text-muted-foreground text-sm">Bir beceri seç, sana en uygun eşleşmeyi bulalım!</p>
            </div>
            <div className="max-w-md mx-auto mb-6">
    <div className="relative">
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        value={customSkill}
        onChange={e => setCustomSkill(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && customSkill.trim()) {
            handleSkillSelect(customSkill.trim());
          }
        }}
        placeholder="Örn: Salça yapmak, Ebru sanatı, Satranç..."
        className="w-full pl-10 pr-24 py-3.5 rounded-2xl border border-border bg-card text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
      />
      <button
        onClick={() => customSkill.trim() && handleSkillSelect(customSkill.trim())}
        disabled={!customSkill.trim()}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-40 transition-all"
        style={{ background: "var(--sb-gradient)" }}>
        Ara
      </button>
    </div>
    <p className="text-xs text-muted-foreground text-center mt-2">
      veya popüler beceriler arasından seç:
    </p>
  </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {SKILL_OPTIONS.map(skill => (
                <button key={skill} onClick={() => handleSkillSelect(skill)}
                  className="px-5 py-3 rounded-2xl border border-border bg-card font-medium text-sm text-foreground hover:border-primary hover:shadow-md transition-all hover:-translate-y-0.5">
                  {skill}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ADIM 2: Eşleşiyor animasyonu */}
        {step === "spinning" && (
          <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary mb-6" />
            <h3 className="text-xl font-bold text-foreground mb-1">Eşleşme aranıyor...</h3>
            <p className="text-muted-foreground text-sm">"{selectedSkill}" için en iyi eşleşme bulunuyor</p>
          </motion.div>
        )}

        {/* ADIM 3: Sonuç - Karşılaşma ekranı */}
        {step === "result" && matchedUser && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold text-foreground">Eşleşme Bulundu! 🎉</h2>
              <p className="text-muted-foreground text-sm">"{selectedSkill}" için harika bir eşleşme</p>
            </div>

            {/* VS Kartı */}
            <div className="relative p-6 rounded-3xl border border-border bg-card shadow-lg mb-6">
              <div className="flex items-center justify-between gap-4">
                {/* Sol: Ben */}
                <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className="flex-1 flex flex-col items-center text-center">
                  <img src={ME.avatar} alt={ME.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md mb-2" />
                  <span className="font-bold text-sm text-foreground">{ME.name}</span>
                  <span className="text-xs text-muted-foreground">Sen</span>
                </motion.div>

                {/* Orta: Yüzde */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-lg"
                    style={{ background: "var(--sb-gradient)" }}>
                    %{matchedUser.match}
                  </motion.div>
                  <span className="text-xs text-muted-foreground mt-1 font-medium">Uyum</span>
                </div>

                {/* Sağ: Eşleşen kişi */}
                <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className="flex-1 flex flex-col items-center text-center">
                  <img src={matchedUser.avatar} alt={matchedUser.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md mb-2" />
                  <span className="font-bold text-sm text-foreground">{matchedUser.name}</span>
                  <span className="text-xs text-muted-foreground">{matchedUser.university}</span>
                </motion.div>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-xs">
                  {matchedUser.name} öğretiyor: {matchedUser.teaches}
                </span>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={() => onNavigate("messages")}
                  className="flex-1 py-2.5 rounded-xl border border-border font-semibold text-sm text-foreground hover:bg-muted transition-all flex items-center justify-center gap-1.5">
                  <MessageSquare size={15} /> Mesaj Gönder
                </button>
                <button onClick={() => onNavigate("calendar")}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-1.5"
                  style={{ background: "var(--sb-gradient)" }}>
                  <Calendar size={15} /> Görüşme Planla
                </button>
              </div>
            </div>

            {/* Diğer öneriler */}
            <div className="mb-4">
              <h3 className="font-bold text-foreground text-sm mb-3">Diğer Öneriler</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {otherSuggestions.map(person => (
                  <div key={person.name}
                    className="p-3 rounded-2xl border border-border bg-card hover:shadow-md transition-all cursor-pointer text-center">
                    <img src={person.avatar} alt={person.name} className="w-12 h-12 rounded-xl object-cover mx-auto mb-2" />
                    <div className="font-semibold text-xs text-foreground truncate">{person.name}</div>
                    <div className="text-xs text-muted-foreground truncate mb-1">{person.teaches}</div>
                    <span className="text-xs font-bold text-primary">%{person.match}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={reset}
              className="w-full py-3 rounded-xl border border-dashed border-border text-muted-foreground font-medium text-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Başka bir beceri seç
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}