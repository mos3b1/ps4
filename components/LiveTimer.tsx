interface LiveTimerProps {
  elapsedSeconds: number;
}

export default function LiveTimer({ elapsedSeconds }: LiveTimerProps) {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const formatted =
    `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      style={{
        fontFamily: "var(--font-orbitron), monospace",
        fontSize: "36px",
        fontWeight: 900,
        color: "#ffffff",
        letterSpacing: "3px",
        textAlign: "center",
      }}
    >
      {formatted}
    </div>
  );
}
