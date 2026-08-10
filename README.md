# 대한민국 부루마블

주사위를 굴려 국내 여행지를 배정받고, **실제로 다녀와 인증하면 그 시·군·구가 내 땅이 되는** 여행 보드게임 웹앱.
2026 한국관광공사 × Kakao 관광데이터 활용 공모전 출품작 (웹·앱 개발 부문).

## 게임 흐름

주사위 굴리기 → 테마·거리 조건에 맞는 목적지 배정 → 봉투 개봉 → 실제 이동 →
GPS 도착 인증 + 미션 인증(영수증·위치) → 해당 시·군·구 점령 → 친구와 영토 경쟁

인구감소지역은 **황금 타일**로 2배 점수를 줍니다.

## 실행

```bash
npm install
cp .env.example .env      # 발급받은 키 입력
npm run dev               # http://localhost:5173
npm run build             # dist/ 생성
npm run build:artifact    # Claude Artifact 용 단일 .jsx 생성
```

## 외부 연동

| 기능 | 사용처 |
|---|---|
| 목적지·미션·대표이미지 | 한국관광공사 TourAPI 4.0 (KorService2) |
| 지도·마커·길찾기 | Kakao Maps JavaScript SDK |
| 도착 인증 행정구역 대조 | Kakao Local (SDK Geocoder 우선, REST 폴백) |
| 친구 초대 공유 | Kakao JS SDK Share |

Kakao SDK 는 개발자 콘솔의 **JavaScript 키 → JavaScript SDK 도메인**에 배포 주소가
등록되어 있어야 동작합니다. TourAPI 는 브라우저 직접 호출이 CORS 로 막힐 수 있어
실서비스에서는 프록시(`VITE_TOUR_PROXY`)를 두는 것을 권장합니다.

앱 내 **마이 → TourAPI 연동 / 카카오 연동** 패널에서 키를 교체하고 연결을 테스트할 수 있습니다.
배포본에는 `/api-diagnostics.html` 진단 페이지가 함께 들어갑니다.

## 디렉터리 구조

```
data/sigungu_data.json      251개 시·군·구 SVG 경계 (southkorea-maps 가공)

src/
├── App.jsx                 앱 셸 — 전역 상태, 게임 진행, 탭 라우팅
├── config.js               .env 에서 API 키 로드
│
├── data/
│   ├── constants.js        테마·거리·기간·예산·이벤트 카드·플레이어
│   ├── board.js            시·군·구 타일 게임판
│   ├── depopulated.js      인구감소지역 (황금 타일 기준)
│   └── sampleDestinations.js  API 실패 시 폴백 목적지
│
├── lib/
│   ├── sigungu.js          경계 데이터 · 주소 → 시군구 매칭
│   ├── geo.js              거리 계산 · 단말 위치 조회
│   └── text.js             문자열 정리
│
├── api/
│   ├── tourApi.js          TourAPI 조회 · 테마 분류 · 미션 생성
│   ├── kakao.js            Maps SDK · Local REST · 공유 SDK
│   └── verification.js     도착 인증 · 영수증 인증
│
├── ui/
│   ├── styles.js           인라인 스타일 · 전역 CSS
│   ├── primitives.jsx      공통 조각 (섹션·주사위·봉투·스플래시)
│   └── KakaoMap.jsx        카카오맵 렌더
│
├── screens/                Main / Map / Rank / My 탭
└── overlays/               VerifyFlow / ResultOverlay / ShareModal
```

## 데이터 출처

- 시·군·구 경계: [southkorea-maps](https://github.com/southkorea/southkorea-maps) GeoJSON 을
  중위도 코사인 보정 · y축 반전 · 소수점 1자리 단순화하여 SVG path 로 변환
- 관광 정보: 한국관광공사 TourAPI 4.0 (공공데이터포털)
- 인구감소지역: 행정안전부 지정 목록 (최신 고시로 재검증 필요)

## 주의

- `.env` 는 커밋되지 않습니다. 다만 `VITE_` 변수는 **브라우저 번들에 그대로 들어가므로**
  저장소에 없다는 것이지 노출되지 않는다는 뜻은 아닙니다.
- 현재 소스에는 데모용 키가 폴백 값으로 들어 있습니다. **저장소를 공개하기 전에 키를 재발급**하고
  REST 키·TourAPI 키는 서버 프록시 뒤로 옮기세요.
