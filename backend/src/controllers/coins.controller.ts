import type { Request, Response } from "express";
import {
  CoinActionError,
  getCoinOverview,
  spendCoins,
} from "../services/coins.service.js";

function coinErrorResponse(error: CoinActionError, response: Response) {
  if (error.code === "PROFILE_NOT_FOUND") {
    return response.status(404).json({ message: error.message });
  }
  if (error.code === "PRODUCT_LOCKED") {
    return response.status(403).json({ message: error.message });
  }
  if (
    error.code === "INSUFFICIENT_BALANCE"
    || error.code === "IDEMPOTENCY_CONFLICT"
  ) {
    return response.status(409).json({ message: error.message });
  }
  return response.status(400).json({ message: error.message });
}

export async function getCoinsController(request: Request, response: Response) {
  try {
    const overview = await getCoinOverview(request.auth.userId);
    response.setHeader("cache-control", "private, no-store");
    return response.json({ data: overview });
  } catch (error) {
    if (error instanceof CoinActionError) {
      return coinErrorResponse(error, response);
    }
    console.error("Coins overview endpoint error:", error);
    return response.status(500).json({
      message: "Coin bilgileri alınırken bir hata oluştu.",
    });
  }
}

export async function spendCoinsController(
  request: Request,
  response: Response,
) {
  try {
    const productId = String(request.body?.productId ?? "").trim();
    const idempotencyKey = String(
      request.header("idempotency-key") ?? "",
    ).trim();

    if (!productId) {
      return response.status(400).json({
        message: "productId zorunludur.",
      });
    }
    if (!idempotencyKey || idempotencyKey.length > 200) {
      return response.status(400).json({
        message: "Geçerli bir Idempotency-Key başlığı zorunludur.",
      });
    }

    const result = await spendCoins({
      userId: request.auth.userId,
      productId,
      idempotencyKey,
    });
    response.setHeader("cache-control", "private, no-store");
    return response.status(result.idempotentReplay ? 200 : 201).json({
      data: result,
    });
  } catch (error) {
    if (error instanceof CoinActionError) {
      return coinErrorResponse(error, response);
    }
    console.error("Coins spend endpoint error:", error);
    return response.status(500).json({
      message: "Coin harcama işlemi tamamlanamadı.",
    });
  }
}
