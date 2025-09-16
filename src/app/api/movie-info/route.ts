import { NextResponse } from "next/server";
import { getMovieInfoFromKOBIS } from "@/services/kobisApi";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const movieCode = searchParams.get("movieCode");
    const source = searchParams.get("source");

    if (!movieCode) {
      return NextResponse.json(
        { success: false, error: "movieCode가 필요합니다." },
        { status: 400 }
      );
    }

    let result = null;

    if (source === 'KMDB_API') {
      // KMDB API 호출 (서버 사이드에서)
      const apiKey = process.env.KMDB_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: "KMDB_API_KEY가 설정되지 않았습니다." },
          { status: 500 }
        );
      }

      const url = `https://www.kmdb.or.kr/info/api/3/api.json`;
      const response = await fetch(`${url}?serviceKey=${apiKey}&movieId=${movieCode}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.resultMsg === "INFO-000" && data.resultList && data.resultList.length > 0) {
          const movieInfo = data.resultList[0];
          result = {
            cActors: movieInfo.cActors,
            cCodeSubName2: movieInfo.cCodeSubName2,
          };
        }
      }
    } else {
      // KOBIS API 호출
      result = await getMovieInfoFromKOBIS(movieCode);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("영화 정보 API 에러:", error);
    return NextResponse.json(
      {
        success: false,
        error: "영화 정보를 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
