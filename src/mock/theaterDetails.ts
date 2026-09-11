import { artCinemas } from "@/data/artCinemas";

export interface TheaterDetail {
  cd: string;
  cdNm: string;
  area: string;
  lat: number;
  lng: number;
  address?: string;
}

export function getTheaterDetailByName(name: string): TheaterDetail | undefined {
  return artCinemas.find((t) => t.cdNm === name);
}
