// Follow-up to the Hevy layout: round chart gridlines (0 / 2 / 4 / 6 hrs) and a shorter header on phones.
// Run once: node tools/patches/2026-10-27-hevy-polish.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let h = fs.readFileSync(f, "utf8");
const crlf = h.includes("\r\n"); h = h.replace(/\r\n/g, "\n");
if (h.includes("step = niceMax(")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("couldn't find: " + a.slice(0, 80)); h = h.replace(a, b); };

rep('top = niceMax(Math.max(key === "dur" ? 3 : 30, ...vals)), now',
    'step = niceMax(Math.max(key === "dur" ? 3 : 30, ...vals) / 3), top = step * 3, now');
rep("@media (max-width:420px){.sth,.str{", "@media (max-width:860px){.hud{flex-wrap:nowrap;align-items:flex-start}.rank{flex:1;min-width:0}.top .wrap{padding-block:8px;gap:8px}}\n@media (max-width:420px){.sth,.str{");

fs.writeFileSync(f, crlf ? h.replace(/\n/g, "\r\n") : h);
console.log("hevy polish applied");
