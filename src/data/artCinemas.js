// 예술영화관 및 독립영화관 코드 목록
// CGV, 메가박스, 롯데시네마를 제외한 극장들

export const artCinemas = [
  {
    cd: '001128',
    cdNm: 'CINE de CHEF 압구정',
    area: '강남구'
  },
  {
    cd: '001293',
    cdNm: '씨티극장',
    area: '강남구'
  },
  {
    cd: '001242',
    cdNm: '픽처하우스',
    area: '강남구'
  },
  {
    cd: '001166',
    cdNm: 'KU시네마테크',
    area: '광진구'
  },
  {
    cd: '001248',
    cdNm: '씨네큐 신도림',
    area: '구로구'
  },
  {
    cd: '001240',
    cdNm: '더숲 아트시네마',
    area: '노원구'
  },
  {
    cd: '001197',
    cdNm: '아트나인',
    area: '동작구'
  },
  {
    cd: '001146',
    cdNm: 'KT&G 상상마당 Cinema',
    area: '마포구'
  },
  {
    cd: '001297',
    cdNm: '모노플렉스앳라이즈',
    area: '마포구'
  },
  {
    cd: '001193',
    cdNm: '인디스페이스',
    area: '마포구'
  },
  {
    cd: '001282',
    cdNm: '라이카시네마',
    area: '서대문구'
  },
  {
    cd: '001148',
    cdNm: '아트하우스모모',
    area: '서대문구'
  },
  {
    cd: '001149',
    cdNm: '필름포럼',
    area: '서대문구'
  },
  {
    cd: '001098',
    cdNm: '아리랑시네센터(서울)',
    area: '성북구'
  },
  {
    cd: '001126',
    cdNm: '잠실자동차극장',
    area: '송파구'
  },
  {
    cd: '001245',
    cdNm: 'CINE de CHEF 용산아이파크몰',
    area: '용산구'
  },
  {
    cd: '001227',
    cdNm: '낭만극장',
    area: '종로구'
  },
  {
    cd: '001083',
    cdNm: '씨네큐브광화문(서울)',
    area: '종로구'
  },
  {
    cd: '001237',
    cdNm: '에무 시네마 앤 카페',
    area: '종로구'
  },
  {
    cd: '001103',
    cdNm: '허리우드클래식',
    area: '종로구'
  },
  {
    cd: '001062',
    cdNm: '서울아트시네마',
    area: '중구'
  },
  {
    cd: '001165',
    cdNm: '청춘극장',
    area: '중구'
  },
  {
    cd: '001088',
    cdNm: 'CGV 용산아이파크몰',
    area: '용산구'
  },
  {
    cd: '001163',
    cdNm: 'CGV 명동역 씨네라이브러리',
    area: '중구'
  },
  {
    cd: '001111',
    cdNm: 'CGV 압구정',
    area: '강남구'
  },
  {
    cd: '001205',
    cdNm: 'CGV 신촌아트레온',
    area: '서대문구'
  },
  {
    cd: '001127',
    cdNm: 'CGV 대학로',
    area: '종로구'
  },

];

// 멀티플렉스 체인 필터링용
export const multiplexChains = ['CGV', '메가박스', '롯데시네마'];

// 예술영화관 여부 판단 함수
export function isArtCinema(theaterName) {
  return !multiplexChains.some(chain => theaterName.includes(chain));
}

// 예술영화관만 필터링하는 함수
export function filterArtCinemas(theaterList) {
  return theaterList.filter(theater => isArtCinema(theater.cdNm));
}

// // 수동 스케줄 데이터 (KOBIS에서 조회되지 않는 극장)
// export const manualSchedules = {
//   // 2025년 9월 15일 예시 데이터
//   '2025-09-15': [
//     {
//       title: '예술영화 1',
//       theater: '수동극장 A',
//       area: '강남구',
//       screen: '1관',
//       time: '14:00',
//       source: 'manual'
//     },
//     {
//       title: '예술영화 2',
//       theater: '수동극장 A',
//       area: '강남구',
//       screen: '2관',
//       time: '16:30',
//       source: 'manual'
//     },
//     {
//       title: '독립영화 1',
//       theater: '수동극장 B',
//       area: '마포구',
//       screen: '특별관',
//       time: '19:00',
//       source: 'manual'
//     },
//     {
//       title: '독립영화 2',
//       theater: '수동극장 B',
//       area: '마포구',
//       screen: '특별관',
//       time: '21:30',
//       source: 'manual'
//     }
//   ],
//   // 2025년 9월 16일 예시 데이터
//   '2025-09-16': [
//     {
//       title: '예술영화 3',
//       theater: '수동극장 A',
//       area: '강남구',
//       screen: '1관',
//       time: '15:00',
//       source: 'manual'
//     },
//     {
//       title: '예술영화 4',
//       theater: '수동극장 A',
//       area: '강남구',
//       screen: '2관',
//       time: '17:30',
//       source: 'manual'
//     },
//     {
//       title: '독립영화 3',
//       theater: '수동극장 B',
//       area: '마포구',
//       screen: '특별관',
//       time: '20:00',
//       source: 'manual'
//     },
//     {
//       title: '독립영화 4',
//       theater: '수동극장 B',
//       area: '마포구',
//       screen: '특별관',
//       time: '22:30',
//       source: 'manual'
//     }
//   ]
//   // 필요에 따라 더 많은 날짜 추가 가능
// };

// 실버영화관 스케줄 자동 생성
const silverCinemaSchedules = {
  // 역마차: 2025-09-15 하루만
  ...generateSilverCinemaSchedules('역마차', '20100040', '2025-09-15', '2025-09-15'),
  
  // 바로 지금 여기: 2025-09-16 ~ 2025-09-17 (2일간)
  ...generateSilverCinemaSchedules('바로 지금 여기', '20244606', '2025-09-16', '2025-09-17'),
};

// 수동 스케줄 데이터 (자동 생성된 스케줄 + 기타 수동 스케줄)
export const manualSchedules = {
  ...silverCinemaSchedules,
  
  // 다른 극장의 수동 스케줄이 있다면 여기에 추가
  // '2025-09-18': [
  //   {
  //     title: '다른 영화',
  //     theater: '다른 극장',
  //     area: '강남구',
  //     screen: '1관',
  //     time: '19:00',
  //     movieCode: '12345678',
  //     source: 'manual'
  //   }
  // ]
};

// 실버영화관 스케줄 자동 생성 함수 (직접 구현)
export function generateSilverCinemaSchedules(movieTitle, movieCode, startDate, endDate) {
  const schedules = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 실버영화관 고정 상영시간
  const showTimes = ['10:30', '12:20', '14:10', '16:00'];
  
  // 시작일부터 종료일까지 반복
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    schedules[dateStr] = showTimes.map(time => ({
      title: movieTitle,
      theater: '실버영화관',
      area: '종로구',
      screen: '',
      time: time,
      movieCode: movieCode,
      source: 'manual'
    }));
  }
  
  return schedules;
}

// 특정 날짜의 수동 스케줄을 가져오는 함수
export function getManualSchedules(date) {
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
  return manualSchedules[dateStr] || [];
}

// 실버영화관 스케줄을 쉽게 추가하는 헬퍼 함수
export function addSilverCinemaMovie(movieTitle, movieCode, startDate, endDate) {
  const newSchedules = generateSilverCinemaSchedules(movieTitle, movieCode, startDate, endDate);
  
  // 기존 manualSchedules에 병합
  Object.keys(newSchedules).forEach(date => {
    if (manualSchedules[date]) {
      manualSchedules[date] = [...manualSchedules[date], ...newSchedules[date]];
    } else {
      manualSchedules[date] = newSchedules[date];
    }
  });
  
  return newSchedules;
}

// 사용 예시:
// addSilverCinemaMovie('새로운 영화', '20249999', '2025-09-20', '2025-09-22');
