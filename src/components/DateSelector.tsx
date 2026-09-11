"use client";

import { useRef } from "react";
import { trackDateChange } from "@/utils/gtm";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const getLocalDateString = (date: Date): string => {
    const seoulDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const year = seoulDate.getFullYear();
    const month = String(seoulDate.getMonth() + 1).padStart(2, '0');
    const day = String(seoulDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${year}. ${month}. ${day}.`;
  };

  return (
    <div className="flex-1 relative">
      <button
        type="button"
        className="w-full px-3 py-2 border text-sm bg-[#0d0d0d] border-orange-500 text-gray-100 text-left cursor-pointer"
      >
        {formatDisplayDate(selectedDate)}
      </button>
      <input
        ref={inputRef}
        type="date"
        className="absolute inset-0 opacity-0 w-full cursor-pointer"
        value={selectedDate}
        onChange={(e) => {
          trackDateChange(e.target.value);
          onDateChange(e.target.value);
          inputRef.current?.blur();
        }}
        max={getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
      />
    </div>
  );
}
