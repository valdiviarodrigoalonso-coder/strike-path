// Strike Path account sync (Supabase).
// The app always saves to this device first; when you're signed in and online, it also saves to your private row
// in Supabase. Offline changes wait and go up as soon as the connection is back. The newer copy always wins.
(() => {
  "use strict";
  const cfg = window.SP_CONFIG || {};
  const ready = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const PENDING = "strikepath.pending";
  let sb = null, user = null, timer = 0, busy = false, again = false, dlg = null;

  const SP = () => window.StrikePath || {};
  const status = t => { if (SP().setStatus) SP().setStatus(t); };
  const clock = () => new Date().toLocaleTimeString([], {hour:"numeric", minute:"2-digit"});

  window.StrikePath = Object.assign(window.StrikePath || {}, {
    onSave() { if (!user) return; try { localStorage.setItem(PENDING, "1"); } catch (e) {} clearTimeout(timer); timer = setTimeout(push, 1200); },
    ready() { addAccountButton(); if (!ready) { status("Saved on this device"); return; } start(); }
  });

  async function start() {
    const hash = location.hash, fromLink = /access_token=/.test(hash), linkErr = /error_description=([^&]+)/.exec(hash);
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {auth:{persistSession:true, autoRefreshToken:true}});
    // short transfer codes (supabase/transfer.sql): no account needed, one use, gone after an hour
    window.StrikePath.transfer = {
      async create(state) { const {data, error} = await sb.rpc("create_transfer", {payload:state}); if (error) throw error; return data; },
      async claim(code) { const {data, error} = await sb.rpc("claim_transfer", {code_in:code}); if (error) throw error; return data; }
    };
    sb.auth.onAuthStateChange((ev, session) => {
      const was = user && user.id; user = session ? session.user : null;
      if (ev === "PASSWORD_RECOVERY") setTimeout(() => openAccount("newpw"), 0);
      paintAccount();
      if (user && user.id !== was) pull();
      if (!user) status("Saved on this device · sign in to sync");
    });
    const {data} = await sb.auth.getSession();
    user = data.session ? data.session.user : null;
    paintAccount();
    if (fromLink || linkErr) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
    if (linkErr) { openAccount("in"); const el = dlg.querySelector("#acMsg"); if (el) el.textContent = "That email link didn't work (" + decodeURIComponent(linkErr[1].replace(/\+/g, " ")) + "). Sign in, or create the account again to get a new link."; }
    else if (fromLink && user && mode !== "newpw" && SP().toast) SP().toast("Email confirmed. You're signed in and syncing.");
    if (user) pull(); else status("Saved on this device · sign in to sync");
    window.addEventListener("online", () => { if (user) pull(); });
    window.addEventListener("offline", () => { if (user) status("Offline · saving on this device"); });
  }

  // Bring down the account copy; keep whichever copy is newer and upload ours if it wins.
  async function pull() {
    if (!user) return;
    if (!navigator.onLine) { status("Offline · saving on this device"); return; }
    status("Syncing…");
    const {data, error} = await sb.from("progress").select("data").eq("user_id", user.id).maybeSingle();
    if (error) { status("Couldn't reach your account · saved on this device"); return; }
    const remote = data && data.data;
    if (remote) SP().loadRemote(remote);
    const local = SP().getState(), remoteAt = remote ? +remote.updatedAt || 0 : 0;
    let pending = false; try { pending = localStorage.getItem(PENDING) === "1"; } catch (e) {}
    if (!remote || local.updatedAt > remoteAt || pending) await push();
    else status("Synced · " + clock());
  }

  async function push() {
    if (!user) return;
    if (busy) { again = true; return; }
    if (!navigator.onLine) { status("Offline · will sync when you're back online"); return; }
    busy = true;
    const state = JSON.parse(JSON.stringify(SP().getState()));
    const {error} = await sb.from("progress").upsert({user_id:user.id, data:state, updated_at:new Date().toISOString()});
    busy = false;
    if (error) status("Sync failed · saved on this device");
    else { try { localStorage.removeItem(PENDING); } catch (e) {} status("Synced · " + clock()); }
    if (again) { again = false; push(); }
  }

  // ---------- account button, Profile card and dialog ----------
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
  function escapeHtml(t) { return String(t).replace(/&/g, "&amp;").replace(/[<]/g, "&lt;").replace(/"/g, "&quot;"); }
})();
