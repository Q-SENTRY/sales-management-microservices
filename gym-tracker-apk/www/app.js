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
const fmt = (n, d = 0) => Number(n || 0).toLocaleString('es', { maximumFractionDigits: d, minimumFractionDigits: d });
const clamp01 = (x) => Math.max(0, Math.min(1, x || 0));
let cur = todayKey();

function day(k = cur) {
  if (!db.days[k]) db.days[k] = { gym: false, water: 0, steps: 0, prot: [], ex: [], shakes: {} };
  return db.days[k];
}
const peek = (k) => db.days[k];

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
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200);
}
const vibrate = (ms = 12) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
function animateNum(el, to, dec = 0) {
  const from = parseFloat(el.dataset.v || 0), t0 = performance.now(), dur = 700;
  el.dataset.v = to;
  const step = (t) => {
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

let view = 'hoy';
function go(v) {
  view = v;
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('on', s.dataset.view === v));
  const tab = { agua: 'hoy', pasos: 'hoy', perfil: '' }[v] ?? v;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.go === tab));
  window.scrollTo({ top: 0 });
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
  $('hello').textContent = db.profile.name ? `${saludo}, ${db.profile.name}` : saludo;
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
    b.querySelector('#pdOk').onclick = () => { const v = b.querySelector('#pickDate').value; if (v) cur = v; closeSheet(); render(); };
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
  $('tProtLeft').textContent = left > 0 ? `Faltan ${left} g` : 'Meta cumplida';
  animateNum($('tSteps'), d.steps);
  $('mSteps').style.width = r.s * 100 + '%';
  $('tStepsInfo').textContent = `${fmt(kmOf(d.steps), 1)} km · ${fmt(kcalOf(d.steps))} kcal`;
  animateNum($('tMin'), minOf(d));
  const ms = [...new Set(d.ex.map(x => x.m))];
  $('tMach').textContent = ms.length ? `${ms.length} máquina${ms.length > 1 ? 's' : ''}` : 'Sin máquinas';
  $('tVol').textContent = volOf(d) ? `${fmt(volOf(d))} kg movidos` : '';

  const sh = shakesFor(cur);
  $('todayShakes').innerHTML = sh.length ? sh.map(shakeItem).join('') : empty('shaker', 'No tienes batidos para este día. Créalos en Nutrición.');
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
  if (d.gym) { toast('Día de gym registrado 💪 Meta de agua +0,5 L'); confetti(['#c6ff3d', '#ffffff', '#9be020']); }
  render();
};
function addWater(ml) {
  const d = day(); d.water = Math.max(0, d.water + ml); save(); vibrate();
  const g = goals();
  if (!(ml > 0 && d.water / 1000 >= g.water)) toast(ml > 0 ? `+${ml} ml de agua` : `${ml} ml`);
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
    (left > 0 && cur === todayKey() ? `<br>Te faltan ${fmt(left, 1)} L: unos ${fmt(left * 1000 / hrsLeft)} ml por hora hasta las 22:00.` : '');
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
  } else rising = false;
  prevMag = m;
}
$('stepLive').onclick = async () => {
  if (live) { window.removeEventListener('devicemotion', onMotion); live = false; save(); render(); toast('Conteo detenido'); return; }
  try { if (typeof DeviceMotionEvent?.requestPermission === 'function') await DeviceMotionEvent.requestPermission(); } catch (e) {}
  cur = todayKey();
  window.addEventListener('devicemotion', onMotion); live = true; render(); toast('Contando pasos… lleva el móvil contigo');
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
    <div class="item"><div class="ic">🏋️</div><div class="t"><b>${esc(x.m)}</b>
    <span>${x.at || ''} · ${x.min} min${x.sets ? ` · ${x.sets}×${x.reps || 0}` : ''}${x.kg ? ` · ${fmt(x.kg, 1)} kg` : ''}</span></div>
    <button class="x" data-del="${x.id}">×</button></div>`).join('') : empty('dumbbell', 'Aún no registras ejercicios este día. Usa el cronómetro o toca + Añadir.');
  $('exList').querySelectorAll('[data-del]').forEach(b => b.onclick = () => { d.ex = d.ex.filter(x => x.id !== b.dataset.del); save(); render(); });
  const series = d.ex.reduce((a, x) => a + (+x.sets || 0), 0);
  $('exTotals').innerHTML = d.ex.length ? `<div><b>${minOf(d)}</b><span>minutos</span></div><div><b>${series}</b><span>series</span></div><div><b>${fmt(volOf(d))}</b><span>kg volumen</span></div>` : '';

  // máquinas más usadas (últimos 30 días)
  const cnt = {}, mins = {}, now = fromKey(todayKey());
  for (const [k, v] of Object.entries(db.days)) {
    if ((now - fromKey(k)) / 864e5 > 30) continue;
    for (const x of v.ex || []) { cnt[x.m] = (cnt[x.m] || 0) + 1; mins[x.m] = (mins[x.m] || 0) + (+x.min || 0); }
  }
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 5), mx = top[0]?.[1] || 1;
  $('topMach').innerHTML = top.length ? top.map(([m, n]) => `<div class="item"><div class="t"><b>${esc(m)}</b><span>${n} ${n === 1 ? 'vez' : 'veces'} · ${mins[m]} min en 30 días</span><div class="bar-h"><i style="width:${n / mx * 100}%"></i></div></div></div>`).join('') : empty('chart', 'Aquí verás las máquinas que más usas.');
}
function exSheet(pre = {}) {
  openSheet(`<h3>Añadir ejercicio</h3>
    <label class="field"><span>Máquina</span><select class="input" id="exM">${machineOptions(pre.m)}<option value="__new">+ Otra máquina…</option></select></label>
    <label class="field" id="exNewW" style="display:none"><span>Nombre de la máquina</span><input class="input" id="exNew"></label>
    <div class="grid2 tight">
      <label class="field"><span>Tiempo (min)</span><input class="input" type="number" inputmode="numeric" id="exMin" value="${pre.min || ''}"></label>
      <label class="field"><span>Hora</span><input class="input" type="time" id="exAt" value="${pre.at || nowHM()}"></label>
      <label class="field"><span>Series</span><input class="input" type="number" inputmode="numeric" id="exSets"></label>
      <label class="field"><span>Repeticiones</span><input class="input" type="number" inputmode="numeric" id="exReps"></label>
    </div>
    <label class="field"><span>Peso (kg)</span><input class="input" type="number" inputmode="decimal" id="exKg"></label>
    <div class="btnrow"><button class="btn primary" id="exOk">Guardar</button></div>`, (b) => {
    const sel = b.querySelector('#exM');
    sel.onchange = () => { b.querySelector('#exNewW').style.display = sel.value === '__new' ? '' : 'none'; };
    b.querySelector('#exOk').onclick = () => {
      let m = sel.value;
      if (m === '__new') { m = b.querySelector('#exNew').value.trim(); if (!m) return toast('Escribe el nombre'); if (!db.machines.includes(m)) db.machines.push(m); }
      const min = Math.max(0, Math.round(+b.querySelector('#exMin').value || 0));
      const d = day();
      d.ex.push({ id: uid(), m, min, at: b.querySelector('#exAt').value, sets: +b.querySelector('#exSets').value || 0, reps: +b.querySelector('#exReps').value || 0, kg: +b.querySelector('#exKg').value || 0 });
      d.ex.sort((a, c) => (a.at || '').localeCompare(c.at || ''));
      if (!d.gym) { d.gym = true; toast('Ejercicio guardado · día de gym marcado'); } else toast('Ejercicio guardado');
      save(); closeSheet(); render(); vibrate(15);
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
  if (!db.timer) { db.timer = { start: Date.now(), m: $('timerMachine').value, at: nowHM() }; save(); runTick(); vibrate(20); return; }
  const t = db.timer; db.timer = null; save(); runTick();
  const min = Math.max(1, Math.round((Date.now() - t.start) / 60000));
  cur = todayKey(); exSheet({ m: t.m, min, at: t.at });
};
$('timerReset').onclick = () => { db.timer = null; save(); runTick(); };
$('timerMachine').onchange = () => { if (db.timer) { db.timer.m = $('timerMachine').value; save(); } };

/* ================= NUTRICIÓN ================= */
const QUICK = [['Scoop de whey', 24], ['Huevo', 6], ['Pechuga 100 g', 31], ['Atún (lata)', 25], ['Yogur griego', 10], ['Carne 100 g', 26], ['Leche 250 ml', 8]];
function renderNutri() {
  const d = day(), g = goals(), p = protOf(d);
  animateNum($('nProt'), p); $('nProtGoal').textContent = g.prot;
  $('nmProt').style.width = clamp01(p / g.prot) * 100 + '%';
  const left = g.prot - p, meals = Math.max(1, 4 - d.prot.length);
  $('nProtTip').textContent = left > 0
    ? `${PROT_FACTOR[db.profile.goal]} g por kg (${db.profile.goal}). Faltan ${left} g ≈ ${Math.ceil(left / meals)} g en cada una de tus próximas ${meals} comidas.`
    : '¡Meta de proteína cumplida! 🎯';
  $('protQuick').innerHTML = QUICK.map(([n, gg]) => `<button class="chip" data-q="${esc(n)}|${gg}">${esc(n)} · ${gg} g</button>`).join('');
  $('protQuick').querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
    const [n, gg] = b.dataset.q.split('|'); d.prot.push({ id: uid(), n, g: +gg, at: nowHM() }); save(); vibrate(); toast(`+${gg} g de proteína`); render();
  });
  $('protList').innerHTML = d.prot.length ? d.prot.slice().reverse().map(x => `<div class="item"><div class="ic">${x.shake ? '🥤' : '🍗'}</div><div class="t"><b>${esc(x.n)}</b><span>${x.at || ''}</span></div><b>${x.g} g</b><button class="x" data-del="${x.id}">×</button></div>`).join('') : '';
  $('protList').querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    const x = d.prot.find(y => y.id === b.dataset.del); if (x?.shake) delete d.shakes[x.shake];
    d.prot = d.prot.filter(y => y.id !== b.dataset.del); save(); render();
  });

  $('shakePlan').innerHTML = db.plan.length ? db.plan.slice().sort((a, b) => a.time.localeCompare(b.time)).map(s => `
    <div class="item"><div class="ic">🥤</div><div class="t"><b>${esc(s.name)} · ${s.g} g</b>
    <span>${s.time} · ${s.days.length === 7 ? 'todos los días' : s.days.map(i => DAYS_LONG[i].slice(0, 3)).join(', ')}</span></div>
    <button class="x" data-edit="${s.id}">✎</button></div>`).join('') : empty('shaker', 'Aún no tienes batidos en tu plan.');
  $('shakePlan').querySelectorAll('[data-edit]').forEach(b => b.onclick = () => shakeSheet(db.plan.find(s => s.id === b.dataset.edit)));
}
$('addProt').onclick = () => {
  openSheet(`<h3>Registrar proteína</h3>
    <label class="field"><span>Alimento</span><input class="input" id="pN" placeholder="Ej. Pollo con arroz"></label>
    <div class="grid2 tight"><label class="field"><span>Proteína (g)</span><input class="input" type="number" inputmode="decimal" id="pG"></label>
    <label class="field"><span>Hora</span><input class="input" type="time" id="pAt" value="${nowHM()}"></label></div>
    <div class="btnrow"><button class="btn primary" id="pOk">Guardar</button></div>`, (b) => {
    b.querySelector('#pOk').onclick = () => {
      const g = +b.querySelector('#pG').value; if (!g) return toast('Escribe los gramos');
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
    <label class="field"><span>Días</span><div class="days7" id="sD">${DAYS.map((x, i) => `<button data-d="${i}" class="${e.days.includes(i) ? 'on' : ''}">${x}</button>`).join('')}</div></label>
    <div class="btnrow">${s ? '<button class="btn danger" id="sDel">Eliminar</button>' : ''}<button class="btn primary" id="sOk">Guardar</button></div>`, (b) => {
    b.querySelectorAll('[data-d]').forEach(x => x.onclick = () => x.classList.toggle('on'));
    b.querySelector('#sOk').onclick = () => {
      const name = b.querySelector('#sN').value.trim(); if (!name) return toast('Ponle un nombre');
      const days = [...b.querySelectorAll('[data-d].on')].map(x => +x.dataset.d); if (!days.length) return toast('Elige al menos un día');
      const obj = { id: e.id || uid(), name, g: +b.querySelector('#sG').value || 0, time: b.querySelector('#sT').value || '08:00', days };
      if (s) Object.assign(s, obj); else db.plan.push(obj);
      save(); closeSheet(); render(); toast('Plan guardado');
    };
    const del = b.querySelector('#sDel');
    if (del) del.onclick = () => { db.plan = db.plan.filter(x => x.id !== s.id); save(); closeSheet(); render(); };
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
    const s = db.plan.find(x => x.id === b.dataset.shake), d = day();
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
if (!db.weights) db.weights = [];
if (!db.profile.age) db.profile.age = 25;
if (!db.profile.sex) db.profile.sex = 'h';
const RATE = { definir: [-1.0, -0.5], mantener: [-0.25, 0.25], volumen: [0.25, 0.5] }; // % del peso por semana
const GOAL_TXT = { definir: 'bajar grasa', mantener: 'mantener', volumen: 'ganar músculo' };
function logWeight(kg, k = todayKey()) {
  db.weights = db.weights.filter(w => w.d !== k);
  db.weights.push({ d: k, kg }); db.weights.sort((a, b) => a.d.localeCompare(b.d));
  if (k >= (db.weights[db.weights.length - 1]?.d || '')) db.profile.weight = kg;
  save();
}
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
    const g = goals(k), touched = d.water || d.steps || d.prot.length || d.gym || d.ex.length;
    if (!touched) continue;
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
    if (last.kg === prev.kg && last.reps >= 10) out.push({ t: 'good', h: `${m}: toca subir peso`, b: `Hiciste ${last.reps} reps con ${fmt(last.kg, 1)} kg dos sesiones seguidas. Prueba ${fmt(Math.round(last.kg * 1.05 * 2) / 2, 1)} kg (+5 %) y baja a 8 reps.` });
    else if (last.kg < prev.kg) out.push({ t: 'warn', h: `${m}: bajaste carga`, b: `De ${fmt(prev.kg, 1)} a ${fmt(last.kg, 1)} kg. Si no fue a propósito, revisa descanso y proteína.` });
    else if (s.length >= 3) out.push({ t: 'good', h: `${m}: ${gain >= 0 ? '+' : ''}${fmt(gain, 1)} % de fuerza`, b: `De ${fmt(first.kg, 1)} kg (${first.k.slice(5)}) a ${fmt(last.kg, 1)} kg en ${s.length} sesiones.` });
  }
  return out.slice(0, 5);
}
function suggestions() {
  const p = db.profile, g = goals(todayKey()), r = recent(7), t = trend(), out = [];
  const lastW = db.weights[db.weights.length - 1];
  if (!lastW || daysAgo(lastW.d) > 7) out.push({ t: 'warn', h: 'Regístrate el peso', b: lastW ? `Tu último pesaje fue hace ${daysAgo(lastW.d)} días. Sin pesajes no puedo medir tu progreso.` : 'Registra tu peso arriba. Con 3 pesajes en una semana calculo tu tendencia real.' });
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
    if (r.steps < p.stepGoal * 0.8) out.push({ t: 'warn', h: 'Muévete un poco más', b: `Promedio ${fmt(r.steps)} pasos frente a ${fmt(p.stepGoal)}. Un paseo de 20 min suma unos 2.000 pasos.` });
  }
  if (r.gym < p.gymDays) out.push({ t: r.gym ? 'warn' : 'bad', h: `${r.gym} de ${p.gymDays} días de gym esta última semana`, b: r.gym ? `Te faltan ${p.gymDays - r.gym} para tu meta. La constancia es lo que más resultados da.` : 'Esta semana aún no entrenas. Aunque sean 30 min, ve hoy.' });
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
  $('sugList').innerHTML = suggestions().map(s => `<div class="sug ${s.t}"><div><b>${esc(s.h)}</b><span>${esc(s.b)}</span></div></div>`).join('');
  aiStatus();
}
$('wSave').onclick = () => {
  const v = parseFloat(String($('wIn').value).replace(',', '.'));
  if (!(v >= 30 && v <= 300)) return toast('Escribe un peso válido');
  const prev = db.weights[db.weights.length - 1];
  logWeight(v); $('wIn').value = ''; vibrate(20);
  toast(prev ? `Peso guardado (${v - prev.kg >= 0 ? '+' : ''}${fmt(v - prev.kg, 1)} kg)` : 'Peso guardado');
  render();
};

/* ================= Coach con IA (Claude) ================= */
let aiMsgs = [];
const aiKey = () => { try { return localStorage.getItem('forma.aikey') || ''; } catch (e) { return ''; } };
function aiStatus() {
  $('aiBox').style.display = aiKey() ? '' : 'none';
  $('aiKeyBtn').textContent = aiKey() ? 'Clave' : 'Activar';
  $('aiStatus').textContent = aiKey() ? 'Claude analiza tus datos reales y te da un plan. Cada consulta usa tu cuenta de Anthropic.' : 'No hace falta: todo lo de arriba funciona sin IA. Si algún día quieres un análisis escrito por Claude, toca "Activar" y pega una clave de Anthropic.'; }
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
    const k = keyOf(dt), d = peek(k); if (!d) continue;
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

  const d = peek(calSel), dt = fromKey(calSel);
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
}
const bindNum = (id, f, min, max) => $(id).addEventListener('change', () => { const v = +$(id).value; if (v >= min && v <= max) { db.profile[f] = v; save(); render(); } else { toast('Valor no válido'); renderPerfil(); } });
$('pfName').addEventListener('input', () => { db.profile.name = $('pfName').value.trim(); save(); renderTop(); });
$('pfWeight').addEventListener('change', () => { const v = +$('pfWeight').value; if (v >= 30 && v <= 300) { logWeight(v); render(); } else { toast('Valor no válido'); renderPerfil(); } });
bindNum('pfAge', 'age', 12, 100);
document.querySelectorAll('#pfSex button').forEach(b => b.onclick = () => { db.profile.sex = b.dataset.v; save(); render(); }); bindNum('pfHeight', 'height', 120, 230);
bindNum('pfSteps', 'stepGoal', 1000, 50000); bindNum('pfDays', 'gymDays', 1, 7);
document.querySelectorAll('#pfGoal button').forEach(b => b.onclick = () => { db.profile.goal = b.dataset.v; save(); render(); });
$('exportBtn').onclick = async () => {
  const txt = JSON.stringify(db);
  try { await navigator.clipboard.writeText(txt); toast('Respaldo copiado. Guárdalo en tus notas'); }
  catch (e) { openSheet(`<h3>Respaldo</h3><div class="sub">Copia este texto y guárdalo.</div><textarea class="input" style="height:200px;margin-top:10px">${esc(txt)}</textarea>`); }
};
$('importBtn').onclick = () => {
  openSheet(`<h3>Restaurar respaldo</h3><div class="sub">Pega el texto que copiaste. Reemplaza los datos actuales.</div><textarea class="input" id="imp" style="height:180px;margin-top:10px"></textarea><div class="btnrow"><button class="btn primary" id="impOk">Restaurar</button></div>`, (b) => {
    b.querySelector('#impOk').onclick = () => {
      try { const o = JSON.parse(b.querySelector('#imp').value); if (!o.days || !o.profile) throw 0; db = o; save(); closeSheet(); render(); toast('Datos restaurados'); }
      catch (e) { toast('El texto no es un respaldo válido'); }
    };
  });
};

/* ================= Arranque ================= */
function render() {
  renderTop();
  ({ hoy: renderHoy, gym: renderGym, nutri: renderNutri, agua: renderAgua, pasos: renderPasos, cal: renderCal, perfil: renderPerfil, coach: renderCoach })[view]();
  if (view === 'hoy' || view === 'nutri' || view === 'agua' || view === 'pasos') checkGoals();
  $('stepWalk') && $('stepWalk').classList.toggle('on', live);
  $('scoreRing') && $('scoreRing').classList.toggle('full', (() => { const r = ratios(cur); return r.w >= 1 && r.p >= 1 && r.s >= 1; })());
  $('avatar').textContent = (db.profile.name || '?').trim().charAt(0).toUpperCase() || '?';
}
// el botón atrás de Android cierra la hoja o vuelve a Hoy
document.addEventListener('backbutton', (e) => {
  if ($('sheet').classList.contains('on')) { e.preventDefault(); closeSheet(); }
  else if (view !== 'hoy') { e.preventDefault(); go('hoy'); }
  else navigator.app && navigator.app.exitApp();
}, false);
let lastToday = todayKey();
document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (cur === lastToday && lastToday !== todayKey()) cur = todayKey(); lastToday = todayKey(); render(); } });
day(); save();
render(); runTick();
if (!db.profile.name) setTimeout(() => go('perfil'), 300);
else { const lw = db.weights[db.weights.length - 1]; if (!lw || daysAgo(lw.d) >= 7) setTimeout(() => toast('Hace días que no te pesas · ve a Coach'), 1200); }
})();
