/**
 * 친구 초대 — 링크 / 카카오톡 공유
 */
import React from "react";
import { inviteLink, loadKakaoShare } from "../api/kakao.js";
import { S } from "../ui/styles.js";

export function ShareModal({ room, onClose, onAccept, flash }){
  const code = room?.code || "KR-DEMO";
  const link = inviteLink(code);
  function share(){
    if(typeof navigator!=="undefined" && navigator.share){ navigator.share({title:"대한민국 부루마블", text:`방 코드 ${code} 로 함께 전국을 점령해요!`, url:link}).catch(()=>{}); }
    else { try{ navigator.clipboard.writeText(link); }catch(e){} flash("초대 링크가 복사되었어요"); }
  }
  function copy(){ try{ navigator.clipboard.writeText(link); }catch(e){} flash("초대 링크 복사 완료"); }
  async function shareKakao(){
    try{
      const Kakao = await loadKakaoShare();
      Kakao.Share.sendDefault({
        objectType:"feed",
        content:{ title:"대한민국 부루마블", description:`${code} 방에 초대되었어요. 링크를 열면 바로 참여됩니다.`, imageUrl:"https://placehold.co/800x400/131F3C/F4EDDF/png?text=%EB%8C%80%ED%95%9C%EB%AF%BC%EA%B5%AD+%EB%B6%80%EB%A3%A8%EB%A7%88%EB%B8%94", link:{ mobileWebUrl:link, webUrl:link } },
        buttons:[{ title:"링크로 바로 참여하기", link:{ mobileWebUrl:link, webUrl:link } }],
      });
    }catch(e){ flash("카카오 공유 불가 · " + ((e&&e.message)||e)); share(); }
  }
  return (
    <div style={S.modalScrim} onClick={onClose}><div style={S.sheet} onClick={e=>e.stopPropagation()} className="sheet-in">
      <div style={S.sheetGrab}/>
      <h3 style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:19,color:"var(--ink)",textAlign:"center"}}>친구 초대</h3>
      <p style={{fontSize:12.5,color:"var(--ink-soft)",textAlign:"center",margin:"4px 0 16px"}}>아래 링크나 코드를 친구에게 공유하세요</p>
      <div style={S.shareCode}><span style={{fontSize:11,color:"var(--ink-soft)"}}>방 코드</span><span style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:22,color:"var(--ink)",letterSpacing:1}}>{code}</span></div>
      <div style={S.shareLink}>{link}</div>
      <p style={{fontSize:11,color:"var(--ink-soft)",lineHeight:1.6,marginTop:6}}>이 링크로 들어오면 코드를 입력하지 않아도 바로 이 방에 참여합니다.</p>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={shareKakao} style={{...S.shareBtn,background:"#FEE500",color:"#191600"}}>💬 카카오톡으로 초대</button>
        <button onClick={copy} style={S.shareGhost}>링크 복사</button>
      </div>
      <button onClick={share} style={{...S.shareGhost,width:"100%",marginTop:8}}>📤 다른 앱으로 공유</button>
      <div style={S.shareTargets}>{["💬","✉️","🔗","📷"].map((ic,i)=><button key={i} onClick={share} style={S.shareTarget}>{ic}</button>)}</div>
      <button onClick={onAccept} style={S.shareDemo}>(데모) 친구가 초대를 수락했다고 가정하기 →</button>
      <button onClick={onClose} style={{...S.roomGhost,marginTop:8,width:"100%"}}>닫기</button>
    </div></div>
  );
}
