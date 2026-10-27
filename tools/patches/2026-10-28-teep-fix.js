// Teep fix: the coach was landing the teep with pointed toes (a foot in the air always continued straight along the
// shin), which is how fighters jam or break toes. Feet in the air now have an ankle flex: 0 keeps the toes pointed
// (roundhouse kicks land with the shin), 1 pulls the toes back toward the knee. The teep chambers with the toes back
// and lands with the ball of the foot, drives the hips forward instead of back, stays more upright, and hits belly height.
// The spinning back kick gets the same treatment so it leads with the heel instead of the toes. Lesson text updated.
// Sources: warriorcollective.co.uk/blogs/wcarticles/muay-thai-teep, fairtex.com (teep mastery), dieselgym.co.uk (mastering your teep).
// Run once: node tools/patches/2026-10-28-teep-fix.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("LFflex")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 90)); h = h.replace(a, b); };

// ---------------- ankle flex for feet in the air ----------------
rep("    RFp:s.RFp || A3.add(yawDir(s.RFyaw), [0, .15, 0])\n  };",
    "    RFp:s.RFp || A3.add(yawDir(s.RFyaw), [0, .15, 0]),\n    // ankle flex for a foot in the air: 0 toes pointed along the shin, 1 toes pulled back toward the knee\n    LFflex:s.LFflex || 0, RFflex:s.RFflex || 0\n  };");
rep(`  const toe = (leg, yaw) => {
    if (leg.end.y < .14) { const d = yawDir(yaw), h = Math.sqrt(Math.max(.0025, .029 - Math.pow(leg.end.y - .03, 2))); return new THREE.Vector3(leg.end.x + d[0] * h, .03, leg.end.z + d[2] * h); }
    return leg.end.clone().addScaledVector(leg.end.clone().sub(leg.mid).normalize(), .16);
  };
  return {hip, sc, head, c, r, u, rh, shL, shR, hpL, hpR, aL, aR, lL, lR, toeL:toe(lL, res.LFyaw), toeR:toe(lR, res.RFyaw)};`,
`  const toe = (leg, yaw, flex, pole) => {
    if (leg.end.y < .14) { const d = yawDir(yaw), h = Math.sqrt(Math.max(.0025, .029 - Math.pow(leg.end.y - .03, 2))); return new THREE.Vector3(leg.end.x + d[0] * h, .03, leg.end.z + d[2] * h); }
    const shin = leg.end.clone().sub(leg.mid).normalize();
    if (!flex) return leg.end.clone().addScaledVector(shin, .16);
    // pulling the toes back turns the foot toward the front of the shin (the side the kneecap faces)
    const front = pole.clone().addScaledVector(shin, -pole.dot(shin)); if (front.lengthSq() < 1e-6) front.set(0, 1, 0); front.normalize();
    const a = Math.min(1, flex) * 95 * D2R;
    return leg.end.clone().addScaledVector(shin, .16 * Math.cos(a)).addScaledVector(front, .16 * Math.sin(a));
  };
  return {hip, sc, head, c, r, u, rh, shL, shR, hpL, hpR, aL, aR, lL, lR, toeL:toe(lL, res.LFyaw, res.LFflex, V3(res.LFp)), toeR:toe(lR, res.RFyaw, res.RFflex, V3(res.RFp))};`);

// ---------------- teep: chamber with toes back, hips drive forward, mostly upright, ball of the foot at belly height ----------------
rep("  chamberL:{hip:[-.03,.85,.03], lean:[-.08,0], LF:[.25,.48,-.12], LFp:[1,.3,0]},",
    "  chamberL:{hip:[-.02,.85,.03], lean:[-.06,0], LF:[.27,.5,-.12], LFp:[1,.4,0], LFflex:.85},");
rep("  teep:{hip:[-.06,.86,.04], lean:[-.2,0], LF:[.9,.72,-.08], LFp:[0,1,0]},",
    "  teep:{hip:[.07,.86,.03], lean:[-.12,0], LF:[.92,.84,-.08], LFp:[0,1,0], LFflex:1},");
// spinning back kick: lead with the heel, toes down
rep("  backKick:{hip:[-.02,.84,.02], yawH:200, yawS:195, lean:[-.35,0], LF:[.12,0,.22], LFyaw:200, RF:[.98,.95,.08], RFp:[0,-1,0]},",
    "  backKick:{hip:[-.02,.84,.02], yawH:200, yawS:195, lean:[-.35,0], LF:[.12,0,.22], LFyaw:200, RF:[.98,.95,.08], RFp:[0,-1,0], RFflex:1},");

// ---------------- lesson text ----------------
rep(`   steps:["Raise your lead knee toward your chest, hands up.",
          "Push the ball of the foot (or the heel) straight into the target's belly or hips.",
          "Lean slightly back and drive your hips forward for power.",
          "Pull the leg back and set it down in stance."],
   warn:["Flicking the leg instead of pushing through.","Kicking without lifting the knee first.","Dropping your hands as the leg goes out."],`,
`   steps:["Raise your lead knee toward your chest, hands up.",
          "Pull your toes back so the ball of your foot faces the target.",
          "Drive the ball of the foot straight through the belly, pushing your hips forward into it. Stay mostly upright with only a slight lean back.",
          "Pull the knee back to the chamber, then set the foot down in stance."],
   warn:["Pointing your toes: you'll jam or break them, and the kick glances off.","Flicking the leg instead of pushing through.","Leaning far back: you lose balance and power.","Kicking without lifting the knee first, or dropping your hands as the leg goes out."],`);

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
if (h.slice(sStart + 9, sEnd).indexOf("</") >= 0) throw new Error("raw </ in script");
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("teep fix applied");
