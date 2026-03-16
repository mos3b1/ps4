interface BillDisplayProps {
  amount: number;
}

export default function BillDisplay({ amount }: BillDisplayProps) {
  return (
    <div
      style={{
        background: "#f0c04011",
        border: "1px solid #f0c04033",
        borderRadius: "8px",
        padding: "10px",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px" }}>
        <span
          style={{
            fontFamily: "var(--font-orbitron), monospace",
            fontSize: "28px",
            fontWeight: 900,
            color: "#f0c040",
            lineHeight: 1,
          }}
        >
          {amount}
        </span>
        <span style={{ fontSize: "12px", color: "#888" }}>DZD</span>
      </div>
    </div>
  );
}
