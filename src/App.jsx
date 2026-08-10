import React, { useState, useRef, useEffect } from "react";
import { THEME_LABELS, DIST_STEPS, EVENT_CARDS, ME, FRIEND_POOL, TOLL, methodFor } from "./data/gameData.js";
import { fetchDestinations } from "./lib/verification.js";
import { Dice3D } from "./components/Dice.jsx";
import { Envelope, Meta } from "./components/Envelope.jsx";
import { VerifyFlow } from "./components/VerifyFlow.jsx";
import { ResultOverlay } from "./components/ResultOverlay.jsx";
import { Splash } from "./components/Splash.jsx";
import { RankScreen, ShareModal, CardsModal } from "./screens/RankScreen.jsx";
import { MainScreen } from "./screens/MainScreen.jsx";
import { MapScreen } from "./screens/MapScreen.jsx";
import { MyScreen } from "./screens/MyScreen.jsx";
import { S } from "./styles/styles.js";
import { CSS } from "./styles/globalCss.js";

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

