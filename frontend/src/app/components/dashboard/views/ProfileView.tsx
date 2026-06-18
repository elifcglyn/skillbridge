import { useEffect, useState } from "react";
import type React from "react";
import { BookOpen, Check, GraduationCap, Plus, Save, Shield, User, X } from "lucide-react";
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
  skillPoints: number;
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");
  const [teaches, setTeaches] = useState<string[]>([]);
  const [learns, setLearns] = useState<string[]>([]);
  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [newLearnSkill, setNewLearnSkill] = useState("");
  const [profilePublic, setProfilePublic] = useState(true);
  const [skillPoints, setSkillPoints] = useState(0);

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
        setSkillPoints(profile?.skillPoints ?? 0);
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
      });

      setSkillPoints(response.data.skillPoints);
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

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {error && <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="h-32" style={{ background: "var(--sb-gradient)" }} />
        <div className="p-5 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-extrabold text-white border-4 border-card shadow-xl" style={{ background: "var(--sb-gradient)" }}>
              {fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-foreground">{fullName}</h1>
              <p className="text-sm text-muted-foreground">{university || "Üniversite"}{department ? ` · ${department}` : ""}</p>
            </div>
            <button onClick={saveProfile} disabled={isSaving || !userId} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style={{ background: "var(--sb-gradient)" }}>
              <Save size={15} /> {isSaving ? "Kaydediliyor..." : "Profili Kaydet"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <User size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">Temel Bilgiler</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none" placeholder="Ad" />
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none" placeholder="Soyad" />
            <input value={university} onChange={(event) => setUniversity(event.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none" placeholder="Üniversite" />
            <input value={department} onChange={(event) => setDepartment(event.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none" placeholder="Bölüm" />
          </div>
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={5} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none resize-none" placeholder="Kısa biyografi" />
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">Görünürlük</h2>
          </div>
          <button onClick={() => setProfilePublic((value) => !value)} className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-muted/40">
            <span className="text-sm font-medium text-foreground">Profil herkese açık</span>
            <span className={`w-10 h-6 rounded-full p-1 transition-colors ${profilePublic ? "bg-primary" : "bg-muted"}`}>
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${profilePublic ? "translate-x-4" : ""}`} />
            </span>
          </button>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/50 text-center">
              <div className="text-lg font-extrabold text-foreground">{skillPoints}</div>
              <div className="text-xs text-muted-foreground">Beceri Puanı</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 text-center">
              <div className="text-lg font-extrabold text-foreground">{teaches.length + learns.length}</div>
              <div className="text-xs text-muted-foreground">Beceri</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none"
          placeholder="Virgülle ayırarak ekle"
        />
        <button onClick={onAdd} className="px-3 rounded-xl text-white" style={{ background: "var(--sb-gradient)" }}>
          <Plus size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-10">
        {skills.length === 0 ? (
          <span className="text-xs text-muted-foreground">Henüz beceri eklenmedi.</span>
        ) : skills.map((skill) => (
          <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            <Check size={11} />
            {skill}
            <button onClick={() => onRemove(skill)} className="opacity-70 hover:opacity-100">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
