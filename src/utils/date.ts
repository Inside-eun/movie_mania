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

// Haversine 공식으로 두 좌표 사이의 거리 계산 (km)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
