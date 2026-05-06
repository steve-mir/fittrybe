import type { CSSProperties } from "react";

type WordmarkProps = {
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
};

const LEMON = "#B6FF00";

export function Wordmark({
  height = 26,
  className,
  style,
  ariaLabel = "FitTrybe",
}: WordmarkProps) {
  const heightPx = typeof height === "number" ? `${height}px` : height;

  return (
    <span
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--font-anton, 'Anton', sans-serif)",
        fontWeight: 400,
        fontSize: heightPx,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        textTransform: "none",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span style={{ color: "#fff" }}>fitTry</span>
      <span style={{ color: LEMON, fontWeight: 700 }}>be</span>
    </span>
  );
}

export default Wordmark;
