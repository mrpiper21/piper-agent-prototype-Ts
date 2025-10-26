import { u as useAuthStore, a as useTheme, r as reactExports, R as React, j as jsxRuntimeExports, L as Link } from "./index-BHp6kVh6.js";
const electronAPI = window.electron;
function Dashboard() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [agentStatus, setAgentStatus] = reactExports.useState("Loading...");
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const themeStyles = theme === "dark" ? darkStyles : lightStyles;
  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await electronAPI.agent.getStatus();
        setAgentStatus(status.isRunning ? "Running" : "Not Running");
      } catch (error) {
        console.error("Failed to get agent status:", error);
        setAgentStatus("Error");
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 2e3);
    return () => clearInterval(interval);
  }, []);
  const startAgent = async () => {
    setIsLoading(true);
    try {
      await electronAPI.agent.start();
      console.log("Agent started");
      setAgentStatus("Running");
    } catch (error) {
      console.error("Failed to start agent", error);
      setAgentStatus("Not Running");
    } finally {
      setIsLoading(false);
    }
  };
  const stopAgent = async () => {
    setIsLoading(true);
    try {
      await electronAPI.agent.stop();
      console.log("Agent stopped");
      setAgentStatus("Not Running");
    } catch (error) {
      console.error("Failed to stop agent", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleToggle = () => {
    if (agentStatus === "Running") {
      stopAgent();
    } else {
      startAgent();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { ...styles.container, ...themeStyles.container }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "Print Agent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.userInfo, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: toggleTheme, style: { ...styles.themeButton, ...themeStyles.button }, children: theme === "light" ? "🌙" : "☀️" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: themeStyles.text }, children: [
          "Welcome, ",
          user?.name || "User",
          "!"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: logout, style: { ...styles.logoutButton, ...themeStyles.dangerButton }, children: "Logout" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.content, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { ...styles.card, ...themeStyles.card }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { color: themeStyles.text }, children: "Quick Actions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.actions, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/users", style: { ...styles.actionButton, ...themeStyles.primaryButton }, children: "Manage Users" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: { ...styles.actionButton, ...themeStyles.primaryButton }, children: "Settings" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleToggle,
              style: { ...styles.actionButton, ...themeStyles.primaryButton },
              disabled: isLoading,
              children: isLoading ? "Loading..." : agentStatus === "Running" ? "Stop Agent" : "Start Agent"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.stats, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { ...styles.statCard, ...themeStyles.card }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { color: themeStyles.text }, children: "Users" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { ...styles.statValue, color: themeStyles.accent }, children: "0" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { ...styles.statCard, ...themeStyles.card }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { color: themeStyles.text }, children: "Active Sessions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { ...styles.statValue, color: themeStyles.accent }, children: "1" })
        ] })
      ] })
    ] })
  ] });
}
const styles = {
  container: {
    padding: "20px",
    minHeight: "100vh",
    height: "100vh",
    overflow: "auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px"
  },
  userInfo: {
    display: "flex",
    gap: "15px",
    alignItems: "center"
  },
  themeButton: {
    padding: "8px 12px",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "20px",
    transition: "all 0.2s ease"
  },
  logoutButton: {
    padding: "8px 16px",
    backgroundColor: "var(--error)",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  card: {
    padding: "20px",
    borderRadius: "8px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)"
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "15px"
  },
  actionButton: {
    padding: "10px 20px",
    backgroundColor: "var(--accent-primary)",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    transition: "background-color 0.2s ease"
  },
  stats: {
    display: "flex",
    gap: "20px"
  },
  statCard: {
    backgroundColor: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    padding: "20px",
    borderRadius: "8px",
    flex: 1
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "bold",
    marginTop: "10px"
  }
};
const lightStyles = {
  container: { background: "#f5f7fa" },
  text: "#1a2d4f",
  accent: "#1e4d72",
  card: { background: "#ffffff", border: "1px solid #cbd5e0" },
  button: { background: "#ffffff", color: "#1a2d4f", border: "1px solid #cbd5e0" },
  primaryButton: { background: "#1e4d72", color: "#ffffff" },
  dangerButton: { background: "#ef4444", color: "#ffffff" }
};
const darkStyles = {
  container: { background: "#1e293b" },
  text: "#e2e8f0",
  accent: "#60a5fa",
  card: { background: "#0f172a", border: "1px solid #334155" },
  button: { background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155" },
  primaryButton: { background: "#60a5fa", color: "#0f172a" },
  dangerButton: { background: "#f87171", color: "#0f172a" }
};
export {
  Dashboard as default
};
