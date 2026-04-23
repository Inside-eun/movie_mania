"use client";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const getLocalDateString = (date: Date): string => {
    const seoulDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const year = seoulDate.getFullYear();
    const month = String(seoulDate.getMonth() + 1).padStart(2, '0');
    const day = String(seoulDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <input
      type="date"
      className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
      value={selectedDate}
      onChange={(e) => onDateChange(e.target.value)}
      max={getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
      disabled={false}
    />
  );
}

