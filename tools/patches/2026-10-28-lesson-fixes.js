// Lesson fixes from the first phone test:
// - the 3D gym floor, grid and heavy bag are brighter so they read against the dark theme
// - the Hips / Shoulders / gloves legend only shows with Rotation guides on (it explains the guide colours)
// - the lesson screen and every sheet stay below the iPhone's camera cutout, with a bigger close button
// Run once: node tools/patches/2026-10-28-lesson-fixes.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("lesson-fixes: safe area")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 90)); h = h.replace(a, b); };

// brighter floor, grid and bag
rep("mFloor:new THREE.MeshStandardMaterial({color:0x111a1c, roughness:.95})", "mFloor:new THREE.MeshStandardMaterial({color:0x2b4448, roughness:.9})");
rep("new THREE.GridHelper(3.2, 16, 0x24363a, 0x18252a)", "new THREE.GridHelper(3.2, 16, 0x5d8388, 0x3a575b)");
rep("mBag:new THREE.MeshStandardMaterial({color:0x9a3a2c, roughness:.7, transparent:true, opacity:.32, depthWrite:false})",
    "mBag:new THREE.MeshStandardMaterial({color:0xb84a33, roughness:.6, transparent:true, opacity:.68, depthWrite:false})");

// legend follows the Rotation guides switch
rep("    guides(on) { fig.guides(on); if (hud) hud.hidden = !on; },",
    "    guides(on) { fig.guides(on); if (hud) hud.hidden = !on; const lg = host.querySelector(\".legend\"); if (lg) lg.hidden = !on; },");

// safe areas: lesson screen and sheets sit below the camera cutout and above the home bar
rep("</style>", String.raw`/* lesson-fixes: safe area for the camera cutout and home bar */
dialog.lesson{margin:calc(env(safe-area-inset-top,0px) + 8px) auto calc(env(safe-area-inset-bottom,0px) + 8px);height:calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 16px);max-height:none}
.closebtn{width:44px;height:44px;top:10px;right:10px;background:rgba(10,14,15,.85);border-color:rgba(233,230,223,.25);z-index:5}
.closebtn svg{width:18px;height:18px}
.lesson-left{padding-top:22px}
.lesson-left > div:first-child{padding-right:52px}
.sheet,#acctDlg{max-height:calc(100dvh - 2 * env(safe-area-inset-top,0px) - 24px)!important}
</style>`);

const sStart = h.indexOf("<script>\n"), sEnd = h.lastIndexOf("</script>");
if (h.slice(sStart + 9, sEnd).indexOf("</") >= 0) throw new Error("raw </ in script");
fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("lesson fixes applied");
