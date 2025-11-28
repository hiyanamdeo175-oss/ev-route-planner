import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authApi";
import { useTheme } from "@mui/material/styles";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate("/");
      } else {
        await register(name, email, password, phone);
        // after register, log in automatically
        await login(email, password);
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top, #22c55e 0, #111827 45%, #020617 100%)"
            : "radial-gradient(circle at top, #bae6fd 0, #e5e7eb 45%, #ffffff 100%)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background:
            theme.palette.mode === "dark"
              ? "rgba(15, 23, 42, 0.95)"
              : "rgba(255, 255, 255, 0.96)",
          borderRadius: 24,
          padding: "32px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          color: theme.palette.text.primary,
          border:
            theme.palette.mode === "dark"
              ? "1px solid rgba(148, 163, 184, 0.3)"
              : "1px solid rgba(148, 163, 184, 0.4)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: "999px",
              background:
                "conic-gradient(from 180deg, #22c55e, #38bdf8, #a855f7, #22c55e)",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 26 }}>⚡</span>
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 0.4,
              color: "#f9fafb",
            }}
          >
            EV Route Planner
          </h1>
          <p style={{ marginTop: 6, fontSize: 14, color: "#9ca3af" }}>
            {isLogin
              ? "Sign in to view smart routes, charging slots, and EV insights."
              : "Create your account to start planning EV routes."}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              backgroundColor: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#fca5a5",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!isLogin && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  marginBottom: 6,
                  color: "#e5e7eb",
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.4)",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
          )}

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 6,
                color: "#e5e7eb",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.4)",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 6,
                color: "#e5e7eb",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.4)",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          {!isLogin && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  marginBottom: 6,
                  color: "#e5e7eb",
                }}
              >
                Phone (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.4)",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              width: "100%",
              padding: "11px 12px",
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(135deg, #22c55e, #16a34a, #0ea5e9)",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <p
          style={{
            marginTop: 18,
            fontSize: 12,
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          {isLogin ? (
            <>
              No account?{" "}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#38bdf8",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                  fontSize: "inherit",
                }}
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#38bdf8",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                  fontSize: "inherit",
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default Login;
