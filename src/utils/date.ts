// 서울 시간 기준 날짜 문자열 (YYYY-MM-DD)
export function getLocalDateString(date: Date): string {
  const seoulDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const year = seoulDate.getFullYear();
  const month = String(seoulDate.getMonth() + 1).padStart(2, "0");
  const day = String(seoulDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 시간 문자열을 Date로 파싱
export function parseMovieTime(timeStr: string, dateStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const movieDate = new Date(dateStr);
  movieDate.setHours(hours, minutes, 0, 0);
  return movieDate;
}
