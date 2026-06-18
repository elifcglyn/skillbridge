import { motion } from "motion/react";
import {
  CalendarClock,
  Link2,
  MessageSquareWarning,
  Star,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminMetric, AdminMetricId } from "./admin.types";

const ICONS: Record<AdminMetricId, LucideIcon> = {
  users: Users,
  pendingProfiles: UserCheck,
  activeMatches: Link2,
  scheduledSessions: CalendarClock,
  reports: MessageSquareWarning,
  averageRating: Star,
};

export function AdminSummaryCards({ metrics }: { metrics: AdminMetric[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {metrics.map((metric, index) => {
        const Icon = ICONS[metric.id];

        return (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-extrabold text-foreground">
                  {metric.value}
                </div>
                <div className="text-sm font-semibold text-foreground mt-1">
                  {metric.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {metric.helper}
                </div>
              </div>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${metric.color}14` }}
              >
                <Icon size={21} style={{ color: metric.color }} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
