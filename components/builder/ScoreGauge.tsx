"use client";

export default function ScoreGauge({ score }: { score: number }) {
  const w = 220;
  const h = 130;
  const cx = w / 2;
  const cy = h - 12;
  const r = 92;

  // angle: 180° (left) → 0° (right). value 0..100
  const angle = Math.PI - (score / 100) * Math.PI;
  const markerX = cx + r * Math.cos(angle);
  const markerY = cy - r * Math.sin(angle);

  const arc = (startPct: number, endPct: number, color: string) => {
    const a0 = Math.PI - (startPct / 100) * Math.PI;
    const a1 = Math.PI - (endPct / 100) * Math.PI;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    return (
      <path
        d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
      />
    );
  };

  const label =
    score >= 85 ? "Looking strong" : score >= 60 ? "Needs improvement" : "Just getting started";

  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {arc(0, 40, "#EF4444")}
        {arc(40, 75, "#F59E0B")}
        {arc(75, 100, "#10B981")}
        <circle cx={markerX} cy={markerY} r="7" fill="#fff" stroke="#0B1220" strokeWidth="3" />
        <text x={cx} y={cy - 28} textAnchor="middle" fill="#E7ECF5" fontSize="34" fontWeight="800">
          {score}
        </text>
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#8A95AD" fontSize="11">
          {label}
        </text>
        <text x={16} y={cy + 8} textAnchor="middle" fill="#8A95AD" fontSize="10">0</text>
        <text x={w - 16} y={cy + 8} textAnchor="middle" fill="#8A95AD" fontSize="10">100</text>
      </svg>
    </div>
  );
}
