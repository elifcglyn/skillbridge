import {
  CalendarPlus,
  Link2,
  MessageSquare,
  ShieldAlert,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { ActivityType, PlatformActivity } from "./admin.types";

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: LucideIcon; color: string }
> = {
  user_registered: { icon: UserPlus, color: "#4338ca" },
  match_created: { icon: Link2, color: "#7c3aed" },
  session_scheduled: { icon: CalendarPlus, color: "#06b6d4" },
  feedback_submitted: { icon: MessageSquare, color: "#10b981" },
  report_created: { icon: ShieldAlert, color: "#ef4444" },
};

export function PlatformActivitySection({
  activities,
}: {
  activities: PlatformActivity[];
}) {
  return (
    <section className="p-5 rounded-2xl border border-border bg-card shadow-sm">
      <div className="mb-4">
        <h2 className="font-bold text-foreground">Platform Aktivitesi</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          SkillBridge genelinde gerçekleşen son hareketler.
        </p>
      </div>

      <div className="space-y-1">
        {activities.map((activity, index) => {
          const config = ACTIVITY_CONFIG[activity.type];
          const Icon = config.icon;

          return (
            <div key={activity.id} className="relative flex gap-3 py-2.5">
              {index < activities.length - 1 && (
                <div className="absolute left-4 top-10 bottom-[-10px] w-px bg-border" />
              )}
              <div
                className="relative z-10 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${config.color}14` }}
              >
                <Icon size={15} style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {activity.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
