/* ═══════════════════════════════════════════════════════════════
   NOX FUND — Core: utilities, UI chrome, toasts, modals, wallet layer
   ═══════════════════════════════════════════════════════════════ */
"use strict";

const CFG = window.NOX_CONFIG;
const LS = {
  contract: "nox.contract",
  rpc: "nox.rpc",
  wallet: "nox.wallet",
  ref: "nox.ref",
  wc: "nox.wc",          // "1" while a WalletConnect (Reown) session is active
};
const WC_LABEL = "All Wallets · WalletConnect";

/* ───────────────────────── DOM helpers ───────────────────────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const on = (node, ev, fn, opt) => node && node.addEventListener(ev, fn, opt);
const setText = (sel, v) => { const n = typeof sel === "string" ? $(sel) : sel; if (n) n.textContent = v; };

/* ───────────────────────── Formatting ───────────────────────── */
const NF = (min, max) => new Intl.NumberFormat("en-US", { minimumFractionDigits: min, maximumFractionDigits: max });
const nf2 = NF(2, 2), nf0 = NF(0, 0), nf6 = NF(6, 6);

function fmt(n, d = 2) {
  const v = Number(n);
  if (!isFinite(v)) return "0.00";
  if (d === 6) return nf6.format(v);
  if (d === 0) return nf0.format(v);
  return nf2.format(v);
}
/** compact display for big protocol numbers: 1.24M */
function fmtCompact(n) {
  const v = Number(n);
  if (!isFinite(v)) return "0";
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return nf0.format(Math.round(v));
  return nf2.format(v);
}
const toNum = (bn) => Number(ethers.formatUnits(bn ?? 0n, CFG.USDT_DECIMALS));
const parseAmt = (s) => ethers.parseUnits(String(s || "0").replace(/,/g, "").trim(), CFG.USDT_DECIMALS);
const shortAddr = (a, l = 4) => (a ? `${a.slice(0, 2 + l)}…${a.slice(-l)}` : "—");
const isAddr = (a) => { try { return ethers.isAddress(a); } catch { return false; } };
const ZERO = "0x0000000000000000000000000000000000000000";

function countdown(sec) {
  sec = Math.max(0, Math.floor(Number(sec) || 0));
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600),
        m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}
const dateStr = (ts) =>
  new Date(Number(ts) * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const scanTx = (h) => `${CFG.CHAIN.explorer}/tx/${h}`;
const scanAddr = (a) => `${CFG.CHAIN.explorer}/address/${a}`;

/* ───────────────────────── Toasts ───────────────────────── */
function toast(title, msg = "", kind = "info", ms = 5200) {
  const box = $("#toasts");
  if (!box) return;
  const t = el("div", `toast toast--${kind}`);
  t.innerHTML =
    `<span class="toast__ico"></span>
     <div class="toast__body"><div class="toast__t"></div>${msg ? '<div class="toast__m"></div>' : ""}</div>
     <button class="toast__x" aria-label="Dismiss">✕</button>`;
  t.querySelector(".toast__t").textContent = title;
  if (msg) t.querySelector(".toast__m").textContent = msg;
  const kill = () => { t.classList.add("is-out"); setTimeout(() => t.remove(), 250); };
  on(t.querySelector(".toast__x"), "click", kill);
  box.appendChild(t);
  if (ms) setTimeout(kill, ms);
}

/* ───────────────────────── Modals ───────────────────────── */
function openModal(id) {
  const m = $(id);
  if (!m) return;
  m.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  const m = $(id);
  if (!m) return;
  m.hidden = true;
  if (!$$(".modal:not([hidden])").length) document.body.style.overflow = "";
}
$$(".modal").forEach((m) => {
  $$("[data-close]", m).forEach((b) => on(b, "click", () => closeModal("#" + m.id)));
});
on(document, "keydown", (e) => {
  if (e.key === "Escape") $$(".modal:not([hidden])").forEach((m) => { if (m.id !== "txModal") closeModal("#" + m.id); });
});

/* ───────────────────────── TX modal ───────────────────────── */
let txCloseTimer, txStuckTimer, txActionFn = null;
const TX = {
  state: "idle", // idle | busy | ok | fail
  _reset() {
    clearTimeout(txCloseTimer);  // a pending auto-close must never kill the next step's modal
    clearTimeout(txStuckTimer);
    txActionFn = null;
    $("#txAction").hidden = true;
  },
  open(title, msg) {
    this._reset();
    this.state = "busy";
    $("#txSpinner").className = "tx__spinner";
    setText("#txTitle", title);
    setText("#txMsg", msg || "");
    $("#txLink").hidden = true;
    $("#txClose").hidden = true;
    openModal("#txModal");
    // never trap the user behind a spinner (wallet prompt dropped, app switched…)
    txStuckTimer = setTimeout(() => { if (this.state === "busy") $("#txClose").hidden = false; }, 12000);
  },
  pending(hash, msg = "Waiting for block confirmation…") {
    setText("#txTitle", "Transaction submitted");
    setText("#txMsg", msg);
    const a = $("#txLink");
    if (hash) { a.href = scanTx(hash); a.hidden = false; } else a.hidden = true;
  },
  ok(title, msg, hash) {
    this._reset();
    this.state = "ok";
    $("#txSpinner").className = "tx__spinner is-ok";
    setText("#txTitle", title);
    setText("#txMsg", msg || "");
    if (hash) { const a = $("#txLink"); a.href = scanTx(hash); a.hidden = false; }
    $("#txClose").hidden = false;
    txOkAt = Date.now();
    txCloseTimer = setTimeout(() => TX.dismissIfDone(), 1600);
  },
  /** Success state with a real tap target for the next step (mobile wallets need a user gesture). */
  next(title, msg, label, fn) {
    this._reset();
    this.state = "ok";
    $("#txSpinner").className = "tx__spinner is-ok";
    setText("#txTitle", title);
    setText("#txMsg", msg || "");
    $("#txClose").hidden = false;
    const b = $("#txAction");
    b.querySelector("span").textContent = label;
    b.hidden = false;
    txActionFn = fn;
  },
  fail(msg) {
    this._reset();
    this.state = "fail";
    $("#txSpinner").className = "tx__spinner is-bad";
    setText("#txTitle", "Transaction failed");
    setText("#txMsg", msg || "The transaction was reverted or rejected.");
    $("#txClose").hidden = false;
  },
  dismissIfDone() {
    if (this.state === "ok" && !txActionFn && !$("#txModal").hidden) closeModal("#txModal");
  },
};
on($("#txClose"), "click", () => { TX._reset(); TX.state = "idle"; closeModal("#txModal"); });
on($("#txAction"), "click", () => { const f = txActionFn; txActionFn = null; $("#txAction").hidden = true; if (f) f(); });
// mobile dapp browsers freeze timers while the wallet/PIN sheet is up — catch up when we return
let txOkAt = 0;
const txCatchUp = () => { if (TX.state === "ok" && txOkAt && Date.now() - txOkAt > 1500) TX.dismissIfDone(); else setTimeout(() => TX.dismissIfDone(), 1600); };
on(document, "visibilitychange", () => { if (!document.hidden) txCatchUp(); });
on(window, "focus", txCatchUp);
on(window, "pageshow", txCatchUp);
// tapping the backdrop of a finished tx always closes it
on($("#txModal"), "click", (e) => { if (e.target === e.currentTarget && TX.state !== "busy") { TX._reset(); TX.state = "idle"; closeModal("#txModal"); } });

/** Normalise wallet / RPC errors into a human sentence. */
function errMsg(e) {
  const raw =
    e?.info?.error?.message || e?.shortMessage || e?.reason || e?.data?.message || e?.message || String(e);
  const s = String(raw);
  if (/user rejected|denied transaction|ACTION_REJECTED|User denied/i.test(s)) return "You rejected the request in your wallet.";
  if (/insufficient funds/i.test(s)) return "Insufficient BNB for gas fees.";
  const m = s.match(/NoxFund: ([^"'\\]+)/);
  if (m) return "Contract: " + m[1].trim();
  if (/transfer amount exceeds balance/i.test(s)) return "USDT balance too low for this amount.";
  if (/transfer amount exceeds allowance/i.test(s)) return "USDT allowance too low — approve first.";
  if (/below minimum deposit/i.test(s)) return "Amount below minimum deposit requirement.";
  if (/referrer must be active depositor/i.test(s)) return "Referrer has never deposited — remove referrer or use a different one.";
  if (/pool insufficient/i.test(s)) return "Pool doesn't have enough liquidity right now — try a smaller amount.";
  if (/could not coalesce|missing revert data|CALL_EXCEPTION/i.test(s)) return "Transaction validation failed — check your balance, allowance, and try reducing the amount.";
  return s.length > 180 ? s.slice(0, 180) + "…" : s;
}

/* ═══════════════════════════════════════════════════════════════
   WALLET LAYER — EIP-6963 discovery + EIP-1193 + Reown / WalletConnect
   ═══════════════════════════════════════════════════════════════ */
const Wallet = {
  providers: [],            // [{info,provider}]
  eip1193: null,
  browserProvider: null,
  signer: null,
  address: null,
  chainId: null,
  label: "",
  isWC: false,              // session came from Reown AppKit / WalletConnect
  connecting: false,
  listeners: new Set(),

  init() {
    // EIP-6963 multi-wallet discovery
    on(window, "eip6963:announceProvider", (e) => {
      const d = e.detail;
      if (!d?.info?.uuid) return;
      if (this.providers.some((p) => p.info.uuid === d.info.uuid)) return;
      this.providers.push(d);
      this.renderList();
    });
    
    // Request providers immediately
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    
    // Request again after a delay to catch late-announcing wallets (Rabby, Bitget, etc.)
    setTimeout(() => {
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    }, 100);
    
    // Another request after wallet extensions are fully loaded
    setTimeout(() => {
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    }, 500);

    // Legacy fallback for non-EIP-6963 wallets (detects all major injected providers)
    setTimeout(() => {
      this.detectLegacyWallets();
      this.renderList();
    }, 650);

    this.renderList();
  },

  /** Detect all major wallet providers that don't support EIP-6963 */
  detectLegacyWallets() {
    const detected = [];
    
    // Check for specific wallet injections (in priority order)
    const wallets = [
      { check: () => window.ethereum?.isRabby, name: "Rabby", provider: () => window.ethereum },
      { check: () => window.ethereum?.isBitKeep, name: "Bitget Wallet", provider: () => window.ethereum },
      { check: () => window.ethereum?.isOkxWallet || window.okxwallet, name: "OKX Wallet", provider: () => window.okxwallet || window.ethereum },
      { check: () => window.ethereum?.isCoinbaseWallet, name: "Coinbase Wallet", provider: () => window.ethereum },
      { check: () => window.ethereum?.isTokenPocket, name: "TokenPocket", provider: () => window.ethereum },
      { check: () => window.ethereum?.isBraveWallet, name: "Brave Wallet", provider: () => window.ethereum },
      { check: () => window.ethereum?.isSafePal, name: "SafePal", provider: () => window.ethereum },
      { check: () => window.ethereum?.isPhantom, name: "Phantom", provider: () => window.ethereum },
      // Trust Wallet removed - not supported, users should use MetaMask or SafePal
      { check: () => window.ethereum?.isMetaMask && !window.ethereum?.isRabby, name: "MetaMask", provider: () => window.ethereum },
    ];

    // Detect each wallet that's installed
    wallets.forEach((w, idx) => {
      try {
        if (w.check()) {
          const provider = w.provider();
          if (provider && typeof provider.request === "function") {
            const uuid = `injected-${w.name.toLowerCase().replace(/\s+/g, "-")}`;
            // Don't add if already discovered via EIP-6963
            if (!this.providers.some((p) => p.info.uuid === uuid || p.info.name === w.name)) {
              detected.push({
                info: { uuid, name: w.name, icon: "" },
                provider: provider,
              });
            }
          }
        }
      } catch (e) { /* ignore detection errors */ }
    });

    // Fallback: generic ethereum if nothing else detected
    if (!detected.length && !this.providers.length && window.ethereum) {
      try {
        if (typeof window.ethereum.request === "function") {
          detected.push({
            info: { uuid: "injected-fallback", name: "Browser Wallet", icon: "" },
            provider: window.ethereum,
          });
        }
      } catch (e) { /* ignore */ }
    }

    // Add all detected wallets
    detected.forEach((w) => this.providers.push(w));
  },

  /** Reown row: covers every WalletConnect-compatible wallet. */
  wcButton(last) {
    const b = el("button", "wallet wallet--wc");
    b.type = "button";
    b.innerHTML = `
      <span class="wallet__ico wallet__ico--wc" aria-hidden="true">
        <svg viewBox="0 0 480 300"><path fill="currentColor" d="M126.6 93.7c62.6-61.3 164.1-61.3 226.7 0l7.5 7.4c3.1 3 3.1 8 0 11l-25.8 25.2c-1.6 1.5-4.1 1.5-5.7 0l-10.4-10.1c-43.7-42.8-114.5-42.8-158.2 0l-11.1 10.9c-1.6 1.5-4.1 1.5-5.7 0l-25.8-25.3c-3.1-3-3.1-8 0-11l8.5-8.1Zm280 52.2 23 22.5c3.1 3 3.1 8 0 11L326.2 283.5c-3.1 3-8.2 3-11.3 0l-73.8-72.3c-.8-.8-2-.8-2.8 0l-73.8 72.3c-3.1 3-8.2 3-11.3 0L49.6 179.4c-3.1-3-3.1-8 0-11l23-22.5c3.1-3 8.2-3 11.3 0l73.8 72.3c.8.8 2 .8 2.8 0l73.8-72.3c3.1-3 8.2-3 11.3 0l73.8 72.3c.8.8 2 .8 2.8 0l73.8-72.3c3.2-3 8.2-3 11.4 0Z"/></svg>
      </span>
      <span class="wallet__name"></span>
      ${last === WC_LABEL ? '<span class="wallet__tag">Recent</span>' : '<span class="wallet__tag wallet__tag--alt">600+</span>'}`;
    b.querySelector(".wallet__name").textContent = "All Wallets (QR / Mobile)";
    on(b, "click", () => { closeModal("#walletModal"); this.connectWC(); });
    return b;
  },

  renderList() {
    const box = $("#walletList");
    if (!box) return;
    box.innerHTML = "";
    const last = localStorage.getItem(LS.wallet);
    const wcOk = !!window.NoxReown?.supported;
    
    // Check if user is in an in-app browser (Trust, MetaMask, TokenPocket, etc.)
    const inAppBrowser = !!(window.ethereum && (
      window.ethereum.isTrust ||
      window.ethereum.isTrustWallet ||
      window.ethereum.isMetaMask ||
      window.ethereum.isTokenPocket ||
      window.ethereum.isBitKeep ||
      window.ethereum.isOkxWallet ||
      window.trustwallet
    ));

    // Show injected providers if in-app browser is detected
    if (inAppBrowser && this.providers.length > 0) {
      this.providers.forEach((p) => {
        const b = el("button", "wallet" + (p.info.name === last ? " wallet--recent" : ""));
        b.type = "button";
        let ico = p.info.icon;
        if (ico && ico.startsWith("data:image/svg+xml,")) ico = ico.replace("data:image/svg+xml,", "data:image/svg+xml;utf8,");
        b.innerHTML = `
          ${ico ? `<img class="wallet__ico" src="${ico}" alt="" />` : '<span class="wallet__ico"></span>'}
          <span class="wallet__name"></span>
          ${p.info.name === last ? '<span class="wallet__tag">Recent</span>' : ''}`;
        b.querySelector(".wallet__name").textContent = p.info.name;
        on(b, "click", () => { closeModal("#walletModal"); this.connect(p); });
        box.appendChild(b);
      });
      box.appendChild(el("p", "wallets__hint",
        "Using " + (this.providers[0]?.info.name || "in-app browser") + ". Make sure you're on BNB Smart Chain (BSC) in your wallet settings."));
    }
    // Desktop users: show WalletConnect
    else if (wcOk) {
      box.appendChild(this.wcButton(last));
      box.appendChild(el("p", "wallets__hint",
        "Connect any wallet — Trust, MetaMask, Bitget, OKX, TokenPocket, Binance Web3, Rainbow, Ledger and 600+ more. Scan the QR on desktop or open your wallet app on mobile."));
    } else {
      box.appendChild(el("div", "panel--empty", `
        <h3>No wallet detected</h3>
        <p>Please open this page inside your wallet's in-app browser (MetaMask, SafePal, etc.) or install a wallet extension. <strong>Note: Trust Wallet is not supported. Use MetaMask or SafePal instead.</strong></p>
        <a class="btn btn--primary btn--sm" href="https://trustwallet.com/download" target="_blank" rel="noopener">Get Trust Wallet</a>`));
    }
  },

  async connect(entry) {
    const p = entry || this.providers[0];
    if (!p) return openModal("#walletModal");
    try {
      const accounts = await p.provider.request({ method: "eth_requestAccounts" });
      if (!accounts?.length) throw new Error("No accounts returned.");
      this.isWC = false;
      this.eip1193 = p.provider;
      this.label = p.info.name;
      localStorage.setItem(LS.wallet, p.info.name);
      localStorage.removeItem(LS.wc);
      this.bind(p.provider);
      this._postConnectSwitch = true;  // flag to auto-switch after initial sync
      await this.sync(accounts[0]);
      toast("Wallet connected", `${p.info.name} · ${shortAddr(this.address, 5)}`, "ok");
    } catch (e) {
      toast("Connection failed", errMsg(e), "err");
    }
  },

  /** Connect through Reown AppKit (WalletConnect v2). */
  async connectWC() {
    const RW = window.NoxReown;
    if (!RW?.supported) return toast("Unavailable", "This browser cannot use WalletConnect — please use your wallet's in-app browser.", "err");
    if (this.connecting) return;
    this.connecting = true;
    const first = !RW.loaded;
    if (first) toast("Opening WalletConnect", "Loading the secure connector…", "info", 3200);
    try {
      const s = await RW.connect();
      if (!s) return;                       // user dismissed the sheet
      this.isWC = true;
      this.eip1193 = s.provider;
      this.label = s.label || "WalletConnect";
      localStorage.setItem(LS.wallet, WC_LABEL);
      localStorage.setItem(LS.wc, "1");
      this.bind(s.provider);
      this._postConnectSwitch = true;  // flag to auto-switch after initial sync
      await this.sync(s.address);
      toast("Wallet connected", `${this.label} · ${shortAddr(this.address, 5)}`, "ok");
    } catch (e) {
      localStorage.removeItem(LS.wc);
      toast("Connection failed", errMsg(e), "err");
    } finally {
      this.connecting = false;
    }
  },

  bind(prov) {
    if (prov.__noxBound) return;
    prov.__noxBound = true;
    
    // Note: removeListener requires both event name AND callback reference.
    // Since we use inline arrow functions, we can't properly remove them.
    // The __noxBound flag prevents duplicate binding, which is sufficient.
    // Attempting to call removeListener without the callback causes errors in some wallets.
    
    // SafePal/Trust wallet compatible event listeners
    try {
      prov.on?.("accountsChanged", (accs) => {
        if (!accs?.length) return this.disconnect();
        if (this.address && accs[0].toLowerCase() === this.address.toLowerCase()) return;
        this.sync(accs[0]);
        toast("Account switched", shortAddr(accs[0], 5), "info");
      });
    } catch (e) {
      console.warn("Failed to bind accountsChanged:", e);
    }
    
    // Re-sync instead of reloading: WalletConnect emits chainChanged during
    // handshake and a reload there would drop the user mid-connect.
    try {
      prov.on?.("chainChanged", async () => {
        if (!this.address) return;
        try { await this.sync(this.address); } catch { /* ignore - will show wrong network banner */ }
      });
    } catch (e) {
      console.warn("Failed to bind chainChanged:", e);
    }
    
    try {
      prov.on?.("disconnect", () => this.disconnect());
    } catch (e) {
      console.warn("Failed to bind disconnect:", e);
    }
    
    try {
      prov.on?.("session_delete", () => this.disconnect());
    } catch (e) {
      console.warn("Failed to bind session_delete:", e);
    }
  },

  async sync(addr) {
    this.browserProvider = new ethers.BrowserProvider(this.eip1193, "any");
    this.browserProvider.pollingInterval = 800;   // default 4s is far too slow for BSC
    this.signer = await this.browserProvider.getSigner();
    this.address = ethers.getAddress(addr);
    const net = await this.browserProvider.getNetwork();
    this.chainId = Number(net.chainId);
    this.emit();
    // Check if user is using Trust Wallet and warn them
    if (this._postConnectSwitch) {
      this._postConnectSwitch = false;
      if (this.isTrust()) {
        setTimeout(() => this.showTrustWalletWarning(), 500);
      } else {
        setTimeout(() => this.autoSwitch(), 100);
      }
    }
  },

  /** Force BSC whenever the wallet sits on another chain (throttled, one prompt at a time). */
  autoSwitch() {
    // Skip if Trust Wallet detected (will show warning instead)
    if (!this.address || this.chainId === CFG.CHAIN.id || this._switching || this.isTrust()) return;
    const now = Date.now();
    if (now - (this._lastSwitch || 0) < 4000) return;
    this._lastSwitch = now;
    this._switching = true;
    toast("Wrong network", "Switching to BNB Smart Chain…", "info");
    Promise.resolve(this.switchChain()).finally(() => { this._switching = false; });
  },

  /** Trust Wallet in-app browser (lists BSC as "Smart Chain", under S). */
  isTrust() {
    const p = this.eip1193 || window.ethereum || {};
    return !!(p.isTrust || p.isTrustWallet || window.trustwallet || /Trust/i.test(navigator.userAgent));
  },
  /** Show warning for Trust Wallet users */
  showTrustWalletWarning() {
    if (this._trustWarningShown) return;
    this._trustWarningShown = true;
    toast("⚠️ Trust Wallet Not Supported",
      "Trust Wallet has compatibility issues. Please switch to MetaMask or SafePal for the best experience. Your funds are safe, but features may not work correctly.",
      "err", 20000);
    const banner = document.getElementById("banner");
    const bannerText = document.getElementById("bannerText");
    if (banner && bannerText) {
      bannerText.textContent = "⚠️ Trust Wallet is not supported. Please use MetaMask or SafePal instead for full compatibility.";
      banner.hidden = false;
    }
  },
  /** Deep link that reopens the dApp in Trust with Smart Chain (coin 20000714) preselected. */
  trustSmartChainLink() {
    return "https://link.trustwallet.com/open_url?coin_id=20000714&url=" +
      encodeURIComponent(location.origin + location.pathname + location.search);
  },
  trustHelp() {
    this.showTrustWalletWarning();
  },

  /** Returns true when the wallet ends up on BSC. */
  async switchChain() {
    if (!this.eip1193) return false;
    const ok = await this._switchChain();
    if (!ok && this.isTrust()) this.trustHelp();
    return ok;
  },

  async _switchChain() {
    const C = CFG.CHAIN;
    // some wallets (Trust Android) never resolve the request — never hang forever
    const timed = (p, ms = 20000) => Promise.race([p, new Promise((_, rej) =>
      setTimeout(() => rej(Object.assign(new Error("Network switch timed out"), { code: "TIMEOUT" })), ms))]);
    const onBsc = async () => {
      try { return parseInt(await this.eip1193.request({ method: "eth_chainId" }), 16) === C.id; } catch { return false; }
    };
    // WalletConnect sessions switch best through AppKit (it re-negotiates
    // the session namespace when the wallet has no BSC permission yet).
    if (this.isWC && window.NoxReown) {
      try {
        if (await window.NoxReown.switchNetwork()) {
          setTimeout(() => { if (this.address) this.sync(this.address).catch(() => {}); }, 900);
          return true;
        }
      } catch { /* fall through to the raw RPC path */ }
    }
    const resync = () => setTimeout(() => { if (this.address) this.sync(this.address).catch(() => {}); }, 700);
    try {
      await timed(this.eip1193.request({ method: "wallet_switchEthereumChain", params: [{ chainId: C.hex }] }));
      resync();
      return true;
    } catch (e) {
      if (await onBsc()) { resync(); return true; }   // switched despite the error
      if (e?.code === -32002 || /already pending/i.test(String(e?.message))) {
        toast("Approve in your wallet", "A network switch request is already waiting — open your wallet to approve it.", "info", 8000);
        return false;
      }
      if (e?.code === "TIMEOUT") return false;
      // 4902 = chain not added. Mobile wallets (MetaMask Mobile, Trust, Bitget,
      // TokenPocket) often wrap it inside a -32603 internal error instead.
      const inner = e?.data?.originalError?.code ?? e?.error?.code ?? e?.data?.code;
      const notAdded =
        e?.code === 4902 || inner === 4902 ||
        /Unrecognized chain|unrecognized chain|not been added|unknown chain|chain .*not (found|supported)|addEthereumChain/i
          .test(String(e?.message || "") + " " + String(e?.data?.originalError?.message || "") + " " + String(e?.reason || ""));
      if (e?.code === 4001 || /user rejected|denied/i.test(String(e?.message))) {
        toast("Network switch rejected", "Please switch to BNB Smart Chain in your wallet to continue.", "err");
        return false;
      }
      if (notAdded) {
        try {
          await timed(this.eip1193.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: C.hex, chainName: C.name, nativeCurrency: C.currency,
              rpcUrls: C.rpcs, blockExplorerUrls: [C.explorer],
            }],
          }));
          // some wallets add the chain without switching to it
          try { await timed(this.eip1193.request({ method: "wallet_switchEthereumChain", params: [{ chainId: C.hex }] })); } catch {}
          resync();
          return await onBsc();
        } catch (e2) {
          if (!this.isTrust()) toast("Network switch failed", errMsg(e2), "err");
          return false;
        }
      }
      if (!this.isTrust()) toast("Network switch failed", errMsg(e), "err");
      return false;
    }
  },

  disconnect() {
    const wasWC = this.isWC;
    this.signer = null; this.address = null; this.browserProvider = null;
    this.chainId = null; this.label = ""; this.isWC = false;
    localStorage.removeItem(LS.wallet);
    localStorage.removeItem(LS.wc);
    if (wasWC && window.NoxReown) { try { window.NoxReown.disconnect(); } catch { /* ignore */ } }
    this.emit();
    this.renderList();
    toast("Wallet disconnected", "", "info");
  },

  async restore() {
    const name = localStorage.getItem(LS.wallet);
    if (!name) return;

    // WalletConnect session from a previous visit — resume in the background
    // so it can never delay first paint or block the injected path.
    if (name === WC_LABEL || localStorage.getItem(LS.wc) === "1") {
      this.resumeWC();
      return;
    }

    const entry = this.providers.find((p) => p.info.name === name) || this.providers[0];
    if (!entry) return;
    try {
      const accs = await entry.provider.request({ method: "eth_accounts" });
      if (accs?.length) {
        this.isWC = false;
        this.eip1193 = entry.provider;
        this.label = entry.info.name;
        this.bind(entry.provider);
        await this.sync(accs[0]);
      }
    } catch { /* silent */ }
  },

  /** Non-blocking restore of a stored Reown/WalletConnect session. */
  resumeWC() {
    const RW = window.NoxReown;
    if (!RW?.supported) return;
    const go = async () => {
      try {
        const s = await RW.resume();
        if (!s || this.address) return;     // nothing to resume / user already connected
        this.isWC = true;
        this.eip1193 = s.provider;
        this.label = s.label || "WalletConnect";
        this.bind(s.provider);
        await this.sync(s.address);
      } catch {
        localStorage.removeItem(LS.wc);
      }
    };
    if (window.requestIdleCallback) requestIdleCallback(() => go(), { timeout: 2500 });
    else setTimeout(go, 600);
  },

  get ok() { return !!this.address && this.chainId === CFG.CHAIN.id; },
  onChange(fn) { this.listeners.add(fn); },
  emit() { this.listeners.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); },
};

/* ═══════════════════════════════════════════════════════════════
   PAGE CHROME — nav, reveal, FAQ, accordions
   ═══════════════════════════════════════════════════════════════ */
function initChrome() {
  setText("#year", String(new Date().getFullYear()));

  // sticky nav
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 12);
  on(window, "scroll", onScroll, { passive: true });
  onScroll();

  /* keep the sticky banner height in a CSS var so the fixed mobile menu
     never overlaps it (and never loses full width) */
  const banner = $("#banner");
  const syncBannerH = () =>
    document.documentElement.style.setProperty(
      "--banner-h", banner && !banner.hidden ? banner.offsetHeight + "px" : "0px");
  if (banner) {
    new MutationObserver(syncBannerH).observe(banner, { attributes: true, attributeFilter: ["hidden"] });
    if (window.ResizeObserver) new ResizeObserver(syncBannerH).observe(banner);
  }
  on(window, "resize", syncBannerH);
  syncBannerH();

  // mobile menu
  const burger = $("#burger"), links = $("#navLinks");
  const setMenu = (open) => {
    links.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  on(burger, "click", (e) => {
    e.stopPropagation();
    setMenu(!links.classList.contains("is-open"));
  });
  $$(".nav__link").forEach((a) => on(a, "click", () => setMenu(false)));
  on(document, "click", (e) => {
    if (!links.classList.contains("is-open")) return;
    if (!links.contains(e.target) && !burger.contains(e.target)) setMenu(false);
  });
  on(document, "keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  on(window, "resize", () => { if (window.innerWidth > 1024) setMenu(false); });

  // scroll spy
  const secs = $$("main section[id]");
  const spy = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      $$(".nav__link").forEach((a) =>
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  secs.forEach((s) => spy.observe(s));

  // reveal on scroll
  const rev = new IntersectionObserver((ents, obs) => {
    ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); obs.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
  $$(".reveal").forEach((n, i) => { n.style.transitionDelay = `${Math.min(i * 40, 240)}ms`; rev.observe(n); });

  // FAQ: single-open accordion
  $$(".faq__item").forEach((d) => on(d, "toggle", () => {
    if (d.open) $$(".faq__item").forEach((o) => { if (o !== d) o.open = false; });
  }));

  // connect triggers — always let the user pick (injected or WalletConnect)
  $$("[data-connect]").forEach((b) => on(b, "click", () => {
    if (Wallet.address) return openModal("#accountModal");
    Wallet.renderList();
    openModal("#walletModal");
  }));

  // settings modal
  on($("#openSettings"), "click", (e) => {
    e.preventDefault();
    $("#setContract").value = localStorage.getItem(LS.contract) || CFG.CONTRACT_ADDRESS;
    $("#setRpc").value = localStorage.getItem(LS.rpc) || "";
    openModal("#settingsModal");
  });
  on($("#saveSettings"), "click", () => {
    const c = $("#setContract").value.trim(), r = $("#setRpc").value.trim();
    if (c && !isAddr(c)) return toast("Invalid address", "Enter a valid 0x contract address.", "err");
    c ? localStorage.setItem(LS.contract, ethers.getAddress(c)) : localStorage.removeItem(LS.contract);
    r ? localStorage.setItem(LS.rpc, r) : localStorage.removeItem(LS.rpc);
    location.reload();
  });
  on($("#resetSettings"), "click", () => {
    localStorage.removeItem(LS.contract); localStorage.removeItem(LS.rpc); location.reload();
  });
}

/* clipboard with fallback */
async function copy(text, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast(label, "", "ok", 2200);
  } catch {
    const t = el("textarea"); t.value = text; document.body.appendChild(t); t.select();
    document.execCommand("copy"); t.remove();
    toast(label, "", "ok", 2200);
  }
}
