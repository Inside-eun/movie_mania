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
        console.error("KMDB_API_KEY 환경 변수가 설정되지 않았습니다.");
        return NextResponse.json(
          { success: false, error: "KMDB_API_KEY가 설정되지 않았습니다." },
          { status: 500 }
        );
      }

      console.log(`KMDB API 호출 시작: movieCode=${movieCode}`);
      const url = `https://www.kmdb.or.kr/info/api/3/api.json`;
      
      // KMDB API는 여러 파라미터를 시도해보자
      const apiUrls = [
        `${url}?serviceKey=${apiKey}&movieId=${movieCode}`,
        `${url}?serviceKey=${apiKey}&movieSeq=${movieCode}`,
        `${url}?serviceKey=${apiKey}&movieId=${movieCode}&detail=Y`,
        `${url}?serviceKey=${apiKey}&movieSeq=${movieCode}&detail=Y`,
      ];
      
      let apiUrl = apiUrls[0]; // 기본값
      
      // 여러 URL을 시도해보자
      for (let i = 0; i < apiUrls.length; i++) {
        apiUrl = apiUrls[i];
        console.log(`KMDB API 시도 ${i + 1}/${apiUrls.length}: ${apiUrl}`);
        
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; MovieApp/1.0)',
            },
            timeout: 10000, // 10초 타임아웃
          });

          console.log(`KMDB API 응답 상태: ${response.status}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`KMDB API 응답 데이터:`, JSON.stringify(data, null, 2));
            
            if (data.resultMsg === "INFO-000" && data.resultList && data.resultList.length > 0) {
              const movieInfo = data.resultList[0];
              result = {
                cActors: movieInfo.cActors,
                cCodeSubName2: movieInfo.cCodeSubName2,
              };
              console.log(`KMDB API 성공 (시도 ${i + 1}): cActors=${movieInfo.cActors}, cCodeSubName2=${movieInfo.cCodeSubName2}`);
              break; // 성공하면 루프 종료
            } else {
              console.log(`KMDB API 실패 (시도 ${i + 1}): resultMsg=${data.resultMsg}, resultList 길이=${data.resultList?.length || 0}`);
              if (i === apiUrls.length - 1) {
                // 마지막 시도에서도 실패
                console.log("모든 KMDB API 시도 실패");
              }
            }
          } else {
            console.error(`KMDB API HTTP 에러 (시도 ${i + 1}): ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error(`KMDB API 에러 응답:`, errorText);
          }
        } catch (fetchError) {
          console.error(`KMDB API fetch 에러 (시도 ${i + 1}):`, fetchError);
          if (i === apiUrls.length - 1) {
            // 마지막 시도에서도 실패
            throw fetchError;
          }
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
