// Canopy site: hero city animation and copy buttons. No dependencies.

// ---- copy buttons -------------------------------------------------------
for (const btn of document.querySelectorAll('[data-copy]')) {
  btn.addEventListener('click', async () => {
    const text = document.getElementById(btn.dataset.copy)?.innerText ?? '';
    try {
      await navigator.clipboard.writeText(text.trim());
      const old = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = old; }, 1400);
    } catch { /* clipboard blocked: the text is still selectable */ }
  });
}

// ---- hero city ----------------------------------------------------------
(() => {
  const cv = document.getElementById('city');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const cap = document.getElementById('city-caption');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // Four districts of 4 x 3 files on a 9 x 7 grid, with streets between them.
  const DISTRICTS = [
    { name: 'checkout/', i0: 0, j0: 0 }, { name: 'auth/', i0: 5, j0: 0 },
    { name: 'cart/', i0: 0, j0: 4 }, { name: 'catalog/', i0: 5, j0: 4 },
  ];
  const blocks = [];
  for (const d of DISTRICTS)
    for (let i = d.i0; i < d.i0 + 4; i++)
      for (let j = d.j0; j < d.j0 + 3; j++)
        blocks.push({ i, j, h: 0.35 + ((i * 7 + j * 13 + i * j) % 5) * 0.22, agent: null, mix: 0, ring: 0, lift: 0, mark: null, markA: 0 });
  blocks.sort((p, q) => (p.i + p.j) - (q.i + q.j));
  const at = (i, j) => blocks.find(b => b.i === i && b.j === j);
  const CHECKOUT = at(2, 1), CART = at(1, 5), SESSION = at(6, 1), NEAR = [at(1, 1), at(2, 0), at(3, 1)];

  let col = {};
  const readColours = () => {
    const s = getComputedStyle(document.documentElement);
    const v = n => s.getPropertyValue(n).trim();
    col = { block: v('--block'), slab: v('--slab'), ink: v('--ink'), muted: v('--muted'), ok: v('--leaf'),
            a: v('--agent-a'), b: v('--agent-b'), c: v('--agent-c') };
  };
  const rgb = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
  const mixc = (h1, h2, t) => { const p = rgb(h1), q = rgb(h2); return p.map((x, k) => Math.round(x + (q[k] - x) * t)); };
  const shade = (c, f) => `rgb(${c.map(x => Math.round(x * f)).join(',')})`;

  let W = 0, H = 0, a = 0, b = 0, ox = 0, oy = 0, U = 0;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; U = W / 14.6; a = U * 0.866; b = U * 0.5;
    H = Math.round(16 * b + U * 2.4);
    cv.style.height = H + 'px'; cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ox = 7 * a + 6; oy = U * 1.55;
  };
  const P = (i, j) => [ox + (i - j) * a, oy + (i + j) * b];
  const poly = (pts, fill) => { ctx.beginPath(); pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };

  const top = bl => { const [x, y] = P(bl.i + 0.5, bl.j + 0.5); return [x, y - (bl.h + bl.lift) * U]; };

  let arc = 0, dash = 0;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const d of DISTRICTS) {
      const m = 0.18;
      poly([P(d.i0 - m, d.j0 - m), P(d.i0 + 4 + m, d.j0 - m), P(d.i0 + 4 + m, d.j0 + 3 + m), P(d.i0 - m, d.j0 + 3 + m)], col.slab);
    }
    for (const bl of blocks) {
      const g = 0.1, h = (bl.h + bl.lift) * U;
      const c = bl.agent ? mixc(col.block, col[bl.agent], bl.mix) : rgb(col.block);
      const A = P(bl.i + g, bl.j + g), B = P(bl.i + 1 - g, bl.j + g), C = P(bl.i + 1 - g, bl.j + 1 - g), D = P(bl.i + g, bl.j + 1 - g);
      const up = ([x, y]) => [x, y - h];
      poly([D, C, up(C), up(D)], shade(c, 0.8));
      poly([B, C, up(C), up(B)], shade(c, 0.64));
      poly([A, B, C, D].map(up), shade(c, 1));
      if (bl.ring > 0.02) {
        const [x, y] = top(bl);
        ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.577); ctx.beginPath(); ctx.arc(0, 0, U * (0.5 + (1 - bl.ring) * 0.35), 0, 7);
        ctx.strokeStyle = col.ink; ctx.globalAlpha = bl.ring * 0.7; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      }
    }
    ctx.fillStyle = col.muted;
    ctx.font = `500 ${Math.max(10, Math.min(13, U * 0.3))}px ui-monospace, "SF Mono", Menlo, monospace`;
    for (const d of DISTRICTS) {
      const back = d.j0 === 0, [lx, ly] = back ? P(d.i0 - 0.18, -0.18) : P(d.i0 - 0.18, d.j0 + 3.18);
      const right = back && d.i0 === 0;
      ctx.textAlign = right ? 'right' : 'left';
      if (back) ctx.fillText(d.name, lx + (right ? -1 : 1) * a * 0.45, ly + U * 0.12);
      else {
        const [bx, by] = P(d.i0 + 4.18, d.j0 + 3.18);
        ctx.textAlign = d.i0 === 0 ? 'right' : 'center';
        ctx.fillText(d.name, bx, by + U * 0.5);
      }
    }
    if (arc > 0.02) {
      const [x1, y1] = top(CHECKOUT), [x2, y2] = top(CART);
      ctx.save(); ctx.globalAlpha = arc; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -dash; ctx.lineWidth = 2; ctx.strokeStyle = col.ink;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - U * 2.1, x2, y2); ctx.stroke(); ctx.restore();
    }
    for (const bl of blocks) {
      if (bl.markA < 0.02) continue;
      const [x, y0] = top(bl), y = y0 - U * (0.55 + (bl.mark === 'ok' ? (1 - bl.markA) * 0.5 : 0)), r = U * 0.3;
      ctx.save(); ctx.globalAlpha = bl.markA; ctx.beginPath(); ctx.arc(x, y, r, 0, 7);
      ctx.fillStyle = bl.mark === 'ok' ? col.ok : col.ink; ctx.fill();
      ctx.strokeStyle = col.slab; ctx.lineWidth = Math.max(1.5, r * 0.22); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      if (bl.mark === 'ok') { ctx.moveTo(x - r * 0.42, y); ctx.lineTo(x - r * 0.1, y + r * 0.32); ctx.lineTo(x + r * 0.45, y - r * 0.3); }
      else { ctx.moveTo(x - r * 0.25, y - r * 0.38); ctx.lineTo(x - r * 0.25, y + r * 0.38); ctx.moveTo(x + r * 0.25, y - r * 0.38); ctx.lineTo(x + r * 0.25, y + r * 0.38); }
      ctx.stroke(); ctx.restore();
    }
  };

  // The story. Each step sets targets; the frame loop eases toward them.
  const T = { arc: 0 };
  const paint = (bl, agent) => { bl.agent = agent; bl.target = 1; };
  const clear = bl => { bl.target = 0; };
  const STEPS = [
    [0, 'Three agents work in one repository, each in its own worktree.', () => {
      for (const bl of blocks) { bl.target = 0; bl.mark = null; bl.markT = 0; } T.arc = 0; }],
    [1400, 'Agent B is writing cart code that calls total().', () => { paint(CART, 'b'); CHECKOUT.ring = 1; }],
    [3800, 'Agent A changes the signature of total() in checkout.', () => { NEAR.forEach(n => { n.ring = 1; }); paint(CHECKOUT, 'a'); }],
    [5600, 'B is told in its next tool call, 22 ms later. Nothing is committed yet.', () => { T.arc = 1; }],
    [8600, 'B fixes its call while it is still working.', () => { CART.bump = 1; }],
    [10400, 'A lands: checks run on the exact merge commit, the record is signed, main moves.', () => {
      T.arc = 0; clear(CHECKOUT); CHECKOUT.mark = 'ok'; CHECKOUT.markT = 1; }],
    [12600, 'B lands on top of it.', () => { CHECKOUT.markT = 0; clear(CART); CART.mark = 'ok'; CART.markT = 1; }],
    [14200, 'Agent C read the web, then edited a protected auth file. That landing waits for a person.', () => {
      CART.markT = 0; paint(SESSION, 'c'); SESSION.mark = 'hold'; SESSION.markT = 1; }],
  ];
  const LOOP = 18600;

  const say = text => { if (cap && cap.textContent !== text) cap.textContent = text; };
  let t0 = 0, step = -1, last = 0, raf = 0, visible = true;
  const ease = (v, target, k) => v + (target - v) * k;
  const frame = now => {
    raf = 0;
    if (!t0) { t0 = now; last = now; }
    const t = (now - t0) % LOOP, dt = Math.min(64, now - last); last = now;
    let s = 0; while (s + 1 < STEPS.length && STEPS[s + 1][0] <= t) s++;
    if (s !== step) { if (s < step) STEPS[0][2](); step = s; STEPS[s][2](); say(STEPS[s][1]); }
    const k = 1 - Math.pow(0.004, dt / 1000);
    for (const bl of blocks) {
      bl.mix = ease(bl.mix, bl.target || 0, k); if (!bl.target && bl.mix < 0.02) bl.agent = null;
      bl.ring = Math.max(0, bl.ring - dt / 1500);
      bl.markA = ease(bl.markA, bl.markT || 0, k);
      if (bl.bump) { bl.bump = Math.max(0, bl.bump - dt / 700); bl.lift = Math.sin(bl.bump * Math.PI) * 0.35; }
    }
    arc = ease(arc, T.arc, k); dash += dt / 28;
    draw();
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const still = () => {   // reduced motion: one composed frame that shows every state
    STEPS[0][2]();
    paint(CHECKOUT, 'a'); paint(CART, 'b'); paint(SESSION, 'c'); SESSION.mark = 'hold';
    for (const bl of blocks) { bl.mix = bl.target || 0; bl.markA = bl.mark ? 1 : 0; }
    arc = 1; draw();
    say('Agent A changed a function Agent B calls; B is told while it works. Agent C’s protected change waits for a person.');
  };
  const start = () => {
    cancelAnimationFrame(raf); raf = 0;
    if (reduce.matches) return still();
    raf = requestAnimationFrame(frame);
  };

  readColours(); size(); start();
  addEventListener('resize', () => { size(); if (reduce.matches) still(); else draw(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColours(); if (reduce.matches) still(); });
  reduce.addEventListener('change', () => { t0 = 0; step = -1; start(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf && !reduce.matches) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf && !reduce.matches) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }).observe(cv);
})();
