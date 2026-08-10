# -*- coding: utf-8 -*-
"""App.jsx 단일 파일을 기능별 모듈로 분리한다."""
import io, os, re, shutil

SRC = "src/App.jsx"
s = io.open(SRC, encoding="utf-8").read()
lines = s.split("\n")

BOUND = re.compile(r'^(import |export |const |let |var |function |async function |/\*)')
NAME  = re.compile(r'^(?:export\s+)?(?:async\s+)?(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)')

idx = [i for i, l in enumerate(lines) if BOUND.match(l)]
raw = []
for k, i in enumerate(idx):
    end = idx[k + 1] if k + 1 < len(idx) else len(lines)
    raw.append("\n".join(lines[i:end]).rstrip())

# 이름 없는 주석 블록은 다음 선언에 붙인다 (단, APP_VERSION 앞 주석은 TourAPI 섹션 헤더이므로 건너뜀)
stmts = []          # (name, text)
pending = []
for t in raw:
    if t.startswith("import "):
        continue
    m = NAME.match(t.split("\n")[0])
    if not m:
        if t.lstrip().startswith("export default function App"):
            stmts.append(("App", "\n".join(pending + [t]) if pending else t))
            pending = []
            continue
        if "BOARD.forEach" in t:                      # 이름 없는 부수효과 블록
            stmts.append(("__BOARD_PATCH__", "\n".join(pending + [t]) if pending else t))
            pending = []
        else:
            pending.append(t)
        continue
    nm = m.group(1)
    if nm == "APP_VERSION" and pending:
        stmts.append((nm, t))          # 주석은 다음(TOUR_BASE)으로 넘김
        continue
    stmts.append((nm, "\n".join(pending + [t]) if pending else t))
    pending = []
assert not pending, "처리되지 않은 꼬리 주석"

by_name = {n: t for n, t in stmts}

# ── 모듈 배치 ────────────────────────────────────────────────
MODULES = [
 ("src/data/constants.js",        "게임 규칙 상수 — 테마 / 거리 / 기간 / 예산 / 이벤트 카드 / 시도 목록 / 플레이어",
  ["APP_VERSION","THEME_LABELS","THEME_LIST","DIST_STEPS","DURATIONS","BUDGETS","EVENT_CARDS",
   "SIDO_ORDER","SIDO_TINT","ME","FRIEND_POOL","TOLL","methodFor","NATIONAL_ROOMS"]),

 ("src/data/depopulated.js",      "행정안전부 인구감소지역 — 황금 타일(2배 점수) 판정 기준",
  ["DEPOP_SET"]),

 ("src/data/sampleDestinations.js","TourAPI 응답 형태의 내장 샘플 목적지 — API 실패 시 폴백",
  ["SAMPLE_POOL"]),

 ("src/data/board.js",            "시·군·구 타일 게임판",
  ["SIDO_FULL","SIDO_ACCENT","BOARD","__BOARD_PATCH__"]),

 ("src/lib/sigungu.js",           "251개 시·군·구 경계 데이터와 주소 → 시군구 매칭",
  ["SIGUNGU","SIGUNGU_BY_SIDO","shortSgg","sggFromAddr"]),

 ("src/lib/geo.js",               "좌표 계산과 단말 위치 조회",
  ["haversineKm","getPosition"]),

 ("src/lib/text.js",              "문자열 정리 유틸",
  ["stripTags"]),

 ("src/api/tourApi.js",           "한국관광공사 TourAPI 4.0 (KorService2) 연동",
  ["TOUR_BASE","TOUR_CFG","HOME_ORIGIN","TOUR_AREAS","THEME_KW","classifyThemes","THEME_GRAD",
   "tourGet","tourCache","tourAreaPool","buildDest","fetchDestinations","enrichDestination"]),

 ("src/api/kakao.js",             "카카오 Maps SDK / Local REST / 공유 SDK 연동",
  ["KAKAO_CFG","SIDO_SHORT","kakaoSdkPromise","loadKakaoSdk","kakaoLocal","kakaoRegionOf",
   "kakaoRegionViaSdk","kakaoRegionAny","kakaoRouteUrl","kakaoSharePromise","loadKakaoShare","inviteLink"]),

 ("src/api/verification.js",      "도착 인증 / 영수증 인증",
  ["verifyArrivalReal","verifyReceipt","verifyGps"]),

 ("src/ui/styles.js",             "인라인 스타일 객체와 전역 CSS",
  ["S","CSS"]),

 ("src/ui/primitives.jsx",        "공통 UI 조각 — 섹션 / 지표 / 주사위 / 봉투 / 스플래시",
  ["Section","Meta","Stat","Row","Chk","Lg","DieFace","Envelope","Splash","SplashArt"]),

 ("src/ui/KakaoMap.jsx",          "카카오맵 렌더 컴포넌트",
  ["KakaoMap"]),

 ("src/overlays/VerifyFlow.jsx",  "도착 인증 · 미션 인증 오버레이",
  ["VerifyFlow"]),

 ("src/overlays/ResultOverlay.jsx","점령 결과 오버레이",
  ["ResultOverlay"]),

 ("src/overlays/ShareModal.jsx",  "친구 초대 — 링크 / 카카오톡 공유",
  ["ShareModal"]),

 ("src/screens/MainScreen.jsx",   "메인 탭 — 조건 선택과 주사위",
  ["MainScreen","ActiveTripCard"]),

 ("src/screens/MapScreen.jsx",    "지도 탭 — 실제 경계 지도와 타일 보드",
  ["MapScreen","RealMap","TileBoard"]),

 ("src/screens/RankScreen.jsx",   "랭킹 탭",
  ["RankScreen","RankRow"]),

 ("src/screens/MyScreen.jsx",     "마이 탭 — 인증 카드와 API 연동 패널",
  ["MyScreen","ApiPanel","keyState"]),

 ("src/App.jsx",                  "앱 셸 — 전역 상태, 게임 진행, 탭 라우팅",
  ["App"]),
]

placed = {}
for path, _, names in MODULES:
    for n in names:
        assert n in by_name, "선언을 찾지 못함: " + n
        placed[n] = path
missing = [n for n, _ in stmts if n not in placed]
assert not missing, "배치되지 않은 선언: " + str(missing)

# 모듈 밖으로 노출하지 않을 내부 상태
PRIVATE = {"kakaoSdkPromise", "kakaoSharePromise", "__BOARD_PATCH__"}
REACT_HOOKS = ["useState", "useRef", "useEffect", "useMemo"]

def relpath(frm, to):
    r = os.path.relpath(to, os.path.dirname(frm)).replace(os.sep, "/")
    return r if r.startswith(".") else "./" + r

built = {}
for path, title, names in MODULES:
    body = []
    for n in names:
        t = by_name[n]
        if n not in PRIVATE:
            t = re.sub(r'^(\s*)(?=(async function|function|const|let|var)\s)', r'\1export ', t, count=1, flags=re.M) \
                if not t.lstrip().startswith("/*") else t
            # 주석이 앞에 붙은 경우 선언 라인에 export 삽입
            if "export " not in t.split("\n")[0] and not re.search(r'^export ', t, re.M):
                t = re.sub(r'^(?=(async function|function|const|let|var)\s)', 'export ', t, count=1, flags=re.M)
        body.append(t)
    built[path] = "\n\n".join(body)

# ── import 자동 생성 ────────────────────────────────────────
for path, title, names in MODULES:
    code = built[path]
    own = set(names)
    needed = {}
    for n, src_path in placed.items():
        if n in own or n in PRIVATE:
            continue
        if re.search(r'(?<![\w$.])' + re.escape(n) + r'(?![\w$])', code):
            needed.setdefault(src_path, []).append(n)

    imports = []
    if path.endswith(".jsx") or re.search(r'(?<![\w$.])React(?![\w$])', code):
        hooks = [h for h in REACT_HOOKS if re.search(r'(?<![\w$.])' + h + r'(?![\w$])', code)]
        imports.append('import React%s from "react";' % (
            ", { " + ", ".join(hooks) + " }" if hooks else ""))
    if path == "src/lib/sigungu.js":
        imports.append('import SIGUNGU_DATA from "../../data/sigungu_data.json";')
    if re.search(r'(?<![\w$.])CFG(?![\w$])', code):
        imports.append('import CFG from "%s";' % relpath(path, "src/config.js"))
    for src_path in sorted(needed):
        imports.append('import { %s } from "%s";' % (", ".join(sorted(needed[src_path])), relpath(path, src_path)))

    header = "/**\n * %s\n */\n" % title
    built[path] = header + ("\n".join(imports) + "\n\n" if imports else "") + code + "\n"

# ── 수동 보정 ───────────────────────────────────────────────
def fix(path, old, new):
    assert built[path].count(old) == 1, "%s :: %d회 :: %s" % (path, built[path].count(old), old[:70])
    built[path] = built[path].replace(old, new, 1)

# SIGUNGU 원본은 JSON import 로
fix("src/lib/sigungu.js", "export const SIGUNGU = SIGUNGU_DATA;", "export const SIGUNGU = SIGUNGU_DATA;")
# App 은 default export 유지
assert "export default function App(){" in built["src/App.jsx"], "App default export 누락"
# 모듈 경계를 넘는 캐시 초기화는 함수로 노출
fix("src/api/kakao.js", "let kakaoSharePromise = null;",
    "let kakaoSharePromise = null;\n\n/* 키를 바꾼 뒤 SDK 를 다시 로드하기 위해 캐시를 비운다 */\nexport function resetKakaoSdkCache() {\n  kakaoSdkPromise = null;\n  kakaoSharePromise = null;\n}")
fix("src/screens/MyScreen.jsx", "    kakaoSdkPromise = null; kakaoSharePromise = null;", "    resetKakaoSdkCache();")

os.makedirs("src/data", exist_ok=True)
os.makedirs("src/lib", exist_ok=True)
os.makedirs("src/api", exist_ok=True)
os.makedirs("src/ui", exist_ok=True)
os.makedirs("src/screens", exist_ok=True)
os.makedirs("src/overlays", exist_ok=True)

for path, _, _ in MODULES:
    io.open(path, "w", encoding="utf-8").write(built[path])
    print("  %-32s %6d bytes" % (path, len(built[path])))
print("총 %d개 모듈" % len(MODULES))
