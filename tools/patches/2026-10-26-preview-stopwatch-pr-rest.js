// One-off patch (kept for reference): routine preview + Start, workout stopwatch, no weekly goal,
// PR celebrations, configurable rest timers with quiet alerts.
//   node tools/patches/2026-10-26-preview-stopwatch-pr-rest.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let s = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const swap = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) { console.error("MISS x" + n + ": " + a.slice(0, 120)); process.exit(1); } s = s.split(a).join(b); };
const region = (startMark, endMark, body) => { const i = s.indexOf(startMark), j = s.indexOf(endMark, i); if (i < 0 || j < 0) { console.error("REGION MISS " + startMark); process.exit(1); } s = s.slice(0, i) + body + s.slice(j); };

// ---------------- CSS ----------------
swap(`.miniform{display:flex;`, `.pvlist{list-style:none;margin:0;padding:0;counter-reset:pv;display:flex;flex-direction:column}
.pvlist li{counter-increment:pv;display:grid;grid-template-columns:28px minmax(0,1fr);gap:2px 10px;padding:10px 0;border-top:1px solid var(--line)}
.pvlist li::before{content:counter(pv);grid-row:1/3;font-family:var(--display);font-weight:900;font-size:20px;color:var(--muted);line-height:1.2}
.pvlist li.core::before{content:"+";color:#8fb4ff}
.pvlist b{font-family:var(--display);font-weight:800;font-size:19px;text-transform:uppercase}
.pvlist small{color:var(--muted);font-size:13px;line-height:1.35}
.pvhead{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline}
.swbar{position:sticky;top:calc(var(--hdr, 64px) + 6px);z-index:15;display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:var(--bg);border:2px solid var(--red);border-radius:12px;padding:8px 12px;box-shadow:0 8px 24px rgba(0,0,0,.4)}
.swbar b{font-family:var(--display);font-weight:900;font-size:34px;line-height:1;font-variant-numeric:tabular-nums;color:var(--fg)}
.swbar .sp{margin-left:auto}
.edit2{display:grid;grid-template-columns:90px 90px auto;gap:6px;align-items:end;margin-top:6px}
.edit2 label{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.edit2 input{width:100%;background:var(--mat);border:1px solid var(--line);border-radius:7px;padding:7px 8px;font-size:15px;color:var(--fg)}
.restcfg{display:flex;flex-direction:column;gap:10px;margin-top:10px}
.restcfg .rw{display:flex;flex-direction:column;gap:5px}
.restcfg .rw span{font-size:13px;color:var(--muted)}
.miniform{display:flex;`);

// ---------------- HTML: rest settings panel in the side column ----------------
swap(`        <div class="panel"><span class="label">How it fits with kickboxing</span>`,
`        <div class="panel" id="restPanel"></div>
        <div class="panel"><span class="label">How it fits with kickboxing</span>`);

// ---------------- state: rest settings, per-exercise rest ----------------
swap(`lifts:{unit:"kg", prog:defaultProgram(), logs:[], coreRounds:3, budget:75, progV:2}`,
     `lifts:{unit:"kg", prog:defaultProgram(), logs:[], coreRounds:3, budget:75, progV:2, restCfg:{heavy:180, med:120, light:75, ss:90, sound:"chime"}}`);
swap(`        if (e.assist) o.assist = true;`, `        if (e.assist) o.assist = true;
        if (+e.rest > 0) o.rest = clampN(e.rest, 10, 900, 90);`);
swap(`    s.lifts.budget = clampN(L.budget, 30, 180, 75);`, `    s.lifts.budget = clampN(L.budget, 30, 180, 75);
    if (L.restCfg && typeof L.restCfg === "object") {
      const R = L.restCfg, sound = ["chime", "buzz", "voice", "silent"].includes(R.sound) ? R.sound : "chime";
      s.lifts.restCfg = {heavy:clampN(R.heavy, 15, 600, 180), med:clampN(R.med, 15, 600, 120), light:clampN(R.light, 15, 600, 75), ss:clampN(R.ss, 15, 600, 90), sound};
    }`);
// no weekly goal: drop the goal trophy and the "of 5 h" wording
swap(`  {id:"week", ab:"WK", name:"Full Week", d:"Hit your weekly hours goal.", ok:() => weeksBack(12).some(w => w.total >= S.weekGoal * 60)},\n`, ``);
swap(`(weekMins(weekStart(Date.now())).total / 60).toFixed(1) + " of " + S.weekGoal + " h this week";`, `(weekMins(weekStart(Date.now())).total / 60).toFixed(1) + " h trained this week";`);

// ---------------- rest lengths come from the settings ----------------
swap(`const restFor = ex => ex.type === "hold" ? 60 : ex.lo <= 6 ? 180 : ex.lo <= 8 ? 120 : 75;`,
     `const restFor = ex => { const c = S.lifts.restCfg; return ex.rest || (ex.ss ? c.ss : ex.type === "hold" ? 60 : ex.lo <= 6 ? c.heavy : ex.lo <= 8 ? c.med : c.light); };`);
swap(`    const rest = ex.ss ? (partnerAfter(prog, i) ? 0 : 90) : restFor(ex);`, `    const rest = ex.ss && partnerAfter(prog, i) ? 0 : restFor(ex);`);

// ---------------- Fight Camp: longer rests and an option for quiet alerts ----------------
swap(`  rest:{vals:[30, 45, 60], lbl:v => v + " s", def:30},`, `  rest:{vals:[30, 45, 60, 90, 120], lbl:v => v + " s", def:30},`);
swap(`const EXTRAS = {voice:"Coach voice", ready:"10s get-ready", warn:"10s warning", burn:"Burnout finish"};
const T = {preset:"quick", voice:true, ready:true, warn:true, burn:false};`,
`const EXTRAS = {voice:"Coach voice", ready:"10s get-ready", warn:"10s warning", burn:"Burnout finish", quiet:"Quiet alerts"};
const T = {preset:"quick", voice:true, ready:true, warn:true, burn:false, quiet:false};`);
swap(`function bell(n = 1) {`, `// quiet alerts (Workouts rest-sound setting) replace the loud bell and clap when "Quiet alerts" is on
const ring = n => T.quiet ? notify("round") : bell(n);
function bell(n = 1) {`);
swap(`clock.phase = "done"; clock.left = 0; clock.burning = false; clearInterval(clock.timer); bell(3);`, `clock.phase = "done"; clock.left = 0; clock.burning = false; clearInterval(clock.timer); ring(3);`);
swap(`if (T.warn && !clock.warned && clock.left <= 10) { clock.warned = true; clap(2); }`, `if (T.warn && !clock.warned && clock.left <= 10) { clock.warned = true; if (T.quiet) notify("warn"); else clap(2); }`);
swap(`clock.endAt = now + T.rest * 1000; clock.left = T.rest; clock.round++; bell(1);`, `clock.endAt = now + T.rest * 1000; clock.left = T.rest; clock.round++; ring(1);`);
swap(`  bell(1); setCallMsg("Round " + clock.round + ": " + th.name + ". Fight!");`, `  ring(1); setCallMsg("Round " + clock.round + ": " + th.name + ". Fight!");`);

// ---------------- the Workouts log ----------------
const runStart = s.indexOf("function renderRun() {"), runEnd = s.indexOf("const paceStr = ");
const RENDER_RUN = s.slice(runStart, runEnd);   // unchanged, carried over
region(`// the week as planned:`, `$("bagForm").addEventListener`, `// ---- this week: what you actually did, no targets ----
function dayActs(k) {
  const a = S.lifts.logs.filter(l => l.d === k).map(l => cap(l.day));
  S.runs.filter(r => r.d === k).forEach(r => a.push("Run" + (r.km ? " " + r.km + " km" : "")));
  if (S.sessions.some(x => x.d === k)) a.push("Bag");
  return a;
}
function renderWeek() {
  const ws = weekStart(Date.now()), w = weekMins(ws), wk = weeksBack(8), top = Math.max(60, ...wk.map(x => x.total)), max = Math.max(1, w.total), td = today();
  const days = Array.from({length:7}, (_, i) => { const d = new Date(ws); d.setDate(d.getDate() + i); return dayKey(d); });
  const n = days.reduce((a, k) => a + dayActs(k).length, 0);
  const sw = c => '<i style="display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;background:' + c + '"></i>';
  $("weekCard").innerHTML = '<div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="label">This week</span><div class="big">' + (w.total / 60).toFixed(1) + ' h</div></div><span class="muted">' + n + ' session' + (n === 1 ? "" : "s") + '</span></div>' +
    (w.total ? '<div class="track" aria-hidden="true"><i style="width:' + (w.lift / max * 100) + '%;background:var(--gold)"></i><i style="width:' + (w.run / max * 100) + '%;background:var(--ok)"></i><i style="width:' + (w.kb / max * 100) + '%;background:var(--red)"></i></div>' : '') +
    '<div class="legend2" style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--muted)"><span>' + sw("var(--gold)") + 'Lifting ' + Math.round(w.lift) + ' min</span><span>' + sw("var(--ok)") + 'Running ' + Math.round(w.run) + ' min</span><span>' + sw("var(--red)") + 'Kickboxing ' + Math.round(w.kb) + ' min</span></div>' +
    '<div class="plan7">' + days.map((k, i) => { const a = dayActs(k); return '<div class="' + (a.length ? "ok" : "") + (k === td ? " td" : "") + '"><span class="dn">' + ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i] + '</span><b>' + (a.length ? a.join(" · ") : "–") + '</b></div>'; }).join("") + '</div>' +
    '<div><span class="label">Hours per week · last 8 weeks</span><div class="wk8">' + wk.map(x => '<div title="' + (x.total / 60).toFixed(1) + ' h"><span>' + (x.total ? (x.total / 60).toFixed(1) : "") + '</span><i style="height:' + Math.max(2, x.total / top * 100) + '%"></i><span>' + (x.start.getMonth() + 1) + '/' + x.start.getDate() + '</span></div>').join("") + '</div></div>';
}

// ---- grips that switch every week ----
const weekNo = () => Math.round((weekStart(Date.now()) - weekStart(new Date(2024, 0, 1))) / (7 * 864e5));
const variant = ex => ex.alt ? weekNo() % 2 : -1;
const logId = ex => ex.alt ? ex.id + "@" + variant(ex) : ex.id;
const logName = ex => ex.alt ? ex.n + " · " + ex.alt[variant(ex)] : ex.n;

// ---- quiet alerts: a soft chime, a low buzz, a voice, or vibrate only ----
function notify(kind) {
  const snd = S.lifts.restCfg.sound;
  try { if (navigator.vibrate) navigator.vibrate(snd === "buzz" || snd === "silent" ? [180, 90, 180] : 120); } catch (e) {}
  if (snd === "silent") return;
  if (snd === "voice") {
    try { const u = new SpeechSynthesisUtterance(kind === "round" ? "Time. Back to work." : kind === "warn" ? "Ten seconds." : "Rest is over. Back to work."); u.volume = .7; u.rate = 1.05; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
    return;
  }
  const a = ac(); if (!a) return;
  try {
    const t = a.currentTime;
    const tone = (type, f, dt, len, vol) => { const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.0001, t + dt); g.gain.exponentialRampToValueAtTime(vol, t + dt + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dt + len); o.connect(g).connect(a.destination); o.start(t + dt); o.stop(t + dt + len + .05); };
    if (snd === "buzz") { tone("square", 140, 0, .16, .045); tone("square", 140, .24, .16, .045); }
    else { tone("sine", 660, 0, .5, .08); tone("sine", 880, .18, .55, .08); }
  } catch (e) {}
}
function prChime() {
  if (S.lifts.restCfg.sound === "silent") return;
  const a = ac(); if (!a) return;
  try { const t = a.currentTime; [523, 659, 784, 1047].forEach((f, i) => { const o = a.createOscillator(), g = a.createGain(); o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(.0001, t + i * .1); g.gain.exponentialRampToValueAtTime(.09, t + i * .1 + .02); g.gain.exponentialRampToValueAtTime(.0001, t + i * .1 + .45); o.connect(g).connect(a.destination); o.start(t + i * .1); o.stop(t + i * .1 + .5); }); } catch (e) {}
}

// ---- rest timer ----
const restT = {end:0, timer:0};
function startRest(sec) {
  if (!sec) return;
  restT.end = Date.now() + sec * 1000; $("restBar").hidden = false;
  clearInterval(restT.timer); restT.timer = setInterval(restTick, 250); restTick();
}
function stopRest() { clearInterval(restT.timer); $("restBar").hidden = true; }
function restTick() {
  const left = Math.ceil((restT.end - Date.now()) / 1000);
  if (left <= 0) { stopRest(); notify("rest"); toast("Rest's over. Back to it"); return; }
  $("restTime").textContent = fmtTime(left);
}
$("restPlus").addEventListener("click", () => { restT.end += 30000; restTick(); });
$("restSkip").addEventListener("click", stopRest);

// ---- workout stopwatch: runs from Start to Finish ----
const startedAt = () => (draft[liftDay] || {}).__start || 0;
const fmtClock = sec => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), x = sec % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
setInterval(() => {
  if (!startedAt() || liftDay === "run") return;
  const t = fmtClock((Date.now() - startedAt()) / 1000);
  const sw = $("swTime"); if (sw) sw.textContent = t;
  const lc = $("liftClock"); if (lc) lc.textContent = "Workout time " + t;
}, 1000);
const measureHeader = () => { const h = document.querySelector(".top"); if (h) document.documentElement.style.setProperty("--hdr", h.offsetHeight + "px"); };
window.addEventListener("resize", measureHeader); setTimeout(measureHeader, 0);
let swWake = null;

let liftDay = nextLiftDay(), editMode = false, runType = "Easy", discardArmed = 0;
let draft = {}; try { draft = JSON.parse(localStorage.getItem("strikepath.draft") || "{}") || {}; } catch (e) {}
const saveDraft = () => { try { localStorage.setItem("strikepath.draft", JSON.stringify(draft)); } catch (e) {} };
const inc = () => S.lifts.unit === "lb" ? 5 : 2.5;
function historyFor(id) { const out = []; S.lifts.logs.forEach(l => l.ex.forEach(e => { if (e.id === id && e.sets.some(s => s[2])) out.push({d:l.d, sets:e.sets.filter(s => s[2])}); })); return out; }
function lastFor(id) { const h = historyFor(id); return h.length ? {e:{sets:h[h.length - 1].sets}, d:h[h.length - 1].d} : null; }
const e1rm = (w, r) => w > 0 ? w * (1 + r / 30) : r;
function bestFor(id) { let b = 0; historyFor(id).forEach(h => h.sets.forEach(s => { b = Math.max(b, e1rm(s[0], s[1])); })); return b; }
function suggestion(ex) {
  if (ex.type === "cardio") return {w:"", r:ex.lo, note:"Warm-up: easy jog or incline walk. You should be able to talk."};
  const L = lastFor(logId(ex));
  if (ex.type === "hold") { if (!L) return {w:0, r:ex.lo, note:"Hang as long as you can with good shoulders. Builds grip for the clinch."}; const best = Math.max(...L.e.sets.map(s => s[1])); return {w:0, r:best + 5, note:"Beat your best hang: aim for " + (best + 5) + " s."}; }
  if (!L) return {w:"", r:ex.lo, note:ex.assist ? "First time: pick the assistance that lets you do " + ex.hi + " clean reps." : "First time: pick a weight you can lift for " + ex.hi + " clean reps."};
  const done = L.e.sets, topW = Math.max(...done.map(s => s[0])), lowW = Math.min(...done.map(s => s[0])), topR = Math.max(...done.map(s => s[1]));
  const allHit = done.length >= ex.s && done.every(s => s[1] >= ex.hi);
  if (ex.assist) {
    if (allHit && lowW > 0) { const w = Math.max(0, lowW - inc()); return {w, r:ex.lo, note:w ? "Every rep hit. Drop the assistance to " + w + " " + S.lifts.unit + "." : "Every rep hit. Try them with no assistance."}; }
    return {w:lowW, r:Math.min(ex.hi, topR + 1), note:"Same assistance. Try to beat last time by one rep."};
  }
  if (allHit && topW > 0) return {w:topW + inc(), r:ex.lo, note:"You hit every rep last time. Go up to " + (topW + inc()) + " " + S.lifts.unit + "."};
  if (allHit) return {w:0, r:topR + 1, note:"Every rep hit. Add a rep to each set."};
  return {w:topW, r:Math.min(ex.hi, topR + 1), note:"Same weight. Try to beat last time by one rep."};
}
function setsFor(ex) {
  const dd = (draft[liftDay] = draft[liftDay] || {}), key = logId(ex), sg = suggestion(ex);
  if (!dd[key] || dd[key].length !== ex.s) dd[key] = Array.from({length:ex.s}, (_, i) => (dd[key] && dd[key][i]) || [sg.w, sg.r, false]);
  return dd[key];
}

// ---- personal records: heaviest weight and best session volume, celebrated the moment they happen ----
const maxWeight = id => historyFor(id).reduce((m, h) => Math.max(m, ...h.sets.map(s => s[0])), 0);
const bestVolume = id => historyFor(id).reduce((m, h) => Math.max(m, h.sets.reduce((a, s) => a + s[0] * s[1], 0)), 0);
function party(title, sub) {
  toast(title, "big"); if (sub) setTimeout(() => toast(sub), 350);
  confetti(); prChime();
}
function prCheck(ex, sets) {
  if ((ex.type || "lift") !== "lift" || ex.assist) return;
  const id = logId(ex); if (!historyFor(id).length) return;   // the first session sets the bar, it isn't a record yet
  const dd = draft[liftDay], pr = (dd.__pr = dd.__pr || {}), rec = (pr[id] = pr[id] || {});
  const done = sets.filter(s => s[2]), topW = Math.max(0, ...done.map(s => +s[0] || 0)), vol = done.reduce((a, s) => a + (+s[0] || 0) * (+s[1] || 0), 0);
  const mw = maxWeight(id), bv = bestVolume(id), u = S.lifts.unit;
  if (topW > mw && topW > (rec.w || 0)) { rec.w = topW; party("New heaviest: " + ex.n, topW + " " + u + ", the most you've ever lifted on it. Strong."); }
  else if (bv > 0 && vol > bv && !rec.v) { rec.v = vol; party("Volume record: " + ex.n, Math.round(vol).toLocaleString() + " " + u + " moved. Your best session on it yet."); }
  saveDraft();
}

function spark(vals) {
  if (vals.length < 2) return "";
  const mx = Math.max(...vals), mn = Math.min(...vals), W = 260, H = 44, pts = vals.map((v, i) => (i / (vals.length - 1) * (W - 8) + 4).toFixed(1) + "," + (H - 6 - (mx === mn ? .5 : (v - mn) / (mx - mn)) * (H - 12)).toFixed(1)).join(" ");
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><polyline points="' + pts + '" fill="none" stroke="var(--gold)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}
const openHist = new Set();
function renderRot() {
  const nd = nextLiftDay();
  const items = DAYS3.map(d => { const last = [...S.lifts.logs].reverse().find(l => l.day === d), live = (draft[d] || {}).__start; return [d, cap(d), live ? "In progress" : (last ? "Last: " + niceDate(last.d) : "Not done yet") + " · " + S.lifts.prog[d].length + " exercises", d === nd && !live, live]; });
  const lastRun = S.runs[S.runs.length - 1];
  items.push(["run", "Run", lastRun ? "Last: " + niceDate(lastRun.d) + " · " + lastRun.km + " km" : "Log a run", false, false]);
  $("rot").innerHTML = items.map(it => '<button class="rotbtn" id="rot-' + it[0] + '" data-d="' + it[0] + '" aria-pressed="' + (it[0] === liftDay) + '">' + (it[4] ? '<span class="nx" style="background:var(--red);color:#fff">Live</span>' : it[3] ? '<span class="nx">Next up</span>' : '') + '<b>' + it[1] + '</b><small>' + it[2] + '</small></button>').join("");
  $("rot").querySelectorAll(".rotbtn").forEach(b => b.addEventListener("click", () => { liftDay = b.dataset.d; editMode = false; renderLift(); }));
}
${RENDER_RUN}const paceStr = m => Math.floor(m) + ":" + String(Math.round((m % 1) * 60)).padStart(2, "0");
const kindOf = ex => ex.type || "lift";
const targetFor = ex => kindOf(ex) === "cardio" ? ex.lo + "–" + ex.hi + " min" : kindOf(ex) === "hold" ? ex.s + " × " + ex.lo + "–" + ex.hi + " s" : ex.s + " × " + ex.lo + (ex.hi !== ex.lo ? "–" + ex.hi : "") + " reps";
const fmtSetFor = ex => s => kindOf(ex) === "cardio" ? s[1] + " min" + (s[0] ? " · " + s[0] + " km" : "") : kindOf(ex) === "hold" ? s[1] + " s" : (s[0] ? s[0] + (ex.assist ? " assist" : "") + "×" : "") + s[1];
function tagsFor(ex, prog) {
  const partner = ex.ss ? prog.find(p => p !== ex && p.ss === ex.ss) : null;
  return (ex.ss ? '<span class="tagc ss">Superset ' + ex.ss + ' · with ' + esc(partner ? partner.n : "") + '</span> ' : '') + (ex.alt ? '<span class="tagc alt">This week: ' + esc(ex.alt[variant(ex)]) + '</span>' : '');
}

// ---- preview: see the whole routine before you start ----
function renderPreview(prog) {
  const list = $("exList"), m = dayMinutes(liftDay);
  list.innerHTML = '<div class="ex"><div class="exhead"><b>' + cap(liftDay) + ' routine</b><span class="tgt">' + prog.length + ' exercises · about ' + (m.lift + m.warm + m.core) + ' min</span></div>' +
    '<ol class="pvlist">' + prog.map(ex => {
      const L = lastFor(logId(ex)), sg = suggestion(ex);
      return '<li><div class="pvhead"><b>' + esc(ex.n) + '</b><span class="muted">' + targetFor(ex) + (kindOf(ex) === "lift" || kindOf(ex) === "hold" ? ' · rest ' + fmtTime(restFor(ex)) : '') + '</span>' + tagsFor(ex, prog) + '</div>' +
        '<small>' + (L ? "Last: " + L.e.sets.map(fmtSetFor(ex)).join(", ") + " · " : "") + esc(sg.note) + '</small></li>';
    }).join("") +
    '<li class="core"><div class="pvhead"><b>Fight core finisher</b><span class="muted">' + S.lifts.coreRounds + ' rounds · about ' + m.core + ' min</span></div><small>Ab wheel, Pallof press, banded chops</small></li></ol>' +
    '<div class="row" style="margin-top:12px"><button class="btn gold" id="startW">Start workout</button><button class="btn ghost" id="editW">Edit routine</button></div></div>';
  $("startW").addEventListener("click", () => {
    const dd = (draft[liftDay] = draft[liftDay] || {}); dd.__start = Date.now(); saveDraft(); ac();
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(w => { swWake = w; }).catch(() => {}); } catch (e) {}
    toast("Workout started. Let's go"); renderLift(); scrollTo({top:$("exList").getBoundingClientRect().top + scrollY - 90, behavior:"smooth"});
  });
  $("editW").addEventListener("click", () => { editMode = true; renderLift(); });
}

// ---- editor: name, sets, reps, rest, superset, order ----
function renderEditor(prog) {
  const list = $("exList"); list.textContent = "";
  prog.forEach((ex, xi) => {
    const card = document.createElement("div"); card.className = "ex";
    const k = kindOf(ex), lo = k === "hold" ? "Min sec" : k === "cardio" ? "Min min" : "Min reps", hi = k === "hold" ? "Max sec" : k === "cardio" ? "Max min" : "Max reps";
    card.innerHTML = '<div class="edit"><label>Exercise<input id="en-' + ex.id + '" value="' + esc(ex.n) + '" maxlength="60"></label><label>Sets<input id="es-' + ex.id + '" type="number" min="1" max="10" value="' + ex.s + '"></label><label>' + lo + '<input id="el-' + ex.id + '" type="number" min="1" max="600" value="' + ex.lo + '"></label><label>' + hi + '<input id="eh-' + ex.id + '" type="number" min="1" max="600" value="' + ex.hi + '"></label><button class="iconbtn" data-act="del" aria-label="Remove ' + esc(ex.n) + '" title="Remove">✕</button></div>' +
      '<div class="edit2"><label>Rest (sec)<input id="er-' + ex.id + '" type="number" min="0" max="900" step="15" value="' + (ex.rest || "") + '" placeholder="auto ' + restFor(Object.assign({}, ex, {rest:0})) + '"></label><label>Superset<input id="ess-' + ex.id + '" maxlength="1" value="' + (ex.ss || "") + '" placeholder="–"></label>' +
      '<div class="row" style="gap:6px"><button class="iconbtn" data-act="up" aria-label="Move ' + esc(ex.n) + ' up"' + (xi === 0 ? " disabled" : "") + '>↑</button><button class="iconbtn" data-act="down" aria-label="Move ' + esc(ex.n) + ' down"' + (xi === prog.length - 1 ? " disabled" : "") + '>↓</button></div></div>';
    const upd = () => {
      ex.n = card.querySelector("#en-" + ex.id).value.trim().slice(0, 60) || "Exercise";
      ex.s = clampN(card.querySelector("#es-" + ex.id).value, 1, 10, ex.s);
      ex.lo = clampN(card.querySelector("#el-" + ex.id).value, 1, 600, ex.lo);
      ex.hi = Math.max(ex.lo, clampN(card.querySelector("#eh-" + ex.id).value, 1, 600, ex.hi));
      const r = +card.querySelector("#er-" + ex.id).value; if (r > 0) ex.rest = clampN(r, 10, 900, 90); else delete ex.rest;
      const ss = (card.querySelector("#ess-" + ex.id).value || "").trim().toUpperCase(); if (/^[A-Z]$/.test(ss)) ex.ss = ss; else delete ex.ss;
      persist(); renderTime();
    };
    card.querySelectorAll("input").forEach(i => i.addEventListener("change", upd));
    card.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
      const a = b.dataset.act;
      if (a === "del") prog.splice(xi, 1);
      if (a === "up" && xi > 0) prog.splice(xi - 1, 0, prog.splice(xi, 1)[0]);
      if (a === "down" && xi < prog.length - 1) prog.splice(xi + 1, 0, prog.splice(xi, 1)[0]);
      persist(); renderLift();
    }));
    list.appendChild(card);
  });
  const row = document.createElement("div"); row.className = "row";
  const add = document.createElement("button"); add.className = "btn ghost sm"; add.textContent = "+ Add exercise";
  add.addEventListener("click", () => { prog.push(exd("x" + Date.now().toString(36), "New exercise", 3, 8, 12)); persist(); renderLift(); });
  const rs = document.createElement("button"); rs.className = "btn ghost sm"; rs.textContent = "Reset " + cap(liftDay) + " to my routine";
  rs.addEventListener("click", () => { S.lifts.prog[liftDay] = defaultProgram()[liftDay]; persist(); renderLift(); });
  const done = document.createElement("button"); done.className = "btn sm"; done.textContent = "Done editing";
  done.addEventListener("click", () => { editMode = false; renderLift(); });
  row.append(add, rs, done); list.appendChild(row);
}

// ---- rest settings (side panel) ----
function renderRestPanel() {
  const c = S.lifts.restCfg;
  const row = (key, label, vals) => '<div class="rw"><span>' + label + '</span><div class="chips">' + vals.map(v => '<button class="chip" data-rk="' + key + '" data-rv="' + v + '" aria-pressed="' + (c[key] === v) + '">' + fmtTime(v) + '</button>').join("") + '</div></div>';
  $("restPanel").innerHTML = '<span class="label">Rest timer</span><div class="restcfg">' +
    row("heavy", "Heavy sets (6 reps or fewer)", [90, 120, 150, 180, 240]) + row("med", "Medium sets (7–8 reps)", [60, 90, 120, 150]) +
    row("light", "Light sets (9+ reps)", [45, 60, 75, 90]) + row("ss", "After a superset pair", [60, 90, 120]) +
    '<div class="rw"><span>When rest is over</span><div class="chips">' + [["chime", "Soft chime"], ["buzz", "Buzz"], ["voice", "Voice"], ["silent", "Vibrate only"]].map(o => '<button class="chip" data-snd="' + o[0] + '" aria-pressed="' + (c.sound === o[0]) + '">' + o[1] + '</button>').join("") + '<button class="chip" id="sndTest">Test</button></div></div>' +
    '<span class="muted" style="font-size:13px">Set a custom rest for any exercise in Edit routine. Phones may only vibrate if sound is muted.</span></div>';
  $("restPanel").querySelectorAll("[data-rk]").forEach(b => b.addEventListener("click", () => { c[b.dataset.rk] = +b.dataset.rv; persist(); renderLift(); }));
  $("restPanel").querySelectorAll("[data-snd]").forEach(b => b.addEventListener("click", () => { c.sound = b.dataset.snd; persist(); renderRestPanel(); notify("rest"); }));
  $("sndTest").addEventListener("click", () => notify("rest"));
}

function renderLift() {
  renderWeek(); renderRot(); renderRestPanel();
  const run = liftDay === "run", prog = run ? [] : S.lifts.prog[liftDay], live = !run && !!startedAt();
  $("liftTitle").textContent = run ? "Run day" : cap(liftDay) + " day";
  $("liftTip").innerHTML = run ? "<b>Running builds your gas tank.</b> Three-minute rounds are hard on the engine; running is the cheapest way to build it, and you can do it from home with no gas money." : LIFT_TIP[liftDay];
  $("liftTime").hidden = run || live;
  $("coreBox").hidden = run || !live || editMode;
  document.querySelector(".liftfoot").hidden = run || !live || editMode;
  $("editProg").hidden = run; $("unitKg").hidden = run; $("unitLb").hidden = run;
  if (run) { stopRest(); renderRun(); return; }
  $("unitKg").setAttribute("aria-pressed", S.lifts.unit === "kg"); $("unitLb").setAttribute("aria-pressed", S.lifts.unit === "lb");
  $("editProg").setAttribute("aria-pressed", editMode); $("editProg").textContent = editMode ? "Done editing" : "Edit routine";
  renderTime();
  if (editMode) { renderEditor(prog); recentLifts(); return; }
  if (!live) { renderPreview(prog); recentLifts(); return; }
  const list = $("exList"); list.textContent = "";
  const bar = document.createElement("div"); bar.className = "swbar";
  bar.innerHTML = '<span class="label">Workout</span><b id="swTime">' + fmtClock((Date.now() - startedAt()) / 1000) + '</b><span class="muted">' + cap(liftDay) + ' day</span><button class="btn ghost sm sp" id="swDiscard">' + (discardArmed > Date.now() ? "Tap again to discard" : "Discard") + '</button>';
  list.appendChild(bar);
  bar.querySelector("#swDiscard").addEventListener("click", () => {
    if (discardArmed > Date.now()) { delete draft[liftDay]; saveDraft(); discardArmed = 0; stopRest(); if (coreT.run) { coreT.run = false; clearInterval(coreT.timer); } try { swWake && swWake.release(); } catch (e) {} toast("Workout discarded"); renderLift(); return; }
    discardArmed = Date.now() + 3000; renderLift(); setTimeout(() => { if (discardArmed && discardArmed <= Date.now()) renderLift(); }, 3100);
  });
  let total = 0, doneN = 0;
  prog.forEach((ex, xi) => {
    const card = document.createElement("div"); card.className = "ex";
    const sets = setsFor(ex), sg = suggestion(ex), id = logId(ex), H = historyFor(id), L = H.length ? H[H.length - 1] : null;
    total += sets.length; const dn = sets.filter(s => s[2]).length; doneN += dn;
    if (dn === sets.length) card.classList.add("complete");
    const kind = kindOf(ex), fmtSet = fmtSetFor(ex), tags = tagsFor(ex, prog);
    const best = kind === "lift" ? bestFor(id) : 0, mw = kind === "lift" ? maxWeight(id) : 0;
    const hist = H.length ? '<details class="hist" data-id="' + id + '"' + (openHist.has(id) ? " open" : "") + '><summary>History · ' + H.length + ' session' + (H.length > 1 ? "s" : "") + (mw ? ' · heaviest ' + mw + ' ' + S.lifts.unit : '') + (best ? ' · 1-rep max est. ' + Math.round(best) : '') + '</summary>' +
      (kind === "lift" ? spark(H.slice(-12).map(h => Math.max(...h.sets.map(s => e1rm(s[0], s[1]))))) : "") +
      '<ul>' + H.slice(-6).reverse().map(h => '<li>' + niceDate(h.d) + ': ' + h.sets.map(fmtSet).join(", ") + '</li>').join("") + '</ul></details>' : '';
    const sid = i => liftDay + "-" + id.replace("@", "_") + "-" + i;
    const f0 = (s, i) => kind === "hold" ? '<span></span>' :
      '<label for="w-' + sid(i) + '"><input type="number" inputmode="decimal" step="' + (kind === "cardio" ? "0.1" : "0.5") + '" min="0" id="w-' + sid(i) + '" data-i="' + i + '" data-f="0" value="' + (s[0] === "" ? "" : s[0]) + '" placeholder="0" aria-label="' + (kind === "cardio" ? "Distance" : "Set " + (i + 1) + " weight") + '"><span>' + (kind === "cardio" ? "km" : (ex.assist ? "assist " : "") + S.lifts.unit) + '</span></label>';
    card.innerHTML = '<div class="exhead"><b>' + esc(ex.n) + '</b><span class="tgt">' + targetFor(ex) + '</span></div>' + (tags ? '<div>' + tags + '</div>' : '') +
      '<div class="last">' + (L ? "Last time (" + niceDate(L.d) + "): " + L.sets.map(fmtSet).join(", ") : "No log yet") + '</div><div><span class="sugg">' + esc(sg.note) + '</span></div>' +
      '<div class="sets">' + sets.map((s, i) => '<div class="set' + (s[2] ? " done" : "") + '"><span class="sl">' + (kind === "cardio" ? "Done" : "Set " + (i + 1)) + '</span>' + f0(s, i) +
        '<label for="r-' + sid(i) + '"><input type="number" inputmode="numeric" step="1" min="0" id="r-' + sid(i) + '" data-i="' + i + '" data-f="1" value="' + s[1] + '" aria-label="' + (kind === "cardio" ? "Minutes" : kind === "hold" ? "Seconds" : "Set " + (i + 1) + " reps") + '"><span>' + (kind === "cardio" ? "min" : kind === "hold" ? "sec" : "reps") + '</span></label>' +
        '<input class="tick" type="checkbox" id="d-' + sid(i) + '" data-i="' + i + '" aria-label="Set ' + (i + 1) + ' done"' + (s[2] ? " checked" : "") + '></div>').join("") + '</div>' + hist;
    card.querySelectorAll("input[type=number]").forEach(inp => inp.addEventListener("input", () => { sets[+inp.dataset.i][+inp.dataset.f] = inp.value === "" ? "" : +inp.value; saveDraft(); }));
    const det = card.querySelector("details"); if (det) det.addEventListener("toggle", () => { if (det.open) openHist.add(id); else openHist.delete(id); });
    card.querySelectorAll("input.tick").forEach(cb => cb.addEventListener("change", () => {
      const i = +cb.dataset.i, dd = draft[liftDay]; sets[i][2] = cb.checked; if (sets[i][0] === "") sets[i][0] = 0;
      if (cb.checked && !dd.__start) dd.__start = Date.now();
      saveDraft();
      if (cb.checked) prCheck(ex, sets);
      renderLift();
      if (!cb.checked || kind === "cardio") return;
      if (sets.every(s => s[2])) toast("Nice work: " + ex.n + " done");
      const lastOfDay = xi === prog.length - 1 && sets.every(s => s[2]);
      if (lastOfDay) return;
      if (ex.ss && partnerAfter(prog, xi)) { toast("Superset: straight to " + prog[xi + 1].n); return; }
      startRest(restFor(ex));
    }));
    list.appendChild(card);
  });
  $("liftProgress").innerHTML = doneN + " of " + total + " sets done" + (coreDone() ? " · core done" : "") + ' · <span id="liftClock">Workout time ' + fmtClock((Date.now() - startedAt()) / 1000) + '</span>';
  $("finishLift").disabled = doneN === 0 && !coreDone();
  renderCore();
  recentLifts();
}
function recentLifts() {
  $("fitList").innerHTML = FIT.map(f => "<li><span>" + f + "</span></li>").join("");
  const rec = S.lifts.logs.slice(-6).reverse();
  $("liftList").innerHTML = rec.length ? rec.map(l => {
    const sets = l.ex.reduce((a, e) => a + e.sets.filter(s => s[2]).length, 0);
    return '<li><span><b>' + cap(l.day) + '</b> · ' + sets + ' sets' + (l.core ? ' + core' : '') + (l.min ? ' · ' + l.min + ' min' : '') + '</span><span class="muted">' + niceDate(l.d) + '</span></li>';
  }).join("") : '<li class="empty">No workouts yet. Pick a day, look it over, and press Start.</li>';
}
$("unitKg").addEventListener("click", () => { S.lifts.unit = "kg"; persist(); renderLift(); });
$("unitLb").addEventListener("click", () => { S.lifts.unit = "lb"; persist(); renderLift(); });
$("editProg").addEventListener("click", () => { editMode = !editMode; renderLift(); });
$("finishLift").addEventListener("click", () => {
  const before = snapshot(), dd = draft[liftDay] || {};
  const prog = S.lifts.prog[liftDay];
  const log = {d:today(), day:liftDay, ex:prog.map(ex => ({id:logId(ex), n:logName(ex), sets:(dd[logId(ex)] || []).map(s => [+s[0] || 0, +s[1] || 0, !!s[2]])})).filter(e => e.sets.some(s => s[2])), core:dd.__core || 0};
  if (!log.ex.length && !log.core) return;
  if (coreT.run) { coreT.run = false; clearInterval(coreT.timer); }
  stopRest();
  const m = dayMinutes(liftDay);
  log.min = dd.__start ? Math.min(300, Math.max(1, Math.round((Date.now() - dd.__start) / 60000))) : m.lift + m.warm + (log.core ? m.core : 0);
  const prCount = Object.values(dd.__pr || {}).filter(r => r.w || r.v).length;
  S.lifts.logs.push(log); S.prs += prCount; markToday();
  delete draft[liftDay]; saveDraft();
  try { swWake && swWake.release(); } catch (e) {}
  persist();
  toast(cap(log.day) + " day done in " + log.min + " min · +25 XP" + (prCount ? " · " + prCount + " personal record" + (prCount > 1 ? "s" : "") : ""), "xp");
  if (prCount) { confetti(); prChime(); }
  liftDay = nextLiftDay();
  renderHUD(); renderHero(); renderTrophies(); renderLift();
  celebrate(before);
});
`);
const start = s.indexOf('<script>\n(() => {') + 8, end = s.lastIndexOf('</script>');
s = s.slice(0, start) + s.slice(start, end).split('</').join('<\\/') + s.slice(end);
fs.writeFileSync(f, s); console.log("patched");
