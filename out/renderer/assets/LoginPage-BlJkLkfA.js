import { v as useNavigate, u as useAuthStore, a as useTheme, r as reactExports, j as jsxRuntimeExports } from "./index-BHp6kVh6.js";
function LoginPage() {
  const navigate = useNavigate();
  const { login, error, isLoading } = useAuthStore();
  const { theme } = useTheme();
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const themeStyles = theme === "dark" ? darkStyles : lightStyles;
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...styles.container, ...themeStyles.container }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { ...styles.card, ...themeStyles.card }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: { ...styles.title, color: themeStyles.text }, children: "Uranius Print Agent" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, style: styles.form, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.inputGroup, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { color: themeStyles.text }, children: "Email" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "Enter your email",
            required: true,
            style: { ...styles.input, ...themeStyles.input }
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.inputGroup, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { color: themeStyles.text }, children: "Password" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            placeholder: "Enter your password",
            required: true,
            style: { ...styles.input, ...themeStyles.input }
          }
        )
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...styles.error, color: themeStyles.error }, children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: isLoading, style: { ...styles.button, ...themeStyles.primaryButton }, children: isLoading ? "Logging in..." : "Login" })
    ] })
  ] }) });
}
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100vw",
    height: "100vh",
    margin: 0,
    padding: "20px",
    overflow: "hidden",
    boxSizing: "border-box",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  card: {
    padding: "30px",
    // borderRadius: '8px',
    width: "90%",
    maxWidth: "450px"
    // boxSizing: 'border-box' as const,
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  input: {
    padding: "10px",
    borderRadius: "4px",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  button: {
    padding: "12px",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.2s ease"
  },
  error: {
    fontSize: "14px",
    textAlign: "center"
  }
};
const lightStyles = {
  container: { backgroundColor: "#f5f7fa" },
  text: "#1a2d4f",
  card: { backgroundColor: "#ffffff", border: "1px solid #cbd5e0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
  input: { backgroundColor: "#ffffff", color: "#1a2d4f", border: "1px solid #cbd5e0" },
  primaryButton: { backgroundColor: "#1e4d72", color: "#ffffff" },
  error: "#ef4444"
};
const darkStyles = {
  container: { backgroundColor: "#1e293b" },
  text: "#e2e8f0",
  card: { backgroundColor: "#0f172a", border: "1px solid #334155", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" },
  input: { backgroundColor: "#0f172a", color: "#e2e8f0", border: "1px solid #334155" },
  primaryButton: { backgroundColor: "#60a5fa", color: "#0f172a" },
  error: "#f87171"
};
export {
  LoginPage as default
};
