/** 이전 동일 기간 대비 증감률. 이전 값이 0이면 비교가 무의미하므로 표시하지 않는다. */
function delta(current: number, previous: number): { text: string; tone: string } | null {
  if (previous === 0) return null;

  const rate = ((current - previous) / previous) * 100;
  if (Math.abs(rate) < 0.5) return { text: "변화 없음", tone: "text-[#898781]" };

  const up = rate > 0;
  return {
    text: `${up ? "▲" : "▼"} ${Math.abs(rate).toFixed(1)}%`,
    tone: up ? "text-[#0ca30c]" : "text-[#d03b3b]",
  };
}

export default function StatCard({
  label,
  value,
  previous,
}: {
  label: string;
  value: number;
  previous: number;
}) {
  const change = delta(value, previous);

  return (
    <div className="rounded-lg border border-white/10 bg-[#1a1a19] p-4">
      <p className="text-xs text-[#898781]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value.toLocaleString()}</p>
      {change && (
        <p className={`mt-1 text-xs ${change.tone}`} title="직전 동일 기간 대비">
          {change.text}
        </p>
      )}
    </div>
  );
}
