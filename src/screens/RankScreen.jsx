import React, { useMemo } from "react";
import { NATIONAL_ROOMS } from "../data/gameData.js";
import { S } from "../styles/styles.js";

export function RankScreen({myRoomScore,myRoomRegions,room,memberCount}){
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
export function RankRow({p,medal}){
  return (<div style={{...S.rankRow, ...(p.isMe?{border:"1.5px solid var(--stamp)",background:"rgba(19,31,60,.06)"}:{})}}>
    <span style={{width:26,textAlign:"center",fontFamily:"'Black Han Sans',sans-serif",fontSize:15,color:p.rank<=3?"var(--gold)":"var(--ink-soft)"}}>{p.rank<=3?medal[p.rank-1]:p.rank}</span>
    <span style={{fontSize:13.5,fontWeight:800,color:p.isMe?"var(--stamp)":"var(--ink)"}}>{p.name}</span>
    <span style={{marginLeft:"auto",fontFamily:"'Black Han Sans',sans-serif",fontSize:16,color:"var(--ink)"}}>{p.score}</span>
    <span style={{fontSize:11,color:"var(--ink-soft)",width:42,textAlign:"right"}}>{p.regions}곳</span>
  </div>);
}

export function ShareModal({ room, onClose, onAccept, flash }){
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

export function CardsModal({ cards, onClose }){
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

