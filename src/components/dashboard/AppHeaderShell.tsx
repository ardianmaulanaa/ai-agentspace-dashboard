"use client";

import type { ReactNode } from "react";

type AppHeaderShellProps = {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
  rail: ReactNode;
  children: ReactNode;
};

export function AppHeaderShell({
  isMobile,
  isOpen,
  onClose,
  rail,
  children,
}: AppHeaderShellProps) {
  const railWidth = isMobile ? 64 : 72;
  const sidebarWidth = isMobile ? "min(320px, calc(100vw - 64px))" : 258;

  return (
    <>
      <aside
        style={{
          width: railWidth,
          flexShrink: 0,
          background: "var(--bg-rail)",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: isMobile ? "14px 0" : "18px 0",
          gap: isMobile ? 10 : 10,
          zIndex: 32,
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: "var(--shadow-panel)",
          backdropFilter: "blur(24px)",
        }}
      >
        {rail}
      </aside>

      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Close app header"
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            border: "none",
            background: "rgba(0,0,0,0.34)",
            cursor: "pointer",
          }}
        />
      )}

      <aside
        style={{
          width: sidebarWidth,
          overflow: "hidden",
          transition: "transform 0.28s ease, opacity 0.2s ease",
          transform: isOpen ? "translateX(0)" : "translateX(calc(-100% - 8px))",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          zIndex: 31,
          position: "absolute",
          left: railWidth,
          top: 0,
          bottom: 0,
          height: "100%",
          boxShadow: isOpen ? "24px 0 60px rgba(0,0,0,0.25)" : "none",
          backdropFilter: "blur(24px)",
        }}
      >
        {children}
      </aside>
    </>
  );
}
