import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, Users, MapPin, Star, Zap, MessageSquare, Video,
  BarChart2, Award, Calendar, ArrowRight,
  Sparkles, Shield, Search,
  GraduationCap, Rocket, Brain, Code2, Music2, Languages,
  Palette, Dumbbell, Camera, ChefHat, X, Menu
} from "lucide-react";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const FEATURES = [
  { icon: Zap, title: "AI Smart Matching", desc: "Intelligent algorithm pairs you with the perfect mentor or student based on skills, location, and schedule.", color: "#4338ca" },
  { icon: MapPin, title: "Local Discovery", desc: "Find nearby learners and mentors on an interactive map. Connect with your campus community.", color: "#06b6d4" },
  { icon: MessageSquare, title: "Real-time Chat", desc: "Modern messaging with voice notes, file sharing, and emoji reactions. Stay connected effortlessly.", color: "#7c3aed" },
  { icon: Video, title: "Video Sessions", desc: "Built-in video meetings with recording, screen share, and collaborative whiteboards.", color: "#10b981" },
  { icon: BarChart2, title: "Skill Progress", desc: "Track your journey from beginner to expert with beautiful analytics and learning streaks.", color: "#f59e0b" },
  { icon: Award, title: "Badges & Rewards", desc: "Earn achievements, build reputation, and showcase your expertise to the community.", color: "#ec4899" },
  { icon: Calendar, title: "Smart Calendar", desc: "Flexible scheduling with availability management and automated reminders.", color: "#4338ca" },
  { icon: Users, title: "Community Groups", desc: "Join skill-based communities, attend campus events, and participate in skill exchanges.", color: "#06b6d4" },
];

const SKILLS = [
  { icon: Code2, name: "Programming", count: 342, color: "#4338ca" },
  { icon: Languages, name: "Languages", count: 289, color: "#06b6d4" },
  { icon: Music2, name: "Music", count: 178, color: "#7c3aed" },
  { icon: Palette, name: "Design", count: 215, color: "#ec4899" },
  { icon: Dumbbell, name: "Fitness", count: 156, color: "#10b981" },
  { icon: Camera, name: "Photography", count: 134, color: "#f59e0b" },
  { icon: ChefHat, name: "Cooking", count: 98, color: "#ef4444" },
  { icon: Brain, name: "Mathematics", count: 267, color: "#8b5cf6" },
];

const MENTORS = [
  { name: "Aria Chen", skill: "Python & ML", rating: 4.9, sessions: 48, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format", badge: "Top Mentor", university: "MIT" },
  { name: "Marcus Rivera", skill: "Spanish Tutoring", rating: 4.8, sessions: 63, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format", badge: "⭐ Expert", university: "Stanford" },
  { name: "Zara Ahmed", skill: "UI/UX Design", rating: 5.0, sessions: 31, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format", badge: "🔥 Hot", university: "RISD" },
  { name: "Leo Nakamura", skill: "Guitar & Music Theory", rating: 4.7, sessions: 55, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format", badge: "Verified", university: "Berklee" },
];

const EVENTS = [
  { title: "Big Skill Exchange Day", date: "Jun 15, 2026", type: "Campus Event", attendees: 240, color: "#4338ca", emoji: "🎯" },
  { title: "AI & Coding Workshop", date: "Jun 20, 2026", type: "Online Event", attendees: 89, color: "#7c3aed", emoji: "💻" },
  { title: "Language Exchange Night", date: "Jun 22, 2026", type: "Campus Event", attendees: 67, color: "#06b6d4", emoji: "🌍" },
  { title: "Design Thinking Sprint", date: "Jun 28, 2026", type: "Workshop", attendees: 45, color: "#ec4899", emoji: "🎨" },
];

const MAP_PINS = [
  { x: 30, y: 35, name: "Aria C.", skill: "Python", type: "mentor", color: "#4338ca" },
  { x: 55, y: 25, name: "Marcus R.", skill: "Spanish", type: "mentor", color: "#7c3aed" },
  { x: 70, y: 50, name: "Zara A.", skill: "Design", type: "mentor", color: "#06b6d4" },
  { x: 20, y: 60, name: "Leo N.", skill: "Guitar", type: "mentor", color: "#10b981" },
  { x: 45, y: 65, name: "Sofia M.", skill: "Math", type: "learner", color: "#f59e0b" },
  { x: 65, y: 30, name: "Jake L.", skill: "Coding", type: "learner", color: "#ec4899" },
  { x: 38, y: 45, name: "Nina K.", skill: "Yoga", type: "mentor", color: "#4338ca" },
  { x: 80, y: 70, name: "Omar S.", skill: "Chess", type: "learner", color: "#7c3aed" },
];

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mapFilter, setMapFilter] = useState<"all" | "mentor" | "learner">("all");
  const [activePin, setActivePin] = useState<number | null>(null);
  const [skillFilter, setSkillFilter] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredPins = MAP_PINS.filter(pin =>
    mapFilter === "all" ? true : pin.type === mapFilter
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* NAV */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-3" : "py-5"}`}>
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-300 ${scrolled ? "rounded-2xl backdrop-blur-xl border border-white/20 shadow-xl" : ""}`}
          style={{ background: scrolled ? "rgba(248,250,255,0.85)" : "transparent" }}>
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => {}}>
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 rounded-xl" style={{ background: "var(--sb-gradient)" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11 C4 7.5 7 5 11 5 C15 5 18 7.5 18 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M4 11 C4 14.5 7 17 11 17 C15 17 18 14.5 18 11" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="4" cy="11" r="2" fill="white" />
                    <circle cx="18" cy="11" r="2" fill="white" />
                    <circle cx="11" cy="5" r="2" fill="rgba(255,255,255,0.8)" />
                    <circle cx="11" cy="17" r="2" fill="rgba(255,255,255,0.8)" />
                  </svg>
                </div>
              </div>
              <span className="text-xl font-bold" style={{ background: "var(--sb-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                SkillBridge
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {["Features", "Explore", "Events", "About"].map(item => (
                <button key={item} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">{item}</button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => onNavigate("login")}
                className="text-sm font-semibold px-4 py-2 rounded-xl text-primary hover:bg-primary/8 transition-all">
                Log in
              </button>
              <button onClick={() => onNavigate("register")}
                className="text-sm font-semibold px-5 py-2 rounded-xl text-white transition-all hover:shadow-lg hover:scale-105"
                style={{ background: "var(--sb-gradient)" }}>
                Get Started
              </button>
            </div>

            <button className="md:hidden p-2 rounded-xl hover:bg-primary/8 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="md:hidden mx-4 mt-2 p-4 rounded-2xl border border-border bg-card shadow-xl">
              {["Features", "Explore", "Events", "About"].map(item => (
                <button key={item} className="block w-full text-left py-3 px-2 text-sm font-medium text-foreground hover:text-primary transition-colors border-b border-border last:border-0">
                  {item}
                </button>
              ))}
              <div className="flex gap-2 mt-3">
                <button onClick={() => onNavigate("login")} className="flex-1 py-2 rounded-xl border border-primary/30 text-primary text-sm font-semibold">Log in</button>
                <button onClick={() => onNavigate("register")} className="flex-1 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: "var(--sb-gradient)" }}>Sign up</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #f8faff 0%, #eef2ff 40%, #f3e8ff 70%, #ecfeff 100%)" }} />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 left-0 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)" }} />

        {/* Floating cards */}
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-8 hidden lg:block">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-white/60 w-44">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">A</div>
              <div><div className="text-xs font-semibold text-foreground">Aria Chen</div><div className="text-xs text-muted-foreground">Python Expert</div></div>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={10} fill="#f59e0b" color="#f59e0b" />)}
              <span className="text-xs text-muted-foreground ml-1">4.9</span>
            </div>
          </div>
        </motion.div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-48 right-12 hidden lg:block">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-white/60 w-52">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: "var(--sb-gradient)" }}>
                <Zap size={14} />
              </div>
              <span className="text-xs font-semibold">New Match Found!</span>
            </div>
            <div className="text-xs text-muted-foreground">Someone wants to learn <span className="text-primary font-medium">React</span> near you</div>
          </div>
        </motion.div>

        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-40 right-16 hidden lg:block">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-white/60 w-48">
            <div className="text-xs text-muted-foreground mb-1">Learning Progress</div>
            <div className="text-sm font-bold text-foreground mb-2">Spanish 🇪🇸</div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: "var(--sb-gradient)" }}
                initial={{ width: "0%" }} animate={{ width: "67%" }} transition={{ duration: 2, delay: 0.5 }} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">67% complete</div>
          </div>
        </motion.div>

        <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-44 left-16 hidden lg:block">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-white/60 w-44">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-lg">🔥</span>
              <span className="text-xs font-bold text-foreground">12 Day Streak!</span>
            </div>
            <div className="text-xs text-muted-foreground">Keep learning daily to maintain your streak</div>
          </div>
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-white/60 backdrop-blur-sm mb-8 text-sm font-medium text-primary">
              <Sparkles size={14} />
              <span>Free skill exchange for students & young people</span>
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            <span className="text-foreground">Learn Anything.</span>
            <br />
            <span style={{ background: "var(--sb-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Teach Everything.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            A free, community-powered platform where university students and young people exchange skills — no money, just passion for learning and teaching.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-3 justify-center mb-12">
            <button onClick={() => onNavigate("register")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              style={{ background: "var(--sb-gradient)" }}>
              <Search size={18} />
              Find a Mentor
            </button>
            <button onClick={() => onNavigate("register")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold border-2 border-primary/30 bg-white/80 backdrop-blur-sm text-primary hover:bg-white hover:border-primary transition-all">
              <GraduationCap size={18} />
              Teach a Skill
            </button>
            <button onClick={() => onNavigate("register")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold border-2 border-border bg-white/60 backdrop-blur-sm text-foreground hover:bg-white transition-all">
              <Users size={18} />
              Join Community
            </button>
          </motion.div>

          {/* Stats row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8">
            {[["12,400+", "Active Students"], ["340+", "Skills Available"], ["8,900+", "Sessions Completed"], ["96%", "Satisfaction Rate"]].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-extrabold text-foreground" style={{ background: "var(--sb-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{num}</div>
                <div className="text-xs text-muted-foreground font-medium">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-sm font-medium mb-4">
              <Rocket size={14} /> How It Works
            </div>
            <h2 className="text-4xl font-extrabold text-foreground mb-4">Start in 3 simple steps</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">No payments, no subscriptions. Just people helping people grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector lines */}
            <div className="absolute top-16 left-1/3 right-1/3 h-0.5 hidden md:block"
              style={{ background: "linear-gradient(90deg, #4338ca, #7c3aed, #06b6d4)" }} />

            {[
              { step: "01", icon: Users, title: "Create Your Profile", desc: "Tell us what skills you have and what you want to learn. Add your location and schedule — takes under 2 minutes.", color: "#4338ca" },
              { step: "02", icon: MapPin, title: "Match With Nearby People", desc: "Our AI finds the best matches near you. Browse profiles, read reviews, and connect instantly.", color: "#7c3aed" },
              { step: "03", icon: BookOpen, title: "Start Learning Together", desc: "Schedule sessions, chat, video call, and track your progress. Build real relationships through shared knowledge.", color: "#06b6d4" },
            ].map((item, i) => (
              <motion.div key={item.step}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }}>
                <div className="relative p-8 rounded-3xl border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 text-center">
                  <div className="text-6xl font-extrabold mb-4 opacity-5 absolute top-4 right-4"
                    style={{ color: item.color }}>{item.step}</div>
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg"
                    style={{ background: `${item.color}18` }}>
                    <item.icon size={28} style={{ color: item.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SKILL CATEGORIES */}
      <section className="py-20" style={{ background: "var(--sb-gradient-soft)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-foreground mb-3">Explore Skills</h2>
            <p className="text-muted-foreground">Hundreds of skills taught by real people in your community</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SKILLS.map((skill, i) => (
              <motion.div key={skill.name}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03, y: -3 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-xl border border-white/60 cursor-pointer transition-all">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${skill.color}18` }}>
                  <skill.icon size={22} style={{ color: skill.color }} />
                </div>
                <div className="font-semibold text-foreground text-sm mb-0.5">{skill.name}</div>
                <div className="text-xs text-muted-foreground">{skill.count} people</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-sm font-medium mb-4">
              <Sparkles size={14} /> Platform Features
            </div>
            <h2 className="text-4xl font-extrabold text-foreground mb-4">Everything you need to learn & grow</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">A complete platform designed for the way students actually learn and connect today.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="p-6 rounded-2xl border border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: `${f.color}14` }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h4 className="font-bold text-foreground mb-2 text-sm">{f.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MAP SECTION */}
      <section className="py-24" style={{ background: "linear-gradient(180deg, #0f0f23 0%, #1e1b4b 100%)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-4">
              <MapPin size={14} /> Local Discovery
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-4">Find people near you</h2>
            <p className="text-white/60 max-w-lg mx-auto">Connect with mentors and learners on your campus or in your neighborhood. Knowledge is closer than you think.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <div className="bg-white/8 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <div className="text-sm font-semibold text-white/80 mb-3">Filter By</div>
                <div className="flex flex-col gap-2">
                  {["all", "mentor", "learner"].map(f => (
                    <button key={f} onClick={() => setMapFilter(f as any)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${mapFilter === f ? "text-white" : "text-white/50 bg-white/5 hover:bg-white/10"}`}
                      style={mapFilter === f ? { background: "var(--sb-gradient)" } : {}}>
                      {f === "all" ? "All People" : f === "mentor" ? "🎓 Mentors" : "📚 Learners"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/8 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <div className="text-sm font-semibold text-white/80 mb-3">Search Skill</div>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input value={skillFilter} onChange={e => setSkillFilter(e.target.value)}
                    placeholder="e.g. Volleyball, English..."
                    className="w-full bg-white/10 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30" />
                </div>
              </div>

              <div className="bg-white/8 backdrop-blur-sm rounded-2xl p-5 border border-white/10 space-y-3">
                <div className="text-sm font-semibold text-white/80">Nearby Highlights</div>
                {[
                  { text: "3 volleyball coaches within 1.2km", emoji: "🏐" },
                  { text: "5 English learners near campus", emoji: "🇬🇧" },
                  { text: "2 coding mentors online now", emoji: "💻" },
                ].map(item => (
                  <div key={item.text} className="flex items-start gap-2 text-xs text-white/60">
                    <span>{item.emoji}</span><span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden" style={{ height: 420 }}>
                {/* Fake map background */}
                <div className="absolute inset-0" style={{
                  background: "linear-gradient(135deg, #0d1b2a 0%, #1a2744 50%, #0d2238 100%)"
                }}>
                  {/* Grid lines */}
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute inset-y-0 border-l border-white/5" style={{ left: `${(i + 1) * 12.5}%` }} />
                  ))}
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="absolute inset-x-0 border-t border-white/5" style={{ top: `${(i + 1) * 16.67}%` }} />
                  ))}
                  {/* Roads */}
                  <div className="absolute top-1/3 inset-x-0 h-0.5 bg-white/10" />
                  <div className="absolute left-1/3 inset-y-0 w-0.5 bg-white/10" />
                  <div className="absolute left-2/3 inset-y-0 w-0.5 bg-white/8" />
                  <div className="absolute top-2/3 inset-x-0 h-0.5 bg-white/8" />
                  {/* Campus block */}
                  <div className="absolute rounded-xl border border-cyan-500/20 bg-cyan-500/5"
                    style={{ left: "35%", top: "30%", width: "30%", height: "35%" }}>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-cyan-400/70 whitespace-nowrap">🎓 Campus Area</div>
                  </div>
                </div>

                {/* Pins */}
                {filteredPins.map((pin, i) => (
                  <motion.div key={i}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                    className="absolute cursor-pointer z-10 group"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -50%)" }}
                    onClick={() => setActivePin(activePin === i ? null : i)}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-transform group-hover:scale-110 ${activePin === i ? "scale-125" : ""}`}
                      style={{ background: pin.color }}>
                      {pin.type === "mentor" ? <GraduationCap size={14} color="white" /> : <BookOpen size={14} color="white" />}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: pin.color }} />

                    <AnimatePresence>
                      {activePin === i && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                          className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-xl border border-white/60 z-20">
                          <div className="text-xs font-bold text-foreground">{pin.name}</div>
                          <div className="text-xs text-muted-foreground">{pin.skill} · {pin.type}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}

                {/* Map controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {["+", "−"].map(btn => (
                    <button key={btn} className="w-8 h-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-bold text-lg flex items-center justify-center hover:bg-white/20 transition-colors">{btn}</button>
                  ))}
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 flex gap-3">
                  {[{ color: "#4338ca", label: "Mentor" }, { color: "#f59e0b", label: "Learner" }].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                      <span className="text-xs text-white/80">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST & COMMUNITY */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-sm font-medium mb-4">
              <Shield size={14} /> Trusted Community
            </div>
            <h2 className="text-4xl font-extrabold text-foreground mb-4">Real people, real results</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {MENTORS.map((mentor, i) => (
              <motion.div key={mentor.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-5 rounded-3xl border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => onNavigate("register")}>
                <div className="relative mb-4">
                  <img src={mentor.avatar} alt={mentor.name} className="w-16 h-16 rounded-2xl object-cover" />
                  <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-md"
                    style={{ background: "var(--sb-gradient)", fontSize: 10 }}>{mentor.badge}</div>
                </div>
                <div className="font-bold text-foreground mb-0.5">{mentor.name}</div>
                <div className="text-xs text-muted-foreground mb-2">{mentor.skill}</div>
                <div className="text-xs text-muted-foreground mb-2">{mentor.university}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    <span className="text-xs font-semibold text-foreground">{mentor.rating}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{mentor.sessions} sessions</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Review cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { text: "I learned Python from scratch in 3 weeks! My mentor was amazing — patient, knowledgeable, and genuinely cared about my progress.", name: "Priya S., Computer Science", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop" },
              { text: "Teaching guitar through SkillBridge has been so rewarding. I've helped 12 students so far and learned so much from them in return.", name: "Dmitri L., Music Student", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop" },
              { text: "The platform feels like LinkedIn but actually fun. The skill matching is scarily accurate — it found me exactly the Spanish conversation partner I needed.", name: "Amara N., Language Studies", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&h=60&fit=crop" },
            ].map((review, i) => (
              <motion.div key={review.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{review.text}"</p>
                <div className="flex items-center gap-2">
                  <img src={review.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  <div className="text-xs font-semibold text-foreground">{review.name}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="py-24" style={{ background: "var(--sb-gradient-soft)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-sm font-medium mb-4">
              <Calendar size={14} /> Community Events
            </div>
            <h2 className="text-4xl font-extrabold text-foreground mb-3">Join the community</h2>
            <p className="text-muted-foreground">Workshops, campus meetups, and online events happening near you</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {EVENTS.map((event, i) => (
              <motion.div key={event.title}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                onClick={() => onNavigate("register")}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-sm hover:shadow-xl border border-white/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <div className="text-3xl mb-3">{event.emoji}</div>
                <div className="px-2 py-0.5 rounded-full text-xs font-medium text-white inline-flex mb-3"
                  style={{ background: event.color }}>{event.type}</div>
                <h4 className="font-bold text-foreground text-sm mb-1">{event.title}</h4>
                <div className="text-xs text-muted-foreground mb-3">{event.date}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users size={12} /> <span>{event.attendees} attending</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => onNavigate("register")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              style={{ background: "var(--sb-gradient)" }}>
              View All Events <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="relative p-12 rounded-3xl overflow-hidden" style={{ background: "var(--sb-gradient)" }}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl font-extrabold text-white mb-4">Ready to start learning?</h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">Join 12,400+ students already sharing skills on SkillBridge. It's free forever.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => onNavigate("register")}
                  className="px-8 py-3.5 rounded-2xl font-semibold bg-white text-primary hover:shadow-xl hover:scale-105 transition-all">
                  Create Free Account
                </button>
                <button onClick={() => onNavigate("login")}
                  className="px-8 py-3.5 rounded-2xl font-semibold bg-white/15 text-white border border-white/30 hover:bg-white/25 transition-all">
                  Sign in →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--sb-gradient)" }}>
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11 C4 7.5 7 5 11 5 C15 5 18 7.5 18 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M4 11 C4 14.5 7 17 11 17 C15 17 18 14.5 18 11" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="4" cy="11" r="2" fill="white" />
                    <circle cx="18" cy="11" r="2" fill="white" />
                  </svg>
                </div>
                <span className="text-white font-bold">SkillBridge</span>
              </div>
              <p className="text-white/40 text-sm max-w-xs leading-relaxed">A free community platform for students and young people to share skills and grow together.</p>
            </div>
            {[
              { title: "Platform", links: ["How It Works", "Browse Skills", "Find Mentors", "Community Events"] },
              { title: "Company", links: ["About Us", "Blog", "Careers", "Press"] },
              { title: "Support", links: ["Community Guidelines", "Privacy Policy", "Terms of Service", "Contact"] },
            ].map(col => (
              <div key={col.title}>
                <div className="text-white font-semibold text-sm mb-4">{col.title}</div>
                {col.links.map(link => (
                  <div key={link} className="mb-2"><button className="text-white/40 text-sm hover:text-white/70 transition-colors">{link}</button></div>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="text-white/30 text-sm">© 2026 SkillBridge. Free for everyone, forever.</div>
            <div className="flex items-center gap-4">
              {["Twitter", "Instagram", "LinkedIn", "Discord"].map(s => (
                <button key={s} className="text-white/30 text-sm hover:text-white/60 transition-colors">{s}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}