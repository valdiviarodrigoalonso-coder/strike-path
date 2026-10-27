// Train tab gets its own look: boxing-manga flair in the spirit of Hajime no Ippo (style only, no artwork from the show).
// Inked panels with screentone, speed lines while you fight, katakana sound effects on every combo,
// impact-bubble combo calls, and a rumbling ゴゴゴゴ during burnout.
// Also shortens the gap between combos by 1.5 seconds (and the wait before the first call).
// Run once: node tools/patches/2026-10-28-manga-train.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("function popSfx(")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 90)); h = h.replace(a, b); };

// ---------------- shorter waits between combos ----------------
rep("  clock.nextCall = Date.now() + (T.pace * THEMES[theme].pace + c.length * .75) * 1000;\n}",
    "  // 1.5 s quicker than before, never under 0.9 s\n  clock.nextCall = Date.now() + Math.max(.9, T.pace * THEMES[theme].pace + c.length * .75 - 1.5) * 1000;\n}");
rep("clock.nextCall = Date.now() + (2 + Math.random() * 3.5) * Math.max(.6, paceF) * 1000;", "clock.nextCall = Date.now() + (.8 + Math.random() * 3) * Math.max(.6, paceF) * 1000;");
rep("clock.endAt = Date.now() + T.len * 1000; clock.left = T.len; clock.nextCall = Date.now() + 2500;", "clock.endAt = Date.now() + T.len * 1000; clock.left = T.len; clock.nextCall = Date.now() + 1200;");
rep("else { clock.paused = false; clock.endAt = Date.now() + clock.left * 1000; clock.nextCall = Date.now() + 1500; }", "else { clock.paused = false; clock.endAt = Date.now() + clock.left * 1000; clock.nextCall = Date.now() + 800; }");

// ---------------- fonts: Bangers for the comic lettering, Dela Gothic One for the katakana (only the characters used) ----------------
const KANA = "ドン!バシッキュビズーゴ";
rep('<meta name="claude:viewport-fit-sides" content="cover">\n',
    '<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bangers&display=swap">\n' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap&text=' + encodeURIComponent(KANA) + '">\n');

// ---------------- markup ----------------
rep('<div id="trHome">\n      <div class="pghead"><h2>Bag Work</h2>',
    '<div id="trHome">\n      <div class="pghead trhero"><div><span class="kana" aria-hidden="true">ドン!</span><h2>Bag Work</h2><p>Hit it until your fists remember.</p></div>');
rep('<div class="callout" id="callout" aria-live="polite">', '<div class="sfxlayer" id="sfx" aria-hidden="true"></div>\n        <div class="callout" id="callout" aria-live="polite">');

// ---------------- sound effects ----------------
rep("function call() {\n  const theme = themeFor(clock.round), paceF = T.pace / 5;", String.raw`// manga sound effects: a hit for punches, a heavier one when the combo has a kick
const SFX_HIT = ["バシッ!", "ドン!", "バキッ!", "シュッ!", "ビシッ!"], SFX_KICK = ["ズドン!", "バシーン!", "ドゴッ!"];
function popSfx(text, cls) {
  const L = $("sfx"); if (!L) return;
  const s = document.createElement("span"); s.className = "sfx" + (cls ? " " + cls : ""); s.textContent = text;
  s.style.left = (cls ? 10 : 6 + Math.random() * 46) + "%"; s.style.top = (cls ? 26 : 16 + Math.random() * 30) + "%";
  s.style.setProperty("--r", (Math.random() * 24 - 12).toFixed(1) + "deg");
  L.appendChild(s); setTimeout(() => s.remove(), 800);
}
function call() {
  const theme = themeFor(clock.round), paceF = T.pace / 5;`);
rep("    $(\"callout\").innerHTML = '<span class=\"go\">GO!<\\/span>';", "    $(\"callout\").innerHTML = '<span class=\"go\">GO!<\\/span>'; popSfx(pick(SFX_HIT));");
rep("  say(c.map(callWord).join(\", \"));", "  say(c.map(callWord).join(\", \"));\n  if (strikes.length) popSfx(pick(strikes.some(id => KICK.includes(id)) ? SFX_KICK : SFX_HIT));");
rep("  ring(1); setCallMsg(\"Round \" + clock.round + \": \" + th.name + \". Fight!\");", "  ring(1); popSfx(\"FIGHT!\", \"en\"); setCallMsg(\"Round \" + clock.round + \": \" + th.name + \". Fight!\");");

// ---------------- styles ----------------
rep("@media (max-width:420px){.sth,.str{", String.raw`/* ===== Train: boxing-manga flair (ink, screentone, speed lines, sound effects) ===== */
:root{--manga:"Bangers",Impact,"Arial Black",sans-serif;--kana:"Dela Gothic One","Hiragino Sans","Yu Gothic",sans-serif;--paper:#f4efe3;--ippo:#7cc4ff}
#view-train .trhero{position:relative;overflow:hidden;align-items:flex-end;margin:16px 4px 8px;padding:22px 18px 18px;border:3px solid var(--paper);border-radius:6px;transform:rotate(-.6deg);box-shadow:6px 6px 0 var(--red);
  background:radial-gradient(circle,rgba(255,255,255,.13) 1.3px,transparent 1.7px) 0 0/9px 9px,repeating-conic-gradient(from 0deg at 88% 20%,rgba(255,255,255,.06) 0 1.5deg,transparent 1.5deg 7deg),linear-gradient(135deg,#1c2033,#000)}
#view-train .trhero h2{font-family:var(--manga);font-weight:400;font-size:56px;letter-spacing:.03em;line-height:.9;color:var(--paper);text-shadow:3px 3px 0 var(--red);transform:skewX(-6deg)}
#view-train .trhero p{margin:6px 0 0;color:#c9c3b6;font-size:14px}
#view-train .trhero .kana{position:absolute;right:54px;top:-4px;font-family:var(--kana);font-size:70px;color:rgba(255,210,63,.2);transform:rotate(12deg);pointer-events:none;white-space:nowrap}
#view-train .sub{font-family:var(--manga);font-size:25px;font-weight:400;letter-spacing:.05em;color:var(--paper);display:inline-block;border-bottom:3px solid var(--red);padding-bottom:1px;margin-top:30px;transform:skewX(-6deg)}
#view-train .routines{gap:20px;padding:0 6px 6px 2px}
#view-train .rcard{background:#111 radial-gradient(circle,rgba(255,255,255,.07) 1.1px,transparent 1.5px) 0 0/8px 8px;border:3px solid var(--paper);border-radius:4px;box-shadow:6px 6px 0 var(--red);transform:rotate(-.4deg)}
#view-train .rcard:nth-child(3n+2){box-shadow:6px 6px 0 var(--ippo);transform:rotate(.4deg)}
#view-train .rcard:nth-child(3n){box-shadow:6px 6px 0 var(--gold)}
#view-train .rtitle{font-family:var(--manga);font-weight:400;font-size:29px;letter-spacing:.04em;color:var(--paper)}
#view-train .rthemes span{background:var(--paper);color:#111;border-radius:3px;transform:skewX(-8deg);font-weight:700}
#view-train .nx{background:var(--gold);color:#111;border-radius:3px}
#view-train .btn.blue{background:var(--gold);color:#111;font-family:var(--manga);font-weight:400;font-size:22px;letter-spacing:.07em;border:2px solid #000;border-radius:4px;box-shadow:3px 3px 0 #000;transform:skewX(-6deg)}
#view-train .btn.blue:hover{background:#ffde5c}
#view-train .btn.ghost{border:2px solid var(--paper);border-radius:4px}
#view-train .panel{border:3px solid var(--paper);border-radius:4px;background:#111}
#view-train .bars .b i{background:var(--red)}
#trPlanName{font-family:var(--manga);font-weight:400;font-size:36px!important;letter-spacing:.04em;transform:skewX(-6deg)}
#trRounds li{border-bottom:2px dashed #2a2a2e}
#trRounds li .n{font-family:var(--manga);font-weight:400;font-size:21px;background:var(--red);color:#fff;border-radius:3px;transform:skewX(-8deg)}
#trRounds li b{font-family:var(--manga);font-weight:400;font-size:22px;letter-spacing:.04em}
/* live: speed lines while you fight, screentone while you rest or get ready */
#trLive .clock{border:3px solid var(--paper);border-radius:6px;background:#0b0b0d}
#trLive .clock.fight{border-color:var(--red)}#trLive .clock.rest{border-color:var(--ippo)}#trLive .clock.ready{border-color:var(--gold)}
#trLive .clock::before{content:"";position:absolute;inset:-60%;z-index:0;pointer-events:none;opacity:0;transition:opacity .4s}
#trLive .clock.fight::before{opacity:1;background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(255,255,255,.075) 0 1deg,transparent 1deg 5deg);animation:speed 1.2s steps(3) infinite}
#trLive .clock.rest::before{opacity:1;background:radial-gradient(circle,rgba(124,196,255,.16) 1.4px,transparent 1.8px) 0 0/10px 10px}
#trLive .clock.ready::before{opacity:1;background:radial-gradient(circle,rgba(255,210,63,.14) 1.4px,transparent 1.8px) 0 0/10px 10px}
@keyframes speed{to{transform:rotate(6deg)}}
#trLive .clock > *{position:relative;z-index:1}
#trLive .time{font-family:var(--manga);font-weight:400;font-size:clamp(100px,30vw,170px);letter-spacing:.03em;color:var(--paper);text-shadow:5px 5px 0 #000,8px 8px 0 var(--red);transform:skewX(-5deg);line-height:.95}
#trLive .clock.rest .time{text-shadow:5px 5px 0 #000,8px 8px 0 var(--ippo)}
#trLive .clock.burn .time{color:var(--red);text-shadow:5px 5px 0 #000,8px 8px 0 var(--gold)}
#trLive .phase{font-family:var(--manga);font-weight:400;font-size:36px;letter-spacing:.07em;transform:skewX(-8deg);-webkit-text-stroke:1px #000}
#trLive .clock.fight .phase{color:var(--gold)}
#trLive .theme{border-left-color:var(--red)}
#trLive .theme b{font-family:var(--manga);font-weight:400;font-size:26px;letter-spacing:.05em}
#trLive .callout{min-height:64px}
#trLive .callout .c{font-family:var(--manga);font-weight:400;font-size:clamp(26px,7vw,36px);letter-spacing:.05em;background:var(--gold);color:#111;border:0;border-radius:0;padding:12px 18px 13px;
  clip-path:polygon(0 12%,8% 0,22% 10%,38% 0,52% 9%,68% 0,82% 8%,100% 0,94% 30%,100% 52%,92% 72%,100% 100%,78% 92%,60% 100%,44% 90%,26% 100%,10% 90%,0 100%,5% 66%,0 44%,6% 26%)}
#trLive .callout .c.k{background:var(--red);color:#fff}
#trLive .callout .c.d{background:var(--ippo);color:#111}
#trLive .callout .c.f{background:var(--green);color:#111}
#trLive .callout .c small{color:inherit;font-family:var(--body)}
#trLive .callout .msg{font-family:var(--manga);font-weight:400;letter-spacing:.05em;color:var(--paper)}
#trLive .callout .go{font-family:var(--manga);font-weight:400;color:var(--gold);text-shadow:4px 4px 0 var(--red);-webkit-text-stroke:2px #000}
#trLive .nextc b{font-family:var(--manga);font-weight:400;font-size:18px;letter-spacing:.05em;color:var(--paper)}
#trLive .rdots i{border-radius:2px;transform:skewX(-12deg);width:16px}
#trLive .rbar{height:9px;border-radius:0;border:2px solid #000;background:#222}
.sfxlayer{position:absolute!important;inset:0;z-index:3!important;pointer-events:none;overflow:hidden}
.sfx{position:absolute;font-family:var(--kana);font-size:clamp(44px,13vw,72px);color:var(--gold);-webkit-text-stroke:2px #000;text-shadow:4px 4px 0 var(--red);white-space:nowrap;opacity:0;transform:rotate(var(--r,0deg)) scale(.4);animation:sfx .75s cubic-bezier(.2,1.6,.4,1) forwards}
.sfx.en{font-family:var(--manga);font-size:clamp(70px,22vw,120px);color:var(--paper);text-shadow:6px 6px 0 var(--red)}
@keyframes sfx{0%{opacity:0;transform:rotate(var(--r)) scale(.4)}25%{opacity:1;transform:rotate(var(--r)) scale(1.15)}70%{opacity:1;transform:rotate(var(--r)) scale(1)}100%{opacity:0;transform:rotate(var(--r)) scale(1.05)}}
#trLive .clock.burn::after{content:"ゴゴゴゴ";position:absolute;right:8px;top:30%;z-index:2;font-family:var(--kana);font-size:38px;color:rgba(232,64,47,.6);writing-mode:vertical-rl;pointer-events:none;animation:menace .25s steps(2) infinite}
@keyframes menace{50%{transform:translate(2px,-2px)}}
@media (max-width:420px){.sth,.str{`);

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
if (h.slice(sStart + 9, sEnd).indexOf("</") >= 0) throw new Error("raw </ in script");
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("manga train applied");
