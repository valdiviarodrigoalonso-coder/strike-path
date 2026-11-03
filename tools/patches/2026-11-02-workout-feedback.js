// Notes from a full push/pull/legs + kickboxing test, logging like Hevy:
// - Muscle lists show whole sets: a set counts once for every muscle it really works (main or helper). Minor helpers only tint the map.
// - Swipe a set left to delete it (a short swipe shows Delete, a long one deletes), with Undo. The "−" button is gone.
// - Discard is a trash icon in the header (and still at the bottom), confirmed by pressing and holding, so it can't happen by accident.
// - While you type, a bar rides on top of the phone keyboard: the rest timer, −/+ steppers, Next and ✓ (Hevy's keyboard bar).
// - Tapping weight or reps selects the number, so typing replaces it; ticking a set updates in place instead of redrawing the page,
//   and fills an empty next set from the one you just did.
// - Rest and core timers are saved, so they carry on after the phone drops the app or it reloads; the core circuit catches up
//   from its start time; an app update waits until the workout is over. Optional lock-screen chime for rest.
// - The core circuit logs weight and reps for each exercise (its own history and "Previous" column).
// - Changing an exercise's rest while it's counting moves the running timer, and the clock glides to the new time.
// - "Reorder exercises" (⋯ menu, or long-press an exercise) collapses the workout to names you drag into place.
// Run once: node tools/patches/2026-11-02-workout-feedback.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("function swipeRow(")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => {
  const n = h.split(a).length - 1;
  if (n !== 1) throw new Error((n ? n + " matches for: " : "couldn't find: ") + a.slice(0, 100));
  h = h.replace(a, () => b);
};
function fnRange(name) {
  const start = h.indexOf("\nfunction " + name + "(");
  if (start < 0) throw new Error("no function " + name);
  let i = h.indexOf("{", start), depth = 0, q = null;
  for (; i < h.length; i++) {
    const c = h[i];
    if (q) { if (c === "\\") { i++; continue; } if (c === q) q = null; continue; }
    if (c === "/" && h[i + 1] === "/") { i = h.indexOf("\n", i); continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return [start + 1, i + 1];
  }
  throw new Error("unbalanced " + name);
}
const replaceFn = (name, code) => { const [a, b] = fnRange(name); h = h.slice(0, a) + code.trim() + h.slice(b); };

// ---------------- styles ----------------
rep("</style>", String.raw`/* ===== workout logger: swipe to delete, keyboard bar, hold to discard, reorder ===== */
.swr{position:relative;border-radius:8px;overflow:hidden}
.swr .swdel{position:absolute;top:0;bottom:0;right:0;width:100%;border:0;background:var(--red);color:#fff;font:inherit;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-align:right;padding:0 14px;cursor:pointer;visibility:hidden}
.swr.sw .swdel{visibility:visible}
.swr .str{position:relative;background-color:#080c0d;touch-action:pan-y}
.swr .str.done{background:linear-gradient(rgba(95,174,126,.16),rgba(95,174,126,.16)),#080c0d}
.swr.gone{animation:swgone .2s ease .1s forwards}
@keyframes swgone{to{opacity:0}}
.exh{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.restbar{overflow:hidden}
.restbar .rprog{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(217,178,124,.15)}
.restbar .rprog b{display:block;height:100%;width:0;background:var(--acc);transition:width .45s cubic-bezier(.2,.8,.2,1)}
.restbar .rlab{display:flex;align-items:center;gap:10px}
.restbar .kbtools{display:none;gap:6px;margin-left:auto}
.restbar.kb{left:0;right:0;transform:none;border-radius:0;border-width:1px 0 0;padding:6px 10px 6px 16px;background:rgba(9,13,14,.97);box-shadow:none;justify-content:flex-start}
.restbar.kb .kbtools{display:flex}
.restbar.kb .rchip{display:none}
.restbar.noRest .rlab,.restbar.noRest .rprog{display:none}
.kbbtn{min-width:46px;height:40px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.07);color:var(--fg);font:inherit;font-size:22px;font-weight:700;line-height:1;cursor:pointer;padding:0 12px;touch-action:manipulation}
.kbbtn[data-kb=next]{font-size:12px;letter-spacing:.16em;text-transform:uppercase}
.kbbtn.ok{background:var(--green);border-color:var(--green);color:#fff}
.restbar.bump #restTime{animation:rbump .45s ease}
@keyframes rbump{40%{transform:scale(1.15);color:#fff}}
.toast.act{pointer-events:auto;display:flex;align-items:center;gap:14px;justify-content:center}
.toast.act button{border:0;background:none;color:var(--red-deep, #8f2416);font:inherit;font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-size:12px;cursor:pointer;padding:4px 2px}
.holdbtn{position:relative;overflow:hidden;width:100%;border:1px solid rgba(200,50,31,.6);border-radius:12px;background:rgba(200,50,31,.08);color:#ff7a68;font:inherit;font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;padding:16px;cursor:pointer;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.holdbtn i{position:absolute;inset:0;width:0;background:var(--red);transition:width .15s ease}
.holdbtn span{position:relative}
.holdbtn.holding{color:#fff}
.holdbtn.holding i{width:100%;transition:width 1.2s linear}
.dayhead .roundbtn svg{width:20px;height:20px}
.corelog{border-top:1px solid var(--line);padding-top:10px}
.corelog summary{cursor:pointer;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--acc);padding:4px 0}
.corelog p{font-size:13px;margin:6px 0 4px}
.corex{padding:8px 0 12px}
.corex .exn b{font-size:15px}
.corex .av{width:34px;height:34px}
.rolist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.rolist li{display:flex;align-items:center;gap:12px;padding:8px 12px;border:1px solid var(--line);border-radius:12px;background:#0f1719;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;cursor:grab;transition:transform .18s ease}
.rolist li:focus-visible{outline:2px solid var(--acc)}
.rolist li b{flex:1;min-width:0;font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rolist .av{width:34px;height:34px}
.rolist li.lift{transition:none;position:relative;z-index:2;background:#16262a;border-color:var(--acc);box-shadow:0 12px 30px rgba(0,0,0,.6);cursor:grabbing}
.grip{display:flex;flex-direction:column;gap:3px;padding:6px 2px}
.grip i{display:block;width:18px;height:2px;border-radius:2px;background:var(--muted)}
</style>`);

// ---------------- markup: rest bar with keyboard tools, reorder sheet ----------------
rep('<div class="restbar" id="restBar" hidden><span class="label">Rest</span><b id="restTime">1:30</b><button class="chip" id="restPlus">+30 s</button><button class="chip" id="restSkip">Skip</button></div>',
  '<div class="restbar" id="restBar" hidden><i class="rprog" aria-hidden="true"><b id="restProg"></b></i><span class="rlab"><span class="label">Rest</span><b id="restTime">1:30</b></span>' +
  '<button class="chip rchip" id="restPlus">+30 s</button><button class="chip rchip" id="restSkip">Skip</button>' +
  '<span class="kbtools"><button class="kbbtn" data-kb="minus" aria-label="Decrease">−</button><button class="kbbtn" data-kb="plus" aria-label="Increase">+</button><button class="kbbtn" data-kb="next">Next</button><button class="kbbtn ok" data-kb="done" aria-label="Set done">✓</button></span></div>');
rep('<nav class="tabbar" aria-label="Sections">', `<dialog class="sheet" id="reorderSheet" aria-labelledby="roTitle">
  <div class="sheethd"><h3 id="roTitle">Reorder exercises</h3><button class="linkbtn" id="roDone">Done</button></div>
  <p class="muted" style="margin:0 0 10px;font-size:13px">Drag an exercise to where you want it.</p>
  <ul class="rolist" id="roList"></ul>
</dialog>
<nav class="tabbar" aria-label="Sections">`);

// ---------------- toasts can carry one action (Undo) ----------------
replaceFn("toast", String.raw`
function toast(msg, kind = "", act) {
  const t = document.createElement("div"); t.className = "toast " + kind + (act ? " act" : ""); t.textContent = msg;
  if (act) { const b = document.createElement("button"); b.textContent = act[0]; b.addEventListener("click", () => { t.remove(); act[1](); }); t.appendChild(b); }
  $("toasts").appendChild(t); setTimeout(() => t.remove(), act ? 5000 : kind === "big" ? 3600 : 2400);
}`);

// ---------------- saved data: core circuit sets, lock-screen chime setting ----------------
rep("ss:clampN(R.ss, 15, 600, 90), sound};", "ss:clampN(R.ss, 15, 600, 90), sound, lock:!!R.lock};");
rep("x.pr ? {pr:clampN(x.pr,0,50,0)} : {}));",
  "x.pr ? {pr:clampN(x.pr,0,50,0)} : {}, Array.isArray(x.coreEx) ? {coreEx:x.coreEx.filter(e => e && typeof e.id === \"string\" && Array.isArray(e.sets)).slice(0, 3).map(e => ({id:e.id.slice(0, 20), n:str(e.n, 60), sets:e.sets.filter(Array.isArray).slice(0, 10).map(t => [Math.max(0, +t[0] || 0), clampN(t[1],0,1000,0), !!t[2]])}))} : {}));");

// ---------------- muscles: whole sets in the lists ----------------
replaceFn("liftMuscles", String.raw`
// whole sets for the lists: a set counts once for every muscle it really works (main or helper); minor helpers only tint the map
const wholeMus = m => { const o = {}; for (const k in m) if (m[k] >= .5) o[k] = 1; return o; };
function liftMuscles(l, whole) {
  const m = {}, f = whole ? wholeMus : x => x, cx = l.coreEx || [];
  l.ex.concat(cx).forEach(x => { const n = x.sets.filter(s => s[2] && !s[3]).length; if (n) addMus(m, f(musclesFor(x.n, x.id)), n); });
  if (l.core && !cx.length) addMus(m, {abs:1, obliques:1}, l.core);
  return m;
}`);
rep("const bagMuscles = s => addMus({}, {shoulders:.6, obliques:.6, abs:.3, glutes:.3, quads:.3, calves:.3, triceps:.2, chest:.2, hamstrings:.2, adductors:.1}, s.r || 0);",
  "const bagMuscles = (s, whole) => addMus({}, (whole ? wholeMus : x => x)({shoulders:.6, obliques:.6, abs:.3, glutes:.3, quads:.3, calves:.3, triceps:.2, chest:.2, hamstrings:.2, adductors:.1}), s.r || 0);");
rep("const runMuscles = r => addMus(", "const runMuscles = (r, whole) => whole ? {} : addMus(");
replaceFn("muscleList", String.raw`
function muscleList(m, unit, n) {
  const src = n || m, top = Object.entries(src).filter(e => e[1] > (n ? .5 : .05)).sort((a, b) => b[1] - a[1] || (m[b[0]] || 0) - (m[a[0]] || 0)).slice(0, 8);
  if (!top.length) return "";
  const mx = top[0][1], lbl = v => Math.round(v) + " " + (Math.round(v) === 1 ? unit.replace(/s$/, "") : unit);
  return '<ul class="mlist">' + top.map(([k, v]) => '<li><span>' + MUSCLE_NAME[k] + '<\/span><i><b style="width:' + Math.max(6, Math.round(v / mx * 100)) + '%"><\/b><\/i><em>' + (n && unit ? lbl(v) : '') + '<\/em><\/li>').join("") + '<\/ul>';
}`);
rep("const muscleBlock = (m, sc, unit) => '<div class=\"mweek\"><div class=\"mmap big\">' + bodySVG(m, false, sc) + bodySVG(m, true, sc) + '<\\/div>' + muscleList(m, unit) + '<\\/div>';",
  "const muscleBlock = (m, sc, unit, n) => '<div class=\"mweek\"><div class=\"mmap big\">' + bodySVG(m, false, sc) + bodySVG(m, true, sc) + '<\\/div>' + muscleList(m, unit, n) + '<\\/div>';");
replaceFn("renderMuscleWeek", String.raw`
function renderMuscleWeek() {
  const from = dayKey(Date.now() - 6 * 864e5), m = {}, n = {};
  S.lifts.logs.filter(l => l.d >= from).forEach(l => { addMus(m, liftMuscles(l), 1); addMus(n, liftMuscles(l, true), 1); });
  S.sessions.filter(s => s.d >= from).forEach(s => { addMus(m, bagMuscles(s), 1); addMus(n, bagMuscles(s, true), 1); });
  S.runs.filter(r => r.d >= from).forEach(r => addMus(m, runMuscles(r), 1));
  $("musWeek").innerHTML = Object.keys(m).length ? muscleBlock(m, 2.5, "sets", n) : '<p class="muted" style="margin:0">Finish a workout and the muscles you trained light up here.<\/p>';
}`);
rep("'<div class=\"donegrid\"><ul class=\"donelist\">' + l.ex.map(x => '<li><b>' + x.sets.filter(s => s[2]).length + '×<\\/b>' + esc(x.n) + '<\\/li>').join(\"\") + (l.core ? ",
  "'<div class=\"donegrid\"><ul class=\"donelist\">' + l.ex.concat(l.coreEx || []).map(x => '<li><b>' + x.sets.filter(s => s[2]).length + '×<\\/b>' + esc(x.n) + '<\\/li>').join(\"\") + (l.core && !(l.coreEx || []).length ? ");
rep("muscleList(mus, \"sets\");", "muscleList(mus, \"sets\", liftMuscles(l, true));");
rep("$(\"sumMus\").innerHTML = muscleBlock(bagMuscles({r:clock.done}), 1, \"\");", "$(\"sumMus\").innerHTML = muscleBlock(bagMuscles({r:clock.done}), 1, \"rounds\", bagMuscles({r:clock.done}, true));");
rep("  return {vol, reps, sets};\n}", "  (l.coreEx || []).forEach(x => x.sets.forEach(s => { if (!s[2]) return; sets++; reps += s[1]; vol += s[0] * s[1]; }));\n  return {vol, reps, sets};\n}");

// ---------------- core circuit: exercises with ids, history, a clock that survives the phone locking ----------------
rep("const CORE_WORK = 40, CORE_REST = 20;", String.raw`const CORE_WORK = 40, CORE_REST = 20;
const CORE_IDS = ["core-wheel", "core-pallof", "core-chop"];
const coreExs = () => CORE.map((c, i) => ({id:CORE_IDS[i], n:c.n, s:S.lifts.coreRounds, lo:10, hi:i ? 12 : 15}));`);
rep("const coreT = {run:false, step:0, endAt:0, timer:0};", "const coreT = {run:false, step:0, endAt:0, timer:0, at:0, half:-1};");
rep("const coreDone = () => (draft[liftDay] || {}).__core || 0;",
  "const coreDone = () => { const dd = draft[liftDay] || {}; return dd.__core || (CORE_IDS.some(id => (dd[id] || []).some(s => s[2])) ? S.lifts.coreRounds : 0); };");
rep("function historyFor(id) { const out = []; S.lifts.logs.forEach(l => l.ex.forEach(e =>", "function historyFor(id) { const out = []; S.lifts.logs.forEach(l => l.ex.concat(l.coreEx || []).forEach(e =>");
replaceFn("coreTick", String.raw`
function coreTick() {
  if (!coreT.run) return;
  const st = coreSteps(), now = Date.now(), len = s => (s.work ? CORE_WORK : CORE_REST) * 1000;
  // where the circuit is now, worked out from when it started, so it catches up after the phone was locked
  let t = coreT.at, i = 0;
  while (i < st.length && t + len(st[i]) <= now) { t += len(st[i]); i++; }
  if (i >= st.length) {
    stopCore(); bell(2);
    (draft[liftDay] = draft[liftDay] || {}).__core = S.lifts.coreRounds; saveDraft();
    toast("Core finisher done. Hit Finish workout to log it."); renderLift(); return;
  }
  coreT.endAt = t + len(st[i]);
  if (i !== coreT.step) {
    const live = i === coreT.step + 1 && now - t < 1500; coreT.step = i;
    if (live) { const s = st[i]; beep(s.work ? 880 : 440); if (s.work) say(CORE[s.i].n); }
  }
  // Pallof press and chops are one-sided: cue the side switch halfway through the 40 s
  const s = st[coreT.step], left = (coreT.endAt - now) / 1000;
  if (s.work && s.i > 0 && left <= CORE_WORK / 2 && coreT.half !== coreT.step) { coreT.half = coreT.step; if (left > CORE_WORK / 2 - 1.5) { beep(660); say("Switch sides"); } }
  paintCoreClock();
}
function stopCore() { coreT.run = false; clearInterval(coreT.timer); saveTimers(); }`);
replaceFn("renderCore", String.raw`
function renderCore() {
  const box = $("coreBox");
  if (editMode) { box.innerHTML = ""; return; }
  const done = coreDone(), dd = draft[liftDay] || {}, logged = CORE_IDS.some(id => (dd[id] || []).some(s => s[2]));
  box.innerHTML = '<div class="core' + (done ? " donec" : "") + '"><div class="hd"><b>Fight core finisher<\/b><span class="label">' + S.lifts.coreRounds + ' rounds ≈ ' + Math.round(S.lifts.coreRounds * 3) + ' min<\/span><\/div>' +
    '<span class="muted" style="font-size:14px">The three jobs your core does in a fight, from <a href="https://www.youtube.com/watch?v=qARYZULKz9Q" target="_blank" rel="noopener">How To Build A Core For Fighting<\/a> (Nermin Mehmedagic). Do it last, after your big lifts.<\/span>' +
    CORE.map(c => '<div class="coreex"><span class="job">' + c.job + '<\/span><b>' + c.n + '<\/b><span class="tg2">' + c.sets + '<\/span><small>' + c.cue + '<\/small><div class="coreph">' + [0, 1].map(fr => '<img src="' + photoSrc(photoKey("", c.n), fr) + '" alt="' + (fr ? "Finish" : "Start") + ' position: ' + esc(c.n) + '" loading="lazy">').join("") + '<\/div><\/div>').join("") +
    '<div class="coreclock" id="coreClock"><img class="cimg" id="coreImg" alt=""><span class="ct">40<\/span><span class="cp"><b><\/b><small class="muted"><\/small><\/span><\/div>' +
    '<div class="row" style="justify-content:space-between"><div class="chips"><button class="chip" id="coreR3" aria-pressed="' + (S.lifts.coreRounds === 3) + '">3 rounds<\/button><button class="chip" id="coreR4" aria-pressed="' + (S.lifts.coreRounds === 4) + '">4 rounds<\/button><\/div>' +
    '<div class="row"><label class="row" style="gap:8px;cursor:pointer"><input class="tick" type="checkbox" id="coreTick"' + (done ? " checked" : "") + '><span>Done<\/span><\/label><button class="btn sm" id="coreGo">Start core circuit<\/button><\/div><\/div>' +
    '<details class="corelog" id="coreLog"' + (coreLogOpen || logged ? " open" : "") + '><summary>Log weights &amp; reps<\/summary><p class="muted">One row per round. Put the band or cable weight in; leave the ab wheel at 0, or add the plate you wear.<\/p><\/details><\/div>';
  const lg = $("coreLog"), core = box.firstElementChild;
  coreExs().forEach(ex => {
    const w = document.createElement("div"); w.className = "ex hv corex"; w.dataset.exid = ex.id; w.dataset.kind = "lift";
    w.innerHTML = '<div class="exh">' + avatar(ex.n, "", true) + '<div class="exn"><b>' + esc(ex.n) + '<\/b><\/div><\/div>';
    setTable(ex, w, () => { const d = !!coreDone(), t = $("coreTick"); if (t) t.checked = d; core.classList.toggle("donec", d); });
    if (setsFor(ex).every(s => s[2])) w.classList.add("complete");
    lg.appendChild(w);
  });
  lg.addEventListener("toggle", () => { coreLogOpen = lg.open; });
  const setR = n => { if (coreT.run) return; S.lifts.coreRounds = n; persist(); renderLift(); };
  $("coreR3").addEventListener("click", () => setR(3)); $("coreR4").addEventListener("click", () => setR(4));
  $("coreTick").addEventListener("change", e => { (draft[liftDay] = draft[liftDay] || {}).__core = e.target.checked ? S.lifts.coreRounds : 0; saveDraft(); renderLift(); });
  $("coreGo").addEventListener("click", () => {
    ac();
    if (coreT.run) { stopCore(); paintCoreClock(); return; }
    coreT.run = true; coreT.step = 0; coreT.half = -1; coreT.at = Date.now(); coreT.endAt = coreT.at + CORE_WORK * 1000; saveTimers(); bell(1); say(CORE[0].n);
    clearInterval(coreT.timer); coreT.timer = setInterval(coreTick, 250); paintCoreClock();
  });
  paintCoreClock();
}
let coreLogOpen = false;`);

// ---------------- rest timer ----------------
rep(`// ---- rest timer ----
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
$("restSkip").addEventListener("click", stopRest);`, String.raw`// ---- rest timer: saved so it survives the phone dropping the app, glides when you change it, rides on the keyboard ----
const restT = {end:0, start:0, exId:"", timer:0, anim:0};
const TIMERS_KEY = "strikepath.timers";
function saveTimers() {
  try { localStorage.setItem(TIMERS_KEY, JSON.stringify({rest:restT.end ? {end:restT.end, start:restT.start, exId:restT.exId} : null, core:coreT.run ? {day:liftDay, at:coreT.at} : null})); } catch (e) {}
}
function startRest(sec, exId) {
  if (!sec) return;
  restT.start = Date.now(); restT.end = restT.start + sec * 1000; restT.exId = exId || "";
  runRest(); restAlarm();
}
function runRest() { clearInterval(restT.timer); restT.timer = setInterval(restTick, 250); saveTimers(); restTick(); }
function stopRest() { clearInterval(restT.timer); cancelAnimationFrame(restT.anim); restT.anim = 0; restT.end = 0; saveTimers(); restAlarm(); paintBar(); }
function restTick() {
  if (!restT.end) { paintBar(); return; }
  const left = (restT.end - Date.now()) / 1000;
  if (left <= 0) { const late = left < -4; stopRest(); if (!late) notify("rest"); toast(late ? "Rest finished while you were away" : "Rest's over. Back to it"); return; }
  if (!restT.anim) $("restTime").textContent = fmtTime(left);
  $("restProg").style.width = Math.min(100, (Date.now() - restT.start) / (restT.end - restT.start) * 100) + "%";
  paintBar();
}
// move the end of a running rest: the clock counts over to the new time instead of jumping
function moveRest(end) {
  if (!restT.end) return;
  const from = Math.max(0, (restT.end - Date.now()) / 1000);
  restT.end = end;
  if (end <= Date.now() + 500) { stopRest(); notify("rest"); toast("Rest's over. Back to it"); return; }
  saveTimers(); restAlarm(); cancelAnimationFrame(restT.anim);
  const bar = $("restBar"), t0 = performance.now();
  bar.classList.remove("bump"); void bar.offsetWidth; bar.classList.add("bump");
  const step = now => { const k = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - k, 3), to = (restT.end - Date.now()) / 1000; $("restTime").textContent = fmtTime(from + (to - from) * e); restT.anim = k < 1 ? requestAnimationFrame(step) : 0; };
  restT.anim = requestAnimationFrame(step); restTick();
}
$("restPlus").addEventListener("click", () => moveRest(restT.end + 30000));
$("restSkip").addEventListener("click", stopRest);
// optional chime that still sounds with the screen locked: it plays like music, so it pauses yours during rest
let restURL = "";
function restAlarm() {
  if (running()) return;
  if (restURL) { try { bagAudio.pause(); } catch (e) {} URL.revokeObjectURL(restURL); restURL = ""; }
  const left = restT.end ? (restT.end - Date.now()) / 1000 : 0;
  if (!S.lifts.restCfg.lock || left < 2) return;
  const R = 11025, N = Math.ceil((left + 1.5) * R), out = new Int16Array(N), t0 = Math.round(left * R);
  [[660, 0], [880, .18]].forEach(([fq, dt]) => { const i0 = t0 + Math.round(dt * R), n = Math.round(.6 * R); for (let i = 0; i < n && i0 + i < N; i++) { const x = i / R; out[i0 + i] += Math.sin(2 * Math.PI * fq * x) * Math.min(1, x / .01) * Math.exp(-x * 6) * .35 * 32767; } });
  restURL = wavURL(out, R); bagAudio.src = restURL; bagAudio.currentTime = 0; bagAudio.play().catch(() => {});
  try { if ("mediaSession" in navigator && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({title:"Rest · back to work at " + hm(new Date(restT.end)), artist:"Strike Path", album:cap(liftDay) + " day", artwork:[{src:"icons/icon-512.png", sizes:"512x512", type:"image/png"}]}); } catch (e) {}
}
// the keyboard bar: while you type a weight or reps, the rest bar sits on top of the keyboard with steppers, Next and ✓
let kbField = null;
const touchUI = matchMedia("(pointer:coarse)").matches;
function paintBar() {
  const bar = $("restBar"), on = restT.end > Date.now(), kb = !!kbField && touchUI;
  bar.hidden = !(on || kb); bar.classList.toggle("kb", kb); bar.classList.toggle("noRest", !on);
  placeBar();
}
function placeBar() {
  const bar = $("restBar"), vv = window.visualViewport;
  bar.style.bottom = bar.classList.contains("kb") && vv ? Math.max(0, innerHeight - vv.height - vv.offsetTop) + "px" : "";
}
if (window.visualViewport) { visualViewport.addEventListener("resize", placeBar); visualViewport.addEventListener("scroll", placeBar); }
const isSetInput = el => !!(el && el.matches && el.matches(".str input[type=number]"));
// tapping a number selects it, so typing replaces it
document.addEventListener("focusin", e => { if (!isSetInput(e.target)) return; const t = e.target; kbField = t; setTimeout(() => { try { t.select(); } catch (x) {} }, 0); paintBar(); });
document.addEventListener("focusout", () => setTimeout(() => { if (!isSetInput(document.activeElement)) { kbField = null; paintBar(); } }, 80));
function kbAct(what) {
  const fl = kbField; if (!fl) return;
  if (what === "next") { const all = [...document.querySelectorAll("#exList .str input[type=number], #coreBox .str input[type=number]")], i = all.indexOf(fl); if (all[i + 1]) all[i + 1].focus(); else fl.blur(); return; }
  if (what === "done") {
    const row = fl.closest(".str"), ck = row && row.querySelector(".ck"); if (ck && !ck.checked) ck.click();
    const nr = row && row.parentElement.nextElementSibling, nx = nr && nr.querySelector("input[type=number]");
    if (nx) nx.focus(); else fl.blur(); return;
  }
  const card = fl.closest("[data-kind]"), kind = card ? card.dataset.kind : "lift", w = fl.dataset.f === "0";
  const step = w ? (kind === "cardio" ? .5 : inc()) : (kind === "hold" ? 5 : 1);
  fl.value = Math.max(0, Math.round(((+fl.value || 0) + (what === "plus" ? step : -step)) * 100) / 100);
  fl.dispatchEvent(new Event("input", {bubbles:true}));
}
$("restBar").querySelectorAll("[data-kb]").forEach(b => {
  b.addEventListener("pointerdown", e => { e.preventDefault(); kbAct(b.dataset.kb); });
  b.addEventListener("touchstart", e => e.preventDefault(), {passive:false});
  b.addEventListener("click", e => { if (e.detail === 0) kbAct(b.dataset.kb); });
});
// swipe a set left to delete it: a short swipe shows Delete, a long one deletes straight away
function swipeRow(wr, del) {
  const row = wr.querySelector(".str"); let d = null, open = false, moved = false;
  const put = (x, anim) => { row.style.transition = anim ? "transform .2s ease" : "none"; row.style.transform = x ? "translateX(" + x + "px)" : ""; wr.classList.toggle("sw", !!x); };
  row.addEventListener("pointerdown", e => { if (e.pointerType === "mouse" && e.button) return; d = {x0:e.clientX, y0:e.clientY, x:0, on:false, id:e.pointerId, w:wr.offsetWidth}; moved = false; });
  row.addEventListener("pointermove", e => {
    if (!d || e.pointerId !== d.id) return;
    const mx = e.clientX - d.x0, my = e.clientY - d.y0;
    if (!d.on) {
      if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) { d = null; return; }
      if (Math.abs(mx) < 12 || Math.abs(mx) < Math.abs(my)) return;
      d.on = moved = true; try { row.setPointerCapture(d.id); } catch (x) {}
      if (row.contains(document.activeElement)) document.activeElement.blur();
    }
    d.x = Math.min(0, mx + (open ? -96 : 0)); put(d.x, false);
  });
  const end = () => {
    if (!d) return; const g = d; d = null;
    if (!g.on) { if (open) { open = false; put(0, true); } return; }
    if (g.x < -g.w * .4) {
      row.style.transition = "transform .18s ease"; row.style.transform = "translateX(-100%)"; wr.classList.add("gone");
      setTimeout(() => { if (del() === false) { wr.classList.remove("gone"); open = false; put(0, true); } }, 200); return;
    }
    open = g.x < -44; put(open ? -96 : 0, true);
  };
  row.addEventListener("pointerup", end); row.addEventListener("pointercancel", end);
  row.addEventListener("click", e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  wr.querySelector(".swdel").addEventListener("click", () => { if (del() === false) { open = false; put(0, true); } });
}
function longPress(el, fn) {
  let t = 0, x0 = 0, y0 = 0, fired = false;
  el.addEventListener("pointerdown", e => { if (e.target.closest(".exmenu")) return; fired = false; x0 = e.clientX; y0 = e.clientY; clearTimeout(t); t = setTimeout(() => { fired = true; try { navigator.vibrate && navigator.vibrate(15); } catch (x) {} fn(); }, 450); });
  el.addEventListener("pointermove", e => { if (Math.hypot(e.clientX - x0, e.clientY - y0) > 8) clearTimeout(t); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev => el.addEventListener(ev, () => clearTimeout(t)));
  el.addEventListener("click", e => { if (fired) { e.preventDefault(); e.stopPropagation(); fired = false; } }, true);
  el.addEventListener("contextmenu", e => e.preventDefault());
}`);

// ---------------- the live workout ----------------
rep("const ICON = {\n", "const ICON = {\n  trash:'<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3\"/><\\/svg>',\n");
replaceFn("renderLift", String.raw`
function renderLift() {
  renderRot(); renderRestPanel(); recentLifts(); if (!$("view-trophies").hidden) renderWeek();
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
  const vis = visibleProg(); liftAwake();
  vis.forEach((ex, xi) => {
    const card = document.createElement("div"); card.className = "ex hv"; card.dataset.exid = ex.id; card.dataset.kind = kindOf(ex);
    const sets = setsFor(ex), sg = suggestion(ex), id = logId(ex), H = historyFor(id);
    const kind = kindOf(ex), tags = tagsFor(ex, prog), fmtSet = fmtSetFor(ex);
    if (sets.every(s => s[2])) card.classList.add("complete");
    const best = kind === "lift" ? bestFor(id) : 0, mw = kind === "lift" ? maxWeight(id) : 0;
    const hist = H.length ? '<details class="hist" data-id="' + id + '"' + (openHist.has(id) ? " open" : "") + '><summary>History · ' + H.length + ' session' + (H.length > 1 ? "s" : "") + (mw ? ' · heaviest ' + mw + ' ' + U() : '') + (best ? ' · 1-rep max est. ' + Math.round(best) : '') + '<\/summary>' +
      (kind === "lift" ? spark(H.slice(-12).map(h => Math.max(...h.sets.map(s => e1rm(s[0], s[1]))))) : "") +
      '<ul>' + H.slice(-6).reverse().map(h => '<li>' + niceDate(h.d) + ': ' + h.sets.map(fmtSet).join(", ") + '<\/li>').join("") + '<\/ul><\/details>' : '';
    const dd = draft[liftDay], notes = (dd.__notes = dd.__notes || {}), lastNote = lastNoteFor(id), rs = restFor(ex), noteOpen = openNotes.has(id) || !!notes[id];
    const ropts = REST_OPTS.includes(rs) ? REST_OPTS : REST_OPTS.concat(rs).sort((a, b) => a - b);
    const tempTag = (dd.__temp || []).includes(ex.id) ? '<span class="tagc">Today only<\/span> ' : '';
    card.innerHTML = '<div class="exh">' + avatar(ex.n, ex.id, true) + '<div class="exn"><b>' + esc(ex.n) + '<\/b>' + ((tempTag + tags) ? '<div>' + tempTag + tags + '<\/div>' : '') + '<\/div><span class="tgt">' + targetFor(ex) + '<\/span><button class="roundbtn sm exmenu" aria-label="Options for ' + esc(ex.n) + '">' + ICON.dots + '<\/button><\/div>' +
      '<div class="pills">' + (kind === "cardio" ? '' : '<label class="pill">' + ICON.clock + '<select aria-label="Rest timer for ' + esc(ex.n) + '">' + ropts.map(v => '<option value="' + v + '"' + (v === rs ? " selected" : "") + '>Rest: ' + fmtRest(v) + '<\/option>').join("") + '<\/select><\/label>') +
        '<button class="pill" data-note aria-pressed="' + noteOpen + '">' + ICON.note + 'Note<\/button><\/div>' +
      '<textarea class="exnote" data-nid="' + esc(id) + '" maxlength="300" aria-label="Note for ' + esc(ex.n) + '" placeholder="' + esc(lastNote ? "Last time: " + lastNote : "Add a note for this exercise") + '"' + (noteOpen ? "" : " hidden") + '>' + esc(notes[id] || "") + '<\/textarea>' +
      '<div class="sugg2">' + esc(sg.note) + '<\/div>';
    setTable(ex, card, (i, on) => {
      if (!on || kind === "cardio") return;
      if (sets.every(s => s[2])) toast("Nice work: " + ex.n + " done");
      if (xi === vis.length - 1 && sets.every(s => s[2])) return;
      if (ex.ss && partnerAfter(vis, xi) && !sets[i][3]) { toast("Superset: straight to " + vis[xi + 1].n); return; }
      startRest(restFor(ex), id);
    });
    if (hist) card.insertAdjacentHTML("beforeend", hist);
    card.querySelector(".exmenu").addEventListener("click", () => exMenu(ex));
    longPress(card.querySelector(".exh"), openReorder);
    const det = card.querySelector("details"); if (det) det.addEventListener("toggle", () => { if (det.open) openHist.add(id); else openHist.delete(id); });
    // a new rest for this exercise moves the timer that's already counting for it
    const sel = card.querySelector("select"); if (sel) sel.addEventListener("change", () => { ex.rest = +sel.value; persist(); if (restT.end && restT.exId === id) moveRest(restT.start + ex.rest * 1000); });
    card.querySelector("[data-note]").addEventListener("click", () => {
      if (openNotes.has(id)) openNotes.delete(id); else openNotes.add(id);
      renderLift(); const t = document.querySelector('.exnote[data-nid="' + id + '"]'); if (t && !t.hidden) t.focus();
    });
    card.querySelector(".exnote").addEventListener("input", e => { notes[id] = e.target.value.slice(0, 300); saveDraft(); });
    list.appendChild(card);
  });
  const addEx = document.createElement("button"); addEx.className = "btn ghost full addex"; addEx.textContent = "+ Add Exercise"; addEx.addEventListener("click", () => openPicker("add")); list.appendChild(addEx);
  const sk = draft[liftDay].__skip || [], skipped = prog.filter(e => sk.includes(logId(e)));
  if (skipped.length) {
    const p = document.createElement("p"); p.className = "skipnote";
    p.innerHTML = 'Skipped today: ' + skipped.map(e => '<button class="linkbtn" data-unskip="' + esc(logId(e)) + '" aria-label="Bring back ' + esc(e.n) + '">' + esc(e.n) + ' ↺<\/button>').join(" ");
    p.querySelectorAll("[data-unskip]").forEach(b => b.addEventListener("click", () => { draft[liftDay].__skip = sk.filter(x => x !== b.dataset.unskip); saveDraft(); renderLift(); }));
    list.appendChild(p);
  }
  const tot = wkTotals();
  head.innerHTML = back("Minimize workout", ICON.down) + '<h2>Log Workout<\/h2><button class="roundbtn" id="wkTrash" aria-label="Discard workout">' + ICON.trash + '<\/button><button class="roundbtn" id="wkSet2" aria-label="Rest timer settings">' + ICON.clock + '<\/button><button class="btn blue sm" id="wkFinish">Finish<\/button>' +
    '<div class="wkstats"><div><span>Duration<\/span><b class="acc" data-since="' + startedAt() + '">' + fmtClock((Date.now() - startedAt()) / 1000) + '<\/b><\/div><div><span>Volume<\/span><b id="wsVol">' + Math.round(tot.v).toLocaleString() + ' ' + U() + '<\/b><\/div><div><span>Sets<\/span><b id="wsSets">' + tot.n + '<\/b><\/div><\/div>';
  bindBack();
  $("wkSet2").addEventListener("click", openSheet);
  $("wkTrash").addEventListener("click", confirmDiscard);
  $("wkFinish").addEventListener("click", () => { if (!wkTotals().n && !coreDone()) { toast("Check off at least one set first"); return; } $("finishLift").click(); });
  renderCore();
  const disc = document.createElement("button"); disc.className = "discard"; disc.textContent = "Discard Workout";
  disc.addEventListener("click", confirmDiscard);
  $("coreBox").appendChild(disc);
}
// one exercise's sets (the lift cards and the core circuit share it). onDone(i, checked) runs after a set is ticked or unticked.
function setTable(ex, wrap, onDone) {
  const sets = setsFor(ex), sg = suggestion(ex), id = logId(ex), H = historyFor(id), L = H.length ? H[H.length - 1] : null;
  const kind = kindOf(ex), c = colsFor(ex), sid = i => liftDay + "-" + id.replace("@", "_") + "-" + i, prevs = [];
  let wn = 0;
  const rows = sets.map((s, i) => {
    const warm = !!s[3], n = warm ? 0 : ++wn, p = warm || !L ? null : L.sets[n - 1] || null; prevs[i] = p;
    return '<div class="swr"><button class="swdel" tabindex="-1" aria-hidden="true">Delete<\/button><div class="str' + (s[2] ? " done" : "") + (warm ? " warm" : "") + '"><button class="sn" data-i="' + i + '" aria-label="' + (warm ? "Warm-up set" : "Set " + n) + '. Tap for set options, or swipe the row left to delete it">' + (warm ? "W" : n) + '<\/button>' +
      '<button class="prev" data-i="' + i + '"' + (p ? ' aria-label="Copy last time: ' + esc(prevStr(ex, p)) + '"' : ' disabled') + '>' + esc(prevStr(ex, p)) + '<\/button>' +
      (kind === "hold" ? '<span><\/span>' : '<input type="number" inputmode="decimal" enterkeyhint="next" step="' + (kind === "cardio" ? "0.1" : "0.5") + '" min="0" id="w-' + sid(i) + '" data-i="' + i + '" data-f="0" value="' + (s[0] === "" ? "" : s[0]) + '" placeholder="0" aria-label="' + (kind === "cardio" ? "Distance in km" : "Set " + (i + 1) + (ex.assist ? " assistance" : " weight")) + '">') +
      '<input type="number" inputmode="numeric" enterkeyhint="next" step="1" min="0" id="r-' + sid(i) + '" data-i="' + i + '" data-f="1" value="' + s[1] + '" aria-label="' + (kind === "cardio" ? "Minutes" : kind === "hold" ? "Seconds" : "Set " + (i + 1) + " reps") + '">' +
      '<input class="ck" type="checkbox" id="d-' + sid(i) + '" data-i="' + i + '" aria-label="Set ' + (i + 1) + ' done"' + (s[2] ? " checked" : "") + '><\/div><\/div>';
  }).join("");
  const box = document.createElement("div"); box.style.display = "contents";
  box.innerHTML = '<div class="stbl"><div class="sth"><span>Set<\/span><span>Previous<\/span><span>' + c[0] + '<\/span><span>' + c[1] + '<\/span><span aria-label="Done">✓<\/span><\/div>' + rows + '<\/div><div class="addrow"><button class="addset">+ Add Set<\/button><\/div>';
  wrap.appendChild(box);
  const delSet = i => {
    if (sets.length <= 1) { toast("Keep at least one set. To drop the exercise, use its ⋯ menu"); return false; }
    const gone = sets.splice(i, 1)[0]; saveDraft(); renderLift();
    toast("Set deleted", "", ["Undo", () => { sets.splice(Math.min(i, sets.length), 0, gone); saveDraft(); renderLift(); }]);
  };
  box.querySelectorAll("input[type=number]").forEach(inp => inp.addEventListener("input", () => { sets[+inp.dataset.i][+inp.dataset.f] = inp.value === "" ? "" : +inp.value; saveDraft(); paintWkStats(); }));
  box.querySelectorAll(".swr").forEach((wr, i) => swipeRow(wr, () => delSet(i)));
  box.querySelectorAll(".sn").forEach(b => b.addEventListener("click", () => {
    const i = +b.dataset.i, s = sets[i];
    actionSheet((s[3] ? "Warm-up set" : "Set " + b.textContent) + " · " + ex.n, [
      [s[3] ? "Make it a working set" : "Make it a warm-up set", () => { if (s[3]) s.length = 3; else s[3] = 1; saveDraft(); renderLift(); }],
      sets.length > 1 && ["Delete this set", () => delSet(i), true]
    ]);
  }));
  box.querySelectorAll(".prev").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.i, p = prevs[i]; if (!p) return; sets[i][0] = p[0]; sets[i][1] = p[1]; saveDraft(); renderLift(); }));
  box.querySelector(".addset").addEventListener("click", () => {
    if (sets.length >= 10) { toast("10 sets is the most for one exercise"); return; }
    const l = sets[sets.length - 1] || [sg.w, sg.r]; sets.push([l[0], l[1], false]); saveDraft(); renderLift();
  });
  // ticking a set updates just that row, so the page doesn't jump while you're logging
  box.querySelectorAll("input.ck").forEach(cb => cb.addEventListener("change", () => {
    const i = +cb.dataset.i, s = sets[i], row = cb.closest(".str");
    s[2] = cb.checked;
    if (s[0] === "") { s[0] = 0; const w = $("w-" + sid(i)); if (w) w.value = 0; }
    const nx = sets[i + 1];
    if (cb.checked && nx && !nx[2]) [0, 1].forEach(k => { if (nx[k] === "" || nx[k] == null) { nx[k] = s[k]; const el = $((k ? "r-" : "w-") + sid(i + 1)); if (el) el.value = s[k]; } });
    saveDraft();
    row.classList.toggle("done", cb.checked);
    (wrap.closest(".ex") || wrap).classList.toggle("complete", sets.every(x => x[2]));
    if (cb.checked) prCheck(ex, sets);
    paintWkStats();
    if (onDone) onDone(i, cb.checked);
  }));
}
function wkTotals() {
  const dd = draft[liftDay] || {}; let n = 0, v = 0;
  visibleProg().forEach(ex => { const s = dd[logId(ex)] || []; n += s.filter(x => x[2]).length; if (kindOf(ex) === "lift" && !ex.assist) v += setVol(s); });
  CORE_IDS.forEach(id => { const s = dd[id] || []; n += s.filter(x => x[2]).length; v += setVol(s); });
  return {n, v};
}
function paintWkStats() { const t = wkTotals(), a = $("wsVol"), b = $("wsSets"); if (a) a.textContent = Math.round(t.v).toLocaleString() + " " + U(); if (b) b.textContent = t.n; }
// discard: easy to find (trash icon up top), hard to do by accident (press and hold)
function confirmDiscard() {
  const n = wkTotals().n;
  $("actTitle").textContent = "Discard this workout?";
  const L = $("actList");
  L.innerHTML = '<p class="muted" style="margin:0 0 4px">' + (n ? n + " logged set" + (n === 1 ? "" : "s") + " will be lost. " : "") + 'Press and hold to discard.<\/p><button class="holdbtn" id="holdDisc"><i><\/i><span>Hold to discard<\/span><\/button><button class="actbtn" id="keepW">Keep training<\/button>';
  const b = $("holdDisc"); let t = 0;
  const go = e => { e.preventDefault(); clearTimeout(t); b.classList.add("holding"); t = setTimeout(() => { $("actSheet").close(); discardWorkout(); }, 1200); };
  const stop = () => { clearTimeout(t); b.classList.remove("holding"); };
  b.addEventListener("pointerdown", go); ["pointerup", "pointerleave", "pointercancel"].forEach(ev => b.addEventListener(ev, stop));
  b.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) go(e); }); b.addEventListener("keyup", stop);
  b.addEventListener("contextmenu", e => e.preventDefault());
  $("keepW").addEventListener("click", () => $("actSheet").close());
  const d = $("actSheet"); try { d.showModal(); } catch (e) { d.setAttribute("open", ""); }
}
function discardWorkout() {
  cleanupRoutine(draft[liftDay] || {}); persist(); delete draft[liftDay]; saveDraft(); openNotes.clear(); stopRest(); stopCore();
  try { swWake && swWake.release(); } catch (e) {}
  toast("Workout discarded"); renderLift();
}
// reorder: the workout collapses to names you drag into place
function openReorder() {
  const order = visibleProg().slice(), L = $("roList"), dlg = $("reorderSheet");
  if (order.length < 2) return;
  const paint = () => { L.innerHTML = order.map((ex, i) => '<li data-i="' + i + '" tabindex="0" aria-label="' + esc(ex.n) + ', ' + (i + 1) + ' of ' + order.length + '. Drag it, or use the up and down arrow keys">' + avatar(ex.n, ex.id, false) + '<b>' + esc(ex.n) + '<\/b><span class="grip" aria-hidden="true"><i><\/i><i><\/i><i><\/i><\/span><\/li>').join(""); };
  const move = (a, b) => { order.splice(b, 0, order.splice(a, 1)[0]); paint(); };
  paint();
  let d = null;
  L.onpointerdown = e => { const li = e.target.closest("li"); if (!li || (e.pointerType === "mouse" && e.button)) return; d = {li, from:+li.dataset.i, to:+li.dataset.i, y0:e.clientY, s0:dlg.scrollTop, h:li.getBoundingClientRect().height + 6, on:false, id:e.pointerId}; };
  L.onpointermove = e => {
    if (!d || e.pointerId !== d.id) return;
    const dy = e.clientY - d.y0 + dlg.scrollTop - d.s0;
    if (!d.on) { if (Math.abs(dy) < 5) return; d.on = true; try { d.li.setPointerCapture(d.id); } catch (x) {} d.li.classList.add("lift"); try { navigator.vibrate && navigator.vibrate(10); } catch (x) {} }
    d.to = Math.max(0, Math.min(order.length - 1, d.from + Math.round(dy / d.h)));
    d.li.style.transform = "translateY(" + dy + "px)";
    [...L.children].forEach((x, j) => { if (x !== d.li) x.style.transform = j > d.from && j <= d.to ? "translateY(" + -d.h + "px)" : j < d.from && j >= d.to ? "translateY(" + d.h + "px)" : ""; });
    const r = dlg.getBoundingClientRect(); if (e.clientY < r.top + 60) dlg.scrollTop -= 8; else if (e.clientY > r.bottom - 60) dlg.scrollTop += 8;
  };
  L.onpointerup = L.onpointercancel = () => { if (!d) return; const g = d; d = null; if (g.on && g.to !== g.from) move(g.from, g.to); else paint(); };
  L.onkeydown = e => { const li = e.target.closest("li"); if (!li) return; const i = +li.dataset.i, j = e.key === "ArrowUp" ? i - 1 : e.key === "ArrowDown" ? i + 1 : -1; if (j < 0 || j >= order.length) return; e.preventDefault(); move(i, j); L.children[j].focus(); };
  $("roDone").onclick = () => {
    // the new order fills the places the visible exercises had; skipped ones stay where they were
    const prog = S.lifts.prog[liftDay], slots = []; prog.forEach((e, i) => { if (order.includes(e)) slots.push(i); });
    slots.forEach((p, k) => { prog[p] = order[k]; });
    persist(); dlg.close(); renderLift();
  };
  try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
}`);
rep("function moveEx(ex, dir) {\n  const prog = S.lifts.prog[liftDay], vis = visibleProg(), i = vis.indexOf(ex), other = vis[i + dir]; if (!other) return;\n  prog.splice(prog.indexOf(ex), 1); prog.splice(prog.indexOf(other) + (dir > 0 ? 1 : 0), 0, ex);\n  persist(); renderLift();\n}\n", "");
rep(`    i > 0 && ["Move up", () => moveEx(ex, -1)],
    i < vis.length - 1 && ["Move down", () => moveEx(ex, 1)],`, `    vis.length > 1 && ["Reorder exercises", openReorder],`);

// ---------------- finish: log the core sets, stop the core clock ----------------
rep("note:((dd.__notes || {})[logId(ex)] || \"\").trim().slice(0, 300) || undefined})).filter(e => e.sets.some(s => s[2])), core:dd.__core || 0};",
  "note:((dd.__notes || {})[logId(ex)] || \"\").trim().slice(0, 300) || undefined})).filter(e => e.sets.some(s => s[2])), core:coreDone(),\n" +
  "    coreEx:coreExs().map(ex => ({id:ex.id, n:ex.n, sets:(dd[ex.id] || []).filter(s => s[2]).map(s => [+s[0] || 0, +s[1] || 0, true])})).filter(e => e.sets.length)};\n  if (!log.coreEx.length) delete log.coreEx;");
rep("  if (coreT.run) { coreT.run = false; clearInterval(coreT.timer); }\n  stopRest();", "  stopCore();\n  stopRest();");

// ---------------- rest settings: the lock-screen chime ----------------
rep("'<span class=\"muted\" style=\"font-size:13px\">Set a custom rest for any exercise in Edit routine. Phones may only vibrate if sound is muted.<\\/span><\\/div>';",
  "'<div class=\"rw\"><span>Phone locked<\\/span><div class=\"chips\"><button class=\"chip\" id=\"lockRest\" aria-pressed=\"' + !!c.lock + '\">Chime on the lock screen<\\/button><\\/div><\\/div>' +\n" +
  "    '<span class=\"muted\" style=\"font-size:13px\">Set a custom rest for any exercise in Edit routine. Phones may only vibrate if sound is muted. The lock-screen chime plays like music, so it pauses your music while you rest.<\\/span><\\/div>';");
rep("$(\"sndTest\").addEventListener(\"click\", () => notify(\"rest\"));", "$(\"sndTest\").addEventListener(\"click\", () => notify(\"rest\"));\n  $(\"lockRest\").addEventListener(\"click\", () => { c.lock = !c.lock; persist(); renderRestPanel(); restAlarm(); });");

// ---------------- bring timers back after the app was closed or reloaded ----------------
rep("document.addEventListener(\"visibilitychange\", liftAwake);\n", String.raw`document.addEventListener("visibilitychange", liftAwake);
// a rest or core timer that was running when the phone dropped the app (or it reloaded) carries on where it should be
(function restoreTimers() {
  let t = null; try { t = JSON.parse(localStorage.getItem(TIMERS_KEY) || "null"); } catch (e) {}
  if (!t || !liveDay()) return;
  if (t.rest && t.rest.end > Date.now() - 60000) { restT.end = t.rest.end; restT.start = t.rest.start; restT.exId = t.rest.exId || ""; runRest(); }
  if (t.core && t.core.day === liftDay && Date.now() - t.core.at < 3600000) { coreT.run = true; coreT.at = t.core.at; coreT.step = -1; coreT.half = -1; clearInterval(coreT.timer); coreT.timer = setInterval(coreTick, 250); }
})();
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { restTick(); coreTick(); } });
// the app waits to install an update until no workout is running
window.spBusy = () => !!liveDay() || running();
`);

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
if (h.slice(sStart + 9, sEnd).indexOf("</") >= 0) throw new Error("raw </ in script");
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);

// ---------------- build: don't reload for an update in the middle of a workout ----------------
const bf = path.join(__dirname, "..", "build.js");
let b = fs.readFileSync(bf, "utf8");
const old = `'  navigator.serviceWorker.addEventListener("controllerchange", () => { if (had && !reloaded) { reloaded = true; location.reload(); } });\\n' +`;
if (!b.includes("spBusy")) {
  if (!b.includes(old)) throw new Error("build.js: couldn't find the controllerchange line");
  b = b.replace(old, () => `'  // ...but never in the middle of a workout: wait until it is finished or discarded\\n' +
  '  const reload = () => { if (window.spBusy && window.spBusy()) setTimeout(reload, 5000); else location.reload(); };\\n' +
  '  navigator.serviceWorker.addEventListener("controllerchange", () => { if (had && !reloaded) { reloaded = true; reload(); } });\\n' +`);
  fs.writeFileSync(bf, b);
}
console.log("workout feedback applied");
