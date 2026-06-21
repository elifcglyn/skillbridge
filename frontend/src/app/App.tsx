import { useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { RequireAdmin } from "./auth/RequireAdmin";
import { LandingPage } from "./components/landing/LandingPage";
import { AuthPages } from "./components/auth/AuthPages";
import { Dashboard } from "./components/dashboard/Dashboard";

const DASHBOARD_PATHS = {
  home: "/",
  profile: "/profile",
  findmatch: "/find-match",
  matches: "/matches",
  messages: "/messages",
  calendar: "/calendar",
  sessions: "/sessions",
  rewards: "/rewards",
  notifications: "/notifications",
  feedback: "/feedback",
  progress: "/progress",
  settings: "/settings",
  admin: "/admin",
} as const;

type DashboardView = keyof typeof DASHBOARD_PATHS;

const PATH_TO_DASHBOARD_VIEW = Object.fromEntries(
  Object.entries(DASHBOARD_PATHS).map(([view, path]) => [path, view]),
) as Record<string, DashboardView>;

const PUBLIC_PATHS: Record<string, string> = {
  landing: "/",
  login: "/login",
  register: "/register",
  forgot: "/forgot",
  dashboard: "/",
};

function normalizePath(pathname: string) {
  const normalized = `/${pathname}`.replace(/\/+/g, "/").replace(/\/$/, "");
  return normalized || "/";
}

function pathForTarget(target: string) {
  if (target.startsWith("/")) return normalizePath(target);
  return PUBLIC_PATHS[target] ?? DASHBOARD_PATHS[target as DashboardView] ?? "/";
}

function useAppNavigation() {
  const navigate = useNavigate();

  return useCallback(
    (target: string, replace = false) => {
      navigate(pathForTarget(target), { replace });
    },
    [navigate],
  );
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 text-sm font-semibold">
        <Loader2 size={20} className="animate-spin text-primary" />
        Oturum kontrol ediliyor...
      </div>
    </div>
  );
}

function DashboardRoute() {
  const { loading, user } = useAuth();
  const location = useLocation();
  const navigate = useAppNavigation();
  const path = normalizePath(location.pathname);
  const activeView = PATH_TO_DASHBOARD_VIEW[path] ?? "home";

  if (loading) return <FullPageLoader />;

  if (!user) {
    if (path === "/") {
      return <LandingPage onNavigate={navigate} />;
    }

    return <Navigate to="/login" replace state={{ from: path }} />;
  }

  const dashboard = (
    <Dashboard initialView={activeView} onNavigate={navigate} />
  );

  if (activeView === "admin") {
    return (
      <RequireAdmin
        onUnauthenticated={() => navigate("login", true)}
        onForbidden={() => navigate("home", true)}
      >
        {dashboard}
      </RequireAdmin>
    );
  }

  return dashboard;
}

function LegacyDashboardRedirect() {
  const { view } = useParams();
  const target = view
    ? DASHBOARD_PATHS[view as DashboardView] ?? "/"
    : "/";

  return <Navigate to={target} replace />;
}

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useAppNavigation();
  const isDashboardPath = Boolean(
    PATH_TO_DASHBOARD_VIEW[normalizePath(location.pathname)],
  );
  const isDashboardPage = isDashboardPath && Boolean(user);
  const transitionKey = isDashboardPage ? "dashboard" : location.pathname;

  return (
    <div className="w-full min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={transitionKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full min-h-screen"
          style={isDashboardPage ? { height: "100vh", overflow: "hidden" } : {}}>
          <Routes location={location}>
            <Route path="/login" element={<AuthPages page="login" onNavigate={navigate} />} />
            <Route path="/register" element={<AuthPages page="register" onNavigate={navigate} />} />
            <Route path="/forgot" element={<AuthPages page="forgot" onNavigate={navigate} />} />

            <Route path="/dashboard" element={<LegacyDashboardRedirect />} />
            <Route path="/dashboard/:view" element={<LegacyDashboardRedirect />} />
            <Route path="/admin-panel" element={<Navigate to="/admin" replace />} />
            <Route path="/findmatch" element={<Navigate to="/find-match" replace />} />

            <Route element={<DashboardRoute />}>
              {Object.values(DASHBOARD_PATHS).map((path) => (
                <Route key={path} path={path} />
              ))}
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
