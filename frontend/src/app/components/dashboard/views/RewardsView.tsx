import { useState } from "react";
import { motion } from "motion/react";
import { Coins, Gift, Lock, Unlock, Zap, Trophy, Medal, ArrowRight, Ticket, Users, GraduationCap } from "lucide-react";

// Mock Veriler (Gelecekte Backend'den gelecek)
const MOCK_USER_STATS = {
  skillCoins: 345,
  classesTaken: 12,
  classesTaught: 0, // 0 olduğu için Mentor görüşmesi kilitli görünecek!
};

export function RewardsView() {
  const [buying, setBuying] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleBuy = (itemName: string, cost: number) => {
    setBuying(itemName);
    setTimeout(() => {
      setBuying(null);
      setSuccessMsg(`Tebrikler! ${cost} SkillCoin harcayarak '${itemName}' aldınız.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      {/* BAŞLIK VE COIN KARTI */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            Ödül & Market <Gift className="text-primary" size={24} />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">SkillCoin kazan, harca ve ayrıcalıkların tadını çıkar.</p>
        </div>

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="relative px-6 py-4 rounded-3xl overflow-hidden shadow-lg border border-white/20 min-w-[240px]"
          style={{ background: "var(--sb-gradient)" }}
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-center justify-between gap-6">
            <div>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Mevcut Bakiye</p>
              <div className="text-4xl font-extrabold text-white">{MOCK_USER_STATS.skillCoins}</div>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30">
              <Coins size={28} className="text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <Zap size={18} className="text-emerald-500" /> {successMsg}
        </motion.div>
      )}

      {/* MARKET (HARCAMA ALANI) */}
      <section>
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-4 ml-1 flex items-center gap-2">
          <Gift size={16} /> Market (Coin Harca)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Ürün 1: Çekiliş */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col transition-all hover:shadow-md hover:border-primary/30">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <Ticket size={24} />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-1">Masterclass Çekilişi</h3>
            <p className="text-xs text-muted-foreground flex-1 mb-6">Özel konukların katıldığı kapalı masterclass eğitimi için çekiliş hakkı.</p>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="font-extrabold text-primary flex items-center gap-1.5"><Coins size={16}/> 20</span>
              <button 
                onClick={() => handleBuy("Masterclass Çekiliş Hakkı", 20)}
                disabled={buying === "Masterclass Çekiliş Hakkı"}
                className="px-4 py-2 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary hover:text-white transition-colors"
              >
                {buying === "Masterclass Çekiliş Hakkı" ? "Alınıyor..." : "Satın Al"}
              </button>
            </div>
          </div>

          {/* Ürün 2: Özel Etkinlik */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col transition-all hover:shadow-md hover:border-primary/30">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <Users size={24} />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-1">Grup Workshop'u</h3>
            <p className="text-xs text-muted-foreground flex-1 mb-6">Sınırlı kontenjanlı özel online workshop etkinliklerine doğrudan katılım bileti.</p>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="font-extrabold text-primary flex items-center gap-1.5"><Coins size={16}/> 50</span>
              <button 
                onClick={() => handleBuy("Grup Workshop Bileti", 50)}
                disabled={buying === "Grup Workshop Bileti"}
                className="px-4 py-2 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary hover:text-white transition-colors"
              >
                {buying === "Grup Workshop Bileti" ? "Alınıyor..." : "Satın Al"}
              </button>
            </div>
          </div>

          {/* Ürün 3: Mentor Görüşmesi (KİLİTLİ ÖZELLİK ÖRNEĞİ) */}
          <div className="relative p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
            {/* Kilit Ekranı (Eğitim vermeyenler için) */}
            {MOCK_USER_STATS.classesTaught === 0 && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-2 shadow-sm">
                  <Lock size={18} />
                </div>
                <span className="text-xs font-bold text-foreground bg-background px-3 py-1 rounded-full shadow-sm">En az 1 eğitim vermelisin</span>
              </div>
            )}

            <div className={`flex flex-col flex-1 ${MOCK_USER_STATS.classesTaught === 0 ? 'opacity-50 grayscale' : ''}`}>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <GraduationCap size={24} />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-1">1:1 Mentor Görüşmesi</h3>
              <p className="text-xs text-muted-foreground flex-1 mb-6">Sektör profesyonelleriyle 45 dakikalık özel kariyer yönlendirme seansı.</p>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="font-extrabold text-primary flex items-center gap-1.5"><Coins size={16}/> 100</span>
                <button disabled className="px-4 py-2 bg-primary/10 text-primary font-bold text-xs rounded-xl">
                  Satın Al
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* NASIL KAZANILIR & ROZETLER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* Nasıl Kazanırım? */}
        <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
            <Zap size={16} /> Nasıl Kazanırım?
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <span className="text-sm font-bold text-foreground">Eğitim Almak</span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">+20 Coin</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <span className="text-sm font-bold text-foreground">Eğitim Vermek</span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">+20 Coin</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <span className="text-sm font-bold text-foreground">Değerlendirme Bırakmak</span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">+5 Coin</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <span className="text-sm font-bold text-foreground">Profili %100 Tamamlamak</span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">+15 Coin</span>
            </div>
          </div>
        </section>

        {/* Rozetler */}
        <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
            <Trophy size={16} /> Başarı Rozetleri
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-xl border border-primary/20 bg-primary/5">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <Medal size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground">Çok Yönlü Öğrenci</h4>
                <p className="text-[11px] text-muted-foreground">3 farklı beceri öğrendin.</p>
              </div>
              <span className="text-xs font-extrabold text-primary">+50 Coin</span>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-xl border border-border bg-muted/30 opacity-60">
              <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                <Lock size={16} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground">İlk Kıvılcım</h4>
                <p className="text-[11px] text-muted-foreground">İlk eğitimini verdin.</p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">+20 Coin</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}