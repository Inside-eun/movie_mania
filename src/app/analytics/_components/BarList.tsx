export type BarRow = { label: string; value: number; secondary?: number };

/** 가로 막대 순위 목록. 값은 직접 라벨로 붙여 색에만 의존하지 않는다. */
export default function BarList({
  rows,
  secondaryLabel,
  unit = "",
}: {
  rows: BarRow[];
  secondaryLabel?: string;
  unit?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-[#898781]">데이터가 없습니다.</p>;
  }

  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-[#c3c2b7] sm:w-40" title={row.label}>
            {row.label}
          </span>
          <span className="h-4 min-w-0 flex-1 rounded-sm bg-[#222220]">
            <span
              className="block h-4 rounded-sm bg-[#3987e5]"
              style={{ width: `${Math.max((row.value / max) * 100, 2)}%` }}
              title={`${row.label} · ${row.value.toLocaleString()}${unit}`}
            />
          </span>
          <span className="w-14 shrink-0 text-right text-sm tabular-nums text-white">
            {row.value.toLocaleString()}
          </span>
          {row.secondary !== undefined && (
            <span
              className="hidden w-14 shrink-0 text-right text-sm tabular-nums text-[#898781] sm:block"
              title={secondaryLabel}
            >
              {row.secondary.toLocaleString()}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
