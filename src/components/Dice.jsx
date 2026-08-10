import React from "react";

export function DieFace({ n, size=64 }) {
  const P = {1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}[n]||[4];
  return (<div style={{width:size,height:size,background:"var(--paper)",borderRadius:size*0.22,boxShadow:"0 8px 0 rgba(20,33,58,.18), inset 0 0 0 2px rgba(20,33,58,.10)",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gridTemplateRows:"1fr 1fr 1fr",padding:size*0.13}}>
    {Array.from({length:9}).map((_,i)=>(<div key={i} style={{display:"grid",placeItems:"center"}}><span style={{width:"58%",height:"58%",borderRadius:"50%",background:P.includes(i)?"var(--ink)":"transparent"}}/></div>))}</div>);
}
export function DicePips({ n, size }){
  const P = {1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}[n]||[4];
  return (<div style={{width:"100%",height:"100%",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gridTemplateRows:"1fr 1fr 1fr",padding:size*0.13,boxSizing:"border-box"}}>
    {Array.from({length:9}).map((_,i)=>(<div key={i} style={{display:"grid",placeItems:"center"}}><span style={{width:"56%",height:"56%",borderRadius:"50%",background:P.includes(i)?"#16223F":"transparent"}}/></div>))}</div>);
}
export function Dice3D({ n, rolling, size=96 }){
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

