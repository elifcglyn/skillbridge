import { CheckCircle2, Eye, ShieldAlert } from "lucide-react";
import type {
  ModerationReport,
  ReportPriority,
  ReportStatus,
} from "./admin.types";

type ModerationSectionProps = {
  reports: ModerationReport[];
  onStatusChange: (reportId: string, status: ReportStatus) => void;
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  new: "Yeni",
  reviewing: "İnceleniyor",
  resolved: "Çözüldü",
};

const PRIORITY_LABELS: Record<ReportPriority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};

function PriorityBadge({ priority }: { priority: ReportPriority }) {
  const className =
    priority === "high"
      ? "bg-red-500/10 text-red-600 dark:text-red-300"
      : priority === "medium"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "bg-sky-500/10 text-sky-700 dark:text-sky-300";

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${className}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const className =
    status === "resolved"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : status === "reviewing"
        ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
        : "bg-red-500/10 text-red-600 dark:text-red-300";

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ModerationSection({
  reports,
  onStatusChange,
}: ModerationSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500">
            <ShieldAlert size={19} />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Şikâyet & Moderasyon</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Güvenlik bildirimlerini öncelik ve durum bilgisiyle takip edin.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {reports.map((report) => (
          <div
            key={report.id}
            className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center gap-4 hover:bg-muted/20 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-foreground">{report.reportedUser}</span>
                <PriorityBadge priority={report.priority} />
                <StatusBadge status={report.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{report.reason}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">{report.createdAt}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                disabled={report.status === "reviewing" || report.status === "resolved"}
                onClick={() => onStatusChange(report.id, "reviewing")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-bold hover:bg-violet-500/20 disabled:opacity-40"
              >
                <Eye size={13} /> İncele
              </button>
              <button
                type="button"
                disabled={report.status === "resolved"}
                onClick={() => onStatusChange(report.id, "resolved")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 disabled:opacity-40"
              >
                <CheckCircle2 size={13} /> Çözüldü olarak işaretle
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
