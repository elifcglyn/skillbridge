import { apiGet, apiSend } from "./api";

export type MarketProduct = {
  id: "masterclass_raffle" | "group_workshop" | "mentor_session";
  name: string;
  description: string;
  cost: number;
  eventType: string;
  eligible: boolean;
  unavailableReason: string | null;
};

export type MarketPurchase = {
  id: string;
  productId: string;
  productName: string;
  pointEventId: string;
  cost: number;
  status: string;
  createdAt: string;
};

export type CoinOverview = {
  balance: number;
  skillPoints: number;
  completedTeachingCount: number;
  products: MarketProduct[];
  purchases: MarketPurchase[];
};

export type CoinSpendResult = {
  balance: number;
  skillPoints: number;
  purchase: MarketPurchase;
  idempotentReplay: boolean;
};

export async function getCoinOverview() {
  const response = await apiGet<{ data: CoinOverview }>("/api/coins");
  return response.data;
}

export async function spendCoins(
  productId: MarketProduct["id"],
  idempotencyKey: string,
) {
  const response = await apiSend<{ data: CoinSpendResult }>(
    "/api/coins/spend",
    "POST",
    { productId },
    { "Idempotency-Key": idempotencyKey },
  );
  return response.data;
}
