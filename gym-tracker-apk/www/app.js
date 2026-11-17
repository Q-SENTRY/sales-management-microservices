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
  const tab = { agua: 'hoy', pasos: 'hoy' }[v] || v;
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
  $('streakTxt').textContent = `${wk} de ${db.profile.gymDays} días esta semana` + (st ? ` · racha ${st} sem` : '');

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
  $('todayShakes').innerHTML = sh.length ? sh.map(shakeItem).join('') : `<div class="empty">No tienes batidos para este día. Créalos en Nutrición.</div>`;
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
  if (d.gym) toast('Día de gym registrado 💪 Meta de agua +0,5 L');
  render();
};
function addWater(ml) {
  const d = day(); d.water = Math.max(0, d.water + ml); save(); vibrate();
  const g = goals();
  if (ml > 0 && d.water / 1000 >= g.water && (d.water - ml) / 1000 < g.water) toast('¡Meta de agua cumplida! 💧');
  else toast(ml > 0 ? `+${ml} ml de agua` : `${ml} ml`);
  render();
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
    <button class="x" data-del="${x.id}">×</button></div>`).join('') : `<div class="empty">Aún no registras ejercicios este día.</div>`;
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
  $('topMach').innerHTML = top.length ? top.map(([m, n]) => `<div class="item"><div class="t"><b>${esc(m)}</b><span>${n} ${n === 1 ? 'vez' : 'veces'} · ${mins[m]} min en 30 días</span><div class="bar-h"><i style="width:${n / mx * 100}%"></i></div></div></div>`).join('') : `<div class="empty">Aquí verás las máquinas que más usas.</div>`;
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
    <button class="x" data-edit="${s.id}">✎</button></div>`).join('') : `<div class="empty">Aún no tienes batidos en tu plan.</div>`;
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
    </div>` : `<div class="empty">Sin registros este día.</div>`);
  const o = $('calOpen'); if (o) o.onclick = () => { cur = calSel; go('hoy'); };
}
$('calPrev').onclick = () => { calM.setMonth(calM.getMonth() - 1); renderCal(); };
$('calNext').onclick = () => { calM.setMonth(calM.getMonth() + 1); renderCal(); };

/* ================= PERFIL ================= */
function renderPerfil() {
  const p = db.profile;
  $('pfName').value = p.name; $('pfWeight').value = p.weight; $('pfHeight').value = p.height;
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
    <div><span>IMC</span><b>${fmt(bmi, 1)} · ${bmiTxt}</b></div>`;
}
const bindNum = (id, f, min, max) => $(id).addEventListener('change', () => { const v = +$(id).value; if (v >= min && v <= max) { db.profile[f] = v; save(); render(); } else { toast('Valor no válido'); renderPerfil(); } });
$('pfName').addEventListener('input', () => { db.profile.name = $('pfName').value.trim(); save(); renderTop(); });
bindNum('pfWeight', 'weight', 30, 300); bindNum('pfHeight', 'height', 120, 230);
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
  ({ hoy: renderHoy, gym: renderGym, nutri: renderNutri, agua: renderAgua, pasos: renderPasos, cal: renderCal, perfil: renderPerfil })[view]();
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
if (!db.profile.name) setTimeout(() => { toast('Completa tu perfil para calcular tus metas'); }, 900);
})();
