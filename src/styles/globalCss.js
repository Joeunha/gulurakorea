export const CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
@import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap');
:root{--paper:#F4EDDF;--paper-2:#EAE0CB;--ink:#16223F;--ink-soft:#5A668A;--stamp:#131F3C;--stamp-deep:#0B1426;--me:#2EB872;--live:#F2913C;--gold:#E3A92C;--sea:#1E8E8A;--line:rgba(22,34,63,.13);}
*{box-sizing:border-box;margin:0;-webkit-tap-highlight-color:transparent}
button:focus-visible{outline:2.5px solid var(--ink);outline-offset:2px}
.scroll::-webkit-scrollbar,.sheet::-webkit-scrollbar{width:0}
.range{-webkit-appearance:none;height:6px;border-radius:6px;background:var(--paper);outline:none}
.range::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:var(--stamp);cursor:pointer;box-shadow:0 3px 8px rgba(19,31,60,.4);border:3px solid #fff}
.range::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:var(--stamp);border:3px solid #fff;cursor:pointer}
@keyframes shake{0%,100%{transform:rotate(-14deg) translateY(0)}25%{transform:rotate(12deg) translateY(-10px)}50%{transform:rotate(-8deg) translateY(4px)}75%{transform:rotate(10deg) translateY(-6px)}}
.die-shake{display:inline-block;animation:shake .28s linear infinite}
.dice-cube{transition:transform .6s cubic-bezier(.2,.85,.25,1)}
@keyframes dicetumble{0%{transform:rotateX(0deg) rotateY(0deg) rotateZ(0deg)}100%{transform:rotateX(720deg) rotateY(1080deg) rotateZ(360deg)}}
.dice-cube.rolling{animation:dicetumble .75s linear infinite}
@keyframes spink{to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spink .8s linear infinite}
@keyframes olin{from{opacity:0}to{opacity:1}}.overlay-in{animation:olin .25s ease}
@keyframes popin{from{opacity:0;transform:scale(.9) translateY(14px)}to{opacity:1;transform:none}}.pop-in{animation:popin .4s cubic-bezier(.2,.9,.3,1.2)}
@keyframes revealin{0%{opacity:0;transform:translateY(26px) scale(.96)}100%{opacity:1;transform:none}}.reveal-in{animation:revealin .5s cubic-bezier(.2,.9,.3,1.1)}
@keyframes carddrop{0%{opacity:0;transform:translateY(-20px) rotate(-6deg)}100%{opacity:1;transform:none}}.card-drop{animation:carddrop .5s ease}
@keyframes flapopen{to{transform:rotateX(-172deg)}}.flap-open{animation:flapopen .55s cubic-bezier(.5,0,.4,1) forwards}
@keyframes sealcrack{0%{transform:scale(1)}30%{transform:scale(1.25) rotate(8deg)}100%{transform:scale(.6) rotate(40deg) translateY(40px);opacity:0}}.seal-crack{animation:sealcrack .6s ease forwards}
@keyframes flashk{0%{opacity:0}35%{opacity:1}100%{opacity:0}}.flash{animation:flashk 1s ease forwards;animation-delay:.35s}
@keyframes burstk{0%{opacity:0;transform:translate(-50%,0) scale(.4)}30%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),var(--ty)) scale(.2)}}.burst{animation:burstk .8s ease forwards;animation-delay:.4s}
@keyframes sheetin{from{transform:translateY(40px);opacity:.6}to{transform:none;opacity:1}}.sheet-in{animation:sheetin .3s cubic-bezier(.2,.9,.3,1)}
@keyframes toastin{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}.toast-in{animation:toastin .25s ease}
@keyframes mapblinkk{0%,100%{fill:#fff}50%{fill:#FCE2C2}}
.mapBlink{animation:mapblinkk 1.1s ease-in-out infinite}
@keyframes tileblinkk{0%,100%{box-shadow:0 0 0 0 rgba(242,145,60,.6)}50%{box-shadow:0 0 0 5px rgba(242,145,60,.18)}}
.tileBlink{animation:tileblinkk 1.1s ease-in-out infinite}
@keyframes blinkdot{0%,100%{opacity:1}50%{opacity:.2}}
.blink-dot{animation:blinkdot 1s ease-in-out infinite}
@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important}}
`;
