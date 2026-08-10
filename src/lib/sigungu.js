/**
 * 251개 시·군·구 경계 데이터와 주소 → 시군구 매칭
 */
import SIGUNGU_DATA from "../../data/sigungu_data.json";

/* 시·군·구 실제 경계 (행정구역 GeoJSON → SVG path 변환). 빌드 시 주입됨. */
export const SIGUNGU = SIGUNGU_DATA;

export const SIGUNGU_BY_SIDO = SIGUNGU.reduce((m, s) => { (m[s.sido] = m[s.sido] || []).push(s); return m; }, {});

/* "창원시성산구" → "창원 성산구", "강릉시" → "강릉", "영도구" → "영도구" */
export function shortSgg(name) {
  let n = String(name || "").replace(/^(.+시)(.+구)$/, "$1 $2").replace(/시 /, " ");
  return n.replace(/(시|군)$/, "") || name;
}

/* TourAPI addr1 문자열 → 실제 시·군·구 경계 데이터(SIGUNGU) 매칭 */
export function sggFromAddr(addr, sidoHint) {
  const parts = String(addr || "").trim().split(/\s+/);
  const cands = SIGUNGU_BY_SIDO[sidoHint] || SIGUNGU;
  const j1 = parts[1] || "", j2 = parts[2] || "";
  let hit = cands.find(s => s.name === j1 + j2);
  if (!hit) hit = cands.find(s => s.name === j1);
  if (!hit && j1) hit = cands.find(s => s.name.startsWith(j1) || j1.startsWith(s.name));
  if (!hit && cands.length === 1) hit = cands[0];
  return hit || null;
}
