// Exercise photos (start and finish frames from free-exercise-db, public domain) for every exercise,
// including the core circuit, plus a tap-to-view sheet with a form cue, and a "Save your progress" card on Profile.
// Photos live in img/ex/<key>-0.jpg (start) and -1.jpg (finish).
// Run once: node tools/patches/2026-10-28-exercise-photos.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("const PHOTO_BY_ID")) { console.log("already applied"); process.exit(0); }
const rep = (a, b, all) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 80)); h = all ? h.split(a).join(b) : h.replace(a, b); };

// ---------------- styles ----------------
rep(".ex.complete .av{background:var(--green);color:#fff}", String.raw`.ex.complete .av{background:var(--green);color:#fff}
.av.ph{padding:0;overflow:hidden;border:0;cursor:pointer;background:#f2f2f7}
.av.ph img{width:100%;height:100%;object-fit:cover;display:block}
span.av.ph{cursor:default}
.ex.complete .av.ph{background:#f2f2f7;outline:3px solid var(--green);outline-offset:1px}
.evframes{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.evframes.one{grid-template-columns:1fr}
.evframes figure{margin:0;display:flex;flex-direction:column;gap:4px}
.evframes img{width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:10px;background:var(--mat-2)}
.evframes figcaption{font-size:12px;color:var(--muted);text-align:center}
.credit{font-size:11px;color:var(--muted);margin:10px 0 0}
.coreph{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px}
.coreph img{width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:8px;background:var(--mat-2)}
.cimg{width:76px;height:76px;border-radius:10px;object-fit:cover;flex:none;background:var(--mat-2)}
.corestrip{display:flex;flex-direction:column;gap:8px;margin-top:2px}
.corestrip span{display:flex;align-items:center;gap:10px;font-size:15px}
.savecard{display:flex;flex-direction:column;gap:8px;margin-top:18px;background:rgba(47,140,246,.12)}
.savecard b{font-size:17px}`);

// ---------------- photo sheet ----------------
rep('<nav class="tabbar" aria-label="Sections">', String.raw`<dialog class="sheet" id="exView" aria-labelledby="evName">
  <div class="sheethd"><h3 id="evName">Exercise</h3><button class="linkbtn" id="evClose">Done</button></div>
  <div class="evframes" id="evFrames"><figure><img id="ev0" alt=""><figcaption id="evCap0">Start</figcaption></figure><figure id="evFig1"><img id="ev1" alt=""><figcaption>Finish</figcaption></figure></div>
  <p id="evTip" style="margin:12px 0 0"></p>
  <p class="credit">Photos: free-exercise-db (public domain). Your gym's machines may look a little different.</p>
</dialog>
<nav class="tabbar" aria-label="Sections">`);

// ---------------- profile: a card that invites you to save your progress (filled in by sync.js) ----------------
rep('<div><span>Records</span><b id="pfR">0</b></div></div></div></div>\n', '<div><span>Records</span><b id="pfR">0</b></div></div></div></div>\n    <div id="acctCard"></div>\n');

// ---------------- photos for exercises ----------------
rep("const avatar = n => '<span class=\"av\" aria-hidden=\"true\">' + initials(n) + '<\\/span>';", String.raw`// exercise photos: start (-0) and finish (-1) frames in img/ex, matched by exercise id, or by name for ones you add
const PHOTO_BY_ID = {p_tm:"tread", l_tm:"tread", g_tm:"tread", p_bp:"bench", p_dip:"dip", p_fly:"fly", p_lat:"lat", p_pd:"pushdown", p_kb:"kickback",
  l_pu:"pullup", l_row:"row", l_sap:"sap", l_rdf:"rdf", l_inc:"inccurl", l_shr:"shrug", l_rc:"revcurl", l_wc:"wristcurl", l_dh:"hang",
  g_sq:"squat", g_rdl:"rdl", g_ht:"hipthrust", g_ext:"legext", g_cur:"legcurl", g_add:"adductor", g_calf:"calf"};
const PHOTO_WORDS = [[/ab ?wheel|roll ?out|ab roller/i, "abwheel"], [/pallof/i, "pallof"], [/chop/i, "chop"], [/treadmill|jog|\brun\b/i, "tread"],
  [/rear delt|reverse fl/i, "rdf"], [/wrist/i, "wristcurl"], [/reverse.*curl/i, "revcurl"], [/leg curl|hamstring curl/i, "legcurl"], [/curl/i, "inccurl"],
  [/leg ext/i, "legext"], [/adduct/i, "adductor"], [/calf|calves/i, "calf"], [/hip thrust|glute bridge/i, "hipthrust"], [/romanian|rdl|deadlift/i, "rdl"], [/squat|leg press/i, "squat"],
  [/hang/i, "hang"], [/shrug/i, "shrug"], [/straight.?arm|pullover/i, "sap"], [/row/i, "row"], [/pull.?up|chin.?up|pulldown/i, "pullup"],
  [/kickback/i, "kickback"], [/pushdown|tricep|skull/i, "pushdown"], [/lateral|side raise/i, "lat"], [/fly|flye|pec|crossover/i, "fly"], [/dip/i, "dip"], [/bench|press/i, "bench"]];
const ONE_FRAME = new Set(["hang"]);   // the dead hang is a hold: only the start frame applies
const PHOTO_TIP = {
  tread:"Easy pace for 5–8 minutes. You should be able to talk the whole time.",
  bench:"Shoulder blades pinched, feet planted. Lower to mid-chest, then press up and slightly back.",
  dip:"Lean forward a little for chest. Lower until your shoulders are just below your elbows.",
  fly:"Soft bend in the elbows. Squeeze your chest to bring the handles together; control the way back.",
  lat:"Lead with your elbows and raise to shoulder height. No swinging.",
  pushdown:"Elbows pinned to your sides. Push down until your arms are straight, squeeze, come back slowly.",
  kickback:"Upper arm parallel to the floor and still. Straighten the elbow fully, then lower with control.",
  pullup:"Start from a full hang. Drive your elbows down toward your ribs until your chin clears the bar.",
  row:"Chest tall. Pull to your belly button and squeeze your shoulder blades, then let them stretch forward.",
  sap:"Arms nearly straight. Sweep the bar down to your thighs with your lats, not your triceps.",
  rdf:"Hinge forward with a flat back. Open your arms wide like wings and squeeze the back of your shoulders.",
  inccurl:"Lie back on an incline so your arms hang behind you. Curl without letting your elbows drift forward.",
  shrug:"Lift your shoulders straight up toward your ears, pause, lower slowly. Don't roll them.",
  revcurl:"Overhand grip, elbows still. This builds the forearms that keep your guard strong.",
  wristcurl:"Bar behind you, palms facing back. Let it roll to your fingertips, then curl it up with your wrists.",
  hang:"Straight arms, shoulders gently pulled down (not shrugged). Breathe and hold. Ignore the raised legs in the photo; just hang.",
  squat:"Brace, sit down between your heels, knees over your toes. Go as deep as your back stays flat, then drive up.",
  rdl:"Soft knees, push your hips back, slide the bar down your thighs. Stop when your hamstrings stretch.",
  hipthrust:"Upper back on the bench, chin tucked. Drive through your heels and squeeze your glutes at the top.",
  legext:"Pad on your lower shins. Straighten your legs fully, squeeze your quads, lower slowly.",
  legcurl:"Pad just above your heels. Curl as far as you can, squeeze, and resist on the way back.",
  adductor:"Sit tall. Squeeze your knees together with control; don't let the weight slam back.",
  calf:"Balls of your feet on the edge. Full stretch at the bottom, then rise as high as you can.",
  abwheel:"On your knees, glutes squeezed. Roll out only as far as your lower back stays flat, then pull back with your abs.",
  pallof:"Stand side-on to the cable or band. Press straight out and hold; don't let it twist you.",
  chop:"Pull diagonally across your body and turn your chest. Your core does the turning; your arms just hold. The photo uses a cable; a band works the same."
};
const photoKey = (id, n) => PHOTO_BY_ID[String(id || "").split("@")[0]] || (PHOTO_WORDS.find(w => w[0].test(n || "")) || [])[1] || "";
const photoSrc = (k, fr) => "img/ex/" + k + "-" + (ONE_FRAME.has(k) ? 0 : fr) + ".jpg";
const avatar = (n, id, tap) => {
  const k = photoKey(id, n);
  if (!k) return '<span class="av" aria-hidden="true">' + initials(n) + '<\/span>';
  const img = '<img src="' + photoSrc(k, 0) + '" alt="" loading="lazy" decoding="async">';
  return tap ? '<button class="av ph" data-photo="' + k + '" data-pname="' + esc(n) + '" aria-label="See how to do ' + esc(n) + '">' + img + '<\/button>' : '<span class="av ph" aria-hidden="true">' + img + '<\/span>';
};
function openPhoto(k, name) {
  const one = ONE_FRAME.has(k), d = $("exView");
  $("evName").textContent = name; $("evTip").textContent = PHOTO_TIP[k] || "";
  $("ev0").src = photoSrc(k, 0); $("ev0").alt = (one ? "" : "Start position: ") + name;
  $("ev1").src = photoSrc(k, 1); $("ev1").alt = "Finish position: " + name;
  $("evFig1").hidden = one; $("evFrames").classList.toggle("one", one); $("evCap0").textContent = one ? "Hold this position" : "Start";
  try { d.showModal(); } catch (e) { d.setAttribute("open", ""); }
}
// capture phase so tapping a photo never also triggers the card underneath it
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-photo]"); if (!b) return; e.preventDefault(); e.stopPropagation(); openPhoto(b.dataset.photo, b.dataset.pname); }, true);
$("evClose").addEventListener("click", () => $("exView").close());
$("exView").addEventListener("click", e => { if (e.target === $("exView")) $("exView").close(); });`);
rep("avatar(ex.n)", "avatar(ex.n, ex.id, true)", true);
rep("avatar(x.n || x.id)", 'avatar(x.n || "Exercise", x.id)');
rep('avatar("Core Finisher") + \'<span>\'', 'avatar("Ab wheel rollout", "") + \'<span>\'');
rep(String.raw`'<div class="ex hv"><div class="exh">' + avatar("Core Finisher") + '<div class="exn"><b>Fight core finisher<\/b><\/div><span class="tgt">' + S.lifts.coreRounds + ' rounds · ' + m.core + ' min<\/span><\/div><div class="sugg2">Ab wheel, Pallof press and banded chops: 40 s on, 20 s off, at the end of the workout.<\/div><\/div>'`,
    String.raw`'<div class="ex hv"><div class="exh"><div class="exn"><b>Fight core finisher<\/b><\/div><span class="tgt">' + S.lifts.coreRounds + ' rounds · ' + m.core + ' min<\/span><\/div><div class="sugg2">40 s on, 20 s off, at the end of the workout. Tap a photo to see the movement.<\/div>' +
      '<div class="corestrip">' + CORE.map(c => '<span>' + avatar(c.n, "", true) + esc(c.n) + '<\/span>').join("") + '<\/div><\/div>'`);

// ---------------- core circuit: start/finish photos for each exercise, and the current one on the clock ----------------
rep(String.raw`<small>' + c.cue + '<\/small><\/div>').join("") +`,
    String.raw`<small>' + c.cue + '<\/small><div class="coreph">' + [0, 1].map(fr => '<img src="' + photoSrc(photoKey("", c.n), fr) + '" alt="' + (fr ? "Finish" : "Start") + ' position: ' + esc(c.n) + '" loading="lazy">').join("") + '<\/div><\/div>').join("") +`);
rep('<div class="coreclock" id="coreClock"><span class="ct">40', '<div class="coreclock" id="coreClock"><img class="cimg" id="coreImg" alt=""><span class="ct">40');
rep("  const next = st[coreT.step + 1];\n", String.raw`  const next = st[coreT.step + 1];
  // the photo shows what to do now (or next, while resting), flipping between start and finish during work
  const ci = $("coreImg"), cx = coreT.run ? (s.work || !next ? CORE[s.i] : CORE[next.i]) : CORE[0];
  if (ci) { const src = photoSrc(photoKey("", cx.n), coreT.run && s.work ? Math.floor(Date.now() / 900) % 2 : 0); if (ci.getAttribute("src") !== src) ci.src = src; ci.alt = cx.n; }
`);

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
const bad = h.slice(sStart + 9, sEnd).indexOf("</");
if (bad >= 0) throw new Error("raw </ in script");
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("exercise photos applied");
