// One look for the whole app: "hope in the darkness of battle".
// The cinematic Train look (BOXRAW mood + quiet Hajime no Ippo touches) becomes the theme everywhere:
// teal-black backgrounds with a warm window-light glow and film grain, Bebas Neue titles, tracked small-caps labels,
// off-white buttons, hairline cards. Warm light (amber) marks "you are here" and progress; blood red is the fight
// accent; teal is rest; soft green is done. The 3D coach's gym gets the same palette and warm rim light.
// Run once: node tools/patches/2026-10-28-one-look.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("One look for the whole app")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 90)); h = h.replace(a, b); };

// ---------------- 3D coach: same palette, warm window light ----------------
rep("scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x1a1d2a, .6));", "scene.add(new THREE.HemisphereLight(0xe8ecea, 0x0f1719, .6));");
rep("const rim = new THREE.DirectionalLight(0x6f9bff, .35);", "const rim = new THREE.DirectionalLight(0xffd9a3, .4);");
rep("new THREE.GridHelper(3.2, 16, 0x2c3450, 0x222a40)", "new THREE.GridHelper(3.2, 16, 0x24363a, 0x18252a)");
rep("mFloor:new THREE.MeshStandardMaterial({color:0x161b2b, roughness:.95})", "mFloor:new THREE.MeshStandardMaterial({color:0x111a1c, roughness:.95})");
rep("new THREE.MeshBasicMaterial({color:0xe8402f, transparent:true, opacity:.5})", "new THREE.MeshBasicMaterial({color:0xc8321f, transparent:true, opacity:.5})");

// ---------------- the shared theme, appended last so it wins ----------------
rep("</style>", String.raw`/* ===== One look for the whole app: hope in the darkness of battle ===== */
:root{
  --bg:#070a0b; --mat:#0f1719; --mat-2:#1a2528; --line:rgba(233,230,223,.09); --fg:#e9e6df; --muted:#8e9a99;
  --acc:#d9b27c;          /* window light: the one warm colour, for "you are here" and progress */
  --gold:#d9b27c; --red:#c8321f; --red-deep:#8f2416; --blue:#6f9a9b; --ok:#6fae86; --green:#5fae7e;
  --display:"Bebas Neue","Oswald",Impact,sans-serif;
  --card:linear-gradient(160deg,#111b1d,#0a0e0f);
  font-synthesis:none;
}
html{background:#050607}
body{background:radial-gradient(90% 50% at 88% -6%,rgba(217,178,124,.09),transparent 62%),radial-gradient(70% 45% at 0% 0%,rgba(111,154,155,.07),transparent 60%),linear-gradient(180deg,#0b1314 0%,#070a0b 38%,#050607 100%) fixed #050607}
body::after{content:"";position:fixed;inset:0;background:var(--grain);opacity:.05;pointer-events:none;z-index:150}
a{color:var(--acc)}
:focus-visible{outline-color:var(--acc)}

/* type: tall condensed titles, tracked small caps, the phone's own font for reading */
h1,h2,h3,.brand,.rank-name,.section-head h2,.pghead h2,.dayhead h2,.next-name,.card .nm,.belt h3,.tier b,.plan b,.preset b,.rotbtn b,.badge b,.stat b,.sumstats b,.lesson h2,.summary h3,.core .hd b,.coreex b,.coreclock .ct,.coreclock .cp b,.exhead b,.pvlist b,.rtitle,.streak,.week2 .big,.toast.big,.bigcode,.medal,.steps li::before,#codeIn{font-family:var(--display);font-weight:400;text-transform:uppercase;letter-spacing:.05em}
.label,.sub,.belt .lvl,.vid .cap .kind,.streak small,.sth,.pth,.wkstats span,.pfstats span,.fstats span,.tb span{letter-spacing:.2em;text-transform:uppercase;font-size:11px;font-weight:600}
.label,.sub{color:var(--muted)}
.sub{font-size:12px;letter-spacing:.28em;color:rgba(233,230,223,.55)}
.pghead h2{font-size:46px;letter-spacing:.05em}
.section-head h2{font-size:46px}
.dayhead h2{font-size:28px}.dayhead.live h2{font-size:22px}

/* header and tab bar */
.top{background:rgba(7,10,11,.86);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom-color:var(--line)}
.brand{font-size:30px;letter-spacing:.08em}
.brand i{width:4px;height:24px;background:var(--red);transform:skewX(-14deg)}
.rank-name{color:var(--acc);font-size:22px}
.xpbar{background:rgba(255,255,255,.07);height:4px}
.xpbar b{background:linear-gradient(90deg,var(--acc),#f2d7ae)}
.tabs{background:rgba(255,255,255,.04);border-color:var(--line)}
.tab[aria-selected="true"]{background:var(--fg);color:#0a0c0d}
.tabbar{background:rgba(9,13,14,.88);border-color:var(--line)}
.tb{font-size:10px}
.tb[aria-current="page"]{color:var(--acc);background:rgba(217,178,124,.12)}

/* buttons and chips */
.btn{background:var(--fg);color:#0a0c0d;font-weight:700;font-size:13px;letter-spacing:.2em;text-transform:uppercase;border-radius:10px}
.btn:hover{background:#fff}
.btn.blue{background:var(--fg);color:#0a0c0d}.btn.blue:hover{background:#fff}
.btn.gold{background:var(--acc);color:#1a1206}.btn.gold:hover{background:#e6c391}
.btn.ghost{background:transparent;color:var(--fg);border:1px solid rgba(233,230,223,.22)}
.btn.ghost:hover{border-color:var(--fg);background:transparent}
.btn.sm{font-size:11px;letter-spacing:.16em}
.chip{background:transparent;border-color:var(--line);color:var(--fg)}
.chip[aria-pressed="true"],.seg[aria-pressed="true"]{background:var(--fg);color:#0a0c0d;border-color:var(--fg)}
.seg{background:rgba(255,255,255,.06)}
.linkbtn{color:var(--acc)}
.roundbtn{background:rgba(255,255,255,.07)}

/* surfaces: hairline cards with a dark teal gradient */
.panel,.rcard,.card,.stat,.badge,.tier,.vid,.plan button,.preset,.list li,.drill,.week2 .plan7 div,.sheet{background:var(--card);border:1px solid var(--line)}
.panel,.rcard{border-radius:14px}
.rcard{position:relative;padding-left:22px}
.rcard::before{content:"";position:absolute;left:0;top:18px;bottom:18px;width:3px;border-radius:0 3px 3px 0;background:var(--red)}
.rcard:nth-child(even)::before{background:var(--blue)}
.rtitle{font-size:31px;color:var(--fg)}
.rthemes span{background:transparent;border:1px solid var(--line);color:rgba(233,230,223,.7);border-radius:999px;font-size:11px;letter-spacing:.14em;text-transform:uppercase}
.nx{background:rgba(217,178,124,.14);color:var(--acc);letter-spacing:.12em;text-transform:uppercase;font-size:10px}
.nx.live{background:rgba(95,174,126,.16);color:var(--green)}
.livebar{background:rgba(217,178,124,.1);border:1px solid rgba(217,178,124,.25)}
.sheet,#acctDlg{background:linear-gradient(160deg,#121d20,#0a0e0f)!important;border:1px solid var(--line)!important}
.toast{background:var(--fg);color:#0a0c0d}
.toast.big{background:var(--acc);color:#1a1206;font-size:24px}
.toast.xp{background:var(--red);color:#fff}

/* Learn: the hero becomes a lit panel; belts keep their colours, shaded like cloth */
.hero{background:radial-gradient(110% 80% at 90% -10%,rgba(217,178,124,.16),transparent 55%),linear-gradient(160deg,#16262a 0%,#0b1113 55%,#050607 100%);border:1px solid var(--line);border-radius:18px}
.hero::before{display:none}
.hero::after{inset:0;width:auto;background:var(--grain);opacity:.1;pointer-events:none}
.hero-copy h1{font-size:clamp(52px,8vw,92px);letter-spacing:.04em;line-height:.92}
.hero-copy h1 em{color:var(--red)}
.hero-copy p{color:rgba(233,230,223,.66)}
.stage3d,.thumb{background:radial-gradient(ellipse at 50% 85%,#1d2d30,#0a0f10 72%)}
.turnhud{background:rgba(6,9,10,.7)}
.belt{background:linear-gradient(90deg,var(--belt),color-mix(in srgb,var(--belt) 72%,#000));border-radius:10px}
.belt h3{font-size:28px}
.card .nm{font-size:25px}
.card.next{border-color:var(--red);box-shadow:0 0 0 1px var(--red)}
.card.next::before{background:var(--red)}
.card.mastered{border-color:rgba(217,178,124,.6)}
.next-name{font-size:34px}
.day span{background:rgba(255,255,255,.05);border-color:var(--line)}
.day.on span{background:var(--red);border-color:var(--red)}
.pip{background:rgba(255,255,255,.06)}

/* lesson */
dialog.lesson{background:#090d0e}
.lesson-left{background:linear-gradient(170deg,#101a1c,#090d0e)}
.lesson h2{font-size:52px}
.tier.done{border-color:rgba(217,178,124,.6);background:linear-gradient(160deg,rgba(217,178,124,.12),#0a0e0f)}
input.tick:checked{background:var(--acc);border-color:var(--acc)}
.closebtn{background:rgba(255,255,255,.06)}

/* workout: titles in the light, done in green, the clock in warm light */
.exn b{color:var(--fg);font-weight:600}
.str.done{background:rgba(95,174,126,.14)}
.ck:checked{background:var(--green)}
.pill{background:rgba(255,255,255,.06)}
.pill[aria-pressed="true"]{background:rgba(217,178,124,.14);color:var(--acc)}
.dayhead.live{background:rgba(7,10,11,.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom-color:var(--line)}
.wkstats b{font-family:var(--display);font-weight:400;font-size:24px;letter-spacing:.04em}
.str input[type=number]{background:rgba(255,255,255,.05);border-color:var(--line)}
.addset,.rmset,.discard{background:rgba(255,255,255,.05)}
.core{border-color:rgba(111,154,155,.5);background:linear-gradient(160deg,rgba(111,154,155,.1),#0a0e0f)}
.tip{background:rgba(255,255,255,.03)}

/* profile */
.pfav{background:radial-gradient(circle at 70% 20%,rgba(217,178,124,.35),transparent 60%),linear-gradient(135deg,#22363a,#0b1113);border:1px solid rgba(217,178,124,.45);color:var(--acc);font-family:var(--display);font-weight:400;font-size:38px}
.pfstats b,.fstats b{font-family:var(--display);font-weight:400;font-size:22px;letter-spacing:.04em}
.vchart .gl{border-top-color:rgba(233,230,223,.08)}
.savecard{background:radial-gradient(100% 120% at 100% 0%,rgba(217,178,124,.14),transparent 60%),var(--card)}
.badge.got .medal{background:radial-gradient(circle at 35% 30%,#f2d7ae,var(--acc) 55%,#8a6a3e);border-color:#f2d7ae;color:#2a1d0a}
.fcard{border-top-color:var(--line)}
</style>`);

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
if (h.slice(sStart + 9, sEnd).indexOf("</") >= 0) throw new Error("raw </ in script");
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("one look applied");
