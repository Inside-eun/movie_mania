# ERD 설계 (통합 시간표 조회 사이트, 내부 API 전환 가정)

이 서비스는 예매를 대행하는 사이트가 아니라, **여러 극장(멀티플렉스 + 예술영화관)의 상영 시간표를 통합해서 보여주는 조회 서비스**입니다.
좌석/결제 개념은 없고, 대신 아래 8가지가 핵심입니다.

1. 상영중인 영화 (시간표)
2. 유저 정보
3. 유저가 찜한 영화
4. 유저가 알림설정한 영화
5. 유저가 즐겨찾기한 영화관
6. 서울시 예술영화관
7. 영화 정보 (감독/배우/장르/개봉년도 등)
8. 특별 기획전

DBML로 작성했고, [dbdiagram.io](https://dbdiagram.io)에 붙여넣으면 바로 다이어그램이 그려집니다.

```dbml
Table movies {
  id           int       [pk, increment]
  title        varchar   [not null]
  director     varchar
  actors       varchar   // 콤마 구분 텍스트 (기존 cActors 필드 대응)
  genre        varchar
  release_date date
  runtime      int       // 분 단위
  age_rating   varchar   // 전체/12/15/19
  poster_url   varchar
  overview     text
  tmdb_id      varchar   // TMDB 연동용 외부 참조 (완전 내부화 전 과도기 대응)

  indexes {
    title
  }
}

Table theaters {
  id        int       [pk, increment]
  code      varchar   [unique] // 극장 코드 (예: artCinemas의 cd)
  name      varchar   [not null]
  area      varchar   // 구 단위 (강남구, 광진구 ...)
  address   varchar
  latitude  float
  longitude float
  type      varchar   [not null] // multiplex / arthouse
  source    varchar   // 데이터 출처 (cgv / megabox / lotte / kofa ...)
}

Table showtimes {
  id          int       [pk, increment]
  movie_id    int       [not null, ref: > movies.id]
  theater_id  int       [not null, ref: > theaters.id]
  screen_name varchar   // "01관", "03관(Reserve)" 등 원본 표기 그대로
  start_time  timestamp [not null]
  source      varchar   // 크롤링 소스
  crawled_at  timestamp [default: `now()`] // 캐시 갱신 시각 추적용

  indexes {
    (theater_id, start_time)
    (movie_id, start_time)
  }
}

Table users {
  id         int       [pk, increment]
  guest_id   varchar   [unique] // 비로그인 상태에서 발급되는 GUEST-###### 식별자
  provider   varchar   // kakao / google / apple / guest
  email      varchar
  name       varchar
  created_at timestamp [default: `now()`]
}

Table user_movie_likes {
  id         int       [pk, increment]
  user_id    int       [not null, ref: > users.id]
  movie_id   int       [not null, ref: > movies.id]
  created_at timestamp [default: `now()`]

  indexes {
    (user_id, movie_id) [unique]
  }
}

Table user_movie_alerts {
  id         int       [pk, increment]
  user_id    int       [not null, ref: > users.id]
  movie_id   int       [not null, ref: > movies.id]
  alert_type varchar   // 개봉알림 / 상영시간등록알림 등
  created_at timestamp [default: `now()`]

  indexes {
    (user_id, movie_id) [unique]
  }
}

Table user_favorite_theaters {
  id         int       [pk, increment]
  user_id    int       [not null, ref: > users.id]
  theater_id int       [not null, ref: > theaters.id]
  created_at timestamp [default: `now()`]

  indexes {
    (user_id, theater_id) [unique]
  }
}

Table events {
  id           int       [pk, increment]
  theater_id   int       [ref: > theaters.id] // 기획전을 여는 극장 (단일 극장 기준일 때)
  title        varchar   [not null]
  period_start date
  period_end   date
  summary      varchar
  description  text
  banner_color varchar   // 포스터 이미지 없을 때 쓰는 목업 컬러
}

Table event_movies {
  id       int [pk, increment]
  event_id int [not null, ref: > events.id]
  movie_id int [not null, ref: > movies.id]

  indexes {
    (event_id, movie_id) [unique]
  }
}

Table recommendation_impressions {
  id                    bigint    [pk, increment]
  view_id               varchar   [not null] // 상세페이지 1회 방문을 묶는 식별자 (같은 방문에서 노출된 추천들을 그룹핑)
  user_id               int       [ref: > users.id] // 비로그인이면 null
  source_movie_id       int       [not null, ref: > movies.id] // 유저가 보고 있던 상세페이지의 영화
  strategy              varchar   [not null] // event / director / genre
  recommended_movie_id  int       [not null, ref: > movies.id]
  rank                  int       [not null] // 추천 목록 내 노출 순서 (1부터)
  shown_at              timestamp [default: `now()`]
  clicked_at            timestamp // null이면 클릭 안 함

  indexes {
    (source_movie_id, strategy)
    view_id
  }
}
```

## 테이블별 역할

| 테이블 | 역할 |
| --- | --- |
| `movies` | 영화 자체의 정보 (감독/배우/장르/개봉년도/줄거리 등) |
| `theaters` | 극장 (멀티플렉스 + 예술영화관 전부 포함) |
| `showtimes` | "지금 상영중인 영화" — 영화 × 극장 × 시간을 잇는 시간표 데이터 (지금 크롤링 결과가 최종적으로 여기 쌓이는 구조) |
| `users` | 서비스 이용자 (게스트 포함) |
| `user_movie_likes` | 유저가 찜한 영화 |
| `user_movie_alerts` | 유저가 알림 설정한 영화 |
| `user_favorite_theaters` | 유저가 즐겨찾기한 영화관 |
| `events` | 특별 기획전 |
| `event_movies` | 기획전에 포함된 상영작 목록 |
| `recommendation_impressions` | 영화 상세페이지에서 어떤 추천 전략(기획전/감독/장르)으로 어떤 영화가 노출됐고, 클릭됐는지 기록하는 로그 |

## 관계 설명

- **movies 1 : N showtimes**, **theaters 1 : N showtimes** — 시간표는 "이 영화가 이 극장, 이 시간에 상영된다"는 사실 하나하나가 로우가 됩니다. 좌석/상영관 단위까지 정규화하지 않고 `screen_name`을 텍스트로 남긴 이유는, 예매가 아니라 조회가 목적이라 상영관을 별도 엔티티로 관리할 필요가 없기 때문입니다 (지금 크롤링 데이터의 `screen` 필드와 1:1 대응).
- **users 1 : N user_movie_likes N : 1 movies** — 찜하기는 유저-영화 다대다 관계라 중간 테이블이 필요합니다. `(user_id, movie_id)`에 유니크 제약을 걸어 중복 찜을 막았습니다.
- **users 1 : N user_movie_alerts N : 1 movies** — 알림설정도 구조는 찜하기와 동일하지만, `alert_type`을 두어 "개봉 알림"과 "상영 시작 알림" 등을 구분할 수 있게 열어뒀습니다. (지금 `EventsView.tsx`의 `localStorage` 기반 `notifyAlerts`를 서버 테이블로 옮기는 셈입니다.)
- **users 1 : N user_favorite_theaters N : 1 theaters** — 즐겨찾기 극장도 동일한 다대다 패턴입니다.
- **서울시 예술영화관은 별도 테이블을 만들지 않았습니다** — `theaters.type = 'arthouse'` + `area`(구 단위) 조합으로 필터링하면 되기 때문입니다. 지금 `src/data/artCinemas.js`도 결국 "극장 목록 중 예술영화관인 것들"이라 별도 개념이 아니라 `theaters`의 부분집합입니다. 만약 "서울시 인증 예술영화관" 같은 별도 자격/배지 개념이 생기면, `theaters`에 `is_certified_arthouse boolean` 같은 플래그를 추가하는 정도로 충분합니다.
- **events N : M movies (via event_movies)** — 기획전 하나에 상영작이 여러 개, 같은 영화가 여러 기획전에 걸릴 수도 있어 다대다입니다. `events.theater_id`는 기획전을 연 극장이 보통 하나이므로 1:N으로 뒀는데, 만약 여러 극장이 공동 개최하는 기획전이 필요해지면 `event_theaters` 중간 테이블로 바꾸면 됩니다.

## 추천 알고리즘 검증 (recommendation_impressions)

영화 상세페이지 하단 추천은 코드 로직(기획전 매칭 / 같은 감독 / 비슷한 장르)일 뿐 별도 테이블이 필요한 개념이 아니라서, 기존 `movies`·`event_movies` 스키마는 그대로 두고 **로그 테이블 하나만 추가**했습니다.

- **movies 1 : N recommendation_impressions (source_movie_id 기준)** — "이 영화의 상세페이지에서 추천이 노출됐다"를 나타냅니다.
- **movies 1 : N recommendation_impressions (recommended_movie_id 기준)** — "이 영화가 추천으로 노출됐다"를 나타냅니다. 같은 `movies` 테이블을 두 번 참조하는 자기참조 구조라 DBML에서 두 개의 별도 FK로 표현했습니다.
- **users 1 : N recommendation_impressions** — 로그인 유저는 `user_id`로 남기고, 비로그인이면 null로 둡니다 (원한다면 `users.guest_id`를 항상 발급하는 지금 구조상 게스트도 `user_id`를 채우게 만들 수 있습니다).
- **`view_id`로 그룹핑하는 이유** — 상세페이지 1회 방문에서 추천이 여러 개(예: 장르 추천 5개) 노출되므로, 그 묶음을 식별할 값이 필요합니다. `strategy`별로 노출된 movie들을 `rank`(노출 순서)와 함께 남기면 나중에 "몇 번째 위치에 있었는지"에 따른 클릭률 편향도 분석할 수 있습니다.
- **검증 방법** — `strategy`별로 `clicked_at is not null`인 비율(클릭률)을 비교하면 어떤 전략이 더 효과적인지 알 수 있습니다. 방식은 두 가지가 가능합니다.
  - (A) 방문마다 무작위로 전략 하나만 선택해서 보여주기 → 전략별 클릭률을 그대로 비교 (전통적 A/B 테스트, 다만 유저마다 다른 전략을 보게 되므로 표본이 충분히 커야 함)
  - (B) 한 방문에서 기획전/감독/장르 추천을 섹션별로 동시에 보여주기 → 같은 유저·같은 방문 조건에서 `strategy`별 클릭률을 비교 (표본 편향이 적지만, 화면에 섹션이 여러 개 노출되므로 UX 부담이 커짐)
  - 지금 스키마는 두 방식 모두 그대로 지원합니다 (A는 방문당 `strategy` 값이 하나, B는 방문당 여러 `strategy` 값이 섞여서 쌓일 뿐 테이블 구조는 동일).
- **나중에 필요해질 수 있는 확장** — 지금은 "이 방문에서 어떤 전략을 보여줄지"를 애플리케이션 코드가 그때그때 정하는 걸로 가정했습니다. 만약 유저별로 일관되게 같은 전략을 계속 보여줘야 하는 실험(예: 2주간 A그룹은 항상 감독 추천만)으로 발전하면, 유저-전략 배정을 저장하는 `experiment_assignments` 테이블을 별도로 추가하는 걸 추천합니다.

## 이번 설계에서 명시적으로 뺀 것

- 예매(`reservations`), 결제(`payments`), 좌석(`seats`) — 이 서비스의 책임이 아니라고 판단해서 전부 제외했습니다. 예매 자체는 각 극장사 앱/사이트로 딥링크(`ticketLink`)만 걸어주는 지금 구조를 유지하면 됩니다.
