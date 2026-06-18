import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Coins,
  Gift,
  GraduationCap,
  Lock,
  Medal,
  RefreshCw,
  Ticket,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import {
  getCoinOverview,
  spendCoins,
  type CoinOverview,
  type MarketProduct,
} from "@/lib/coins";

type RewardsViewProps = {
  onBalanceChange?: () => void | Promise<void>;
};

function productIcon(productId: MarketProduct["id"]) {
  if (productId === "masterclass_raffle") return <Ticket size={24} />;
  if (productId === "group_workshop") return <Users size={24} />;
  return <GraduationCap size={24} />;
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `coin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function RewardsView({ onBalanceChange }: RewardsViewProps) {
  const [overview, setOverview] = useState<CoinOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const buyingRef = useRef<string | null>(null);

  const loadCoins = async () => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await getCoinOverview());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Coin bilgileri yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoins();
  }, []);

  const handleBuy = async (product: MarketProduct) => {
    if (!overview || buyingRef.current) return;

    buyingRef.current = product.id;
    setBuying(product.id);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await spendCoins(product.id, createIdempotencyKey());
      setOverview((current) =>
        current
          ? {
              ...current,
              balance: result.balance,
              skillPoints: result.skillPoints,
              purchases: [
                result.purchase,
                ...current.purchases.filter(
                  (purchase) => purchase.id !== result.purchase.id,
                ),
              ],
            }
          : current,
      );
      setSuccessMsg(
        `${result.purchase.productName} alındı. Yeni bakiyeniz ${result.balance} SkillCoin.`,
      );
      await onBalanceChange?.();
    } catch (purchaseError) {
      setError(
        purchaseError instanceof Error
          ? purchaseError.message
          : "Satın alma işlemi tamamlanamadı.",
      );
    } finally {
      buyingRef.current = null;
      setBuying(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            Ödül & Market <Gift className="text-primary" size={24} />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            SkillCoin kazan, harca ve ayrıcalıkların tadını çıkar.
          </p>
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
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">
                Mevcut Bakiye
              </p>
              <div className="text-4xl font-extrabold text-white">
                {loading ? "..." : (overview?.balance ?? 0).toLocaleString("tr-TR")}
              </div>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30">
              <Coins size={28} className="text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadCoins()}
            className="inline-flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={14} /> Yenile
          </button>
        </div>
      )}

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-800 flex items-center gap-2"
        >
          <CheckCircle2 size={18} className="text-emerald-500" />
          {successMsg}
        </motion.div>
      )}

      <section>
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-4 ml-1 flex items-center gap-2">
          <Gift size={16} /> Market
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(overview?.products ?? []).map((product) => {
            const hasEnoughCoins = (overview?.balance ?? 0) >= product.cost;
            const isBuying = buying === product.id;
            const disabled =
              loading || Boolean(buying) || !product.eligible || !hasEnoughCoins;
            const disabledReason = !product.eligible
              ? product.unavailableReason
              : !hasEnoughCoins
                ? `${product.cost - (overview?.balance ?? 0)} SkillCoin daha gerekiyor.`
                : null;

            return (
              <div
                key={product.id}
                className="relative p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col transition-all hover:shadow-md hover:border-primary/30 overflow-hidden"
              >
                {!product.eligible && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                    <Lock size={15} />
                  </div>
                )}
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {productIcon(product.id)}
                </div>
                <h3 className="font-bold text-foreground text-lg mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground flex-1 mb-4">
                  {product.description}
                </p>
                {disabledReason && (
                  <p className="text-[11px] font-semibold text-amber-700 mb-3">
                    {disabledReason}
                  </p>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="font-extrabold text-primary flex items-center gap-1.5">
                    <Coins size={16} /> {product.cost}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleBuy(product)}
                    disabled={disabled}
                    className="px-4 py-2 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBuying ? "Alınıyor..." : "Satın Al"}
                  </button>
                </div>
              </div>
            );
          })}

          {!loading && overview?.products.length === 0 && (
            <div className="md:col-span-3 p-8 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
              Market ürünleri bulunamadı.
            </div>
          )}
        </div>
      </section>

      <section className="p-5 rounded-2xl border border-border bg-card shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Ticket size={16} /> Aktif Haklarım
        </h2>
        {overview?.purchases.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overview.purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40"
              >
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {purchase.productName}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(purchase.createdAt).toLocaleString("tr-TR")}
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                  Aktif
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Henüz satın alınmış aktif bir hakkınız yok.
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
            <Zap size={16} /> Nasıl Kazanırım?
          </h2>
          <div className="space-y-4">
            <RewardRow label="Eğitim Tamamlamak" value="+20 Coin" />
            <RewardRow label="Eğitim Vermek" value="+20 Coin" />
            <RewardRow label="Değerlendirme Bırakmak" value="Yakında" muted />
            <RewardRow label="Profili %100 Tamamlamak" value="Yakında" muted />
          </div>
        </section>

        <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
            <Trophy size={16} /> Başarı Rozetleri
          </h2>
          <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
              <Medal size={18} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-foreground">Rozet Ödülleri</h4>
              <p className="text-[11px] text-muted-foreground">
                Rozet bazlı coin ödülleri sonraki sürümde etkinleştirilecek.
              </p>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              Yakında
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function RewardRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span
        className={`text-xs font-extrabold px-2 py-1 rounded-md ${
          muted
            ? "text-muted-foreground bg-muted"
            : "text-emerald-600 bg-emerald-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
