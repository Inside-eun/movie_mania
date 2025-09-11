import { CrawlerService } from '../services/crawler.js';

async function testKMDBOnly() {
  const crawler = new CrawlerService();
  
  console.log('\n=== 한국영상자료원 단독 테스트 ===\n');
  
  try {
    const movies = await crawler.getKOFASchedule();
    
    if (!movies || movies.length === 0) {
      console.log('한국영상자료원 상영 스케줄이 없습니다.');
      return;
    }

    console.log('\n=== 한국영상자료원 상영시간표 ===');
    movies.forEach(movie => {
      const timeStr = movie.showtime.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      console.log(`${timeStr} | ${movie.title.padEnd(40)} | ${movie.director ? `(${movie.director})` : ''}`);
    });

    console.log(`\n한국영상자료원 크롤링 완료: ${movies.length}개 상영 스케줄`);
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

testKMDBOnly();
