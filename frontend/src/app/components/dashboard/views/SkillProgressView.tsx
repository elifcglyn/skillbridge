import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Award,
  BookOpen,
  Clock,
  Flame,
  RefreshCw,
  Target,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getProgress, type ProgressData } from "@/lib/progress";
import { supabase } from "@/lib/supabase";

const LEVELS = ["Başlangıç", "Orta", "İleri", "Uzman"];

function formatNumber(value: number) {
  return value.toLocaleString("tr-TR", {
    maximumFractionDigits: 1,
  });
}

export function SkillProgressView() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await getProgress(year));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gelişim verileri yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [year]);

  useEffect(() => {
    let timer: number | null = null;
    const refresh = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(loadProgress, 250);
    };

    const channel = supabase
      .channel("skill_progress")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_skills" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "learning_activity" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "point_events" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_achievements" },
        refresh,
      )
      .subscribe();

    return () => {
      if (timer) window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [year]);

  const stats = [
    {
      label: "Toplam Öğrenme Saati",
      value: data ? `${formatNumber(data.summary.totalHours)}s` : "0s",
      icon: Clock,
      color: "#4338ca",
    },
    {
      label: "Mevcut Seri",
      value: data ? `${data.summary.currentStreak} gün` : "0 gün",
      icon: Flame,
      color: "#f59e0b",
    },
    {
      label: "Tamamlanan Görüşme",
      value: data ? String(data.summary.completedSessions) : "0",
      icon: BookOpen,
      color: "#7c3aed",
    },
    {
      label: "Beceri Puanı",
      value: data
        ? data.summary.skillPoints.toLocaleString("tr-TR")
        : "0",
      icon: Zap,
      color: "#06b6d4",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">
            Gelişimim
          </h2>
          <p className="text-sm text-muted-foreground">
            Becerilerini, öğrenme saatlerini ve ilerlemeni takip et
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm outline-none">
            {[currentYear, currentYear - 1, currentYear - 2].map(
              (option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ),
            )}
          </select>
          <button
            type="button"
            onClick={loadProgress}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-40"
            aria-label="Gelişim verilerini yenile">
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-600 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadProgress}
            className="font-semibold hover:underline">
            Tekrar dene
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl border border-border bg-card shadow-sm">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${stat.color}14` }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-extrabold text-foreground">
              {loading ? "..." : stat.value}
            </div>
            <div className="text-xs text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 rounded-2xl border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : data?.skills.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.skills.map((skill, index) => {
            const currentLevelIndex = LEVELS.indexOf(skill.level);
            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                className="p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `${skill.color}14` }}>
                    {skill.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-foreground">
                        {skill.name}
                      </h4>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ background: skill.color }}>
                        {skill.level}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {skill.kind === "learns" ? "Öğreniyorum" : "Öğretiyorum"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{skill.completedSessions} görüşme</span>
                      <span>{formatNumber(skill.hours)}s toplam</span>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">
                      {skill.nextLevel
                        ? `${skill.nextLevel} seviyesine ilerleme`
                        : "En yüksek seviye"}
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: skill.color }}>
                      %{skill.progress}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden bg-muted">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: skill.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {skill.nextLevel
                      ? `${skill.pointsToNext} puan kaldı`
                      : "Uzman seviyesine ulaştın"}
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-3">
                  {LEVELS.map((level, levelIndex) => (
                    <div
                      key={level}
                      className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`h-1.5 w-full rounded-full ${
                          levelIndex <= currentLevelIndex ? "" : "bg-muted"
                        }`}
                        style={
                          levelIndex <= currentLevelIndex
                            ? { background: skill.color }
                            : {}
                        }
                      />
                      <span className="text-[9px] text-muted-foreground">
                        {level.slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 px-6 rounded-2xl border border-dashed border-border bg-card text-center">
          <BookOpen
            size={30}
            className="mx-auto mb-3 text-muted-foreground"
          />
          <h3 className="font-bold text-foreground">
            Henüz takip edilen beceri yok
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Profiline öğrettiğin veya öğrenmek istediğin becerileri eklediğinde
            ilerlemen burada görünür.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-bold text-foreground mb-4">
            Bu Haftaki Öğrenme Saatleri
          </h3>
          {data?.weeklyLearning.series.length ? (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart
                  data={data.weeklyLearning.data}
                  margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  {data.weeklyLearning.series.map((series, index) => (
                    <Bar
                      key={series.key}
                      dataKey={series.key}
                      name={series.name}
                      stackId="learning"
                      fill={series.color}
                      radius={
                        index === data.weeklyLearning.series.length - 1
                          ? [4, 4, 0, 0]
                          : [0, 0, 0, 0]
                      }
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {data.weeklyLearning.series.map((series) => (
                  <div
                    key={series.key}
                    className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ background: series.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {series.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              Bu hafta tamamlanan öğrenme görüşmesi yok.
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-bold text-foreground mb-4">Beceri Radarı</h3>
          {data?.radar.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart
                data={data.radar}
                margin={{ top: 10, right: 25, bottom: 10, left: 25 }}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                />
                <Radar
                  name="Beceriler"
                  dataKey="value"
                  stroke="#4338ca"
                  fill="#4338ca"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm text-muted-foreground text-center">
              Radar için profilinde en az bir beceri olmalı.
            </div>
          )}
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">
            {year} Öğrenme Yolculuğu
          </h3>
          <span className="text-xs text-muted-foreground">
            Toplam: {formatNumber(data?.monthlyLearning.totalHours ?? 0)} saat
          </span>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart
            data={data?.monthlyLearning.data ?? []}
            margin={{ top: 5, right: 10, bottom: 0, left: -30 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              name="Saat"
              stroke="#4338ca"
              strokeWidth={2.5}
              dot={{ fill: "#4338ca", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3 mb-3">
          {data?.activeAchievement ? (
            <Target size={18} className="text-primary" />
          ) : (
            <Award size={18} className="text-primary" />
          )}
          <h3 className="font-bold text-foreground">
            {data?.activeAchievement
              ? "Aktif Başarı Hedefi"
              : "Başarı Hedefi"}
          </h3>
        </div>
        {data?.activeAchievement ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-foreground">
                  {data.activeAchievement.title}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.activeAchievement.description}
                </p>
              </div>
              <span className="text-sm font-bold text-primary">
                %{data.activeAchievement.progressPercent}
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden bg-muted mt-4">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${data.activeAchievement.progressPercent}%`,
                  background: data.activeAchievement.color,
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {data.activeAchievement.progressCurrent} /{" "}
              {data.activeAchievement.progressTarget}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Henüz aktif başarı hedefin bulunmuyor. Yeni hedefler oluştuğunda
            burada ilerlemesini takip edebilirsin.
          </p>
        )}
      </div>
    </div>
  );
}
