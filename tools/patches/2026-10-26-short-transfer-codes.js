// One-off patch (kept for reference): short 6-character transfer codes, a one-tap "Open in the app" link
// from the Claude-hosted page, and import of that link in the app. The long code stays as a fallback.
//   node tools/patches/2026-10-26-short-transfer-codes.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "src", "strike-path.html");
let s = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const region = (startMark, endMark, body) => { const i = s.indexOf(startMark), j = s.indexOf(endMark, i); if (i < 0 || j < 0) { console.error("REGION MISS " + startMark); process.exit(1); } s = s.slice(0, i) + body + s.slice(j); };
const swap = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) { console.error("MISS x" + n + ": " + a.slice(0, 100)); process.exit(1); } s = s.split(a).join(b); };

swap(`.miniform{display:flex;`, `.bigcode{font-family:var(--display);font-weight:900;font-size:40px;letter-spacing:.12em;color:var(--gold);line-height:1;font-variant-numeric:tabular-nums}
#codeIn{width:9.5ch;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:9px 12px;font-family:var(--display);font-weight:800;font-size:24px;letter-spacing:.12em;text-transform:uppercase;color:var(--fg)}
#bkAdv summary{cursor:pointer;font-size:13px;font-weight:700;color:var(--muted)}
.miniform{display:flex;`);

// ---------------- HTML ----------------
region(`    <div class="panel" style="margin-top:20px;display:flex;flex-direction:column;gap:10px">
      <span class="label">Backup and move your progress</span>`, `  </section>`,
`    <div class="panel" id="xferPanel" style="margin-top:20px;display:flex;flex-direction:column;gap:12px">
      <span class="label">Move your progress to another device</span>
      <div id="xferApp" hidden style="display:flex;flex-direction:column;gap:12px">
        <span class="muted" style="font-size:14px">Easiest: sign in to sync on both devices. Or use a one-time code. It's 6 characters, works once, and expires after an hour.</span>
        <div class="row"><button class="btn sm" id="codeMake">Get a code</button><span class="bigcode" id="codeOut" aria-live="polite"></span></div>
        <span class="muted" id="codeNote" style="font-size:13px"></span>
        <div class="row"><label class="label" for="codeIn" style="width:100%">Got a code from your other device?</label><input id="codeIn" maxlength="9" placeholder="K7Q-4MZ" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn gold sm" id="codeUse">Bring it in</button></div>
        <span class="muted" id="codeMsg" style="font-size:13px"></span>
      </div>
      <div id="xferWeb" hidden style="display:flex;flex-direction:column;gap:10px">
        <span class="muted" style="font-size:14px">This page can't create short codes, but it can hand everything to the Strike Path app in one tap. Open the app from here, then sign in there to sync, or get a short code for your phone.</span>
        <div class="row"><a class="btn sm" id="appLink" target="_blank" rel="noopener" href="https://valdiviarodrigoalonso-coder.github.io/strike-path/">Open in the Strike Path app</a></div>
      </div>
      <details id="bkAdv"><summary>Long backup code (copy and paste)</summary>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
          <div class="row"><button class="btn ghost sm" id="bkCopy">Copy backup code</button><button class="btn ghost sm" id="bkShow">Paste a backup code</button></div>
          <div id="bkPaste" hidden style="display:flex;flex-direction:column;gap:8px">
            <label class="label" for="bkText">Paste the code, then restore</label>
            <textarea id="bkText" placeholder="Paste your backup code here"></textarea>
            <div class="row"><button class="btn gold sm" id="bkRestore">Restore from code</button><span class="muted" id="bkMsg" style="font-size:13px"></span></div>
          </div>
        </div>
      </details>
    </div>
`);

// ---------------- JS ----------------
region(`// ---- backup code: the whole state as text, for moving between copies of the app ----`, `// Hook for an outside sync module`,
`// ---- moving progress between copies of the app ----
const APP_URL = "https://valdiviarodrigoalonso-coder.github.io/strike-path/";
const isApp = !!window.SP_CONFIG;   // the installable app ships config.js; the Claude-hosted page doesn't
function restoreFrom(d) {
  const r = normalize(d);
  if (!Object.keys(r.checks).length && !r.lifts.logs.length && !r.runs.length && !r.sessions.length && !r.rounds) throw new Error("empty");
  S = r; persist(); liftDay = nextLiftDay(); renderAll();
  toast("Progress brought in", "big");
}
const b64url = u8 => { let t = ""; for (let i = 0; i < u8.length; i += 0x8000) t += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(t).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, ""); };
const unb64url = t => { const x = atob(t.replace(/-/g, "+").replace(/_/g, "/")); const u = new Uint8Array(x.length); for (let i = 0; i < x.length; i++) u[i] = x.charCodeAt(i); return u; };
async function packState() {
  const json = JSON.stringify(S);
  if (window.CompressionStream) { const z = new Blob([json]).stream().pipeThrough(new CompressionStream("deflate-raw")); return "z1." + b64url(new Uint8Array(await new Response(z).arrayBuffer())); }
  return "j1." + b64url(new TextEncoder().encode(json));
}
async function unpackState(p) {
  const bytes = unb64url(p.slice(3));
  if (p.startsWith("z1.")) { const z = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw")); return JSON.parse(await new Response(z).text()); }
  return JSON.parse(new TextDecoder().decode(bytes));
}
// the panel shows short codes in the app and the one-tap hand-off on the Claude-hosted page
$("xferApp").hidden = !isApp; $("xferWeb").hidden = isApp;
let linkTimer = 0;
function refreshAppLink() { if (isApp) return; clearTimeout(linkTimer); linkTimer = setTimeout(() => packState().then(p => { $("appLink").href = APP_URL + "#import=" + p; }).catch(() => {}), 300); }
refreshAppLink();
const fmtCode = c => c.slice(0, 3) + "-" + c.slice(3);
$("codeMake").addEventListener("click", async () => {
  const T2 = window.StrikePath && window.StrikePath.transfer;
  if (!T2) { $("codeNote").textContent = "Short codes need sync set up and an internet connection."; return; }
  $("codeMake").disabled = true; $("codeOut").textContent = ""; $("codeNote").textContent = "Making a code…";
  try {
    const code = await T2.create(JSON.parse(JSON.stringify(S)));
    $("codeOut").textContent = fmtCode(code);
    $("codeNote").textContent = "Type this on your other device within an hour. It works once.";
  } catch (e) {
    const m = (e && (e.message || "")) + " " + (e && e.code || "");
    $("codeNote").textContent = /PGRST202|create_transfer|function/i.test(m) ? "Short codes need one more setup step: run supabase/transfer.sql in your Supabase project." : "Couldn't make a code. Check your connection and try again.";
  }
  $("codeMake").disabled = false;
});
$("codeIn").addEventListener("input", () => { const v = $("codeIn").value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6); $("codeIn").value = v.length > 3 ? fmtCode(v) : v; });
$("codeUse").addEventListener("click", async () => {
  const T2 = window.StrikePath && window.StrikePath.transfer, code = $("codeIn").value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 6) { $("codeMsg").textContent = "Codes are 6 characters, like K7Q-4MZ."; return; }
  if (!T2) { $("codeMsg").textContent = "Short codes need sync set up and an internet connection."; return; }
  $("codeMsg").textContent = "Fetching…";
  try {
    const d = await T2.claim(code);
    if (!d) { $("codeMsg").textContent = "That code didn't work. It may have expired or already been used; get a new one."; return; }
    restoreFrom(d); $("codeMsg").textContent = "Done. Your progress is on this device" + (window.StrikePath.signedIn ? " and syncing." : "."); $("codeIn").value = "";
  } catch (e) { $("codeMsg").textContent = "Couldn't fetch that code. Check your connection and try again."; }
});
// arriving from the Claude-hosted page's "Open in the app" link
if (isApp && location.hash.startsWith("#import=")) {
  const payload = location.hash.slice(8);
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  unpackState(payload).then(d => {
    const r = normalize(d), dlg = document.createElement("dialog");
    dlg.style.cssText = "border:1px solid var(--line);border-radius:16px;background:var(--bg);color:var(--fg);padding:22px;width:min(420px,100% - 32px)";
    dlg.innerHTML = '<h3 style="font-size:28px;margin-bottom:8px">Bring in your progress?</h3><p class="muted">From your other copy of Strike Path: ' + Object.keys(r.checks).filter(k => r.checks[k].some(Boolean)).length + ' moves learned, ' + r.lifts.logs.length + ' workouts, ' + r.runs.length + ' runs, ' + r.sessions.length + ' kickboxing sessions. This replaces what\\'s on this device' + (window.StrikePath.signedIn ? ' and in your account' : '') + '.</p><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn ghost sm" id="impNo">Not now</button><button class="btn gold sm" id="impYes">Bring it in</button></div>';
    document.body.appendChild(dlg);
    dlg.querySelector("#impNo").addEventListener("click", () => dlg.close());
    dlg.querySelector("#impYes").addEventListener("click", () => { dlg.close(); try { restoreFrom(d); } catch (e) { toast("That transfer was empty"); } });
    try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
  }).catch(() => toast("That transfer link didn't work. Try the button again."));
}
// long backup code: still here for copy and paste on the same device
$("bkCopy").addEventListener("click", () => {
  const code = "SP1:" + btoa(unescape(encodeURIComponent(JSON.stringify(S))));
  const fallback = () => { $("bkPaste").hidden = false; $("bkText").value = code; $("bkText").select(); $("bkMsg").textContent = "Copy the selected text."; };
  try { navigator.clipboard.writeText(code).then(() => toast("Backup code copied"), fallback); } catch (e) { fallback(); }
});
$("bkShow").addEventListener("click", () => { $("bkPaste").hidden = !$("bkPaste").hidden; });
$("bkRestore").addEventListener("click", () => {
  const raw = ($("bkText").value || "").trim();
  try { restoreFrom(JSON.parse(raw.startsWith("SP1:") ? decodeURIComponent(escape(atob(raw.slice(4)))) : raw)); $("bkMsg").textContent = "Restored."; }
  catch (e) { $("bkMsg").textContent = "That code didn't work. Copy it again and paste the whole thing."; }
});
`);
// keep the hand-off link fresh whenever progress changes
swap(`  if (window.StrikePath && window.StrikePath.onSave) window.StrikePath.onSave(S);`,
     `  if (window.StrikePath && window.StrikePath.onSave) window.StrikePath.onSave(S);
  try { refreshAppLink(); } catch (e) {}`);
const start = s.indexOf('<script>\n(() => {') + 8, end = s.lastIndexOf('</script>');
s = s.slice(0, start) + s.slice(start, end).split('</').join('<\\/') + s.slice(end);
fs.writeFileSync(f, s); console.log("patched");
