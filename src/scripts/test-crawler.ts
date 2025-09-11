import { CrawlerService } from '../services/crawler.js';
import { Movie } from '../types/index.js';

async function testCrawler() {
  const crawler = new CrawlerService();
  
  console.log('\n=== 서울시 마포구 영화 상영시간표 크롤링 시작 ===\n');
  
  try {
    const movies = await crawler.crawlKOBIS();
    
    if (!movies || movies.length === 0) {
      console.log('크롤링된 상영 스케줄이 없습니다.');
      return;
    }

    console.log(`\n크롤링 완료: ${movies.length}개 상영 스케줄\n`);
    
    // 극장별로 그룹화
    const theaterGroups = movies.reduce((acc, movie) => {
      const theaterName = movie.theater.name;
      if (!acc[theaterName]) {
        acc[theaterName] = [];
      }
      acc[theaterName].push(movie);
      return acc;
    }, {} as Record<string, Movie[]>);

    // 결과 출력
    Object.entries(theaterGroups).forEach(([theaterName, movies]) => {
      console.log(`\n=== ${theaterName} ===`);
      
      // 상영관별로 다시 그룹화
      const screenGroups = movies.reduce((acc, movie) => {
        const screenName = movie.screenName || '기타';
        if (!acc[screenName]) {
          acc[screenName] = [];
        }
        acc[screenName].push(movie);
        return acc;
      }, {} as Record<string, Movie[]>);

      Object.entries(screenGroups).forEach(([screenName, screenMovies]) => {
        console.log(`\n[${screenName}]`);
        screenMovies.forEach(movie => {
          const timeStr = movie.showtime.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
          });
          console.log(`${timeStr} - ${movie.title}`);
        });
      });
    });
  } catch (error) {
    console.error('\n=== 크롤링 실패 ===');
    
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
      console.error('에러 스택:', error.stack);
      if ('cause' in error) {
        console.error('원인:', error.cause);
      }
    } else {
      console.error('알 수 없는 에러:', error);
    }

    console.log('\n디버그 정보:');
    console.log('- error-page.png 파일을 확인해주세요');
    console.log('- debug-page.png 파일을 확인해주세요');
    
    process.exit(1);
  }
}

// 최상위 에러 핸들러
process.on('unhandledRejection', (error) => {
  console.error('\n=== 처리되지 않은 Promise 에러 ===');
  console.error(error);
  process.exit(1);
});

testCrawler();