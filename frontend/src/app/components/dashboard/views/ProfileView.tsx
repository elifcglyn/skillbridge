import { useEffect, useState } from "react";
import type React from "react";
import { BookOpen, Check, GraduationCap, Plus, Save, Shield, User, X, Mail, Phone, MapPin, Coins, Edit3 } from "lucide-react";
import { motion } from "motion/react";
import { apiGet, apiSend } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type ProfileData = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  university: string;
  department: string;
  bio: string;
  teaches: string[];
  learns: string[];
  profilePublic: boolean;
  isEmailPublic: boolean;
  isPhonePublic: boolean;
  skillPoints: number; // SkillCoin olarak gösterilecek
  classesTaken?: number;
  classesTaught?: number;
};

function splitSkillInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProfileView() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");
  const [teaches, setTeaches] = useState<string[]>([]);
  const [learns, setLearns] = useState<string[]>([]);
  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [newLearnSkill, setNewLearnSkill] = useState("");
  
  // KVKK ve Görünürlük State'leri
  const [profilePublic, setProfilePublic] = useState(true);
  const [isEmailPublic, setIsEmailPublic] = useState(false);
  const [isPhonePublic, setIsPhonePublic] = useState(false);
  
  const [skillPoints, setSkillPoints] = useState(0);
  const [classesTaken, setClassesTaken] = useState(12); // UI Mock
  const [classesTaught, setClassesTaught] = useState(3); // UI Mock

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Öğrenci";

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserId(null);
          return;
        }

        setUserId(user.id);
        const response = await apiGet<{ data: ProfileData | null }>("/api/profiles");

        const profile = response.data;
        const metadata = user.user_metadata ?? {};

        setFirstName(profile?.firstName || metadata.first_name || "");
        setLastName(profile?.lastName || metadata.last_name || "");
        setUniversity(profile?.university || metadata.university || "");
        setDepartment(profile?.department || metadata.department || "");
        setBio(profile?.bio || metadata.bio || "");
        setTeaches(profile?.teaches?.length ? profile.teaches : Array.isArray(metadata.teaches) ? metadata.teaches : []);
        setLearns(profile?.learns?.length ? profile.learns : Array.isArray(metadata.learns) ? metadata.learns : []);
        
        setProfilePublic(profile?.profilePublic ?? true);
        setIsEmailPublic(profile?.isEmailPublic ?? false);
        setIsPhonePublic(profile?.isPhonePublic ?? false);
        setSkillPoints(profile?.skillPoints ?? 0);
        setClassesTaken(profile?.classesTaken ?? 12);
        setClassesTaught(profile?.classesTaught ?? 3);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Profil yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const saveProfile = async () => {
    if (!userId) return;
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await apiSend<{ data: ProfileData }>("/api/profiles", "PUT", {
        firstName,
        lastName,
        university,
        department,
        bio,
        teaches,
        learns,
        profilePublic,
        isEmailPublic,
        isPhonePublic
      });

      setSkillPoints(response.data.skillPoints);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Profil kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = (type: "teaches" | "learns") => {
    const value = type === "teaches" ? newTeachSkill : newLearnSkill;
    const nextSkills = splitSkillInput(value);
    if (nextSkills.length === 0) return;

    if (type === "teaches") {
      setTeaches((items) => Array.from(new Set([...items, ...nextSkills])));
      setNewTeachSkill("");
    } else {
      setLearns((items) => Array.from(new Set([...items, ...nextSkills])));
      setNewLearnSkill("");
    }
  };

  const removeSkill = (type: "teaches" | "learns", skill: string) => {
    if (type === "teaches") {
      setTeaches((items) => items.filter((item) => item !== skill));
    } else {
      setLearns((items) => items.filter((item) => item !== skill));
    }
  };

  if (loading) {
    return <div className="p-6 flex justify-center text-muted-foreground animate-pulse">Profil API'den yükleniyor...</div>;
  }

  // Yeniden kullanılabilir Toggle Bileşeni
  const ToggleRow = ({ label, description, icon: Icon, checked, onChange }: { label: string, description?: string, icon?: any, checked: boolean, onChange: () => void }) => (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex items-start gap-3">
        {Icon && <Icon size={16} className="mt-0.5 text-muted-foreground" />}
        <div>
          <span className="text-sm font-bold text-foreground block">{label}</span>
          {description && <span className="text-[11px] font-medium text-muted-foreground">{description}</span>}
        </div>
      </div>
      <button onClick={onChange} className={`relative w-11 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}>
        <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 pb-20">
      
      {/* BAŞLIK VE KAYDET BUTONU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Profilim</h1>
          <p className="text-sm text-muted-foreground mt-1">Platformdaki vitrininizi ve becerilerinizi yönetin.</p>
        </div>
        <button
          onClick={saveProfile}
          disabled={isSaving || !userId}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ background: "var(--sb-gradient)" }}
        >
          <Save size={16} /> {isSaving ? "Kaydediliyor..." : "Profili Kaydet"}
        </button>
      </div>

      {error && <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}
      
      {saveSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-800 flex items-center gap-2">
          <Check size={16} className="text-emerald-500" />
          Profil ve gizlilik tercihleri başarıyla kaydedildi.
        </motion.div>
      )}

      {/* KAPAK FOTOĞRAFI & AVATAR & İSTATİSTİKLER (YENİ) */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden mb-2">
        <div className="h-32 w-full relative" style={{ background: "var(--sb-gradient)" }}>
          <div className="absolute inset-0 bg-black/10" />
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-end -mt-12 mb-6">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-extrabold text-white shadow-xl ring-4 ring-card relative" style={{ background: "var(--sb-gradient)" }}>
              {fullName.charAt(0).toLocaleUpperCase("tr-TR")}
              <button className="absolute -bottom-2 -right-2 p-1.5 bg-card border border-border rounded-lg text-muted-foreground hover:text-primary transition-colors shadow-sm">
                <Edit3 size={14} />
              </button>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-extrabold text-foreground">{fullName}</h2>
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mt-1 font-medium">
                <span className="flex items-center gap-1"><MapPin size={14} /> {university || "Üniversite"}</span>
                <span className="hidden md:inline text-border">•</span>
                <span>{department || "Bölüm"}</span>
              </div>
            </div>

            {/* ŞIK İSTATİSTİK PANELLERİ */}
            <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-2xl border border-border/50">
              <div className="flex flex-col items-center px-4 py-2 bg-card rounded-xl shadow-sm border border-border/40 min-w-[80px]">
                <span className="text-xl font-extrabold text-foreground flex items-center gap-1">
                  {skillPoints} <Coins size={14} className="text-primary" />
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">SkillCoin</span>
              </div>
              <div className="flex flex-col items-center px-4 py-2">
                <span className="text-xl font-extrabold text-foreground">{classesTaken}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">Eğitim Aldı</span>
              </div>
              <div className="flex flex-col items-center px-4 py-2">
                <span className="text-xl font-extrabold text-foreground">{classesTaught}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">Eğitim Verdi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* SOL KOLON: TEMEL BİLGİLER */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">Temel Bilgiler</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all" placeholder="Ad" />
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all" placeholder="Soyad" />
            <input value={university} onChange={(event) => setUniversity(event.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all" placeholder="Üniversite" />
            <input value={department} onChange={(event) => setDepartment(event.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all" placeholder="Bölüm" />
          </div>
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-medium outline-none resize-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all" placeholder="Kısa biyografi (Örn: Bildiklerimi paylaşmayı çok seviyorum...)" />
        </div>

        {/* SAĞ KOLON: GÖRÜNÜRLÜK & KVKK */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">Görünürlük & KVKK</h2>
          </div>
          
          <div className="space-y-2">
            <ToggleRow 
              label="Profil Herkese Açık" 
              description="Platformdaki diğer öğrenciler sizi görebilir."
              checked={profilePublic} 
              onChange={() => setProfilePublic(!profilePublic)} 
            />
            <ToggleRow 
              icon={Mail}
              label="E-posta Paylaş" 
              description="Sadece eşleştiğiniz kişiler görebilir."
              checked={isEmailPublic} 
              onChange={() => setIsEmailPublic(!isEmailPublic)} 
            />
            <ToggleRow 
              icon={Phone}
              label="Telefon Paylaş" 
              description="Sadece eşleştiğiniz kişiler görebilir."
              checked={isPhonePublic} 
              onChange={() => setIsPhonePublic(!isPhonePublic)} 
            />
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between px-2">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Toplam Beceri</div>
            <div className="text-lg font-extrabold text-foreground">{teaches.length + learns.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
        <SkillPanel
          title="Öğretebileceğim Beceriler"
          icon={<GraduationCap size={16} />}
          value={newTeachSkill}
          onValueChange={setNewTeachSkill}
          onAdd={() => addSkill("teaches")}
          skills={teaches}
          onRemove={(skill) => removeSkill("teaches", skill)}
        />
        <SkillPanel
          title="Öğrenmek İstediğim Beceriler"
          icon={<BookOpen size={16} />}
          value={newLearnSkill}
          onValueChange={setNewLearnSkill}
          onAdd={() => addSkill("learns")}
          skills={learns}
          onRemove={(skill) => removeSkill("learns", skill)}
        />
      </div>
    </div>
  );
}

function SkillPanel({
  title,
  icon,
  value,
  onValueChange,
  onAdd,
  skills,
  onRemove,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  onAdd: () => void;
  skills: string[];
  onRemove: (skill: string) => void;
}) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-primary bg-primary/10">{icon}</div>
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onAdd();
          }}
          className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
          placeholder="Virgülle ayırarak ekle"
        />
        <button onClick={onAdd} className="px-4 rounded-xl text-white hover:opacity-90 transition-opacity" style={{ background: "var(--sb-gradient)" }}>
          <Plus size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-10">
        {skills.length === 0 ? (
          <span className="text-xs font-medium text-muted-foreground mt-2">Henüz beceri eklenmedi.</span>
        ) : skills.map((skill) => (
          <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary">
            <Check size={12} />
            {skill}
            <button onClick={() => onRemove(skill)} className="opacity-60 hover:opacity-100 transition-opacity ml-1">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}