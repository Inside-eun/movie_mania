import { NextResponse } from "next/server";
import { getMovieInfoFromKOBIS } from "@/services/kobisApi";

/** KMDB API로 영화 정보 조회. 실패 시 null */
async function fetchFromKMDB(
  movieCode: string,
): Promise<{ cActors?: string; cCodeSubName2?: string } | null> {
  const apiKey = process.env.KMDB_API_KEY;
  if (!apiKey) return null;

  const url = "https://www.kmdb.or.kr/info/api/3/api.json";
  const apiUrls = [
    `${url}?serviceKey=${apiKey}&movieId=${movieCode}`,
    `${url}?serviceKey=${apiKey}&movieSeq=${movieCode}`,
    `${url}?serviceKey=${apiKey}&movieId=${movieCode}&detail=Y`,
    `${url}?serviceKey=${apiKey}&movieSeq=${movieCode}&detail=Y`,
  ];

  for (let i = 0; i < apiUrls.length; i++) {
    try {
      const response = await fetch(apiUrls[i], {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; MovieApp/1.0)",
        },
        // @ts-expect-error Node fetch timeout
        timeout: 10000,
      });
      if (!response.ok) continue;
      const data = await response.json();
      if (data.resultMsg === "INFO-000" && data.resultList?.length > 0) {
        const m = data.resultList[0];
        return { cActors: m.cActors, cCodeSubName2: m.cCodeSubName2 };
      }
    } catch {
      // 다음 시도
    }
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const movieCode = searchParams.get("movieCode");
    const source = searchParams.get("source");

    if (!movieCode) {
      return NextResponse.json(
        { success: false, error: "movieCode가 필요합니다." },
        { status: 400 },
      );
    }

    let result: unknown = null;
    let dataSource: "KOBIS" | "KMDB_API" | null = null;

    if (source === "KMDB_API") {
      const apiKey = process.env.KMDB_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: "KMDB_API_KEY가 설정되지 않았습니다." },
          { status: 500 },
        );
      }
      result = await fetchFromKMDB(movieCode);
      dataSource = result ? "KMDB_API" : null;
    } else {
      result = await getMovieInfoFromKOBIS(movieCode);
      dataSource = result ? "KOBIS" : null;
      // KOBIS에 없으면 KMDB 폴백 (통합 스케줄에서 source 없이 넘어온 KMDB 코드 대응)
      if (result == null && process.env.KMDB_API_KEY) {
        result = await fetchFromKMDB(movieCode);
        dataSource = result ? "KMDB_API" : null;
      }
    }

    const body: { success: true; data: unknown; dataSource?: string } = {
      success: true,
      data: result,
    };
    if (dataSource) body.dataSource = dataSource;

    return NextResponse.json(body);
  } catch (error) {
    console.error("영화 정보 API 에러:", error);
    return NextResponse.json(
      {
        success: false,
        error: "영화 정보를 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
}
