"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, password, confirmPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Register gagal.");
        return;
      }

      window.location.href = "/dashboard";
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Register gagal.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 12,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#f8fafc",
    outline: "none",
    fontSize: 14,
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: 20,
      background: "#060d1a",
      color: "#e2e8f0",
      fontFamily: "'Space Grotesk', Arial, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: "radial-gradient(circle at 22% 12%, rgba(34,211,238,0.18), transparent 34%), radial-gradient(circle at 80% 78%, rgba(16,185,129,0.12), transparent 32%)",
      }} />

      <form onSubmit={handleRegister} style={{
        width: "min(460px, 100%)",
        borderRadius: 18,
        padding: 22,
        background: "rgba(8,14,26,0.86)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.42)",
        backdropFilter: "blur(18px)",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, #22d3ee, #10b981)",
          color: "#06111f",
          fontSize: 18,
          fontWeight: 900,
          marginBottom: 16,
          boxShadow: "0 0 24px rgba(34,211,238,0.38)",
        }}>
          AS
        </div>

        <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.15, color: "#f8fafc" }}>
          Register AgentSpace
        </h1>
        <p style={{ margin: "8px 0 20px", color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6 }}>
          Buat akun member untuk masuk ke dashboard.
        </p>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.46)", marginBottom: 7 }}>
            Email
          </span>
          <input
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="contoh: member@agentspace.com"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.46)", marginBottom: 7 }}>
            Display Name
          </span>
          <input
            value={displayName}
            onChange={event => setDisplayName(event.target.value)}
            autoComplete="name"
            placeholder="Nama yang tampil di dashboard"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.46)", marginBottom: 7 }}>
            Password
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={password}
              onChange={event => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              style={{ ...inputStyle, flex: 1, minWidth: 0 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(current => !current)}
              style={{
                width: 50,
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.62)",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label style={{ display: "block", marginBottom: 14 }}>
          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.46)", marginBottom: 7 }}>
            Confirm Password
          </span>
          <input
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            style={inputStyle}
          />
        </label>

        {error && (
          <div style={{
            marginBottom: 14,
            padding: "10px 12px",
            borderRadius: 12,
            background: "rgba(244,63,94,0.10)",
            border: "1px solid rgba(244,63,94,0.24)",
            color: "#fb7185",
            fontSize: 12,
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px 14px",
            borderRadius: 13,
            border: "none",
            background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #22d3ee, #10b981)",
            color: loading ? "rgba(255,255,255,0.42)" : "#06111f",
            fontSize: 14,
            fontWeight: 900,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 0 24px rgba(34,211,238,0.28)",
          }}
        >
          {loading ? "Membuat akun..." : "Buat Akun"}
        </button>

        <Link
          href="/"
          style={{
            display: "block",
            marginTop: 12,
            padding: "12px 14px",
            borderRadius: 13,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.76)",
            fontSize: 13,
            fontWeight: 800,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          Sudah punya akun
        </Link>
      </form>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800;900&display=swap');
        input::placeholder { color: rgba(255,255,255,0.24); }
      `}</style>
    </main>
  );
}
