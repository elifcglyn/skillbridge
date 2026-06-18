import { Check, UserCheck, X } from "lucide-react";
import type {
  PendingProfile,
  ProfileApprovalStatus,
} from "./admin.types";

type PendingProfilesSectionProps = {
  profiles: PendingProfile[];
  onStatusChange: (
    profileId: string,
    status: Exclude<ProfileApprovalStatus, "pending">,
  ) => void;
};

const STATUS_LABELS: Record<ProfileApprovalStatus, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

function StatusBadge({ status }: { status: ProfileApprovalStatus }) {
  const className =
    status === "approved"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : status === "rejected"
        ? "bg-red-500/10 text-red-600 dark:text-red-300"
        : "bg-amber-500/10 text-amber-700 dark:text-amber-300";

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function DecisionButtons({
  profile,
  onStatusChange,
}: {
  profile: PendingProfile;
  onStatusChange: PendingProfilesSectionProps["onStatusChange"];
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={profile.status === "approved"}
        onClick={() => onStatusChange(profile.id, "approved")}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 disabled:opacity-40"
      >
        <Check size={13} /> Onayla
      </button>
      <button
        type="button"
        disabled={profile.status === "rejected"}
        onClick={() => onStatusChange(profile.id, "rejected")}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-300 text-xs font-bold hover:bg-red-500/20 disabled:opacity-40"
      >
        <X size={13} /> Reddet
      </button>
    </div>
  );
}

export function PendingProfilesSection({
  profiles,
  onStatusChange,
}: PendingProfilesSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-600">
            <UserCheck size={19} />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Bekleyen Profil Onayları</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Yeni profillerin beceri ve okul bilgilerini inceleyin.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-700 bg-amber-500/10 px-2.5 py-1 rounded-lg">
          {profiles.filter((profile) => profile.status === "pending").length} bekliyor
        </span>
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-semibold">Kullanıcı</th>
              <th className="px-4 py-3 text-left font-semibold">Bölüm / Sınıf</th>
              <th className="px-4 py-3 text-left font-semibold">Öğretiyor</th>
              <th className="px-4 py-3 text-left font-semibold">Öğreniyor</th>
              <th className="px-4 py-3 text-left font-semibold">Durum</th>
              <th className="px-5 py-3 text-right font-semibold">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-5 py-4 font-semibold text-foreground">{profile.name}</td>
                <td className="px-4 py-4 text-muted-foreground">
                  {profile.department}
                  <div className="text-xs mt-0.5">{profile.grade}</div>
                </td>
                <td className="px-4 py-4 text-foreground">{profile.teaches}</td>
                <td className="px-4 py-4 text-foreground">{profile.learns}</td>
                <td className="px-4 py-4"><StatusBadge status={profile.status} /></td>
                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <DecisionButtons profile={profile} onStatusChange={onStatusChange} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden divide-y divide-border">
        {profiles.map((profile) => (
          <div key={profile.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-foreground">{profile.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {profile.department} · {profile.grade}
                </div>
              </div>
              <StatusBadge status={profile.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40">
                <div className="text-muted-foreground mb-1">Öğretiyor</div>
                <div className="font-semibold text-foreground">{profile.teaches}</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <div className="text-muted-foreground mb-1">Öğreniyor</div>
                <div className="font-semibold text-foreground">{profile.learns}</div>
              </div>
            </div>
            <DecisionButtons profile={profile} onStatusChange={onStatusChange} />
          </div>
        ))}
      </div>
    </section>
  );
}
