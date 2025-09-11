import { cacheService } from '../services/cacheService.js';

async function testCaching() {
  console.log('=== 캐시 서비스 테스트 ===\n');

  // 1. 초기 캐시 통계 확인
  console.log('1. 초기 캐시 통계:');
  console.log(cacheService.getStats());
  console.log('');

  // 2. 테스트 데이터 저장
  console.log('2. 테스트 데이터 저장 중...');
  const testMovies = [
    {
      title: '테스트 영화 1',
      theater: '테스트 극장',
      area: '마포구',
      screen: '1관',
      time: '14:00',
      showtime: new Date(),
      source: 'test'
    },
    {
      title: '테스트 영화 2',
      theater: '테스트 극장',
      area: '마포구',
      screen: '2관',
      time: '16:30',
      showtime: new Date(),
      source: 'test'
    }
  ];

  const today = new Date().toISOString().split('T')[0];
  cacheService.set('test', today, testMovies);
  console.log('테스트 데이터 저장 완료');
  console.log('');

  // 3. 캐시에서 데이터 조회
  console.log('3. 캐시에서 데이터 조회:');
  const cachedData = cacheService.get('test', today);
  if (cachedData) {
    console.log('✅ 캐시 히트 성공');
    console.log('조회된 데이터:', cachedData);
  } else {
    console.log('❌ 캐시 미스');
  }
  console.log('');

  // 4. 캐시 통계 재확인
  console.log('4. 데이터 저장 후 캐시 통계:');
  console.log(cacheService.getStats());
  console.log('');

  // 5. 다른 날짜로 조회 (캐시 미스 테스트)
  console.log('5. 다른 날짜로 조회 (캐시 미스 테스트):');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const missData = cacheService.get('test', tomorrowStr);
  if (missData) {
    console.log('❌ 예상치 못한 캐시 히트');
  } else {
    console.log('✅ 예상대로 캐시 미스');
  }
  console.log('');

  // 6. 캐시 삭제 테스트
  console.log('6. 캐시 삭제 테스트:');
  cacheService.delete('test', today);
  const deletedData = cacheService.get('test', today);
  if (deletedData) {
    console.log('❌ 캐시 삭제 실패');
  } else {
    console.log('✅ 캐시 삭제 성공');
  }
  console.log('');

  // 7. 최종 캐시 통계
  console.log('7. 최종 캐시 통계:');
  console.log(cacheService.getStats());
  console.log('');

  // 8. 만료 테스트 (짧은 TTL로 테스트)
  console.log('8. 만료 테스트 (3초 후 만료):');
  
  // 테스트용으로 짧은 TTL 데이터 저장
  const shortLivedData = { test: 'expires soon' };
  cacheService.set('expire_test', today, shortLivedData);
  
  console.log('데이터 저장 직후 조회:');
  const immediateData = cacheService.get('expire_test', today);
  console.log(immediateData ? '✅ 데이터 존재' : '❌ 데이터 없음');
  
  // 3초 대기 후 정리 및 조회
  console.log('3초 후 정리 실행...');
  setTimeout(() => {
    cacheService.cleanup();
    const expiredData = cacheService.get('expire_test', today);
    console.log('정리 후 조회:', expiredData ? '❌ 데이터 여전히 존재' : '✅ 데이터 만료됨');
    
    console.log('\n=== 캐시 서비스 테스트 완료 ===');
  }, 3000);
}

// 테스트 실행
testCaching().catch(console.error);
