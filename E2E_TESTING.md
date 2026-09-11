# E2E 테스트 (Playwright)

앱 화면 테스트를 AI가 자동으로 돌릴 수 있는지에 대한 답으로 구축한 Playwright E2E 스위트. 사람이 매번 손으로 눌러보지 않아도 핵심 플로우를 검증한다.

## 실행 방법

```bash
npm run test:e2e         # 기본값: 프로덕션 배포 사이트(moviemania-olive.vercel.app) 대상
npm run test:e2e:local   # 로컬 dev 서버(localhost:3000) 대상, npm run dev 자동 실행
npm run test:e2e:ui      # UI 모드 (단계별 재생, 실패 원인 눈으로 확인)
npm run test:e2e:report  # 마지막 실행 리포트 보기

E2E_BASE_URL=<url> npm run test:e2e   # 임의 환경(예: develop 프리뷰) 대상
```

설정은 [playwright.config.ts](playwright.config.ts), 테스트 코드는 [e2e/](e2e/) 폴더에 있다.

> **Vercel 프리뷰 배포로 테스트할 때 주의**: 짧은 시간에 자동화 요청을 반복해서 보내면 Vercel의 봇 차단(Security Checkpoint)이 걸려 "Failed to verify your browser" 화면이 뜰 수 있다. 프로덕션 배포에는 이 보호 기능이 없어서 안 걸린다. 프리뷰에서 막히면 로컬(`test:e2e:local`)이나 프로덕션으로 대신 확인할 것.

## 지금 검증하는 것 (2026-09-11 기준, 23개 테스트)

### 화면 로드 & 하단 네비게이션 — [e2e/navigation.spec.ts](e2e/navigation.spec.ts)
- [x] 홈 화면 진입 시 헤더/타이틀이 정상 표시됨
- [x] 하단 탭(홈/찜/기획전/설정)을 누르면 해당 화면으로 전환되고 활성 탭 표시(주황색)가 바뀜

### 영화 상세 화면 — [e2e/movie-detail.spec.ts](e2e/movie-detail.spec.ts)
- [x] 영화 카드 클릭 → 상세 페이지 이동, 클릭한 영화의 제목이 상세 화면에 표시됨
- [x] 뒤로 가기 시 홈으로 정상 복귀
- [x] 예매 버튼이 `/api/booking-url` 조회 후 실제 URL로 채워지고 `target=_blank`로 열림
- [x] 상세 화면의 찜 버튼으로도 찜 추가/제거가 동작함

### 찜 기능 — [e2e/wishlist.spec.ts](e2e/wishlist.spec.ts)
- [x] 영화를 찜하면 하단 탭 배지에 카운트가 반영됨
- [x] 찜 목록 화면(리스트 모드)에 실제로 표시됨
- [x] 찜 해제 시 목록에서 사라지고 빈 상태 문구가 나옴

### 찜 달력 뷰(기본 모드) — [e2e/wishlist-calendar.spec.ts](e2e/wishlist-calendar.spec.ts)
- [x] 찜 화면 기본값이 달력 뷰인지
- [x] 이전 달/다음 달 이동 시 월 표시가 바뀌고 되돌아옴

### 필터 & 날짜 선택 — [e2e/filter.spec.ts](e2e/filter.spec.ts)
- [x] 필터 바텀시트가 열리고, 영화별/영화관별 탭 전환이 동작함
- [x] 날짜를 바꾸면 선택된 날짜 표시가 갱신됨

### 영화관별 필터 — [e2e/theater-filter.spec.ts](e2e/theater-filter.spec.ts)
- [x] 영화관 체크박스를 선택하면 목록이 실제로 좁혀지고, 선택한 극장 소속만 남음
- [x] 초기화하면 필터 이전 개수로 정확히 되돌아옴

### 정렬 / 보기 방식 / 지도 — [e2e/sort-and-map.spec.ts](e2e/sort-and-map.spec.ts)
- [x] 정렬 방식(시간순↔거리순) 라벨 전환 및 `sort_changed` GA 이벤트
- [x] 보기 방식(2열→3열→리스트) 순환 전환 시 카드 레이아웃 클래스가 실제로 바뀜
- [x] 지도 아이콘 클릭 시 길찾기 모달이 열리고 닫힘

### 설정 화면 & 즐겨찾는 영화관 — [e2e/settings.spec.ts](e2e/settings.spec.ts)
- [x] 영화관을 즐겨찾기에 추가하면 칩으로 표시됨
- [x] 홈 화면 필터의 "★ 즐겨찾기 영화관" 그룹까지 연동되는지(오늘 상영 중일 때)
- [x] 즐겨찾기 해제 동작

### 기획전 — [e2e/events.spec.ts](e2e/events.spec.ts)
- [x] 목록에서 항목 클릭 → 상세 진입 → 목록으로 복귀

### 빈 상태 — [e2e/empty-state.spec.ts](e2e/empty-state.spec.ts)
- [x] 상영 스케줄 API가 0건을 반환하면 "상영 중인 예술영화가 없습니다." 문구
- [x] 스케줄은 있지만 전부 지난 시간이면 "현재 시간 이후의 상영시간이 없습니다." 문구
- 날짜를 실제로 과거로 돌리는 방식은 신뢰할 수 없어서(먼 과거에도 mock/캐시 데이터가 채워질 수 있음) `/api/schedules` 응답 자체를 모킹해서 결정론적으로 재현

### GA4 이벤트 트래킹 — [e2e/analytics.spec.ts](e2e/analytics.spec.ts)
- [x] 필터 열기/탭 전환 시 `filter_opened`, `filter_tab_changed`(파라미터 포함)
- [x] 찜 추가/제거 시 `wishlist_added`(영화 제목 파라미터 포함), `wishlist_removed`
- [x] 하단 탭 전환 시 `tab_changed`(탭 이름 파라미터 포함)
- [x] 정렬 전환 시 `sort_changed`(정렬 타입 파라미터 포함)
- 실제 구글 서버로는 전송하지 않고 `window.dataLayer.push` 호출을 가로채서 검증 ([e2e/helpers.ts](e2e/helpers.ts)의 `captureGaEvents`)

## 아직 자동화 안 된 것 (To-Do)

- [ ] **추천작**: 상세 화면 하단 추천 영화 클릭 시 해당 영화로 이동 (표시 조건이 그날 상영작 조합에 따라 달라져서 결정론적으로 재현하려면 API 모킹이 필요)
- [ ] **GA4 이벤트 잔여분**: `booking_clicked`, `movie_detail_opened`, `recommendation_clicked`, `map_icon_clicked`, `favorite_theater_saved` 등
- [ ] **다크모드 토글**: `DarkModeToggle` 컴포넌트 자체가 현재 어느 화면에도 렌더링되지 않는 죽은 코드라 UI로 테스트 불가 — 실제로 쓸 계획이면 화면에 연결부터 필요
- [ ] **iOS 네이티브 기능**: 카메라/위치/알림 등 Capacitor 전용 기능은 Playwright 범위 밖 → XCUITest 등 별도 도구 필요 (아직 미착수)

## 테스트 범위 밖인 것

- **크롤링/API 로직 자체**: 상영시간표가 실제로 정확한지, 극장 사이트에서 크롤링이 잘 되는지는 화면 테스트로 검증 안 됨. `npm run test:crawler`, `npm run test:art` 등 기존 스크립트가 담당.
- **iOS 네이티브 UI**: 시뮬레이터 안의 Capacitor 앱 자체 화면은 Playwright가 손댈 수 없음(모바일 웹 뷰포트로 근사 검증만 가능).

## 최종적으로 `npm run test:e2e`가 통과하면 확인되는 것

한 줄로 요약하면: **"오늘 배포된 사이트에서, 사용자가 앱을 열고 영화를 찾아 필터링/정렬하고 찜하고 예매 직전까지 가는 핵심 흐름이 화면 레벨에서 깨지지 않았고, 그 과정에서 GA4로 정확한 이벤트가 나간다"**는 것.

구체적으로는:
1. 배포가 실제로 반영돼서 최신 코드가 서빙되고 있다
2. 화면 진입 자체가 깨지지 않는다 (흰 화면, 무한 로딩 같은 치명적 회귀가 없다)
3. 앱의 뼈대인 4개 탭(홈/찜/기획전/설정) 이동이 전부 동작한다
4. 사용자가 실제로 하는 핵심 행동(영화 찾기 → 필터/정렬 → 상세 보기 → 찜하기 → 예매 링크 확인)이 끝까지 이어진다
5. 영화관 즐겨찾기가 설정 화면과 홈 필터 사이에서 실제로 연동된다
6. 상영작이 없거나 다 지난 시간일 때 사용자에게 올바른 안내 문구가 뜬다
7. 마케팅/분석팀이 보는 GA4 대시보드에 실제로 찍히는 이벤트 4종(필터, 찜, 탭 전환, 정렬)이 코드 변경 이후에도 계속 정상 발사된다

반대로 이게 통과했다고 해서 **크롤링 데이터 정확성, 추천작 로직, 다크모드(미연결 상태), iOS 네이티브 기능**까지 보장되는 건 아니라서, 위 To-Do 목록은 그 공백을 좁히기 위한 다음 단계다.
