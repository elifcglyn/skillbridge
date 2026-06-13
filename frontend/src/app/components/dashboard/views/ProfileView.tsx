import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Camera, Edit2, MapPin, GraduationCap, Star, Award, BookOpen,
  Globe, Eye, Plus, X, Check, Zap,
  Instagram, Linkedin, Github
} from "lucide-react";
import { supabase } from '@/lib/supabase';

export function ProfileView() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Kullanıcı Temel Bilgileri
  const [userName, setUserName] = useState("Öğrenci");
  const [schoolInfo, setSchoolInfo] = useState("Üniversite");
  const [status, setStatus] = useState<"available" | "busy" | "away">("available");
  
  // Düzenlenebilir Veriler (Supabase Veritabanı / Metadata)
  const [bio, setBio] = useState("");
  const [teaches, setTeaches] = useState<string[]>([]);
  const [learns, setLearns] = useState<string[]>([]);
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [instagram, setInstagram] = useState("");
  
  // Gizlilik Ayarları State'leri
  const [locationVisible, setLocationVisible] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);
  const [showOnline, setShowOnline] = useState(true);

  // Müsaitlik Matrisi (7 Gün x 3 Slot) - Seçili slotları koordinat formatında tutar: "gun-slot"
  const [availability, setAvailability] = useState<string[]>([
    "0-0", "0-1", "1-0", "1-1", "2-0", "2-1", "3-0", "3-1", "4-0", "4-1", "5-1"
  ]);

  // Sayfa açıldığında verileri yükle
  useEffect(() => {
    async function fetchProfileData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.user_metadata) {
        const metadata = user.user_metadata;
        if (metadata.first_name) setUserName(`${metadata.first_name} ${metadata.last_name || ''}`.trim());
        if (metadata.university) setSchoolInfo(`${metadata.university} ${metadata.department ? `· ${metadata.department}` : ''}`);
        
        setBio(metadata.bio || "Henüz bir biyografi eklenmemiş.");
        setTeaches(metadata.teaches || ["React", "SQL", "TypeScript"]);
        setLearns(metadata.learns || ["İngilizce", "Tasarım"]);
        setLinkedin(metadata.linkedin || "");
        setGithub(metadata.github || "");
        setInstagram(metadata.instagram || "");
        
        if (metadata.locationVisible !== undefined) setLocationVisible(metadata.locationVisible);
        if (metadata.profilePublic !== undefined) setProfilePublic(metadata.profilePublic);
        if (metadata.showOnline !== undefined) setShowOnline(metadata.showOnline);
        if (metadata.availability) setAvailability(metadata.availability);
      }
      setLoading(false);
    }
    fetchProfileData();
  }, []);

  // Tüm değişiklikleri toplu olarak Supabase'e kaydetme fonksiyonu
  const handleSaveChanges = async () => {
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        bio,
        teaches,
        learns,
        linkedin,
        github,
        instagram,
        locationVisible,
        profilePublic,
        showOnline,
        availability
      }
    });

    if (!error) {
      setEditMode(false);
    } else {
      alert("Ayarlar kaydedilirken bir hata oluştu.");
    }
    setIsSaving(false);
  };

  // Beceriler Listesine Eleman Ekleme
  const handleAddSkill = (type: "teaches" | "learns") => {
    const skillName = prompt("Eklemek istediğiniz beceriyi yazın:");
    if (!skillName || skillName.trim() === "") return;
    
    if (type === "teaches") {
      setTeaches([...teaches, skillName.trim()]);
    } else {
      setLearns([...learns, skillName.trim()]);
    }
  };

  // Beceriler Listesinden Eleman Silme
  const handleRemoveSkill = (type: "teaches" | "learns", skillToRemove: string) => {
    if (type === "teaches") {
      setTeaches(teaches.filter(s => s !== skillToRemove));
    } else {
      setLearns(learns.filter(s => s !== skillToRemove));
    }
  };

  // Müsaitlik Slotuna Tıklama Mantığı
  const handleToggleSlot = (dayIndex: number, slotIndex: number) => {
    const slotKey = `${dayIndex}-${slotIndex}`;
    if (availability.includes(slotKey)) {
      setAvailability(availability.filter(key => key !== slotKey));
    } else {
      setAvailability([...availability, slotKey]);
    }
  };

  const handlePhotoClick = () => {
    alert("Profil ve kapak resmi yükleme özelliği pilot aşamasında yerel disk üzerinden simüle edilmektedir.");
  };

  if (loading) {
    return <div className="p-6 flex justify-center text-muted-foreground animate-pulse">Profil verileri doğrulanıyor...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Kapak Fotoğrafı + Profil Kartı */}
      <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
        <div className="relative h-36 sm:h-48" style={{ background: "var(--sb-gradient)" }}>
          <button onClick={handlePhotoClick} className="absolute top-3 right-3 p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
            <Camera size={16} />
          </button>
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-extrabold text-white border-4 border-card shadow-xl"
                style={{ background: "var(--sb-gradient)" }}>
                {userName.charAt(0)}
              </div>
              <button onClick={handlePhotoClick} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                style={{ background: "var(--sb-gradient)" }}>
                <Camera size={12} />
              </button>
              <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full border-2 border-card ${status === "available" ? "bg-green-400" : status === "busy" ? "bg-red-400" : "bg-yellow-400"}`} />
            </div>
            
            <div className="flex-1 pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-foreground truncate">{userName}</h1>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white whitespace-nowrap" style={{ background: "var(--sb-gradient)" }}>
                  <Check size={10} /> Kampüs Doğrulaması
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
                <span className="flex items-center gap-1"><GraduationCap size={13} /> {schoolInfo}</span>
                <span className="flex items-center gap-1"><MapPin size={13} /> İstanbul, Türkiye</span>
              </div>
            </div>
            
            <div className="flex gap-2 pb-1">
              <select value={status} onChange={e => setStatus(e.target.value as any)}
                className="text-xs rounded-xl px-3 py-2 border border-border bg-muted text-foreground outline-none cursor-pointer font-medium">
                <option value="available">🟢 Müsait</option>
                <option value="busy">🔴 Meşgul</option>
                <option value="away">🟡 Uzakta</option>
              </select>
            </div>
          </div>

          {/* İstatistik Göstergeleri */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "Oturum", value: "24" },
              { label: "Puanlama", value: "4.9 ⭐" },
              { label: "Beceri Puanı", value: "2,450" },
              { label: "Güven Skoru", value: "9.2" },
            ].map(stat => (
              <div key={stat.label} className="text-center p-2 rounded-xl bg-muted/50">
                <div className="font-extrabold text-foreground text-sm sm:text-base">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Biyografi Alanı */}
          <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 relative">
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hakkımda</h4>
              {!editMode && (
                <button onClick={() => setEditMode(true)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  <Edit2 size={14} />
                </button>
              )}
            </div>
            {editMode ? (
              <div className="space-y-3 mt-2">
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                  className="w-full text-sm text-foreground bg-background border border-primary/20 rounded-xl px-3 py-2 outline-none resize-none leading-relaxed" />
              </div>
            ) : (
              <p className="text-sm text-foreground/90 leading-relaxed">{bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* İki Sütunlu Alt Gövde */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Öğretebileceğim Beceriler */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#4338ca18" }}>
                  <GraduationCap size={16} style={{ color: "#4338ca" }} />
                </div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">Öğretebileceğim Beceriler</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {teaches.map(skill => (
                <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-indigo-600/90 shadow-sm" style={{ background: "var(--sb-gradient)" }}>
                  {skill}
                  <button onClick={() => handleRemoveSkill("teaches", skill)} className="opacity-70 hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => handleAddSkill("teaches")} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
            <Plus size={13} /> Yeni Beceri Ekle
          </button>
        </div>

        {/* Öğrenmek İstediğim Beceriler */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#06b6d418" }}>
                  <BookOpen size={16} style={{ color: "#06b6d4" }} />
                </div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">Öğrenmek İstediğim Beceriler</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {learns.map(skill => (
                <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-900 shadow-sm">
                  {skill}
                  <button onClick={() => handleRemoveSkill("learns", skill)} className="opacity-70 hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => handleAddSkill("learns")} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border-2 border-dashed border-border text-muted-foreground hover:border-cyan-400 hover:text-cyan-500 hover:bg-cyan-500/5 transition-all">
            <Plus size={13} /> Yeni İlgi Alanı Ekle
          </button>
        </div>

        {/* Haftalık Müsaitlik Matrisi */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <h3 className="font-bold text-foreground mb-3 text-sm sm:text-base">Haftalık Müsaitlik Saatleri</h3>
          <p className="text-xs text-muted-foreground mb-3">Müsait olduğunuz zaman dilimlerini seçmek için hücrelerin üzerine tıklayın.</p>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day, i) => (
              <div key={day} className="text-center">
                <div className="text-[10px] font-bold text-muted-foreground mb-1.5">{day}</div>
                {[0, 1, 2].map(slot => {
                  const isAvailable = availability.includes(`${i}-${slot}`);
                  return (
                    <div key={slot} onClick={() => handleToggleSlot(i, slot)}
                      className={`h-7 rounded-md mb-1 cursor-pointer transition-all hover:scale-105 active:scale-95 border border-transparent ${
                        isAvailable ? "shadow-sm" : "bg-muted opacity-40 hover:opacity-70"
                      }`}
                      style={isAvailable ? { background: "var(--sb-gradient)" } : {}}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: "var(--sb-gradient)" }} /> Uygun Saat dilimi</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-muted opacity-60" /> Dolu / Belirtilmemiş</span>
          </div>
        </div>

        {/* Gizlilik Ayarları ve Sosyal Medya */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <h3 className="font-bold text-foreground text-sm sm:text-base">Gizlilik & Sosyal Medya</h3>
          
          <div className="space-y-2">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-xs font-medium text-foreground">Konumumu diğer eşleşmelere göster</span>
              <button onClick={() => setLocationVisible(!locationVisible)}
                className={`w-9 h-5 rounded-full transition-all relative ${locationVisible ? "bg-indigo-600" : "bg-muted"}`}
                style={locationVisible ? { background: "var(--sb-gradient)" } : {}}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${locationVisible ? "left-4.5" : "left-0.5"}`} />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-xs font-medium text-foreground">Profilimi kampüs genelinde aratılabilir yap</span>
              <button onClick={() => setProfilePublic(!profilePublic)}
                className={`w-9 h-5 rounded-full transition-all relative ${profilePublic ? "bg-indigo-600" : "bg-muted"}`}
                style={profilePublic ? { background: "var(--sb-gradient)" } : {}}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${profilePublic ? "left-4.5" : "left-0.5"}`} />
              </button>
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/40">
              <span className="text-xs font-medium text-foreground">Çevrimiçi durumumu aktif et</span>
              <button onClick={() => setShowOnline(!showOnline)}
                className={`w-9 h-5 rounded-full transition-all relative ${showOnline ? "bg-indigo-600" : "bg-muted"}`}
                style={showOnline ? { background: "var(--sb-gradient)" } : {}}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showOnline ? "left-4.5" : "left-0.5"}`} />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Bağlantılar</h4>
            {editMode ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background">
                  <Linkedin size={13} className="text-blue-500" />
                  <input value={linkedin} onChange={e => setLinkedin(e.target.value)} className="flex-1 text-xs bg-transparent outline-none text-foreground" placeholder="LinkedIn URL" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background">
                  <Github size={13} className="text-foreground" />
                  <input value={github} onChange={e => setGithub(e.target.value)} className="flex-1 text-xs bg-transparent outline-none text-foreground" placeholder="GitHub kullanıcı adı" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background">
                  <Instagram size={13} className="text-pink-500" />
                  <input value={instagram} onChange={e => setInstagram(e.target.value)} className="flex-1 text-xs bg-transparent outline-none text-foreground" placeholder="Instagram kullanıcı adı" />
                </div>
              </div>
            ) : (
              <div className="flex gap-3 text-muted-foreground pt-1">
                {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" className="hover:text-blue-500 transition-colors"><Linkedin size={16} /></a>}
                {github && <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors"><Github size={16} /></a>}
                {instagram && <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="hover:text-pink-500 transition-colors"><Instagram size={16} /></a>}
                {!linkedin && !github && !instagram && <span className="text-xs text-muted-foreground italic">Sosyal medya bağı kurulmamış. Düzenleme modundan ekleyin.</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kaydetme Paneli (Alt Bar) */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {editMode ? "Şu an düzenleme modundasınız." : "Profilinizi güncellemek için düzenle ikonuna tıklayın."}
        </span>
        {editMode ? (
          <div className="flex gap-2">
            <button onClick={() => setEditMode(false)} className="px-3 py-1.5 rounded-xl text-xs border border-border text-muted-foreground hover:bg-muted">
              İptal
            </button>
            <button onClick={handleSaveChanges} disabled={isSaving}
              className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs text-white font-medium hover:opacity-95 shadow-md disabled:opacity-50"
              style={{ background: "var(--sb-gradient)" }}>
              <Check size={12} /> {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditMode(true)} className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 font-medium transition-all">
            <Edit2 size={12} /> Profili Düzenle
          </button>
        )}
      </div>
    </div>
  );
}