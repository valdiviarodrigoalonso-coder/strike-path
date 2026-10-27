// Change a workout while you're in it (ready for a real gym session):
// - "+ Add Exercise" opens a picker: your own exercises and a library with photos, or type any name (weights / assisted /
//   timed hold / cardio). Added for today only, unless you tick "Also save to my routine".
// - Each exercise has a ⋯ menu: Replace, Move up/down, Skip for today (undo from the list), Remove from routine.
// - Tap a set number: make it a warm-up / working set, or delete that exact set.
// - Edit routine's "+ Add exercise" uses the same picker.
// - The screen asks to stay awake again while a lifting workout is running (phones drop the request).
// Today-only exercises leave the routine when you finish or discard; their sets still go in your log.
// Run once: node tools/patches/2026-10-28-edit-live-workout.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("function openPicker(")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 100)); h = h.replace(a, b); };

// ---------------- markup: an action sheet and the exercise picker ----------------
rep('<nav class="tabbar" aria-label="Sections">', String.raw`<dialog class="sheet" id="actSheet" aria-labelledby="actTitle">
  <div class="sheethd"><h3 id="actTitle">Options</h3><button class="linkbtn" id="actClose">Cancel</button></div>
  <div class="actlist" id="actList"></div>
</dialog>
<dialog class="sheet" id="exPick" aria-labelledby="pickTitle">
  <div class="sheethd"><h3 id="pickTitle">Add exercise</h3><button class="linkbtn" id="pickClose">Cancel</button></div>
  <input id="pickQ" type="search" placeholder="Search, or type a new exercise" autocomplete="off" autocapitalize="words" enterkeyhint="search">
  <label class="pickkeep" id="pickKeepRow"><input type="checkbox" id="pickKeep"><span id="pickKeepLbl">Also save to my routine</span></label>
  <div class="picklist" id="pickList"></div>
</dialog>
<nav class="tabbar" aria-label="Sections">`);

// ---------------- styles ----------------
rep("</style>", String.raw`/* live workout editing */
.actlist{display:flex;flex-direction:column;gap:8px}
.actbtn{width:100%;text-align:left;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--fg);border-radius:12px;padding:14px 16px;font:inherit;font-size:16px;font-weight:600;cursor:pointer}
.actbtn:hover{background:rgba(255,255,255,.08)}
.actbtn.danger{color:#ff7a68}
#pickQ{width:100%;background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:10px;padding:12px;font-size:16px;color:var(--fg);margin-bottom:10px}
.pickkeep{display:flex;gap:10px;align-items:center;font-size:14px;color:var(--muted);margin-bottom:10px;cursor:pointer}
.pickkeep input{width:20px;height:20px;accent-color:var(--acc);margin:0}
.picklist{display:flex;flex-direction:column;max-height:56vh;overflow:auto;overscroll-behavior:contain}
.pickrow{display:flex;align-items:center;gap:12px;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--fg);text-align:left;padding:9px 2px;cursor:pointer;font:inherit}
.pickrow b{display:block;font-size:15px;font-weight:600}.pickrow small{display:block;color:var(--muted);font-size:12px}
.pickrow .av{width:40px;height:40px}
.pickcustom{display:flex;flex-direction:column;gap:10px;padding:12px;border:1px dashed rgba(233,230,223,.25);border-radius:12px;margin-bottom:8px}
.exmenu{flex:none;margin-left:-4px}
.addex{margin-top:16px}
.skipnote{font-size:13px;color:var(--muted);margin:12px 0 0;line-height:1.8}
.skipnote .linkbtn{font-size:13px;padding:2px 4px}
</style>`);

// ---------------- the live list: only exercises you haven't skipped, each with a ⋯ menu ----------------
rep("  prog.forEach((ex, xi) => {\n    const card = document.createElement(\"div\"); card.className = \"ex hv\";\n    const sets = setsFor(ex)",
    "  const vis = visibleProg(); liftAwake();\n  vis.forEach((ex, xi) => {\n    const card = document.createElement(\"div\"); card.className = \"ex hv\"; card.dataset.exid = ex.id;\n    const sets = setsFor(ex)");
rep("'. Tap to switch between warm-up and working set\">'", "'. Tap for set options\">'");
rep("    card.innerHTML = '<div class=\"exh\">' + avatar(ex.n, ex.id, true) + '<div class=\"exn\"><b>' + esc(ex.n) + '<\\/b>' + (tags ? '<div>' + tags + '<\\/div>' : '') + '<\\/div><span class=\"tgt\">' + targetFor(ex) + '<\\/span><\\/div>' +",
    "    const tempTag = (draft[liftDay].__temp || []).includes(ex.id) ? '<span class=\"tagc\">Today only<\\/span> ' : '';\n" +
    "    card.innerHTML = '<div class=\"exh\">' + avatar(ex.n, ex.id, true) + '<div class=\"exn\"><b>' + esc(ex.n) + '<\\/b>' + ((tempTag + tags) ? '<div>' + tempTag + tags + '<\\/div>' : '') + '<\\/div><span class=\"tgt\">' + targetFor(ex) + '<\\/span><button class=\"roundbtn sm exmenu\" aria-label=\"Options for ' + esc(ex.n) + '\">' + ICON.dots + '<\\/button><\\/div>' +");
rep("    const det = card.querySelector(\"details\"); if (det) det.addEventListener(\"toggle\",",
    "    card.querySelector(\".exmenu\").addEventListener(\"click\", () => exMenu(ex));\n    const det = card.querySelector(\"details\"); if (det) det.addEventListener(\"toggle\",");
rep("    card.querySelectorAll(\".sn\").forEach(b => b.addEventListener(\"click\", () => { const s = sets[+b.dataset.i]; if (s[3]) s.length = 3; else s[3] = 1; saveDraft(); renderLift(); }));",
    String.raw`    card.querySelectorAll(".sn").forEach(b => b.addEventListener("click", () => {
      const i = +b.dataset.i, s = sets[i];
      actionSheet((s[3] ? "Warm-up set" : "Set " + b.textContent) + " · " + ex.n, [
        [s[3] ? "Make it a working set" : "Make it a warm-up set", () => { if (s[3]) s.length = 3; else s[3] = 1; saveDraft(); renderLift(); }],
        sets.length > 1 && ["Delete this set", () => { sets.splice(i, 1); saveDraft(); renderLift(); }, true]
      ]);
    }));`);
rep("      if (xi === prog.length - 1 && sets.every(s => s[2])) return;\n      if (ex.ss && partnerAfter(prog, xi) && !sets[i][3]) { toast(\"Superset: straight to \" + prog[xi + 1].n); return; }",
    "      if (xi === vis.length - 1 && sets.every(s => s[2])) return;\n      if (ex.ss && partnerAfter(vis, xi) && !sets[i][3]) { toast(\"Superset: straight to \" + vis[xi + 1].n); return; }");
rep("  head.innerHTML = back(\"Minimize workout\", ICON.down)",
    String.raw`  const addEx = document.createElement("button"); addEx.className = "btn ghost full addex"; addEx.textContent = "+ Add Exercise"; addEx.addEventListener("click", () => openPicker("add")); list.appendChild(addEx);
  const sk = draft[liftDay].__skip || [], skipped = prog.filter(e => sk.includes(logId(e)));
  if (skipped.length) {
    const p = document.createElement("p"); p.className = "skipnote";
    p.innerHTML = 'Skipped today: ' + skipped.map(e => '<button class="linkbtn" data-unskip="' + esc(logId(e)) + '" aria-label="Bring back ' + esc(e.n) + '">' + esc(e.n) + ' ↺<\/button>').join(" ");
    p.querySelectorAll("[data-unskip]").forEach(b => b.addEventListener("click", () => { draft[liftDay].__skip = sk.filter(x => x !== b.dataset.unskip); saveDraft(); renderLift(); }));
    list.appendChild(p);
  }
  head.innerHTML = back("Minimize workout", ICON.down)`);

// ---------------- today-only exercises leave the routine when the workout ends ----------------
rep("  S.lifts.logs.push(log); S.prs += prCount; markToday();", "  S.lifts.logs.push(log); S.prs += prCount; markToday(); cleanupRoutine(dd);");
rep("if (discardArmed > Date.now()) { delete draft[liftDay];", "if (discardArmed > Date.now()) { cleanupRoutine(draft[liftDay] || {}); persist(); delete draft[liftDay];");

// ---------------- Edit routine uses the picker too ----------------
rep('add.addEventListener("click", () => { prog.push(exd("x" + Date.now().toString(36), "New exercise", 3, 8, 12)); persist(); renderLift(); });',
    'add.addEventListener("click", () => openPicker("edit"));');

// ---------------- the logic ----------------
rep('function recentLifts() { $("fitList").innerHTML = FIT.map(f => "<li><span>" + f + "<\\/span><\\/li>").join(""); }', String.raw`function recentLifts() { $("fitList").innerHTML = FIT.map(f => "<li><span>" + f + "<\/span><\/li>").join(""); }

// ---- change a workout while you're in it ----
const EX_LIB = [
  ["Bench Press"], ["Incline Dumbbell Press"], ["Shoulder Press"], ["Dips (assisted)", {assist:true}], ["Push-Ups"], ["Chest Fly"], ["Lateral Raise", {lo:12, hi:20}],
  ["Tricep Pushdown"], ["Tricep Kickback"], ["Skull Crushers"],
  ["Pull-Ups"], ["Assisted Pull-Ups", {assist:true}], ["Lat Pulldown"], ["Seated Cable Row"], ["Dumbbell Row"], ["Straight-Arm Pulldown", {lo:12, hi:15}], ["Rear Delt Fly", {lo:12, hi:20}], ["Face Pull", {lo:12, hi:15}],
  ["Incline Dumbbell Curl"], ["Hammer Curl"], ["Reverse Curl"], ["Wrist Curl", {lo:12, hi:20}], ["Shrug"], ["Dead Hang", {type:"hold", s:2, lo:30, hi:60}],
  ["Back Squat", {lo:5, hi:8}], ["Leg Press"], ["Romanian Deadlift"], ["Deadlift", {lo:3, hi:6}], ["Hip Thrust"], ["Bulgarian Split Squat"], ["Leg Extension", {lo:12, hi:15}], ["Leg Curl"], ["Hip Adduction", {lo:12, hi:15}], ["Calf Press", {lo:12, hi:15}],
  ["Ab Wheel Rollout", {lo:8, hi:15}], ["Pallof Press", {lo:10, hi:12}], ["Cable Wood Chop", {lo:10, hi:12}], ["Hanging Leg Raise", {lo:8, hi:15}], ["Plank", {type:"hold", lo:30, hi:60}],
  ["Treadmill", {type:"cardio", s:1, lo:5, hi:10}], ["Elliptical", {type:"cardio", s:1, lo:5, hi:15}], ["Stationary Bike", {type:"cardio", s:1, lo:5, hi:15}], ["Jump Rope", {type:"cardio", s:1, lo:3, hi:10}]
];
const KINDS = [["lift", "Weights"], ["assist", "Assisted"], ["hold", "Timed hold"], ["cardio", "Cardio"]];
let picker = {mode:"add", kind:"lift"};
const visibleProg = () => { const sk = (draft[liftDay] || {}).__skip || []; return S.lifts.prog[liftDay].filter(e => !sk.includes(logId(e))); };
function newEx(n, o) {
  o = o || {}; const t = o.type;
  return exd("x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4), String(n).slice(0, 60), o.s || (t === "cardio" ? 1 : 3), o.lo || (t === "hold" ? 30 : t === "cardio" ? 5 : 8), o.hi || (t === "hold" ? 60 : t === "cardio" ? 10 : 12), Object.assign({}, t ? {type:t} : {}, o.assist ? {assist:true} : {}));
}
const skipToday = ex => { const dd = draft[liftDay]; (dd.__skip = dd.__skip || []).push(logId(ex)); };
// today-only additions, and exercises removed from the routine after you already logged sets on them, leave the routine at the end
function cleanupRoutine(dd) {
  const gone = new Set([...(dd.__temp || []), ...(dd.__drop || [])]);
  if (gone.size) S.lifts.prog[liftDay] = S.lifts.prog[liftDay].filter(e => !gone.has(e.id));
}
function actionSheet(title, items) {
  $("actTitle").textContent = title;
  const L = $("actList"); L.textContent = "";
  items.filter(Boolean).forEach(([label, fn, danger]) => {
    const b = document.createElement("button"); b.className = "actbtn" + (danger ? " danger" : ""); b.textContent = label;
    b.addEventListener("click", () => { $("actSheet").close(); fn(); }); L.appendChild(b);
  });
  const d = $("actSheet"); try { d.showModal(); } catch (e) { d.setAttribute("open", ""); }
}
function moveEx(ex, dir) {
  const prog = S.lifts.prog[liftDay], vis = visibleProg(), i = vis.indexOf(ex), other = vis[i + dir]; if (!other) return;
  prog.splice(prog.indexOf(ex), 1); prog.splice(prog.indexOf(other) + (dir > 0 ? 1 : 0), 0, ex);
  persist(); renderLift();
}
function exMenu(ex) {
  const prog = S.lifts.prog[liftDay], vis = visibleProg(), i = vis.indexOf(ex), dd = draft[liftDay], logged = (dd[logId(ex)] || []).some(s => s[2]);
  actionSheet(ex.n, [
    ["Replace exercise", () => openPicker("replace", ex)],
    i > 0 && ["Move up", () => moveEx(ex, -1)],
    i < vis.length - 1 && ["Move down", () => moveEx(ex, 1)],
    ["Skip for today", () => { skipToday(ex); saveDraft(); toast(ex.n + " skipped for today. Bring it back at the bottom of the list."); renderLift(); }],
    ["Remove from " + cap(liftDay) + " routine", () => {
      if (!confirm("Remove " + ex.n + " from your " + cap(liftDay) + " routine? Your history for it stays.")) return;
      if (logged) { skipToday(ex); (dd.__drop = dd.__drop || []).push(ex.id); } else prog.splice(prog.indexOf(ex), 1);
      saveDraft(); persist(); toast(ex.n + " removed from the routine"); renderLift();
    }, true]
  ]);
}
function openPicker(mode, old) {
  picker = {mode, old:old || null, kind:"lift"};
  $("pickTitle").textContent = mode === "replace" ? "Replace " + old.n : "Add exercise";
  $("pickKeepRow").hidden = mode === "edit"; $("pickKeep").checked = false;
  $("pickKeepLbl").textContent = mode === "replace" ? "Also replace it in my " + cap(liftDay) + " routine" : "Also save to my " + cap(liftDay) + " routine";
  $("pickQ").value = ""; paintPicker();
  const d = $("exPick"); try { d.showModal(); } catch (e) { d.setAttribute("open", ""); }
}
function paintPicker() {
  const q = $("pickQ").value.trim(), ql = q.toLowerCase(), here = new Set(S.lifts.prog[liftDay].map(e => e.n.toLowerCase()));
  // your own exercises from every day first, then the library
  const all = [];
  DAYS3.forEach(d => S.lifts.prog[d].forEach(e => { if (!all.some(m => m[0].toLowerCase() === e.n.toLowerCase())) all.push([e.n, Object.assign({s:e.s, lo:e.lo, hi:e.hi}, e.type ? {type:e.type} : {}, e.assist ? {assist:true} : {})]); }));
  EX_LIB.forEach(l => { if (!all.some(m => m[0].toLowerCase() === l[0].toLowerCase())) all.push(l); });
  // exercises already in this workout go to the bottom
  const hits = all.filter(l => !ql || l[0].toLowerCase().includes(ql)).sort((x, y) => here.has(x[0].toLowerCase()) - here.has(y[0].toLowerCase())).slice(0, 50);
  const kindLbl = o => o && o.type === "cardio" ? "Cardio" : o && o.type === "hold" ? "Timed hold" : o && o.assist ? "Assisted" : "Weights";
  let html = hits.map((l, i) => '<button class="pickrow" data-i="' + i + '">' + avatar(l[0], "", false) + '<span><b>' + esc(l[0]) + '<\/b><small>' + kindLbl(l[1]) + (here.has(l[0].toLowerCase()) ? ' · already in ' + cap(liftDay) : '') + '<\/small><\/span><\/button>').join("");
  if (q && !all.some(l => l[0].toLowerCase() === ql)) html = '<div class="pickcustom"><b>New exercise: ' + esc(q) + '<\/b><div class="chips">' + KINDS.map(k => '<button class="chip" data-k="' + k[0] + '" aria-pressed="' + (picker.kind === k[0]) + '">' + k[1] + '<\/button>').join("") + '<\/div><button class="btn blue full" id="pickNew">Add ' + esc(q) + '<\/button><\/div>' + html;
  $("pickList").innerHTML = html || '<p class="muted">Type a name to add your own exercise.<\/p>';
  $("pickList").querySelectorAll(".pickrow").forEach(b => b.addEventListener("click", () => { const l = hits[+b.dataset.i]; applyPick(newEx(l[0], l[1])); }));
  $("pickList").querySelectorAll("[data-k]").forEach(b => b.addEventListener("click", () => { picker.kind = b.dataset.k; paintPicker(); }));
  const nb = $("pickNew"); if (nb) nb.addEventListener("click", () => { const k = picker.kind; applyPick(newEx(q, k === "assist" ? {assist:true} : k === "lift" ? {} : {type:k})); });
}
function applyPick(ex) {
  const prog = S.lifts.prog[liftDay], mode = picker.mode, keep = mode === "edit" || $("pickKeep").checked, dd = draft[liftDay];
  if (prog.length >= 20) { toast("20 exercises is the most for one day"); return; }
  const temp = () => (dd.__temp = dd.__temp || []).push(ex.id);
  if (mode === "replace") {
    const old = picker.old, at = prog.indexOf(old), logged = (dd[logId(old)] || []).some(s => s[2]);
    if (keep && !logged) prog.splice(at, 1, ex);                                  // takes its place for good
    else { prog.splice(at + 1, 0, ex); skipToday(old); if (keep) (dd.__drop = dd.__drop || []).push(old.id); else temp(); }
    toast(ex.n + " in place of " + old.n + (keep ? "" : " for today"));
  } else {
    prog.push(ex); if (mode === "add" && !keep) temp();
    toast(ex.n + " added" + (mode === "add" && !keep ? " for today" : ""));
  }
  if (dd) saveDraft(); persist(); $("exPick").close(); renderLift();
  if (mode !== "edit") setTimeout(() => { const el = document.querySelector('[data-exid="' + ex.id + '"]'); if (el) el.scrollIntoView({block:"center", behavior:"smooth"}); }, 60);
}
$("pickQ").addEventListener("input", paintPicker);
$("pickClose").addEventListener("click", () => $("exPick").close());
$("exPick").addEventListener("click", e => { if (e.target === $("exPick")) $("exPick").close(); });
$("actClose").addEventListener("click", () => $("actSheet").close());
$("actSheet").addEventListener("click", e => { if (e.target === $("actSheet")) $("actSheet").close(); });
// keep the screen on during a lifting workout, and ask again whenever you come back (phones drop the request)
let liftAwakeBusy = false;
function liftAwake() {
  if (!liveDay() || !navigator.wakeLock || liftAwakeBusy || (swWake && !swWake.released) || document.visibilityState !== "visible") return;
  liftAwakeBusy = true;
  navigator.wakeLock.request("screen").then(w => { swWake = w; }).catch(() => {}).finally(() => { liftAwakeBusy = false; });
}
document.addEventListener("visibilitychange", liftAwake);`);

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
if (h.slice(sStart + 9, sEnd).indexOf("</") >= 0) throw new Error("raw </ in script");
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("live workout editing applied");
