import React from "react";
import { S } from "../styles/styles.js";

export function Envelope({ opening, themes, dist, dur, relaxed }){
  const burst = Array.from({length:9}).map((_,i)=>{ const a=(i/9)*Math.PI*2; return { tx:Math.cos(a)*70, ty:Math.sin(a)*70, d:i*0.02 }; });
  return (<div style={S.envWrap}><div style={S.envBody}><p style={S.envLabel}>목적지 봉인</p><h3 style={S.envTitle}>어디로 가게 될까요?</h3>
    {!opening && (<><div style={S.hintRow}>{themes.map((h,i)=><span key={i} style={S.hintChip}>{h}</span>)}{dist&&<span style={S.hintChip}>{dist}</span>}{dur&&<span style={S.hintChip}>{dur}</span>}</div>{relaxed && <p style={S.relax}>딱 맞는 곳이 없어 테마를 넓혔어요</p>}</>)}</div>
    <div style={S.envFlap} className={opening?"flap-open":""}/><div style={S.envSeal} className={opening?"seal-crack":""}>출발</div>
    {opening && (<><div style={S.flash} className="flash"/>{burst.map((b,i)=>(<span key={i} className="burst" style={{"--tx":`${b.tx}px`,"--ty":`${b.ty}px`,animationDelay:`${b.d}s`,position:"absolute",top:30,left:"50%",width:8,height:8,borderRadius:"50%",background:"var(--gold)"}}/>))}</>)}</div>);
}
export function Meta({k,v,hi}){return (<div style={{flex:1,textAlign:"center"}}><div style={{fontSize:11,color:"var(--ink-soft)",marginBottom:3}}>{k}</div><div style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:17,color:hi?"var(--stamp)":"var(--ink)"}}>{v}</div></div>);}

