// 滅蚊達人 第 3 關：巡倒清刷 ── 直式像素小遊戲
(() => {
const W = 1920, H = 1080, LW = 640, LH = 360, S = 3, YO = -192, GY = 462 + YO, MS = 1.5;
const c = document.getElementById('c'), g = c.getContext('2d');
const mk = (w, h) => { const v = document.createElement('canvas'); v.width = w; v.height = h; return v; };
const lc = mk(LW, LH), L0 = lc.getContext('2d');
const mcv = mk(LW * MS, LH * MS), L1 = mcv.getContext('2d');
const lc2 = mk(LW, LH), L2 = lc2.getContext('2d');
let l = L0;
const FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","微軟正黑體",sans-serif';
const CR = '#f2e8cc', RED = '#ff4552', GOLD = '#ffd65c', CYAN = '#7ff3ff', GREEN = '#7dffa0', PINK = '#ff9de2';
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, p) => a + (b - a) * p;
const eOut = p => 1 - Math.pow(1 - p, 3), eBack = p => { const c1 = 1.9, c3 = c1 + 1; return p <= 0 ? 0 : 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(src); i.src = src; });

// ---------- 素材處理 ----------
function cut(img, thr = 230) {
  const sw = img.width, sh = img.height, cv = mk(sw, sh), x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, sw, sh), a = d.data, bg = new Uint8Array(sw * sh);
  const isW = i => { const r = a[i * 4], gg = a[i * 4 + 1], b = a[i * 4 + 2], mn = Math.min(r, gg, b), mx = Math.max(r, gg, b); return mn > thr && mx - mn < 28; };
  const st = []; for (let i = 0; i < sw; i++) st.push(i, (sh - 1) * sw + i); for (let j = 0; j < sh; j++) st.push(j * sw, j * sw + sw - 1);
  while (st.length) { const i = st.pop(); if (bg[i] || !isW(i)) continue; bg[i] = 1; const px = i % sw, py = (i / sw) | 0;
    if (px > 0) st.push(i - 1); if (px < sw - 1) st.push(i + 1); if (py > 0) st.push(i - sw); if (py < sh - 1) st.push(i + sw); }
  for (let i = 0; i < sw * sh; i++) if (bg[i]) a[i * 4 + 3] = 0; x.putImageData(d, 0, 0); return cv;
}
function bbox(cv) { const d = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cv.width, cv.height).data; let x0 = cv.width, y0 = cv.height, x1 = 0, y1 = 0;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1]; }
function crop(cv, b) { const o = mk(b[2] - b[0] + 1, b[3] - b[1] + 1); o.getContext('2d').drawImage(cv, -b[0], -b[1]); return o; }
function pix(src, tw, th, { q = 8, hard = true } = {}) {
  let cur = src; while (cur.width > tw * 2) { const n = mk(Math.max(tw, cur.width >> 1), Math.max(th, cur.height >> 1)), nx = n.getContext('2d'); nx.imageSmoothingQuality = 'high'; nx.drawImage(cur, 0, 0, n.width, n.height); cur = n; }
  const o = mk(tw, th), x = o.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, tw, th);
  if (hard) { const d = x.getImageData(0, 0, tw, th), a = d.data; for (let i = 0; i < a.length; i += 4) { if (a[i + 3] < 120) { a[i + 3] = 0; continue; } a[i + 3] = 255; for (let k = 0; k < 3; k++) a[i + k] = Math.min(255, Math.round(a[i + k] / q) * q); } x.putImageData(d, 0, 0); }
  return o;
}
const SPR = {}, MAN = {};
function sliceSheet(img, names, targetH = 58) {
  const c0 = cut(img, 228), x = c0.getContext('2d', { willReadFrequently: true }), d = x.getImageData(0, 0, c0.width, c0.height).data, W0 = c0.width, H0 = c0.height;
  const col = []; for (let i = 0; i < W0; i++) { let n = 0; for (let y = 0; y < H0; y++) if (d[(y * W0 + i) * 4 + 3] > 40) n++; col.push(n); }
  let runs = [], s = -1, gap = 0; for (let i = 0; i <= W0; i++) { const on = i < W0 && col[i] > 0; if (on) { if (s < 0) s = i; gap = 0; } else if (s >= 0) { gap++; if (gap > 20 || i === W0) { runs.push([s, i - gap]); s = -1; gap = 0; } } }
  runs = runs.filter(r => r[1] - r[0] > W0 * .03); if (runs.length !== names.length) { console.warn('sheet mismatch', names, runs.length); return; }
  const crops = runs.map(([a, b]) => { const o = mk(b - a + 1, H0); o.getContext('2d').drawImage(c0, -a, 0); return crop(o, bbox(o)); });
  const sc = targetH / crops[0].height;
  crops.forEach((cr, i) => { const nm = names[i]; if (nm === '_') return; const cv = pix(cr, Math.max(1, Math.round(cr.width * sc)), Math.max(1, Math.round(cr.height * sc)));
    const dd = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cv.width, cv.height).data; let sx = 0, n = 0, nz = null;
    for (let y = Math.floor(cv.height * .4); y < cv.height * .75; y++) for (let xx = 0; xx < cv.width; xx++) if (dd[(y * cv.width + xx) * 4 + 3]) { sx += xx; n++; }
    const ax = n ? Math.round(sx / n) : cv.width >> 1;
    for (let xx = 0; xx < cv.width && !nz; xx++) for (let y = Math.floor(cv.height * .2); y < cv.height * .75; y++) if (dd[(y * cv.width + xx) * 4 + 3]) { nz = [xx - ax, y - cv.height]; break; }
    MAN[nm] = { cv, ax, ay: cv.height - 1, nz }; });
}

// ---------- 城市 ----------
let CITY, FAR, BLD = [];
function genCity() {
  const CWD = 1200, cv = mk(CWD, 480), x = cv.getContext('2d'), r = rng(7); let px = 0;
  while (px < CWD) {
    const w = 36 + Math.floor(r() * 5) * 8, fl = 3 + Math.floor(r() * 4), top = 440 - fl * 30 - 8;
    x.fillStyle = ['#1a2827', '#1f2e2d', '#172423', '#233331'][Math.floor(r() * 4)]; x.fillRect(px, top, w, 440 - top);
    x.fillStyle = '#304644'; x.fillRect(px, top, 1, 440 - top); x.fillRect(px, top, w, 2); x.fillStyle = '#0d1515'; x.fillRect(px + w - 1, top, 1, 440 - top);
    if (r() < .45) { const tx = px + 5 + Math.floor(r() * (w - 18)); x.fillStyle = '#3b5258'; x.fillRect(tx, top - 12, 10, 10); x.fillStyle = '#5a7882'; x.fillRect(tx, top - 12, 10, 2); }
    else { for (let i = 0; i < 3; i++) { const pp = px + 4 + Math.floor(r() * (w - 10)); x.fillStyle = '#5a3d2a'; x.fillRect(pp, top - 3, 4, 3); x.fillStyle = '#2f6040'; x.fillRect(pp - 1, top - 7, 6, 4); } }
    for (let f = 0; f < fl; f++) { const fy = top + 8 + f * 30;
      if (f === fl - 1) { if (r() < .5) { x.fillStyle = '#2b3534'; x.fillRect(px + 3, fy + 6, w - 6, 24); for (let k = fy + 7; k < fy + 30; k += 2) { x.fillStyle = '#212a29'; x.fillRect(px + 3, k, w - 6, 1); } }
        else { x.fillStyle = '#4c4630'; x.fillRect(px + 3, fy + 8, w - 6, 22); x.fillStyle = '#d8c58a'; x.fillRect(px + 4, fy + 9, w - 8, 9); }
        x.fillStyle = r() < .5 ? '#a8303a' : '#d9cba3'; x.fillRect(px + 2, fy - 1, w - 4, 6); }
      else { const nw = w > 50 ? 3 : 2, ww = Math.floor((w - 6) / nw) - 4;
        for (let k = 0; k < nw; k++) { const wx = px + 4 + k * (ww + 4) + 1, lit = r() < .33; x.fillStyle = lit ? '#e8d79c' : '#0b1213'; x.fillRect(wx, fy + 6, ww, 12);
          x.fillStyle = 'rgba(18,28,28,.85)'; for (let gx = wx + 2; gx < wx + ww; gx += 3) x.fillRect(gx, fy + 6, 1, 12); x.fillRect(wx, fy + 11, ww, 1); }
        x.fillStyle = '#111a19'; x.fillRect(px, fy + 24, w, 2);
        if (r() < .2) { x.fillStyle = '#b8303a'; x.fillRect(px + w - 6, fy + 2, 5, 20); } } }
    BLD.push({ x: px, w, top }); px += w;
  }
  x.fillStyle = '#26322f'; x.fillRect(0, 440, CWD, 8); x.fillStyle = '#3d4d49'; x.fillRect(0, 440, CWD, 1);
  x.fillStyle = '#0f1514'; x.fillRect(0, 448, CWD, 30); x.fillStyle = '#6f7a6c'; for (let i = 0; i < CWD; i += 16) x.fillRect(i, 471, 8, 1);
  x.fillStyle = '#1d2624'; x.fillRect(0, 478, CWD, 6); return cv;
}
function genFar() { const cv = mk(800, 445), x = cv.getContext('2d'), r = rng(31); let px = 0;
  while (px < 800) { const w = 18 + Math.floor(r() * 30), h = 120 + Math.floor(r() * 170); x.fillStyle = '#0f1b1d'; x.fillRect(px, 445 - h, w, h);
    for (let yy = 445 - h + 6; yy < 440; yy += 7) for (let xx = px + 3; xx < px + w - 3; xx += 5) if (r() < .12) { x.fillStyle = r() < .3 ? '#8a7f5c' : '#3f4b44'; x.fillRect(xx, yy, 2, 2); }
    px += w + Math.floor(r() * 4); } return cv; }
const STARS = (() => { const r = rng(12), a = []; for (let i = 0; i < 80; i++) a.push([Math.floor(r() * LW), Math.floor(r() * 150)]); return a; })();

// ---------- 音效（WebAudio 合成）----------
let AC = null, MASTER = null; const bgm = document.getElementById('bgm');
function beep(f, d = .1, type = 'square', vol = .12, slide = 0, delay = 0) { if (!AC) return; const t = AC.currentTime + delay, o = AC.createOscillator(), gn = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d); gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(gn).connect(MASTER || AC.destination); o.start(t); o.stop(t + d + .02); }
function noiseBurst(d = .3, vol = .2, lp = 1200) { if (!AC) return; const n = AC.createBuffer(1, AC.sampleRate * d, AC.sampleRate), a = n.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain(); f.type = 'lowpass'; f.frequency.value = lp; gn.gain.value = vol; s.buffer = n; s.connect(f).connect(gn).connect(MASTER || AC.destination); s.start(); }
const SFX = {
  good: () => { [660, 880, 1320].forEach((f, i) => beep(f, .12, 'square', .08, 0, i * .06)); },
  bad: () => { beep(220, .25, 'sawtooth', .12, .5); },
  miss: () => { beep(330, .3, 'square', .1, .4); noiseBurst(.25, .1, 2000); },
  splash: () => noiseBurst(.5, .22, 3000), toss: () => { beep(300, .25, 'triangle', .12, 2.5); }, light: () => beep(1200, .1, 'sine', .1, 1.4),
  scrub: () => { for (let i = 0; i < 4; i++) setTimeout(() => noiseBurst(.07, .12, 6000), i * 80); },
  tap: () => beep(900, .05, 'square', .06), win: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, .25, 'square', .09, 0, i * .12)); },
  lose: () => { [440, 349, 262, 196].forEach((f, i) => beep(f, .3, 'triangle', .12, 0, i * .18)); },
};

// ---------- 遊戲資料 ----------
const ACTS = [
  { k: '巡', sub: '巡視', col: GREEN, key: ['q', '1', 'a'] },
  { k: '倒', sub: '倒水', col: CYAN, key: ['w', '2', 's'] },
  { k: '清', sub: '清除', col: GOLD, key: ['e', '3', 'd'] },
  { k: '刷', sub: '刷洗', col: PINK, key: ['r', '4', 'f'] }];
const TYPES = {
  bucket: { name: '水桶', act: '倒', tip: '水桶裝了積水，要「倒」掉！' },
  basin: { name: '臉盆', act: '倒', tip: '臉盆積水要「倒」掉，一週至少一次！' },
  tire: { name: '廢輪胎', act: '清', tip: '不要的廢輪胎要「清」除！' },
  cans: { name: '空罐寶特瓶', act: '清', tip: '空罐、寶特瓶要「清」掉！' },
  saucer: { name: '花盆底盤', act: '刷', tip: '花盆底盤要「刷」，蚊卵黏在壁上！' },
  vase: { name: '花瓶', act: '刷', tip: '花瓶要換水並「刷」洗內壁！' } };
const TOTAL = 16; let LEVEL = 'l3';
let state = 'loading', G = null, last = 0, T = 0;
function newGame() {
  ZONE = MODE === 'hard' ? [306, 372] : [250, 394];
  const r = rng((Date.now() & 0xffff) + 3), keys = Object.keys(TYPES), list = [];
  for (let i = 0; i < TOTAL; i++) list.push({ type: keys[Math.floor(r() * keys.length)], hidden: i > 1 && r() < (MODE === 'hard' ? .45 : .25) });
  G = { t: 0, scroll: 0, speed: MODE === 'hard' ? 46 : 34, spawnI: 0, nextSpawn: .5, items: [], queue: list, score: 0, combo: 0, best: 0, mosq: 0, good: 0, bad: 0, missed: 0,
    fx: [], tip: null, act: null, shake: 0, flash: 0, end: 0 };
  if (LEVEL === 'boss') Object.assign(G, { hp: 100, bossHP: 100, orbs: { 巡: 0, 倒: 0, 清: 0, 刷: 0 }, bag: [], nextAtk: MODE === 'hard' ? 5 : 7, atk: null, beam: null, beams: 0, sprayT: -9, hurtT: -9, dead: null, speed: MODE === 'hard' ? 40 : 30, nextSpawn: 1 });
  G.intro = 999; G.istep = 0; G.istepT = 0; G.nextSpawn = 999; if (LEVEL === 'boss') G.nextAtk = 999;
  state = 'play';
}
let ZONE = [258, 392], MODE = 'normal'; const MANX = 410;
function zoneItem() { let best = null; for (const it of G.items) if (!it.done && it.x > ZONE[0] && it.x < ZONE[1]) { if (!best || it.x > best.x) best = it; } return best; }
function say(text, col = CR, dur = 2.2) { G.tip = { text, col, t: G.t, dur }; }
function addMosq(n) { G.mosq = Math.min(10, G.mosq + n); G.shake = .25; if (G.mosq >= 10) { G.end = G.t; state = 'lose'; SFX.lose(); bgm.pause(); } }
function press(i) {
  if (state === 'title') return;
  if (state === 'win' || state === 'lose') { if (G.t - G.end > 1) start(); return; }
  if (state !== 'play') return;
  if (G.t < G.intro) { introNext(); return; }
  const a = ACTS[i], it = zoneItem(); G.act = { k: a.k, t: G.t }; SFX.tap();
  if (!it) { say('容器靠近大叔時再出招！', '#b9c4bc', 1.2); return; }
  if (it.hidden && !it.revealed) {
    if (a.k === '巡') { it.revealed = G.t; SFX.light(); popText('巡！找到了', it.x, GREEN); G.score += 50; if (LEVEL === 'boss') G.orbs['巡'] = Math.min(2, G.orbs['巡'] + 1); say('是' + TYPES[it.type].name + '！看清楚再出招', GREEN, 1.6); return; }
    G.bad++; G.combo = 0; SFX.bad(); popText('✕', it.x, RED); penalty(1); say('黑黑的看不清楚，要先「巡」！', RED); return;
  }
  if (a.k === '巡') { say('已經看得到了，直接出招！', '#b9c4bc', 1.2); return; }
  const ty = TYPES[it.type];
  if (a.k === ty.act) { it.done = a.k; it.doneT = G.t; G.good++; G.combo++; G.best = Math.max(G.best, G.combo);
    const pts = 100 + Math.min(5, G.combo - 1) * 20; G.score += pts; popText(a.k + '！+' + pts, it.x, a.col); if (LEVEL === 'boss') { G.orbs[a.k] = Math.min(2, G.orbs[a.k] + 1); if (orbsFull()) say('四顆光球集滿！按「合體光束」！', GOLD, 3); }
    ({ '倒': SFX.splash, '清': SFX.toss, '刷': SFX.scrub })[a.k](); setTimeout(SFX.good, 120);
    if (G.combo >= 3) say('連擊 ×' + G.combo + '！', GOLD, 1.2); }
  else { G.bad++; G.combo = 0; SFX.bad(); popText('✕', it.x, RED); penalty(1); say(ty.tip, RED); }
}
function popText(s, x, col) { G.fx.push({ kind: 'text', s, x, y: GY - 60, col, t: G.t }); }
const BEAM_DMG = () => MODE === 'hard' ? 25 : 34;
function penalty(n) { if (LEVEL === 'boss') hurtMan(n * 6); else addMosq(n); }
function bossNext() { if (!G.bag.length) { const r = Math.random, ks = Object.keys(TYPES), pick = a => { const k2 = ks.filter(k => TYPES[k].act === a); return k2[Math.floor(r() * k2.length)]; };
    const b = ['倒', '倒', '清', '清', '刷', '刷'].map(a => ({ type: pick(a), hidden: false })); b.push({ type: ks[Math.floor(r() * ks.length)], hidden: true }, { type: ks[Math.floor(r() * ks.length)], hidden: true });
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } G.bag = b; } return G.bag.pop(); }
function bossPos() { let x = 130 + 40 * Math.sin(G.t * .7), y = 96 + 10 * Math.sin(G.t * 2.1);
  if (G.atk) { const p = G.t - G.atk.t; if (p > .8 && p < 1.6) { const q = p < 1.2 ? (p - .8) / .4 : 1 - (p - 1.2) / .4; x = lerp(x, MANX - 40, q); y = lerp(y, GY - 70, q); } }
  if (G.dead) y += (G.t - G.dead) * 12; return [x, y]; }
const orbsFull = () => G && G.orbs && ['巡', '倒', '清', '刷'].every(k => G.orbs[k] >= 2);
function hurtMan(n, msg) { if (G.dead) return; G.hp = Math.max(0, G.hp - n); G.hurtT = G.t; G.shake = .3; if (msg) say(msg, RED); if (G.hp <= 0 && state === 'play') { G.end = G.t; state = 'lose'; SFX.lose(); bgm.pause(); } }
function fireBeam() { if (!(LEVEL === 'boss' && state === 'play' && orbsFull() && !G.beam && !G.dead)) return; G.beam = { t: G.t }; G.orbs = { 巡: 0, 倒: 0, 清: 0, 刷: 0 }; G.beams++; SFX.charge(); setTimeout(SFX.beam, 450); say('防治要點合體！滅蚊高手號，發射！', GOLD, 2.2); }
function spray() { if (!(LEVEL === 'boss' && state === 'play') || G.dead || G.t - G.sprayT < .6) return; G.sprayT = G.t; SFX.spray(); G.bossHP = Math.max(1, G.bossHP - 1); popText('-1', bossPos()[0], '#b9c4bc'); say('噴藥只能擋一下！要靠巡倒清刷集滿光球！', '#d4dccf', 2); }
function bossUpdate(dt) {
  if (G.dead) { if (G.t - G.dead > 2.4 && state === 'play') { G.end = G.t; state = 'win'; SFX.win(); } return; }
  if (G.nextSpawn <= 0) { const q = bossNext(), [bx, by] = bossPos(); G.items.push({ id: G.spawnI++, type: q.type, hidden: q.hidden, x: bx - 10 + Math.random() * 20, fall: 0, fy: by + 20, done: null }); G.nextSpawn = MODE === 'hard' ? 1.6 : 2.2; SFX.toss(); }
  G.items.forEach(it => { if (it.fall !== undefined && it.fall < 1) it.fall = Math.min(1, it.fall + dt / .6); });
  G.nextAtk -= dt; if (G.nextAtk <= 0 && !G.atk && !G.beam) { G.atk = { t: G.t, hit: false }; say('魔王要衝過來了！', RED, 1.2); }
  if (G.atk) { const p = G.t - G.atk.t; if (p > 1.2 && !G.atk.hit) { G.atk.hit = true; SFX.hit(); hurtMan(MODE === 'hard' ? 8 : 5, '被魔王撞到了！快集光球反擊！'); } if (p > 1.6) { G.atk = null; G.nextAtk = MODE === 'hard' ? 5 : 7; } }
  if (G.beam) { const p = G.t - G.beam.t; if (p > .9 && !G.beam.hit) { G.beam.hit = true; G.bossHP = Math.max(0, G.bossHP - BEAM_DMG()); G.shake = .6; SFX.boom(); if (G.bossHP <= 0) { G.dead = G.t; G.items.forEach(it => it.done = it.done || '清'); say('登革熱 退散！', GOLD, 3); } } if (p > 1.8) G.beam = null; }
}
Object.assign(SFX, {
  charge: () => beep(200, 1, 'sawtooth', .1, 5), beam: () => { noiseBurst(1.3, .3, 1500); beep(150, 1.2, 'sawtooth', .12, .6); },
  boom: () => { noiseBurst(1.6, .45, 700); beep(80, .8, 'sine', .3, .4); }, spray: () => noiseBurst(.5, .12, 7000), hit: () => { noiseBurst(.4, .35, 900); beep(110, .3, 'square', .15, .5); } });

// ---------- 繪製：世界 ----------
function sky() { for (let y = 0; y < 445 + YO; y += 2) { const p = y / (445 + YO); l.fillStyle = `rgb(${Math.round(lerp(5, 22, p))},${Math.round(lerp(9, 40, p))},${Math.round(lerp(12, 44, p))})`; l.fillRect(0, y, LW, 2); } }
function drawWorld() {
  l = L0; l.setTransform(1, 0, 0, 1, 0, 0); l.imageSmoothingEnabled = false; sky();
  STARS.forEach((s, i) => { if ((Math.floor(T * 3 + i) % 5)) { l.fillStyle = 'rgba(240,235,210,.8)'; l.fillRect(s[0], s[1], 1, 1); } });
  l.fillStyle = '#efe6c4'; l.beginPath(); l.arc(560, 40, 18, 0, 7); l.fill(); l.fillStyle = '#cfc4a0'; l.beginPath(); l.arc(554, 35, 4, 0, 7); l.fill(); l.beginPath(); l.arc(565, 43, 5, 0, 7); l.fill();
  const sc = G ? G.scroll : T * 24; const tile = (im, f) => { const o = ((sc * f) % im.width + im.width) % im.width; for (let x = o - im.width; x < LW; x += im.width) l.drawImage(im, x, YO); };
  tile(FAR, .5); tile(CITY, 1);
  l.fillStyle = '#05090a'; l.fillRect(0, 484 + YO, LW, LH - 484 - YO);
}
function drawItem(it) {
  const ty = it.type, base = it.fall !== undefined && it.fall < 1 ? lerp(it.fy, GY - 1, it.fall * it.fall) : GY - 1, x = it.x; let k = 2.2;
  l.save(); l.translate(Math.round(x), base);
  if (it.done === '清') { const p = clamp((G.t - it.doneT) / .55); if (p >= 1) { l.restore(); return; } l.translate(lerp(0, TRUCKX + 110 - x, p), lerp(0, -80, p) - 70 * Math.sin(p * Math.PI)); l.rotate(p * 9); k *= 1 - p * .4; }
  if (it.done === '倒') { l.translate(-6 * k, 0); l.rotate(-1.4 * eOut(clamp((G.t - it.doneT) / .35))); l.translate(6 * k, 0); }
  l.scale(k, k);
  const hiddenNow = it.hidden && !it.revealed;
  if (hiddenNow) { l.fillStyle = '#121a19'; l.beginPath(); l.ellipse(0, -7, 11, 8, 0, 0, 7); l.fill(); l.fillStyle = '#1f2b29'; l.fillRect(-9, -6, 18, 6); l.restore(); return; }
  const water = !it.done || it.done === '刷' ? 1 : 0, wig = Math.floor(T * 8) % 2;
  const larv = (x0, y0, n) => { if (it.done) return; l.fillStyle = '#1a1208'; for (let i = 0; i < n; i++) l.fillRect(x0 + i * 3, y0 + ((i + wig) % 2), 1, 2); };
  if (ty === 'bucket') { l.fillStyle = '#3d78b8'; l.beginPath(); l.moveTo(-5, 0); l.lineTo(5, 0); l.lineTo(6, -12); l.lineTo(-6, -12); l.fill(); l.fillStyle = '#6aa4dc'; l.fillRect(-6, -12, 12, 1);
    l.strokeStyle = '#8fb8d8'; l.lineWidth = 1; l.beginPath(); l.arc(0, -12, 6, Math.PI, 0); l.stroke(); if (water && it.done !== '倒') { l.fillStyle = '#4f9cc8'; l.fillRect(-5, -11, 10, 2); larv(-4, -11, 3); } }
  if (ty === 'basin') { l.fillStyle = '#c84040'; l.beginPath(); l.moveTo(-8, 0); l.lineTo(8, 0); l.lineTo(10, -6); l.lineTo(-10, -6); l.fill(); l.fillStyle = '#e06060'; l.fillRect(-10, -6, 20, 1);
    if (water && it.done !== '倒') { l.fillStyle = '#4f9cc8'; l.fillRect(-9, -5, 18, 2); larv(-7, -5, 4); } }
  if (ty === 'tire') { l.fillStyle = '#0c0c0c'; l.beginPath(); l.arc(0, -7, 7, 0, 7); l.fill(); l.fillStyle = '#3a3a3a'; l.beginPath(); l.arc(0, -7, 3, 0, 7); l.fill(); l.fillStyle = '#4f9cc8'; l.fillRect(-3, -6, 6, 2); larv(-3, -7, 2); }
  if (ty === 'cans') { l.fillStyle = '#b8c0c0'; l.fillRect(-8, -6, 4, 6); l.fillStyle = '#c03030'; l.fillRect(-2, -6, 4, 6); l.fillStyle = 'rgba(180,230,240,.8)'; l.fillRect(4, -10, 4, 10); l.fillStyle = '#3080c0'; l.fillRect(4, -10, 4, 1); l.fillStyle = '#4f9cc8'; l.fillRect(4, -4, 4, 2); }
  if (ty === 'saucer') { l.fillStyle = '#7a4a2e'; l.fillRect(-9, -2, 18, 2); l.fillStyle = '#b8603c'; l.beginPath(); l.moveTo(-5, -2); l.lineTo(5, -2); l.lineTo(6, -11); l.lineTo(-6, -11); l.fill();
    l.fillStyle = '#2f6a40'; l.fillRect(-4, -18, 3, 7); l.fillRect(1, -20, 3, 9); if (it.done !== '刷') { l.fillStyle = '#4f9cc8'; l.fillRect(-9, -3, 3, 1); l.fillRect(6, -3, 3, 1); l.fillStyle = '#100c08'; [-8, -3, 2, 7].forEach(e => l.fillRect(e, -3, 1, 1)); } }
  if (ty === 'vase') { l.fillStyle = '#4a8ab0'; l.beginPath(); l.moveTo(-4, 0); l.lineTo(4, 0); l.lineTo(5, -10); l.lineTo(3, -15); l.lineTo(-3, -15); l.lineTo(-5, -10); l.fill(); l.fillStyle = '#3f8a50'; l.fillRect(-1, -24, 2, 9); l.fillRect(-4, -22, 3, 2); l.fillRect(1, -20, 3, 2);
    if (it.done !== '刷') { l.fillStyle = '#100c08'; [-3, 0, 3].forEach(e => l.fillRect(e, -13, 1, 1)); } }
  if (it.done === '刷') { const p = clamp((G.t - it.doneT) / .8); if (p < 1) { l.strokeStyle = 'rgba(240,250,255,.9)'; l.lineWidth = .6; for (let i = 0; i < 6; i++) { l.beginPath(); l.arc(-8 + i * 3, -6 - p * 14 - (i % 2) * 4, 1.2, 0, 7); l.stroke(); } } }
  l.restore();
  if (it.done === '倒') { const p = (G.t - it.doneT); if (p < 1.2) { const r = rng(it.id * 7); for (let i = 0; i < 26; i++) { const a = p - r() * .5; if (a < 0 || a > .45) continue; l.fillStyle = r() < .5 ? '#6ec0f0' : '#bfe6ff'; l.fillRect(Math.round(x - 14 - a * 40 - r() * 6), Math.round(base - 8 + a * 25 + 40 * a * a), 1, 2); }
    l.fillStyle = `rgba(90,170,220,${.6 * (1 - p / 1.2)})`; l.fillRect(Math.round(x - 30), base + 1, 22, 2); } }
}
const TRUCKX = 432;
function drawTruck() { if (!SPR.truck) return; l = L1; const bob = Math.floor(T * 12) % 2 ? -.6 : 0; l.save(); l.translate(TRUCKX + 75, GY + bob); l.drawImage(SPR.truck, -75, -SPR.truckH, 150, SPR.truckH);
  const wa = (G ? G.scroll : T * 24) / 11; for (const wx of [29.9, 110.9]) { const cx = wx - 75, cy = -9.6; l.fillStyle = '#c9ced2'; l.beginPath(); l.arc(cx, cy, 4.6, 0, 7); l.fill(); l.fillStyle = '#8d959b'; l.beginPath(); l.arc(cx, cy, 3.2, 0, 7); l.fill();
    l.fillStyle = '#2a2f33'; for (let k = 0; k < 4; k++) { const q = -wa + k * 1.571; l.fillRect(cx + Math.cos(q) * 2.6 - .6, cy + Math.sin(q) * 2.6 - .6, 1.3, 1.3); } }
  l.restore();
  // 車燈
  l.save(); l.globalCompositeOperation = 'lighter'; const gr = l.createLinearGradient(TRUCKX, 0, TRUCKX - 110, 0); gr.addColorStop(0, 'rgba(255,230,150,.3)'); gr.addColorStop(1, 'rgba(255,230,150,0)'); l.fillStyle = gr;
  l.beginPath(); l.moveTo(TRUCKX + 2, GY - 36); l.lineTo(TRUCKX - 110, GY - 50); l.lineTo(TRUCKX - 110, GY + 4); l.closePath(); l.fill(); l.restore(); }
function drawBoss() { if (!SPR.boss) return; const [x, y] = bossPos(), im = Math.floor(T * 20) % 2 ? SPR.boss : SPR.boss2, w = 230, h = w * im.height / im.width;
  l.save(); l.translate(x, y); if (G.dead) { l.globalAlpha = Math.max(0, 1 - (G.t - G.dead) / 1.2); l.rotate((G.t - G.dead) * 2); }
  if ((G.beam && G.t - G.beam.t > .9 && G.t - G.beam.t < 1.5 && Math.floor(G.t * 16) % 2) || G.t - G.sprayT < .15) l.filter = 'brightness(2.4)';
  l.drawImage(im, -w * .45, -h / 2, w, h); l.restore();
  if (!G.dead) for (let i = 0; i < 4; i++) { const a = G.t * 1.5 + i * 1.57; drawMosq(x + Math.cos(a) * 95, y + 30 + Math.sin(a) * 30, T, .9, i, Math.cos(a) > 0); } }
function drawMosq(x, y, t, sc = 1, seed = 0, flip = false) { if (!SPR.mosq) return; const im = (Math.floor(t * 24) + seed) % 2 ? SPR.mosq : SPR.mosq_down, w = 24 * sc, h = w * im.height / im.width;
  l.save(); l.translate(x, y); l.scale(flip ? -1 : 1, 1); l.drawImage(im, -w / 2, -h / 2, w, h); l.restore(); }
function manPose() {
  if (state !== 'play') return state === 'win' ? (Math.floor(T * 3) % 2 ? 'wave' : 'cheer') : state === 'lose' ? 'kneel' : 'idle0';
  if (LEVEL === 'boss') { if (G.beam && G.t - G.beam.t < 1.8) return 'raise' + (Math.floor(G.t * 6) % 2); if (G.t - G.hurtT < .4) return 'hurt'; if (G.t - G.sprayT < .5) return 'spray' + (Math.floor(G.t * 12) % 2); }
  if (G.act && G.t - G.act.t < .45) return { '巡': 'light0', '倒': 'point', '清': 'point', '刷': Math.floor(G.t * 10) % 2 ? 'brush0' : 'brush1' }[G.act.k];
  return 'walk' + (Math.floor(G.t * 10) % 4);
}
function drawMan() { l = L2; const p = manPose(), f = MAN[p] || MAN.idle0; if (!f) return; let y = GY; if (p === 'cheer') y -= Math.abs(Math.sin(T * 6)) * 10;
  l.drawImage(f.cv, Math.round(MANX - f.ax), Math.round(y - f.ay)); }

// ---------- 繪製：高解析 UI ----------
function txt(s, x, y, { size = 40, col = CR, w = 900, align = 'center', stroke = null, slw = 8, alpha = 1, scale = 1, maxW = 0 } = {}) {
  if (alpha <= 0 || scale <= 0) return; g.save(); g.translate(x, y); g.scale(scale, scale); g.globalAlpha *= alpha; let sz = size; g.font = `${w} ${sz}px ${FONT}`;
  if (maxW) { const m = g.measureText(s).width; if (m > maxW) { sz *= maxW / m; g.font = `${w} ${sz}px ${FONT}`; } }
  g.textAlign = align; g.textBaseline = 'middle'; if (stroke) { g.lineJoin = 'round'; g.strokeStyle = stroke; g.lineWidth = slw; g.strokeText(s, 0, 0); } g.fillStyle = col; g.fillText(s, 0, 0); g.restore(); }
function pbox(x, y, w, h, { fill = 'rgba(8,12,13,.93)', stroke = CR, lw = 4 } = {}) { g.fillStyle = fill; g.fillRect(x + lw, y + lw, w - 2 * lw, h - 2 * lw); g.fillStyle = stroke;
  g.fillRect(x + lw, y, w - 2 * lw, lw); g.fillRect(x + lw, y + h - lw, w - 2 * lw, lw); g.fillRect(x, y + lw, lw, h - 2 * lw); g.fillRect(x + w - lw, y + lw, lw, h - 2 * lw); }
const MODEBTN = [{ lv: 'l3', m: 'normal', x: 330, y: 640, w: 340, h: 120, col: GREEN, label: '第 3 關・一般', sub: '巡倒清刷　框大速度慢' }, { lv: 'l3', m: 'hard', x: 710, y: 640, w: 340, h: 120, col: CYAN, label: '第 3 關・困難', sub: '巡倒清刷　框小速度快' },
  { lv: 'boss', m: 'normal', x: 330, y: 800, w: 340, h: 120, col: GOLD, label: '魔王關・一般', sub: '打倒超級斑蚊' }, { lv: 'boss', m: 'hard', x: 710, y: 800, w: 340, h: 120, col: RED, label: '魔王關・困難', sub: '魔王更兇更快' }];
const SPRAY_BTN = { x: 985, y: 990, r: 62 }, BEAM_BTN = { x: W / 2 + 160, y: 300, w: 620, h: 120 };
const BTN_Y = 990, BTN_R = 80, btnX = i => 1150 + i * 210;
function drawButtons() {
  const zit = G && state === 'play' ? zoneItem() : null, want = zit ? (zit.hidden && !zit.revealed ? '巡' : TYPES[zit.type].act) : null;
  ACTS.forEach((a, i) => { if (want === a.k) { g.save(); g.globalAlpha = .45 + .35 * Math.sin(T * 10); g.fillStyle = a.col; g.beginPath(); g.arc(btnX(i), BTN_Y, BTN_R + 22, 0, 7); g.fill(); g.restore(); }
    const x = btnX(i), pressed = G && G.act && G.act.k === a.k && G.t - G.act.t < .15, sc = pressed ? .9 : 1;
    g.save(); g.translate(x, BTN_Y); g.scale(sc, sc); g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.arc(6, 10, BTN_R, 0, 7); g.fill();
    g.fillStyle = a.col; g.beginPath(); g.arc(0, 0, BTN_R, 0, 7); g.fill(); g.fillStyle = '#0a0d0e'; g.beginPath(); g.arc(0, 0, BTN_R - 14, 0, 7); g.fill();
    txt(a.k, 0, -8, { size: 84, col: a.col }); txt(a.sub, 0, 46, { size: 24, col: '#c9d2cb', w: 700 }); g.restore(); });
  if (G && LEVEL === 'boss' && state !== 'title') { const b = SPRAY_BTN, pr = G.t - G.sprayT < .15; g.save(); g.translate(b.x, b.y); g.scale(pr ? .9 : 1, pr ? .9 : 1); g.fillStyle = '#6f7d78'; g.beginPath(); g.arc(0, 0, b.r, 0, 7); g.fill(); g.fillStyle = '#0a0d0e'; g.beginPath(); g.arc(0, 0, b.r - 10, 0, 7); g.fill();
    txt('噴藥', 0, -4, { size: 36, col: '#c9d2cb' }); txt('(T)', 0, 34, { size: 20, col: '#7c8a85', w: 600 }); g.restore();
    if (orbsFull() && !G.beam && !G.dead && state === 'play') { const p = 1 + .06 * Math.sin(T * 9); g.save(); g.translate(BEAM_BTN.x, BEAM_BTN.y); g.scale(p, p); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,214,92,.25)'; g.fillRect(-BEAM_BTN.w / 2 - 30, -BEAM_BTN.h / 2 - 30, BEAM_BTN.w + 60, BEAM_BTN.h + 60); g.globalCompositeOperation = 'source-over';
      pbox(-BEAM_BTN.w / 2, -BEAM_BTN.h / 2, BEAM_BTN.w, BEAM_BTN.h, { stroke: GOLD, fill: 'rgba(40,30,0,.95)', lw: 8 }); txt('★ 合體光束！ ★', 0, 2, { size: 64, col: GOLD }); g.restore(); } }
}
function bar(x, y, w, h, f, col) { g.fillStyle = '#1b2422'; g.fillRect(x, y, w, h); g.fillStyle = col; const n = 30; for (let i = 0; i < Math.round(clamp(f) * n); i++) g.fillRect(x + 4 + i * (w - 8) / n, y + 4, (w - 8) / n - 4, h - 8); }
function drawBossBar() {
  pbox(24, 22, W - 48, 150, { stroke: RED });
  txt('魔王關　超級斑蚊' + (MODE === 'hard' ? '（困難）' : '（一般）'), 56, 62, { size: 36, col: MODE === 'hard' ? RED : GOLD, align: 'left' });
  txt('魔王', 640, 62, { size: 32, col: RED, align: 'left' }); bar(730, 44, 1130, 38, G.bossHP / 100, RED);
  txt('體力', 56, 132, { size: 32, col: GREEN, align: 'left' }); bar(140, 114, 460, 38, G.hp / 100, G.hp < 30 && Math.floor(T * 6) % 2 ? '#fff' : GREEN);
  txt('光球', 660, 132, { size: 32, col: GOLD, align: 'left' });
  ACTS.forEach((a, i) => { const x = 790 + i * 100, y = 132, f = G.orbs[a.k] / 2; g.fillStyle = '#1b2422'; g.beginPath(); g.arc(x, y, 32, 0, 7); g.fill();
    if (f > 0) { g.fillStyle = a.col; g.beginPath(); g.moveTo(x, y); g.arc(x, y, 32, -Math.PI / 2, -Math.PI / 2 + f * 6.2832); g.fill(); }
    g.fillStyle = '#0a0d0e'; g.beginPath(); g.arc(x, y, 23, 0, 7); g.fill(); txt(a.k, x, y + 2, { size: 28, col: f > 0 ? a.col : '#55625e' }); });
  txt(orbsFull() ? '光球集滿！按「合體光束」！' : '每招做對 2 次，集滿四顆光球', W - 56, 132, { size: 30, col: orbsFull() ? GOLD : '#b9c4bc', align: 'right', w: 700 });
}
function drawBossFX() {
  const [bx, by] = bossPos(), th = SPR.truckH || 90, mx = (TRUCKX + 30) * S, my = (GY - th + 22) * S, tcx = (TRUCKX + 75) * S, tcy = (GY - th / 2) * S;
  if (G.atk && G.t - G.atk.t < .8 && Math.floor(G.t * 8) % 2) txt('！', bx * S, (by - 60) * S, { size: 120, col: RED, stroke: '#000', slw: 12 });
  if (G.beam) { const p = G.t - G.beam.t; g.save(); g.globalCompositeOperation = 'lighter';
    const tg = p < 1.6 ? Math.min(1, p / .6) * (1 - clamp((p - 1.3) / .3)) : 0; if (tg > 0) { const gr = g.createRadialGradient(tcx, tcy, 0, tcx, tcy, 420); gr.addColorStop(0, 'rgba(255,240,160,' + (.55 * tg) + ')'); gr.addColorStop(1, 'rgba(255,240,160,0)'); g.fillStyle = gr; g.fillRect(tcx - 420, tcy - 420, 840, 840); }
    if (p < .9) { const k = eOut(p / .9); ACTS.forEach((a, i) => { const ox = 790 + i * 100, oy = 132, ex = mx + Math.cos(G.t * 8 + i * 1.57) * 40 * (1 - k), ey = my + Math.sin(G.t * 8 + i * 1.57) * 26 * (1 - k); g.fillStyle = a.col; g.beginPath(); g.arc(lerp(ox, ex, k), lerp(oy, ey, k) - Math.sin(k * Math.PI) * 120, 30, 0, 7); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,' + k + ')'; g.beginPath(); g.arc(mx, my, 30 + 50 * k, 0, 7); g.fill(); }
    else if (p < 1.6) { const k = 1 - clamp((p - 1.3) / .3), ex = bx * S, ey = by * S, pul = 1 + .15 * Math.sin(G.t * 50); g.lineCap = 'round';
      [[150, 'rgba(127,243,255,.35)'], [96, 'rgba(255,214,92,.5)'], [60, 'rgba(255,157,226,.55)'], [28, '#ffffff']].forEach(([w, col]) => { g.strokeStyle = col; g.lineWidth = w * pul * k; g.beginPath(); g.moveTo(mx, my); g.lineTo(ex, ey); g.stroke(); });
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(ex, ey, 140 * k, 0, 7); g.fill(); }
    g.restore(); }
  if (G.dead) { const d = G.t - G.dead, r = rng(55); g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 180; i++) { const a = r() * 6.28, sp = 200 + r() * 700, life = 1.4 + r() * 1.2; if (d > life) continue;
      g.globalAlpha = 1 - d / life; g.fillStyle = [CYAN, GOLD, GREEN, PINK, '#ffffff', RED][i % 6]; g.fillRect(bx * S + Math.cos(a) * sp * d, by * S + Math.sin(a) * sp * d + 100 * d * d, 12, 12); } g.restore();
    txt('登革熱　退散！', W / 2, 420, { size: 130, col: GOLD, stroke: '#5a1a00', slw: 18, scale: eBack(clamp(d / .4)) }); }
}
function drawHUD() {
  if (LEVEL === 'boss') drawBossBar(); else {
  pbox(24, 22, W - 48, 96, { stroke: GREEN });
  txt('第 3 關　巡倒清刷' + (MODE === 'hard' ? '（困難）' : '（一般）'), 56, 70, { size: 36, col: MODE === 'hard' ? RED : GREEN, align: 'left' });
  txt('分數 ' + G.score, W - 56, 52, { size: 38, col: CR, align: 'right' });
  txt('蚊子', 580, 70, { size: 34, col: RED, align: 'left' });
  for (let i = 0; i < 10; i++) { const x = 670 + i * 52, on = i < G.mosq; g.fillStyle = on ? RED : '#22302e'; g.fillRect(x, 50, 40, 40); if (on) txt('🦟', x + 20, 71, { size: 28, w: 400 }); }
  const left = TOTAL - G.good - G.missed; txt('剩 ' + Math.max(0, left) + ' 個容器', W - 56, 94, { size: 28, col: '#b9c4bc', align: 'right', w: 700 }); }
  if (G.combo >= 2) txt('連擊 ×' + G.combo, LEVEL === 'boss' ? 1500 : W / 2, LEVEL === 'boss' ? 230 : 190, { size: 52, col: GOLD, stroke: '#3a2a00', slw: 10, scale: 1 + .1 * Math.max(0, 1 - (G.t - (G.act ? G.act.t : 0)) * 4) });
  // 出招區提示
  const it = zoneItem(); const zx = (ZONE[0] + ZONE[1]) / 2 * S; g.save(); g.globalAlpha = .35 + .2 * Math.sin(T * 6); g.strokeStyle = it ? GOLD : '#4a5a56'; g.lineWidth = 6; g.setLineDash([18, 12]);
  g.strokeRect(ZONE[0] * S, (GY - 78) * S, (ZONE[1] - ZONE[0]) * S, 86 * S); g.restore();
  if (it) { const hid = it.hidden && !it.revealed, a = ACTS.find(x => x.k === (hid ? '巡' : TYPES[it.type].act)), label = (hid ? '看不清楚' : TYPES[it.type].name) + ' → 按「' + a.k + '」！';
    const bw = 560, bx = clamp(zx - bw / 2, 20, W - bw - 20), by = (GY - 78) * S - 150, pul = 1 + .05 * Math.sin(T * 10);
    g.save(); g.translate(bx + bw / 2, by + 50); g.scale(pul, pul); pbox(-bw / 2, -50, bw, 100, { stroke: a.col, fill: 'rgba(8,12,13,.95)', lw: 6 }); txt(label, 0, 2, { size: 50, col: a.col, maxW: bw - 40 }); g.restore();
    g.fillStyle = a.col; g.beginPath(); g.moveTo(zx - 22, by + 100); g.lineTo(zx + 22, by + 100); g.lineTo(zx, by + 128); g.fill(); }
  // 提示框
  if (G.tip && G.t - G.tip.t < G.tip.dur) { const a = clamp((G.t - G.tip.t) / .15) * (1 - clamp((G.t - G.tip.t - G.tip.dur + .3) / .3)); g.save(); g.globalAlpha = a;
    const tw = LEVEL === 'boss' ? 880 : 1010; pbox(30, 930, tw, 120, { stroke: G.tip.col }); txt(G.tip.text, 30 + tw / 2, 990, { size: 44, col: G.tip.col, maxW: tw - 50 }); g.restore(); }
  else txt(LEVEL === 'boss' ? '處理魔王丟下的容器，集滿光球！' : '容器走進虛線框時，按對的招式！', LEVEL === 'boss' ? 470 : 535, 990, { size: 38, col: '#8f9a90', w: 700 });
}
function arrow(x0, y0, x1, y1, col) { const a = Math.atan2(y1 - y0, x1 - x0); g.strokeStyle = col; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.fillStyle = col; g.beginPath(); g.moveTo(x1 + Math.cos(a) * 26, y1 + Math.sin(a) * 26); g.lineTo(x1 + Math.cos(a + 2.4) * 30, y1 + Math.sin(a + 2.4) * 30); g.lineTo(x1 + Math.cos(a - 2.4) * 30, y1 + Math.sin(a - 2.4) * 30); g.fill(); }
function marker(x, y, label, col, dir) { g.font = `900 36px ${FONT}`; const w = g.measureText(label).width + 44, h = 64, up = dir === 'up', by = up ? y + 26 : y - 26 - h;
  g.fillStyle = col; g.beginPath(); if (up) { g.moveTo(x - 20, y + 26); g.lineTo(x + 20, y + 26); g.lineTo(x, y); } else { g.moveTo(x - 20, y - 26); g.lineTo(x + 20, y - 26); g.lineTo(x, y); } g.fill();
  pbox(x - w / 2, by, w, h, { stroke: col, fill: 'rgba(8,12,13,.96)', lw: 5 }); txt(label, x, by + h / 2 + 2, { size: 36, col }); }
function introSteps() {
  const z = [ZONE[0] * S - 24, (GY - 78) * S - 24, (ZONE[1] - ZONE[0]) * S + 48, 86 * S + 48], bt = [btnX(0) - BTN_R - 22, BTN_Y - BTN_R - 22, btnX(3) - btnX(0) + BTN_R * 2 + 44, BTN_R * 2 + 44];
  if (LEVEL !== 'boss') return [[z, '容器會從左邊過來，走進這個框框'], [bt, '上面會提示，按「發光」的按鈕出招'], [[640, 36, 560, 70], '按錯或漏掉，蚊子會變多；滿 10 隻就失敗！']];
  const [bx, by] = bossPos();
  return [[[(bx - 90) * S, (by - 60) * S, 210 * S, 130 * S], '超級斑蚊會從天上丟下積水容器'], [z, '容器走進框框時，按「發光」的招式處理'], [[740, 96, 420, 74], '每招做對 2 次，集滿這四顆光球'],
    [[BEAM_BTN.x - BEAM_BTN.w / 2 - 20, BEAM_BTN.y - BEAM_BTN.h / 2 - 20, BEAM_BTN.w + 40, BEAM_BTN.h + 40], '光球集滿 → 按「合體光束」，貨車發射光束！', 'beam'],
    [[SPRAY_BTN.x - SPRAY_BTN.r - 20, SPRAY_BTN.y - SPRAY_BTN.r - 20, SPRAY_BTN.r * 2 + 40, SPRAY_BTN.r * 2 + 40], '噴藥只能擋一下，打不倒魔王喔！']];
}
function introNext() { G.istep++; G.istepT = G.t; SFX.tap(); if (G.istep >= introSteps().length) { G.intro = G.t; G.nextSpawn = .6; if (LEVEL === 'boss') G.nextAtk = MODE === 'hard' ? 5 : 7; say('開始！', GOLD, 1.2); } }
function rrect(x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function drawIntro() {
  const steps = introSteps(), st = steps[Math.min(G.istep, steps.length - 1)], [x, y, w, h] = st[0], p = clamp((G.t - G.istepT) / .25);
  if (st[2] === 'beam') { const b = BEAM_BTN; g.save(); g.translate(b.x, b.y); pbox(-b.w / 2, -b.h / 2, b.w, b.h, { stroke: GOLD, fill: 'rgba(40,30,0,.95)', lw: 8 }); txt('★ 合體光束！ ★', 0, 2, { size: 64, col: GOLD }); g.restore(); }
  // 聚光燈：其他地方變暗
  g.save(); g.fillStyle = 'rgba(0,0,0,.72)'; g.beginPath(); g.rect(0, 0, W, H); rrect(x, y, w, h, 24); g.fill('evenodd');
  g.strokeStyle = GOLD; g.lineWidth = 8 + 3 * Math.sin(T * 8); g.globalAlpha = .6 + .4 * Math.sin(T * 8); g.beginPath(); rrect(x, y, w, h, 24); g.stroke(); g.restore();
  // 說明文字（放在目標的上方或下方，不重疊）
  g.font = '900 52px ' + FONT; const tw = Math.min(1300, g.measureText(st[1]).width + 100), bh = 150, below = y + h / 2 < H / 2;
  const bx = clamp(x + w / 2 - tw / 2, 30, W - tw - 30), byy = below ? Math.min(H - bh - 20, y + h + 30) : Math.max(20, y - bh - 30);
  g.save(); g.globalAlpha = p; g.translate(0, (1 - eOut(p)) * (below ? -20 : 20));
  pbox(bx, byy, tw, bh, { stroke: GOLD, fill: 'rgba(8,12,13,.97)', lw: 6 }); txt(st[1], bx + tw / 2, byy + 58, { size: 52, col: CR, maxW: tw - 60 });
  txt((G.istep + 1) + ' / ' + steps.length + '　點一下 下一步 ▶', bx + tw / 2, byy + 118, { size: 28, col: GOLD, w: 700 }); g.restore();
}
function drawFX() {
  G.fx = G.fx.filter(f => G.t - f.t < 1);
  G.fx.forEach(f => { const p = (G.t - f.t); txt(f.s, clamp(f.x * S, 190, W - 190), (f.y - p * 30) * S, { size: 56, col: f.col, stroke: '#000', slw: 10, alpha: 1 - p, scale: eBack(clamp(p / .2)) }); });
  G.items.forEach(it => { if (it.hidden && it.revealed && G.t - it.revealed < .5) { const p = (G.t - it.revealed) / .5; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - p; g.fillStyle = '#fff6b0';
      g.beginPath(); g.arc(it.x * S, (GY - 10) * S, 40 + p * 80, 0, 7); g.fill(); g.restore(); } });
}
function drawTitle() {
  g.fillStyle = 'rgba(4,7,8,.82)'; g.fillRect(0, 0, W, H);
  const s = eBack(clamp(T / .5)); txt('滅蚊達人', 520, 330, { size: 190, col: RED, stroke: CR, slw: 14, scale: s });
  txt('選擇關卡與難度', 520, 520, { size: 50, col: CR });
  const rules = [['【第 3 關】容器進虛線框，按對招式', CR], ['水桶、臉盆 → 倒　輪胎、空罐 → 清', CYAN], ['花盆底盤、花瓶 → 刷　「？」→ 巡', PINK], ['按錯或漏掉，蚊子會變多', RED], ['【魔王關】處理魔王丟下的容器', GOLD], ['每招做對 2 次 → 集滿四顆光球', GOLD], ['光球集滿 → 按「合體光束」打魔王', GOLD], ['噴藥只能擋一下，打不倒魔王！', '#b9c4bc']];
  pbox(1000, 140, 860, 700, { stroke: CR }); rules.forEach(([r, col], i) => txt(r, 1430, 210 + i * 80, { size: 40, col, w: 800, maxW: 800 }));
  MODEBTN.forEach(b => { const pul = 1 + .04 * Math.sin(T * 5 + b.x); g.save(); g.translate(b.x, b.y); g.scale(pul, pul); pbox(-b.w / 2, -b.h / 2, b.w, b.h, { stroke: b.col, fill: 'rgba(8,12,13,.95)', lw: 6 });
    txt(b.label, 0, -16, { size: 46, col: b.col, maxW: b.w - 30 }); txt(b.sub, 0, 36, { size: 26, col: '#b9c4bc', w: 700 }); g.restore(); });
  txt('電腦：1～4 選關卡，遊戲中 Q W E R 出招、T 噴藥、空白鍵 光束', 520, 900, { size: 24, col: '#8f9a90', w: 600 });
}
function drawEnd() {
  const win = state === 'win', p = clamp((G.t - G.end) / .6); g.fillStyle = `rgba(4,7,8,${.85 * p})`; g.fillRect(0, 0, W, H); if (p < .3) return;
  txt(MODE === 'hard' ? '困難模式' : '一般模式', 520, 140, { size: 40, col: MODE === 'hard' ? RED : GREEN }); txt(win ? (LEVEL === 'boss' ? '打倒魔王！' : '過關！') : (LEVEL === 'boss' ? '被魔王打敗了…' : '蚊子大爆發…'), 520, 260, { size: 130, col: win ? GOLD : RED, stroke: '#000', slw: 14, scale: eBack(clamp((G.t - G.end - .2) / .4)) });
  const acc = G.good + G.bad ? Math.round(G.good / (G.good + G.bad + G.missed) * 100) : 0, stars = !win ? 0 : LEVEL === 'boss' ? (G.hp > 60 ? 3 : G.hp > 30 ? 2 : 1) : G.mosq <= 2 ? 3 : G.mosq <= 5 ? 2 : 1;
  for (let i = 0; i < 3; i++) { const sp = eBack(clamp((G.t - G.end - .6 - i * .25) / .3)); txt(i < stars ? '★' : '☆', 520 + (i - 1) * 180, 470, { size: 160, col: i < stars ? GOLD : '#3a4a46', scale: sp }); }
  pbox(1000, 120, 820, 520, { stroke: CR });
  (LEVEL === 'boss' ? [['合體光束', G.beams + ' 次'], ['做對', G.good + ' 次'], ['按錯', G.bad + ' 次'], ['漏掉', G.missed + ' 個'], ['剩餘體力', G.hp], ['用時', Math.round(G.end) + ' 秒']] : [['分數', G.score], ['做對', G.good + ' 次'], ['按錯', G.bad + ' 次'], ['漏掉', G.missed + ' 個'], ['最高連擊', G.best], ['正確率', acc + '%']]).forEach(([a, b], i) =>
    { txt(a, 1070, 190 + i * 76, { size: 44, col: '#b9c4bc', align: 'left', w: 700 }); txt(String(b), 1750, 190 + i * 76, { size: 48, col: CR, align: 'right' }); });
  pbox(1000, 670, 820, 200, { stroke: GREEN }); txt('記住：', 1410, 710, { size: 40, col: GREEN });
  txt(LEVEL === 'boss' ? '噴藥只能治標，' : '巡視積水・倒掉積水', 1410, 768, { size: 44, col: CR }); txt(LEVEL === 'boss' ? '巡倒清刷才能打倒登革熱！' : '清除廢容器・刷洗內壁', 1410, 828, { size: 44, col: CR });
  if (G.t - G.end > 1.2 && Math.floor(T * 2) % 2) txt('點一下再玩一次', 520, 680, { size: 60, col: CR });
}

// ---------- 主迴圈 ----------
function update(dt) {
  if (state !== 'play') { if (G) G.t += dt; return; }
  G.t += dt; if (G.t < G.intro && G.t - G.istepT > 2.6) introNext();
  if (LEVEL === 'l3') G.speed = MODE === 'hard' ? 46 + Math.min(30, G.t * .7) : 34 + Math.min(18, G.t * .4); G.scroll += G.speed * dt;
  G.nextSpawn -= dt;
  if (LEVEL === 'boss') bossUpdate(dt);
  else if (G.nextSpawn <= 0 && G.spawnI < TOTAL) { const q = G.queue[G.spawnI]; G.items.push({ id: G.spawnI, type: q.type, hidden: q.hidden, x: -24, done: null }); G.spawnI++; G.nextSpawn = Math.max(1.4, 2.4 - G.t * .03); }
  G.items.forEach(it => { it.x += G.speed * dt;
    if (!it.done && !it.missed && it.x > ZONE[1] + 2) { it.missed = true; G.missed++; G.combo = 0; SFX.miss(); if (LEVEL === 'boss') { G.bossHP = Math.min(100, G.bossHP + 4); hurtMan(10, '漏掉了！魔王吸收積水變強了！'); } else { addMosq(2); say('漏掉' + (it.hidden && !it.revealed ? '一個積水容器' : TYPES[it.type].name) + '！孑孓變成蚊子了…', RED); } }
    if (it.x > LW + 30) it.gone = true; });
  G.items = G.items.filter(it => !it.gone);
  if (LEVEL === 'l3' && state === 'play' && G.spawnI >= TOTAL && G.items.length === 0) { G.end = G.t; state = 'win'; SFX.win(); }
  G.shake = Math.max(0, G.shake - dt);
}
function render() {
  if (!CITY) { g.fillStyle = '#05090a'; g.fillRect(0, 0, W, H); txt('載入中…', W / 2, H / 2, { size: 60 }); return; }
  drawWorld();
  if (G && state !== 'title') G.items.forEach(drawItem);
  l = L1; l.setTransform(MS, 0, 0, MS, 0, 0); l.clearRect(0, 0, LW, LH); l.imageSmoothingEnabled = true; drawTruck(); if (G && LEVEL === 'boss' && state !== 'title') { l = L1; drawBoss(); }
  // 飛來飛去的蚊子（數量 = 蚊子計數）
  const n = G ? (LEVEL === 'boss' ? 0 : G.mosq) : 3; for (let i = 0; i < n; i++) drawMosq(40 + ((i * 61 + T * 30 * (i % 2 ? 1 : -1)) % 560 + 560) % 560, 110 + 30 * Math.sin(T * 2 + i * 1.7) + (i % 3) * 18, T, 1.1, i, Math.sin(T + i) < 0);
  l = L2; l.setTransform(1, 0, 0, 1, 0, 0); l.clearRect(0, 0, LW, LH); l.imageSmoothingEnabled = false; drawMan();
  if (G && LEVEL === 'boss' && G.t - G.sprayT < .7) { const [bx, by] = bossPos(), r = rng(Math.floor(G.sprayT * 10)); for (let i = 0; i < 60; i++) { const a = (G.t - G.sprayT) - i * .006; if (a < 0 || a > .5) continue; const q = a / .5, sx = MANX - 30, sy = GY - 32;
    l.fillStyle = `rgba(210,255,220,${1 - q})`; l.fillRect(Math.round(lerp(sx, bx + 20, q * .7) + (r() - .5) * 30 * q), Math.round(lerp(sy, by + 30, q * .7) + (r() - .5) * 30 * q), 2, 2); } }
  if (G && G.act && G.act.k === '巡' && G.t - G.act.t < .45) { l.save(); l.globalCompositeOperation = 'lighter'; l.fillStyle = 'rgba(255,230,120,.3)'; l.beginPath(); l.moveTo(MANX - 18, GY - 28); l.lineTo(ZONE[0], GY + 2); l.lineTo(ZONE[1] - 20, GY + 2); l.closePath(); l.fill(); l.restore(); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#05090a'; g.fillRect(0, 0, W, H);
  const sh = G && G.shake > 0 ? [(Math.random() - .5) * 18, (Math.random() - .5) * 18] : [0, 0];
  g.save(); g.translate(sh[0], sh[1]); g.imageSmoothingEnabled = false; g.drawImage(lc, 0, 0, W, H); g.imageSmoothingEnabled = true; g.drawImage(mcv, 0, 0, W, H); g.imageSmoothingEnabled = false; g.drawImage(lc2, 0, 0, W, H);
  if (G && state !== 'title') G.items.forEach(it => { if (it.hidden && !it.revealed && !it.missed) txt('？', it.x * S, (GY - 34) * S, { size: 60, col: GOLD, stroke: '#000', slw: 8 }); });
  g.restore();
  // 光點
  const r = rng(17); for (let i = 0; i < 30; i++) { const x0 = r() * W, y0 = r() * 800, ph = r() * 6, a = .3 + .3 * Math.sin(T * 2.4 + ph); g.fillStyle = [GREEN, CYAN, GOLD][i % 3]; g.globalAlpha = a; g.fillRect(Math.round((x0 + Math.sin(T * .6 + ph) * 30) / 3) * 3, Math.round(((y0 - T * 12) % 800 + 800) % 800 / 3) * 3, 6, 6); } g.globalAlpha = 1;
  if (state === 'loading') { txt('載入中…', W / 2, H / 2, { size: 60 }); return; }
  if (state === 'title') { drawButtons(); drawTitle(); }
  else { drawFX(); if (LEVEL === 'boss') drawBossFX(); drawHUD(); drawButtons(); if (state === 'play' && G.t < G.intro) drawIntro(); if (state === 'win' || state === 'lose') drawEnd(); }
  g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
}
function frame(ts) { const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; T += dt; update(dt); render(); requestAnimationFrame(frame); }

function start(m, lv) { if (m) MODE = m; if (lv) LEVEL = lv; if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && !MASTER) { MASTER = AC.createGain(); MASTER.gain.value = 2.4; const comp = AC.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 6; MASTER.connect(comp).connect(AC.destination); }
  if (AC && AC.state === 'suspended') AC.resume();
  try { bgm.volume = .2; bgm.currentTime = 0; bgm.play().catch(() => {}); } catch (e) {} newGame(); }
c.addEventListener('pointerdown', e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  if (state === 'title') { for (const b of MODEBTN) if (Math.abs(x - b.x) < b.w / 2 + 10 && Math.abs(y - b.y) < b.h / 2 + 10) return start(b.m, b.lv); return; }
  if (state === 'play' && G.t < G.intro) { introNext(); return; }
  if (LEVEL === 'boss' && state === 'play') { if (Math.hypot(x - SPRAY_BTN.x, y - SPRAY_BTN.y) < SPRAY_BTN.r + 14) return spray(); if (orbsFull() && Math.abs(x - BEAM_BTN.x) < BEAM_BTN.w / 2 + 20 && Math.abs(y - BEAM_BTN.y) < BEAM_BTN.h / 2 + 20) return fireBeam(); }
  for (let i = 0; i < 4; i++) if (Math.hypot(x - btnX(i), y - BTN_Y) < BTN_R + 20) return press(i);
  if (state === 'win' || state === 'lose') press(0); });
window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (state === 'title') { const mp = { '1': ['normal', 'l3'], 'enter': ['normal', 'l3'], '2': ['hard', 'l3'], '3': ['normal', 'boss'], '4': ['hard', 'boss'] }[k]; if (mp) start(mp[0], mp[1]); return; }
  if (state === 'play' && G.t < G.intro) { introNext(); return; }
  if (LEVEL === 'boss' && state === 'play') { if (k === 't') return spray(); if (k === ' ' || k === 'enter') { e.preventDefault(); return fireBeam(); } } ACTS.forEach((a, i) => { if (a.key.includes(k)) press(i); }); });

// 測試用：在主控台可手動推進遊戲
window.__dbg = { step: (dt = 1 / 30, n = 1) => { for (let i = 0; i < n; i++) { T += dt; update(dt); } render(); },
  press, start, spray, fireBeam, get: () => ({ level: LEVEL, hp: G && G.hp, bossHP: G && G.bossHP, orbs: G && G.orbs && JSON.stringify(G.orbs), full: orbsFull(), state, t: G && G.t, score: G && G.score, mosq: G && G.mosq, good: G && G.good, bad: G && G.bad, missed: G && G.missed,
    zone: (() => { const it = G && zoneItem(); return it ? { type: it.type, hidden: it.hidden && !it.revealed, act: TYPES[it.type].act } : null; })() }) };
(async () => {
  requestAnimationFrame(frame);
  const [tr, mq, md, pw, pk, pc, pb, bu, bd, ps] = await Promise.all(['truck', 'mosq', 'mosq_down', 'px_walk', 'px_work', 'px_cheer', 'px_battle', 'boss_up', 'boss_down', 'px_spray'].map(n => loadImg('img/' + n + '.png')));
  { const ca = cut(bu, 236), cb = cut(bd, 236), A = bbox(ca), B = bbox(cb), U = [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])];
    const w = Math.round(230 * MS); [SPR.boss, SPR.boss2] = [ca, cb].map(cv => { const cr = crop(cv, U); return pix(cr, w, Math.round(w * cr.height / cr.width), { hard: false }); }); }
  sliceSheet(ps, ['_', 'spray0', 'spray1']);
  { const cv = cut(tr, 230), b = bbox(cv), cr = crop(cv, b); SPR.truckH = 150 * cr.height / cr.width; SPR.truck = pix(cr, Math.round(150 * MS), Math.round(SPR.truckH * MS), { hard: false }); }
  { const ca = cut(mq, 236), cb = cut(md, 236), A = bbox(ca), B = bbox(cb), U = [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])];
    const w = Math.round(36 * MS); [SPR.mosq, SPR.mosq_down] = [ca, cb].map(cv => { const cr = crop(cv, U); return pix(cr, w, Math.round(w * cr.height / cr.width), { hard: false }); }); }
  sliceSheet(pw, ['idle0', 'walk0', 'walk1', 'walk2', 'walk3']); sliceSheet(pk, ['_', 'light0', 'point', 'brush0', 'brush1']);
  sliceSheet(pc, ['_', 'wave', 'cheer', 'thumbs']); sliceSheet(pb, ['_', 'raise0', 'raise1', 'hurt', 'kneel']);
  CITY = genCity(); FAR = genFar(); state = 'title';
})();
})();
