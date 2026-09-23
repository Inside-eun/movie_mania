type Segment = { label: string; value: number; color: string };

/** 두 계열 비율. 범례와 값 라벨을 모두 붙여 색만으로 구분하지 않는다. */
export default function SplitBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return <p className="text-sm text-[#898781]">데이터가 없습니다.</p>;
  }

  return (
    <div>
      <div className="flex h-6 gap-[2px] overflow-hidden rounded">
        {segments.map((segment) => (
          <div
            key={segment.label}
            style={{
              width: `${(segment.value / total) * 100}%`,
              backgroundColor: segment.color,
            }}
            title={`${segment.label} · ${segment.value.toLocaleString()}명`}
          />
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: segment.color }}
              aria-hidden
            />
            <span className="text-[#c3c2b7]">{segment.label}</span>
            <span className="tabular-nums text-white">{segment.value.toLocaleString()}명</span>
            <span className="tabular-nums text-[#898781]">
              {((segment.value / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
