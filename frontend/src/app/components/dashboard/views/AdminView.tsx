import { useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import {
  ADMIN_BASE_METRICS,
  ADMIN_STATIC_VALUES,
  INITIAL_MODERATION_REPORTS,
  INITIAL_PENDING_PROFILES,
  PLATFORM_ACTIVITIES,
  RECENT_ADMIN_FEEDBACK,
} from "../admin/admin.mock";
import type {
  AdminMetric,
  ProfileApprovalStatus,
  ReportStatus,
} from "../admin/admin.types";
import { AdminSummaryCards } from "../admin/AdminSummaryCards";
import { ModerationSection } from "../admin/ModerationSection";
import { PendingProfilesSection } from "../admin/PendingProfilesSection";
import { PlatformActivitySection } from "../admin/PlatformActivitySection";
import { RecentFeedbackSection } from "../admin/RecentFeedbackSection";

export function AdminView() {
  const [profiles, setProfiles] = useState(INITIAL_PENDING_PROFILES);
  const [reports, setReports] = useState(INITIAL_MODERATION_REPORTS);
  const [notice, setNotice] = useState<string | null>(null);

  const metrics = useMemo<AdminMetric[]>(() => {
    const pendingProfiles = profiles.filter(
      (profile) => profile.status === "pending",
    ).length;
    const openReports = reports.filter(
      (report) => report.status !== "resolved",
    ).length;

    const values = {
      users: ADMIN_STATIC_VALUES.totalUsers.toLocaleString("tr-TR"),
      pendingProfiles: String(pendingProfiles),
      activeMatches: String(ADMIN_STATIC_VALUES.activeMatches),
      scheduledSessions: String(ADMIN_STATIC_VALUES.scheduledSessions),
      reports: String(openReports),
      averageRating: `${ADMIN_STATIC_VALUES.averageRating.toFixed(1)} / 5`,
    };

    return ADMIN_BASE_METRICS.map((metric) => ({
      ...metric,
      value: values[metric.id],
    }));
  }, [profiles, reports]);

  const handleProfileStatus = (
    profileId: string,
    status: Exclude<ProfileApprovalStatus, "pending">,
  ) => {
    const profile = profiles.find((item) => item.id === profileId);
    setProfiles((items) =>
      items.map((item) => (item.id === profileId ? { ...item, status } : item)),
    );
    setNotice(
      `${profile?.name ?? "Profil"} ${
        status === "approved" ? "onaylandı" : "reddedildi"
      }.`,
    );
  };

  const handleReportStatus = (reportId: string, status: ReportStatus) => {
    const report = reports.find((item) => item.id === reportId);
    setReports((items) =>
      items.map((item) => (item.id === reportId ? { ...item, status } : item)),
    );
    setNotice(
      `${report?.reportedUser ?? "Şikâyet"} kaydı ${
        status === "resolved" ? "çözüldü" : "incelemeye alındı"
      }.`,
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-24">
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl border border-primary/15 bg-card shadow-sm">
        <div
          className="absolute inset-0 opacity-70"
          style={{ background: "var(--sb-gradient-soft)" }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
              <ShieldCheck size={14} /> Demo yönetim görünümü
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">
              Yönetim Paneli
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              SkillBridge platformundaki kullanıcı, eşleşme ve güvenlik süreçlerini takip edin.
            </p>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-card/80 border border-white/60 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Sistem Durumu
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Tüm servisler çalışıyor
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} /> {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-bold hover:underline"
          >
            Kapat
          </button>
        </div>
      )}

      <AdminSummaryCards metrics={metrics} />

      <PendingProfilesSection
        profiles={profiles}
        onStatusChange={handleProfileStatus}
      />

      <ModerationSection
        reports={reports}
        onStatusChange={handleReportStatus}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentFeedbackSection feedback={RECENT_ADMIN_FEEDBACK} />
        <PlatformActivitySection activities={PLATFORM_ACTIVITIES} />
      </div>
    </div>
  );
}
