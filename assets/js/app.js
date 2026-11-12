/* ═══════════════════════════════════════════════════════════════
   NOX FUND — Application: contract layer, dashboard, actions
   ═══════════════════════════════════════════════════════════════ */
"use strict";

/* ───────────────────────── State ───────────────────────── */
const S = {
  read: null,          // JsonRpcProvider
  nox: null,           // read-only NoxFund
  usdt: null,          // read-only USDT
  noxW: null,          // signer-bound NoxFund
  usdtW: null,         // signer-bound USDT
  address: CFG.CONTRACT_ADDRESS,
  deployed: false,
  global: null,
  user: null,
  positions: [],
  filter: "all",
  loading: false,
  refInput: "",
  refResolved: null,
  nowOffset: 0,        // chain time - local time (seconds)
};

const P = CFG.P;
const DAILY = P.DAILY_BPS / P.BPS;          // 0.015
const nowChain = () => Math.floor(Date.now() / 1000) + S.nowOffset;

/* ───────────────────────── Providers ───────────────────────── */
function resolveAddress() {
  const override = localStorage.getItem(LS.contract);
  const a = override || CFG.CONTRACT_ADDRESS;
  S.address = isAddr(a) ? ethers.getAddress(a) : ZERO;
  S.deployed = S.address !== ZERO;
  return S.address;
}

function initProviders() {
  const rpc = localStorage.getItem(LS.rpc) || CFG.CHAIN.rpcs[0];
  const net = new ethers.Network(CFG.CHAIN.name, CFG.CHAIN.id);
  S.read = new ethers.JsonRpcProvider(rpc, net, { staticNetwork: net, batchMaxCount: 12 });
  S.read.pollingInterval = CFG.RECEIPT_POLL_MS;
  resolveAddress();
  if (S.deployed) S.nox = new ethers.Contract(S.address, window.NOX_ABI, S.read);
  S.usdt = new ethers.Contract(CFG.USDT_ADDRESS, window.ERC20_ABI, S.read);

  // explorer links
  const cLink = S.deployed ? scanAddr(S.address) + "#code#F7#L1" : CFG.CHAIN.explorer;
  ["#contractLink", "#footerContract", "#footerScan", "#auditScan"].forEach((id) => { const n = $(id); if (n) n.href = cLink; });
  setText("#footerContract", S.deployed ? shortAddr(S.address, 6) : "not configured");
  const u = $("#footerUsdt"); if (u) u.href = scanAddr(CFG.USDT_ADDRESS);

  if (!S.deployed) {
    const b = $("#banner");
    b.hidden = false;
    setText("#bannerText", "Contract address not configured — set it in assets/js/config.js or via RPC Settings");
    const act = $("#bannerAction");
    act.hidden = false; act.textContent = "Configure";
    act.onclick = () => $("#openSettings").click();
  }
}

/** retry a read across RPC endpoints */
async function withRetry(fn, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      if (i < tries - 1) {
        const next = CFG.CHAIN.rpcs[(i + 1) % CFG.CHAIN.rpcs.length];
        const net = new ethers.Network(CFG.CHAIN.name, CFG.CHAIN.id);
        S.read = new ethers.JsonRpcProvider(next, net, { staticNetwork: net, batchMaxCount: 12 });
        if (S.deployed) S.nox = new ethers.Contract(S.address, window.NOX_ABI, S.read);
        S.usdt = new ethers.Contract(CFG.USDT_ADDRESS, window.ERC20_ABI, S.read);
        await new Promise((r) => setTimeout(r, 350));
      }
    }
  }
  throw lastErr;
}

function bindSigner() {
  if (Wallet.signer && S.deployed) {
    S.noxW = new ethers.Contract(S.address, window.NOX_ABI, Wallet.signer);
    S.usdtW = new ethers.Contract(CFG.USDT_ADDRESS, window.ERC20_ABI, Wallet.signer);
  } else { S.noxW = null; S.usdtW = null; }
}

/* ═══════════════════ GLOBAL PROTOCOL STATS ═══════════════════ */
const GLOBAL_IDS = ["#sLiquidity", "#sDaysLive", "#sRoiPaid", "#sUsers"];

async function loadGlobal() {
  if (!S.deployed) {
    GLOBAL_IDS.forEach((i) => setText(i, "—"));
    return;
  }
  try {
    const [info, blk] = await withRetry(() => Promise.all([S.nox.contractInfo(), S.read.getBlock("latest")]));
    if (blk?.timestamp) S.nowOffset = Number(blk.timestamp) - Math.floor(Date.now() / 1000);
    S.global = {
      balance: toNum(info[0]),
      available: toNum(info[1]),
      pendingRefs: toNum(info[2]),
      deposited: toNum(info[3]),
      roiOut: toNum(info[4]),
      principalOut: toNum(info[5]),
      users: Number(info[6]),
    };
    // Headline = the full USDT balance held by the contract. `available` additionally
    // subtracts referral rewards already owed to referrers, so it is shown as a tooltip.
    setText("#sLiquidity", "$" + fmtCompact(S.global.balance));
    const liq = $("#sLiquidity")?.closest(".statstrip__item");
    if (liq) {
      liq.title =
        `Contract balance: $${fmt(S.global.balance, 2)}\n` +
        `Reserved for referral payouts: $${fmt(S.global.pendingRefs, 2)}\n` +
        `Available for ROI / principal claims: $${fmt(S.global.available, 2)}`;
    }
    
    // Calculate days live
    if (CFG.DEPLOY_TIMESTAMP && blk?.timestamp) {
      const daysLive = Math.floor((Number(blk.timestamp) - CFG.DEPLOY_TIMESTAMP) / 86400);
      setText("#sDaysLive", fmt(Math.max(0, daysLive), 0));
    } else {
      setText("#sDaysLive", "—");
    }
    
    setText("#sRoiPaid", "$" + fmtCompact(S.global.roiOut));
    setText("#sUsers", fmt(S.global.users, 0));
    
    // Update stats bar
    setText("#sbTVL", "$" + fmtCompact(S.global.balance));
    setText("#sbUsers", fmt(S.global.users, 0));
  } catch (e) {
    console.warn("global stats", e);
    GLOBAL_IDS.forEach((i) => setText(i, "—"));
  }
}

/* ═══════════════════ USER PORTFOLIO ═══════════════════ */
async function loadUser(silent = false) {
  const connected = !!Wallet.address;
  $("#portfolioLocked").hidden = connected;
  $("#portfolioView").hidden = !connected;
  if (!connected || !S.deployed) { updateWalletUI(); return; }

  const a = Wallet.address;
  if (!silent) S.loading = true;

  try {
    const [bal, allow, count, refBal, dep, roiOut, prOut, refEarned, uname, upline, locked, bnb] =
      await withRetry(() => Promise.all([
        S.usdt.balanceOf(a),
        S.usdt.allowance(a, S.address),
        S.nox.depositCount(a),
        S.nox.refBalance(a),
        S.nox.totalDeposited(a),
        S.nox.totalWithdrawnROI(a),
        S.nox.totalWithdrawnPrincipal(a),
        S.nox.totalReferralEarned(a),
        S.nox.addressToUsername(a),
        S.nox.referralChain(a),
        S.nox.referrerLocked(a),
        S.read.getBalance(a),
      ]));

    S.user = {
      usdt: toNum(bal), usdtRaw: bal,
      allowance: toNum(allow), allowanceRaw: allow,
      count: Number(count),
      refBal: toNum(refBal), refBalRaw: refBal,
      deposited: toNum(dep),
      roiOut: toNum(roiOut),
      principalOut: toNum(prOut),
      refEarned: toNum(refEarned),
      username: uname || "",
      upline: Array.from(upline),
      locked,
      bnb: Number(ethers.formatEther(bnb)),
    };

    // positions (batched)
    const n = Math.min(S.user.count, CFG.MAX_POSITIONS_RENDER);
    const calls = [];
    for (let i = 0; i < n; i++) calls.push(S.nox.depositInfo(a, i));
    const infos = await withRetry(() => Promise.all(calls));
    S.positions = infos.map((d, i) => ({
      i,
      principal: toNum(d[0]),
      start: Number(d[1]),
      lastClaim: Number(d[2]),
      matures: Number(d[3]),
      daysClaimed: Number(d[4]),
      daysRemaining: Number(d[5]),
      daysElapsed: Number(d[6]),
      daysUnclaimed: Number(d[7]),
      pending: toNum(d[8]),
      matured: d[9],
      withdrawn: d[10],
      maxed: d[11],
    }));

    renderPortfolio();
    renderReferral();
    renderStakeSide();
  } catch (e) {
    console.error("loadUser", e);
    if (!silent) toast("Could not load portfolio", errMsg(e), "err");
  } finally {
    S.loading = false;
    updateWalletUI();
  }
}

/* ═══════════════════ RENDER: PORTFOLIO ═══════════════════ */
function renderPortfolio() {
  const u = S.user;
  if (!u) return;
  setText("#kDeposited", fmt(u.deposited));
  setText("#kRoiOut", fmt(u.roiOut));
  setText("#kRefEarned", fmt(u.refEarned));
  setText("#kPrincipalOut", fmt(u.principalOut));

  const claimable = S.positions.reduce((s, p) => s + p.pending, 0);
  setText("#kClaimable", fmt(claimable));
  setText("#aggClaimable", fmt(claimable) + " USDT");
  $("#claimAllBtn").disabled = claimable <= 0;

  setText("#posCount", String(S.positions.length));
  renderPositions();
  tickLive();
}

function liveAccrual(p) {
  if (p.withdrawn || p.maxed || p.principal <= 0) return p.pending;
  const elapsed = Math.max(0, nowChain() - p.lastClaim);
  const capped = Math.min(elapsed / 86400, p.daysRemaining);
  return p.principal * DAILY * capped;
}

function tickLive() {
  if (!S.user || !S.positions.length) { setText("#kLive", "0.000000"); return; }
  const live = S.positions.reduce((s, p) => s + liveAccrual(p), 0);
  setText("#kLive", fmt(live, 6));

  S.positions.forEach((p) => {
    const card = $(`.pos[data-i="${p.i}"]`);
    if (!card) return;
    const lv = $(".js-live", card);
    if (lv) lv.textContent = fmt(liveAccrual(p), 6) + " USDT";
    const nx = $(".js-next", card);
    if (nx) {
      if (p.withdrawn || p.maxed) nx.textContent = "—";
      else {
        const sinceClaim = Math.max(0, nowChain() - p.lastClaim);
        nx.textContent = countdown(86400 - (sinceClaim % 86400));
      }
    }
    const ul = $(".js-unlock", card);
    if (ul) ul.textContent = p.matured ? "Unlocked" : countdown(p.matures - nowChain());
  });
}

function renderPositions() {
  const box = $("#positions");
  const empty = $("#positionsEmpty");
  const list = S.positions.filter((p) => {
    if (S.filter === "locked") return !p.withdrawn && !p.matured;
    if (S.filter === "matured") return !p.withdrawn && p.matured;
    if (S.filter === "closed") return p.withdrawn;
    return true;
  });

  box.innerHTML = "";
  empty.hidden = S.positions.length !== 0;
  if (!list.length) {
    if (S.positions.length) box.appendChild(el("div", "panel panel--empty", `<h3>Nothing here</h3><p>No positions match the “${S.filter}” filter.</p>`));
    return;
  }

  list.forEach((p) => box.appendChild(positionCard(p)));
  tickLive();
}

function positionCard(p) {
  const pct = p.withdrawn ? 100 : Math.min(100, ((nowChain() - p.start) / (P.LOCK_DAYS * 86400)) * 100);
  const badge = p.withdrawn
    ? '<span class="badge badge--closed">Closed</span>'
    : p.maxed
      ? '<span class="badge badge--maxed">ROI Maxed</span>'
      : p.matured
        ? '<span class="badge badge--matured">Unlocked</span>'
        : '<span class="badge badge--locked">Locked</span>';

  const card = el("article", `pos${p.withdrawn ? " pos--closed" : ""}`);
  card.dataset.i = String(p.i);
  card.innerHTML = `
    <div class="pos__top">
      <div>
        <div class="pos__id">POSITION #${String(p.i).padStart(3, "0")}</div>
        <div class="pos__amt">${fmt(p.principal)}<small>USDT</small></div>
      </div>
      ${badge}
    </div>

    <div class="ring" style="--p:${pct.toFixed(2)}"><i></i></div>
    <div class="pos__meta">
      <span>Day ${Math.min(p.daysElapsed, P.LOCK_DAYS)} / ${P.LOCK_DAYS}</span>
      <span class="js-unlock">${p.matured ? "Unlocked" : countdown(p.matures - nowChain())}</span>
    </div>

    <div class="pos__rows">
      <div class="pos__row"><span>Live accrual</span><b class="js-live mono">${fmt(liveAccrual(p), 6)} USDT</b></div>
      <div class="pos__row pos__row--hl"><span>Claimable now</span><b>${fmt(p.pending)} USDT</b></div>
      <div class="pos__row"><span>Next epoch in</span><b class="js-next">—</b></div>
      <div class="pos__row"><span>ROI days</span><b>${p.daysClaimed} / ${P.MAX_ROI_DAYS}</b></div>
      <div class="pos__row"><span>Started</span><b>${dateStr(p.start)}</b></div>
      <div class="pos__row"><span>Matures</span><b>${dateStr(p.matures)}</b></div>
    </div>

    <div class="pos__btns">
      <button class="btn btn--ghost btn--xs js-claim" type="button" ${p.pending <= 0 ? "disabled" : ""}>Claim ROI</button>
      <button class="btn btn--primary btn--xs js-exit" type="button" ${p.withdrawn || !p.matured ? "disabled" : ""}>
        ${p.withdrawn ? "Withdrawn" : p.matured ? "Withdraw Capital" : "Locked"}
      </button>
    </div>`;

  on($(".js-claim", card), "click", () => claimROI(p.i));
  on($(".js-exit", card), "click", () => withdrawPrincipal(p.i));
  return card;
}

/* ═══════════════════ DOWNLINE (from ReferralPaid events) ═══════════════════ */
const D = { rows: [], level: 0, for: null, loading: false };

async function fetchRefLogs(addr) {
  const f = S.nox.filters.ReferralPaid(addr);
  try {
    return await withRetry(() => S.nox.queryFilter(f, CFG.DEPLOY_BLOCK || 0, "latest"));
  } catch (e) {
    const head = await S.read.getBlockNumber();
    const start = CFG.DEPLOY_BLOCK || Math.max(0, head - 300000);
    const out = [];
    for (let b = start; b <= head; b += 4000) {
      out.push(...await withRetry(() => S.nox.queryFilter(f, b, Math.min(b + 3999, head))));
    }
    return out;
  }
}

async function loadDownline(force) {
  if (!Wallet.address || !S.deployed || D.loading) return;
  if (!force && D.for === Wallet.address) return;
  D.loading = true;
  setText("#downNote", "Scanning on-chain commission events…");
  try {
    let rows = null;
    try {
      // Preferred: server endpoint (public BSC RPCs refuse wide eth_getLogs ranges)
      const res = await fetch("/api/downline?address=" + Wallet.address, { cache: "no-store" });
      const j = await res.json();
      if (j?.ok) {
        rows = j.members.map((x) => {
          const earned = toNum(BigInt(x.earned));
          return { addr: x.address, level: x.level, earned, volume: earned * P.BPS / (P.REF[x.level - 1] || 1), n: x.count, block: x.lastBlock, t: x.lastTime || 0 };
        });
      }
    } catch (e) { console.warn("downline api", e); }
    if (!rows) {
      const logs = await fetchRefLogs(Wallet.address);
      const m = new Map();
      for (const lg of logs) {
        const dep = lg.args.depositor, lvl = Number(lg.args.level), amt = toNum(lg.args.amount);
        const k = dep.toLowerCase();
        const r = m.get(k) || { addr: dep, level: lvl, earned: 0, volume: 0, n: 0, block: lg.blockNumber };
        r.earned += amt;
        r.volume += amt * P.BPS / (P.REF[lvl - 1] || 1);
        r.n++;
        r.block = Math.max(r.block, lg.blockNumber);
        m.set(k, r);
      }
      rows = [...m.values()];
    }
    D.rows = rows.sort((a, b) => a.level - b.level || b.volume - a.volume);
    D.for = Wallet.address;
    setText("#downNote", "Built from on-chain commission events. Volume is derived from the commission you received. Members who haven't deposited yet won't appear.");
  } catch (e) {
    console.warn("downline", e);
    setText("#downNote", "Could not load downline right now — press Reload.");
  }
  D.loading = false;
  renderDownline();
}

function renderDownline() {
  const rows = D.rows;
  const tot = (k) => rows.reduce((s, r) => s + r[k], 0);
  setText("#dMembers", fmt(rows.length, 0));
  setText("#dVolume", "$" + fmtCompact(tot("volume")));
  setText("#dEarned", "$" + fmt(tot("earned")));

  const lv = $("#downLevels"); lv.innerHTML = "";
  for (let i = 1; i <= 7; i++) {
    const g = rows.filter((r) => r.level === i);
    const c = el("button", "dlv" + (D.level === i ? " is-on" : ""));
    c.type = "button";
    c.innerHTML = `<span>L${i} · ${(P.REF[i - 1] / 100).toFixed(1)}%</span><b>${g.length}</b><i>$${fmt(g.reduce((s, r) => s + r.earned, 0))}</i>`;
    c.onclick = () => { D.level = D.level === i ? 0 : i; renderDownline(); };
    lv.appendChild(c);
  }
  const tabs = $("#downTabs");
  tabs.innerHTML = D.level ? `<span>Showing level ${D.level}</span> <button type="button" class="down__all">Show all</button>` : "";
  const all = tabs.querySelector(".down__all"); if (all) all.onclick = () => { D.level = 0; renderDownline(); };

  const list = $("#downList"); list.innerHTML = "";
  const shown = D.level ? rows.filter((r) => r.level === D.level) : rows;
  if (!shown.length) {
    list.appendChild(el("li", "down__empty", rows.length || D.loading ? "No members on this level yet." : "No referrals yet — share your link and earn instantly on every deposit."));
    return;
  }
  shown.slice(0, 200).forEach((r) => {
    const li = el("li", "down__row");
    const meta = `${r.n} deposit${r.n === 1 ? "" : "s"}${r.t ? " · last " + fmtWhen(r.t) : ""}`;
    li.innerHTML = `<span class="down__lvl">L${r.level}</span>
      <a class="down__addr mono" target="_blank" rel="noopener" href="${scanAddr(r.addr)}">${shortAddr(r.addr, 6)}<span class="down__meta">${meta}</span></a>
      <span class="down__vol"><small>Deposited</small><b class="mono">$${fmt(r.volume)}</b></span>
      <span class="down__earn"><small>You earned</small><b class="mono">+$${fmt(r.earned)}</b></span>`;
    list.appendChild(li);
  });
}


/* ═══════════════════ TX HISTORY (deposits, withdrawals, referral) ═══════════════════ */
const H = { rows: [], totals: null, tab: "all", for: null, loading: false, err: false };
const H_TYPES = {
  deposit:   { label: "Deposit",          sign: "-", grp: "dep" },
  roi:       { label: "ROI withdraw",     sign: "+", grp: "wd" },
  principal: { label: "Principal exit",   sign: "+", grp: "wd" },
  refin:     { label: "Referral earned",  sign: "+", grp: "ref" },
  refwd:     { label: "Referral withdraw", sign: "+", grp: "ref" },
};
const H_TABS = [["all", "All"], ["dep", "Deposits"], ["wd", "Withdrawals"], ["ref", "Referral"]];

function fmtWhen(t) {
  if (!t) return "";
  try { return new Date(t * 1000).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

/** Browser fallback: chunked eth_getLogs for the wallet's own events. */
async function fetchHistoryLogs(addr) {
  const F = S.nox.filters;
  const filters = [
    ["deposit", F.Deposited(addr)], ["roi", F.ROIWithdrawn(addr)], ["principal", F.PrincipalWithdrawn(addr)],
    ["refwd", F.ReferralWithdrawn(addr)], ["refin", F.ReferralPaid(addr)],
  ];
  const head = await S.read.getBlockNumber();
  const start = CFG.DEPLOY_BLOCK || Math.max(0, head - 300000);
  const out = [];
  for (const [type, f] of filters) {
    let logs;
    try { logs = await withRetry(() => S.nox.queryFilter(f, start, "latest")); }
    catch {
      logs = [];
      for (let b = start; b <= head; b += 4000) logs.push(...await withRetry(() => S.nox.queryFilter(f, b, Math.min(b + 3999, head))));
    }
    for (const lg of logs) {
      const a = lg.args, r = { type, block: lg.blockNumber, li: lg.index ?? 0, tx: lg.transactionHash, time: 0 };
      if (type === "principal") { r.principal = a.principal; r.roi = a.roi; r.amount = a.principal + a.roi; r.index = Number(a.depositIndex); }
      else { r.amount = a.amount; }
      if (type === "deposit" || type === "roi") r.index = Number(a.depositIndex);
      if (type === "roi") r.days = Number(a.daysClaimed);
      if (type === "refin") { r.from = a.depositor; r.level = Number(a.level); }
      out.push(r);
    }
  }
  return out.sort((x, y) => y.block - x.block || y.li - x.li);
}

async function loadHistory(force) {
  if (!Wallet.address || !S.deployed || H.loading) return;
  if (!force && H.for === Wallet.address) return;
  const who = Wallet.address;
  H.loading = true; H.err = false;
  setText("#histNote", "Loading your on-chain activity…");
  try {
    let rows = null;
    try {
      const res = await fetch("/api/history?address=" + who, { cache: "no-store" });
      const j = await res.json();
      if (j?.ok) rows = j.rows.map((r) => ({ ...r, amount: BigInt(r.amount), principal: r.principal ? BigInt(r.principal) : 0n, roi: r.roi ? BigInt(r.roi) : 0n }));
    } catch (e) { console.warn("history api", e); }
    if (!rows) rows = await fetchHistoryLogs(who);
    if (who !== Wallet.address) return; // wallet switched mid-load
    const t = { deposit: 0n, roi: 0n, principal: 0n, refin: 0n, refwd: 0n };
    for (const r of rows) {
      if (r.type === "principal") { t.principal += r.principal; t.roi += r.roi; }
      else t[r.type] += r.amount;
    }
    H.rows = rows; H.totals = t; H.for = who;
    setText("#histNote", "Every row is an on-chain event. Tap one to open it on BscScan.");
  } catch (e) {
    console.warn("history", e);
    H.err = true;
    setText("#histNote", "Could not load history right now — press Reload.");
  } finally {
    H.loading = false;
  }
  renderHistory();
}

function renderHistory() {
  const t = H.totals;
  if (t) {
    setText("#hDep", "$" + fmt(toNum(t.deposit)));
    setText("#hRoi", "$" + fmt(toNum(t.roi)));
    setText("#hPrin", "$" + fmt(toNum(t.principal)));
    setText("#hRefIn", "$" + fmt(toNum(t.refin)));
    setText("#hRefWd", "$" + fmt(toNum(t.refwd)));
  }
  const tabs = $("#histTabs");
  if (tabs) {
    tabs.innerHTML = "";
    for (const [k, name] of H_TABS) {
      const n = k === "all" ? H.rows.length : H.rows.filter((r) => H_TYPES[r.type]?.grp === k).length;
      const b = el("button", "hist__tab" + (H.tab === k ? " is-on" : ""), `${name} <span class="mono">${n}</span>`);
      b.type = "button";
      b.onclick = () => { H.tab = k; renderHistory(); };
      tabs.appendChild(b);
    }
  }
  const list = $("#histList"); if (!list) return;
  list.innerHTML = "";
  const shown = H.tab === "all" ? H.rows : H.rows.filter((r) => H_TYPES[r.type]?.grp === H.tab);
  if (!shown.length) {
    list.appendChild(el("li", "down__empty", H.err ? "History unavailable — press Reload." : H.rows.length ? "Nothing in this category yet." : "No transactions yet — your deposits and withdrawals will show here."));
    return;
  }
  shown.slice(0, 300).forEach((r) => {
    const m = H_TYPES[r.type] || { label: r.type, sign: "" };
    let info = "";
    if (r.type === "deposit") info = `Position #${(r.index ?? 0) + 1}`;
    else if (r.type === "roi") info = `Position #${(r.index ?? 0) + 1} · ${r.days || 0} day${r.days === 1 ? "" : "s"}`;
    else if (r.type === "principal") info = `Position #${(r.index ?? 0) + 1} · $${fmt(toNum(r.principal))} + $${fmt(toNum(r.roi))} ROI`;
    else if (r.type === "refin") info = `L${r.level} · from ${shortAddr(r.from, 4)}`;
    else if (r.type === "refwd") info = "Referral balance to wallet";
    const li = el("li");
    li.innerHTML = `<a class="hist__row" target="_blank" rel="noopener" href="${scanTx(r.tx)}">
      <span class="hist__type hist__type--${r.type}">${m.label}</span>
      <span class="hist__info">${info}<small>${r.time ? fmtWhen(r.time) : "Block " + r.block}</small></span>
      <span class="hist__amt${m.sign === "+" ? " hist__amt--in" : ""}">${m.sign}$${fmt(toNum(r.amount))}</span></a>`;
    list.appendChild(li);
  });
}

/* ═══════════════════ RENDER: REFERRAL ═══════════════════ */
function refBase() {
  return location.origin + location.pathname.replace(/index\.html$/, "");
}
function renderReferral() {
  const u = S.user;
  const input = $("#refLink");
  if (!Wallet.address) {
    input.value = "Connect wallet to generate link";
    return;
  }
  const id = u?.username || Wallet.address;
  const link = `${refBase()}?ref=${id}`;
  input.value = link;

  const text = encodeURIComponent(CFG.SHARE_TEXT + " ");
  $("#shareX").href = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`;
  $("#shareTg").href = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
  $("#shareWa").dataset.link = `https://wa.me/?text=${text}${encodeURIComponent(link)}`;

  if (!u) return;
  loadDownline();
  loadHistory();
  setText("#refBalVal", "");
  $("#refBalVal").innerHTML = `${fmt(u.refBal)} <i>USDT</i>`;
  setText("#refLifetime", fmt(u.refEarned) + " USDT");
  $("#withdrawRefBtn").disabled = u.refBal <= 0;

  // username state
  const owned = !!u.username;
  $("#usernameOwned").hidden = !owned;
  $("#usernameForm").hidden = owned;
  if (owned) setText("#usernameVal", u.username);

  // upline
  const ul = $("#uplineList");
  const chain = (u.upline || []).filter((x) => x && x !== ZERO);
  ul.innerHTML = "";
  if (!chain.length) {
    ul.appendChild(el("li", "upline__empty", u.locked ? "No upline — you are a root account." : "No upline yet."));
  } else {
    chain.forEach((addr, i) => {
      const li = el("li");
      li.innerHTML = `<span>${shortAddr(addr, 6)}</span><b style="margin-left:auto;color:var(--violet-300)">${(P.REF[i] / 100).toFixed(1)}%</b>`;
      ul.appendChild(li);
    });
  }

  // referrer lock hint
  setText("#refLockHint", u.locked
    ? (u.upline?.[0] && u.upline[0] !== ZERO ? "locked · " + shortAddr(u.upline[0]) : "locked · none")
    : "optional · locked on first deposit");
  $("#refInput").disabled = !!u.locked;
  
  // an on-chain lock makes the input irrelevant — never block the deposit on it
  if (u.locked) {
    S.refResolved = null;
    hideRefNotice();
    // Clear any stored referrer (including "god" default) if user already has on-chain referrer
    $("#refInput").value = "";
    localStorage.removeItem(LS.ref);
  }
}

/* ═══════════════════ RENDER: STAKE PANEL ═══════════════════ */
function renderStakeSide() {
  const u = S.user;
  setText("#usdtBal", u ? fmt(u.usdt) : "—");
  setText("#allowanceVal", u ? fmt(u.allowance) : "—");
  validateStake();
}

function amountIn() {
  const raw = ($("#amountInput").value || "").replace(/,/g, "").trim();
  const v = Number(raw);
  return isFinite(v) && v > 0 ? v : 0;
}

function renderSummary() {
  const a = amountIn();
  setText("#sumDaily", fmt(a * DAILY) + " USDT");
  setText("#sum45", fmt(a * DAILY * P.LOCK_DAYS) + " USDT");
  setText("#sum365", fmt(a * DAILY * P.MAX_ROI_DAYS) + " USDT");
  setText("#sumPrincipal", fmt(a) + " USDT");
}

/** Everything that gates approve / deposit for the current amount. */
function stakeState() {
  const a = amountIn();
  const u = S.user;
  if (!Wallet.ok || !S.deployed || !u || a <= 0) return null;
  const needsApproval = u.allowance < a - 1e-9;
  const funded = u.usdt >= a - 1e-9;
  const minOk = a >= P.MIN_DEPOSIT;
  const slots = u.count < P.MAX_POSITIONS;
  const refOk = !(S.refInput.length > 0 && S.refResolved === false);
  // Deposits ADD liquidity (5% fee), they never require pool funds
  const poolOk = true;
  // No minimum-BNB gate: the wallet/network rejects the tx with a gas error if BNB is missing.
  return { a, needsApproval, funded, minOk, slots, refOk, poolOk,
    canApprove: needsApproval && funded && minOk,
    canDeposit: !needsApproval && funded && minOk && slots && refOk && poolOk };
}

function setStakeHint(text, kind = "") {
  const h = $("#stakeHint");
  if (!h) return;
  h.textContent = text;
  h.hidden = !text;
  h.className = "stake__hint" + (kind ? " stake__hint--" + kind : "");
}

function validateStake() {
  const approveBtn = $("#approveBtn"), depositBtn = $("#depositBtn");
  renderSummary();
  const st = stakeState();

  // the button the user must press next is always the highlighted one
  const mark = (next) => {
    approveBtn.classList.toggle("btn--primary", next === "approve");
    approveBtn.classList.toggle("btn--ghost", next !== "approve");
    depositBtn.classList.toggle("btn--primary", next !== "approve");
    depositBtn.classList.toggle("btn--ghost", next === "approve");
    approveBtn.classList.toggle("is-next", next === "approve");
    depositBtn.classList.toggle("is-next", next === "deposit");
  };

  if (!st) {
    approveBtn.disabled = true; depositBtn.disabled = true;
    mark("approve");
    setStakeHint("");
    return;
  }
  const { needsApproval, funded, minOk, slots, refOk, poolOk } = st;

  approveBtn.disabled = !st.canApprove;
  depositBtn.disabled = !st.canDeposit;
  mark(needsApproval ? "approve" : "deposit");

  approveBtn.querySelector("span").textContent = needsApproval ? "1 · Approve USDT" : "1 · Approved ✓";
  depositBtn.querySelector("span").textContent =
    !funded ? "Insufficient USDT" :
    !minOk ? `Min ${P.MIN_DEPOSIT} USDT` :
    !slots ? "Position limit reached" : "2 · Deposit";

  if (!funded || !minOk || !slots) setStakeHint("");
  else if (!refOk) setStakeHint("Fix or remove the referrer above to continue.", "warn");
  else if (needsApproval) setStakeHint("Step 1 of 2 — approve USDT. The deposit prompt opens right after.");
  else setStakeHint("Approved ✓ — step 2 of 2: press Deposit to create your position.", "go");
}

/* ═══════════════════ REFERRER RESOLUTION ═══════════════════ */
let refTimer;

/** Show the "remove referrer" escape hatch when the input cannot be used. */
function showRefNotice(msg) {
  setText("#refNoticeText", msg);
  $("#refNotice").hidden = false;
}
function hideRefNotice() {
  $("#refNotice").hidden = true;
}

/** Drop the referrer entirely: input, stored link and resolution state. */
function clearReferrer() {
  clearTimeout(refTimer);
  localStorage.removeItem(LS.ref);
  const input = $("#refInput");
  input.value = "";
  S.refInput = "";
  S.refResolved = null;
  const st = $("#refStatus");
  st.textContent = ""; st.className = "field__suffix field__suffix--status";
  hideRefNotice();
  validateStake();
  toast("Referrer removed", "You can deposit without a referrer.", "ok", 3200);
  input.focus();
}

async function checkReferrer() {
  const raw = ($("#refInput").value || "").trim();
  S.refInput = raw;
  const st = $("#refStatus");
  S.refResolved = null;

  const bad = (label, msg) => {
    st.textContent = label; st.className = "field__suffix field__suffix--status is-bad";
    S.refResolved = false;
    showRefNotice(msg);
    validateStake();
  };

  if (!raw) {
    st.textContent = ""; st.className = "field__suffix field__suffix--status";
    hideRefNotice(); validateStake(); return;
  }
  st.textContent = "checking…"; st.className = "field__suffix field__suffix--status is-wait";
  hideRefNotice();

  try {
    let addr = null;
    if (isAddr(raw)) addr = ethers.getAddress(raw);
    else if (S.deployed) addr = await S.nox.usernameToAddress(raw.toLowerCase());

    if (!addr || addr === ZERO) {
      return bad("not found", `“${raw}” is not a registered username or address — deposits are blocked until it is fixed or removed.`);
    }
    if (Wallet.address && addr.toLowerCase() === Wallet.address.toLowerCase()) {
      // self-referral: drop it silently and let the user continue without a referrer
      localStorage.removeItem(LS.ref);
      $("#refInput").value = "";
      S.refInput = ""; S.refResolved = null;
      st.textContent = ""; st.className = "field__suffix field__suffix--status";
      hideRefNotice(); validateStake();
      toast("Self-referral removed", "You can't refer yourself — continuing without a referrer.", "info", 3600);
      return;
    }
    const active = await S.nox.totalDeposited(addr);
    if (active === 0n) {
      return bad("not a depositor", "This address has never deposited, so it cannot be your referrer.");
    }
    st.textContent = "✓ " + shortAddr(addr);
    st.className = "field__suffix field__suffix--status is-ok";
    S.refResolved = addr;
    hideRefNotice();
  } catch (e) {
    st.textContent = "unverified"; st.className = "field__suffix field__suffix--status is-wait";
    S.refResolved = null;
    hideRefNotice();
  }
  validateStake();
}

/* ═══════════════════ USERNAME AVAILABILITY ═══════════════════ */
let unameTimer;
async function checkUsername() {
  const v = ($("#usernameInput").value || "").trim().toLowerCase();
  const st = $("#usernameStatus"), btn = $("#claimUserBtn");
  btn.disabled = true;
  if (!v) { st.textContent = ""; st.className = "field__suffix field__suffix--status"; return; }

  if (v.length < 3 || v.length > 20) { st.textContent = "3–20 chars"; st.className = "field__suffix field__suffix--status is-bad"; return; }
  if (!/^[a-z0-9]+$/.test(v)) { st.textContent = "a-z 0-9 only"; st.className = "field__suffix field__suffix--status is-bad"; return; }
  if (v.startsWith("0x")) { st.textContent = "cannot start 0x"; st.className = "field__suffix field__suffix--status is-bad"; return; }
  if (!S.deployed) return;

  st.textContent = "checking…"; st.className = "field__suffix field__suffix--status is-wait";
  try {
    const taken = await S.nox.usernameToAddress(v);
    if (taken && taken !== ZERO) { st.textContent = "taken"; st.className = "field__suffix field__suffix--status is-bad"; return; }
    st.textContent = "available"; st.className = "field__suffix field__suffix--status is-ok";
    btn.disabled = !Wallet.ok;
  } catch { st.textContent = ""; }
}

/* ═══════════════════ TRANSACTIONS ═══════════════════ */
async function guard() {
  if (!S.deployed) { toast("Not configured", "Contract address missing.", "err"); return false; }
  if (!Wallet.address) { Wallet.renderList(); openModal("#walletModal"); return false; }
  if (Wallet.chainId !== CFG.CHAIN.id) {
    toast("Wrong network", "Switching to BNB Smart Chain…", "info");
    await Wallet.switchChain();
    return false;
  }
  bindSigner();
  return !!S.noxW;
}

/**
 * Fast receipt watcher. The injected wallet provider polls slowly (≈4s) and
 * often lags a block or two, so we poll our own low-latency RPC every
 * CFG.RECEIPT_POLL_MS and race it against the wallet's own wait().
 * BSC blocks land in ~0.75–3s, so this usually resolves on the first or
 * second tick instead of waiting out a wallet polling window.
 */
function waitFast(tx) {
  const started = Date.now();
  const rpcWatch = new Promise((resolve, reject) => {
    const tick = async () => {
      if (Date.now() - started > CFG.RECEIPT_TIMEOUT_MS) return reject(new Error("timeout"));
      try {
        const r = await S.read.getTransactionReceipt(tx.hash);
        if (r && r.blockNumber != null) {
          if (r.status === 0) return reject(Object.assign(new Error("Transaction reverted on-chain"), { receipt: r }));
          return resolve(r);
        }
      } catch { /* transient RPC hiccup — keep polling */ }
      setTimeout(tick, CFG.RECEIPT_POLL_MS);
    };
    tick();
  });
  // whichever confirms first wins. Some dapp-browser providers throw spurious
  // errors from wait() (polling glitches) — only trust it when it succeeds or
  // reports a real revert; otherwise keep waiting on our own RPC.
  const walletWatch = tx.wait(1).catch((e) => {
    // sped-up / repriced in the wallet: the replacement is what counts
    if (e?.code === "TRANSACTION_REPLACED" && !e.cancelled && e.receipt) return e.receipt;
    if (e?.code === "TRANSACTION_REPLACED" && e.cancelled) return Promise.reject(Object.assign(new Error("Transaction was cancelled in your wallet."), { receipt: e.receipt }));
    return e?.receipt?.status === 0 || /revert|CALL_EXCEPTION/i.test(String(e?.code || e?.message)) ? Promise.reject(e) : new Promise(() => {});
  });
  return Promise.race([rpcWatch, walletWatch]);
}

/** Resolve within `ms`, never reject — keeps the modal from hanging on slow RPCs. */
function soft(p, ms) {
  return Promise.race([Promise.resolve(p).catch(() => null), new Promise((r) => setTimeout(() => r(null), ms))]);
}

/**
 * Nudge the Telegram worker so the group announcement lands within seconds
 * instead of waiting for the scheduled run. Fire-and-forget, retried a couple
 * of times because the log has to be mined before it can be read.
 */
function pingNotifier() {
  const hit = () =>
    fetch("/api/notify", { method: "POST", cache: "no-store", keepalive: true }).catch(() => {});
  hit();
  setTimeout(hit, 7000);
  setTimeout(hit, 20000);
}

/**
 * Runs one transaction through the modal. Resolves true on success, false on
 * any failure/rejection. `opts.chain` keeps the modal open (no success flash)
 * and waits for fresh on-chain state so a follow-up tx can start immediately.
 */
/* ── pending-tx journal: a broadcast tx is never forgotten, even across reloads ── */
const PENDING_KEY = "nox.pendingTx";
const pendList = () => { try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch { return []; } };
const pendSave = (l) => { try { localStorage.setItem(PENDING_KEY, JSON.stringify(l.slice(-10))); } catch {} };
const pendAdd = (hash, label) => pendSave([...pendList().filter((p) => p.hash !== hash), { hash, label, ts: Date.now() }]);
const pendDel = (hash) => pendSave(pendList().filter((p) => p.hash !== hash));

/** Watch a tx hash until it lands (no timeout); used after a UI timeout and on reload. */
function watchBackground(hash, label) {
  const t0 = Date.now();
  const tick = async () => {
    if (Date.now() - t0 > 30 * 60 * 1000) return pendDel(hash); // give up after 30 min
    try {
      const r = await S.read.getTransactionReceipt(hash);
      if (r && r.blockNumber != null) {
        pendDel(hash);
        if (r.status === 1) {
          toast(label + " confirmed ✓", "Your transaction was mined successfully.", "ok", 6000);
          pingNotifier();
        } else toast(label + " reverted", "The transaction failed on-chain. No funds were moved except gas.", "err", 0);
        loadUser(true); loadGlobal();
        return;
      }
    } catch {}
    setTimeout(tick, 3000);
  };
  tick();
}
function resumePending() {
  for (const p of pendList()) watchBackground(p.hash, p.label || "Transaction");
}

const isReject = (e) => e?.code === "ACTION_REJECTED" || e?.code === 4001 || e?.info?.error?.code === 4001 ||
  /user rejected|denied transaction|User denied|rejected the request|cancel/i.test(String(e?.message || e?.shortMessage || ""));

async function run(btn, label, msg, fn, okTitle, okMsg, opts = {}) {
  if (!(await guard())) return false;
  btn?.classList.add("is-busy");
  TX.open(label, msg);
  let tx = null;
  try {
    try {
      tx = await fn();
    } catch (e) {
      // Some dapp browsers broadcast the tx but then throw (RPC glitch, app switch).
      // Before reporting failure, check whether the action actually landed on-chain.
      if (!isReject(e) && opts.verify) {
        TX.pending(null, "Wallet returned an error — checking the chain to make sure nothing was lost…");
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 2500));
          if (await soft(opts.verify(), 4000)) {
            TX.ok(okTitle, okMsg, null); toast(okTitle, okMsg, "ok");
            pingNotifier(); loadUser(true); loadGlobal(); setTimeout(() => loadHistory(true), 2500);
            return true;
          }
        }
      }
      throw e;
    }
    pendAdd(tx.hash, okTitle);
    TX.pending(tx.hash, "Confirming on BNB Chain — usually under 3 seconds…");
    let rec;
    try {
      rec = await waitFast(tx);
    } catch (e) {
      if (/timeout/i.test(e?.message)) {
        // never report a broadcast tx as failed just because it is slow
        watchBackground(tx.hash, okTitle);
        TX.ok("Still confirming…", "Your transaction is broadcast and will complete on its own. We'll notify you here — you can safely close this.", tx.hash);
        toast("Transaction pending", "Network is slow — we're still tracking it.", "info", 6000);
        return false;
      }
      throw e;
    }
    pendDel(tx.hash);
    setTimeout(() => loadHistory(true), 2500);

    if (opts.chain) {
      TX.pending(rec?.hash || tx.hash, `${okTitle} — preparing the next step…`);
      if (opts.after) await soft(opts.after(), 2500);
      loadUser(true);
    } else {
      // show success immediately; refresh state in the background
      TX.ok(okTitle, okMsg, rec?.hash || tx.hash);
      toast(okTitle, okMsg, "ok");
      loadUser(true);
    }
    pingNotifier();
    loadGlobal();
    return true;
  } catch (e) {
    if (tx?.hash && !e?.receipt) { watchBackground(tx.hash, okTitle); } // unknown outcome — keep tracking
    else if (tx?.hash) pendDel(tx.hash);
    const m = errMsg(e);
    TX.fail(isReject(e) ? "You rejected the request in your wallet. Nothing was sent." : m);
    if (tx?.hash) { const a = $("#txLink"); a.href = scanTx(tx.hash); a.hidden = false; }
    toast("Failed", m, "err");
    loadUser(true);
    return false;
  } finally {
    btn?.classList.remove("is-busy");
  }
}

async function approve() {
  const a = amountIn();
  if (a <= 0) return;
  const amount = parseAmt(a);
  const ok = await run($("#approveBtn"), "Step 1 of 2 · Approve USDT",
    "Confirm the approval in your wallet. The deposit prompt follows automatically.",
    () => S.usdtW.approve(S.address, amount), "Approval confirmed", `${fmt(a)} USDT approved`,
    { chain: true, after: async () => {
      const al = await S.usdt.allowance(Wallet.address, S.address);
      if (S.user) S.user.allowance = Math.max(toNum(al), S.user.allowance || 0);
    } });
  if (!ok) return;

  // RPC nodes can lag a block: trust the confirmed receipt over a stale read
  if (S.user && S.user.allowance < a) S.user.allowance = a;
  renderStakeSide();

  // flow straight into step 2 so the approval is never left dangling.
  // Mobile dapp browsers can silently drop a wallet request that isn't tied to
  // a tap, so step 2 is offered as a real button AND auto-fires after a moment.
  const st = stakeState();
  if (st && st.canDeposit && amountIn() === a) {
    let started = false;
    const go = () => { if (started) return; started = true; depositNow({ step: "Step 2 of 2 · " }); };
    TX.next("Approved ✓", `Step 2 of 2 — confirm the deposit of ${fmt(a)} USDT.`, "Continue → Deposit", go);
    setTimeout(() => { if (!$("#txModal").hidden) go(); }, 1200); // skipped if the user closed the modal
  } else {
    closeModal("#txModal");
    validateStake();
    toast("Approved ✓", st && !st.refOk ? "Fix the referrer, then press Deposit." : "Now press Deposit to finish.", "ok");
  }
}

async function depositNow(opts = {}) {
  const a = amountIn();
  if (a <= 0) return;
  
  // Pre-flight validation
  const st = stakeState();
  if (!st || !st.canDeposit) {
    const reason = !st ? "Not ready" :
      !st.funded ? "insufficient USDT balance" :
      !st.minOk ? `minimum deposit is ${P.MIN_DEPOSIT} USDT` :
      !st.slots ? "position limit reached" :
      !st.poolOk ? "pool liquidity too low" :
      !st.refOk ? "invalid referrer" : "unknown error";
    toast("Cannot deposit", `Transaction blocked: ${reason}`, "err");
    TX._reset(); TX.state = "idle"; closeModal("#txModal");
    return;
  }
  
  const amount = parseAmt(a);
  const raw = ($("#refInput").value || "").trim();
  
  // If input is empty but "god" is stored as silent default, use it
  const storedRef = localStorage.getItem(LS.ref);
  const effectiveRef = raw || (storedRef === "god" && !S.user?.locked ? "god" : "");

  // referrer was already verified by checkReferrer(); an on-chain lock ignores it anyway
  let method, args;
  if (S.user?.locked) {
    method = "deposit";
    args = [amount, ZERO];
  }
  else if (!effectiveRef) {
    // No referrer entered or captured from URL → deposit without referrer
    method = "deposit";
    args = [amount, ZERO];
  }
  else if (isAddr(effectiveRef)) {
    method = "deposit";
    args = [amount, ethers.getAddress(effectiveRef)];
  }
  else {
    method = "depositWithUsername";
    args = [amount, effectiveRef.toLowerCase()];
  }

  // Simulate first: a contract revert is caught here, before the user pays gas.
  // Pure RPC/network errors don't block — the wallet will still estimate.
  try {
    await Promise.race([
      S.noxW[method].staticCall(...args).then(() => true, (e) => {
        if (e?.code === "CALL_EXCEPTION" && (e.reason || e.revert || /NoxFund/.test(String(e.message)))) throw e;
        return true;
      }),
      new Promise((r) => setTimeout(() => r(true), 6000)),
    ]);
  } catch (e) {
    const m = errMsg(e);
    toast("Deposit would fail", m, "err", 8000);
    TX._reset(); TX.state = "idle"; closeModal("#txModal");
    validateStake();
    return;
  }

  // snapshot so we can prove a deposit landed even if the wallet errors out
  const before = S.user?.count ?? null;
  const verify = async () => before != null &&
    Number(await S.nox.depositCount(Wallet.address)) > before;

  const ok = await run($("#depositBtn"), (opts.step || "") + "Create position",
    `Confirm the deposit of ${fmt(a)} USDT in your wallet.`, () => S.noxW[method](...args),
    "Position created", `${fmt(a)} USDT now earning 1.5% daily`, { verify });
  if (ok) {
    $("#amountInput").value = "";
    renderSummary();
    validateStake();
  } else {
    // approval stays valid — make the retry obvious
    validateStake();
  }
}

async function claimROI(i) {
  await run(null, "Claim ROI", `Claiming ROI for position #${i}.`,
    () => S.noxW.withdrawROI(i), "ROI claimed", `Position #${i} payout sent`);
}

async function claimAll() {
  await run($("#claimAllBtn"), "Claim all ROI", "Claiming across every position.",
    () => S.noxW.withdrawAllROI(), "ROI claimed", "All available ROI withdrawn");
}

async function withdrawPrincipal(i) {
  await run(null, "Withdraw capital", `Releasing principal from position #${i}.`,
    () => S.noxW.withdrawPrincipal(i), "Capital withdrawn", `Position #${i} principal returned`);
}

async function withdrawRef() {
  await run($("#withdrawRefBtn"), "Withdraw commissions", "Sending your referral balance.",
    () => S.noxW.withdrawReferral(), "Commissions withdrawn", "Referral balance paid out");
}

function shareReferralLink() {
  const link = $("#refLink").value;
  
  if (!link || link === "Connect wallet to generate link") {
    toast("No link to share", "Connect your wallet first to generate your referral link.", "warn", 3000);
    return;
  }
  
  // Try native share API first (works on mobile)
  if (navigator.share) {
    navigator.share({
      title: 'NOX FUND - Earn 1.5% Daily',
      text: 'Join NOX FUND and earn 1.5% daily on USDT deposits. Trustless, audited, ownerless protocol on BNB Chain.',
      url: link
    }).catch(() => {
      // Fallback to copy if share is cancelled
      copy(link, "Referral link copied");
    });
  } else {
    // Fallback: just copy the link
    copy(link, "Referral link copied");
  }
}

async function claimUsername() {
  const v = ($("#usernameInput").value || "").trim().toLowerCase();
  if (!v) return;
  await run($("#claimUserBtn"), "Claim username", `Registering “${v}”.`,
    () => S.noxW.claimUsername(v), "Username claimed", `@${v} is now yours`);
  $("#usernameInput").value = "";
}

/* ═══════════════════ WALLET UI ═══════════════════ */
function updateWalletUI() {
  const btn = $("#connectBtn"), lbl = $("#connectLabel"), pill = $("#netPill");
  const wrong = Wallet.address && Wallet.chainId !== CFG.CHAIN.id;

  if (!Wallet.address) {
    lbl.textContent = "Connect";
    pill.classList.remove("is-wrong");
    setText("#netPillText", CFG.CHAIN.short);
  } else if (wrong) {
    lbl.textContent = "Wrong Network";
    pill.classList.add("is-wrong");
    setText("#netPillText", "SWITCH TO BNB");
  } else {
    lbl.textContent = S.user?.username ? "@" + S.user.username : shortAddr(Wallet.address);
    pill.classList.remove("is-wrong");
    setText("#netPillText", CFG.CHAIN.short);
  }

  // network banner
  const b = $("#banner");
  if (wrong) {
    b.hidden = false;
    setText("#bannerText", "You are connected to the wrong network — NOX Fund runs on BNB Smart Chain");
    const act = $("#bannerAction");
    act.hidden = false; act.textContent = "Switch Network";
    act.onclick = () => Wallet.switchChain();
  } else if (S.deployed) {
    b.hidden = true;
  }

  // account modal content
  if (Wallet.address) {
    setText("#acctAddr", Wallet.address);
    setText("#acctWallet", Wallet.label || "Connected");
    setText("#acctUsdt", S.user ? fmt(S.user.usdt) : "—");
    setText("#acctBnb", S.user ? S.user.bnb.toFixed(4) : "—");
    $("#viewScan").href = scanAddr(Wallet.address);
    $("#acctAvatar").style.background =
      `linear-gradient(135deg,#${Wallet.address.slice(2, 8)},#${Wallet.address.slice(-6)})`;
  }
}

/* ═══════════════════ CALCULATOR ═══════════════════ */
function initCalc() {
  const amt = $("#calcAmount"), days = $("#calcDays");
  const chart = $("#calcChart");
  for (let i = 0; i < 28; i++) chart.appendChild(el("i"));

  const render = () => {
    const a = Number(amt.value), d = Number(days.value);
    setText("#calcAmtLabel", fmt(a, 0) + " USDT");
    setText("#calcDaysLabel", d + (d === 1 ? " day" : " days"));
    const daily = a * DAILY;
    const total = daily * d;
    setText("#calcDaily", fmt(daily));
    setText("#calcWeekly", fmt(daily * 7));
    setText("#calcMonthly", fmt(daily * 30));
    setText("#calcTotal", fmt(total));
    setText("#calcPct", ((total / a) * 100).toFixed(2) + "%");
    setText("#calcPrincipal", fmt(a) + " USDT");
    setText("#calcGross", fmt(a + total) + " USDT");

    const bars = $$("i", chart);
    bars.forEach((b, i) => {
      const step = Math.round(((i + 1) / bars.length) * d);
      const h = (step / P.MAX_ROI_DAYS) * 100;
      b.style.height = Math.max(2, Math.min(100, h * (100 / Math.max(8, (d / P.MAX_ROI_DAYS) * 100)))) + "%";
      b.style.opacity = String(0.35 + (i / bars.length) * 0.65);
    });
  };
  on(amt, "input", render);
  on(days, "input", render);
  render();
}

/* ═══════════════════ REFERRAL CAPTURE ═══════════════════ */
function captureRef() {
  const q = new URLSearchParams(location.search);
  let r = q.get("ref") || q.get("r");
  if (!r && location.hash.startsWith("#ref=")) r = location.hash.slice(5);
  const prev = localStorage.getItem(LS.ref);
  if (r) {
    r = r.trim();
    // first referrer wins — never overwrite an already-set referral
    if (prev) r = null;
    else localStorage.setItem(LS.ref, r);
  }
  const stored = localStorage.getItem(LS.ref);
  if (stored && stored !== "god") {
    // Show explicitly set referrers in the input field
    $("#refInput").value = stored;
    clearTimeout(refTimer);
    refTimer = setTimeout(checkReferrer, 400);
    if (r) toast("Referral applied", isAddr(stored) ? shortAddr(stored, 6) : "@" + stored, "info", 4200);
  } else if (!stored) {
    // Set "god" as silent default - stored but not shown in UI
    localStorage.setItem(LS.ref, "god");
  }
  // If stored === "god", keep the input empty (silent background default)
}

/* ═══════════════════ EVENTS / BOOT ═══════════════════ */
function initEvents() {
  on($("#connectBtn"), "click", () => {
    if (!Wallet.address) { Wallet.renderList(); openModal("#walletModal"); }
    else if (Wallet.chainId !== CFG.CHAIN.id) Wallet.switchChain();
    else openModal("#accountModal");
  });
  on($("#netPill"), "click", () => { if (Wallet.chainId !== CFG.CHAIN.id) Wallet.switchChain(); });
  on($("#disconnectBtn"), "click", () => { Wallet.disconnect(); closeModal("#accountModal"); });
  on($("#copyAddr"), "click", () => copy(Wallet.address || "", "Address copied"));

  // stake
  on($("#amountInput"), "input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    validateStake();
  });
  $$("[data-amt]").forEach((c) => on(c, "click", () => {
    const v = c.dataset.amt;
    if (v === "max") $("#amountInput").value = S.user ? String(Math.floor(S.user.usdt * 1e6) / 1e6) : "0";
    else $("#amountInput").value = v;
    validateStake();
  }));
  on($("#refInput"), "input", () => { clearTimeout(refTimer); hideRefNotice(); refTimer = setTimeout(checkReferrer, 450); });
  on($("#refClear"), "click", clearReferrer);
  on($("#approveBtn"), "click", approve);
  on($("#depositBtn"), "click", depositNow);

  // portfolio
  on($("#refreshBtn"), "click", async (e) => {
    e.currentTarget.classList.add("is-busy");
    await Promise.all([loadUser(), loadGlobal()]);
    e.currentTarget.classList.remove("is-busy");
    toast("Refreshed", "On-chain data is up to date.", "ok", 2400);
  });
  on($("#claimAllBtn"), "click", claimAll);
  $$(".filter").forEach((f) => on(f, "click", () => {
    $$(".filter").forEach((x) => x.classList.remove("is-active"));
    f.classList.add("is-active");
    S.filter = f.dataset.filter;
    renderPositions();
  }));

  // referral
  on($("#copyLink"), "click", () => copy($("#refLink").value, "Referral link copied"));
  on($("#shareRef"), "click", shareReferralLink);
  on($("#downReload"), "click", () => loadDownline(true));
  on($("#histReload"), "click", () => loadHistory(true));
  on($("#refLink"), "click", (e) => e.target.select());
  on($("#shareWa"), "click", (e) => { const l = e.currentTarget.dataset.link; if (l) window.open(l, "_blank", "noopener"); });
  on($("#withdrawRefBtn"), "click", withdrawRef);
  on($("#usernameInput"), "input", (e) => {
    e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
    clearTimeout(unameTimer); unameTimer = setTimeout(checkUsername, 420);
  });
  on($("#claimUserBtn"), "click", claimUsername);
}

async function boot() {
  if (typeof ethers === "undefined") {
    toast("Library failed to load", "ethers.js could not be fetched — check your connection.", "err", 0);
    return;
  }
  initChrome();
  initProviders();
  initCalc();
  initEvents();
  Wallet.init();

  Wallet.onChange(() => { bindSigner(); loadUser(); renderReferral(); updateWalletUI(); });

  captureRef();
  resumePending();
  updateWalletUI();
  await loadGlobal();
  await Wallet.restore();
  
  // live accrual ticker
  setInterval(tickLive, 1000);
  // chain polling (paused while the tab is hidden)
  setInterval(() => {
    if (document.hidden) return;
    loadGlobal();
    if (Wallet.address) loadUser(true);
  }, CFG.POLL_MS);
  on(document, "visibilitychange", () => {
    if (!document.hidden) {
      loadGlobal();
      if (Wallet.address) loadUser(true);
    }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
