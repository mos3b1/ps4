"use client";

interface ToastProps {
  message: string;
}

export default function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        bottom: "28px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "#0d0d18",
          border: "1px solid #f0c040",
          color: "#f0c040",
          padding: "12px 24px",
          borderRadius: "10px",
          boxShadow: "0 4px 30px #f0c04022",
          fontFamily: "var(--font-orbitron), sans-serif",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "1px",
          whiteSpace: "nowrap",
        }}
      >
        {message}
      </div>
    </div>
  );
}
