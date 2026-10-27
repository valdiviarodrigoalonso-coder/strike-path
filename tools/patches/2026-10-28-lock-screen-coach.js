// Bag work that keeps going when the phone locks.
// The whole workout is planned up front (rounds, rests, every combo call, warnings), then rendered into one audio
// track (bells, beeps, the 10-second warning and the coach's voice from audio/coach.wav). Audio keeps playing on a locked
// phone, and the lock screen / always-on display shows a Now Playing card with the time left. The on-screen clock follows
// the track, so screen and sound never drift. The screen also asks to stay awake again whenever you come back to the app.
// With "Lock-screen coach" off (or if audio can't play), it falls back to live sounds and the phone's own voice.
// Run once: node tools/patches/2026-10-28-lock-screen-coach.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("function buildPlan(")) { console.log("already applied"); process.exit(0); }
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

// ---------------- setting ----------------
rep('const EXTRAS = {voice:"Coach voice", ready:"10s get-ready", warn:"10s warning", burn:"Burnout finish", foot:"Footwork cues", quiet:"Quiet alerts"};\nconst T = {preset:"quick", voice:true, ready:true, warn:true, burn:false, foot:false, quiet:false};',
    'const EXTRAS = {voice:"Coach voice", lock:"Lock-screen coach", ready:"10s get-ready", warn:"10s warning", burn:"Burnout finish", foot:"Footwork cues", quiet:"Quiet alerts"};\nconst T = {preset:"quick", voice:true, lock:true, ready:true, warn:true, burn:false, foot:false, quiet:false};');
rep('OPT.pace.lbl(T.pace) + " pace · " + (T.calls === "numbers" ? "numbers" : "names");',
    'OPT.pace.lbl(T.pace) + " pace · " + (T.calls === "numbers" ? "numbers" : "names") + (T.lock ? " · keeps going if your phone locks" : "");');

// ---------------- clock state ----------------
rep('const clock = {phase:"idle", round:1, left:0, endAt:0, timer:0, nextCall:0, paused:false, warned:false, burning:false, strikes:0, combos:0, done:0, saved:false, lastBeep:0, perRound:[], queued:null, lastCombo:null, ladder:null, drill:null};',
    '// plan: the whole workout worked out at Start ({segs, ev, total}); the clock reads time from the audio track when there is one\nconst clock = {phase:"idle", round:1, left:0, timer:0, paused:false, burning:false, strikes:0, combos:0, done:0, saved:false, perRound:[], queued:null, lastCombo:null, ladder:null, drill:null,\n  plan:null, ei:0, seg:null, t0:0, pausedAt:0, audio:null, url:"", starting:false};');

replaceFn("resetClock", String.raw`
function resetClock() {
  clearInterval(clock.timer);
  if (clock.done && !clock.saved) saveSession();
  if (clock.audio) { try { clock.audio.pause(); } catch (e) {} }
  if (clock.url) URL.revokeObjectURL(clock.url);
  keepAwake(false);
  Object.assign(clock, {phase:"idle", round:1, left:T.len, paused:false, burning:false, strikes:0, combos:0, done:0, saved:false, perRound:[], queued:null, lastCombo:null, ladder:null, drill:null, plan:null, ei:0, seg:null, audio:null, url:"", pausedAt:0});
  try { speechSynthesis.cancel(); } catch (e) {}
  try { if ("mediaSession" in navigator) navigator.mediaSession.metadata = null; } catch (e) {}
  $("nextC").textContent = "";
  setCallMsg("Press start, then get in stance"); trainStage.pose("stance"); $("summary").hidden = true; paintClock();
}`);

// ---------------- planning, firing events, the audio track ----------------
replaceFn("call", String.raw`
// ---- the workout plan: every bell, beep, call and warning, worked out when you press Start ----
const ROUNDW = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"].map(w => "Round " + w);
const NUMWORD = {"1":"One", "2":"Two", "3":"Three", "6":"Six"};
const clipFor = id => isFoot(id) ? FOOT[id] : T.calls === "numbers" && NUM[id] ? NUMWORD[NUM[id]] : MOVE_BY_ID[id].call;
function buildPlan() {
  const segs = [], ev = [], add = (t, type, o) => ev.push(Object.assign({t, type}, o || {}));
  const keep = clock.round; let t = 0;
  if (T.ready) { segs.push({k:"ready", round:1, s:0, e:10}); add(0, "say", {w:["Get ready"]}); [7, 8, 9].forEach(x => add(x, "beep", {f:660})); t = 10; }
  for (let r = 1; r <= T.rounds; r++) {
    clock.round = r; clock.ladder = null; clock.drill = null;
    const theme = themeFor(r), th = THEMES[theme], s = t, e = t + T.len, stopAt = Math.min(T.burn ? e - 20 : e, e - 3);
    segs.push({k:"fight", round:r, s, e});
    add(s, "bell", {n:1}); add(s + .4, "say", {w:[ROUNDW[r - 1] || "Round", th.name, "Fight!"]});
    let ct = s + 2.2;
    while (ct < stopAt) {
      if (theme === "reaction") { add(ct, "react", {ids:makeCombo("speed")}); ct += (.8 + Math.random() * 3) * Math.max(.6, T.pace / 5); continue; }
      const c = nextCombo(theme); add(ct, "combo", {ids:c});
      ct += Math.max(.9, T.pace * th.pace + c.length * .75 - 1.5);   // 1.5 s quicker than before, never under 0.9 s
    }
    if (T.burn) add(e - 20, "burn", {kicks:theme === "kicks" && callable().includes("teep")});
    if (T.warn) add(e - 10, "warn");
    add(e, "bell", {n:r < T.rounds ? 1 : 3}); add(e, "roundEnd", {round:r});
    if (r < T.rounds) { segs.push({k:"rest", round:r + 1, s:e, e:e + T.rest}); add(e + .9, "say", {w:["Rest.", "Next up", THEMES[themeFor(r + 1)].name, "round"]}); t = e + T.rest; }
    else { add(e + 1.1, "say", {w:["Time! Great work."], tail:true}); t = e; }
  }
  clock.round = keep; clock.ladder = null; clock.drill = null;
  ev.sort((a, b) => a.t - b.t);
  return {segs, ev, total:t};
}
const segAt = t => { for (const s of clock.plan.segs) if (t >= s.s && t < s.e) return s; return null; };
const elapsed = () => clock.paused ? clock.pausedAt : clock.audio ? clock.audio.currentTime : (Date.now() - clock.t0) / 1000;
// stale = an event that passed while the phone was locked or the screen was away: count it, but don't play it late
function fire(e, stale) {
  const sound = !clock.audio && !stale;
  if (e.type === "beep") { if (sound) beep(e.f); }
  else if (e.type === "bell") { if (sound) ring(e.n); }
  else if (e.type === "warn") { if (sound) { if (T.quiet) notify("warn"); else clap(2); } }
  else if (e.type === "say") { if (sound && !e.tail) say(e.w.join(", ")); }
  else if (e.type === "combo" || e.type === "react") showCombo(e, stale, sound);
  else if (e.type === "burn") {
    clock.burning = true; clock.strikes += 44;
    setCallMsg("Burnout! Nonstop " + (e.kicks ? "teeps" : "jab-cross") + " to the bell"); $("nextC").textContent = "";
    if (!stale) trainStage.load(e.kicks ? ["chamberL", "teep"] : ["jab", "cross"], {force:true});
    if (sound) say("Burnout! Go go go!");
  } else if (e.type === "roundEnd") {
    const before = snapshot();
    S.rounds++; clock.done++; markToday(); persist(); renderHUD(); renderHero(); renderTrophies();
    toast("+10 XP · Round " + e.round + " done", "xp"); celebrate(before);
  }
}
function showCombo(e, stale, sound) {
  clock.combos++; clock.perRound[clock.round - 1] = (clock.perRound[clock.round - 1] || 0) + 1;
  const strikes = e.ids.filter(id => !isFoot(id));
  clock.strikes += strikes.filter(id => !DEF.includes(id)).length; clock.lastCombo = strikes;
  if (stale) return;
  if (e.type === "react") {
    if (sound) beep(990); try { navigator.vibrate && navigator.vibrate(60); } catch (x) {}
    $("callout").innerHTML = '<span class="go">GO!<\/span>'; $("nextC").textContent = "Any combo, then reset your stance and bounce."; popSfx(pick(SFX_HIT));
  } else {
    $("callout").innerHTML = e.ids.map((id, i) => '<span class="c ' + chipCls(id) + '" style="animation-delay:' + (i * 70) + 'ms">' + (T.calls === "numbers" && NUM[id] ? '<b>' + NUM[id] + '<\/b><small>' + esc(MOVE_BY_ID[id].call) + '<\/small>' : esc(callWord(id))) + '<\/span>').join("");
    let nx = null; for (let i = clock.ei; i < clock.plan.ev.length; i++) { const x = clock.plan.ev[i]; if (x.type === "combo") { nx = x; break; } if (x.type === "roundEnd" || x.type === "burn") break; }
    $("nextC").innerHTML = nx ? 'Next: <b>' + nx.ids.map(id => esc(callWord(id))).join(T.calls === "numbers" ? "-" : ", ") + '<\/b>' : "";
    if (sound) say(e.ids.map(callWord).join(", "));
    if (strikes.length) popSfx(pick(strikes.some(id => KICK.includes(id)) ? SFX_KICK : SFX_HIT));
  }
  const frames = []; strikes.forEach((id, i) => { if (i) frames.push("stance"); frames.push(...MOVE_BY_ID[id].frames.filter(f => f !== "stance")); });
  if (frames.length) trainStage.load(frames, {once:true, force:true});
}

// ---- the coach's voice: short recorded clips (audio/coach.wav, offsets in audio/coach.json) ----
let coachBank = null;
async function loadCoach() {
  if (coachBank) return coachBank;
  const [meta, buf] = await Promise.all([fetch("audio/coach.json").then(r => r.json()), fetch("audio/coach.wav").then(r => r.arrayBuffer())]);
  const dv = new DataView(buf); let o = 12, data = 0, len = 0;
  while (o + 8 <= dv.byteLength) { const id = String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3)), n = dv.getUint32(o + 4, true); if (id === "data") { data = o + 8; len = n; break; } o += 8 + n + (n & 1); }
  if (!data) throw new Error("coach audio unreadable");
  return (coachBank = {rate:meta.rate, clips:meta.clips, pcm:new Int16Array(buf.slice(data, data + len))});
}
const wavURL = (pcm, rate) => {
  const hd = new DataView(new ArrayBuffer(44)), str = (o, s) => { for (let i = 0; i < s.length; i++) hd.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); hd.setUint32(4, 36 + pcm.length * 2, true); str(8, "WAVE"); str(12, "fmt "); hd.setUint32(16, 16, true); hd.setUint16(20, 1, true); hd.setUint16(22, 1, true);
  hd.setUint32(24, rate, true); hd.setUint32(28, rate * 2, true); hd.setUint16(32, 2, true); hd.setUint16(34, 16, true); str(36, "data"); hd.setUint32(40, pcm.length * 2, true);
  return URL.createObjectURL(new Blob([hd.buffer, pcm.buffer], {type:"audio/wav"}));
};
// mix the plan into one track: same sounds as the live timer, plus the coach's voice from the clips
function renderTrack(P, bank) {
  const R = bank.rate, N = Math.ceil((P.total + 3.5) * R), out = new Int16Array(N);
  const mix = (i, v) => { if (i < 0 || i >= N) return; const s = out[i] + v; out[i] = s > 32767 ? 32767 : s < -32768 ? -32768 : s; };
  const tone = (t, f, len, vol, sq) => { const i0 = Math.round(t * R), n = Math.round(len * R); for (let i = 0; i < n; i++) { const x = i / R, w = Math.sin(2 * Math.PI * f * x); mix(i0 + i, (sq ? Math.sign(w) : w) * Math.min(1, x / .01) * Math.exp(-x * 5 / len) * vol * 32767); } };
  const noise = (t, len, vol) => { const i0 = Math.round(t * R), n = Math.round(len * R); for (let i = 0; i < n; i++) mix(i0 + i, (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4) * vol * 32767); };
  const voice = (t, words) => { let i0 = Math.round(t * R); words.forEach(w => { const c = bank.clips[w]; if (!c) return; for (let i = 0; i < c[1]; i++) mix(i0 + i, bank.pcm[c[0] + i] * .9); i0 += c[1] + Math.round(.05 * R); }); };
  const bell = (t, n) => { for (let k = 0; k < n; k++) { if (T.quiet) { tone(t + k * .4, 660, .5, .22); tone(t + k * .4 + .18, 880, .55, .22); } else { tone(t + k * .32, 880, 1.1, .4); tone(t + k * .32, 1320, 1.1, .16); } } };
  P.ev.forEach(e => {
    if (e.type === "beep") tone(e.t, e.f, .18, .35);
    else if (e.type === "bell") bell(e.t, e.n);
    else if (e.type === "warn") { if (T.quiet) { tone(e.t, 520, .2, .25); tone(e.t + .25, 520, .2, .25); } else { noise(e.t, .09, .5); noise(e.t + .22, .09, .5); } if (T.voice) voice(e.t + .5, ["Ten seconds"]); }
    else if (e.type === "react") tone(e.t, 990, .18, .5);
    else if (e.type === "burn") { if (T.voice) voice(e.t, ["Burnout! Go go go!"]); }
    else if (T.voice && e.type === "say") voice(e.t, e.w);
    else if (T.voice && e.type === "combo") voice(e.t, e.ids.map(clipFor));
  });
  return wavURL(out, R);
}
// lock screen / always-on display: what is happening and when the round ends
const hm = d => d.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"});
function mediaMeta() {
  if (!("mediaSession" in navigator) || !clock.plan || !window.MediaMetadata) return;
  try {
    const sg = clock.seg, name = PRESETS[T.preset].name, end = sg ? new Date(Date.now() + (sg.e - elapsed()) * 1000) : null;
    const title = !sg ? name : sg.k === "fight" ? "Round " + sg.round + " of " + T.rounds + " · bell at " + hm(end) : sg.k === "rest" ? "Rest · round " + sg.round + " starts " + hm(end) : "Get ready";
    navigator.mediaSession.metadata = new MediaMetadata({title, artist:name + " · Strike Path", album:"Bag work", artwork:[{src:"icons/icon-512.png", sizes:"512x512", type:"image/png"}]});
    if (clock.audio && navigator.mediaSession.setPositionState && isFinite(clock.audio.duration)) navigator.mediaSession.setPositionState({duration:clock.audio.duration, position:Math.min(elapsed(), clock.audio.duration), playbackRate:1});
  } catch (e) {}
}
// keep the screen on during a workout, and ask again whenever you come back (phones drop the request when the screen changes)
let wakeLock = null;
async function keepAwake(on) {
  if (!on) { try { wakeLock && wakeLock.release(); } catch (e) {} wakeLock = null; return; }
  try { if (navigator.wakeLock && (!wakeLock || wakeLock.released)) wakeLock = await navigator.wakeLock.request("screen"); } catch (e) {}
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && running() && !clock.paused) { keepAwake(true); tickClock(); mediaMeta(); } });`);

replaceFn("finishSession", String.raw`
function finishSession() {
  clock.phase = "done"; clock.left = 0; clock.burning = false; clearInterval(clock.timer); keepAwake(false);
  saveSession();
  setCallMsg(clock.done + " rounds in the bank. Great session."); trainStage.pose("stance"); if (!clock.audio) say("Time! Great work.");
  $("sumStats").innerHTML = [[clock.done, "Rounds"], [Math.round(clock.done * T.len / 60), "Minutes"], [clock.combos, "Combos called"], ["~" + Math.round(clock.strikes), "Strikes thrown"]].map(s => '<div><b>' + s[0] + '<\/b><span class="label">' + s[1] + '<\/span><\/div>').join("");
  $("rpe").innerHTML = Array.from({length:10}, (_, i) => '<button id="rpe-' + (i + 1) + '" aria-pressed="false">' + (i + 1) + '<\/button>').join("");
  $("rpe").querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => {
    const last = S.sessions[S.sessions.length - 1]; if (last) { last.rpe = i + 1; persist(); renderLog(); }
    $("rpe").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    toast("Logged: effort " + (i + 1) + "/10");
  }));
  $("sumRounds").textContent = clock.perRound.length > 1 ? "Combos per round: " + clock.perRound.map(n => n || 0).join(" · ") : "";
  $("summary").hidden = false; $("tSave").hidden = true;
  try { if ("mediaSession" in navigator && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({title:"Workout done · " + clock.done + " rounds", artist:"Strike Path"}); } catch (e) {}
  paintClock(); confetti();
}`);

replaceFn("tickClock", String.raw`
function tickClock() {
  if (!clock.plan || clock.phase === "done" || clock.phase === "idle") return;
  const P = clock.plan, el = elapsed();
  while (clock.ei < P.ev.length && P.ev[clock.ei].t <= el) {
    const e = P.ev[clock.ei++], stale = el - e.t > 1.5, sg = segAt(e.t);
    if (sg && sg !== clock.seg) enterSeg(sg, stale);
    fire(e, stale);
  }
  if (el >= P.total) { finishSession(); return; }
  const sg = segAt(el); if (sg && sg !== clock.seg) enterSeg(sg, false);
  clock.left = sg ? sg.e - el : 0;
  paintClock();
}`);
replaceFn("startRound", String.raw`
function enterSeg(sg, stale) {
  clock.seg = sg; clock.phase = sg.k; clock.round = sg.round; clock.burning = false;
  const th = THEMES[themeFor(sg.round)];
  if (sg.k === "fight") { $("nextC").textContent = ""; setCallMsg("Round " + sg.round + ": " + th.name + ". Fight!"); if (!stale) popSfx("FIGHT!", "en"); }
  else if (sg.k === "rest") { $("nextC").textContent = ""; setCallMsg("Rest. Breathe. Next: " + th.name + " round."); trainStage.pose("stance"); }
  else setCallMsg("Get in stance. Hands up.");
  mediaMeta();
}`);

// ---------------- Start / Pause / Skip ----------------
{
  const a = h.indexOf('let wakeLock = null;\n$("tStart").addEventListener("click", () => {'), b = h.indexOf("let endArmed = 0;");
  if (a < 0 || b < 0 || b < a) throw new Error("start block not found");
  h = h.slice(0, a) + String.raw`// one reusable audio element: unlocking it inside the tap lets the finished track play a moment later
const bagAudio = new Audio(); bagAudio.preload = "auto";
const SILENCE = wavURL(new Int16Array(1100), 11025);
bagAudio.addEventListener("pause", () => { if (clock.audio === bagAudio && running() && !clock.paused && !bagAudio.ended) { clock.pausedAt = bagAudio.currentTime; clock.paused = true; paintClock(); } });
bagAudio.addEventListener("play", () => { if (clock.audio === bagAudio && clock.paused) { clock.paused = false; paintClock(); } });
async function beginBag() {
  if (clock.starting) return;
  clock.starting = true;
  resetClock();
  if (T.lock) { bagAudio.src = SILENCE; bagAudio.play().catch(() => {}); setCallMsg("Getting your coach ready…"); }
  const plan = buildPlan();
  let url = "";
  if (T.lock) {
    try {
      url = renderTrack(plan, await loadCoach());
      bagAudio.src = url; bagAudio.currentTime = 0; await bagAudio.play();
    } catch (e) { if (url) URL.revokeObjectURL(url); url = ""; toast("The lock-screen coach can't play here, so keep the screen on"); }
  }
  Object.assign(clock, {plan, ei:0, seg:null, audio:url ? bagAudio : null, url, t0:Date.now(), paused:false, pausedAt:0, starting:false});
  clock.phase = plan.segs[0].k;
  keepAwake(true);
  clock.timer = setInterval(tickClock, 200); tickClock();
}
function pauseBag() {
  if (!running() || clock.paused) return;
  clock.pausedAt = elapsed(); clock.paused = true; if (clock.audio) clock.audio.pause();
  trainStage.stop(); try { speechSynthesis.cancel(); } catch (e) {} paintClock();
}
function resumeBag() {
  if (!clock.paused) return;
  clock.paused = false;
  if (clock.audio) { clock.audio.currentTime = clock.pausedAt; clock.audio.play().catch(() => {}); } else clock.t0 = Date.now() - clock.pausedAt * 1000;
  keepAwake(true); paintClock();
}
$("tStart").addEventListener("click", () => {
  ac();
  if (!running()) beginBag();
  else if (!clock.paused) pauseBag();
  else resumeBag();
});
$("tSkip").addEventListener("click", () => {
  if (!(clock.phase === "rest" || clock.phase === "ready") || !clock.seg) return;
  const to = clock.seg.e;
  if (clock.paused) clock.pausedAt = to;
  if (clock.audio) clock.audio.currentTime = to; else if (!clock.paused) clock.t0 = Date.now() - to * 1000;
  tickClock(); mediaMeta();
});
` + h.slice(b);
}
rep('endArmed = 0; $("tReset").textContent = "End"; resetClock(); try { wakeLock && wakeLock.release(); } catch (e) {} showTr("home");',
    'endArmed = 0; $("tReset").textContent = "End"; resetClock(); showTr("home");');

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
if (h.slice(sStart + 9, sEnd).indexOf("</") >= 0) throw new Error("raw </ in script");
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("lock-screen coach applied");
