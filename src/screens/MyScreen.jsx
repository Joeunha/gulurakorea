import React from "react";
import { Section } from "./MainScreen.jsx";
import { S } from "../styles/styles.js";

export function MyScreen({score,coins,inventory,ownedCount,trips,cards,room,resetDemo,openCards}){
  return (<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={S.profile}><div style={S.avatar}>👤</div><div><p style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:18,color:"var(--ink)"}}>여행자 #0427</p><p style={{fontSize:12,color:"var(--ink-soft)"}}>서울 출발 · {room?`방 ${room.code}`:"솔로 플레이"}</p></div></div>
    <div style={S.statRow}><Stat k="점령 점수" v={score} c="var(--stamp)"/><Stat k="여행 코인" v={coins} c="var(--gold)"/><Stat k="정복 지역" v={ownedCount} c="var(--sea)"/></div>
    <div style={S.section}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"baseline",gap:8}}><h3 style={S.secTitle}>인증 카드</h3><span style={{fontSize:11.5,color:"var(--ink-soft)"}}>{cards.length}장</span></div>
        {cards.length>=5 && <button onClick={openCards} style={S.moreBtn}>더보기</button>}
      </div>
      {cards.length===0 ? <p style={S.empty}>도착 인증을 완료하면 인증샷·영수증 카드가 쌓여요.</p> :
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{cards.slice(0,4).map((c,i)=>(<div key={i} style={S.collCard}><div style={{...S.collImg,background:`linear-gradient(135deg,${c.grad[0]},${c.grad[1]})`}}><span style={S.collType}>{c.type==="영수증"?"🧾":"📷"} {c.type}</span>{c.depop && <span style={S.collGold}>★</span>}</div><div style={{padding:"8px 9px"}}><div style={{fontSize:12,fontWeight:800,color:"var(--ink)",lineHeight:1.2}}>{c.title}</div><div style={{fontSize:10.5,color:"var(--ink-soft)",marginTop:2}}>{c.place}</div></div></div>))}</div>}
    </div>
    <Section title="보유 이벤트 카드" sub={`${inventory.length}장`}>
      {inventory.length===0 ? <p style={S.empty}>주사위를 굴리면 가끔 카드가 떨어져요.</p> :
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{inventory.map((c,i)=>(<div key={i} style={S.invCard}><span style={{fontSize:22}}>{c.icon}</span><div><div style={{fontSize:13.5,fontWeight:800,color:"var(--ink)"}}>{c.name}</div><div style={{fontSize:11.5,color:"var(--ink-soft)"}}>{c.desc}</div></div></div>))}</div>}
    </Section>
    <Section title="여행 기록" sub={`${trips.length}회`}>
      {trips.length===0 ? <p style={S.empty}>첫 여행을 시작해 보세요.</p> :
        trips.map((t,i)=>(<div key={i} style={S.tripRow}><span style={{width:8,height:8,borderRadius:"50%",background:t.outcome==="conquer"?(t.depop?"var(--gold)":"var(--stamp)"):t.outcome==="toll"?"var(--ink-soft)":"var(--sea)"}}/><span style={{fontSize:13.5,fontWeight:700,color:"var(--ink)"}}>{t.title}</span><span style={{fontSize:12,color:"var(--ink-soft)"}}>{t.sido} {t.sigungu}</span><span style={{marginLeft:"auto",fontSize:11.5,color:"var(--ink-soft)"}}>{t.verified}/3 · +{t.score}</span></div>))}
    </Section>
    <p style={S.dataNote}>ⓘ 지도는 실제 행정구역 경계(시·군·구) 데이터입니다. 목적지·미션은 TourAPI 형태 샘플, 영수증 인증은 CLOVA OCR·국세청·Kakao API 자리를 모의 동작시켰습니다.</p>
    <button onClick={resetDemo} style={S.reset}>데모 초기화</button>
  </div>);
}
export function Stat({k,v,c}){return <div style={S.stat}><div style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:24,color:c}}>{v}</div><div style={{fontSize:11,color:"var(--ink-soft)",marginTop:2}}>{k}</div></div>;}

