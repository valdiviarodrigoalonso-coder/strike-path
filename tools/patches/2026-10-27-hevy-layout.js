// Hevy-style layout: black canvas, gray cards, one blue accent, bottom tab bar on phones,
// routine cards -> routine page -> live log with a Set / Previous / Weight / Reps / ✓ table,
// warm-up sets, per-exercise rest and notes, a Profile with a weekly chart and a workout feed.
// Also makes the transfer-code box friendlier on phones and shows the real error when a code fails.
// Run once: node tools/patches/2026-10-27-hevy-layout.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("function renderFeed(")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 80)); h = h.replace(a, b); };

// Find a top-level function by name and return [start, end) using quote-aware brace matching.
function fnRange(name) {
  const start = h.indexOf("\nfunction " + name + "(");
  if (start < 0) throw new Error("no function " + name);
  let i = h.indexOf("{", start), depth = 0, q = null;
  for (; i < h.length; i++) {
    const c = h[i];
    if (q) { if (c === "\\") { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return [start + 1, i + 1];
  }
  throw new Error("unbalanced " + name);
}
const replaceFn = (name, code) => { const [a, b] = fnRange(name); h = h.slice(0, a) + code.trim() + h.slice(b); };

// ---------------- fonts: the system font, like a native app ----------------
rep('<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;800;900&family=Barlow:wght@400;500;600;700&display=swap">\n', "");

// ---------------- styles ----------------
rep("</style>", String.raw`
/* ===== Hevy-style layout: black canvas, gray cards, one blue accent, bottom tab bar on phones ===== */
:root{--bg:#000;--mat:#1c1c1e;--mat-2:#2c2c2e;--line:#2c2c2e;--fg:#fff;--muted:#8e8e93;--acc:#2f8cf6;--green:#34c759;--warm:#f5a623;
  --display:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,system-ui,sans-serif;
  --body:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,system-ui,sans-serif}
h1,h2,h3,.exhead b,.rotbtn b,.pvlist b,.plan b,.preset b,.theme b,.core .hd b,.coreex b,.coreclock .cp b,.badge b,.belt h3,.summary h3,.toast.big,.rank-name,.brand,.tab{text-transform:none;letter-spacing:-.01em}
.label{letter-spacing:0;text-transform:none;font-size:13px;font-weight:600}
.btn{text-transform:none;letter-spacing:0;border-radius:10px;font-weight:600}
.btn.blue{background:var(--acc);color:#fff}.btn.blue:hover{background:#4a9cff}
.btn.full{width:100%;padding:12px}
.acc{color:var(--acc)}
#view-lift,#view-trophies{max-width:720px;margin-inline:auto}
.restbar{border-color:var(--acc)}.restbar b{color:var(--acc)}

/* bottom tab bar (phones) */
.tabbar{display:none}
.tb{display:flex;flex-direction:column;align-items:center;gap:2px;border:0;background:none;color:var(--muted);font-size:11px;font-weight:600;padding:6px 14px;border-radius:999px;cursor:pointer;min-width:66px}
.tb svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.tb[aria-current="page"]{color:var(--acc);background:rgba(47,140,246,.16)}
@media (max-width:860px){
  .top{position:static}
  .top .tabs{display:none}
  body{padding-bottom:calc(100px + env(safe-area-inset-bottom,0px))}
  .tabbar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:80;display:flex;gap:2px;padding:5px;border-radius:999px;background:rgba(30,30,32,.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.08);box-shadow:0 8px 30px rgba(0,0,0,.6)}
  .restbar,.toasts{bottom:calc(86px + env(safe-area-inset-bottom,0px))}
}

/* page headers and small buttons */
.pghead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:22px 0 12px}
.pghead h2{font-size:30px;font-weight:800}
.sub{display:block;margin:24px 0 10px;color:var(--muted);font-size:14px;font-weight:600}
.roundbtn{width:38px;height:38px;border-radius:50%;border:0;background:var(--mat);color:var(--fg);display:grid;place-items:center;cursor:pointer;flex:none;padding:0}
.roundbtn svg,.pill svg,.restline svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.roundbtn.sm{width:32px;height:32px;background:transparent;color:var(--muted)}
.linkbtn{border:0;background:none;color:var(--acc);font-weight:600;font-size:16px;cursor:pointer;padding:6px 4px}

/* routine cards */
.routines{display:flex;flex-direction:column;gap:12px}
.rcard{background:var(--mat);border-radius:14px;padding:14px 16px 16px;display:flex;flex-direction:column;gap:6px;cursor:pointer}
.rch{display:flex;align-items:center;gap:8px;min-height:32px}
.rtitle{border:0;background:none;padding:0;font-size:19px;font-weight:700;color:var(--fg);cursor:pointer;text-align:left}
.rch .roundbtn{margin-left:auto}
.rcl{margin:0;color:var(--muted);font-size:14px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rcard small{font-size:13px}
.rcard .btn{margin-top:6px}
.nx{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(47,140,246,.18);color:var(--acc);white-space:nowrap}
.nx.live{background:rgba(52,199,89,.18);color:var(--green)}
.livebar{width:100%;display:flex;align-items:center;gap:10px;justify-content:space-between;border:0;border-radius:14px;padding:14px 16px;background:rgba(47,140,246,.14);color:var(--fg);font-size:15px;cursor:pointer;margin-bottom:4px;text-align:left}
.fitbox{margin-top:22px}.fitbox summary{cursor:pointer;font-weight:600}.fitbox ul{margin-top:12px}

/* routine page and live log */
.dayhead{display:flex;align-items:center;gap:10px;margin:18px 0 12px;flex-wrap:wrap}
.dayhead h2{font-size:22px;font-weight:700;flex:1;min-width:0}
.dayhead.live{position:sticky;top:calc(env(safe-area-inset-top,0px) + var(--hdr,0px));z-index:15;background:var(--bg);margin:0 -16px 6px;padding:10px 16px 10px;border-bottom:1px solid var(--mat)}
.dayhead.live h2{font-size:17px}
.dayhead .btn.sm{padding:8px 16px;font-size:15px}
.wkstats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%;padding-top:4px}
.wkstats span{display:block;font-size:12px;color:var(--muted)}
.wkstats b{font-size:17px;font-weight:600;font-variant-numeric:tabular-nums}
.pvmeta{margin:8px 0 4px;font-size:14px;text-align:center}
.ex.hv{background:transparent;border:0;border-radius:0;padding:10px 0 18px;border-bottom:1px solid var(--mat);gap:10px}
.ex.hv.complete{border-color:var(--mat)}
.exh{display:flex;align-items:center;gap:10px}
.exn{flex:1;min-width:0}
.exn b{display:block;color:var(--acc);font-size:17px;font-weight:600;line-height:1.25}
.exn div{margin-top:3px}
.exh .tgt{font-size:12px;color:var(--muted);font-weight:600;white-space:nowrap}
.av{flex:none;width:42px;height:42px;border-radius:50%;background:#f2f2f7;color:#111;display:grid;place-items:center;font-size:13px;font-weight:800}
.ex.complete .av{background:var(--green);color:#fff}
.restline{display:flex;align-items:center;gap:6px;font-size:14px;color:var(--muted)}
.restline svg{width:16px;height:16px}
.pills{display:flex;gap:8px;flex-wrap:wrap}
.pill{display:inline-flex;align-items:center;gap:6px;background:var(--mat);border:0;border-radius:10px;padding:7px 11px;font-size:14px;font-weight:500;color:var(--fg);cursor:pointer}
.pill svg{width:16px;height:16px}
.pill select{appearance:none;-webkit-appearance:none;background:transparent;border:0;color:var(--fg);font:inherit;padding:0;cursor:pointer}
.pill select option{background:var(--mat)}
.pill[aria-pressed="true"]{background:rgba(47,140,246,.18);color:var(--acc)}
.exnote{width:100%;min-height:44px;background:var(--mat);border:0;border-radius:10px;padding:10px 12px;color:var(--fg);font:inherit;font-size:16px;resize:vertical}
.sugg2{font-size:13px;color:var(--muted)}
.stbl{display:flex;flex-direction:column;gap:3px}
.sth,.str{display:grid;grid-template-columns:30px minmax(0,1fr) 70px 58px 38px;gap:8px;align-items:center}
.sth{font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;padding:0 6px 2px}
.sth span:nth-child(n+3){text-align:center}
.str{padding:4px 6px;border-radius:8px;transition:background .15s}
.str.done{background:rgba(52,199,89,.17)}
.sn{border:0;background:none;color:var(--fg);font-weight:700;font-size:15px;cursor:pointer;padding:6px 0;border-radius:6px}
.str.warm .sn{color:var(--warm)}
.prev{font:inherit;font-size:14px;color:var(--muted);border:0;background:none;text-align:left;cursor:pointer;padding:6px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.prev[disabled]{cursor:default}
.str input[type=number]{width:100%;min-width:0;background:var(--mat);border:1px solid var(--mat-2);border-radius:8px;padding:8px 2px;text-align:center;font-weight:600;font-size:16px;color:var(--fg);font-variant-numeric:tabular-nums;-moz-appearance:textfield}
.str input[type=number]::-webkit-inner-spin-button,.str input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.str input[type=number]:focus{outline:none;border-color:var(--acc)}
.str.done input[type=number]{background:transparent;border-color:transparent}
.ck{appearance:none;-webkit-appearance:none;width:34px;height:34px;margin:0;border-radius:8px;background:var(--mat-2);cursor:pointer;display:grid;place-items:center;justify-self:center}
.ck::after{content:"";width:13px;height:7px;border-left:2.5px solid var(--muted);border-bottom:2.5px solid var(--muted);transform:translateY(-2px) rotate(-45deg)}
.ck:checked{background:var(--green)}.ck:checked::after{border-color:#fff}
.addrow{display:flex;gap:8px}
.addset{flex:1;border:0;border-radius:10px;background:var(--mat);color:var(--fg);font-weight:600;font-size:15px;padding:10px;cursor:pointer}
.rmset{width:48px;border:0;border-radius:10px;background:var(--mat);color:var(--muted);font-size:20px;cursor:pointer}
.discard{width:100%;margin-top:18px;border:0;border-radius:10px;background:var(--mat);color:#ff453a;font-weight:600;font-size:15px;padding:12px;cursor:pointer}
.ptbl{display:flex;flex-direction:column}
.pth,.ptr{display:grid;grid-template-columns:44px 1fr 1fr;gap:8px;padding:7px 10px;font-size:15px;font-variant-numeric:tabular-nums}
.pth{font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase}
.ptr:nth-child(even){background:var(--mat);border-radius:8px}
.ptr .w{color:var(--warm);font-weight:700}
.sheet{border:0;border-radius:16px;background:var(--mat);color:var(--fg);padding:18px;width:min(460px,100% - 24px);max-height:85vh;overflow:auto}
.sheet::backdrop{background:rgba(0,0,0,.6)}
.sheet .chip{background:var(--mat-2)}
.sheethd{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}
.sheethd h3{font-size:19px;font-weight:700}

/* profile */
.pfhead{display:flex;align-items:center;gap:16px}
.pfav{width:76px;height:76px;border-radius:50%;display:grid;place-items:center;font-size:28px;font-weight:800;background:linear-gradient(135deg,var(--acc),#1a4fa3);color:#fff;flex:none}
.pfhead > div > b{font-size:20px;font-weight:700;display:block}
.pfstats{display:flex;gap:24px;margin-top:6px}
.pfstats span{display:block;font-size:13px;color:var(--muted)}.pfstats b{font-size:17px;font-weight:600}
.chartcard{display:flex;flex-direction:column;gap:14px;margin-top:20px}
.chartcard .hd{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
.chartcard .hd b{font-size:18px}
.vchart{position:relative;height:170px;margin:6px 0 24px 46px}
.vchart .gl{position:absolute;left:0;right:0;border-top:1px dashed #3a3a3c}
.vchart .gl span{position:absolute;right:calc(100% + 8px);top:-8px;font-size:11px;color:var(--muted);white-space:nowrap}
.vbars{position:absolute;inset:0;display:flex;align-items:flex-end;gap:5px}
.vbars > div{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;position:relative;min-width:0}
.vbars i{display:block;background:var(--acc);border-radius:3px 3px 0 0;min-height:2px}
.vbars i.z{background:var(--mat-2)}
.vbars em{position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%);font-style:normal;font-size:11px;color:var(--muted);white-space:nowrap}
.segs{display:flex;gap:8px;flex-wrap:wrap}
.seg{border:0;border-radius:999px;padding:7px 14px;background:var(--mat-2);color:var(--fg);font-weight:600;font-size:14px;cursor:pointer}
.seg[aria-pressed="true"]{background:var(--acc);color:#fff}
.fcard{padding:16px 0;border-top:1px solid var(--mat)}
.fch{display:flex;align-items:center;gap:10px}
.fch b{display:block}.fch small{display:block;color:var(--muted);font-size:13px}
.fcard h4{margin:12px 0 8px;font-size:18px;font-weight:700}
.fstats{display:flex;gap:26px;flex-wrap:wrap}
.fstats span{display:block;font-size:12px;color:var(--muted)}.fstats b{font-weight:500;font-size:15px}
.fex{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:10px}
.fex li{display:flex;align-items:center;gap:12px;font-size:15px}
.fex .av{width:36px;height:36px;font-size:12px}
.fmore{border:0;background:none;color:var(--muted);font-size:14px;padding:10px 0 0;cursor:pointer;width:100%;text-align:center}
.feedmore{width:100%;margin-top:6px}
@media (max-width:420px){.sth,.str{grid-template-columns:26px minmax(0,1fr) 62px 52px 36px;gap:6px}.pfstats{gap:16px}}
</style>`);

// ---------------- tabs: Learn / Train / Workout / Profile, plus the bottom bar ----------------
rep('data-view="path" aria-selected="true">Path</button>', 'data-view="path" aria-selected="true">Learn</button>');
rep('data-view="lift" aria-selected="false">Workouts</button>', 'data-view="lift" aria-selected="false">Workout</button>');
rep('data-view="trophies" aria-selected="false">Trophies</button>', 'data-view="trophies" aria-selected="false">Profile</button>');
rep('<div class="restbar" id="restBar" hidden>', String.raw`<nav class="tabbar" aria-label="Sections">
  <button class="tb" data-view="path" aria-current="page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg><span>Learn</span></button>
  <button class="tb" data-view="train" aria-current="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg><span>Train</span></button>
  <button class="tb" data-view="lift" aria-current="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6v12M17.5 6v12M3 9v6M21 9v6M6.5 12h11"/></svg><span>Workout</span></button>
  <button class="tb" data-view="trophies" aria-current="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg><span>Profile</span></button>
</nav>
<div class="restbar" id="restBar" hidden>`);

// ---------------- workout view ----------------
{
  const a = h.indexOf('  <section id="view-lift"'), b = h.indexOf("  <!-- TROPHIES -->");
  if (a < 0 || b < 0) throw new Error("workout section not found");
  h = h.slice(0, a) + String.raw`  <section id="view-lift" role="tabpanel" aria-labelledby="tab-lift" hidden>
    <div id="wkHome">
      <div class="pghead"><h2>Workout</h2><button class="roundbtn" id="wkSet" aria-label="Rest timer and units"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg></button></div>
      <div id="liveBanner"></div>
      <span class="sub" id="rotCount">My Routines</span>
      <div class="routines" id="rot"></div>
      <details class="fitbox panel"><summary>How lifting fits with kickboxing</summary><ul class="tips" id="fitList"></ul></details>
    </div>
    <div id="wkDay" hidden>
      <div class="dayhead" id="dayHead"></div>
      <div class="tip" id="liftTip"></div>
      <div class="timebar" id="liftTime"></div>
      <div class="exlist" id="exList"></div>
      <div id="coreBox"></div>
      <div class="liftfoot" hidden><span id="liftProgress"></span><button class="btn gold" id="finishLift">Finish workout</button></div>
    </div>
    <dialog class="sheet" id="wkSheet" aria-labelledby="sheetTitle">
      <div class="sheethd"><h3 id="sheetTitle">Workout settings</h3><button class="linkbtn" id="sheetClose">Done</button></div>
      <div class="row" style="justify-content:space-between;margin-bottom:12px"><span class="label">Weight units</span><div class="chips"><button class="chip" id="unitKg" aria-pressed="true">kg</button><button class="chip" id="unitLb" aria-pressed="false">lb</button></div></div>
      <div id="restPanel"></div>
    </dialog>
  </section>

` + h.slice(b);
}

// ---------------- profile view ----------------
rep('<div class="section-head" style="margin-top:24px"><h2>Trophy Case</h2><span class="label" id="badgeCount"></span></div>\n    <div class="stats" id="stats"></div>\n    <div class="badges" id="badges"></div>',
String.raw`<div class="pghead"><h2>Profile</h2></div>
    <div class="pfhead"><div class="pfav" id="pfAv" aria-hidden="true">R</div><div><b id="pfRank">Rookie</b><span class="muted" id="pfXp" style="font-size:14px"></span>
      <div class="pfstats"><div><span>Workouts</span><b id="pfW">0</b></div><div><span>Streak</span><b id="pfS">0</b></div><div><span>Records</span><b id="pfR">0</b></div></div></div></div>
    <div class="panel chartcard"><div class="hd"><b id="chTitle">0 hours this week</b><span class="muted" style="font-size:13px">Last 12 weeks</span></div><div class="vchart" id="chart"></div>
      <div class="segs" role="group" aria-label="Chart shows"><button class="seg" data-ch="dur">Duration</button><button class="seg" data-ch="vol">Volume</button><button class="seg" data-ch="reps">Reps</button></div></div>
    <span class="sub">This week</span>
    <div class="panel week2" id="weekCard"></div>
    <span class="sub">Workouts</span>
    <div id="feed"></div>
    <span class="sub">Trophies · <span id="badgeCount"></span></span>
    <div class="badges" id="badges" style="margin-top:0"></div>
    <span class="sub">Stats</span>
    <div class="stats" id="stats"></div>`);

// ---------------- transfer code box: friendlier on phones, real error text ----------------
rep('<input id="codeIn" maxlength="9" placeholder="K7Q-4MZ" autocomplete="off" autocapitalize="characters" spellcheck="false">',
    '<input id="codeIn" type="text" inputmode="text" enterkeyhint="go" maxlength="9" placeholder="K7Q-4MZ" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false">');
rep('$("codeNote").textContent = /PGRST202|create_transfer|function/i.test(m) ? "Short codes need one more setup step: run supabase/transfer.sql in your Supabase project." : "Couldn\'t make a code. Check your connection and try again.";',
    '$("codeNote").textContent = /PGRST202|create_transfer|function/i.test(m) ? "Short codes need one more setup step: run supabase/transfer.sql in your Supabase project." : "Couldn\'t make a code. Check your connection and try again. (" + m.trim() + ")";');
rep('} catch (e) { $("codeMsg").textContent = "Couldn\'t fetch that code. Check your connection and try again."; }',
    '} catch (e) { $("codeMsg").textContent = "Couldn\'t fetch that code. Check your connection and try again. (" + ((e && (e.message || e.code)) || "unknown error") + ")"; }');
rep('$("codeIn").addEventListener("input", ', '$("codeIn").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); $("codeUse").click(); } });\n$("codeIn").addEventListener("input", ');

// ---------------- data: warm-up sets, exercise notes, records per workout ----------------
rep("sets:e.sets.filter(Array.isArray).slice(0, 10).map(t => [Math.max(0, +t[0] || 0), clampN(t[1],0,1000,0), !!t[2]])})), core:clampN(x.core,0,6,0), min:clampN(x.min,0,300,0)}));",
    "sets:e.sets.filter(Array.isArray).slice(0, 10).map(t => [Math.max(0, +t[0] || 0), clampN(t[1],0,1000,0), !!t[2]].concat(t[3] ? [1] : []))}, e.note ? {note:str(e.note, 300)} : {})), core:clampN(x.core,0,6,0), min:clampN(x.min,0,300,0)}, x.pr ? {pr:clampN(x.pr,0,50,0)} : {}));");
rep("ex:x.ex.filter(e => e && typeof e.id === \"string\" && Array.isArray(e.sets)).map(e => ({id:e.id.slice(0, 20), n:str(e.n, 60), sets:",
    "ex:x.ex.filter(e => e && typeof e.id === \"string\" && Array.isArray(e.sets)).map(e => Object.assign({id:e.id.slice(0, 20), n:str(e.n, 60), sets:");
rep("s.lifts.logs = L.logs.filter(x => x && typeof x.d === \"string\" && DAYS3.includes(x.day) && Array.isArray(x.ex)).slice(-150).map(x => ({d:x.d, day:x.day,",
    "s.lifts.logs = L.logs.filter(x => x && typeof x.d === \"string\" && DAYS3.includes(x.day) && Array.isArray(x.ex)).slice(-150).map(x => Object.assign({d:x.d, day:x.day,");
// warm-up sets don't count toward history, progression or records
rep("function historyFor(id) { const out = []; S.lifts.logs.forEach(l => l.ex.forEach(e => { if (e.id === id && e.sets.some(s => s[2])) out.push({d:l.d, sets:e.sets.filter(s => s[2])}); })); return out; }",
    "function historyFor(id) { const out = []; S.lifts.logs.forEach(l => l.ex.forEach(e => { if (e.id === id && e.sets.some(s => s[2] && !s[3])) out.push({d:l.d, sets:e.sets.filter(s => s[2] && !s[3])}); })); return out; }");
rep("const done = sets.filter(s => s[2]), topW", "const done = sets.filter(s => s[2] && !s[3]), topW");
replaceFn("setsFor", String.raw`
function setsFor(ex) {
  const dd = (draft[liftDay] = draft[liftDay] || {}), key = logId(ex), sg = suggestion(ex);
  if (!Array.isArray(dd[key]) || !dd[key].length) dd[key] = Array.from({length:ex.s}, () => [sg.w, sg.r, false]);
  return dd[key];
}`);
rep("sets:(dd[logId(ex)] || []).map(s => [+s[0] || 0, +s[1] || 0, !!s[2]])})).filter(e => e.sets.some(s => s[2])), core:dd.__core || 0};",
    "sets:(dd[logId(ex)] || []).map(s => [+s[0] || 0, +s[1] || 0, !!s[2]].concat(s[3] ? [1] : [])), note:((dd.__notes || {})[logId(ex)] || \"\").trim().slice(0, 300) || undefined})).filter(e => e.sets.some(s => s[2])), core:dd.__core || 0};");
rep("  if (!log.ex.length && !log.core) return;\n", "  if (!log.ex.length && !log.core) { toast(\"Check off at least one set first\"); return; }\n");
rep("  S.lifts.logs.push(log); S.prs += prCount; markToday();", "  if (prCount) log.pr = prCount;\n  S.lifts.logs.push(log); S.prs += prCount; markToday();");
rep("  liftDay = nextLiftDay();\n  renderHUD(); renderHero(); renderTrophies(); renderLift();", "  liftDay = nextLiftDay(); wkScreen = \"home\"; openNotes.clear();\n  renderHUD(); renderHero(); renderTrophies(); renderLift(); scrollTo({top:0});");

// ---------------- clocks, header height, navigation ----------------
rep(String.raw`setInterval(() => {
  if (!startedAt() || liftDay === "run") return;
  const t = fmtClock((Date.now() - startedAt()) / 1000);
  const sw = $("swTime"); if (sw) sw.textContent = t;
  const lc = $("liftClock"); if (lc) lc.textContent = "Workout time " + t;
}, 1000);`, String.raw`// every running workout clock on screen carries data-since (its start time)
setInterval(() => { document.querySelectorAll("[data-since]").forEach(el => { el.textContent = fmtClock((Date.now() - +el.dataset.since) / 1000); }); }, 1000);`);
rep('const measureHeader = () => { const h = document.querySelector(".top"); if (h) document.documentElement.style.setProperty("--hdr", h.offsetHeight + "px"); };',
    'const measureHeader = () => { const h = document.querySelector(".top"); if (h) document.documentElement.style.setProperty("--hdr", (getComputedStyle(h).position === "sticky" ? h.offsetHeight : 0) + "px"); };');
rep('$("planLift").addEventListener("click", () => { liftDay = nextLiftDay(); renderLift(); showView("lift"); });',
    '$("planLift").addEventListener("click", () => { showView("lift"); openDay(liveDay() || nextLiftDay()); });');
rep('  VIEWS.forEach(x => { $("view-" + x).hidden = x !== v; $("tab-" + x).setAttribute("aria-selected", x === v ? "true" : "false"); });',
    '  VIEWS.forEach(x => { $("view-" + x).hidden = x !== v; $("tab-" + x).setAttribute("aria-selected", x === v ? "true" : "false"); });\n  document.querySelectorAll(".tb").forEach(b => b.setAttribute("aria-current", b.dataset.view === v ? "page" : "false"));');
rep('document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => showView(t.dataset.view)));',
    String.raw`// tapping Workout while already on it goes back to the routine list (a running workout keeps going)
document.querySelectorAll(".tab, .tb").forEach(t => t.addEventListener("click", () => {
  if (t.dataset.view === "lift" && !$("view-lift").hidden && wkScreen === "day") { wkScreen = "home"; editMode = false; renderLift(); }
  showView(t.dataset.view);
}));`);
rep('$("editProg").addEventListener("click", () => { editMode = !editMode; renderLift(); });\n', "");

// ---------------- routine list ----------------
replaceFn("renderRot", String.raw`
// ---- workout screens, laid out like Hevy: routine list -> routine page -> live log ----
function renderRot() {
  const nd = nextLiftDay(), lv = liveDay(), lastRun = S.runs[S.runs.length - 1], lastBag = S.sessions[S.sessions.length - 1];
  const card = (id, title, sub, list, btn, flag, edit) => '<div class="rcard" data-d="' + id + '"><div class="rch"><button class="rtitle">' + title + '<\/button>' + (flag || "") +
    (edit ? '<button class="roundbtn sm" data-edit="' + id + '" aria-label="Edit ' + title + ' routine">' + ICON.dots + '<\/button>' : "") + '<\/div>' +
    (list ? '<p class="rcl">' + esc(list) + '<\/p>' : "") + '<small class="muted">' + sub + '<\/small><button class="btn blue full" data-go="' + id + '">' + btn + '<\/button><\/div>';
  $("liveBanner").innerHTML = lv ? '<button class="livebar" data-go="' + lv + '"><span><b>Workout in progress<\/b><br><span class="muted">' + cap(lv) + ' · <span data-since="' + draft[lv].__start + '">' + fmtClock((Date.now() - draft[lv].__start) / 1000) + '<\/span><\/span><\/span><span class="acc">Resume ›<\/span><\/button>' : "";
  $("rotCount").textContent = "My Routines (" + (DAYS3.length + 2) + ")";
  $("rot").innerHTML = DAYS3.map(d => {
      const last = [...S.lifts.logs].reverse().find(l => l.day === d), m = dayMinutes(d), live = d === lv;
      return card(d, cap(d), (last ? "Last: " + niceDate(last.d) : "Not done yet") + " · about " + (m.lift + m.warm + m.core) + " min", S.lifts.prog[d].map(e => e.n).join(", "),
        live ? "Resume Workout" : "Start Routine", live ? '<span class="nx live">In progress<\/span>' : d === nd && !lv ? '<span class="nx">Next up<\/span>' : "", true);
    }).join("") +
    card("run", "Run", lastRun ? "Last: " + niceDate(lastRun.d) + " · " + lastRun.km + " km" : "Distance, time and effort", "", "Log Run", "", false) +
    card("bag", "Bag Work", lastBag ? "Last: " + niceDate(lastBag.d) + " · " + lastBag.r + " rounds" : "Rounds with your 3D coach calling strikes", "", "Open Round Timer", "", false);
  const go = (d, start) => {
    if (d === "bag") { showView("train"); return; }
    if (start && DAYS3.includes(d) && !(draft[d] || {}).__start) { openDay(d); startWorkout(); return; }
    openDay(d);
  };
  $("view-lift").querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); go(b.dataset.go, true); }));
  $("rot").querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); openDay(b.dataset.edit, true); }));
  $("rot").querySelectorAll(".rcard").forEach(c => c.addEventListener("click", () => go(c.dataset.d, false)));
}
let wkScreen = "home", feedN = 6, chMode = "dur";
try { chMode = localStorage.getItem("strikepath.chart") || "dur"; } catch (e) {}
const openNotes = new Set();
const liveDay = () => DAYS3.find(d => (draft[d] || {}).__start);
const ICON = {
  back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/><\/svg>',
  down:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7"/><\/svg>',
  clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/><\/svg>',
  note:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/><\/svg>',
  dots:'<svg viewBox="0 0 24 24" aria-hidden="true" style="stroke-width:3"><path d="M5 12h.01M12 12h.01M19 12h.01"/><\/svg>'
};
const U = () => S.lifts.unit === "lb" ? "lbs" : "kg";
const fmtRest = s => s >= 60 ? Math.floor(s / 60) + "min" + (s % 60 ? " " + s % 60 + "s" : "") : s + "s";
const REST_OPTS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300];
const colsFor = ex => kindOf(ex) === "cardio" ? ["km", "Min"] : kindOf(ex) === "hold" ? ["", "Sec"] : [(ex.assist ? "-" : "") + U(), "Reps"];
const prevStr = (ex, s) => { if (!s) return "–"; const k = kindOf(ex); if (k === "cardio") return (s[0] ? s[0] + " km in " : "") + s[1] + " min"; if (k === "hold") return s[1] + " s"; return (s[0] ? (ex.assist ? "-" : "") + s[0] + U() + " × " : "") + s[1]; };
const initials = n => esc((n.replace(/[^A-Za-z ]/g, " ").trim().split(/\s+/).filter(w => w && !/^(and|the|of|with|or)$/i.test(w)).slice(0, 2).map(w => w[0]).join("") || "•").toUpperCase());
const avatar = n => '<span class="av" aria-hidden="true">' + initials(n) + '<\/span>';
const lastNoteFor = id => { for (let i = S.lifts.logs.length - 1; i >= 0; i--) { const e = S.lifts.logs[i].ex.find(x => x.id === id && x.note); if (e) return e.note; } return ""; };
const setVol = sets => sets.reduce((a, s) => a + (s[2] && !s[3] ? (+s[0] || 0) * (+s[1] || 0) : 0), 0);
function openDay(d, edit) { liftDay = d; editMode = !!edit; wkScreen = "day"; renderLift(); scrollTo({top:0}); }
function startWorkout() {
  const dd = (draft[liftDay] = draft[liftDay] || {}); dd.__start = Date.now(); saveDraft(); ac();
  try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(w => { swWake = w; }).catch(() => {}); } catch (e) {}
  toast("Workout started. Let's go"); renderLift(); scrollTo({top:0});
}
function openSheet() { const d = $("wkSheet"); try { d.showModal(); } catch (e) { d.setAttribute("open", ""); } }`);

// ---------------- routine page (before you start) ----------------
replaceFn("renderPreview", String.raw`
function renderPreview(prog) {
  const list = $("exList"), m = dayMinutes(liftDay);
  const rowsOf = ex => { const L = lastFor(logId(ex)), sg = suggestion(ex); return L ? L.e.sets : Array.from({length:ex.s}, () => [sg.w, sg.r, false]); };
  list.innerHTML = '<button class="btn blue full" id="startW">Start Routine<\/button><p class="muted pvmeta">' + prog.length + ' exercises · about ' + (m.lift + m.warm + m.core) + ' min<\/p>' +
    prog.map(ex => {
      const k = kindOf(ex), c = colsFor(ex), sg = suggestion(ex), tags = tagsFor(ex, prog); let n = 0;
      return '<div class="ex hv"><div class="exh">' + avatar(ex.n) + '<div class="exn"><b>' + esc(ex.n) + '<\/b>' + (tags ? '<div>' + tags + '<\/div>' : '') + '<\/div><span class="tgt">' + targetFor(ex) + '<\/span><\/div>' +
        (k !== "cardio" ? '<div class="restline">' + ICON.clock + 'Rest Timer: ' + fmtRest(restFor(ex)) + '<\/div>' : '') +
        '<div class="ptbl"><div class="pth"><span>Set<\/span><span>' + c[0] + '<\/span><span>' + c[1] + '<\/span><\/div>' +
        rowsOf(ex).map(s => '<div class="ptr"><span' + (s[3] ? ' class="w">W' : '>' + (++n)) + '<\/span><span>' + (k === "hold" ? "" : s[0] === "" ? "–" : s[0]) + '<\/span><span>' + s[1] + '<\/span><\/div>').join("") + '<\/div>' +
        '<div class="sugg2">' + esc(sg.note) + '<\/div><\/div>';
    }).join("") +
    '<div class="ex hv"><div class="exh">' + avatar("Core Finisher") + '<div class="exn"><b>Fight core finisher<\/b><\/div><span class="tgt">' + S.lifts.coreRounds + ' rounds · ' + m.core + ' min<\/span><\/div><div class="sugg2">Ab wheel, Pallof press and banded chops: 40 s on, 20 s off, at the end of the workout.<\/div><\/div>' +
    '<button class="btn ghost full" id="editW2" style="margin-top:14px">Edit Routine<\/button>';
  $("startW").addEventListener("click", startWorkout);
  $("editW2").addEventListener("click", () => { editMode = true; renderLift(); scrollTo({top:0}); });
}`);

// ---------------- live log ----------------
replaceFn("renderLift", String.raw`
const RUN_TIP = "<b>Running builds your gas tank.<\/b> Three-minute rounds are hard on the engine; running is the cheapest way to build it, and you can do it from home with no gas money.";
function renderLift() {
  renderRot(); renderRestPanel(); recentLifts();
  $("unitKg").setAttribute("aria-pressed", S.lifts.unit === "kg"); $("unitLb").setAttribute("aria-pressed", S.lifts.unit === "lb");
  const home = wkScreen === "home";
  $("wkHome").hidden = !home; $("wkDay").hidden = home;
  if (home) return;
  const run = liftDay === "run", prog = run ? [] : S.lifts.prog[liftDay], live = !run && !!startedAt(), head = $("dayHead");
  head.className = "dayhead" + (live && !editMode ? " live" : "");
  $("liftTip").innerHTML = run ? RUN_TIP : LIFT_TIP[liftDay];
  $("liftTip").hidden = live || editMode;
  $("liftTime").hidden = run || live;
  $("coreBox").hidden = run || !live || editMode;
  const back = (label, icon) => '<button class="roundbtn" id="dayBack" aria-label="' + label + '">' + icon + '<\/button>';
  const bindBack = () => $("dayBack").addEventListener("click", () => { wkScreen = "home"; editMode = false; renderLift(); scrollTo({top:0}); });
  if (run) { head.innerHTML = back("Back to routines", ICON.back) + '<h2>Run<\/h2>'; bindBack(); renderRun(); return; }
  renderTime();
  if (editMode) {
    head.innerHTML = back("Back to routines", ICON.back) + '<h2>Edit ' + cap(liftDay) + '<\/h2><button class="linkbtn" id="editDone">Done<\/button>'; bindBack();
    $("editDone").addEventListener("click", () => { editMode = false; renderLift(); });
    renderEditor(prog); return;
  }
  if (!live) {
    head.innerHTML = back("Back to routines", ICON.back) + '<h2>' + cap(liftDay) + '<\/h2><button class="linkbtn" id="editW">Edit<\/button>'; bindBack();
    $("editW").addEventListener("click", () => { editMode = true; renderLift(); });
    renderPreview(prog); return;
  }
  const list = $("exList"); list.textContent = "";
  let doneN = 0, vol = 0;
  prog.forEach((ex, xi) => {
    const card = document.createElement("div"); card.className = "ex hv";
    const sets = setsFor(ex), sg = suggestion(ex), id = logId(ex), H = historyFor(id), L = H.length ? H[H.length - 1] : null;
    const kind = kindOf(ex), c = colsFor(ex), tags = tagsFor(ex, prog), dn = sets.filter(s => s[2]).length, fmtSet = fmtSetFor(ex);
    doneN += dn; if (kind === "lift" && !ex.assist) vol += setVol(sets);
    if (dn === sets.length) card.classList.add("complete");
    const best = kind === "lift" ? bestFor(id) : 0, mw = kind === "lift" ? maxWeight(id) : 0;
    const hist = H.length ? '<details class="hist" data-id="' + id + '"' + (openHist.has(id) ? " open" : "") + '><summary>History · ' + H.length + ' session' + (H.length > 1 ? "s" : "") + (mw ? ' · heaviest ' + mw + ' ' + U() : '') + (best ? ' · 1-rep max est. ' + Math.round(best) : '') + '<\/summary>' +
      (kind === "lift" ? spark(H.slice(-12).map(h => Math.max(...h.sets.map(s => e1rm(s[0], s[1]))))) : "") +
      '<ul>' + H.slice(-6).reverse().map(h => '<li>' + niceDate(h.d) + ': ' + h.sets.map(fmtSet).join(", ") + '<\/li>').join("") + '<\/ul><\/details>' : '';
    const dd = draft[liftDay], notes = (dd.__notes = dd.__notes || {}), lastNote = lastNoteFor(id), rs = restFor(ex), noteOpen = openNotes.has(id) || !!notes[id];
    const ropts = REST_OPTS.includes(rs) ? REST_OPTS : REST_OPTS.concat(rs).sort((a, b) => a - b);
    const sid = i => liftDay + "-" + id.replace("@", "_") + "-" + i, prevs = [];
    let wn = 0;
    const rows = sets.map((s, i) => {
      const warm = !!s[3], n = warm ? 0 : ++wn, p = warm || !L ? null : L.sets[n - 1] || null; prevs[i] = p;
      return '<div class="str' + (s[2] ? " done" : "") + (warm ? " warm" : "") + '"><button class="sn" data-i="' + i + '" aria-label="' + (warm ? "Warm-up set" : "Set " + n) + '. Tap to switch between warm-up and working set">' + (warm ? "W" : n) + '<\/button>' +
        '<button class="prev" data-i="' + i + '"' + (p ? ' aria-label="Copy last time: ' + esc(prevStr(ex, p)) + '"' : ' disabled') + '>' + esc(prevStr(ex, p)) + '<\/button>' +
        (kind === "hold" ? '<span><\/span>' : '<input type="number" inputmode="decimal" step="' + (kind === "cardio" ? "0.1" : "0.5") + '" min="0" id="w-' + sid(i) + '" data-i="' + i + '" data-f="0" value="' + (s[0] === "" ? "" : s[0]) + '" placeholder="0" aria-label="' + (kind === "cardio" ? "Distance in km" : "Set " + (i + 1) + (ex.assist ? " assistance" : " weight")) + '">') +
        '<input type="number" inputmode="numeric" step="1" min="0" id="r-' + sid(i) + '" data-i="' + i + '" data-f="1" value="' + s[1] + '" aria-label="' + (kind === "cardio" ? "Minutes" : kind === "hold" ? "Seconds" : "Set " + (i + 1) + " reps") + '">' +
        '<input class="ck" type="checkbox" id="d-' + sid(i) + '" data-i="' + i + '" aria-label="Set ' + (i + 1) + ' done"' + (s[2] ? " checked" : "") + '><\/div>';
    }).join("");
    card.innerHTML = '<div class="exh">' + avatar(ex.n) + '<div class="exn"><b>' + esc(ex.n) + '<\/b>' + (tags ? '<div>' + tags + '<\/div>' : '') + '<\/div><span class="tgt">' + targetFor(ex) + '<\/span><\/div>' +
      '<div class="pills">' + (kind === "cardio" ? '' : '<label class="pill">' + ICON.clock + '<select aria-label="Rest timer for ' + esc(ex.n) + '">' + ropts.map(v => '<option value="' + v + '"' + (v === rs ? " selected" : "") + '>Rest: ' + fmtRest(v) + '<\/option>').join("") + '<\/select><\/label>') +
        '<button class="pill" data-note aria-pressed="' + noteOpen + '">' + ICON.note + 'Note<\/button><\/div>' +
      '<textarea class="exnote" data-nid="' + esc(id) + '" maxlength="300" aria-label="Note for ' + esc(ex.n) + '" placeholder="' + esc(lastNote ? "Last time: " + lastNote : "Add a note for this exercise") + '"' + (noteOpen ? "" : " hidden") + '>' + esc(notes[id] || "") + '<\/textarea>' +
      '<div class="sugg2">' + esc(sg.note) + '<\/div>' +
      '<div class="stbl"><div class="sth"><span>Set<\/span><span>Previous<\/span><span>' + c[0] + '<\/span><span>' + c[1] + '<\/span><span aria-label="Done">✓<\/span><\/div>' + rows + '<\/div>' +
      '<div class="addrow"><button class="addset">+ Add Set<\/button>' + (sets.length > 1 ? '<button class="rmset" aria-label="Remove the last set">−<\/button>' : '') + '<\/div>' + hist;
    card.querySelectorAll("input[type=number]").forEach(inp => inp.addEventListener("input", () => { sets[+inp.dataset.i][+inp.dataset.f] = inp.value === "" ? "" : +inp.value; saveDraft(); }));
    const det = card.querySelector("details"); if (det) det.addEventListener("toggle", () => { if (det.open) openHist.add(id); else openHist.delete(id); });
    card.querySelectorAll(".sn").forEach(b => b.addEventListener("click", () => { const s = sets[+b.dataset.i]; if (s[3]) s.length = 3; else s[3] = 1; saveDraft(); renderLift(); }));
    card.querySelectorAll(".prev").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.i, p = prevs[i]; if (!p) return; sets[i][0] = p[0]; sets[i][1] = p[1]; saveDraft(); renderLift(); }));
    const sel = card.querySelector("select"); if (sel) sel.addEventListener("change", () => { ex.rest = +sel.value; persist(); });
    card.querySelector("[data-note]").addEventListener("click", () => {
      if (openNotes.has(id)) openNotes.delete(id); else openNotes.add(id);
      renderLift(); const t = document.querySelector('.exnote[data-nid="' + id + '"]'); if (t && !t.hidden) t.focus();
    });
    card.querySelector(".exnote").addEventListener("input", e => { notes[id] = e.target.value.slice(0, 300); saveDraft(); });
    card.querySelector(".addset").addEventListener("click", () => {
      if (sets.length >= 10) { toast("10 sets is the most for one exercise"); return; }
      const l = sets[sets.length - 1] || [sg.w, sg.r]; sets.push([l[0], l[1], false]); saveDraft(); renderLift();
    });
    const rm = card.querySelector(".rmset"); if (rm) rm.addEventListener("click", () => { sets.pop(); saveDraft(); renderLift(); });
    card.querySelectorAll("input.ck").forEach(cb => cb.addEventListener("change", () => {
      const i = +cb.dataset.i; sets[i][2] = cb.checked; if (sets[i][0] === "") sets[i][0] = 0;
      saveDraft();
      if (cb.checked) prCheck(ex, sets);
      renderLift();
      if (!cb.checked || kind === "cardio") return;
      if (sets.every(s => s[2])) toast("Nice work: " + ex.n + " done");
      if (xi === prog.length - 1 && sets.every(s => s[2])) return;
      if (ex.ss && partnerAfter(prog, xi) && !sets[i][3]) { toast("Superset: straight to " + prog[xi + 1].n); return; }
      startRest(restFor(ex));
    }));
    list.appendChild(card);
  });
  head.innerHTML = back("Minimize workout", ICON.down) + '<h2>Log Workout<\/h2><button class="roundbtn" id="wkSet2" aria-label="Rest timer settings">' + ICON.clock + '<\/button><button class="btn blue sm" id="wkFinish">Finish<\/button>' +
    '<div class="wkstats"><div><span>Duration<\/span><b class="acc" data-since="' + startedAt() + '">' + fmtClock((Date.now() - startedAt()) / 1000) + '<\/b><\/div><div><span>Volume<\/span><b>' + Math.round(vol).toLocaleString() + ' ' + U() + '<\/b><\/div><div><span>Sets<\/span><b>' + doneN + '<\/b><\/div><\/div>';
  bindBack();
  $("wkSet2").addEventListener("click", openSheet);
  $("wkFinish").addEventListener("click", () => { if (!doneN && !coreDone()) { toast("Check off at least one set first"); return; } $("finishLift").click(); });
  renderCore();
  const disc = document.createElement("button"); disc.className = "discard"; disc.textContent = discardArmed > Date.now() ? "Tap again to discard" : "Discard Workout";
  disc.addEventListener("click", () => {
    if (discardArmed > Date.now()) { delete draft[liftDay]; saveDraft(); discardArmed = 0; openNotes.clear(); stopRest(); if (coreT.run) { coreT.run = false; clearInterval(coreT.timer); } try { swWake && swWake.release(); } catch (e) {} toast("Workout discarded"); renderLift(); return; }
    discardArmed = Date.now() + 3000; renderLift(); setTimeout(() => { if (discardArmed && discardArmed <= Date.now()) renderLift(); }, 3100);
  });
  $("coreBox").appendChild(disc);
}`);
replaceFn("recentLifts", String.raw`
function recentLifts() { $("fitList").innerHTML = FIT.map(f => "<li><span>" + f + "<\/span><\/li>").join(""); }
$("wkSet").addEventListener("click", openSheet);
$("sheetClose").addEventListener("click", () => $("wkSheet").close());
$("wkSheet").addEventListener("click", e => { if (e.target === $("wkSheet")) $("wkSheet").close(); });`);

// ---------------- profile: chart, feed, trophies ----------------
replaceFn("renderTrophies", String.raw`
function renderTrophies() {
  const got = BADGES.filter(b => b.ok()).length, r = rankInfo(xp());
  $("badgeCount").textContent = got + " of " + BADGES.length;
  const stats = [[xp(), "Total XP"], [totalChecks() + "/25", "Moves learned"], [S.rounds, "Rounds done"], [S.lifts.logs.length, "Strength workouts"], [bestStreak(), "Best streak (days)"], [S.prs, "Personal records"], [Math.round(S.sessions.reduce((a, x) => a + x.m, 0)), "Minutes on the clock"], [S.sessions.reduce((a, x) => a + x.s, 0).toLocaleString(), "Strikes thrown (est.)"]];
  $("stats").innerHTML = stats.map(s => '<div class="stat"><b>' + s[0] + '<\/b><span class="label">' + s[1] + '<\/span><\/div>').join("");
  $("badges").innerHTML = BADGES.map(b => '<div class="badge' + (b.ok() ? " got" : "") + '"><div class="medal">' + b.ab + '<\/div><div><b>' + b.name + '<\/b><small>' + b.d + '<\/small><\/div><\/div>').join("");
  $("pfAv").textContent = r.name.charAt(0); $("pfRank").textContent = r.name;
  $("pfXp").textContent = r.next ? xp() + " XP · " + r.toNext + " to next rank" : xp() + " XP · max rank";
  $("pfW").textContent = S.lifts.logs.length + S.runs.length + S.sessions.length; $("pfS").textContent = streak(); $("pfR").textContent = S.prs;
  renderWeek(); renderChart(); renderFeed();
}
// volume and reps count working sets of weighted lifts (not cardio, holds, warm-ups or assisted reps' weight)
const exOf = (day, id) => (S.lifts.prog[day] || []).find(e => e.id === id.split("@")[0]);
function liftStats(l) {
  let vol = 0, reps = 0, sets = 0;
  l.ex.forEach(x => { const e = exOf(l.day, x.id), k = e ? kindOf(e) : "lift"; x.sets.forEach(s => { if (!s[2]) return; sets++; if (k !== "lift" || s[3]) return; reps += s[1]; if (!(e && e.assist)) vol += s[0] * s[1]; }); });
  return {vol, reps, sets};
}
const niceMax = v => { const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 3 ? 3 : f <= 5 ? 5 : f <= 6 ? 6 : 10) * p; };
const fmtK = v => v >= 10000 ? Math.round(v / 1000) + "k" : v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(Math.round(v * 10) / 10);
function renderChart() {
  const wk = weeksBack(12).map(w => {
    const e = new Date(w.start); e.setDate(e.getDate() + 7); const a = dayKey(w.start), b = dayKey(e), ls = S.lifts.logs.filter(l => l.d >= a && l.d < b).map(liftStats);
    return {start:w.start, dur:w.total / 60, vol:ls.reduce((n, x) => n + x.vol, 0), reps:ls.reduce((n, x) => n + x.reps, 0)};
  });
  const key = ["dur", "vol", "reps"].includes(chMode) ? chMode : "dur", vals = wk.map(w => w[key]), top = niceMax(Math.max(key === "dur" ? 3 : 30, ...vals)), now = vals[vals.length - 1];
  const lab = v => key === "dur" ? fmtK(v) + " hrs" : fmtK(v);
  $("chTitle").textContent = key === "dur" ? (Math.round(now * 10) / 10) + " hours this week" : key === "vol" ? Math.round(now).toLocaleString() + " " + U() + " this week" : now.toLocaleString() + " reps this week";
  $("chart").innerHTML = [0, 1, 2, 3].map(i => '<div class="gl" style="bottom:' + (i / 3 * 100) + '%"><span>' + lab(top * i / 3) + '<\/span><\/div>').join("") +
    '<div class="vbars">' + wk.map((w, i) => '<div title="' + w.start.toLocaleDateString([], {month:"short", day:"numeric"}) + ': ' + lab(w[key]) + '"><i class="' + (w[key] ? "" : "z") + '" style="height:' + Math.max(1, w[key] / top * 100) + '%"><\/i>' + (i % 3 === 0 ? '<em>' + w.start.toLocaleDateString([], {month:"short", day:"numeric"}) + '<\/em>' : '') + '<\/div>').join("") + '<\/div>';
  document.querySelectorAll("[data-ch]").forEach(b => b.setAttribute("aria-pressed", b.dataset.ch === key));
}
document.querySelectorAll("[data-ch]").forEach(b => b.addEventListener("click", () => { chMode = b.dataset.ch; try { localStorage.setItem("strikepath.chart", chMode); } catch (e) {} renderChart(); }));
const longDate = k => new Date(k + "T12:00").toLocaleDateString([], {weekday:"long", month:"short", day:"numeric", year:"numeric"});
const fmtDur = m => { m = Math.round(m); return m >= 60 ? Math.floor(m / 60) + "h" + (m % 60 ? " " + m % 60 + "min" : "") : m + "min"; };
const openFeed = new Set();
function renderFeed() {
  const it = [];
  S.lifts.logs.forEach((l, i) => it.push({d:l.d, o:i, k:"lift", x:l}));
  S.runs.forEach((r, i) => it.push({d:r.d, o:i, k:"run", x:r}));
  S.sessions.forEach((s, i) => it.push({d:s.d, o:i, k:"bag", x:s}));
  it.sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : b.o - a.o);
  const stat = (l, v) => '<div><span>' + l + '<\/span><b>' + v + '<\/b><\/div>';
  const card = (key, ab, title, date, stats, rows) => {
    const open = openFeed.has(key), shown = open ? rows : rows.slice(0, 3);
    return '<article class="fcard"><div class="fch">' + avatar(ab) + '<div><b>' + esc(title) + '<\/b><small>' + longDate(date) + '<\/small><\/div><\/div><div class="fstats" style="margin-top:12px">' + stats.join("") + '<\/div>' +
      (rows.length ? '<ul class="fex">' + shown.join("") + '<\/ul>' + (rows.length > 3 ? '<button class="fmore" data-fk="' + key + '">' + (open ? "Show less" : "See " + (rows.length - 3) + " more exercise" + (rows.length - 3 === 1 ? "" : "s")) + '<\/button>' : '') : '') + '<\/article>';
  };
  $("feed").innerHTML = it.length ? it.slice(0, feedN).map(e => {
    if (e.k === "lift") {
      const l = e.x, st = liftStats(l), rows = l.ex.map(x => { const n = x.sets.filter(s => s[2]).length; return '<li>' + avatar(x.n || x.id) + '<span>' + n + ' set' + (n === 1 ? "" : "s") + ' ' + esc(x.n || "Exercise") + '<\/span><\/li>'; });
      if (l.core) rows.push('<li>' + avatar("Core Finisher") + '<span>' + l.core + ' rounds Fight core finisher<\/span><\/li>');
      return card("l" + e.o, cap(l.day), cap(l.day) + " day", l.d, [stat("Time", l.min ? fmtDur(l.min) : "–"), stat("Volume", Math.round(st.vol).toLocaleString() + " " + U()), stat("Sets", st.sets)].concat(l.pr ? [stat("Records", l.pr)] : []), rows);
    }
    if (e.k === "run") { const r = e.x; return card("r" + e.o, "Run", r.t + " run", r.d, [stat("Distance", r.km + " km"), stat("Time", fmtDur(r.min))].concat(r.km && r.min ? [stat("Pace", paceStr(r.min / r.km) + "/km")] : []).concat(r.rpe ? [stat("Effort", r.rpe + "/10")] : []), []); }
    const s = e.x; return card("b" + e.o, "Bag Work", s.f || "Bag work", s.d, [stat("Time", fmtDur(s.m)), stat("Rounds", s.r)].concat(s.rpe ? [stat("Effort", s.rpe + "/10")] : []), []);
  }).join("") + (it.length > feedN ? '<button class="btn ghost full feedmore" id="feedMore">Show more workouts<\/button>' : '') : '<p class="muted">No workouts yet. Start a routine on the Workout tab and it shows up here.<\/p>';
  $("feed").querySelectorAll("[data-fk]").forEach(b => b.addEventListener("click", () => { const k = b.dataset.fk; if (openFeed.has(k)) openFeed.delete(k); else openFeed.add(k); renderFeed(); }));
  const more = $("feedMore"); if (more) more.addEventListener("click", () => { feedN += 10; renderFeed(); });
}`);

// renderLift no longer draws the week card (it lives on Profile now)
rep("function renderLift() {\n  renderRot(); renderRestPanel(); recentLifts();", "function renderLift() {\n  renderRot(); renderRestPanel(); recentLifts(); if (!$(\"view-trophies\").hidden) renderWeek();");

// keep inline-script safety: no raw "</" inside the app script (Live Server injects there)
const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
const body = h.slice(sStart + 9, sEnd);
const bad = body.indexOf("</");
if (bad >= 0) throw new Error("raw </ in script near: " + body.slice(bad - 60, bad + 20));

fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("hevy layout applied");
