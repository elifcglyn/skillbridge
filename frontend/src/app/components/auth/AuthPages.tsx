import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye, EyeOff, ArrowLeft, Mail, Lock, User, MapPin,
  GraduationCap, Plus, X, Camera, Check, Loader2,LoaderCircle,BookOpen
} from "lucide-react";
import { supabase } from '@/lib/supabase'; // Adım 1'de oluşturduğunuz dosya

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
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [kvkkApproved, setKvkkApproved] = useState(false);

  const [learnSkillInput, setLearnSkillInput] = useState("");

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
    if (!email || !password || !firstName || !lastName || !university) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
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
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("landing")}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: customGradient }}>
        <BookOpen className="text-white" size={18} />
      </div>
      <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-teal-700">
        SkillBridge
      </span>
    </div>
  );

  if (page === "login") {
    return (
      <div className="min-h-screen flex">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-indigo-950">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-indigo-600 blur-3xl" />
            <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full bg-teal-500 blur-3xl" />
          </div>
          <div className="relative z-10"><Logo /></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">Öğrenme yolculuğuna tekrar hoş geldin</h2>
            <p className="text-indigo-200 mb-8">Kampüsteki binlerce öğrenci şu an yeteneklerini paylaşıyor. Onlara katıl.</p>
            <div className="grid grid-cols-2 gap-4">
              {[["1.2K+", "Öğrenci"], ["340+", "Beceri"], ["8.9K+", "Görüşme"], ["96%", "Memnuniyet"]].map(([n, l]) => (
                <div key={l} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl font-extrabold text-white">{n}</div>
                  <div className="text-indigo-200 text-sm">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 text-indigo-400 text-sm">© 2026 SkillBridge</div>
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
                  <div className="relative">
                    <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={university} onChange={e=>setUniversity(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="Örn: Kırklareli Üniversitesi" />
                  </div>
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