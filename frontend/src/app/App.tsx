import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LandingPage } from "./components/landing/LandingPage";
import { AuthPages } from "./components/auth/AuthPages";
import { Dashboard } from "./components/dashboard/Dashboard";

type Page = "landing" | "login" | "register" | "forgot" | "dashboard";

export default function App() {
  const [page, setPage] = useState<Page>("landing");

  const navigate = (target: string) => {
    setPage(target as Page);
  };

  const renderPage = () => {
    switch (page) {
      case "landing":
        return <LandingPage onNavigate={navigate} />;
      case "login":
      case "register":
      case "forgot":
        return <AuthPages page={page} onNavigate={navigate} />;
      case "dashboard":
        return <Dashboard onNavigate={navigate} />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="w-full min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full min-h-screen"
          style={page === "dashboard" ? { height: "100vh", overflow: "hidden" } : {}}>
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
