import type {
  AdminFeedback,
  AdminMetric,
  ModerationReport,
  PendingProfile,
  PlatformActivity,
} from "./admin.types";

export const ADMIN_BASE_METRICS: Omit<AdminMetric, "value">[] = [
  {
    id: "users",
    label: "Toplam Kullanıcı",
    helper: "Bu ay +24",
    color: "#4338ca",
  },
  {
    id: "pendingProfiles",
    label: "Bekleyen Profil Onayı",
    helper: "İnceleme kuyruğu",
    color: "#f59e0b",
  },
  {
    id: "activeMatches",
    label: "Aktif Eşleşme",
    helper: "Son 30 gün",
    color: "#7c3aed",
  },
  {
    id: "scheduledSessions",
    label: "Planlanan Oturum",
    helper: "Önümüzdeki 7 gün",
    color: "#06b6d4",
  },
  {
    id: "reports",
    label: "Gelen Şikâyet",
    helper: "Açık moderasyon kaydı",
    color: "#ef4444",
  },
  {
    id: "averageRating",
    label: "Ortalama Geri Bildirim",
    helper: "Platform geneli",
    color: "#10b981",
  },
];

export const ADMIN_STATIC_VALUES = {
  totalUsers: 248,
  activeMatches: 64,
  scheduledSessions: 18,
  averageRating: 4.7,
};

export const INITIAL_PENDING_PROFILES: PendingProfile[] = [
  {
    id: "profile-1",
    name: "Ece Yalçın",
    department: "Bilgisayar Mühendisliği",
    grade: "2. sınıf",
    teaches: "Figma & UI Tasarım",
    learns: "React",
    status: "pending",
  },
  {
    id: "profile-2",
    name: "Mert Arslan",
    department: "Endüstri Mühendisliği",
    grade: "3. sınıf",
    teaches: "Excel & Veri Analizi",
    learns: "Python",
    status: "pending",
  },
  {
    id: "profile-3",
    name: "Selin Kaya",
    department: "İngiliz Dili ve Edebiyatı",
    grade: "4. sınıf",
    teaches: "Akademik İngilizce",
    learns: "Sunum Tasarımı",
    status: "pending",
  },
  {
    id: "profile-4",
    name: "Can Eren",
    department: "İletişim Tasarımı",
    grade: "1. sınıf",
    teaches: "Video Kurgu",
    learns: "İngilizce Konuşma",
    status: "approved",
  },
];

export const INITIAL_MODERATION_REPORTS: ModerationReport[] = [
  {
    id: "report-1",
    reportedUser: "Barış K.",
    reason: "Görüşmeye tekrarlı şekilde katılmama",
    priority: "high",
    status: "new",
    createdAt: "Bugün, 10:24",
  },
  {
    id: "report-2",
    reportedUser: "Nehir T.",
    reason: "Uygunsuz mesaj içeriği bildirimi",
    priority: "high",
    status: "reviewing",
    createdAt: "Dün, 18:42",
  },
  {
    id: "report-3",
    reportedUser: "Emir A.",
    reason: "Profil bilgisinin yanıltıcı olduğu iddiası",
    priority: "medium",
    status: "new",
    createdAt: "18 Haz, 15:10",
  },
  {
    id: "report-4",
    reportedUser: "Deniz P.",
    reason: "Oturum sonrası iletişim anlaşmazlığı",
    priority: "low",
    status: "resolved",
    createdAt: "17 Haz, 09:35",
  },
];

export const RECENT_ADMIN_FEEDBACK: AdminFeedback[] = [
  {
    id: "feedback-1",
    reviewer: "Ayşenur L.",
    reviewee: "Ege D.",
    rating: 5,
    comment: "Konu anlatımı çok netti, örneklerle ilerlemesi çok faydalı oldu.",
    date: "19 Haz 2026",
  },
  {
    id: "feedback-2",
    reviewer: "Mert A.",
    reviewee: "Selin K.",
    rating: 4,
    comment: "Görüşme verimliydi; bir sonraki oturum için plan da oluşturduk.",
    date: "18 Haz 2026",
  },
  {
    id: "feedback-3",
    reviewer: "Ece Y.",
    reviewee: "Can E.",
    rating: 5,
    comment: "Pratik odaklı ve motive edici bir oturumdu.",
    date: "18 Haz 2026",
  },
];

export const PLATFORM_ACTIVITIES: PlatformActivity[] = [
  {
    id: "activity-1",
    type: "user_registered",
    title: "Yeni kullanıcı kaydı",
    description: "Zeynep Ç. platforma katıldı.",
    time: "8 dk önce",
  },
  {
    id: "activity-2",
    type: "match_created",
    title: "Yeni eşleşme",
    description: "Python öğrenme eşleşmesi oluşturuldu.",
    time: "21 dk önce",
  },
  {
    id: "activity-3",
    type: "session_scheduled",
    title: "Yeni oturum planlandı",
    description: "Figma Temelleri oturumu 20 Haziran için planlandı.",
    time: "47 dk önce",
  },
  {
    id: "activity-4",
    type: "feedback_submitted",
    title: "Geri bildirim gönderildi",
    description: "Tamamlanan React görüşmesine 5 yıldız verildi.",
    time: "1 sa önce",
  },
  {
    id: "activity-5",
    type: "report_created",
    title: "Şikâyet oluşturuldu",
    description: "Yeni moderasyon kaydı inceleme kuyruğuna eklendi.",
    time: "2 sa önce",
  },
];
