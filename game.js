// 滅蚊達人 ── 登革熱防治像素小遊戲（橫式 16:9）
// 關卡：1 認識斑蚊、2 居民求救、3 巡倒清刷、4 為什麼爆發、5 該怎麼辦、魔王關 超級斑蚊
(() => {
const W = 1920, H = 1080, LW = 640, LH = 360, S = 3, YO = -192, GY = 462 + YO, MS = 1.5;
const c = document.getElementById('c'), g = c.getContext('2d');
const mk = (w, h) => { const v = document.createElement('canvas'); v.width = w; v.height = h; return v; };
const lc = mk(LW, LH), L0 = lc.getContext('2d'), mcv = mk(LW * MS, LH * MS), L1 = mcv.getContext('2d'), lc2 = mk(LW, LH), L2 = lc2.getContext('2d');
let l = L0;
const FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","微軟正黑體",sans-serif';
const CR = '#f2e8cc', RED = '#ff4552', GOLD = '#ffd65c', CYAN = '#7ff3ff', GREEN = '#7dffa0', PINK = '#ff9de2', GREY = '#8f9a90';
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, p) => a + (b - a) * p;
const eOut = p => 1 - Math.pow(1 - p, 3), eBack = p => { const c1 = 1.9, c3 = c1 + 1; return p <= 0 ? 0 : 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
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
function pairSprite(ia, ib, tw) { const ca = cut(ia, 236), cb = cut(ib, 236), A = bbox(ca), B = bbox(cb), U = [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])];
  const w = Math.round(tw * MS); return [ca, cb].map(cv => { const cr = crop(cv, U); return pix(cr, w, Math.round(w * cr.height / cr.width), { hard: false }); }); }
function tinted(src, filter) { const o = mk(src.width, src.height), x = o.getContext('2d'); x.filter = filter; x.drawImage(src, 0, 0); return o; }
const SPR = {}, MAN = {};
function sliceSheet(img, names, targetH = 58) {
  const c0 = cut(img, 228), x = c0.getContext('2d', { willReadFrequently: true }), d = x.getImageData(0, 0, c0.width, c0.height).data, W0 = c0.width, H0 = c0.height;
  const col = []; for (let i = 0; i < W0; i++) { let n = 0; for (let y = 0; y < H0; y++) if (d[(y * W0 + i) * 4 + 3] > 40) n++; col.push(n); }
  let runs = [], s = -1, gap = 0; for (let i = 0; i <= W0; i++) { const on = i < W0 && col[i] > 0; if (on) { if (s < 0) s = i; gap = 0; } else if (s >= 0) { gap++; if (gap > 20 || i === W0) { runs.push([s, i - gap]); s = -1; gap = 0; } } }
  runs = runs.filter(r => r[1] - r[0] > W0 * .03); if (runs.length !== names.length) { console.warn('sheet mismatch', names, runs.length); return; }
  const crops = runs.map(([a, b]) => { const o = mk(b - a + 1, H0); o.getContext('2d').drawImage(c0, -a, 0); return crop(o, bbox(o)); });
  const sc = targetH / crops[0].height;
  crops.forEach((cr, i) => { const nm = names[i]; if (nm === '_') return; const cv = pix(cr, Math.max(1, Math.round(cr.width * sc)), Math.max(1, Math.round(cr.height * sc)));
    const dd = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cv.width, cv.height).data; let sx = 0, n = 0;
    for (let y = Math.floor(cv.height * .4); y < cv.height * .75; y++) for (let xx = 0; xx < cv.width; xx++) if (dd[(y * cv.width + xx) * 4 + 3]) { sx += xx; n++; }
    MAN[nm] = { cv, ax: n ? Math.round(sx / n) : cv.width >> 1, ay: cv.height - 1 }; });
}

// ---------- 城市 ----------
let CITY, FAR;
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
        x.fillStyle = '#111a19'; x.fillRect(px, fy + 24, w, 2); if (r() < .2) { x.fillStyle = '#b8303a'; x.fillRect(px + w - 6, fy + 2, 5, 20); } } }
    px += w;
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

// ---------- 音效 ----------
let AC = null, MASTER = null; const bgm = document.getElementById('bgm');
function beep(f, d = .1, type = 'square', vol = .12, slide = 0, delay = 0) { if (!AC) return; const t = AC.currentTime + delay, o = AC.createOscillator(), gn = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d); gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(gn).connect(MASTER || AC.destination); o.start(t); o.stop(t + d + .02); }
function noiseBurst(d = .3, vol = .2, lp = 1200) { if (!AC) return; const n = AC.createBuffer(1, AC.sampleRate * d, AC.sampleRate), a = n.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain(); f.type = 'lowpass'; f.frequency.value = lp; gn.gain.value = vol; s.buffer = n; s.connect(f).connect(gn).connect(MASTER || AC.destination); s.start(); }
const SFX = {
  good: () => [660, 880, 1320].forEach((f, i) => beep(f, .12, 'square', .08, 0, i * .06)), bad: () => beep(220, .25, 'sawtooth', .12, .5),
  miss: () => { beep(330, .3, 'square', .1, .4); noiseBurst(.25, .1, 2000); }, splash: () => noiseBurst(.5, .22, 3000), toss: () => beep(300, .25, 'triangle', .12, 2.5),
  light: () => beep(1200, .1, 'sine', .1, 1.4), scrub: () => { for (let i = 0; i < 4; i++) setTimeout(() => noiseBurst(.07, .12, 6000), i * 80); },
  tap: () => beep(900, .05, 'square', .06), bonk: () => { beep(300, .08, 'square', .2, .4); noiseBurst(.15, .25, 1500); },
  win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, .25, 'square', .09, 0, i * .12)), lose: () => [440, 349, 262, 196].forEach((f, i) => beep(f, .3, 'triangle', .12, 0, i * .18)),
  charge: () => beep(200, 1, 'sawtooth', .1, 5), beam: () => { noiseBurst(1.3, .3, 1500); beep(150, 1.2, 'sawtooth', .12, .6); },
  boom: () => { noiseBurst(1.6, .45, 700); beep(80, .8, 'sine', .3, .4); }, spray: () => noiseBurst(.5, .14, 7000), hit: () => { noiseBurst(.4, .35, 900); beep(110, .3, 'square', .15, .5); },
  alarm: () => [880, 660, 880, 660].forEach((f, i) => beep(f, .12, 'square', .1, 0, i * .14)), block: () => { beep(500, .15, 'square', .14, 2); noiseBurst(.3, .2, 4000); } };

// ---------- 存檔（存在這台裝置的瀏覽器）----------
const SKEY = 'mosquito-master-save-v1';
let SAVE = { stars: {} };
try { const s = JSON.parse(localStorage.getItem(SKEY) || '{}'); if (s && s.stars) SAVE = s; } catch (e) {}
const persist = () => { try { localStorage.setItem(SKEY, JSON.stringify(SAVE)); return true; } catch (e) { return false; } };
const bestStars = (id, m) => (SAVE.stars[id] && SAVE.stars[id][m]) || 0;
const cleared = id => bestStars(id, 'normal') > 0 || bestStars(id, 'hard') > 0;

// ---------- 關卡資料 ----------
const Q1 = [ // 認識斑蚊：0=是斑蚊 1=不是
  { mos: 'aedes', a: 0, why: '黑白條紋 → 斑蚊！會傳播登革熱' }, { mos: 'aedes', a: 0, why: '身體和腳有白色斑紋 → 斑蚊' }, { mos: 'aedes', a: 0, why: '黑白相間 → 斑蚊，看到要小心！' },
  { mos: 'culex', a: 1, why: '褐色、沒有白斑 → 家蚊，不是登革熱病媒' }, { mos: 'culex', a: 1, why: '黃褐色的是家蚊，不會傳登革熱' },
  { e: '🦵', t: '腳上有白色環紋', a: 0, why: '斑蚊的腳有黑白相間的環紋' }, { e: '☀️', t: '白天出來叮人', a: 0, why: '斑蚊白天活動，清晨和黃昏最多' },
  { e: '💧', t: '在容器的乾淨積水產卵', a: 0, why: '斑蚊愛在花盆、水桶的乾淨積水產卵' }, { e: '🌙', t: '半夜在耳邊嗡嗡叫', a: 1, why: '半夜嗡嗡叫的多半是家蚊' }, { e: '🕳️', t: '在臭水溝產卵', a: 1, why: '臭水溝是家蚊的家；斑蚊愛乾淨容器積水' } ];
const Q2 = [ // 居民症狀：0=是登革熱症狀 1=不是
  { e: '🤒', t: '突然高燒 38°C 以上', a: 0, why: '突然高燒是登革熱典型症狀' }, { e: '👀', t: '頭痛、眼睛後面痛', a: 0, why: '後眼窩痛是登革熱常見症狀' }, { e: '🦴', t: '肌肉、關節痛到不行', a: 0, why: '俗稱「斷骨熱」，肌肉關節痛' },
  { e: '🔴', t: '皮膚出現紅疹', a: 0, why: '登革熱可能會出疹' }, { e: '🤢', t: '噁心、想吐、全身無力', a: 0, why: '噁心嘔吐、倦怠也常見' }, { e: '🤧', t: '流鼻水、一直打噴嚏', a: 1, why: '比較像感冒，不是登革熱典型症狀' },
  { e: '😷', t: '咳嗽一直有痰', a: 1, why: '咳嗽有痰比較像呼吸道感染' }, { e: '🦷', t: '牙齒痛', a: 1, why: '牙痛跟登革熱無關，要看牙醫' }, { e: '🦶', t: '腳扭傷腫起來', a: 1, why: '扭傷不是登革熱症狀' } ];
const Q4 = [ // 為什麼爆發：0=會讓登革熱變多 1=不會
  { e: '🌡️', t: '天氣高溫炎熱', a: 0, why: '高溫讓病毒在蚊子體內繁殖更快' }, { e: '🌧️', t: '下雨、颱風後到處積水', a: 0, why: '積水變多，孑孓大量孳生' }, { e: '🌱', t: '花盆底盤積水沒清', a: 0, why: '積水容器是斑蚊的溫床' },
  { e: '✈️', t: '從流行地區旅遊回來', a: 0, why: '境外移入會把病毒帶回來' }, { e: '🏘️', t: '人口密集的社區', a: 0, why: '斑蚊一隻可以叮好幾個人' }, { e: '❄️', t: '冬天天氣很冷', a: 1, why: '天冷時蚊子和病毒都比較不活躍' },
  { e: '🏺', t: '水缸加蓋密封', a: 1, why: '加蓋後蚊子不能產卵' }, { e: '🏠', t: '家裡裝紗窗紗門', a: 1, why: '紗窗紗門可以擋住蚊子' }, { e: '🧹', t: '每週巡倒清刷', a: 1, why: '清除孳生源，蚊子就變少' } ];
const Q5 = [ // 該怎麼辦：0=對 1=錯
  { e: '🏥', t: '發燒了，快去看醫生', a: 0, why: '出現症狀要盡速就醫' }, { e: '🗣️', t: '主動告訴醫生旅遊史', a: 0, why: '旅遊史能幫醫師判斷' }, { e: '💧', t: '多休息、多喝水', a: 0, why: '多休息多喝水很重要' },
  { e: '💊', t: '自己亂吃阿斯匹靈止痛', a: 1, why: '可能增加出血風險，用藥要聽醫師' }, { e: '😖', t: '肚子痛、一直吐還在家忍', a: 1, why: '這是警示徵象，要立刻就醫！' }, { e: '🦟', t: '生病期間也要防蚊叮', a: 0, why: '發病前1天到後5天被叮，會再傳出去' },
  { e: '👕', t: '穿淺色長袖、擦防蚊液', a: 0, why: '可以減少被斑蚊叮咬' }, { e: '💨', t: '只要噴藥就好，不用清積水', a: 1, why: '噴藥只能治標，要清除積水才治本' }, { e: '🌡️', t: '退燒依醫師指示用乙醯胺酚', a: 0, why: '登革熱退燒藥要依醫師指示' } ];
const LEVELS = [
  { id: 'l1', name: '第 1 關', title: '認識斑蚊', kind: 'quiz', q: Q1, ask: '是斑蚊嗎？', btns: [{ k: '是斑蚊', sub: '撞飛它！', col: RED }, { k: '不是', sub: '放過', col: CYAN }], lesson: ['斑蚊：黑白條紋、白天叮人', '愛在容器的乾淨積水產卵'] },
  { id: 'l2', name: '第 2 關', title: '居民求救', kind: 'quiz', q: Q2, ask: '是登革熱症狀嗎？', btns: [{ k: '是', sub: '登革熱症狀', col: RED }, { k: '不是', sub: '不太像', col: CYAN }], lesson: ['突然高燒、後眼窩痛、肌肉關節痛', '出疹、噁心嘔吐 → 快就醫'] },
  { id: 'l3', name: '第 3 關', title: '巡倒清刷', kind: 'l3', lesson: ['巡視積水・倒掉積水', '清除廢容器・刷洗內壁'] },
  { id: 'l4', name: '第 4 關', title: '為什麼爆發', kind: 'quiz', q: Q4, ask: '會讓登革熱變多嗎？', btns: [{ k: '會', sub: '蚊子變多', col: RED }, { k: '不會', sub: '', col: CYAN }], lesson: ['高溫、積水、境外移入、人口密集', '加蓋、紗窗、巡倒清刷能預防'] },
  { id: 'l5', name: '第 5 關', title: '該怎麼辦', kind: 'quiz', q: Q5, ask: '這樣做對嗎？', btns: [{ k: '對', sub: '正確做法', col: GREEN }, { k: '錯', sub: '不能這樣', col: RED }], lesson: ['發燒快就醫、說旅遊史', '不亂吃止痛藥、生病也要防蚊'] },
  { id: 'boss', name: '魔王關', title: '超級斑蚊', kind: 'boss', lesson: ['噴藥只能擋一下，', '巡倒清刷才能打倒登革熱！'] } ];
const ACTS = [{ k: '巡', sub: '巡視', col: GREEN, key: ['q', '1', 'a'] }, { k: '倒', sub: '倒水', col: CYAN, key: ['w', '2', 's'] }, { k: '清', sub: '清除', col: GOLD, key: ['e', '3', 'd'] }, { k: '刷', sub: '刷洗', col: PINK, key: ['r', '4', 'f'] }];
const TYPES = {
  bucket: { name: '水桶', act: '倒', tip: '水桶裝了積水，要「倒」掉！' }, basin: { name: '臉盆', act: '倒', tip: '臉盆積水要「倒」掉，一週至少一次！' },
  tire: { name: '廢輪胎', act: '清', tip: '不要的廢輪胎要「清」除！' }, cans: { name: '空罐寶特瓶', act: '清', tip: '空罐、寶特瓶要「清」掉！' },
  saucer: { name: '花盆底盤', act: '刷', tip: '花盆底盤要「刷」，蚊卵黏在壁上！' }, vase: { name: '花瓶', act: '刷', tip: '花瓶要換水並「刷」洗內壁！' } };
const L3_TOTAL = 16;
let state = 'loading', G = null, last = 0, T = 0, LVI = 0, MODE = 'normal', ZONE = [250, 394], clearArm = -9;
const MANX = 410, TRUCKX = 432;
const lv = () => LEVELS[LVI], kind = () => lv().kind;

// ---------- 開新局 ----------
function newGame() {
  ZONE = MODE === 'hard' ? [306, 372] : [250, 394];
  G = { t: 0, scroll: 0, speed: 34, spawnI: 0, nextSpawn: 999, items: [], queue: [], score: 0, combo: 0, best: 0, mosq: 0, good: 0, bad: 0, missed: 0,
    fx: [], tip: null, act: null, shake: 0, end: 0, intro: 999, istep: 0, istepT: 0, saved: false, stars: 0 };
  const k = kind();
  if (k === 'l3') { const r = rng((Date.now() & 0xffff) + 3), keys = Object.keys(TYPES); for (let i = 0; i < L3_TOTAL; i++) G.queue.push({ type: keys[Math.floor(r() * keys.length)], hidden: i > 1 && r() < (MODE === 'hard' ? .45 : .25) }); G.total = L3_TOTAL; }
  if (k === 'quiz') { G.queue = shuffle(lv().q.slice()).slice(0, 10); G.total = G.queue.length; G.speed = MODE === 'hard' ? 40 : 30; }
  if (k === 'boss') Object.assign(G, { hp: 100, bossHP: 100, orbs: { 巡: 0, 倒: 0, 清: 0, 刷: 0 }, bag: [], nextAtk: 999, atk: null, beam: null, beams: 0, sprayT: -9, hurtT: -9, dead: null, speed: MODE === 'hard' ? 40 : 30 });
  state = 'play';
}
function zoneItem() { let best = null; for (const it of G.items) if (!it.done && it.x > ZONE[0] && it.x < ZONE[1] && !(it.fall !== undefined && it.fall < 1)) { if (!best || it.x > best.x) best = it; } return best; }
function say(text, col = CR, dur = 2.2) { G.tip = { text, col, t: G.t, dur }; }
function popText(s, x, col) { G.fx.push({ s, x, y: GY - 60, col, t: G.t }); }
function addMosq(n) { G.mosq = Math.min(10, G.mosq + n); G.shake = .25; if (G.mosq >= 10 && state === 'play') finish(false); }
function finish(win) {
  G.end = G.t; state = win ? 'win' : 'lose'; (win ? SFX.win : SFX.lose)(); if (!win) bgm.pause();
  if (win) { const k = kind(); G.stars = k === 'boss' ? (G.hp > 60 ? 3 : G.hp > 30 ? 2 : 1) : G.mosq <= 2 ? 3 : G.mosq <= 5 ? 2 : 1;
    const id = lv().id; SAVE.stars[id] = SAVE.stars[id] || {}; SAVE.stars[id][MODE] = Math.max(G.stars, bestStars(id, MODE)); G.saved = persist(); }
}

// ---------- 第 3 關／魔王關：出招 ----------
function press(i) {
  if (state !== 'play') return;
  if (G.t < G.intro) { introNext(); return; }
  if (kind() === 'quiz') return answer(i);
  const a = ACTS[i], it = zoneItem(); G.act = { k: a.k, t: G.t }; SFX.tap();
  if (!it) { say('容器靠近大叔時再出招！', '#b9c4bc', 1.2); return; }
  if (it.hidden && !it.revealed) {
    if (a.k === '巡') { it.revealed = G.t; SFX.light(); popText('巡！找到了', it.x, GREEN); G.score += 50; if (kind() === 'boss') addOrb('巡'); say('是' + TYPES[it.type].name + '！看清楚再出招', GREEN, 1.6); return; }
    G.bad++; G.combo = 0; SFX.bad(); popText('✕', it.x, RED); penalty(1); say('黑黑的看不清楚，要先「巡」！', RED); return;
  }
  if (a.k === '巡') { say('已經看得到了，直接出招！', '#b9c4bc', 1.2); return; }
  const ty = TYPES[it.type];
  if (a.k === ty.act) { it.done = a.k; it.doneT = G.t; G.good++; G.combo++; G.best = Math.max(G.best, G.combo);
    const pts = 100 + Math.min(5, G.combo - 1) * 20; G.score += pts; popText(a.k + '！+' + pts, it.x, a.col);
    ({ '倒': SFX.splash, '清': SFX.toss, '刷': SFX.scrub })[a.k](); setTimeout(SFX.good, 120);
    if (kind() === 'boss') addOrb(a.k); else if (G.combo >= 3) say('連擊 ×' + G.combo + '！', GOLD, 1.2); }
  else { G.bad++; G.combo = 0; SFX.bad(); popText('✕', it.x, RED); penalty(1); say(ty.tip, RED); }
}
function penalty(n) { if (kind() === 'boss') hurtMan(n * 6); else addMosq(n); }

// ---------- 問答關 ----------
function answer(i) {
  const L = lv(), it = zoneItem(); G.act = { k: L.btns[i].k, t: G.t, i }; SFX.tap();
  if (!it) { say('題目牌進框框再回答！', '#b9c4bc', 1.2); return; }
  const q = it.q; it.doneT = G.t;
  if (i === q.a) { it.done = 'ok'; G.good++; G.combo++; G.best = Math.max(G.best, G.combo); const pts = 100 + Math.min(5, G.combo - 1) * 20; G.score += pts;
    popText('答對！+' + pts, it.x, GREEN); setTimeout(SFX.good, 60); if (q.mos === 'aedes') SFX.bonk(); say('⭕ ' + q.why, GREEN, 2.8); }
  else { it.done = 'bad'; G.bad++; G.combo = 0; SFX.bad(); popText('✕', it.x, RED); addMosq(1); say('❌ ' + q.why, RED, 3.2); }
}

// ---------- 魔王關 ----------
const BEAM_DMG = () => MODE === 'hard' ? 25 : 34;
const ATK_WARN = 1.8, ATK_HIT = 2.2, ATK_END = 2.8;
function addOrb(k) { G.orbs[k] = Math.min(2, G.orbs[k] + 1); if (orbsFull()) say('四顆光球集滿！按「合體光束」！', GOLD, 3); }
function bossNext() { if (!G.bag.length) { const r = Math.random, ks = Object.keys(TYPES), pick = a => { const k2 = ks.filter(k => TYPES[k].act === a); return k2[Math.floor(r() * k2.length)]; };
    const b = ['倒', '倒', '清', '清', '刷', '刷'].map(a => ({ type: pick(a), hidden: false })); b.push({ type: ks[Math.floor(r() * ks.length)], hidden: true }, { type: ks[Math.floor(r() * ks.length)], hidden: true }); G.bag = shuffle(b); } return G.bag.pop(); }
function bossPos() { let x = 130 + 40 * Math.sin(G.t * .7), y = 96 + 10 * Math.sin(G.t * 2.1);
  if (G.atk) { const p = G.t - G.atk.t;
    if (G.atk.blocked) { const q = clamp((p - G.atk.blockT) / .5); x -= 60 * Math.sin(q * Math.PI); y -= 30 * Math.sin(q * Math.PI); }
    else if (p < ATK_WARN) { x += Math.sin(G.t * 40) * 3 * (p / ATK_WARN); y -= 12 * (p / ATK_WARN); }
    else if (p < ATK_END) { const q = p < ATK_HIT ? (p - ATK_WARN) / (ATK_HIT - ATK_WARN) : 1 - (p - ATK_HIT) / (ATK_END - ATK_HIT); x = lerp(x, MANX - 40, q); y = lerp(y - 12, GY - 70, q); } }
  if (G.dead) y += (G.t - G.dead) * 12; return [x, y]; }
const orbsFull = () => !!(G && G.orbs && ['巡', '倒', '清', '刷'].every(k => G.orbs[k] >= 2));
const warning = () => !!(G && G.atk && !G.atk.blocked && G.t - G.atk.t < ATK_HIT);
const atkFreeze = () => !!(G && G.atk && kind() === 'boss');
function hurtMan(n, msg) { if (G.dead) return; G.hp = Math.max(0, G.hp - n); G.hurtT = G.t; G.shake = .3; if (msg) say(msg, RED); if (G.hp <= 0 && state === 'play') finish(false); }
function fireBeam() { if (!(kind() === 'boss' && state === 'play' && orbsFull() && !G.beam && !G.dead)) return; G.beam = { t: G.t }; G.orbs = { 巡: 0, 倒: 0, 清: 0, 刷: 0 }; G.beams++; SFX.charge(); setTimeout(SFX.beam, 450); say('防治要點合體！滅蚊高手號，發射！', GOLD, 2.2); }
function spray() {
  if (!(kind() === 'boss' && state === 'play') || G.dead || (G.t - G.sprayT < .5 && !warning())) return; if (G.t < G.intro) { introNext(); return; }
  G.sprayT = G.t; SFX.spray();
  if (warning()) { G.atk.blocked = true; G.atk.blockedEver = true; G.atk.blockT = G.t - G.atk.t; SFX.block(); popText('擋住了！', bossPos()[0], GREEN); say('擋住了！噴藥可以暫時擋住魔王，但打不倒它', GREEN, 2.4); return; }
  G.bossHP = Math.max(1, G.bossHP - 1); popText('-1', bossPos()[0], '#b9c4bc'); say('噴藥只能擋一下！要等魔王衝過來時再噴', '#d4dccf', 2);
}
function bossUpdate(dt) {
  if (G.dead) { if (G.t - G.dead > 2.4 && state === 'play') finish(true); return; }
  if (G.nextSpawn <= 0 && !atkFreeze()) { const q = bossNext(), [bx, by] = bossPos(); G.items.push({ id: G.spawnI++, type: q.type, hidden: q.hidden, x: bx - 10 + Math.random() * 20, fall: 0, fy: by + 20, done: null }); G.nextSpawn = MODE === 'hard' ? 1.6 : 2.2; SFX.toss(); }
  G.items.forEach(it => { if (it.fall !== undefined && it.fall < 1) it.fall = Math.min(1, it.fall + dt / .6); });
  G.nextAtk -= dt; if (G.nextAtk <= 0 && !G.atk && !G.beam) { G.atk = { t: G.t, hit: false, blocked: false }; SFX.alarm(); }
  if (G.atk) { const p = G.t - G.atk.t;
    if (!G.atk.blocked && p > ATK_HIT && !G.atk.hit && !G.atk.blockedEver) { G.atk.hit = true; SFX.hit(); hurtMan(MODE === 'hard' ? 8 : 5, '被魔王撞到了！下次看到警告就按「噴藥」！'); }
    if (p > ATK_END + (G.atk.blocked ? .2 : 0)) { G.atk = null; G.nextAtk = MODE === 'hard' ? 5 : 7; } }
  if (G.beam) { const p = G.t - G.beam.t; if (p > .9 && !G.beam.hit) { G.beam.hit = true; G.bossHP = Math.max(0, G.bossHP - BEAM_DMG()); G.shake = .6; SFX.boom(); if (G.bossHP <= 0) { G.dead = G.t; G.items.forEach(it => it.done = it.done || '清'); say('登革熱 退散！', GOLD, 3); } } if (p > 1.8) G.beam = null; }
}

// ---------- 開場教學（聚光燈）----------
const BTN_Y = 990, BTN_R = 80, btnX = i => 1150 + i * 210;
const QBTN = [{ x: 1250, y: 990, w: 380, h: 150 }, { x: 1660, y: 990, w: 380, h: 150 }];
const SPRAY_BTN = { x: 985, y: 990, r: 62 }, BEAM_BTN = { x: W / 2 + 160, y: 300, w: 620, h: 120 }, HOME_BTN = { x: W - 110, y: 230, w: 150, h: 64 };
function introSteps() {
  const k = kind(), z = [ZONE[0] * S - 24, (GY - 78) * S - 24, (ZONE[1] - ZONE[0]) * S + 48, 86 * S + 48], bt = [btnX(0) - BTN_R - 22, BTN_Y - BTN_R - 22, btnX(3) - btnX(0) + BTN_R * 2 + 44, BTN_R * 2 + 44];
  const meter = [640, 36, 560, 70];
  if (k === 'quiz') { const L = lv(), qb = [QBTN[0].x - QBTN[0].w / 2 - 20, QBTN[0].y - QBTN[0].h / 2 - 20, QBTN[1].x - QBTN[0].x + QBTN[0].w + 40, QBTN[0].h + 40];
    return [[z, (L.id === 'l1' ? '蚊子和題目牌' : '題目牌') + '會從左邊過來，走進這個框框'], [qb, '想一想，按「' + L.btns[0].k + '」或「' + L.btns[1].k + '」回答'], [meter, '答錯或來不及，蚊子會變多；滿 10 隻就失敗！']]; }
  if (k === 'l3') return [[z, '容器會從左邊過來，走進這個框框'], [bt, '上面會提示，按「發光」的按鈕出招'], [meter, '按錯或漏掉，蚊子會變多；滿 10 隻就失敗！']];
  const [bx, by] = bossPos();
  return [[[(bx - 90) * S, (by - 60) * S, 210 * S, 130 * S], '超級斑蚊會從天上丟下積水容器'], [z, '容器走進框框時，按「發光」的招式處理'], [[740, 96, 420, 74], '每招做對 2 次，集滿這四顆光球'],
    [[BEAM_BTN.x - BEAM_BTN.w / 2 - 20, BEAM_BTN.y - BEAM_BTN.h / 2 - 20, BEAM_BTN.w + 40, BEAM_BTN.h + 40], '光球集滿 → 按「合體光束」，貨車發射光束！', 'beam'],
    [[SPRAY_BTN.x - SPRAY_BTN.r - 20, SPRAY_BTN.y - SPRAY_BTN.r - 20, SPRAY_BTN.r * 2 + 40, SPRAY_BTN.r * 2 + 40], '魔王衝過來前出現警告 → 按「噴藥」擋住！']];
}
function introNext() { G.istep++; G.istepT = G.t; SFX.tap(); if (G.istep >= introSteps().length) { G.intro = G.t; G.nextSpawn = .2; if (kind() === 'boss') G.nextAtk = MODE === 'hard' ? 6 : 8; else prefill(); say('開始！', GOLD, 1.2); } }
function prefill() { const k = kind(), gap = k === 'quiz' ? 128 : 80; let x = ZONE[0] - 45;
  while (x > -30 && G.spawnI < G.total) { const q = G.queue[G.spawnI]; G.items.unshift(k === 'quiz' ? { id: G.spawnI, q, x, done: null } : { id: G.spawnI, type: q.type, hidden: q.hidden, x, done: null }); G.spawnI++; x -= gap; }
  G.nextSpawn = (x + 30 + gap) / G.speed; }

// ---------- 繪製：世界 ----------
function drawWorld() {
  l = L0; l.setTransform(1, 0, 0, 1, 0, 0); l.imageSmoothingEnabled = false;
  for (let y = 0; y < 445 + YO; y += 2) { const p = y / (445 + YO); l.fillStyle = `rgb(${Math.round(lerp(5, 22, p))},${Math.round(lerp(9, 40, p))},${Math.round(lerp(12, 44, p))})`; l.fillRect(0, y, LW, 2); }
  STARS.forEach((s, i) => { if ((Math.floor(T * 3 + i) % 5)) { l.fillStyle = 'rgba(240,235,210,.8)'; l.fillRect(s[0], s[1], 1, 1); } });
  l.fillStyle = '#efe6c4'; l.beginPath(); l.arc(560, 40, 18, 0, 7); l.fill(); l.fillStyle = '#cfc4a0'; l.beginPath(); l.arc(554, 35, 4, 0, 7); l.fill(); l.beginPath(); l.arc(565, 43, 5, 0, 7); l.fill();
  const sc = G && state !== 'title' ? G.scroll : T * 24, tile = (im, f) => { const o = ((sc * f) % im.width + im.width) % im.width; for (let x = o - im.width; x < LW; x += im.width) l.drawImage(im, x, YO); };
  tile(FAR, .5); tile(CITY, 1); l.fillStyle = '#05090a'; l.fillRect(0, 484 + YO, LW, LH - 484 - YO);
}
function drawItem(it) {
  const ty = it.type, base = it.fall !== undefined && it.fall < 1 ? lerp(it.fy, GY - 1, it.fall * it.fall) : GY - 1, x = it.x; let k = 2.2;
  l.save(); l.translate(Math.round(x), base);
  if (it.done === '清') { const p = clamp((G.t - it.doneT) / .55); if (p >= 1) { l.restore(); return; } l.translate(lerp(0, TRUCKX + 110 - x, p), lerp(0, -80, p) - 70 * Math.sin(p * Math.PI)); l.rotate(p * 9); k *= 1 - p * .4; }
  if (it.done === '倒') { l.translate(-6 * k, 0); l.rotate(-1.4 * eOut(clamp((G.t - it.doneT) / .35))); l.translate(6 * k, 0); }
  l.scale(k, k);
  if (it.hidden && !it.revealed) { l.fillStyle = '#121a19'; l.beginPath(); l.ellipse(0, -7, 11, 8, 0, 0, 7); l.fill(); l.fillStyle = '#1f2b29'; l.fillRect(-9, -6, 18, 6); l.restore(); return; }
  const wig = Math.floor(T * 8) % 2, larv = (x0, y0, n) => { if (it.done) return; l.fillStyle = '#1a1208'; for (let i = 0; i < n; i++) l.fillRect(x0 + i * 3, y0 + ((i + wig) % 2), 1, 2); };
  if (ty === 'bucket') { l.fillStyle = '#3d78b8'; l.beginPath(); l.moveTo(-5, 0); l.lineTo(5, 0); l.lineTo(6, -12); l.lineTo(-6, -12); l.fill(); l.fillStyle = '#6aa4dc'; l.fillRect(-6, -12, 12, 1);
    l.strokeStyle = '#8fb8d8'; l.lineWidth = 1; l.beginPath(); l.arc(0, -12, 6, Math.PI, 0); l.stroke(); if (it.done !== '倒') { l.fillStyle = '#4f9cc8'; l.fillRect(-5, -11, 10, 2); larv(-4, -11, 3); } }
  if (ty === 'basin') { l.fillStyle = '#c84040'; l.beginPath(); l.moveTo(-8, 0); l.lineTo(8, 0); l.lineTo(10, -6); l.lineTo(-10, -6); l.fill(); l.fillStyle = '#e06060'; l.fillRect(-10, -6, 20, 1);
    if (it.done !== '倒') { l.fillStyle = '#4f9cc8'; l.fillRect(-9, -5, 18, 2); larv(-7, -5, 4); } }
  if (ty === 'tire') { l.fillStyle = '#0c0c0c'; l.beginPath(); l.arc(0, -7, 7, 0, 7); l.fill(); l.fillStyle = '#3a3a3a'; l.beginPath(); l.arc(0, -7, 3, 0, 7); l.fill(); l.fillStyle = '#4f9cc8'; l.fillRect(-3, -6, 6, 2); larv(-3, -7, 2); }
  if (ty === 'cans') { l.fillStyle = '#b8c0c0'; l.fillRect(-8, -6, 4, 6); l.fillStyle = '#c03030'; l.fillRect(-2, -6, 4, 6); l.fillStyle = 'rgba(180,230,240,.8)'; l.fillRect(4, -10, 4, 10); l.fillStyle = '#3080c0'; l.fillRect(4, -10, 4, 1); l.fillStyle = '#4f9cc8'; l.fillRect(4, -4, 4, 2); }
  if (ty === 'saucer') { l.fillStyle = '#7a4a2e'; l.fillRect(-9, -2, 18, 2); l.fillStyle = '#b8603c'; l.beginPath(); l.moveTo(-5, -2); l.lineTo(5, -2); l.lineTo(6, -11); l.lineTo(-6, -11); l.fill();
    l.fillStyle = '#2f6a40'; l.fillRect(-4, -18, 3, 7); l.fillRect(1, -20, 3, 9); if (it.done !== '刷') { l.fillStyle = '#4f9cc8'; l.fillRect(-9, -3, 3, 1); l.fillRect(6, -3, 3, 1); l.fillStyle = '#100c08'; [-8, -3, 2, 7].forEach(e => l.fillRect(e, -3, 1, 1)); } }
  if (ty === 'vase') { l.fillStyle = '#4a8ab0'; l.beginPath(); l.moveTo(-4, 0); l.lineTo(4, 0); l.lineTo(5, -10); l.lineTo(3, -15); l.lineTo(-3, -15); l.lineTo(-5, -10); l.fill(); l.fillStyle = '#3f8a50'; l.fillRect(-1, -24, 2, 9); l.fillRect(-4, -22, 3, 2); l.fillRect(1, -20, 3, 2);
    if (it.done !== '刷') { l.fillStyle = '#100c08'; [-3, 0, 3].forEach(e => l.fillRect(e, -13, 1, 1)); } }
  if (it.done === '刷') { const p = clamp((G.t - it.doneT) / .8); if (p < 1) { l.strokeStyle = 'rgba(240,250,255,.9)'; l.lineWidth = .6; for (let i = 0; i < 6; i++) { l.beginPath(); l.arc(-8 + i * 3, -6 - p * 14 - (i % 2) * 4, 1.2, 0, 7); l.stroke(); } } }
  l.restore();
  if (it.done === '倒') { const p = G.t - it.doneT; if (p < 1.2) { const r = rng(it.id * 7); for (let i = 0; i < 26; i++) { const a = p - r() * .5; if (a < 0 || a > .45) continue; l.fillStyle = r() < .5 ? '#6ec0f0' : '#bfe6ff'; l.fillRect(Math.round(x - 14 - a * 40 - r() * 6), Math.round(base - 8 + a * 25 + 40 * a * a), 1, 2); }
    l.fillStyle = `rgba(90,170,220,${.6 * (1 - p / 1.2)})`; l.fillRect(Math.round(x - 30), base + 1, 22, 2); } }
}
function drawTruck() { if (!SPR.truck) return; l = L1; const bob = Math.floor(T * 12) % 2 ? -.6 : 0; l.save(); l.translate(TRUCKX + 75, GY + bob); l.drawImage(SPR.truck, -75, -SPR.truckH, 150, SPR.truckH);
  const wa = (G && state !== 'title' ? G.scroll : T * 24) / 11; for (const wx of [29.9, 110.9]) { const cx = wx - 75, cy = -9.6; l.fillStyle = '#c9ced2'; l.beginPath(); l.arc(cx, cy, 4.6, 0, 7); l.fill(); l.fillStyle = '#8d959b'; l.beginPath(); l.arc(cx, cy, 3.2, 0, 7); l.fill();
    l.fillStyle = '#2a2f33'; for (let k = 0; k < 4; k++) { const q = -wa + k * 1.571; l.fillRect(cx + Math.cos(q) * 2.6 - .6, cy + Math.sin(q) * 2.6 - .6, 1.3, 1.3); } }
  l.restore();
  l.save(); l.globalCompositeOperation = 'lighter'; const gr = l.createLinearGradient(TRUCKX, 0, TRUCKX - 110, 0); gr.addColorStop(0, 'rgba(255,230,150,.3)'); gr.addColorStop(1, 'rgba(255,230,150,0)'); l.fillStyle = gr;
  l.beginPath(); l.moveTo(TRUCKX + 2, GY - 36); l.lineTo(TRUCKX - 110, GY - 50); l.lineTo(TRUCKX - 110, GY + 4); l.closePath(); l.fill(); l.restore(); }
function drawMosq(x, y, t, sc = 1, seed = 0, flip = false, culex = false) { const a = culex ? SPR.culex : SPR.mosq, b = culex ? SPR.culex2 : SPR.mosq_down; if (!a) return; const im = (Math.floor(t * 24) + seed) % 2 ? a : b, w = 24 * sc, h = w * im.height / im.width;
  l.save(); l.translate(x, y); l.scale(flip ? -1 : 1, 1); l.drawImage(im, -w / 2, -h / 2, w, h); l.restore(); }
function drawBoss() { if (!SPR.boss) return; const [x, y] = bossPos(), im = Math.floor(T * 20) % 2 ? SPR.boss : SPR.boss2, w = 230, h = w * im.height / im.width;
  l.save(); l.translate(x, y); if (G.dead) { l.globalAlpha = Math.max(0, 1 - (G.t - G.dead) / 1.2); l.rotate((G.t - G.dead) * 2); }
  if ((G.beam && G.t - G.beam.t > .9 && G.t - G.beam.t < 1.5 && Math.floor(G.t * 16) % 2) || G.t - G.sprayT < .15) l.filter = 'brightness(2.4)';
  else if (warning() && Math.floor(G.t * 8) % 2) l.filter = 'sepia(1) saturate(4) hue-rotate(-40deg)';
  l.drawImage(im, -w * .45, -h / 2, w, h); l.restore();
  if (!G.dead) for (let i = 0; i < 4; i++) { const a = G.t * 1.5 + i * 1.57; drawMosq(x + Math.cos(a) * 95, y + 30 + Math.sin(a) * 30, T, .9, i, Math.cos(a) > 0); } }
function manPose() {
  if (state === 'win') return Math.floor(T * 3) % 2 ? 'wave' : 'cheer'; if (state === 'lose') return 'kneel'; if (state !== 'play') return 'idle0';
  if (kind() === 'boss') { if (G.beam && G.t - G.beam.t < 1.8) return 'raise' + (Math.floor(G.t * 6) % 2); if (G.t - G.hurtT < .4) return 'hurt'; if (G.t - G.sprayT < .5) return 'spray' + (Math.floor(G.t * 12) % 2); }
  if (G.act && G.t - G.act.t < .45) { if (kind() === 'quiz') return 'point'; return { '巡': 'light0', '倒': 'point', '清': 'point', '刷': Math.floor(G.t * 10) % 2 ? 'brush0' : 'brush1' }[G.act.k]; }
  if (G.t < G.intro) return 'idle0'; return 'walk' + (Math.floor(G.t * 10) % 4);
}
function drawMan() { l = L2; const p = manPose(), f = MAN[p] || MAN.idle0; if (!f) return; let y = GY; if (p === 'cheer') y -= Math.abs(Math.sin(T * 6)) * 10; l.drawImage(f.cv, Math.round(MANX - f.ax), Math.round(y - f.ay)); }

// ---------- 繪製：高解析 UI ----------
function txt(s, x, y, { size = 40, col = CR, w = 900, align = 'center', stroke = null, slw = 8, alpha = 1, scale = 1, maxW = 0 } = {}) {
  if (alpha <= 0 || scale <= 0) return; g.save(); g.translate(x, y); g.scale(scale, scale); g.globalAlpha *= alpha; let sz = size; g.font = `${w} ${sz}px ${FONT}`;
  if (maxW) { const m = g.measureText(s).width; if (m > maxW) { sz *= maxW / m; g.font = `${w} ${sz}px ${FONT}`; } }
  g.textAlign = align; g.textBaseline = 'middle'; if (stroke) { g.lineJoin = 'round'; g.strokeStyle = stroke; g.lineWidth = slw; g.strokeText(s, 0, 0); } g.fillStyle = col; g.fillText(s, 0, 0); g.restore(); }
function pbox(x, y, w, h, { fill = 'rgba(8,12,13,.93)', stroke = CR, lw = 4 } = {}) { g.fillStyle = fill; g.fillRect(x + lw, y + lw, w - 2 * lw, h - 2 * lw); g.fillStyle = stroke;
  g.fillRect(x + lw, y, w - 2 * lw, lw); g.fillRect(x + lw, y + h - lw, w - 2 * lw, lw); g.fillRect(x, y + lw, lw, h - 2 * lw); g.fillRect(x + w - lw, y + lw, lw, h - 2 * lw); }
function rrect(x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function bar(x, y, w, h, f, col) { g.fillStyle = '#1b2422'; g.fillRect(x, y, w, h); g.fillStyle = col; const n = 30; for (let i = 0; i < Math.round(clamp(f) * n); i++) g.fillRect(x + 4 + i * (w - 8) / n, y + 4, (w - 8) / n - 4, h - 8); }
function button(b, label, sub, col, { glow = false, pressed = false, dim = false } = {}) {
  g.save(); g.translate(b.x, b.y); if (pressed) g.scale(.93, .93);
  if (glow) { g.globalAlpha = .45 + .35 * Math.sin(T * 10); g.fillStyle = col; g.fillRect(-b.w / 2 - 18, -b.h / 2 - 18, b.w + 36, b.h + 36); g.globalAlpha = 1; }
  g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(-b.w / 2 + 6, -b.h / 2 + 8, b.w, b.h); pbox(-b.w / 2, -b.h / 2, b.w, b.h, { stroke: dim ? '#3a4a46' : col, fill: 'rgba(8,12,13,.96)', lw: 7 });
  txt(label, 0, sub ? -14 : 2, { size: sub ? 56 : 46, col: dim ? '#55625e' : col, maxW: b.w - 30 }); if (sub) txt(sub, 0, 44, { size: 26, col: '#b9c4bc', w: 700, maxW: b.w - 30 }); g.restore(); }
const hit = (b, x, y, pad = 10) => b.r ? Math.hypot(x - b.x, y - b.y) < b.r + pad : Math.abs(x - b.x) < b.w / 2 + pad && Math.abs(y - b.y) < b.h / 2 + pad;
function wantIndex() {
  if (!G || state !== 'play' || G.t < G.intro) return -1; const it = zoneItem(); if (!it) return -1; const k = kind();
  if (k === 'quiz') return MODE === 'normal' && G.t - (it.zoneT || G.t) > 1.0 ? it.q.a : -1;
  return ACTS.findIndex(a => a.k === (it.hidden && !it.revealed ? '巡' : TYPES[it.type].act)); }
function drawButtons() {
  if (!G || state === 'title') return; const k = kind(), want = wantIndex();
  if (k === 'quiz') { lv().btns.forEach((b, i) => button(QBTN[i], b.k, b.sub, b.col, { glow: want === i, pressed: G.act && G.act.i === i && G.t - G.act.t < .15 })); }
  else ACTS.forEach((a, i) => { if (want === i) { g.save(); g.globalAlpha = .45 + .35 * Math.sin(T * 10); g.fillStyle = a.col; g.beginPath(); g.arc(btnX(i), BTN_Y, BTN_R + 22, 0, 7); g.fill(); g.restore(); }
    const x = btnX(i), pressed = G.act && G.act.k === a.k && G.t - G.act.t < .15; g.save(); g.translate(x, BTN_Y); if (pressed) g.scale(.9, .9); g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.arc(6, 10, BTN_R, 0, 7); g.fill();
    g.fillStyle = a.col; g.beginPath(); g.arc(0, 0, BTN_R, 0, 7); g.fill(); g.fillStyle = '#0a0d0e'; g.beginPath(); g.arc(0, 0, BTN_R - 14, 0, 7); g.fill();
    txt(a.k, 0, -8, { size: 84, col: a.col }); txt(a.sub, 0, 46, { size: 24, col: '#c9d2cb', w: 700 }); g.restore(); });
  if (k === 'boss') { const b = SPRAY_BTN, pr = G.t - G.sprayT < .15, wn = warning();
    if (wn) { g.save(); g.globalAlpha = .5 + .4 * Math.sin(T * 14); g.fillStyle = GREEN; g.beginPath(); g.arc(b.x, b.y, b.r + 26, 0, 7); g.fill(); g.restore(); }
    g.save(); g.translate(b.x, b.y); if (pr) g.scale(.9, .9); g.fillStyle = wn ? GREEN : '#6f7d78'; g.beginPath(); g.arc(0, 0, b.r, 0, 7); g.fill(); g.fillStyle = '#0a0d0e'; g.beginPath(); g.arc(0, 0, b.r - 10, 0, 7); g.fill();
    txt('噴藥', 0, -4, { size: 36, col: wn ? GREEN : '#c9d2cb' }); txt('(T)', 0, 34, { size: 20, col: '#7c8a85', w: 600 }); g.restore();
    if (orbsFull() && !G.beam && !G.dead && state === 'play') { const p = 1 + .06 * Math.sin(T * 9); g.save(); g.translate(BEAM_BTN.x, BEAM_BTN.y); g.scale(p, p);
      pbox(-BEAM_BTN.w / 2, -BEAM_BTN.h / 2, BEAM_BTN.w, BEAM_BTN.h, { stroke: GOLD, fill: 'rgba(40,30,0,.95)', lw: 8 }); txt('★ 合體光束！ ★', 0, 2, { size: 64, col: GOLD }); g.restore(); } }
  if (state === 'play') button(HOME_BTN, '主畫面', '', GREY);
}
function drawHUD() {
  const k = kind(), L = lv();
  if (k === 'boss') { pbox(24, 22, W - 48, 150, { stroke: RED });
    txt('魔王關　超級斑蚊' + (MODE === 'hard' ? '（困難）' : '（一般）'), 56, 62, { size: 36, col: MODE === 'hard' ? RED : GOLD, align: 'left' });
    txt('魔王', 640, 62, { size: 32, col: RED, align: 'left' }); bar(730, 44, 1130, 38, G.bossHP / 100, RED);
    txt('體力', 56, 132, { size: 32, col: GREEN, align: 'left' }); bar(140, 114, 460, 38, G.hp / 100, G.hp < 30 && Math.floor(T * 6) % 2 ? '#fff' : GREEN);
    txt('光球', 660, 132, { size: 32, col: GOLD, align: 'left' });
    ACTS.forEach((a, i) => { const x = 790 + i * 100, y = 132, f = G.orbs[a.k] / 2; g.fillStyle = '#1b2422'; g.beginPath(); g.arc(x, y, 32, 0, 7); g.fill();
      if (f > 0) { g.fillStyle = a.col; g.beginPath(); g.moveTo(x, y); g.arc(x, y, 32, -Math.PI / 2, -Math.PI / 2 + f * 6.2832); g.fill(); }
      g.fillStyle = '#0a0d0e'; g.beginPath(); g.arc(x, y, 23, 0, 7); g.fill(); txt(a.k, x, y + 2, { size: 28, col: f > 0 ? a.col : '#55625e' }); });
    txt(orbsFull() ? '光球集滿！按「合體光束」！' : '每招做對 2 次，集滿四顆光球', W - 56, 132, { size: 30, col: orbsFull() ? GOLD : '#b9c4bc', align: 'right', w: 700 }); }
  else { pbox(24, 22, W - 48, 96, { stroke: GREEN });
    txt(L.name + '　' + L.title + (MODE === 'hard' ? '（困難）' : '（一般）'), 56, 70, { size: 36, col: MODE === 'hard' ? RED : GREEN, align: 'left', maxW: 500 });
    txt('分數 ' + G.score, W - 56, 52, { size: 38, col: CR, align: 'right' }); txt('蚊子', 580, 70, { size: 34, col: RED, align: 'left' });
    for (let i = 0; i < 10; i++) { const x = 670 + i * 52, on = i < G.mosq; g.fillStyle = on ? RED : '#22302e'; g.fillRect(x, 50, 40, 40); if (on) txt('🦟', x + 20, 71, { size: 28, w: 400 }); }
    const left = k === 'l3' ? G.total - G.good - G.missed : G.total - G.good - G.bad - G.missed;
    txt('剩 ' + Math.max(0, left) + (k === 'l3' ? ' 個容器' : ' 題'), W - 56, 94, { size: 28, col: '#b9c4bc', align: 'right', w: 700 }); }
  if (G.combo >= 2) txt('連擊 ×' + G.combo, k === 'boss' ? 1500 : W / 2, k === 'boss' ? 230 : 190, { size: 52, col: GOLD, stroke: '#3a2a00', slw: 10 });
  const it = zoneItem(), zx = (ZONE[0] + ZONE[1]) / 2 * S; g.save(); g.globalAlpha = .35 + .2 * Math.sin(T * 6); g.strokeStyle = it ? GOLD : '#4a5a56'; g.lineWidth = 6; g.setLineDash([18, 12]);
  g.strokeRect(ZONE[0] * S, (GY - 78) * S, (ZONE[1] - ZONE[0]) * S, 86 * S); g.restore();
  if (it && G.t >= G.intro) { let label, col;
    if (k === 'quiz') { label = L.ask; col = GOLD; }
    else { const hid = it.hidden && !it.revealed, a = ACTS.find(x => x.k === (hid ? '巡' : TYPES[it.type].act)); label = (hid ? '看不清楚' : TYPES[it.type].name) + ' → 按「' + a.k + '」！'; col = a.col; }
    const bw = 560, bx = clamp(zx - bw / 2, 20, W - bw - 20), by = (GY - 78) * S - (k === 'quiz' ? 330 : 150), pul = 1 + .05 * Math.sin(T * 10);
    g.save(); g.translate(bx + bw / 2, by + 50); g.scale(pul, pul); pbox(-bw / 2, -50, bw, 100, { stroke: col, fill: 'rgba(8,12,13,.95)', lw: 6 }); txt(label, 0, 2, { size: 50, col, maxW: bw - 40 }); g.restore(); }
  const tw = k === 'boss' ? 880 : k === 'quiz' ? 1000 : 1010;
  if (G.tip && G.t - G.tip.t < G.tip.dur) { const a = clamp((G.t - G.tip.t) / .15) * (1 - clamp((G.t - G.tip.t - G.tip.dur + .3) / .3)); g.save(); g.globalAlpha = a;
    pbox(30, 930, tw, 120, { stroke: G.tip.col }); txt(G.tip.text, 30 + tw / 2, 990, { size: 42, col: G.tip.col, maxW: tw - 50 }); g.restore(); }
  else txt(k === 'boss' ? '處理魔王丟下的容器，集滿光球！' : k === 'quiz' ? '題目牌進框框時回答！' : '容器走進虛線框時，按對的招式！', 30 + tw / 2, 990, { size: 38, col: GREY, w: 700 });
}
function wrap2(t) { if (t.length <= 8) return [t]; const mid = t.length / 2; let best = -1;
  for (let i = 1; i < t.length - 1; i++) if ('，、 '.includes(t[i]) && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  if (best > 1 && Math.abs(best - mid) <= 4) return [t.slice(0, best + (t[best] === ' ' ? 0 : 1)).trim(), t.slice(best + 1).trim()];
  let h = Math.ceil(mid); while (h < t.length - 1 && /[0-9°A-Za-z]/.test(t[h])) h++; return [t.slice(0, h), t.slice(h)]; }
function drawQuizItems() {
  G.items.forEach(it => { const q = it.q, x = it.x * S, p = it.done ? clamp((G.t - it.doneT) / .7) : 0;
    if (q.mos) { const fly = it.done ? (q.mos === 'aedes' && it.done === 'ok' ? [-p * 500, -p * 420, p * 14] : [p * 120, -p * 380, 0]) : [0, 0, 0];
      const y = (GY - 55) * S + Math.sin(G.t * 5 + it.id) * 18 + fly[1]; g.save(); g.translate(x + fly[0], y); g.rotate(fly[2]); g.globalAlpha = 1 - p * .6;
      const a = q.mos === 'culex' ? SPR.culex : SPR.mosq, b = q.mos === 'culex' ? SPR.culex2 : SPR.mosq_down, im = Math.floor(G.t * 24) % 2 ? a : b;
      if (im) { const w = 170, h = w * im.height / im.width; g.drawImage(im, -w / 2, -h / 2, w, h); } g.restore();
      if (it.done) txt(it.done === 'ok' ? '⭕' : '❌', x, (GY - 90) * S, { size: 80, w: 400, alpha: 1 - p * .3 }); return; }
    const bw = 330, bh = 200, by = (GY - 10) * S - bh - 120;
    g.save(); g.globalAlpha = 1 - p * .5; g.fillStyle = '#4a5552'; g.fillRect(x - 6, by + bh, 12, (GY - 2) * S - (by + bh)); pbox(x - bw / 2, by, bw, bh, { stroke: it.done === 'ok' ? GREEN : it.done === 'bad' ? RED : CR, fill: 'rgba(14,20,21,.97)', lw: 6 });
    txt(q.e, x, by + 56, { size: 60, w: 400 }); const lines = wrap2(q.t);
    lines.forEach((s, i) => txt(s, x, by + 120 + i * 44 - (lines.length - 1) * 10, { size: 36, col: CR, maxW: bw - 30 }));
    if (it.done) txt(it.done === 'ok' ? '⭕' : '❌', x + bw / 2 - 30, by + 30, { size: 64, w: 400 }); g.restore(); });
}
function drawFX() {
  G.fx = G.fx.filter(f => G.t - f.t < 1);
  G.fx.forEach(f => { const p = G.t - f.t; txt(f.s, clamp(f.x * S, 190, W - 190), (f.y - p * 30) * S, { size: 56, col: f.col, stroke: '#000', slw: 10, alpha: 1 - p, scale: eBack(clamp(p / .2)) }); });
  G.items.forEach(it => { if (it.hidden && it.revealed && G.t - it.revealed < .5) { const p = (G.t - it.revealed) / .5; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - p; g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(it.x * S, (GY - 10) * S, 40 + p * 80, 0, 7); g.fill(); g.restore(); } });
}
function drawBossFX() {
  const [bx, by] = bossPos(), th = SPR.truckH || 90, mx = (TRUCKX + 30) * S, my = (GY - th + 22) * S, tcx = (TRUCKX + 75) * S, tcy = (GY - th / 2) * S;
  if (warning()) { const p = G.t - G.atk.t; if (Math.floor(G.t * 8) % 2) txt('！', bx * S, (by - 62) * S, { size: 130, col: RED, stroke: '#000', slw: 12 });
    g.save(); g.fillStyle = Math.floor(G.t * 6) % 2 ? 'rgba(200,20,40,.92)' : 'rgba(90,10,20,.92)'; g.fillRect(0, 192, W, 116); g.restore();
    txt('⚠ 魔王要衝過來了！快按「噴藥」擋住！（' + Math.max(0, ATK_HIT - p).toFixed(1) + '）', W / 2, 251, { size: 56, col: '#fff', maxW: W - 80 }); }
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
function drawIntro() {
  const steps = introSteps(), st = steps[Math.min(G.istep, steps.length - 1)], [x, y, w, h] = st[0], p = clamp((G.t - G.istepT) / .25);
  if (st[2] === 'beam') { const b = BEAM_BTN; g.save(); g.translate(b.x, b.y); pbox(-b.w / 2, -b.h / 2, b.w, b.h, { stroke: GOLD, fill: 'rgba(40,30,0,.95)', lw: 8 }); txt('★ 合體光束！ ★', 0, 2, { size: 64, col: GOLD }); g.restore(); }
  g.save(); g.fillStyle = 'rgba(0,0,0,.72)'; g.beginPath(); g.rect(0, 0, W, H); rrect(x, y, w, h, 24); g.fill('evenodd');
  g.strokeStyle = GOLD; g.lineWidth = 8 + 3 * Math.sin(T * 8); g.globalAlpha = .6 + .4 * Math.sin(T * 8); g.beginPath(); rrect(x, y, w, h, 24); g.stroke(); g.restore();
  g.font = '900 52px ' + FONT; const tw = Math.min(1300, g.measureText(st[1]).width + 100), bh = 150, below = y + h / 2 < H / 2;
  const bx = clamp(x + w / 2 - tw / 2, 30, W - tw - 30), byy = below ? Math.min(H - bh - 20, y + h + 30) : Math.max(20, y - bh - 30);
  g.save(); g.globalAlpha = p; g.translate(0, (1 - eOut(p)) * (below ? -20 : 20)); pbox(bx, byy, tw, bh, { stroke: GOLD, fill: 'rgba(8,12,13,.97)', lw: 6 });
  txt(st[1], bx + tw / 2, byy + 58, { size: 52, col: CR, maxW: tw - 60 }); txt((G.istep + 1) + ' / ' + steps.length + '　點一下 下一步 ▶', bx + tw / 2, byy + 118, { size: 28, col: GOLD, w: 700 }); g.restore();
}

// ---------- 主畫面：關卡地圖 ----------
const CARD = i => ({ x: 420 + (i % 3) * 540, y: 470 + Math.floor(i / 3) * 290, w: 500, h: 250 });
const MODE_BTN = [{ m: 'normal', x: 800, y: 250, w: 280, h: 80 }, { m: 'hard', x: 1120, y: 250, w: 280, h: 80 }], CLEAR_BTN = { x: W - 170, y: H - 50, w: 280, h: 60 };
const unlocked = i => true; // 全部關卡開放
function drawTitle() {
  g.fillStyle = 'rgba(4,7,8,.8)'; g.fillRect(0, 0, W, H);
  txt('滅蚊達人', W / 2, 120, { size: 140, col: RED, stroke: CR, slw: 12, scale: eBack(clamp(T / .5)) });
  MODE_BTN.forEach(b => { const on = MODE === b.m, col = b.m === 'hard' ? RED : GREEN; pbox(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, { stroke: on ? col : '#3a4a46', fill: on ? 'rgba(20,30,28,.96)' : 'rgba(8,12,13,.9)', lw: on ? 7 : 4 });
    txt((on ? '▶ ' : '') + (b.m === 'hard' ? '困難模式' : '一般模式'), b.x, b.y + 2, { size: 40, col: on ? col : '#6d7a73' }); });
  LEVELS.forEach((L, i) => { const b = CARD(i), op = unlocked(i), st = bestStars(L.id, MODE), col = L.kind === 'boss' ? RED : [CYAN, PINK, GREEN, GOLD, '#b8a2ff'][i];
    const pul = op && !cleared(L.id) ? 1 + .03 * Math.sin(T * 5) : 1; g.save(); g.translate(b.x, b.y); g.scale(pul, pul);
    pbox(-b.w / 2, -b.h / 2, b.w, b.h, { stroke: op ? col : '#3a4a46', fill: op ? 'rgba(10,16,17,.96)' : 'rgba(8,12,13,.85)', lw: 7 });
    txt(L.name, -b.w / 2 + 30, -b.h / 2 + 46, { size: 34, col: op ? col : '#55625e', align: 'left' });
    txt(L.title, 0, -6, { size: 64, col: op ? CR : '#55625e' });
    if (op) txt([0, 1, 2].map(k => k < st ? '★' : '☆').join(' '), 0, 76, { size: 52, col: st ? GOLD : '#4a5a56' }); else txt('🔒 先過' + LEVELS[i - 1].name, 0, 76, { size: 34, col: '#6d7a73', w: 700 });
    g.restore(); });
  txt('進度會自動存在這台手機／電腦的瀏覽器　電腦：1～6 選關、M 切換模式', 700, H - 50, { size: 26, col: GREY, w: 600 });
  const armed = T - clearArm < 3; pbox(CLEAR_BTN.x - CLEAR_BTN.w / 2, CLEAR_BTN.y - CLEAR_BTN.h / 2, CLEAR_BTN.w, CLEAR_BTN.h, { stroke: armed ? RED : '#3a4a46', fill: 'rgba(8,12,13,.9)' });
  txt(armed ? '再按一次確認清除' : '清除存檔', CLEAR_BTN.x, CLEAR_BTN.y + 2, { size: 28, col: armed ? RED : '#6d7a73', maxW: CLEAR_BTN.w - 20 });
}
// ---------- 結算畫面 ----------
const endBtns = () => { const win = state === 'win', hasNext = LVI < LEVELS.length - 1;
  return win ? [hasNext ? { id: 'next', x: 520, y: 650, w: 460, h: 110, label: '下一關 ▶', col: GOLD } : { id: 'home', x: 520, y: 650, w: 460, h: 110, label: '全部破關！回主畫面', col: GOLD },
    { id: 'retry', x: 330, y: 800, w: 340, h: 96, label: '再玩一次', col: CYAN }, { id: 'home', x: 710, y: 800, w: 340, h: 96, label: '回主畫面', col: GREY }]
    : [{ id: 'retry', x: 330, y: 680, w: 340, h: 110, label: '再玩一次', col: CYAN }, { id: 'home', x: 710, y: 680, w: 340, h: 110, label: '回主畫面', col: GREY }]; };
function drawEnd() {
  const win = state === 'win', k = kind(), L = lv(), p = clamp((G.t - G.end) / .6); g.fillStyle = `rgba(4,7,8,${.85 * p})`; g.fillRect(0, 0, W, H); if (p < .3) return;
  txt(L.name + '　' + L.title + '・' + (MODE === 'hard' ? '困難' : '一般'), 520, 130, { size: 40, col: MODE === 'hard' ? RED : GREEN });
  txt(win ? (k === 'boss' ? '打倒魔王！' : '過關！') : (k === 'boss' ? '被魔王打敗了…' : '蚊子大爆發…'), 520, 250, { size: 120, col: win ? GOLD : RED, stroke: '#000', slw: 14, scale: eBack(clamp((G.t - G.end - .2) / .4)) });
  if (win) { for (let i = 0; i < 3; i++) { const sp = eBack(clamp((G.t - G.end - .6 - i * .25) / .3)); txt(i < G.stars ? '★' : '☆', 520 + (i - 1) * 170, 430, { size: 150, col: i < G.stars ? GOLD : '#3a4a46', scale: sp }); }
    txt(G.saved ? '✓ 已存檔' : '（這台裝置無法存檔）', 520, 545, { size: 30, col: G.saved ? GREEN : GREY, w: 700 }); }
  else txt('別灰心，再試一次！', 520, 430, { size: 50, col: CR });
  const acc = G.good + G.bad + G.missed ? Math.round(G.good / (G.good + G.bad + G.missed) * 100) : 0;
  pbox(1000, 120, 820, 520, { stroke: CR });
  (k === 'boss' ? [['合體光束', G.beams + ' 次'], ['做對', G.good + ' 次'], ['按錯', G.bad + ' 次'], ['漏掉', G.missed + ' 個'], ['剩餘體力', G.hp], ['用時', Math.round(G.end) + ' 秒']]
    : [['分數', G.score], [k === 'quiz' ? '答對' : '做對', G.good + (k === 'quiz' ? ' 題' : ' 次')], [k === 'quiz' ? '答錯' : '按錯', G.bad + (k === 'quiz' ? ' 題' : ' 次')], ['漏掉', G.missed + (k === 'quiz' ? ' 題' : ' 個')], ['最高連擊', G.best], ['正確率', acc + '%']])
    .forEach(([a, b], i) => { txt(a, 1070, 190 + i * 76, { size: 44, col: '#b9c4bc', align: 'left', w: 700 }); txt(String(b), 1750, 190 + i * 76, { size: 48, col: CR, align: 'right' }); });
  pbox(1000, 670, 820, 200, { stroke: GREEN }); txt('記住：', 1410, 710, { size: 40, col: GREEN }); txt(L.lesson[0], 1410, 768, { size: 42, col: CR, maxW: 780 }); txt(L.lesson[1], 1410, 828, { size: 42, col: CR, maxW: 780 });
  if (G.t - G.end > .9) endBtns().forEach(b => button(b, b.label, '', b.col));
}

// ---------- 主迴圈 ----------
function update(dt) {
  if (!G || state !== 'play') { if (G) G.t += dt; return; }
  G.t += dt; if (G.t < G.intro && G.t - G.istepT > 2.6) introNext();
  const k = kind(); if (k === 'l3') G.speed = MODE === 'hard' ? 46 + Math.min(30, G.t * .7) : 34 + Math.min(18, G.t * .4);
  if (G.t >= G.intro && !atkFreeze()) G.scroll += G.speed * dt;
  G.nextSpawn -= dt;
  if (k === 'boss') bossUpdate(dt);
  else if (G.nextSpawn <= 0 && G.spawnI < G.total) { const q = G.queue[G.spawnI];
    G.items.push(k === 'quiz' ? { id: G.spawnI, q, x: -40, done: null } : { id: G.spawnI, type: q.type, hidden: q.hidden, x: -24, done: null }); G.spawnI++;
    G.nextSpawn = k === 'quiz' ? 128 / G.speed : Math.max(1.4, 2.4 - G.t * .03); }
  if (G.t >= G.intro) G.items.forEach(it => { if (!atkFreeze()) it.x += G.speed * dt;
    if (!it.done && !it.zoneT && it.x > ZONE[0]) it.zoneT = G.t;
    if (!it.done && !it.missed && it.x > ZONE[1] + 2) { it.missed = true; G.missed++; G.combo = 0; SFX.miss();
      if (k === 'boss') { G.bossHP = Math.min(100, G.bossHP + 4); hurtMan(10, '漏掉了！魔王吸收積水變強了！'); }
      else if (k === 'quiz') { addMosq(2); say('來不及回答！' + it.q.why, RED, 3); }
      else { addMosq(2); say('漏掉' + (it.hidden && !it.revealed ? '一個積水容器' : TYPES[it.type].name) + '！孑孓變成蚊子了…', RED); } }
    if (it.x > LW + 70) it.gone = true; });
  G.items = G.items.filter(it => !it.gone);
  if (k !== 'boss' && state === 'play' && G.spawnI >= G.total && G.items.length === 0) finish(true);
  G.shake = Math.max(0, G.shake - dt);
}
function render() {
  if (!CITY) { g.fillStyle = '#05090a'; g.fillRect(0, 0, W, H); txt('載入中…', W / 2, H / 2, { size: 60 }); return; }
  const playing = !!(G && state !== 'title'), k = playing ? kind() : null;
  drawWorld(); if (playing && k !== 'quiz') G.items.forEach(drawItem);
  l = L1; l.setTransform(MS, 0, 0, MS, 0, 0); l.clearRect(0, 0, LW, LH); l.imageSmoothingEnabled = true; drawTruck();
  if (playing && k === 'boss') { l = L1; drawBoss(); }
  const n = playing ? (k === 'boss' ? 0 : G.mosq) : 3; l = L1; for (let i = 0; i < n; i++) drawMosq(40 + ((i * 61 + T * 30 * (i % 2 ? 1 : -1)) % 560 + 560) % 560, 110 + 30 * Math.sin(T * 2 + i * 1.7) + (i % 3) * 18, T, 1.1, i, Math.sin(T + i) < 0);
  l = L2; l.setTransform(1, 0, 0, 1, 0, 0); l.clearRect(0, 0, LW, LH); l.imageSmoothingEnabled = false; drawMan();
  if (playing && k === 'boss' && G.t - G.sprayT < .7) { const [bx, by] = bossPos(), r = rng(Math.floor(G.sprayT * 10)); for (let i = 0; i < 70; i++) { const a = (G.t - G.sprayT) - i * .006; if (a < 0 || a > .5) continue; const q = a / .5, sx = MANX - 30, sy = GY - 32;
      l.fillStyle = `rgba(210,255,220,${1 - q})`; l.fillRect(Math.round(lerp(sx, bx + 20, q * .7) + (r() - .5) * 30 * q), Math.round(lerp(sy, by + 30, q * .7) + (r() - .5) * 30 * q), 2, 2); } }
  if (playing && G.act && G.act.k === '巡' && G.t - G.act.t < .45) { l.save(); l.globalCompositeOperation = 'lighter'; l.fillStyle = 'rgba(255,230,120,.3)'; l.beginPath(); l.moveTo(MANX - 18, GY - 28); l.lineTo(ZONE[0], GY + 2); l.lineTo(ZONE[1] - 20, GY + 2); l.closePath(); l.fill(); l.restore(); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#05090a'; g.fillRect(0, 0, W, H);
  const sh = playing && G.shake > 0 ? [(Math.random() - .5) * 18, (Math.random() - .5) * 18] : [0, 0];
  g.save(); g.translate(sh[0], sh[1]); g.imageSmoothingEnabled = false; g.drawImage(lc, 0, 0, W, H); g.imageSmoothingEnabled = true; g.drawImage(mcv, 0, 0, W, H); g.imageSmoothingEnabled = false; g.drawImage(lc2, 0, 0, W, H);
  g.imageSmoothingEnabled = true; if (playing && k === 'quiz') drawQuizItems();
  if (playing && k !== 'quiz') G.items.forEach(it => { if (it.hidden && !it.revealed && !it.missed) txt('？', it.x * S, (GY - 34) * S, { size: 60, col: GOLD, stroke: '#000', slw: 8 }); });
  g.restore();
  const r = rng(17); for (let i = 0; i < 30; i++) { const x0 = r() * W, y0 = r() * 800, ph = r() * 6, a = .3 + .3 * Math.sin(T * 2.4 + ph); g.fillStyle = [GREEN, CYAN, GOLD][i % 3]; g.globalAlpha = a; g.fillRect(Math.round((x0 + Math.sin(T * .6 + ph) * 30) / 3) * 3, Math.round(((y0 - T * 12) % 800 + 800) % 800 / 3) * 3, 6, 6); } g.globalAlpha = 1;
  if (state === 'title') drawTitle();
  else if (playing) { drawFX(); if (k === 'boss') drawBossFX(); drawHUD(); drawButtons(); if (state === 'play' && G.t < G.intro) drawIntro(); if (state === 'win' || state === 'lose') drawEnd(); }
  g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
}
function frame(ts) { const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; T += dt; update(dt); render(); requestAnimationFrame(frame); }

// ---------- 操作 ----------
function audioOn() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (AC && !MASTER) { MASTER = AC.createGain(); MASTER.gain.value = 2.4; const comp = AC.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 6; MASTER.connect(comp).connect(AC.destination); }
  if (AC && AC.state === 'suspended') AC.resume(); }
function playBgm(restart) { try { bgm.volume = .5; bgm.loop = true; if (restart) { try { bgm.currentTime = 0; } catch (e) {} } const p = bgm.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
function start(i, m) { if (i !== undefined) LVI = i; if (m) MODE = m; audioOn(); playBgm(true); newGame(); }
function goHome() { state = 'title'; G = null; SFX.tap(); }
function endAction(id) { if (id === 'next') start(LVI + 1); else if (id === 'retry') start(LVI); else goHome(); }
function tryLevel(i) { if (!unlocked(i)) { SFX.bad(); return; } start(i); }
c.addEventListener('pointerdown', e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H; audioOn(); if (bgm.paused && state !== 'lose') playBgm(false);
  if (state === 'title') { for (const b of MODE_BTN) if (hit(b, x, y)) { MODE = b.m; SFX.tap(); return; }
    if (hit(CLEAR_BTN, x, y)) { if (T - clearArm < 3) { SAVE = { stars: {} }; persist(); clearArm = -9; SFX.bad(); } else { clearArm = T; SFX.tap(); } return; }
    LEVELS.forEach((L, i) => { if (hit(CARD(i), x, y)) tryLevel(i); }); return; }
  if (state === 'win' || state === 'lose') { if (G.t - G.end > .9) for (const b of endBtns()) if (hit(b, x, y)) return endAction(b.id); return; }
  if (state !== 'play') return;
  if (hit(HOME_BTN, x, y)) return goHome();
  if (G.t < G.intro) return introNext();
  const k = kind();
  if (k === 'boss') { if (hit(SPRAY_BTN, x, y, 14)) return spray(); if (orbsFull() && hit(BEAM_BTN, x, y, 20)) return fireBeam(); }
  if (k === 'quiz') { for (let i = 0; i < 2; i++) if (hit(QBTN[i], x, y, 14)) return answer(i); return; }
  for (let i = 0; i < 4; i++) if (Math.hypot(x - btnX(i), y - BTN_Y) < BTN_R + 20) return press(i); });
window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); audioOn(); if (bgm.paused && state !== 'lose') playBgm(false);
  if (state === 'title') { if (k === 'm') { MODE = MODE === 'hard' ? 'normal' : 'hard'; SFX.tap(); return; } const n = +k; if (n >= 1 && n <= 6) tryLevel(n - 1); return; }
  if (state === 'win' || state === 'lose') { if (G.t - G.end < .9) return; if ((k === 'n' || k === 'enter') && state === 'win') endAction(LVI < LEVELS.length - 1 ? 'next' : 'home'); else if (k === 'r') endAction('retry'); else if (k === 'escape' || k === 'h') endAction('home'); return; }
  if (state !== 'play') return; if (k === 'escape') return goHome();
  if (G.t < G.intro) { introNext(); return; }
  if (kind() === 'quiz') { if (['q', '1', 'a', 'arrowleft'].includes(k)) answer(0); else if (['w', '2', 's', 'arrowright'].includes(k)) answer(1); return; }
  if (kind() === 'boss') { if (k === 't') return spray(); if (k === ' ' || k === 'enter') { e.preventDefault(); return fireBeam(); } }
  ACTS.forEach((a, i) => { if (a.key.includes(k)) press(i); }); });

// 測試用：主控台可手動推進
window.__dbg = { step: (dt = 1 / 30, n = 1) => { for (let i = 0; i < n; i++) { T += dt; update(dt); } render(); }, start, press, answer, spray, fireBeam, goHome, endAction, skipIntro: () => { while (G && G.t < G.intro) introNext(); },
  get: () => ({ state, level: G && lv().id, mode: MODE, t: G && G.t, score: G && G.score, mosq: G && G.mosq, good: G && G.good, bad: G && G.bad, missed: G && G.missed, hp: G && G.hp, bossHP: G && G.bossHP, full: orbsFull(), warning: warning(), stars: G && G.stars, save: JSON.stringify(SAVE),
    zone: (() => { const it = G && state === 'play' && zoneItem(); if (!it) return null; return it.q ? { a: it.q.a } : { act: it.hidden && !it.revealed ? '巡' : TYPES[it.type].act }; })() }) };

(async () => {
  requestAnimationFrame(frame);
  const names = ['truck', 'mosq', 'mosq_down', 'px_walk', 'px_work', 'px_cheer', 'px_battle', 'boss_up', 'boss_down', 'px_spray'];
  const [tr, mq, md, pw, pk, pc, pb, bu, bd, ps] = await Promise.all(names.map(n => loadImg('img/' + n + '.png')));
  { const cv = cut(tr, 230), cr = crop(cv, bbox(cv)); SPR.truckH = 150 * cr.height / cr.width; SPR.truck = pix(cr, Math.round(150 * MS), Math.round(SPR.truckH * MS), { hard: false }); }
  [SPR.mosq, SPR.mosq_down] = pairSprite(mq, md, 36); [SPR.boss, SPR.boss2] = pairSprite(bu, bd, 230);
  const CF = 'grayscale(1) sepia(1) saturate(2.6) hue-rotate(-15deg) brightness(.82) contrast(.75)'; SPR.culex = tinted(SPR.mosq, CF); SPR.culex2 = tinted(SPR.mosq_down, CF);
  sliceSheet(pw, ['idle0', 'walk0', 'walk1', 'walk2', 'walk3']); sliceSheet(pk, ['_', 'light0', 'point', 'brush0', 'brush1']);
  sliceSheet(pc, ['_', 'wave', 'cheer', 'thumbs']); sliceSheet(pb, ['_', 'raise0', 'raise1', 'hurt', 'kneel']); sliceSheet(ps, ['_', 'spray0', 'spray1']);
  CITY = genCity(); FAR = genFar(); state = 'title';
})();
})();
