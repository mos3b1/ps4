interface MatchInfoProps {
  matches: number;
  cycleMinutes: number;
}

export default function MatchInfo({ matches, cycleMinutes }: MatchInfoProps) {
  return (
    <div style={{ fontSize: "12px", color: "#555", textAlign: "center" }}>
      {matches} matches · 1 match ≈ {cycleMinutes}min
    </div>
  );
}
