import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, MessageSquare, Calendar, RotateCcw, Search } from "lucide-react";
import { supabase } from '@/lib/supabase';

const SKILL_OPTIONS = [
  "İngilizce", "React", "Python", "Gitar", "UI/UX Tasarım",
  "İstatistik", "Fotoğrafçılık", "Excel", "Matematik", "İspanyolca"
];

type Step = "select" | "spinning" | "result";

interface FindMatchViewProps {
  onNavigate: (view: string) => void;
}

export function FindMatchView({ onNavigate }: FindMatchViewProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [customSkill, setCustomSkill] = useState("");
  
  const [profiles, setProfiles] = useState<any[]>([]);
  const [me, setMe] = useState({ name: "Sen", avatar: "" });
  const [loading, setLoading] = useState(true);
  const [matchedUser, setMatchedUser] = useState<any | null>(null);

  // 1. Supabase'den Gerçek Verileri Çekme
  useEffect(() => {
    async function loadRealData() {
      const { data: { user } } = await supabase.auth.getUser();
      const myId = user?.id || null;
      
      if (user) {
        const myName = user.user_metadata?.first_name || "Sen";
        setMe({
          name: myName,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}&background=random&color=fff&size=200`
        });
      }

      // Supabase'den veriyi al ve Konsola yazdır (DEDEKTİFLİK BURADA BAŞLIYOR)
      const { data, error } = await supabase.from('profiles').select('*');
      console.log("📥 Supabase'den Çekilen Tüm Veriler:", data);
      console.log("❌ Varsa Hata Mesajı:", error);

      if (!error && data) {
        const formattedProfiles = data.filter(p => p.id !== myId).map(p => {
          // Bazen Supabase Array'leri String olarak yollayabilir, bunu sağlama alıyoruz:
          let safeTeaches = p.teaches;
          if (typeof safeTeaches === 'string') {
            try { safeTeaches = JSON.parse(safeTeaches); } 
            catch (e) { safeTeaches = []; }
          }
          if (!Array.isArray(safeTeaches)) safeTeaches = [];

          return {
            id: p.id,
            name: p.full_name || "İsimsiz",
            teaches: safeTeaches,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'U')}&background=random&color=fff&size=200`,
            match: Math.floor(Math.random() * 15) + 85,
            university: p.university || "Kampüs İçi"
          };
        });
        
        console.log("✅ Ekrana Hazırlanan Profiller:", formattedProfiles);
        setProfiles(formattedProfiles);
      }
      setLoading(false);
    }
    loadRealData();
  }, []);

  // 2. Arama ve Eşleştirme Mantığı
  const handleSkillSelect = (skill: string) => {
    setSelectedSkill(skill);
    setStep("spinning");

    const searchTerm = skill.toLocaleLowerCase('tr-TR').trim();
    console.log("🔍 Aranan Beceri:", searchTerm);

    const fallbackUser = {
      id: "demo-user",
      name: "Sistem Asistanı",
      teaches: [skill],
      avatar: `https://ui-avatars.com/api/?name=Asistan&background=random&color=fff&size=200`,
      match: 99,
      university: "SkillBridge"
    };

    let found = fallbackUser;

    if (profiles.length > 0) {
      const potentialMatches = profiles.filter(p => {
        // İçerideki teaches array'ini güvenle dön
        return p.teaches.some((s: string) => 
          s.toLocaleLowerCase('tr-TR').includes(searchTerm)
        );
      });
      
      console.log("🎯 Eşleşen Kişiler:", potentialMatches);

      if (potentialMatches.length > 0) {
        found = potentialMatches[Math.floor(Math.random() * potentialMatches.length)];
      }
    }

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

  if (loading) {
    return <div className="p-6 flex justify-center text-muted-foreground animate-pulse h-full items-center">Sistem hazırlanıyor...</div>;
  }

  const otherSuggestions = profiles.filter(p => p.id !== matchedUser?.id).slice(0, 3);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <AnimatePresence mode="wait">

        {step === "select" && (
          <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
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
                  className="w-full pl-10 pr-24 py-3.5 rounded-2xl border border-border bg-card text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                />
                <button
                  onClick={() => customSkill.trim() && handleSkillSelect(customSkill.trim())}
                  disabled={!customSkill.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                  style={{ background: "var(--sb-gradient)" }}>
                  Ara
                </button>
              </div>
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

        {step === "spinning" && (
          <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary mb-6 shadow-xl" />
            <h3 className="text-xl font-bold text-foreground mb-1">Eşleşme aranıyor...</h3>
            <p className="text-muted-foreground text-sm">"{selectedSkill}" için en iyi eşleşme bulunuyor</p>
          </motion.div>
        )}

        {step === "result" && matchedUser && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold text-foreground">Eşleşme Bulundu! 🎉</h2>
            </div>

            <div className="relative p-6 rounded-3xl border border-border bg-card shadow-lg mb-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 opacity-10" style={{ background: "var(--sb-gradient)" }} />
              
              <div className="relative z-10 flex items-center justify-between gap-4">
                <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className="flex-1 flex flex-col items-center text-center">
                  <img src={me.avatar} alt={me.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md mb-2 border-2 border-background" />
                  <span className="font-bold text-sm text-foreground">{me.name}</span>
                  <span className="text-xs text-muted-foreground">Sen</span>
                </motion.div>

                <div className="flex flex-col items-center flex-shrink-0 z-20">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-xl ring-4 ring-background"
                    style={{ background: "var(--sb-gradient)" }}>
                    %{matchedUser.match}
                  </motion.div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 font-bold">Uyum</span>
                </div>

                <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className="flex-1 flex flex-col items-center text-center">
                  <img src={matchedUser.avatar} alt={matchedUser.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md mb-2 border-2 border-background" />
                  <span className="font-bold text-sm text-foreground">{matchedUser.name}</span>
                  <span className="text-xs text-muted-foreground">{matchedUser.university}</span>
                </motion.div>
              </div>

              <div className="relative z-10 mt-5 pt-4 border-t border-border flex items-center justify-center gap-2 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-xs">
                  {matchedUser.name} öğretiyor: {matchedUser.teaches.length > 0 ? matchedUser.teaches.join(", ") : "Belirtilmemiş"}
                </span>
              </div>

              <div className="relative z-10 flex gap-2 mt-4">
                <button 
                  onClick={() => {
                    localStorage.setItem("active_chat_partner_id", matchedUser.id);
                    onNavigate("messages");
                  }}
                  className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm text-foreground hover:bg-muted transition-all flex items-center justify-center gap-1.5 shadow-sm">
                  <MessageSquare size={16} /> Mesaj Gönder
                </button>
                <button onClick={() => onNavigate("calendar")}
                  className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] transition-transform"
                  style={{ background: "var(--sb-gradient)" }}>
                  <Calendar size={16} /> Görüşme Planla
                </button>
              </div>
            </div>

            <button onClick={reset}
              className="w-full py-3.5 rounded-xl border border-dashed border-border text-muted-foreground font-medium text-sm hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
              <RotateCcw size={15} /> Başka bir beceri seç
            </button>
          </motion.div>
        )}
      </AnimatePresence> 
    </div>
  );
}