import React, { useState, useRef, useEffect, useMemo } from "react";
import { MainScreen, MapScreen, RankScreen, MyScreen } from './components/Screens';
import { VerifyFlow, ResultOverlay, Envelope, Splash } from './components/Overlays';
import { Dice3D } from './components/Dice';
import { fetchDestinations, methodFor } from './utils';


/* 시·군·구 실제 경계 (행정구역 GeoJSON → SVG path 변환). 빌드 시 주입됨. */
import { SIGUNGU } from './sigunguData';

/*
  팔도정복 (가제) v4 — 지도 탭 분리: [지도 그림(시군구 실제지도)] / [타일(시도 보드)]
  인증 완료 시 해당 시·군·구가 내 색으로 칠해집니다.
*/

/* ───────── 샘플 데이터 (TourAPI item 형태 + 시군구 코드 sgg) ───────── */
import { SAMPLE_POOL, THEME_LABELS, THEME_LIST, DIST_STEPS, DURATIONS, BUDGETS, EVENT_CARDS, SIDO_ORDER, SIDO_TINT, ME, FRIEND_POOL, TOLL, SIDO_FULL, SIDO_ACCENT, BOARD, methodFor, NATIONAL_ROOMS } from './constants';

/* 데이터 접근 계층 */
async function fetchDestinations({ themes, distCap }) {
  let pool = SAMPLE_POOL.filter(d => d.distanceKm <= distCap);
  if (themes.length) pool = pool.filter(d => d.themes.some(t => themes.includes(t)));
  let relaxed = false;
  if (pool.length === 0) { pool = SAMPLE_POOL.filter(d => d.distanceKm <= distCap); relaxed = true; }
  if (pool.length === 0) { pool = [...SAMPLE_POOL]; relaxed = true; }
  return { pool, relaxed };
}



function DieFace({ n, size=64 }) {
  const P = {1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}[n]||[4];
  return (<div style={{width:size,height:size,background:"var(--paper)",borderRadius:size*0.22,boxShadow:"0 8px 0 rgba(20,33,58,.18), inset 0 0 0 2px rgba(20,33,58,.10)",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gridTemplateRows:"1fr 1fr 1fr",padding:size*0.13}}>
    {Array.from({length:9}).map((_,i)=>(<div key={i} style={{display:"grid",placeItems:"center"}}><span style={{width:"58%",height:"58%",borderRadius:"50%",background:P.includes(i)?"var(--ink)":"transparent"}}/></div>))}</div>);
}
function DicePips({ n, size }){
  const P = {1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}[n]||[4];
  return (<div style={{width:"100%",height:"100%",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gridTemplateRows:"1fr 1fr 1fr",padding:size*0.13,boxSizing:"border-box"}}>
    {Array.from({length:9}).map((_,i)=>(<div key={i} style={{display:"grid",placeItems:"center"}}><span style={{width:"56%",height:"56%",borderRadius:"50%",background:P.includes(i)?"#16223F":"transparent"}}/></div>))}</div>);
}
function Dice3D({ n, rolling, size=96 }){
  const h = size/2;
  const show = {1:"rotateX(-18deg) rotateY(0deg)",6:"rotateX(-18deg) rotateY(180deg)",3:"rotateX(-18deg) rotateY(-90deg)",4:"rotateX(-18deg) rotateY(90deg)",2:"rotateX(72deg) rotateY(0deg)",5:"rotateX(-108deg) rotateY(0deg)"}[n] || "rotateX(-18deg) rotateY(0deg)";
  const faces = [
    {k:1,t:`translateZ(${h}px)`},
    {k:6,t:`rotateY(180deg) translateZ(${h}px)`},
    {k:3,t:`rotateY(90deg) translateZ(${h}px)`},
    {k:4,t:`rotateY(-90deg) translateZ(${h}px)`},
    {k:2,t:`rotateX(90deg) translateZ(${h}px)`},
    {k:5,t:`rotateX(-90deg) translateZ(${h}px)`},
  ];
  const faceStyle = {position:"absolute",width:size,height:size,background:"linear-gradient(150deg,#FBF6EA,#E7DCC4)",borderRadius:size*0.18,boxShadow:"inset 0 0 0 2px rgba(20,33,58,.08)",backfaceVisibility:"hidden"};
  return (
    <div style={{width:size,height:size,perspective:size*4,margin:"0 auto"}}>
      <div className={rolling?"dice-cube rolling":"dice-cube"} style={{width:size,height:size,position:"relative",transformStyle:"preserve-3d",transform:rolling?undefined:show}}>
        {faces.map(f=>(<div key={f.k} style={{...faceStyle,transform:f.t}}><DicePips n={f.k} size={size}/></div>))}
      </div>
    </div>
  );
}

/* ───────── 메인 앱 ───────── */
export default function App(){
  const [tab,setTab] = useState("main");
  const [members,setMembers] = useState([ME]);
  const [room,setRoom] = useState(null);
  const [ownership,setOwnership] = useState({}); // sggCode -> memberId (홈 서울은 sido 검사로 처리)
  const [trips,setTrips] = useState([]);
  const [cards,setCards] = useState([]);
  const [rollsLeft,setRollsLeft] = useState(5);
  const [score,setScore] = useState(0);
  const [coins,setCoins] = useState(120);
  const [inventory,setInventory] = useState([]);
  const [toast,setToast] = useState(null);
  const [themes,setThemes] = useState(["sea"]);
  const [distIdx,setDistIdx] = useState(2);
  const [duration,setDuration] = useState("당일치기");
  const [budget,setBudget] = useState("mid");
  const [phase,setPhase] = useState("main");
  const [dieN,setDieN] = useState(1);
  const [candidate,setCandidate] = useState(null);
  const [relaxedMsg,setRelaxedMsg] = useState(false);
  const [droppedCard,setDroppedCard] = useState(null);
  const [useExempt,setUseExempt] = useState(false);
  const [activeTrip,setActiveTrip] = useState(null);
  const [verifyOpen,setVerifyOpen] = useState(false);
  const [result,setResult] = useState(null);
  const [started,setStarted] = useState(false);
  const [shareOpen,setShareOpen] = useState(false);
  const [cardsOpen,setCardsOpen] = useState(false);
  const rollTimer = useRef(null);

  useEffect(()=>()=>clearInterval(rollTimer.current),[]);
  function flash(msg){ setToast(msg); setTimeout(()=>setToast(null),2300); }
  const memberById = (id)=> members.find(m=>m.id===id);
  const ownerColor = (id)=> id? (memberById(id)?.color||"var(--paper-2)") : "var(--paper-2)";
  const ownedCount = Object.values(ownership).filter(v=>v==="me").length + 1; // +1: 서울 홈
  const myRegionCount = (id)=> Object.values(ownership).filter(v=>v===id).length + (id==="me"?1:0);
  const memberScore = (id)=> id==="me" ? score : (memberById(id)?.score||0);
  const myRoomScore = members.reduce((s,m)=> s + memberScore(m.id), 0);
  const myRoomRegions = members.reduce((s,m)=> s + myRegionCount(m.id), 0);
  const toggleTheme = (t)=> setThemes(p=> p.includes(t)? p.filter(x=>x!==t) : [...p,t]);

  async function rollDice(){
    if(rollsLeft<=0) return;
    setRollsLeft(r=>r-1); setDroppedCard(null); setUseExempt(false); setPhase("rolling");
    clearInterval(rollTimer.current);
    rollTimer.current = setInterval(()=> setDieN(Math.floor(Math.random()*6)+1), 80);
    const { pool, relaxed } = await fetchDestinations({ themes, distCap: DIST_STEPS[distIdx].cap });
    const pick = pool[Math.floor(Math.random()*pool.length)];
    setTimeout(()=>{
      clearInterval(rollTimer.current); setDieN(Math.floor(Math.random()*6)+1);
      setCandidate(pick); setRelaxedMsg(relaxed);
      if(Math.random()<0.35){ const card = EVENT_CARDS[Math.floor(Math.random()*EVENT_CARDS.length)]; setDroppedCard(card); setInventory(inv=>[...inv,card]); }
      setPhase("sealed");
    }, 1150);
  }
  function depart(){ setPhase("opening"); setTimeout(()=> setPhase("revealed"), 1250); }

  const destOwner = candidate ? ownership[candidate.sgg] : undefined;
  const tollDue = candidate && destOwner && destOwner!=="me";
  const hasExempt = inventory.some(c=>c.id==="toll");

  function startTrip(){
    if(!candidate) return;
    const outcome = destOwner==="me" ? "revisit" : tollDue ? "toll" : "conquer";
    setActiveTrip({ ...candidate, outcome, tollFriend: tollDue?destOwner:null, useExempt,
      missions: candidate.missions.map(m=>({ ...m, method:methodFor(m.t), done:false, receipt:null, gps:null })) });
    setPhase("main"); setCandidate(null); setDroppedCard(null); setUseExempt(false); setTab("main"); setVerifyOpen(true);
  }
  function resetToMain(){ setPhase("main"); setCandidate(null); setDroppedCard(null); setRelaxedMsg(false); setUseExempt(false); }
  function setMissionDone(idx,payload){ setActiveTrip(t=>{ const ms=t.missions.map((m,i)=>i===idx?{...m,done:true,...payload}:m); return {...t,missions:ms}; }); }

  function applyConquer(){
    const t = activeTrip; if(!t) return null;
    const doneCount = t.missions.filter(m=>m.done).length;
    const perfect = doneCount===t.missions.length;
    let base, label;
    if(t.outcome==="conquer"){ base=t.depop?200:100; setOwnership(o=>({...o,[t.sgg]:"me"})); label=`${t.sigungu} 점령`; setCoins(c=>c+(t.depop?60:30)); }
    else if(t.outcome==="toll"){ base=40; const f=memberById(t.tollFriend);
      if(t.useExempt && inventory.some(c=>c.id==="toll")){ setInventory(inv=>{const i=inv.findIndex(c=>c.id==="toll");return inv.filter((_,k)=>k!==i);}); label=`${f?.name}님 땅 통과(면제권)`; }
      else { setCoins(c=>Math.max(0,c-TOLL)); label=`통행료 ${TOLL}🪙 지불`; } }
    else { base=50; label="내 영토 재방문"; }
    const bonus = doneCount*20 + (perfect?30:0);
    const total = base+bonus;
    setScore(s=>s+total);
    const newCards = t.missions.filter(m=>m.done).map(m=>({ title:m.n, place:`${t.sido} ${t.sigungu}`, type:m.method==="receipt"?"영수증":"인증샷", grad:t.grad, depop:t.depop }));
    setCards(c=>[...newCards,...c]);
    setTrips(tp=>[{title:t.title,sido:t.sido,sigungu:t.sigungu,depop:t.depop,outcome:t.outcome,verified:doneCount,score:total},...tp]);
    return { label, base, bonus, total, doneCount, perfect, cardsGained:newCards.length, outcome:t.outcome };
  }
  function finishTrip(){ const res=applyConquer(); if(res){ setResult(res); setVerifyOpen(false); } }
  function closeResult(){ setResult(null); setActiveTrip(null); setTab("map"); }
  function joinRoom(code){
    const c = (code||"").trim().toUpperCase() || "KR-"+Math.random().toString(36).slice(2,6).toUpperCase();
    setMembers([ME, ...FRIEND_POOL]); setRoom({ code:c });
    setOwnership(o=>{ const n={...o}; FRIEND_POOL.forEach(f=> f.tiles.forEach(t=>{ if(!n[t]) n[t]=f.id; })); return n; });
    flash(`방 참여 완료 · ${c}`);
  }

  function createRoom(){
    const code = "KR-"+Math.random().toString(36).slice(2,6).toUpperCase();
    setMembers([ME]); setRoom({ code });
    flash(`방 생성됨 · 코드 ${code} · 친구를 초대하세요`);
  }
  function inviteFriends(){
    setMembers(ms=>{ const ids=new Set(ms.map(m=>m.id)); return [...ms, ...FRIEND_POOL.filter(f=>!ids.has(f.id))]; });
    setOwnership(o=>{ const n={...o}; FRIEND_POOL.forEach(f=> f.tiles.forEach(t=>{ if(!n[t]) n[t]=f.id; })); return n; });
    flash("은하 · 정아님이 방에 참여했어요");
  }
  function leaveRoom(){ setMembers([ME]); setRoom(null); setOwnership(o=>{ const n={}; Object.entries(o).forEach(([k,v])=>{ if(v==="me") n[k]=v; }); return n; }); flash("방에서 나왔어요"); }
  function resetDemo(){ setMembers([ME]); setRoom(null); setOwnership({}); setTrips([]); setCards([]); setRollsLeft(5); setScore(0); setCoins(120); setInventory([]); setActiveTrip(null); setVerifyOpen(false); resetToMain(); setTab("main"); }

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <div style={S.phone}>
        {!started ? <Splash onStart={()=>setStarted(true)}/> : (<>
        <header style={S.appbar}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={S.logoDie}>⚀</span><span style={S.wordmark}>대한민국 부루마블</span></div>
          <div style={S.coinPill}>🪙 {coins}</div>
        </header>
        <main style={S.body} className="scroll">
          {tab==="main" && <MainScreen {...{themes,toggleTheme,distIdx,setDistIdx,duration,setDuration,budget,setBudget,rollsLeft,rollDice,activeTrip,openVerify:()=>setVerifyOpen(true),finishTrip}}/>}
          {tab==="map" && <MapScreen {...{ownership,ownerColor,memberById,members,room,createRoom,joinRoom,openShare:()=>setShareOpen(true),leaveRoom,score,memberScore,ownedCount,myRegionCount,activeTrip,flash}}/>}
          {tab==="rank" && <RankScreen {...{myRoomScore,myRoomRegions,room,memberCount:members.length}}/>}
          {tab==="my" && <MyScreen {...{score,coins,inventory,ownedCount,trips,cards,room,resetDemo,openCards:()=>setCardsOpen(true)}}/>}
        </main>
        <nav style={S.tabbar}>
          {[["main","🎲","메인"],["map","🗺️","지도"],["rank","🏆","랭킹"],["my","👤","마이"]].map(([id,ic,lb])=>(
            <button key={id} onClick={()=>setTab(id)} style={{...S.tab,...(tab===id?S.tabOn:{})}}>
              <span style={{fontSize:20,filter:tab===id?"none":"grayscale(1) opacity(.55)"}}>{ic}</span>
              <span style={{fontSize:11,fontWeight:tab===id?800:600}}>{lb}</span></button>))}
        </nav>
        </>)}

        {phase!=="main" && (
          <div style={S.overlay} className="overlay-in">
            {phase==="rolling" && (<div style={{textAlign:"center"}}><Dice3D n={dieN} rolling={true} size={104}/><p style={{...S.olHint,marginTop:24}}>주사위를 굴리는 중…</p></div>)}
            {phase==="sealed" && candidate && (
              <div style={{textAlign:"center",width:"100%"}} className="pop-in">
                {droppedCard && (<div style={S.cardDrop} className="card-drop"><span style={{fontSize:22}}>{droppedCard.icon}</span><div style={{textAlign:"left"}}><div style={{fontSize:11,color:"var(--gold)",fontWeight:800}}>이벤트 카드 획득!</div><div style={{fontSize:13,fontWeight:700,color:"var(--paper)"}}>{droppedCard.name}</div></div></div>)}
                <Envelope opening={false} themes={relaxedMsg?["조건 완화됨"]:themes.map(t=>THEME_LABELS[t])} dist={DIST_STEPS[distIdx].label} dur={duration} relaxed={relaxedMsg}/>
                <div style={{display:"flex",gap:10,marginTop:18,width:"100%"}}>
                  <button onClick={rollDice} disabled={rollsLeft<=0} style={{...S.btnGhost,opacity:rollsLeft<=0?.4:1}}>다시 굴리기 · {rollsLeft}회</button>
                  <button onClick={depart} style={S.btnDepart}>출발 ✦ 봉투 열기</button></div>
                <p style={S.olSub}>출발하면 목적지가 확정돼요</p></div>)}
            {phase==="opening" && candidate && (<div style={{textAlign:"center",width:"100%"}}><Envelope opening={true} themes={[]} dist="" dur="" relaxed={false}/><p style={{color:"var(--paper)",opacity:.85,marginTop:22,fontSize:14}}>봉인을 여는 중…</p></div>)}
            {phase==="revealed" && candidate && (
              <div style={{width:"100%"}} className="reveal-in">
                <p style={{textAlign:"center",color:"var(--paper)",opacity:.7,fontSize:13,marginBottom:10}}>당신의 목적지는…</p>
                <div style={S.destCard}>
                  <div style={{...S.destImg, background:`linear-gradient(135deg, ${candidate.grad[0]}, ${candidate.grad[1]})`}}>
                    {candidate.depop && <span style={S.goldTag}>★ 황금 타일 · 2배 점수</span>}
                    <div style={S.destImgInner}><span style={{fontSize:13,opacity:.9}}>{candidate.sido} · {candidate.sigungu}</span><h2 style={S.destName}>{candidate.title}</h2></div></div>
                  <div style={{padding:"15px 18px"}}>
                    {tollDue ? (<div style={{...S.ownBanner,background:"rgba(242,145,60,.12)",border:"1px solid rgba(242,145,60,.5)"}}><span style={{fontSize:18}}>🚧</span><div style={{flex:1,textAlign:"left"}}><b style={{color:"var(--stamp)",fontSize:13}}>{memberById(destOwner)?.name}님의 영토</b><div style={{fontSize:12,color:"var(--ink-soft)"}}>통행료 {TOLL}코인 발생</div></div>{hasExempt && <button onClick={()=>setUseExempt(v=>!v)} style={{...S.exemptBtn,...(useExempt?S.exemptOn:{})}}>🎫 {useExempt?"사용 중":"사용"}</button>}</div>)
                     : destOwner==="me" ? (<div style={{...S.ownBanner,background:"rgba(30,142,138,.10)",border:"1px solid rgba(30,142,138,.35)"}}><span style={{fontSize:18}}>🏠</span><span style={{fontSize:13,color:"var(--ink)",fontWeight:700}}>내 영토 재방문 · +50점</span></div>)
                     : (<div style={{...S.ownBanner,background:"rgba(227,169,44,.12)",border:"1px solid rgba(227,169,44,.45)"}}><span style={{fontSize:18}}>🚩</span><span style={{fontSize:13,color:"var(--ink)",fontWeight:700}}>미점령 지역 · 인증하면 {candidate.depop?200:100}점</span></div>)}
                    <p style={S.overview}>{candidate.overview}</p>
                    <div style={S.metaRow}><Meta k="거리" v={`${candidate.distanceKm}km`}/><Meta k="일정" v={duration}/><Meta k="기본 점수" v={`+${destOwner==="me"?50:tollDue?40:(candidate.depop?200:100)}`} hi/></div>
                    <p style={S.missionHead}>도착하면 인증할 미션</p>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>{candidate.missions.map((m,i)=>(<div key={i} style={S.mission}><span style={S.missionTag}>{m.t}</span><span style={{fontSize:13.5,color:"var(--ink)"}}>{m.n}</span><span style={{marginLeft:"auto",fontSize:11.5,color:"var(--ink-soft)"}}>{methodFor(m.t)==="receipt"?"🧾 영수증":"📍 GPS"}</span></div>))}</div>
                  </div></div>
                <div style={{display:"flex",gap:10,marginTop:16}}><button onClick={resetToMain} style={S.btnGhost}>나중에</button><button onClick={startTrip} style={S.btnDepart}>여행 시작하기</button></div></div>)}
          </div>)}

        {verifyOpen && activeTrip && (<VerifyFlow trip={activeTrip} onMissionDone={setMissionDone} onDone={()=>setVerifyOpen(false)} memberById={memberById} flash={flash}/>)}
        {result && activeTrip && (<ResultOverlay trip={activeTrip} result={result} onClose={closeResult}/>)}
        {shareOpen && (<ShareModal room={room} onClose={()=>setShareOpen(false)} onAccept={()=>{ inviteFriends(); setShareOpen(false); }} flash={flash}/>)}
        {cardsOpen && (<CardsModal cards={cards} onClose={()=>setCardsOpen(false)}/>)}
        {toast && <div style={S.toast} className="toast-in">{toast}</div>}
      </div>
    </div>
  );
}

function Envelope({ opening, themes, dist, dur, relaxed }){
  const burst = Array.from({length:9}).map((_,i)=>{ const a=(i/9)*Math.PI*2; return { tx:Math.cos(a)*70, ty:Math.sin(a)*70, d:i*0.02 }; });
  return (<div style={S.envWrap}><div style={S.envBody}><p style={S.envLabel}>목적지 봉인</p><h3 style={S.envTitle}>어디로 가게 될까요?</h3>
    {!opening && (<><div style={S.hintRow}>{themes.map((h,i)=><span key={i} style={S.hintChip}>{h}</span>)}{dist&&<span style={S.hintChip}>{dist}</span>}{dur&&<span style={S.hintChip}>{dur}</span>}</div>{relaxed && <p style={S.relax}>딱 맞는 곳이 없어 테마를 넓혔어요</p>}</>)}</div>
    <div style={S.envFlap} className={opening?"flap-open":""}/><div style={S.envSeal} className={opening?"seal-crack":""}>출발</div>
    {opening && (<><div style={S.flash} className="flash"/>{burst.map((b,i)=>(<span key={i} className="burst" style={{"--tx":`${b.tx}px`,"--ty":`${b.ty}px`,animationDelay:`${b.d}s`,position:"absolute",top:30,left:"50%",width:8,height:8,borderRadius:"50%",background:"var(--gold)"}}/>))}</>)}</div>);
}


function VerifyFlow({ trip, onMissionDone, onDone, memberById, flash }){
  const arrivalIdx = trip.missions.findIndex(m=>m.t==="명소");
  const [step,setStep] = useState(trip.missions[arrivalIdx]?.done?1:0);
  const [scanning,setScanning] = useState(false);
  const [parsed,setParsed] = useState(null);
  const fileRef = useRef(null); const pendRef = useRef(-1);
  const arrival = trip.missions[arrivalIdx];
  const others = trip.missions.map((m,i)=>({...m,i})).filter(o=>o.i!==arrivalIdx);
  const friend = trip.tollFriend? memberById(trip.tollFriend):null;
  const doneCount = trip.missions.filter(m=>m.done).length;
  const allDone = trip.missions.every(m=>m.done);

  function doArrival(){ const r=verifyGps(); onMissionDone(arrivalIdx,{gps:r}); flash(`도착 확인 · 반경 ${r.dist}m`); setTimeout(()=>setStep(1),600); }
  function doGps(i){ const r=verifyGps(); onMissionDone(i,{gps:r}); flash(`인증 완료 · 반경 ${r.dist}m`); }
  function pickReceipt(i){ pendRef.current=i; fileRef.current?.click(); }
  async function onFile(){ const i=pendRef.current; if(i<0) return; setScanning(true); setParsed(null); const data=await verifyReceipt(trip); setScanning(false); setParsed({idx:i,data}); }
  function acceptReceipt(){ if(!Object.values(parsed.data.checks).every(Boolean)){ flash("영수증 검증 실패 · 다시 시도"); return; } onMissionDone(parsed.idx,{receipt:parsed.data}); setParsed(null); }

  return (
    <div style={S.vfScreen} className="overlay-in">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{display:"none"}}/>
      <div style={S.vfHead}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:"var(--ink-soft)"}}>{trip.sido} · {trip.sigungu}</span>
          <button onClick={onDone} style={S.vfClose}>나중에</button>
        </div>
        <h2 style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:21,color:"var(--ink)",marginTop:2}}>{trip.title}</h2>
        <div style={S.stepper}>
          {["도착 인증","미션 인증"].map((lb,i)=>(
            <React.Fragment key={i}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{...S.stepDot,...(i<=step?S.stepDotOn:{})}}>{i<step?"✓":i+1}</span>
                <span style={{fontSize:11.5,fontWeight:i===step?800:600,color:i===step?"var(--ink)":"var(--ink-soft)"}}>{lb}</span>
              </div>
              {i<1 && <span style={{flex:1,height:2,background:i<step?"var(--stamp)":"var(--line)",margin:"0 6px"}}/>}
            </React.Fragment>))}
        </div>
      </div>

      <div style={S.vfBody} className="scroll">
        {trip.outcome==="toll" && step<2 && (
          <div style={{...S.ownBanner,background:"rgba(242,145,60,.12)",border:"1px solid rgba(242,145,60,.5)",marginBottom:14}}>
            <span style={{fontSize:18}}>🚧</span><div style={{flex:1}}><b style={{color:"var(--stamp)",fontSize:13}}>{friend?.name}님의 영토</b><div style={{fontSize:12,color:"var(--ink-soft)"}}>통행료 {TOLL}🪙{trip.useExempt?" · 면제권 적용":" 발생"}</div></div>
          </div>)}

        {step===0 && (<>
          <div style={{...S.destImg,borderRadius:16,background:`linear-gradient(135deg,${trip.grad[0]},${trip.grad[1]})`,marginBottom:16}}>
            {trip.depop && <span style={S.goldTag}>★ 황금 타일</span>}
            <div style={S.destImgInner}><span style={{fontSize:12,opacity:.9}}>도착 미션</span><h3 style={{...S.destName,fontSize:19}}>{arrival.n}</h3></div>
          </div>
          <p style={{fontSize:13.5,color:"var(--ink-soft)",lineHeight:1.6,marginBottom:18}}>목적지에 도착했다면 현재 위치로 도착을 인증하세요. 반경 200m 안에서만 인증되며, 도착 인증이 끝나야 점령할 수 있어요.</p>
          {!arrival.done ? (<button onClick={doArrival} style={S.vfPrimary}>📍 현재 위치로 도착 인증</button>)
                         : (<div style={S.doneNote}>✅ 도착 확인 · 반경 {arrival.gps?.dist}m 이내</div>)}
        </>)}

        {step===1 && (<>
          <p style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:15,color:"var(--ink)"}}>추가 미션 <span style={{fontSize:12,fontFamily:"Pretendard",color:"var(--ink-soft)",fontWeight:600}}>· 인증당 +20점</span></p>
          <p style={{fontSize:12.5,color:"var(--ink-soft)",margin:"4px 0 14px"}}>맛집은 영수증, 체험은 위치로 인증해요. 모두 인증하면 메인에서 점령할 수 있어요.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {others.map(m=>(<div key={m.i} style={{...S.vCard,...(m.done?S.vCardDone:{})}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>{m.done?"✅":m.method==="receipt"?"🧾":"📍"}</span>
                <div style={{flex:1}}><span style={{fontSize:14,fontWeight:800,color:"var(--ink)"}}>{m.n}</span>
                  <div style={{fontSize:11.5,color:"var(--ink-soft)"}}>{m.done?(m.method==="receipt"?`${m.receipt.store} · ${m.receipt.amount.toLocaleString()}원`:`반경 ${m.gps.dist}m 인증`):(m.method==="receipt"?"영수증으로 인증":"위치로 인증")}</div></div>
                {!m.done && <button onClick={()=>m.method==="receipt"?pickReceipt(m.i):doGps(m.i)} style={S.vBtn}>{m.method==="receipt"?"영수증":"위치 확인"}</button>}
              </div>
              {scanning && pendRef.current===m.i && <div style={S.scanBox}><span className="spin" style={{fontSize:16}}>◌</span> 영수증 분석 중… (OCR)</div>}
            </div>))}
          </div>
          {parsed && (<div style={S.receipt} className="pop-in">
            <div style={{display:"flex",justifyContent:"space-between",borderBottom:"1px dashed var(--line)",paddingBottom:8,marginBottom:8}}><b style={{color:"var(--ink)"}}>{parsed.data.store}</b><span style={{fontSize:12,color:"var(--ink-soft)"}}>{parsed.data.datetime}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"var(--ink-soft)",marginBottom:10}}><span>{parsed.data.sido} {parsed.data.sigungu}</span><b style={{color:"var(--ink)"}}>{parsed.data.amount.toLocaleString()}원</b></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}><Chk ok={parsed.data.checks.region} t="목적지 지역 일치"/><Chk ok={parsed.data.checks.recent} t="최근 영수증"/><Chk ok={parsed.data.checks.biz} t="사업자 진위"/><Chk ok={parsed.data.checks.unique} t="중복 아님"/></div>
            <button onClick={acceptReceipt} style={S.acceptBtn}>이 영수증으로 인증</button></div>)}
        </>)}
      </div>

      {step===0 && arrival.done && (<div style={S.vfFoot}><button onClick={()=>setStep(1)} style={S.vfPrimary}>다음 · 미션 인증</button></div>)}
      {step===1 && (<div style={S.vfFoot}><button onClick={onDone} style={S.vfPrimary}>{allDone?"인증 완료 — 메인에서 점령하기":`인증 완료 · ${doneCount}/3`}</button></div>)}
    </div>
  );
}
function ResultOverlay({ trip, result, onClose }){
  return (
    <div style={S.vfScreen} className="overlay-in">
      <div style={{flex:1,overflowY:"auto",padding:"24px 22px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{textAlign:"center"}} className="reveal-in">
          <div style={{...S.resultBadge,background:`linear-gradient(135deg,${trip.grad[0]},${trip.grad[1]})`}}>{trip.depop?"★":"✓"}</div>
          <h2 style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:25,color:"var(--ink)",marginTop:16}}>{result.label}!</h2>
          <p style={{fontSize:13,color:"var(--ink-soft)",marginTop:4}}>{trip.sido} {trip.sigungu} · {trip.title}</p>
          <div style={S.tally}>
            <Row k={trip.outcome==="conquer"?"점령 점수":trip.outcome==="toll"?"방문 점수":"재방문 점수"} v={`+${result.base}`}/>
            <Row k={`미션 인증 ${result.doneCount}건`} v={`+${result.doneCount*20}`}/>
            {result.perfect && <Row k="퍼펙트 보너스" v="+30"/>}
            <div style={S.tallyDiv}/>
            <Row k="총 획득" v={`+${result.total}점`} hi/>
          </div>
          {result.cardsGained>0 && <p style={{fontSize:12.5,color:"var(--sea)",fontWeight:700,marginTop:14}}>🎴 인증 카드 {result.cardsGained}장 획득</p>}
        </div>
      </div>
      <div style={S.vfFoot}><button onClick={onClose} style={S.vfPrimary}>지도에서 확인</button></div>
    </div>
  );
}



/* ───────── 인트로 스플래시 ───────── */
function Splash({onStart}){
  return (
    <div style={S.splash}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px 26px",textAlign:"center"}}>
        <span style={S.splashEyebrow}>주사위로 떠나는 랜덤 국내여행</span>
        <h1 style={S.splashTitle}>대한민국</h1>
        <h1 style={S.splashTitle2}>부루마블</h1>
        <div style={{margin:"20px 0 16px"}}><SplashArt/></div>
        <p style={S.splashSub}>주사위를 굴리면 목적지가 봉투에 담겨 배정돼요. 현장에서 인증해 전국을 점령하고, 소멸 위기 지역은 2배 점수 황금 타일로 차지하세요.</p>
      </div>
      <div style={{padding:"0 26px 30px"}}>
        <button onClick={onStart} style={S.splashBtn}>여행 시작 🧳</button>
        <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,.72)",marginTop:12}}>전국 시·군·구 땅따먹기</p>
      </div>
    </div>
  );
}


/* ───────── 랭킹 ───────── */
function RankScreen({myRoomScore,myRoomRegions,room,memberCount}){
  const medal=["🥇","🥈","🥉"];
  const ranked = useMemo(()=>{
    const ours = { id:"mine", name: room?`우리 방 (${room.code})`:"나의 방", score:myRoomScore, regions:myRoomRegions, isMe:true, members:memberCount };
    const list=[...NATIONAL_ROOMS, ours];
    list.sort((a,b)=> b.score-a.score || b.regions-a.regions);
    let rank=0,pS=null,pR=null;
    return list.map((p,i)=>{ if(p.score!==pS||p.regions!==pR){ rank=i+1; pS=p.score; pR=p.regions; } return {...p,rank}; });
  },[myRoomScore,myRoomRegions,room,memberCount]);
  const me = ranked.find(p=>p.isMe);
  const top3 = ranked.slice(0,3);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={S.rankHero}>
        <p style={{fontSize:12,color:"var(--ink-soft)"}}>우리 방 전국 순위 {room?`· ${memberCount}명`:"· 솔로"}</p>
        <div style={{display:"flex",alignItems:"baseline",gap:5}}>
          <span style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:42,color:"var(--stamp)"}}>{me.rank}</span>
          <span style={{fontSize:17,fontWeight:800,color:"var(--ink)"}}>위</span>
          <span style={{marginLeft:"auto",fontSize:12,color:"var(--ink-soft)"}}>전체 {ranked.length}개 방 중</span>
        </div>
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <span style={S.rankMetric}>점수 합 <b style={{color:"var(--ink)"}}>{me.score}</b></span>
          <span style={S.rankMetric}>정복 합 <b style={{color:"var(--ink)"}}>{me.regions}곳</b></span>
        </div>
      </div>

      <div style={S.podium}>
        {[top3[1],top3[0],top3[2]].map((p,idx)=>{ if(!p) return <div key={idx} style={{flex:1}}/>;
          const h=p.rank===1?100:p.rank===2?78:62;
          return (<div key={p.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",gap:3}}>
            <div style={{fontSize:24}}>{medal[p.rank-1]}</div>
            <div style={{fontSize:11.5,fontWeight:800,color:p.isMe?"var(--stamp)":"var(--ink)",textAlign:"center",lineHeight:1.2}}>{p.name}</div>
            <div style={{...S.podBar,height:h,background:p.isMe?"var(--stamp)":p.rank===1?"var(--gold)":"var(--ink-soft)"}}>
              <span style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:18,color:"#fff"}}>{p.score}</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.9)"}}>{p.regions}곳</span>
            </div>
          </div>);
        })}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {ranked.slice(0,5).map(p=><RankRow key={p.id} p={p} medal={medal}/>)}
        {me.rank>5 && (<><div style={{textAlign:"center",color:"var(--ink-soft)",fontSize:15,lineHeight:1}}>⋯</div><RankRow p={me} medal={medal}/></>)}
      </div>
      <p style={S.dataNote}>전국 랭킹은 방끼리 경쟁해요. 방 구성원들의 점수 합이 1순위, 동점이면 점령 지역 수 합으로 순위가 갈립니다.</p>
    </div>
  );
}
function RankRow({p,medal}){
  return (<div style={{...S.rankRow, ...(p.isMe?{border:"1.5px solid var(--stamp)",background:"rgba(19,31,60,.06)"}:{})}}>
    <span style={{width:26,textAlign:"center",fontFamily:"'Black Han Sans',sans-serif",fontSize:15,color:p.rank<=3?"var(--gold)":"var(--ink-soft)"}}>{p.rank<=3?medal[p.rank-1]:p.rank}</span>
    <span style={{fontSize:13.5,fontWeight:800,color:p.isMe?"var(--stamp)":"var(--ink)"}}>{p.name}</span>
    <span style={{marginLeft:"auto",fontFamily:"'Black Han Sans',sans-serif",fontSize:16,color:"var(--ink)"}}>{p.score}</span>
    <span style={{fontSize:11,color:"var(--ink-soft)",width:42,textAlign:"right"}}>{p.regions}곳</span>
  </div>);
}

function ShareModal({ room, onClose, onAccept, flash }){
  const code = room?.code || "KR-DEMO";
  const link = `https://daehanminguk-game.app/join/${code}`;
  function share(){
    if(typeof navigator!=="undefined" && navigator.share){ navigator.share({title:"대한민국 부루마블", text:`방 코드 ${code} 로 함께 전국을 점령해요!`, url:link}).catch(()=>{}); }
    else { try{ navigator.clipboard.writeText(link); }catch(e){} flash("초대 링크가 복사되었어요"); }
  }
  function copy(){ try{ navigator.clipboard.writeText(link); }catch(e){} flash("초대 링크 복사 완료"); }
  return (
    <div style={S.modalScrim} onClick={onClose}><div style={S.sheet} onClick={e=>e.stopPropagation()} className="sheet-in">
      <div style={S.sheetGrab}/>
      <h3 style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:19,color:"var(--ink)",textAlign:"center"}}>친구 초대</h3>
      <p style={{fontSize:12.5,color:"var(--ink-soft)",textAlign:"center",margin:"4px 0 16px"}}>아래 링크나 코드를 친구에게 공유하세요</p>
      <div style={S.shareCode}><span style={{fontSize:11,color:"var(--ink-soft)"}}>방 코드</span><span style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:22,color:"var(--ink)",letterSpacing:1}}>{code}</span></div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={share} style={S.shareBtn}>📤 공유하기</button>
        <button onClick={copy} style={S.shareGhost}>링크 복사</button>
      </div>
      <div style={S.shareTargets}>{["💬","✉️","🔗","📷"].map((ic,i)=><button key={i} onClick={share} style={S.shareTarget}>{ic}</button>)}</div>
      <button onClick={onAccept} style={S.shareDemo}>(데모) 친구가 초대를 수락했다고 가정하기 →</button>
      <button onClick={onClose} style={{...S.roomGhost,marginTop:8,width:"100%"}}>닫기</button>
    </div></div>
  );
}

function CardsModal({ cards, onClose }){
  return (
    <div style={S.vfScreen} className="overlay-in">
      <div style={S.vfHead}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h2 style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:20,color:"var(--ink)"}}>인증 카드 <span style={{fontSize:13,fontFamily:"Pretendard",color:"var(--ink-soft)",fontWeight:600}}>{cards.length}장</span></h2>
          <button onClick={onClose} style={S.vfClose}>닫기</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}} className="scroll">
        {cards.length===0 ? <p style={S.empty}>아직 카드가 없어요.</p> :
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {cards.map((c,i)=>(<div key={i} style={S.collCard}>
            <div style={{...S.collImg,background:`linear-gradient(135deg,${c.grad[0]},${c.grad[1]})`}}><span style={S.collType}>{c.type==="영수증"?"🧾":"📷"} {c.type}</span>{c.depop && <span style={S.collGold}>★</span>}</div>
            <div style={{padding:"8px 9px"}}><div style={{fontSize:12,fontWeight:800,color:"var(--ink)",lineHeight:1.2}}>{c.title}</div><div style={{fontSize:10.5,color:"var(--ink-soft)",marginTop:2}}>{c.place}</div></div>
          </div>))}
        </div>}
      </div>
    </div>
  );
}

/* ───────── 메인 ───────── */
function MainScreen({themes,toggleTheme,distIdx,setDistIdx,duration,setDuration,budget,setBudget,rollsLeft,rollDice,activeTrip,openVerify,finishTrip}){
  return (<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={S.hello}><p style={{fontSize:13,color:"var(--ink-soft)"}}>오늘의 출발지</p><p style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:22,color:"var(--ink)"}}>📍 서울 <span style={{fontSize:13,fontFamily:"Pretendard",color:"var(--ink-soft)",fontWeight:600}}>현재 위치 기준</span></p></div>
    {activeTrip ? (
      <ActiveTripCard trip={activeTrip} openVerify={openVerify} finishTrip={finishTrip}/>
    ) : (<>
      <Section title="테마" sub="끌리는 분위기를 골라요 (복수 선택)"><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{THEME_LIST.map(t=><button key={t} onClick={()=>toggleTheme(t)} style={{...S.chip,...(themes.includes(t)?S.chipOn:{})}}>{THEME_LABELS[t]}</button>)}</div></Section>
      <Section title="이동거리" sub={`${DIST_STEPS[distIdx].label} · ${DIST_STEPS[distIdx].sub}`}><input type="range" min={0} max={3} value={distIdx} onChange={e=>setDistIdx(+e.target.value)} className="range" style={{width:"100%"}}/><div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>{DIST_STEPS.map((d,i)=><span key={i} style={{fontSize:11,fontWeight:i===distIdx?800:500,color:i===distIdx?"var(--stamp)":"var(--ink-soft)"}}>{d.label}</span>)}</div></Section>
      <Section title="여행 기간"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{DURATIONS.map(d=><button key={d} onClick={()=>setDuration(d)} style={{...S.segBtn,...(duration===d?S.segOn:{})}}>{d}</button>)}</div></Section>
      <Section title="예산" sub="교통·숙박 포함 예상 경비"><div style={{display:"flex",gap:8}}>{BUDGETS.map(b=><button key={b.v} onClick={()=>setBudget(b.v)} style={{...S.segBtn,...(budget===b.v?S.segOn:{})}}>{b.label}</button>)}</div></Section>
      <button onClick={rollDice} disabled={rollsLeft<=0} style={{...S.rollBtn,opacity:rollsLeft<=0?.5:1}}><span style={{fontSize:26}}>🎲</span><span>{rollsLeft>0?"주사위 굴리기":"오늘 기회 소진"}</span><span style={S.rollCount}>남은 {rollsLeft}/5</span></button>
      <p style={{textAlign:"center",fontSize:12,color:"var(--ink-soft)",marginTop:-6}}>목적지는 출발 전까지 봉투 안에 숨겨져요</p>
    </>)}
  </div>);
}
function ActiveTripCard({trip,openVerify,finishTrip}){
  const done = trip.missions.filter(m=>m.done).length;
  const allDone = trip.missions.every(m=>m.done);
  const arrivalDone = trip.missions.find(m=>m.t==="명소")?.done;
  const finishLabel = trip.outcome==="conquer"?"미션 완료 · 이 지역 점령하기":trip.outcome==="toll"?"미션 완료 · 방문 완료하기":"미션 완료 · 재방문 완료";
  return (
    <div style={S.tripCard}>
      <div style={S.tripStatus}><span className="blink-dot" style={S.tripDot}/> 여행 중 · 미점령</div>
      <div style={{...S.tripImg,background:`linear-gradient(135deg,${trip.grad[0]},${trip.grad[1]})`}}>
        {trip.depop && <span style={S.goldTag}>★ 황금 타일 ×2</span>}
        <div style={S.tripImgInner}><span style={{fontSize:12,opacity:.9}}>{trip.sido} · {trip.sigungu}</span><h2 style={{...S.destName,fontSize:23}}>{trip.title}</h2></div>
      </div>
      <div style={{padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:14,color:"var(--ink)"}}>도착 미션</span>
          <span style={{fontSize:12,color:"var(--ink-soft)"}}>{done}/3 인증</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {trip.missions.map((m,i)=>(<div key={i} style={S.tripMission}>
            <span style={{fontSize:15}}>{m.done?"✅":m.method==="receipt"?"🧾":"📍"}</span>
            <span style={{fontSize:13,fontWeight:700,color:m.done?"var(--ink-soft)":"var(--ink)",textDecoration:m.done?"line-through":"none"}}>{m.n}</span>
            <span style={S.tripTag}>{m.t}</span>
            <span style={{marginLeft:"auto",fontSize:11,color:m.done?"var(--sea)":"var(--ink-soft)",fontWeight:700}}>{m.done?"인증됨":m.method==="receipt"?"영수증":"GPS"}</span>
          </div>))}
        </div>
        {allDone
          ? <button onClick={finishTrip} style={{...S.tripPrimary,marginTop:14}}>{finishLabel}</button>
          : <button onClick={openVerify} style={{...S.tripPrimary,marginTop:14,background:"var(--ink)",boxShadow:"0 5px 0 #0c1730"}}>{arrivalDone?"이어서 인증하기":"도착 인증하기"} →</button>}
      </div>
    </div>
  );
}


/* ───────── 지도 (지도그림 / 타일) ───────── */
function MapScreen({ownership,ownerColor,memberById,members,room,createRoom,joinRoom,openShare,leaveRoom,score,memberScore,ownedCount,myRegionCount,activeTrip,flash}){
  const [view,setView] = useState("real");
  const [joining,setJoining] = useState(false);
  const [codeInput,setCodeInput] = useState("");
  const activeSgg = activeTrip?.sgg;
  return (<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={S.boardHead}>
      <div><p style={{fontSize:12,color:"var(--ink-soft)"}}>정복한 지역</p><p style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:26,color:"var(--ink)"}}>{ownedCount}<span style={{fontSize:15,color:"var(--ink-soft)"}}> 곳</span></p></div>
      <div style={{textAlign:"right"}}><p style={{fontSize:12,color:"var(--ink-soft)"}}>점령 점수</p><p style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:26,color:"var(--stamp)"}}>{score}</p></div>
    </div>
    <div style={S.viewSwitch}>
      <button onClick={()=>setView("real")} style={{...S.viewBtn,...(view==="real"?S.viewOn:{})}}>지도 그림</button>
      <button onClick={()=>setView("tiles")} style={{...S.viewBtn,...(view==="tiles"?S.viewOn:{})}}>타일</button>
    </div>

    {view==="real" ? <RealMap {...{ownership,ownerColor,memberById,activeSgg}}/> : <TileBoard {...{ownership,ownerColor,memberById,members,room,activeSgg}}/>}

    <div style={S.legend}>{members.map(m=><Lg key={m.id} c={m.color} t={m.id==="me"?"나":m.name}/>)}<Lg c="var(--paper-2)" t="미점령" border/></div>

    {!room ? (
      <div style={S.roomCard}><p style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:15,color:"var(--ink)",marginBottom:4}}>친구와 같은 게임판</p>
        <p style={{fontSize:12.5,color:"var(--ink-soft)",marginBottom:12,lineHeight:1.5}}>방을 만들어 친구를 초대하면 한 지도에서 영토를 두고 경쟁해요. 친구 땅에 도착하면 통행료를 냅니다.</p>
        {!joining ? (
          <div style={{display:"flex",gap:8}}><button onClick={createRoom} style={S.roomPrimary}>방 만들기</button><button onClick={()=>setJoining(true)} style={S.roomGhost}>코드로 참여</button></div>
        ) : (
          <div>
            <p style={{fontSize:11.5,color:"var(--ink-soft)",marginBottom:6}}>친구에게 받은 방 코드를 입력하세요</p>
            <div style={{display:"flex",gap:8}}>
              <input value={codeInput} onChange={e=>setCodeInput(e.target.value.toUpperCase())} placeholder="예: KR-7C2A" maxLength={8} style={S.codeInput}/>
              <button onClick={()=>{ if(!codeInput.trim()){flash("코드를 입력해 주세요");return;} joinRoom(codeInput); }} style={{...S.roomPrimary,flex:"none",padding:"13px 20px"}}>참여</button>
            </div>
            <button onClick={()=>{setJoining(false);setCodeInput("");}} style={{...S.roomGhost,marginTop:8,width:"100%"}}>취소</button>
          </div>
        )}</div>
    ) : (
      <div style={S.roomCard}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><div><p style={{fontSize:11.5,color:"var(--ink-soft)"}}>방 코드</p><p style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:18,color:"var(--ink)",letterSpacing:1}}>{room.code}</p></div><button onClick={openShare} style={S.inviteBtn}>친구 초대</button></div>
        <p style={{fontSize:11,color:"var(--ink-soft)",marginBottom:8}}>방 안 순위 · 점수 우선, 동점 시 정복 곳수</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{
          [...members].map(m=>({m,sc:memberScore(m.id),rg:myRegionCount(m.id)}))
            .sort((a,b)=> b.sc-a.sc || b.rg-a.rg)
            .map((row,idx)=>{ const m=row.m; const lead=idx===0; const isMe=m.id==="me";
              return (<div key={m.id} style={{...S.memberRow, ...(lead?{border:"1.5px solid var(--gold)",background:"rgba(227,169,44,.07)"}:{}), ...(isMe&&!lead?{border:"1.5px solid var(--me)"}:{})}}>
                <span style={{width:20,textAlign:"center",fontFamily:"'Black Han Sans',sans-serif",fontSize:13,color:"var(--ink-soft)"}}>{idx+1}</span>
                <div style={{position:"relative",width:24,height:24}}>
                  <span style={{width:24,height:24,borderRadius:"50%",background:m.color,display:"grid",placeItems:"center",color:"#fff",fontSize:11,fontWeight:800}}>{(isMe?"나":m.name)[0]}</span>
                  {lead && <span style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",fontSize:14}}>👑</span>}
                </div>
                <span style={{fontSize:13.5,fontWeight:800,color:isMe?"var(--me)":"var(--ink)"}}>{isMe?"나":m.name}</span>
                <span style={{marginLeft:"auto",fontFamily:"'Black Han Sans',sans-serif",fontSize:15,color:"var(--ink)"}}>{row.sc}</span>
                <span style={{fontSize:11,color:"var(--ink-soft)",width:38,textAlign:"right"}}>{row.rg}곳</span>
              </div>);
            })
        }</div>
        <button onClick={leaveRoom} style={{...S.roomGhost,marginTop:12,width:"100%"}}>방 나가기</button></div>)}
  </div>);
}

function RealMap({ownership,ownerColor,memberById,activeSgg}){
  const [sel,setSel] = useState(null);
  const selFeat = sel ? SIGUNGU.find(f=>f.code===sel) : null;
  const selOwner = selFeat ? (selFeat.sido==="서울"?"me":ownership[selFeat.code]) : null;
  return (
    <div style={S.mapCard}>
      <svg viewBox="-8 -8 636 674" style={{width:"100%",height:"auto",display:"block"}}>
        {SIGUNGU.map(f=>{
          const owner = f.sido==="서울" ? "me" : ownership[f.code];
          const fill = owner ? ownerColor(owner) : "#FFFFFF";
          const active = f.code===activeSgg;
          return <path key={f.code} className={active?"mapBlink":""} d={f.d} fill={fill} stroke={sel===f.code?"#16223F":active?"#F2913C":"rgba(70,70,90,.35)"} strokeWidth={sel===f.code?1.6:active?1.6:0.4} onClick={()=>setSel(f.code)} style={{cursor:"pointer"}}/>;
        })}
      </svg>
      {selFeat && (<div style={S.selBar}><b style={{color:"var(--ink)"}}>{selFeat.sido} {selFeat.name}</b>
        <span style={{marginLeft:8,fontSize:12.5,color:"var(--ink-soft)"}}>{selOwner==="me"?(selFeat.sido==="서울"?"홈 · 나의 영토":"나의 영토"):selOwner?`${memberById(selOwner)?.name}님의 영토`:"미점령"}</span>
        {selOwner && selOwner!=="me" && <span style={{marginLeft:"auto",fontSize:11.5,color:"var(--stamp)",fontWeight:700}}>통행료 {TOLL}🪙</span>}</div>)}
      <p style={{fontSize:11,color:"var(--ink-soft)",textAlign:"center",margin:"2px 0 2px"}}>인증한 시·군·구가 내 색으로 칠해져요 · 지역을 탭해보세요</p>
    </div>
  );
}

function TileBoard({ownership,ownerColor,memberById,members,room,activeSgg}){
  const groups = useMemo(()=>{
    const g={}; BOARD.forEach(t=>{(g[t.sido]=g[t.sido]||[]).push(t);});
    return SIDO_ORDER.filter(sd=>g[sd]).map(sd=>({sido:sd,tiles:g[sd]}));
  },[]);
  const [open,setOpen] = useState(()=> groups[0]? {[groups[0].sido]:true} : {});
  const toggle=(sd)=> setOpen(o=>({...o,[sd]:!o[sd]}));
  const names = members.map(m=>m.id==="me"?"나":m.name).join(" · ");
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>📖</span><span style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:18,color:"var(--ink)"}}>우리 게임판</span></div>
          <p style={{fontSize:12,color:"var(--ink-soft)",marginTop:4}}>{names} · {members.length}명 {room?"경쟁 중":"플레이"}</p>
        </div>
        {room && <span style={S.liveLight}><span className="blink-dot" style={{width:7,height:7,borderRadius:"50%",background:"var(--live)"}}/> LIVE</span>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {groups.map(g=>{
          const total=g.tiles.length;
          const mine=g.tiles.filter(t=>ownership[t.code]==="me").length;
          const isOpen=!!open[g.sido];
          const hasActive=g.tiles.some(t=>t.code===activeSgg);
          return (<div key={g.sido} style={S.accSection}>
            <button onClick={()=>toggle(g.sido)} style={S.accHead}>
              <span style={{width:4,height:18,borderRadius:3,background:SIDO_ACCENT[g.sido]||"#888"}}/>
              <span style={{fontSize:15,fontWeight:800,color:"var(--ink)"}}>{SIDO_FULL[g.sido]||g.sido}</span>
              {hasActive && <span style={{background:"var(--live)",color:"#fff",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:8}}>여행 중</span>}
              <span style={{marginLeft:"auto",fontSize:12,color:"var(--ink-soft)"}}>{mine}/{total} 점령</span>
              <span style={{fontSize:10,color:"var(--ink-soft)",transform:isOpen?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span>
            </button>
            {isOpen && (<div style={{padding:"0 12px 12px"}}><div style={S.bGrid}>
              {g.tiles.map(t=>{
                const owner=ownership[t.code]; const isMe=owner==="me";
                const mem = owner&&!isMe? memberById(owner):null;
                const accent = isMe?"#2EB872":mem?mem.color:"#E3A92C";
                const owned = isMe||mem;
                const pts = t.depop? t.pt*2 : t.pt;
                const active = t.code===activeSgg;
                const borderC = active?"#F2913C":(owned?accent:(t.depop?"#E3A92C":"var(--line)"));
                const bgC = active?"rgba(242,145,60,.08)":(owned?`${accent}1A`:(t.depop?"rgba(227,169,44,.08)":"var(--paper)"));
                return (<div key={t.code} className={active?"tileBlink":""} style={{...S.bTileL, border:`1.5px solid ${borderC}`, background:bgC}}>
                  {active && <span style={S.bLive}>여행 중</span>}
                  {t.depop && <span style={S.bSun}>☀️</span>}
                  {owned && !active && <span style={{...S.bBadge,background:accent}}>{isMe?"나":mem.name}</span>}
                  <div style={{fontSize:23,textAlign:"center",marginTop:owned||t.depop?6:2}}>{t.icon}</div>
                  <div style={{textAlign:"center",marginTop:4}}>
                    <span style={{fontSize:12.5,fontWeight:800,color:"var(--ink)"}}>{t.name}</span>
                    {t.depop && <span style={{fontSize:11,fontWeight:800,color:"var(--gold)"}}> ×2</span>}
                  </div>
                  <div style={{textAlign:"center",fontSize:11,fontWeight:700,color:t.depop?"var(--gold)":"var(--ink-soft)",marginTop:2}}>{pts}pt</div>
                </div>);
              })}
            </div></div>)}
          </div>);
        })}
      </div>
    </div>
  );
}
function Lg({c,t,border}){return <span style={{display:"flex",alignItems:"center",gap:6,fontSize:11.5,color:"var(--ink-soft)"}}><span style={{width:14,height:14,borderRadius:4,background:c,boxShadow:border?"inset 0 0 0 1.5px var(--line)":"none"}}/>{t}</span>;}

/* ───────── 마이페이지 ───────── */
function MyScreen({score,coins,inventory,ownedCount,trips,cards,room,resetDemo,openCards}){
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


/* ───────── 스타일 ───────── */
import { S, CSS } from './styles';