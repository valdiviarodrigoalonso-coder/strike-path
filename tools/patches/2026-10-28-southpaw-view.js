// Mirror (southpaw) shows the exact mirror image of the orthodox view, so you still see him from the front 3/4,
// not from behind. The whole scene is mirrored (fighter, bag, lights, so the shading matches), the camera swings to
// the mirrored angle, and dragging still turns the view the way your finger moves.
// Run once: node tools/patches/2026-10-28-southpaw-view.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("let mirrored = false;")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 90)); h = h.replace(a, b); };
rep("  const cam = {az:v0[0], el:v0[1], dist:opts.dist || 3.3, taz:v0[0], tel:v0[1]};",
    "  const cam = {az:v0[0], el:v0[1], dist:opts.dist || 3.3, taz:v0[0], tel:v0[1]};\n  // southpaw: the scene is mirrored across the fighter's centre line and the camera goes to the mirrored angle\n  let mirrored = false;");
rep("    cam.taz = drag.az - (e.clientX - drag.x) * .45;", "    cam.taz = drag.az - (e.clientX - drag.x) * .45 * (mirrored ? -1 : 1);");
rep("    placeCam(camera, cam.az, cam.el, cam.dist);", "    placeCam(camera, mirrored ? 180 - cam.az : cam.az, cam.el, cam.dist);");
rep("    mirror(on) { root.scale.z = on ? -1 : 1; },", "    mirror(on) { mirrored = !!on; scene.scale.z = on ? -1 : 1; },");
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("southpaw view applied");
