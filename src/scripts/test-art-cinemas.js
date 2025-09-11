import { CrawlerService } from '../services/crawler.js';

async function testArtCinemas() {
  const crawler = new CrawlerService();
  
  console.log('\n=== 예술영화관 전용 크롤링 시작 ===\n');
  
  try {
    const movies = await crawler.crawlArtCinemas();
    
    if (!movies || movies.length === 0) {
      console.log('크롤링된 상영 스케줄이 없습니다.');
      return;
    }

    console.log(`\n크롤링 완료: ${movies.length}개 상영 스케줄`);
  } catch (error) {
    console.error('\n=== 크롤링 실패 ===');
    console.error('에러 메시지:', error.message);
    console.error('에러 스택:', error.stack);
    
    process.exit(1);
  }
}

// 최상위 에러 핸들러
process.on('unhandledRejection', (error) => {
  console.error('\n=== 처리되지 않은 Promise 에러 ===');
  console.error(error);
  process.exit(1);
});

testArtCinemas();
