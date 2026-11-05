const SC = 0.5; // metres per map pixel
// Green paths traced from the drawing (x,y in a 720x1280 space)
const P = [
  [
    [320, 40],
    [400, 100],
    [445, 170],
    [445, 260],
    [465, 350],
    [490, 450],
    [510, 560],
    [515, 650],
    [512, 710],
    [560, 790],
    [632, 858],
  ],
  [
    [560, 157],
    [440, 185],
    [330, 250],
    [272, 320],
    [270, 380],
    [295, 420],
    [310, 470],
    [290, 530],
    [240, 580],
    [180, 660],
    [170, 740],
    [175, 820],
    [130, 893],
  ],
  [
    [55, 458],
    [110, 410],
    [180, 370],
    [270, 380],
  ],
  [
    [270, 380],
    [375, 440],
  ],
  [
    [150, 585],
    [235, 572],
    [300, 540],
    [378, 522],
  ],
  [
    [690, 297],
    [650, 315],
    [600, 400],
    [585, 500],
    [580, 570],
    [540, 640],
    [505, 665],
    [430, 715],
    [342, 772],
  ],
  [
    [90, 180],
    [200, 250],
    [272, 320],
  ],
  [
    [445, 260],
    [560, 285],
    [650, 315],
  ],
  [
    [490, 450],
    [540, 480],
    [585, 500],
  ],
  [
    [175, 820],
    [260, 800],
    [342, 772],
  ],
  [
    [310, 470],
    [378, 522],
  ],
  [
    [170, 740],
    [100, 700],
    [150, 585],
  ],
  [
    [512, 710],
    [430, 715],
  ],
];
const LM = [
  ["DEPOT", 320, 40],
  ["HOSPITAL", 445, 170],
  ["MARKET", 90, 180],
  ["PLAZA", 270, 380],
  ["STATION", 55, 458],
  ["CLINIC", 378, 522],
  ["MALL", 690, 297],
  ["BANK", 585, 500],
  ["BRIDGE", 342, 772],
  ["HARBOR", 632, 858],
  ["PARK", 130, 893],
  ["TOWER", 330, 250],
  ["SCHOOL", 445, 260],
  ["CHURCH", 465, 350],
  ["CITY HALL", 600, 400],
  ["CAFE", 180, 370],
  ["STADIUM", 110, 410],
  ["LIBRARY", 295, 420],
  ["POLICE HQ", 240, 580],
  ["GAS STN", 510, 560],
  ["MUSEUM", 540, 640],
  ["HOTEL", 515, 650],
  ["DINER", 170, 740],
  ["WAREHOUSE", 560, 790],
  ["SHELTER", 175, 820],
];

// Build graph: split every path where it crosses another one
const N = [],
  E = [];
const node = (x, y) => {
  for (let i = 0; i < N.length; i++)
    if (Math.hypot(N[i][0] - x, N[i][1] - y) < 3) return i;
  N.push([x, y]);
  return N.length - 1;
};
function inter(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]],
    s = [d[0] - c[0], d[1] - c[1]],
    den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den,
    u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}
P.forEach((p, i) => {
  for (let j = 0; j < p.length - 1; j++) {
    const a = p[j],
      b = p[j + 1],
      ts = [0, 1];
    P.forEach((q, k) => {
      if (k === i) return;
      for (let m = 0; m < q.length - 1; m++) {
        const t = inter(a, b, q[m], q[m + 1]);
        if (t !== null) ts.push(t);
      }
    });
    ts.sort((x, y) => x - y);
    for (let n = 0; n < ts.length - 1; n++) {
      const A = node(
          a[0] + (b[0] - a[0]) * ts[n],
          a[1] + (b[1] - a[1]) * ts[n],
        ),
        B = node(
          a[0] + (b[0] - a[0]) * ts[n + 1],
          a[1] + (b[1] - a[1]) * ts[n + 1],
        );
      if (A !== B) E.push({ a: A, b: B });
    }
  }
});
const deg = N.map(() => 0);
E.forEach((e) => {
  deg[e.a]++;
  deg[e.b]++;
});

// Snap any point to the nearest spot on the paths
function snap(x, y) {
  let best = { d: 1e9 };
  E.forEach((e, i) => {
    const A = N[e.a],
      B = N[e.b],
      dx = B[0] - A[0],
      dy = B[1] - A[1];
    const t = Math.max(
      0,
      Math.min(1, ((x - A[0]) * dx + (y - A[1]) * dy) / (dx * dx + dy * dy)),
    );
    const px = A[0] + dx * t,
      py = A[1] + dy * t,
      d = Math.hypot(x - px, y - py);
    if (d < best.d) best = { e: i, t, x: px, y: py, d };
  });
  return best;
}

// Dijkstra from S to T, both anywhere on the paths
function route(S, T) {
  const sp = [
      ["S", S],
      ["T", T],
    ],
    adj = new Map();
  const pos = (id) =>
    id === "S" ? [S.x, S.y] : id === "T" ? [T.x, T.y] : N[id];
  const add = (a, b) => {
    const w = Math.hypot(pos(a)[0] - pos(b)[0], pos(a)[1] - pos(b)[1]);
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push([b, w]);
    adj.get(b).push([a, w]);
  };
  E.forEach((e, i) => {
    const L = [
      [0, e.a],
      ...sp
        .filter(([, p]) => p.e === i)
        .map(([id, p]) => [p.t, id])
        .sort((x, y) => x[0] - y[0]),
      [1, e.b],
    ];
    for (let k = 0; k < L.length - 1; k++) add(L[k][1], L[k + 1][1]);
  });
  const dist = new Map([["S", 0]]),
    prev = new Map(),
    done = new Set();
  while (true) {
    let u = null;
    dist.forEach((d, k) => {
      if (!done.has(k) && (u === null || d < dist.get(u))) u = k;
    });
    if (u === null || u === "T") break;
    done.add(u);
    (adj.get(u) || []).forEach(([v, w]) => {
      if (!dist.has(v) || dist.get(u) + w < dist.get(v)) {
        dist.set(v, dist.get(u) + w);
        prev.set(v, u);
      }
    });
  }
  const ids = [];
  for (let k = "T"; k !== undefined; k = prev.get(k)) ids.unshift(k);
  const pts = ids.map((id) => ({
    x: pos(id)[0],
    y: pos(id)[1],
    j: typeof id === "number" && deg[id] >= 3,
  }));
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum[i] =
      cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return { pts, cum, total: cum[cum.length - 1] };
}
function pointAt(r, d) {
  d = Math.max(0, Math.min(r.total, d));
  let i = 0;
  while (i < r.pts.length - 2 && r.cum[i + 1] < d) i++;
  const a = r.pts[i],
    b = r.pts[i + 1],
    s = r.cum[i + 1] - r.cum[i],
    t = s ? (d - r.cum[i]) / s : 0;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
function nextTurn(r, d) {
  for (let i = 1; i < r.pts.length - 1; i++) {
    if (!r.pts[i].j || r.cum[i] <= d + 2) continue;
    const a = [r.pts[i].x - r.pts[i - 1].x, r.pts[i].y - r.pts[i - 1].y],
      b = [r.pts[i + 1].x - r.pts[i].x, r.pts[i + 1].y - r.pts[i].y];
    const ang =
      (Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]) * 180) /
      Math.PI;
    if (Math.abs(ang) >= 25)
      return { dist: r.cum[i] - d, dir: ang > 0 ? "right" : "left" };
  }
  return null;
}

// ---- Movie-style tracking layer ----
const adj = N.map(() => []);
E.forEach((e) => {
  const w = Math.hypot(N[e.a][0] - N[e.b][0], N[e.a][1] - N[e.b][1]);
  adj[e.a].push({ to: e.b, w });
  adj[e.b].push({ to: e.a, w });
});
const KX = 1280 / 720,
  KY = 720 / 1280;
const cv = document.getElementById("c"),
  g = cv.getContext("2d");
const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  SUS_V = 85,
  UNIT_V = 170,
  MONO = "18px ui-monospace,Menlo,Consolas,monospace";
let sus,
  unit,
  trail,
  log,
  caught,
  eta,
  rt,
  t0,
  last = 0;
const clock = () => new Date().toTimeString().slice(0, 8);
const L = (m) => {
  log.push(clock() + " " + m);
  if (log.length > 6) log.shift();
};
function head(a, b) {
  const br =
    ((Math.atan2(N[b][0] - N[a][0], -(N[b][1] - N[a][1])) * 180) / Math.PI +
      360) %
    360;
  return DIRS[Math.round(br / 45) % 8] + " " + Math.round(br) + "\u00b0";
}
let popT = null,
  sel = 0,
  TG = [];
const BASES = [
  [560, 790],
  [445, 170],
  [90, 180],
  [585, 500],
  [170, 740],
  [270, 380],
  [55, 458],
  [342, 772],
];
function placeAt(t, s) {
  const e = E[s.e],
    A = N[e.a],
    B = N[e.b];
  t.from = e.a;
  t.to = e.b;
  t.len = Math.hypot(B[0] - A[0], B[1] - A[1]);
  t.d = s.t * t.len;
}
const spos = (t) => {
  const a = N[t.from],
    b = N[t.to],
    k = t.d / t.len;
  return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k };
};
const scr = (t) => {
  const p = spos(t);
  return { x: p.x * KX, y: p.y * KY };
};
function reset() {
  t0 = performance.now() / 1000;
  TG = BASES.map(([x, y], i) => {
    const t = { id: i + 1, lk0: t0, on: false };
    placeAt(t, snap(x, y));
    return t;
  });
  sel = -1;
  popT = null;
  unit = null;
  trail = [];
  log = [];
  caught = 0;
  eta = 0;
  rt = null;
  L("SAT-LINK ESTABLISHED");
  L("NO TARGETS ON SCREEN");
  L("CLICK A LOCATION TO REVEAL A TARGET");
  L("[F] FULLSCREEN   [R] RESET");
}
function update(dt, T) {}
const paths = () =>
  P.forEach((p) => {
    g.beginPath();
    p.forEach(([x, y], i) =>
      i ? g.lineTo(x * KX, y * KY) : g.moveTo(x * KX, y * KY),
    );
    g.stroke();
  });
function draw(T, ts) {
  const now = ts / 1000,
    blink = Math.floor(ts / 450) % 2 === 0,
    col = "#ff3b2f",
    sp = sel >= 0 ? scr(TG[sel]) : { x: -999, y: -999 },
    vis = TG.filter((t) => t.on);
  g.fillStyle = "#010805";
  g.fillRect(0, 0, 1280, 720);
  g.strokeStyle = "rgba(60,255,120,.07)";
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i <= 1280; i += 80) {
    g.moveTo(i, 0);
    g.lineTo(i, 720);
  }
  for (let i = 0; i <= 720; i += 60) {
    g.moveTo(0, i);
    g.lineTo(1280, i);
  }
  g.stroke();
  g.lineCap = g.lineJoin = "round";
  g.shadowColor = "#19e068";
  g.shadowBlur = 12;
  g.strokeStyle = "#14a04a";
  g.lineWidth = 9;
  paths();
  g.shadowBlur = 0;
  g.strokeStyle = "#8dffb8";
  g.lineWidth = 2;
  paths();
  // named locations
  g.font = "14px ui-monospace,Menlo,Consolas,monospace";
  LM.forEach(([n, wx, wy]) => {
    const x = wx * KX,
      y = wy * KY;
    g.fillStyle = "#010805";
    g.strokeStyle = "#8dffb8";
    g.lineWidth = 2;
    g.fillRect(x - 6, y - 6, 12, 12);
    g.strokeRect(x - 6, y - 6, 12, 12);
    g.fillStyle = "#8dffb8";
    const w = g.measureText(n).width;
    g.fillText(n, wx > 560 ? x - w - 12 : x + 12, y + 5);
  });
  g.font = MONO;
  // radar sweep + range rings on the selected target
  if (sel >= 0) {
    const ang = T * 2.2;
    g.fillStyle = "rgba(80,255,140,.13)";
    g.beginPath();
    g.moveTo(sp.x, sp.y);
    g.arc(sp.x, sp.y, 300, ang - 0.7, ang);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(80,255,140,.18)";
    g.lineWidth = 1;
    [100, 200, 300].forEach((r) => {
      g.beginPath();
      g.arc(sp.x, sp.y, r, 0, 7);
      g.stroke();
    });
  }
  // all targets: pings, lock-on reticle, id (selected one also gets the crosshair lines)
  TG.forEach((t, i) => {
    if (!t.on) return;
    const q = scr(t),
      on = i === sel,
      lk = Math.min(1, (now - t.lk0) / 2.5),
      s = (on ? 34 : 24) + (1 - lk) * 100;
    for (let k = 0; k < 3; k++) {
      const f = (T * 0.8 + k / 3 + i * 0.13) % 1;
      g.strokeStyle = "rgba(255,59,47," + (1 - f) * 0.8 + ")";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(q.x, q.y, 8 + f * (on ? 70 : 45), 0, 7);
      g.stroke();
    }
    if (on) {
      g.strokeStyle = lk < 1 ? "rgba(255,176,0,.4)" : "rgba(255,59,47,.35)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, q.y);
      g.lineTo(q.x - s - 8, q.y);
      g.moveTo(q.x + s + 8, q.y);
      g.lineTo(1280, q.y);
      g.moveTo(q.x, 0);
      g.lineTo(q.x, q.y - s - 8);
      g.moveTo(q.x, q.y + s + 8);
      g.lineTo(q.x, 720);
      g.stroke();
    }
    g.strokeStyle = lk < 1 ? "#ffb000" : col;
    g.lineWidth = on ? 4 : 3;
    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].forEach(([a, b]) => {
      g.beginPath();
      g.moveTo(q.x + a * s, q.y + b * (s - 10));
      g.lineTo(q.x + a * s, q.y + b * s);
      g.lineTo(q.x + a * (s - 10), q.y + b * s);
      g.stroke();
    });
    g.fillStyle = col;
    g.beginPath();
    g.arc(q.x, q.y, on ? 6 : 5, 0, 7);
    g.fill();
    g.font = "bold 14px ui-monospace,Menlo,Consolas,monospace";
    g.fillStyle = on ? "#ffb000" : col;
    g.fillText("T" + t.id, q.x + s + 6, q.y - s + 12);
    g.font = MONO;
  });
  // data tag (selected target)
  const st = TG[Math.max(sel, 0)],
    s0 = 34,
    lat = (34.0522 - sp.y * 3e-5).toFixed(5),
    lon = (118.2437 - sp.x * 3e-5).toFixed(5);
  const tag = [
    "SUBJECT-0" + st.id,
    lat + "° N",
    lon + "° W",
    "0 KM/H  " + head(st.from, st.to),
  ];
  const tx = sp.x > 800 ? sp.x - s0 - 14 - 250 : sp.x + s0 + 14,
    ty = sp.y - s0;
  if (sel >= 0 && popT !== null) {
    g.save();
    g.fillStyle = "rgba(0,0,0,.85)";
    g.fillRect(tx - 6, ty - 4, 256, 86);
    g.strokeStyle = col;
    g.lineWidth = 1;
    g.strokeRect(tx - 6, ty - 4, 256, 86);
    g.font = MONO;
    g.fillStyle = col;
    tag.forEach((t, i) => g.fillText(t, tx, ty + 16 + i * 20));
    g.restore();
  }
  // HUD
  const lkA = vis.length
    ? Math.min(1, (now - Math.max(...vis.map((t) => t.lk0))) / 2.5)
    : 1;
  g.fillStyle = "#8dffb8";
  g.fillText("SAT-LINK // LIVE TRACKING", 20, 34);
  g.fillText(clock() + " LOCAL", 20, 58);
  if (blink) {
    g.fillStyle = "#ff3b2f";
    g.beginPath();
    g.arc(1250, 28, 7, 0, 7);
    g.fill();
    g.fillText("REC", 1196, 34);
  }
  g.fillStyle = lkA < 1 ? "#ffb000" : "#ff3b2f";
  g.fillText(
    !vis.length
      ? "STANDBY - NO TARGETS"
      : lkA < 1
        ? blink
          ? "ACQUIRING SIGNAL..."
          : ""
        : vis.length + " OF " + TG.length + " TARGETS LOCKED",
    20,
    82,
  );
  log.forEach((m, i) => {
    g.fillStyle =
      "rgba(141,255,184," + (0.35 + (0.65 * (i + 1)) / log.length) + ")";
    g.fillText("> " + m, 20, 720 - 20 - (log.length - 1 - i) * 24);
  });
  if (Math.random() < 0.015) {
    g.fillStyle = "rgba(120,255,200,.12)";
    g.fillRect(0, Math.random() * 720, 1280, 3 + Math.random() * 10);
  }
}
cv.addEventListener("click", (e) => {
  const r = cv.getBoundingClientRect(),
    cx = ((e.clientX - r.left) * 1280) / r.width,
    cy = ((e.clientY - r.top) * 720) / r.height;
  let hit = -1,
    bd = 48;
  TG.forEach((t, i) => {
    if (!t.on) return;
    const q = scr(t),
      d = Math.hypot(q.x - cx, q.y - cy);
    if (d < bd) {
      bd = d;
      hit = i;
    }
  });
  if (hit >= 0) {
    sel = hit;
    popT = performance.now();
    L("SUBJECT-0" + TG[hit].id + " SELECTED");
    return;
  }
  let lm = null,
    ld = 40;
  LM.forEach(([n, wx, wy]) => {
    const d = Math.hypot(wx * KX - cx, wy * KY - cy);
    if (d < ld) {
      ld = d;
      lm = [n, wx, wy];
    }
  });
  const s = lm ? snap(lm[1], lm[2]) : snap(cx / KX, cy / KY);
  if (!lm && s.d > 70) {
    L("NO ROAD AT TARGET - TAP A GREEN PATH");
    return;
  }
  let t =
    lm &&
    TG.find(
      (t) => !t.on && Math.hypot(spos(t).x - lm[1], spos(t).y - lm[2]) < 6,
    );
  if (!t) {
    t = { id: TG.length + 1, on: false };
    TG.push(t);
  }
  placeAt(t, s);
  t.on = true;
  t.lk0 = performance.now() / 1000;
  sel = TG.indexOf(t);
  popT = performance.now();
  L("SUBJECT-0" + t.id + " DETECTED" + (lm ? " AT " + lm[0] : ""));
});
const toggleFull = () => {
  const el = document.querySelector(".screen");
  if (document.fullscreenElement) document.exitFullscreen();
  else if (el.requestFullscreen) el.requestFullscreen();
};
addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === "f") {
    e.preventDefault();
    toggleFull();
  } else if (k === "r") {
    e.preventDefault();
    reset();
  }
});
function tick(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  const T = ts / 1000 - t0;
  update(dt, T);
  draw(T, ts);
  requestAnimationFrame(tick);
}
reset();
requestAnimationFrame(tick);
