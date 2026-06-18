"use client";

export default function ScoreRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 85 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  const label =
    score >= 85 ? "Looking great" : score >= 60 ? "Needs improvement" : "Just started";

  return (
    <div className="flex items-center gap-3">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#27324C" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
        <text
          x="24"
          y="24"
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90"
          transform="rotate(90 24 24)"
          fill="#E7ECF5"
          fontSize="13"
          fontWeight="700"
        >
          {score}
        </text>
      </svg>
      <div>
        <div className="text-sm font-semibold text-nav-text">Your Resume Score</div>
        <div className="text-xs text-nav-muted">{label}</div>
      </div>
    </div>
  );
}
