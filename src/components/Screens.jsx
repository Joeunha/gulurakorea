import React, { useState, useMemo } from 'react';
import { S } from '../styles';
import { THEME_LABELS, DIST_STEPS, NATIONAL_ROOMS, EVENT_CARDS } from '../constants';



function Stat({k,v,c}){return <div style={S.stat}><div style={{fontFamily:"'Black Han Sans',sans-serif",fontSize:24,color:c}}>{v}</div><div style={{fontSize:11,color:"var(--ink-soft)",marginTop:2}}>{k}</div></div>;}
function Section({title, sub, children}){return <div style={S.section}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><h3 style={S.secTitle}>{title}</h3><span style={{fontSize:11.5,color:"var(--ink-soft)"}}>{sub}</span></div>{children}</div>;}
