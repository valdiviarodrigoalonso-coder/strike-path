// Muscle maps, like Hevy's: a front and back body diagram (drawn for Strike Path) where the muscles you trained light up
// in the warm accent, brighter the more sets they got. Each exercise maps to primary muscles (full sets) and helpers
// (half sets); warm-ups don't count; the core finisher counts for abs and obliques; bag work and runs map too.
// Shown on a "Workout complete" card when you finish lifting, on every workout in the Profile feed, in a
// "Muscles · last 7 days" panel on Profile, and in the bag-work session summary.
// Run once: node tools/patches/2026-10-28-muscle-map.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("function bodySVG(")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 100)); h = h.replace(a, b); };

// ---------------- markup ----------------
rep('<nav class="tabbar" aria-label="Sections">', String.raw`<dialog class="sheet" id="doneSheet" aria-labelledby="doneTitle">
  <div id="doneBody"></div>
  <button class="btn blue full" id="doneClose" style="margin-top:16px">Done</button>
</dialog>
<nav class="tabbar" aria-label="Sections">`);
rep('    <span class="sub">This week</span>', '    <span class="sub">Muscles · last 7 days</span>\n    <div class="panel" id="musWeek"></div>\n    <span class="sub">This week</span>');
rep('<div class="muted" id="sumRounds" style="font-size:14px"></div>', '<div class="muted" id="sumRounds" style="font-size:14px"></div>\n          <div id="sumMus"></div>');

// ---------------- styles ----------------
rep("</style>", String.raw`/* muscle maps */
.body{display:block;width:56px;height:112px;flex:none}
.body .bb,.body .bb *{fill:#1d272a}
.body path,.body .bb *{stroke:#060809;stroke-width:.9;stroke-linejoin:round}
.body .m0{fill:#2a363a}
.body .m1{fill:rgba(217,178,124,.42)}
.body .m2{fill:rgba(217,178,124,.72)}
.body .m3{fill:#e9c48c}
.mmap{display:flex;gap:4px;align-items:flex-start}
.mmap.big .body{width:78px;height:156px}
.mlist{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:7px;min-width:0;flex:1}
.mlist li{display:grid;grid-template-columns:86px minmax(0,1fr) 54px;gap:8px;align-items:center;font-size:13px}
.mlist li span{color:var(--fg)}
.mlist li i{display:block;height:5px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden}
.mlist li i b{display:block;height:100%;background:var(--acc);border-radius:3px}
.mlist li em{font-style:normal;color:var(--muted);font-size:12px;text-align:right;font-variant-numeric:tabular-nums}
.mweek{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.mweek .mlist{margin:0;min-width:200px}
.fcard{position:relative}
.fcard.hasmap .fch,.fcard.hasmap .fstats{padding-right:80px}
.fmap{position:absolute;right:0;top:14px;display:flex;gap:2px}
.fmap .body{width:36px;height:72px}
.donehd h3{font-size:40px;margin-top:4px}
.donegrid{display:flex;gap:14px;align-items:flex-start;margin-top:14px}
.donelist{list-style:none;margin:0;padding:0;flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;font-size:15px}
.donelist li{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3}
.donegrid .mmap.big .body{width:62px;height:124px}
.donelist b{color:var(--acc);font-family:var(--display);font-weight:400;font-size:19px;letter-spacing:.04em;margin-right:4px}
#doneSheet .fstats{margin-top:12px}
#sumMus .mweek{margin-top:6px}
</style>`);

// ---------------- the body, the mapping, and where it shows ----------------
rep("function renderFeed() {", String.raw`// ---- muscle maps: front and back body, each muscle lit by how many sets it got ----
// left half of each view (the right half is the mirror image), in a 100 x 200 box
const MUS_FRONT = {
  traps:"M45,27 L39,32 L45,33 Z",
  shoulders:"M38,33 Q29,31 25,39 Q24,46 27,49 Q32,44 38,42 Z",
  chest:"M49,35 L39,34 Q34,38 34,45 Q36,53 44,54 Q48,54 49,51 Z",
  biceps:"M27,50 Q23,56 23,64 Q24,69 27,70 Q31,66 32,58 Q31,52 27,50 Z",
  forearms:"M23,72 Q19,80 18,92 L22,93 Q27,83 28,73 Z",
  abs:"M49,55 L44,56 Q43,70 44,86 Q47,89 49,89 Z",
  obliques:"M43,56 L37,55 Q35,68 37,80 Q39,86 43,87 Q42,70 43,56 Z",
  quads:"M41,101 Q34,112 35,128 Q36,140 39,145 L46,145 Q48,130 48,112 L47,103 Z",
  adductors:"M47,103 L50,103 L50,122 Q48,128 47,130 Q48,115 47,103 Z",
  calves:"M37,153 Q34,165 36,178 Q38,187 41,188 L44,188 Q45,170 45,153 Z"
};
const MUS_BACK = {
  traps:"M50,23 L45,27 L37,34 L44,38 L50,46 Z",
  reardelts:"M37,34 Q28,32 25,40 Q24,46 27,49 Q33,44 38,41 Z",
  triceps:"M27,50 Q23,56 23,64 Q24,69 27,70 Q31,66 32,58 Q31,52 27,50 Z",
  forearms:"M23,72 Q19,80 18,92 L22,93 Q27,83 28,73 Z",
  upperback:"M50,46 L44,38 L38,42 Q37,49 40,54 L50,58 Z",
  lats:"M40,55 Q35,62 37,72 Q40,80 44,82 L50,76 L50,59 Z",
  lowerback:"M44,83 L50,77 L50,90 L43,90 Z",
  glutes:"M38,91 Q36,101 41,107 Q47,110 50,105 L50,91 Z",
  hamstrings:"M37,108 Q34,122 36,138 Q38,145 40,146 L47,146 Q49,128 49,110 Q44,110 37,108 Z",
  calves:"M37,153 Q33,163 36,175 Q39,184 42,184 Q45,180 46,168 Q46,158 45,153 Z"
};
const MUSCLE_NAME = {chest:"Chest", shoulders:"Shoulders", reardelts:"Rear delts", biceps:"Biceps", triceps:"Triceps", forearms:"Forearms", abs:"Abs", obliques:"Obliques",
  traps:"Traps", upperback:"Upper back", lats:"Lats", lowerback:"Lower back", glutes:"Glutes", quads:"Quads", hamstrings:"Hamstrings", adductors:"Adductors", calves:"Calves"};
const BODY_HALF_BASE = '<ellipse cx="19.5" cy="99" rx="4" ry="6"/><ellipse cx="41" cy="149" rx="4.5" ry="4"/><ellipse cx="41" cy="193" rx="5" ry="3.5"/>';
// sc scales the thresholds: 1 for one workout (lit at any set, brighter from 2 and 4 sets), 2.5 for a week
function bodySVG(m, back, sc) {
  sc = sc || 1;
  const lvl = k => { const v = (m && m[k]) || 0; return v <= 0 ? 0 : v < 2 * sc ? 1 : v < 4 * sc ? 2 : 3; };
  const shapes = back ? MUS_BACK : MUS_FRONT;
  const half = Object.entries(shapes).map(([k, d]) => '<path class="m' + lvl(k) + '" d="' + d + '"/>').join("");
  const mid = '<ellipse cx="50" cy="13" rx="8.5" ry="10.5"/><rect x="45.5" y="21" width="9" height="8" rx="2"/>' + (back ? '' : '<path d="M38,89 L62,89 L58,101 L42,101 Z"/>');
  return '<svg class="body" viewBox="0 0 100 200" role="img" aria-label="' + (back ? "Back" : "Front") + ' muscles"><g class="bb">' + mid + BODY_HALF_BASE + '<g transform="translate(100 0) scale(-1 1)">' + BODY_HALF_BASE + '<\/g><\/g>' + half + '<g transform="translate(100 0) scale(-1 1)">' + half + '<\/g><\/svg>';
}
// primary muscles count each set fully, helpers count half (or less)
const MUSCLE_BY_KEY = {
  bench:{chest:1, triceps:.5, shoulders:.5}, dip:{chest:1, triceps:1, shoulders:.5}, fly:{chest:1, shoulders:.3}, lat:{shoulders:1, traps:.3},
  pushdown:{triceps:1}, kickback:{triceps:1}, pullup:{lats:1, biceps:.5, upperback:.5, forearms:.3}, row:{upperback:1, lats:.7, biceps:.5, reardelts:.5},
  sap:{lats:1, triceps:.3}, rdf:{reardelts:1, upperback:.5}, inccurl:{biceps:1, forearms:.3}, shrug:{traps:1, forearms:.3},
  revcurl:{forearms:1, biceps:.5}, wristcurl:{forearms:1}, hang:{forearms:1, lats:.3}, squat:{quads:1, glutes:1, adductors:.5, lowerback:.3},
  rdl:{hamstrings:1, glutes:1, lowerback:.5}, hipthrust:{glutes:1, hamstrings:.3}, legext:{quads:1}, legcurl:{hamstrings:1},
  adductor:{adductors:1}, calf:{calves:1}, abwheel:{abs:1, lats:.3}, pallof:{obliques:1, abs:.5}, chop:{obliques:1, abs:.3, shoulders:.3}
};
const MUSCLE_WORDS = [
  [/shoulder press|overhead press|military|arnold/i, {shoulders:1, triceps:.5}], [/pull-?down/i, {lats:1, biceps:.5, upperback:.3}],
  [/face pull/i, {reardelts:1, traps:.5, upperback:.3}], [/hammer/i, {biceps:1, forearms:.7}], [/romanian|rdl|stiff/i, {hamstrings:1, glutes:1, lowerback:.5}],
  [/deadlift/i, {glutes:1, hamstrings:1, lowerback:1, traps:.3}], [/leg press/i, {quads:1, glutes:.7}], [/lunge|split squat|step-?up/i, {quads:1, glutes:1}],
  [/push-?ups?/i, {chest:1, triceps:.5, shoulders:.5}], [/skull|french press|overhead extension/i, {triceps:1}],
  [/dumbbell row|one.arm row|barbell row|bent.over row/i, {lats:1, upperback:.7, biceps:.5}], [/leg raise|plank|crunch|sit-?up/i, {abs:1}], [/neck/i, {traps:.5}]
];
function musclesFor(name, id) { for (const [r, m] of MUSCLE_WORDS) if (r.test(name || "")) return m; return MUSCLE_BY_KEY[photoKey(id, name)] || {}; }
const addMus = (to, m, n) => { for (const k in m) to[k] = (to[k] || 0) + m[k] * n; return to; };
function liftMuscles(l) {
  const m = {};
  l.ex.forEach(x => { const n = x.sets.filter(s => s[2] && !s[3]).length; if (n) addMus(m, musclesFor(x.n, x.id), n); });
  if (l.core) addMus(m, {abs:1, obliques:1}, l.core);
  return m;
}
// bag work: punching works shoulders and the turning core most, kicks bring in the legs and hips
const bagMuscles = s => addMus({}, {shoulders:.6, obliques:.6, abs:.3, glutes:.3, quads:.3, calves:.3, triceps:.2, chest:.2, hamstrings:.2, adductors:.1}, s.r || 0);
const runMuscles = r => addMus({}, {quads:.4, hamstrings:.3, calves:.4, glutes:.3}, Math.min(15, r.km || (r.min || 0) / 6));
function muscleList(m, unit) {
  const top = Object.entries(m).filter(e => e[1] > .05).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!top.length) return "";
  const mx = top[0][1];
  return '<ul class="mlist">' + top.map(([k, v]) => '<li><span>' + MUSCLE_NAME[k] + '<\/span><i><b style="width:' + Math.max(6, Math.round(v / mx * 100)) + '%"><\/b><\/i><em>' + (unit ? (Math.round(v * 2) / 2) + ' ' + unit : '') + '<\/em><\/li>').join("") + '<\/ul>';
}
const muscleBlock = (m, sc, unit) => '<div class="mweek"><div class="mmap big">' + bodySVG(m, false, sc) + bodySVG(m, true, sc) + '<\/div>' + muscleList(m, unit) + '<\/div>';
function renderMuscleWeek() {
  const from = dayKey(Date.now() - 6 * 864e5), m = {};
  S.lifts.logs.filter(l => l.d >= from).forEach(l => addMus(m, liftMuscles(l), 1));
  S.sessions.filter(s => s.d >= from).forEach(s => addMus(m, bagMuscles(s), 1));
  S.runs.filter(r => r.d >= from).forEach(r => addMus(m, runMuscles(r), 1));
  $("musWeek").innerHTML = Object.keys(m).length ? muscleBlock(m, 2.5, "sets") : '<p class="muted" style="margin:0">Finish a workout and the muscles you trained light up here.<\/p>';
}
// the card you see right after finishing a lifting workout
function showDone(l) {
  const st = liftStats(l), mus = liftMuscles(l);
  $("doneBody").innerHTML = '<div class="donehd"><span class="label">Workout complete · ' + longDate(l.d) + '<\/span><h3 id="doneTitle">' + cap(l.day) + ' day<\/h3><\/div>' +
    '<div class="fstats"><div><span>Time<\/span><b>' + fmtDur(l.min || 0) + '<\/b><\/div><div><span>Volume<\/span><b>' + Math.round(st.vol).toLocaleString() + ' ' + U() + '<\/b><\/div><div><span>Sets<\/span><b>' + st.sets + '<\/b><\/div>' + (l.pr ? '<div><span>Records<\/span><b>' + l.pr + '<\/b><\/div>' : '') + '<\/div>' +
    '<div class="donegrid"><ul class="donelist">' + l.ex.map(x => '<li><b>' + x.sets.filter(s => s[2]).length + '×<\/b>' + esc(x.n) + '<\/li>').join("") + (l.core ? '<li><b>' + l.core + '×<\/b>Fight core finisher<\/li>' : '') + '<\/ul>' +
    '<div class="mmap big">' + bodySVG(mus, false, 1) + bodySVG(mus, true, 1) + '<\/div><\/div>' + muscleList(mus, "sets");
  const d = $("doneSheet"); try { d.showModal(); } catch (e) { d.setAttribute("open", ""); }
}
$("doneClose").addEventListener("click", () => $("doneSheet").close());
$("doneSheet").addEventListener("click", e => { if (e.target === $("doneSheet")) $("doneSheet").close(); });
function renderFeed() {`);

// feed cards carry a small front/back map
rep("  const card = (key, ab, title, date, stats, rows) => {", "  const card = (key, ab, title, date, stats, rows, mus) => {");
rep("    return '<article class=\"fcard\"><div class=\"fch\">'",
    "    return '<article class=\"fcard' + (mus ? ' hasmap' : '') + '\">' + (mus ? '<div class=\"fmap\">' + bodySVG(mus, false, 1) + bodySVG(mus, true, 1) + '<\\/div>' : '') + '<div class=\"fch\">'");
rep('.concat(l.pr ? [stat("Records", l.pr)] : []), rows);', '.concat(l.pr ? [stat("Records", l.pr)] : []), rows, liftMuscles(l));');
rep('stat("Effort", r.rpe + "/10")] : []), []); }', 'stat("Effort", r.rpe + "/10")] : []), [], runMuscles(r)); }');
rep('stat("Effort", s.rpe + "/10")] : []), []);', 'stat("Effort", s.rpe + "/10")] : []), [], bagMuscles(s));');
rep("  renderWeek(); renderChart(); renderFeed();", "  renderWeek(); renderChart(); renderFeed(); renderMuscleWeek();");

// finishing a lifting workout opens the card; the bag-work summary shows its map
rep('  liftDay = nextLiftDay(); wkScreen = "home"; openNotes.clear();', '  showDone(log);\n  liftDay = nextLiftDay(); wkScreen = "home"; openNotes.clear();');
rep('  $("summary").hidden = false; $("tSave").hidden = true;', '  $("sumMus").innerHTML = muscleBlock(bagMuscles({r:clock.done}), 1, "");\n  $("summary").hidden = false; $("tSave").hidden = true;');

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
if (h.slice(sStart + 9, sEnd).indexOf("</") >= 0) throw new Error("raw </ in script near " + h.slice(sStart + 9 + h.slice(sStart + 9, sEnd).indexOf("</") - 50, sStart + 9 + h.slice(sStart + 9, sEnd).indexOf("</") + 10));
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("muscle maps applied");
