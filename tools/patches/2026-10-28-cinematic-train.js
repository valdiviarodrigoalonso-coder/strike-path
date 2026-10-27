// Train look, take two: the cinematic mood of BOXRAW's "Strike. Different." (dark teal-black, soft window light,
// film grain, tall condensed type, tracked small caps, one blood-red accent) with quiet Hajime no Ippo touches:
// a faint vertical 一歩 ("one step"), barely-there manga speed lines that flash on each combo, katakana impact marks
// as ghosted watermarks, and a slow ゴゴゴ during burnout. Replaces the cartoony manga styling.
// Run once: node tools/patches/2026-10-28-cinematic-train.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("Train: cinematic fight-camp mood")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 90)); h = h.replace(a, b); };

// ---------------- fonts ----------------
{
  const a = h.indexOf('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bangers&display=swap">\n');
  const b = h.indexOf("\n", h.indexOf('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One')) + 1;
  if (a < 0 || b <= a) throw new Error("font links not found");
  const KANA = "一歩ドンバシッキュビズーゴ";
  h = h.slice(0, a) + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap">\n' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@800&display=swap&text=' + encodeURIComponent(KANA) + '">\n' + h.slice(b);
}

// ---------------- banner ----------------
rep('<div class="pghead trhero"><div><span class="kana" aria-hidden="true">ドン!</span><h2>Bag Work</h2><p>Hit it until your fists remember.</p></div>',
    '<div class="pghead trhero"><span class="kana" aria-hidden="true">一歩</span><div><span class="eyebrow">Strike Path · Fight camp</span><h2>Bag Work</h2><p>One step at a time. Then one more round.</p></div>');

// ---------------- round title card instead of a comic FIGHT!, and an impact flash on each combo ----------------
rep('if (!stale) popSfx("FIGHT!", "en");', 'if (!stale) popSfx("Round " + sg.round, "en");');
rep("  L.appendChild(s); setTimeout(() => s.remove(), 800);\n}",
    "  L.appendChild(s); setTimeout(() => s.remove(), 1300);\n  // the faint speed lines flash for a moment, like an impact frame in a boxing manga\n  if (!cls) { const ck = $(\"clock\"); ck.classList.add(\"hit\"); setTimeout(() => ck.classList.remove(\"hit\"), 170); }\n}");

// ---------------- styles: swap the whole manga block ----------------
{
  const a = h.indexOf("/* ===== Train: boxing-manga flair"), b = h.indexOf("@media (max-width:420px){.sth,.str{", a);
  if (a < 0 || b < 0) throw new Error("manga css block not found");
  h = h.slice(0, a) + String.raw`/* ===== Train: cinematic fight-camp mood (teal-black, window light, film grain) with quiet Hajime no Ippo touches ===== */
:root{--cine:"Bebas Neue","Oswald",Impact,sans-serif;--kana:"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif;--paper:#e9e6df;--teal:#6f9a9b;--blood:#c8321f;
  --grain:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
#view-train{--line2:rgba(255,255,255,.09)}
#view-train .trhero{position:relative;overflow:hidden;align-items:flex-end;margin:16px 0 10px;padding:64px 20px 22px;border-radius:16px;border:1px solid var(--line2);
  background:radial-gradient(120% 90% at 88% -5%,rgba(233,230,223,.22),transparent 55%),linear-gradient(160deg,#17282b 0%,#0b1113 55%,#050607 100%)}
#view-train .trhero::after{content:"";position:absolute;inset:0;background:var(--grain);opacity:.13;pointer-events:none}
#view-train .trhero .eyebrow{display:block;font-size:11px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:rgba(233,230,223,.6)}
#view-train .trhero h2{font-family:var(--cine);font-weight:400;font-size:68px;letter-spacing:.06em;line-height:.9;color:var(--paper);margin-top:8px}
#view-train .trhero p{margin:8px 0 0;color:rgba(233,230,223,.62);font-size:14px}
#view-train .trhero .kana{position:absolute;right:64px;top:16px;font-family:var(--kana);font-weight:800;font-size:58px;line-height:1.05;writing-mode:vertical-rl;color:rgba(233,230,223,.11);pointer-events:none}
#view-train .trhero .roundbtn{position:relative;z-index:1;background:rgba(255,255,255,.08)}
#view-train .sub{font-size:12px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(233,230,223,.55);margin-top:30px}
#view-train .routines{gap:12px}
#view-train .rcard{position:relative;background:linear-gradient(160deg,#121b1d,#0a0c0d);border:1px solid var(--line2);border-radius:14px;padding-left:22px}
#view-train .rcard::before{content:"";position:absolute;left:0;top:18px;bottom:18px;width:3px;border-radius:0 3px 3px 0;background:var(--blood)}
#view-train .rcard:nth-child(even)::before{background:var(--teal)}
#view-train .rtitle{font-family:var(--cine);font-weight:400;font-size:31px;letter-spacing:.05em;color:var(--paper)}
#view-train .rthemes span{background:transparent;border:1px solid var(--line2);color:rgba(233,230,223,.7);border-radius:999px;font-size:11px;letter-spacing:.14em;text-transform:uppercase}
#view-train .nx{background:rgba(233,230,223,.1);color:var(--paper);letter-spacing:.12em;text-transform:uppercase;font-size:10px}
#view-train .btn.blue{background:var(--paper);color:#0b0b0b;font-weight:700;font-size:13px;letter-spacing:.24em;text-transform:uppercase;border-radius:10px;padding:14px}
#view-train .btn.blue:hover{background:#fff}
#view-train .btn.ghost{border:1px solid rgba(233,230,223,.25);border-radius:10px;letter-spacing:.14em;text-transform:uppercase;font-size:12px}
#view-train .panel{background:linear-gradient(160deg,#121b1d,#0a0c0d);border:1px solid var(--line2);border-radius:14px}
#view-train .bars .b i{background:var(--blood)}
#trPlanName{font-family:var(--cine);font-weight:400;font-size:40px!important;letter-spacing:.06em}
#trRounds li{border-bottom:1px solid var(--line2)}
#trRounds li .n{font-family:var(--cine);font-weight:400;font-size:20px;background:transparent;border:1px solid rgba(233,230,223,.25);color:var(--paper)}
#trRounds li b{font-family:var(--cine);font-weight:400;font-size:23px;letter-spacing:.05em}
/* live: dark and quiet, faint speed lines that flash on impact, screentone while you rest */
#trLive .clock{border:1px solid var(--line2);border-radius:18px;background:radial-gradient(110% 70% at 82% -12%,rgba(233,230,223,.13),transparent 60%),linear-gradient(170deg,#15221f,#090c0d 60%,#050606)}
#trLive .clock::after{content:"";position:absolute;inset:0;background:var(--grain);opacity:.1;pointer-events:none;z-index:0}
#trLive .clock.fight{border-color:rgba(200,50,31,.5)}#trLive .clock.rest{border-color:rgba(111,154,155,.5)}#trLive .clock.ready{border-color:rgba(233,230,223,.3)}
#trLive .clock::before{content:"";position:absolute;inset:-60%;z-index:0;pointer-events:none;opacity:0;transition:opacity .5s}
#trLive .clock.fight::before{opacity:1;background:repeating-conic-gradient(from 0deg at 50% 40%,rgba(233,230,223,.03) 0 .5deg,transparent .5deg 4deg)}
#trLive .clock.fight.hit::before{background:repeating-conic-gradient(from 0deg at 50% 40%,rgba(233,230,223,.1) 0 .5deg,transparent .5deg 4deg);transition:none}
#trLive .clock.burn::before{opacity:1;background:repeating-conic-gradient(from 0deg at 50% 40%,rgba(200,50,31,.09) 0 .5deg,transparent .5deg 4deg)}
#trLive .clock.rest::before{opacity:1;background:radial-gradient(circle,rgba(111,154,155,.1) 1px,transparent 1.4px) 0 0/8px 8px}
#trLive .clock > *{position:relative;z-index:1}
#trLive .time{font-family:var(--cine);font-weight:400;font-size:clamp(124px,38vw,210px);letter-spacing:.02em;color:var(--paper);line-height:.85}
#trLive .clock.burn .time{color:var(--blood)}
#trLive .phase{font-family:var(--body);font-size:12px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:rgba(233,230,223,.6)}
#trLive .clock.fight .phase{color:var(--blood)}#trLive .clock.rest .phase{color:var(--teal)}
#trLive .label{letter-spacing:.14em;text-transform:uppercase;font-size:11px}
#trLive .theme{border-left:2px solid var(--blood)}#trLive .clock.rest .theme{border-left-color:var(--teal)}
#trLive .theme b{font-family:var(--cine);font-weight:400;font-size:28px;letter-spacing:.06em;text-transform:uppercase}
#trLive .theme span{color:rgba(233,230,223,.6)}
#trLive .callout{min-height:62px}
#trLive .callout .c{font-family:var(--cine);font-weight:400;font-size:clamp(28px,8vw,40px);letter-spacing:.06em;background:rgba(233,230,223,.04);color:var(--paper);border:1px solid rgba(233,230,223,.32);border-radius:8px;padding:8px 14px 6px;line-height:1}
#trLive .callout .c b{font-size:1.25em}
#trLive .callout .c small{font-family:var(--body);font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;opacity:.65;margin-top:3px}
#trLive .callout .c.k{background:var(--blood);border-color:var(--blood);color:#fff}
#trLive .callout .c.d{border-color:var(--teal);color:#c7e3e3}
#trLive .callout .c.f{border-style:dashed;color:rgba(233,230,223,.8)}
#trLive .callout .msg{font-family:var(--cine);font-weight:400;letter-spacing:.06em;color:var(--paper);font-size:clamp(26px,7vw,32px)}
#trLive .callout .go{font-family:var(--cine);font-weight:400;font-size:clamp(70px,20vw,110px);letter-spacing:.12em;color:var(--paper)}
#trLive .nextc{letter-spacing:.04em}
#trLive .nextc b{font-family:var(--cine);font-weight:400;font-size:20px;letter-spacing:.06em;color:var(--paper)}
#trLive .rdots i{width:20px;height:3px;border-radius:2px;background:rgba(255,255,255,.12)}
#trLive .rdots i.d{background:var(--paper)}#trLive .rdots i.c{background:var(--blood);box-shadow:none}
#trLive .rbar{height:3px;border:0;border-radius:2px;background:rgba(255,255,255,.08)}
#trLive .rbar i{background:var(--blood)}#trLive .clock.rest .rbar i{background:var(--teal)}#trLive .clock.ready .rbar i{background:var(--paper)}
#trLive .roundbtn{background:rgba(255,255,255,.07)}
.sfxlayer{position:absolute!important;inset:0;z-index:0!important;pointer-events:none;overflow:hidden}
.sfx{position:absolute;font-family:var(--kana);font-weight:800;font-size:clamp(110px,34vw,200px);color:rgba(233,230,223,.06);white-space:nowrap;opacity:0;animation:sfx 1.1s ease-out forwards}
@keyframes sfx{0%{opacity:0;transform:scale(1.06)}12%{opacity:1}100%{opacity:0;transform:scale(1)}}
.sfx.en{font-family:var(--cine);font-weight:400;font-size:clamp(54px,17vw,92px);letter-spacing:.14em;text-transform:uppercase;color:rgba(233,230,223,.85);left:0!important;right:0;top:32%!important;text-align:center;z-index:4;animation:titlecard 1.25s ease-out forwards}
@keyframes titlecard{0%{opacity:0;letter-spacing:.32em}25%{opacity:1}70%{opacity:1}100%{opacity:0;letter-spacing:.14em}}
#trLive .clock.burn .sfxlayer::after{content:"ゴゴゴ";position:absolute;right:14px;top:24%;font-family:var(--kana);font-weight:800;font-size:44px;writing-mode:vertical-rl;color:rgba(200,50,31,.24);animation:breathe 1.6s ease-in-out infinite}
@keyframes breathe{50%{opacity:.35}}
` + h.slice(b);
}

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
if (h.slice(sStart + 9, sEnd).indexOf("</") >= 0) throw new Error("raw </ in script");
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("cinematic train applied");
