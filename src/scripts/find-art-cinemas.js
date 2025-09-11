import { CrawlerService } from '../services/crawler.js';
import { multiplexChains, isArtCinema } from '../data/artCinemas.js';

// 서울시 주요 구 코드 (KOBIS 지역코드)
const seoulDistricts = [
  { name: '강남구', wideAreaCd: '0105001', basAreaCd: '010600101' },
  { name: '강동구', wideAreaCd: '0105001', basAreaCd: '010600102' },
  { name: '강북구', wideAreaCd: '0105001', basAreaCd: '010600103' },
  { name: '강서구', wideAreaCd: '0105001', basAreaCd: '010600104' },
  { name: '관악구', wideAreaCd: '0105001', basAreaCd: '010600105' },
  { name: '광진구', wideAreaCd: '0105001', basAreaCd: '010600106' },
  { name: '구로구', wideAreaCd: '0105001', basAreaCd: '010600107' },
  { name: '금천구', wideAreaCd: '0105001', basAreaCd: '010600108' },
  { name: '노원구', wideAreaCd: '0105001', basAreaCd: '010600109' },
  { name: '도봉구', wideAreaCd: '0105001', basAreaCd: '010600110' },
  { name: '동대문구', wideAreaCd: '0105001', basAreaCd: '010600111' },
  { name: '동작구', wideAreaCd: '0105001', basAreaCd: '010600112' },
  { name: '마포구', wideAreaCd: '0105001', basAreaCd: '010600113' },
  { name: '서대문구', wideAreaCd: '0105001', basAreaCd: '010600114' },
  { name: '서초구', wideAreaCd: '0105001', basAreaCd: '010600115' },
  { name: '성동구', wideAreaCd: '0105001', basAreaCd: '010600116' },
  { name: '성북구', wideAreaCd: '0105001', basAreaCd: '010600117' },
  { name: '송파구', wideAreaCd: '0105001', basAreaCd: '010600118' },
  { name: '양천구', wideAreaCd: '0105001', basAreaCd: '010600119' },
  { name: '영등포구', wideAreaCd: '0105001', basAreaCd: '010600120' },
  { name: '용산구', wideAreaCd: '0105001', basAreaCd: '010600121' },
  { name: '은평구', wideAreaCd: '0105001', basAreaCd: '010600122' },
  { name: '종로구', wideAreaCd: '0105001', basAreaCd: '010600123' },
  { name: '중구', wideAreaCd: '0105001', basAreaCd: '010600124' },
  { name: '중랑구', wideAreaCd: '0105001', basAreaCd: '010600125' }
];

async function findArtCinemas() {
  const crawler = new CrawlerService();
  const allArtCinemas = [];
  
  console.log('=== 서울시 전체 구 예술영화관 조회 시작 ===\n');
  
  for (const district of seoulDistricts) {
    try {
      console.log(`${district.name} 조회 중...`);
      
      // 구별 극장 목록 조회
      const theaters = await crawler.getTheaterListByDistrict(district.wideAreaCd, district.basAreaCd);
      
      if (theaters && theaters.theaCdList) {
        // 예술영화관만 필터링
        const artCinemasInDistrict = theaters.theaCdList.filter(theater => isArtCinema(theater.cdNm));
        
        if (artCinemasInDistrict.length > 0) {
          console.log(`  → ${artCinemasInDistrict.length}개 예술영화관 발견:`);
          artCinemasInDistrict.forEach(theater => {
            console.log(`     - ${theater.cdNm} (${theater.cd})`);
            allArtCinemas.push({
              cd: theater.cd,
              cdNm: theater.cdNm,
              area: district.name
            });
          });
        } else {
          console.log(`  → 예술영화관 없음`);
        }
      } else {
        console.log(`  → 극장 데이터 없음`);
      }
      
      // API 호출 간격 (너무 빠르면 차단될 수 있음)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`${district.name} 조회 실패:`, error.message);
    }
  }
  
  console.log(`\n=== 조회 완료 ===`);
  console.log(`총 ${allArtCinemas.length}개 예술영화관 발견\n`);
  
  // 결과를 JavaScript 코드 형태로 출력
  console.log('=== artCinemas.js 업데이트용 코드 ===');
  console.log('export const artCinemas = [');
  allArtCinemas.forEach(cinema => {
    console.log(`  {`);
    console.log(`    cd: '${cinema.cd}',`);
    console.log(`    cdNm: '${cinema.cdNm}',`);
    console.log(`    area: '${cinema.area}'`);
    console.log(`  },`);
  });
  console.log('];');
  
  return allArtCinemas;
}

findArtCinemas().catch(console.error);
