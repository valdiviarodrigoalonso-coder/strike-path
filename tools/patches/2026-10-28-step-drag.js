// Step & Drag, rebuilt so the coach never slides:
// every transition moves one foot only, each pair of steps brings him back to where he started
// (forward then back, back then forward, right then left, left then right), and a moving foot
// lifts a little off the floor instead of gliding. Adds stepping left and right to the lesson.
// Run once: node tools/patches/2026-10-28-step-drag.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("fwd1:{")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 90)); h = h.replace(a, b); };

// ---------------- lesson text and frames ----------------
rep(`   steps:["To go forward, push off the rear foot and step the lead foot a few inches forward.",
          "Drag the rear foot the same distance so your stance stays the same width.",
          "To go back, the rear foot moves first and the lead foot follows. To go sideways, move the foot nearest that direction first.",
          "Stay light on the balls of your feet with your guard up the whole time."],`,
`   steps:["Forward: push off the rear foot and step the lead foot a few inches forward, then drag the rear foot the same distance.",
          "Back: the rear foot steps back first, then the lead foot follows the same distance.",
          "Right (orthodox): the right foot steps out first, then the left foot follows.",
          "Left (orthodox): the left foot steps out first, then the right foot follows. The rule: the foot nearest where you're going moves first.",
          "After every step your stance is the same width as before. Stay light on the balls of your feet with your guard up the whole time."],`);
rep('   frames:["stepA","stepB","stance","stepC","stepD"]},',
    '   // one foot at a time, and each pair of steps comes back to where it started, so nothing ever slides\n' +
    '   frames:["fwd1","fwd2","back1","home","bk1","bk2","bkret","home","rt1","rt2","rtret","home","lt1","lt2","ltret"]},');

// ---------------- poses: stance is lead foot [.30,0,-.14], rear foot [-.28,.05,.14]; steps of .14 forward/back and .12 sideways ----------------
rep(`  stepA:{hip:[.06,.82,0], LF:[.44,0,-.14]},
  stepB:{hip:[.13,.82,0], LF:[.44,0,-.14], RF:[-.15,0,.14]},
  stepC:{hip:[-.06,.82,0], RF:[-.42,0,.14]},
  stepD:{hip:[-.13,.82,0], RF:[-.42,0,.14], LF:[.17,0,-.14]},`,
`  // footwork: forward (lead foot first), back (rear foot first), right (right foot first), left (left foot first)
  home:{},
  fwd1:{hip:[.06,.82,0], LF:[.44,0,-.14]},
  fwd2:{hip:[.14,.82,0], LF:[.44,0,-.14], RF:[-.14,.05,.14]},
  back1:{hip:[.07,.82,0], LF:[.44,0,-.14]},
  bk1:{hip:[-.07,.82,0], RF:[-.42,.05,.14]},
  bk2:{hip:[-.14,.82,0], RF:[-.42,.05,.14], LF:[.16,0,-.14]},
  bkret:{hip:[-.07,.82,0], RF:[-.42,.05,.14]},
  rt1:{hip:[0,.82,.06], RF:[-.28,.05,.26]},
  rt2:{hip:[0,.82,.12], RF:[-.28,.05,.26], LF:[.30,0,-.02]},
  rtret:{hip:[0,.82,.06], RF:[-.28,.05,.26]},
  lt1:{hip:[0,.82,-.06], LF:[.30,0,-.26]},
  lt2:{hip:[0,.82,-.12], LF:[.30,0,-.26], RF:[-.28,.05,.02]},
  ltret:{hip:[0,.82,-.06], LF:[.30,0,-.26]},`);

// ---------------- timing: steady steps ----------------
rep("const TIMING = {stance:[170, 30], fast:[200, 90], kick:[130, 110], chamber:[150, 20], move:[300, 200]};",
    "const TIMING = {stance:[170, 30], fast:[200, 90], kick:[130, 110], chamber:[150, 20], move:[300, 200], step:[340, 230]};");
rep("const KIND = {", "const STEP_FRAMES = [\"home\", \"fwd1\", \"fwd2\", \"back1\", \"bk1\", \"bk2\", \"bkret\", \"rt1\", \"rt2\", \"rtret\", \"lt1\", \"lt2\", \"ltret\"];\nconst KIND = {");
rep("function buildSeq(frames) {", "STEP_FRAMES.forEach(k => { KIND[k] = \"step\"; });\nfunction buildSeq(frames) {");

// ---------------- a moving foot lifts a little instead of gliding along the floor ----------------
rep(`    else o[k] = x + (y - x) * f;
  }
  return o;
}`, `    else o[k] = x + (y - x) * f;
  }
  for (const k of ["LF", "RF"]) {
    const x = a[k], y = b[k];
    if (!x || !y || x[1] > .09 || y[1] > .09 || Math.hypot(y[0] - x[0], y[2] - x[2]) < .04) continue;
    const ff = Math.min(1, Math.max(0, curve ? curve(k, base) : base));
    o[k] = o[k].slice(); o[k][1] += Math.sin(Math.PI * ff) * .05;
  }
  return o;
}`);

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
if (h.slice(sStart + 9, sEnd).indexOf("</") >= 0) throw new Error("raw </ in script");
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("step & drag applied");
