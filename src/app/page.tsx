"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("ardian@agentspace.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login gagal.");
        return;
      }

      window.location.href = "/dashboard";
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
	      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
	      padding: 20,
	      background: "#111318",
	      color: "#f4f6f8",
	      fontFamily: "'Space Grotesk', Arial, sans-serif",
	      position: "relative",
	      overflow: "hidden",
	    }}>
	      <div style={{
	        position: "absolute",
	        inset: 0,
	        pointerEvents: "none",
	        backgroundImage: "linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.026) 1px, transparent 1px)",
	        backgroundSize: "34px 34px",
	        maskImage: "linear-gradient(to bottom, black, transparent 82%)",
	      }} />

	      <form onSubmit={handleLogin} style={{
	        width: "min(420px, 100%)",
	        borderRadius: 10,
	        padding: 24,
	        background: "rgba(18,20,25,0.92)",
	        border: "1px solid rgba(255,255,255,0.10)",
	        boxShadow: "0 18px 42px rgba(0,0,0,0.26)",
	        backdropFilter: "blur(16px)",
	        position: "relative",
	        zIndex: 1,
	      }}>
	        <div style={{
	          width: 46,
	          height: 46,
	          borderRadius: 8,
	          display: "grid",
	          placeItems: "center",
	          background: "#14b8a6",
	          color: "#041311",
	          fontSize: 18,
	          fontWeight: 900,
	          marginBottom: 16,
	          boxShadow: "none",
	        }}>
	          AS
	        </div>

	        <h1 style={{ margin: 0, fontSize: 25, lineHeight: 1.15, color: "#f8fafc", letterSpacing: 0 }}>
	          Login Dashboard
	        </h1>
	        <p style={{ margin: "8px 0 22px", color: "rgba(255,255,255,0.58)", fontSize: 13, lineHeight: 1.6 }}>
	          Masuk dulu sebelum buka AgentSpace.
	        </p>

        <label style={{ display: "block", marginBottom: 12 }}>
	          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.62)", marginBottom: 7 }}>
	            Email
	          </span>
          <input
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="email@agentspace.com"
            style={{
              width: "100%",
              padding: "12px 13px",
	              borderRadius: 8,
	              background: "rgba(255,255,255,0.055)",
	              border: "1px solid rgba(255,255,255,0.11)",
	              color: "#f8fafc",
              outline: "none",
              fontSize: 14,
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 14 }}>
	          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.62)", marginBottom: 7 }}>
	            Password
	          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={password}
              onChange={event => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "12px 13px",
	                borderRadius: 8,
	                background: "rgba(255,255,255,0.055)",
	                border: "1px solid rgba(255,255,255,0.11)",
                color: "#f8fafc",
                outline: "none",
                fontSize: 14,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(current => !current)}
              style={{
                width: 50,
	                borderRadius: 8,
	                background: "rgba(255,255,255,0.07)",
	                border: "1px solid rgba(255,255,255,0.12)",
	                color: "rgba(255,255,255,0.70)",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {error && (
          <div style={{
            marginBottom: 14,
            padding: "10px 12px",
	            borderRadius: 8,
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
	            borderRadius: 8,
	            border: "none",
	            background: loading ? "rgba(255,255,255,0.08)" : "#14b8a6",
	            color: loading ? "rgba(255,255,255,0.42)" : "#07110f",
            fontSize: 14,
            fontWeight: 900,
            cursor: loading ? "not-allowed" : "pointer",
	            boxShadow: "none",
          }}
        >
          {loading ? "Masuk..." : "Masuk Dashboard"}
        </button>

        <Link
          href="/register"
          style={{
            display: "block",
            marginTop: 12,
            padding: "12px 14px",
	            borderRadius: 8,
	            border: "1px solid rgba(255,255,255,0.11)",
	            background: "rgba(255,255,255,0.055)",
            color: "rgba(255,255,255,0.76)",
            fontSize: 13,
            fontWeight: 800,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          Buat akun baru
        </Link>

        <div style={{
          marginTop: 14,
          color: "rgba(255,255,255,0.32)",
          fontSize: 11,
          lineHeight: 1.6,
        }}>
          Credential disimpan di file env lokal, bukan di browser.
        </div>
      </form>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800;900&display=swap');
        input::placeholder { color: rgba(255,255,255,0.24); }
      `}</style>
    </main>
  );
}
