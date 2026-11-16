/* Pulso Global v2 — noticias mundiales importantes en tiempo real
   Fuentes públicas sin claves: Google Noticias (RSS), BBC, DW, France 24, El País, CNN,
   Al Jazeera, medios de tecnología, Hacker News, GDELT y USGS (sismos).
   Agrupa la misma noticia de distintos medios para detectar lo que se esparce globalmente. */
(() => {
'use strict';

/* =========================================================
   Almacenamiento y configuración
   ========================================================= */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const cfg = Object.assign({ int: 180, fast: true, fastInt: 30, start: 'now', alert: true, vib: true, img: true, en: true, age: 24, theme: 'dark', big: false }, store.get('cfg', {}));
const saveCfg = () => store.set('cfg', cfg);

/* =========================================================
   Categorías, subtemas de tecnología y países
   ========================================================= */
const CATS = [
  ['now', 'Al instante'], ['all', 'Destacadas'], ['urg', 'Última hora'], ['glob', 'Tendencia global'], ['war', 'Conflictos'],
  ['pol', 'Política'], ['tech', 'Tecnología'], ['space', 'Espacio y fenómenos'], ['dis', 'Desastres'],
  ['eco', 'Economía'], ['sci', 'Ciencia y salud'], ['world', 'Mundo']
];
const TECH = [
  ['all', 'Todo', null],
  ['ia', 'Inteligencia artificial', /inteligencia artificial|\bia\b|\bai\b|openai|chatgpt|\bgpt|anthropic|claude|gemini|deepmind|\bllm|grok|\bxai\b|deepseek|copilot|mistral|llama|perplexity|agente[s]? de ia|machine learning|modelo de lenguaje|sora\b|midjourney/],
  ['mov', 'Móviles', /iphone|android|samsung|galaxy|xiaomi|pixel|smartphone|movil(es)?\b|celular|huawei|motorola|oneplus|apple watch|ios \d|tablet|ipad/],
  ['cib', 'Ciberseguridad', /hacke|ciberataque|ransomware|vulnerabilidad|filtracion|malware|ciberseguridad|phishing|breach|exploit|cyberattack|spyware|dark web|robo de datos|data leak/],
  ['chip', 'Chips y hardware', /nvidia|\bamd\b|intel\b|tsmc|\bchips?\b|semiconductor|procesador|\bgpu|qualcomm|\barm\b|computadora cuantica|quantum|supercomputador|data ?center|centro de datos/],
  ['spc', 'Espacio', /spacex|starship|blue origin|satelite|starlink|cohete|artemis|lanzamiento espacial|rocket|estacion espacial|rocket lab/],
  ['big', 'Big Tech', /\bapple\b|google|microsoft|\bmeta\b|amazon|tesla|elon musk|\bmusk\b|zuckerberg|altman|bezos|tiktok|bytedance|netflix|whatsapp|instagram|youtube/],
  ['cri', 'Cripto', /bitcoin|cripto|ethereum|blockchain|stablecoin|\bbtc\b|binance|coinbase/],
  ['game', 'Videojuegos', /playstation|\bps5|xbox|nintendo|switch 2|videojuego|steam\b|\bgta\b|gaming|esports/],
  ['fut', 'Ciencia y futuro', /robot|humanoide|fusion nuclear|bateria|electric[oa]s?\b.*(auto|coche|vehiculo)|vehiculo electrico|coche electrico|autonom|biotecnolog|neuralink|realidad virtual|realidad aumentada|gafas inteligentes|6g|5g/]
];

// [código, nombre ES, nombre EN, patrón (texto normalizado), edición de Google Noticias]
const COUNTRIES = [
  ['US', 'Estados Unidos', 'United States', 'estados unidos|\\bee ?uu\\b|\\beeuu\\b|\\busa\\b|washington|casa blanca|white house|\\btrump\\b|united states|pentagono|pentagon|estadounidense', 'US'],
  ['MX', 'México', 'Mexico', 'mexic|sheinbaum|monterrey|guadalajara', 'MX'],
  ['CO', 'Colombia', 'Colombia', 'colombia|bogota|medellin|\\bpetro\\b|barranquilla|cartagena', 'CO'],
  ['VE', 'Venezuela', 'Venezuela', 'venezol|venezuel|caracas|maduro', 'VE'],
  ['AR', 'Argentina', 'Argentina', 'argentin|buenos aires|milei', 'AR'],
  ['BR', 'Brasil', 'Brazil', 'brasil|brazil|\\blula\\b|sao paulo|rio de janeiro', ''],
  ['CL', 'Chile', 'Chile', '\\bchile|santiago de chile', 'CL'],
  ['PE', 'Perú', 'Peru', '\\bperu\\b|peruan', 'PE'],
  ['EC', 'Ecuador', 'Ecuador', 'ecuador|quito|guayaquil|noboa', ''],
  ['CU', 'Cuba', 'Cuba', '\\bcuba|la habana|\\bcuban', 'CU'],
  ['BO', 'Bolivia', 'Bolivia', 'bolivia', ''],
  ['UY', 'Uruguay', 'Uruguay', 'uruguay', ''],
  ['PY', 'Paraguay', 'Paraguay', 'paraguay', ''],
  ['PA', 'Panamá', 'Panama', 'panama', ''],
  ['CR', 'Costa Rica', 'Costa Rica', 'costa rica', ''],
  ['SV', 'El Salvador', 'El Salvador', 'el salvador|bukele|salvadoren', ''],
  ['GT', 'Guatemala', 'Guatemala', 'guatemal', ''],
  ['HN', 'Honduras', 'Honduras', 'hondur', ''],
  ['NI', 'Nicaragua', 'Nicaragua', 'nicaragu', ''],
  ['DO', 'Rep. Dominicana', 'Dominican Republic', 'republica dominicana|dominican|santo domingo', ''],
  ['PR', 'Puerto Rico', 'Puerto Rico', 'puerto rico', ''],
  ['HT', 'Haití', 'Haiti', '\\bhaiti', ''],
  ['CA', 'Canadá', 'Canada', 'canada|canadiense|ottawa|toronto', ''],
  ['ES', 'España', 'Spain', 'espana|\\bspain|madrid|barcelona|pedro sanchez', 'ES'],
  ['GB', 'Reino Unido', 'United Kingdom', 'reino unido|londres|london|britanic|british|\\buk\\b|starmer|inglaterra', ''],
  ['FR', 'Francia', 'France', 'francia|\\bfrance|\\bparis\\b|macron', ''],
  ['DE', 'Alemania', 'Germany', 'alemania|aleman[ae]?s?\\b|germany|berlin', ''],
  ['IT', 'Italia', 'Italy', 'italia|\\bitaly|italian|\\broma\\b|meloni', ''],
  ['VA', 'Vaticano', 'Vatican', 'vaticano|vatican|santa sede|papa leon|\\bpope\\b', ''],
  ['UA', 'Ucrania', 'Ukraine', 'ucrania|ukrain|\\bkiev|\\bkyiv|zelensk', ''],
  ['RU', 'Rusia', 'Russia', '\\brusia|russia|\\brus[oa]s?\\b|moscu|moscow|putin|kremlin', ''],
  ['PL', 'Polonia', 'Poland', 'polonia|poland', ''],
  ['CN', 'China', 'China', '\\bchina\\b|\\bchin[oa]s?\\b|pekin|beijing|xi jinping|shanghai|hong kong', ''],
  ['JP', 'Japón', 'Japan', 'japon|japan|tokio|tokyo', ''],
  ['KR', 'Corea del Sur', 'South Korea', 'corea del sur|south korea|\\bseul|seoul|surcorean', ''],
  ['KP', 'Corea del Norte', 'North Korea', 'corea del norte|north korea|pyongyang|kim jong|norcorean', ''],
  ['TW', 'Taiwán', 'Taiwan', 'taiwan', ''],
  ['IN', 'India', 'India', '\\bindia\\b|nueva delhi|new delhi|\\bmodi\\b', ''],
  ['PK', 'Pakistán', 'Pakistan', 'pakistan', ''],
  ['AF', 'Afganistán', 'Afghanistan', 'afganistan|afghanistan|taliban', ''],
  ['IL', 'Israel', 'Israel', 'israel|tel aviv|netanyahu|jerusalen|jerusalem', ''],
  ['PS', 'Palestina', 'Palestine', 'palestin|\\bgaza\\b|cisjordania|west bank|hamas', ''],
  ['IR', 'Irán', 'Iran', '\\biran\\b|\\birani|teheran|tehran|jamenei|khamenei', ''],
  ['SA', 'Arabia Saudita', 'Saudi Arabia', 'arabia saudi|saudi|\\briad\\b|riyadh', ''],
  ['TR', 'Turquía', 'Turkey', 'turquia|turkey|turkiye|erdogan|ankara|estambul|istanbul', ''],
  ['SY', 'Siria', 'Syria', '\\bsiria|syria|damasco', ''],
  ['LB', 'Líbano', 'Lebanon', 'libano|lebanon|beirut|hezbol', ''],
  ['YE', 'Yemen', 'Yemen', 'yemen|\\bhuti|houthi', ''],
  ['EG', 'Egipto', 'Egypt', 'egipto|egypt|el cairo', ''],
  ['ZA', 'Sudáfrica', 'South Africa', 'sudafrica|south africa', ''],
  ['NG', 'Nigeria', 'Nigeria', 'nigeria', ''],
  ['SD', 'Sudán', 'Sudan', '\\bsudan\\b', ''],
  ['PH', 'Filipinas', 'Philippines', 'filipinas|philippines|manila', ''],
  ['ID', 'Indonesia', 'Indonesia', 'indonesia', ''],
  ['AU', 'Australia', 'Australia', 'australia', '']
].map(([code, es, en, pat, ed]) => ({ code, es, en, re: new RegExp(pat), ed }));
const countryBy = (code) => COUNTRIES.find(c => c.code === code);

/* =========================================================
   Fuentes
   ========================================================= */
const gnEd = (gl = 'US', hl = 'es-419') => `hl=${hl}&gl=${gl}&ceid=${gl}:${hl}`;
const GN = (path, ed) => 'https://news.google.com/rss' + path + (path.includes('?') ? '&' : '?') + (ed || gnEd());
const GNs = (q, when = '1d') => GN('/search?q=' + encodeURIComponent(q + (when ? ' when:' + when : '')));
const GNen = (q, when = '1d') => 'https://news.google.com/rss/search?q=' + encodeURIComponent(q + (when ? ' when:' + when : '')) + '&' + gnEd('US', 'en-US');

const FEEDS = [
  // General / mundo
  { n: 'Google Noticias', u: GN(''), c: 'world' },
  { n: 'Google Noticias', u: GN('/headlines/section/topic/WORLD'), c: 'world' },
  { n: 'Google Noticias', u: GN('/headlines/section/topic/NATION'), c: 'pol' },
  { n: 'Google Noticias', u: GN('/headlines/section/topic/SCIENCE'), c: 'sci' },
  { n: 'Google Noticias', u: GN('/headlines/section/topic/BUSINESS'), c: 'eco' },
  { n: 'Google Noticias', u: GNs('"última hora" OR urgente'), c: 'urg' },
  { n: 'Google Noticias', u: GNs('guerra OR ataque OR misiles OR bombardeo OR invasión OR ejército'), c: 'war' },
  { n: 'Google Noticias', u: GNs('Trump OR "Casa Blanca" OR Congreso'), c: 'pol' },
  { n: 'Google Noticias', u: GNs('NASA OR asteroide OR meteorito OR ovni OR cometa OR "objeto interestelar"'), c: 'space' },
  { n: 'Google Noticias', u: GNs('terremoto OR huracán OR tsunami OR erupción OR inundaciones'), c: 'dis' },
  { n: 'Google Noticias', u: GNs('viral OR "conmoción mundial" OR insólito OR "sin precedentes"'), c: 'glob' },
  { n: 'BBC Mundo', u: 'https://feeds.bbci.co.uk/mundo/rss.xml', c: 'world' },
  { n: 'DW Español', u: 'https://rss.dw.com/xml/rss-sp-all', c: 'world' },
  { n: 'France 24', u: 'https://www.france24.com/es/rss', c: 'world' },
  { n: 'El País', u: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada', c: 'world' },
  { n: 'CNN Español', u: 'https://cnnespanol.cnn.com/feed/', c: 'world' },
  { n: 'Europa Press', u: 'https://www.europapress.es/rss/rss.aspx?ch=00069', c: 'world' },
  // Tecnología en español
  { n: 'Google Noticias', u: GN('/headlines/section/topic/TECHNOLOGY'), c: 'tech' },
  { n: 'Google Noticias', u: GNs('"inteligencia artificial" OR OpenAI OR Anthropic OR Gemini OR ChatGPT OR "modelo de IA"'), c: 'tech' },
  { n: 'Google Noticias', u: GNs('ciberataque OR hackeo OR ransomware OR "filtración de datos"'), c: 'tech' },
  { n: 'Google Noticias', u: GNs('Nvidia OR chips OR semiconductores OR TSMC OR "computación cuántica"'), c: 'tech' },
  { n: 'Google Noticias', u: GNs('iPhone OR Samsung OR Android OR Xiaomi lanzamiento'), c: 'tech' },
  { n: 'Google Noticias', u: GNs('SpaceX OR Starship OR Starlink OR "Blue Origin"'), c: 'tech' },
  { n: 'Xataka', u: 'https://feeds.weblogssl.com/xataka2', c: 'tech' },
  { n: 'Genbeta', u: 'https://feeds.weblogssl.com/genbeta', c: 'tech' },
  { n: 'Xataka Móvil', u: 'https://feeds.weblogssl.com/xatakamovil', c: 'tech' },
  { n: 'Hipertextual', u: 'https://hipertextual.com/feed', c: 'tech' },
  { n: 'El País Tecnología', u: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/tecnologia/portada', c: 'tech' },
  // Inglés
  { n: 'Google News EN', u: GNen('breaking news'), c: 'urg', en: true },
  { n: 'Google News EN', u: GNen('AI model OR OpenAI OR Anthropic OR DeepMind OR xAI'), c: 'tech', en: true },
  { n: 'BBC World', u: 'https://feeds.bbci.co.uk/news/world/rss.xml', c: 'world', en: true },
  { n: 'Al Jazeera', u: 'https://www.aljazeera.com/xml/rss/all.xml', c: 'world', en: true },
  { n: 'Space.com', u: 'https://www.space.com/feeds/all', c: 'space', en: true },
  { n: 'TechCrunch', u: 'https://techcrunch.com/feed/', c: 'tech', en: true },
  { n: 'The Verge', u: 'https://www.theverge.com/rss/index.xml', c: 'tech', en: true },
  { n: 'Ars Technica', u: 'https://feeds.arstechnica.com/arstechnica/index', c: 'tech', en: true },
  { n: 'Wired', u: 'https://www.wired.com/feed/rss', c: 'tech', en: true },
  { n: 'MIT Tech Review', u: 'https://www.technologyreview.com/feed/', c: 'tech', en: true }
];

// Carril rápido: fuentes que se revisan cada 30 segundos (solo lo publicado en la última hora)
const FAST = [
  { n: 'Google Noticias', u: GN(''), c: 'world' },
  { n: 'Google Noticias', u: GN('/headlines/section/topic/WORLD'), c: 'world' },
  { n: 'Google Noticias', u: GNs('"última hora" OR urgente OR "de último momento"', '1h'), c: 'urg' },
  { n: 'Google Noticias', u: GNs('guerra OR ataque OR misiles OR explosión OR bombardeo', '1h'), c: 'war' },
  { n: 'Google Noticias', u: GNs('Trump OR presidente OR gobierno OR Congreso', '1h'), c: 'pol' },
  { n: 'Google Noticias', u: GNs('"inteligencia artificial" OR OpenAI OR Nvidia OR Apple OR Google OR Microsoft', '1h'), c: 'tech' },
  { n: 'Google Noticias', u: GNs('terremoto OR sismo OR huracán OR tsunami OR NASA OR asteroide', '1h'), c: 'dis' },
  { n: 'Google News EN', u: GNen('breaking news', '1h'), c: 'urg', en: true },
  { n: 'Google News EN', u: GNen('AI OR OpenAI OR Anthropic OR Nvidia', '1h'), c: 'tech', en: true },
  { n: 'BBC Mundo', u: 'https://feeds.bbci.co.uk/mundo/rss.xml', c: 'world' },
  { n: 'Europa Press', u: 'https://www.europapress.es/rss/rss.aspx?ch=00069', c: 'world' }
];

// Si la descarga directa falla (bloqueo CORS), se prueban proxies públicos
const PROXIES = [
  (u) => u,
  (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
  (u) => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  (u) => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u)
];
let proxyPref = store.get('proxyPref', 0);

/* =========================================================
   Palabras clave
   ========================================================= */
const KW = {
  war: /\b(guerra|ataque|ataques|misil|misiles|bombarde\w*|invasion|ejercito|militar(es)?|tropas|drones?|ofensiva|otan|nato|hamas|hezbol\w*|conflicto armado|alto el fuego|ceasefire|ojiva|nuclear|war|airstrike|missiles?|troops|invasion)\b/,
  pol: /\b(trump|casa blanca|white house|congreso|senado|presidente|presidenta|eleccion(es)?|decreto|orden ejecutiva|aranceles?|tariffs?|gobierno|ministr[oa]|primer ministro|parlamento|shutdown|cierre del gobierno|faa|vuelos suspendidos|golpe de estado|elections?)\b/,
  space: /\b(nasa|spacex|asteroide|meteorit\w*|meteoro|cometa|ovnis?|ufo|uap|interestelar|extraterrestre|alien\w*|tormenta solar|llamarada solar|eclipse|asteroid|comet|3i\/atlas|reentrada|bola de fuego|fireball|aurora boreal|agujero negro|telescopio)\b/,
  dis: /\b(terremoto|sismo|temblor|huracan|tifon|tsunami|erupcion|volcan|inundacion(es)?|incendio forestal|incendios|tornado|avalancha|deslave|earthquake|hurricane|wildfire|flood|explosion|accidente aereo|se estrella|derrumbe|naufragio)\b/,
  eco: /\b(economia|bolsas?|wall street|dolar|petroleo|inflacion|recesion|fed|reserva federal|mercados?|acciones|pib|bancos?|stocks?|oil|tasas de interes|deuda)\b/,
  sci: /\b(cientific\w*|estudio|descubr\w*|virus|pandemia|brote|vacuna|oms|salud|cancer|epidemia|gripe aviar|cambio climatico|science|outbreak|medicamento)\b/
};
const URGENT = /(ultima hora|urgente|breaking|en vivo|en directo|alerta|emergencia|muere|muertos?|fallece|asesinad|atentado|tiroteo|explosion|declara la guerra|estado de emergencia|suspende|suspendidos|espacio aereo|evacua|sin precedentes|colapso|derrocad|golpe de estado|dimite|renuncia|killed|dead|explosion|emergency|unprecedented|halts|grounded)/;

const STOP = new Set('el la los las un una unos unas de del al a en y o u que por para con sin sobre tras ante entre se su sus es son fue han ha hay mas muy como este esta estos estas ese esa eso lo le les ya no si pero tambien asi cuando donde quien que como dice dijo segun desde hasta nuevo nueva nuevos nuevas the of to in and for on with at by from is are was be as an it its this that after over new says said will has have not more than into about'.split(' '));
const STOPCAP = new Set('El La Los Las Un Una Unos Unas Por Para Con Sin Qué Que Cómo Como Cuándo Dónde Quién Así Este Esta Estos Estas Ese Esa Tras Ante Según Desde Hasta En De Del Al Y O Su Sus Lo Le Se No Si Ya Más Muy Hay Ha Han Es Son Fue Nuevo Nueva Video Vídeo Fotos Foto Última Hora Urgente Hoy Ayer Mañana En Vivo Directo Así Por Qué Lunes Martes Miércoles Jueves Viernes Sábado Domingo Enero Febrero Marzo Abril Mayo Junio Julio Agosto Septiembre Octubre Noviembre Diciembre The A An Of In On For To And How Why What Who When Where Is Are This That After New Breaking Live Watch'.split(' '));

/* =========================================================
   Estado
   ========================================================= */
let items = [], clusters = [], reg = new Map();
let seen = new Set(store.get('seen', []));
let firstRun = seen.size === 0;
let saved = store.get('saved', []);
let history = store.get('history', []);
let srcStats = {}, lastOk = 0, loading = false, timer = null, newCount = 0, newIds = new Set();
const st = {
  view: 'home',
  home: { cat: cfg.start, country: '', time: 0, sort: 'imp', limit: 30 },
  tech: { sub: 'all', sort: 'imp', limit: 30 },
  search: { q: '', country: '', time: 0, sort: 'rel', cat: 'all', lang: 'all', limit: 30, web: [], webKey: '', webBusy: false, webErr: false }
};
const webCache = new Map();

const $ = (id) => document.getElementById(id);
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const esc = (s) => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (id, cls = 'i s') => `<svg class="${cls}"><use href="#i-${id}"/></svg>`;

/* =========================================================
   Red
   ========================================================= */
// Parámetro que cambia cada 15 s para que ni el navegador ni los proxies devuelvan copias viejas
function bust(u) {
  if (/gdeltproject|algolia/.test(u)) return u;
  return u + (u.includes('?') ? '&' : '?') + '_=' + Math.floor(Date.now() / 15000);
}
async function fetchText(url, ms = 12000) {
  const order = [proxyPref, 0, 1, 2, 3].filter((v, i, a) => a.indexOf(v) === i);
  let lastErr;
  for (const p of order) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(PROXIES[p](bust(url)), { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const txt = await r.text();
      if (!txt || txt.length < 60) throw new Error('vacío');
      if (p !== proxyPref) { proxyPref = p; store.set('proxyPref', p); }
      return txt;
    } catch (e) { clearTimeout(t); lastErr = e; }
  }
  throw lastErr || new Error('sin conexión');
}

async function pool(tasks, n, onDone) {
  const out = []; let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const k = i++;
      try { out[k] = await tasks[k](); } catch (e) { out[k] = []; }
      onDone && onDone();
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, worker));
  return out.flat();
}

function stripHtml(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.innerHTML = s;
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}
function firstImg(html) { const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html || ''); return m ? m[1] : ''; }

function parseRSS(xml, feed) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const out = [];
  for (const n of doc.querySelectorAll('item, entry')) {
    const g = (sel) => { const e = n.getElementsByTagName(sel)[0]; return e ? e.textContent.trim() : ''; };
    let title = stripHtml(g('title'));
    let link = g('link');
    if (!link) { const l = n.querySelector('link'); link = l ? (l.getAttribute('href') || '') : ''; }
    const rawDesc = g('description') || g('content:encoded') || g('summary') || g('content');
    const d = new Date(g('pubDate') || g('published') || g('updated') || g('dc:date') || Date.now());
    let source = feed.n;
    const srcEl = n.getElementsByTagName('source')[0];
    if (srcEl && srcEl.textContent) source = srcEl.textContent.trim();
    const isGN = /news\.google\.com/.test(feed.u);
    if (isGN) {
      const i = title.lastIndexOf(' - ');
      if (i > 20) { if (!srcEl) source = title.slice(i + 3); title = title.slice(0, i); }
    }
    if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    let img = '';
    const media = n.getElementsByTagName('media:content')[0] || n.getElementsByTagName('media:thumbnail')[0] || n.getElementsByTagName('enclosure')[0];
    if (media) img = media.getAttribute('url') || '';
    if (!img) img = firstImg(rawDesc);
    if (img && !/^https?:/.test(img)) img = '';
    let desc = isGN ? '' : stripHtml(rawDesc);
    if (desc.length > 340) desc = desc.slice(0, 337) + '…';
    if (!title || !link) continue;
    out.push({ title, link, desc, date: isNaN(d) ? new Date() : d, source, img, fcat: feed.c, en: !!feed.en, fc: feed.country || '' });
  }
  return out;
}

async function loadFeed(feed) {
  try {
    const list = parseRSS(await fetchText(feed.u), feed);
    srcStats[feed.n] = (srcStats[feed.n] || 0) + list.length;
    return list;
  } catch (e) { srcStats[feed.n] = srcStats[feed.n] || 0; return []; }
}

async function loadGDELT(span = '2h') {
  const q = '(guerra OR ataque OR presidente OR terremoto OR "inteligencia artificial" OR Trump OR NASA OR urgente) sourcelang:spanish';
  const u = 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + encodeURIComponent(q) + '&mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=' + span;
  try {
    const j = JSON.parse(await fetchText(u, 15000));
    const arts = j.articles || [];
    srcStats['GDELT'] = arts.length;
    return arts.map(a => {
      const s = a.seendate || '';
      const d = s.length >= 15 ? new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(9, 11), +s.slice(11, 13), +s.slice(13, 15))) : new Date();
      return { title: a.title, link: a.url, desc: '', date: d, source: a.domain || 'GDELT', img: a.socialimage || '', fcat: 'world', en: false, fc: '' };
    });
  } catch (e) { srcStats['GDELT'] = 0; return []; }
}

async function loadHN(query) {
  // Hacker News: lo más votado de la comunidad tecnológica
  const u = query
    ? 'https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=30&query=' + encodeURIComponent(query)
    : 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30';
  try {
    const j = JSON.parse(await fetchText(u));
    const hits = (j.hits || []).filter(h => h.title);
    if (!query) srcStats['Hacker News'] = hits.length;
    return hits.map(h => ({
      title: h.title, link: h.url || ('https://news.ycombinator.com/item?id=' + h.objectID),
      desc: (h.points ? h.points + ' votos · ' : '') + (h.num_comments || 0) + ' comentarios en Hacker News',
      date: new Date(h.created_at), source: 'Hacker News', img: '', fcat: 'tech', en: true, fc: ''
    }));
  } catch (e) { if (!query) srcStats['Hacker News'] = 0; return []; }
}

async function loadQuakes(fast) {
  const urls = fast ? ['https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_hour.geojson']
    : ['https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson',
       'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson'];
  const lv = { green: 'verde', yellow: 'amarillo', orange: 'naranja', red: 'rojo' };
  const out = [];
  for (const u of urls) {
    try {
      const j = JSON.parse(await fetchText(u));
      for (const f of j.features || []) {
        const p = f.properties;
        if (p.mag < 5.5 && !u.includes('significant')) continue;
        if (fast && p.mag < 5.5) continue;
        out.push({
          title: `Sismo de magnitud ${p.mag.toFixed(1)} — ${p.place}` + (p.tsunami ? ' (alerta de tsunami)' : ''),
          link: p.url,
          desc: `Registrado por el Servicio Geológico de EE.UU. (USGS).${p.felt ? ' Sentido por ' + p.felt + ' personas reportadas.' : ''}${p.alert ? ' Nivel de alerta: ' + (lv[p.alert] || p.alert) + '.' : ''}`,
          date: new Date(p.time), source: 'USGS', img: '', fcat: 'dis', en: false, mag: p.mag, id: 'usgs-' + f.id, fc: ''
        });
      }
      srcStats['USGS'] = (srcStats['USGS'] || 0) + (j.features || []).length;
    } catch (e) { srcStats['USGS'] = srcStats['USGS'] || 0; }
  }
  return out;
}

/* =========================================================
   Análisis: agrupación, categorías, países, puntaje
   ========================================================= */
function tokens(t) {
  return new Set(norm(t).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w)));
}
function sim(a, b) { let n = 0; for (const w of a) if (b.has(w)) n++; return n / Math.min(a.size, b.size || 1); }
function hashId(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return 'n' + (h >>> 0).toString(36); }

function clusterize(raw, maxAgeH) {
  const now = Date.now(), maxAge = maxAgeH * 3600e3, uniq = new Map();
  for (const it of raw) {
    if (!cfg.en && it.en) continue;
    if (now - it.date > maxAge || it.date - now > 3600e3) continue;
    const key = norm(it.title).replace(/[^a-z0-9]/g, '').slice(0, 80) + '|' + norm(it.source);
    if (!uniq.has(key) && !uniq.has(it.link)) { uniq.set(key, it); uniq.set(it.link, it); }
  }
  const list = [...new Set(uniq.values())].sort((a, b) => b.date - a.date);
  const cl = [];
  for (const it of list) {
    const tk = tokens(it.title);
    let best = null, bs = 0;
    if (tk.size >= 3) for (const c of cl) { const s = sim(tk, c.tk); if (s > bs) { bs = s; best = c; } }
    if (best && bs >= 0.5) {
      best.items.push(it);
      best.sources.add(norm(it.source));
      if (!best.img && it.img) best.img = it.img;
      if (!best.desc && it.desc) best.desc = it.desc;
      if (it.date > best.date) best.date = it.date;
      if (it.fcat === 'urg') best.urgFeed = true;
      if (it.mag) best.mag = Math.max(best.mag || 0, it.mag);
    } else {
      cl.push({ items: [it], sources: new Set([norm(it.source)]), tk, img: it.img, desc: it.desc, date: it.date, urgFeed: it.fcat === 'urg', mag: it.mag });
    }
  }
  for (const c of cl) enrich(c, now);
  return cl;
}

function enrich(c, now) {
  c.main = c.items.find(i => !i.en && i.desc) || c.items.find(i => !i.en) || c.items[0];
  const text = norm(c.items.map(i => i.title + ' ' + (i.desc || '')).join(' '));
  c.text = text;
  c.cats = new Set(); c.tech = new Set(); c.countries = new Set();
  for (const k in KW) if (KW[k].test(text)) c.cats.add(k);
  for (const i of c.items) {
    if (i.fcat && !['urg', 'glob'].includes(i.fcat)) c.cats.add(i.fcat);
    if (i.fc) c.countries.add(i.fc);
  }
  for (const [id, , re] of TECH) if (re && re.test(text)) c.tech.add(id);
  if (c.tech.size && (c.cats.has('tech') || [...c.tech].some(t => t !== 'big'))) c.cats.add('tech');
  if (c.cats.has('tech') && !c.tech.size) c.tech.add('big');
  for (const k of COUNTRIES) if (k.re.test(text)) c.countries.add(k.code);
  if (!c.cats.size) c.cats.add('world');
  const n = c.sources.size, ageH = Math.max(0, (now - c.date) / 3600e3);
  const urgent = URGENT.test(text) || c.urgFeed || (c.mag && c.mag >= 7);
  let score = n * 3 + (urgent ? 6 : 0) + (c.cats.has('war') ? 3 : 0) + (c.cats.has('pol') ? 1.5 : 0) + (c.cats.has('tech') ? 1.5 : 0) + (c.cats.has('space') ? 1.5 : 0) + (c.cats.has('dis') ? 2 : 0) + (c.mag ? (c.mag - 5) * 3 : 0);
  c.score = (score + (ageH < 1 ? 4 : ageH < 3 ? 2 : 0)) * Math.pow(0.5, ageH / 5);
  c.fresh = ageH < 0.25;
  c.global = n >= 4;
  c.urgent = !!urgent && (n >= 2 || ageH < 3 || (c.mag && c.mag >= 6.5));
  if (c.global) c.cats.add('glob');
  if (c.urgent) c.cats.add('urg');
  c.id = c.main.id || hashId(norm(c.main.title));
  reg.set(c.id, c);
}

function buildClusters() {
  if (reg.size > 4000) reg = new Map();
  clusters = clusterize(items, cfg.age).sort((a, b) => b.score - a.score);
  for (const r of st.search.web) reg.set(r.id, r);
  for (const s of saved) if (!reg.has(s.id)) reg.set(s.id, s);
}

// Temas del momento: nombres propios más repetidos entre medios
function trending(list, max = 12) {
  const cnt = new Map(), srcNames = new Set(list.flatMap(c => [...c.sources]));
  for (const c of list.slice(0, 200)) {
    const found = new Set();
    for (const it of c.items.slice(0, 6)) {
      const re = /([A-ZÁÉÍÓÚÑ][\wáéíóúñü.-]+(?:\s+(?:de\s+|del\s+|la\s+)?[A-ZÁÉÍÓÚÑ][\wáéíóúñü.-]+)*)/g;
      let m;
      while ((m = re.exec(it.title))) {
        let w = m[1].replace(/[.-]+$/, '');
        const parts = w.split(/\s+/);
        while (parts.length && STOPCAP.has(parts[0])) parts.shift();
        w = parts.join(' ');
        if (w.length < 3 || STOPCAP.has(w) || srcNames.has(norm(w))) continue;
        found.add(w);
      }
    }
    for (const w of found) {
      const k = norm(w);
      const e = cnt.get(k) || { w, n: 0, s: 0 };
      e.n++; e.s += c.sources.size; cnt.set(k, e);
    }
  }
  return [...cnt.values()].filter(e => e.n >= 2).sort((a, b) => b.s - a.s).slice(0, max);
}

/* =========================================================
   Buscador
   ========================================================= */
const ACC = { a: '[aáàäâ]', e: '[eéèëê]', i: '[iíìïî]', o: '[oóòöô]', u: '[uúùüû]', n: '[nñ]', c: '[cç]' };
function parseQuery(q) {
  const groups = [], excl = [];
  const re = /(-?)"([^"]+)"|(-?)(\S+)/g;
  let m, orNext = false;
  const raw = [];
  while ((m = re.exec(q))) {
    const neg = !!(m[1] || m[3]);
    const val = m[2] != null ? m[2] : m[4];
    if (!m[2] && /^(OR|\|)$/.test(val)) { orNext = true; continue; }
    const t = norm(val).replace(/[^a-z0-9ñ .\/-]/g, ' ').trim();
    if (!t) continue;
    if (neg) { excl.push(t); continue; }
    if (orNext && raw.length) raw[raw.length - 1].push(t); else raw.push([t]);
    orNext = false;
  }
  for (const g of raw) groups.push(g);
  return { groups, excl, all: groups.flat() };
}
function hasTerm(text, t) {
  // text normalizado con espacios a los lados
  if (t.includes(' ') || t.length >= 4) return text.includes(' ' + t);
  return new RegExp('(^|[^a-z0-9])' + t.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '([^a-z0-9]|$)').test(text);
}
function prepText(s) { return ' ' + norm(s).replace(/[^a-z0-9ñ.\/-]+/g, ' ') + ' '; }
function matchScore(c, pq) {
  if (!pq.groups.length && !pq.excl.length) return 1;
  const ti = prepText(c.items.map(i => i.title).join(' | '));
  const all = prepText(c.items.map(i => i.title + ' ' + (i.desc || '') + ' ' + i.source).join(' | '));
  for (const x of pq.excl) if (hasTerm(all, x)) return 0;
  let s = 0;
  for (const g of pq.groups) {
    let ok = false;
    for (const t of g) {
      if (hasTerm(ti, t)) { s += 5; ok = true; }
      else if (hasTerm(all, t)) { s += 2; ok = true; }
    }
    if (!ok) return 0;
  }
  return s;
}
function hl(text, terms) {
  let h = esc(text);
  if (!terms || !terms.length) return h;
  const pats = terms.filter(t => t.length >= 2).sort((a, b) => b.length - a.length)
    .map(t => t.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&').replace(/[aeiounc]/g, ch => ACC[ch]).replace(/ /g, '\\s+') + (t.length >= 4 ? '[\\p{L}\\d]*' : ''));
  if (!pats.length) return h;
  try {
    const re = new RegExp('(^|[^\\p{L}\\d])(' + pats.join('|') + ')', 'giu');
    h = h.replace(re, (m0, pre, w) => pre + '<mark>' + w + '</mark>');
  } catch (e) {}
  return h;
}

function searchKey() {
  const s = st.search;
  return [s.q.trim(), s.country, s.time, s.lang, s.cat].join('|');
}
const WHEN = { 0: '7d', 1: '1h', 24: '1d', 168: '7d', 720: '30d' };

async function webSearch(force) {
  const s = st.search, q = s.q.trim();
  const key = searchKey();
  if (!q && !s.country) { s.web = []; s.webKey = ''; renderSearch(); return; }
  if (!force && key === s.webKey) return;
  const cached = webCache.get(key);
  if (cached && Date.now() - cached.t < 120e3) { s.web = cached.r; s.webKey = key; renderSearch(); return; }
  s.webKey = key; s.webBusy = true; s.webErr = false; renderSearch();
  const k = countryBy(s.country);
  const when = WHEN[s.time] || '7d';
  const feeds = [];
  const qes = (q ? q + ' ' : '') + (k ? k.es : '');
  const qen = (q ? q + ' ' : '') + (k ? k.en : '');
  if (s.lang !== 'en') feeds.push({ n: 'Google Noticias', u: GNs(qes.trim(), when), c: s.cat === 'all' ? 'world' : s.cat, country: k ? k.code : '' });
  if (s.lang !== 'es') feeds.push({ n: 'Google News EN', u: GNen(qen.trim(), when), c: s.cat === 'all' ? 'world' : s.cat, en: true, country: k ? k.code : '' });
  // edición local de Google Noticias del país elegido
  if (k && k.ed && !q && s.lang !== 'en') {
    const ed = k.ed === 'ES' ? gnEd('ES', 'es') : gnEd(k.ed);
    feeds.push({ n: 'Google Noticias ' + k.es, u: GN('', ed), c: 'world', country: k.code });
  }
  const tasks = feeds.map(f => () => loadFeed(f));
  if (q && (s.cat === 'tech' || s.lang === 'en')) tasks.push(() => loadHN(q));
  const before = Object.assign({}, srcStats);
  let raw = await pool(tasks, 4);
  srcStats = before;
  if (key !== searchKey()) return; // el usuario ya cambió la búsqueda
  const maxH = s.time ? Math.max(s.time, 1) : 24 * 30;
  const res = clusterize(raw.concat(items), maxH);
  s.web = res; s.webBusy = false; s.webErr = !raw.length;
  webCache.set(key, { t: Date.now(), r: res });
  renderSearch();
}

function searchResults() {
  const s = st.search, pq = parseQuery(s.q);
  const base = new Map();
  for (const c of clusters) base.set(c.id, c);
  for (const c of s.web) if (!base.has(c.id)) base.set(c.id, c);
  const now = Date.now();
  const out = [];
  for (const c of base.values()) {
    if (s.country && !c.countries.has(s.country)) continue;
    if (s.cat !== 'all' && !c.cats.has(s.cat)) continue;
    if (s.time && now - c.date > s.time * 3600e3) continue;
    if (s.lang === 'es' && c.items.every(i => i.en)) continue;
    if (s.lang === 'en' && !c.items.some(i => i.en)) continue;
    const m = matchScore(c, pq);
    if (!m) continue;
    c._rel = m + c.sources.size * 1.5 + Math.max(0, 6 - (now - c.date) / 3600e3);
    out.push(c);
  }
  const sorters = { rel: (a, b) => b._rel - a._rel, new: (a, b) => b.date - a.date, cov: (a, b) => b.sources.size - a.sources.size || b.date - a.date, imp: (a, b) => b.score - a.score };
  out.sort(sorters[s.sort] || sorters.rel);
  return { list: out, terms: pq.all };
}

function addHistory(q) {
  q = q.trim();
  if (q.length < 2) return;
  history = [q, ...history.filter(h => norm(h) !== norm(q))].slice(0, 12);
  store.set('history', history);
}

/* =========================================================
   Render: utilidades
   ========================================================= */
function ago(d) {
  const s = Math.max(0, (Date.now() - d) / 1000);
  if (s < 60) return 'ahora';
  if (s < 3600) return Math.floor(s / 60) + ' min';
  if (s < 86400) return Math.floor(s / 3600) + ' h';
  return Math.floor(s / 86400) + ' d';
}
const TPRIO = ['cib', 'chip', 'mov', 'spc', 'cri', 'game', 'ia', 'fut', 'big'];
const clock = (d) => { try { return new Date(d).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
const agoL = (d) => { const a = ago(d); return a === 'ahora' ? 'ahora mismo' : 'hace ' + a; };
const catName = (id) => (CATS.find(c => c[0] === id) || [, ''])[1];
const techName = (id) => (TECH.find(c => c[0] === id) || [, ''])[1];
const isSaved = (id) => saved.some(s => s.id === id);
const TIMES = [[0, 'Cualquier fecha'], [1, 'Última hora'], [24, 'Últimas 24 h'], [168, 'Última semana'], [720, 'Último mes']];
const SORTS = { imp: 'Importancia', rel: 'Relevancia', new: 'Más recientes', cov: 'Más medios' };

function cardHTML(c, o = {}) {
  const m = c.main, n = c.sources.size;
  const tags = [];
  if (Date.now() - c.date < 15 * 60e3) tags.push('<span class="tg n">Nuevo</span>');
  if (c.urgent) tags.push('<span class="tg u">Última hora</span>');
  if (c.global) tags.push(`<span class="tg g">Tendencia global</span>`);
  if (o.tech) { const t = TPRIO.find(k => c.tech.has(k)); if (t) tags.push(`<span class="tg c">${techName(t)}</span>`); }
  else {
    const mc = [...c.cats].find(k => !['urg', 'glob', 'world'].includes(k));
    if (mc) tags.push(`<span class="tg c">${catName(mc)}</span>`);
  }
  const ks = [...c.countries].slice(0, 2).map(countryBy).filter(Boolean);
  for (const k of ks) tags.push(`<span class="tg p">${esc(k.es)}</span>`);
  const img = cfg.img && c.img && (o.lead || o.imgs) ? `<img class="img" loading="lazy" src="${esc(c.img)}" alt="" onerror="this.remove()">` : '';
  const sv = isSaved(c.id);
  return `<article class="card ${o.lead ? 'lead' : ''}" data-id="${c.id}">
    ${img}
    <div class="body">
      ${tags.length ? `<div class="tags">${tags.join('')}</div>` : ''}
      <h3 class="ttl">${c.mag ? `<span class="quake">M${c.mag.toFixed(1)}</span>` : ''}${hl(m.title, o.terms)}</h3>
      ${c.desc ? `<p class="sum">${hl(c.desc, o.terms)}</p>` : ''}
      <div class="foot">
        <span class="src">${esc(m.source)}</span>${o.clock ? `<span class="clk">${clock(c.date)}</span>` : ''}<span data-t="${+c.date}" data-s="1">${ago(c.date)}</span>
        ${n > 1 ? `<span class="cov">${icon('layers')}${n}</span>` : ''}
        <span class="sp"></span>
        <button class="act ${sv ? 'on' : ''}" data-save="${c.id}" aria-label="Guardar">${icon('bookmark')}</button>
        <button class="act" data-share="${c.id}" aria-label="Compartir">${icon('share')}</button>
      </div>
    </div>
  </article>`;
}

function listHTML(list, limit, o = {}) {
  if (!list.length) return '';
  let h = list.slice(0, limit).map((c, i) => cardHTML(c, Object.assign({ lead: i === 0 && o.leadFirst, imgs: i < 8 }, o))).join('');
  if (list.length > limit) h += `<button class="more" data-more="${o.key}">Ver más (${list.length - limit})</button>`;
  return h;
}
const emptyHTML = (ic, msg) => `<div class="empty">${icon(ic, 'i')}<div>${msg}</div></div>`;
const secHTML = (title, right = '', red = false) => `<div class="sec ${red ? 'red' : ''}"><h2>${title}</h2><span>${right}</span></div>`;

/* =========================================================
   Render: vistas
   ========================================================= */
function renderTabs() {
  const t = $('tabs');
  if (st.view === 'home') {
    t.style.display = '';
    t.innerHTML = CATS.map(([id, name]) => {
      const n = id === 'all' ? 0 : id === 'now' ? clusters.filter(c => Date.now() - c.date <= 2 * 3600e3).length : clusters.filter(c => c.cats.has(id)).length;
      return `<button class="tab ${st.home.cat === id ? 'on' : ''}" data-tab="${id}">${name}${n ? `<span class="n">${n}</span>` : ''}</button>`;
    }).join('');
  } else if (st.view === 'tech') {
    t.style.display = '';
    const tc = clusters.filter(c => c.cats.has('tech'));
    t.innerHTML = TECH.map(([id, name]) => {
      const n = id === 'all' ? tc.length : tc.filter(c => c.tech.has(id)).length;
      return `<button class="tab ${st.tech.sub === id ? 'on' : ''}" data-tab="${id}">${name}${n ? `<span class="n">${n}</span>` : ''}</button>`;
    }).join('');
  } else { t.style.display = 'none'; t.innerHTML = ''; }
}

function homeList() {
  const h = st.home, now = Date.now();
  let l = clusters;
  if (h.cat === 'now') l = clusters.filter(c => now - c.date <= 2 * 3600e3).sort((a, b) => b.date - a.date);
  else if (h.cat !== 'all') l = l.filter(c => c.cats.has(h.cat));
  if (h.country) l = l.filter(c => c.countries.has(h.country));
  if (h.time) l = l.filter(c => now - c.date <= h.time * 3600e3);
  if (h.sort === 'new' || (h.cat === 'now' && h.sort === 'imp')) l = [...l].sort((a, b) => b.date - a.date);
  if (h.sort === 'cov') l = [...l].sort((a, b) => b.sources.size - a.sources.size || b.date - a.date);
  return l;
}

function renderHome() {
  const h = st.home;
  const k = countryBy(h.country);
  $('homeFilters').innerHTML =
    `<button class="pill ${h.country ? 'on' : ''}" data-pick="country:home">${icon('globe')}${k ? esc(k.es) : 'Todos los países'}</button>` +
    `<button class="pill ${h.time ? 'on' : ''}" data-pick="time:home">${icon('clock')}${TIMES.find(t => t[0] === h.time)[1]}</button>` +
    `<button class="pill ${h.sort !== 'imp' ? 'on' : ''}" data-pick="sort:home">${icon('sort')}${SORTS[h.sort]}</button>`;
  const list = homeList();
  const showExtras = h.cat === 'all' && !h.country && !h.time;
  const brk = showExtras ? clusters.filter(c => c.urgent).slice(0, 8) : [];
  $('homeBreaking').innerHTML = brk.length ? secHTML('Última hora', brk.length + ' alertas', true) +
    `<div class="breaking">${brk.map(c => `<div class="bk" data-id="${c.id}"><div class="m">${esc(c.main.source)} · <span data-t="${+c.date}">${agoL(c.date)}</span>${c.sources.size > 1 ? ' · ' + c.sources.size + ' medios' : ''}</div><p>${esc(c.main.title)}</p></div>`).join('')}</div>` : '';
  const tr = showExtras ? trending(clusters, 10) : [];
  $('homeTopics').innerHTML = tr.length ? secHTML('Temas del momento') + `<div class="topics">${tr.map(t => `<button class="topic" data-q="${esc(t.w)}">${esc(t.w)}<small>${t.n}</small></button>`).join('')}</div>` : '';
  if (!clusters.length) {
    $('homeList').innerHTML = loading ? emptyHTML('globe', 'Reuniendo noticias de medios de todo el mundo…') : emptyHTML('globe', 'No se pudieron cargar noticias.<br>Revisa tu conexión y toca actualizar.');
    return;
  }
  const title = h.cat === 'now' ? 'Publicadas en las últimas 2 horas' : h.cat === 'all' ? (k ? 'Noticias de ' + esc(k.es) : 'Lo más importante') : catName(h.cat);
  $('homeList').innerHTML = secHTML(title, list.length + ' historias') + (list.length ? listHTML(list, h.limit, { key: 'home', leadFirst: h.cat !== 'now', clock: h.cat === 'now' }) : emptyHTML('news', 'No hay noticias con estos filtros.<br>Prueba con otro país o rango de tiempo.'));
}

function renderTech() {
  const t = st.tech;
  $('techFilters').innerHTML = `<button class="pill ${t.sort !== 'imp' ? 'on' : ''}" data-pick="sort:tech">${icon('sort')}${SORTS[t.sort]}</button>` +
    `<button class="pill" data-gosearch="tech">${icon('search')}Buscar en tecnología</button>`;
  let l = clusters.filter(c => c.cats.has('tech'));
  if (t.sub !== 'all') l = l.filter(c => c.tech.has(t.sub));
  if (t.sort === 'new') l = [...l].sort((a, b) => b.date - a.date);
  if (t.sort === 'cov') l = [...l].sort((a, b) => b.sources.size - a.sources.size || b.date - a.date);
  const tr = t.sub === 'all' ? trending(l, 10) : [];
  $('techTopics').innerHTML = tr.length ? secHTML('Lo que se habla en tecnología') + `<div class="topics">${tr.map(x => `<button class="topic" data-q="${esc(x.w)}" data-qcat="tech">${esc(x.w)}<small>${x.n}</small></button>`).join('')}</div>` : '';
  $('techList').innerHTML = !clusters.length ? emptyHTML('chip', loading ? 'Cargando noticias de tecnología…' : 'Sin conexión.') :
    secHTML(t.sub === 'all' ? 'Tecnología' : techName(t.sub), l.length + ' historias') + (l.length ? listHTML(l, t.limit, { key: 'tech', leadFirst: true, tech: true }) : emptyHTML('chip', 'Nada en este tema por ahora.'));
}

function renderSearchFilters() {
  const s = st.search, k = countryBy(s.country);
  $('searchFilters').innerHTML =
    `<button class="pill ${s.country ? 'on' : ''}" data-pick="country:search">${icon('globe')}${k ? esc(k.es) : 'País'}</button>` +
    `<button class="pill ${s.time ? 'on' : ''}" data-pick="time:search">${icon('clock')}${s.time ? TIMES.find(t => t[0] === s.time)[1] : 'Fecha'}</button>` +
    `<button class="pill ${s.cat !== 'all' ? 'on' : ''}" data-pick="cat:search">${icon('tag')}${s.cat !== 'all' ? catName(s.cat) : 'Categoría'}</button>` +
    `<button class="pill ${s.sort !== 'rel' ? 'on' : ''}" data-pick="sort:search">${icon('sort')}${SORTS[s.sort]}</button>` +
    `<button class="pill ${s.lang !== 'all' ? 'on' : ''}" data-pick="lang:search">${icon('news')}${{ all: 'Idioma', es: 'Español', en: 'Inglés' }[s.lang]}</button>` +
    (s.country || s.time || s.cat !== 'all' || s.sort !== 'rel' || s.lang !== 'all' ? `<button class="pill" data-clearf="1">${icon('x')}Limpiar</button>` : '');
}

function renderSearch() {
  const s = st.search;
  renderSearchFilters();
  $('sbox').classList.toggle('has', !!s.q);
  const body = $('searchBody');
  if (!s.q.trim() && !s.country && s.cat === 'all') {
    const tr = trending(clusters, 12);
    const pop = ['US', 'CO', 'MX', 'AR', 'ES', 'VE', 'UA', 'RU', 'IL', 'CN'].map(countryBy);
    body.innerHTML =
      (history.length ? secHTML('Búsquedas recientes', '<button data-clearh="1" style="color:var(--blue);font-size:.74rem">Borrar</button>') +
        `<div class="hist">${history.map(h => `<button data-q="${esc(h)}">${icon('history')}${esc(h)}</button>`).join('')}</div>` : '') +
      (tr.length ? secHTML('Temas del momento') + `<div class="topics">${tr.map(t => `<button class="topic" data-q="${esc(t.w)}">${esc(t.w)}<small>${t.n}</small></button>`).join('')}</div>` : '') +
      secHTML('Noticias por país') + `<div class="cgrid">${pop.map(k => {
        const n = clusters.filter(c => c.countries.has(k.code)).length;
        return `<button data-setc="${k.code}"><span>${esc(k.es)}</span><small>${n || ''}</small></button>`;
      }).join('')}</div>` +
      `<div class="hint">Busca cualquier tema: también se consulta Google Noticias en vivo, no solo lo que ya está cargado.<br>
        Frase exacta: <code>"inteligencia artificial"</code> · Excluir: <code>Trump -aranceles</code> · Alternativas: <code>OpenAI OR Anthropic</code></div>`;
    return;
  }
  const { list, terms } = searchResults();
  const k = countryBy(s.country);
  const label = s.q.trim() ? `“${esc(s.q.trim())}”` : (k ? esc(k.es) : catName(s.cat));
  let status = s.webBusy ? 'Buscando en la web…' : (s.webErr ? 'Solo resultados guardados (sin conexión)' : (s.webKey ? 'Incluye resultados en vivo de la web' : 'Toca buscar para consultar la web'));
  body.innerHTML = `<div class="rinfo">${list.length} resultado${list.length === 1 ? '' : 's'} · ${label}<small>${status}</small></div>` +
    (list.length ? listHTML(list, s.limit, { key: 'search', terms, imgs: true })
      : (s.webBusy ? emptyHTML('search', 'Buscando…') : emptyHTML('search', 'Sin resultados. Prueba con otras palabras, quita filtros o amplía la fecha.')));
}

function renderSaved() {
  $('savedList').innerHTML = secHTML('Guardados', saved.length ? saved.length + ' noticias' : '') +
    (saved.length ? saved.map(s => cardHTML(s, { imgs: true })).join('') : emptyHTML('bookmark', 'Aún no has guardado noticias.<br>Toca el marcador de una noticia para leerla después.'));
}

function render() {
  renderTabs();
  if (st.view === 'home') renderHome();
  else if (st.view === 'tech') renderTech();
  else if (st.view === 'search') renderSearch();
  else if (st.view === 'saved') renderSaved();
  const b = $('newBadge');
  b.textContent = newCount > 99 ? '99+' : newCount;
  b.classList.toggle('on', newCount > 0 && st.view !== 'home');
}

function setStatus(state, txt) {
  $('dot').className = 'sdot ' + state;
  $('stTxt').textContent = txt;
}
function updateStatusLine() {
  if (loading) return;
  const ok = Object.values(srcStats).filter(v => v > 0).length;
  if (!lastOk) return;
  const newest = clusters.reduce((mx, c) => Math.max(mx, +c.date), 0);
  setStatus('ok', `En vivo · revisa cada ${cfg.fast ? cfg.fastInt + ' s' : Math.round(cfg.int / 60) + ' min'}` + (newest ? ` · última noticia ${agoL(newest)}` : '') + ` · ${ok} fuentes`);
}

/* =========================================================
   Hojas (selectores, detalle, ajustes)
   ========================================================= */
function openSheet(html) { $('sheet').innerHTML = '<div class="grab"></div>' + html; $('ov').classList.add('on'); $('sheet').scrollTop = 0; }
function closeSheet() { $('ov').classList.remove('on'); }

function pickCountry(scope) {
  const cur = st[scope].country;
  const counts = new Map();
  for (const c of clusters) for (const k of c.countries) counts.set(k, (counts.get(k) || 0) + 1);
  const list = [...COUNTRIES].sort((a, b) => (counts.get(b.code) || 0) - (counts.get(a.code) || 0) || a.es.localeCompare(b.es));
  openSheet(`<h3>Filtrar por país</h3><div class="sub">Noticias que mencionan al país, su capital o sus líderes.</div>
    <input class="cfind" id="cfind" placeholder="Buscar país…" autocomplete="off">
    <div class="cgrid" id="clist">
      <button class="${!cur ? 'on' : ''}" data-cset="${scope}:"><span>Todos</span><small>${clusters.length}</small></button>
      ${list.map(k => `<button class="${cur === k.code ? 'on' : ''}" data-cset="${scope}:${k.code}" data-name="${norm(k.es + ' ' + k.en)}"><span>${esc(k.es)}</span><small>${counts.get(k.code) || ''}</small></button>`).join('')}
    </div>`);
  $('cfind').oninput = (e) => {
    const v = norm(e.target.value.trim());
    for (const b of $('clist').children) b.style.display = !v || !b.dataset.name || b.dataset.name.includes(v) ? '' : 'none';
  };
}
function pickList(title, scope, field, opts) {
  const cur = st[scope][field];
  openSheet(`<h3>${title}</h3>` + opts.map(([v, l]) => `<button class="opt ${String(cur) === String(v) ? 'on' : ''}" data-set="${scope}:${field}:${v}">${l}</button>`).join(''));
}

function openDetail(id) {
  const c = reg.get(id);
  if (!c) return;
  const m = c.main, ks = [...c.countries].map(countryBy).filter(Boolean);
  const tags = [];
  if (c.urgent) tags.push('<span class="tg u">Última hora</span>');
  if (c.global) tags.push('<span class="tg g">Tendencia global</span>');
  for (const k of [...c.cats].filter(k => !['urg', 'glob', 'world'].includes(k)).slice(0, 2)) tags.push(`<span class="tg c">${catName(k)}</span>`);
  for (const k of ks.slice(0, 3)) tags.push(`<span class="tg p">${esc(k.es)}</span>`);
  const others = c.items.filter((i, k, a) => a.findIndex(x => norm(x.source) === norm(i.source)) === k);
  const sv = isSaved(c.id);
  openSheet(`${cfg.img && c.img ? `<img class="dt-img" src="${esc(c.img)}" alt="" onerror="this.remove()">` : ''}
    <div class="tags">${tags.join('')}</div>
    <div class="dt-ttl">${c.mag ? `<span class="quake">M${c.mag.toFixed(1)}</span>` : ''}${esc(m.title)}</div>
    <div class="dt-meta">${esc(m.source)} · publicada a las ${clock(c.date)} (<span data-t="${+c.date}">${agoL(c.date)}</span>)${c.sources.size > 1 ? ` · cubierta por ${c.sources.size} medios` : ''}</div>
    ${c.desc ? `<p class="dt-sum">${esc(c.desc)}</p>` : ''}
    <div class="btns">
      <button class="bt pri" data-open="${esc(m.link)}">${icon('ext')}Leer noticia</button>
      <button class="bt" data-share="${c.id}">${icon('share')}Compartir</button>
      <button class="bt" data-save="${c.id}" style="flex:0 0 52px;${sv ? 'color:var(--gold)' : ''}">${icon('bookmark')}</button>
    </div>
    ${others.length > 1 ? `<div class="flabel">Cobertura en ${others.length} medios</div><div class="covl">${others.map(i => `<a href="#" data-open="${esc(i.link)}"><b>${esc(i.source)}<em>hace ${ago(i.date)}</em></b><span>${esc(i.title)}</span></a>`).join('')}</div>` : ''}`);
}

function openSettings() {
  const ok = Object.entries(srcStats);
  openSheet(`<h3>Ajustes</h3>
    <div class="flabel">Apariencia</div>
    <div class="opt"><span>Tema</span><div class="seg" style="width:170px"><button data-theme="dark" class="${cfg.theme === 'dark' ? 'on' : ''}">Oscuro</button><button data-theme="light" class="${cfg.theme === 'light' ? 'on' : ''}">Claro</button></div></div>
    <div class="opt"><span>Tamaño de letra</span><div class="seg" style="width:170px"><button data-big="0" class="${!cfg.big ? 'on' : ''}">Normal</button><button data-big="1" class="${cfg.big ? 'on' : ''}">Grande</button></div></div>
    <label class="opt"><span>Mostrar imágenes</span><input type="checkbox" id="cImg" ${cfg.img ? 'checked' : ''}></label>
    <div class="flabel">Actualización</div>
    <label class="opt"><span>Modo instantáneo<br><small>Revisa noticias nuevas cada 30 segundos</small></span><input type="checkbox" id="cFast" ${cfg.fast ? 'checked' : ''}></label>
    <div class="opt"><span>Pestaña al abrir</span><select id="cStart"><option value="now" ${cfg.start === 'now' ? 'selected' : ''}>Al instante</option><option value="all" ${cfg.start === 'all' ? 'selected' : ''}>Destacadas</option></select></div>
    <div class="opt"><span>Revisión completa cada</span><select id="cInt">${[[60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min'], [600, '10 min']].map(([v, l]) => `<option value="${v}" ${cfg.int === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="opt"><span>Antigüedad máxima</span><select id="cAge">${[[12, '12 horas'], [24, '24 horas'], [48, '48 horas'], [72, '3 días']].map(([v, l]) => `<option value="${v}" ${cfg.age === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <label class="opt"><span>Incluir medios en inglés<br><small>Más cobertura global y de tecnología</small></span><input type="checkbox" id="cEn" ${cfg.en ? 'checked' : ''}></label>
    <div class="flabel">Alertas</div>
    <label class="opt"><span>Avisar de noticias urgentes</span><input type="checkbox" id="cAlert" ${cfg.alert ? 'checked' : ''}></label>
    <label class="opt"><span>Vibrar con las alertas</span><input type="checkbox" id="cVib" ${cfg.vib ? 'checked' : ''}></label>
    <div class="flabel">Fuentes (${ok.filter(([, v]) => v > 0).length} de ${ok.length} activas)</div>
    <div class="small" style="margin-top:0">${ok.map(([k, v]) => `<span style="color:${v > 0 ? 'var(--ok)' : 'var(--acc)'}">●</span> ${esc(k)}`).join(' &nbsp; ') || 'Aún cargando…'}</div>
    <button class="opt" id="cClear" style="color:var(--acc);margin-top:10px">Borrar historial y caché</button>
    <div class="small">“Tendencia global” significa que la misma noticia aparece al mismo tiempo en 4 o más medios distintos. Pulso Global v3.0</div>`);
  const ch = () => {
    cfg.img = $('cImg').checked; cfg.int = +$('cInt').value; cfg.age = +$('cAge').value;
    cfg.alert = $('cAlert').checked; cfg.vib = $('cVib').checked;
    cfg.fast = $('cFast').checked; cfg.start = $('cStart').value;
    const enCh = cfg.en !== $('cEn').checked; cfg.en = $('cEn').checked;
    saveCfg(); schedule(); buildClusters(); render();
    if (enCh) refresh(false);
    if (cfg.alert) askNotif();
  };
  ['cImg', 'cInt', 'cAge', 'cAlert', 'cVib', 'cEn', 'cFast', 'cStart'].forEach(id => $(id).onchange = ch);
  $('cClear').onclick = () => {
    history = []; store.set('history', []); store.set('cache', []); webCache.clear();
    toast('Historial y caché borrados'); closeSheet(); render();
  };
}

function applyTheme() {
  document.documentElement.dataset.theme = cfg.theme;
  document.documentElement.classList.toggle('big', !!cfg.big);
  const mt = document.querySelector('meta[name=theme-color]');
  if (mt) mt.content = cfg.theme === 'light' ? '#f4f5f7' : '#0d1117';
}

/* =========================================================
   Acciones
   ========================================================= */
let toastT;
function toast(msg, urgent) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast on' + (urgent ? ' u' : '');
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.className = 'toast'; }, urgent ? 7000 : 3000);
}
function openUrl(url) {
  try {
    if (window.cordova && window.cordova.InAppBrowser) window.cordova.InAppBrowser.open(url, '_system');
    else window.open(url, '_blank');
  } catch (e) { location.href = url; }
}
function snapshot(c) {
  return {
    id: c.id, main: { title: c.main.title, link: c.main.link, source: c.main.source },
    items: c.items.slice(0, 15).map(i => ({ title: i.title, link: i.link, source: i.source, date: +i.date })),
    desc: c.desc, img: c.img, date: +c.date, mag: c.mag, urgent: c.urgent, global: c.global,
    cats: [...c.cats], tech: [...c.tech], countries: [...c.countries], sources: [...c.sources]
  };
}
function revive(s) {
  return Object.assign({}, s, {
    date: new Date(s.date), items: s.items.map(i => Object.assign({}, i, { date: new Date(i.date) })),
    cats: new Set(s.cats), tech: new Set(s.tech), countries: new Set(s.countries), sources: new Set(s.sources)
  });
}
function toggleSave(id) {
  const i = saved.findIndex(s => s.id === id);
  if (i >= 0) { saved.splice(i, 1); toast('Quitada de guardados'); }
  else { const c = reg.get(id); if (!c) return; saved.unshift(revive(snapshot(c))); toast('Guardada para leer después'); }
  store.set('saved', saved.map(snapshot));
  render();
  if ($('ov').classList.contains('on') && $('sheet').querySelector('.dt-ttl')) openDetail(id);
}
async function share(id) {
  const c = reg.get(id);
  if (!c) return;
  const data = { title: c.main.title, text: c.main.title + ' — ' + c.main.source, url: c.main.link };
  try {
    if (navigator.share) { await navigator.share(data); return; }
    await navigator.clipboard.writeText(c.main.title + '\n' + c.main.link);
    toast('Enlace copiado');
  } catch (e) {}
}
function askNotif() {
  try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
}
function notify(c) {
  toast((c.global ? 'Tendencia global: ' : 'Última hora: ') + c.main.title, true);
  if (cfg.vib && navigator.vibrate) try { navigator.vibrate([180, 90, 180]); } catch (e) {}
  try {
    if ('Notification' in window && Notification.permission === 'granted')
      new Notification('Pulso Global', { body: c.main.title, icon: 'icon.png', tag: c.id });
  } catch (e) {}
}

function go(view) {
  if (view === 'cfg') { openSettings(); return; }
  st.view = view;
  for (const b of $('nav').children) b.classList.toggle('on', b.dataset.v === view);
  for (const v of document.querySelectorAll('.view')) v.classList.toggle('on', v.id === 'v-' + view);
  if (view === 'home') newCount = 0;
  render();
  window.scrollTo(0, 0);
}
function runSearch(q, cat) {
  st.search.q = q; $('q').value = q;
  if (cat) st.search.cat = cat;
  st.search.limit = 30;
  addHistory(q);
  hideSugg();
  go('search');
  webSearch(true);
}

/* sugerencias mientras se escribe */
function showSugg() {
  const v = norm($('q').value.trim());
  const box = $('sugg');
  if (!v || document.activeElement !== $('q')) { box.classList.remove('on'); return; }
  const out = [], seenS = new Set();
  const add = (ic, label, val, extra = '', setc = '') => {
    const k = norm(label);
    if (seenS.has(k) || out.length >= 7) return;
    seenS.add(k); out.push({ ic, label, val, extra, setc });
  };
  for (const h of history) if (norm(h).includes(v)) add('history', h, h, 'Reciente');
  for (const k of COUNTRIES) if (norm(k.es).startsWith(v) || norm(k.en).startsWith(v)) add('globe', 'Noticias de ' + k.es, '', 'País', k.code);
  for (const t of trending(clusters, 30)) if (norm(t.w).includes(v)) add('trend', t.w, t.w, t.n + ' historias');
  for (const [id, name] of TECH) if (id !== 'all' && norm(name).includes(v)) add('chip', name, name, 'Tecnología');
  if (!out.length) { box.classList.remove('on'); return; }
  box.innerHTML = out.map(o => `<button ${o.setc ? `data-setc="${o.setc}"` : `data-q="${esc(o.val)}"`}>${icon(o.ic)}<span>${esc(o.label)}</span><small>${esc(o.extra)}</small></button>`).join('');
  box.classList.add('on');
}
function hideSugg() { $('sugg').classList.remove('on'); }

/* =========================================================
   Eventos
   ========================================================= */
document.addEventListener('click', (e) => {
  const t = e.target;
  const el = (sel) => t.closest(sel);
  let x;
  if ((x = el('[data-save]'))) { e.stopPropagation(); toggleSave(x.dataset.save); return; }
  if ((x = el('[data-share]'))) { e.stopPropagation(); share(x.dataset.share); return; }
  if ((x = el('[data-open]'))) { e.preventDefault(); openUrl(x.dataset.open); return; }
  if ((x = el('[data-v]'))) { go(x.dataset.v); return; }
  if ((x = el('[data-tab]'))) {
    if (st.view === 'home') { st.home.cat = x.dataset.tab; st.home.limit = 30; }
    else { st.tech.sub = x.dataset.tab; st.tech.limit = 30; }
    render(); window.scrollTo(0, 0); return;
  }
  if ((x = el('[data-more]'))) { st[x.dataset.more].limit += 30; render(); return; }
  if ((x = el('[data-q]'))) { runSearch(x.dataset.q, x.dataset.qcat); return; }
  if ((x = el('[data-setc]'))) {
    st.search.country = x.dataset.setc; st.search.limit = 30; hideSugg();
    if (st.view !== 'search') go('search'); else render();
    webSearch(true); return;
  }
  if ((x = el('[data-gosearch]'))) { st.search.cat = 'tech'; go('search'); $('q').focus(); return; }
  if ((x = el('[data-clearh]'))) { history = []; store.set('history', []); render(); return; }
  if ((x = el('[data-clearf]'))) { Object.assign(st.search, { country: '', time: 0, sort: 'rel', cat: 'all', lang: 'all' }); render(); webSearch(true); return; }
  if ((x = el('[data-pick]'))) {
    const [what, scope] = x.dataset.pick.split(':');
    if (what === 'country') pickCountry(scope);
    if (what === 'time') pickList('Rango de tiempo', scope, 'time', TIMES);
    if (what === 'sort') pickList('Ordenar por', scope, 'sort', scope === 'search' ? [['rel', 'Relevancia'], ['new', 'Más recientes'], ['cov', 'Más medios'], ['imp', 'Importancia']] : [['imp', 'Importancia'], ['new', 'Más recientes'], ['cov', 'Más medios']]);
    if (what === 'cat') pickList('Categoría', scope, 'cat', CATS.map(([id, n]) => [id, id === 'all' ? 'Todas' : n]));
    if (what === 'lang') pickList('Idioma de los medios', scope, 'lang', [['all', 'Todos'], ['es', 'Solo español'], ['en', 'Solo inglés']]);
    return;
  }
  if ((x = el('[data-cset]'))) {
    const [scope, code] = x.dataset.cset.split(':');
    st[scope].country = code; st[scope].limit = 30; closeSheet(); render();
    if (scope === 'search') webSearch(true);
    return;
  }
  if ((x = el('[data-set]'))) {
    const [scope, field, v] = x.dataset.set.split(':');
    st[scope][field] = field === 'time' ? +v : v; st[scope].limit = 30; closeSheet(); render();
    if (scope === 'search' && field !== 'sort') webSearch(true);
    return;
  }
  if ((x = el('[data-theme]')) && x.tagName === 'BUTTON') { cfg.theme = x.dataset.theme; saveCfg(); applyTheme(); openSettings(); return; }
  if ((x = el('[data-big]'))) { cfg.big = x.dataset.big === '1'; saveCfg(); applyTheme(); openSettings(); return; }
  if ((x = el('[data-id]'))) { openDetail(x.dataset.id); return; }
  if (t.id === 'ov') { closeSheet(); return; }
  if (!el('#sugg') && !el('#sbox')) hideSugg();
});

let qT1, qT2;
$('q').addEventListener('input', (e) => {
  st.search.q = e.target.value; st.search.limit = 30;
  showSugg();
  clearTimeout(qT1); clearTimeout(qT2);
  qT1 = setTimeout(renderSearch, 150);
  if (e.target.value.trim().length >= 3) qT2 = setTimeout(() => webSearch(false), 1100);
});
$('q').addEventListener('focus', showSugg);
$('q').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); addHistory(st.search.q); hideSugg(); $('q').blur(); webSearch(true); }
});
$('qx').onclick = () => { st.search.q = ''; $('q').value = ''; st.search.web = []; st.search.webKey = ''; hideSugg(); renderSearch(); $('q').focus(); };
$('bRefresh').onclick = () => refresh(true);

/* =========================================================
   Ciclo de actualización
   ========================================================= */
async function refresh(manual) {
  if (loading) return;
  loading = true;
  setStatus('load', 'Actualizando fuentes…');
  const bar = $('loadbar'), fill = $('loadfill');
  bar.style.display = ''; fill.style.width = '0';
  srcStats = {};
  const feeds = FEEDS.filter(f => cfg.en || !f.en);
  const tasks = [...feeds.map(f => () => loadFeed(f)), loadGDELT, loadQuakes];
  if (cfg.en) tasks.push(() => loadHN());
  let done = 0;
  const raw = await pool(tasks, 8, () => {
    done++;
    fill.style.width = Math.round(done / tasks.length * 100) + '%';
    setStatus('load', `Cargando fuentes ${done} de ${tasks.length}…`);
  });
  loading = false;
  bar.style.display = 'none';
  if (raw.length) {
    items = mergeItems(raw, []);
    afterLoad(manual);
  } else {
    setStatus('off', lastOk ? 'Sin conexión · mostrando lo último guardado' : 'Sin conexión');
    if (manual) toast('No hay conexión. Mostrando lo último guardado.');
    render();
  }
}

// Une noticias nuevas con las que ya hay, sin duplicar enlaces
function mergeItems(fresh, old) {
  const byLink = new Map();
  for (const i of old) byLink.set(i.link, i);
  for (const i of fresh) byLink.set(i.link, i);
  const maxAge = Math.max(cfg.age, 24) * 3600e3, now = Date.now();
  return [...byLink.values()].filter(i => now - i.date < maxAge).sort((a, b) => b.date - a.date).slice(0, 2500);
}

let fastBusy = false;
async function fastRefresh() {
  if (loading || fastBusy || document.hidden) return;
  fastBusy = true;
  const feeds = FAST.filter(f => cfg.en || !f.en);
  const tasks = [...feeds.map(f => () => loadFeed(f)), () => loadGDELT('15min'), () => loadQuakes(true)];
  const keep = Object.assign({}, srcStats);
  const raw = await pool(tasks, 6);
  srcStats = Object.assign(keep, srcStats);
  fastBusy = false;
  if (!raw.length || loading) return;
  items = mergeItems(raw, items);
  afterLoad(false);
}

let pendingNew = 0;
function afterLoad(manual) {
  {
    buildClusters();
    newIds = new Set();
    const fresh = [];
    for (const c of clusters) if (!seen.has(c.id)) { if (!firstRun) newIds.add(c.id); fresh.push(c); seen.add(c.id); }
    if (!firstRun) {
      if (st.view !== 'home') newCount += fresh.length;
      if (cfg.alert) {
        const imp = fresh.filter(c => c.urgent || c.global).sort((a, b) => b.score - a.score)[0];
        if (imp) notify(imp);
        else if (manual) toast(fresh.length ? fresh.length + ' noticias nuevas' : 'Estás al día');
      }
    } else if (manual) toast('Noticias actualizadas');
    firstRun = false;
    store.set('seen', [...seen].slice(-4000));
    store.set('cache', items.slice(0, 700).map(i => Object.assign({}, i, { date: +i.date })));
    lastOk = Date.now();
    updateStatusLine();
    // si estás leyendo más abajo, no se mueve la lista: aparece un aviso para subir
    if (!manual && st.view === 'home' && window.scrollY > 250 && fresh.length && !$('ov').classList.contains('on')) {
      pendingNew += fresh.length;
      showPill();
      renderTabs();
      return;
    }
    if ($('ov').classList.contains('on') && !manual) { renderTabs(); return; }
    pendingNew = 0; hidePill();
    render();
  }
}
function showPill() {
  const p = $('newPill');
  p.style.top = ($('nav') && document.querySelector('.appbar').offsetHeight + 8) + 'px';
  p.textContent = pendingNew + (pendingNew === 1 ? ' noticia nueva' : ' noticias nuevas') + ' · toca para ver';
  p.classList.add('on');
}
function hidePill() { $('newPill').classList.remove('on'); }
$('newPill').onclick = () => { pendingNew = 0; hidePill(); render(); window.scrollTo(0, 0); };
window.addEventListener('scroll', () => { if (pendingNew && window.scrollY < 60) { pendingNew = 0; hidePill(); render(); } }, { passive: true });

let fastTimer = null;
function schedule() {
  clearInterval(timer); clearInterval(fastTimer);
  timer = setInterval(() => { if (!document.hidden) refresh(false); }, cfg.int * 1000);
  if (cfg.fast) fastTimer = setInterval(fastRefresh, cfg.fastInt * 1000);
}
// Al volver a la app: revisión inmediata
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (Date.now() - lastOk > cfg.int * 1000) refresh(false); else fastRefresh();
});
window.addEventListener('online', () => refresh(false));
// Los "hace X min" se actualizan solos sin recargar la lista
setInterval(() => {
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = el.dataset.s ? ago(+el.dataset.t) : agoL(+el.dataset.t);
  updateStatusLine();
}, 20e3);

/* =========================================================
   Arranque
   ========================================================= */
applyTheme();
saved = saved.map(revive);
for (const s of saved) reg.set(s.id, s);
const cached = store.get('cache', []);
if (cached.length) {
  items = cached.map(i => Object.assign(i, { date: new Date(i.date) }));
  buildClusters();
  setStatus('load', 'Mostrando lo último guardado…');
}
render();
if (cfg.alert) askNotif();
refresh(false);
schedule();
})();
