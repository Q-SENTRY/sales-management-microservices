(() => {
'use strict';

/* ================= Almacenamiento ================= */
const KEY = 'forma.v1';
const DEF_MACHINES = ['Prensa de piernas', 'Extensión de cuádriceps', 'Curl femoral', 'Sentadilla (Multipower)', 'Jalón al pecho', 'Remo sentado', 'Press de pecho', 'Aperturas (Pec deck)', 'Press de hombro', 'Polea tríceps', 'Curl de bíceps', 'Abdominales', 'Cinta de correr', 'Elíptica', 'Bicicleta'];
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
let db = load() || {
  profile: { name: '', weight: 70, height: 170, goal: 'mantener', stepGoal: 8000, gymDays: 4 },
  days: {}, machines: DEF_MACHINES.slice(), plan: [], timer: null
};
// Completa campos que faltan (versiones antiguas o respaldos importados)
function migrate(o) {
  o = o && typeof o === 'object' ? o : {};
  o.profile = Object.assign({ name: '', weight: 70, height: 170, goal: 'mantener', stepGoal: 8000, gymDays: 4, age: 25, sex: 'h' }, o.profile || {});
  if (!['definir', 'mantener', 'volumen'].includes(o.profile.goal)) o.profile.goal = 'mantener';
  for (const [f, lo, hi, def] of [['weight', 30, 300, 70], ['height', 120, 230, 170], ['stepGoal', 1000, 50000, 8000], ['gymDays', 1, 7, 4], ['age', 12, 100, 25]]) {
    const v = +o.profile[f]; o.profile[f] = v >= lo && v <= hi ? v : def;
  }
  o.days = o.days && typeof o.days === 'object' ? o.days : {};
  for (const d of Object.values(o.days)) {
    d.gym = !!d.gym; d.water = Math.max(0, +d.water || 0); d.steps = Math.max(0, +d.steps || 0);
    d.prot = Array.isArray(d.prot) ? d.prot : []; d.ex = Array.isArray(d.ex) ? d.ex : [];
    d.shakes = d.shakes && typeof d.shakes === 'object' ? d.shakes : {};
  }
  o.machines = Array.isArray(o.machines) ? o.machines : DEF_MACHINES.slice();
  o.plan = Array.isArray(o.plan) ? o.plan.filter(x => x && x.id && Array.isArray(x.days)) : [];
  o.weights = Array.isArray(o.weights) ? o.weights.filter(w => w && /^\d{4}-\d\d-\d\d$/.test(w.d) && +w.kg > 0).sort((a, b) => a.d.localeCompare(b.d)) : [];
  if (o.timer && !(+o.timer.start > 0)) o.timer = null;
  if (o.onboarded === undefined) o.onboarded = !!o.profile.name;
  o.settings = Object.assign({ nt: {}, ntGymTime: '18:30', theme: 'dark', font: 'n', rest: 90, hc: false }, o.settings || {});
  o.settings.nt = o.settings.nt && typeof o.settings.nt === 'object' ? o.settings.nt : {};
  o.routines = Array.isArray(o.routines) ? o.routines.filter(r => r && r.id && Array.isArray(r.items) && Array.isArray(r.days)) : [];
  o.measures = Array.isArray(o.measures) ? o.measures.filter(m => m && /^\d{4}-\d\d-\d\d$/.test(m.d)) : [];
  o.favs = Array.isArray(o.favs) ? o.favs.filter(f => f && f.n) : null;
  o.badges = o.badges && typeof o.badges === 'object' ? o.badges : {};
  if (o.workout && !(Array.isArray(o.workout.items) && +o.workout.start > 0)) o.workout = null;
  return o;
}
db = migrate(db);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };

/* ================= Utilidades ================= */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const todayKey = () => keyOf(new Date());
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const uid = () => Math.random().toString(36).slice(2, 9);
const wd = (d) => (d.getDay() + 6) % 7; // 0 = lunes
const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
// "Todos los días", "De lunes a viernes", "Fines de semana" o "lun, mié, vie"
function daysLabel(days) {
  const d = [...new Set(days)].sort((a, b) => a - b), j = d.join(',');
  if (!d.length) return 'Sin día asignado';
  if (d.length === 7) return 'Todos los días';
  if (j === '0,1,2,3,4') return 'De lunes a viernes';
  if (j === '0,1,2,3,4,5') return 'De lunes a sábado';
  if (j === '5,6') return 'Fines de semana';
  if (d.length === 1) return 'Los ' + DAYS_LONG[d[0]] + (d[0] >= 5 ? 's' : '');
  return d.map(i => DAYS_LONG[i].slice(0, 3)).join(', ');
}
const fmt = (n, d = 0) => Number(n || 0).toLocaleString('es', { maximumFractionDigits: d, minimumFractionDigits: d });
const clamp01 = (x) => Math.max(0, Math.min(1, x || 0));
let cur = todayKey();

function day(k = cur) {
  if (!db.days[k]) db.days[k] = { gym: false, water: 0, steps: 0, prot: [], ex: [], shakes: {} };
  return db.days[k];
}
const peek = (k) => db.days[k];
const touched = (d) => !!d && !!(d.water || d.steps || d.prot.length || d.gym || d.ex.length || Object.keys(d.shakes).length);

/* ================= Cálculos ================= */
const PROT_FACTOR = { definir: 2.2, mantener: 1.6, volumen: 2.0 };
function goals(k = cur) {
  const p = db.profile, d = peek(k) || {};
  const w = +p.weight || 70;
  // Agua: 35 ml/kg + 0,5 L si entrenas + 0,25 L por cada 3.000 pasos sobre 8.000
  let water = w * 0.035 + (d.gym ? 0.5 : 0) + Math.max(0, (d.steps || 0) - 8000) / 3000 * 0.25;
  water = Math.round(water * 10) / 10;
  const prot = Math.round(w * (PROT_FACTOR[p.goal] || 1.6));
  return { water, prot, steps: +p.stepGoal || 8000 };
}
const protOf = (d) => (d?.prot || []).reduce((a, x) => a + (+x.g || 0), 0);
const minOf = (d) => (d?.ex || []).reduce((a, x) => a + (+x.min || 0), 0);
const volOf = (d) => (d?.ex || []).reduce((a, x) => a + (+x.sets || 0) * (+x.reps || 0) * (+x.kg || 0), 0);
const kmOf = (steps) => steps * (+db.profile.height || 170) * 0.415 / 100000;
const kcalOf = (steps) => steps * 0.0005 * (+db.profile.weight || 70);
function ratios(k) {
  const d = peek(k), g = goals(k);
  if (!d) return { w: 0, p: 0, s: 0 };
  return { w: clamp01(d.water / 1000 / g.water), p: clamp01(protOf(d) / g.prot), s: clamp01(d.steps / g.steps) };
}
function weekStart(dt) { const d = new Date(dt); d.setDate(d.getDate() - wd(d)); d.setHours(0, 0, 0, 0); return d; }
function gymInWeek(start) {
  let n = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); if (peek(keyOf(d))?.gym) n++; }
  return n;
}
function weekStreak() {
  // semanas seguidas cumpliendo tu meta de días (la semana actual cuenta si ya la cumpliste)
  const goal = +db.profile.gymDays || 3;
  let s = weekStart(new Date()), n = 0;
  if (gymInWeek(s) >= goal) n++;
  for (;;) { s.setDate(s.getDate() - 7); if (gymInWeek(s) >= goal) n++; else break; if (n > 520) break; }
  return n;
}

/* ================= Interfaz común ================= */
let toastT;
function toast(msg, undo) {
  const t = $('toast'); t.textContent = msg; t.classList.add('on'); t.classList.toggle('act', !!undo);
  if (undo) {
    const b = document.createElement('button'); b.textContent = 'Deshacer'; b.className = 'undo';
    b.onclick = () => { undo(); t.classList.remove('on', 'act'); vibrate(15); };
    t.appendChild(b);
  }
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on', 'act'), undo ? 4500 : 2200);
}
// Borra un elemento de una lista y ofrece deshacer
function removeWithUndo(arr, idx, msg, after) {
  const [it] = arr.splice(idx, 1); save(); render(); after && after();
  toast(msg, () => { arr.splice(Math.min(idx, arr.length), 0, it); save(); render(); after && after(); });
  return it;
}
const vibrate = (ms = 12) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
const reduceMotionNum = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function animateNum(el, to, dec = 0) {
  const from = parseFloat(el.dataset.v || 0), t0 = performance.now(), dur = 700;
  el.dataset.v = to;
  const id = (el._anim = (el._anim || 0) + 1);
  if (from === to || reduceMotionNum) { el.textContent = fmt(to, dec); return; }
  const step = (t) => {
    if (el._anim !== id) return;
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (to - from) * e, dec);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function setRing(el, r, ratio) {
  const c = 2 * Math.PI * r;
  el.style.strokeDasharray = c;
  el.style.strokeDashoffset = c * (1 - clamp01(ratio));
  el.classList.toggle('zero', !(ratio > 0));
}
function openSheet(html, mount) {
  $('sheetBody').innerHTML = html;
  $('sheet').classList.add('on'); $('sheetBg').classList.add('on');
  mount && mount($('sheetBody'));
}
function closeSheet() { $('sheet').classList.remove('on'); $('sheetBg').classList.remove('on'); }
$('sheetBg').onclick = closeSheet;
// Deslizar la hoja hacia abajo para cerrarla
(() => {
  const sh = $('sheet'); let y0 = null, dy = 0, t0 = 0;
  sh.addEventListener('touchstart', (e) => { if (sh.scrollTop > 0 || e.target.closest('input,select,textarea,.compare,.range')) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; t0 = Date.now(); }, { passive: true });
  sh.addEventListener('touchmove', (e) => { if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy > 0) { sh.style.transition = 'none'; sh.style.transform = `translateY(${dy}px)`; } }, { passive: true });
  sh.addEventListener('touchend', () => {
    if (y0 === null) return; sh.style.transition = ''; sh.style.transform = '';
    if (dy > 110 || (dy > 50 && Date.now() - t0 < 250)) closeSheet();
    y0 = null;
  });
})();
// Que el teclado no tape el campo que estás escribiendo
document.addEventListener('focusin', (e) => {
  if (!e.target.matches('input,textarea,select')) return;
  setTimeout(() => { try { e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) {} }, 300);
});

let view = 'hoy';
function go(v) {
  view = v;
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('on', s.dataset.view === v));
  const tab = { agua: 'hoy', pasos: 'hoy', perfil: '' }[v] ?? v;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.go === tab));
  window.scrollTo({ top: 0, left: 0 }); document.documentElement.scrollLeft = 0;
  render();
}
document.addEventListener('click', (e) => {
  const w = e.target.closest('[data-water]');
  if (w) { e.stopPropagation(); addWater(+w.dataset.water); return; }
  const g = e.target.closest('[data-go]');
  if (g) go(g.dataset.go);
});


/* ================= Ilustraciones y animaciones ================= */
const ART = {
  dumbbell: '<rect x="18" y="44" width="84" height="12" rx="6" class="a2"/><rect x="22" y="26" width="16" height="48" rx="6" class="a1"/><rect x="82" y="26" width="16" height="48" rx="6" class="a1"/><rect x="10" y="34" width="10" height="32" rx="5" class="a3"/><rect x="100" y="34" width="10" height="32" rx="5" class="a3"/>',
  shaker: '<path d="M38 30h44l-6 62a6 6 0 0 1-6 6H50a6 6 0 0 1-6-6z" class="a3"/><path d="M41 52h38l-4 40a4 4 0 0 1-4 4H49a4 4 0 0 1-4-4z" class="a1"/><rect x="36" y="20" width="48" height="12" rx="5" class="a2"/><rect x="54" y="8" width="12" height="14" rx="4" class="a2"/><circle cx="52" cy="70" r="3" class="bub"/><circle cx="66" cy="80" r="2" class="bub b2"/>',
  calendar: '<rect x="18" y="22" width="84" height="74" rx="12" class="a3"/><rect x="18" y="22" width="84" height="20" rx="10" class="a1"/><rect x="36" y="12" width="8" height="20" rx="4" class="a2"/><rect x="76" y="12" width="8" height="20" rx="4" class="a2"/><circle cx="42" cy="62" r="6" class="a2"/><circle cx="60" cy="62" r="6" class="a2 o"/><circle cx="78" cy="62" r="6" class="a2 o"/><circle cx="42" cy="80" r="6" class="a2 o"/>',
  scale: '<rect x="16" y="30" width="88" height="66" rx="18" class="a3"/><path d="M38 52a22 22 0 0 1 44 0z" class="a2"/><path d="M60 52l9-12" class="needle"/><circle cx="60" cy="52" r="3" class="a1"/>',
  chart: '<path d="M14 92h92" class="axis"/><rect x="22" y="64" width="14" height="28" rx="4" class="a3"/><rect x="44" y="50" width="14" height="42" rx="4" class="a3"/><rect x="66" y="38" width="14" height="54" rx="4" class="a3"/><rect x="88" y="22" width="14" height="70" rx="4" class="a1"/>'
};
const empty = (art, text) => `<div class="empty"><svg class="art" viewBox="0 0 120 104">${ART[art]}</svg><div>${text}</div></div>`;
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function confetti(colors = ['#c6ff3d', '#4cc9ff', '#ff7a59', '#b388ff', '#ffffff']) {
  if (reduceMotion) return;
  const box = document.createElement('div'); box.className = 'confetti';
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('i');
    const dx = (Math.random() - 0.5) * 2, dy = Math.random();
    c.style.cssText = `--x:${dx * 46}vw;--y:${-(30 + dy * 45)}vh;--r:${Math.random() * 900 - 450}deg;--d:${0.9 + Math.random() * 0.9}s;background:${colors[i % colors.length]};left:${50 + dx * 6}%;width:${5 + Math.random() * 6}px;height:${8 + Math.random() * 8}px;border-radius:${Math.random() > 0.6 ? '50%' : '2px'}`;
    box.appendChild(c);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2200);
}
// Celebra una sola vez cada meta del día
function celebrate(k, key, msg) {
  const d = day(k); d.cel = d.cel || {};
  if (d.cel[key]) return; d.cel[key] = 1; save();
  confetti(); vibrate([30, 40, 30]); if (msg) toast(msg);
}
function checkGoals() {
  if (cur !== todayKey()) return; // no celebrar al revisar días pasados
  const r = ratios(cur), d = peek(cur); if (!d) return;
  if (r.w >= 1) celebrate(cur, 'w', '¡Meta de agua cumplida! 💧');
  if (r.p >= 1) celebrate(cur, 'p', '¡Meta de proteína cumplida! 🎯');
  if (r.s >= 1) celebrate(cur, 's', '¡Meta de pasos cumplida! 👟');
  if (r.w >= 1 && r.p >= 1 && r.s >= 1) celebrate(cur, 'all', '¡Día perfecto! 🏆');
}
// efecto de onda al tocar
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.btn,.chip,.quick button,.seg button,.days7 button,.tabs button');
  if (!b || reduceMotion) return;
  const r = b.getBoundingClientRect(), s = document.createElement('span'), size = Math.max(r.width, r.height) * 2;
  s.className = 'ripple'; s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
  b.appendChild(s); setTimeout(() => s.remove(), 600);
}, { passive: true });

/* ================= Encabezado y día ================= */
function renderTop() {
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  const first = (db.profile.name || '').trim().split(/\s+/)[0];
  $('hello').textContent = first ? `${saludo}, ${first}` : saludo;
  const d = fromKey(cur);
  $('topDate').textContent = d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  const diff = Math.round((fromKey(todayKey()) - d) / 864e5);
  $('dayLabel').textContent = diff === 0 ? 'Hoy' : diff === 1 ? 'Ayer' : d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}
$('dayNav').onclick = () => {
  openSheet(`<h3>Elegir día</h3><div class="sub">Puedes registrar o corregir días anteriores.</div>
    <label class="field"><span>Fecha</span><input class="input" type="date" id="pickDate" value="${cur}" max="${todayKey()}"></label>
    <div class="btnrow"><button class="btn ghost" id="pdToday">Hoy</button><button class="btn primary" id="pdOk">Abrir</button></div>`, (b) => {
    b.querySelector('#pdToday').onclick = () => { cur = todayKey(); closeSheet(); render(); };
    b.querySelector('#pdOk').onclick = () => { const v = b.querySelector('#pickDate').value; if (/^\d{4}-\d\d-\d\d$/.test(v)) cur = v > todayKey() ? todayKey() : v; closeSheet(); render(); };
  });
};

/* ================= HOY ================= */
function renderHoy() {
  const d = day(), g = goals(), r = ratios(cur);
  setRing($('rWater'), 88, r.w); setRing($('rProt'), 68, r.p); setRing($('rSteps'), 48, r.s);
  animateNum($('scoreNum'), Math.round((r.w + r.p + r.s) / 3 * 100));
  $('lgWater').textContent = `${fmt(d.water / 1000, 1)} / ${fmt(g.water, 1)} L`;
  $('lgProt').textContent = `${fmt(protOf(d))} / ${g.prot} g`;
  $('lgSteps').textContent = `${fmt(d.steps)} / ${fmt(g.steps)}`;

  $('gymSwitch').classList.toggle('on', d.gym);
  $('gymToggle').classList.toggle('on', d.gym);
  $('gymState').textContent = d.gym ? 'Entrenaste ✓' : '¿Fuiste hoy?';
  const wk = gymInWeek(weekStart(fromKey(cur))), st = weekStreak();
  $('streakTxt').innerHTML = `${wk} de ${db.profile.gymDays} días esta semana` + (st ? ` · <span class="flame">🔥</span> racha ${st} sem` : '');

  animateNum($('tWater'), d.water / 1000, 1); $('tWaterGoal').textContent = fmt(g.water, 1);
  $('mWater').style.width = r.w * 100 + '%';
  animateNum($('tProt'), protOf(d)); $('tProtGoal').textContent = g.prot;
  $('mProt').style.width = r.p * 100 + '%';
  const left = g.prot - protOf(d);
  $('tProtLeft').textContent = left > 0 ? `Faltan ${Math.round(left)} g` : 'Meta cumplida ✓';
  animateNum($('tSteps'), d.steps);
  $('mSteps').style.width = r.s * 100 + '%';
  $('tStepsInfo').textContent = `${fmt(kmOf(d.steps), 1)} km · ${fmt(kcalOf(d.steps))} kcal`;
  animateNum($('tMin'), minOf(d));
  const ms = [...new Set(d.ex.map(x => x.m))];
  $('tMach').textContent = ms.length ? `${ms.length} máquina${ms.length > 1 ? 's' : ''}` : 'Sin máquinas';
  $('tVol').textContent = volOf(d) ? `${fmt(volOf(d))} kg movidos` : '';

  const sh = shakesFor(cur);
  $('todayShakes').innerHTML = sh.length ? sh.map(shakeItem).join('') : empty('shaker', 'No hay batidos para hoy. Créalos en Nutrición.');
  bindShakeChecks($('todayShakes'));

  // semana
  const s = weekStart(fromKey(cur)); let html = '', gw = 0;
  for (let i = 0; i < 7; i++) {
    const dt = new Date(s); dt.setDate(dt.getDate() + i);
    const k = keyOf(dt), rr = ratios(k), sc = (rr.w + rr.p + rr.s) / 3, gy = peek(k)?.gym;
    if (gy) gw++;
    html += `<div class="wb ${k === cur ? 'today' : ''}"><div class="col ${gy ? 'gym' : ''}"><i style="height:${Math.round(sc * 100)}%"></i></div><span>${DAYS[i]}</span></div>`;
  }
  $('weekBars').innerHTML = html;
  $('weekTxt').textContent = `${gw} día${gw === 1 ? '' : 's'} de gym`;
}
$('gymToggle').onclick = () => {
  const d = day(); d.gym = !d.gym; save(); vibrate(20);
  if (d.gym) { toast('¡Bien! Día de gym registrado 💪'); confetti(['#c6ff3d', '#ffffff', '#9be020']); }
  render();
};
function addWater(ml) {
  const d = day(); d.water = Math.max(0, d.water + ml); save(); vibrate();
  const g = goals();
  if (!(ml > 0 && d.water / 1000 >= g.water && cur === todayKey() && !d.cel?.w)) toast(ml > 0 ? `+${ml} ml de agua` : `${ml} ml`);
  if (ml > 0) dropFx();
  render();
}

function dropFx() {
  if (reduceMotion) return;
  const t = document.querySelector('.view.on .bottle') || document.querySelector('.view.on [data-water]');
  if (!t) return;
  const r = t.getBoundingClientRect(), d = document.createElement('div');
  d.className = 'drop'; d.style.left = (r.left + r.width / 2 - 9) + 'px'; d.style.top = (r.top - 10) + 'px';
  document.body.appendChild(d); setTimeout(() => d.remove(), 900);
}
/* ================= AGUA ================= */
function renderAgua() {
  const d = day(), g = goals();
  $('waterFill').style.height = clamp01(d.water / 1000 / g.water) * 100 + '%';
  animateNum($('aWater'), d.water / 1000, 2); $('aWaterGoal').textContent = fmt(g.water, 1);
  const w = +db.profile.weight || 70;
  const left = Math.max(0, g.water - d.water / 1000);
  const h = new Date().getHours(), hrsLeft = Math.max(1, 22 - h);
  $('waterWhy').innerHTML = `Base ${fmt(w * 0.035, 1)} L (35 ml × ${w} kg)` + (d.gym ? ' + 0,5 L por entrenar' : '') +
    (d.steps > 8000 ? ' + extra por pasos' : '') +
    (left > 0 && cur === todayKey() ? (h < 22 ? `<br>Te faltan ${fmt(left, 1)} L: unos ${fmt(Math.round(left * 1000 / hrsLeft / 50) * 50)} ml por hora hasta las 22:00.` : `<br>Te faltaron ${fmt(left, 1)} L. Mañana empieza temprano con un vaso al despertar.`) : '');
}

/* ================= PASOS ================= */
function renderPasos() {
  const d = day(), g = goals();
  animateNum($('pSteps'), d.steps);
  $('pmSteps').style.width = clamp01(d.steps / g.steps) * 100 + '%';
  $('pKm').textContent = fmt(kmOf(d.steps), 1);
  $('pKcal').textContent = fmt(kcalOf(d.steps));
  $('pGoal').textContent = fmt(g.steps);
  $('stepLive').textContent = live ? 'Detener' : 'Contar en vivo';
  renderHc();
}
$('stepEdit').onclick = () => {
  openSheet(`<h3>Pasos del día</h3><div class="sub">Escribe el total que marca tu reloj o Samsung Health.</div>
    <label class="field"><span>Pasos</span><input class="input" type="number" inputmode="numeric" id="stIn" value="${day().steps || ''}"></label>
    <div class="btnrow"><button class="btn primary" id="stOk">Guardar</button></div>`, (b) => {
    const i = b.querySelector('#stIn'); setTimeout(() => i.focus(), 300);
    b.querySelector('#stOk').onclick = () => { day().steps = Math.max(0, Math.round(+i.value || 0)); save(); closeSheet(); render(); toast('Pasos guardados'); };
  });
};
// Podómetro con el acelerómetro (funciona con la app abierta)
let live = false, lastPeak = 0, prevMag = 0, rising = false, avg = 9.8;
function onMotion(e) {
  const a = e.accelerationIncludingGravity; if (!a) return;
  const m = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  avg = avg * 0.95 + m * 0.05;
  const t = Date.now();
  if (m > prevMag) rising = true;
  else if (rising && prevMag > avg + 1.6 && t - lastPeak > 280) {
    lastPeak = t; rising = false;
    const d = day(todayKey()); d.steps++;
    if (d.steps % 10 === 0) save();
    if (view === 'pasos' && cur === todayKey()) { $('pSteps').textContent = fmt(d.steps); $('pSteps').dataset.v = d.steps; }
    if (d.steps % 10 === 0 && (view === 'hoy' || view === 'pasos') && cur === todayKey()) render();
  } else rising = false;
  prevMag = m;
}
$('stepLive').onclick = async () => {
  if (live) { window.removeEventListener('devicemotion', onMotion); live = false; save(); render(); toast('Conteo detenido'); return; }
  try { if (typeof DeviceMotionEvent?.requestPermission === 'function') await DeviceMotionEvent.requestPermission(); } catch (e) {}
  cur = todayKey();
  window.addEventListener('devicemotion', onMotion); live = true; render(); toast('Contando pasos… lleva el celular contigo');
};

/* ================= GYM ================= */
function machineOptions(sel) {
  return db.machines.map(m => `<option ${m === sel ? 'selected' : ''}>${esc(m)}</option>`).join('');
}
function renderGym() {
  const d = day();
  const tm = $('timerMachine'), prev = tm.value;
  tm.innerHTML = machineOptions(db.timer?.m || prev);
  $('exList').innerHTML = d.ex.length ? d.ex.map(x => `
    <div class="item tap" data-exedit="${x.id}"><div class="ic">🏋️</div><div class="t"><b>${esc(x.m)}</b>
    <span>${x.at || ''} · ${x.min} min${x.sets ? ` · ${x.sets}×${x.reps || 0}` : ''}${x.kg ? ` · ${fmt(x.kg, 1)} kg` : ''}</span></div>
    <button class="x" data-del="${x.id}">×</button></div>`).join('') : empty('dumbbell', 'Aún no hay ejercicios este día. Empieza una rutina, usa el cronómetro o toca + Añadir.');
  $('exList').querySelectorAll('[data-del]').forEach(b => b.onclick = (e) => { e.stopPropagation(); const i = d.ex.findIndex(x => x.id === b.dataset.del); if (i >= 0) removeWithUndo(d.ex, i, 'Ejercicio borrado'); });
  $('exList').querySelectorAll('[data-exedit]').forEach(b => b.onclick = () => { const x = d.ex.find(y => y.id === b.dataset.exedit); if (x) exSheet(x); });
  const series = d.ex.reduce((a, x) => a + (+x.sets || 0), 0);
  $('exTotals').innerHTML = d.ex.length ? `<div><b>${minOf(d)}</b><span>minutos</span></div><div><b>${series}</b><span>series</span></div><div><b>${fmt(volOf(d))}</b><span>kg volumen</span></div>` : '';

  // máquinas más usadas (últimos 30 días)
  const cnt = {}, mins = {}, now = fromKey(todayKey());
  for (const [k, v] of Object.entries(db.days)) {
    if ((now - fromKey(k)) / 864e5 > 30) continue;
    for (const x of v.ex || []) { cnt[x.m] = (cnt[x.m] || 0) + 1; mins[x.m] = (mins[x.m] || 0) + (+x.min || 0); }
  }
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 5), mx = top[0]?.[1] || 1;
  renderRoutines(); renderPRs(); renderRestDef();
  $('topMach').innerHTML = top.length ? top.map(([m, n]) => `<div class="item"><div class="t"><b>${esc(m)}</b><span>${n} ${n === 1 ? 'vez' : 'veces'} · ${mins[m]} min en 30 días</span><div class="bar-h"><i style="width:${n / mx * 100}%"></i></div></div></div>`).join('') : empty('chart', 'Aquí verás las máquinas que más usas.');
}
function exSheet(pre = {}) {
  const editing = !!pre.id;
  openSheet(`<h3>${editing ? 'Editar ejercicio' : 'Añadir ejercicio'}</h3>
    <label class="field"><span>Máquina</span><select class="input" id="exM">${pre.m && !db.machines.includes(pre.m) ? `<option selected>${esc(pre.m)}</option>` : ''}${machineOptions(pre.m)}<option value="__new">+ Otra máquina…</option></select></label>
    <label class="field" id="exNewW" style="display:none"><span>Nombre de la máquina</span><input class="input" id="exNew"></label>
    <div class="grid2 tight">
      <label class="field"><span>Tiempo (min)</span><input class="input" type="number" inputmode="numeric" id="exMin" value="${pre.min || ''}"></label>
      <label class="field"><span>Hora</span><input class="input" type="time" id="exAt" value="${pre.at || nowHM()}"></label>
      <label class="field"><span>Series</span><input class="input" type="number" inputmode="numeric" id="exSets" value="${pre.sets || ''}"></label>
      <label class="field"><span>Repeticiones</span><input class="input" type="number" inputmode="numeric" id="exReps" value="${pre.reps || ''}"></label>
    </div>
    <label class="field"><span>Peso (kg)</span><input class="input" type="number" inputmode="decimal" step="0.5" id="exKg" value="${pre.kg || ''}"></label>
    <div class="btnrow"><button class="btn primary" id="exOk">Guardar</button></div>`, (b) => {
    const sel = b.querySelector('#exM');
    sel.onchange = () => { b.querySelector('#exNewW').style.display = sel.value === '__new' ? '' : 'none'; };
    b.querySelector('#exOk').onclick = () => {
      let m = sel.value;
      if (m === '__new') { m = b.querySelector('#exNew').value.trim(); if (!m) return toast('Escribe el nombre de la máquina'); if (!db.machines.includes(m)) db.machines.push(m); }
      const min = Math.max(0, Math.round(+b.querySelector('#exMin').value || 0));
      const d = day(), before = prMap();
      if (editing) d.ex = d.ex.filter(y => y.id !== pre.id);
      d.ex.push({ id: pre.id || uid(), m, min, at: b.querySelector('#exAt').value, sets: Math.max(0, Math.round(+b.querySelector('#exSets').value || 0)), reps: Math.max(0, Math.round(+b.querySelector('#exReps').value || 0)), kg: Math.max(0, parseFloat(String(b.querySelector('#exKg').value).replace(',', '.')) || 0) });
      d.ex.sort((a, c) => (a.at || '').localeCompare(c.at || ''));
      if (!d.gym) { d.gym = true; toast('Ejercicio guardado y día de gym marcado'); } else toast(editing ? 'Ejercicio actualizado' : 'Ejercicio guardado');
      save(); closeSheet(); render(); vibrate(15);
      const news = newPRs(before); if (news.length) { confetti(['#ffd166', '#c6ff3d', '#ffffff']); toast(`🏆 ¡Nuevo récord en ${news[0]}!`); }
      checkBadges();
    };
  });
}
$('addEx').onclick = () => exSheet();
$('manageMach').onclick = () => {
  const draw = (b) => {
    b.querySelector('#mList').innerHTML = db.machines.map((m, i) => `<div class="item"><div class="t"><b>${esc(m)}</b></div><button class="x" data-i="${i}">×</button></div>`).join('');
    b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { db.machines.splice(+x.dataset.i, 1); save(); draw(b); });
  };
  openSheet(`<h3>Tus máquinas</h3><div class="btnrow"><input class="input" id="mNew" placeholder="Nueva máquina"><button class="btn primary" id="mAdd" style="flex:none">Añadir</button></div><div class="list" id="mList" style="margin-top:12px"></div>`, (b) => {
    draw(b);
    b.querySelector('#mAdd').onclick = () => { const v = b.querySelector('#mNew').value.trim(); if (v && !db.machines.includes(v)) { db.machines.push(v); save(); b.querySelector('#mNew').value = ''; draw(b); renderGym(); } };
  });
};

// Cronómetro (sobrevive si cierras la app)
let tick = null;
function drawTimer() {
  const t = db.timer, s = t ? Math.floor((Date.now() - t.start) / 1000) : 0;
  $('timer').textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  $('timer').classList.toggle('run', !!t);
  $('timerBtn').textContent = t ? 'Terminar' : 'Iniciar';
}
function runTick() { clearInterval(tick); if (db.timer) tick = setInterval(drawTimer, 1000); drawTimer(); }
$('timerBtn').onclick = () => {
  if (!db.timer) { if (!$('timerMachine').value) return toast('Añade una máquina primero'); db.timer = { start: Date.now(), m: $('timerMachine').value, at: nowHM() }; save(); runTick(); vibrate(20); return; }
  const t = db.timer; db.timer = null; save(); runTick();
  const min = Math.max(1, Math.round((Date.now() - t.start) / 60000));
  cur = todayKey(); exSheet({ m: t.m, min, at: t.at });
};
$('timerReset').onclick = () => { db.timer = null; save(); runTick(); };
$('timerMachine').onchange = () => { if (db.timer) { db.timer.m = $('timerMachine').value; save(); } };

/* ================= NUTRICIÓN ================= */
function renderNutri() {
  const d = day(), g = goals(), p = protOf(d);
  animateNum($('nProt'), p); $('nProtGoal').textContent = g.prot;
  $('nmProt').style.width = clamp01(p / g.prot) * 100 + '%';
  const left = Math.round(g.prot - p), meals = Math.max(1, 4 - d.prot.length);
  $('nProtTip').textContent = left > 0
    ? `Tu meta: ${fmt(PROT_FACTOR[db.profile.goal], 1)} g por kilo para ${GOAL_TXT[db.profile.goal]}. Te faltan ${left} g: unos ${Math.ceil(left / meals)} g en ${meals === 1 ? 'tu próxima comida' : `cada una de tus próximas ${meals} comidas`}.`
    : '¡Meta de proteína cumplida! 🎯';
  $('protList').innerHTML = d.prot.length ? d.prot.slice().reverse().map(x => `<div class="item tap" data-fedit="${x.id}"><div class="ic">${x.shake ? '🥤' : x.photo ? '📷' : '🍗'}</div><div class="t"><b>${esc(x.n)}</b><span>${x.at || ''}${x.kcal ? ' · ' + fmt(x.kcal) + ' kcal' : ''}</span></div><b>${fmt(x.g, x.g % 1 ? 1 : 0)} g</b><button class="x" data-del="${x.id}">×</button></div>`).join('') : '';
  $('protList').querySelectorAll('[data-del]').forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    const i = d.prot.findIndex(y => y.id === b.dataset.del); if (i < 0) return;
    const x = d.prot[i], sh = x.shake, t = sh ? d.shakes[sh] : null; if (sh) delete d.shakes[sh];
    removeWithUndo(d.prot, i, 'Comida borrada', () => { if (sh && d.prot.includes(x)) d.shakes[sh] = t; });
  });
  $('protList').querySelectorAll('[data-fedit]').forEach(b => b.onclick = () => { const x = d.prot.find(y => y.id === b.dataset.fedit); if (x && !x.shake) foodSheet(x); });

  $('shakePlan').innerHTML = db.plan.length ? db.plan.slice().sort((a, b) => a.time.localeCompare(b.time)).map(s => `
    <div class="item"><div class="ic">🥤</div><div class="t"><b>${esc(s.name)} · ${s.g} g</b>
    <span>${s.time} · ${daysLabel(s.days)}</span></div>
    <button class="x" data-edit="${s.id}">✎</button></div>`).join('') : empty('shaker', 'Aún no tienes batidos en tu plan.');
  $('shakePlan').querySelectorAll('[data-edit]').forEach(b => b.onclick = () => shakeSheet(db.plan.find(s => s.id === b.dataset.edit)));
  renderKcal();
}
$('addProt').onclick = () => {
  openSheet(`<h3>Registrar proteína</h3>
    <label class="field"><span>Alimento</span><input class="input" id="pN" placeholder="Ej. Pollo con arroz"></label>
    <div class="grid2 tight"><label class="field"><span>Proteína (g)</span><input class="input" type="number" inputmode="decimal" id="pG"></label>
    <label class="field"><span>Hora</span><input class="input" type="time" id="pAt" value="${nowHM()}"></label></div>
    <div class="btnrow"><button class="btn primary" id="pOk">Guardar</button></div>`, (b) => {
    b.querySelector('#pOk').onclick = () => {
      const g = Math.round(parseFloat(String(b.querySelector('#pG').value).replace(',', '.')) * 10) / 10; if (!(g > 0 && g <= 300)) return toast('Escribe gramos entre 1 y 300');
      day().prot.push({ id: uid(), n: b.querySelector('#pN').value.trim() || 'Comida', g, at: b.querySelector('#pAt').value });
      save(); closeSheet(); render(); toast(`+${g} g de proteína`);
    };
  });
};
function shakeSheet(s) {
  const e = s || { name: '', g: 24, time: '08:00', days: [0, 1, 2, 3, 4, 5, 6] };
  openSheet(`<h3>${s ? 'Editar batido' : 'Nuevo batido'}</h3>
    <label class="field"><span>Nombre</span><input class="input" id="sN" value="${esc(e.name)}" placeholder="Ej. Whey post-entreno"></label>
    <div class="grid2 tight"><label class="field"><span>Proteína (g)</span><input class="input" type="number" inputmode="decimal" id="sG" value="${e.g}"></label>
    <label class="field"><span>Hora</span><input class="input" type="time" id="sT" value="${e.time}"></label></div>
    <div class="field"><span>Días</span><div class="days7" id="sD">${DAYS.map((x, i) => `<button data-d="${i}" class="${e.days.includes(i) ? 'on' : ''}">${x}</button>`).join('')}</div></div>
    <div class="btnrow">${s ? '<button class="btn danger" id="sDel">Eliminar</button>' : ''}<button class="btn primary" id="sOk">Guardar</button></div>`, (b) => {
    b.querySelectorAll('[data-d]').forEach(x => x.onclick = () => x.classList.toggle('on'));
    b.querySelector('#sOk').onclick = () => {
      const name = b.querySelector('#sN').value.trim(); if (!name) return toast('Ponle un nombre');
      const days = [...b.querySelectorAll('[data-d].on')].map(x => +x.dataset.d); if (!days.length) return toast('Elige al menos un día');
      const obj = { id: e.id || uid(), name, g: Math.max(0, Math.min(300, +b.querySelector('#sG').value || 0)), time: b.querySelector('#sT').value || '08:00', days };
      if (s) Object.assign(s, obj); else db.plan.push(obj);
      save(); closeSheet(); render(); scheduleReminders(); toast('Batido guardado');
    };
    const del = b.querySelector('#sDel');
    if (del) del.onclick = () => { db.plan = db.plan.filter(x => x.id !== s.id); save(); closeSheet(); render(); scheduleReminders(); };
  });
}
$('addShake').onclick = () => shakeSheet();
function shakesFor(k) { const w = wd(fromKey(k)); return db.plan.filter(s => s.days.includes(w)).sort((a, b) => a.time.localeCompare(b.time)); }
function shakeItem(s) {
  const taken = peek(cur)?.shakes?.[s.id];
  return `<div class="item ${taken ? 'done' : ''}"><div class="ic">🥤</div><div class="t"><b>${esc(s.name)}</b><span>${s.time} · ${s.g} g${taken ? ` · tomado a las ${taken}` : ''}</span></div><button class="check ${taken ? 'on' : ''}" data-shake="${s.id}">${taken ? '✓' : ''}</button></div>`;
}
function bindShakeChecks(root) {
  root.querySelectorAll('[data-shake]').forEach(b => b.onclick = (ev) => {
    ev.stopPropagation();
    const s = db.plan.find(x => x.id === b.dataset.shake), d = day(); if (!s) return render();
    if (d.shakes[s.id]) { delete d.shakes[s.id]; d.prot = d.prot.filter(p => p.shake !== s.id); }
    else { d.shakes[s.id] = nowHM(); d.prot.push({ id: uid(), n: 'Batido: ' + s.name, g: s.g, at: nowHM(), shake: s.id }); toast(`Batido tomado · +${s.g} g`); vibrate(20); }
    save(); render();
  });
}
// aviso dentro de la app cuando llega la hora de un batido
let lastShakeAlert = '';
setInterval(() => {
  const k = todayKey(), hm = nowHM();
  for (const s of shakesFor(k)) if (s.time === hm && !peek(k)?.shakes?.[s.id] && lastShakeAlert !== s.id + hm) { lastShakeAlert = s.id + hm; toast(`🥤 Hora de tu batido: ${s.name}`); vibrate([100, 60, 100]); }
}, 20000);

/* ================= COACH: peso, análisis, sugerencias ================= */
const RATE = { definir: [-1.0, -0.5], mantener: [-0.25, 0.25], volumen: [0.25, 0.5] }; // % del peso por semana
const GOAL_TXT = { definir: 'bajar grasa', mantener: 'mantener', volumen: 'ganar músculo' };
function logWeight(kg, k = todayKey()) {
  db.weights = db.weights.filter(w => w.d !== k);
  db.weights.push({ d: k, kg }); db.weights.sort((a, b) => a.d.localeCompare(b.d));
  if (k >= (db.weights[db.weights.length - 1]?.d || '')) db.profile.weight = kg;
  save();
}
// el peso del perfil siempre es el último pesaje
function syncWeight() { const l = db.weights[db.weights.length - 1]; if (l) { db.profile.weight = l.kg; save(); } }
const daysAgo = (k) => Math.round((fromKey(todayKey()) - fromKey(k)) / 864e5);
// Tendencia: regresión lineal sobre los pesajes de los últimos 28 días
function trend() {
  const pts = db.weights.filter(w => daysAgo(w.d) <= 28);
  if (pts.length < 3 || daysAgo(pts[0].d) - daysAgo(pts[pts.length - 1].d) < 7) return null;
  const xs = pts.map(w => -daysAgo(w.d)), ys = pts.map(w => w.kg), n = pts.length;
  const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const perDay = sxy / sxx, now = my + perDay * (0 - mx);
  return { perWeek: perDay * 7, pct: perDay * 7 / now * 100, now, n, span: xs[n - 1] - xs[0] };
}
// Promedios reales de los últimos N días con registros
function recent(n = 7) {
  const out = { days: 0, water: 0, waterOk: 0, prot: 0, protOk: 0, steps: 0, gym: 0, min: 0 };
  for (let i = 0; i < n; i++) {
    const dt = fromKey(todayKey()); dt.setDate(dt.getDate() - i);
    const k = keyOf(dt), d = peek(k); if (!d) continue;
    const g = goals(k);
    if (!touched(d)) continue;
    out.days++; out.water += d.water / 1000; out.prot += protOf(d); out.steps += d.steps;
    if (d.water / 1000 >= g.water) out.waterOk++; if (protOf(d) >= g.prot) out.protOk++;
    if (d.gym) out.gym++; out.min += minOf(d);
  }
  if (out.days) { out.water /= out.days; out.prot /= out.days; out.steps /= out.days; }
  return out;
}
function energy() {
  const p = db.profile, w = +p.weight, h = +p.height, a = +p.age || 25;
  const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'm' ? -161 : 5); // Mifflin-St Jeor
  const r = recent(14);
  const steps = r.days ? r.steps : 5000, gymWk = r.days ? r.gym / 2 : (+p.gymDays || 3);
  let f = steps < 5000 ? 1.2 : steps < 7500 ? 1.375 : steps < 10000 ? 1.45 : 1.55;
  f = Math.min(1.9, f + gymWk * 0.03);
  const tdee = bmr * f;
  const target = Math.round(tdee * ({ definir: 0.8, mantener: 1, volumen: 1.1 }[p.goal]) / 10) * 10;
  const prot = goals().prot, fat = Math.round(w * 0.8);
  const carbs = Math.max(0, Math.round((target - prot * 4 - fat * 9) / 4));
  return { bmr: Math.round(bmr), f, tdee: Math.round(tdee), target, prot, fat, carbs, steps, gymWk };
}
// Progresión de cargas por máquina (comparando sesiones reales)
function overload() {
  const by = {};
  for (const k of Object.keys(db.days).sort()) for (const x of db.days[k].ex || []) if (x.kg) (by[x.m] = by[x.m] || []).push({ k, kg: +x.kg, reps: +x.reps || 0, sets: +x.sets || 0 });
  const out = [];
  for (const [m, s] of Object.entries(by)) {
    if (s.length < 2) continue;
    const last = s[s.length - 1], prev = s[s.length - 2], first = s[0];
    const gain = (last.kg - first.kg) / first.kg * 100;
    if (last.kg === prev.kg && last.reps >= 10) out.push({ t: 'good', h: `${m}: toca subir peso`, b: `Hiciste ${last.reps} repeticiones con ${fmt(last.kg, 1)} kg dos sesiones seguidas. Prueba ${fmt(Math.round(last.kg * 1.05 * 2) / 2, 1)} kg (+5 %) y baja a 8 repeticiones.` });
    else if (last.kg < prev.kg) out.push({ t: 'warn', h: `${m}: bajaste carga`, b: `De ${fmt(prev.kg, 1)} a ${fmt(last.kg, 1)} kg. Si no fue a propósito, revisa descanso y proteína.` });
    else if (s.length >= 3) out.push({ t: 'good', h: `${m}: ${gain >= 0 ? '+' : ''}${fmt(gain, 1)} % de fuerza`, b: `De ${fmt(first.kg, 1)} kg (${first.k.slice(5)}) a ${fmt(last.kg, 1)} kg en ${s.length} sesiones.` });
  }
  return out.slice(0, 5);
}
function suggestions() {
  const p = db.profile, g = goals(todayKey()), r = recent(7), t = trend(), out = [];
  const lastW = db.weights[db.weights.length - 1];
  if (!lastW || daysAgo(lastW.d) > 7) out.push({ t: 'warn', h: 'Registra tu peso', b: lastW ? `Tu último pesaje fue hace ${daysAgo(lastW.d)} días. Sin pesajes no se puede medir tu progreso.` : 'Regístralo arriba. Con 3 pesajes en una semana se calcula tu tendencia real.' });
  if (t) {
    const [lo, hi] = RATE[p.goal], pct = t.pct;
    const ok = pct >= lo && pct <= hi;
    const midKg = (lo + hi) / 2 / 100 * t.now, diffKcal = Math.round((midKg - t.perWeek) * 7700 / 7 / 10) * 10;
    if (ok) out.push({ t: 'good', h: `Vas al ritmo correcto para ${GOAL_TXT[p.goal]}`, b: `Cambias ${t.perWeek >= 0 ? '+' : ''}${fmt(t.perWeek, 2)} kg/semana (${fmt(pct, 2)} %). El rango ideal es ${lo} a ${hi} % semanal.` });
    else out.push({ t: 'bad', h: pct > hi ? (p.goal === 'definir' ? 'No estás bajando lo suficiente' : 'Estás subiendo demasiado rápido') : (p.goal === 'volumen' ? 'No estás subiendo de peso' : 'Estás bajando demasiado rápido'),
      b: `Tendencia: ${t.perWeek >= 0 ? '+' : ''}${fmt(t.perWeek, 2)} kg/semana (${fmt(pct, 2)} %) con ${t.n} pesajes. Para ${GOAL_TXT[p.goal]} lo ideal es ${lo} a ${hi} %. Ajusta unas ${diffKcal > 0 ? '+' : ''}${diffKcal} kcal al día.` });
  }
  if (r.days >= 3) {
    if (r.protOk < r.days * 0.7) out.push({ t: 'warn', h: 'Te falta proteína', b: `Promedio ${fmt(r.prot)} g/día frente a ${g.prot} g. Cumpliste ${r.protOk} de ${r.days} días. Un batido extra de ${Math.max(20, Math.round((g.prot - r.prot) / 5) * 5)} g lo cubre.` });
    else out.push({ t: 'good', h: 'Proteína bien cubierta', b: `Cumpliste ${r.protOk} de ${r.days} días (promedio ${fmt(r.prot)} g).` });
    if (r.waterOk < r.days * 0.7) out.push({ t: 'warn', h: 'Bebe más agua', b: `Promedio ${fmt(r.water, 1)} L/día frente a ${fmt(g.water, 1)} L. Lleva una botella de 750 ml y rellénala ${Math.ceil(g.water / 0.75)} veces.` });
    if (r.steps < p.stepGoal * 0.8) out.push({ t: 'warn', h: 'Muévete un poco más', b: `Promedio ${fmt(r.steps)} pasos frente a ${fmt(p.stepGoal)}. Un paseo de 20 minutos suma unos 2.000 pasos.` });
  }
  if (r.gym < p.gymDays) out.push({ t: r.gym ? 'warn' : 'bad', h: `${r.gym} de ${p.gymDays} días de gym esta última semana`, b: r.gym ? `Te faltan ${p.gymDays - r.gym} para tu meta. La constancia es lo que más resultados da.` : 'Llevas 7 días sin entrenar. Aunque sean 30 minutos, ve hoy.' });
  else out.push({ t: 'good', h: 'Cumpliste tus días de gym', b: `${r.gym} días y ${r.min} minutos en los últimos 7 días.` });
  return out.concat(overload());
}
function weightChart() {
  const pts = db.weights.filter(w => daysAgo(w.d) <= 90);
  if (pts.length < 2) return empty('scale', 'Registra al menos 2 pesajes para ver tu gráfica.');
  const W = 320, H = 140, xs = pts.map(w => -daysAgo(w.d)), ys = pts.map(w => w.kg);
  const x0 = Math.min(...xs), x1 = Math.max(0, ...xs), y0 = Math.min(...ys) - 0.5, y1 = Math.max(...ys) + 0.5;
  const X = (x) => 10 + (x - x0) / ((x1 - x0) || 1) * (W - 20), Y = (y) => 10 + (1 - (y - y0) / (y1 - y0)) * (H - 30);
  // media móvil de 7 días
  const avg = pts.map((w, i) => { const s = pts.filter(q => daysAgo(q.d) >= daysAgo(w.d) && daysAgo(q.d) < daysAgo(w.d) + 7); return [X(xs[i]), Y(s.reduce((a, q) => a + q.kg, 0) / s.length)]; });
  const line = avg.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${avg[avg.length - 1][0].toFixed(1)} ${H - 20} L${avg[0][0].toFixed(1)} ${H - 20} Z`;
  return `<svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="wg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#c6ff3d"/><stop offset="1" stop-color="#c6ff3d" stop-opacity="0"/></linearGradient></defs>
    <path class="ar" d="${area}"/><path class="ln draw" pathLength="1" d="${line}"/>
    ${pts.map((w, i) => `<circle class="pt" cx="${X(xs[i]).toFixed(1)}" cy="${Y(w.kg).toFixed(1)}" r="2.5"/>`).join('')}
    <text x="10" y="${H - 4}">${pts[0].d.slice(8)}/${pts[0].d.slice(5, 7)}</text><text x="${W - 10}" y="${H - 4}" text-anchor="end">hoy</text>
    <text x="${W - 10}" y="12" text-anchor="end">${fmt(Math.max(...ys), 1)}</text><text x="${W - 10}" y="${H - 22}" text-anchor="end">${fmt(Math.min(...ys), 1)}</text></svg>`;
}
function renderCoach() {
  const p = db.profile, last = db.weights[db.weights.length - 1], t = trend();
  $('wNow').textContent = last ? fmt(last.kg, 1) : fmt(p.weight, 1);
  $('wLast').textContent = last ? (daysAgo(last.d) ? `hace ${daysAgo(last.d)} d` : 'hoy') : 'sin pesajes';
  const first = db.weights.find(w => daysAgo(w.d) <= 30);
  const dl = last && first && first !== last ? last.kg - first.kg : null;
  $('wDelta').textContent = dl === null ? '' : `${dl > 0 ? '▲ +' : dl < 0 ? '▼ ' : ''}${fmt(dl, 1)} kg en 30 d`;
  $('wDelta').className = 'delta ' + (dl > 0 ? 'up' : dl < 0 ? 'down' : '');
  $('wChart').innerHTML = weightChart();
  const recentW = db.weights.slice(-6).reverse();
  $('wHist').innerHTML = recentW.length ? `<div class="label sm">Últimos pesajes</div>` + recentW.map(w => `<div class="wrow"><span>${fromKey(w.d).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}</span><b>${fmt(w.kg, 1)} kg</b><button class="x" data-wdel="${w.d}" aria-label="Borrar">×</button></div>`).join('') : '';
  $('wHist').querySelectorAll('[data-wdel]').forEach(b => b.onclick = () => {
    const i = db.weights.findIndex(w => w.d === b.dataset.wdel); if (i < 0) return;
    removeWithUndo(db.weights, i, 'Pesaje borrado', syncWeight);
  });
  const h = p.height / 100, bmi = p.weight / (h * h);
  $('anCalc').innerHTML = `
    <div><span>Tendencia semanal</span><b>${t ? `${t.perWeek >= 0 ? '+' : ''}${fmt(t.perWeek, 2)} kg (${fmt(t.pct, 2)} %)` : 'faltan datos'}</b></div>
    <div><span>Ritmo ideal (${GOAL_TXT[p.goal]})</span><b>${fmt(RATE[p.goal][0] / 100 * p.weight, 2)} a ${fmt(RATE[p.goal][1] / 100 * p.weight, 2)} kg/sem</b></div>
    <div><span>IMC</span><b>${fmt(bmi, 1)}</b></div>
    <div><span>Peso saludable para ${p.height} cm</span><b>${fmt(18.5 * h * h, 1)} – ${fmt(24.9 * h * h, 1)} kg</b></div>`;
  const e = energy();
  $('enCalc').innerHTML = `
    <div><span>Metabolismo basal</span><b>${fmt(e.bmr)} kcal</b></div>
    <div><span>Gasto diario (×${fmt(e.f, 2)})</span><b>${fmt(e.tdee)} kcal</b></div>
    <div><span>Calorías para ${GOAL_TXT[p.goal]}</span><b>${fmt(e.target)} kcal</b></div>
    <div><span>Proteína · Grasa · Carbohidratos</span><b>${e.prot} · ${e.fat} · ${e.carbs} g</b></div>`;
  $('enNote').textContent = `Fórmula Mifflin-St Jeor con tu edad, sexo, peso y altura. La actividad sale de tus últimos 14 días: ${fmt(e.steps)} pasos de promedio y ${fmt(e.gymWk, 1)} días de gym por semana. Es una estimación: si tu peso no se mueve como esperas, la tendencia real manda.`;
  const rt = realTdee();
  if (rt && rt.tdee) $('enCalc').insertAdjacentHTML('beforeend', `<div><span>Gasto real (según lo que comes y tu peso, ${rt.days} días)</span><b>${fmt(rt.tdee)} kcal</b></div>`);
  else if (rt && rt.need) $('enNote').textContent += ` Registra calorías ${rt.need} días más y calcularé tu gasto real.`;
  renderSummary(); renderMeas(); renderPhotos(); renderBadges();
  $('sugList').innerHTML = suggestions().map(s => `<div class="sug ${s.t}"><div><b>${esc(s.h)}</b><span>${esc(s.b)}</span></div></div>`).join('');
  aiStatus();
}
$('wIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('wSave').click(); });
$('wSave').onclick = () => {
  const v = parseFloat(String($('wIn').value).replace(',', '.'));
  if (!(v >= 30 && v <= 300)) return toast('Escribe un peso válido');
  const prev = db.weights[db.weights.length - 1];
  logWeight(Math.round(v * 10) / 10); $('wIn').value = ''; vibrate(20);
  toast(prev ? `Peso guardado (${v - prev.kg >= 0 ? '+' : ''}${fmt(v - prev.kg, 1)} kg)` : 'Peso guardado');
  render();
};

/* ================= Coach con IA (Claude) ================= */
let aiMsgs = [];
const aiKey = () => { try { return localStorage.getItem('forma.aikey') || ''; } catch (e) { return ''; } };
function aiStatus() {
  $('aiBox').style.display = aiKey() ? '' : 'none';
  $('aiKeyBtn').textContent = aiKey() ? 'Clave' : 'Activar';
  $('aiStatus').textContent = aiKey() ? 'Claude analiza tus datos reales y te da un plan. Cada consulta usa tu cuenta de Anthropic.' : 'No hace falta: todo lo de arriba funciona sin IA. Si quieres un análisis escrito por Claude, toca "Activar" y pega una clave de Anthropic.'; }
$('aiKeyBtn').onclick = () => {
  openSheet(`<h3>Clave de Anthropic</h3><div class="sub">Se guarda solo en este celular. Créala en console.anthropic.com → API Keys.</div>
    <label class="field"><span>Clave</span><input class="input" id="kIn" type="password" placeholder="sk-ant-…" value="${esc(aiKey())}"></label>
    <div class="btnrow"><button class="btn danger" id="kDel">Borrar</button><button class="btn primary" id="kOk">Guardar</button></div>`, (b) => {
    b.querySelector('#kOk').onclick = () => { try { localStorage.setItem('forma.aikey', b.querySelector('#kIn').value.trim()); } catch (e) {} closeSheet(); aiStatus(); toast('Clave guardada'); };
    b.querySelector('#kDel').onclick = () => { try { localStorage.removeItem('forma.aikey'); } catch (e) {} closeSheet(); aiStatus(); };
  });
};
function dataSummary() {
  const days = [];
  for (let i = 0; i < 30; i++) {
    const dt = fromKey(todayKey()); dt.setDate(dt.getDate() - i);
    const k = keyOf(dt), d = peek(k); if (!touched(d)) continue;
    days.push({ fecha: k, gym: d.gym, agua_L: +(d.water / 1000).toFixed(2), meta_agua_L: goals(k).water, proteina_g: protOf(d), meta_proteina_g: goals(k).prot, pasos: d.steps,
      ejercicios: d.ex.map(x => ({ maquina: x.m, min: x.min, series: x.sets, reps: x.reps, kg: x.kg, hora: x.at })),
      batidos: Object.entries(d.shakes || {}).map(([id, h]) => ({ nombre: db.plan.find(s => s.id === id)?.name, hora: h })) });
  }
  const t = trend(), e = energy(), p = db.profile;
  return {
    perfil: { edad: p.age, sexo: p.sex === 'm' ? 'mujer' : 'hombre', peso_kg: p.weight, altura_cm: p.height, objetivo: GOAL_TXT[p.goal], meta_pasos: p.stepGoal, meta_dias_gym_semana: p.gymDays },
    pesajes: db.weights.slice(-30),
    calculos: { tendencia_kg_semana: t ? +t.perWeek.toFixed(2) : null, tendencia_pct_semana: t ? +t.pct.toFixed(2) : null, ritmo_ideal_pct_semana: RATE[p.goal], imc: +(p.weight / (p.height / 100) ** 2).toFixed(1), metabolismo_basal: e.bmr, gasto_diario_estimado: e.tdee, calorias_objetivo: e.target, macros_g: { proteina: e.prot, grasa: e.fat, carbohidratos: e.carbs } },
    plan_batidos: db.plan.map(s => ({ nombre: s.name, proteina_g: s.g, hora: s.time, dias: s.days.map(i => DAYS_LONG[i]) })),
    ultimos_30_dias: days
  };
}
const SYSTEM = `Eres el coach personal de fitness dentro de la app Forma. Respondes en español, con tono cercano y directo.
Reglas:
- Usa solo los datos que te pasan. No inventes cifras; si faltan datos para algo, dilo y explica qué registrar.
- Los cálculos de la app (tendencia, calorías, macros) ya están hechos; apóyate en ellos y cítalos.
- Da consejos concretos y accionables: qué cambiar en entrenamiento, proteína, agua, pasos y calorías, con números.
- Sé breve: máximo unas 200 palabras, en viñetas cortas. Sin tablas ni encabezados de markdown.
- No eres médico: si algo sugiere un problema de salud, recomienda consultar a un profesional.`;
async function askAI(text, withData) {
  if (!aiKey()) { $('aiKeyBtn').click(); return; }
  if (!window.Anthropic) return toast('No se pudo cargar la IA');
  const out = $('aiOut');
  out.insertAdjacentHTML('beforeend', `<div class="msg me">${esc(withData ? 'Analiza mi progreso' : text)}</div><div class="msg load" id="aiLoad">Pensando…</div>`);
  const content = withData ? `Estos son mis datos reales:\n${JSON.stringify(dataSummary())}\n\n${text}` : text;
  aiMsgs.push({ role: 'user', content });
  $('aiAnalyze').disabled = $('aiAsk').disabled = true;
  try {
    const client = new window.Anthropic({ apiKey: aiKey(), dangerouslyAllowBrowser: true });
    const res = await client.beta.messages.create({
      model: 'claude-opus-5-5', max_tokens: 4000, system: SYSTEM, messages: aiMsgs,
      output_config: { effort: 'medium' },
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default'
    });
    let reply;
    if (res.stop_reason === 'refusal') reply = 'La IA no pudo responder a esta pregunta. Prueba a formularla de otra manera.';
    else reply = res.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim() || '(sin respuesta)';
    aiMsgs.push({ role: 'assistant', content: res.content });
    $('aiLoad').outerHTML = `<div class="msg">${esc(reply)}</div>`;
  } catch (err) {
    aiMsgs.pop();
    const A = window.Anthropic;
    const msg = err instanceof A.AuthenticationError ? 'La clave no es válida. Revísala en "Clave".'
      : err instanceof A.RateLimitError ? 'Demasiadas consultas seguidas. Espera un minuto.'
      : err instanceof A.APIError && err.status ? `Error de la API (${err.status}).`
      : 'Sin conexión con la IA. Revisa tu internet.';
    $('aiLoad').outerHTML = `<div class="msg">${esc(msg)}</div>`;
  } finally { $('aiAnalyze').disabled = $('aiAsk').disabled = false; }
}
$('aiAnalyze').onclick = () => { aiMsgs = []; $('aiOut').innerHTML = ''; askAI('Analiza mi progreso y dime las 3–5 cosas más importantes que debo cambiar esta semana.', true); };
$('aiQ').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('aiAsk').click(); });
$('aiAsk').onclick = () => { const q = $('aiQ').value.trim(); if (!q) return; $('aiQ').value = ''; askAI(q, aiMsgs.length === 0); };

/* ================= CALENDARIO ================= */
let calM = new Date(); calM.setDate(1);
let calSel = cur;
function renderCal() {
  $('calTitle').textContent = calM.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  const first = new Date(calM), off = wd(first), dim = new Date(calM.getFullYear(), calM.getMonth() + 1, 0).getDate();
  const tk = todayKey(); let html = '';
  for (let i = 0; i < off; i++) html += '<div class="cd out"></div>';
  let gymN = 0, wOk = 0, pOk = 0, steps = 0, mins = 0;
  for (let n = 1; n <= dim; n++) {
    const k = keyOf(new Date(calM.getFullYear(), calM.getMonth(), n)), d = peek(k), r = ratios(k);
    if (d?.gym) gymN++; if (r.w >= 1) wOk++; if (r.p >= 1) pOk++; steps += d?.steps || 0; mins += minOf(d);
    const dots = d ? `${r.w >= 1 ? '<i class="c1"></i>' : ''}${r.p >= 1 ? '<i class="c2"></i>' : ''}${r.s >= 1 ? '<i class="c3"></i>' : ''}` : '';
    html += `<button class="cd ${d?.gym ? 'gym' : ''} ${k === tk ? 'today' : ''} ${k === calSel ? 'sel' : ''} ${k > tk ? 'future' : ''}" data-k="${k}">${n}<span class="ds">${dots}</span></button>`;
  }
  $('calGrid').innerHTML = html;
  $('calGrid').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { calSel = b.dataset.k; vibrate(8); renderCal(); });
  $('monthStats').innerHTML = `<div><b>${gymN}</b><span>días de gym</span></div><div><b>${fmt(mins / 60, 1)} h</b><span>entrenando</span></div><div><b>${wOk}</b><span>días con agua ok</span></div><div><b>${pOk}</b><span>días con proteína ok</span></div><div><b>${fmt(steps)}</b><span>pasos totales</span></div><div><b>${fmt(kmOf(steps), 1)}</b><span>km recorridos</span></div>`;

  const d = touched(peek(calSel)) ? peek(calSel) : null, dt = fromKey(calSel);
  const title = dt.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  $('calDay').innerHTML = `<div class="row-h"><div class="label big">${title}</div>${calSel <= tk ? '<button class="btn sm primary" id="calOpen">Editar</button>' : ''}</div>` + (d ? `
    <div class="calc">
      <div><span>Gimnasio</span><b>${d.gym ? 'Sí ✓' : 'No'}</b></div>
      <div><span>Agua</span><b>${fmt(d.water / 1000, 1)} / ${fmt(goals(calSel).water, 1)} L</b></div>
      <div><span>Proteína</span><b>${protOf(d)} / ${goals(calSel).prot} g</b></div>
      <div><span>Pasos</span><b>${fmt(d.steps)}</b></div>
      ${d.ex.length ? `<div><span>Máquinas</span><b>${d.ex.map(x => esc(x.m) + ' ' + x.min + "'").join(', ')}</b></div>` : ''}
      ${Object.keys(d.shakes || {}).length ? `<div><span>Batidos</span><b>${Object.entries(d.shakes).map(([id, t]) => esc(db.plan.find(s => s.id === id)?.name || 'Batido') + ' ' + t).join(', ')}</b></div>` : ''}
    </div>` : empty('calendar', 'Sin registros este día.'));
  const o = $('calOpen'); if (o) o.onclick = () => { cur = calSel; go('hoy'); };
  $('calNext').disabled = calM.getFullYear() * 12 + calM.getMonth() >= new Date().getFullYear() * 12 + new Date().getMonth();
}
$('calPrev').onclick = () => { calM.setMonth(calM.getMonth() - 1); renderCal(); };
$('calNext').onclick = () => { calM.setMonth(calM.getMonth() + 1); renderCal(); };

/* ================= PERFIL ================= */
function renderPerfil() {
  const p = db.profile;
  $('pfName').value = p.name; $('pfAge').value = p.age;
  document.querySelectorAll('#pfSex button').forEach(b => b.classList.toggle('on', b.dataset.v === p.sex)); $('pfWeight').value = p.weight; $('pfHeight').value = p.height;
  $('pfSteps').value = p.stepGoal; $('pfDays').value = p.gymDays;
  document.querySelectorAll('#pfGoal button').forEach(b => b.classList.toggle('on', b.dataset.v === p.goal));
  const g = goals(), bmi = p.weight / Math.pow(p.height / 100, 2);
  const bmiTxt = bmi < 18.5 ? 'bajo' : bmi < 25 ? 'normal' : bmi < 30 ? 'sobrepeso' : 'obesidad';
  $('pfCalc').innerHTML = `
    <div><span>Agua base al día</span><b>${fmt(p.weight * 0.035, 1)} L</b></div>
    <div><span>Agua en día de gym</span><b>${fmt(p.weight * 0.035 + 0.5, 1)} L</b></div>
    <div><span>Proteína (${PROT_FACTOR[p.goal]} g/kg)</span><b>${g.prot} g</b></div>
    <div><span>Proteína por comida (4)</span><b>${Math.round(g.prot / 4)} g</b></div>
    <div><span>Pasos → km</span><b>${fmt(kmOf(p.stepGoal), 1)} km</b></div>
    <div><span>IMC</span><b>${fmt(bmi, 1)} · ${bmiTxt}</b></div>
    <div><span>Calorías diarias (${GOAL_TXT[p.goal]})</span><b>${fmt(energy().target)} kcal</b></div>`;
  renderNt(); renderLook();
}
const bindNum = (id, f, min, max) => $(id).addEventListener('change', () => { const v = +$(id).value; if (v >= min && v <= max) { db.profile[f] = v; save(); render(); } else { toast('Ese valor no es válido'); renderPerfil(); } });
$('pfName').addEventListener('input', () => { db.profile.name = $('pfName').value.trim(); save(); renderTop(); });
$('pfWeight').addEventListener('change', () => { const v = parseFloat(String($('pfWeight').value).replace(',', '.')); if (v >= 30 && v <= 300) { logWeight(Math.round(v * 10) / 10); render(); } else { toast('Ese valor no es válido'); renderPerfil(); } });
bindNum('pfAge', 'age', 12, 100);
document.querySelectorAll('#pfSex button').forEach(b => b.onclick = () => { db.profile.sex = b.dataset.v; save(); render(); }); bindNum('pfHeight', 'height', 120, 230);
bindNum('pfSteps', 'stepGoal', 1000, 50000); bindNum('pfDays', 'gymDays', 1, 7);
document.querySelectorAll('#pfGoal button').forEach(b => b.onclick = () => { db.profile.goal = b.dataset.v; save(); render(); });
/* =====================================================================
   NUEVAS FUNCIONES v2
   ===================================================================== */
const isApp = () => !!window.cordova;
const ready = new Promise(res => { if (!window.cordova) return res(); document.addEventListener('deviceready', res, { once: true }); setTimeout(res, 5000); });
const dateAdd = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
const kcalOfEntry = (x) => +x.kcal || 0;
const kcalDay = (d) => (d?.prot || []).reduce((a, x) => a + kcalOfEntry(x), 0);

/* ---------- 1. Notificaciones locales ---------- */
const LN = () => window.cordova?.plugins?.notification?.local;
const NT_ID = { shake: 1000, water: 2000, weigh: 3000, gym: 4000, rest: 9000 };
const lnWeekday = (i) => (i + 1) % 7; // nuestro 0=lunes → plugin 1=lunes … 0=domingo
async function scheduleReminders() {
  await ready; const ln = LN(); if (!ln) return;
  const s = db.settings, list = [];
  const base = { androidChannelId: 'forma', androidChannelName: 'Recordatorios', foreground: true };
  if (s.nt.shakes) db.plan.forEach((p, pi) => p.days.forEach(di => {
    const [h, m] = p.time.split(':').map(Number);
    list.push({ ...base, id: NT_ID.shake + pi * 10 + di, title: '🥤 Hora de tu batido', text: `${p.name} · ${p.g} g de proteína`, trigger: { every: { weekday: lnWeekday(di), hour: h, minute: m } } });
  }));
  if (s.nt.water) [10, 12, 14, 16, 18, 20].forEach((h, i) => list.push({ ...base, id: NT_ID.water + i, title: '💧 Toca beber agua', text: 'Un vaso ahora te acerca a tu meta del día', trigger: { every: { hour: h, minute: 0 } } }));
  if (s.nt.weigh) [0, 3].forEach((w, i) => list.push({ ...base, id: NT_ID.weigh + i, title: '⚖️ Pesaje', text: 'Pésate en ayunas y regístralo en Coach', trigger: { every: { weekday: lnWeekday(w), hour: 8, minute: 0 } } }));
  if (s.nt.gym) { const [h, m] = (s.ntGymTime || '18:30').split(':').map(Number); list.push({ ...base, id: NT_ID.gym, title: '🔥 ¿Entrenas hoy?', text: 'Mantén tu racha: marca el gym en Forma cuando vayas', trigger: { every: { hour: h, minute: m } } }); }
  const keep = new Set(list.map(n => n.id));
  ln.getIds(ids => {
    const old = (ids || []).filter(id => id !== NT_ID.rest && !keep.has(id));
    const go2 = () => list.length && ln.schedule(list);
    old.length ? ln.cancel(old, go2) : go2();
  });
}
async function ntStatus() {
  const el = $('ntStatus'); if (!el) return;
  if (!isApp()) { el.textContent = 'Los recordatorios funcionan en la app instalada.'; return; }
  await ready; const ln = LN(); if (!ln) { el.textContent = 'No disponible en este dispositivo.'; return; }
  ln.hasPermission(ok => { el.textContent = ok ? 'Llegan aunque la app esté cerrada. Android puede retrasarlos unos minutos para ahorrar batería.' : 'Falta el permiso de notificaciones. Activa un recordatorio y te lo pedirá.'; });
}
function renderNt() {
  document.querySelectorAll('#ntToggles .tg').forEach(t => t.querySelector('.switch').classList.toggle('on', !!db.settings.nt[t.dataset.nt]));
  $('ntGymTime').value = db.settings.ntGymTime || '18:30';
  $('ntGymTimeW').style.display = db.settings.nt.gym ? '' : 'none';
  ntStatus();
}
document.querySelectorAll('#ntToggles .tg').forEach(t => t.onclick = async () => {
  const k = t.dataset.nt; db.settings.nt[k] = !db.settings.nt[k]; save(); renderNt(); vibrate();
  if (db.settings.nt[k] && isApp()) { await ready; const ln = LN(); ln && ln.requestPermission(() => { scheduleReminders(); ntStatus(); }); }
  else scheduleReminders();
});
$('ntGymTime').onchange = () => { db.settings.ntGymTime = $('ntGymTime').value || '18:30'; save(); scheduleReminders(); };
$('ntTest').onclick = async () => {
  if (!isApp()) return toast('Prueba disponible en la app instalada');
  await ready; const ln = LN(); if (!ln) return toast('Notificaciones no disponibles');
  ln.schedule({ id: 9999, title: 'Forma', text: 'Así se verán tus recordatorios ✅', androidChannelId: 'forma', androidChannelName: 'Recordatorios', trigger: { in: 3, unit: 'second' } });
  toast('Te llegará en 3 segundos');
};

/* ---------- 2. Pasos desde Health Connect ---------- */
const HC = () => window.cordova?.plugins?.health;
async function hcSync(silent) {
  if (!db.settings.hc) return; await ready; const h = HC(); if (!h) return;
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 6);
  h.queryAggregated({ startDate: start, endDate: new Date(), dataType: 'steps', bucket: 'day' }, (res) => {
    let changed = false;
    for (const b of res || []) {
      const k = keyOf(new Date(b.startDate)), v = Math.round(+b.value || 0);
      if (v > 0 && (!peek(k) || v > peek(k).steps)) { day(k).steps = v; changed = true; }
    }
    db.settings.hcLast = Date.now(); save();
    if (changed) { render(); checkBadges(); if (!silent) toast('Pasos actualizados desde Health Connect'); }
    else if (!silent) toast('Tus pasos ya están al día');
  }, (e) => { if (!silent) toast('No se pudieron leer los pasos'); });
}
function renderHc() {
  const el = $('hcStatus'), b = $('hcBtn'); if (!el) return;
  if (db.settings.hc) {
    b.textContent = 'Actualizar pasos';
    el.textContent = `Conectado a Health Connect` + (db.settings.hcLast ? ` · última lectura ${new Date(db.settings.hcLast).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}` : '');
  } else { b.textContent = 'Conectar Health Connect'; el.textContent = isApp() ? 'Lee solos tus pasos de Samsung Health, Google Fit o tu reloj.' : 'Disponible en la app instalada.'; }
}
$('hcBtn').onclick = async () => {
  if (db.settings.hc) return hcSync(false);
  if (!isApp()) return toast('Disponible en la app instalada');
  await ready; const h = HC(); if (!h) return toast('Health Connect no está disponible');
  h.isAvailable((ok) => {
    if (!ok) { toast('Instala Health Connect desde Play Store'); try { h.getHealthConnectFromStore(() => {}, () => {}); } catch (e) {} return; }
    h.requestAuthorization([{ read: ['steps'] }], () => { db.settings.hc = true; save(); renderHc(); hcSync(false); },
      () => toast('Sin permiso. Actívalo en Health Connect › Forma'));
  }, () => toast('Health Connect no está disponible'));
};

/* ---------- 3. Rutinas ---------- */
const lastSet = (m) => {
  const ks = Object.keys(db.days).sort().reverse();
  for (const k of ks) { const x = (db.days[k].ex || []).filter(e => e.m === m && e.kg).pop(); if (x) return { ...x, k }; }
  return null;
};
// Peso sugerido: si en la última sesión completaste todas las reps objetivo → +2,5 % (redondeado a 0,5 kg)
function suggestKg(m, reps) {
  const l = lastSet(m); if (!l) return 0;
  if ((+l.reps || 0) >= reps) return Math.round(l.kg * 1.025 * 2) / 2 > l.kg ? Math.round(l.kg * 1.025 * 2) / 2 : l.kg + 0.5;
  return l.kg;
}
function routineFor(k) { const w = wd(fromKey(k)); return db.routines.filter(r => r.days.includes(w)); }
function renderRoutines() {
  const today = routineFor(todayKey());
  if (db.workout) { $('routineToday').innerHTML = `<div class="today-r live"><div><span class="sub">Entreno en curso</span><b>${esc(db.workout.name)}</b><span class="sub">desde las ${new Date(db.workout.start).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span></div><button class="btn primary" id="wkResume">Continuar</button></div>`; $('wkResume').onclick = drawWorkout; }
  else $('routineToday').innerHTML = today.length ? today.map(r => `<div class="today-r"><div><span class="sub">Hoy toca</span><b>${esc(r.name)}</b><span class="sub">${r.items.length} ejercicio${r.items.length === 1 ? '' : 's'} · ${r.items.reduce((a, i) => a + i.sets, 0)} series</span></div><button class="btn primary" data-start="${r.id}">Empezar</button></div>`).join('') : '';
  $('routineList').innerHTML = db.routines.length ? db.routines.map(r => `<div class="item"><div class="ic">📋</div><div class="t"><b>${esc(r.name)}</b><span>${daysLabel(r.days)} · ${r.items.length} ejercicio${r.items.length === 1 ? '' : 's'}</span></div><button class="x" data-start="${r.id}" title="Empezar">▶</button><button class="x" data-redit="${r.id}">✎</button></div>`).join('') : empty('dumbbell', 'Crea tu primera rutina, por ejemplo "Pecho y tríceps" los lunes.');
  document.querySelectorAll('[data-start]').forEach(b => b.onclick = () => startWorkout(db.routines.find(r => r.id === b.dataset.start)));
  document.querySelectorAll('[data-redit]').forEach(b => b.onclick = () => routineSheet(db.routines.find(r => r.id === b.dataset.redit)));
}
function routineSheet(r) {
  const e = r ? JSON.parse(JSON.stringify(r)) : { name: '', days: [], items: [] };
  const draw = (b) => {
    b.querySelector('#rItems').innerHTML = e.items.length ? e.items.map((it, i) => `<div class="item"><div class="t"><b>${esc(it.m)}</b><span>${it.sets} series × ${it.reps} reps</span></div><button class="x" data-up="${i}">↑</button><button class="x" data-rm="${i}">×</button></div>`).join('') : '<div class="sub">Todavía no hay ejercicios. Añádelos abajo.</div>';
    b.querySelectorAll('[data-rm]').forEach(x => x.onclick = () => { e.items.splice(+x.dataset.rm, 1); draw(b); });
    b.querySelectorAll('[data-up]').forEach(x => x.onclick = () => { const i = +x.dataset.up; if (i > 0) { [e.items[i - 1], e.items[i]] = [e.items[i], e.items[i - 1]]; draw(b); } });
  };
  openSheet(`<h3>${r ? 'Editar rutina' : 'Nueva rutina'}</h3>
    <label class="field"><span>Nombre</span><input class="input" id="rN" value="${esc(e.name)}" placeholder="Ej. Pecho y tríceps"></label>
    <div class="field"><span>Días</span><div class="days7" id="rD">${DAYS.map((x, i) => `<button data-d="${i}" class="${e.days.includes(i) ? 'on' : ''}">${x}</button>`).join('')}</div></div>
    <div class="field"><span>Ejercicios</span><div class="list" id="rItems"></div></div>
    <div class="addrow"><select class="input" id="rM">${machineOptions()}</select><input class="input" id="rS" type="number" inputmode="numeric" value="3" title="Series"><input class="input" id="rR" type="number" inputmode="numeric" value="10" title="Reps"><button class="btn ghost" id="rAdd">+</button></div>
    <div class="sub">Elige la máquina, las series y las repeticiones, y toca +.</div>
    <div class="btnrow">${r ? '<button class="btn danger" id="rDel">Eliminar</button>' : ''}<button class="btn primary" id="rOk">Guardar</button></div>`, (b) => {
    draw(b);
    b.querySelectorAll('#rD [data-d]').forEach(x => x.onclick = () => x.classList.toggle('on'));
    b.querySelector('#rAdd').onclick = () => {
      const m = b.querySelector('#rM').value; if (!m) return toast('Añade máquinas primero');
      e.items.push({ m, sets: Math.max(1, Math.min(10, +b.querySelector('#rS').value || 3)), reps: Math.max(1, Math.min(50, +b.querySelector('#rR').value || 10)) }); draw(b);
    };
    b.querySelector('#rOk').onclick = () => {
      const name = b.querySelector('#rN').value.trim(); if (!name) return toast('Ponle un nombre');
      if (!e.items.length) return toast('Añade al menos un ejercicio');
      const obj = { id: r?.id || uid(), name, days: [...b.querySelectorAll('#rD [data-d].on')].map(x => +x.dataset.d), items: e.items };
      if (r) Object.assign(r, obj); else db.routines.push(obj);
      save(); closeSheet(); render(); toast('Rutina guardada');
    };
    const del = b.querySelector('#rDel'); if (del) del.onclick = () => { db.routines = db.routines.filter(x => x.id !== r.id); save(); closeSheet(); render(); };
  });
}
$('addRoutine').onclick = () => routineSheet();

// Modo entreno
let wk = null;
function startWorkout(r) {
  if (!r) return;
  cur = todayKey();
  wk = { id: r.id, name: r.name, start: Date.now(), items: r.items.map(it => ({ m: it.m, sets: Array.from({ length: it.sets }, () => ({ kg: suggestKg(it.m, it.reps), reps: it.reps, done: false })), target: it.reps })) };
  db.workout = wk; save(); drawWorkout();
}
function drawWorkout() {
  wk = db.workout; if (!wk) return closeSheet();
  const total = wk.items.reduce((a, i) => a + i.sets.length, 0), done = wk.items.reduce((a, i) => a + i.sets.filter(s => s.done).length, 0);
  openSheet(`<h3>${esc(wk.name)}</h3><div class="sub">${done} de ${total} series hechas · el peso sugerido sale de tu última sesión</div>
    <div class="mini lg wkbar"><i style="width:${total ? done / total * 100 : 0}%"></i></div>
    ${wk.items.map((it, i) => { const l = lastSet(it.m); return `<div class="wk-ex"><div class="row-h"><b>${esc(it.m)}</b><span class="sub">${l ? `Última vez: ${fmt(l.kg, 1)} kg × ${l.reps}` : 'Primera vez: elige un peso cómodo'}</span></div>
      ${it.sets.map((s, j) => `<div class="setrow ${s.done ? 'done' : ''}"><span class="n">${j + 1}</span><input class="input" type="number" inputmode="decimal" step="0.5" value="${s.kg || ''}" placeholder="kg" data-kg="${i}:${j}"><span class="sub">kg ×</span><input class="input" type="number" inputmode="numeric" value="${s.reps}" data-reps="${i}:${j}"><button class="check ${s.done ? 'on' : ''}" data-set="${i}:${j}">${s.done ? '✓' : ''}</button></div>`).join('')}</div>`; }).join('')}
    <div class="btnrow"><button class="btn danger" id="wkCancel">Descartar</button><button class="btn primary" id="wkEnd">Terminar entreno</button></div>`, (b) => {
    const at = (a) => a.split(':').map(Number);
    b.querySelectorAll('[data-kg]').forEach(x => x.onchange = () => { const [i, j] = at(x.dataset.kg); wk.items[i].sets[j].kg = Math.max(0, parseFloat(String(x.value).replace(',', '.')) || 0); save(); });
    b.querySelectorAll('[data-reps]').forEach(x => x.onchange = () => { const [i, j] = at(x.dataset.reps); wk.items[i].sets[j].reps = Math.max(0, Math.round(+x.value || 0)); save(); });
    b.querySelectorAll('[data-set]').forEach(x => x.onclick = () => {
      const [i, j] = at(x.dataset.set), s = wk.items[i].sets[j];
      const row = x.closest('.setrow'); s.kg = Math.max(0, parseFloat(String(row.querySelector('[data-kg]').value).replace(',', '.')) || 0); s.reps = Math.max(0, Math.round(+row.querySelector('[data-reps]').value || 0));
      s.done = !s.done; save(); vibrate(20);
      if (s.done) startRest(db.settings.rest || 90);
      const y = $('sheet').scrollTop; drawWorkout(); $('sheet').scrollTop = y;
    });
    b.querySelector('#wkCancel').onclick = () => { if (!confirm('¿Descartar este entreno?')) return; db.workout = null; wk = null; save(); closeSheet(); stopRest(); };
    b.querySelector('#wkEnd').onclick = finishWorkout;
  });
}
function finishWorkout() {
  const w = db.workout; if (!w) return;
  const doneItems = w.items.map(it => ({ m: it.m, sets: it.sets.filter(s => s.done) })).filter(it => it.sets.length);
  if (!doneItems.length) return toast('Marca al menos una serie como hecha');
  const mins = Math.max(1, Math.round((Date.now() - w.start) / 60000)), per = Math.max(1, Math.round(mins / doneItems.length));
  const d = day(todayKey()), at = nowHM(), before = prMap();
  for (const it of doneItems) {
    const best = it.sets.reduce((a, s) => (s.kg > a.kg || (s.kg === a.kg && s.reps > a.reps)) ? s : a, it.sets[0]);
    d.ex.push({ id: uid(), m: it.m, min: per, at, sets: it.sets.length, reps: best.reps, kg: best.kg, setsDetail: it.sets.map(s => ({ kg: s.kg, reps: s.reps })) });
  }
  d.gym = true; db.workout = null; wk = null; save(); closeSheet(); stopRest();
  const news = newPRs(before);
  confetti(); toast(news.length ? `🏆 ¡Nuevo récord en ${news[0]}!` : `Entreno guardado · ${mins} min`);
  checkBadges(); go('gym');
}

/* ---------- 4. Descanso entre series ---------- */
let rest = null, restT = null;
function startRest(sec) {
  stopRest(true);
  rest = { end: Date.now() + sec * 1000, total: sec };
  $('restPill').classList.add('on');
  restT = setInterval(drawRest, 250); drawRest();
  ready.then(() => { const ln = LN(); ln && ln.schedule({ id: NT_ID.rest, title: '⏱️ Descanso terminado', text: 'Vamos con la siguiente serie', androidChannelId: 'forma_rest', androidChannelName: 'Descanso', androidChannelImportance: 'IMPORTANCE_HIGH', trigger: { at: new Date(rest.end) } }); });
}
function stopRest(silent) {
  clearInterval(restT); restT = null; rest = null; $('restPill').classList.remove('on');
  ready.then(() => { const ln = LN(); ln && ln.cancel(NT_ID.rest); });
}
function drawRest() {
  if (!rest) return;
  const left = Math.max(0, Math.ceil((rest.end - Date.now()) / 1000));
  $('restTime').textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`;
  const c = 2 * Math.PI * 16; $('restRing').style.strokeDasharray = c; $('restRing').style.strokeDashoffset = c * (1 - left / rest.total);
  if (left <= 0) { clearInterval(restT); restT = null; vibrate([300, 120, 300, 120, 300]); toast('⏱️ ¡A la siguiente serie!'); $('restPill').classList.add('done'); setTimeout(() => { $('restPill').classList.remove('on', 'done'); rest = null; }, 2500); }
}
$('restPlus').onclick = () => { if (rest) { rest.end += 15000; rest.total += 15; drawRest(); ready.then(() => { const ln = LN(); ln && ln.schedule({ id: NT_ID.rest, title: '⏱️ Descanso terminado', text: 'Vamos con la siguiente serie', androidChannelId: 'forma_rest', trigger: { at: new Date(rest.end) } }); }); } };
$('restStop').onclick = () => stopRest();
document.querySelectorAll('[data-rest]').forEach(b => b.onclick = () => { db.settings.rest = +b.dataset.rest; save(); startRest(+b.dataset.rest); renderRestDef(); });
function renderRestDef() { $('restDefTxt').textContent = `Rutinas: ${(db.settings.rest || 90) >= 120 ? (db.settings.rest / 60) + ' min' : (db.settings.rest || 90) + ' s'}`; document.querySelectorAll('[data-rest]').forEach(b => b.classList.toggle('on', +b.dataset.rest === (db.settings.rest || 90))); }

/* ---------- 7. Récords personales ---------- */
const e1rm = (kg, reps) => reps <= 1 ? kg : kg * (1 + reps / 30); // fórmula de Epley
function prMap() {
  const m = {};
  for (const k of Object.keys(db.days).sort()) for (const x of db.days[k].ex || []) {
    if (!x.kg) continue;
    const sets = x.setsDetail?.length ? x.setsDetail : [{ kg: +x.kg, reps: +x.reps || 1 }];
    for (const s of sets) {
      const r = m[x.m] || (m[x.m] = { kg: 0, reps: 0, rm: 0, k: '' });
      const rm = e1rm(+s.kg, +s.reps || 1);
      if (+s.kg > r.kg || (+s.kg === r.kg && (+s.reps || 0) > r.reps)) { r.kg = +s.kg; r.reps = +s.reps || 0; r.k = k; }
      if (rm > r.rm) r.rm = rm;
    }
  }
  return m;
}
function newPRs(before) {
  const after = prMap(), out = [];
  for (const [m, r] of Object.entries(after)) if (before[m] && r.kg > before[m].kg) out.push(m);
  return out;
}
function renderPRs() {
  const m = Object.entries(prMap()).sort((a, b) => b[1].rm - a[1].rm);
  $('prList').innerHTML = m.length ? m.slice(0, 8).map(([n, r]) => `<div class="item"><div class="ic">🏆</div><div class="t"><b>${esc(n)}</b><span>${fmt(r.kg, 1)} kg × ${r.reps} · ${r.k.slice(8)}/${r.k.slice(5, 7)}</span></div><div class="rm"><b>${fmt(r.rm, 1)}</b><span>kg 1RM</span></div></div>`).join('') : empty('chart', 'Registra ejercicios con peso y aquí verás tus mejores marcas.');
}

/* ---------- 5. Medidas corporales ---------- */
const MEAS = [['cintura', 'Cintura'], ['pecho', 'Pecho'], ['brazo', 'Brazo'], ['pierna', 'Pierna'], ['cadera', 'Cadera']];
function spark(vals) {
  if (vals.length < 2) return '';
  const W = 80, H = 24, lo = Math.min(...vals), hi = Math.max(...vals), r = hi - lo || 1;
  return `<svg class="spark" viewBox="0 0 ${W} ${H}"><path d="${vals.map((v, i) => (i ? 'L' : 'M') + (i / (vals.length - 1) * W).toFixed(1) + ' ' + (H - 2 - (v - lo) / r * (H - 4)).toFixed(1)).join(' ')}"/></svg>`;
}
function renderMeas() {
  const rows = MEAS.map(([k, n]) => {
    const pts = db.measures.filter(x => x[k] > 0).map(x => ({ d: x.d, v: x[k] }));
    if (!pts.length) return '';
    const last = pts[pts.length - 1], first = pts[0], dl = last.v - first.v;
    return `<div class="item"><div class="t"><b>${n}</b><span>${fmt(last.v, 1)} cm${pts.length > 1 ? ` · ${dl > 0 ? '+' : ''}${fmt(dl, 1)} cm desde ${first.d.slice(8)}/${first.d.slice(5, 7)}` : ''}</span></div>${spark(pts.slice(-12).map(p => p.v))}</div>`;
  }).join('');
  $('measHist').style.display = db.measures.length ? '' : 'none';
  $('measList').innerHTML = rows || empty('chart', 'Mídete cada 2 a 4 semanas: a veces la báscula no cambia, pero la cintura sí.');
}
$('measHist').onclick = () => {
  const draw = (b) => {
    b.querySelector('#mhL').innerHTML = db.measures.slice().reverse().map(m => `<div class="item"><div class="t"><b>${fromKey(m.d).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</b><span>${MEAS.filter(([k]) => m[k]).map(([k, n]) => `${n} ${fmt(m[k], 1)}`).join(' · ')} cm</span></div><button class="x" data-md="${m.d}">×</button></div>`).join('') || '<div class="sub">Sin medidas.</div>';
    b.querySelectorAll('[data-md]').forEach(x => x.onclick = () => { const i = db.measures.findIndex(m => m.d === x.dataset.md); if (i >= 0) { removeWithUndo(db.measures, i, 'Medida borrada', () => draw(b)); draw(b); } });
  };
  openSheet(`<h3>Historial de medidas</h3><div class="list" id="mhL" style="margin-top:10px"></div>`, draw);
};
$('addMeas').onclick = () => {
  const last = db.measures[db.measures.length - 1] || {};
  openSheet(`<h3>Medidas de hoy</h3><div class="sub">En centímetros, con cinta métrica y sin apretar. Deja vacío lo que no midas.</div>
    <div class="grid2 tight">${MEAS.map(([k, n]) => `<label class="field"><span>${n}</span><input class="input" type="number" inputmode="decimal" step="0.1" id="ms_${k}" placeholder="${last[k] ? fmt(last[k], 1) : ''}"></label>`).join('')}</div>
    <div class="btnrow"><button class="btn primary" id="msOk">Guardar</button></div>`, (b) => {
    b.querySelector('#msOk').onclick = () => {
      const o = { d: todayKey() }; let any = false;
      for (const [k] of MEAS) { const v = parseFloat(String(b.querySelector('#ms_' + k).value).replace(',', '.')); if (v >= 10 && v <= 300) { o[k] = Math.round(v * 10) / 10; any = true; } }
      if (!any) return toast('Escribe al menos una medida');
      db.measures = db.measures.filter(x => x.d !== o.d); db.measures.push(o); db.measures.sort((a, c) => a.d.localeCompare(c.d));
      save(); closeSheet(); render(); checkBadges(); toast('Medidas guardadas');
    };
  });
};

/* ---------- 6. Fotos de progreso (IndexedDB, solo en el celular) ---------- */
const idb = () => new Promise((res, rej) => { const r = indexedDB.open('forma-photos', 1); r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function photoAll() { try { const d = await idb(); return await new Promise(res => { const q = d.transaction('p').objectStore('p').getAll(); q.onsuccess = () => res(q.result.sort((a, b) => a.d.localeCompare(b.d))); q.onerror = () => res([]); }); } catch (e) { return []; } }
async function photoPut(o) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('p', 'readwrite'); t.objectStore('p').put(o); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function photoDel(id) { const d = await idb(); return new Promise(res => { const t = d.transaction('p', 'readwrite'); t.objectStore('p').delete(id); t.oncomplete = res; }); }
function shrink(file) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, 1000 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.82)); };
    img.onerror = rej; img.src = url;
  });
}
let photosCache = [];
async function renderPhotos() {
  photosCache = await photoAll();
  $('photoGrid').innerHTML = photosCache.length ? photosCache.slice().reverse().map(p => `<button class="ph" data-ph="${p.id}"><img src="${p.src}" alt=""><span>${p.d.slice(8)}/${p.d.slice(5, 7)}</span></button>`).join('') : empty('scale', 'Hazte una foto cada 2 a 4 semanas, con la misma luz y postura. Se guardan solo en tu celular.');
  $('cmpRow').style.display = photosCache.length >= 2 ? '' : 'none';
  document.querySelectorAll('[data-ph]').forEach(b => b.onclick = () => {
    const p = photosCache.find(x => x.id === b.dataset.ph);
    openSheet(`<h3>Foto del ${fromKey(p.d).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</h3><img class="phbig" src="${p.src}" alt=""><div class="btnrow"><button class="btn danger" id="phDel">Borrar</button><button class="btn ghost" id="phClose">Cerrar</button></div>`, (bb) => {
      bb.querySelector('#phClose').onclick = closeSheet;
      bb.querySelector('#phDel').onclick = async () => { if (!confirm('¿Borrar esta foto?')) return; await photoDel(p.id); closeSheet(); renderPhotos(); };
    });
  });
}
$('addPhoto').onclick = () => $('photoIn').click();
$('photoIn').onchange = async () => {
  const f = $('photoIn').files[0]; $('photoIn').value = ''; if (!f) return;
  try { const src = await shrink(f); await photoPut({ id: uid(), d: todayKey(), src }); db.photoCount = (db.photoCount || 0) + 1; save(); renderPhotos(); checkBadges(); toast('Foto guardada'); }
  catch (e) { toast('No se pudo guardar la foto'); }
};
$('cmpBtn').onclick = () => {
  const a = photosCache[0], b2 = photosCache[photosCache.length - 1];
  const opts = (sel) => photosCache.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${p.d}</option>`).join('');
  openSheet(`<h3>Antes / después</h3><div class="grid2 tight"><select class="input" id="cA">${opts(a.id)}</select><select class="input" id="cB">${opts(b2.id)}</select></div>
    <div class="compare" id="cmp"><img id="imA" src="${a.src}" alt=""><div class="cmp-top" id="cTop"><img id="imB" src="${b2.src}" alt=""></div><div class="cmp-line" id="cLine"></div></div>
    <input type="range" min="0" max="100" value="50" id="cR" class="range"><div class="sub">Desliza para comparar</div>`, (b) => {
    const set = () => { const v = b.querySelector('#cR').value; b.querySelector('#cTop').style.clipPath = `inset(0 0 0 ${v}%)`; b.querySelector('#cLine').style.left = v + '%'; };
    b.querySelector('#cR').oninput = set; set();
    b.querySelector('#cA').onchange = (e) => { b.querySelector('#imA').src = photosCache.find(p => p.id === e.target.value).src; };
    b.querySelector('#cB').onchange = (e) => { b.querySelector('#imB').src = photosCache.find(p => p.id === e.target.value).src; };
  });
};

/* ---------- 8. Resumen semanal / mensual ---------- */
let sumMode = 'week';
function summary(mode) {
  const end = todayKey(), n = mode === 'week' ? 7 : 30, start = dateAdd(end, -(n - 1));
  let gym = 0, mins = 0, wOk = 0, pOk = 0, steps = 0, days = 0, kc = 0, kcd = 0;
  for (let i = 0; i < n; i++) {
    const k = dateAdd(start, i), d = peek(k); if (!touched(d)) continue;
    const r = ratios(k); days++;
    if (d.gym) gym++; mins += minOf(d); if (r.w >= 1) wOk++; if (r.p >= 1) pOk++; steps += d.steps;
    const kk = kcalDay(d); if (kk) { kc += kk; kcd++; }
  }
  const ws = db.weights.filter(w => w.d >= start && w.d <= end);
  const wch = ws.length >= 2 ? ws[ws.length - 1].kg - ws[0].kg : null;
  const before = {}; // récords del periodo
  let prs = 0; const all = prMap();
  for (const r of Object.values(all)) if (r.k >= start) prs++;
  return { n, start, end, gym, mins, wOk, pOk, steps, days, wch, prs, kcal: kcd ? kc / kcd : 0 };
}
function renderSummary() {
  const s = summary(sumMode);
  document.querySelectorAll('#sumSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === sumMode));
  $('sumStats').innerHTML = `<div><b>${s.gym}</b><span>días de gym</span></div><div><b>${fmt(s.mins / 60, 1)} h</b><span>entrenando</span></div>
    <div><b>${s.days ? Math.round(s.wOk / s.days * 100) : 0} %</b><span>días con agua ok</span></div><div><b>${s.days ? Math.round(s.pOk / s.days * 100) : 0} %</b><span>días con proteína ok</span></div>
    <div><b>${fmt(s.days ? s.steps / s.days : 0)}</b><span>pasos/día</span></div><div><b>${s.wch === null ? '–' : (s.wch > 0 ? '+' : '') + fmt(s.wch, 1) + ' kg'}</b><span>cambio de peso</span></div>
    <div><b>${s.prs}</b><span>récords</span></div><div><b>${s.kcal ? fmt(s.kcal) : '–'}</b><span>kcal/día</span></div>`;
}
document.querySelectorAll('#sumSeg button').forEach(b => b.onclick = () => { sumMode = b.dataset.v; renderSummary(); });
function summaryImage() {
  const s = summary(sumMode), c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
  const g = c.getContext('2d'), F = 'system-ui, -apple-system, Roboto, sans-serif';
  g.fillStyle = '#0a0a0b'; g.fillRect(0, 0, c.width, c.height);
  const gr = g.createRadialGradient(900, 120, 50, 900, 120, 700); gr.addColorStop(0, 'rgba(198,255,61,.25)'); gr.addColorStop(1, 'rgba(198,255,61,0)'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#c6ff3d'; g.font = `800 56px ${F}`; g.fillText('FORMA', 80, 130);
  g.fillStyle = '#f2f2f3'; g.font = `800 84px ${F}`; g.fillText(sumMode === 'week' ? 'Mi semana' : 'Mi mes', 80, 250);
  g.fillStyle = '#8b8b92'; g.font = `500 38px ${F}`; g.fillText(`${fromKey(s.start).toLocaleDateString('es', { day: 'numeric', month: 'short' })} – ${fromKey(s.end).toLocaleDateString('es', { day: 'numeric', month: 'short' })}${db.profile.name ? ' · ' + db.profile.name : ''}`, 80, 310);
  const cells = [[s.gym, 'días de gym'], [fmt(s.mins / 60, 1) + ' h', 'entrenando'], [(s.days ? Math.round(s.wOk / s.days * 100) : 0) + ' %', 'agua cumplida'], [(s.days ? Math.round(s.pOk / s.days * 100) : 0) + ' %', 'proteína cumplida'], [fmt(s.days ? s.steps / s.days : 0), 'pasos al día'], [s.wch === null ? '–' : (s.wch > 0 ? '+' : '') + fmt(s.wch, 1) + ' kg', 'cambio de peso'], [s.prs, 'récords nuevos'], [weekStreak() + ' sem', 'racha']];
  cells.forEach(([v, l], i) => {
    const x = 80 + (i % 2) * 470, y = 390 + Math.floor(i / 2) * 220;
    g.fillStyle = '#141416'; g.beginPath(); g.roundRect ? g.roundRect(x, y, 440, 190, 36) : g.rect(x, y, 440, 190); g.fill();
    g.fillStyle = i === 0 ? '#c6ff3d' : '#f2f2f3'; g.font = `800 76px ${F}`; g.fillText(String(v), x + 40, y + 105);
    g.fillStyle = '#8b8b92'; g.font = `500 32px ${F}`; g.fillText(l, x + 40, y + 155);
  });
  return c.toDataURL('image/png');
}
$('sumShare').onclick = async () => {
  const data = summaryImage();
  await ready;
  const sh = window.plugins?.socialsharing;
  if (sh) sh.shareWithOptions({ message: 'Mi progreso en Forma 💪', files: [data], chooserTitle: 'Compartir resumen' }, () => {}, () => toast('No se pudo compartir'));
  else { openSheet(`<h3>Tu resumen</h3><img class="phbig" src="${data}" alt="Resumen"><div class="sub">Mantén pulsada la imagen para guardarla.</div>`); }
};

/* ---------- 9 y 10. Calorías, comidas y favoritos ---------- */
const DEF_FAVS = [['Scoop de whey', 24, 120, 3, 1.5], ['Huevo', 6, 72, 0.4, 5], ['Pechuga 100 g', 31, 165, 0, 3.6], ['Atún (lata)', 25, 116, 0, 1], ['Yogur griego', 10, 97, 4, 5], ['Carne 100 g', 26, 250, 0, 17], ['Arroz cocido 150 g', 4, 195, 42, 0.5], ['Avena 50 g', 6.5, 190, 33, 3.5], ['Plátano', 1.3, 105, 27, 0.4]];
function renderKcal() {
  const d = day(), e = energy(), now = kcalDay(d), goal = e.target;
  animateNum($('kNow'), now); $('kGoal').textContent = fmt(goal);
  $('kBar').style.width = clamp01(now / goal) * 100 + '%'; $('kBar').classList.toggle('over', now > goal * 1.05);
  const c = d.prot.reduce((a, x) => a + (+x.c || 0), 0), f = d.prot.reduce((a, x) => a + (+x.f || 0), 0), p = protOf(d);
  const bar = (n, v, gg, cl) => `<div class="mb"><div class="row-h"><span>${n}</span><span>${fmt(v)} / ${fmt(gg)} g</span></div><div class="mini"><i class="${cl}" style="width:${clamp01(v / gg) * 100}%"></i></div></div>`;
  $('macroBars').innerHTML = bar('Proteína', p, e.prot, 'p') + bar('Carbohidratos', c, e.carbs, 'c') + bar('Grasa', f, e.fat, 'f');
  const left = goal - now;
  $('kTip').textContent = now === 0 ? 'Registra tus comidas para saber si vas bien. Con los favoritos se hace con un toque.' : left >= 0 ? `Te quedan ${fmt(left)} kcal hoy.` : `Te pasaste ${fmt(-left)} kcal de tu objetivo de hoy.`;
  $('favChips').innerHTML = db.favs.map((x, i) => `<button class="chip" data-fav="${i}">${esc(x.n)} · ${x.kcal ? fmt(x.kcal) + ' kcal' : fmt(x.g) + ' g'}</button>`).join('') || '<div class="sub">Sin favoritos.</div>';
  $('favChips').querySelectorAll('[data-fav]').forEach(b => b.onclick = () => {
    const x = db.favs[+b.dataset.fav]; day().prot.push({ id: uid(), n: x.n, g: x.g, kcal: x.kcal, c: x.c, f: x.f, at: nowHM() });
    save(); vibrate(); toast(`+${fmt(x.kcal)} kcal · +${fmt(x.g)} g proteína`); render(); checkBadges();
  });
}
function foodSheet(pre = {}) {
  const editing = !!pre.id, v = (x) => x ? fmt(x, x % 1 ? 1 : 0).replace(/\./g, '').replace(',', '.') : '';
  openSheet(`<h3>${editing ? 'Editar comida' : 'Registrar comida'}</h3>
    <label class="field"><span>Alimento</span><input class="input" id="fN" value="${esc(pre.n || '')}" placeholder="Ej. Pollo con arroz"></label>
    <div class="grid2 tight">
      <label class="field"><span>Calorías (kcal)</span><input class="input" type="number" inputmode="decimal" id="fK" value="${v(pre.kcal)}"></label>
      <label class="field"><span>Proteína (g)</span><input class="input" type="number" inputmode="decimal" id="fP" value="${v(pre.g)}"></label>
      <label class="field"><span>Carbohidratos (g)</span><input class="input" type="number" inputmode="decimal" id="fC" value="${v(pre.c)}"></label>
      <label class="field"><span>Grasa (g)</span><input class="input" type="number" inputmode="decimal" id="fF" value="${v(pre.f)}"></label>
    </div>
    <div class="sub" id="fCalc"></div>
    <div class="tg" id="fFav"><div><b>Guardar en favoritos</b><span>Para registrarlo con un toque</span></div><div class="switch"><i></i></div></div>
    <div class="btnrow"><button class="btn primary" id="fOk">Guardar</button></div>`, (b) => {
    const num = (id) => Math.max(0, parseFloat(String(b.querySelector(id).value).replace(',', '.')) || 0);
    const upd = () => { const p = num('#fP'), c = num('#fC'), f = num('#fF'), k = num('#fK'); const est = p * 4 + c * 4 + f * 9; b.querySelector('#fCalc').textContent = !k && est ? `Si dejas las calorías vacías, se calculan con los macros: ${fmt(est)} kcal.` : ''; };
    b.querySelectorAll('input').forEach(i => i.oninput = upd);
    b.querySelector('#fFav').onclick = () => b.querySelector('#fFav .switch').classList.toggle('on');
    b.querySelector('#fOk').onclick = () => {
      const n = b.querySelector('#fN').value.trim() || 'Comida', p = num('#fP'), c = num('#fC'), f = num('#fF');
      let k = num('#fK'); if (!k) k = Math.round(p * 4 + c * 4 + f * 9);
      if (!k && !p) return toast('Escribe las calorías o los macros');
      if (k > 5000 || p > 300) return toast('Revisa los números: parecen demasiado altos');
      if (editing) Object.assign(pre, { n, g: p, kcal: k, c, f });
      else day().prot.push({ id: uid(), n, g: p, kcal: k, c, f, at: nowHM() });
      if (b.querySelector('#fFav .switch').classList.contains('on') && !db.favs.some(x => x.n === n)) db.favs.push({ n, g: p, kcal: k, c, f });
      save(); closeSheet(); render(); checkBadges(); toast(editing ? 'Comida actualizada' : `+${fmt(k)} kcal`);
    };
  });
}
$('addFood').onclick = () => foodSheet();
$('editFavs').onclick = () => {
  const draw = (b) => {
    b.querySelector('#fvL').innerHTML = db.favs.map((x, i) => `<div class="item"><div class="t"><b>${esc(x.n)}</b><span>${fmt(x.kcal)} kcal · P ${fmt(x.g)} · C ${fmt(x.c)} · G ${fmt(x.f)}</span></div><button class="x" data-i="${i}">×</button></div>`).join('') || '<div class="sub">Sin favoritos. Guarda uno al registrar una comida.</div>';
    b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { db.favs.splice(+x.dataset.i, 1); save(); draw(b); renderKcal(); });
  };
  openSheet(`<h3>Favoritos</h3><div class="list" id="fvL"></div><div class="btnrow"><button class="btn ghost" id="fvRst">Restaurar los de ejemplo</button></div>`, (b) => {
    draw(b); b.querySelector('#fvRst').onclick = () => { for (const [n, g, kcal, c, f] of DEF_FAVS) if (!db.favs.some(x => x.n === n)) db.favs.push({ n, g, kcal, c, f }); save(); draw(b); renderKcal(); };
  });
};
// Gasto real (TDEE adaptativo): calorías comidas − cambio de peso × 7.700 kcal/kg
function realTdee() {
  const t = trend(); if (!t) return null;
  let kc = 0, n = 0;
  for (let i = 1; i <= 28; i++) { const d = peek(dateAdd(todayKey(), -i)); const k = kcalDay(d); if (k >= 800) { kc += k; n++; } }
  if (n < 14) return { need: 14 - n };
  return { tdee: Math.round((kc / n - t.perWeek * 7700 / 7) / 10) * 10, days: n };
}


/* ---------- Foto de comida → calorías y macros (usa la IA opcional) ---------- */
const FOOD_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['items', 'confianza', 'nota'],
  properties: {
    items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['nombre', 'gramos', 'kcal', 'proteina', 'carbohidratos', 'grasa'],
      properties: { nombre: { type: 'string' }, gramos: { type: 'number' }, kcal: { type: 'number' }, proteina: { type: 'number' }, carbohidratos: { type: 'number' }, grasa: { type: 'number' } } } },
    confianza: { type: 'string', enum: ['alta', 'media', 'baja'] },
    nota: { type: 'string' }
  }
};
const FOOD_PROMPT = `Analiza la foto de esta comida. Identifica cada alimento visible y estima su porción en gramos según el tamaño del plato y los cubiertos.
Para cada alimento da kcal, proteína, carbohidratos y grasa de ESA porción, usando valores nutricionales estándar (tipo USDA/BEDCA).
Si no ves comida, devuelve items vacío y explícalo en "nota". En "nota" (máximo 2 frases, en español) di qué supusiste (aceite, salsas, cocción) y qué conviene corregir.
Sé realista: es mejor una estimación honesta con confianza "baja" que inventar precisión.`;
$('foodPhoto').onclick = () => {
  if (!aiKey()) {
    openSheet(`<h3>Foto de tu comida</h3><div class="sub">Para reconocer la comida de una foto hace falta IA (Claude), que es opcional. Activa tu clave de Anthropic y podrás fotografiar el plato: la app estima los gramos, las calorías y los macros, y tú los corriges antes de guardar.</div>
      <div class="sub" style="margin-top:8px">Cada foto cuesta unos centavos en tu cuenta de Anthropic. Sin clave puedes seguir registrando comidas a mano o con favoritos.</div>
      <div class="btnrow"><button class="btn ghost" id="fpNo">Ahora no</button><button class="btn primary" id="fpKey">Activar IA</button></div>`, (b) => {
      b.querySelector('#fpNo').onclick = closeSheet;
      b.querySelector('#fpKey').onclick = () => { closeSheet(); setTimeout(() => $('aiKeyBtn').click(), 350); };
    });
    return;
  }
  $('foodIn').click();
};
$('foodIn').onchange = async () => {
  const f = $('foodIn').files[0]; $('foodIn').value = ''; if (!f) return;
  let src; try { src = await shrink(f); } catch (e) { return toast('No se pudo leer la foto'); }
  openSheet(`<h3>Analizando tu comida…</h3><img class="phbig food" src="${src}" alt=""><div class="scan"><i></i></div><div class="sub">Calculando porciones, calorías y macros.</div>`);
  try {
    const client = new window.Anthropic({ apiKey: aiKey(), dangerouslyAllowBrowser: true });
    const res = await client.beta.messages.create({
      model: 'claude-opus-5-5', max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: FOOD_SCHEMA } },
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: src.split(',')[1] } },
        { type: 'text', text: FOOD_PROMPT }
      ] }]
    });
    if (res.stop_reason === 'refusal') throw new Error('refusal');
    const txt = res.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const data = JSON.parse(txt);
    showFoodResult(src, data);
  } catch (err) {
    const A = window.Anthropic;
    const msg = err instanceof A.AuthenticationError ? 'La clave de IA no es válida. Revísala en Coach › Clave.'
      : err instanceof A.RateLimitError ? 'Demasiadas consultas seguidas. Espera un minuto.'
      : err instanceof A.APIError && err.status ? `La IA respondió con un error (${err.status}). Inténtalo de nuevo.`
      : err instanceof SyntaxError || err.message === 'refusal' ? 'No se pudo analizar esta foto. Prueba con otra más cerca y con buena luz.'
      : 'Sin conexión con la IA. Revisa tu internet.';
    openSheet(`<h3>No se pudo analizar</h3><div class="sub">${esc(msg)}</div><div class="btnrow"><button class="btn ghost" id="frClose">Cerrar</button><button class="btn primary" id="frManual">Registrar a mano</button></div>`, (b) => {
      b.querySelector('#frClose').onclick = closeSheet; b.querySelector('#frManual').onclick = () => foodSheet();
    });
  }
};
function showFoodResult(src, data) {
  const items = (data.items || []).map(x => ({ n: String(x.nombre || 'Alimento').slice(0, 60), g0: Math.max(1, +x.gramos || 100), g: Math.max(1, Math.round(+x.gramos || 100)),
    k: Math.max(0, +x.kcal || 0), p: Math.max(0, +x.proteina || 0), c: Math.max(0, +x.carbohidratos || 0), f: Math.max(0, +x.grasa || 0), on: true }));
  if (!items.length) {
    openSheet(`<h3>No se reconoció comida</h3><img class="phbig food" src="${src}" alt=""><div class="sub">${esc(data.nota || 'Prueba con una foto más cerca del plato.')}</div><div class="btnrow"><button class="btn primary" id="frManual">Registrar a mano</button></div>`, (b) => { b.querySelector('#frManual').onclick = () => foodSheet(); });
    return;
  }
  const sc = (it) => it.g / it.g0;
  const draw = (b) => {
    let T = { k: 0, p: 0, c: 0, f: 0 };
    b.querySelector('#frList').innerHTML = items.map((it, i) => { const s = sc(it); if (it.on) { T.k += it.k * s; T.p += it.p * s; T.c += it.c * s; T.f += it.f * s; }
      return `<div class="fr ${it.on ? '' : 'off'}"><button class="check ${it.on ? 'on' : ''}" data-on="${i}">${it.on ? '✓' : ''}</button><div class="t"><b>${esc(it.n)}</b><span>${fmt(it.k * s)} kcal · P ${fmt(it.p * s, 1)} · C ${fmt(it.c * s, 1)} · G ${fmt(it.f * s, 1)}</span></div><label class="grams"><input class="input" type="number" inputmode="numeric" value="${it.g}" data-g="${i}"><span>g</span></label></div>`; }).join('');
    b.querySelector('#frTot').innerHTML = `<div><b>${fmt(T.k)}</b><span>kcal</span></div><div><b>${fmt(T.p)}</b><span>proteína</span></div><div><b>${fmt(T.c)}</b><span>carbos</span></div><div><b>${fmt(T.f)}</b><span>grasa</span></div>`;
    b.querySelectorAll('[data-on]').forEach(x => x.onclick = () => { items[+x.dataset.on].on = !items[+x.dataset.on].on; draw(b); });
    b.querySelectorAll('[data-g]').forEach(x => x.onchange = () => { const v = Math.round(+x.value); if (v > 0 && v <= 3000) items[+x.dataset.g].g = v; draw(b); });
  };
  const conf = { alta: 'Confianza alta', media: 'Confianza media', baja: 'Confianza baja: revisa los gramos' }[data.confianza] || '';
  openSheet(`<h3>Tu comida</h3><img class="phbig food" src="${src}" alt="">
    <div class="sub"><span class="conf ${esc(data.confianza)}">${conf}</span> ${esc(data.nota || '')}</div>
    <div class="list" id="frList" style="margin-top:10px"></div>
    <div class="sub">Corrige los gramos si hace falta: las calorías y los macros se recalculan solos.</div>
    <div class="frtot" id="frTot"></div>
    <div class="btnrow"><button class="btn ghost" id="frCancel">Descartar</button><button class="btn primary" id="frOk">Guardar comida</button></div>`, (b) => {
    draw(b);
    b.querySelector('#frCancel').onclick = closeSheet;
    b.querySelector('#frOk').onclick = () => {
      const sel = items.filter(i => i.on); if (!sel.length) return toast('Marca al menos un alimento');
      const d = day(), at = nowHM(); let kt = 0;
      for (const it of sel) { const s = sc(it), k = Math.round(it.k * s); kt += k;
        d.prot.push({ id: uid(), n: `${it.n} (${it.g} g)`, g: Math.round(it.p * s * 10) / 10, kcal: k, c: Math.round(it.c * s * 10) / 10, f: Math.round(it.f * s * 10) / 10, at, photo: true }); }
      save(); closeSheet(); render(); checkBadges(); vibrate(20); toast(`Comida guardada: +${fmt(kt)} kcal`);
    };
  });
}

/* ---------- 11. Widget de pantalla de inicio ---------- */
const WG = () => window.cordova?.plugins?.FormaWidget || window.FormaWidget;
async function widgetSync() {
  await ready; const w = WG(); if (!w) return;
  // 1) aplicar lo que se tocó en el widget
  w.consume((p) => {
    try { p = typeof p === 'string' ? JSON.parse(p || '{}') : (p || {}); } catch (e) { p = {}; }
    let ch = false;
    if (p.date && /^\d{4}-\d\d-\d\d$/.test(p.date)) {
      const d = day(p.date);
      if (+p.water > 0) { d.water += +p.water; ch = true; }
      if (p.gym === true || p.gym === false) { d.gym = p.gym; ch = true; }
    }
    if (ch) { save(); render(); checkBadges(); }
    widgetPush();
  }, () => widgetPush());
}
function widgetPush() {
  const w = WG(); if (!w) return;
  const k = todayKey(), d = peek(k) || { water: 0, gym: false, prot: [] }, g = goals(k);
  w.update(JSON.stringify({ date: k, water: d.water, waterGoal: Math.round(g.water * 1000), prot: Math.round(protOf(d)), protGoal: g.prot, gym: !!d.gym }), () => {}, () => {});
}

/* ---------- 12. Respaldo en archivo ---------- */
$('exportBtn').onclick = async () => {
  const txt = JSON.stringify(db, null, 1), name = `forma-respaldo-${todayKey()}.json`;
  await ready; const sh = window.plugins?.socialsharing;
  const b64 = btoa(unescape(encodeURIComponent(txt)));
  if (sh) sh.shareWithOptions({ files: [`df:${name};data:application/json;base64,${b64}`], chooserTitle: 'Guardar respaldo' }, () => toast('Elige dónde guardarlo: Drive, Archivos…'), () => toast('No se pudo exportar'));
  else { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
};
$('importBtn').onclick = () => $('fileIn').click();
$('fileIn').onchange = () => {
  const f = $('fileIn').files[0]; $('fileIn').value = ''; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try { const o = JSON.parse(r.result); if (!o.days || !o.profile) throw 0;
      if (!confirm('Esto reemplaza tus datos actuales por los del archivo. ¿Continuar?')) return;
      db = migrate(o); cur = todayKey(); save(); render(); runTick(); applyLook(); scheduleReminders(); toast('Datos restaurados'); }
    catch (e) { toast('El archivo no es un respaldo de Forma'); }
  };
  r.readAsText(f);
};

/* ---------- 13. Tema claro y tamaño de letra ---------- */
function applyLook() {
  const t = db.settings.theme || 'dark', dark = t === 'dark' || (t === 'auto' && !(window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches));
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.font = db.settings.font || 'n';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#0a0a0b' : '#f4f4f1';
  ready.then(() => { try { window.StatusBar && (dark ? StatusBar.styleLightContent() : StatusBar.styleDefault()); } catch (e) {} });
}
window.matchMedia && matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', applyLook);
function renderLook() {
  document.querySelectorAll('#pfTheme button').forEach(b => b.classList.toggle('on', b.dataset.v === (db.settings.theme || 'dark')));
  document.querySelectorAll('#pfFont button').forEach(b => b.classList.toggle('on', b.dataset.v === (db.settings.font || 'n')));
}
document.querySelectorAll('#pfTheme button').forEach(b => b.onclick = () => { db.settings.theme = b.dataset.v; save(); applyLook(); renderLook(); });
document.querySelectorAll('#pfFont button').forEach(b => b.onclick = () => { db.settings.font = b.dataset.v; save(); applyLook(); renderLook(); });

/* ---------- 14. Logros ---------- */
function streakDays(test) { let n = 0, k = todayKey(); if (!test(peek(k), k)) k = dateAdd(k, -1); while (test(peek(k), k) && n < 3650) { n++; k = dateAdd(k, -1); } return n; }
const BADGES = [
  ['first', '🏁', 'Primer paso', 'Registra tu primer entreno', () => Object.values(db.days).some(d => d.gym)],
  ['g10', '💪', 'Constante', '10 entrenamientos', () => Object.values(db.days).filter(d => d.gym).length >= 10],
  ['g50', '🦾', 'Imparable', '50 entrenamientos', () => Object.values(db.days).filter(d => d.gym).length >= 50],
  ['g100', '👑', 'Leyenda', '100 entrenamientos', () => Object.values(db.days).filter(d => d.gym).length >= 100],
  ['w7', '💧', 'Hidratado', '7 días seguidos con meta de agua', () => streakDays((d, k) => d && ratios(k).w >= 1) >= 7],
  ['p7', '🥩', 'Proteico', '7 días seguidos con meta de proteína', () => streakDays((d, k) => d && ratios(k).p >= 1) >= 7],
  ['s7', '👟', 'Caminante', '7 días seguidos con meta de pasos', () => streakDays((d, k) => d && ratios(k).s >= 1) >= 7],
  ['perfect', '🏆', 'Día perfecto', 'Agua, proteína y pasos en un día', () => Object.keys(db.days).some(k => { const r = ratios(k); return r.w >= 1 && r.p >= 1 && r.s >= 1; })],
  ['wk4', '🔥', 'Racha de un mes', '4 semanas seguidas cumpliendo tus días de gym', () => weekStreak() >= 4],
  ['pr', '🥇', 'Primer récord', 'Supera tu mejor peso en una máquina', () => Object.values(db.days).some(d => (d.ex || []).length) && prBeaten()],
  ['rout', '📋', 'Con plan', 'Completa un entreno de rutina', () => Object.values(db.days).some(d => (d.ex || []).some(x => x.setsDetail))],
  ['weigh', '⚖️', 'Bajo control', '10 pesajes registrados', () => db.weights.length >= 10],
  ['meas', '📏', 'Medido', 'Registra tus medidas', () => db.measures.length >= 1],
  ['photo', '📸', 'Antes y después', 'Guarda 2 fotos de progreso', () => (db.photoCount || 0) >= 2],
  ['food7', '🍽️', 'Contador', '7 días registrando calorías', () => Object.values(db.days).filter(d => kcalDay(d) >= 800).length >= 7],
  ['steps100k', '🗺️', '100 km', 'Acumula 140.000 pasos', () => Object.values(db.days).reduce((a, d) => a + (d.steps || 0), 0) >= 140000]
];
function prBeaten() {
  const best = {};
  for (const k of Object.keys(db.days).sort()) for (const x of db.days[k].ex || []) { if (!x.kg) continue; if (best[x.m] !== undefined && +x.kg > best[x.m]) return true; best[x.m] = Math.max(best[x.m] ?? 0, +x.kg); }
  return false;
}
function checkBadges() {
  const got = [];
  for (const [id, ic, n, , test] of BADGES) { if (db.badges[id]) continue; let ok = false; try { ok = test(); } catch (e) {} if (ok) { db.badges[id] = todayKey(); got.push(ic + ' ' + n); } }
  if (got.length) { save(); confetti(['#ffd166', '#c6ff3d', '#ffffff']); vibrate([40, 60, 40]); toast(`Logro desbloqueado: ${got[0]}`); }
}
function renderBadges() {
  const n = BADGES.filter(b => db.badges[b[0]]).length;
  $('badgeCount').textContent = `${n} de ${BADGES.length}`;
  $('badgeGrid').innerHTML = BADGES.map(([id, ic, nm, desc]) => `<div class="badge ${db.badges[id] ? 'on' : ''}" title="${esc(desc)}"><div class="medal">${ic}</div><b>${esc(nm)}</b><span>${db.badges[id] ? 'Logrado el ' + db.badges[id].slice(8) + '/' + db.badges[id].slice(5, 7) : esc(desc)}</span></div>`).join('');
}

/* ================= Arranque ================= */
function render() {
  renderTop();
  ({ hoy: renderHoy, gym: renderGym, nutri: renderNutri, agua: renderAgua, pasos: renderPasos, cal: renderCal, perfil: renderPerfil, coach: renderCoach })[view]();
  if (view === 'hoy' || view === 'nutri' || view === 'agua' || view === 'pasos') checkGoals();
  $('stepWalk') && $('stepWalk').classList.toggle('on', live);
  $('scoreRing') && $('scoreRing').classList.toggle('full', (() => { const r = ratios(cur); return r.w >= 1 && r.p >= 1 && r.s >= 1; })());
  $('avatar').textContent = (db.profile.name || '?').trim().charAt(0).toUpperCase() || '?';
  clearTimeout(bgT); bgT = setTimeout(() => { checkBadges(); widgetPush(); }, 700);
}
let bgT;
// el botón atrás de Android cierra la hoja o vuelve a Hoy
document.addEventListener('backbutton', (e) => {
  if ($('sheet').classList.contains('on')) { e.preventDefault(); closeSheet(); }
  else if (view !== 'hoy') { e.preventDefault(); go('hoy'); }
  else navigator.app && navigator.app.exitApp();
}, false);
let lastToday = todayKey();
setInterval(() => { if (lastToday !== todayKey()) { if (cur === lastToday) cur = todayKey(); lastToday = todayKey(); render(); } }, 60000);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); if (!document.hidden) { if (cur === lastToday && lastToday !== todayKey()) cur = todayKey(); lastToday = todayKey(); render(); } });
if (!db.favs) db.favs = DEF_FAVS.map(([n, g, kcal, c, f]) => ({ n, g, kcal, c, f }));
applyLook();
day(); save();
render(); runTick();
ready.then(() => { scheduleReminders(); hcSync(true); widgetSync(); });
document.addEventListener('resume', () => { hcSync(true); widgetSync(); render(); }, false);
if (!db.onboarded) { db.onboarded = true; save(); setTimeout(() => { go('perfil'); toast('Completa tu perfil para calcular tus metas'); }, 300); }
else { const lw = db.weights[db.weights.length - 1]; if (!lw || daysAgo(lw.d) >= 7) setTimeout(() => toast(lw ? 'Hace más de una semana que no te pesas' : 'Registra tu peso en Coach para seguir tu progreso'), 1200); }
})();
