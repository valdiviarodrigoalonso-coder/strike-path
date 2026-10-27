// Easier sign-in (sync.js): a clear Create account / Sign in switch, Show password, plain-English errors,
// a "check your email" screen with Resend, Forgot password with a new-password screen, email links that
// come back to this app, and a "Save your progress" card on Profile.
// Run once: node tools/patches/2026-10-28-easier-sign-in.js
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "..", "sync.js");
let s = fs.readFileSync(f, "utf8"); const crlf = s.includes("\r\n"); s = s.replace(/\r\n/g, "\n");
if (s.includes("function friendly(")) { console.log("already applied"); process.exit(0); }
const a = s.indexOf("  // ---------- account button + dialog ----------"), b = s.indexOf("  function escapeHtml(t)");
if (a < 0 || b < 0) throw new Error("markers");
const NEW = String.raw`  // ---------- account button, Profile card and dialog ----------
  // Modes: "up" create account, "in" sign in, "check" confirm your email, "newpw" choose a new password (from a reset link)
  const HAS = "strikepath.hasAccount";
  let mode = null, email = "";
  const redirect = () => location.origin + location.pathname;
  const hadAccount = () => { try { return localStorage.getItem(HAS) === "1"; } catch (e) { return false; } };
  function friendly(err) {
    const m = (err && (err.message || err.error_description || err.msg)) || String(err || "Something went wrong");
    if (/already (been )?registered|already exists/i.test(m)) return {t:"You already have an account with this email. Sign in instead.", go:"in"};
    if (/invalid login credentials/i.test(m)) return {t:"That email and password don't match. Check for typos, or create an account if you're new.", go:"up"};
    if (/email not confirmed/i.test(m)) return {t:"Your email isn't confirmed yet. Open the link we emailed you, then sign in here.", resend:true};
    if (/rate limit|too many|security purposes/i.test(m)) return {t:"Too many tries in a short time (the free email service has an hourly limit). Wait a few minutes and try again."};
    if (/password/i.test(m) && /least|characters|short|weak/i.test(m)) return {t:"Use a password with at least 6 characters."};
    if (/invalid|validate/i.test(m) && /email/i.test(m)) return {t:"That email address doesn't look right."};
    if (/failed to fetch|networkerror|load failed|network/i.test(m)) return {t:"Couldn't reach the server. Check your connection and try again."};
    if (/signups? not allowed|signup.*disabled/i.test(m)) return {t:"New accounts are turned off in this app's Supabase settings."};
    return {t:m};
  }
  function addAccountButton() {
    const sync = document.getElementById("sync");
    if (!sync || document.getElementById("acctBtn")) return;
    const b = document.createElement("button");
    b.id = "acctBtn"; b.className = "chip"; b.style.cssText = "padding:3px 10px;font-size:12px;margin-top:2px;align-self:flex-start";
    b.textContent = ready ? "Save my progress" : "Sync not set up";
    b.addEventListener("click", () => openAccount());
    sync.insertAdjacentElement("afterend", b);
    paintCard();
  }
  function paintCard() {
    const c = document.getElementById("acctCard"); if (!c) return;
    if (!ready || user) { c.innerHTML = ""; return; }
    c.innerHTML = '<div class="panel savecard"><b>Save your progress</b><span class="muted" style="font-size:14px">Right now everything lives only on this device. A free account backs it up and keeps your phone and computer in sync. It takes 20 seconds.</span>' +
      '<button class="btn blue full" id="acCardUp">Create a free account</button><button class="linkbtn" id="acCardIn">I already have an account</button></div>';
    c.querySelector("#acCardUp").addEventListener("click", () => openAccount("up"));
    c.querySelector("#acCardIn").addEventListener("click", () => openAccount("in"));
  }
  function paintAccount() {
    window.StrikePath.signedIn = !!user;
    const b = document.getElementById("acctBtn");
    if (b) b.textContent = user ? "Account" : "Save my progress";
    if (user) { try { localStorage.setItem(HAS, "1"); } catch (e) {} }
    paintCard();
    if (dlg && dlg.open) { if (user && mode !== "newpw") mode = null; fillDialog(); }
  }
  function openAccount(m) {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "acctDlg";
      dlg.style.cssText = "border:0;border-radius:16px;background:var(--mat);color:var(--fg);padding:22px;width:min(420px,100% - 24px);max-height:90vh;overflow:auto";
      document.body.appendChild(dlg);
      dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
    }
    mode = m || (user ? null : hadAccount() ? "in" : "up");
    fillDialog();
    try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
  }
  window.StrikePath.openAccount = openAccount;
  const done = t => { try { localStorage.setItem(HAS, "1"); } catch (e) {} dlg.close(); if (SP().toast) SP().toast(t); };
  function fillDialog() {
    const inp = 'style="width:100%;background:var(--mat-2);border:1px solid transparent;border-radius:10px;padding:12px;font-size:16px;color:var(--fg)"';
    const $d = q => dlg.querySelector(q), msg = (t, extra) => { const el = $d("#acMsg"); if (!el) return; el.textContent = t || ""; if (extra) el.appendChild(extra); };
    if (!ready) {
      dlg.innerHTML = '<h3 style="font-size:22px;margin-bottom:8px">Sync not set up</h3><p class="muted">Your progress is saved on this device. To sync between your phone and computer, add your Supabase project details to <b>config.js</b> (see the README).</p><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn sm" id="acClose">Close</button></div>';
    } else if (user && mode !== "newpw") {
      dlg.innerHTML = '<h3 style="font-size:22px;margin-bottom:8px">Your account</h3><p class="muted">Signed in as <b>' + escapeHtml(user.email || "") + '</b>. Every change saves to this device and syncs to your account.</p>' +
        '<div class="row" style="justify-content:space-between;margin-top:14px"><button class="btn ghost sm" id="acSync">Sync now</button><div class="row"><button class="btn ghost sm" id="acOut">Sign out</button><button class="btn blue sm" id="acClose">Done</button></div></div>';
      $d("#acSync").addEventListener("click", () => pull());
      $d("#acOut").addEventListener("click", async () => { await sb.auth.signOut(); dlg.close(); if (SP().toast) SP().toast("Signed out. Your progress stays on this device."); });
    } else if (mode === "check") {
      dlg.innerHTML = '<h3 style="font-size:22px;margin-bottom:8px">Check your email</h3><p>We sent a link to <b>' + escapeHtml(email) + '</b>. Open it to finish creating your account. It can take a minute, so check your spam folder too.</p>' +
        '<p class="muted" style="font-size:14px">On iPhone the link may open in Safari instead of the app. That\'s fine: once it says you\'re confirmed, come back here and sign in.</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px"><button class="btn blue full" id="acToIn">I\'ve confirmed, sign me in</button><button class="btn ghost full" id="acResend">Send the email again</button><span class="muted" id="acMsg" style="font-size:13px;min-height:1.2em"></span><button class="linkbtn" id="acClose">Close</button></div>';
      $d("#acToIn").addEventListener("click", () => { mode = "in"; fillDialog(); });
      $d("#acResend").addEventListener("click", () => resend(msg));
    } else if (mode === "newpw") {
      dlg.innerHTML = '<h3 style="font-size:22px;margin-bottom:8px">Choose a new password</h3><form id="acForm" style="display:flex;flex-direction:column;gap:10px"><label class="label" for="acPass">New password</label><input id="acPass" type="password" autocomplete="new-password" ' + inp + '>' +
        '<span class="muted" style="font-size:13px">At least 6 characters.</span><span class="muted" id="acMsg" style="font-size:13px;min-height:1.2em"></span><button class="btn blue full" type="submit">Save password</button></form>';
      $d("#acForm").addEventListener("submit", async e => {
        e.preventDefault(); const p = $d("#acPass").value; if (p.length < 6) { msg("Use at least 6 characters."); return; }
        msg("Saving…"); const {error} = await sb.auth.updateUser({password:p});
        if (error) msg(friendly(error).t); else { mode = null; done("Password saved. You're signed in."); }
      });
    } else {
      const up = mode !== "in";
      dlg.innerHTML = '<h3 style="font-size:22px;margin-bottom:6px">' + (up ? "Save your progress" : "Welcome back") + '</h3><p class="muted" style="margin:0 0 12px;font-size:14px">' + (up ? "A free account backs up everything and keeps your phone and computer in sync." : "Sign in to sync this device with your account.") + '</p>' +
        '<div class="segs" style="margin-bottom:14px"><button class="seg" type="button" id="acModeUp" aria-pressed="' + up + '">Create account</button><button class="seg" type="button" id="acModeIn" aria-pressed="' + !up + '">Sign in</button></div>' +
        '<form id="acForm" style="display:flex;flex-direction:column;gap:8px" novalidate><label class="label" for="acEmail">Email</label><input id="acEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="none" autocorrect="off" spellcheck="false" value="' + escapeHtml(email) + '" ' + inp + '>' +
        '<label class="label" for="acPass" style="margin-top:4px">Password</label><div style="position:relative"><input id="acPass" type="password" autocomplete="' + (up ? "new-password" : "current-password") + '" ' + inp.replace("padding:12px", "padding:12px 64px 12px 12px") + '><button type="button" class="linkbtn" id="acShow" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:14px">Show</button></div>' +
        (up ? '<span class="muted" style="font-size:13px">At least 6 characters.</span>' : '') +
        '<span id="acMsg" role="status" style="font-size:14px;min-height:1.2em;color:var(--fg)"></span>' +
        '<button class="btn blue full" type="submit" id="acGo">' + (up ? "Create account" : "Sign in") + '</button>' +
        (up ? '' : '<button class="linkbtn" type="button" id="acForgot" style="align-self:center;font-size:14px">Forgot password?</button>') + '</form>' +
        '<div style="display:flex;justify-content:center;margin-top:6px"><button class="linkbtn" id="acClose" style="color:var(--muted);font-size:14px">Not now</button></div>';
      const creds = () => ({email:$d("#acEmail").value.trim(), password:$d("#acPass").value});
      const swap = m => { email = $d("#acEmail").value.trim(); mode = m; fillDialog(); };
      $d("#acModeUp").addEventListener("click", () => swap("up"));
      $d("#acModeIn").addEventListener("click", () => swap("in"));
      $d("#acShow").addEventListener("click", () => { const p = $d("#acPass"), show = p.type === "password"; p.type = show ? "text" : "password"; $d("#acShow").textContent = show ? "Hide" : "Show"; });
      const linkBtn = (t, fn) => { const x = document.createElement("button"); x.type = "button"; x.className = "linkbtn"; x.style.cssText = "display:block;padding:6px 0 0;font-size:14px"; x.textContent = t; x.addEventListener("click", fn); return x; };
      const fail = f2 => {
        let extra = null;
        if (f2.go && f2.go !== mode) extra = linkBtn(f2.go === "in" ? "Sign in instead" : "Create an account instead", () => swap(f2.go));
        if (f2.resend) extra = linkBtn("Send the confirmation email again", () => { email = creds().email; resend(msg); });
        msg(f2.t, extra);
      };
      if (!up) $d("#acForgot").addEventListener("click", async () => {
        const c = creds(); if (!/.+@.+\..+/.test(c.email)) { msg("Type your email above first, then tap Forgot password."); return; }
        msg("Sending a reset link…");
        const {error} = await sb.auth.resetPasswordForEmail(c.email, {redirectTo:redirect()});
        if (error) fail(friendly(error)); else msg("Check " + c.email + " for a link to choose a new password.");
      });
      $d("#acForm").addEventListener("submit", async e => {
        e.preventDefault();
        const c = creds(), go = $d("#acGo");
        if (!/.+@.+\..+/.test(c.email)) { msg("Enter your email address."); return; }
        if (c.password.length < 6) { msg(up ? "Pick a password with at least 6 characters." : "Enter your password."); return; }
        go.disabled = true; msg(up ? "Creating your account…" : "Signing in…");
        try {
          if (up) {
            const {data, error} = await sb.auth.signUp({email:c.email, password:c.password, options:{emailRedirectTo:redirect()}});
            if (error) fail(friendly(error));
            // Supabase answers a sign-up for an existing email with a user that has no identities (so it doesn't reveal who has accounts)
            else if (data.user && Array.isArray(data.user.identities) && !data.user.identities.length) fail({t:"You already have an account with this email. Sign in instead.", go:"in"});
            else if (!data.session) { email = c.email; try { localStorage.setItem(HAS, "1"); } catch (e2) {} mode = "check"; fillDialog(); }
            else done("Account created. Your progress now syncs.");
          } else {
            const {error} = await sb.auth.signInWithPassword(c);
            if (error) fail(friendly(error)); else done("Signed in. Syncing your progress.");
          }
        } catch (err) { fail(friendly(err)); }
        const g = $d("#acGo"); if (g) g.disabled = false;
      });
      setTimeout(() => { const el = $d(email ? "#acPass" : "#acEmail"); if (el && matchMedia("(pointer:fine)").matches) el.focus(); }, 50);
    }
    const close = $d("#acClose"); if (close) close.addEventListener("click", () => dlg.close());
  }
  async function resend(msg) {
    if (!email) { msg("Type your email first."); return; }
    msg("Sending…");
    const {error} = await sb.auth.resend({type:"signup", email, options:{emailRedirectTo:redirect()}});
    msg(error ? friendly(error).t : "Sent. Check your inbox and spam folder.");
  }
`;
s = s.slice(0, a) + NEW + s.slice(b);
const R = (x, y) => { if (!s.includes(x)) throw new Error("miss " + x.slice(0, 60)); s = s.replace(x, y); };
// links from emails: a password reset opens the new-password screen; a bad or expired link says so; a confirmed email says welcome
R("  async function start() {\n    sb = window.supabase.createClient(",
  "  async function start() {\n    const hash = location.hash, fromLink = /access_token=/.test(hash), linkErr = /error_description=([^&]+)/.exec(hash);\n    sb = window.supabase.createClient(");
R("    sb.auth.onAuthStateChange((_ev, session) => {\n      const was = user && user.id; user = session ? session.user : null;",
  "    sb.auth.onAuthStateChange((ev, session) => {\n      const was = user && user.id; user = session ? session.user : null;\n      if (ev === \"PASSWORD_RECOVERY\") setTimeout(() => openAccount(\"newpw\"), 0);");
R("    const {data} = await sb.auth.getSession();\n    user = data.session ? data.session.user : null;\n    paintAccount();",
  "    const {data} = await sb.auth.getSession();\n    user = data.session ? data.session.user : null;\n    paintAccount();\n" +
  "    if (fromLink || linkErr) { try { history.replaceState(null, \"\", location.pathname + location.search); } catch (e) {} }\n" +
  "    if (linkErr) { openAccount(\"in\"); const el = dlg.querySelector(\"#acMsg\"); if (el) el.textContent = \"That email link didn't work (\" + decodeURIComponent(linkErr[1].replace(/\\+/g, \" \")) + \"). Sign in, or create the account again to get a new link.\"; }\n" +
  "    else if (fromLink && user && mode !== \"newpw\" && SP().toast) SP().toast(\"Email confirmed. You're signed in and syncing.\");");
fs.writeFileSync(f, crlf ? s.replace(/\n/g, "\r\n") : s);
console.log("easier sign-in applied");
