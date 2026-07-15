"use client";

import type { ReactNode } from "react";

type RightNavbarShellProps = {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function RightNavbarShell({
  isMobile,
  isOpen,
  onClose,
  children,
}: RightNavbarShellProps) {
  return (
    <>
      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Close right navbar"
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
          width: isMobile ? "min(430px, calc(100vw - 58px))" : 420,
          flexShrink: 0,
          background: "var(--bg-sidebar)",
          borderLeft: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          zIndex: 30,
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          height: "100%",
          transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 8px))",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "transform 0.28s ease, opacity 0.2s ease",
          boxShadow: isOpen ? "-24px 0 70px rgba(0,0,0,0.30)" : "none",
          backdropFilter: "blur(24px)",
        }}
      >
        {children}
      </aside>
    </>
  );
}
