// Bag work, rebuilt after the popular bag-work apps (Boxing Combo Trainer, BAGWRK, BoxingTimer.io, STRIKR, FightCamp):
// a workout list -> round-by-round plan -> live screen flow, combos called by name or by number (1-2-3),
// five pace levels from Easy to Max, new round types (Combo Ladder, Combo Drill, Reaction beeps, My Combos),
// footwork cues, a "next combo" preview, round dots and a progress bar, saved combos with a builder,
// round-by-round output in the summary, and settings in a sheet.
// Also fixes the header sliding under the iPhone status bar.
// Run once: node tools/patches/2026-10-28-bag-work.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("function showTr(")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 90)); h = h.replace(a, b); };
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

// ---------------- styles ----------------
rep("@media (max-width:420px){.sth,.str{", String.raw`/* iPhone home-screen app: keep the header below the clock and battery */
body{padding-top:env(safe-area-inset-top,0px)}
/* bag work */
#view-train{max-width:720px;margin-inline:auto}
.rthemes{display:flex;gap:5px;flex-wrap:wrap}
.rthemes span{font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--mat-2);color:var(--muted)}
.rplan{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column}
.rplan li{display:grid;grid-template-columns:34px 1fr auto;gap:2px 12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--mat)}
.rplan li .n{grid-row:1/3;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--mat-2);font-weight:700}
.rplan li b{font-size:16px}.rplan li small{grid-column:2/4;color:var(--muted);font-size:13px}
.rplan li .t{color:var(--muted);font-variant-numeric:tabular-nums}
.rplan li.rest{padding:4px 0 4px 46px;color:var(--muted);font-size:13px;display:block;border:0}
#trLive .clock{gap:12px}
.trtop{display:flex;align-items:center;gap:10px}
.rdots{flex:1;display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.rdots i{width:10px;height:10px;border-radius:50%;background:var(--mat-2)}
.rdots i.d{background:var(--green)}.rdots i.c{background:var(--acc);box-shadow:0 0 0 3px rgba(47,140,246,.3)}
.rbar{height:6px;border-radius:99px;background:var(--mat-2);overflow:hidden}
.rbar i{display:block;height:100%;width:0;background:var(--red);transition:width .2s linear}
.clock.rest .rbar i{background:var(--acc)}.clock.ready .rbar i{background:var(--gold)}
.callout .c b{display:block;font-size:1.25em;line-height:1}.callout .c small{display:block;font-family:var(--body);font-size:12px;font-weight:600;text-transform:none;opacity:.8}
.callout .c.f{border-color:var(--green);color:var(--green)}
.callout .go{font-family:var(--display);font-weight:900;font-size:clamp(56px,16vw,96px);line-height:1;color:var(--gold);animation:pop .3s cubic-bezier(.2,1.6,.4,1) both}
.nextc{font-size:14px;color:var(--muted);min-height:1.4em}
.nextc b{color:var(--fg);font-weight:600}
.clist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.clist li{display:flex;align-items:center;gap:8px;justify-content:space-between}
.cchips{display:flex;gap:5px;flex-wrap:wrap}
.cchip{display:inline-flex;align-items:baseline;gap:4px;padding:4px 9px;border-radius:8px;background:var(--mat-2);font-size:14px;font-weight:600}
.cchip b{color:var(--acc)}.cchip.k{color:var(--gold)}.cchip.d{color:#8fb4ff}
.cbseq{min-height:46px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:10px;border-radius:10px;background:var(--mat-2);margin-bottom:12px}
.cbpick{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.cbpick .chips .chip{background:var(--mat-2)}
#trSheet .settings{gap:14px}
#trSheet .chip{background:var(--mat-2)}
@media (max-width:420px){.sth,.str{`);

// ---------------- Train tab markup ----------------
{
  const a = h.indexOf('  <section id="view-train"'), b = h.indexOf("  <!-- STRENGTH -->");
  if (a < 0 || b < 0) throw new Error("train section not found");
  const old = h.slice(a, b);
  const logStart = old.indexOf('    <div class="log">'), logEnd = old.lastIndexOf("  </section>");
  if (logStart < 0) throw new Error("log block not found");
  const logBlock = old.slice(logStart, logEnd);
  h = h.slice(0, a) + String.raw`  <section id="view-train" role="tabpanel" aria-labelledby="tab-train" hidden>
    <div id="trHome">
      <div class="pghead"><h2>Bag Work</h2><button class="roundbtn" id="trSet" aria-label="Bag work settings"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg></button></div>
      <div id="trResume"></div>
      <span class="sub">Workouts</span>
      <div class="routines" id="trCards"></div>
      <span class="sub">My combos</span>
      <div class="panel" id="myCombos"></div>
      <span class="sub">History</span>
` + logBlock + String.raw`    </div>
    <div id="trPlan" hidden>
      <div class="dayhead"><button class="roundbtn" id="trBack" aria-label="Back to workouts"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><h2 id="trPlanName">Quick Hit</h2><button class="linkbtn" id="trEdit">Settings</button></div>
      <button class="btn blue full" id="trGo">Start Workout</button>
      <p class="muted pvmeta" id="trMeta"></p>
      <ol class="rplan" id="trRounds"></ol>
    </div>
    <div id="trLive" hidden>
      <div class="panel clock" id="clock">
        <div class="trtop"><button class="roundbtn" id="trMin" aria-label="Back to workouts (the timer keeps going)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg></button><div class="rdots" id="rdots" aria-hidden="true"></div><button class="linkbtn" id="tReset" style="color:#ff453a">End</button></div>
        <div class="row" style="justify-content:space-between">
          <span class="phase" id="phase">Ready</span>
          <span class="label" id="roundLbl">Round 1 of 3</span>
        </div>
        <div class="theme" id="theme"><b id="themeName">Mix</b><span id="themeDesc"></span></div>
        <div class="time" id="time">2:00</div>
        <div class="rbar" aria-hidden="true"><i id="rbar"></i></div>
        <div class="callout" id="callout" aria-live="polite"><span class="msg">Press start, then get in stance</span></div>
        <div class="nextc" id="nextC"></div>
        <div class="stage3d" id="trainStage"><span class="hint">Drag to rotate</span></div>
        <div class="row">
          <button class="btn blue" id="tStart">Start</button>
          <button class="btn ghost" id="tSkip" hidden>Skip</button>
          <button class="btn ghost" id="tSave" hidden>♡ Save combo</button>
        </div>
        <div class="summary" id="summary" hidden>
          <h3>Session complete</h3>
          <div class="sumstats" id="sumStats"></div>
          <div class="muted" id="sumRounds" style="font-size:14px"></div>
          <div class="field"><span class="label">How hard was that? (1 = easy, 10 = all-out)</span><div class="rpe" id="rpe"></div></div>
          <button class="btn blue full" id="trDone">Done</button>
        </div>
      </div>
    </div>
    <dialog class="sheet" id="trSheet" aria-labelledby="trSheetTitle">
      <div class="sheethd"><h3 id="trSheetTitle">Bag work settings</h3><button class="linkbtn" id="trSheetClose">Done</button></div>
      <div class="settings">
        <div class="field"><span class="label">Call combos as</span><div class="chips" data-set="calls"></div></div>
        <div class="field"><span class="label">Combo pace</span><div class="chips" data-set="pace"></div></div>
        <div class="field"><span class="label">Extras</span><div class="chips" id="extras"></div></div>
        <span class="sub" style="margin:6px 0 0">Custom workout</span>
        <div class="field"><span class="label">Round type</span><div class="chips" data-set="focus"></div></div>
        <div class="field"><span class="label">Rounds</span><div class="chips" data-set="rounds"></div></div>
        <div class="field"><span class="label">Round length</span><div class="chips" data-set="len"></div></div>
        <div class="field"><span class="label">Rest</span><div class="chips" data-set="rest"></div></div>
        <div class="field"><span class="label">Moves the coach can call</span><div class="pool" id="pool"></div></div>
      </div>
    </dialog>
    <dialog class="sheet" id="cbSheet" aria-labelledby="cbTitle">
      <div class="sheethd"><h3 id="cbTitle">Build a combo</h3><button class="linkbtn" id="cbCancel">Cancel</button></div>
      <div class="cbseq" id="cbSeq"></div>
      <div class="cbpick" id="cbPick"></div>
      <div class="row" style="justify-content:space-between"><button class="btn ghost sm" id="cbUndo">Undo</button><button class="btn blue sm" id="cbSave">Save combo</button></div>
    </dialog>
  </section>

` + h.slice(b);
}

// ---------------- config: round types, workouts, settings ----------------
rep('  move:{name:"My move", d:"Every combo includes the move you\'re learning.", pace:1.1, n:[1,2], kick:.4, def:.2}\n};',
String.raw`  move:{name:"My move", d:"Every combo includes the move you're learning.", pace:1.1, n:[1,2], kick:.4, def:.2},
  ladder:{name:"Ladder", d:"Build the combo one strike at a time: 1, then 1-2, then 1-2-3.", pace:1, n:[1,3], kick:.4, def:0},
  drill:{name:"Combo drill", d:"One combo all round. Repeat it until it's automatic.", pace:1, n:[2,4], kick:.4, def:.1},
  reaction:{name:"Reaction", d:"Stay loose and bounce. On the beep, explode with any combo, then reset.", pace:1, n:[1,3], kick:.3, def:.1},
  mine:{name:"My combos", d:"Only the combos you saved.", pace:1.05, n:[1,3], kick:.4, def:.2}
};`);
rep('  learn:{name:"Learn My Move", rounds:3, len:120, rest:30, themes:["move"], burn:false, d:"3 × 2 min · drill today\'s move"},',
String.raw`  learn:{name:"Learn My Move", rounds:3, len:120, rest:30, themes:["move"], burn:false, d:"3 × 2 min · drill today's move"},
  fight:{name:"Fight Night", rounds:3, len:180, rest:60, themes:["mix","power","speed"], burn:true, d:"3 × 3 min · paced like a real kickboxing bout"},
  ladder:{name:"Combo Ladder", rounds:4, len:120, rest:45, themes:["ladder"], burn:false, d:"4 × 2 min · build combos strike by strike"},
  drill:{name:"Combo Drill", rounds:3, len:120, rest:30, themes:["drill"], burn:false, d:"3 × 2 min · one combo per round"},
  reaction:{name:"Reaction Rounds", rounds:5, len:60, rest:30, themes:["reaction"], burn:false, d:"5 × 1 min · explode on the beep"},
  mine:{name:"My Combos", rounds:3, len:120, rest:30, themes:["mine"], burn:false, d:"3 × 2 min · only combos you saved"},`);
rep('  focus:{vals:["mix","hands","kicks","defense","move"], lbl:v => THEMES[v].name, def:"mix"},',
    '  focus:{vals:["mix","hands","kicks","defense","speed","power","technique","move","ladder","drill","reaction","mine"], lbl:v => THEMES[v].name, def:"mix"},\n  calls:{vals:["names","numbers"], lbl:v => v === "names" ? "Names (jab, cross)" : "Numbers (1, 2, 3)", def:"names"},');
rep('  pace:{vals:[7, 5, 3.5], lbl:v => ({7:"Easy", 5:"Steady", 3.5:"Fast"})[v], def:5}',
    '  pace:{vals:[7, 5, 3.5, 2.5, 1.6], lbl:v => ({7:"Easy", 5:"Steady", 3.5:"Fast", 2.5:"Fighter", 1.6:"Max"})[v], def:5}');
rep('const EXTRAS = {voice:"Coach voice", ready:"10s get-ready", warn:"10s warning", burn:"Burnout finish", quiet:"Quiet alerts"};\nconst T = {preset:"quick", voice:true, ready:true, warn:true, burn:false, quiet:false};',
    'const EXTRAS = {voice:"Coach voice", ready:"10s get-ready", warn:"10s warning", burn:"Burnout finish", foot:"Footwork cues", quiet:"Quiet alerts"};\nconst T = {preset:"quick", voice:true, ready:true, warn:true, burn:false, foot:false, quiet:false};');

// saved combos live in your progress, so they sync and transfer with everything else
rep("prs:0, updatedAt:0});", "prs:0, combos:[], updatedAt:0});");
rep("  s.updatedAt = +d.updatedAt || 0;\n", "  if (Array.isArray(d.combos)) s.combos = d.combos.filter(Array.isArray).slice(0, 40).map(c => c.filter(id => MOVE_BY_ID[id] && MOVE_BY_ID[id].call).slice(0, 8)).filter(c => c.length);\n  s.updatedAt = +d.updatedAt || 0;\n");

// ---------------- settings sheet and workout list ----------------
replaceFn("paintSettings", String.raw`
// pace, call style and extras are your style; they don't turn a workout into a custom one
const STYLE_KEYS = ["pace", "calls"];
function paintSettings() {
  document.querySelectorAll("#trSheet .chips[data-set]").forEach(seg => {
    const k = seg.dataset.set; seg.textContent = "";
    OPT[k].vals.forEach(v => {
      const b = document.createElement("button"); b.className = "chip"; b.id = "opt-" + k + "-" + String(v).replace(".", "_"); b.textContent = OPT[k].lbl(v);
      const on = T[k] === v && (STYLE_KEYS.includes(k) || T.preset === "custom");
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.addEventListener("click", () => { T[k] = v; if (!STYLE_KEYS.includes(k)) T.preset = "custom"; saveT(); paintSettings(); renderHero(); if (clock.phase === "idle" || clock.phase === "done") resetClock(); });
      seg.appendChild(b);
    });
  });
  const ex = $("extras"); ex.textContent = "";
  Object.entries(EXTRAS).forEach(([k, label]) => {
    const b = document.createElement("button"); b.className = "chip"; b.id = "ext-" + k; b.textContent = label; b.setAttribute("aria-pressed", T[k] ? "true" : "false");
    b.addEventListener("click", () => { T[k] = !T[k]; saveT(); paintSettings(); });
    ex.appendChild(b);
  });
  if (typeof trScreen !== "undefined") { if (trScreen === "plan") paintPlan(); if (trScreen === "home") paintTrHome(); }
}`);

// ---------------- combo engine ----------------
rep("const trainStage = makeStage(", String.raw`// combos by number, the way boxing coaches call them: 1 jab, 2 cross, 3 lead hook, 6 rear uppercut. Kicks and defense keep their names.
const NUM = {jab:"1", cross:"2", hook:"3", upper:"6"};
const FOOT = {pivot:"Pivot", stepout:"Step out", circle:"Circle"};
const isFoot = id => !!FOOT[id];
const callWord = id => isFoot(id) ? FOOT[id] : T.calls === "numbers" && NUM[id] ? NUM[id] : MOVE_BY_ID[id].call;
const chipCls = id => isFoot(id) ? "f" : KICK.includes(id) ? "k" : DEF.includes(id) ? "d" : "";
const chipHTML = id => '<span class="cchip ' + chipCls(id) + '">' + (NUM[id] ? '<b>' + NUM[id] + '<\/b>' : '') + esc(isFoot(id) ? FOOT[id] : MOVE_BY_ID[id].call) + '<\/span>';
// a ladder climbs one strike at a time: jab, jab-cross, jab-cross-hook, then finishes with a kick when you know one
function ladderSeq() {
  const pool = callable(), has = id => pool.includes(id);
  const seq = ["jab"]; if (has("cross")) seq.push("cross");
  const mid = ["hook", "upper"].filter(has); if (mid.length) seq.push(pick(mid));
  if (mid.length > 1 && Math.random() < .5) seq.push(seq[2] === "hook" ? "upper" : "hook");
  const k = ["body", "low", "teep", "head", "switch", "knee"].filter(has); if (k.length) seq.push(pick(k)); else if (has("cross") && seq.length < 4) seq.push("cross");
  return seq;
}
function pickDrill() {
  const mine = (S.combos || []).filter(c => c.length > 1);
  if (mine.length && Math.random() < .5) return pick(mine).slice();
  let c; for (let i = 0; i < 6; i++) { c = makeCombo("mix"); if (c.length >= 2 && c.length <= 4) break; }
  return c;
}
function nextCombo(theme) {
  if (theme === "ladder") { if (!clock.ladder || clock.ladder.i >= clock.ladder.seq.length) clock.ladder = {seq:ladderSeq(), i:0}; clock.ladder.i++; return clock.ladder.seq.slice(0, clock.ladder.i); }
  if (theme === "drill") { if (!clock.drill || clock.drillRound !== clock.round) { clock.drill = pickDrill(); clock.drillRound = clock.round; } return clock.drill.slice(); }
  if (theme === "mine") { const mine = (S.combos || []).filter(c => c.length); return mine.length ? pick(mine).slice() : makeCombo("mix"); }
  const c = makeCombo(theme);
  if (T.foot && theme !== "technique" && Math.random() < .3) c.push(pick(Object.keys(FOOT)));
  return c;
}
const trainStage = makeStage(`);
replaceFn("call", String.raw`
function call() {
  const theme = themeFor(clock.round), paceF = T.pace / 5;
  clock.perRound[clock.round - 1] = (clock.perRound[clock.round - 1] || 0) + 1; clock.combos++;
  if (theme === "reaction") {
    // reaction rounds: no words, just a sharp beep at an unpredictable moment
    beep(990); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {}
    $("callout").innerHTML = '<span class="go">GO!<\/span>'; $("nextC").textContent = "Any combo, then reset your stance and bounce.";
    const c = makeCombo("speed"); clock.lastCombo = c; clock.strikes += c.filter(id => !DEF.includes(id)).length;
    const frames = []; c.forEach((id, i) => { if (i) frames.push("stance"); frames.push(...MOVE_BY_ID[id].frames.filter(f => f !== "stance")); });
    trainStage.load(frames, {once:true, force:true});
    clock.nextCall = Date.now() + (2 + Math.random() * 3.5) * Math.max(.6, paceF) * 1000;
    return;
  }
  const c = clock.queued && clock.queuedRound === clock.round ? clock.queued : nextCombo(theme);
  clock.queued = nextCombo(theme); clock.queuedRound = clock.round;
  const strikes = c.filter(id => !isFoot(id));
  clock.lastCombo = strikes;
  $("callout").innerHTML = c.map((id, i) => '<span class="c ' + chipCls(id) + '" style="animation-delay:' + (i * 70) + 'ms">' + (T.calls === "numbers" && NUM[id] ? '<b>' + NUM[id] + '<\/b><small>' + esc(MOVE_BY_ID[id].call) + '<\/small>' : esc(callWord(id))) + '<\/span>').join("");
  $("nextC").innerHTML = 'Next: <b>' + clock.queued.map(id => esc(callWord(id))).join(T.calls === "numbers" ? "-" : ", ") + '<\/b>';
  say(c.map(callWord).join(", "));
  const frames = []; strikes.forEach((id, i) => { if (i) frames.push("stance"); frames.push(...MOVE_BY_ID[id].frames.filter(f => f !== "stance")); });
  if (frames.length) trainStage.load(frames, {once:true, force:true});
  clock.strikes += strikes.filter(id => !DEF.includes(id)).length;
  clock.nextCall = Date.now() + (T.pace * THEMES[theme].pace + c.length * .75) * 1000;
}`);
// clock state for the new round types
rep("const clock = {phase:\"idle\", round:1, left:0, endAt:0, timer:0, nextCall:0, paused:false, warned:false, burning:false, strikes:0, combos:0, done:0, saved:false, lastBeep:0};",
    "const clock = {phase:\"idle\", round:1, left:0, endAt:0, timer:0, nextCall:0, paused:false, warned:false, burning:false, strikes:0, combos:0, done:0, saved:false, lastBeep:0, perRound:[], queued:null, lastCombo:null, ladder:null, drill:null};");
rep("  Object.assign(clock, {phase:\"idle\", round:1, left:T.len, paused:false, warned:false, burning:false, strikes:0, combos:0, done:0, saved:false, lastBeep:0});\n  setCallMsg(\"Press start, then get in stance\");",
    "  Object.assign(clock, {phase:\"idle\", round:1, left:T.len, paused:false, warned:false, burning:false, strikes:0, combos:0, done:0, saved:false, lastBeep:0, perRound:[], queued:null, lastCombo:null, ladder:null, drill:null});\n  $(\"nextC\").textContent = \"\";\n  setCallMsg(\"Press start, then get in stance\");");
// a new round clears the ladder and the preview so each round starts fresh
rep("function startRound() {\n  clock.phase = \"fight\";", "function startRound() {\n  clock.ladder = null; clock.queued = null; $(\"nextC\").textContent = \"\";\n  clock.phase = \"fight\";");
// round-by-round output in the summary
rep("  $(\"summary\").hidden = false;\n  confetti();",
    "  $(\"sumRounds\").textContent = clock.perRound.length > 1 ? \"Combos per round: \" + clock.perRound.map(n => n || 0).join(\" · \") : \"\";\n  $(\"summary\").hidden = false; $(\"tSave\").hidden = true;\n  confetti();");

// ---------------- live screen: round dots, progress bar, save combo, resume banner ----------------
rep("  const th = THEMES[themeFor(clock.round)];\n  $(\"themeName\").textContent = th.name + (clock.phase === \"rest\" ? \" round next\" : \" round\");",
String.raw`  $("rdots").innerHTML = Array.from({length:T.rounds}, (_, i) => '<i class="' + (i < clock.done ? "d" : i === clock.round - 1 && clock.phase !== "done" && clock.phase !== "idle" ? "c" : "") + '"><\/i>').join("");
  const total = clock.phase === "fight" ? T.len : clock.phase === "rest" ? T.rest : clock.phase === "ready" ? 10 : 0;
  $("rbar").style.width = (total ? Math.min(100, Math.max(0, (1 - clock.left / total) * 100)) : clock.phase === "done" ? 100 : 0) + "%";
  $("tSave").hidden = !(clock.phase === "fight" && clock.lastCombo && clock.lastCombo.length > 1);
  const rt = $("trResumeTime"); if (rt) rt.textContent = ({ready:"Get ready", fight:"Round " + clock.round, rest:"Rest"})[clock.phase] + " · " + fmtTime(clock.left);
  const th = THEMES[themeFor(clock.round)];
  $("themeName").textContent = th.name + (clock.phase === "rest" ? " round next" : " round");`);
// End needs two taps while a workout is running, then goes back to the workout list
rep('$("tReset").addEventListener("click", () => { resetClock(); try { wakeLock && wakeLock.release(); } catch (e) {} });',
String.raw`let endArmed = 0;
$("tReset").addEventListener("click", () => {
  const running = clock.phase !== "idle" && clock.phase !== "done";
  if (running && endArmed < Date.now()) { endArmed = Date.now() + 3000; $("tReset").textContent = "Tap again to end"; setTimeout(() => { if (endArmed <= Date.now()) $("tReset").textContent = "End"; }, 3100); return; }
  endArmed = 0; $("tReset").textContent = "End"; resetClock(); try { wakeLock && wakeLock.release(); } catch (e) {} showTr("home");
});

// ---- bag work screens: workout list -> round-by-round plan -> live ----
let trScreen = "home", cbDraft = [];
const running = () => clock.phase !== "idle" && clock.phase !== "done";
function showTr(s) {
  trScreen = s;
  $("trHome").hidden = s !== "home"; $("trPlan").hidden = s !== "plan"; $("trLive").hidden = s !== "live";
  if (s === "home") paintTrHome(); if (s === "plan") paintPlan();
  scrollTo({top:0});
}
const fmtMin = sec => sec % 60 ? fmtTime(sec) : sec / 60 + " min";
function paintTrHome() {
  $("trResume").innerHTML = running() ? '<button class="livebar" id="trResumeBtn"><span><b>' + esc(PRESETS[T.preset].name) + ' in progress<\/b><br><span class="muted" id="trResumeTime"><\/span><\/span><span class="acc">Resume ›<\/span><\/button>' : "";
  if (running()) $("trResumeBtn").addEventListener("click", () => showTr("live"));
  const mine = (S.combos || []).length;
  $("trCards").innerHTML = Object.entries(PRESETS).filter(([id]) => id !== "custom").map(([id, p]) => {
    const themes = [...new Set(p.themes)].map(t => '<span>' + THEMES[t].name + '<\/span>').join("");
    const off = id === "mine" && !mine;
    return '<div class="rcard" data-p="' + id + '"><div class="rch"><button class="rtitle">' + p.name + '<\/button>' + (T.preset === id ? '<span class="nx">Last used<\/span>' : '') + '<\/div>' +
      '<small class="muted">' + p.d + (p.burn ? ' · burnout finish' : '') + '<\/small><div class="rthemes">' + themes + '<\/div>' +
      (off ? '<small class="muted">Save a combo below first.<\/small>' : '<button class="btn blue full" data-start="' + id + '">Start Workout<\/button>') + '<\/div>';
  }).join("") +
    '<div class="rcard" data-p="custom"><div class="rch"><button class="rtitle">Custom<\/button><\/div><small class="muted">' + T.rounds + ' × ' + fmtMin(T.len) + ' · ' + THEMES[T.focus].name + ' rounds · your own settings<\/small><button class="btn ghost full" data-custom>Set up a custom workout<\/button><\/div>';
  $("trCards").querySelectorAll("[data-start]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); applyPreset(b.dataset.start); startBag(); }));
  $("trCards").querySelectorAll(".rcard").forEach(c => c.addEventListener("click", () => { if (c.dataset.p === "mine" && !mine) return; applyPreset(c.dataset.p); showTr("plan"); }));
  const cu = $("trCards").querySelector("[data-custom]"); cu.addEventListener("click", e => { e.stopPropagation(); applyPreset("custom"); showTr("plan"); openTrSheet(); });
  paintCombos();
}
function paintPlan() {
  const p = PRESETS[T.preset], tot = T.rounds * T.len + (T.rounds - 1) * T.rest + (T.ready ? 10 : 0);
  $("trPlanName").textContent = p.name;
  $("trMeta").textContent = T.rounds + " rounds · about " + Math.round(tot / 60) + " min · " + OPT.pace.lbl(T.pace) + " pace · " + (T.calls === "numbers" ? "numbers" : "names");
  $("trRounds").innerHTML = Array.from({length:T.rounds}, (_, i) => {
    const th = THEMES[themeFor(i + 1)];
    return '<li><span class="n">' + (i + 1) + '<\/span><b>' + th.name + ' round<\/b><span class="t">' + fmtTime(T.len) + '<\/span><small>' + th.d + (T.burn ? ' Last 20 s: burnout.' : '') + '<\/small><\/li>' + (i < T.rounds - 1 ? '<li class="rest">Rest ' + T.rest + ' s<\/li>' : '');
  }).join("");
}
function startBag() {
  showTr("live");
  if (!running()) $("tStart").click();
}
function openTrSheet() { const d = $("trSheet"); try { d.showModal(); } catch (e) { d.setAttribute("open", ""); } }
function paintCombos() {
  const list = S.combos || [], box = $("myCombos");
  box.innerHTML = (list.length ? '<ul class="clist">' + list.map((c, i) => '<li><span class="cchips">' + c.map(chipHTML).join("") + '<\/span><button class="roundbtn sm" data-del="' + i + '" aria-label="Delete this combo">✕<\/button><\/li>').join("") + '<\/ul>' :
    '<p class="muted" style="margin:0;font-size:14px">Save combos from your coach or class, and the My Combos workout calls only those. During a round, tap ♡ Save combo to keep the one you just threw.<\/p>') +
    '<button class="btn ghost full" id="cbNew" style="margin-top:12px">+ Build a combo<\/button>';
  box.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { S.combos.splice(+b.dataset.del, 1); persist(); paintTrHome(); }));
  $("cbNew").addEventListener("click", () => { cbDraft = []; paintBuilder(); const d = $("cbSheet"); try { d.showModal(); } catch (e) { d.setAttribute("open", ""); } });
}
function paintBuilder() {
  $("cbSeq").innerHTML = cbDraft.length ? cbDraft.map(chipHTML).join("") : '<span class="muted">Tap moves below, in order<\/span>';
  const group = (label, ids) => { ids = ids.filter(id => MOVE_BY_ID[id] && MOVE_BY_ID[id].call); return ids.length ? '<div><span class="label">' + label + '<\/span><div class="chips" style="margin-top:6px">' + ids.map(id => '<button class="chip" data-add="' + id + '">' + (NUM[id] ? NUM[id] + " · " : "") + esc(MOVE_BY_ID[id].call) + '<\/button>').join("") + '<\/div><\/div>' : ''; };
  $("cbPick").innerHTML = group("Punches", PUNCH) + group("Kicks and knees", KICK) + group("Defense", DEF);
  $("cbPick").querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => { if (cbDraft.length < 8) cbDraft.push(b.dataset.add); paintBuilder(); }));
}
function saveCombo(c) {
  S.combos = S.combos || [];
  const key = c.join(",");
  if (S.combos.some(x => x.join(",") === key)) { toast("Already in My combos"); return false; }
  if (S.combos.length >= 40) { toast("My combos is full (40). Delete one first."); return false; }
  S.combos.push(c.slice(0, 8)); persist(); return true;
}
$("trSet").addEventListener("click", openTrSheet);
$("trEdit").addEventListener("click", openTrSheet);
$("trSheetClose").addEventListener("click", () => $("trSheet").close());
$("trSheet").addEventListener("click", e => { if (e.target === $("trSheet")) $("trSheet").close(); });
$("trSheet").addEventListener("close", () => { if (trScreen === "plan") paintPlan(); if (trScreen === "home") paintTrHome(); });
$("trBack").addEventListener("click", () => showTr("home"));
$("trGo").addEventListener("click", startBag);
$("trMin").addEventListener("click", () => showTr("home"));
$("trDone").addEventListener("click", () => { resetClock(); showTr("home"); });
$("tSave").addEventListener("click", () => { if (clock.lastCombo && saveCombo(clock.lastCombo)) toast("Saved to My combos"); });
$("cbUndo").addEventListener("click", () => { cbDraft.pop(); paintBuilder(); });
$("cbCancel").addEventListener("click", () => $("cbSheet").close());
$("cbSave").addEventListener("click", () => { if (cbDraft.length < 1) { toast("Add at least one move"); return; } if (saveCombo(cbDraft)) { toast("Combo saved"); $("cbSheet").close(); paintTrHome(); } });`);
// tapping Train while on a workout plan goes back to the list
rep('  if (t.dataset.view === "lift" && !$("view-lift").hidden && wkScreen === "day") { wkScreen = "home"; editMode = false; renderLift(); }',
    '  if (t.dataset.view === "lift" && !$("view-lift").hidden && wkScreen === "day") { wkScreen = "home"; editMode = false; renderLift(); }\n  if (t.dataset.view === "train" && !$("view-train").hidden && trScreen === "plan") showTr("home");');
// first paint of the bag work list happens at boot
rep("paintSettings();\nresetClock();\nrenderAll();", "paintSettings();\nresetClock();\nrenderAll();\nshowTr(\"home\");");

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
const bad = h.slice(sStart + 9, sEnd).indexOf("</");
if (bad >= 0) throw new Error("raw </ in script near " + h.slice(sStart + 9 + bad - 60, sStart + 9 + bad + 20));
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("bag work applied");
