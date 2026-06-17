import type { Request, Response } from "express";
import { getProfile, upsertProfile } from "../services/profiles.service.js";

export async function getProfileController(request: Request, response: Response) {
  try {
    const userId = String(request.query.userId ?? "").trim();

    if (!userId) {
      return response.status(400).json({ message: "userId query parametresi zorunludur." });
    }

    const profile = await getProfile(userId);
    return response.json({ data: profile });
  } catch (error) {
    console.error("Profile get endpoint error:", error);
    return response.status(500).json({ message: "Profil alınırken bir hata oluştu." });
  }
}

export async function upsertProfileController(request: Request, response: Response) {
  try {
    const userId = String(request.body?.userId ?? "").trim();

    if (!userId) {
      return response.status(400).json({ message: "userId body alanı zorunludur." });
    }

    const profile = await upsertProfile({
      userId,
      firstName: request.body?.firstName,
      lastName: request.body?.lastName,
      university: request.body?.university,
      department: request.body?.department,
      bio: request.body?.bio,
      teaches: request.body?.teaches,
      learns: request.body?.learns,
      profilePublic: request.body?.profilePublic,
      avatarUrl: request.body?.avatarUrl,
    });

    return response.json({ data: profile });
  } catch (error) {
    console.error("Profile upsert endpoint error:", error);
    return response.status(500).json({ message: "Profil kaydedilirken bir hata oluştu." });
  }
}
