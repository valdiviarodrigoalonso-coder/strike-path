// Builds the installable app from the page source:
//   node tools/build.js
// Reads src/strike-path.html, writes index.html (PWA head tags, local libraries, sync, service worker) and sw.js.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = path.join(__dirname, "..");
let html = fs.readFileSync(path.join(root, "src", "strike-path.html"), "utf8");

const swap = (from, to, what) => { if (!html.includes(from)) throw new Error("build: couldn't find " + what); html = html.replace(from, to); };

swap('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#11131b">\n' +
  '<link rel="icon" href="icons/icon-192.png">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n' +
  '<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n' +
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="Strike Path">',
  "viewport meta");
swap('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
  '<script src="vendor/three.min.js"></script>\n<script src="vendor/supabase.js"></script>\n<script src="config.js"></script>\n<script src="sync.js"></script>',
  "three.js script tag");
swap("</body>",
  '<script>\nif ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));\n</script>\n</body>',
  "</body>");

fs.writeFileSync(path.join(root, "index.html"), html);
const version = crypto.createHash("sha1").update(html + fs.readFileSync(path.join(root, "sync.js"))).digest("hex").slice(0, 10);
fs.writeFileSync(path.join(root, "sw.js"), fs.readFileSync(path.join(__dirname, "sw.template.js"), "utf8").replace("__VERSION__", version));
console.log("built index.html and sw.js (cache " + version + ")");
