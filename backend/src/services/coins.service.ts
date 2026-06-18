import { getPrismaClient } from "../lib/prisma.js";

export const MARKET_PRODUCTS = {
  masterclass_raffle: {
    id: "masterclass_raffle",
    name: "Masterclass Çekiliş Hakkı",
    description:
      "Özel konukların katıldığı kapalı masterclass eğitimi için çekiliş hakkı.",
    cost: 20,
    eventType: "masterclass_purchase",
    requiresCompletedTeaching: false,
  },
  group_workshop: {
    id: "group_workshop",
    name: "Grup Workshop Bileti",
    description:
      "Sınırlı kontenjanlı özel online workshop etkinliklerine doğrudan katılım bileti.",
    cost: 50,
    eventType: "group_workshop_purchase",
    requiresCompletedTeaching: false,
  },
  mentor_session: {
    id: "mentor_session",
    name: "1:1 Mentor Görüşmesi",
    description:
      "Sektör profesyonelleriyle 45 dakikalık özel kariyer yönlendirme seansı.",
    cost: 100,
    eventType: "mentor_session_purchase",
    requiresCompletedTeaching: true,
  },
} as const;

export type MarketProductId = keyof typeof MARKET_PRODUCTS;

type ProfileBalanceRow = {
  id: string;
  coin_balance: number;
  skill_points: number | null;
};

type PurchaseRow = {
  id: string;
  user_id: string;
  product_id: string;
  point_event_id: string;
  cost: number;
  status: string;
  idempotency_key: string;
  created_at: Date;
};

type CountRow = {
  completed_teaching_count: number;
};

type QueryExecutor = Pick<
  ReturnType<typeof getPrismaClient>,
  "$queryRaw" | "$executeRaw"
>;

export class CoinActionError extends Error {
  constructor(
    public readonly code:
      | "PROFILE_NOT_FOUND"
      | "UNKNOWN_PRODUCT"
      | "PRODUCT_LOCKED"
      | "INSUFFICIENT_BALANCE"
      | "IDEMPOTENCY_CONFLICT",
    message: string,
  ) {
    super(message);
  }
}

function normalizePurchase(row: PurchaseRow) {
  const product = MARKET_PRODUCTS[row.product_id as MarketProductId];

  return {
    id: row.id,
    productId: row.product_id,
    productName: product?.name ?? row.product_id,
    pointEventId: row.point_event_id,
    cost: row.cost,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function getCompletedTeachingCount(
  executor: QueryExecutor,
  userId: string,
) {
  const rows = await executor.$queryRaw<CountRow[]>`
    SELECT count(*)::int AS completed_teaching_count
    FROM public.sessions
    WHERE mentor_id::text = ${userId}
      AND lower(coalesce(status, 'scheduled')) = 'completed';
  `;

  return rows[0]?.completed_teaching_count ?? 0;
}

function productList(completedTeachingCount: number) {
  return Object.values(MARKET_PRODUCTS).map((product) => {
    const eligible =
      !product.requiresCompletedTeaching || completedTeachingCount > 0;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      cost: product.cost,
      eventType: product.eventType,
      eligible,
      unavailableReason: eligible
        ? null
        : "Bu hak için en az bir eğitimi mentor olarak tamamlamalısınız.",
    };
  });
}

export async function getCoinOverview(userId: string) {
  const prisma = getPrismaClient();
  const [profiles, completedTeachingCount, purchases] = await Promise.all([
    prisma.$queryRaw<ProfileBalanceRow[]>`
      SELECT id, coin_balance, skill_points
      FROM public.profiles
      WHERE id::text = ${userId}
      LIMIT 1;
    `,
    getCompletedTeachingCount(prisma, userId),
    prisma.$queryRaw<PurchaseRow[]>`
      SELECT
        id,
        user_id,
        product_id,
        point_event_id,
        cost,
        status,
        idempotency_key,
        created_at
      FROM public.market_purchases
      WHERE user_id::text = ${userId}
        AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 20;
    `,
  ]);

  const profile = profiles[0];
  if (!profile) {
    throw new CoinActionError(
      "PROFILE_NOT_FOUND",
      "Coin bakiyesi için kullanıcı profili bulunamadı.",
    );
  }

  return {
    balance: profile.coin_balance,
    skillPoints: profile.skill_points ?? 0,
    completedTeachingCount,
    products: productList(completedTeachingCount),
    purchases: purchases.map(normalizePurchase),
  };
}

export async function spendCoins(params: {
  userId: string;
  productId: string;
  idempotencyKey: string;
}) {
  const product = MARKET_PRODUCTS[params.productId as MarketProductId];
  if (!product) {
    throw new CoinActionError(
      "UNKNOWN_PRODUCT",
      "Geçerli bir market ürünü seçilmelidir.",
    );
  }

  const prisma = getPrismaClient();
  return prisma.$transaction(async (transaction) => {
    const executor = transaction as QueryExecutor;
    const profiles = await executor.$queryRaw<ProfileBalanceRow[]>`
      SELECT id, coin_balance, skill_points
      FROM public.profiles
      WHERE id::text = ${params.userId}
      FOR UPDATE;
    `;
    const profile = profiles[0];

    if (!profile) {
      throw new CoinActionError(
        "PROFILE_NOT_FOUND",
        "Coin bakiyesi için kullanıcı profili bulunamadı.",
      );
    }

    const existingPurchases = await executor.$queryRaw<PurchaseRow[]>`
      SELECT
        id,
        user_id,
        product_id,
        point_event_id,
        cost,
        status,
        idempotency_key,
        created_at
      FROM public.market_purchases
      WHERE user_id::text = ${params.userId}
        AND idempotency_key = ${params.idempotencyKey}
      LIMIT 1;
    `;
    const existingPurchase = existingPurchases[0];

    if (existingPurchase) {
      if (existingPurchase.product_id !== product.id) {
        throw new CoinActionError(
          "IDEMPOTENCY_CONFLICT",
          "Bu işlem anahtarı başka bir ürün için daha önce kullanılmış.",
        );
      }

      return {
        balance: profile.coin_balance,
        skillPoints: profile.skill_points ?? 0,
        purchase: normalizePurchase(existingPurchase),
        idempotentReplay: true,
      };
    }

    if (product.requiresCompletedTeaching) {
      const completedTeachingCount = await getCompletedTeachingCount(
        executor,
        params.userId,
      );
      if (completedTeachingCount < 1) {
        throw new CoinActionError(
          "PRODUCT_LOCKED",
          "Bu hak için en az bir eğitimi mentor olarak tamamlamalısınız.",
        );
      }
    }

    if (profile.coin_balance < product.cost) {
      throw new CoinActionError(
        "INSUFFICIENT_BALANCE",
        `Bu ürün için ${product.cost} SkillCoin gerekiyor.`,
      );
    }

    const pointEvents = await executor.$queryRaw<{ id: string }[]>`
      INSERT INTO public.point_events (
        user_id,
        amount,
        event_type,
        description
      )
      VALUES (
        ${params.userId}::uuid,
        ${-product.cost},
        ${product.eventType},
        ${product.name}
      )
      RETURNING id;
    `;

    const purchases = await executor.$queryRaw<PurchaseRow[]>`
      INSERT INTO public.market_purchases (
        user_id,
        product_id,
        point_event_id,
        cost,
        status,
        idempotency_key
      )
      VALUES (
        ${params.userId}::uuid,
        ${product.id},
        ${pointEvents[0].id}::uuid,
        ${product.cost},
        'active',
        ${params.idempotencyKey}
      )
      RETURNING
        id,
        user_id,
        product_id,
        point_event_id,
        cost,
        status,
        idempotency_key,
        created_at;
    `;

    const updatedProfiles = await executor.$queryRaw<ProfileBalanceRow[]>`
      UPDATE public.profiles
      SET coin_balance = coin_balance - ${product.cost}
      WHERE id::text = ${params.userId}
      RETURNING id, coin_balance, skill_points;
    `;

    return {
      balance: updatedProfiles[0].coin_balance,
      skillPoints: updatedProfiles[0].skill_points ?? 0,
      purchase: normalizePurchase(purchases[0]),
      idempotentReplay: false,
    };
  });
}
