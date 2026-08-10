export function methodFor(t) { return t==="맛집" ? "receipt" : "gps"; }
export async function verifyReceipt(dest){
  await new Promise(r=>setTimeout(r,1500));
  const store = (dest.missions.find(m=>m.t==="맛집")?.n)||"로컬 식당";
  return { store, sido:dest.sido, sigungu:dest.sigungu, datetime:"오늘 13:24",
    amount:(16+Math.floor(Math.random()*6)*3)*1000, checks:{region:true,recent:true,biz:true,unique:true} };
}

export function verifyGps(){ return { ok:true, dist:60+Math.floor(Math.random()*140) }; }

