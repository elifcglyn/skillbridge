import type { Request, Response } from "express";
import { getProfile, upsertProfile } from "../services/profiles.service.js";

export async function getProfileController(request: Request, response: Response) {
  try {
    const profile = await getProfile(request.auth.userId);
    return response.json({ data: profile });
  } catch (error) {
    console.error("Profile get endpoint error:", error);
    return response.status(500).json({ message: "Profil alınırken bir hata oluştu." });
  }
}

export async function upsertProfileController(request: Request, response: Response) {
  try {
    const profile = await upsertProfile({
      userId: request.auth.userId,
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
