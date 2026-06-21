import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye, EyeOff, ArrowLeft, Mail, Zap,Lock, User, MapPin,
  GraduationCap, Plus, X, Camera, Check, ChevronDown, Loader2,LoaderCircle,BookOpen
} from "lucide-react";
<<<<<<< HEAD
import { supabase } from '@/lib/supabase'; 
import QRCode from "react-qr-code";
=======
import { supabase } from '@/lib/supabase'; // Adım 1'de oluşturduğunuz dosya
import { TURKISH_UNIVERSITIES } from "@/lib/turkishUniversities";
>>>>>>> 182581d1cbab384f3ce536cc88ff90198d9c75d8

interface AuthPagesProps {
  page: "login" | "register" | "forgot";
  onNavigate: (page: string) => void;
}

const SKILL_SUGGESTIONS = [
  "Python", "JavaScript", "İspanyolca", "İngilizce", "Gitar", "Piyano",
  "UI Tasarım", "Figma", "Fotoğrafçılık", "Diksiyon", "Matematik", "İstatistik",
  "Pazarlama", "Topluluk Önünde Konuşma", "Yazılım Testi", "React",
];

export function AuthPages({ page, onNavigate }: AuthPagesProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"mentor" | "learner" | "both">("both");
  const [teachSkills, setTeachSkills] = useState<string[]>([]);
  const [learnSkills, setLearnSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [university, setUniversity] = useState("");
  const [universitySearch, setUniversitySearch] = useState("");
  const [universityOpen, setUniversityOpen] = useState(false);
  const [highlightedUniversity, setHighlightedUniversity] = useState(-1);
  const universityPickerRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [kvkkApproved, setKvkkApproved] = useState(false);

  const [learnSkillInput, setLearnSkillInput] = useState("");

  const filteredUniversities = useMemo(() => {
    const query = universitySearch.trim().toLocaleLowerCase("tr-TR");
    if (!query) return TURKISH_UNIVERSITIES;

    return TURKISH_UNIVERSITIES.filter((item) =>
      item.toLocaleLowerCase("tr-TR").includes(query),
    );
  }, [universitySearch]);

  useEffect(() => {
    const closeUniversityPicker = (event: MouseEvent) => {
      if (
        universityPickerRef.current
        && !universityPickerRef.current.contains(event.target as Node)
      ) {
        setUniversityOpen(false);
        setUniversitySearch(university);
      }
    };

    document.addEventListener("mousedown", closeUniversityPicker);
    return () => document.removeEventListener("mousedown", closeUniversityPicker);
  }, [university]);

  const selectUniversity = (selectedUniversity: string) => {
    setUniversity(selectedUniversity);
    setUniversitySearch(selectedUniversity);
    setUniversityOpen(false);
    setHighlightedUniversity(-1);
  };

  const handleUniversityKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Escape") {
      setUniversityOpen(false);
      setUniversitySearch(university);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setUniversityOpen(true);
      if (filteredUniversities.length === 0) return;
      setHighlightedUniversity((current) =>
        Math.min(current + 1, filteredUniversities.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedUniversity((current) => Math.max(current - 1, 0));
      return;
    }

    if (
      event.key === "Enter"
      && universityOpen
      && filteredUniversities[highlightedUniversity < 0 ? 0 : highlightedUniversity]
    ) {
      event.preventDefault();
      selectUniversity(
        filteredUniversities[highlightedUniversity < 0 ? 0 : highlightedUniversity],
      );
    }
  };

  const customGradient = "linear-gradient(135deg, #312e81 0%, #0d9488 100%)"; // İndigo - Turkuaz

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      setLoading(false);
    } else {
      onNavigate("dashboard");
    }
  };

  const handleStep1Next = () => {
    setError("");
    if (!email || !password || !firstName || !lastName) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    if (!university) {
      setError("Lütfen açılır listeden üniversitenizi seçin.");
      return;
    }
    if (!email.endsWith(".edu.tr")) {
      setError("Sisteme sadece üniversite uzantılı (.edu.tr) e-posta adresinizle kayıt olabilirsiniz.");
      return;
    }
    if (password.length < 6) {
      setError("Şifreniz en az 6 karakter olmalıdır.");
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (!kvkkApproved) {
      setError("Devam etmek için KVKK ve Aydınlatma Metni'ni onaylamalısınız.");
      return;
    }

    setLoading(true);
    setError("");

    // Supabase'e Kayıt İsteği
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          university,
          department,
          location,
          bio,
          role,
          teaches: teachSkills,
          learns: learnSkills,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      alert("Kayıt başarılı! Lütfen üniversite e-postanıza gelen linke tıklayarak hesabınızı onaylayın.");
      onNavigate("login");
    }
  };

  const addSkill = (list: string[], setList: (s: string[]) => void, skill: string) => {
    if (skill && !list.includes(skill)) setList([...list, skill]);
  };

  const removeSkill = (list: string[], setList: (s: string[]) => void, skill: string) => {
    setList(list.filter(s => s !== skill));
  };

 const Logo = () => (
    <div className="cursor-pointer" onClick={() => onNavigate("landing")}>
      <span className="text-2xl font-extrabold tracking-tight text-white">
        SkillBridge
      </span>
    </div>
  );

  if (page === "login") {
    return (
      <div className="min-h-screen flex">
        {/* Left panel */}
        <div className="flex-1 flex flex-col justify-between p-12 lg:p-20 text-white relative overflow-hidden bg-gradient-to-br from-[#1a1a40] to-[#0f0f2d]">
  {/* Arka plan efekti */}
  <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at top right, #6366f1, transparent)" }} />
  
  <div className="relative z-10">
    {/* Logo kısmı: Artık kare kutu yok, sadece metin */}
    <div className="mb-12">
      <span className="text-2xl font-extrabold tracking-tight text-white cursor-pointer" onClick={() => onNavigate("landing")}>
        SkillBridge
      </span>
    </div>

    {/* Yeni Slogan */}
    <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
      Birinin öğrenmek istediği şey, <br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
        senin çoktan bildiğin bir şey olabilir.
      </span>
    </h1>
    
    <p className="text-white/70 text-lg mb-12 max-w-md leading-relaxed font-medium">
      SkillBridge öğrencileri eşleştirir, bilgiyi ücretsiz ve sosyal hale getirir.
    </p>

    {/* Güven Vurgusu */}
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
          <GraduationCap className="text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold">Ücretsiz Eğitim</h3>
          <p className="text-sm text-white/60">Sınır yok, ücret yok. Sadece bilgi paylaşımı.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
          <Zap className="text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold">SkillCoin Ekonomisi</h3>
          <p className="text-sm text-white/60">Aktif oldukça kazan, özel etkinliklere eriş.</p>
        </div>
      </div>
    </div>
  </div>

  <div className="relative z-10 text-white/40 text-sm font-medium">
    © 2026 SkillBridge
  </div>
</div>
        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="lg:hidden mb-8"><Logo /></div>
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Giriş Yap</h1>
              <p className="text-slate-500">Hesabın yok mu?{" "}
                <button onClick={() => onNavigate("register")} className="text-indigo-600 font-semibold hover:underline">Ücretsiz oluştur</button>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Öğrenci E-postası</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" placeholder="isim.soyad@ogrenci.edu.tr"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700">Şifre</label>
                  <button onClick={() => onNavigate("forgot")} className="text-xs text-indigo-600 hover:underline">Şifremi unuttum?</button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPassword ? "text" : "password"} placeholder="Şifrenizi girin"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button onClick={handleLogin} disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: customGradient }}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
               {loading ? <LoaderCircle className="animate-spin" /> : <span>Giriş Yap</span>}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // REGISTER EKRANI
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white">
        <Logo />
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex items-center ${s < 3 ? "gap-2" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "text-white shadow-md" : "bg-slate-100 text-slate-400"}`}
                style={step >= s ? { background: customGradient } : {}}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 rounded-full transition-all ${step > s ? "" : "bg-slate-100"}`}
                style={step > s ? { background: customGradient } : {}} />}
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate("login")} className="text-sm text-slate-500 hover:text-slate-900 font-medium">
          Zaten hesabım var
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {/* ADIM 1: TEMEL BİLGİLER */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Hesabını oluştur</h1>
              <p className="text-slate-500 mb-8">Ücretsiz öğrenme yolculuğuna birkaç dakika içinde başla.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Ad</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="Ahmet" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Soyad</label>
                  <input value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="Yılmaz" />
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Öğrenci E-postası (.edu.tr zorunlu)</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="isim.soyad@ogrenci.klu.edu.tr" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Şifre</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="En az 6 karakter" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Üniversite</label>
                  <div ref={universityPickerRef} className="relative">
                    <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                    <input
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={universityOpen}
                      aria-controls="university-options"
                      value={universitySearch}
                      onFocus={() => {
                        setUniversitySearch(university);
                        setUniversityOpen(true);
                        setHighlightedUniversity(-1);
                      }}
                      onChange={(event) => {
                        setUniversitySearch(event.target.value);
                        setUniversity("");
                        setUniversityOpen(true);
                        setHighlightedUniversity(-1);
                      }}
                      onKeyDown={handleUniversityKeyDown}
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      placeholder="Üniversitenizi arayın ve seçin"
                    />
                    <button
                      type="button"
                      aria-label="Üniversite listesini aç"
                      onClick={() => {
                        if (universityOpen) {
                          setUniversitySearch(university);
                          setUniversityOpen(false);
                        } else {
                          setUniversitySearch("");
                          setUniversityOpen(true);
                        }
                        setHighlightedUniversity(-1);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <ChevronDown
                        size={17}
                        className={`transition-transform ${universityOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {universityOpen && (
                      <div
                        id="university-options"
                        role="listbox"
                        className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50"
                      >
                        {filteredUniversities.length > 0 ? (
                          filteredUniversities.map((item, index) => (
                            <button
                              key={item}
                              type="button"
                              role="option"
                              aria-selected={university === item}
                              onMouseEnter={() => setHighlightedUniversity(index)}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectUniversity(item)}
                              className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                highlightedUniversity === index
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span>{item}</span>
                              {university === item && (
                                <Check size={15} className="shrink-0 text-indigo-600" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-5 text-center text-sm text-slate-500">
                            Aramanızla eşleşen üniversite bulunamadı.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Yazmaya başlayarak listeyi filtreleyebilirsiniz.
                  </p>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

              <button onClick={handleStep1Next}
                className="w-full py-3.5 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all"
                style={{ background: customGradient }}>
                Devam Et →
              </button>
            </motion.div>
          )}

          {/* ADIM 2: ROLLER VE BECERİLER */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Platformdaki Rolün</h1>
              <p className="text-slate-500 mb-8">Bunu daha sonra profilinden değiştirebilirsin.</p>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {([
                  { val: "mentor", label: "Öğretici", desc: "Bir şeyler öğretmek istiyorum", emoji: "🎓" },
                  { val: "learner", label: "Öğrenci", desc: "Bir şeyler öğrenmek istiyorum", emoji: "📚" },
                  { val: "both", label: "İkisi de", desc: "Hem öğretip hem öğreneceğim", emoji: "⚡" },
                ] as const).map(opt => (
                  <button key={opt.val} onClick={() => setRole(opt.val)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${role === opt.val ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"}`}>
                    <div className="text-2xl mb-2">{opt.emoji}</div>
                    <div className="font-bold text-slate-900 text-sm mb-1">{opt.label}</div>
                    <div className="text-xs text-slate-500">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {(role === "mentor" || role === "both") && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-800 mb-3">Öğretebileceğim Beceriler</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {teachSkills.map(s => (
                      <span key={s} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ background: customGradient }}>
                        {s} <button onClick={() => removeSkill(teachSkills, setTeachSkills, s)}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { addSkill(teachSkills, setTeachSkills, skillInput); setSkillInput(""); } }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500 transition-all" placeholder="Bir beceri yazın ve Enter'a basın..." />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_SUGGESTIONS.slice(0, 8).filter(s => !teachSkills.includes(s)).map(s => (
                      <button key={s} onClick={() => addSkill(teachSkills, setTeachSkills, s)}
                        className="px-3 py-1 rounded-full text-xs border border-slate-200 bg-slate-100 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-slate-700">{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {(role === "learner" || role === "both") && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-800 mb-3">Öğrenmek İstediğim Beceriler</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {learnSkills.map(s => (
                      <span key={s} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        {s} <button onClick={() => removeSkill(learnSkills, setLearnSkills, s)}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  
                  {}
                  <div className="flex gap-2 mb-3">
                    <input value={learnSkillInput} onChange={e => setLearnSkillInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { addSkill(learnSkills, setLearnSkills, learnSkillInput); setLearnSkillInput(""); } }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-teal-500 transition-all" placeholder="Bir beceri yazın ve Enter'a basın..." />
                  </div>
                  {}

                  <div className="flex flex-wrap gap-2">
                    {SKILL_SUGGESTIONS.slice(8, 16).filter(s => !learnSkills.includes(s)).map(s => (
                      <button key={s} onClick={() => addSkill(learnSkills, setLearnSkills, s)}
                        className="px-3 py-1 rounded-full text-xs border border-slate-200 bg-slate-100 hover:border-teal-400 hover:bg-teal-50 transition-all text-slate-700">{s}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition-all">← Geri</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3.5 rounded-xl font-semibold text-white" style={{ background: customGradient }}>Devam Et →</button>
              </div>
            </motion.div>
          )}

          {/* ADIM 3: PROFİL TAMAMLAMA VE KVKK */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Profilini tamamla</h1>
              <p className="text-slate-500 mb-8">Bu bilgileri doldurarak daha hızlı eşleşme yakalayabilirsin.</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Kısa Biyografi (Hakkımda)</label>
                  <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none" placeholder="Topluluğa kendinden ve öğrenme hedeflerinden bahset..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Bölüm / Fakülte</label>
                  <input value={department} onChange={e=>setDepartment(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="Örn: Yazılım Mühendisliği, İşletme" />
                </div>
              </div>

              {/* KVKK Onay Kutusu (Geri Bildirim 2) */}
              <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <input type="checkbox" id="kvkk" checked={kvkkApproved} onChange={(e) => setKvkkApproved(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                <label htmlFor="kvkk" className="text-sm text-slate-600 leading-snug">
                  <span className="font-semibold text-slate-800">Kullanıcı Sözleşmesini</span> ve <span className="font-semibold text-slate-800">KVKK Aydınlatma Metni'ni</span> okudum, anladım ve kabul ediyorum. Öğrenci bilgilerimin sadece eşleşme amacıyla kullanılmasını onaylıyorum.
                </label>
              </div>

              {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700">← Geri</button>
                <button onClick={handleFinalSubmit} disabled={loading}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: customGradient }}>
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? "Hesap Oluşturuluyor..." : "Hesabımı Oluştur 🚀"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
