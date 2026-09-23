type Point = { label: string; value: number };

const WIDTH = 720;
const HEIGHT = 180;
const PAD_LEFT = 36;
const PAD_RIGHT = 8;
const PAD_TOP = 26;
const PAD_BOTTOM = 22;

/** 일별 추이. 단일 계열이라 범례 없이 제목이 계열명을 대신한다. */
export default function LineChart({ points }: { points: Point[] }) {
  if (points.length < 2) {
    return <p className="text-sm text-[#898781]">표시할 기간이 충분하지 않습니다.</p>;
  }

  const max = Math.max(...points.map((p) => p.value), 1);
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const x = (i: number) => PAD_LEFT + (i / (points.length - 1)) * plotWidth;
  const y = (v: number) => PAD_TOP + plotHeight - (v / max) * plotHeight;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${PAD_TOP + plotHeight} L${x(0)},${PAD_TOP + plotHeight} Z`;

  const gridValues = [0, max / 2, max];
  const tickEvery = Math.ceil(points.length / 6);
  const peak = points.reduce((a, b) => (b.value > a.value ? b : a), points[0]);
  const peakIndex = points.indexOf(peak);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-44 w-full"
      role="img"
      aria-label={`일별 활성 사용자 추이. 최고 ${peak.value.toLocaleString()}명(${peak.label})`}
    >
      {gridValues.map((v) => (
        <g key={v}>
          <line
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={y(v)}
            y2={y(v)}
            stroke="#2c2c2a"
            strokeWidth="1"
          />
          <text x={0} y={y(v) + 4} fill="#898781" fontSize="10" fontVariant="tabular-nums">
            {Math.round(v).toLocaleString()}
          </text>
        </g>
      ))}

      <path d={area} fill="#3987e5" fillOpacity="0.12" />
      <path d={line} fill="none" stroke="#3987e5" strokeWidth="2" strokeLinejoin="round" />

      <circle cx={x(peakIndex)} cy={y(peak.value)} r="4" fill="#3987e5" stroke="#1a1a19" strokeWidth="2" />
      <text
        x={Math.min(x(peakIndex), WIDTH - PAD_RIGHT - 30)}
        y={y(peak.value) - 10}
        fill="#ffffff"
        fontSize="11"
        textAnchor="middle"
      >
        {peak.value.toLocaleString()}
      </text>

      {points.map((p, i) =>
        i % tickEvery === 0 ? (
          <text key={p.label} x={x(i)} y={HEIGHT - 6} fill="#898781" fontSize="10" textAnchor="middle">
            {p.label}
          </text>
        ) : null,
      )}

      {points.map((p, i) => (
        <circle key={p.label} cx={x(i)} cy={y(p.value)} r="8" fill="transparent">
          <title>{`${p.label} · ${p.value.toLocaleString()}명`}</title>
        </circle>
      ))}
    </svg>
  );
}
