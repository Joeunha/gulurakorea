/**
 * 도착 인증 / 영수증 인증
 */
import { kakaoLocal, kakaoRegionAny } from "./kakao.js";
import { getPosition, haversineKm } from "../lib/geo.js";
import { shortSgg } from "../lib/sigungu.js";

/* 실제 GPS + 카카오 행정구역 대조 도착 인증 */
export async function verifyArrivalReal(trip, radiusM) {
  const pos = await getPosition();
  const hasCoord = isFinite(trip.lat) && isFinite(trip.lng);
  const dist = hasCoord ? Math.round(haversineKm(pos, { lat: trip.lat, lng: trip.lng }) * 1000) : null;
  let region = null, regionOk = null;
  try {
    region = await kakaoRegionAny(pos.lat, pos.lng);
    const a = shortSgg(region.sigungu), b = String(trip.sigungu || "");
    regionOk = region.sido === trip.sido && (a === b || a.startsWith(b) || b.startsWith(a));
  } catch (e) { region = null; }

  if (dist != null && dist <= radiusM) return { ok: true, dist, acc: pos.acc, region, regionOk, mode: "live" };
  if (dist == null && regionOk === true) return { ok: true, dist: null, acc: pos.acc, region, regionOk, mode: "live" };
  const where = region ? region.full : "행정구역 확인 불가";
  const reason = dist != null
    ? "목적지에서 " + (dist >= 1000 ? (dist / 1000).toFixed(1) + "km" : dist + "m") + " 떨어져 있어요 (필요: " + radiusM + "m 이내) · 현재 " + where
    : "현재 위치가 " + where + " 로 확인돼요 · 목적지 " + trip.sido + " " + trip.sigungu + " 와 일치하지 않습니다";
  return { ok: false, dist, acc: pos.acc, region, regionOk, reason, mode: "live" };
}

export async function verifyReceipt(dest){
  await new Promise(r=>setTimeout(r,1200));
  const raw = (dest.missions.find(m=>m.t==="맛집")?.n)||"로컬 식당";
  const store = raw.replace(/\s*(맛보기|한 상|맛집)$/,"").trim() || raw;
  let biz = true, bizNote = "모의 검증 (카카오 로컬 미조회)", found = null;
  if(isFinite(dest.lat) && isFinite(dest.lng)){
    try{
      const j = await kakaoLocal("search/keyword.json",{ query:store, x:String(dest.lng), y:String(dest.lat), radius:"20000", size:"5" });
      found = ((j && j.documents) || [])[0] || null;
      if(found){ biz = true; bizNote = "카카오 로컬 확인 · " + (found.road_address_name || found.address_name || found.place_name); }
      else { biz = false; bizNote = "카카오 로컬에서 해당 상호를 찾지 못했어요"; }
    }catch(e){ bizNote = "카카오 로컬 조회 실패 · " + ((e && e.message) || e); }
  }
  return { store: found ? found.place_name : store, sido:dest.sido, sigungu:dest.sigungu, datetime:"오늘 13:24",
    amount:(16+Math.floor(Math.random()*6)*3)*1000, bizNote,
    checks:{ region:true, recent:true, biz, unique:true } };
}

export function verifyGps(){ return { ok:true, dist:60+Math.floor(Math.random()*140) }; }
