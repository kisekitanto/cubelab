/* =====================================================================
   CubeLab – app.js
   Everything runs in the browser (no build step). Read it top to bottom, or search
   for one of the headings below to jump to a part.

   Quick map, in file order:
   DATA ............................ notation text and the algorithm lists (variable M)
     cube simulator + diagrams ..... how the case pictures are drawn
     fastest-cross finder .......... the "Show fastest cross" button
     edit / add your own algs ...... ✎ Edit and ＋ Add another way
     scramble library .............. Scrambles page
     interactive 3D cube ........... drag-to-rotate cube and the ▶ Watch player
     beginner lessons .............. the LS array = the 7 beginner steps
     advanced sets ................. OLLS (57 OLL), PLL list, F2L list (F2), Roux/ZZ sets, ZBLL
   STATE / NAV / LEARN / ALGS ...... app state, the tabs, and the algorithm pages
   TIMER ........................... desktop timer: settings, state machine, scrambles, stats
   TRAINER ......................... Recognize, Practice, Quiz, My progress + the Smart queue
   BLINDFOLD ....................... Old Pochmann memo + solve
   ZBLL page, 2-look OLL lessons ... extra learning pages
   MOBILE TIMER, SOLVES, PROGRESS .. phone timer, solve list, chart, and the data bundle
                                     (bkData / mergeIn) that is saved to your account
   CUSTOMIZE ....................... colors, looks, timer style, and the Hu Tao theme
   SUPABASE ACCOUNT + CLOUD SYNC ... login, saving to and restoring from your account
   HOME ............................ welcome page and today dashboard
   EVENTS .......................... every click / key / change is handled here
   ===================================================================== */
const $ = (s) => document.querySelector(s);

const ls = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
    try {
      if (window.__cubelabOnLocalSave) {
        window.__cubelabOnLocalSave(k);
      }
    } catch (e) {}
  }
};

const chip = (a) => `<code class="alg" data-c="${a}" title="Tap to copy">${a}</code>`;
const A = (n, a, t = "") => ({ n, a, t });

/* ---------- DATA ---------- */
const NOT = `<div class="card"><h3>Notation</h3><p class="mu">U D L R F B = turn that face clockwise (as you look at it). ' = counter-clockwise, 2 = half turn. M = middle slice (turns like L). f = F plus the middle slice behind it. Tap any algorithm to copy it.</p></div>`;

const SUNE = A("Sune", "R U R' U R U2 R'", "One corner twisted, yellow on the front-left"),
  ANTI = A("Anti-Sune", "R U2 R' U' R U' R'", "Mirror of Sune"),
  HC = A("H", "F R U R' U' R U R' U' R U R' U' F'", "No corner oriented, two on each side"),
  UA = A("Ua", "R U' R U R U R U' R' U' R2", "3-edge cycle, solved edge at the back"),
  UB = A("Ub", "R2 U R U R' U' R' U' R' U R'", "3-edge cycle the other way"),
  HP = A("H perm", "M2 U M2 U2 M2 U M2", "Swaps opposite edge pairs"),
  ZP = A("Z perm", "M' U M2 U M2 U M' U2 M2", "Swaps adjacent edge pairs");

const M = {
  CFOP: {
    d: "Cross → F2L → OLL → PLL. The most popular speedsolving method. Start with the 2-look versions of OLL and PLL below, then expand.",
    sets: {
      F2L: [
        A("Easy insert (right)", "U R U' R'", "Paired corner + edge on top, slot at front-right"),
        A("Easy insert (left)", "U' F' U F", "Mirror case for the front-left slot"),
        A("Sledgehammer", "R' F R F'", "Corner in slot, edge above it"),
        A("Pop out the corner", "R U R'", "Lift a corner out of its slot to re-pair it"),
        A("Pop out (left)", "F' U' F", "Mirror of the above")
      ],
      OLL: [
        A("Dot → line", "F R U R' U' F' f R U R' U' f'", "Dot edge case, 2-look"),
        A("Line", "F R U R' U' F'", "Line horizontal"),
        A("L-shape", "f R U R' U' f'", "L-shape, edges at back and left"),
        SUNE,
        ANTI,
        A("T-shape", "R U R' U' R' F R F'", "Top cross made, T-shaped corners")
      ],
      PLL: [
        A("Aa", "x R' U R' D2 R U' R' D2 R2", "Corner 3-cycle"),
        A("Ab", "x R2 D2 R U R' D2 R U' R", "Corner 3-cycle the other way"),
        UA,
        UB,
        HP,
        ZP,
        A("T", "R U R' U' R' F R2 U' R' U' R U R' F'", "Swaps two corners and two edges"),
        A("Y", "F R U' R' U' R U R' F' R U R' U' R' F R F'", "Swaps diagonal corners"),
        A("Jb", "R U R' F' R U R' U' R' F R2 U' R'", "Swaps two corners and adjacent edges"),
        A(
          "Na",
          "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
          "Swaps two corners and two edges"
        ),
        A("Nb", "R' U R U' R' F' U' F R U R' F R' F' R U' R", "Mirror of Na")
      ]
    }
  },
  Roux: {
    d: "First block → second block → CMLL → LSE. Few moves, mostly M and U turns. Blocks are intuitive; below are the last-two-step algs.",
    sets: {
      CMLL: [SUNE, ANTI, HC],
      LSE: [
        A("Ua (M-slice)", "M2 U M U2 M' U M2", "3-edge cycle"),
        A("Ub (M-slice)", "M2 U' M U2 M' U' M2", "3-edge cycle the other way"),
        HP,
        ZP
      ]
    }
  },
  ZZ: {
    d: "EOLine → F2L with R, U, L only → last layer. No cube rotations needed. Edge orientation is intuitive; below are common last-layer algs.",
    sets: { COLL: [SUNE, ANTI, HC], EPLL: [UA, UB, HP, ZP] }
  }
};

/* ---- tiny cube simulator + case diagrams ---- */
const MV = {
  U: [1, [1], -1],
  D: [1, [-1], 1],
  R: [0, [1], -1],
  L: [0, [-1], 1],
  F: [2, [1], -1],
  B: [2, [-1], 1],
  M: [0, [0], 1],
  E: [1, [0], 1],
  S: [2, [0], -1],
  r: [0, [0, 1], -1],
  l: [0, [-1, 0], 1],
  u: [1, [0, 1], -1],
  d: [1, [-1, 0], 1],
  f: [2, [0, 1], -1],
  b: [2, [-1, 0], 1],
  x: [0, [-1, 0, 1], -1],
  y: [1, [-1, 0, 1], -1],
  z: [2, [-1, 0, 1], -1]
};

const rv = (v, a, k) => {
  for (; k > 0; k--) {
    const [x, y, z] = v;
    v = a == 0 ? [x, -z, y] : a == 1 ? [z, y, -x] : [-y, x, z];
  }
  return v;
};

function mv(S, t) {
  const [a, L, k0] = MV[t[0]];
  let k = t.endsWith("'") ? -k0 : k0;
  if (t.endsWith("2")) {
    k = 2;
  }
  const n = ((k % 4) + 4) % 4;
  S.forEach((s) => {
    if (L.includes(s.p[a])) {
      s.p = rv(s.p, a, n);
      s.n = rv(s.n, a, n);
    }
  });
}

function cube() {
  const S = [];
  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      for (let z = -1; z < 2; z++) {
        for (const [n, c] of [
          [[1, 0, 0], "R"], [[-1, 0, 0], "L"], [[0, 1, 0], "U"], [[0, -1, 0], "D"],
          [[0, 0, 1], "F"], [[0, 0, -1], "B"]
        ]) {
          if (x * n[0] + y * n[1] + z * n[2] == 1) {
            S.push({ p: [x, y, z], n: [...n], c, o: [x, y, z] });
          }
        }
      }
    }
  }
  return S;
}

function caseState(a) {
  const S = cube();
  a.split(" ").filter((t) => "xyz".includes(t[0])).forEach((t) => mv(S, t));
  inv(a).split(" ").forEach((t) => mv(S, t));
  return S;
}

const GM = { EO5: 5, OLL: 1, OCLL: 1, CMLL: 4, COLL: 4, PLL: 2, EPLL: 2, LSE: 2, F2L: 3 };

function iso(a) {
  const S = caseState(a),
    C = { U: "#f5c518", D: "#f2f2f2", F: "#22a55a", B: "#2f6df0", R: "#e03a3a", L: "#f58220" },
    pr = (x, y, z) => [(50 + (x - z) * 12.2).toFixed(1), (50 - (-x + 2 * y - z) * 7.1).toFixed(1)];
  let o = "";
  for (const s of S) {
    const [nx, ny, nz] = s.n;
    if (nx < 1 && ny < 1 && nz < 1) {
      continue;
    }
    const [x, y, z] = s.p,
      t = ny ? [[1, 0, 0], [0, 0, 1]] : nx ? [[0, 1, 0], [0, 0, 1]] : [[1, 0, 0], [0, 1, 0]],
      c = [x + nx / 2, y + ny / 2, z + nz / 2],
      q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => pr(
        ...c.map((v, k) => v + .44 * (i * t[0][k] + j * t[1][k]))
      ));
    const k = s.o.join(), pair = k == "1,-1,1" || k == "1,0,1";
    o += `<polygon points="${q.map((p) => p.join()).join(" ")}" fill="${pair || s.o[1] < 1 ? C[s.c] : "#8d8d94"}" stroke="#1b1b1d" stroke-width="1.3"/>`;
  }
  return `<svg class="dg" viewBox="0 0 100 100" aria-hidden="true">${o}</svg>`;
}

function dia(a, set) {
  const m = GM[set];
  if (!m) {
    return "";
  }
  if (m == 3) {
    return iso(a);
  }
  const S = caseState(a),
    C = { U: "#f5c518", D: "#f2f2f2", F: "#22a55a", B: "#2f6df0", R: "#e03a3a", L: "#f58220" };
  let o = "";
  for (const s of S) {
    if (s.p[1] != 1) {
      continue;
    }
    const [x, , z] = s.p, [nx, ny, nz] = s.n;
    if (m == 5 && ny != 1) {
      continue;
    }
    let X, Y, w = 20, h = 20;
    if (ny == 1) {
      X = 17 + (x + 1) * 22;
      Y = 17 + (z + 1) * 22;
    } else if (nz == 1) {
      X = 17 + (x + 1) * 22;
      Y = 87;
      h = 7;
    } else if (nz == -1) {
      X = 17 + (x + 1) * 22;
      Y = 6;
      h = 7;
    } else if (nx == 1) {
      X = 87;
      Y = 17 + (z + 1) * 22;
      w = 7;
    } else if (nx == -1) {
      X = 6;
      Y = 17 + (z + 1) * 22;
      w = 7;
    } else {
      continue;
    }
    o += `<rect x="${X}" y="${Y}" width="${w}" height="${h}" rx="3" fill="${m == 5 ? (s.o.filter((v) => v).length < 3 && s.c == "U" ? C.U : "#8d8d94") : m == 1 ? (s.c == "U" ? C.U : "#8d8d94") : m == 4 && s.o.filter((v) => v).length == 2 ? "#8d8d94" : C[s.c]}"/>`;
  }
  return `<svg class="dg" viewBox="0 0 100 100" aria-hidden="true"><rect x="14" y="14" width="72" height="72" rx="6" fill="#1b1b1d"/>${o}</svg>`;
}

/* ---- fastest-cross finder: tables are built lazily on the first click, then cached ---- */
const EM = [
  "U", "U'", "U2", "D", "D'", "D2", "L", "L'", "L2", "R", "R'", "R2", "F", "F'", "F2", "B", "B'",
  "B2"
],
  CN = { U: "White", D: "Yellow", F: "Green", B: "Blue", R: "Red", L: "Orange" },
  FN = { U: "top", D: "bottom", F: "front", B: "back", R: "right", L: "left" };

let ES, EP, EI, CT = {};

const isE = (v) => v.filter((x) => x).length == 2,
  ky = (a) => ((a[0] * 24 + a[1]) * 24 + a[2]) * 24 + a[3];

function eInit() {
  if (ES) {
    return;
  }
  ES = cube().filter((s) => isE(s.p));
  EI = {};
  ES.forEach((s, i) => EI[s.p + "|" + s.n] = i);
  EP = EM.map((t) => ES.map((s) => {
    const c = { p: [...s.p], n: [...s.n] };
    mv([c], t);
    return EI[c.p + "|" + c.n];
  }));
}

function cTab(X) {
  if (CT[X]) {
    return CT[X];
  }
  eInit();
  const d = new Int8Array(331776).fill(-1), g = [];
  ES.forEach((s, i) => {
    if (s.c == X) {
      g.push(i);
    }
  });
  const k0 = ky(g);
  d[k0] = 0;
  let fr = [k0];
  for (let k = 0; fr.length; k++) {
    const nx = [];
    for (const q of fr) {
      const a = q / 13824 | 0, b = (q / 576 | 0) % 24, c = (q / 24 | 0) % 24, e = q % 24;
      for (let m = 0; m < 18; m++) {
        const P = EP[m], r = ((P[a] * 24 + P[b]) * 24 + P[c]) * 24 + P[e];
        if (d[r] < 0) {
          d[r] = k + 1;
          nx.push(r);
        }
      }
    }
    fr = nx;
  }
  return CT[X] = d;
}

function csol(X, S) {
  const d = cTab(X);
  let q = ky(S.filter((s) => s.c == X && isE(s.o)).map((s) => EI[s.p + "|" + s.n])), seq = [];
  const n = d[q];
  while (d[q] > 0) {
    for (let m = 0; m < 18; m++) {
      const a = q / 13824 | 0,
        b = (q / 576 | 0) % 24,
        c = (q / 24 | 0) % 24,
        e = q % 24,
        P = EP[m],
        r = ((P[a] * 24 + P[b]) * 24 + P[c]) * 24 + P[e];
      if (d[r] == d[q] - 1) {
        seq.push(EM[m]);
        q = r;
        break;
      }
    }
  }
  return { X, n, s: seq.join(" ") };
}

async function cx() {
  const e = $("#cx");
  if (!e.hidden) {
    e.hidden = true;
    return;
  }
  e.hidden = false;
  e.textContent = "Calculating…";
  const S = cube();
  T.scr.split(" ").forEach((t) => mv(S, t));
  const r = [];
  for (const X of "UDFBRL") {
    await new Promise((f) => setTimeout(f));
    r.push(csol(X, S));
  }
  r.sort((a, b) => a.n - b.n);
  const b = r[0];
  e.innerHTML = `<h3>Fastest cross: ${CN[b.X]} (${b.n} moves)</h3><p class="mu">Hold white on top and green in front, the same way you scramble. The ${CN[b.X].toLowerCase()} cross ends on the ${FN[b.X]} face.</p>${b.s ? chip(b.s) : "<p>Already solved!</p>"}<p class="mu" style="margin-top:8px">All colors:</p>` + r.map((x) => `<div class="mu">${CN[x.X]} cross on ${FN[x.X]} · ${x.n} moves${x.s ? chip(x.s) : ""}</div>`).join("");
}

/* ---- edit / add your own algorithms (saved in this browser) ---- */
let ED = null;

function nrm(s) {
  s = s
    .replace(/[’‘]/g, "'")
    .replace(/[()]/g, " ")
    .replace(/([UDLRFB])w/g, (m, c) => c.toLowerCase())
    .replace(/2'/g, "2")
    .replace(/\s+/g, " ")
    .trim();
  return s && s.split(" ").every((t) => /^[UDLRFBMESudlrfbxyz](2|')?$/.test(t)) ? s : null;
}

function chk(orig, alt, set) {
  const S = caseState(orig), R = [];
  alt
    .split(" ")
    .forEach((t) => {
      if ("xyz".includes(t[0])) {
        R.push(t);
      }
      mv(S, t);
    });
  R
    .reverse()
    .forEach((t) => mv(S, t.endsWith("'") ? t.slice(0, -1) : t.endsWith("2") ? t : t + "'"));
  const NM = { U: "0,1,0", D: "0,-1,0", F: "0,0,1", B: "0,0,-1", R: "1,0,0", L: "-1,0,0" },
    ok = (s) => s.p.join() == s.o.join() && s.n.join() == NM[s.c];
  if (set == "EO") {
    return true;
  }
  if (set == "F2L") {
    return S.every((s) => s.o[1] == 1 || ok(s));
  }
  if (GM[set] == 4) {
    const co = (s) => s.o.filter((v) => v).length == 3;
    for (let k = 0; k < 4; k++) {
      if (S.filter(co).every(ok)) {
        return true;
      }
      mv(S, "U");
    }
    return false;
  }
  if (GM[set] == 1) {
    return S.every((s) => s.n.join() != "0,1,0" || s.c == "U");
  }
  for (let k = 0; k < 4; k++) {
    if (S.every(ok)) {
      return true;
    }
    mv(S, "U");
  }
  return false;
}

function setMain(id, v) {
  for (const m in M) {
    for (const s in M[m].sets) {
      M[m].sets[s].forEach((c) => {
        if (c.id == id) {
          c.a = v;
        }
      });
    }
  }
  ALL.forEach((x) => {
    if (x.id == id) {
      x.a = v;
    }
  });
}

function alts(c, s) {
  const id = c.id,
    L = UX[id] || [],
    ed = (i, v) => ED && ED.id == id && ED.i == i ? `<div class="row"><input id="ei" value="${(ED.v ?? v).replace(/"/g, "&quot;")}" placeholder="R U R' U'"><button class="btn pr" data-e="sv">${ED.w ? "Save anyway" : "Save"}</button><button class="btn" data-e="cn">Cancel</button></div><div class="bad" style="font-size:.85rem">${ED.m || ""}</div>` : "",
    mb = (a, i, l) => `<button class="mb" data-e="${a}" data-id="${id}" data-i="${i}" data-s="${s}">${l}</button>`,
    ok = (x) => chk(id, x, s) ? `<span class="ok">✓ same case</span>` : `<span class="bad">✗ different case</span>`,
    here = (i) => ED && ED.id == id && ED.i == i;
  return (here(-2) ? ed(-2, c.a) : `<div class="ar">${c.a != id ? `<span class="mu">Edited</span> ${ok(c.a)} ` : ""}${mb("wt", -2, "▶ Watch")}${mb("ed", -2, "✎ Edit")}${c.a != id ? mb("rs", -2, "Reset to original") : ""}</div>`) + L.map((x, i) => here(i) ? ed(i, x) : `<div class="ar">${chip(x)}${ok(x)} ${mb("wt", i, "▶")}${mb("ed", i, "✎")}${mb("dl", i, "🗑")}</div>`).join("") + (here(-1) ? ed(-1, "") : `<div class="ar">${mb("ad", -1, "＋ Add another way")}</div>`);
}

function edAct(t) {
  const a = t.dataset.e, id = t.dataset.id, i = +t.dataset.i, s = t.dataset.s;
  if (a == "wt") {
    const c = ALL.find((x) => x.id == id) || { a: id, n: "Algorithm" },
      al = i >= 0 ? UX[id][i] : c.a;
    watch(al, caseState(c.a), (c.n || "Algorithm") + (i >= 0 ? " (your way)" : ""));
    return;
  }
  if (a == "ed" || a == "ad") {
    ED = { id, i, s };
    fill();
    const x = $("#ei");
    if (x) {
      x.focus();
      x.select();
    }
    return;
  }
  if (a == "cn") {
    ED = null;
    return fill();
  }
  if (a == "dl") {
    UX[id].splice(i, 1);
    if (!UX[id].length) {
      delete UX[id];
    }
    ls.set("cl_ua", UX);
    return fill();
  }
  if (a == "rs") {
    delete UO[id];
    ls.set("cl_uo", UO);
    setMain(id, id);
    return fill();
  }
  if (a == "sv") {
    const raw = $("#ei").value, v = nrm(raw);
    ED.v = v || raw;
    if (!v) {
      ED.m = "Use space-separated moves, e.g. R U R' U'. Allowed: U D L R F B, M E S, r l u d f b, x y z.";
      return fill();
    }
    if (!ED.w && !chk(ED.id, v, ED.s)) {
      ED.w = 1;
      ED.m = "This doesn’t seem to solve this case. Check the moves, or press Save anyway.";
      return fill();
    }
    if (ED.i == -2) {
      if (v == id) {
        delete UO[id];
      } else {
        UO[id] = v;
      }
      ls.set("cl_uo", UO);
      setMain(id, v);
    } else {
      const L = UX[id] = UX[id] || [];
      if (ED.i == -1) {
        if (!L.includes(v)) {
          L.push(v);
        }
      } else {
        L[ED.i] = v;
      }
      ls.set("cl_ua", UX);
    }
    ED = null;
    fill();
  }
}

/* ---- scramble library: saved + most-used scrambles ---- */
const IC = {
  account: "☁️",
  timer: "⏱",
  scr: "🔀",
  learn: "🎓",
  hist: "🗂",
  prog: "📈",
  sync: "💾",
  theme: "🎨",
  home: "🏠",
  bld: "🙈",
  cfop: "🧩",
  roux: "🧱",
  zz: "⚡",
  zb: "💎",
  trainer: "🎯"
};

function scInfo() {
  const u = $("#su"), r = times.filter((x) => x.s == T.scr).map((x) => x.t);
  if (u) {
    u.textContent = r.length ? `used ${r.length}× · best ${fmt(Math.min(...r))}` : (MB() ? "" : "new scramble");
  }
  const b = $("#sv");
  if (b) {
    b.textContent = (CS() || MB())
      ? (PIN.includes(T.scr) ? "★" : "☆")
      : (PIN.includes(T.scr) ? "★ Saved" : "☆ Save");
  }
}

const sst = (s) => {
  const r = times.filter((x) => x.s == s).map((x) => x.t);
  return r.length ? `used ${r.length}× · best ${fmt(Math.min(...r))} · avg ${fmt(r.reduce((a, b) => a + b, 0) / r.length)}` : "not solved yet";
};

const srow = (s) => `<div class="card"><code class="alg" data-c="${s}" title="Tap to copy">${s}</code><div class="row"><span class="mu">${sst(s)}</span><span style="flex:1"></span><button class="mb" data-x="use" data-s="${s}">▶ Use</button><button class="mb" data-x="pin" data-s="${s}">${PIN.includes(s) ? "★ Saved" : "☆ Save"}</button></div></div>`;

function vScr() {
  const c = {};
  times.forEach((x) => c[x.s] = (c[x.s] || 0) + 1);
  const many = Object.keys(c).filter((s) => c[s] > 1).sort((a, b) => c[b] - c[a]).slice(0, 20);
  return `<div class="card"><h2>Scramble library</h2><p class="mu">Save scrambles you want to practice, or add your own. Anything you solve more than once shows up under “Used many times”.</p><div class="row"><input id="ai" placeholder="Paste a scramble, e.g. R U R' F2 D…"><button class="btn pr" data-x="add">Add</button></div><div class="bad" id="ae" style="font-size:.85rem"></div></div><h3 style="margin:16px 4px 8px">★ Saved (${PIN.length})</h3>${PIN.map(srow).join("") || `<p class="mu">Nothing saved yet. Tap ☆ Save under a scramble on the Timer page.</p>`}<h3 style="margin:16px 4px 8px">🔁 Used many times</h3>${many.map(srow).join("") || `<p class="mu">No repeats yet. Press “Do it again” on the Timer page to practice the same scramble.</p>`}`;
}

function scAct(t) {
  const x = t.dataset.x, s = t.dataset.s;
  if (x == "use") {
    go("timer");
    newScr(s);
    return;
  }
  if (x == "pin") {
    const i = PIN.indexOf(s);
    i < 0 ? PIN.push(s) : PIN.splice(i, 1);
    ls.set("cl_pin", PIN);
    return render();
  }
  if (x == "add") {
    const v = nrm($("#ai").value);
    if (!v) {
      $("#ae").textContent = "Use space-separated moves, e.g. R U R' F2.";
      return;
    }
    if (!PIN.includes(v)) {
      PIN.unshift(v);
      ls.set("cl_pin", PIN);
    }
    render();
  }
}

/* ---- interactive 3D cube + animation player ---- */
const CC = { U: "#f5c518", D: "#f2f2f2", F: "#22a55a", B: "#2f6df0", R: "#e03a3a", L: "#f58220" },
  iv = (t) => t.endsWith("'") ? t.slice(0, -1) : t.endsWith("2") ? t : t + "'";

const rot = (v, a, t) => {
  const c = Math.cos(t), s = Math.sin(t), [x, y, z] = v;
  return (
    a == 0
      ? [x, y * c - z * s, y * s + z * c]
      : a == 1 ? [x * c + z * s, y, -x * s + z * c] : [x * c - y * s, x * s + y * c, z]
  );
};

const cp = (s) => ({ p: [...s.p], n: [...s.n], c: s.c, o: s.o }),
  stOf = (m) => {
    const S = cube();
    m.split(" ").filter((x) => x).forEach((t) => mv(S, t));
    return S;
  };

function cube3d(cv, S0) {
  const x = cv.getContext("2d"), W = cv.width;
  let S = S0.map(cp), yw = -.65, pt = .5, an = null, dn = 0;
  const api = {
    sp: 1,
    get: () => S,
    set(s) {
      S = s.map(cp);
      draw();
    },
    view(a, b) {
      yw = a;
      pt = b;
      draw();
    },
    go(t, fast) {
      return new Promise((r) => {
        const [a, L, k0] = MV[t[0]];
        let k = t.endsWith("'") ? -k0 : k0;
        if (t.endsWith("2")) {
          k = 2;
        }
        if (fast) {
          mv(S, t);
          draw();
          return r();
        }
        an = { a, L, to: k * Math.PI / 2, th: 0, t0: 0, d: (k == 2 ? 520 : 340) / api.sp, t, r };
        requestAnimationFrame(fr);
      });
    }
  };
  function fr(ts) {
    if (!an) {
      return;
    }
    if (!an.t0) {
      an.t0 = ts;
    }
    const q = Math.min(1, (ts - an.t0) / an.d);
    an.th = an.to * q * q * (3 - 2 * q);
    draw();
    if (q < 1) {
      requestAnimationFrame(fr);
    } else {
      mv(S, an.t);
      const r = an.r;
      an = null;
      draw();
      r();
    }
  }
  function draw() {
    x.clearRect(0, 0, W, W);
    const cs = Math.cos(yw),
      sn = Math.sin(yw),
      cq = Math.cos(pt),
      sq = Math.sin(pt),
      sc = W / 6.3,
      V = (v) => {
        const X = v[0] * cs + v[2] * sn, Z = v[2] * cs - v[0] * sn;
        return [X, v[1] * cq - Z * sq, v[1] * sq + Z * cq];
      },
      L = [];
    for (const s of S) {
      const m = an && an.L.includes(s.p[an.a]),
        R = (v) => m ? rot(v, an.a, an.th) : v,
        vis = V(R(s.n))[2] > 0;
      if (!vis && !an) {
        continue;
      }
      const [nx, ny, nz] = s.n,
        t = ny ? [[1, 0, 0], [0, 0, 1]] : nx ? [[0, 1, 0], [0, 0, 1]] : [[1, 0, 0], [0, 1, 0]],
        c = [s.p[0] + nx / 2, s.p[1] + ny / 2, s.p[2] + nz / 2],
        q = (h) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => V(
          R(c.map((v, k) => v + h * (i * t[0][k] + j * t[1][k])))
        ));
      L.push({ z: V(R(c))[2], vis, o: q(.5), i: q(.43), c: s.c });
    }
    L.sort((a, b) => a.z - b.z);
    const P = (a, fl) => {
      x.beginPath();
      a.forEach((p, i) => x[i ? "lineTo" : "moveTo"](W / 2 + p[0] * sc, W / 2 - p[1] * sc));
      x.closePath();
      x.fillStyle = fl;
      x.fill();
    };
    for (const l of L) {
      P(l.o, "#16161a");
      if (l.vis) {
        P(l.i, CC[l.c]);
      }
    }
  }
  cv.onpointerdown = (e) => {
    dn = [e.clientX, e.clientY];
    cv.setPointerCapture(e.pointerId);
  };
  cv.onpointermove = (e) => {
    if (!dn) {
      return;
    }
    yw += (e.clientX - dn[0]) * .012;
    pt = Math.max(-1.45, Math.min(1.45, pt + (e.clientY - dn[1]) * .012));
    dn = [e.clientX, e.clientY];
    draw();
  };
  cv.onpointerup = cv.onpointercancel = () => dn = 0;
  draw();
  return api;
}

/* watch-an-algorithm player */
const VW = { tk: [], pos: 0, pl: 0, bz: 0, st: null, api: null, top: 0 },
  wait = (ms) => new Promise((r) => setTimeout(r, ms));

function watch(alg, st, title) {
  $("#vw").hidden = false;
  $("#vt").textContent = title || "Watch";
  VW.tk = alg.split(" ").filter((x) => x);
  VW.pos = 0;
  VW.pl = 0;
  VW.st = st;
  VW.top = 0;
  $("#vtop").textContent = "Top view";
  if (!VW.api) {
    VW.api = cube3d($("#vcv"), st);
  }
  VW.api.set(st);
  VW.api.view(-.65, .5);
  $("#vk").innerHTML = VW.tk.map((t, i) => `<span id="k${i}">${t}</span>`).join("") || "<span>Drag to look around</span>";
  vmark();
  vupd();
  setTimeout(() => {
    if (VW.tk.length) {
      vplay();
    }
  }, 350);
}

function vmark() {
  VW.tk.forEach((t, i) => {
    const e = $("#k" + i);
    if (e) {
      e.className = i < VW.pos - 1 ? "dn" : i == VW.pos - 1 ? "cur" : "";
    }
  });
}

function vupd() {
  $("#vp").textContent = VW.pl ? "⏸ Pause" : "▶ Play";
}

async function vstep(d) {
  if (VW.bz) {
    return;
  }
  VW.bz = 1;
  if (d > 0 && VW.pos < VW.tk.length) {
    const t = VW.tk[VW.pos++];
    vmark();
    await VW.api.go(t);
  } else if (d < 0 && VW.pos > 0) {
    const t = VW.tk[--VW.pos];
    vmark();
    await VW.api.go(iv(t));
  }
  VW.bz = 0;
}

async function vplay() {
  if (VW.pl) {
    VW.pl = 0;
    vupd();
    return;
  }
  if (VW.pos >= VW.tk.length) {
    await vrs();
  }
  VW.pl = 1;
  vupd();
  while (VW.pl && VW.pos < VW.tk.length) {
    await vstep(1);
    await wait(120);
  }
  VW.pl = 0;
  vupd();
}

async function vrs() {
  VW.pl = 0;
  while (VW.bz) {
    await wait(30);
  }
  VW.api.set(VW.st);
  VW.pos = 0;
  vmark();
  vupd();
}

$("#vx").onclick = () => {
  VW.pl = 0;
  $("#vw").hidden = true;
};

$("#v0").onclick = vrs;

$("#vb").onclick = () => {
  VW.pl = 0;
  vupd();
  vstep(-1);
};

$("#vf").onclick = () => {
  VW.pl = 0;
  vupd();
  vstep(1);
};

$("#vp").onclick = vplay;

$("#vs").onchange = (e) => {
  VW.api && (VW.api.sp = +e.target.value);
};

$("#vtop").onclick = (e) => {
  VW.top = !VW.top;
  VW.api.view(VW.top ? 0 : -.65, VW.top ? 1.45 : .5);
  e.target.textContent = VW.top ? "3D view" : "Top view";
};

/* ---- beginner lessons ---- */
let PR, CH = Promise.resolve(), LD = ls.get("cl_done", []);
const qq = (f) => CH = CH.then(f);

const LS = [
  [
    "1. Daisy, then white cross",
    "Goal: a white cross on the bottom. First make a “daisy”: the 4 white edge pieces around the yellow center, white facing up. Then match each petal with its side color and flip it down. Stuck? Press “Show me the white cross” on the practice cube.",
    [],
    [
      ["White piece at the bottom → turn that side twice", "", "F2"],
      ["White piece in the middle layer → turn the side that lifts it", "R", "R"],
      ["White piece on top but sideways → go down one, then lift", "L' F", "F' L'"],
      ["Match the side color, then turn that side twice", "F2 R2 B2 L2 U", "U' L2 B2 R2 F2"],
      ["What a finished daisy looks like", "F2 R2 B2 L2", ""]
    ]
  ],
  [
    "2. White corners",
    "Find a white corner on the top. Turn the top until it sits right above its spot (between its two side colors). Repeat the trick until it drops in with white facing down.",
    [["Corner trick – repeat until white is down", "R U R' U'", 3]],
    []
  ],
  [
    "3. Middle layer",
    "Find a top edge with no yellow. Turn the top until its front color matches the center below it. Then send it right or left.",
    [["Edge goes right", "U R U' R' U' F' U F"], ["Edge goes left", "U' L' U L U F U' F'"]],
    []
  ],
  [
    "4. Yellow cross",
    "Look at the yellow stickers on top: a dot, an L or a line. Do the moves until you see a yellow cross.",
    [["Make the yellow cross", "F R U R' U' F'"]],
    []
  ],
  [
    "5. Match the yellow edges",
    "Turn the top until at least one edge matches its center. Do the moves (holding the matched edge at the back) until all four match.",
    [["Match the edges", "R U R' U R U2 R' U"]],
    []
  ],
  [
    "6. Place the yellow corners",
    "Find a corner that already sits between its three right colors (it may be twisted). Hold it at the front-right and do the moves until all four are in place.",
    [["Move corners to the right spot", "U R U' L' U R' U' L"]],
    []
  ],
  [
    "7. Twist the last corners",
    "Hold an unsolved corner at the front-right-top. Repeat the short moves until its yellow faces up, then turn only the top to bring the next one. The cube looks messy in between – it’s normal!",
    [["Twist a corner (repeat)", "R' D' R D", 2]],
    []
  ]
];

function vLearn2() {
  return `<div class="card"><h2>Try it yourself</h2><p class="mu">Drag the cube to look around. Tap a move to see it happen. White is the bottom, yellow is the top.</p><canvas id="pc" class="cb" width="600" height="600"></canvas><div class="row tb" style="margin-top:10px">${["U", "U'", "D", "D'", "L", "L'", "R", "R'", "F", "F'", "B", "B'"].map((m) => `<button class="mb" data-p="${m}">${m}</button>`).join("")}</div><div class="row tb" style="margin-top:10px"><button class="btn" data-p="sc">🔀 Scramble</button><button class="btn" data-p="rs">↺ Solved</button><button class="btn pr" data-p="hint">💡 Show me the white cross</button></div><p class="mu" id="pm" style="text-align:center">R = right face, L = left, U = up, D = down, F = front, B = back. A ′ means turn it the other way.</p></div>` + LS.map(([t, d, al, dm], i) => `<div class="card" id="ls${i}"><div class="sch"><h3>${t}</h3><button class="mb" data-d="${i}">${LD.includes(i) ? "✓ Done" : "Mark done"}</button></div><p>${d}</p>` + dm.map(([l], k) => `<div class="ar"><button class="mb" data-l="${i}.d.${k}">▶ Watch</button>${l}</div>`).join("") + al.map(([n, a, r, pm], j) => pm ? `<div class="ar cs">${dia(a, pm)}<div><b>${n}</b>${chip(a)}<button class="mb" data-l="${i}.${j}">▶ Watch</button></div></div>` : `<div class="ar"><span class="mu">${n}</span>${chip(a)}<button class="mb" data-l="${i}.${j}">▶ Watch${r ? " (×" + r + ")" : ""}</button></div>`).join("") + `</div>`).join("") + vPred() + NOT;
}

function lnAct(t) {
  const [i, j, k] = t.dataset.l.split("."), L = LS[+i];
  if (j == "d") {
    const [l, pre, play] = L[3][+k];
    watch(play, stOf(pre), l);
    return;
  }
  const [n, a, r] = L[2][+j], alg = Array(r || 1).fill(a).join(" ");
  watch(alg, stOf(inv(alg)), n);
}

function prAct(t) {
  const p = t.dataset.p;
  if (p == "rs") {
    qq(() => PR.set(cube()));
  } else if (p == "sc") {
    const S = cube();
    scr(10).split(" ").forEach((m) => mv(S, m));
    qq(() => PR.set(S));
  } else if (p == "hint") {
    qq(async () => {
      const r = csol("D", PR.get());
      $("#pm").textContent = r.n ? `Fastest white cross: ${r.s} (${r.n} moves)` : "The white cross is already done! ✓";
      for (const m of r.s ? r.s.split(" ") : []) {
        await PR.go(m);
      }
    });
  } else {
    qq(() => PR.go(p));
  }
}

/* ---- advanced sets: full OLL (57), full PLL (21), OCLL ---- */
const OLLS = [
  "R U2 R2 F R F' U2 R' F R F'", "r U r' U2 R U2 R' U2 r U' r'", "r' R2 U R' U r U2 r' U M'",
  "M U' r U2 r' U' R U' R' M'", "l' U2 L U L' U l", "r U2 R' U' R U' r'", "r U R' U R U2 r'",
  "l' U' L U' L' U2 l", "R U R' U' R' F R2 U R' U' F'", "R U R' U R' F R F' R U2 R'",
  "r U R' U R' F R F' R U2 r'", "F R U R' U' F' U F R U R' U' F'", "F U R U2 R' U' R U R' F'",
  "R' F R U R' F' R F U' F'", "r' U' r R' U' R U r' U r", "r U r' R U R' U' r U' r'",
  "R U R' U R' F R F' U2 R' F R F'", "r U R' U R U2 r2 U' R U' R' U2 r",
  "M U R U R' U' M' R' F R F'", "r U R' U' M2 U R U' R' U' M'", "R U2 R' U' R U R' U' R U' R'",
  "R U2 R2 U' R2 U' R2 U2 R", "R2 D R' U2 R D' R' U2 R'", "r U R' U' r' F R F'",
  "F' r U R' U' r' F R", "R U2 R' U' R U' R'", "R U R' U R U2 R'", "r U R' U' r' R U R U' R'",
  "R U R' U' R U' R' F' U' F R U R'", "F R' F R2 U' R' U' R U R' F2", "R' U' F U R U' R' F' R",
  "R U B' U' R' U R B R'", "R U R' U' R' F R F'", "R U R2 U' R' F R U R U' F'",
  "R U2 R2 F R F' R U2 R'", "R' U' R U' R' U R U R B' R' B", "F R' F' R U R U' R'",
  "R U R' U R U' R' U' R' F R F'", "L F' L' U' L U F U' L'", "R' F R U R' U' F' U R",
  "R U R' U R U2 R' F R U R' U' F'", "R' U' R U' R' U2 R F R U R' U' F'", "R' U' F' U F R",
  "f R U R' U' f'", "F R U R' U' F'", "R' U' R' F R F' U R", "R' U' R' F R F' R' F R F' U R",
  "F R U R' U' R U R' U' F'", "r U' r2 U r2 U r2 U' r", "r' U r2 U' r2 U' r2 U r'",
  "f R U R' U' R U R' U' f'", "R U R' U R d' R U' R' F'", "r' U' R U' R' U R U' R' U2 r",
  "r U R' U R U' R' U R U2 r'", "R U2 R2 U' R U' R' U2 F R F'",
  "r U r' U R U' R' U R U' R' r U' r'", "R U R' U' M' U R U' r'"
];

M.CFOP.sets.OLL = OLLS.map((a, i) => A(
  "OLL " + (i + 1),
  a,
  i < 4 || (i >= 16 && i < 20) ? "Dot" : i >= 20 && i <= 26 ? "Cross (all edges oriented)" : ""
));

M.CFOP.sets.PLL = [
  ["Aa", "x R' U R' D2 R U' R' D2 R2"],
  ["Ab", "x R2 D2 R U R' D2 R U' R"],
  ["E", "x' R U' R' D R U R' D' R U R' D R U' R' D'"],
  ["F", "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"],
  ["Ga", "R2 U R' U R' U' R U' R2 U' D R' U R D'"],
  ["Gb", "R' U' R U D' R2 U R' U R U' R U' R2 D"],
  ["Gc", "R2 U' R U' R U R' U R2 D' U R U' R' D"],
  ["Gd", "R U R' U' D R2 U' R U' R' U R' U R2 D'"],
  ["H", "M2 U M2 U2 M2 U M2"],
  ["Ja", "x R2 F R F' R U2 r' U r U2"],
  ["Jb", "R U R' F' R U R' U' R' F R2 U' R' U'"],
  ["Na", "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],
  ["Nb", "R' U R U' R' F' U' F R U R' F R' F' R U' R"],
  ["Ra", "R U' R' U' R U R D R' U' R D' R' U2 R'"],
  ["Rb", "R' U2 R U2 R' F R U R' U' R' F' R2 U'"],
  ["T", "R U R' U' R' F R2 U' R' U' R U R' F'"],
  ["Ua", "R U' R U R U R U' R' U' R2"],
  ["Ub", "R2 U R U R' U' R' U' R' U R'"],
  ["V", "R' U R' U' y R' F' R2 U' R' U R' F R F"],
  ["Y", "F R U' R' U' R U R' F' R U R' U' R' F R F'"],
  ["Z", "M' U M2 U M2 U M' U2 M2"]
].map(([n, a]) => A(n + " perm", a));

const OC = [["H", 20], ["Pi", 21], ["U", 22], ["T", 23], ["L", 24], ["Anti-Sune", 25], ["Sune", 26]].map(
  ([n, i]) => A(n, OLLS[i], "Orients all four corners (edges already oriented)")
);

/*ADV-START*/
// Advanced Roux / ZZ sets. Found by computer search and checked on a virtual cube. Edit or add freely.
const CM42 = [
  ["Sune 1", "R U R' U R U2 R'"],
  ["Sune 2", "F R' F' R U2 R U2 R'"],
  ["Sune 3", "F' U2 F U2 F R' F' R"],
  ["Sune 4", "F2 R' F' R U F' R' F' R"],
  ["Sune 5", "F R' U2 R F' R' F U2 F' R"],
  ["Sune 6", "R U R' U F' U F U' R U2 R'"],
  ["Anti-Sune 1", "R U2 R' U' R U' R'"],
  ["Anti-Sune 2", "R U2 R' U2 R' F R F'"],
  ["Anti-Sune 3", "R' F R F' U2 F' U2 F"],
  ["Anti-Sune 4", "R' F R F U' R' F R F2"],
  ["Anti-Sune 5", "R' F U2 F' R F R' U2 R F'"],
  ["Anti-Sune 6", "R U2 R' F R' F' R U' R U' R'"],
  ["H 1", "R' U2 F U2 F U2 F' U2 R"],
  ["H 2", "F' U2 F U2 F U2 F U2 F'"],
  ["H 3", "R' F2 R2 U2 R' F2 R' F2 R2 U2 R'"],
  ["H 4", "R' F R F' U' F R' F' R2 U' R'"],
  ["Pi 1", "R' U2 R2 U R2 U R2 U2 R'"],
  ["Pi 2", "R' U2 F U2 F' U2 F' U2 R"],
  ["Pi 3", "R' F' U' F U' R U R' U R"],
  ["Pi 4", "R2 F2 R' U2 R F2 R2 U' R U' R'"],
  ["Pi 5", "R2 F2 R' U R' U R2 F2 R' U2 R'"],
  ["Pi 6", "R U R2 F R F' U F R' F' R"],
  ["U 1", "R' F' U' F U R"],
  ["U 2", "R2 F2 R' U2 R F2 R' U2 R'"],
  ["U 3", "R2 U' R F2 R' U R F2 R"],
  ["U 4", "F U F' R2 U' R F' R' U R2"],
  ["U 5", "R U' R' U' F' U2 F U R U' R'"],
  ["U 6", "R U R2 F' R F' U' F2 R U' R'"],
  ["T 1", "F U F' U' R' F' R"],
  ["T 2", "R U R' U' R' F R F'"],
  ["T 3", "R U2 R F2 R' U2 R F2 R2"],
  ["T 4", "R2 F2 R F' U' F U R' F2 R2"],
  ["T 5", "F U F2 U' F U F R' F R"],
  ["T 6", "R U R' F2 U F R' F R2 U' R'"],
  ["L 1", "F U2 F' U2 R' F' R"],
  ["L 2", "F R' F' R U R U' R'"],
  ["L 3", "R U2 R2 F R F' R U2 R'"],
  ["L 4", "R' F2 R' U' R F2 R' U R2"],
  ["L 5", "R U R' U' F' U2 F U R U R'"],
  ["L 6", "F' U' F2 R' F' R2 U R' U' R U' R'"],
  ["Permute 1", "R2 F2 R' U' R F2 R' U R'"],
  ["Permute 2", "F2 U2 R2 U' F2 U2 R2 U F2 U2 R2"]
],
  COL = [
    ["Sune 1", "R U R' U R U2 R'"],
    ["Sune 2", "R' U2 R U F R' U R U' F'"],
    ["Sune 3", "F R' U R U' F' U R' U' R"],
    ["Sune 4", "R2 D' R U2 R' D R2 U R' U R"],
    ["Sune 5", "F R' U2 R F' R' F U2 F' R"],
    ["Sune 6", "F R' U2 R U2 F U' R' U R U F2"],
    ["Anti-Sune 1", "R U2 R' U' R U' R'"],
    ["Anti-Sune 2", "R' U R U' F U R' U' R F'"],
    ["Anti-Sune 3", "F U R' U' R F' U' R' U2 R"],
    ["Anti-Sune 4", "R' U' R U' R2 D' R U2 R' D R2"],
    ["Anti-Sune 5", "R' F U2 F' R F R' U2 R F'"],
    ["Anti-Sune 6", "F2 U' R' U' R U F' U2 R' U2 R F'"],
    ["H 1", "R U2 R' U' R U R' U' R U' R'"],
    ["H 2", "R' F2 R2 U2 R' F2 R U2 R2 F2 R"],
    ["H 3", "R F R2 U' R2 U' R2 U2 R2 U' F' R'"],
    ["H 4", "R' F' R U2 R U2 R' F U' R U' R'"],
    ["Pi 1", "R' U2 R2 U R2 U R2 U2 R'"],
    ["Pi 2", "R' F2 R U2 R U2 R' F2 U' R U' R'"],
    ["Pi 3", "R' U' F U' R2 U R2 U F' R2 U2 R'"],
    ["Pi 4", "R U R' U F' R U2 R' U2 R' F R"],
    ["Pi 5", "R U R' U F2 R U2 R' U2 R' F2 R"],
    ["Pi 6", "R F' U' R2 F U' F' U R2 U F R'"],
    ["U 1", "R2 D R' U2 R D' R' U2 R'"],
    ["U 2", "R2 D' R U2 R' D R U2 R"],
    ["U 3", "F U' R' U R U F' R' U2 R"],
    ["U 4", "F U2 F' R F R' U2 R F' R'"],
    ["U 5", "R U R' U R' U2 R2 U R2 U R2 U' R'"],
    ["U 6", "R' U2 R' D' R U2 R' D R2 U' R U2 R' U' R U' R'"],
    ["T 1", "R U R D R' U' R D' R2"],
    ["T 2", "R' U' R' D' R U R' D R2"],
    ["T 3", "F' R' F U2 F' R F R' U2 R"],
    ["T 4", "F' U2 R' U' R U' F U' R' U' R"],
    ["T 5", "R2 U' R U F' U2 R' U2 R F U' R"],
    ["T 6", "R' U2 R U R' U R2 U2 R' U' R U' R'"],
    ["L 1", "R2 D R' U R D' R' U' R'"],
    ["L 2", "R2 D' R U' R' D R U R"],
    ["L 3", "R U2 R D R' U2 R D' R2"],
    ["L 4", "R' U2 R' D' R U2 R' D R2"],
    ["L 5", "R U F' U2 R' U' R U' F U' R'"],
    ["L 6", "R' U R' U R2 U' R2 U' R2 U' R U R' U' R'"],
    ["Permute 1", "R2 F2 R2 U R U' R F2 R' U R'"],
    ["Permute 2", "R U' R2 F2 U' R F2 R' U F2 R2 U R'"]
  ],
  EOA = [
    ["UF+UB+DF+DB", "M"],
    ["UB+UL+UR+DB", "M U M"],
    ["UF+UL+UR+DF", "M' U M"],
    ["UF+UB+UL+UR", "M2 U M"],
    ["UR+DF", "M U M' U M"],
    ["UB+UR", "M' U M' U M"],
    ["UR+DB", "M' U' M U M"],
    ["UB+UR+DF+DB", "M2 U M' U M"],
    ["DF+DB", "M U M U' M' U M"],
    ["UF+UB", "M U M' U' M U M"],
    ["UF+UB+UL+UR+DF+DB", "M U M U M' U' M U M"]
  ];

const mkSet = (L, t) => L.map(([n, a]) => A(n, a, t));

M.Roux.sets = {
  CMLL: mkSet(CM42, "Corners only; edges can end up anywhere"),
  EO: EOA.map(([b, a]) => A(
    "Flip " + b,
    a,
    "Edges listed here are \u201cbad\u201d (their U/D sticker is not on the U or D face). Turn U first so the bad edges match."
  )),
  LSE: M.Roux.sets.LSE
};

M.ZZ.sets = {
  OCLL: OC,
  COLL: mkSet(COL, "Corners only; last-layer edges stay oriented"),
  EPLL: M.CFOP.sets.PLL.filter((c) => /^(Ua|Ub|H|Z) perm$/.test(c.n))
};

M.Roux.d = "First block \u2192 second block \u2192 CMLL \u2192 LSE. Blocks are intuitive (see the first-block and second-block tips on speedsolving sites). Below: all 42 CMLL cases (they solve the 4 top corners and keep both blocks), the LSE edge-orientation cases (only M and U moves), and the edge permutations.";
M.ZZ.d = "EOLine \u2192 F2L with R, U, L only \u2192 COLL \u2192 EPLL. No cube rotations. Below: the 7 OCLL shapes, all 42 COLL cases (solve the top corners while the top edges stay oriented) and the 4 EPLL cases.";

/*ADV-END*/
/*ZB-START*/
// ZBLL: 493 cases = 7 corner shapes x 6 corner cases (H has 4) x edge permutations, plus the 21 PLL-type cases.
// Algorithms come from a computer search (R, U, F moves, 7-16 moves). Edit freely or add your own with the page buttons.
const ZN = [
  "3-cycle of edges", "4-cycle of edges", "Edges already in place", "Swap two adjacent edges",
  "Swap two neighbouring pairs of edges", "Swap two opposite edges",
  "Swap two opposite pairs of edges"
],
  ZB = [
    [
      "Sune",
      [
        [
          "Sune 1",
          [
            ["R U R' U R U2 R'", 0],
            ["R' U2 R U R' U R", 0],
            ["F2 R2 F U2 F U F' U F' R2 F2", 0],
            ["R U R2 U' R2 U' R2 U2 R2 U2 R'", 3],
            ["R' U2 R2 U R2 U R U' R U' R'", 6],
            ["R' U2 R2 U2 R2 U' R2 U' R2 U R", 3],
            ["R2 F2 R' U R' U R U2 R F2 R2", 0],
            ["R' F' U' F U R F U R U' R' F'", 4],
            ["R2 U R U' R' U' R U2 R U' R2 U' R2", 1],
            ["R2 U R' U R2 U2 R2 U R2 U R' U' R2", 3],
            ["R2 U' R' U' R2 U R U R2 U R' U R", 4],
            ["F2 U2 R' F2 R U2 F2 U' R U2 R' U2 R U' R'", 6]
          ]
        ],
        [
          "Sune 2",
          [
            ["R' U2 R U F R' U R U' F'", 1],
            ["F R' U' R2 U' R2 U2 R2 U' R' F'", 3],
            ["F' U F' U' R U2 F U2 F' R' U F2", 3],
            ["F R' U2 R U2 F U' F2 R' U R F2 U F2", 1],
            ["F U F' U F U' R U2 R' U R U R' F'", 1],
            ["R U R' U R F U' R' U R U F' U R'", 0],
            ["R U2 F2 U' R' F' U F2 R F U2 R' U' F", 4],
            ["R' F R U2 F' U R U R' F' U2 F2 U' F'", 1],
            ["R' F' U' F R' F R U2 F2 U' F2 U' F' R", 1],
            ["R' U2 R F' R' F U' F' R F U2 R' U R", 0],
            ["R U R2 F' U' R' U' R U F R U R2 U2 R'", 4],
            ["R' F2 R2 U R' F2 U' F2 U F2 R' F2 R2 U2 R'", 1]
          ]
        ],
        [
          "Sune 3",
          [
            ["F R' U R U' F' U R' U' R", 2],
            ["F U2 F R F' U' F' U F R' U2 F'", 0],
            ["R' U2 F' R U R' U' R' F R U2 R", 0],
            ["R' F2 U' F2 R U' R' U' F2 U2 F2 U' R", 0],
            ["R' U' R' U' R F U' R' U2 R U F' R", 0],
            ["F U F' R2 F U' F2 U2 F U' F' U' F R2", 0],
            ["F U F' U R F R' U' R F' R' F U' F'", 0],
            ["R F U2 F' R' U F U2 F' R F U' F' R'", 4],
            ["R' U' R F' R' F U' F' R F U R' U R", 0],
            ["R' U2 R2 U2 F' U2 R' U2 F R' F' R2 F R2", 5],
            ["R2 U R2 U F R' F' U2 R' U2 F R2 F' R'", 1],
            ["R2 F' R F2 R' U2 R U2 F' U2 F' R' F U2 R2", 2]
          ]
        ],
        [
          "Sune 4",
          [
            ["R' U' F U F' R U F U2 F'", 1],
            ["R' F' U' F2 U2 F2 U' F2 U' F' R", 3],
            ["R2 U F' R' U2 R U2 F U' R' U R'", 3],
            ["F' U2 F2 U F2 U F R F R' U2 R F' R'", 0],
            ["F2 U2 R' F2 R F2 U F2 U F2 U R U2 R'", 3],
            ["R U' F' U2 R F R2 U R' F' U' R2 U2 F", 4],
            ["R U2 R' F2 U' F2 U' F2 U2 F2 U' R U2 R'", 3],
            ["R' U' F U' R2 U R2 U F' R U' R U' R'", 6],
            ["R' U' R2 U2 R' F' U F U R' U2 F R F'", 1],
            ["R2 U R2 F U F' R2 U' R U2 F U2 F' R", 1],
            ["F' U2 F2 R2 F' R2 U R2 U' R2 F' U F2 R2 F'", 1],
            ["R F U' R' U2 R' U' R2 U F' R U R2 U' R2", 5]
          ]
        ],
        [
          "Sune 5",
          [
            ["F R' U2 R F' R' F U2 F' R", 2],
            ["F R' U R U F' R' U F U F' R", 6],
            ["F' U2 F2 R2 U F2 U F2 U' R2 U' F'", 0],
            ["R' U' F2 U' R2 U R2 U F2 R2 U2 R'", 0],
            ["R F2 R2 U R U2 R' U R U R F2 R'", 3],
            ["R F2 U R U R U' R U R2 U2 F2 R'", 3],
            ["F' R U2 R U2 R' F R U2 R2 U' R U' R'", 0],
            ["R' U' F U F' R U2 R F R' U R F' R'", 1],
            ["F R2 F' U2 R' U2 R2 U2 R U2 R F R F' R", 5],
            ["F' U' F R2 U2 R2 F' U F2 U' R2 U2 R2 U F'", 0],
            ["R U2 R2 U F2 U' F2 U' R F2 U2 F2 R U' R'", 4],
            ["R' U F2 U2 F2 U' R2 U R' F2 U2 F2 R U' R'", 0]
          ]
        ],
        [
          "Sune 6",
          [
            ["F R' U2 R U2 F U' R' U R U F2", 3],
            ["R2 U F U F' U' R U2 F U2 F' R", 3],
            ["R' F R F' U R U R' U2 F R' F' R", 0],
            ["F U' R' U R U F' R U R2 U R2 U2 R'", 3],
            ["R U F' U2 R' U' R U' F R' U R U2 R'", 4],
            ["R U R2 F2 R U2 R U2 R' F2 U R U2 R'", 6],
            ["R U2 R' U F2 U' F2 U' F2 U2 F2 R U' R'", 4],
            ["R' F' U' F U F' U' F R' F R F' U R", 0],
            ["R' U2 R U2 R' F' U2 F U2 R' F R F' R", 6],
            ["F R' F' R' U R U' R' F U R2 U' F' U R'", 0],
            ["F' U2 F' U R' F' R F U F' U2 F2 R U R'", 0],
            ["R U2 R F2 U2 R2 U' R U R U2 F2 R' U2 R'", 0]
          ]
        ]
      ]
    ],
    [
      "Anti-Sune",
      [
        [
          "Anti-Sune 1",
          [
            ["R U2 R' U' R U' R'", 0],
            ["R' U' R U' R' U2 R", 0],
            ["F2 R2 F U' F U' F' U2 F' R2 F2", 0],
            ["R U2 R2 U' R2 U' R' U R' U R", 6],
            ["R U2 R2 U2 R2 U R2 U R2 U' R'", 3],
            ["R' U' R2 U R2 U R2 U2 R2 U2 R", 3],
            ["R2 F2 R' U2 R' U' R U' R F2 R2", 0],
            ["F R U R' U' F' R' U' F' U F R", 4],
            ["R2 U R U R2 U' R' U' R2 U' R U' R'", 4],
            ["R2 U R2 U R' U' R2 U R2 U' R U' R2", 0],
            ["R2 U R2 U R' U2 R' U R U R' U' R2", 1],
            ["R U2 R' U F2 U2 R' F2 R U2 F2 U2 R U R'", 6]
          ]
        ],
        [
          "Anti-Sune 2",
          [
            ["R' U R U' F U R' U' R F'", 2],
            ["F U2 F' R' U' R F R' U R U2 F'", 0],
            ["R' U2 F U F' R F U' F' R' U2 R", 0],
            ["F U F U F2 U' R F' U' F2 U F R'", 1],
            ["R' F U' R' U2 R U F' R' U R U R", 0],
            ["F' R U' R' F' R' F R F U R' F2 R F'", 3],
            ["F2 U' F2 U' F2 R' F2 R U2 F2 U R U R'", 0],
            ["R F U F' R' F U2 F' U' R F U2 F' R'", 4],
            ["R' F R2 F' U R F R F' R' F' U' F R'", 3],
            ["R' U' R F U' R' U R U F' U' R' U R", 0],
            ["R2 F' R2 F R F' U2 R U2 F U2 R2 U2 R", 5],
            ["F2 R2 U F2 U F2 U' R U' R F2 U' R' U2 R", 1]
          ]
        ],
        [
          "Anti-Sune 3",
          [
            ["F U R' U' R F' U' R' U2 R", 1],
            ["F R U R2 U2 R2 U R2 U R F'", 3],
            ["F2 U' R F U2 F' U2 R' U F U' F", 3],
            ["F R U' R' U' R U2 R' U F' U' F U' F'", 1],
            ["F U F2 U2 F R U' R' U' F U2 R' F' R", 1],
            ["F' U R U2 F' R' F2 U' F R U F2 U2 R'", 4],
            ["F2 U' F2 R' U' R F2 U F' U2 R' U2 R F'", 1],
            ["R U' F U' R' U' R U F' R' U' R U' R'", 0],
            ["R' F U F2 U F2 U2 R' F' R F' U F R", 1],
            ["R' U' F' R U R' U' R' F R2 U' R' U R", 1],
            ["R U2 R2 U' R' F' U' R' U R U F R2 U' R'", 4],
            ["R2 U' F' R' U F U F' R U2 F U' R' U2 R'", 0]
          ]
        ],
        [
          "Anti-Sune 4",
          [
            ["F U2 F' U' R' F U' F' U R", 1],
            ["R' F U F2 U F2 U2 F2 U F R", 3],
            ["R U' R U F' U2 R' U2 R F U' R2", 3],
            ["F R' F' U2 R U' F' U' F R U2 R2 U R", 1],
            ["F' U' F U' F' R' U F U' F' U' R U' F", 0],
            ["F' U2 R2 U F R U' R2 F' R' U2 F U R'", 4],
            ["R F2 U' R F U2 F' U2 R' U F U' F R'", 3],
            ["R U R' U R' F U' R2 U' R2 U F' U R", 6],
            ["R U2 R' U F2 U2 F2 U F2 U F2 R U2 R'", 3],
            ["R' F U2 F' U2 R' U R2 F U' F' R2 U' R2", 1],
            ["F R' F' U2 R U F' R' U R U F R U' R'", 4],
            ["F2 R F2 U' R2 F2 U R2 U' R F2 U' R U R'", 1]
          ]
        ],
        [
          "Anti-Sune 5",
          [
            ["R' F U2 F' R F R' U2 R F'", 2],
            ["F U R2 U F2 U' F2 U' R2 F2 U2 F", 0],
            ["R U2 R2 F2 U' R2 U' R2 U F2 U R", 0],
            ["R' F U' F' U' R F U' R' U' R F'", 6],
            ["R F2 R' U' R' U' R U2 R' U' R2 F2 R'", 3],
            ["R' U F2 U R2 U R2 U2 F2 U' R2 U2 R'", 0],
            ["R' U F U' F' U' R U' R' F U' F' U R", 0],
            ["R' U' F R' F' R F' U2 F U F' U' F R", 1],
            ["F U' R2 U2 R2 U F2 U' F R2 U2 R2 F' U F", 0],
            ["R U R' F2 U2 F2 R' U F2 U F2 U' R2 U2 R'", 4],
            ["R' F2 R U2 F U2 F2 U2 F' U2 F' R' F' R F'", 5],
            ["R2 F2 R2 U' R U2 R' U' R U2 R F2 R' U R'", 3]
          ]
        ],
        [
          "Anti-Sune 6",
          [
            ["F2 U' R' U' R U F' U2 R' U2 R F'", 3],
            ["R' F U2 F' U2 R' U F U' F' U' R2", 3],
            ["R' F R F' U2 R U' R' U' F R' F' R", 0],
            ["F2 U F2 U F2 U' R' U' R F2 U' R' U2 R", 1],
            ["R U R' F2 U2 F2 U F2 U F2 U' R U2 R'", 4],
            ["R U2 R' U' F2 R U2 R' U2 R' F2 R2 U' R'", 6],
            ["R U2 R' U' R F' U R' U R U2 F U' R'", 4],
            ["R U2 R2 U' R2 F' R U R' U' R' F U' R'", 3],
            ["R' U' F R' F' R F' U F U' F' U F R", 0],
            ["R U2 R F2 U2 R' U' R' U R2 U2 F2 R' U2 R'", 0],
            ["R' U F' R F U R' U R U2 F' R' F U' R", 0],
            ["R2 U R2 F' R U R' U R U2 R' F R2 U' R2", 0]
          ]
        ]
      ]
    ],
    [
      "H",
      [
        [
          "H 1",
          [
            ["R U R' U R U' R' U R U2 R'", 0],
            ["R U2 R' U' R U R' U' R U' R'", 0],
            ["R' U' R U' R' U R U' R' U2 R", 0],
            ["R' U2 R U R' U' R U R' U R", 0],
            ["R U2 R2 U2 R' U2 R U2 R' U2 R2 U2 R", 5],
            ["R' U2 R2 U2 R U2 R' U2 R U2 R2 U2 R'", 5],
            ["F' U' F U' F' U2 F R U2 R' U' R U' R'", 6],
            ["F' R U' F' R2 U2 F U2 R F' U R F2 U2 R'", 6]
          ]
        ],
        [
          "H 2",
          [
            ["R' F2 R2 U2 R' F2 R U2 R2 F2 R", 6],
            ["R' F R' F' R F' U2 F R' F R F' R", 6],
            ["F' U' F2 R' F' R U2 F' U' F U' R U' R'", 0],
            ["R U R' U2 F2 U' F2 U' F2 U2 F2 R U' R'", 0],
            ["R U' R2 F2 U' R2 U' R2 U F2 U R2 U R'", 0],
            ["R U' R2 U' F2 U' R2 U R2 U F2 R2 U R'", 0],
            ["F' R' F2 R U2 F' U2 F U2 F U' F2 R' F' R", 4],
            ["R U2 R' U' R2 F2 U2 R' U' R U' F2 R' U' R'", 4]
          ]
        ],
        [
          "H 3",
          [
            ["F' R' F2 U F2 U F2 U2 F2 U R F", 3],
            ["F' U2 F2 R' U F2 U F2 U' R U' F'", 0],
            ["R F R2 U' R2 U' R2 U2 R2 U' F' R'", 3],
            ["R U2 R2 F U' R2 U' R2 U F' U R", 0],
            ["F U2 F' U' R' F U' F' R U' R' U2 R", 3],
            ["R' U2 R U F R' U R F' U F U2 F'", 3],
            ["F' U F2 R2 F' U2 F' U2 F R2 U F' U2 F", 6],
            ["F2 U F2 U2 R' U2 R U2 F2 U' F2 R' U R", 5],
            ["R U' R2 F2 R U2 R U2 R' F2 U' R U2 R'", 6],
            ["R' F2 R2 U R2 U F2 U' F2 U' F2 R2 U' R'", 3],
            ["R' U2 R U2 R2 F' R U R U' R' F U R", 1],
            ["F R U R' U' R' F' U2 R U R' U R2 U2 R'", 4]
          ]
        ],
        [
          "H 4",
          [
            ["F R F' U2 F' U2 F R' U F' U F", 0],
            ["R' F' R U2 R U2 R' F U' R U' R'", 0],
            ["F2 U F2 U' R' F2 U' F2 U R F2 U' F2", 1],
            ["R U' R' U2 R' U' F U R2 U' R2 F' R", 0],
            ["R' U2 F2 U' F U' F' U2 F U' F U2 R", 3],
            ["R2 U' R2 U F R2 U R2 U' F' R2 U R2", 1],
            ["F R' F' U2 R U2 R F R' F' U2 R2 U2 R", 5],
            ["F U F' R' U F U2 F' U2 R U' R' U2 R", 5],
            ["R2 U F2 U2 F U R2 U' R2 F' U F2 U' R2", 1],
            ["R2 U' R' F R F' U R2 U' R2 F R F' R", 1],
            ["F R2 F2 U' F U' R2 U' R2 U F' U2 F2 R2 F'", 0],
            ["R' F2 R2 U R' U F2 U F2 U' R U2 R2 F2 R", 0]
          ]
        ]
      ]
    ],
    [
      "Pi",
      [
        [
          "Pi 1",
          [
            ["R U2 R2 U' R2 U' R2 U2 R", 0],
            ["R' U2 R2 U R2 U R2 U2 R'", 0],
            ["R U2 R2 U' R U' R' U2 R U R U' R'", 4],
            ["R' U' R U' R' U2 R2 U2 R' U' R U' R'", 0],
            ["R' U2 R U R' U R2 U R' U R U2 R'", 0],
            ["R' U2 R2 U R' U R U2 R' U' R' U R", 4],
            ["F U F' U F U2 F' R U R' U R U2 R'", 6],
            ["R U F' U2 R' U' R U R' U' R U' F U' R'", 0],
            ["R U R U R2 U R2 U2 R' U2 R' U2 R U' R'", 0],
            ["R U R' U2 R U2 R U2 R2 U' R2 U' R' U' R'", 0],
            ["R U2 R' U' R U R2 U2 R2 U R2 U R2 U' R'", 1],
            ["R2 U2 R' U' R' U R U' R U' R2 U R U' R'", 0]
          ]
        ],
        [
          "Pi 2",
          [
            ["F' U' F U' R2 F' U2 F U2 F R2 F'", 0],
            ["R' F2 R U2 R U2 R' F2 U' R U' R'", 0],
            ["F R2 F' U F2 R2 F' U' F' U' F2 R2 F2", 1],
            ["F U R' F' R2 F2 R' F' U' R F' U R'", 1],
            ["F2 R2 F2 U' F R2 F' U F2 R2 F' U' F'", 1],
            ["R' U' R' F2 R2 U R' F2 R U' R2 F2 R2", 1],
            ["R2 F2 R2 U' R' U' R' F2 R2 U R' F2 R", 1],
            ["R2 F2 R2 U2 R U2 R F2 R2 U' R U' R'", 0],
            ["R U R2 F' R U2 R U2 R' F U R U2 R'", 6],
            ["R U' F' U2 R' U F U' F' R U2 F U' R'", 6],
            ["R2 U' F' U F U R2 U' R2 U' R2 F R2 F'", 5],
            ["F R2 U R U' R2 U2 F' U' R2 F R U' F' R", 5]
          ]
        ],
        [
          "Pi 3",
          [
            ["F U R' U F2 U' F2 U' R F2 U2 F", 0],
            ["F' R' U' F2 U2 F2 U' F2 U' F2 R F", 3],
            ["R F U R2 U2 R2 U R2 U R2 F' R'", 3],
            ["R' U' F U' R2 U R2 U F' R2 U2 R'", 0],
            ["F U2 F' U' F R' U' R F' U' R' U2 R", 3],
            ["R' U2 R U R' F U F' R U F U2 F'", 3],
            ["F' U2 F U' R2 F' U2 F U2 F R2 F2 U' F", 6],
            ["R U R2 F2 U F2 U F2 U' R2 U' R2 F2 R", 3],
            ["R U2 R' U F2 R U2 R' U2 R' F2 R2 U R'", 6],
            ["R' F2 R2 U2 R2 U F2 U2 F2 U' F2 R2 U' R'", 3],
            ["R' U' F' U F U' F' U2 F U F' U' F R", 5],
            ["R' F2 U2 R2 U' R U2 F2 U2 R U' F2 R2 U' R'", 5]
          ]
        ],
        [
          "Pi 4",
          [
            ["F' U' F U' R F' U2 F U2 F R' F'", 0],
            ["R U R' U F' R U2 R' U2 R' F R", 0],
            ["F2 U F2 R' U' F2 U F2 R U F2 U' F2", 1],
            ["R' F R2 U R2 U' F' U R U2 R U R'", 0],
            ["R' U2 F' U F' U2 F U F' U F2 U2 R", 3],
            ["R2 U' R2 F U R2 U' R2 F' U' R2 U R2", 1],
            ["F U2 F' U' F U2 R' U2 R U F' R' U R", 5],
            ["F U2 F2 U2 R' F' R F U2 F U2 R' F' R", 5],
            ["R' F R' F' R2 U R2 U' F R' F' R U R2", 1],
            ["R2 F U R' F' R' F U' R2 F' U R' U' R", 2],
            ["F R2 F2 U2 F U' R2 U R2 U F' U F2 R2 F'", 0],
            ["R' F2 R2 U2 R' U F2 U' F2 U' R U' R2 F2 R", 0]
          ]
        ],
        [
          "Pi 5",
          [
            ["F R2 F' U2 F' U2 F R2 U F' U F", 0],
            ["R U R' U F2 R U2 R' U2 R' F2 R", 0],
            ["F U F R2 F2 U' F R2 F' U F2 R2 F2", 1],
            ["F2 R2 F2 U F U F R2 F2 U' F R2 F'", 1],
            ["R U R' U' R2 F2 R2 U2 R U2 R F2 R2", 0],
            ["R' F2 R U' R2 F2 R U R U R2 F2 R2", 1],
            ["R2 F2 R2 U R' F2 R U' R2 F2 R U R", 1],
            ["R2 F2 R2 U' R U R' U R2 F2 R' U2 R'", 1],
            ["F2 U R U' R' U' F2 U F2 U F2 R' F2 R", 5],
            ["R U F' U2 R' F U F' U' R U2 F U R'", 6],
            ["R U2 R' U' F' R U2 R' U2 R' F R2 U' R'", 6],
            ["R' F2 U' F' U F2 U2 R U F2 R' F' U R F'", 5]
          ]
        ],
        [
          "Pi 6",
          [
            ["F' R U F2 R' U R U' F2 U' R' F", 0],
            ["F' R U F2 U R' U' R F2 U' R' F", 0],
            ["R F' U' R2 F U' F' U R2 U F R'", 0],
            ["R F' U' R2 U' F U F' R2 U F R'", 0],
            ["R F U' R2 U' R U' R' U2 R2 U F' R'", 0],
            ["R F U' R2 U2 R U R' U R2 U F' R'", 0],
            ["R' F' U F U2 F U2 F2 U' F2 U' F' U R", 2],
            ["F U R2 U' R2 F' R' U R U' R U2 R U2 R'", 5],
            ["F' U2 F U2 F U' F U F' R' F2 U' F2 U R", 5],
            ["R' F' R' F2 R2 U2 R U2 R F2 R2 F R U2 R'", 6],
            ["R' U R U R2 U2 R U F' R' U R U' F R", 1],
            ["R2 U2 F2 U R U R2 U R U2 F2 R' U F2 R'", 0]
          ]
        ]
      ]
    ],
    [
      "U",
      [
        [
          "U 1",
          [
            ["R' U2 R U2 F U' R' U R U F'", 3],
            ["F R F' R' F U2 F' R F R' U2 F'", 2],
            ["F U2 R' U' R F' R' U2 F U F' U' R", 1],
            ["F' R2 F U' F2 U2 F2 U' F2 U' F R2 F", 3],
            ["F' U F R' F2 U' R F' R' U F' R F'", 0],
            ["F' U2 R' U' R F U' R' U2 R F' U2 F", 4],
            ["R2 F R' U R F' R' U F U2 F' U R'", 3],
            ["F' U' F U2 R2 F' U2 F U2 F R2 F2 U' F", 0],
            ["F2 U2 R F2 R' F2 U F2 U R U' F2 U R' F2", 2],
            ["R U2 R2 U' R F' U' R' U2 R U F R U' R'", 4],
            ["R' F' U2 F2 U F2 U F R' U F U F' U' R2", 3],
            ["R2 U R U R2 U2 R' F R2 U R2 U' F' U2 R'", 1]
          ]
        ],
        [
          "U 2",
          [
            ["F U2 F' U' R F R' U' R F' R'", 0],
            ["R' F' R F R' U2 R F' R' F U2 R", 2],
            ["F2 R' F U' F' R F U' R' U2 R U' F", 3],
            ["R F2 R' U R2 U2 R2 U R2 U R' F2 R'", 3],
            ["R U' R' F R2 U F' R F U' R F' R", 0],
            ["R U2 F U F' R' U F U2 F' R U2 R'", 4],
            ["R' U2 F U F' R F U2 R' U' R U F'", 1],
            ["R U R' U2 F2 R U2 R' U2 R' F2 R2 U R'", 0],
            ["F' U F U F' U2 F U2 R U' R' U2 R U' R'", 4],
            ["R F2 U F' R2 F U2 R2 U R2 U F' R2 F' R'", 3],
            ["R' U F' U F R' U R U F' U F R' U R2", 2],
            ["R' U2 F U' R' F R U2 F' U' F' U' R' F2 R2", 3]
          ]
        ],
        [
          "U 3",
          [
            ["F U' R' U R U F' R' U2 R", 1],
            ["F U2 F' R' U F U F' U' R", 1],
            ["R' U F U' F' U' R F U2 F'", 1],
            ["R' U2 R F U' R' U' R U F'", 1],
            ["F R F' U' R U2 F R2 F' U' R' U' R'", 1],
            ["F U' F' U2 R' U2 R U F R' U R F'", 5],
            ["R U R U F R2 F' U2 R' U F R' F'", 1],
            ["R' F U F' R U F U2 F' U2 R' U' R", 5],
            ["R' F2 U' F2 U' F' U F' U F U2 F U2 R", 2],
            ["F R U R' U' F' R' F R2 F' U2 F' U2 F R'", 0],
            ["R F' U2 F U2 F R2 F' R F U R U' R' F'", 0],
            ["R F R2 U R2 U' F' R' U R2 U2 R2 U2 R' U2 R'", 1]
          ]
        ],
        [
          "U 4",
          [
            ["F U2 F' R F R' U2 R F' R'", 2],
            ["R' U2 R F' R' F U2 F' R F", 2],
            ["F' R' U F U F' U2 F U F' R F", 3],
            ["R F U' R' U' R U2 R' U' R F' R'", 3],
            ["F2 R2 F' U2 F' U' F2 R2 F2 U' F R2 F'", 0],
            ["R U2 F2 R F' R F R2 F' R F' U2 R'", 5],
            ["R' F' U F U' F' U' F U' F' U F R", 5],
            ["R2 F2 R U2 R U R2 F2 R2 U R' F2 R", 0],
            ["F U F' R' U F U F' U' R U' F U' F'", 0],
            ["F' U2 F U' R' U R U F' U F R' U R", 3],
            ["R U2 R' U F U' F' U' R U' R' F U' F'", 3],
            ["R' U' R F U' R' U' R U F' U R' U R", 0]
          ]
        ],
        [
          "U 5",
          [
            ["F R' U' R U' R' U2 R F' U2 F U F'", 1],
            ["F U R' F R F2 U F U' R U' R' F'", 0],
            ["R U R' U R U2 R2 U' R U' R' U2 R", 4],
            ["R U R' U R' U2 R2 U R2 U R2 U' R'", 1],
            ["R' F U F' U F U2 F' R U2 R' U' R", 1],
            ["R' U' F R' F' R2 U' R' U F' U F R", 0],
            ["R' U' R U' R U2 R2 U' R2 U' R2 U R", 1],
            ["R' U' R U' R' U2 R2 U R' U R U2 R'", 4],
            ["F' U2 F U F' U F R' U' R U' R' U2 R", 0],
            ["R U' F U2 F' R' U2 R U' F U F' U2 R'", 1],
            ["R U2 R' U' R U' R' F U F' U F U2 F'", 0],
            ["R2 U R2 U2 R' U' R U' R U' R U' R2 U2 R'", 6]
          ]
        ],
        [
          "U 6",
          [
            ["F U2 F U R U' R' F2 U F R' F R F2", 1],
            ["F' U F2 U F2 U' R' U' R F2 R' U R F'", 3],
            ["F2 R' F' R F' U' F2 R U R' U' F' U2 F'", 1],
            ["R U R' U R' F2 U' R2 U' R2 U F2 U R", 6],
            ["R' U' F2 U' R2 U R2 U F2 R U' R U' R'", 6],
            ["R' U2 R' U' F' U F R2 U' R' F R' F' R2", 1],
            ["R2 F R F' R U R2 F' U' F U R U2 R", 1],
            ["R2 F' U F U F' U' R' U' R F R' U R'", 3],
            ["R F2 R2 U R' U' R' F U F' R' F U' F R'", 3],
            ["R' F2 U' R F2 R' U F2 R2 U R' U R U' R'", 3],
            ["R' U R U2 R F2 R2 U' R U R' U R2 F2 R'", 4],
            ["R2 U' R2 F2 U' R F2 R' U F2 R2 U R' U' R'", 5]
          ]
        ]
      ]
    ],
    [
      "T",
      [
        [
          "T 1",
          [
            ["F U F' R' F U' F' U R", 1],
            ["R' U' F' U2 F U' F' U' F R", 3],
            ["F' U' F U F R F' U2 F' U2 F R'", 0],
            ["F U2 F U2 F2 U' R F' U' F U F R'", 0],
            ["F U2 F' R' U F U' F' U' R F U' F'", 4],
            ["F2 U R U2 R' F2 U2 R' F2 R F2 U F2", 0],
            ["R F U R' U' R U' R' U' R U F' R'", 5],
            ["R F U R2 U' R2 F' U R U R2 U' R2", 1],
            ["R U R' F2 U' F2 U' F2 R' F2 R U2 F2", 3],
            ["R' U R F2 R F2 U' F2 U R2 U' R F2", 2],
            ["R2 U F R2 F' R2 U2 F' U2 F R2 U R2", 0],
            ["R F' U2 F R U F R' F' R' U R U2 R2", 3]
          ]
        ],
        [
          "T 2",
          [
            ["R' U' R F R' U R U' F'", 1],
            ["F U' R' U2 R U F' R' U R", 1],
            ["F' U2 F U2 F R' F' U' F' U F R", 0],
            ["F U' F' R2 F' R2 U R2 U' F2 U F' R2", 2],
            ["F' R' U' F U F' U F U F' U' R F", 5],
            ["F' R' U' F2 U F2 R U' F' U' F2 U F2", 1],
            ["F' U' F R2 U R2 U R2 F R2 F' U2 R2", 3],
            ["R F2 U2 R F2 R' U R F2 R' U F2 R'", 0],
            ["R' U2 R F U' R' U R U F' R' U R", 4],
            ["R2 F2 R U2 R U2 R' F2 R U' R' U R", 0],
            ["R2 U' F' U2 F R2 U2 F R2 F' R2 U' R2", 0],
            ["F' R U2 R' F' U' R' F R F U' F' U2 F2", 3]
          ]
        ],
        [
          "T 3",
          [
            ["F' R' F U2 F' R F R' U2 R", 2],
            ["R F R' U2 R F' R' F U2 F'", 2],
            ["F' R' F U' F' U2 F U' F' U' R F", 3],
            ["R F R' U R U2 R' U R U F' R'", 3],
            ["F R2 F' U F2 R2 F2 U F U2 F R2 F2", 0],
            ["R U2 F R' F R2 F' R' F R' F2 U2 R'", 5],
            ["R' F' U' F U F' U F U F' U' F R", 5],
            ["R' F2 R U' R2 F2 R2 U' R' U2 R' F2 R2", 0],
            ["F U F' R U2 R F R' U R F' R' U R'", 3],
            ["F U F' U R' U F U' F' U' R F U' F'", 0],
            ["R' U' R F' U2 F' R' F U' F' R F U' F", 3],
            ["R' U' R U' F U' R' U R U F' R' U R", 0]
          ]
        ],
        [
          "T 4",
          [
            ["F U' F' U' R U' F U' F' U2 R'", 0],
            ["F' U2 R' U' R U' F U' R' U' R", 0],
            ["F' U' F R U R' F R' F' R2 U' R'", 3],
            ["F' U' F2 R' F' R F' U F R U' R'", 3],
            ["F U F' U F U' F' R' U F U2 F' U' R", 3],
            ["F U' R' U2 R U F' R' U' R U R' U R", 3],
            ["R' U F U2 F' U' R F U F' U' F U' F'", 3],
            ["R' U' R U' R' U R F U' R' U2 R U F'", 3],
            ["R2 U2 R' F2 R2 F2 R' F2 R' F2 U2 R' U2 R'", 5],
            ["F' U' F2 R U R' U' F2 U F2 R' F' R2 U' R'", 1],
            ["F' U2 R' U2 R F R2 U' R' U' R' U2 R' U' R'", 1],
            ["F2 R2 F2 R' U2 R U2 R U2 F2 R2 F2 R U2 R'", 5]
          ]
        ],
        [
          "T 5",
          [
            ["F U' R F U2 F' U2 R' U F U' F2", 3],
            ["F2 U F' U' R U2 F U2 F' R' U F'", 3],
            ["R' U F' R' U2 R U2 F U' R' U R2", 3],
            ["R2 U' R U F' U2 R' U2 R F U' R", 3],
            ["R' F' U2 F U' F2 U2 F U F' U F2 U' R", 0],
            ["R' U F2 U' F U' F' U2 F2 U F' U2 F R", 0],
            ["F R' F' R2 F' R F2 U2 R2 U2 F2 R' F U2 R'", 6],
            ["F U' F' U' R2 F R' U2 R F' R2 U' R U' R'", 4],
            ["F2 R U2 R' F2 U2 R U R2 U' F2 U R2 U' R'", 6],
            ["R U F' U2 R' U R U2 R' U' R U2 F U' R'", 4],
            ["R U R F2 U2 R' U' R U' F2 R2 U R U2 R'", 0],
            ["R U2 R' U' R2 F2 U R' U R U2 F2 R' U' R'", 0]
          ]
        ],
        [
          "T 6",
          [
            ["F R U R' U F' U' F2 R' F' R U' F'", 0],
            ["F U' F' U2 F R' U2 R U R' U R F'", 1],
            ["R U R2 U' R2 U' R2 U2 R U' R U' R'", 1],
            ["R U2 R' U' R U' R2 U2 R U R' U R", 4],
            ["R' F' U' F U' R U R2 F R F' U R", 0],
            ["R' U R U2 R' F U2 F' U' F U' F' R", 1],
            ["R' U' R2 U R2 U R2 U2 R' U R' U R", 1],
            ["R' U2 R U R' U R2 U2 R' U' R U' R'", 4],
            ["F U2 F' U' F U' F' R U R' U R U2 R'", 0],
            ["R U2 F U' F' U R' U2 R F U2 F' U R'", 1],
            ["R' U2 R U R' U R F' U' F U' F' U2 F", 0],
            ["F2 R F U' R' F2 U2 F R U2 F2 U' F' U2 R'", 1]
          ]
        ]
      ]
    ],
    [
      "L",
      [
        [
          "L 1",
          [
            ["R' U' F U F' R F U' F'", 1],
            ["F U F' R' U F U2 F' U' R", 1],
            ["F R U R' U' R' F' R U2 R U2 R'", 0],
            ["F R' U F U' F' U' R F U2 F' U2 F'", 3],
            ["F U F' R' U F U F' U' R F U2 F'", 4],
            ["F U F' U F U' F' R' F U' F' U R", 3],
            ["F2 R' U R2 U' F2 U F2 R' F2 R' U' R", 2],
            ["F2 U' F2 R' F2 R U2 F2 R U2 R' U' F2", 0],
            ["F2 U2 R' F2 R F2 U F2 U F2 R U' R'", 3],
            ["R F U' R' U R U R' U R U' F' R'", 5],
            ["R2 U R2 U' R' U' F R2 U R2 U' F' R'", 1],
            ["R2 U2 R' U' R F R F' U' R' F' U2 F R'", 3]
          ]
        ],
        [
          "L 2",
          [
            ["F U R' U' R F' R' U R", 1],
            ["F R U' R' U' R U2 R' U' F'", 3],
            ["F' R U2 R' U2 R' F R U R U' R'", 0],
            ["F' R' U F U' F' U' F U' F' U R F", 5],
            ["F2 U' F2 U F U R' F2 U' F2 U R F", 1],
            ["R F2 U' R F2 R' U' R F2 R' U2 F2 R'", 0],
            ["R' F U' R' U R U F' R' U2 R U2 R", 3],
            ["R' U' R F U' R' U' R U F' R' U2 R", 4],
            ["R2 F U' F2 U R2 U' R2 F R2 F U F'", 2],
            ["R2 U R2 F R2 F' U2 R2 F' U2 F U R2", 0],
            ["R2 U2 F R2 F' R2 U' R2 U' R2 F' U F", 3],
            ["F2 U2 F U F' R' F' R U F R U2 R' F", 3]
          ]
        ],
        [
          "L 3",
          [
            ["F' R' F U' F' R F U' R' U2 R", 0],
            ["F U2 R F' R' F U2 F' R F R' F'", 2],
            ["F R' F U' R F R' U F2 R F' U' F", 0],
            ["F' R2 F' U F2 U F2 U2 F2 U F' R2 F", 3],
            ["F' U2 F R' U2 R U F' R' U R U2 F", 4],
            ["R U' F U2 F' U' R F R' U' R F' R2", 3],
            ["R' U F U' F' U2 R F R' U R U2 F'", 1],
            ["F' U F2 R2 F' U2 F' U2 F R2 U2 F' U F", 0],
            ["F' U' F U2 F' U' F U2 R U2 R' U R U R'", 4],
            ["F2 U F' R U R' U F U F' R U R' U F'", 2],
            ["R F2 U' R' U R' U R U2 R' U R2 U F2 R'", 3],
            ["R2 U F U' F' U' R F' U' F2 U' F2 U2 F R", 3]
          ]
        ],
        [
          "L 4",
          [
            ["R F R' U R F' R' U F U2 F'", 0],
            ["R' U2 F' R F R' U2 R F' R' F R", 2],
            ["F U' R' U R U2 F' R' F U' F' U2 R", 1],
            ["F' U R' U2 R U F' R' F U F' R F2", 3],
            ["R F2 R U' R2 U' R2 U2 R2 U' R F2 R'", 3],
            ["R U2 R' F U2 F' U' R F U' F' U2 R'", 4],
            ["R' F R' U F' R' F U' R2 F' R U R'", 0],
            ["R U' R2 F2 R U2 R U2 R' F2 U2 R U' R'", 0],
            ["F R2 U F R2 F' U R' U' F' U2 F U R' F'", 4],
            ["R F R2 F U' R2 U' R2 U2 F' R2 F U' F2 R'", 3],
            ["R2 F2 R U F U F U2 R' F' R U F' U2 R", 3],
            ["R2 U' R F' U' F U' R' U' R F' U' F U' R", 2]
          ]
        ],
        [
          "L 5",
          [
            ["F U F' U2 R F R' U R F' R'", 0],
            ["R U F' U2 R' U' R U' F U' R'", 0],
            ["R' F' U' F2 R' F' R F' U F R", 0],
            ["F U2 F' R' U F U F' U R U R' U R", 3],
            ["R U' F2 U' R U' F2 U F2 R' U F2 U2 R'", 3],
            ["R U2 F2 U' R F2 U' F2 U R' U F2 U R'", 3],
            ["R' U' F2 U2 F2 U' R U R' F2 U2 F2 U R", 0],
            ["R' U2 R F U' R' U' R U' F' U' F U' F'", 3],
            ["F2 R U' R' U R U R2 F' R U R U' R' F'", 5],
            ["R' U2 R U R2 U R U F' R' U2 R U2 F R", 1],
            ["R2 F' U F U' F' U' F2 R F' U' F' U F R", 5],
            ["R2 F2 R2 F U F' R2 F R' U' R F R' U R'", 1]
          ]
        ],
        [
          "L 6",
          [
            ["F U F' U F U2 F' R' U' R U' R' U2 R", 0],
            ["F U' F' U R' U2 R F U2 F' U R' U' R", 6],
            ["F U' F' U' R U' R2 F U' F' U R2 U R'", 0],
            ["F U2 F' U' F U' F' R' U2 R U R' U R", 0],
            ["F' R' U F U F' U2 R F2 R' U R U' F'", 0],
            ["F' U F2 U R' U' R F2 U' F U' R' U' R", 0],
            ["R U2 R' U' R F' U2 F U F' U F U R'", 4],
            ["R' U' F U F' R2 F U2 R' U R U F' R'", 0],
            ["R' U' R U' R' U2 R F U F' U F U2 F'", 0],
            ["R' U2 R U R' U R F U2 F' U' F U' F'", 0],
            ["F U F' U F U2 F' U R U2 R' U' R U' R'", 5],
            ["R U2 R' U' R U R' U' R U R' U' R U' R'", 2]
          ]
        ]
      ]
    ],
    [
      "Permute",
      [
        [
          "Corners solved",
          [
            ["R2 U R U R' U' R' U' R' U R'", 0],
            ["R2 U' R' U' R U R U R U' R", 0],
            ["R2 U2 R' U2 R2 U2 R2 U2 R' U2 R2", 6],
            ["F2 R2 U' F2 U R2 F2 R2 U R2 U' R2", 4]
          ]
        ],
        [
          "Permute 1",
          [
            ["F' U2 R' U F U' F' U' R U' F", 0],
            ["R U' R F2 R' U R' U' R2 F2 R2", 1],
            ["R U2 F' R' F U' F' R F U' R'", 0],
            ["R2 F2 R2 U R U' R F2 R' U R'", 1],
            ["R2 F R U R U' R' F' R U2 R' U2 R", 0],
            ["R2 F2 U R U R' U' R' U' F2 R' U R'", 0],
            ["F R U' R' U R U R2 F' R U R U' R'", 5],
            ["F2 R2 U F2 U F2 U' R U' R F2 R' U R", 3],
            ["R2 F R F' R' U' F' U F R2 U R' U' R", 4],
            ["R2 F2 U F U F' R2 F U' F' R2 U' F2 R2", 0],
            ["R2 U R2 U2 F2 U' R2 U' R2 U F2 R2 U2 R2", 0],
            ["R2 U2 R2 F2 U' R2 U R2 U F2 U2 R2 U' R2", 0]
          ]
        ],
        [
          "Permute 2",
          [
            ["F' U F2 R2 U F' R2 F U' R2 F2 U' F", 4],
            ["F2 U F2 U F2 U' R' U' R F2 R' U R", 3],
            ["R U' R2 F2 U' R F2 R' U F2 R2 U R'", 4],
            ["R F R F' U F' U' F2 R' F' U' R' U R'", 3],
            ["R2 U F2 U2 F2 R2 U F2 U F2 U2 R2 U' R2", 6]
          ]
        ]
      ]
    ]
  ];

M.ZBLL = { d: "One-look last layer for ZZ (edges already oriented).", sets: {} };

ZB.forEach(([g, cl]) => {
  const L = [];
  cl.forEach(([cn, cs]) => cs.forEach(([a, z], i) => {
    const c = A(cn + " \u00b7 " + (i + 1), a, ZN[z]);
    c.g = cn;
    L.push(c);
  }));
  M.ZBLL.sets["ZBLL " + g] = L;
  GM["ZBLL " + g] = 2;
});

/*ZB-END*/
const F2 = [
  ["R U R'", 0],
  ["R U' R'", 0],
  ["F' U F", 0],
  ["F' U' F", 0],
  ["F' U' F R U R'", 0],
  ["R U R' F' U' F", 0],
  ["R U2 R2 F R F'", 0],
  ["F' U2 F2 R' F' R", 0],
  ["R U R' U2 R U' R'", 0],
  ["R U' R' U R U R'", 0],
  ["R U' R' U' R U R'", 0],
  ["R U2 R' U' R U R'", 0],
  ["R U2 R' U2 R U' R'", 0],
  ["R' U2 R2 U R2 U R", 0],
  ["R2 U2 R' U' R U' R2", 0],
  ["F' U F U2 R U R'", 0],
  ["R U' R' U F' U' F", 0],
  ["R U' R' U2 F' U' F", 0],
  ["R U2 R' U F' U' F", 0],
  ["R2 U2 F R2 F' U2 R2", 0],
  ["F2 U2 R' F R U2 F2", 0],
  ["F2 U2 R' F' R U2 F2", 0],
  ["F' U F U' F' U' F", 0],
  ["F2 U2 F U F' U F2", 0],
  ["F' U F R U R'", 1],
  ["F' U2 F R U2 R'", 1],
  ["R U' R' F' U' F", 1],
  ["R U2 R' F' U2 F", 1],
  ["F' U F U R U' R'", 1],
  ["R U' R' F R' F' R", 1],
  ["F' U2 F R U R'", 2],
  ["R U' R' U2 R U' R'", 2],
  ["R U2 R' U R U R'", 2],
  ["R2 U2 R2 U' R2 U' R2", 2],
  ["F' U' F U R U' R'", 2],
  ["R U R' F R' F' R", 2],
  ["R U2 R U R' U R U2 R2", 3],
  ["R2 U2 R' U' R U' R' U2 R'", 3],
  ["R F U R U' R' F' U' R'", 3],
  ["R U F R U R' U' F' R'", 3],
  ["R2 U2 F R2 F' U2 R' U R'", 3]
];

M.CFOP.sets.F2L = F2.map(([a, g], i) => A(
  "F2L " + (i + 1),
  a,
  [
    "Corner and edge both in the top layer", "Corner in slot, edge on top",
    "Edge in slot, corner on top", "Both pieces in the slot"
  ][g]
));

const UO = ls.get("cl_uo", {}), UX = ls.get("cl_ua", {});

for (const m in M) {
  for (const s in M[m].sets) {
    M[m].sets[s].forEach((c) => {
      c.id = c.id || c.a;
      if (UO[c.id]) {
        c.a = UO[c.id];
      }
    });
  }
}

const ALL = [];

for (const m in M) {
  for (const s in M[m].sets) {
    M[m].sets[s].forEach((c) => ALL.some((x) => x.a == c.a && x.s == s) ||
      ALL.push({ ...c, m, s, k: m + s + c.n }));
  }
}

const inv = (a) => a
  .split(" ")
  .reverse()
  .map((x) => x.endsWith("'") ? x.slice(0, -1) : x.endsWith("2") ? x : x + "'")
  .join(" ");

/* ---------- STATE ---------- */
const TABS = [
  ["home", "Home"],
  ["account", "Account"],
  ["timer", "Timer"],
  ["scr", "Scrambles"],
  ["hist", "Solves"],
  ["prog", "Progress"],
  ["theme", "Customize"],
  ["learn", "Beginner method"],
  ["bld", "Blindfold"],
  ["cfop", "CFOP"],
  ["roux", "Roux"],
  ["zz", "ZZ"],
  ["zb", "ZBLL"],
  ["trainer", "Trainer"]
],
  MT = { cfop: "CFOP", roux: "Roux", zz: "ZZ" };

let tab = "home",
  curM = "CFOP",
  PIN = ls.get("cl_pin", []),
  times = ls.get("cl_t", []),
  W = ls.get("cl_w", {}),
  T = { s: "idle", t0: 0, hold: 0, scr: "" };

/* ---------- NAV ---------- */
function nav() {
  $("#ht").textContent = "CubeLab · " + TABS.find((x) => x[0] == tab)[1];
  $("#nav").innerHTML = TABS.map(([k, l]) => `<button data-t="${k}" class="${k == tab ? "on" : ""}"><span class="ic">${IC[k] || ""}</span> ${l}</button>`).join("");
}

function go(t) {
  clearTimeout(T.hold);
  T.s = "idle";
  T.i0 = 0;
  tfocus(0);
  tab = t;
  if (MT[t]) {
    curM = MT[t];
  }
  $("#nav").hidden = true;
  nav();
  render();
  try {
    location.hash = t;
  } catch (e) {}
  scrollTo(0, 0);
}

function render() {
  {
    const dk = isDesk();
    document.body.classList.toggle("cs", tab == "timer" && dk);
    document.body.classList.toggle("onhome", tab == "home");
    document.body.classList.toggle("mob", !dk && MOBT.includes(tab));
  }
  $("#app").innerHTML = ({
    cfop: vAlgs,
    roux: vAlgs,
    zz: vAlgs,
    zb: vZb,
    scr: vScr,
    learn: vLearn2,
    bld: vBld,
    timer: () => isDesk() ? vTimerDesk() : vTimerMob(),
    hist: vHist,
    home: vHome,
    account: vAccount,
    prog: vProg,
    theme: vTheme,
    trainer: vTrainer
  })[tab]();
  if (MT[tab] || tab == "zb") {
    fill();
  }
  if (tab == "learn") {
    PR = cube3d($("#pc"), cube());
    pqInit();
  }
  if (tab == "timer") {
    newScr();
    stats();
    tInit();
    msubSet();
  }
  if (tab == "hist") {
    histFill();
  }
  if (tab == "home") {
    homeInit();
  }
  if (tab == "theme" && ls.get("cl_hutao", false)) {
    huTaoHauntInit();
  }
  if (tab == "trainer") {
    trInit();
  }
}

/* ---------- LEARN ---------- */

/* ---------- ALGS ---------- */
function vAlgs() {
  return `<div class="card"><h2>${curM}</h2><p>${M[curM].d}</p><p class="mu">Each picture shows the top layer from above before you run the algorithm: yellow on top, front of the cube at the bottom of the picture. Grey means “not yellow” (OLL / CMLL); PLL pictures show the real side colors. F2L pictures show the cube from the top-front-right corner; the pair goes into the front-right slot and grey pieces can be anything.</p></div><input id="q" type="search" placeholder="Search name or moves…"><div id="al"></div>` + NOT;
}

function fill() {
  if (tab == "zb") {
    return zbFill();
  }
  const op = [...document.querySelectorAll("#al details[open]")].map((d) => d.dataset.s),
    q = ($("#q").value || "").toLowerCase(),
    S = M[curM].sets;
  $("#al").innerHTML =
    Object
      .keys(S)
      .map((s) => {
        const r = S[s].filter((c) => (c.n + c.a + c.t).toLowerCase().includes(q));
        return r.length ? `<details data-s="${s}" ${q || r.length < 12 || op.includes(s) ? "open" : ""} class="card"><summary>${s} <span class="mu">(${r.length})</span></summary>${r.map((c) => `<div class="case cs">${dia(c.a, s)}<div><b>${c.n}</b> <span class="mu">${c.t}</span>${chip(c.a)}${alts(c, s)}</div></div>`).join("")}</details>` : "";
      })
      .join("") ||
      `<p class="mu">No matches.</p>`;
}

/* ---------- TIMER ---------- */
const fmt = (ms) => {
  if (ms == null) {
    return "–";
  }
  if (!isFinite(ms)) {
    return "DNF";
  }
  const s = ms / 1000;
  if (s < 60) {
    return s.toFixed(2);
  }
  return Math.floor(s / 60) + ":" + (s % 60).toFixed(2).padStart(5, "0");
};

// ---- settings (saved in this browser) ----
const PRE = {
  CFOP: ["Cross", "F2L", "OLL", "PLL"],
  Roux: ["First block", "Second block", "CMLL", "LSE"],
  ZZ: ["EOLine", "F2L", "COLL", "EPLL"],
  Beginner: [
    "Cross", "White corners", "Middle layer", "Yellow cross", "Match edges", "Place corners",
    "Twist corners"
  ]
};

const ST = Object.assign(
  {
    insp: 15,
    focus: 1,
    any: (typeof matchMedia != "undefined" && matchMedia("(pointer:coarse)").matches) ? 1 : 0,
    split: 0,
    sm: "tap",
    rd: 0,
    pre: "CFOP",
    ph: ["Cross", "F2L", "OLL", "PLL"]
  },
  ls.get("cl_set", {})
);

const phs = () => ST.pre == "Custom" ? (ST.ph.length ? ST.ph : PRE.CFOP) : PRE[ST.pre] || PRE.CFOP,
  ssave = () => ls.set("cl_set", ST);

const val = (x) => x.pen == "DNF" ? Infinity : x.t,
  ftime = (x) => x.pen == "DNF" ? "DNF" : fmt(x.t) + (x.pen == 2 ? "+" : ""),
  deltas = (x) => x.sp.map((v, i) => v - (x.sp[i - 1] || 0));

const avg = (n) => {
  if (times.length < n) {
    return null;
  }
  const a = times.slice(-n).map(val).sort((x, y) => x - y).slice(1, -1);
  return a.reduce((x, y) => x + y, 0) / a.length;
};

function scr(n = 20) {
  const F = "UDLRFB", ax = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 };
  let r = [], l = "";
  while (r.length < n) {
    const f = F[Math.random() * 6 | 0];
    if (l && ax[f] == ax[l]) {
      continue;
    }
    l = f;
    r.push(f + ["", "'", "2"][Math.random() * 3 | 0]);
  }
  return r.join(" ");
}

function newScr(s) {
  T.scr = s || scr();
  const e = $("#sc");
  if (e) {
    e.textContent = T.scr;
  }
  const c = $("#cx");
  if (c) {
    c.hidden = true;
  }
  scInfo();
  const n = $("#snp");
  if (n) {
    n.innerHTML = snetSvg(T.scr);
  }
}

const hint0 = () => MB() ? (ST.insp ? `Tap anywhere to start ${ST.insp}s inspection, then press and hold` : "Press and hold anywhere, release when green") : (ST.insp ? `Tap to start ${ST.insp}s inspection, then hold and release to solve` : "Hold Space or press and hold, release when green") + (ST.any ? " · tap anywhere" : "");
const tHint = () => ST.split && phs().length > 1 ? (ST.sm == "hold" ? "Hold Space or touch to pause and see the step time, release to continue" + (ST.rd ? ` (after ${ST.rd}s)` : "") + " \u00b7 on the last step, press to stop" : "Tap at the end of each step") : "Tap or press any key to stop";

const setHtml = () => `
<div class="sr"><label for="si">Inspection</label><select id="si"><option value="0">None</option><option value="5">5 seconds</option><option value="10">10 seconds</option><option value="15">15 seconds</option><option value="c">Custom…</option></select><input id="sic" type="number" min="1" max="120" style="width:84px;display:none"></div>
<div class="sr"><input type="checkbox" id="sf"><label for="sf">Focus mode: show only the timer while solving</label></div>
<div class="sr"><input type="checkbox" id="sa"><label for="sa">Tap anywhere on the screen to start and stop (phones)</label></div>
<div class="sr"><input type="checkbox" id="ss"><label for="ss">Split times: tap at the end of each step</label></div>
<div class="sr"><label for="sm">Split style</label><select id="sm"><option value="tap">Tap at the end of each step</option><option value="hold">Hold to pause and see the step time</option></select></div><div class="sr"><label for="rd">After releasing</label><select id="rd"><option value="0">Continue right away</option><option value="3">Wait 3 seconds</option><option value="5">Wait 5 seconds</option></select></div>
<div class="sr"><label for="sp">Steps</label><select id="sp"><option>CFOP</option><option>Roux</option><option>ZZ</option><option>Beginner</option><option>Custom</option></select></div>
<input id="spc" placeholder="Custom steps, separated by commas: Cross, F2L, OLL, PLL"><p class="mu" id="spv"></p><button class="mb" data-t="theme" style="margin-top:8px">🎨 Colors & look…</button>`;

function vTimer() {
  return `<div class="card" id="scc"><div class="sch"><b>Scramble</b><span class="mu" id="su"></span></div><p id="sc"></p><div class="row tb"><button class="btn" id="ns">🔀 New</button><button class="btn" id="rp">↻ Do it again</button><button class="btn" id="sv">☆ Save</button><button class="btn" id="cb">🎯 Fastest cross</button></div></div><div id="cx" class="card" hidden></div>
<div id="tz"><button class="mb" id="xc">✕ Cancel</button><div id="tm">0.00</div><div id="ph" class="phl"></div><div class="mu" id="hint">${hint0()}</div></div>
<div id="res" class="card" hidden></div><div class="grid" id="stg"></div><div class="row"><button class="btn" id="dl">Delete last</button><button class="btn" id="ca">Clear all</button></div>
<details class="card" id="tset"><summary>⚙ Timer settings</summary>${setHtml()}</details>
<div id="pst" class="card" hidden></div><div class="card" style="margin-top:12px"><h3>Recent solves</h3><table id="hist"></table></div>`;
}

function tInit() {
  const si = $("#si");
  if (!si) {
    return;
  }
  const std = [0, 5, 10, 15].includes(ST.insp);
  si.value = std ? String(ST.insp) : "c";
  $("#sic").style.display = std ? "none" : "";
  $("#sic").value = ST.insp;
  $("#sf").checked = !!ST.focus;
  $("#sa").checked = !!ST.any;
  $("#ss").checked = !!ST.split;
  $("#sp").value = ST.pre;
  $("#sm").value = ST.sm;
  $("#rd").value = String(ST.rd);
  $("#spc").value = ST.ph.join(", ");
  $("#spc").style.display = ST.pre == "Custom" ? "" : "none";
  $("#spv").textContent = "Steps: " + phs().join(" → ") + (ST.split ? "" : " (split times are off)");
}

const PC = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#0891b2", "#db2777", "#65a30d"];

const bars = (d, names) => {
  const tot = d.reduce((a, b) => a + b, 0) || 1;
  return `<div class="bar">${d.map((v, i) => `<i style="width:${v / tot * 100}%;background:${PC[i % 8]}"></i>`).join("")}</div>` + d.map((v, i) => `<div class="mu"><span class="dot" style="background:${PC[i % 8]}"></span>${names[i]}: <b>${fmt(v)}</b> (${Math.round(v / tot * 100)}%)</div>`).join("");
};

const isDesk = () => typeof matchMedia != "undefined" &&
  matchMedia("(min-width:900px) and (pointer:fine)").matches,
  CS = () => !!(document.body && document.body.classList.contains("cs"));

const aoN = (a, n) => {
  if (a.length < n) {
    return null;
  }
  const w = a.slice(-n).sort((x, y) => x - y), t = Math.ceil(n / 20), m = w.slice(t, n - t);
  return m.reduce((x, y) => x + y, 0) / m.length;
},
  moN = (a, n) => a.length < n ? null : a.slice(-n).reduce((x, y) => x + y, 0) / n;

const bestOf = (a, n, f) => {
  let b = null;
  for (let i = n; i <= a.length; i++) {
    const v = f(a.slice(0, i), n);
    if (v != null && isFinite(v) && (b == null || v < b)) {
      b = v;
    }
  }
  return b;
};

const dlt = () => {
  const n = times.length;
  if (n < 2) {
    return "";
  }
  const a = times[n - 1], b = times[n - 2];
  if (a.pen == "DNF" || b.pen == "DNF") {
    return "";
  }
  const d = (a.t - b.t) / 1000;
  return `<span class="${d <= 0 ? "ok" : "bad"}">(${d <= 0 ? "\u2212" : "+"}${Math.abs(d).toFixed(2)})</span>`;
};

function tmSet(str, d) {
  const e = $("#tm");
  if (!e) {
    return;
  }
  const m = /^([^.]*)(\.\d+)?(.*)$/.exec(String(str));
  e.innerHTML = m[2] ? `<span class="tb">${m[1]}</span><span class="td">${m[2]}</span>${m[3]}` : String(str);
  const x = $("#dlt");
  if (x) {
    x.innerHTML = d || "";
  }
}

function statsCs() {
  const v = times.map(val),
    fin = v.filter(isFinite),
    fm = (x) => x == null ? "-" : fmt(x),
    ph = ST.split && phs().length > 1 ? phs().length : 0,
    mean = fin.length ? fin.reduce((a, b) => a + b, 0) / fin.length : null;
  const def = [
    ["time", 1, (a) => a[a.length - 1]],
    ["mo3", 3, moN],
    ["ao5", 5, aoN],
    ["ao12", 12, aoN],
    ["ao100", 100, aoN]
  ];
  $("#stg").innerHTML = `<table class="cst"><tr><th></th><th>current</th><th>best</th></tr>` + def.map(([n, k, f]) => `<tr><th>${n}</th><td>${fm(f(v, k))}</td><td>${fm(n == "time" ? (fin.length ? Math.min(...fin) : null) : bestOf(v, k, f))}</td></tr>`).join("") + `</table>`;
  const pm = (j) => {
    const q = times.filter((x) => x.sp && x.sp.length > j).map((x) => deltas(x)[j]);
    return q.length ? q.reduce((a, b) => a + b, 0) / q.length : null;
  };
  let h = `<tr><td colspan="4" class="sm">solve: ${fin.length}/${times.length}<br>mean: ${fm(mean)}</td>` + Array.from({ length: ph }, (_, j) => `<td>${fm(pm(j))}</td>`).join("") + `</tr><tr><th>p</th><th>time</th><th>ao5</th><th>ao12</th>` + Array.from({ length: ph }, (_, j) => `<th>P.${j + 1}</th>`).join("") + `</tr>`;
  for (let i = times.length - 1; i >= Math.max(0, times.length - 80); i--) {
    const x = times[i], a = v.slice(0, i + 1);
    h += `<tr data-si="${i}" title="${esc(x.s)}"><td>${i + 1}</td><td>${ftime(x)}</td><td>${fm(aoN(a, 5))}</td><td>${fm(aoN(a, 12))}</td>` + Array.from({ length: ph }, (_, j) => `<td>${x.sp && x.sp.length > j ? fmt(deltas(x)[j]) : "-"}</td>`).join("") + `</tr>`;
  }
  $("#hist").innerHTML = h;
  const a5 = aoN(v, 5), a12 = aoN(v, 12);
  $("#sub").innerHTML = (a5 != null ? `<span>ao5: ${fmt(a5)}</span>` : "") + (a12 != null ? `<span>ao12: ${fmt(a12)}</span>` : "");
}

function stats() {
  if (MB() && $("#mst")) {
    return statsMob();
  }
  const e = $("#stg");
  if (!e) {
    return;
  }
  const fin = times.map(val).filter(isFinite),
    b = fin.length ? Math.min(...fin) : null,
    m = fin.length ? fin.reduce((x, y) => x + y, 0) / fin.length : null;
  if (CS()) {
    statsCs();
  } else {
    e.innerHTML = [["Best", fmt(b)], ["Mean", fmt(m)], ["Ao5", fmt(avg(5))], ["Ao12", fmt(avg(12))], ["Solves", times.length]].map(([l, v]) => `<div class="st"><span class="mu">${l}</span><b>${v}</b></div>`).join("");
    $("#hist").innerHTML = times.slice(-12).reverse().map((x, i) => `<tr><td class="mu">${times.length - i}</td><td><b>${ftime(x)}</b></td><td class="mu" style="font-family:ui-monospace,monospace;font-size:.8rem">${x.s}${x.sp ? "<br>" + deltas(x).map((v, j) => x.ph[j] + " " + fmt(v)).join(" · ") : ""}</td></tr>`).join("") || `<tr><td class="mu">No solves yet.</td></tr>`;
  }
  const L = times[times.length - 1], r = $("#res");
  r.hidden = !L;
  if (L) {
    r.innerHTML = `<div class="sch"><h3>Last solve: ${ftime(L)}</h3><span><button class="mb" id="p2">${L.pen == 2 ? "Remove +2" : "+2"}</button><button class="mb" id="pd">${L.pen == "DNF" ? "Undo DNF" : "DNF"}</button></span></div>${L.sp ? bars(deltas(L), L.ph) : ""}`;
  }
  const K = L && L.sp ? L.ph.join("|") : null,
    S = K ? times.filter((x) => x.sp && x.ph.join("|") == K).slice(-12) : [],
    p = $("#pst");
  p.hidden = S.length < 2;
  if (S.length > 1) {
    const d = L.ph.map((_, i) => S.reduce((a, x) => a + deltas(x)[i], 0) / S.length);
    p.innerHTML = `<h3>Average per step (last ${S.length} split solves)</h3>` + bars(d, L.ph);
  }
}

function snetSvg(sc) {
  const S = cube();
  sc.split(" ").forEach((t) => mv(S, t));
  const off = { U: [3, 0], L: [0, 3], F: [3, 3], R: [6, 3], B: [9, 3], D: [3, 6] },
    col = { U: "#ffffff", D: "#ffd500", F: "#00a651", B: "#0a4de0", R: "#e02020", L: "#ff8a00" };
  let o = "";
  for (const s of S) {
    const f = Object.keys(FNm).find((q) => FNm[q].join() == s.n.join()), p = s.p;
    let c, r;
    if (f == "U") {
      c = p[0] + 1;
      r = p[2] + 1;
    } else if (f == "F") {
      c = p[0] + 1;
      r = 1 - p[1];
    } else if (f == "R") {
      c = 1 - p[2];
      r = 1 - p[1];
    } else if (f == "B") {
      c = 1 - p[0];
      r = 1 - p[1];
    } else if (f == "L") {
      c = p[2] + 1;
      r = 1 - p[1];
    } else {
      c = p[0] + 1;
      r = 1 - p[2];
    }
    o += `<rect x="${(off[f][0] + c) * 13 + 2}" y="${(off[f][1] + r) * 13 + 2}" width="12" height="12" fill="${col[s.c]}" stroke="#000"/>`;
  }
  return `<svg viewBox="0 0 160 121" width="100%" aria-label="Scramble preview">${o}</svg>`;
}

function vTimerDesk() {
  return `<div id="csbtn"><button class="cb2" id="bset" title="Timer settings">⚙</button><button class="cb2" id="blp" title="Show or hide the solves">📊</button></div><div id="clogo">CubeLab</div>
<div id="csbar"><div class="tl">WCA · 3x3x3 · <button id="rp">last</button>/<button id="ns">next</button> scramble · <button id="sv">☆</button> <button id="cb" title="Fastest cross">🎯</button> <span id="su" class="mu"></span></div><p id="sc"></p></div><div id="cx" class="card" hidden></div>
<div id="tz"><button class="mb" id="xc">✕ Cancel</button><div id="tmw"><div id="tm">0.00</div><span id="dlt"></span></div><div id="ph" class="phl"></div><div id="bt"><div id="sub"></div><div id="res" class="card" hidden></div><div id="pst" hidden></div><div class="mu" id="hint">${hint0()}</div></div></div>
<div id="lp"><div id="stg"></div><div id="sol"><table id="hist"></table></div><div class="lpb"><button id="dl">Delete last</button><button id="ca">Clear all</button></div></div><div id="snp"></div>
<div id="setpop" hidden><div class="sch"><b>⚙ Timer settings</b><button class="mb" id="xs">✕ Close</button></div>${setHtml()}</div>`;
}

// ---- timer state machine: idle > (tap) > insp > hold > ready > run > wait ----
const tz = () => $("#tz"),
  cls = (c) => {
    const e = tz();
    if (e) {
      e.className = c;
    }
  },
  tfocus = (on) => {
    const b = document.body;
    if (b) {
      b.classList.toggle("tfocus", !!on && !!ST.focus);
    }
  };

function thold() {
  T.s = "hold";
  tfocus(1);
  cls("hold");
  T.hold = setTimeout(() => {
    if (T.s == "hold") {
      T.s = "ready";
      cls("ready");
    }
  }, 300);
}

function tdown() {
  if (tab != "timer" || !tz()) {
    return;
  }
  const sdl = $("#sd");
  if (sdl && !sdl.hidden) {
    return;
  }
  const sp = $("#setpop");
  if (sp && !sp.hidden) {
    return;
  }
  const s = T.s;
  if (s == "run") {
    return (
      ST.split && ST.sm == "hold" && phs().length > 1 && T.sp.length < phs().length - 1
        ? tpause()
        : tsplit()
    );
  }
  if (s == "rwait") {
    return tresume();
  }
  if (s == "idle") {
    if (ST.insp > 0) {
      T.s = "tap";
      return;
    }
    T.o = "n";
    return thold();
  }
  if (s == "insp") {
    T.o = "i";
    thold();
  }
}

function tup() {
  if (tab != "timer" || !tz()) {
    return;
  }
  const s = T.s;
  if (s == "tap") {
    T.s = "insp";
    T.i0 = performance.now();
    tfocus(1);
    $("#hint").textContent = "Inspection \u00b7 hold to get ready, release to start \u00b7 Esc or \u2715 cancels";
    itick();
    return;
  }
  if (s == "ready") {
    return tgo();
  }
  if (s == "pause") {
    return ST.rd > 0 ? trwait() : tresume();
  }
  if (s == "hold") {
    clearTimeout(T.hold);
    T.s = T.o == "i" ? "insp" : "idle";
    cls("");
    if (T.s == "idle") {
      tfocus(0);
    }
    return;
  }
  if (s == "wait") {
    T.s = "idle";
  }
}

function itick() {
  if (!T.i0 || !["insp", "hold", "ready"].includes(T.s) || !$("#tm")) {
    return;
  }
  const el = (performance.now() - T.i0) / 1000, r = ST.insp - el;
  tmSet(r > 0 ? Math.ceil(r) : el < ST.insp + 2 ? "+2" : "DNF");
  requestAnimationFrame(itick);
}

function tgo() {
  const now = performance.now();
  T.pen = 0;
  if (T.o == "i" && T.i0) {
    const el = (now - T.i0) / 1000;
    T.pen = el > ST.insp + 2 ? "DNF" : el > ST.insp ? 2 : 0;
  }
  T.i0 = 0;
  T.t0 = now;
  T.sp = [];
  T.s = "run";
  T.fresh = false;
  T.msg = "";
  cls("");
  tfocus(1);
  $("#hint").textContent = tHint();
  tphase();
  tloop();
}

function tphase() {
  const e = $("#ph");
  if (!e) {
    return;
  }
  const P = ST.split ? phs() : [];
  if (P.length < 2 || !["run", "pause", "rwait"].includes(T.s)) {
    e.innerHTML = "";
    return;
  }
  const n = T.sp.length,
    d = T.sp.map((v, i) => v - (T.sp[i - 1] || 0)),
    nx = P[Math.min(n, P.length - 1)];
  e.innerHTML = (T.s != "run" && n ? `<b>\u2714 ${P[n - 1]}: ${fmt(d[n - 1])}</b> \u00b7 next: ${nx}` : `<b>${nx}</b>`) + (n ? "<br>" + d.map((v, i) => P[i] + " " + fmt(v)).join(" \u00b7 ") : "");
}

function tloop() {
  if (T.s == "run") {
    tmSet(fmt(performance.now() - T.t0));
    requestAnimationFrame(tloop);
  }
}

// hold-to-split: the clock stops while you hold (and during the optional wait), then continues
function tpause() {
  const now = performance.now();
  T.pa = now;
  T.sp.push(now - T.t0);
  T.s = "pause";
  tmSet(fmt(now - T.t0));
  tphase();
  $("#hint").textContent = "Paused \u00b7 release to continue" + (ST.rd ? ` (after ${ST.rd}s)` : "");
}

function trwait() {
  T.s = "rwait";
  T.rw = performance.now();
  (function l() {
    if (T.s != "rwait") {
      return;
    }
    const r = ST.rd - (performance.now() - T.rw) / 1000;
    if (r <= 0) {
      return tresume();
    }
    $("#hint").textContent = `Continuing in ${Math.ceil(r)}\u2026 (press to skip)`;
    requestAnimationFrame(l);
  })();
}

function tresume() {
  T.t0 += performance.now() - T.pa;
  T.s = "run";
  tphase();
  $("#hint").textContent = tHint();
  tloop();
}

function tsplit() {
  const P = ST.split ? phs() : [];
  if (P.length > 1 && T.sp.length < P.length - 1) {
    T.sp.push(performance.now() - T.t0);
    tphase();
    return;
  }
  tstop();
}

function tstop() {
  const t = performance.now() - T.t0,
    P = ST.split ? phs() : [],
    r = { t: t + (T.pen == 2 ? 2000 : 0), s: T.scr, d: Date.now() };
  if (T.pen) {
    r.pen = T.pen;
  }
  if (P.length > 1) {
    r.sp = [...T.sp, t].map(Math.round);
    r.ph = P.slice(0, r.sp.length);
  }
  T.s = "wait";
  tfocus(0);
  {
    const pb = Math.min(...times.map(val).filter(isFinite));
    T.msg = r.pen != "DNF" && times.length && isFinite(pb) && r.t < pb ? `Congratulations! You've just beaten your previous personal best by ${fmt(pb - r.t)}` : "";
    T.fresh = true;
  }
  const prev = times.length ? val(times[times.length - 1]) : null;
  if (
    document.body.classList.contains("hu-tao") &&
      prev !== null &&
      isFinite(prev) &&
      r.pen != "DNF" &&
      isFinite(r.t) &&
      r.t < prev
  ) {
    huTaoFastEffect();
    if (ls.get("cl_hutao_audio", true)) {
      huTaoResultSound("above");
    }
  } else if (
    document.body.classList.contains("hu-tao") &&
      prev !== null &&
      isFinite(prev) &&
      r.pen != "DNF" &&
      isFinite(r.t) &&
      r.t > prev &&
      ls.get("cl_hutao_audio", true)
  ) {
    huTaoResultSound("below");
  }
  times.push(r);
  ls.set("cl_t", times);
  actDay();
  T.last = T.scr;
  newScr();
  stats();
  tphase();
  tmSet(ftime(r), dlt());
  $("#hint").textContent = hint0();
}

function tcancel() {
  if (!["tap", "insp", "hold", "ready", "run", "pause", "rwait"].includes(T.s)) {
    return;
  }
  clearTimeout(T.hold);
  T.s = "idle";
  T.i0 = 0;
  cls("");
  tfocus(0);
  tmSet("0.00");
  tphase();
  const h = $("#hint");
  if (h) {
    h.textContent = hint0();
  }
}

function tpen(id, i) {
  i = i == null ? times.length - 1 : i;
  const L = times[i];
  if (!L) {
    return;
  }
  if (id == "p2") {
    if (L.pen == 2) {
      L.t -= 2000;
      delete L.pen;
    } else {
      L.t += 2000;
      L.pen = 2;
    }
  } else {
    if (L.pen == "DNF") {
      delete L.pen;
    } else {
      if (L.pen == 2) {
        L.t -= 2000;
      }
      L.pen = "DNF";
    }
  }
  L.m = Date.now();
  saveT();
  stats();
  if (i == times.length - 1 && T.s != "run") {
    tmSet(ftime(L), dlt());
  }
}

/* ---------- TRAINER ---------- */
/* Four modes share one engine:
   Recognize = see a picture, pick its name      Practice = setup moves, timer, self-check
   Quiz      = short scored test                 My progress = what you know, what to work on
   Everything is kept in TRD (localStorage key cl_tr). TRD is part of the backup bundle (bkData), so it is
   also saved to / restored from the signed-in Supabase account together with the rest of your data.
   TRD = { v:1,
     c:{ caseKey:{ n,ok,s,b,l,bt,tt,tn, r:[n,ok], q:[n,ok], p:[n,ok] } },  per-case stats
     h:[[time,caseKey,mode,good,ms],...],                                  last 300 attempts
     q:[[time,set,total,correct],...],                                      finished quizzes
     p:{set,mode,queue,qn}, pu:time }                                       saved preferences
   n tries, ok correct, s streak, b level 0-5, l last time, bt best ms, tt/tn total ms / count of timed solves.
   rc:{ms,mn,x:[[shownKey,pickedKey,times],...]} Recognize response time (total ms / count) and which cases get confused; rs:[[time,set,level,answered,correct,avgMs,skipped],...] finished Recognize sessions.
   Mode letters: r Recognize, p Practice, q Quiz.  Level: correct +1, miss -2.  Mastered = level 4 or more. */
let TR = {
  set: "All",
  mode: "pr",
  q: "smart",
  qn: 10,
  pick: null,
  cur: null,
  why: "",
  rev: false,
  t0: 0,
  run: false,
  last: null,
  ok: 0,
  n: 0,
  fb: "",
  opts: [],
  ans: null,
  res: null,
  seen: [],
  wk: [],
  qz: null
};

let RC = { set: "All", scope: "all", picks: [], diff: "b", hint: true, lim: 0, len: 10 };

/* Recognize settings (saved in TRD.p.rc) */
let RS = {
  st: "idle",
  items: [],
  i: 0,
  gen: 0,
  acc: 0,
  t0: 0,
  beat: 0,
  iv: 0,
  api: null,
  cmp: false,
  top: false,
  cfg: null,
  saved: false
};

/* Recognize session: idle, run, pause, done */
const SETS = ["All", "F2L", "OLL", "PLL", "CMLL", "OCLL", "COLL", "EPLL", "LSE", "EO", "ZBLL"];
const TRI = [0, 12e4, 9e5, 288e5, 1728e5, 6048e5];

/* how long a case at level 0..5 waits before it is "due" again: now, 2 min, 15 min, 8 h, 2 days, 7 days */
const TRL = { new: "New", weak: "Weak", learning: "Learning", mastered: "Mastered" };

const TRH = {
  rec: "Look at the 3D cube and pick which case it is. Drag the cube to look around. You see the answer after every question.",
  pr: "1) Do the setup moves on a solved cube. 2) Start the timer and solve it from memory, then stop. 3) Reveal the algorithm to check, and mark yourself.",
  quiz: "A short test. Pick the right algorithm for a case, or the right case for an algorithm. Your score is saved when you finish.",
  prog: "How well you know each set, and which cases need more work."
};

const TRQ = {
  smart: "Smart queue: cases you miss come back sooner, ones you know come back later, and new cases are added a few at a time.",
  random: "Random: every case is equally likely.",
  weak: "Only the cases you missed recently.",
  pick: "The same case again and again, so you can drill one algorithm."
};

let TRD = trNorm(ls.get("cl_tr", null));
trPrefsIn();

function trNorm(d) {
  const o = {
    v: 1,
    c: {},
    h: [],
    q: [],
    rc: { ms: 0, mn: 0, x: [] },
    rs: [],
    p: { set: "All", mode: "pr", queue: "smart", qn: 10 },
    pu: 0
  };
  if (!d || typeof d != "object") {
    return o;
  }
  try {
    d = JSON.parse(JSON.stringify(d));
  } catch (e) {
    return o;
  }
  if (d.c && typeof d.c == "object") {
    for (const k in d.c) {
      const r = d.c[k];
      if (r && typeof r == "object" && r.n > 0) {
        o.c[k] = r;
      }
    }
  }
  if (Array.isArray(d.h)) {
    o.h = d.h.filter(Array.isArray).slice(-300);
  }
  if (Array.isArray(d.q)) {
    o.q = d.q.filter(Array.isArray).slice(-60);
  }
  if (d.rc && typeof d.rc == "object") {
    o.rc.ms = +d.rc.ms || 0;
    o.rc.mn = +d.rc.mn || 0;
    if (Array.isArray(d.rc.x)) {
      o.rc.x = d
        .rc
        .x
        .filter((t) => Array.isArray(t) &&
          typeof t[0] == "string" &&
          typeof t[1] == "string" &&
          t[2] > 0)
        .map((t) => [t[0], t[1], +t[2]])
        .slice(0, 120);
    }
  }
  if (Array.isArray(d.rs)) {
    o.rs = d.rs.filter(Array.isArray).slice(-40);
  }
  if (d.p && typeof d.p == "object") {
    Object.assign(o.p, d.p);
  }
  o.pu = +d.pu || 0;
  return o;
}

/* merge two Trainer records (another device, a backup, the cloud). Counters take the larger value, so merging the same
   data twice never double counts; level and streak come from whichever side practiced that case last. */
function trMerge(a, b) {
  const o = trNorm(a);
  b = trNorm(b);
  const mx = (x, y) => Math.max(+x || 0, +y || 0),
    pr = (x, y) => [mx(x && x[0], y && y[0]), mx(x && x[1], y && y[1])];
  for (const k in b.c) {
    const x = o.c[k], y = b.c[k];
    if (!x) {
      o.c[k] = y;
      continue;
    }
    const nw = (+y.l || 0) > (+x.l || 0) ? y : x,
      m = { n: mx(x.n, y.n), s: +nw.s || 0, b: +nw.b || 0, l: mx(x.l, y.l) };
    m.ok = Math.min(mx(x.ok, y.ok), m.n);
    for (const f of ["r", "q", "p"]) {
      if (x[f] || y[f]) {
        m[f] = pr(x[f], y[f]);
      }
    }
    const bt = [x.bt, y.bt].filter((v) => v > 0);
    if (bt.length) {
      m.bt = Math.min(...bt);
    }
    const ts = (+y.tn || 0) > (+x.tn || 0) ? y : x;
    if (ts.tn) {
      m.tn = ts.tn;
      m.tt = ts.tt;
    }
    o.c[k] = m;
  }
  const seen = new Set(), h = [];
  for (const r of [...o.h, ...b.h]) {
    const k = r[0] + "|" + r[1] + "|" + r[2];
    if (!seen.has(k)) {
      seen.add(k);
      h.push(r);
    }
  }
  o.h = h.sort((p, q) => p[0] - q[0]).slice(-300);
  const sq = new Set(), q = [];
  for (const r of [...o.q, ...b.q]) {
    const k = r[0] + "|" + r[1];
    if (!sq.has(k)) {
      sq.add(k);
      q.push(r);
    }
  }
  o.q = q.sort((p, q) => p[0] - q[0]).slice(-60);
  const big = b.rc.mn > o.rc.mn ? b.rc : o.rc, xm = {};
  for (const t of [...o.rc.x, ...b.rc.x]) {
    const k = t[0] + "\u0000" + t[1];
    if (!xm[k] || t[2] > xm[k][2]) {
      xm[k] = [t[0], t[1], t[2]];
    }
  }
  o.rc = { ms: big.ms, mn: big.mn, x: Object.values(xm).sort((p, q) => q[2] - p[2]).slice(0, 100) };
  const sr = new Set(), rs = [];
  for (const r of [...o.rs, ...b.rs]) {
    const k = r[0] + "|" + r[1];
    if (!sr.has(k)) {
      sr.add(k);
      rs.push(r);
    }
  }
  o.rs = rs.sort((p, q) => p[0] - q[0]).slice(-40);
  if ((b.pu || 0) > (o.pu || 0)) {
    o.p = b.p;
    o.pu = b.pu;
  }
  return o;
}

function trSave() {
  ls.set("cl_tr", TRD);
}

function trPrefsSave() {
  TRD.p = {
    set: TR.set,
    mode: TR.mode,
    queue: TR.q == "pick" ? "smart" : TR.q,
    qn: TR.qn,
    rc: { ...RC, picks: RC.picks.slice(0, 200) }
  };
  TRD.pu = Date.now();
  trSave();
}

function trPrefsIn() {
  const p = TRD.p || {};
  TR.set = SETS.includes(p.set) ? p.set : "All";
  TR.mode = ["rec", "pr", "quiz", "prog"].includes(p.mode) ? p.mode : "pr";
  TR.q = ["smart", "random", "weak"].includes(p.queue) ? p.queue : "smart";
  TR.qn = [5, 10, 20].includes(+p.qn) ? +p.qn : 10;
  const r = p.rc || {};
  RC = {
    set: recSets().includes(r.set) ? r.set : "All",
    scope: ["all", "pick", "wrong", "new"].includes(r.scope) ? r.scope : "all",
    picks: Array.isArray(r.picks) ? r.picks.filter((k) => typeof k == "string").slice(0, 200) : [],
    diff: ["b", "i", "a"].includes(r.diff) ? r.diff : "b",
    lim: [0, 5, 10, 15, 20, 30].includes(+r.lim) ? +r.lim : 0,
    len: [10, 20, 50, 0].includes(+r.len) ? +r.len : 10
  };
  RC.hint = r.hint === undefined ? RC.diff == "b" : !!r.hint;
}

/* --- how well is a case known? --- */
const trState = (e) => !e || !e.n
  ? "new"
  : (e.b || 0) >= 4 ? "mastered" : (!e.s || (e.n >= 4 && e.ok / e.n < .5)) ? "weak" : "learning";

const trSt = (c) => {
  const e = TRD.c[c.k];
  return e && e.n ? trState(e) : (W[c.k] || 1) > 1 ? "weak" : "new";
};

/* W = the older "missed cases" weights, still honored for cases with no new stats */
const trLv = (e) => {
  const b = e ? e.b || 0 : 0;
  return `<span class="trlv" title="Level ${b} of 5" aria-label="Level ${b} of 5">${"●".repeat(b) + "○".repeat(5 - b)}</span>`;
};

const trIn = (c) => TR.set == "All"
  ? c.m != "ZBLL"
  : c.s == TR.set || (TR.set == "ZBLL" && c.m == "ZBLL");

const trSh = (a) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function trAgo(t) {
  const m = Math.round((Date.now() - t) / 6e4);
  if (m < 1) {
    return "just now";
  }
  if (m < 60) {
    return m + " min ago";
  }
  const h = Math.round(m / 60);
  if (h < 24) {
    return h + " h ago";
  }
  const d = Math.round(h / 24);
  return d == 1 ? "yesterday" : d + " days ago";
}

/* --- record one answer / attempt. mode: r recognize, p practice, q quiz. ms: solve time (practice only) --- */
function trRecord(c, mode, good, ms, hint) {
  actDay();
  const now = Date.now(),
    e = TRD.c[c.k] || (TRD.c[c.k] = { n: 0, ok: 0, s: 0, b: 0, l: 0 }),
    before = trSt(c);
  e.n++;

  /* an answer that used a hint counts as correct but does not raise the level */
  if (good) {
    e.ok++;
    e.s = (e.s || 0) + 1;
    if (!hint) {
      e.b = Math.min(5, (e.b || 0) + 1);
    }
  } else {
    e.s = 0;
    e.b = Math.max(0, (e.b || 0) - 2);
  }
  e.l = now;
  const m = e[mode] || (e[mode] = [0, 0]);
  m[0]++;
  if (good) {
    m[1]++;
  }
  if (good && mode == "p" && ms > 0) {
    e.tt = (e.tt || 0) + ms;
    e.tn = (e.tn || 0) + 1;
    if (!e.bt || ms < e.bt) {
      e.bt = Math.round(ms);
    }
  }
  TRD.h.push([now, c.k, mode, good ? 1 : 0, ms > 0 ? Math.round(ms) : 0]);
  if (TRD.h.length > 300) {
    TRD.h = TRD.h.slice(-300);
  }
  W[c.k] = good ? Math.max(1, (W[c.k] || 1) - 1) : (W[c.k] || 1) + 2;
  ls.set("cl_w", W);

  /* keep the older weights in step */
  trSave();
  return { before, after: trState(e), box: e.b };
}

const trNote = (c, r) => `${c.n}: <b>${TRL[r.after]}</b>${r.before != r.after ? " (was " + TRL[r.before] + ")" : ""} · level ${r.box} of 5`;

/* --- Smart Practice Queue: weak cases first, due reviews next, new cases only a few at a time --- */
function trW(c, now, act) {
  const s = trSt(c), e = TRD.c[c.k];
  if (s == "new") {
    return [act >= 6 ? .12 : 1.5, "New case"];
  }
  if (!e || !e.n) {
    return [4, "Weak spot"];
  }
  const gap = TRI[e.b || 0], age = now - (e.l || 0), due = age >= gap;
  let w = due ? 2 + (gap ? Math.min(3, age / gap) : 1) : .2;
  if (s == "weak") {
    w *= 2.5;
  }
  if (s == "mastered") {
    w = due ? Math.min(w, 1.5) : .05;
  }
  return [w, s == "weak" ? "Weak spot" : due ? "Due for review" : "Review"];
}

function trPickN(pool, n, avoid) {
  const now = Date.now(),
    smart = TR.mode == "quiz" || TR.mode == "rec" || TR.q != "random",
    out = [];
  let p = pool.slice();
  const act = pool.filter((c) => {
    const s = trSt(c);
    return s == "weak" || s == "learning";
  }).length;
  while (out.length < n && p.length) {
    let cand = p.length > 3 ? p.filter((c) => !(avoid || []).includes(c.k)) : p;
    if (!cand.length) {
      cand = p;
    }
    const ws = cand.map((c) => smart ? trW(c, now, act) : [1, "Random"]);
    let r = Math.random() * ws.reduce((x, w) => x + w[0], 0), i = 0;
    for (; i < cand.length - 1; i++) {
      r -= ws[i][0];
      if (r <= 0) {
        break;
      }
    }
    out.push({ c: cand[i], why: ws[i][1] });
    p = p.filter((x) => x !== cand[i]);
  }
  return out;
}

function trPool(pics, weak) {
  let p = ALL.filter((c) => trIn(c) && (!pics || GM[c.s]));
  if (weak) {
    p = p.filter((c) => trSt(c) == "weak");
  }
  return p;
}

/* wrong answers: two look-alikes from the same set, then others. Never a case that draws the same picture as the right one. */
function trDis(c, n) {
  const pc = dia(c.a, c.s),
    pool = trSh(ALL.filter((x) => x.s == c.s && x.k != c.k && x.a != c.a && GM[x.s])),
    like = (x) => c.g ? x.g == c.g : x.t == c.t,
    out = [],
    pics = new Set([pc]);
  for (const x of [...pool.filter(like).slice(0, 2), ...pool]) {
    if (out.length >= n) {
      break;
    }
    if (out.includes(x)) {
      continue;
    }
    const d = dia(x.a, x.s);
    if (pics.has(d)) {
      continue;
    }
    pics.add(d);
    out.push(x);
  }
  return out;
}

const trSeen = () => {
  if (TR.cur) {
    TR.seen = [...TR.seen, TR.cur.k].slice(-3);
  }
};

/* --- screen frame --- */
function vTrainer() {
  return `<div id="tr"><div class="card"><div class="pills" id="trm" style="margin-bottom:6px"></div><p class="mu" id="trh" style="margin:0"></p></div><div class="card" id="trk"></div><div class="card" id="tc"></div></div>`;
}

function trInit() {
  trCss();
  trPills();
  trCtl();
  if (TR.mode == "rec") {
    if (RS.st == "run" && performance.now() - RS.beat > 1500) {
      recPauseNow();
    }
    trView();
  } else if (TR.mode == "pr" && !TR.cur) {
    nextCase();
  } else {
    trView();
  }
}

function trPills() {
  const m = $("#trm");
  if (m) {
    m.innerHTML = [["rec", "👁 Recognize"], ["pr", "⏱ Practice"], ["quiz", "📝 Quiz"], ["prog", "📊 My progress"]].map(([k, l]) => `<button class="pill ${k == TR.mode ? "on" : ""}" data-a="tr:mode:${k}" aria-pressed="${k == TR.mode}">${l}</button>`).join("");
  }
  const h = $("#trh");
  if (h) {
    h.textContent = TRH[TR.mode];
  }
}

function trCtl() {
  const e = $("#trk");
  if (!e) {
    return;
  }
  if (TR.mode == "prog" || TR.mode == "rec") {
    e.hidden = true;
    return;
  }
  e.hidden = false;
  const set = `<label for="ts"><b>Set</b></label><select id="ts" data-tr="set">${SETS.map((s) => `<option ${s == TR.set ? "selected" : ""}>${s}</option>`).join("")}</select>`;
  let more, help;
  if (TR.mode == "quiz") {
    more = `<label for="tqn"><b>Questions</b></label><select id="tqn" data-tr="qn">${[5, 10, 20].map((n) => `<option ${n == TR.qn ? "selected" : ""}>${n}</option>`).join("")}</select>`;
    help = "Questions favor your weak and due cases.";
  } else {
    const ops = [["smart", "Smart queue"], ["random", "Random"], ["weak", "Weak cases only"]];
    if (TR.mode == "pr") {
      ops.push(["pick", "One case…"]);
    }
    more = `<label for="tq"><b>Order</b></label><select id="tq" data-tr="queue">${ops.map(([v, l]) => `<option value="${v}" ${v == TR.q ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    if (TR.mode == "pr" && TR.q == "pick") {
      more += `<select id="tcp" data-tr="pick" aria-label="Case to practice">${ALL.filter(trIn).map((c) => `<option value="${c.k}" ${c.k == TR.pick ? "selected" : ""}>${TR.set == "All" ? c.s + ": " : ""}${c.n}</option>`).join("")}</select>`;
    }
    help = TRQ[TR.q];
  }
  e.innerHTML = `<div class="row">${set}${more}<span class="mu" id="tst"></span></div><p class="mu" style="margin:8px 0 0">${help}</p>`;
}

function trCount() {
  if (TR.mode == "quiz") {
    const q = TR.qz;
    return q && q.i < q.items.length ? `${q.ok}/${q.log.length} correct` : "";
  }
  return TR.n ? `${TR.ok}/${TR.n} correct` : "";
}

function trView() {
  const e = $("#tc");
  if (!e) {
    return;
  }
  if (TR.mode == "rec") {
    return recView();
  }
  e.innerHTML = ({ pr: prHtml, quiz: qzHtml, prog: progHtml })[TR.mode]();
  const s = $("#tst");
  if (s) {
    s.textContent = trCount();
  }
  const f = $("#trf");
  if (f && f.firstChild) {
    const b = f.querySelector(".pr");
    if (b) {
      try {
        b.focus({ preventScroll: true });
      } catch (x) {}
    }
    try {
      f.scrollIntoView({ block: "nearest" });
    } catch (x) {}
  }
}

const trShow = trView;

function trEmpty() {
  if (TR.mode != "pr" && !trPool(true, false).length) {
    return `<p>This set has no pictures, so it cannot be used here. Pick another set, or use <b>Practice</b>.</p>`;
  }
  if (TR.q == "weak") {
    return `<p><b>No weak cases right now. Nice!</b></p><p class="mu">Switch <b>Order</b> to Smart queue to keep practicing.</p>`;
  }
  return `<p>No cases in this set.</p>`;
}

function trMode(m) {
  if (m == "rec" && TR.mode == "rec" && (RS.st == "run" || RS.st == "pause")) {
    return;
  }
  if (TR.mode == "rec" && m != "rec") {
    recPauseNow();
  }
  TR.run = false;
  TR.mode = m;
  TR.fb = "";
  TR.ok = 0;
  TR.n = 0;
  TR.cur = null;
  TR.ans = null;
  if (m != "pr" && TR.q == "pick") {
    TR.q = "smart";
  }
  trPrefsSave();
  trPills();
  trCtl();
  if (m == "rec") {
    recOpen();
  } else if (m == "pr") {
    nextCase();
  } else {
    trView();
  }
}

function trAfter() {
  TR.cur = null;
  TR.ans = null;
  TR.seen = [];
  if (TR.mode == "pr") {
    nextCase();
  } else {
    trView();
  }
}

function trChange(el) {
  const v = el.value, w = el.dataset.tr;
  if (w == "set") {
    TR.set = v;
    TR.fb = "";
    TR.ok = 0;
    TR.n = 0;
    TR.qz = null;
    TR.pick = null;
    trPrefsSave();
    trCtl();
    return trAfter();
  }
  if (w == "queue") {
    TR.q = v;
    TR.fb = "";
    if (v == "pick") {
      TR.pick = TR.cur && trIn(TR.cur) ? TR.cur.k : (ALL.find(trIn) || {}).k || null;
    }
    trPrefsSave();
    trCtl();
    return v == "pick" ? nextCase() : trAfter();
  }
  if (w == "pick") {
    TR.pick = v;
    return nextCase();
  }
  if (w == "qn") {
    TR.qn = +v;
    TR.qz = null;
    trPrefsSave();
    trView();
  }
  if (w == "rset") {
    RC.set = v;
    RC.picks = [];
    trPrefsSave();
    return trView();
  }
  if (w == "rscope") {
    RC.scope = v;
    trPrefsSave();
    return trView();
  }
  if (w == "rhint") {
    RC.hint = el.checked;
    return trPrefsSave();
  }
  if (w == "rlim") {
    RC.lim = +v;
    return trPrefsSave();
  }
  if (w == "rlen") {
    RC.len = +v;
    trPrefsSave();
    return recSetupMini();
  }
  if (w == "rpick") {
    const i = RC.picks.indexOf(v);
    if (el.checked && i < 0) {
      RC.picks.push(v);
    }
    if (!el.checked && i >= 0) {
      RC.picks.splice(i, 1);
    }
    trPrefsSave();
    return recSetupMini();
  }
}

function trAct(t) {
  const p = t.dataset.a.split(":"), k = p[1];
  if (k == "mode") {
    return trMode(p[2]);
  }
  if (k[0] == "r") {
    return recAct(k, p);
  }
  if (k == "q") {
    return qzAns(+p[2]);
  }
  if (k == "qn") {
    return qzNext();
  }
  if (k == "qs") {
    return qzStart();
  }
  if (k == "wk") {
    const c = ALL.find((x) => x.k == TR.wk[+p[2]]);
    if (!c) {
      return;
    }
    TR.set = c.m == "ZBLL" ? "ZBLL" : c.s;
    TR.q = "pick";
    TR.pick = c.k;
    return trMode("pr");
  }
  if (k == "weak") {
    TR.q = "weak";
    TR.set = p[2] == "z" ? "ZBLL" : p[2] && p[2] != "a" ? p[2] : "All";
    return trMode("pr");
  }
}

/* --- Recognize: a session of questions. A big 3D cube shows a case, you pick its name. ---
   The cube is drawn by the same cube3d() that powers the Watch player, from caseState() (the solved cube with the
   algorithm undone), so every case is a real, reachable cube state.
   Levels use how alike two cases look (trSim): Beginner = clearly different cases and wrong answers,
   Intermediate = a mix, Advanced = the easily confused cases and their closest look-alikes. */
function recSets() {
  return SETS.filter((s) => ALL.some((c) => GM[c.s] &&
    (s == "All" ? c.m != "ZBLL" : s == "ZBLL" ? c.m == "ZBLL" : c.s == s)));
}

const rcIn = (c) => GM[c.s] &&
  (RC.set == "All" ? c.m != "ZBLL" : RC.set == "ZBLL" ? c.m == "ZBLL" : c.s == RC.set);

const trNm = (c) => c.n + (c.n.includes(c.s) ? "" : " (" + c.s + ")");
let TRK = null;

const trByK = () => {
  if (!TRK || TRK.n != ALL.length) {
    TRK = { n: ALL.length, m: {} };
    ALL.forEach((c) => TRK.m[c.k] = c);
  }
  return TRK.m;
};

/* what a player sees of a case, the same way dia() draws it: one token per visible sticker position */
function trVec(c) {
  const m = GM[c.s], o = {};
  for (const s of caseState(c.a)) {
    const [nx, ny, nz] = s.n, k = s.o.join();
    if (m == 3) {
      if (nx < 1 && ny < 1 && nz < 1) {
        continue;
      }
      o[s.p + "|" + s.n] = (k == "1,-1,1" || k == "1,0,1" || s.o[1] < 1) ? s.c : "-";
    } else {
      if (s.p[1] != 1) {
        continue;
      }
      o[s.p + "|" + s.n] = m == 1
        ? (s.c == "U" ? "U" : "-")
        : m == 4 && s.o.filter((v) => v).length == 2 ? "-" : s.c;
    }
  }
  return o;
}

const trKeyFull = (S) => S.map((s) => s.p + "|" + s.n + ":" + s.c).sort().join(";");
const TRSIM = {};

function trSim(set) {
  const cs = ALL.filter((c) => c.s == set && GM[c.s]), sg = cs.map((c) => c.a).join("|");
  if (TRSIM[set] && TRSIM[set].sg == sg) {
    return TRSIM[set];
  }
  const V = {}, P = {}, F = {}, nb = {}, nn = {};
  cs.forEach((c) => {
    V[c.k] = trVec(c);
    P[c.k] = dia(c.a, c.s);
    F[c.k] = trKeyFull(caseState(c.a));
  });
  cs.forEach((c) => {
    const l = [];
    cs.forEach((x) => {
      if (x === c || x.n == c.n || x.a == c.a || P[x.k] == P[c.k] || F[x.k] == F[c.k]) {
        return;
      }
      let d = 0;
      const a = V[c.k], b = V[x.k];
      for (const k in a) {
        if (a[k] !== b[k]) {
          d++;
        }
      }
      l.push([d, x]);
    });
    l.sort((p, q) => p[0] - q[0]);
    nb[c.k] = l;
    nn[c.k] = l.length ? l[0][0] : 99;
  });
  const v = Object.values(nn).sort((a, b) => a - b);
  return TRSIM[set] = { sg, nb, nn, P, F, med: v.length ? v[Math.floor(v.length / 2)] : 0 };
}

function recPoolFor(sc) {
  const p = ALL.filter(rcIn);
  if (sc == "pick") {
    return p.filter((c) => RC.picks.includes(c.k));
  }
  if (sc == "wrong") {
    return p.filter((c) => {
      const e = TRD.c[c.k];
      return e && e.r && e.r[0] > e.r[1];
    });
  }
  if (sc == "new") {
    return p.filter((c) => {
      const e = TRD.c[c.k];
      return !(e && e.r && e.r[0]);
    });
  }
  if (RC.diff == "i") {
    return p;
  }
  const f = p.filter((c) => {
    const q = trSim(c.s);
    return RC.diff == "b" ? q.nn[c.k] >= q.med : q.nn[c.k] <= q.med;
  });
  return f.length >= 4 ? f : p;
}

const recPool = () => recPoolFor(RC.scope);

/* the case this one was most often mistaken for (in the same set), if any */
function trConf(c) {
  const q = trSim(c.s), by = trByK();
  let best = null;
  for (const t of TRD.rc.x) {
    if (
      t[0] == c.k &&
        by[t[1]] &&
        by[t[1]].s == c.s &&
        q.nb[c.k].some((y) => y[1].k == t[1]) &&
        (!best || t[2] > best[2])
    ) {
      best = t;
    }
  }
  return best ? by[best[1]] : null;
}

function recOpts(c, lv) {
  const q = trSim(c.s),
    nn = q.nb[c.k].map((x) => x[1]),
    out = [],
    used = new Set([c.k]),
    pics = new Set([q.P[c.k]]);
  const take = (x) => {
    if (!x || out.length >= 3 || used.has(x.k) || pics.has(q.P[x.k])) {
      return;
    }
    used.add(x.k);
    pics.add(q.P[x.k]);
    out.push(x);
  };
  if (lv != "b") {
    take(trConf(c));
  }
  const half = Math.floor(nn.length / 2);
  const order = lv == "a"
    ? [...trSh(nn.slice(0, 5)), ...nn.slice(5)]
    : lv == "i"
        ? [
            ...trSh(nn.slice(0, 3)).slice(0, 1),
            ...trSh(nn.slice(3, Math.max(4, Math.ceil(nn.length * .7)))),
            ...trSh(nn)
          ]
        : [...trSh(nn.slice(half)), ...trSh(nn.slice(0, half))];
  order.forEach(take);
  return out;
}

/* a hint that describes what to look at, taken from the cube itself (many case descriptions are shared by whole families) */
function trHint(c) {
  const S = caseState(c.a),
    m = GM[c.s],
    top = S.filter((s) => s.p[1] == 1),
    edge = (s) => Math.abs(s.p[0]) + Math.abs(s.p[2]) == 1,
    cor = (s) => Math.abs(s.p[0]) + Math.abs(s.p[2]) == 2;
  let d = "";
  if (m == 1) {
    const u = top.filter((s) => s.n[1] == 1 && s.c == "U");
    d = `${u.length} of the 9 top stickers are yellow, ${u.filter(edge).length} of them on edges.`;
  } else if (m == 4) {
    d = `${top.filter((s) => s.n[1] == 1 && s.c == "U" && cor(s)).length} of the 4 top corners show yellow on top.`;
  } else if (m == 2) {
    let hl = 0, sd = 0;
    for (const f of [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0]]) {
      const st = top.filter((s) => s.n[0] == f[0] && s.n[2] == f[2] && !s.n[1]),
        cs = st.map((s) => s.c),
        cc = st.filter(cor).map((s) => s.c);
      if (cs.length == 3 && cs.every((x) => x == cs[0])) {
        sd++;
      } else if (cc.length == 2 && cc[0] == cc[1]) {
        hl++;
      }
    }
    d = `${hl} side${hl == 1 ? "" : "s"} with headlights (two matching corner stickers), ${sd} side${sd == 1 ? "" : "s"} already solved.`;
  }
  const t = c.t ? c.t.replace(/\.$/, "") + ". " : "";
  return (t + d).trim() || "Look at the top layer.";
}

/* --- session --- */
const recEl = () => RS.acc + (RS.st == "run" ? performance.now() - RS.t0 : 0);

function recTimer() {
  clearInterval(RS.iv);
  RS.iv = setInterval(recTick, 100);
}

function recTick() {
  const q = RS.items[RS.i];
  if (RS.st != "run" || !q || q.res || q.skip) {
    clearInterval(RS.iv);
    return;
  }
  const e = $("#rtm");
  if (!e) {
    clearInterval(RS.iv);
    return;
  }
  RS.beat = performance.now();
  const el = recEl(), L = RS.cfg.lim * 1000;
  if (L) {
    const left = Math.max(0, L - el);
    e.textContent = (left / 1000).toFixed(1) + " s left";
    const b = $("#rtb");
    if (b) {
      b.style.width = (left / L * 100) + "%";
    }
    if (left <= 0) {
      recAnswer(-1, true);
    }
  } else {
    e.textContent = (el / 1000).toFixed(1) + " s";
  }
}

function recOpen() {
  if (RS.st == "run") {
    recPauseNow();
  }
  trView();
}

function recStart() {
  const pool = recPool();
  if (!pool.length) {
    return trView();
  }
  clearInterval(RS.iv);
  const n = RC.len ? Math.min(RC.len, pool.length) : pool.length;
  RS.st = "run";
  RS.gen++;
  RS.i = 0;
  RS.saved = false;
  RS.cfg = { ...RC };
  RS.items = trPickN(pool, n)
    .map((x) => ({ c: x.c, why: x.why, opts: null, res: null, skip: false, hint: false, note: null }));
  recBegin();
  trView();
}

function recBegin() {
  const q = RS.items[RS.i];
  q.opts = trSh([q.c, ...recOpts(q.c, RS.cfg.diff)]);
  RS.acc = 0;
  RS.t0 = performance.now();
  RS.beat = RS.t0;
  RS.cmp = false;
  TR.cur = q.c;
  recTimer();
}

function trConfAdd(a, b) {
  const x = TRD.rc.x, t = x.find((r) => r[0] == a && r[1] == b);
  if (t) {
    t[2]++;
  } else {
    x.push([a, b, 1]);
  }
  if (x.length > 120) {
    x.sort((p, q) => q[2] - p[2]);
    TRD.rc.x = x.slice(0, 100);
  }
}

function recAnswer(i, to) {
  const q = RS.items[RS.i];
  if (RS.st != "run" || !q || q.res || q.skip) {
    return;
  }
  const o = i >= 0 ? q.opts[i] : null;
  if (i >= 0 && !o) {
    return;
  }
  const ms = Math.round(recEl()), good = !!o && o.k == q.c.k;
  clearInterval(RS.iv);
  q.res = { i, good, ms, to: !!to, hint: q.hint };
  if (!to) {
    TRD.rc.ms += ms;
    TRD.rc.mn++;
  }
  if (!good && o) {
    trConfAdd(q.c.k, o.k);
  }
  q.note = trRecord(q.c, "r", good, 0, q.hint);
  trView();
  const f = $("#trf");
  if (f) {
    try {
      f.scrollIntoView({ block: "nearest" });
    } catch (x) {}
  }
}

function recSkip() {
  const q = RS.items[RS.i];
  if (RS.st != "run" || !q || q.res || q.skip) {
    return;
  }
  clearInterval(RS.iv);
  q.skip = true;
  recNextQ();
}

function recNextQ() {
  const q = RS.items[RS.i];
  if (!q || !(q.res || q.skip)) {
    return;
  }
  RS.i++;
  if (RS.i >= RS.items.length) {
    return recFinish();
  }
  recBegin();
  trView();
}

function recPauseNow() {
  if (RS.st != "run") {
    return;
  }
  RS.acc += performance.now() - RS.t0;
  RS.st = "pause";
  clearInterval(RS.iv);
}

function recPause() {
  if (RS.st == "run") {
    const q = RS.items[RS.i];
    if (!q || q.res || q.skip) {
      return;
    }
    recPauseNow();
  } else if (RS.st == "pause") {
    RS.st = "run";
    RS.t0 = performance.now();
    RS.beat = RS.t0;
    recTimer();
  } else {
    return;
  }
  trView();
}

function recFinish() {
  clearInterval(RS.iv);
  if ((RS.st == "run" || RS.st == "pause") && !RS.saved) {
    const a = RS.items.filter((x) => x.res);
    RS.saved = true;
    if (a.length) {
      const t = a.filter((x) => !x.res.to);
      TRD.rs.push([
        Date.now(),
        RS.cfg.set,
        RS.cfg.diff,
        a.length,
        a.filter((x) => x.res.good).length,
        t.length ? Math.round(t.reduce((s, x) => s + x.res.ms, 0) / t.length) : 0,
        RS.items.filter((x) => x.skip).length
      ]);
      if (TRD.rs.length > 40) {
        TRD.rs = TRD.rs.slice(-40);
      }
      trSave();
    }
  }
  RS.st = "done";
  trView();
}

const recVw = (c) => GM[c.s] == 3 ? .5 : .85;

function recTop() {
  const q = RS.items[RS.i];
  if (!RS.api || !q) {
    return;
  }
  RS.top = !RS.top;
  RS.api.view(RS.top ? 0 : -.65, RS.top ? 1.45 : recVw(q.c));
  const b = $("#rtop");
  if (b) {
    b.textContent = RS.top ? "3D view" : "Top view";
  }
}

function recCmp() {
  const q = RS.items[RS.i];
  if (!q || !q.res || q.res.i < 0 || q.res.good || !RS.api) {
    return;
  }
  RS.cmp = !RS.cmp;
  RS.api.set(caseState((RS.cmp ? q.opts[q.res.i] : q.c).a));
  trView();
}

function recCube() {
  const q = RS.items[RS.i], cv = $("#rcv");
  if (!cv || !q) {
    return;
  }
  RS.api = cube3d(cv, caseState(q.c.a));
  RS.api.view(-.65, recVw(q.c));
  RS.top = false;
}

function recStats() {
  let n = 0, ok = 0;
  for (const k in TRD.c) {
    const r = TRD.c[k].r;
    if (r) {
      n += r[0];
      ok += r[1];
    }
  }
  const rc = TRD.rc, by = trByK();
  return {
    n,
    ok,
    bad: n - ok,
    acc: n ? Math.round(ok / n * 100) : null,
    avg: rc.mn ? rc.ms / rc.mn : null,
    conf: rc.x.slice().sort((a, b) => b[2] - a[2]).filter((t) => by[t[0]] && by[t[1]]).slice(0, 5)
  };
}

const recConf = (t) => {
  const by = trByK();
  return `${trNm(by[t[0]])} mistaken for ${trNm(by[t[1]])} <span class="mu">· ${t[2]}×</span>`;
};

const recPct = (a, b) => b ? Math.round(a / b * 100) + "%" : "–";

/* --- screens --- */
function recView() {
  const e = $("#tc");
  if (!e) {
    return;
  }
  if (RS.st == "run" || RS.st == "pause") {
    const key = RS.gen + ":" + RS.i;
    if (!$("#rq") || $("#rq").dataset.k != key) {
      e.innerHTML = `<div id="rq" data-k="${key}"><div id="rhd"></div><div id="rcvw"><canvas id="rcv" class="cb" width="640" height="640" role="img" aria-label="Interactive 3D cube showing the case. Drag to rotate."></canvas><div class="rcb"><button class="btn" id="rtop" data-a="tr:rt">Top view</button></div></div><div id="rbody"></div></div>`;
      recCube();
    }
    recSync();
    const f = $("#rbody .pr");
    if (f && RS.items[RS.i] && RS.items[RS.i].res) {
      try {
        f.focus({ preventScroll: true });
      } catch (x) {}
    }
    return;
  }
  e.innerHTML = RS.st == "done" ? recSum() : recSetup();
}

function recSync() {
  const q = RS.items[RS.i];
  if (!q || !$("#rhd")) {
    return;
  }
  const c = q.c,
    r = q.res,
    N = RS.items.length,
    paused = RS.st == "pause",
    ans = RS.items.filter((x) => x.res),
    ok = ans.filter((x) => x.res.good).length,
    done = RS.items.filter((x) => x.res || x.skip).length,
    cf = RS.cfg,
    hintOn = cf.hint && cf.diff != "a";
  $("#rhd").innerHTML = `<div class="row" style="justify-content:space-between"><b>Question ${RS.i + 1} of ${N}</b><span class="mu" id="rsc">Score <b>${ok}</b> of ${ans.length}${ans.length ? " · " + recPct(ok, ans.length) : ""}</span></div><div class="bar trb" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="${N}" aria-valuenow="${done}"><i style="width:${done / N * 100}%;background:var(--ac)"></i></div>`;
  $("#rcvw").hidden = paused;
  if (paused) {
    $("#rbody").innerHTML = `<div class="trfb" role="status">⏸ <b>Paused.</b> The timer is stopped and the cube is hidden.</div><div class="row"><button class="btn pr" data-a="tr:rp">▶ Resume</button><button class="btn" data-a="tr:rr">↻ Restart</button><button class="btn" data-a="tr:re">■ Finish</button></div>`;
    return;
  }
  const o = r && r.i >= 0 ? q.opts[r.i] : null, L = cf.lim;
  $("#rbody").innerHTML = `<div class="row" style="justify-content:space-between"><span class="mu">${c.m} · ${c.s}</span><span class="trwhy" id="rtm">${r ? (r.ms / 1000).toFixed(1) + " s" : L ? L.toFixed(1) + " s left" : "0.0 s"}</span></div>
${L && !r ? `<div class="rtb" aria-hidden="true"><i id="rtb" style="width:100%"></i></div>` : ""}
<h3 style="text-align:center;margin-top:8px">What case is this?</h3>
${!r && hintOn ? (q.hint ? `<p class="trfb">💡 ${trHint(c)}</p>` : `<p style="text-align:center;margin:0 0 6px"><button class="btn" data-a="tr:rh">💡 Hint</button></p>`) : ""}
<div class="tro cols4" role="group" aria-label="Answer choices">${q.opts.map((x, i) => `<button class="btn${r ? (x.k == c.k ? " trg" : i == r.i ? " trx" : "") : ""}" data-a="tr:r:${i}">${x.n}</button>`).join("")}</div>
<div id="trf" role="status" aria-live="polite">${r ? recFb(q, o) : ""}</div>
<div class="row" style="margin-top:8px">${r ? "" : `<button class="btn" data-a="tr:rk">⏭ Skip</button><button class="btn" data-a="tr:rp">⏸ Pause</button>`}<button class="btn" data-a="tr:rr">↻ Restart</button><button class="btn" data-a="tr:re">■ Finish</button></div>`;
}

function recFb(q, o) {
  const c = q.c, r = q.res, last = RS.i == RS.items.length - 1, cmp = !r.good && o;
  const head = r.to ? `<p class="bad"><b>⏱ Time's up.</b> The cube showed <b>${c.n}</b>.</p>` : r.good ? `<p class="ok"><b>✓ Correct!</b> This is <b>${c.n}</b>.</p>` : `<p class="bad"><b>✗ Not quite.</b> The cube showed <b>${c.n}</b>, not ${o.n}.</p>`;
  let diff = "";
  if (cmp) {
    const d = (trSim(c.s).nb[c.k].find((x) => x[1].k == o.k) || [])[0];
    diff = d != null ? `<p class="mu" style="margin:0 0 4px">They differ in ${d} visible sticker${d == 1 ? "" : "s"}.</p>` : "";
  }
  const btns = `<div class="row" style="margin:6px 0"><button class="btn pr" data-a="tr:rn">${last ? "See summary" : "Next question →"}</button>${cmp ? `<button class="btn" data-a="tr:rc">${RS.cmp ? "Show the case again" : "Show what I picked (" + o.n + ")"}</button>` : ""}<button class="btn" data-a="wt">▶ Watch algorithm</button></div>`;
  return `${head}${btns}<p class="mu" style="margin:0 0 4px">${trHint(c)}</p><p class="mu" style="margin:6px 0 0">Algorithm for ${c.n}:</p>${chip(c.a)}${diff}<p class="mu">${trNote(c, q.note)}${q.hint ? " · hint used" : ""} · answered in ${(r.ms / 1000).toFixed(1)} s</p>`;
}

function recSetup() {
  const sets = recSets(),
    pool = recPool(),
    cs = ALL.filter(rcIn),
    st = recStats(),
    L = {
      b: "Clearly different cases and wrong answers, no time pressure, optional hints.",
      i: "All cases, with some look-alike wrong answers.",
      a: "The easily confused cases, with their closest look-alikes as wrong answers. Optional time limit."
    },
    cnt = (s) => ALL.filter((c) => GM[c.s] &&
      (s == "All" ? c.m != "ZBLL" : s == "ZBLL" ? c.m == "ZBLL" : c.s == s)).length,
    sc = [
      ["all", "All cases"],
      ["pick", "Specific cases…"],
      ["wrong", "Only cases I got wrong"],
      ["new", "Only cases not practiced yet"]
    ];
  return `<h3>Recognition trainer</h3><p class="mu" style="margin-top:0">Look at the cube, then pick the case. You do not need to know the algorithm yet.</p>
<div class="row"><label for="rset"><b>Set</b></label><select id="rset" data-tr="rset">${sets.map((s) => `<option value="${s}" ${s == RC.set ? "selected" : ""}>${s} (${cnt(s)})</option>`).join("")}</select>
<label for="rscope"><b>Cases</b></label><select id="rscope" data-tr="rscope">${sc.map(([v, l]) => `<option value="${v}" ${v == RC.scope ? "selected" : ""}>${l}${v != "pick" ? " (" + recPoolFor(v).length + ")" : ""}</option>`).join("")}</select></div>
${RC.scope == "pick" ? `<details open style="margin-top:8px"><summary><span id="rpc">${RC.picks.filter((k) => cs.some((c) => c.k == k)).length} selected</span></summary><div class="row"><button class="btn" data-a="tr:rpa" style="padding:6px 14px">Select all</button><button class="btn" data-a="tr:rpz" style="padding:6px 14px">Select none</button></div><div class="trck">${cs.map((c) => `<label><input type="checkbox" data-tr="rpick" value="${esc(c.k)}" ${RC.picks.includes(c.k) ? "checked" : ""}> ${c.n}</label>`).join("")}</div></details>` : ""}
<p style="margin:12px 0 4px"><b>Level</b></p><div class="pills" style="margin-bottom:4px">${[["b", "Beginner"], ["i", "Intermediate"], ["a", "Advanced"]].map(([v, l]) => `<button class="pill ${v == RC.diff ? "on" : ""}" data-a="tr:rl:${v}" aria-pressed="${v == RC.diff}">${l}</button>`).join("")}</div>
<p class="mu" style="margin:0 0 8px">${L[RC.diff]}</p>
<div class="row">${RC.diff == "a" ? `<label for="rlim"><b>Time limit</b></label><select id="rlim" data-tr="rlim">${[[0, "Off"], [5, "5 s"], [10, "10 s"], [15, "15 s"], [20, "20 s"], [30, "30 s"]].map(([v, l]) => `<option value="${v}" ${v == RC.lim ? "selected" : ""}>${l}</option>`).join("")}</select>` : `<label style="display:flex;align-items:center;gap:8px;min-height:38px"><input type="checkbox" data-tr="rhint" ${RC.hint ? "checked" : ""} style="width:auto;margin:0;transform:scale(1.2)"> Hint button</label>`}
<label for="rlen"><b>Questions</b></label><select id="rlen" data-tr="rlen">${[[10, "10"], [20, "20"], [50, "50"], [0, "Every case once"]].map(([v, l]) => `<option value="${v}" ${v == RC.len ? "selected" : ""}>${l}</option>`).join("")}</select></div>
<p class="mu" id="rmsg" style="margin:8px 0 0">${recMsg(pool)}</p>
<div class="row" style="margin-top:10px"><button class="btn pr" id="rstart" data-a="tr:rs" ${pool.length ? "" : "disabled"}>▶ Start</button></div>
${st.n ? `<h3 style="margin-top:16px">Your recognition record</h3><div class="grid"><div class="st"><span class="mu">Answered</span><b>${st.n}</b></div><div class="st"><span class="mu">Accuracy</span><b>${st.acc}%</b></div><div class="st"><span class="mu">Average time</span><b>${st.avg == null ? "–" : fmt(st.avg) + " s"}</b></div></div>${st.conf.length ? `<p class="mu" style="margin:6px 0 2px">Most confused</p>${st.conf.map((t) => `<div>${recConf(t)}</div>`).join("")}` : ""}` : ""}`;
}

function recMsg(pool) {
  if (pool.length) {
    return `${pool.length} case${pool.length == 1 ? "" : "s"} available · ${RC.len ? Math.min(RC.len, pool.length) : pool.length} question${(RC.len ? Math.min(RC.len, pool.length) : pool.length) == 1 ? "" : "s"}.`;
  }
  return {
    pick: "Choose at least one case above.",
    wrong: "You have not got any case wrong in Recognize yet. Try “All cases”.",
    new: "You have practiced every case in this set in Recognize.",
    all: "No cases available."
  }[RC.scope];
}

function recSetupMini() {
  const pool = recPool(), cs = ALL.filter(rcIn), p = $("#rpc"), m = $("#rmsg"), b = $("#rstart");
  if (p) {
    p.textContent = RC.picks.filter((k) => cs.some((c) => c.k == k)).length + " selected";
  }
  if (m) {
    m.textContent = recMsg(pool);
  }
  if (b) {
    b.disabled = !pool.length;
  }
}

function recSum() {
  const A = RS.items.filter((x) => x.res),
    ok = A.filter((x) => x.res.good),
    bad = A.filter((x) => !x.res.good),
    to = A.filter((x) => x.res.to),
    tm = A.filter((x) => !x.res.to),
    sk = RS.items.filter((x) => x.skip).length,
    hs = A.filter((x) => x.hint).length,
    by = trByK(),
    cf = {};
  bad.forEach((x) => {
    if (x.res.i >= 0) {
      const k = x.c.k + "\u0000" + x.opts[x.res.i].k;
      cf[k] = (cf[k] || 0) + 1;
    }
  });
  const cl = Object.entries(cf).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avg = tm.length ? tm.reduce((s, x) => s + x.res.ms, 0) / tm.length : null;
  if (!A.length) {
    return `<h3>Session ended</h3><p>No questions were answered${sk ? ` (${sk} skipped)` : ""}.</p><div class="row"><button class="btn pr" data-a="tr:rr">↻ Restart</button><button class="btn" data-a="tr:rm">Change settings</button></div>`;
  }
  return `<h2>${ok.length} of ${A.length} correct</h2><p class="mu" style="margin-top:0">${RS.cfg.set} · ${{ b: "Beginner", i: "Intermediate", a: "Advanced" }[RS.cfg.diff]}${RS.cfg.lim ? " · " + RS.cfg.lim + " s limit" : ""}. Saved to your progress.</p>
<div class="grid"><div class="st"><span class="mu">Accuracy</span><b>${recPct(ok.length, A.length)}</b></div><div class="st"><span class="mu">Correct</span><b>${ok.length}</b></div><div class="st"><span class="mu">Incorrect</span><b>${bad.length}</b></div><div class="st"><span class="mu">Average time</span><b>${avg == null ? "–" : fmt(avg) + " s"}</b></div></div>
<p class="mu">${sk ? `Skipped ${sk}. ` : ""}${to.length ? `Timed out ${to.length}. ` : ""}${hs ? `Hints used ${hs}. ` : ""}</p>
${cl.length ? `<h3>Most confused this session</h3>${cl.map(([k, n]) => { const [a, b] = k.split("\u0000"); return `<div>${recConf([a, b, n])}</div>`; }).join("")}` : ""}
${bad.length ? `<h3 style="margin-top:12px">Review</h3>${bad.map((x) => { const p = x.res.i >= 0 ? x.opts[x.res.i] : null; return `<div class="cs case">${dia(x.c.a, x.c.s)}<div><b>${x.c.n}</b> <span class="mu">${x.c.n.includes(x.c.s) ? "" : x.c.s}</span><p class="mu" style="margin:0">${x.res.to ? "Time ran out" : "You picked " + p.n}</p>${chip(x.c.a)}</div></div>`; }).join("")}` : `<p><b>Perfect session!</b></p>`}
<div class="row" style="margin-top:12px"><button class="btn pr" data-a="tr:rr">↻ Restart</button><button class="btn" data-a="tr:rm">Change settings</button>${bad.length ? `<button class="btn" data-a="tr:weak:${RS.cfg.set == "ZBLL" ? "z" : RS.cfg.set == "All" ? "a" : RS.cfg.set}">Practice weak cases</button>` : ""}</div>`;
}

function recProg() {
  const st = recStats();
  if (!st.n) {
    return "";
  }
  const ss = TRD.rs.slice(-3).reverse(), dl = { b: "Beginner", i: "Intermediate", a: "Advanced" };
  return `<h3 style="margin-top:14px">Recognition</h3><div class="grid"><div class="st"><span class="mu">Answered</span><b>${st.n}</b></div><div class="st"><span class="mu">Accuracy</span><b>${st.acc}%</b></div><div class="st"><span class="mu">Incorrect</span><b>${st.bad}</b></div><div class="st"><span class="mu">Average time</span><b>${st.avg == null ? "–" : fmt(st.avg) + " s"}</b></div></div>${st.conf.length ? `<p class="mu" style="margin:6px 0 2px">Most confused</p>${st.conf.map((t) => `<div>${recConf(t)}</div>`).join("")}` : ""}${ss.length ? `<p class="mu" style="margin:10px 0 2px">Recent sessions</p>${ss.map((r) => `<div class="row" style="justify-content:space-between"><span>${r[1]} · ${dl[r[2]] || ""}: <b>${r[4]} of ${r[3]}</b></span><span class="mu">${trAgo(r[0])}</span></div>`).join("")}` : ""}`;
}

function recAct(k, p) {
  if (k == "r") {
    return recAnswer(+p[2]);
  }
  if (k == "rs" || k == "rr") {
    return recStart();
  }
  if (k == "rn") {
    return recNextQ();
  }
  if (k == "rk") {
    return recSkip();
  }
  if (k == "rp") {
    return recPause();
  }
  if (k == "re") {
    return recFinish();
  }
  if (k == "rh") {
    const q = RS.items[RS.i];
    if (q && !q.res && RS.st == "run") {
      q.hint = true;
      recSync();
    }
    return;
  }
  if (k == "rt") {
    return recTop();
  }
  if (k == "rc") {
    return recCmp();
  }
  if (k == "rm") {
    RS.st = "idle";
    return trView();
  }
  if (k == "rl") {
    RC.diff = p[2];
    RC.hint = RC.diff == "b";
    trPrefsSave();
    return trView();
  }
  if (k == "rpa" || k == "rpz") {
    RC.picks = k == "rpa" ? ALL.filter(rcIn).map((c) => c.k) : [];
    trPrefsSave();
    return trView();
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && RS.st == "run") {
    const q = RS.items[RS.i];
    if (q && !q.res && !q.skip) {
      recPauseNow();
      if ($("#rq")) {
        trView();
      }
    }
  }
});

function trFb(c, good, picked, res, act, label) {
  return `<p class="${good ? "ok" : "bad"}"><b>${good ? "✓ Correct" : "✗ Not quite"}</b> — ${good ? "it is" : "it was"} <b>${c.n}</b>${good ? "" : ", not " + picked.n}.</p><p class="mu" style="margin:0 0 4px">${c.t}</p>${chip(c.a)}<p class="mu">${trNote(c, res)}</p><div class="row"><button class="btn" data-a="wt">▶ Watch</button><button class="btn pr" data-a="${act}">${label}</button></div>`;
}

/* --- Practice (the original drill, now with history, times and a smarter queue) --- */
function nextCase() {
  TR.rev = false;
  TR.run = false;
  TR.last = null;
  TR.ans = null;
  if (TR.q == "pick") {
    const c = ALL.find((x) => x.k == TR.pick && trIn(x)) || ALL.find(trIn) || null;
    TR.cur = c;
    TR.pick = c ? c.k : null;
    TR.why = "Your pick";
  } else {
    const pool = trPool(false, TR.q == "weak");
    if (!pool.length) {
      TR.cur = null;
    } else {
      const x = trPickN(pool, 1, TR.seen)[0];
      TR.cur = x.c;
      TR.why = x.why;
    }
  }
  trSeen();
  trView();
}

function trLine(c) {
  const e = TRD.c[c.k];
  if (!e || !e.n) {
    return "Not tried yet.";
  }
  return `${trLv(e)} ${TRL[trState(e)]} · ${e.ok} of ${e.n} correct${e.tn ? ` · best ${fmt(e.bt)} · average ${fmt(e.tt / e.tn)}` : ""}`;
}

function prHtml() {
  const c = TR.cur;
  if (!c) {
    return trEmpty();
  }
  return `${TR.fb ? `<div class="trfb" role="status">${TR.fb}</div>` : ""}<div class="row" style="justify-content:space-between"><span class="mu">${c.m} · ${c.s}</span><span class="trwhy">${TR.why}</span></div>
<div class="cs">${dia(c.a, c.s)}<div><h2>${c.n}</h2><p class="mu">${c.t}</p><p class="mu" style="margin-bottom:2px">Setup moves (do these on a solved cube):</p>${chip(inv(c.a))}</div></div>
<div class="row"><button class="btn" data-a="sw">${TR.run ? "■ Stop" : "⏱ Start timer"}</button><span id="trt" style="font:700 1.2rem ui-monospace,monospace">${TR.last != null ? fmt(TR.last) : ""}</span></div>
${TR.rev ? `<p class="mu" style="margin:12px 0 0">Algorithm:</p>${chip(c.a)}${(UX[c.id] || []).length ? `<p class="mu">Your alternatives:</p>${UX[c.id].map((x) => chip(x)).join("")}` : ""}<div class="row"><button class="btn" data-a="wt">▶ Watch</button><button class="btn pr" data-a="ok">✓ Got it</button><button class="btn" data-a="no">✗ Missed</button></div>` : `<div class="row" style="margin-top:12px"><button class="btn pr" data-a="rv">Reveal algorithm</button></div>`}
<p class="mu" style="margin:10px 0 0">${trLine(c)}</p>`;
}

function trTick() {
  if (TR.run) {
    const e = $("#trt");
    if (!e) {
      TR.run = false;
      return;
    }
    e.textContent = fmt(performance.now() - TR.t0);
    requestAnimationFrame(trTick);
  }
}

function trAns(good) {
  const c = TR.cur, ms = TR.last || 0;
  TR.n++;
  if (good) {
    TR.ok++;
  }
  const r = trRecord(c, "p", good, ms);
  TR.fb = good ? `<span class="ok">✓</span> <b>${c.n}</b> · ${TRL[r.after]}${r.before != r.after ? " (was " + TRL[r.before] + ")" : ""}${ms ? " · " + fmt(ms) + " s" : ""}` : `<span class="bad">✗</span> <b>${c.n}</b> will come back soon.`;
  nextCase();
}

/* --- Quiz --- */
function qzStart() {
  const pool = trPool(true, false);
  if (pool.length < 2) {
    return trView();
  }
  TR.qz = {
    items: trPickN(pool, Math.min(TR.qn, pool.length))
      .map((x) => ({ c: x.c, t: Math.random() < .5 ? "a" : "b" })),
    i: 0,
    ans: null,
    ok: 0,
    log: [],
    set: TR.set,
    saved: false,
    cur: null,
    res: null
  };
  qzQ();
  trView();
}

function qzQ() {
  const q = TR.qz, it = q.items[q.i];
  q.cur = { opts: trSh([it.c, ...trDis(it.c, 3)]) };
}

function qzAns(i) {
  const q = TR.qz;
  if (!q || q.ans != null || q.i >= q.items.length) {
    return;
  }
  const it = q.items[q.i], o = q.cur.opts[i];
  if (!o) {
    return;
  }
  const good = o.k == it.c.k;
  q.ans = i;
  if (good) {
    q.ok++;
  }
  q.res = trRecord(it.c, "q", good, 0);
  q.log.push({ c: it.c, good });
  TR.cur = it.c;
  if (q.i == q.items.length - 1 && !q.saved) {
    q.saved = true;
    TRD.q.push([Date.now(), q.set, q.items.length, q.ok]);
    if (TRD.q.length > 60) {
      TRD.q = TRD.q.slice(-60);
    }
    trSave();
  }
  trView();
}

function qzNext() {
  const q = TR.qz;
  if (!q || q.ans == null) {
    return;
  }
  q.i++;
  q.ans = null;
  q.res = null;
  if (q.i < q.items.length) {
    qzQ();
  }
  trView();
}

function qzHtml() {
  const q = TR.qz;
  if (!q) {
    if (!trPool(true, false).length) {
      return trEmpty();
    }
    const n = Math.min(TR.qn, trPool(true, false).length),
      last = TRD.q.filter((x) => x[1] == TR.set).slice(-1)[0];
    return `<h3>Case quiz · ${TR.set}</h3><p>${n} questions. Each one shows a case and asks for its algorithm, or shows an algorithm and asks which case it solves.</p>${last ? `<p class="mu">Last time on ${TR.set}: ${last[3]} of ${last[2]} (${trAgo(last[0])})</p>` : ""}<button class="btn pr" data-a="tr:qs">Start quiz</button>`;
  }
  if (q.i >= q.items.length) {
    return qzSummary();
  }
  const it = q.items[q.i],
    c = it.c,
    o = q.cur.opts,
    d = q.ans != null,
    n = o.length,
    A = it.t == "a";
  if (d) {
    TR.cur = c;
  }
  return `<div class="row" style="justify-content:space-between"><b>Question ${q.i + 1} of ${q.items.length}</b><span class="mu">${c.m} · ${c.s}</span></div>
<div class="bar trb" role="img" aria-label="Quiz progress"><i style="width:${q.i / q.items.length * 100}%;background:var(--ac)"></i></div>
<h3 style="text-align:center">${A ? "Which algorithm solves this case?" : "Which case does this algorithm solve?"}</h3>
${A ? `<div class="trd">${dia(c.a, c.s)}</div>` : `<code class="alg" style="cursor:default">${c.a}</code>`}
<div class="tro${A ? " one" : n == 4 ? " cols4" : ""}" role="group" aria-label="Answer choices">${o.map((x, i) => { const k = d ? (x.k == c.k ? " trg" : i == q.ans ? " trx" : "") : ""; return A ? `<button class="btn${k}" data-a="tr:q:${i}"><span class="trm">${x.a}</span></button>` : `<button class="btn dgb${k}" data-a="tr:q:${i}" aria-label="Option ${i + 1}">${dia(x.a, x.s)}</button>`; }).join("")}</div>
<div id="trf" role="status" aria-live="polite">${d ? trFb(c, o[q.ans].k == c.k, o[q.ans], q.res, "tr:qn", q.i == q.items.length - 1 ? "See results" : "Next →") : ""}</div>`;
}

function qzSummary() {
  const q = TR.qz,
    n = q.items.length,
    pc = Math.round(q.ok / n * 100),
    miss = q.log.filter((x) => !x.good),
    prev = TRD.q.filter((x) => x[1] == q.set).slice(-2, -1)[0];
  return `<h2>${q.ok} of ${n} correct</h2><p class="mu">${pc}% on ${q.set}${prev ? ` · last time ${prev[3]} of ${prev[2]}` : ""}. Saved to your progress.</p>
${miss.length ? `<h3 style="margin-top:12px">Review these</h3>${miss.map((x) => `<div class="cs case">${dia(x.c.a, x.c.s)}<div><b>${x.c.n}</b> <span class="mu">${x.c.n.includes(x.c.s) ? "" : x.c.s}</span><p class="mu" style="margin:0">${x.c.t}</p>${chip(x.c.a)}</div></div>`).join("")}` : `<p><b>Perfect score!</b></p>`}
<div class="row" style="margin-top:12px"><button class="btn pr" data-a="tr:qs">New quiz</button>${miss.length ? `<button class="btn" data-a="tr:weak:${q.set == "ZBLL" ? "z" : q.set == "All" ? "a" : q.set}">Practice weak cases</button>` : ""}</div>`;
}

/* --- My progress --- */
function progHtml() {
  const tried = Object.keys(TRD.c).length;
  if (!tried) {
    return `<h3>Nothing here yet</h3><p>Do a few exercises and your progress will show up here: which cases you know, which are weak, and how you are improving.</p><div class="row"><button class="btn pr" data-a="tr:mode:rec">Start with Recognize</button><button class="btn" data-a="tr:mode:pr">Go to Practice</button></div>`;
  }
  const sets = SETS
    .filter((s) => s != "All")
    .map((s) => {
      const cs = ALL.filter((c) => s == "ZBLL" ? c.m == "ZBLL" : c.s == s && c.m != "ZBLL"),
        k = { mastered: 0, learning: 0, weak: 0, new: 0 };
      cs.forEach((c) => k[trSt(c)]++);
      return { s, t: cs.length, k };
    })
    .filter((x) => x.k.new < x.t);
  const weakAll = ALL
    .filter((c) => {
      const e = TRD.c[c.k];
      return e && e.n && trState(e) == "weak";
    })
    .sort((a, b) => {
      const x = TRD.c[a.k], y = TRD.c[b.k];
      return (y.ok / y.n < x.ok / x.n ? 1 : y.ok / y.n > x.ok / x.n ? -1 : 0) || (y.l - x.l);
    }),
    wk = weakAll.slice(0, 5);
  TR.wk = wk.map((c) => c.k);
  const sk = (m) => {
    let n = 0, ok = 0;
    for (const k in TRD.c) {
      const a = TRD.c[k][m];
      if (a) {
        n += a[0];
        ok += a[1];
      }
    }
    return n ? `<b>${Math.round(ok / n * 100)}%</b><span class="mu">${n} answers</span>` : `<b>–</b><span class="mu">not tried</span>`;
  };
  const h = TRD.h,
    l50 = h.slice(-50),
    p50 = h.slice(-100, -50),
    acc = (a) => a.length ? Math.round(a.reduce((x, r) => x + r[3], 0) / a.length * 100) : 0;
  const trend = l50.length >= 10 ? `Last ${l50.length} answers: <b>${acc(l50)}%</b> correct${p50.length >= 10 ? ` (the ${p50.length} before: ${acc(p50)}%)` : ""}.` : "";
  const by = {};
  ALL.forEach((c) => by[c.k] = c);
  return `<div class="grid"><div class="st"><span class="mu">Recognize</span>${sk("r")}</div><div class="st"><span class="mu">Practice</span>${sk("p")}</div><div class="st"><span class="mu">Quiz</span>${sk("q")}</div></div>
${trend ? `<p>${trend}</p>` : ""}
${recProg()}
<h3 style="margin-top:14px">By set</h3>${sets.map((x) => { const pc = (v) => x.t ? v / x.t * 100 : 0; return `<div class="trs"><div class="row" style="justify-content:space-between"><b>${x.s}</b><span class="mu">${x.k.mastered} of ${x.t} mastered${x.k.weak ? ` · <span class="bad">${x.k.weak} weak</span>` : ""}</span></div><div class="bar trb" role="img" aria-label="${x.s}: ${x.k.mastered} mastered, ${x.k.learning} learning, ${x.k.weak} weak, ${x.k.new} new"><i style="width:${pc(x.k.mastered)}%;background:var(--ok)"></i><i style="width:${pc(x.k.learning)}%;background:var(--ac)"></i><i style="width:${pc(x.k.weak)}%;background:var(--bad)"></i></div></div>`; }).join("")}
<p class="mu"><span class="dot" style="background:var(--ok)"></span>Mastered <span class="dot" style="background:var(--ac);margin-left:10px"></span>Learning <span class="dot" style="background:var(--bad);margin-left:10px"></span>Weak <span class="dot" style="background:var(--bd);margin-left:10px"></span>New</p>
<h3 style="margin-top:14px">Needs work</h3>${wk.length ? wk.map((c, i) => { const e = TRD.c[c.k]; return `<div class="cs case">${dia(c.a, c.s)}<div><b>${c.n}</b> <span class="mu">${c.n.includes(c.s) ? "" : c.s}</span><p class="mu" style="margin:0">${e.n - e.ok} missed of ${e.n}${e.tn ? ` · average ${fmt(e.tt / e.tn)}` : ""}</p><button class="btn" style="margin-top:6px;padding:6px 14px" data-a="tr:wk:${i}">Practice this</button></div></div>`; }).join("") + `<div class="row" style="margin-top:10px"><button class="btn pr" data-a="tr:weak:${weakAll.every((c) => c.m == "ZBLL") ? "z" : "a"}">Practice weak cases (${weakAll.length})</button></div>` : `<p class="mu">No weak cases right now. Keep going!</p>`}
${TRD.q.length ? `<h3 style="margin-top:14px">Recent quizzes</h3>${TRD.q.slice(-5).reverse().map((x) => `<div class="row" style="justify-content:space-between"><span>${x[1]}: <b>${x[3]} of ${x[2]}</b></span><span class="mu">${trAgo(x[0])}</span></div>`).join("")}` : ""}
${h.length ? `<h3 style="margin-top:14px">Recent answers</h3>${h.slice(-8).reverse().map((r) => { const c = by[r[1]]; return c ? `<div class="row" style="justify-content:space-between"><span>${r[3] ? `<span class="ok">✓</span>` : `<span class="bad">✗</span>`} ${c.n} <span class="mu">${c.n.includes(c.s) ? "" : c.s}</span></span><span class="mu">${{ r: "Recognize", p: "Practice", q: "Quiz" }[r[2]] || ""} · ${trAgo(r[0])}</span></div>` : ""; }).join("")}` : ""}
<details style="margin-top:12px"><summary>How levels work</summary><p class="mu">Every case has a level from 0 to 5. A correct answer adds 1; a miss takes away 2. <b>Mastered</b> means level 4 or more. <b>Weak</b> means you missed it last time, or you get fewer than half right. The Smart queue uses this to bring weak cases back sooner and mastered ones back later.</p></details>`;
}

/* Trainer styles live here so this section is self-contained. They only use the site's colour variables, so every theme works. */
const TRCSS = `#trk[hidden]{display:none}#trk .row{gap:8px 10px}
.trd{display:flex;justify-content:center;margin:6px 0 12px}.trd .dg{width:min(50vw,170px);height:auto;aspect-ratio:1}
.tro{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0}.tro.one{grid-template-columns:minmax(0,1fr)}
@media(min-width:560px){.tro.cols4{grid-template-columns:repeat(4,minmax(0,1fr))}}
.tro .btn{min-height:48px;text-align:center;white-space:normal;overflow-wrap:anywhere;border-radius:12px}
.tro .btn.trg{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 16%,var(--cd))}.tro .btn.trx{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 14%,var(--cd))}
.tro .btn.dgb{display:flex;justify-content:center;padding:6px}.tro .btn .dg{width:100%;max-width:150px;height:auto;aspect-ratio:1;box-shadow:none}
.trm{font:600 .9rem/1.4 ui-monospace,Menlo,Consolas,monospace;text-align:left;display:block}
.trwhy{font-size:.75rem;padding:2px 10px;border:1px solid var(--bd);border-radius:999px;color:var(--mu);white-space:nowrap}
.trfb{border:1px solid var(--bd);border-radius:10px;padding:6px 10px;margin-bottom:10px;font-size:.92rem;background:var(--bg)}
.trlv{letter-spacing:.12em;color:var(--ac);white-space:nowrap}.trb{background:var(--bd)}.trs{margin:10px 0}.trs .bar{margin:4px 0}#trf p{margin:.4em 0}
#tc .case:first-of-type{border-top:0}
#rcv.cb{width:min(100%,460px)}#rcvw{text-align:center}#rcvw[hidden]{display:none}.rcb{display:flex;gap:8px;justify-content:center;margin:6px 0}
.trck{display:grid;grid-template-columns:repeat(auto-fill,minmax(125px,1fr));gap:0 8px;max-height:220px;overflow:auto;border:1px solid var(--bd);border-radius:10px;padding:4px 6px;margin:6px 0}
.trck label{display:flex;align-items:center;gap:8px;min-height:38px;cursor:pointer}.trck input{width:auto;margin:0;transform:scale(1.2)}
.rtb{height:6px;background:var(--bd);border-radius:4px;overflow:hidden;margin:6px 0}.rtb i{display:block;height:100%;background:var(--ac)}
#tc .btn:disabled{opacity:.5;cursor:not-allowed}#tc input[type=checkbox]{flex:none;min-width:0;width:auto;margin:0}`;

function trCss() {
  if (document.getElementById("trcss")) {
    return;
  }
  const s = document.createElement("style");
  s.id = "trcss";
  s.textContent = TRCSS;
  document.head.appendChild(s);
}

/* ---------- BLINDFOLD (Old Pochmann) ---------- */
// T-perm swaps the UR and UL edges, Y-perm swaps the UBL and UFR corners, BP fixes parity.
// Setup moves (BES edges / BCS corners) were found by a program and checked on 1,500 random scrambles. Edit freely.
const BT = "R U R' U' R' F R2 U' R' U' R U R' F'",
  BY = "F R U' R' U' R U R' F' R U R' U' R' F R F'",
  BP = "R U' R' U' R U R D R' U' R D' R' U2 R' U'";

const BES = {
  A: "R2 U' R2",
  C: "R2 U R2",
  D: "",
  E: "U B U' L",
  F: "U' F U",
  G: "F' D F L'",
  H: "U B' U'",
  I: "R F' R' L'",
  J: "U2 R U2",
  K: "F L' F'",
  L: "L'",
  N: "U B U'",
  O: "F' D' F L'",
  P: "U' F' U",
  Q: "R' B R L",
  R: "L",
  S: "B' L B",
  T: "U2 R' U2",
  U: "D' L2",
  V: "D2 L2",
  W: "D L2",
  X: "L2"
};

const BCS = {
  B: "R D' F'",
  C: "",
  D: "F R' F'",
  F: "F",
  G: "D R",
  H: "D2 F'",
  I: "F2 R",
  J: "F R",
  K: "R",
  L: "F' R",
  M: "R' F'",
  N: "R2 F'",
  O: "R F'",
  P: "F'",
  Q: "R'",
  S: "D2 R",
  T: "D' F'",
  U: "F2",
  V: "D R2",
  W: "R2",
  X: "D F2"
};

const FNm = {
  U: [0, 1, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  R: [1, 0, 0],
  B: [0, 0, -1],
  D: [0, -1, 0]
};

const BCP = {
  U: [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]],
  L: [[-1, 1, -1], [-1, 1, 1], [-1, -1, 1], [-1, -1, -1]],
  F: [[-1, 1, 1], [1, 1, 1], [1, -1, 1], [-1, -1, 1]],
  R: [[1, 1, 1], [1, 1, -1], [1, -1, -1], [1, -1, 1]],
  B: [[1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]],
  D: [[-1, -1, 1], [1, -1, 1], [1, -1, -1], [-1, -1, -1]]
};

const BEP = {
  U: [[0, 1, -1], [1, 1, 0], [0, 1, 1], [-1, 1, 0]],
  L: [[-1, 1, 0], [-1, 0, 1], [-1, -1, 0], [-1, 0, -1]],
  F: [[0, 1, 1], [1, 0, 1], [0, -1, 1], [-1, 0, 1]],
  R: [[1, 1, 0], [1, 0, -1], [1, -1, 0], [1, 0, 1]],
  B: [[0, 1, -1], [-1, 0, -1], [0, -1, -1], [1, 0, -1]],
  D: [[0, -1, 1], [1, -1, 0], [0, -1, -1], [-1, -1, 0]]
};

const CK = {}, EK = {}, CL = {}, EL = {};

"ULFRBD"
  .split("")
  .forEach((f, i) => {
    for (let j = 0; j < 4; j++) {
      const l = "ABCDEFGHIJKLMNOPQRSTUVWX"[i * 4 + j];
      CK[l] = BCP[f][j] + "|" + FNm[f];
      EK[l] = BEP[f][j] + "|" + FNm[f];
      CL[CK[l]] = l;
      EL[EK[l]] = l;
    }
  });

let BL = { sc: "", r: null, show: "", net: "e" };

// Solve a scramble "blindfolded" on the virtual cube: returns the memo letters and every shot.
function bld(sc) {
  const S = cube(),
    key = (s) => s.p.join() + "|" + s.n.join(),
    hk = (s) => s.o.join() + "|" + FNm[s.c],
    at = (k) => S.find((s) => key(s) == k),
    run = (a) => a.split(" ").filter((x) => x).forEach((t) => mv(S, t)),
    out = { e: [], c: [], par: 0, sh: [] };
  sc.split(" ").forEach((t) => mv(S, t));
  const ph = (K, LL, tab, buf, alg, bc, kind, arr) => {
    for (let g = 0; g < 60; g++) {
      let L = LL[hk(at(K[buf]))];
      if (bc.includes(L)) {
        L = Object.keys(K).find((k) => !bc.includes(k) && hk(at(K[k])) != K[k]);
        if (!L) {
          return;
        }
      }
      const su = tab[L], m = (su ? su + " " : "") + alg + (su ? " " + inv(su) : "");
      arr.push(L);
      out.sh.push({ k: kind, L, m });
      run(m);
    }
  };
  ph(EK, EL, BES, "B", BT, "BM", "e", out.e);
  if (out.e.length % 2) {
    out.par = 1;
    out.sh.push({ k: "p", L: "", m: BP });
    run(BP);
  }
  ph(CK, CL, BCS, "A", BY, "AER", "c", out.c);
  out.ok = S.every((s) => s.p.join() == s.o.join() && s.n.join() == FNm[s.c].join());
  return out;
}

function bnet(k) {
  const Kk = k == "e" ? EK : CK,
    off = { U: [3, 0], L: [0, 3], F: [3, 3], R: [6, 3], B: [9, 3], D: [3, 6] },
    col = { U: "#ffffff", D: "#f5c518", F: "#22a55a", B: "#2f6df0", R: "#e03a3a", L: "#f58220" },
    bf = k == "e" ? "BM" : "AER";
  let o = "";
  for (const f in off) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        o += `<rect x="${(off[f][0] + c) * 24 + 2}" y="${(off[f][1] + r) * 24 + 2}" width="22" height="22" rx="4" fill="${col[f]}" stroke="#16161a"/>`;
      }
    }
  }
  for (const L in Kk) {
    const [ps, ns] = Kk[L].split("|"),
      p = ps.split(",").map(Number),
      f = Object.keys(FNm).find((q) => FNm[q].join() == ns),
      [ox, oy] = off[f];
    let c, r;
    if (f == "U") {
      c = p[0] + 1;
      r = p[2] + 1;
    } else if (f == "F") {
      c = p[0] + 1;
      r = 1 - p[1];
    } else if (f == "R") {
      c = 1 - p[2];
      r = 1 - p[1];
    } else if (f == "B") {
      c = 1 - p[0];
      r = 1 - p[1];
    } else if (f == "L") {
      c = p[2] + 1;
      r = 1 - p[1];
    } else {
      c = p[0] + 1;
      r = 1 - p[2];
    }
    o += `<text x="${(ox + c) * 24 + 13}" y="${(oy + r) * 24 + 18}" text-anchor="middle" font-size="13" font-weight="700" fill="${bf.includes(L) ? "#d11" : "#16161a"}">${L}</text>`;
  }
  return `<svg viewBox="0 0 292 220" style="width:100%;max-width:440px;display:block;margin:8px auto" role="img" aria-label="Cube net with Speffz letters">${o}</svg>`;
}

const stab = (t) => `<div class="stg">` + Object.keys(t).map((L) => `<div><b>${L}</b> <code>${t[L] || "none"}</code></div>`).join("") + `</div>`;
const pairs = (a) => a.length ? a.join("").match(/.{1,2}/g).join(" ") : "(none)";

function vBld() {
  const r = BL.r, bt = (a, k, l) => `<button class="mb" data-b="${a}" data-k="${k}">${l}</button>`;
  return `<div class="card"><h2>🙈 Blindfolded solving (3BLD)</h2><p>You solve the whole cube without looking. It has two phases: <b>memorize</b> where every piece has to go (cube in your hands, eyes open), then <b>put on the blindfold</b> and solve it from that memory.</p><p>This page teaches <b>Old Pochmann</b>, the classic beginner method. You only need <b>two algorithms</b> (T-perm and Y-perm), one parity algorithm, and a small “setup move” for each letter. Speed comes later; the goal is a clean solve.</p><p class="mu">Before you start: you should already know how to solve the cube normally (see Beginner method) and have the T-perm and Y-perm under your fingers (see PLL on the CFOP page).</p></div>
<div class="card"><h3>Step 1 · Hold it the same way every time</h3><p>White on top, green in front. This is also how scrambles on the Timer page are meant to be applied. Never rotate the whole cube while solving blind: every letter below assumes this orientation.</p></div>
<div class="card"><h3>Step 2 · Learn the letters</h3><p>Every sticker (not the centers) gets a letter, A to X. Edges and corners use the same letters, face by face: Up A–D, Left E–H, Front I–L, Right M–P, Back Q–T, Down U–X, always clockwise starting at the top-left of each face. Switch the picture below to see the corner letters or the edge letters.</p><div class="row tb">${bt("ne", "", "Edge letters")}${bt("nc", "", "Corner letters")}</div>${bnet(BL.net)}<p class="mu">Red letters are the <b>buffer</b>: edge buffer = the UR edge (B and M), corner buffer = the UBL corner (A, E, R). Those letters never appear in your memo.</p></div>
<div class="card"><h3>Step 3 · How one piece is “shot” into place</h3><p>The buffer is the piece you always start from. Take the sticker in the buffer and ask: <b>where does this sticker belong?</b> The letter of that spot is your target. Example: the top sticker of the buffer edge is the <i>green</i> half of the white-green edge. Green belongs on the front face, top edge, so the letter is <b>I</b>.</p><p>To send it there: 1) <b>setup move(s)</b> bring the target spot to the swap position, 2) do the algorithm, which swaps the buffer with the swap position, 3) <b>undo the setup moves</b>. The piece that was sitting in the target is now in the buffer, so you read it and repeat.</p><div class="ar"><span class="mu">Edges swap UR ↔ UL (T-perm), corners swap UBL ↔ UFR (Y-perm)</span></div>${[["T", "T-perm (edges)", BT], ["Y", "Y-perm (corners)", BY], ["P", "Parity algorithm (Ra-perm + U′)", BP]].map(([k, n, a]) => `<div class="ar"><b>${n}</b>${chip(a)}${bt("a", k, "▶ Watch")}</div>`).join("")}</div>
<div class="card"><h3>Step 4 · Memorize</h3><p>Do edges first, then corners. For each, write down (in your head) the letters you get by following the pieces:</p><ol><li>Read the buffer sticker, find where it belongs, that letter is your first target.</li><li>Look at the sticker that is <i>currently in that target spot</i>. Where does it belong? That is the next letter.</li><li>Keep going until the sticker you are reading belongs in the buffer piece itself (B or M for edges, A, E or R for corners). That cycle is finished.</li><li><b>Cycle break:</b> if pieces are still unsolved, pick any unsolved piece, use its letter as the next letter, and keep following from there. When the buffer piece is already correct, start with a cycle break as well.</li></ol><p>A piece that is in the right place but twisted or flipped shows up as 2 letters (or 3 for a corner), that is normal. If the sticker in the buffer belongs on the <i>other</i> sticker spots of the buffer piece (M for edges, E/R for corners), treat it like a cycle break.</p><p>Then <b>memorize the letters in pairs</b> (AB CD …) and turn each pair into a word or a picture. Chain the pictures along a route you know well (your room, your way to school). Practice just edges first.</p></div>
<div class="card"><h3>Step 5 · Solve it blindfolded</h3><ol><li>Put the blindfold on. Do <b>every edge letter</b> in order: setup, T-perm, undo.</li><li><b>Parity:</b> if you had an <b>odd number of edge letters</b>, do the parity algorithm now (you will also have an odd number of corner letters).</li><li>Do <b>every corner letter</b> in order: setup, Y-perm, undo.</li><li>Take the blindfold off and enjoy!</li></ol><p class="mu">If you forget a letter, stop and think; moving the cube randomly cannot fix it. Beginners often need 5–10 minutes, that is fine.</p></div>
<div class="card"><h3>Practice with a scramble</h3><p class="mu">Press “New scramble”, apply it to your cube (white up, green front), then press “Show memo” to compare with your own letters. This tool follows exactly the rules above and checks the result on a virtual cube.</p><div class="row tb">${bt("new", "", "🔀 New scramble")}${bt("memo", "", "🧠 Show memo")}${bt("exec", "", "🛠 Show execution")}</div>${BL.sc ? `<code class="alg" data-c="${BL.sc}" style="margin-top:10px">${BL.sc}</code>` : ""}${r ? `<div class="card" style="margin-top:10px"><p><b>Edges</b> (${r.e.length} letters): <code>${pairs(r.e)}</code></p><p><b>Corners</b> (${r.c.length} letters): <code>${pairs(r.c)}</code></p><p>Parity: <b>${r.par ? "yes, do the parity algorithm between edges and corners" : "no"}</b>. Virtual cube solved: <b class="${r.ok ? "ok" : "bad"}">${r.ok ? "✓" : "✗"}</b></p>${BL.show == "exec" ? r.sh.map((x, i) => `<div class="ar"><b>${x.k == "p" ? "Parity" : (x.k == "e" ? "Edge " : "Corner ") + x.L}</b> ${chip(x.m)}${bt("s", i, "▶ Watch")}</div>`).join("") : ""}</div>` : ""}</div>
<details class="card"><summary>Setup moves for edges (T-perm)</summary><p class="mu">Setup, then T-perm, then undo the setup (reverse the moves and flip each direction). “none” means no setup. Never aim at B or M.</p>${stab(BES)}</details>
<details class="card"><summary>Setup moves for corners (Y-perm)</summary><p class="mu">Same idea with the Y-perm. Never aim at A, E or R.</p>${stab(BCS)}</details>
<div class="card"><h3>Tips and things to know</h3><ul><li>The setup moves here only use moves that keep the buffer pieces, and the pieces the algorithms also swap, where they are. That is why memorizing from the starting cube works.</li><li>Shorter setup moves exist in other tutorials. If you like theirs better, just change the tables in <code>app.js</code>.</li><li>Later methods: M2 (faster edges), 3-style (commutators for 3-cycles), and memory palaces for longer memos. The letters you learned here carry over.</li><li>Practice “memo only” first: memorize, then check yourself with the tool above.</li></ul></div>`;
}

function bAct(t) {
  const b = t.dataset.b, k = t.dataset.k;
  if (b == "new") {
    BL.sc = scr(20);
    BL.r = null;
    BL.show = "";
    return render();
  }
  if (b == "memo" || b == "exec") {
    if (!BL.sc) {
      BL.sc = scr(20);
    }
    BL.r = bld(BL.sc);
    BL.show = b;
    return render();
  }
  if (b == "ne" || b == "nc") {
    BL.net = b[1];
    return render();
  }
  if (b == "a") {
    const a = { T: BT, Y: BY, P: BP }[k];
    return watch(
      a,
      stOf(inv(a)),
      { T: "T-perm (edges)", Y: "Y-perm (corners)", P: "Parity algorithm" }[k]
    );
  }
  if (b == "s") {
    const x = BL.r.sh[+k];
    watch(x.m, stOf(inv(x.m)), x.k == "p" ? "Parity" : (x.k == "e" ? "Edge " : "Corner ") + x.L);
  }
}

/* ---------- ZBLL page (3 levels: shape > corner case > edge case) ---------- */
function vZb() {
  return `<div class="card"><h2>\ud83d\udc8e ZBLL (one-look last layer)</h2><p>ZBLL solves the <b>whole last layer with one algorithm</b>, corners and edges together. It needs the last-layer edges to be oriented already (that is what ZZ gives you). There are 493 cases, so they are split into three levels: <b>1)</b> the shape of the corners, <b>2)</b> which corner case it is (COLL), <b>3)</b> how the edges are mixed up.</p><p class="mu">How to use: finish F2L with oriented edges, recognise the corner shape, open that section, find your corner case, then match the edge pattern. Tap \u25b6 Watch to see an algorithm. The algorithms come from a computer search (R, U and F moves, 7\u201316 moves): all are correct, but they are not always the favorites of top solvers, so use \u270e to swap in your own.</p><input id="q" type="search" placeholder="Search a case or moves\u2026"></div><div id="al"></div>` + NOT;
}

const zrow = (c, key) => `<div class="case cs">${dia(c.a, key)}<div><b>${c.n}</b> <span class="mu">${c.t}</span>${chip(c.a)}${alts(c, key)}</div></div>`;

function zbFill() {
  const q = ($("#q").value || "").toLowerCase(),
    op = [...document.querySelectorAll("#al details[open]")].map((d) => d.dataset.s);
  let h = "";
  for (const [g, cl] of ZB) {
    const key = "ZBLL " + g;
    let gh = "", gn = 0;
    for (const [cn] of cl) {
      const cs = M.ZBLL.sets[key].filter((c) => c.g == cn &&
        (!q || (c.n + c.a + c.t + g).toLowerCase().includes(q)));
      if (!cs.length) {
        continue;
      }
      gn += cs.length;
      const k = g + "|" + cn, o = q || op.includes(k);
      gh += `<details data-s="${k}" ${o ? "open" : ""} class="zb2"><summary>${cn} <span class="mu">(${cs.length})</span></summary><div class="zc">${o ? cs.map((c) => zrow(c, key)).join("") : ""}</div></details>`;
    }
    if (gh) {
      h += `<details data-s="${g}" ${q || op.includes(g) ? "open" : ""} class="card"><summary>${g} <span class="mu">(${gn} cases)</span></summary>${gh}</details>`;
    }
  }
  $("#al").innerHTML = h || `<p class="mu">No matches.</p>`;
}

document.addEventListener(
  "toggle",
  (e) => {
    const d = e.target;
    if (tab != "zb" || !d.open || !d.classList || !d.classList.contains("zb2")) {
      return;
    }
    const z = d.querySelector(".zc");
    if (z && !z.innerHTML) {
      const [g, cn] = d.dataset.s.split("|");
      z.innerHTML = M.ZBLL.sets["ZBLL " + g]
        .filter((c) => c.g == cn)
        .map((c) => zrow(c, "ZBLL " + g))
        .join("");
    }
  },
  true
);

/* ---------- 2-look OLL lessons + last-pair OLL prediction ---------- */
LS.push(
  [
    "8. Faster last layer: 2-look OLL, look 1 (yellow cross)",
    "Steps 4\u20137 work, but 2-look OLL is quicker. Look 1 makes the yellow cross (the edges). Turn the top layer until your cube looks like the picture (grey = not yellow on top), then do the moves. Already a cross? Skip to look 2. \u201cf\u201d means turn the front two layers together.",
    [
      ["Line: two yellow edges in a row", "F R U R' U' F'", 0, "EO5"],
      ["L-shape: two yellow edges next to each other", "f R U R' U' f'", 0, "EO5"],
      [
        "Dot: no yellow edges (this one makes the cross in one go)",
        "F R U R' U' F' f R U R' U' f'", 0, "EO5"
      ]
    ],
    []
  ],
  [
    "9. 2-look OLL, look 2 (turn the corners)",
    "With the yellow cross done, make the whole top yellow with one of 7 moves. Count the yellow stickers on top corners: 1 corner = Sune or Anti-Sune, 0 = H or Pi, 2 = U, T or L. Turn the top until your cube matches a picture, then do the moves. \u201cr\u201d means turn the right two layers together.",
    [
      ["Sune: 1 corner is already yellow", "R U R' U R U2 R'", 0, "OCLL"],
      ["Anti-Sune: 1 corner is already yellow (mirror of Sune)", "R U2 R' U' R U' R'", 0, "OCLL"],
      [
        "H: none on top, yellow sides face front and back", "R U2 R' U' R U R' U' R U' R'", 0,
        "OCLL"
      ],
      ["Pi: none on top, yellow sides in a pi shape", "R U2 R2 U' R2 U' R2 U2 R", 0, "OCLL"],
      ["U: 2 yellow corners next to each other", "R2 D R' U2 R D' R' U2 R'", 0, "OCLL"],
      ["T: 2 yellow corners next to each other", "r U R' U' r' F R F'", 0, "OCLL"],
      ["L: 2 yellow corners diagonal", "F' r U R' U' r' F R", 0, "OCLL"]
    ],
    []
  ],
  [
    "10. Last-pair trick: predict your OLL before the pair goes in",
    "While you solve the LAST F2L pair, look at the other pieces in the last layer. You can already tell how many yellow edges you will have! Rule: count the four last-layer edges (the ones that have a yellow sticker). An edge on the top is GOOD if its yellow sticker faces up. The edge sitting in the middle layer slot is GOOD if its yellow sticker faces the front or the back (not left or right). If you insert the pair using only R, U (and L, D) moves and no F or B turns, good edges stay good. So: 0 good = dot, 2 good = line or L, 4 good = cross, and you skip look 1! F or B turns flip edges, so avoid them when you want to keep your count. Try the practice at the bottom.",
    [], []
  ]
);

let PQ = { api: null, sc: null, ans: null };

// last-layer edges: the 4 pieces that have a yellow sticker. good = yellow up (top) or yellow on the front/back (middle layer)
const eoGood = (S) => S
  .filter((s) => s.c == "U" && s.o[1] == 1 && s.o.filter((v) => v).length == 2)
  .map((s) => ({
    slot: s.p[1] == 0,
    good: s.p[1] == 1 ? s.n[1] == 1 : s.n[2] != 0,
    side: s.n[2] != 0 ? "front/back" : "left/right"
  }));

function pqNew() {
  const P = F2.filter(([a]) => !/[FB]/.test(a)),
    i = [...Array(57).keys()].filter((k) => k != 51)[Math.random() * 56 | 0],
    f = P[Math.random() * P.length | 0][0],
    st = stOf(inv(OLLS[i]) + " " + inv(f)),
    S2 = st.map(cp);
  f.split(" ").forEach((m) => mv(S2, m));
  const up = S2
    .filter((x) => x.c == "U" && x.o[1] == 1 && x.o.filter((v) => v).length == 2 && x.n[1] == 1)
    .map((x) => x.p),
    shape = up.length == 4
      ? "a cross"
      : up.length == 0
          ? "a dot"
          : (up[0][0] == -up[1][0] && up[0][2] == -up[1][2]) ? "a line" : "an L-shape";
  PQ.sc = { i, f, st, eo: eoGood(st), shape };
  PQ.ans = null;
  if (PQ.api) {
    PQ.api.set(st);
  }
  pqShow();
}

function pqInit() {
  PQ.api = cube3d($("#qc"), cube());
  pqNew();
}

function pqShow() {
  const e = $("#pq"), q = PQ.sc;
  if (!e || !q) {
    return;
  }
  const n = q.eo.filter((x) => x.good).length,
    top = q.eo.filter((x) => !x.slot),
    sl = q.eo.find((x) => x.slot);
  let h;
  if (PQ.ans == null) {
    h = `<p><b>The last pair is not in yet.</b> How many last-layer edges will be yellow on top once you insert it with R and U moves? Count the good edges (rule above).</p><div class="row tb"><button class="btn" data-q="0">0 (dot)</button><button class="btn" data-q="2">2 (line or L)</button><button class="btn" data-q="4">4 (cross)</button></div>`;
  } else {
    h = `<p class="${PQ.ans == n ? "ok" : "bad"}"><b>${PQ.ans == n ? "\u2713 Correct!" : "\u2717 Not quite."}</b> The answer is ${n}: ${top.filter((x) => x.good).length} of ${top.length} top edges have yellow up${sl ? `, and the slot edge has yellow on the ${sl.side} (${sl.good ? "good" : "bad"})` : " and no edge is in the slot"}.</p><div class="ar cs">${dia(OLLS[q.i], "OLL")}<div><p>After the pair you get ${q.shape}, so the case is <b>OLL ${q.i + 1}</b>.</p><div class="row"><button class="btn" data-q="w">\u25b6 Insert the pair</button><button class="btn pr" data-q="n">Next \u279c</button></div></div></div>`;
  }
  e.innerHTML = h;
}

function qAct(t) {
  const k = t.dataset.q;
  if (k == "n") {
    return pqNew();
  }
  if (k == "w") {
    qq(async () => {
      PQ.api.set(PQ.sc.st);
      for (const m of PQ.sc.f.split(" ")) {
        await PQ.api.go(m);
      }
    });
    return;
  }
  PQ.ans = +k;
  pqShow();
}

const vPred = () => `<div class="card"><h3>Practice: predict the edges</h3><p class="mu">Drag the cube. The last F2L pair (front-right slot) is not in yet. Decide how many last-layer edges will be yellow on top after you insert it with R and U moves.</p><canvas id="qc" class="cb" width="600" height="600"></canvas><div id="pq"></div></div>`;

/* ---------- MOBILE TIMER, SOLVES, PROGRESS, DATA BUNDLE ---------- */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const MOBT = ["home", "timer", "hist", "prog"],
  MB = () => !!(document.body && document.body.classList.contains("mob")),
  saveT = () => ls.set("cl_t", times);

const fdate = (d) => d
  ? new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
  : "older solve (no date)";

const mnav = () => `<div id="mnav">${[["home", "🏠", "Home"], ["timer", "⏱", "Timer"], ["hist", "🗂", "Solves"], ["prog", "📈", "Progress"]].map(([k, i, l]) => `<button data-t="${k}" class="${tab == k ? "on" : ""}"><span>${i}</span><small>${l}</small></button>`).join("")}<button id="mmore"><span>☰</span><small>More</small></button></div>`;
const mhead = (t) => `<div id="mbar"><span style="width:42px"></span><div class="mtitle"><b>${t}</b></div><button class="ib" id="mmenu" aria-label="Menu">☰</button></div>`;

function vTimerMob() {
  return `<div id="mbar"><button class="ib" id="bset" aria-label="Timer settings">⚙</button><div class="mtitle" id="bset2"><b>3x3 Cube ▾</b><small id="msub"></small></div><button class="ib" id="mmenu" aria-label="Menu">☰</button></div>
<p id="sc"></p><div class="mrow"><button class="ib" id="cb" title="Fastest cross">💡</button><span class="mu" id="su"></span><span><button class="ib" id="sv" title="Save scramble">☆</button><button class="ib" id="rp" title="Do it again">↻</button><button class="ib" id="ns" title="New scramble">🔀</button></span></div><div id="cx" class="card" hidden></div>
<div id="msg"></div>
<div id="tz"><button class="mb" id="xc">✕ Cancel</button><div id="tmw"><div id="tm">0.00</div><span id="dlt"></span></div><div id="ph" class="phl"></div><div id="pst" hidden></div><div id="res"></div><div class="mu" id="hint">${hint0()}</div></div>
<div id="mfoot"><div id="mst"></div><div id="snp"></div><div id="mao"></div></div>${mnav()}
<div id="setpop" hidden><div class="sch"><b>⚙ Timer settings</b><button class="mb" id="xs">✕ Close</button></div>${setHtml()}</div>`;
}

function msubSet() {
  const m = $("#msub");
  if (m) {
    m.textContent = (ST.insp ? `Inspection ${ST.insp}s` : "No inspection") + (ST.split ? ` · ${ST.pre} splits` : "");
  }
}

function statsMob() {
  const v = times.map(val),
    fin = v.filter(isFinite),
    n = fin.length,
    fm = (x) => x == null ? "--" : fmt(x),
    mean = n ? fin.reduce((a, b) => a + b, 0) / n : null,
    sd = n > 1 ? Math.sqrt(fin.reduce((a, b) => a + (b - mean) ** 2, 0) / n) : null,
    L = times[times.length - 1];
  $("#mst").innerHTML = `Deviation: ${fm(sd)}<br>Mean: ${fm(mean)}<br>Best: ${fm(n ? Math.min(...fin) : null)}<br>Count: ${times.length}`;
  let nb = false;
  if (T.fresh) {
    for (const k of [5, 12, 50, 100]) {
      const c = aoN(v, k);
      if (c != null && isFinite(c)) {
        const pb = bestOf(v.slice(0, -1), k, aoN);
        if (pb == null || c < pb) {
          nb = true;
        }
      }
    }
  }
  $("#mao").innerHTML = (nb ? `<span class="newb">New average best!</span>` : "") + [5, 12, 50, 100].map((k) => `<div class="${k == 5 ? "b" : ""}">Ao${k}: ${fm(aoN(v, k))}</div>`).join("");
  $("#msg").innerHTML = T.fresh && T.msg ? T.msg : "";
  $("#res").innerHTML = L ? `<button class="rb del" id="mdel" title="Delete this solve">✕</button><span class="pl"><button id="pd" class="${L.pen == "DNF" ? "on" : ""}" title="DNF">⊘</button><button id="p2" class="${L.pen == 2 ? "on" : ""}" title="+2">⚑</button></span><button class="rb" id="mnote" title="See the scramble and add a description">📝</button>` : "";
  const K = L && L.sp ? L.ph.join("|") : null,
    S = K ? times.filter((x) => x.sp && x.ph.join("|") == K).slice(-12) : [],
    p = $("#pst");
  p.hidden = S.length < 2;
  if (S.length > 1) {
    const d = L.ph.map((_, i) => S.reduce((a, x) => a + deltas(x)[i], 0) / S.length);
    p.innerHTML = bars(d, L.ph);
  }
}

function mdel(t) {
  if (t.dataset.c) {
    times.pop();
    saveT();
    T.fresh = false;
    T.msg = "";
    stats();
    tmSet("0.00");
    return;
  }
  t.dataset.c = "1";
  t.textContent = "?";
  setTimeout(() => {
    if (t.isConnected) {
      t.dataset.c = "";
      t.textContent = "✕";
    }
  }, 2200);
}

/* ---- one solve: scramble, date, description, penalties ---- */
let SI = -1;

function solveDlg(i) {
  const x = times[i];
  if (!x) {
    return;
  }
  SI = i;
  $("#sd").hidden = false;
  $("#sdt").textContent = `#${i + 1} · ${ftime(x)}`;
  $("#sdi").textContent = fdate(x.d);
  $("#sds").textContent = x.s;
  $("#sds").dataset.c = x.s;
  $("#sdp").innerHTML = x.sp ? bars(deltas(x), x.ph) : "";
  $("#sdn").value = x.n || "";
  $("#sd2").textContent = x.pen == 2 ? "Remove +2" : "+2 penalty";
  $("#sdd").textContent = x.pen == "DNF" ? "Undo DNF" : "DNF";
  const r = $("#sdr");
  r.textContent = "🗑 Delete";
  r.dataset.c = "";
}

function sdRefresh() {
  stats();
  if (tab == "hist") {
    histFill();
  }
}

function sdClose() {
  const x = times[SI];
  $("#sd").hidden = true;
  if (x && $("#sdn").value != (x.n || "")) {
    x.n = $("#sdn").value.trim();
    x.m = Date.now();
    if (!x.n) {
      delete x.n;
    }
    saveT();
  }
  sdRefresh();
}

function sdWire() {
  $("#sdx").onclick = sdClose;
  $("#sd2").onclick = () => {
    tpen("p2", SI);
    solveDlg(SI);
    sdRefresh();
  };
  $("#sdd").onclick = () => {
    tpen("pd", SI);
    solveDlg(SI);
    sdRefresh();
  };
  $("#sdu").onclick = () => {
    const x = times[SI];
    if (!x) {
      return;
    }
    sdClose();
    go("timer");
    newScr(x.s);
  };
  $("#sdr").onclick = (e) => {
    const b = e.currentTarget;
    if (b.dataset.c) {
      times.splice(SI, 1);
      saveT();
      $("#sd").hidden = true;
      sdRefresh();
      if (tab == "timer") {
        tmSet("0.00");
      }
      return;
    }
    b.dataset.c = "1";
    b.textContent = "Tap again to delete";
  };
  $("#sdn").oninput = () => {
    const x = times[SI];
    if (!x) {
      return;
    }
    x.n = $("#sdn").value;
    x.m = Date.now();
    saveT();
  };
}

/* ---- all solves ---- */
let HQ = "", HN = 50;

function vHist() {
  const c = `<div class="card"><h2>🗂 Solves</h2><p class="mu">Every solve you did, with its scramble. Tap one to read the scramble, add a description, or fix its penalty.</p><input id="hq" type="search" placeholder="Search notes, scrambles, times…" value="${esc(HQ)}"><div class="mu" id="hc"></div></div><div id="hl"></div>`;
  return (isDesk() ? "" : mhead("Solves")) + c + (isDesk() ? "" : mnav());
}

function histFill() {
  const q = HQ.toLowerCase(), L = $("#hl");
  if (!L) {
    return;
  }
  const idx = [];
  for (let i = times.length - 1; i >= 0; i--) {
    const x = times[i];
    if (
      !q || (x.s + " " + (x.n || "") + " " + ftime(x) + " " + fdate(x.d)).toLowerCase().includes(q)
    ) {
      idx.push(i);
    }
  }
  $("#hc").textContent = `${idx.length} of ${times.length} solves`;
  L.innerHTML =
    idx
      .slice(0, HN)
      .map((i) => {
        const x = times[i];
        return `<div class="hrow" data-si="${i}"><div class="hr1"><b>#${i + 1}</b><span class="ht">${ftime(x)}</span><span class="mu">${fdate(x.d)}</span></div><div class="hs">${x.s}</div>${x.n ? `<div class="hn">📝 ${esc(x.n)}</div>` : ""}${x.sp ? `<div class="mu">${deltas(x).map((v, j) => x.ph[j] + " " + fmt(v)).join(" · ")}</div>` : ""}</div>`;
      })
      .join("") ||
      `<p class="mu">No solves yet.</p>`;
  if (idx.length > HN) {
    L.innerHTML += `<button class="btn" id="hmore" style="width:100%">Show more (${idx.length - HN} left)</button>`;
  }
}

/* ---- progress chart ---- */
function chart() {
  const N = Math.min(times.length, 150);
  if (N < 2) {
    return `<p class="mu">Do a few solves to see your progress chart.</p>`;
  }
  const all = times.map(val),
    base = times.length - N,
    v = all.slice(base),
    fin = v.filter(isFinite).sort((a, b) => a - b);
  if (fin.length < 2) {
    return "";
  }
  const lo = fin[0],
    hi = Math.min(
      fin[fin.length - 1],
      (fin[Math.floor(fin.length * .95)] || fin[fin.length - 1]) * 1.25
    ),
    W = 340,
    H = 190,
    pl = 40,
    pb = 14,
    pt = 8,
    sx = (i) => pl + (W - pl - 8) * (i / (N - 1)),
    sy = (x) => pt + (H - pt - pb) * (1 - (Math.min(x, hi) - lo) / ((hi - lo) || 1));
  const line = (k) => {
    let d = "";
    for (let i = 0; i < N; i++) {
      const a = aoN(all.slice(0, base + i + 1), k);
      if (a != null && isFinite(a)) {
        d += (d ? "L" : "M") + sx(i).toFixed(1) + " " + sy(a).toFixed(1);
      }
    }
    return d;
  };
  let g = "";
  for (let k = 0; k <= 3; k++) {
    const y = pt + (H - pt - pb) * k / 3, val_ = hi - (hi - lo) * k / 3;
    g += `<line x1="${pl}" x2="${W - 8}" y1="${y}" y2="${y}" stroke="currentColor" opacity=".18"/><text x="${pl - 4}" y="${y + 3}" text-anchor="end" font-size="9" fill="currentColor" opacity=".8">${fmt(val_)}</text>`;
  }
  const dots = v.map((x, i) => isFinite(x) ? `<circle cx="${sx(i).toFixed(1)}" cy="${sy(x).toFixed(1)}" r="2.2" fill="currentColor" opacity=".55"/>` : "").join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Solve times chart">${g}${dots}<path d="${line(12)}" fill="none" stroke="#ffd54a" stroke-width="2"/><path d="${line(5)}" fill="none" stroke="#7dffb0" stroke-width="2"/></svg><p class="mu" style="text-align:center">Last ${N} solves · <span style="color:#7dffb0">━ ao5</span> · <span style="color:#ffd54a">━ ao12</span> · dots = single solves</p>`;
}

function vProg() {
  const v = times.map(val),
    fin = v.filter(isFinite),
    n = fin.length,
    fm = (x) => x == null ? "--" : fmt(x),
    cur = v.length ? v[v.length - 1] : null;
  const rows = [
    ["Single", cur, n ? Math.min(...fin) : null],
    ["Mo3", moN(v, 3), bestOf(v, 3, moN)],
    ["Ao5", aoN(v, 5), bestOf(v, 5, aoN)],
    ["Ao12", aoN(v, 12), bestOf(v, 12, aoN)],
    ["Ao50", aoN(v, 50), bestOf(v, 50, aoN)],
    ["Ao100", aoN(v, 100), bestOf(v, 100, aoN)]
  ];
  const mean = n ? fin.reduce((a, b) => a + b, 0) / n : null,
    sd = n > 1 ? Math.sqrt(fin.reduce((a, b) => a + (b - mean) ** 2, 0) / n) : null,
    dnf = v.length - n;
  const sp = times.filter((x) => x.sp).slice(-50),
    K = sp.length ? sp[sp.length - 1].ph.join("|") : null,
    S = K ? sp.filter((x) => x.ph.join("|") == K) : [];
  const sb = S.length > 1 ? `<div class="card"><h3>Average per step (last ${S.length} split solves)</h3>${bars(sp[sp.length - 1].ph.map((_, i) => S.reduce((a, x) => a + deltas(x)[i], 0) / S.length), sp[sp.length - 1].ph)}</div>` : "";
  const c = `<div class="card"><h2>📈 Progress</h2>${chart()}</div><div class="card"><h3>Records</h3><table class="rt"><tr><th></th><th>current</th><th>best</th></tr>${rows.map(([a, b, c2]) => `<tr><th>${a}</th><td>${fm(b)}</td><td>${fm(c2)}</td></tr>`).join("")}</table><p class="mu">Solves: ${times.length} · DNF: ${dnf} · Mean: ${fm(mean)} · Deviation: ${fm(sd)}</p></div>${sb}`;
  return (isDesk() ? "" : mhead("Progress")) + c + (isDesk() ? "" : mnav());
}

/* ---- data bundle: what is saved to your account and restored from it (bkData, mergeIn) ---- */
const bkData = () => ({
  app: "cubelab",
  v: 1,
  at: new Date().toISOString(),
  data: {
    cl_t: times,
    cl_pin: PIN,
    cl_done: LD,
    cl_ua: UX,
    cl_uo: UO,
    cl_w: W,
    cl_tr: TRD,
    cl_set: ST,
    cl_theme: THM,
    cl_tmr: TMR,
    cl_days: DAYS
  }
});

const tkeys = (a) => {
  const seen = {};
  return a.map((x) => {
    const k = x.d ? x.d + "|" + x.s : "|" + x.s + "|" + x.t;
    seen[k] = (seen[k] || 0) + 1;
    return k + "#" + seen[k];
  });
};

function mergeTimes(a, b) {
  const m = new Map(), ka = tkeys(a), kb = tkeys(b);
  a.forEach((x, i) => m.set(ka[i], x));
  let add = 0;
  b.forEach((y, i) => {
    const x = m.get(kb[i]);
    if (!x) {
      m.set(kb[i], y);
      add++;
    } else if ((y.m || y.d || 0) > (x.m || x.d || 0)) {
      m.set(kb[i], y);
    }
  });
  const all = [...m.values()];
  return {
    list: [...all.filter((x) => !x.d), ...all.filter((x) => x.d).sort((p, q) => p.d - q.d)],
    add
  };
}

function reapplyUO() {
  for (const m in M) {
    for (const s in M[m].sets) {
      M[m].sets[s].forEach((c) => {
        c.a = UO[c.id] || c.id;
      });
    }
  }
  ALL.forEach((x) => {
    x.a = UO[x.id] || x.id;
  });
}

function mergeIn(inc, mode, withSet) {
  const D = (inc && inc.data) || {};
  if (!inc || inc.app != "cubelab" || !D.cl_t) {
    throw new Error("This is not a CubeLab backup");
  }
  let add = 0;
  if (mode == "replace") {
    times = D.cl_t;
    PIN = D.cl_pin || [];
    LD = D.cl_done || [];
    W = D.cl_w || {};
    TRD = trNorm(D.cl_tr);
    Object.keys(UX).forEach((k) => delete UX[k]);
    Object.assign(UX, D.cl_ua || {});
    Object.keys(UO).forEach((k) => delete UO[k]);
    Object.assign(UO, D.cl_uo || {});
    DAYS = [...(D.cl_days || [])];
    add = times.length;
  } else {
    const r = mergeTimes(times, D.cl_t);
    times = r.list;
    add = r.add;
    (D.cl_pin || []).forEach((x) => {
      if (!PIN.includes(x)) {
        PIN.push(x);
      }
    });
    (D.cl_done || []).forEach((x) => {
      if (!LD.includes(x)) {
        LD.push(x);
      }
    });
    for (const k in D.cl_ua || {}) {
      const L = UX[k] = UX[k] || [];
      D.cl_ua[k].forEach((x) => {
        if (!L.includes(x)) {
          L.push(x);
        }
      });
    }
    Object.assign(UO, D.cl_uo || {});
    for (const k in D.cl_w || {}) {
      W[k] = Math.max(W[k] || 1, D.cl_w[k]);
    }
    TRD = trMerge(TRD, D.cl_tr);
  }
  if (withSet && D.cl_set) {
    if (mode == "replace") {
      Object.keys(ST).forEach((k) => delete ST[k]);
    }
    Object.assign(ST, D.cl_set);
    ssave();
  }
  if (withSet && D.cl_theme) {
    THM = D.cl_theme;
    TMR = D.cl_tmr || {};
    ls.set("cl_theme", THM);
    ls.set("cl_tmr", TMR);
    applyTheme();
    applyTimer();
  }
  (D.cl_days || []).forEach((x) => {
    if (!DAYS.includes(x)) {
      DAYS.push(x);
    }
  });
  ls.set("cl_days", DAYS);
  saveT();
  ls.set("cl_pin", PIN);
  ls.set("cl_done", LD);
  ls.set("cl_ua", UX);
  ls.set("cl_uo", UO);
  ls.set("cl_w", W);
  ls.set("cl_tr", TRD);
  trPrefsIn();
  reapplyUO();
  return { add, total: times.length };
}

sdWire();

/* ---------- CUSTOMIZE: colors and look for the whole site + a separate timer style ---------- */
const TKEYS = [
  ["bg", "Page background"],
  ["cd", "Cards"],
  ["bar", "Bars, panels and pop-ups"],
  ["tx", "Text"],
  ["mu", "Soft text"],
  ["ac", "Accent"],
  ["bd", "Borders"],
  ["ok", "Good (green)"],
  ["bad", "Bad (red)"]
];

const TPRE = {
  "Auto (device)": null,
  "Light": {
    bg: "#f5f4ef",
    cd: "#ffffff",
    bar: "#ffffff",
    tx: "#1c1c1e",
    mu: "#6c6c72",
    ac: "#2563eb",
    bd: "#e3e1d8",
    ok: "#16a34a",
    bad: "#dc2626"
  },
  "Dark": {
    bg: "#111113",
    cd: "#1c1c1f",
    bar: "#1c1c1f",
    tx: "#f2f2f4",
    mu: "#9a9aa2",
    ac: "#6b9bff",
    bd: "#2f2f34",
    ok: "#4ade80",
    bad: "#f87171"
  },
  "Black": {
    bg: "#000000",
    cd: "#0f0f0f",
    bar: "#141414",
    tx: "#eeeeee",
    mu: "#8a8a8a",
    ac: "#00d1ff",
    bd: "#2a2a2a",
    ok: "#3dff8a",
    bad: "#ff5c5c"
  },
  "Phone blue": {
    bg: "#1b3cff",
    bg2: "#2a1fec",
    ang: 180,
    cd: "#3b4df8",
    bar: "#3a1de6",
    tx: "#ffffff",
    mu: "#cfd3ff",
    ac: "#ffe066",
    bd: "#6f7dff",
    ok: "#8dffb8",
    bad: "#ffb3b3"
  },
  "Forest": {
    bg: "#0f1f17",
    bg2: "#16331f",
    ang: 160,
    cd: "#1b3a2a",
    bar: "#174229",
    tx: "#e8f5ec",
    mu: "#9fc4ae",
    ac: "#7be495",
    bd: "#2f5a43",
    ok: "#7be495",
    bad: "#ff8a80"
  },
  "Ocean": {
    bg: "#06202e",
    bg2: "#0b4a63",
    ang: 160,
    cd: "#0e3a4f",
    bar: "#0c5877",
    tx: "#e6f6ff",
    mu: "#9cc7dc",
    ac: "#38d6ff",
    bd: "#1f6a8a",
    ok: "#5eead4",
    bad: "#ff8fa3"
  },
  "Sunset": {
    bg: "#2b1020",
    bg2: "#5a1d2d",
    ang: 160,
    cd: "#3d1830",
    bar: "#6b2036",
    tx: "#fff1ea",
    mu: "#f0b9a8",
    ac: "#ffb347",
    bd: "#7a3042",
    ok: "#ffd166",
    bad: "#ff6b6b"
  },
  "Purple": {
    bg: "#1a1033",
    bg2: "#2e1a5e",
    ang: 160,
    cd: "#2b1b52",
    bar: "#3a2478",
    tx: "#f3ecff",
    mu: "#bda7e8",
    ac: "#c084fc",
    bd: "#4d3394",
    ok: "#86efac",
    bad: "#fda4af"
  },
  "Rose": {
    bg: "#fff1f4",
    cd: "#ffffff",
    bar: "#ffe0e8",
    tx: "#3a1020",
    mu: "#8c5566",
    ac: "#e11d6a",
    bd: "#f3c9d5",
    ok: "#0f9d58",
    bad: "#d90429"
  },
  "Paper": {
    bg: "#f4ecd8",
    cd: "#fbf6e9",
    bar: "#efe3c6",
    tx: "#3b2f1e",
    mu: "#7d6b4f",
    ac: "#b45309",
    bd: "#dccfb0",
    ok: "#4d7c0f",
    bad: "#b91c1c"
  }
};

const FONTS = [
  ["Default", ""],
  ["System", 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'],
  ["Serif", 'Georgia,"Times New Roman",serif'],
  ["Rounded", '"Trebuchet MS","Segoe UI",sans-serif'],
  ["Monospace", 'ui-monospace,Menlo,Consolas,monospace'],
  ["Digital (Orbitron)", 'Orbitron,"Share Tech Mono",ui-monospace,monospace']
];

let THM = ls.get("cl_theme", {}), TMR = ls.get("cl_tmr", {});

const hexRgb = (h) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || "");
  const n = m ? parseInt(m[1], 16) : 0x888888;
  return [n >> 16, (n >> 8) & 255, n & 255];
};

const lum = (h) => {
  const [r, g, b] = hexRgb(h)
    .map((v) => {
      v /= 255;
      return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
    });
  return .2126 * r + .7152 * g + .0722 * b;
};

const cvx = (() => {
  try {
    return document.createElement("canvas").getContext("2d");
  } catch (e) {
    return null;
  }
})();

function toHex(str, under) {
  if (!cvx || !str) {
    return "#888888";
  }
  cvx.clearRect(0, 0, 1, 1);
  cvx.fillStyle = "#000";
  cvx.fillStyle = String(str).trim();
  cvx.fillRect(0, 0, 1, 1);
  let [r, g, b, a] = cvx.getImageData(0, 0, 1, 1).data;
  if (a < 255 && under) {
    const u = hexRgb(under), k = a / 255;
    r = Math.round(r * k + u[0] * (1 - k));
    g = Math.round(g * k + u[1] * (1 - k));
    b = Math.round(b * k + u[2] * (1 - k));
  }
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

const curVar = (k) => {
  const cs = getComputedStyle(document.body), bg = toHex(cs.getPropertyValue("--bg"));
  return k == "bg" ? bg : toHex(cs.getPropertyValue("--" + k), bg);
};

const curCol = (k) => (THM.c && THM.c[k]) || curVar(k);

function applyTheme() {
  const b = document.body,
    s = b.style,
    r = document.documentElement.style,
    c = THM.c || {},
    g = THM.g || {};
  TKEYS.forEach(([k]) => c[k] ? s.setProperty("--" + k, c[k]) : s.removeProperty("--" + k));
  b.classList.toggle("themed", !!c.bg);
  if (c.bg) {
    s.setProperty("--bgi", g.on && g.c2 ? `linear-gradient(${g.ang == null ? 180 : g.ang}deg,${c.bg},${g.c2})` : "var(--bg)");
    s.colorScheme = lum(c.bg) < .4 ? "dark" : "light";
  } else {
    s.removeProperty("--bgi");
    s.colorScheme = "";
  }
  c.ac
    ? s.setProperty("--onac", lum(c.ac) > .45 ? "#111111" : "#ffffff")
    : s.removeProperty("--onac");
  THM.ff ? s.setProperty("--ff", THM.ff) : s.removeProperty("--ff");
  THM.fs && THM.fs != 100 ? r.setProperty("--fs", THM.fs / 100) : r.removeProperty("--fs");
  if (THM.rad != null) {
    s.setProperty("--r", THM.rad + "px");
    s.setProperty("--rb", Math.round(THM.rad * .7) + "px");
    s.setProperty("--rbp", Math.round(THM.rad * 2) + "px");
  } else {
    ["--r", "--rb", "--rbp"].forEach((k) => s.removeProperty(k));
  }
  b.classList.toggle("nosnp", !!THM.nosnp);
  b.classList.toggle("nopst", !!THM.nopst);
  b.classList.toggle("hu-tao", !!ls.get("cl_hutao", false));
}

function applyTimer() {
  const b = document.body, s = b.style, m = TMR;
  [["fg", "--tfg"], ["hold", "--thold"], ["ready", "--tready"], ["mu", "--tmu"]].forEach(
    ([k, v]) => m[k] ? s.setProperty(v, m[k]) : s.removeProperty(v)
  );
  m.fbg ? s.setProperty("--fbg", m.g2 ? `linear-gradient(${m.ang == null ? 180 : m.ang}deg,${m.fbg},${m.g2})` : m.fbg) : s.removeProperty("--fbg");
  m.ff ? s.setProperty("--tff", m.ff) : s.removeProperty("--tff");
  b.classList.toggle("tcf", !!m.ff);
  m.w ? s.setProperty("--tw", m.w) : s.removeProperty("--tw");
  b.classList.toggle("tcw", !!m.w);
  m.size && m.size != 100 ? s.setProperty("--tsc", m.size / 100) : s.removeProperty("--tsc");
}

const thSave = () => {
  ls.set("cl_theme", THM);
  applyTheme();
},
  tmSave = () => {
    ls.set("cl_tmr", TMR);
    applyTimer();
  };

function ensureC() {
  if (!THM.c || !THM.c.bg) {
    THM.c = THM.c || {};
    TKEYS.forEach(([k]) => {
      if (!THM.c[k]) {
        THM.c[k] = curVar(k);
      }
    });
  }
}

function thPreset(n) {
  const p = TPRE[n];
  THM.c = p ? Object.fromEntries(TKEYS.map(([k]) => [k, p[k]])) : {};
  THM.g = p && p.bg2 ? { on: true, c2: p.bg2, ang: p.ang == null ? 160 : p.ang } : { on: false };
  THM.pre = n;
  thSave();
  render();
}

function thSet(k, t) {
  const v = t.type == "checkbox" ? t.checked : t.value;
  if (TKEYS.some((x) => x[0] == k)) {
    ensureC();
    THM.c[k] = v;
  } else if (k == "gon") {
    ensureC();
    THM.g = Object.assign({ c2: "#2a1fec", ang: 160 }, THM.g || {}, { on: v });
  } else if (k == "g2") {
    ensureC();
    THM.g = Object.assign({ ang: 160 }, THM.g || {}, { c2: v, on: true });
    const g = $("#gon");
    if (g) {
      g.checked = true;
    }
  } else if (k == "ang") {
    ensureC();
    THM.g = Object.assign({ c2: "#2a1fec" }, THM.g || {}, { ang: +v });
  } else if (k == "ff") {
    THM.ff = FONTS[+v][1];
  } else if (k == "fs") {
    THM.fs = +v;
  } else if (k == "rad") {
    THM.rad = +v;
  } else if (k == "nosnp" || k == "nopst") {
    THM[k] = v;
  }
  THM.pre = "Custom";
  thSave();
  const o = $("#thv_" + k);
  if (o) {
    o.textContent = k == "fs" ? v + "%" : k == "rad" ? v + " px" : k == "ang" ? v + "°" : v;
  }
  document.querySelectorAll(".sw.on").forEach((e) => e.classList.remove("on"));
}

function tmOpt(k, t) {
  const v = t.type == "checkbox" ? t.checked : t.value;
  if (k == "size") {
    TMR.size = +v;
  } else if (k == "w") {
    TMR.w = v || 0;
  } else if (k == "ff") {
    TMR.ff = FONTS[+v][1] || "";
  } else if (k == "ang") {
    TMR.ang = +v;
  } else {
    TMR[k] = v;
  }
  tmSave();
  const o = $("#tmv_" + k);
  if (o) {
    o.textContent = k == "size" ? v + "%" : k == "ang" ? v + "°" : v;
  }
}

function tmClear(k) {
  if (k == "fbg") {
    delete TMR.fbg;
    delete TMR.g2;
    delete TMR.ang;
  } else if (k == "ff") {
    delete TMR.ff;
  } else {
    delete TMR[k];
  }
  tmSave();
  render();
}

const fsel = (cur, at) => `<select ${at}>${FONTS.map(([n, v], i) => `<option value="${i}" ${v == cur ? "selected" : ""}>${n}</option>`).join("")}</select>`;

function vTheme() {
  const g = THM.g || {},
    c = (k) => curCol(k),
    tcol = (k, l, d) => `<label class="cl"><span>${l}</span><span><input type="color" data-tm="${k}" value="${TMR[k] || d}"><button class="mb xs" data-tmx="${k}" title="Back to automatic">auto</button></span></label>`;
  return `${ls.get("cl_hutao", false) ? `<div id="hu-haunt-layer" aria-label="A wandering ghost"><button id="hu-haunt" title="Tap Boo Tao to turn off the Hu Tao theme" aria-label="Turn off Hu Tao theme"><img src="assets/boo-tao.png" alt="Boo Tao"></button></div>` : ""}<div class="card"><h2>🎨 Customize</h2><p>Pick colors and a look for the <b>whole site</b>. Your choices are saved in this browser and included in automatic cloud saves when you sign in. The <b>solving screen (focus mode) is not changed by the site colors</b>: it has its own timer style further down.</p></div>
${ls.get("cl_hutao", false) ? `<div class="card"><h3>Hu Tao solve sounds</h3><div class="sr"><input type="checkbox" id="huTaoAudio" ${ls.get("cl_hutao_audio", true) ? "checked" : ""}><label for="huTaoAudio">Play a sound when this solve is faster or slower than the previous solve</label></div><label class="cl"><span>Sound volume</span><input type="range" id="huTaoVolume" min="0" max="100" step="5" value="${ls.get("cl_hutao_volume", 75)}"></label><p class="mu">Faster: Yahoo · Slower: Oyaoya. Sounds play only while the Hu Tao theme is active.</p></div>` : ""}
<div class="card"><h3>Presets</h3><div class="swg">${Object.entries(TPRE).map(([n, p]) => `<button class="sw ${THM.pre == n ? "on" : ""}" data-pr="${esc(n)}"><span class="sws"><i style="background:${p ? p.bg : "#9aa0aa"}"></i><i style="background:${p ? p.cd : "#d7dae0"}"></i><i style="background:${p ? p.bar : "#c4c9d2"}"></i><i style="background:${p ? p.ac : "#2563eb"}"></i></span>${n}</button>`).join("")}</div></div>
<div class="card"><h3>Colors</h3><div class="cg">${TKEYS.map(([k, l]) => `<label class="cl"><span>${l}</span><input type="color" data-th="${k}" value="${c(k)}"></label>`).join("")}</div>
<div class="sr" style="margin-top:12px"><input type="checkbox" id="gon" data-th="gon" ${g.on ? "checked" : ""}><label for="gon">Gradient background</label></div>
<div class="cg"><label class="cl"><span>Second color</span><input type="color" data-th="g2" value="${g.c2 || "#2a1fec"}"></label><label class="cl"><span>Angle <b id="thv_ang">${g.ang == null ? 180 : g.ang}°</b></span><input type="range" min="0" max="360" step="5" data-th="ang" value="${g.ang == null ? 180 : g.ang}"></label></div></div>
<div class="card"><h3>Look</h3><div class="cg"><label class="cl"><span>Font</span>${fsel(THM.ff || "", 'data-th="ff"')}</label>
<label class="cl"><span>Text size <b id="thv_fs">${THM.fs || 100}%</b></span><input type="range" min="80" max="140" step="5" data-th="fs" value="${THM.fs || 100}"></label>
<label class="cl"><span>Roundness <b id="thv_rad">${THM.rad == null ? 16 : THM.rad} px</b></span><input type="range" min="0" max="28" step="1" data-th="rad" value="${THM.rad == null ? 16 : THM.rad}"></label></div>
<div class="sr"><input type="checkbox" id="nosnp" data-th="nosnp" ${THM.nosnp ? "checked" : ""}><label for="nosnp">Hide the scramble picture on the timer</label></div>
<div class="sr"><input type="checkbox" id="nopst" data-th="nopst" ${THM.nopst ? "checked" : ""}><label for="nopst">Hide the step breakdown under the time</label></div></div>
<div class="card"><h3>⏱ Timer style (separate from the site colors)</h3><p class="mu">These only change the timer: the big digits and the solving screen (focus mode). “auto” goes back to the default.</p>
<div class="tpv"><div class="tpd"><span class="tb">12</span><span class="td">.34</span></div><div class="tpn"><span class="h">● holding</span><span class="r">● ready</span><span class="m">hint text</span></div></div>
<div class="cg" style="margin-top:12px">${tcol("fg", "Digits color", "#ffffff")}${tcol("hold", "Color while holding", "#ff5555")}${tcol("ready", "Color when ready", "#55ff55")}${tcol("mu", "Small text color", "#9aa0b5")}${tcol("fbg", "Solving-screen background", "#0d0d12")}
<label class="cl"><span>Background gradient</span><span><input type="color" data-tm="g2" value="${TMR.g2 || "#2a1fec"}"></span></label>
<label class="cl"><span>Gradient angle <b id="tmv_ang">${TMR.ang == null ? 180 : TMR.ang}°</b></span><input type="range" min="0" max="360" step="5" data-tm="ang" value="${TMR.ang == null ? 180 : TMR.ang}"></label>
<label class="cl"><span>Digits font</span>${fsel(TMR.ff || "", 'data-tm="ff"')}</label>
<label class="cl"><span>Digits size <b id="tmv_size">${TMR.size || 100}%</b></span><input type="range" min="50" max="170" step="5" data-tm="size" value="${TMR.size || 100}"></label>
<label class="cl"><span>Weight</span><select data-tm="w"><option value="">Default</option><option value="400" ${TMR.w == "400" ? "selected" : ""}>Light</option><option value="700" ${TMR.w == "700" ? "selected" : ""}>Bold</option><option value="900" ${TMR.w == "900" ? "selected" : ""}>Heavy</option></select></label></div>
<div class="row" style="margin-top:10px"><button class="btn" id="tmr">Reset timer style</button></div></div>
<div class="card"><h3>Share or reset</h3><div class="row"><button class="btn" id="thc">📋 Copy my theme as text</button><button class="btn" id="tha">Apply theme text</button><button class="btn" id="thr">↺ Reset everything here</button></div><textarea id="thx" rows="3" placeholder="Paste a theme text here to use it, or copy yours from the button above"></textarea><p class="mu" id="thm"></p></div>`;
}

function thAct(id) {
  const m = $("#thm");
  if (id == "thr") {
    THM = {};
    TMR = {};
    ls.set("cl_theme", THM);
    ls.set("cl_tmr", TMR);
    applyTheme();
    applyTimer();
    render();
    return;
  }
  if (id == "tmr") {
    TMR = {};
    tmSave();
    render();
    return;
  }
  if (id == "thc") {
    const j = JSON.stringify({ app: "cubelab-theme", theme: THM, timer: TMR });
    $("#thx").value = j;
    (navigator.clipboard ? navigator.clipboard.writeText(j) : Promise.reject()).then(
      () => {
        m.textContent = "Copied! Paste it on another device with “Apply theme text”.";
      },
      () => {
        $("#thx").select();
        m.textContent = "Select the text in the box and copy it.";
      }
    );
    return;
  }
  if (id == "tha") {
    try {
      const o = JSON.parse($("#thx").value);
      if (o.app != "cubelab-theme") {
        throw 0;
      }
      THM = o.theme || {};
      TMR = o.timer || {};
      ls.set("cl_theme", THM);
      ls.set("cl_tmr", TMR);
      applyTheme();
      applyTimer();
      render();
    } catch (e) {
      m.textContent = "That is not a CubeLab theme text.";
    }
  }
}

document.addEventListener("input", (e) => {
  const d = e.target.dataset;
  if (!d) {
    return;
  }
  if (d.th) {
    thSet(d.th, e.target);
  } else if (d.tm) {
    tmOpt(d.tm, e.target);
  }
});

applyTheme();
applyTimer();

/* ---- Hu Tao theme: scenes, wandering ghost, solve effects + sounds, quiz and memory game ---- */
const huTaoScenes = {
  landscape: [
    "hu-tao-landscape-01.jpg", "hu-tao-landscape-02.jpg", "hu-tao-landscape-03.jpg",
    "hu-tao-landscape-04.jpg", "hu-tao-landscape-05.jpg"
  ],
  portrait: [
    "hu-tao-portrait-01.jpg", "hu-tao-portrait-02.jpg", "hu-tao-portrait-03.jpg",
    "hu-tao-portrait-04.jpg", "hu-tao-portrait-05.jpg", "hu-tao-portrait-06.jpg"
  ]
};

let huTaoTimer = null, huTaoFade = null, huTaoIndex = -1;

function huTaoFastEffect() {
  if (!document.body.classList.contains("hu-tao")) {
    return;
  }
  const layer = document.createElement("div");
  layer.className = "hu-fast-burst";
  layer.setAttribute("aria-hidden", "true");
  const center = document.createElement("img");
  center.src = "assets/boo-tao.png";
  center.className = "hu-fast-ghost hu-fast-ghost-center";
  layer.appendChild(center);
  for (let i = 0; i < 4; i++) {
    const g = document.createElement("img");
    g.src = "assets/boo-tao.png";
    g.className = "hu-fast-ghost hu-fast-ghost-" + i;
    layer.appendChild(g);
  }
  for (let i = 0; i < 18; i++) {
    const petal = document.createElement("span");
    petal.className = "hu-fast-petal";
    petal.textContent = i % 5 === 0 ? "✿" : "❀";
    petal.style.left = (Math.random() * 100) + "%";
    petal.style.top = (Math.random() * 100) + "%";
    petal.style.setProperty("--turn", (Math.random() * 220 - 110) + "deg");
    layer.appendChild(petal);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 2300);
}

function huTaoResultSound(which) {
  if (!document.body.classList.contains("hu-tao") || !ls.get("cl_hutao_audio", true)) {
    return;
  }
  const file = which === "above" ? "hu-tao-yahoo.mp3" : "hu-tao-oyaoya.mp3",
    a = new Audio("assets/sounds/" + file),
    vol = Number(ls.get("cl_hutao_volume", 75));
  a.volume = Math.max(0, Math.min(1, vol / 100));
  a.play().catch(() => {});
}

document.addEventListener("change", (e) => {
  if (e.target.id === "huTaoAudio") {
    ls.set("cl_hutao_audio", e.target.checked);
  }
});

document.addEventListener("input", (e) => {
  if (e.target.id === "huTaoVolume") {
    ls.set("cl_hutao_volume", +e.target.value);
  }
});

function huTaoScene() {
  if (!document.body.classList.contains("hu-tao")) {
    return;
  }
  let el = document.getElementById("hu-tao-scene");
  if (!el) {
    el = document.createElement("div");
    el.id = "hu-tao-scene";
    el.setAttribute("aria-hidden", "true");
    document.body.prepend(el);
  }
  el.classList.remove("visible");
  clearTimeout(huTaoFade);
  huTaoFade = setTimeout(() => {
    const mobile = matchMedia("(max-width:720px)").matches,
      list = huTaoScenes[mobile ? "portrait" : "landscape"];
    huTaoIndex = (huTaoIndex + 1) % list.length;
    el.style.backgroundImage =
      'linear-gradient(rgba(28,9,14,.76),rgba(28,9,14,.84)),url("assets/' + list[huTaoIndex] + '")';
    requestAnimationFrame(() => el.classList.add("visible"));
  }, 700);
}

function huTaoToggle() {
  const on = !ls.get("cl_hutao", false);
  ls.set("cl_hutao", on);
  document.body.classList.toggle("hu-tao", on);
  clearInterval(huTaoTimer);
  clearTimeout(huTaoFade);
  const el = document.getElementById("hu-tao-scene");
  if (el) {
    el.classList.remove("visible");
  }
  huTaoIndex = -1;
  if (on) {
    huTaoScene();
    huTaoTimer = setInterval(huTaoScene, 9000);
  }
}

if (ls.get("cl_hutao", false)) {
  huTaoScene();
  huTaoTimer = setInterval(huTaoScene, 9000);
}

const huTaoQuiz = [
  {
    q: "What food does Hu Tao sing about liking?",
    a: ["Steamed fish with prawn dumplings", "Ghostly March", "Jueyun Chili Chicken"],
    ok: 0
  },
  {
    q: "What is Hu Tao’s special dish?",
    a: ["Ghostly March", "Adeptus’ Temptation", "Fullmoon Egg"],
    ok: 0
  },
  {
    q: "Which weapon is known as Hu Tao’s signature weapon?",
    a: ["Staff of Homa", "The Catch", "Skyward Spine"],
    ok: 0
  },
  {
    q: "What is Hu Tao’s element and weapon type?",
    a: ["Pyro and Polearm", "Cryo and Sword", "Hydro and Catalyst"],
    ok: 0
  },
  {
    q: "What is Hu Tao’s position at Wangsheng Funeral Parlor?",
    a: ["77th Director", "Chief Alchemist", "Liyue Qixing Secretary"],
    ok: 0
  },
  { q: "Which region is Hu Tao from?", a: ["Liyue", "Inazuma", "Mondstadt"], ok: 0 }
];

let huTaoQuizStep = 0,
  huTaoLives = 3,
  huTaoMemory = [],
  huTaoMatched = [],
  huTaoOpen = [],
  huTaoMoves = 0,
  huTaoMemoryLock = false,
  huTaoMemoryTimer = null;

let huTaoHauntTimer = null, huTaoHauntTurn = 0;

function huTaoHauntInit() {
  clearInterval(huTaoHauntTimer);
  const g = document.getElementById("hu-haunt");
  if (!g) {
    return;
  }
  const move = () => {
    const layer = document.getElementById("hu-haunt-layer"),
      ox = g.style.left || "15%",
      oy = g.style.top || "20%",
      echo = g.cloneNode(true);
    echo.removeAttribute("id");
    echo.disabled = true;
    echo.className = "hu-ghost-echo";
    echo.style.left = ox;
    echo.style.top = oy;
    layer.appendChild(echo);
    setTimeout(() => echo.remove(), 1250);
    const x = 8 + Math.random() * 84, y = 8 + Math.random() * 78;
    g.style.left = x + "%";
    g.style.top = y + "%";
    for (let i = 0; i < 4; i++) {
      const petal = document.createElement("span");
      petal.className = i === 3 ? "hu-ghost-wisp" : "hu-plum-petal";
      petal.textContent = i === 3 ? "◌" : "✿";
      petal.style.left = (x + (Math.random() * 10 - 5)) + "%";
      petal.style.top = (y + (Math.random() * 10 - 5)) + "%";
      layer.appendChild(petal);
      setTimeout(() => petal.remove(), 2100);
    }
    huTaoHauntTurn++;
  };
  move();
  huTaoHauntTimer = setInterval(move, 2100);
}

document.addEventListener("click", (e) => {
  if (!e.target.closest("#hu-haunt")) {
    return;
  }
  clearInterval(huTaoHauntTimer);
  huTaoToggle();
  render();
});

function huTaoEnable() {
  ls.set("cl_hutao", true);
  document.body.classList.add("hu-tao");
  const el = document.getElementById("hu-tao-scene");
  if (el) {
    el.classList.remove("visible");
  }
  clearInterval(huTaoTimer);
  huTaoIndex = -1;
  huTaoScene();
  huTaoTimer = setInterval(huTaoScene, 9000);
}

function huTaoQuizRender(msg = "") {
  const box = document.getElementById("hu-tao-quiz"),
    q = huTaoQuiz[huTaoQuizStep],
    o = q.a.map((_, i) => i);
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.random() * (i + 1) | 0;
    [o[i], o[j]] = [o[j], o[i]];
  }
  box.innerHTML =
    '<div class="hu-quiz-card" role="dialog" aria-modal="true"><button class="hu-quiz-close" data-ht-close aria-label="Close">×</button><div class="eyebrow">Hu Tao trivia · ' +
      (huTaoQuizStep + 1) +
      ' of ' +
      huTaoQuiz.length +
      ' · Mistakes left: ' +
      huTaoLives +
      '</div><h2>' +
      q.q +
      '</h2><div class="hu-quiz-answers">' +
      o
        .map((i) => '<button class="btn hu-quiz-answer" data-ht-answer="' +
          i +
          '">' +
          q.a[i] +
          '</button>')
        .join("") +
      '</div><p class="hu-quiz-feedback">' +
      msg +
      '</p></div>';
}

function huTaoMemoryStart() {
  huTaoMemory = ["👻", "🌸", "🎩", "🔥", "👻", "🌸", "🎩", "🔥"]
    .map((x, i) => ({ x, k: i }))
    .sort(() => Math.random() - .5);
  huTaoMatched = [];
  huTaoOpen = [];
  huTaoMoves = 0;
  huTaoMemoryLock = false;
  huTaoMemoryRender();
}

function huTaoMemoryRender(msg = "") {
  const box = document.getElementById("hu-tao-quiz");
  box.innerHTML =
    '<div class="hu-quiz-card" role="dialog" aria-modal="true"><button class="hu-quiz-close" data-ht-close aria-label="Close">×</button><div class="eyebrow">Ghost match · ' +
      huTaoMoves +
      ' of 12 moves</div><h2>Match all four pairs</h2><p>Find every pair in 12 moves or fewer.</p><div class="hu-memory-grid">' +
      huTaoMemory
        .map((c, i) => '<button class="hu-memory-card ' +
          (huTaoMatched.includes(i) ? "matched" : "") +
          '" data-ht-card="' +
          i +
          '">' +
          (huTaoMatched.includes(i) || huTaoOpen.includes(i) ? c.x : "?") +
          '</button>')
        .join("") +
      '</div><p class="hu-quiz-feedback">' +
      msg +
      '</p></div>';
}

function huTaoQuizOpen() {
  huTaoQuizStep = 0;
  huTaoLives = 3;
  let box = document.getElementById("hu-tao-quiz");
  if (!box) {
    box = document.createElement("div");
    box.id = "hu-tao-quiz";
    document.body.appendChild(box);
  }
  box.hidden = false;
  huTaoQuizRender();
}

function huTaoMemoryFail() {
  huTaoMemoryStart();
  huTaoMemoryRender("Out of moves—board reshuffled. Try again!");
}

document.addEventListener(
  "click",
  (e) => {
    if (tab === "home" && e.target.closest("#ht,#mbar .mtitle")) {
      e.preventDefault();
      huTaoQuizOpen();
      return;
    }
    if (e.target.closest("[data-ht-close]")) {
      document.getElementById("hu-tao-quiz").hidden = true;
      clearTimeout(huTaoMemoryTimer);
      return;
    }
    const an = e.target.closest("[data-ht-answer]");
    if (an) {
      const q = huTaoQuiz[huTaoQuizStep];
      if (+an.dataset.htAnswer !== q.ok) {
        if (!--huTaoLives) {
          huTaoQuizStep = 0;
          huTaoLives = 3;
          huTaoQuizRender("Three mistakes—start again.");
        } else {
          huTaoQuizRender("Not quite—try again.");
        }
        return;
      }
      if (++huTaoQuizStep < huTaoQuiz.length) {
        huTaoQuizRender();
      } else {
        huTaoMemoryStart();
      }
      return;
    }
    const card = e.target.closest("[data-ht-card]");
    if (card && !huTaoMemoryLock) {
      const i = +card.dataset.htCard;
      if (huTaoMatched.includes(i) || huTaoOpen.includes(i)) {
        return;
      }
      huTaoOpen.push(i);
      if (huTaoOpen.length === 2) {
        huTaoMoves++;
        const [x, y] = huTaoOpen;
        if (huTaoMemory[x].x === huTaoMemory[y].x) {
          huTaoMatched.push(x, y);
          huTaoOpen = [];
          if (huTaoMatched.length === 8) {
            huTaoEnable();
            document.getElementById("hu-tao-quiz").innerHTML = '<div class="hu-quiz-card" role="dialog"><button class="hu-quiz-close" data-ht-close>×</button><div class="eyebrow">Director Hu Tao approves</div><h2>The secret theme is yours.</h2><button class="btn pr" data-ht-close>Let’s go</button></div>';
            return;
          }
          if (huTaoMoves >= 12) {
            huTaoMemoryFail();
            return;
          }
          huTaoMemoryRender("Pair found!");
        } else {
          huTaoMemoryLock = true;
          huTaoMemoryRender("No match—remember their places!");
          huTaoMemoryTimer = setTimeout(() => {
            huTaoOpen = [];
            huTaoMemoryLock = false;
            huTaoMoves >= 12 ? huTaoMemoryFail() : huTaoMemoryRender();
          }, 700);
        }
      } else {
        huTaoMemoryRender();
      }
    }
  },
  true
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const box = document.getElementById("hu-tao-quiz");
    if (box) {
      box.hidden = true;
    }
  }
});

window.addEventListener("resize", () => {
  if (document.body.classList.contains("hu-tao")) {
    huTaoIndex = -1;
    huTaoScene();
  }
});

/* ---------- SUPABASE ACCOUNT + CLOUD SYNC ---------- */
let SB = null, cloudUser = null, cloudActiveUserId = null, cloudAuthMode = "login";

let cloudStatusText = "Not connected yet.",
  cloudStatusError = false,
  cloudSyncing = false,
  cloudSaving = false,
  cloudTimer = null;

const CLOUD_KEYS = new Set([
  "cl_t", "cl_pin", "cl_done", "cl_ua", "cl_uo", "cl_w", "cl_tr", "cl_set", "cl_theme", "cl_tmr",
  "cl_days"
]);

const cloudConfigured = () => !!(SB);

const cloudStatus = (message, isError = false) => {
  cloudStatusText = message;
  cloudStatusError = isError;
  const el = $("#cloud-status");
  if (el) {
    el.textContent = message;
    el.className = isError ? "bad" : "mu";
  }
};

const cloudRender = () => {
  if (tab == "account") {
    render();
  }
};

function cloudClientInit() {
  const cfg = window.CUBELAB_SUPABASE || {};
  const validUrl =
    typeof cfg.url == "string" &&
      /^https:\/\/.+\.supabase\.co\/?$/.test(cfg.url) &&
      !cfg.url.includes("YOUR_PROJECT_REF");
  const validKey =
    typeof cfg.publishableKey == "string" &&
      cfg.publishableKey.length > 10 &&
      !cfg.publishableKey.includes("YOUR_SUPABASE_");
  if (!window.supabase || typeof window.supabase.createClient != "function") {
    cloudStatusText = "Supabase client could not load. Check your internet connection and reload.";
    cloudStatusError = true;
    return;
  }
  if (!validUrl || !validKey) {
    cloudStatusText = "Add your Supabase Project URL and publishable key to supabase-config.js.";
    return;
  }
  SB = window.supabase.createClient(cfg.url.replace(/\/$/, ""), cfg.publishableKey);
  cloudRender();
  SB.auth.onAuthStateChange((event, session) => {
    // Defer work out of the auth callback so database requests don't block auth state handling.
    window.setTimeout(() => {
      cloudUser = session && session.user ? session.user : null;
      if (cloudUser) {
        cloudSyncForUser(cloudUser)
          .catch((err) => {
            cloudActiveUserId = null;
            cloudStatus(err.message || "Cloud sync failed.", true);
            cloudRender();
          });
      } else {
        cloudActiveUserId = null;
        clearTimeout(cloudTimer);
        cloudSaving = false;
        cloudStatus("Signed out. Your browser copy is still here.");
      }
      cloudRender();
    }, 0);
  });
  SB
    .auth
    .getSession()
    .then(({ data, error }) => {
      if (error) {
        throw error;
      }
      cloudUser = data.session?.user || null;
      if (cloudUser) {
        return cloudSyncForUser(cloudUser);
      }
      cloudStatus("Connected to Supabase. Sign in to turn on cloud sync.");
      cloudRender();
    })
    .catch((err) => {
      cloudStatus(err.message || "Could not restore your login session.", true);
      cloudRender();
    });
}

function resetLocalForCloudAccount() {
  times = [];
  PIN = [];
  LD = [];
  W = {};
  DAYS = [];
  TRD = trNorm(null);
  trPrefsIn();
  Object.keys(UX).forEach((k) => delete UX[k]);
  Object.keys(UO).forEach((k) => delete UO[k]);
  Object.keys(ST).forEach((k) => delete ST[k]);
  Object.assign(ST, {
    insp: 15,
    focus: 1,
    any: (typeof matchMedia != "undefined" && matchMedia("(pointer:coarse)").matches) ? 1 : 0,
    split: 0,
    sm: "tap",
    rd: 0,
    pre: "CFOP",
    ph: ["Cross", "F2L", "OLL", "PLL"]
  });
  THM = {};
  TMR = {};
  ls.set("cl_t", times);
  ls.set("cl_pin", PIN);
  ls.set("cl_done", LD);
  ls.set("cl_ua", UX);
  ls.set("cl_uo", UO);
  ls.set("cl_w", W);
  ls.set("cl_tr", TRD);
  ls.set("cl_set", ST);
  ls.set("cl_theme", THM);
  ls.set("cl_tmr", TMR);
  ls.set("cl_days", DAYS);
  reapplyUO();
  applyTheme();
  applyTimer();
}

async function cloudSyncForUser(user) {
  if (!SB || !user || cloudActiveUserId === user.id) {
    return;
  }
  cloudActiveUserId = user.id;
  cloudUser = user;
  cloudSyncing = true;
  cloudStatus("Loading your CubeLab data…");
  try {
    const { data, error } = await SB
      .from("cubelab_data")
      .select("data")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      throw error;
    }
    const owner = localStorage.getItem("cubelab_cloud_owner");
    cloudApplying = true;
    try {
      if (data && data.data) {
        if (owner && owner !== user.id) {
          mergeIn(data.data, "replace", true);
        } else {
          mergeIn(data.data, "merge", true);
        }
      } else if (owner && owner !== user.id) {
        // Do not copy another signed-in person's local data into a new account.
        resetLocalForCloudAccount();
      }
    } finally {
      cloudApplying = false;
    }
    localStorage.setItem("cubelab_cloud_owner", user.id);
    await cloudSaveNow();
    cloudStatus("Synced. Your CubeLab data is saved to this account.");
    cloudRender();
    render();
  } catch (err) {
    cloudActiveUserId = null;
    throw err;
  } finally {
    cloudSyncing = false;
  }
}

let cloudApplying = false;

async function cloudSaveNow() {
  if (!SB || !cloudUser || cloudApplying) {
    return;
  }
  if (cloudSaving) {
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(() => cloudSaveNow(), 700);
    return;
  }
  cloudSaving = true;
  try {
    const payload = { user_id: cloudUser.id, data: bkData(), updated_at: new Date().toISOString() };
    const { error } = await SB.from("cubelab_data").upsert(payload, { onConflict: "user_id" });
    if (error) {
      throw error;
    }
    cloudStatus("All changes synced · " + new Date().toLocaleTimeString());
  } catch (err) {
    cloudStatus(err.message || "Cloud save failed. Your local copy is safe.", true);
  } finally {
    cloudSaving = false;
  }
}

function cloudQueueSave(key) {
  if (!CLOUD_KEYS.has(key) || !SB || !cloudUser || cloudApplying) {
    return;
  }
  clearTimeout(cloudTimer);
  cloudStatus("Changes waiting to sync…");
  cloudTimer = setTimeout(() => cloudSaveNow(), 900);
}

async function cloudPullNow() {
  if (!SB || !cloudUser) {
    return;
  }
  cloudStatus("Checking your cloud data…");
  const { data, error } = await SB
    .from("cubelab_data")
    .select("data")
    .eq("user_id", cloudUser.id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (data && data.data) {
    cloudApplying = true;
    try {
      mergeIn(data.data, "merge", true);
    } finally {
      cloudApplying = false;
    }
  }
  localStorage.setItem("cubelab_cloud_owner", cloudUser.id);
  await cloudSaveNow();
  cloudStatus("Sync complete. This device now has your latest saved data.");
  render();
}

async function cloudAuthAction(action) {
  if (!SB) {
    cloudStatus("Set up Supabase in supabase-config.js first.", true);
    return;
  }
  try {
    if (action == "signout") {
      await cloudSaveNow();
      const { error } = await SB.auth.signOut();
      if (error) {
        throw error;
      }
      cloudUser = null;
      cloudActiveUserId = null;
      cloudStatus("Signed out. Your browser copy is still here.");
      render();
      return;
    }
    if (action == "sync") {
      await cloudPullNow();
      return;
    }
    const email = $("#cloud-email")?.value.trim() || "",
      password = $("#cloud-password")?.value || "";
    if (!email || !password) {
      throw new Error("Enter your email and password.");
    }
    cloudStatus(cloudAuthMode == "signup" ? "Creating your account…" : "Signing in…");
    if (cloudAuthMode == "signup") {
      const { data, error } = await SB.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: location.origin + location.pathname }
      });
      if (error) {
        throw error;
      }
      const existingAccount =
        !!data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;
      if (existingAccount) {
        cloudStatus(
          "An account with this email already exists, so no new confirmation email was sent. Switch to Log in and use that account instead. If you forgot its password, email recovery needs working SMTP delivery.",
          true
        );
      } else if (data.session?.user) {
        cloudUser = data.session.user;
        await cloudSyncForUser(cloudUser);
      } else {
        cloudStatus(
          "Account created. Check your email for the confirmation link, then come back and log in."
        );
      }
    } else {
      const { data, error } = await SB.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      cloudUser = data.user;
      await cloudSyncForUser(cloudUser);
    }
  } catch (err) {
    cloudStatus(err.message || "Authentication failed.", true);
  }
}

function vAccount() {
  const head = isDesk() ? "" : mhead("Account");
  if (!SB) {
    return head + `<div class="card"><h2>☁️ CubeLab account</h2><p>Connect this project to your own Supabase project to enable accounts and cloud saves.</p><ol><li>Create a Supabase project.</li><li>Run the SQL in <code>supabase-setup.sql</code> in the Supabase SQL Editor.</li><li>Put your Project URL and publishable key in <code>supabase-config.js</code>, then reload CubeLab.</li></ol><p class="mu">The publishable key is intended for browser apps. Never put a service-role or secret key in frontend files.</p><p id="cloud-status" class="${cloudStatusError ? "bad" : "mu"}">${esc(cloudStatusText)}</p></div>`;
  }
  if (cloudUser) {
    return head + `<div class="card"><h2>☁️ Your CubeLab account</h2><p class="mu">Signed in as</p><p><b>${esc(cloudUser.email || "CubeLab user")}</b></p><p id="cloud-status" class="${cloudStatusError ? "bad" : "mu"}">${esc(cloudStatusText)}</p><div class="row"><button class="btn pr" data-auth-action="sync">↻ Sync now</button><button class="btn" data-auth-action="signout">Log out</button></div></div><div class="card"><h3>What gets synced?</h3><p class="mu">Solve history (including scrambles, notes, penalties and split times), saved scrambles, completed lessons, trainer progress, timer settings, themes, and customization preferences. Your original browser storage remains in place as a local copy.</p><p class="mu">Cloud saves run automatically after changes. Use “Sync now” after using CubeLab on another device to pull its latest data.</p></div>`;
  }
  return head + `<div class="card"><h2>☁️ CubeLab account</h2><p class="mu">Create an account or log in to keep your solves, themes and progress across devices.</p><div class="row"><button class="pill ${cloudAuthMode == "login" ? "on" : ""}" data-auth-mode="login">Log in</button><button class="pill ${cloudAuthMode == "signup" ? "on" : ""}" data-auth-mode="signup">Create account</button></div><form id="cloud-auth-form"><label for="cloud-email">Email</label><input id="cloud-email" type="email" autocomplete="email" placeholder="you@example.com" required><label for="cloud-password">Password</label><input id="cloud-password" type="password" autocomplete="${cloudAuthMode == "signup" ? "new-password" : "current-password"}" minlength="6" placeholder="At least 6 characters" required><button class="btn pr" type="submit">${cloudAuthMode == "signup" ? "Create account" : "Log in"}</button></form><p id="cloud-status" class="${cloudStatusError ? "bad" : "mu"}">${esc(cloudStatusText)}</p><p class="mu">Your data stays private to your account. Keep your password private; CubeLab never needs you to send it to anyone.</p></div>`;
}

document.addEventListener("submit", (e) => {
  if (e.target.id == "cloud-auth-form") {
    e.preventDefault();
    cloudAuthAction("auth");
  }
});

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-auth-mode],[data-auth-action]");
  if (!t) {
    return;
  }
  if (t.dataset.authMode) {
    cloudAuthMode = t.dataset.authMode;
    cloudStatusError = false;
    render();
    return;
  }
  if (t.dataset.authAction) {
    cloudAuthAction(t.dataset.authAction);
  }
});

window.__cubelabOnLocalSave = cloudQueueSave;

/* ---------- HOME: first-visit welcome + today dashboard (streak, goal, next step, daily scramble, journey) ---------- */
let DAYS = ls.get("cl_days", []);

const dayKey = (d) => {
  const x = new Date(d);
  return (
    x.getFullYear() +
      "-" +
      String(x.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(x.getDate()).padStart(2, "0")
  );
};

function actDay() {
  const k = dayKey(Date.now());
  if (!DAYS.includes(k)) {
    DAYS.push(k);
    if (DAYS.length > 800) {
      DAYS = DAYS.slice(-800);
    }
    ls.set("cl_days", DAYS);
  }
}

const actDays = () => {
  const s = new Set(DAYS);
  times.forEach((x) => {
    if (x.d) {
      s.add(dayKey(x.d));
    }
  });
  return s;
};

function streak() {
  const s = actDays();
  let n = 0, d = new Date();
  if (!s.has(dayKey(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (s.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

const todayN = () => {
  const k = dayKey(Date.now());
  return times.filter((x) => x.d && dayKey(x.d) == k).length;
},
  goal = () => ST.goal || 5;

// the same scramble for everyone on a given day
const dseed = (k) => {
  let h = 2166136261;
  for (const c of k) {
    h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  }
  return h >>> 0;
};

const rng = (a) => () => {
  a |= 0;
  a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

function dailyScr() {
  const r = rng(dseed("cubelab-" + dayKey(Date.now()))),
    F = "UDLRFB",
    ax = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 },
    o = [];
  let l = "";
  while (o.length < 20) {
    const f = F[r() * 6 | 0];
    if (l && ax[f] == ax[l]) {
      continue;
    }
    l = f;
    o.push(f + ["", "'", "2"][r() * 3 | 0]);
  }
  return o.join(" ");
}

function journey() {
  const v = times.map(val).filter(isFinite),
    best = v.length ? Math.min(...v) : Infinity,
    learned = [0, 1, 2, 3, 4, 5, 6].filter((i) => LD.includes(i)).length;
  return [["Learn the basics", learned >= 7 || (times.length > 0 && ST.lvl != "new"), `${learned}/7 steps`, "Follow the 7 beginner steps with the 3D demos."], ["First timed solve", times.length > 0, "", "Do your first timed solve."], ["Sub 60", best < 60000, "under a minute", "Repeat the beginner method until it feels automatic."], ["Sub 30", best < 30000, "half a minute", "Learn 2-look OLL (steps 8 and 9) and the last-pair trick."], ["Sub 20", best < 20000, "", "Learn F2L and a faster cross, then drill them in the Trainer."], ["Sub 10", best < 10000, "", "Full OLL and PLL, look-ahead, and the Trainer every day."]];
}

function nextUp() {
  const lvl = ST.lvl || "solve",
    g = goal(),
    t = todayN(),
    un = [0, 1, 2, 3, 4, 5, 6].find((i) => !LD.includes(i));
  if (lvl == "new" && un != null) {
    return { ic: "🎓", t: "Continue learning", d: LS[un][0], b: "Continue", go: "learn:" + un };
  }
  if (t < g) {
    return { ic: "⏱", t: t ? `${g - t} more solve${g - t > 1 ? "s" : ""} for today’s goal` : "Start today’s solves", d: `${t} of ${g} solves done today`, b: t ? "Keep solving" : "Start the timer", go: "timer" };
  }
  const wk = Object.entries(W).sort((a, b) => b[1] - a[1])[0],
    c = wk && wk[1] > 1 ? ALL.find((x) => x.k == wk[0]) : null;
  if (c) {
    return { ic: "🎯", t: "Train your weakest case", d: `${c.n} (${c.s})`, b: "Train it", go: "trainer:" + c.s };
  }
  const u2 = [7, 8, 9].find((i) => !LD.includes(i));
  if (u2 != null && LS[u2]) {
    return { ic: "🚀", t: "Level up", d: LS[u2][0], b: "Open the lesson", go: "learn:" + u2 };
  }
  return {
    ic: "🧩",
    t: "Daily goal reached!",
    d: "Keep your algorithms sharp in the Trainer",
    b: "Open the Trainer",
    go: "trainer"
  };
}

function homeGo(sp) {
  const [t, a] = sp.split(":");
  if (sp == "daily") {
    go("timer");
    newScr(dailyScr());
    return;
  }
  if (t == "trainer" && a) {
    TR.set = a.startsWith("ZBLL") ? "ZBLL" : a;
  }
  go(t);
  if (t == "learn" && a != null && a !== "") {
    setTimeout(() => {
      const e = document.getElementById("ls" + a);
      if (e) {
        e.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 250);
  }
}

function homeLevel(l, first) {
  ST.lvl = l;
  ssave();
  if (!first) {
    return render();
  }
  homeGo(l == "new" ? "learn:0" : l == "fast" ? "trainer:PLL" : "timer");
}

const ring = (v, mx, lab) => {
  const r = 34, c = 2 * Math.PI * r, p = Math.min(1, v / mx);
  return `<svg class="ring" viewBox="0 0 88 88" role="img" aria-label="${lab}"><circle cx="44" cy="44" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".15" stroke-width="9"/><circle cx="44" cy="44" r="${r}" fill="none" stroke="var(--ac)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 44 44)"/><text x="44" y="50" text-anchor="middle" font-size="21" font-weight="800" fill="currentColor">${lab}</text></svg>`;
};

const spark = () => {
  const v = times.slice(-40).map(val).filter(isFinite);
  if (v.length < 2) {
    return "";
  }
  const lo = Math.min(...v), hi = Math.max(...v), W_ = 240, H = 48;
  return `<svg viewBox="0 0 ${W_} ${H}" width="100%" class="spark" aria-hidden="true"><polyline points="${v.map((x, i) => `${(i / (v.length - 1) * W_).toFixed(1)},${(H - 4 - (x - lo) / ((hi - lo) || 1) * (H - 8)).toFixed(1)}`).join(" ")}" fill="none" stroke="var(--ac)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
};

const TILES = [
  ["timer", "⏱", "Timer", "Inspection, splits, penalties"],
  ["learn", "🎓", "Beginner method", "7 steps with 3D demos"],
  ["trainer", "🎯", "Trainer", "Drill OLL, PLL, F2L, ZBLL"],
  ["cfop", "🧩", "Algorithms", "CFOP, Roux, ZZ, ZBLL"],
  ["bld", "🙈", "Blindfold", "Old Pochmann walkthrough"],
  ["theme", "🎨", "Customize", "Colors, fonts, timer style"]
];

const tiles = () => `<div class="tiles">${TILES.map(([t, i, n, d]) => `<button class="tile" data-t="${t}"><span>${i}</span><b>${n}</b><small>${d}</small></button>`).join("")}</div>`;

function homeFirst() {
  return `<section class="hero"><div><div class="eyebrow">Free · no sign-up · works offline</div><h1>Solve the cube.<br>Then solve it faster.</h1><p>Learn step by step with 3D demos, time every solve, drill algorithms and track your progress, all in one place.</p><div class="chs"><button class="cta" data-lv="new" data-first="1">🎓 I’m new, teach me</button><button class="cta alt" data-lv="solve" data-first="1">⏱ I can solve it, time me</button><button class="cta alt" data-lv="fast" data-first="1">🚀 I’m fast, train algorithms</button></div><p class="mu">About 15 minutes to learn the beginner method.</p></div><div class="hc"><canvas id="hc" width="600" height="600" aria-label="A cube that scrambles and solves itself"></canvas></div></section><h3 style="margin:18px 4px 8px">Everything you need to get faster</h3>${tiles()}`;
}

function homeDash() {
  const s = streak(),
    t = todayN(),
    g = goal(),
    nu = nextUp(),
    hr = new Date().getHours(),
    greet = hr < 5
      ? "Late-night cubing"
      : hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening",
    v = times.map(val).filter(isFinite),
    best = v.length ? Math.min(...v) : null,
    mean = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null,
    a5 = aoN(times.map(val), 5),
    a12 = aoN(times.map(val), 12),
    ds = dailyScr(),
    dv = times.filter((x) => x.s == ds).map(val).filter(isFinite),
    J = journey(),
    cur = J.findIndex((x) => !x[1]);
  const lv = [["new", "I’m learning"], ["solve", "I solve"], ["fast", "I’m fast"]];
  return `<section class="hero"><div><div class="eyebrow">${greet}</div><h1>${s ? `🔥 ${s}-day streak` : "Start a streak today"}</h1><div class="next"><span class="nic">${nu.ic}</span><div><b>${nu.t}</b><div class="mu">${nu.d}</div></div></div><button class="cta" data-hg="${nu.go}">${nu.b} →</button><div class="chs lv">${lv.map(([k, l]) => `<button class="chip2 ${(ST.lvl || "solve") == k ? "on" : ""}" data-lv="${k}">${l}</button>`).join("")}</div></div><div class="hc"><canvas id="hc" width="600" height="600" aria-label="A cube that scrambles and solves itself"></canvas></div></section>
<div class="hgrid"><div class="card"><h3>Today’s goal</h3><div class="row" style="flex-wrap:nowrap;gap:14px">${ring(t, g, t + "/" + g)}<div><b>${t >= g ? "🎉 Goal reached!" : `${g - t} to go`}</b><div class="mu">solves today</div><div class="row" style="margin-top:8px;gap:6px">${[3, 5, 10, 20, 50].map((n) => `<button class="chip2 ${g == n ? "on" : ""}" data-gl="${n}">${n}</button>`).join("")}</div></div></div></div>
<div class="card"><h3>📅 Today’s scramble</h3><p class="mu" style="margin-top:0">The same for everyone today. ${dv.length ? `Your best on it: <b>${fmt(Math.min(...dv))}</b>` : "Try it once, then try to beat yourself."}</p><code class="alg" data-c="${ds}">${ds}</code><button class="btn pr" data-hg="daily">Solve today’s scramble</button></div>
<div class="card"><h3>Your numbers</h3>${v.length ? `<div class="hnum"><div><span class="mu">Best</span><b>${fmt(best)}</b></div><div><span class="mu">Ao5</span><b>${a5 == null ? "-" : fmt(a5)}</b></div><div><span class="mu">Ao12</span><b>${a12 == null ? "-" : fmt(a12)}</b></div><div><span class="mu">Mean</span><b>${fmt(mean)}</b></div></div>${spark()}<div class="mu">${times.length} solves in total</div>` : `<p class="mu">Do your first timed solve to see your stats here.</p>`}</div></div>
<div class="card"><h3>Your journey</h3><div class="rail">${J.map(([n, d, sub], i) => `<div class="rs ${d ? "done" : i == cur ? "cur" : ""}"><i>${d ? "✓" : i + 1}</i><b>${n}</b><small>${sub}</small></div>`).join("")}</div>${cur >= 0 ? `<p class="mu" style="margin-bottom:0"><b>Next:</b> ${J[cur][3]}</p>` : `<p style="margin-bottom:0">🏆 You finished the whole journey. Keep going and chase new records!</p>`}</div>
<h3 style="margin:18px 4px 8px">Explore</h3>${tiles()}
<div class="sr" style="margin-top:14px"><input type="checkbox" id="hstart" ${ST.start == "timer" ? "checked" : ""}><label for="hstart">Open on the Timer next time (skip this page)</label></div>`;
}

function vHome() {
  const first = !times.length && !ST.lvl;
  return (
    (isDesk() ? "" : mhead("CubeLab")) +
      (first ? homeFirst() : homeDash()) +
      (isDesk() ? "" : mnav())
  );
}

function homeInit() {
  const cv = $("#hc");
  if (!cv) {
    return;
  }
  const api = cube3d(cv, cube());
  let yw = -.65;
  api.view(yw, .5);
  if (typeof matchMedia != "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const ok = () => cv.isConnected && tab == "home",
    MV_ = ["R", "U", "F", "L", "D", "B", "R'", "U'", "F'", "L'", "D'", "B'", "R2", "U2", "F2"];
  const spin = () => {
    if (!ok()) {
      return;
    }
    yw += .006;
    api.view(yw, .5);
    requestAnimationFrame(spin);
  };
  requestAnimationFrame(spin);
  (async () => {
    while (ok()) {
      const m = [];
      api.sp = 1;
      for (let i = 0; i < 8 && ok(); i++) {
        const x = MV_[Math.random() * MV_.length | 0];
        m.push(x);
        await api.go(x);
        await wait(100);
      }
      await wait(600);
      api.sp = 2.4;
      for (const x of m.reverse()) {
        if (!ok()) {
          return;
        }
        await api.go(iv(x));
      }
      await wait(1200);
    }
  })();
}

document.addEventListener("change", (e) => {
  if (e.target.id == "hstart") {
    ST.start = e.target.checked ? "timer" : "home";
    ssave();
  }
});

/* ---------- EVENTS ---------- */
document.addEventListener("click", (e) => {
  const t = e.target.closest(
    "[data-t],[data-m],[data-c],[data-a],[data-e],[data-x],[data-l],[data-d],[data-p],[data-b],[data-q],#ns,#dl,#ca,#cb,#rp,#sv,#xc,#p2,#pd,#bset,#bset2,#xs,#blp,[data-si],#mdel,#mnote,#mmenu,#mmore,#hmore,[data-lv],[data-hg],[data-gl],[data-pr],[data-tmx],#thr,#tmr,#thc,#tha"
  );
  if (!t) {
    return;
  }
  if (t.dataset.t) {
    return go(t.dataset.t);
  }
  if (t.dataset.m) {
    curM = t.dataset.m;
    return render();
  }
  if (t.dataset.c) {
    try {
      navigator.clipboard.writeText(t.dataset.c);
    } catch (x) {}
    const o = t.textContent;
    t.textContent = "Copied ✓";
    setTimeout(() => t.textContent = o, 700);
    return;
  }
  if (t.dataset.q) {
    return qAct(t);
  }
  if (t.dataset.b) {
    return bAct(t);
  }
  if (t.dataset.l) {
    return lnAct(t);
  }
  if (t.dataset.p) {
    return prAct(t);
  }
  if (t.dataset.d) {
    actDay();
    const i = +t.dataset.d;
    LD.includes(i) ? LD.splice(LD.indexOf(i), 1) : LD.push(i);
    ls.set("cl_done", LD);
    t.textContent = LD.includes(i) ? "✓ Done" : "Mark done";
    return;
  }
  if (t.dataset.x) {
    return scAct(t);
  }
  if (t.dataset.e) {
    return edAct(t);
  }
  const a = t.dataset.a;
  if (a && a.slice(0, 3) == "tr:") {
    return trAct(t);
  }
  if (a == "wt") {
    return watch(TR.cur.a, caseState(TR.cur.a), TR.cur.n);
  }
  if (a == "rv") {
    TR.rev = true;
    return trShow();
  }
  if (a == "ok") {
    return trAns(true);
  }
  if (a == "no") {
    return trAns(false);
  }
  if (a == "sw") {
    if (TR.run) {
      TR.run = false;
      TR.last = performance.now() - TR.t0;
      trShow();
    } else {
      TR.run = true;
      TR.last = null;
      TR.t0 = performance.now();
      trShow();
      trTick();
    }
    return;
  }
  if (t.id == "bset" || t.id == "bset2") {
    const q = $("#setpop");
    q.hidden = !q.hidden;
    return;
  }
  if (t.id == "xs") {
    $("#setpop").hidden = true;
    return;
  }
  if (t.id == "blp") {
    const l = $("#lp");
    l.style.display = l.style.display == "none" ? "" : "none";
    return;
  }
  if (t.id == "xc") {
    return tcancel();
  }
  if (t.dataset.lv) {
    return homeLevel(t.dataset.lv, t.dataset.first);
  }
  if (t.dataset.hg) {
    return homeGo(t.dataset.hg);
  }
  if (t.dataset.gl) {
    ST.goal = +t.dataset.gl;
    ssave();
    return render();
  }
  if (t.dataset.pr) {
    return thPreset(t.dataset.pr);
  }
  if (t.dataset.tmx) {
    return tmClear(t.dataset.tmx);
  }
  if (/^(thr|tmr|thc|tha)$/.test(t.id)) {
    return thAct(t.id);
  }
  if (t.dataset.si) {
    return solveDlg(+t.dataset.si);
  }
  if (t.id == "mdel") {
    return mdel(t);
  }
  if (t.id == "mnote") {
    return solveDlg(times.length - 1);
  }
  if (t.id == "mmenu" || t.id == "mmore") {
    const n = $("#nav");
    n.hidden = !n.hidden;
    return;
  }
  if (t.id == "hmore") {
    HN += 50;
    return histFill();
  }
  if (t.id == "p2" || t.id == "pd") {
    return tpen(t.id);
  }
  if (t.id == "cb") {
    return cx();
  }
  if (t.id == "rp") {
    return newScr(T.last || T.scr);
  }
  if (t.id == "sv") {
    const i = PIN.indexOf(T.scr);
    i < 0 ? PIN.unshift(T.scr) : PIN.splice(i, 1);
    ls.set("cl_pin", PIN);
    return scInfo();
  }
  if (t.id == "ns") {
    return newScr();
  }
  if (t.id == "dl") {
    times.pop();
    ls.set("cl_t", times);
    return stats();
  }
  if (t.id == "ca") {
    if (t.dataset.s) {
      times = [];
      ls.set("cl_t", times);
      t.textContent = "Clear all";
      delete t.dataset.s;
      return stats();
    }
    t.dataset.s = 1;
    t.textContent = "Sure? Tap again";
  }
});

document.addEventListener("input", (e) => {
  if (e.target.id == "q") {
    fill();
  }
  if (e.target.id == "hq") {
    HQ = e.target.value;
    HN = 50;
    histFill();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.dataset && e.target.dataset.tr) {
    trChange(e.target);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.code == "Escape") {
    const d = $("#sd");
    if (d && !d.hidden) {
      e.preventDefault();
      sdClose();
    }
  }
});

const inField = () => {
  const a = document.activeElement;
  return a && /INPUT|SELECT|TEXTAREA/.test(a.tagName);
};

document.addEventListener("keydown", (e) => {
  if (tab != "timer" || inField()) {
    return;
  }
  if (e.code == "Escape") {
    const sdl = $("#sd");
    if (sdl && !sdl.hidden) {
      sdClose();
      return;
    }
    const q = $("#setpop");
    if (q && !q.hidden) {
      q.hidden = true;
      return;
    }
    return tcancel();
  }
  if (e.code == "Space") {
    e.preventDefault();
    if (!e.repeat) {
      tdown();
    }
  } else if ((T.s == "run" || T.s == "rwait") && !e.repeat) {
    e.preventDefault();
    tdown();
  }
});

document.addEventListener("keyup", (e) => {
  if (tab == "timer" && e.code == "Space" && !inField()) {
    e.preventDefault();
    tup();
  }
});

document.addEventListener("pointerdown", (e) => {
  if (tab != "timer" || e.target.closest("#xc,#vw,#sd")) {
    return;
  }
  const sp = $("#setpop");
  if (sp && !sp.hidden && !e.target.closest("#setpop,#bset")) {
    sp.hidden = true;
    return;
  }
  const cxp = $("#cx");
  if (CS() && cxp && !cxp.hidden && !e.target.closest("#cx,#cb")) {
    cxp.hidden = true;
    return;
  }
  if (T.s == "run" || T.s == "rwait") {
    return tdown();
  }
  if (
    e.target.closest("#tz") ||
      (ST.any &&
        !e.target.closest(
          "button,a,input,select,textarea,summary,label,header,nav,code,.mb,#lp,#csbar,#csbtn,#snp,#mnav,#mbar,#setpop,#cx"
        ))
  ) {
    tdown();
  }
});

document.addEventListener("pointerup", () => tup());
let rzt;

addEventListener("resize", () => {
  clearTimeout(rzt);
  rzt = setTimeout(() => {
    if (
      MOBT.includes(tab) &&
        !["tap", "insp", "hold", "ready", "run", "pause", "rwait"].includes(T.s) &&
        (CS() != (tab == "timer" && isDesk()) || MB() != (!isDesk()))
    ) {
      render();
    }
  }, 200);
});

document.addEventListener("pointercancel", () => {
  if (T.s == "hold") {
    clearTimeout(T.hold);
    T.s = T.o == "i" ? "insp" : "idle";
    cls("");
    if (T.s == "idle") {
      tfocus(0);
    }
  } else if (T.s == "tap") {
    T.s = "idle";
  } else if (T.s == "pause") {
    tup();
  }
});

document.addEventListener("change", (e) => {
  const i = e.target.id;
  if (tab != "timer" || !["si", "sic", "sf", "sa", "ss", "sp", "spc", "sm", "rd"].includes(i)) {
    return;
  }
  const v = e.target.value;
  if (i == "si") {
    if (v == "c") {
      $("#sic").style.display = "";
      ST.insp = Math.max(1, Math.min(120, +$("#sic").value || 15));
      $("#sic").value = ST.insp;
    } else {
      ST.insp = +v;
      $("#sic").style.display = "none";
    }
  } else if (i == "sic") {
    ST.insp = Math.max(1, Math.min(120, +v || 15));
  } else if (i == "sf") {
    ST.focus = e.target.checked ? 1 : 0;
  } else if (i == "sa") {
    ST.any = e.target.checked ? 1 : 0;
  } else if (i == "ss") {
    ST.split = e.target.checked ? 1 : 0;
  } else if (i == "sm") {
    ST.sm = v;
  } else if (i == "rd") {
    ST.rd = +v;
  } else if (i == "sp") {
    ST.pre = v;
    $("#spc").style.display = v == "Custom" ? "" : "none";
  } else if (i == "spc") {
    ST.ph = v.split(",").map((x) => x.trim()).filter((x) => x).slice(0, 10);
  }
  ssave();
  $("#spv").textContent =
    "Steps: " + phs().join(" \u2192 ") + (ST.split ? "" : " (split times are off)");
  $("#hint").textContent = hint0();
  msubSet();
});

addEventListener("hashchange", () => {
  const h = location.hash.slice(1);
  if (TABS.some((t) => t[0] == h) && h != tab) {
    go(h);
  }
});

{
  const h = location.hash.slice(1);
  if (TABS.some((t) => t[0] == h)) {
    tab = h;
  } else if (ST.start == "timer" && times.length) {
    tab = "timer";
  }
  if (MT[tab]) {
    curM = MT[tab];
  }
}

nav();
render();
cloudClientInit();

$("#mb").onclick = () => {
  $("#nav").hidden = !$("#nav").hidden;
};

document.addEventListener("click", (e) => {
  if (!e.target.closest("#nav,#mb,#mmenu,#mmore")) {
    $("#nav").hidden = true;
  }
});
