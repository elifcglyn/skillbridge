import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RequireAdmin } from "./auth/RequireAdmin";
import { LandingPage } from "./components/landing/LandingPage";
import { AuthPages } from "./components/auth/AuthPages";
import { Dashboard } from "./components/dashboard/Dashboard";

type Page = "landing" | "login" | "register" | "forgot" | "dashboard";

type AppRoute = {
  page: Page;
  dashboardView: string;
};

const ADMIN_PATHS = new Set(["/admin", "/admin-panel", "/dashboard/admin"]);

function routeFromPath(pathname: string): AppRoute {
  const path = `/${pathname.split("?")[0].split("#")[0]}`
    .replace(/\/+/g, "/")
    .replace(/\/$/, "")
    .toLowerCase() || "/";

  if (ADMIN_PATHS.has(path)) {
    return { page: "dashboard", dashboardView: "admin" };
  }

  if (path === "/login") return { page: "login", dashboardView: "home" };
  if (path === "/register") return { page: "register", dashboardView: "home" };
  if (path === "/forgot") return { page: "forgot", dashboardView: "home" };

  if (path === "/dashboard") {
    return { page: "dashboard", dashboardView: "home" };
  }

  if (path.startsWith("/dashboard/")) {
    return {
      page: "dashboard",
      dashboardView: path.slice("/dashboard/".length) || "home",
    };
  }

  return { page: "landing", dashboardView: "home" };
}

function pathForPage(page: Page) {
  if (page === "landing") return "/";
  return `/${page}`;
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    routeFromPath(window.location.pathname),
  );

  useEffect(() => {
    const handlePopState = () => {
      setRoute(routeFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (target: string, replace = false) => {
    const nextPage = target as Page;
    const nextPath = pathForPage(nextPage);
    const nextRoute = routeFromPath(nextPath);

    window.history[replace ? "replaceState" : "pushState"]({}, "", nextPath);
    setRoute(nextRoute);
  };

  const renderPage = () => {
    switch (route.page) {
      case "landing":
        return <LandingPage onNavigate={navigate} />;
      case "login":
      case "register":
      case "forgot":
        return <AuthPages page={route.page} onNavigate={navigate} />;
      case "dashboard": {
        const dashboard = (
          <Dashboard
            initialView={route.dashboardView}
            onNavigate={navigate}
          />
        );

        if (route.dashboardView === "admin") {
          return (
            <RequireAdmin
              onUnauthenticated={() => navigate("login", true)}
              onForbidden={() => navigate("dashboard", true)}
            >
              {dashboard}
            </RequireAdmin>
          );
        }

        return dashboard;
      }
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="w-full min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${route.page}:${route.dashboardView}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full min-h-screen"
          style={route.page === "dashboard" ? { height: "100vh", overflow: "hidden" } : {}}>
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
