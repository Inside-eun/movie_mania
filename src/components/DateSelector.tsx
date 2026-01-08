"use client";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  loading: boolean;
  onSearch: () => void;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
  loading,
  onSearch,
}: DateSelectorProps) {
  const getLocalDateString = (date: Date): string => {
    const seoulDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const year = seoulDate.getFullYear();
    const month = String(seoulDate.getMonth() + 1).padStart(2, '0');
    const day = String(seoulDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="flex gap-2 w-full items-center">
      <input
        type="date"
        className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        min={getLocalDateString(new Date())}
        max={getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
        disabled={false}
      />
      <button
        onClick={onSearch}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap text-sm font-medium active:scale-95 transition-all"
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          "조회"
        )}
      </button>
    </div>
  );
}

