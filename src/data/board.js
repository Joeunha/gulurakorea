/**
 * 시·군·구 타일 게임판
 */
import { DEPOP_SET } from "./depopulated.js";
import { SIGUNGU } from "../lib/sigungu.js";

/* 타일 게임판 (시·군·구 단위 보드) */
export const SIDO_FULL = {강원:"강원특별자치도",경북:"경상북도",경남:"경상남도",전남:"전라남도",전북:"전북특별자치도",충북:"충청북도",부산:"부산광역시",대구:"대구광역시"};

export const SIDO_ACCENT = {강원:"#4FC58E",경북:"#F0913C",경남:"#B07FE6",전남:"#8CCB5A",전북:"#E0C24A",충북:"#7A8BE0",부산:"#E0529E",대구:"#E06A6A"};

export const BOARD = [
  {code:"32030",sido:"강원",name:"강릉",pt:90,icon:"🏄",depop:false},
  {code:"32060",sido:"강원",name:"속초",pt:90,icon:"⛰️",depop:false},
  {code:"32410",sido:"강원",name:"양양",pt:80,icon:"🌊",depop:false},
  {code:"32350",sido:"강원",name:"정선",pt:90,icon:"🌲",depop:true},
  {code:"32340",sido:"강원",name:"평창",pt:100,icon:"❄️",depop:false},
  {code:"32330",sido:"강원",name:"영월",pt:80,icon:"🏞️",depop:true},
  {code:"32400",sido:"강원",name:"고성",pt:80,icon:"🐟",depop:true},
  {code:"32360",sido:"강원",name:"철원",pt:70,icon:"🦌",depop:false},
  {code:"37020",sido:"경북",name:"경주",pt:100,icon:"🏯",depop:false},
  {code:"37320",sido:"경북",name:"의성",pt:100,icon:"🌸",depop:true},
  {code:"37040",sido:"경북",name:"안동",pt:80,icon:"⛩️",depop:false},
  {code:"37410",sido:"경북",name:"봉화",pt:60,icon:"🌿",depop:false},
  {code:"37330",sido:"경북",name:"청송",pt:60,icon:"🍎",depop:false},
  {code:"37310",sido:"경북",name:"군위",pt:80,icon:"🌲",depop:true},
  {code:"38050",sido:"경남",name:"통영",pt:90,icon:"🎨",depop:false},
  {code:"38350",sido:"경남",name:"남해",pt:90,icon:"🏘️",depop:true},
  {code:"38090",sido:"경남",name:"거제",pt:90,icon:"⚓",depop:false},
  {code:"38360",sido:"경남",name:"하동",pt:70,icon:"🍃",depop:false},
  {code:"36360",sido:"전남",name:"보성",pt:80,icon:"🍵",depop:true},
  {code:"36020",sido:"전남",name:"여수",pt:100,icon:"🐟",depop:false},
  {code:"36030",sido:"전남",name:"순천",pt:80,icon:"🌾",depop:false},
  {code:"36310",sido:"전남",name:"담양",pt:70,icon:"🎋",depop:false},
  {code:"33380",sido:"충북",name:"단양",pt:90,icon:"⛰️",depop:true},
  {code:"33030",sido:"충북",name:"제천",pt:70,icon:"🏔️",depop:false},
  {code:"33020",sido:"충북",name:"충주",pt:80,icon:"🍇",depop:false},
  {code:"35011",sido:"전북",name:"전주",pt:100,icon:"🍚",depop:false},
  {code:"35020",sido:"전북",name:"군산",pt:80,icon:"🚢",depop:false},
  {code:"35050",sido:"전북",name:"남원",pt:70,icon:"🌸",depop:false},
  {code:"21040",sido:"부산",name:"영도",pt:70,icon:"🌉",depop:false},
  {code:"21090",sido:"부산",name:"해운대",pt:100,icon:"🏖️",depop:false},
  {code:"22010",sido:"대구",name:"중구",pt:70,icon:"🎤",depop:false},
  {code:"22020",sido:"대구",name:"동구",pt:70,icon:"✈️",depop:false},
];

/* 게임판 타일도 같은 기준으로 황금 타일 판정 (기존 true는 유지) */
BOARD.forEach(b => {
  const sg = SIGUNGU.find(x => x.code === b.code);
  if (sg && DEPOP_SET.has(sg.sido + "|" + sg.name)) b.depop = true;
});
