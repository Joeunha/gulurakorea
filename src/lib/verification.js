import Tesseract from "tesseract.js"; // npm install tesseract.js 필요 · 완전 무료, 브라우저에서 로컬로 OCR 실행 (API 키/백엔드 불필요)
import { SAMPLE_POOL } from "../data/gameData.js";

/* 데이터 접근 계층 */
export async function fetchDestinations({ themes, distCap }) {
  let pool = SAMPLE_POOL.filter(d => d.distanceKm <= distCap);
  if (themes.length) pool = pool.filter(d => d.themes.some(t => themes.includes(t)));
  let relaxed = false;
  if (pool.length === 0) { pool = SAMPLE_POOL.filter(d => d.distanceKm <= distCap); relaxed = true; }
  if (pool.length === 0) { pool = [...SAMPLE_POOL]; relaxed = true; }
  return { pool, relaxed };
}
/* 같은 영수증(이미지) 재사용을 막기 위한 해시 기록 · 데모 수준(새로고침 시 초기화). 실서비스에선 서버 DB로 옮길 것 */
const usedReceiptHashes = new Set();
export async function hashFile(file){
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

/* 영수증 사진(file)을 OCR로 읽어 상호명/지역/날짜/금액을 추출하고, 4가지 조건으로 방문을 검증한다.
   Tesseract.js는 완전 무료 · 브라우저 로컬 실행이라 별도 API 키나 서버가 필요 없다. */
export async function verifyReceipt(dest, file){
  const { data: { text } } = await Tesseract.recognize(file, "kor+eng");
  const cleaned = text.replace(/[ \t]+/g, " ").trim();
  const lines = cleaned.split("\n").map(l=>l.trim()).filter(Boolean);

  // 1) 지역 일치: OCR 텍스트에 목적지 시/군/구 이름이 등장하는지
  const region = cleaned.includes(dest.sigungu) || cleaned.includes(dest.sido);

  // 2) 최근 영수증인지: 날짜 패턴(2026-08-10 / 2026.08.10 / 2026년 8월 10일 등)을 찾아 48시간 이내인지 확인
  const dateMatch = cleaned.match(/(20\d{2})[.\-\/년]\s?(\d{1,2})[.\-\/월]\s?(\d{1,2})/);
  let recent = false, datetime = "날짜 인식 실패";
  if (dateMatch) {
    const [, y, m, d] = dateMatch;
    const receiptDate = new Date(+y, +m - 1, +d);
    const diffHours = Math.abs(Date.now() - receiptDate.getTime()) / 36e5;
    recent = diffHours <= 48;
    datetime = `${y}.${String(m).padStart(2,"0")}.${String(d).padStart(2,"0")}`;
  }

  // 3) 사업자 진위: 사업자등록번호 패턴(예: 123-45-67890)이 영수증에 있는지
  const biz = /\d{3}-\d{2}-\d{5}/.test(cleaned);

  // 4) 중복 아님: 같은 이미지를 이미 인증에 쓴 적 있는지 해시로 확인
  const hash = await hashFile(file);
  const unique = !usedReceiptHashes.has(hash);
  if (unique) usedReceiptHashes.add(hash);

  // 상호명 추정: 사업자번호·영수증 안내문구가 아니면서 한글 2자 이상 포함된 첫 줄
  const storeLine = lines.find(l =>
    /[가-힣]{2,}/.test(l) &&
    !/\d{3}-\d{2}-\d{5}/.test(l) &&
    !/(영수증|매출전표|카드매출|사업자|대표자|주소)/.test(l)
  );
  const store = storeLine || (dest.missions.find(m=>m.t==="맛집")?.n) || "상호명 인식 실패";

  // 금액 추정: "12,000원" 또는 "12000원" 형태의 마지막 매치를 합계로 사용
  const amountMatches = [...cleaned.matchAll(/(\d{1,3}(?:,\d{3})+|\d{4,6})\s?원/g)];
  const amount = amountMatches.length ? parseInt(amountMatches[amountMatches.length-1][1].replace(/,/g,""), 10) : 0;

  return { store, sido: dest.sido, sigungu: dest.sigungu, datetime, amount, checks: { region, recent, biz, unique } };
}
export function verifyGps(){ return { ok:true, dist:60+Math.floor(Math.random()*140) }; }
