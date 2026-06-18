import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, MessageSquare, RotateCcw, Search, Sparkles, Star, Flag, Ban, X, AlertTriangle, ShieldAlert } from "lucide-react";
import { apiGet, apiSend, withQuery } from "@/lib/api";
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

const REPORT_REASONS = [
  "Uygunsuz Profil Fotoğrafı veya İsim",
  "Spam / Reklam / Dolandırıcılık",
  "Rahatsız Edici Davranış / Taciz",
  "Platform Dışı Amaçlarla Kullanım",
  "Sahte Hesap",
];

type Step = "select" | "spinning" | "result";

interface FindMatchViewProps {
  onNavigate: (view: string) => void;
  onOpenMessages: (peerId: string) => void;
  onOpenCalendar: (peerId: string) => void;
}

type AiPick = {
  matchId: string;
  otherUserId: string;
  name: string;
  avatarUrl: string | null;
  university: string | null;
  bio?: string | null;
  teaches: string[];
  learns: string[];
  skillName: string;
  matchScore: number;
};

function avatarFor(name: string, avatarUrl?: string | null) {
  return avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=random&color=fff&size=200`;
}

export function FindMatchView({
  onNavigate,
  onOpenMessages,
  onOpenCalendar,
}: FindMatchViewProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [customSkill, setCustomSkill] = useState("");
  const [me, setMe] = useState({ name: "Sen", avatar: "" });
  const [loading, setLoading] = useState(true);
  const [aiPicks, setAiPicks] = useState<AiPick[]>([]);
  const [matchedUser, setMatchedUser] = useState<AiPick | null>(null);
  const [openingMessages, setOpeningMessages] = useState(false);
  const [openingCalendar, setOpeningCalendar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Güvenlik Modalları için State'ler
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
          withQuery("/api/matches/ai-picks", { limit: 50 }),
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

  // Diğer olasılıklar listesini skora göre azalan sırala
  const otherSuggestions = useMemo(() => {
    if (!matchedUser || !selectedSkill) return [];
    const searchTerm = selectedSkill.toLocaleLowerCase("tr-TR").trim();
    
    return aiPicks
      .filter((pick) => pick.otherUserId !== matchedUser.otherUserId)
      .filter((pick) => 
        [...pick.teaches, pick.skillName]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase("tr-TR").includes(searchTerm))
      )
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }, [aiPicks, matchedUser, selectedSkill]);

  const handleSkillSelect = (skill: string) => {
    const searchTerm = skill.toLocaleLowerCase("tr-TR").trim();
    setSelectedSkill(skill);
    setStep("spinning");

    const relevantPicks = aiPicks
      .filter((pick) =>
        [...pick.teaches, pick.skillName]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase("tr-TR").includes(searchTerm))
      )
      .sort((a, b) => b.matchScore - a.matchScore);

    const found = relevantPicks[0] ?? aiPicks[0] ?? null;

    window.setTimeout(() => {
      setMatchedUser(found);
      setStep("result");
    }, 700);
  };

  const reset = () => {
    setStep("select");
    setSelectedSkill(null);
    setMatchedUser(null);
    setReportModalOpen(false);
    setBlockModalOpen(false);
    setActionSuccess(null);
  };

  const persistSelectedMatch = async () => {
    if (!matchedUser || !selectedSkill) return null;
    const searchTerm = selectedSkill.toLocaleLowerCase("tr-TR").trim();
    const matchedSkill =
      matchedUser.teaches.find((skill) =>
        skill.toLocaleLowerCase("tr-TR").includes(searchTerm),
      ) ||
      matchedUser.skillName ||
      selectedSkill;

    return apiSend<{ data: { matchId: string } }>("/api/matches/selection", "POST", {
      otherUserId: matchedUser.otherUserId,
      skillName: matchedSkill,
      matchScore: matchedUser.matchScore,
    });
  };

  const handleOpenMessages = async () => {
    if (!matchedUser || !selectedSkill || openingMessages || openingCalendar) return;

    setOpeningMessages(true);
    setError(null);

    try {
      await persistSelectedMatch();
      onOpenMessages(matchedUser.otherUserId);
    } catch (selectionError) {
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : "Eşleşme kaydedilemedi.",
      );
    } finally {
      setOpeningMessages(false);
    }
  };

  const handleOpenCalendar = async () => {
    if (!matchedUser || !selectedSkill || openingMessages || openingCalendar) return;

    setOpeningCalendar(true);
    setError(null);

    try {
      await persistSelectedMatch();
      onOpenCalendar(matchedUser.otherUserId);
    } catch (selectionError) {
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : "Eşleşme kaydedilemedi.",
      );
    } finally {
      setOpeningCalendar(false);
    }
  };

  // Güvenlik İşleyicileri
  const handleReport = async () => {
    if (!matchedUser || !reportReason) return;
    setActionLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setReportModalOpen(false);
      setActionSuccess("Şikayetiniz moderasyon ekibimize iletildi.");
      setReportReason("");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!matchedUser) return;
    setActionLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setBlockModalOpen(false);
      setAiPicks(prev => prev.filter(p => p.otherUserId !== matchedUser.otherUserId));
      reset();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex justify-center text-muted-foreground animate-pulse h-full items-center">AI Picks hazırlanıyor...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-20">
      {error && <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

      {actionSuccess && (
        <div className="mb-6 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 flex items-center gap-3 text-emerald-800 animate-in fade-in slide-in-from-top-4">
          <ShieldAlert size={20} className="text-emerald-500" />
          <p className="text-sm font-semibold">{actionSuccess}</p>
          <button onClick={() => setActionSuccess(null)} className="ml-auto text-emerald-600 hover:text-emerald-800"><X size={16}/></button>
        </div>
      )}

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
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform"
                  style={{ background: "var(--sb-gradient)" }}>
                  Ara
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {SKILL_OPTIONS.map((skill) => (
                <button key={skill} onClick={() => handleSkillSelect(skill)} className="px-5 py-3 rounded-2xl border border-border bg-card font-medium text-sm text-foreground hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all">
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
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto flex flex-col items-center">
            {!matchedUser ? (
              <div className="p-8 rounded-3xl border border-dashed border-border bg-card text-center w-full max-w-md">
                <h2 className="text-xl font-extrabold text-foreground mb-2">Uygun eşleşme bulunamadı</h2>
                <p className="text-sm text-muted-foreground mb-4">Profil becerilerini güncelledikten sonra tekrar dene.</p>
                <button onClick={reset} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted">Geri dön</button>
              </div>
            ) : (
              <div className="w-full max-w-[420px]">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-extrabold text-foreground">En İyi Eşleşme</h2>
                </div>

                {/* BİRLEŞİK KART YAPISI (ÜST KISIM: VS GÖRÜNÜMÜ) */}
                <div className="w-full">
                  <div className="relative p-6 rounded-t-3xl border border-border bg-card shadow-sm overflow-hidden border-b-0">
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
                        <span className="text-xs text-muted-foreground">{matchedUser.university || "Kampüs İçi"}</span>
                      </div>
                    </div>
                  </div>

                  {/* BİRLEŞİK KART YAPISI (ALT KISIM: DETAYLAR & DİNAMİK BİYOGRAFİ) */}
                  <div className="relative p-6 rounded-b-3xl border border-border bg-card shadow-lg mb-8">
                    <div className="absolute top-0 left-6 right-6 border-t border-dashed border-border" />
                    
                    {/* BİYOGRAFİ BURADA DİNAMİK OLARAK GELİYOR */}
                    {matchedUser.bio && matchedUser.bio.trim() !== "" ? (
                      <p className="text-[13px] text-foreground italic leading-relaxed mb-6 mt-4 text-center px-4 line-clamp-3">
                        "{matchedUser.bio}"
                      </p>
                    ) : (
                      <p className="text-[13px] text-muted-foreground/50 italic leading-relaxed mb-6 mt-4 text-center px-4">
                        Biyografi belirtilmemiş.
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-7">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-2.5">ÖĞRETEBİLECEKLERİ:</h4>
                        <div className="flex flex-wrap gap-2">
                          {matchedUser.teaches.length > 0 ? (
                            matchedUser.teaches.map(skill => (
                              <span key={skill} className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold">{matchedUser.skillName || "Belirtilmemiş"}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-2.5">ÖĞRENMEK İSTEDİKLERİ:</h4>
                        <div className="flex flex-wrap gap-2">
                          {matchedUser.learns.length > 0 ? (
                            matchedUser.learns.map(skill => (
                              <span key={skill} className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic mt-1 inline-block">Henüz belirtilmemiş</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AKSIYON BUTONLARI */}
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <button
                        onClick={handleOpenMessages}
                        disabled={openingMessages}
                        className="flex-1 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                        style={{ background: "var(--sb-gradient)" }}
                      >
                        <MessageSquare size={16} />
                        {openingMessages ? "Açılıyor..." : "Mesaj Gönder"}
                      </button>
                      <button 
                        onClick={handleOpenCalendar}
                        disabled={openingCalendar || openingMessages}
                        className="px-6 py-3 bg-card border border-border text-foreground rounded-2xl hover:bg-muted transition-all text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50" 
                      >
                        <Calendar size={16} className="text-primary" /> 
                        {openingCalendar ? "..." : "Görüşme"}
                      </button>
                    </div>

                    {/* GÜVENLİK AKSIYONLARI */}
                    <div className="mt-5 pt-4 border-t border-dashed border-border/60 flex items-center justify-center gap-6">
                      <button onClick={() => setReportModalOpen(true)} className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-orange-500 transition-colors">
                        <Flag size={12} /> Profili Şikayet Et
                      </button>
                      <div className="w-1 h-1 rounded-full bg-border" />
                      <button onClick={() => setBlockModalOpen(true)} className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-red-500 transition-colors">
                        <Ban size={12} /> Kullanıcıyı Engelle
                      </button>
                    </div>

                  </div>
                </div>

                {/* --- DIĞER OLASILIKLAR LİSTESİ --- */}
                {otherSuggestions.length > 0 && (
                  <div className="w-full mb-8">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-4 text-center">
                      Diğer {selectedSkill} Eşleşmeleri
                    </h4>
                    <div className="flex flex-col gap-3">
                      {otherSuggestions.map((altUser, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: idx * 0.1 }}
                          key={altUser.otherUserId} 
                          className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card/50 hover:bg-card transition-all shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <img src={avatarFor(altUser.name, altUser.avatarUrl)} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                            <div>
                              <h5 className="font-bold text-sm text-foreground">{altUser.name}</h5>
                              <p className="text-[11px] font-medium text-muted-foreground line-clamp-1 mt-0.5">
                                Öğretiyor: {altUser.teaches.join(", ") || altUser.skillName}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                <Star size={10} className="fill-emerald-600" /> %{altUser.matchScore}
                              </span>
                            </div>
                            <button 
                              onClick={() => setMatchedUser(altUser)} 
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              İncele
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={reset} className="w-full py-4 rounded-xl text-muted-foreground font-semibold text-sm hover:text-primary flex items-center justify-center gap-2 transition-colors">
                  <RotateCcw size={16} /> Aramayı Sıfırla
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ŞİKAYET MODALİ --- */}
      <AnimatePresence>
        {reportModalOpen && matchedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setReportModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4 text-orange-500">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-extrabold text-foreground">Kullanıcıyı Şikayet Et</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                <strong className="text-foreground">{matchedUser.name}</strong> adlı kullanıcıyı neden şikayet ediyorsunuz? Lütfen en uygun sebebi seçin.
              </p>
              
              <div className="space-y-2 mb-6">
                {REPORT_REASONS.map((reason) => (
                  <label key={reason} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${reportReason === reason ? 'border-orange-500 bg-orange-50' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="report_reason" value={reason} checked={reportReason === reason} onChange={(e) => setReportReason(e.target.value)} className="accent-orange-500 w-4 h-4" />
                    <span className={`text-sm font-semibold ${reportReason === reason ? 'text-orange-900' : 'text-foreground'}`}>{reason}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setReportModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Vazgeç</button>
                <button onClick={handleReport} disabled={!reportReason || actionLoading} className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors">
                  {actionLoading ? "İletiliyor..." : "Şikayeti Gönder"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ENGELLEME MODALİ --- */}
      <AnimatePresence>
        {blockModalOpen && matchedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setBlockModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl border border-border p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Ban size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground mb-2">Kullanıcıyı Engelle</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                <strong className="text-foreground">{matchedUser.name}</strong> adlı kullanıcıyı engellemek istediğinize emin misiniz? <br/><br/>
                Bu kişi size bir daha mesaj gönderemez, eşleşme sonuçlarında karşınıza çıkmaz ve profilinizi göremez.
              </p>
              
              <div className="flex gap-2">
                <button onClick={() => setBlockModalOpen(false)} className="flex-1 py-3.5 rounded-xl text-sm font-bold border border-border text-foreground hover:bg-muted transition-colors">İptal</button>
                <button onClick={handleBlock} disabled={actionLoading} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors shadow-lg shadow-red-500/20">
                  {actionLoading ? "Engelleniyor..." : "Evet, Engelle"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}