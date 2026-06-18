import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Shield, Bell, Key, LogOut, Trash2, Check, X, Mail, Phone, Lock, Eye, AlertTriangle } from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type SettingsData = {
  profilePublic: boolean;
  isEmailPublic: boolean;
  isPhonePublic: boolean;
};

// Yeniden Kullanılabilir Şık Toggle Bileşeni
const ToggleRow = ({ label, description, icon: Icon, checked, onChange }: { label: string, description?: string, icon?: any, checked: boolean, onChange: () => void }) => (
  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
    <div className="flex items-start gap-3">
      {Icon && <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5"><Icon size={16} /></div>}
      <div>
        <span className="text-sm font-bold text-foreground block">{label}</span>
        {description && <span className="text-[11px] font-medium text-muted-foreground mt-0.5 block">{description}</span>}
      </div>
    </div>
    <button onClick={onChange} className={`relative w-11 h-6 rounded-full p-1 transition-colors flex-shrink-0 outline-none ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}>
      <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  </div>
);

export function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Ayarlar State'leri
  const [settings, setSettings] = useState<SettingsData>({
    profilePublic: true,
    isEmailPublic: false,
    isPhonePublic: false,
  });

  // Bildirim State'leri (UI için placeholder)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [matchNotifs, setMatchNotifs] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setUserEmail(user.email || "");

        // Ayşenur'un yazdığı profiles endpoint'inden mevcut gizlilik verilerini çekiyoruz
        const response = await apiGet<{ data: any }>("/api/profiles");
        if (response.data) {
          setSettings({
            profilePublic: response.data.profilePublic ?? true,
            isEmailPublic: response.data.isEmailPublic ?? false,
            isPhonePublic: response.data.isPhonePublic ?? false,
          });
        }
      } catch (err) {
        setError("Ayarlar yüklenirken bir sorun oluştu.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Backend'e sadece değişen gizlilik verilerini gönderiyoruz
      await apiSend("/api/profiles", "PUT", settings);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError("Ayarlar kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; // Çıkış yapınca ana sayfaya/login'e yönlendir
  };

  if (loading) {
    return <div className="p-6 flex justify-center text-muted-foreground animate-pulse">Ayarlar yükleniyor...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 pb-24">
      {/* Sayfa Başlığı ve Kaydet Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Ayarlar</h1>
          <p className="text-sm text-muted-foreground mt-1">Hesap tercihlerinizi ve gizlilik ayarlarınızı yönetin.</p>
        </div>
        <button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ background: "var(--sb-gradient)" }}
        >
          {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </button>
      </div>

      {error && <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700">{error}</div>}
      
      {saveSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <Check size={18} className="text-emerald-500" /> Ayarlarınız başarıyla güncellendi.
        </motion.div>
      )}

      {/* 1. HESAP GÜVENLİĞİ */}
      <section className="space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground ml-1">Hesap & Güvenlik</h2>
        <div className="p-1 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-foreground"><Mail size={16} /></div>
              <div>
                <span className="text-sm font-bold text-foreground block">E-posta Adresi</span>
                <span className="text-xs font-medium text-muted-foreground">{userEmail}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold rounded-full uppercase tracking-wider">Doğrulandı</span>
          </div>
          
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-b-2xl group outline-none">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"><Key size={16} /></div>
              <span className="text-sm font-bold text-foreground">Şifreyi Değiştir</span>
            </div>
          </button>
        </div>
      </section>

      {/* 2. GİZLİLİK VE KVKK */}
      <section className="space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground ml-1">Gizlilik & Görünürlük (KVKK)</h2>
        <div className="space-y-2">
          <ToggleRow 
            icon={Eye}
            label="Profil Herkese Açık" 
            description="Kapattığınızda, platformdaki aramalar ve AI eşleşmelerinde profiliniz gizlenir."
            checked={settings.profilePublic} 
            onChange={() => setSettings({ ...settings, profilePublic: !settings.profilePublic })} 
          />
          <ToggleRow 
            icon={Lock}
            label="E-posta Adresini Paylaş" 
            description="Aktif ederseniz, yalnızca onaylı eşleşmeleriniz .edu.tr adresinizi görebilir."
            checked={settings.isEmailPublic} 
            onChange={() => setSettings({ ...settings, isEmailPublic: !settings.isEmailPublic })} 
          />
          <ToggleRow 
            icon={Phone}
            label="Telefon Numarasını Paylaş" 
            description="Aktif ederseniz, iletişim için numaranız eşleştiğiniz kişilere açılır."
            checked={settings.isPhonePublic} 
            onChange={() => setSettings({ ...settings, isPhonePublic: !settings.isPhonePublic })} 
          />
        </div>
      </section>

      {/* 3. BİLDİRİMLER */}
      <section className="space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground ml-1">Bildirim Tercihleri</h2>
        <div className="space-y-2">
          <ToggleRow 
            icon={Bell}
            label="Yeni Eşleşme Bildirimleri" 
            description="AI yeni bir eşleşme bulduğunda haberdar olun."
            checked={matchNotifs} 
            onChange={() => setMatchNotifs(!matchNotifs)} 
          />
          <ToggleRow 
            icon={Mail}
            label="E-posta Bildirimleri" 
            description="Mesaj ve randevu hatırlatıcılarını e-posta olarak alın."
            checked={emailNotifs} 
            onChange={() => setEmailNotifs(!emailNotifs)} 
          />
        </div>
      </section>

      {/* 4. TEHLİKELİ BÖLGE */}
      <section className="space-y-4 pt-6">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-red-500 ml-1">Tehlikeli Bölge</h2>
        <div className="p-1 rounded-2xl border border-red-100 bg-red-50/50">
          <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors border-b border-red-100 outline-none">
            <div className="flex items-center gap-3 text-red-600">
              <LogOut size={18} />
              <span className="text-sm font-bold">Güvenli Çıkış Yap</span>
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between p-4 hover:bg-red-100 transition-colors rounded-b-2xl outline-none group">
            <div className="flex items-center gap-3 text-red-600">
              <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <span className="text-sm font-bold block">Hesabımı Kalıcı Olarak Sil</span>
                <span className="text-[11px] font-medium opacity-80">Tüm verileriniz ve eşleşmeleriniz anında silinir.</span>
              </div>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}