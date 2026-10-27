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
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {auth:{persistSession:true, autoRefreshToken:true}});
    // short transfer codes (supabase/transfer.sql): no account needed, one use, gone after an hour
    window.StrikePath.transfer = {
      async create(state) { const {data, error} = await sb.rpc("create_transfer", {payload:state}); if (error) throw error; return data; },
      async claim(code) { const {data, error} = await sb.rpc("claim_transfer", {code_in:code}); if (error) throw error; return data; }
    };
    sb.auth.onAuthStateChange((_ev, session) => {
      const was = user && user.id; user = session ? session.user : null;
      paintAccount();
      if (user && user.id !== was) pull();
      if (!user) status("Saved on this device · sign in to sync");
    });
    const {data} = await sb.auth.getSession();
    user = data.session ? data.session.user : null;
    paintAccount();
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

  // ---------- account button + dialog ----------
  function addAccountButton() {
    const sync = document.getElementById("sync");
    if (!sync || document.getElementById("acctBtn")) return;
    const b = document.createElement("button");
    b.id = "acctBtn"; b.className = "chip"; b.style.cssText = "padding:3px 10px;font-size:12px;margin-top:2px;align-self:flex-start";
    b.textContent = ready ? "Sign in to sync" : "Sync not set up";
    b.addEventListener("click", openAccount);
    sync.insertAdjacentElement("afterend", b);
  }
  function paintAccount() {
    window.StrikePath.signedIn = !!user;
    const b = document.getElementById("acctBtn");
    if (b) b.textContent = user ? "Account" : "Sign in to sync";
    if (dlg && dlg.open) fillDialog();
  }
  function openAccount() {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "acctDlg";
      dlg.style.cssText = "border:1px solid var(--line);border-radius:16px;background:var(--bg);color:var(--fg);padding:22px;width:min(420px,100% - 32px)";
      document.body.appendChild(dlg);
      dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
    }
    fillDialog();
    try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
  }
  function fillDialog() {
    const inp = 'style="width:100%;background:var(--mat);border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:16px;color:var(--fg)"';
    if (!ready) {
      dlg.innerHTML = '<h3 style="font-size:28px;margin-bottom:8px">Sync not set up</h3><p class="muted">Your progress is saved on this device. To sync between your phone and computer, add your Supabase project details to <b>config.js</b> (see the README).</p><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn ghost sm" id="acClose">Close</button></div>';
    } else if (user) {
      dlg.innerHTML = '<h3 style="font-size:28px;margin-bottom:8px">Your account</h3><p class="muted">Signed in as <b>' + escapeHtml(user.email || "") + '</b>. Every change saves to this device and syncs to your account.</p>' +
        '<div class="row" style="justify-content:space-between;margin-top:14px"><button class="btn ghost sm" id="acSync">Sync now</button><div class="row"><button class="btn ghost sm" id="acOut">Sign out</button><button class="btn sm" id="acClose">Done</button></div></div>';
      dlg.querySelector("#acSync").addEventListener("click", () => pull());
      dlg.querySelector("#acOut").addEventListener("click", async () => { await sb.auth.signOut(); dlg.close(); if (SP().toast) SP().toast("Signed out. Your progress stays on this device."); });
    } else {
      dlg.innerHTML = '<h3 style="font-size:28px;margin-bottom:6px">Sign in to sync</h3><p class="muted" style="margin:0 0 12px">Use the same account on your phone and computer to keep everything in one place.</p>' +
        '<form id="acForm" style="display:flex;flex-direction:column;gap:10px"><label class="label" for="acEmail">Email</label><input id="acEmail" type="email" autocomplete="email" required ' + inp + '>' +
        '<label class="label" for="acPass">Password</label><input id="acPass" type="password" autocomplete="current-password" minlength="6" required ' + inp + '>' +
        '<span class="muted" id="acMsg" style="font-size:13px;min-height:1.2em"></span>' +
        '<div class="row" style="justify-content:space-between"><button class="btn ghost sm" type="button" id="acNew">Create account</button><div class="row"><button class="btn ghost sm" type="button" id="acClose">Cancel</button><button class="btn sm" type="submit">Sign in</button></div></div></form>';
      const msg = t => { dlg.querySelector("#acMsg").textContent = t; };
      const creds = () => ({email:dlg.querySelector("#acEmail").value.trim(), password:dlg.querySelector("#acPass").value});
      dlg.querySelector("#acForm").addEventListener("submit", async e => {
        e.preventDefault(); msg("Signing in…");
        const {error} = await sb.auth.signInWithPassword(creds());
        if (error) msg(error.message); else { dlg.close(); if (SP().toast) SP().toast("Signed in. Syncing your progress."); }
      });
      dlg.querySelector("#acNew").addEventListener("click", async () => {
        const c = creds(); if (!c.email || c.password.length < 6) { msg("Enter an email and a password of at least 6 characters."); return; }
        msg("Creating your account…");
        const {data, error} = await sb.auth.signUp(c);
        if (error) msg(error.message);
        else if (!data.session) msg("Check your email to confirm your account, then sign in here.");
        else { dlg.close(); if (SP().toast) SP().toast("Account created. Your progress now syncs."); }
      });
    }
    const close = dlg.querySelector("#acClose"); if (close) close.addEventListener("click", () => dlg.close());
  }
  function escapeHtml(t) { return String(t).replace(/&/g, "&amp;").replace(/[<]/g, "&lt;").replace(/"/g, "&quot;"); }
})();
