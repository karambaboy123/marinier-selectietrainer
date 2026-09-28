/* Marinier Selectietrainer — trainer-app
 * Zelfgemaakte oefenvragen. Geen officiële vragen of simulatie van Defensie of het Korps Mariniers. */
(function () {
  'use strict';
  const MT = window.MT;
  const { esc, shuffle, pick, clamp, LETTERS } = MT.util;
  const CATS = MT.CATS, CAT_IDS = MT.CAT_IDS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const APP = $('#app');
  const now = () => performance.now();

  /* ================= Instellingen ================= */
  const LEVELS = [
    { v: 1, k: '1', label: 'Beginner', desc: 'Ik heb weinig ervaring met cognitieve assessments.' },
    { v: 2, k: '2', label: 'Basis', desc: 'Ik begrijp de belangrijkste soorten vragen.' },
    { v: 3, k: '3', label: 'Gemiddeld', desc: 'Ik heb al geoefend en herken veel basispatronen.' },
    { v: 4, k: '4', label: 'Gevorderd', desc: 'Ik los standaardvragen meestal goed op en wil moeilijkere patronen.' },
    { v: 5, k: '5', label: 'Expert', desc: 'Ik wil complexe vragen, hoge snelheid en minimale foutmarge.' },
    { v: 'calib', k: '6', label: 'Automatische niveaubepaling', desc: 'Eerst een korte nulmeting van 10 vragen. Daarna bepaalt de trainer je startniveau.' },
  ];
  const DIFFS = [
    { v: '1', k: '1', label: '1/5 – Makkelijk', desc: 'Eenvoudige patronen en veel tijd.' },
    { v: '2', k: '2', label: '2/5 – Normaal', desc: 'Basisniveau.' },
    { v: '3', k: '3', label: '3/5 – Uitdagend', desc: 'Meer denkstappen en minder voor de hand liggende patronen.' },
    { v: '4', k: '4', label: '4/5 – Moeilijk', desc: 'Complexe patronen, afleiders en hogere tijdsdruk.' },
    { v: '5', k: '5', label: '5/5 – Extreem', desc: 'Complexe combinaties, weinig tijd en hoge nauwkeurigheid vereist.' },
    { v: 'auto', k: 'A', label: 'AUTO – Adaptief', desc: 'Begint passend bij je niveau en past de moeilijkheid automatisch aan.' },
  ];
  const CATEGORY_OPTS = [
    ...CAT_IDS.map((id) => ({ v: id, k: CATS[id].letter, label: `${CATS[id].icon} ${CATS[id].name}`, desc: '' })),
    { v: 'mix', k: 'G', label: '🔀 Gemengde training', desc: 'Alle onderdelen door elkaar.' },
    { v: 'auto', k: 'H', label: '🎯 Automatisch', desc: 'De trainer kiest vaker de onderdelen waarin je in deze sessie de meeste fouten maakt.' },
  ];
  CATEGORY_OPTS[0].desc = 'Welk getal komt hierna?';
  CATEGORY_OPTS[1].desc = 'Woord-, getal- en letterverbanden.';
  CATEGORY_OPTS[2].desc = 'Bewerkingen op een rij letters.';
  CATEGORY_OPTS[3].desc = 'Welke figuur komt hierna?';
  CATEGORY_OPTS[4].desc = 'Volgordes, conclusies, codes en redeneersommen.';
  CATEGORY_OPTS[5].desc = 'Afwijkers, figuuranalogieën en matrices.';
  const DURATIONS = [
    { v: 5, k: '1', label: 'Kort – 5 vragen' },
    { v: 10, k: '2', label: 'Normaal – 10 vragen' },
    { v: 20, k: '3', label: 'Lang – 20 vragen' },
    { v: 30, k: '4', label: 'Intensief – 30 vragen' },
    { v: 40, k: '5', label: 'Mariniers Training – 40 gemengde vragen' },
    { v: Infinity, k: '6', label: 'Vrij trainen', desc: 'Doorgaan tot je op STOP drukt.' },
  ];
  const PRESSURES = [
    { v: 'none', k: '1', label: 'Geen tijdsdruk', desc: 'Focus volledig op begrijpen.', f: null },
    { v: 'light', k: '2', label: 'Licht', desc: 'Ruime tijd per vraag.', f: 1.6 },
    { v: 'normal', k: '3', label: 'Normaal', desc: 'Gemiddelde tijdsdruk.', f: 1.0 },
    { v: 'high', k: '4', label: 'Hoog', desc: 'Weinig tijd per vraag.', f: 0.7 },
    { v: 'extreme', k: '5', label: 'Extreem', desc: 'Zeer weinig tijd; snelheid en nauwkeurigheid tellen allebei.', f: 0.5 },
    { v: 'adaptive', k: '6', label: 'Adaptief', desc: 'De tijd per vraag past zich aan je prestaties aan.', f: 1.0 },
  ];
  const FEEDBACKS = [
    { v: 'each', k: '1', label: 'Na iedere vraag', desc: 'Direct beoordeling en uitleg.' },
    { v: 'end', k: '2', label: 'Alleen aan het eind', desc: 'Zoals bij een assessment: pas feedback in het eindrapport.' },
  ];
  const HINTS = [
    { v: true, k: '1', label: 'Hints aan', desc: 'Je kunt per vraag één kleine hint vragen.' },
    { v: false, k: '2', label: 'Hints uit', desc: '' },
  ];
  const STEP_DEFS = {
    level: { title: 'Kies je niveau', q: 'Wat is je huidige niveau?', opts: LEVELS },
    difficulty: { title: 'Moeilijkheid', q: 'Hoe moeilijk wil je beginnen?', opts: DIFFS, note: 'Deze niveaus zijn trainingsniveaus van deze oefenomgeving. Ze zeggen niets over het officiële niveau van Defensie.' },
    category: { title: 'Oefencategorie', q: 'Wat wil je oefenen?', opts: CATEGORY_OPTS },
    duration: { title: 'Trainingsduur', q: 'Hoeveel vragen?', opts: DURATIONS },
    pressure: { title: 'Tijdsdruk', q: 'Hoeveel tijdsdruk wil je?', opts: PRESSURES, note: 'De tijdslimieten zijn trainingsinstellingen, geen officiële tijdslimieten van het echte assessment.' },
    feedback: { title: 'Feedback', q: 'Wanneer wil je feedback?', opts: FEEDBACKS },
    hints: { title: 'Hints', q: 'Wil je hints kunnen gebruiken?', opts: HINTS },
  };

  const MODES = {
    1: { icon: '📚', name: 'Leren & Uitleggen', bullets: ['Eén vraag per keer', 'Direct feedback', 'Uitgebreide uitleg', 'Geen tijdsdruk', 'Gericht op begrijpen'],
      steps: ['level', 'difficulty', 'category', 'duration'], fixed: { pressure: 'none', feedback: 'each', hints: true }, def: { difficulty: 'auto', category: 'mix', duration: 10 } },
    2: { icon: '🧠', name: 'Adaptieve Training', bullets: ['Moeilijkheid past zich automatisch aan', 'Analyseert je fouten', 'Herhaalt zwakke onderwerpen met nieuwe vragen', 'Wordt moeilijker als je goed presteert'],
      steps: ['level', 'category', 'duration', 'pressure'], fixed: { difficulty: 'auto', feedback: 'each', hints: true }, def: { category: 'auto', duration: 20, pressure: 'adaptive' } },
    3: { icon: '⚓', name: 'Mariniers Training Mode', bullets: ['Intensieve gemengde training', 'Tijd en nauwkeurigheid tellen', 'Geen hints tenzij ingesteld', 'Moeilijkheid loopt op', 'Uitgebreide analyse na afloop'],
      steps: ['level'], fixed: { category: 'mix', difficulty: 'auto', duration: 30, feedback: 'each', hints: false, pressure: 'adaptive' }, def: {} },
    4: { icon: '⏱️', name: 'Assessment Simulatie', bullets: ['Meerdere vragen achter elkaar', 'Geen feedback tussendoor', 'Geen hints', 'Assessmentachtige tijdsdruk', 'Eindrapport na afloop'],
      steps: ['level', 'category', 'duration', 'pressure'], fixed: { difficulty: 'auto', feedback: 'end', hints: false }, def: { category: 'mix', duration: 20, pressure: 'normal' }, pressureOpts: ['normal', 'high', 'extreme'] },
    5: { icon: '🎯', name: 'Zwakke Punten Training', bullets: ['Gebruikt je resultaten uit deze sessie', 'Kiest automatisch je zwakste onderdelen', 'Extra oefeningen op die onderwerpen'],
      steps: ['duration'], fixed: { category: 'weak', difficulty: 'auto', feedback: 'each', hints: true, pressure: 'light' }, def: { duration: 10 } },
    6: { icon: '🛠️', name: 'Zelf Instellen', bullets: ['Kies alle instellingen zelf'],
      steps: ['level', 'difficulty', 'category', 'duration', 'pressure', 'feedback', 'hints'], fixed: {}, def: { difficulty: 'auto', category: 'mix', duration: 10, pressure: 'normal', feedback: 'each', hints: true } },
  };

  const TAG_ADVICE = {
    'Rekenfout': 'Schrijf tussenstappen op en reken de laatste stap altijd even na.',
    'Verkeerde regel': 'Test je regel op álle getallen of figuren, niet alleen op de eerste twee.',
    'Tweede regel gemist': 'Heb je één regel gevonden? Check dan of er nog iets anders verandert.',
    'Regel gemist': 'Loop elke eigenschap apart af: vorm, vulling, richting, aantal.',
    'Verkeerde richting': 'Let op richting: met of tegen de klok in, vooruit of terug.',
    'Volgorde van bewerkingen': 'Werk strikt van links naar rechts en schrijf elke tussenstap op.',
    'Bewerking overgeslagen': 'Tik elke bewerking af zodra je hem hebt uitgevoerd.',
    'Bewerking verward': 'Lees de legenda bij elke vraag opnieuw: de symbolen wisselen.',
    'Relatie niet gelijk': 'Maak een korte zin van het eerste paar en zet het nieuwe woord in precies dezelfde zin.',
    'Mogelijk maar niet zeker': 'Zoek bij elke conclusie een tegenvoorbeeld. “Kan waar zijn” is niet genoeg.',
    'In strijd met de gegevens': 'Teken de groepen als cirkels voordat je een conclusie kiest.',
    'Volgorde verkeerd': 'Schrijf alle zinnen om naar dezelfde richting en teken een lijn.',
    'Regel niet gevonden': 'Vind je niets? Zoek een verband tussen twee eigenschappen.',
    'Tijd op': 'Te lang blijven hangen. Gok na je tijdslimiet en ga door; oefen tempo met Licht → Normaal.',
    'Overig': 'Lees de uitleg bij de vragen die fout gingen goed door.',
  };

  /* ================= Sessie (lokaal bewaard) ================= */
  const SKEY = 'mst-session-v2';
  let SESSION = { history: [], created: Date.now() };
  try { const s = JSON.parse(localStorage.getItem(SKEY) || 'null'); if (s && Array.isArray(s.history)) SESSION = s; } catch (e) { /* geen opslag */ }
  const saveSession = () => { try { SESSION.history = SESSION.history.slice(-600); localStorage.setItem(SKEY, JSON.stringify(SESSION)); } catch (e) { /* negeren */ } };

  function catStats(list) {
    const S = {};
    CAT_IDS.forEach((c) => (S[c] = { n: 0, ok: 0, t: 0, tn: 0 }));
    for (const r of list) {
      const s = S[r.c];
      if (!s) continue;
      s.n++; if (r.ok) s.ok++;
      if (r.t != null && !r.to) { s.t += r.t; s.tn++; }
    }
    return S;
  }
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  function strongest(S) {
    const c = CAT_IDS.filter((k) => S[k].n >= 2).sort((a, b) => S[b].ok / S[b].n - S[a].ok / S[a].n || S[b].n - S[a].n);
    return c[0] && S[c[0]].ok / S[c[0]].n >= 0.5 ? c[0] : null;
  }
  function weakest(S, n = 2) {
    return CAT_IDS.filter((k) => S[k].n >= 1 && S[k].ok < S[k].n).sort((a, b) => S[a].ok / S[a].n - S[b].ok / S[b].n || S[b].n - S[a].n).slice(0, n);
  }

  /* ================= Hulp: UI ================= */
  let keyHandler = null;
  document.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if ($('.overlay')) { if (e.key === 'Escape') closePanel(); return; }
    if (keyHandler) keyHandler(e);
  });
  function view(html, keys) {
    APP.innerHTML = html;
    keyHandler = keys || null;
    window.scrollTo({ top: 0 });
  }
  let toastT;
  function toast(msg) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    clearTimeout(toastT);
    toastT = setTimeout(() => t.remove(), 2600);
  }
  let panelOpenedAt = null;
  function openPanel(html) {
    closePanel();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = `<div class="panel" role="dialog" aria-modal="true">${html}<div class="row" style="margin-top:16px"><button class="btn quiet" data-close>Sluiten</button></div></div>`;
    o.addEventListener('click', (e) => { if (e.target === o || e.target.hasAttribute('data-close')) closePanel(); });
    document.body.appendChild(o);
    if (RUN && RUN.cur && !RUN.cur.done) panelOpenedAt = now();
    const b = $('[data-close]', o); if (b) b.focus();
    return o;
  }
  function closePanel() {
    const o = $('.overlay');
    if (o) o.remove();
    if (panelOpenedAt != null && RUN && RUN.cur) { RUN.cur.t0 += now() - panelOpenedAt; }
    panelOpenedAt = null;
  }
  const levelName = (v) => (LEVELS.find((l) => l.v === v) || {}).label || '';
  const settingLabel = (key, v) => {
    const list = { difficulty: DIFFS, category: CATEGORY_OPTS.concat([{ v: 'weak', label: '🎯 Zwakste onderdelen' }]), duration: DURATIONS, pressure: PRESSURES, feedback: FEEDBACKS, hints: HINTS }[key];
    if (key === 'level') return `${v} – ${levelName(v)}`;
    const o = list && list.find((x) => x.v === v);
    return o ? o.label : String(v);
  };

  /* ================= Hoofdmenu ================= */
  function renderMenu() {
    stopTimer();
    RUN = null;
    const H = SESSION.history;
    const S = catStats(H);
    const ok = H.filter((r) => r.ok).length;
    const weak = weakest(S);
    const bar = H.length
      ? `<div class="sessionbar"><span>Deze sessie: <b>${H.length}</b> vragen · <b>${pct(ok, H.length)}%</b> goed</span>${weak.length ? `<span>Extra aandacht: ${weak.map((c) => CATS[c].name).join(', ')}</span>` : ''}
         <span class="row" style="margin-left:auto"><button class="btn quiet small" id="m-weak">ZWAKKE PUNTEN</button><button class="btn quiet small" id="m-clear">Sessie wissen</button></span></div>`
      : '';
    view(`${bar}
      <h2>🎯 Kies je trainingsmodus</h2>
      <div class="modes">${Object.entries(MODES).map(([k, m]) => `<button class="mode ${k === '3' ? 'star' : ''}" data-mode="${k}"><span class="no">${k}</span><h3>${m.icon} ${m.name}</h3><ul>${m.bullets.map((b) => `<li>${b}</li>`).join('')}</ul></button>`).join('')}</div>
      <p style="margin-top:16px"><b>Welke modus wil je starten? Kies 1 t/m 6.</b></p>
      <p class="muted small">Alle vragen worden ter plekke gemaakt, dus elke training is anders. Het zijn zelfgemaakte oefenvragen, geen officiële vragen van Defensie of het Korps Mariniers.</p>`,
      (e) => { if (/^[1-6]$/.test(e.key)) chooseMode(Number(e.key)); });
    $$('[data-mode]').forEach((b) => (b.onclick = () => chooseMode(Number(b.dataset.mode))));
    if ($('#m-weak')) $('#m-weak').onclick = showWeak;
    if ($('#m-clear')) $('#m-clear').onclick = () => {
      const o = openPanel(`<h2>Sessie wissen?</h2><p>Alle resultaten van deze sessie worden verwijderd. Zwakke Punten Training begint dan weer bij nul.</p><button class="btn" id="yes-clear">Ja, wissen</button>`);
      $('#yes-clear', o).onclick = () => { SESSION = { history: [], created: Date.now() }; saveSession(); closePanel(); renderMenu(); toast('Sessie gewist'); };
    };
  }

  /* ================= Wizard ================= */
  let W = null;
  function chooseMode(m, preset) {
    const M = MODES[m];
    W = { mode: m, label: `${M.icon} ${M.name}`, s: { ...M.def, ...M.fixed, ...(preset || {}) }, steps: M.steps.slice(), i: 0 };
    if (m === 5) {
      const S = catStats(SESSION.history);
      const n = SESSION.history.length;
      if (n < 6) {
        view(`<div class="eyebrow">${W.label}</div><h2>Nog te weinig resultaten</h2>
          <p>Zwakke Punten Training gebruikt je resultaten uit deze sessie. Je hebt nu ${n} ${n === 1 ? 'vraag' : 'vragen'} gemaakt; er zijn er minstens 6 nodig.</p>
          <p>Doe eerst een korte nulmeting (10 gemengde vragen). Daarna weet de trainer waar je zwakke punten zitten.</p>
          <div class="row"><button class="btn" id="go-cal">Start nulmeting</button><button class="btn ghost" id="back">Terug naar menu</button></div>`,
          (e) => { if (e.key === 'Escape') renderMenu(); });
        $('#go-cal').onclick = () => startCalibration(() => chooseMode(5));
        $('#back').onclick = renderMenu;
        return;
      }
      const lv = Math.round(SESSION.history.slice(-20).reduce((a, r) => a + r.d, 0) / Math.min(20, n)) || 3;
      W.s.level = clamp(lv, 1, 5);
      W.weakCats = weakest(S);
    }
    renderStep();
  }
  function renderStep() {
    if (W.i >= W.steps.length) return renderSummary();
    const key = W.steps[W.i];
    const D = STEP_DEFS[key];
    let opts = D.opts;
    if (key === 'pressure' && MODES[W.mode].pressureOpts) opts = opts.filter((o) => MODES[W.mode].pressureOpts.includes(o.v));
    const cur = W.s[key];
    view(`<div class="eyebrow">${esc(W.label)} · stap ${W.i + 1} van ${W.steps.length}</div>
      <div class="steps-dots">${W.steps.map((_, i) => `<i class="${i <= W.i ? 'on' : ''}"></i>`).join('')}</div>
      <h2>${D.title}</h2><p class="muted">${D.q}</p>
      <div class="choices-list">${opts.map((o, i) => `<button class="pick" data-i="${i}" aria-pressed="${cur === o.v}"><span class="k">${o.k}</span><b>${o.label}${key === 'level' && o.v === 'calib' ? '' : ''}</b>${o.desc ? `<span class="d">${o.desc}</span>` : '<span></span>'}</button>`).join('')}</div>
      ${D.note ? `<p class="note">${D.note}</p>` : ''}
      <div class="row"><button class="btn ghost" id="back">Terug</button></div>`,
      (e) => {
        const o = opts.findIndex((x) => x.k.toLowerCase() === e.key.toLowerCase());
        if (o >= 0) choose(o);
        if (e.key === 'Escape' || e.key === 'Backspace') back();
      });
    const choose = (i) => {
      const o = opts[i];
      if (key === 'level' && o.v === 'calib') { startCalibration((lv) => { W.s.level = lv; W.i++; renderStep(); }); return; }
      W.s[key] = o.v;
      if (key === 'duration' && o.v === 40) W.s.category = 'mix';
      if (key === 'duration' && o.v === 40 && W.steps.includes('category') && W.steps.indexOf('category') > W.i) W.steps.splice(W.steps.indexOf('category'), 1);
      W.i++;
      renderStep();
    };
    const back = () => { if (W.i === 0) renderMenu(); else { W.i--; renderStep(); } };
    $$('.pick').forEach((b) => (b.onclick = () => choose(Number(b.dataset.i))));
    $('#back').onclick = back;
  }
  function renderSummary() {
    const s = W.s;
    const rows = [['Niveau', settingLabel('level', s.level)], ['Moeilijkheid', settingLabel('difficulty', s.difficulty)], ['Categorie', settingLabel('category', s.category)], ['Aantal vragen', settingLabel('duration', s.duration)], ['Tijdsdruk', settingLabel('pressure', s.pressure)], ['Feedback', settingLabel('feedback', s.feedback)], ['Hints', s.hints ? 'Aan' : 'Uit']];
    if (W.mode === 5 && W.weakCats && W.weakCats.length) rows.splice(2, 1, ['Focus op', W.weakCats.map((c) => CATS[c].name).join(' en ')]);
    view(`<div class="eyebrow">${esc(W.label)}</div><h2>Klaar om te starten</h2>
      ${W.mode === 3 ? '<p class="muted">Een zelfgemaakte, intensieve trainingsmodus ter voorbereiding. Geen officiële simulatie van het Korps Mariniers.</p>' : ''}
      <dl class="summary">${rows.map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join('')}</dl>
      <div class="row"><button class="btn" id="start">Start training</button>${W.mode === 3 ? '<button class="btn ghost" id="adjust">Instellingen aanpassen</button>' : ''}<button class="btn quiet" id="back">Terug</button></div>
      <p class="muted small" style="margin-top:14px">Tijdens de training: HINT, UITLEG, VOLGENDE, MOEILIJKER, MAKKELIJKER, SCORE, ZWAKKE PUNTEN, STOP en MENU staan als knoppen onder elke vraag. Antwoorden kan ook met de toetsen A–E.</p>`,
      (e) => { if (e.key === 'Enter') startRun(W.s, W.label, W.mode); if (e.key === 'Escape') renderMenu(); });
    $('#start').onclick = () => startRun(W.s, W.label, W.mode);
    $('#back').onclick = () => { if (W.steps.length) { W.i = W.steps.length - 1; renderStep(); } else renderMenu(); };
    if ($('#adjust')) $('#adjust').onclick = () => { const s0 = { ...W.s }; chooseMode(6, s0); W.label = '⚓ Mariniers Training (aangepast)'; W.s = { ...MODES[6].def, ...s0 }; W.steps = ['difficulty', 'category', 'duration', 'pressure', 'feedback', 'hints']; renderStep(); };
  }

  /* ================= Nulmeting ================= */
  function startCalibration(done) {
    const cats = shuffle([...CAT_IDS, ...shuffle(CAT_IDS).slice(0, 4)]);
    const diffs = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
    startRun({ level: 1, difficulty: 'fixed', category: 'calib', duration: 10, pressure: 'none', feedback: 'end', hints: false }, '📏 Nulmeting', 0, { plan: cats.map((c, i) => ({ cat: c, d: diffs[i] })), onDone: done });
  }

  /* ================= Training ================= */
  let RUN = null, TIMER = null;
  function stopTimer() { clearInterval(TIMER); TIMER = null; }

  function startRun(s, label, mode, extra = {}) {
    s = { ...s };
    const lvl = typeof s.level === 'number' ? s.level : 3;
    const startD = s.difficulty === 'auto' || s.difficulty === 'fixed' ? lvl : Number(s.difficulty);
    RUN = {
      s, label, mode, total: s.duration, i: 0, results: [], lv: {}, streak: {}, wstreak: {}, diag: null, retest: null,
      timeF: 1, bag: [], seen: new Set(), startLv: startD, plan: extra.plan || null, onDone: extra.onDone || null,
      weakCats: mode === 5 ? (W && W.weakCats) || weakest(catStats(SESSION.history)) : null,
    };
    CAT_IDS.forEach((c) => { RUN.lv[c] = startD; RUN.streak[c] = 0; RUN.wstreak[c] = 0; });
    nextQuestion();
  }
  const isAuto = () => RUN.s.difficulty === 'auto';
  const curLevel = () => {
    if (CATS[RUN.s.category]) return RUN.lv[RUN.s.category];
    const used = [...new Set(RUN.results.map((r) => r.q.cat))];
    const list = used.length ? used : CAT_IDS;
    return Math.round(list.reduce((a, c) => a + RUN.lv[c], 0) / list.length);
  };

  function chooseCat() {
    const c = RUN.s.category;
    if (CATS[c]) return c;
    if (c === 'mix') { if (!RUN.bag.length) RUN.bag = shuffle(CAT_IDS); return RUN.bag.pop(); }
    const S = catStats([...SESSION.history]);
    const err = (k) => (S[k].n - S[k].ok + 1) / (S[k].n + 2);
    let pool = CAT_IDS;
    if (c === 'weak') {
      const w = (RUN.weakCats && RUN.weakCats.length ? RUN.weakCats : CAT_IDS.slice().sort((a, b) => err(b) - err(a)).slice(0, 2));
      pool = w;
    }
    const weights = pool.map((k) => err(k) + (S[k].n < 2 ? 0.5 : 0) + 0.05);
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  function targetSecs(cat, d) {
    const P = PRESSURES.find((p) => p.v === RUN.s.pressure);
    if (!P || P.f == null) return null;
    const f = RUN.s.pressure === 'adaptive' ? RUN.timeF : P.f;
    return Math.max(10, Math.round((CATS[cat].base * f * (1 + 0.12 * (d - 3))) / 5) * 5);
  }

  function nextQuestion() {
    stopTimer();
    if (RUN.i >= RUN.total) return finishRun();
    let cat, d, kind = null, flag = null;
    if (RUN.plan) { ({ cat, d } = RUN.plan[RUN.i]); }
    else if (RUN.diag) { cat = RUN.diag.cat; kind = RUN.diag.kind; d = Math.max(1, RUN.diag.from - 1); flag = 'diag'; }
    else if (RUN.retest) { cat = RUN.retest.cat; kind = RUN.retest.kind; d = RUN.retest.at; flag = 'retest'; }
    else { cat = chooseCat(); d = RUN.lv[cat]; }
    let q;
    for (let k = 0; k < 8; k++) {
      q = MT.gens[cat].generate(d, kind ? { kind } : {});
      const sig = q.prompt + q.stem + q.opts.map((o) => o.key).join();
      if (!RUN.seen.has(sig)) { RUN.seen.add(sig); break; }
    }
    RUN.cur = { q, cat, d, flag, t0: now(), target: targetSecs(cat, d), hint: false, done: false };
    renderQuestion();
  }

  const cmdBtn = (id, label, dis, cls = '') => `<button class="cmd ${cls}" data-cmd="${id}" ${dis ? 'disabled' : ''}>${label}</button>`;
  function commandBar(phase) {
    const s = RUN.s, calib = !!RUN.plan;
    if (calib) return `<div class="cmds">${cmdBtn('stop', 'STOP', false, 'stop')}${cmdBtn('menu', 'MENU')}</div>`;
    return `<div class="cmds">
      ${phase === 'q' ? cmdBtn('hint', 'HINT', !s.hints || RUN.cur.hint) : cmdBtn('uitleg', 'UITLEG', false)}
      ${phase === 'fb' ? cmdBtn('next', 'VOLGENDE') : ''}
      ${cmdBtn('harder', 'MOEILIJKER', curLevel() >= 5 && !CATS[s.category] ? false : false)}
      ${cmdBtn('easier', 'MAKKELIJKER')}
      ${cmdBtn('score', 'SCORE')}
      ${cmdBtn('weak', 'ZWAKKE PUNTEN')}
      ${cmdBtn('stop', 'STOP', false, 'stop')}
      ${cmdBtn('menu', 'MENU')}
    </div>`;
  }
  function bindCommands() {
    $$('[data-cmd]').forEach((b) => (b.onclick = () => runCommand(b.dataset.cmd)));
  }
  function runCommand(c) {
    if (!RUN) return;
    switch (c) {
      case 'hint': return showHint();
      case 'uitleg': return toggleUitleg();
      case 'next': return nextQuestion();
      case 'harder': return shiftLevel(1);
      case 'easier': return shiftLevel(-1);
      case 'score': return showScore();
      case 'weak': return showWeak();
      case 'stop': return finishRun(true);
      case 'menu': {
        if (!RUN.results.length) return renderMenu();
        const o = openPanel('<h2>Terug naar het menu?</h2><p>Je resultaten tot nu toe blijven bewaard in deze sessie.</p><div class="row"><button class="btn" id="to-menu">Naar menu</button><button class="btn ghost" id="to-report">Eerst rapport tonen</button></div>');
        $('#to-menu', o).onclick = () => { closePanel(); renderMenu(); };
        $('#to-report', o).onclick = () => { closePanel(); finishRun(true); };
      }
    }
  }
  function shiftLevel(dir) {
    const s = RUN.s;
    if (s.difficulty !== 'auto') s.difficulty = String(clamp(Number(s.difficulty) + dir, 1, 5));
    CAT_IDS.forEach((c) => (RUN.lv[c] = clamp(RUN.lv[c] + dir, 1, 5)));
    toast(`Niveau ${dir > 0 ? 'omhoog' : 'omlaag'}: nu ${curLevel()}/5 (vanaf de volgende vraag)`);
    const chip = $('#lvl-chip'); if (chip) chip.textContent = `Niveau ${RUN.cur ? RUN.cur.d : curLevel()}/5 · volgende: ${curLevel()}/5`;
  }
  function showHint() {
    if (!RUN.s.hints || !RUN.cur || RUN.cur.done || RUN.cur.hint) return;
    RUN.cur.hint = true;
    $('#hintbox').innerHTML = `<div class="hintbox"><b>Hint:</b> ${esc(RUN.cur.q.hint)}</div>`;
    const b = $('[data-cmd="hint"]'); if (b) b.disabled = true;
  }

  function stemHTML(q, marks) {
    const L = q.layout === 'fig' ? 'figopts' : '';
    return `<div class="qtext">${esc(q.prompt)}</div>${q.stem}
      <div class="answers ${L}">${q.opts.map((o, i) => {
        let cls = '';
        if (marks) { if (i === q.ans) cls = 'ok'; else if (i === marks.chosen) cls = 'no'; }
        const val = q.layout === 'fig' ? o.html : q.layout === 'op' ? o.html : `<span class="v ${q.layout === 'mono' ? 'mono' : ''}">${o.html}</span>`;
        return `<button class="ans ${cls}" data-i="${i}" ${marks ? 'disabled' : ''} aria-label="Antwoord ${LETTERS[i]}"><span class="k">${LETTERS[i]}</span>${val}</button>`;
      }).join('')}</div>`;
  }

  function renderQuestion() {
    const C = RUN.cur, q = C.q, cat = CATS[C.cat];
    const count = RUN.total === Infinity ? `Vraag ${RUN.i + 1} · vrij trainen` : `Vraag ${RUN.i + 1}/${RUN.total}`;
    const flag = C.flag === 'diag' ? '<span class="chip warn">Diagnostische vraag</span>' : C.flag === 'retest' ? '<span class="chip olive">Hertest</span>' : '';
    view(`<div class="qbar"><div class="left"><span class="chip">${cat.icon} ${cat.name}</span><span class="chip olive" id="lvl-chip">Niveau ${C.d}/5</span>${flag}<span class="counter">${count}</span></div>
        ${C.target ? `<div class="timer" id="timer">${C.target}s</div>` : ''}</div>
      ${C.target ? '<div class="tbar"><i id="tbar" style="width:100%"></i></div>' : ''}
      <div class="card">${stemHTML(q)}<div id="hintbox"></div>${commandBar('q')}</div>
      <p class="muted small" style="margin-top:10px">${esc(RUN.label)} · ${RUN.plan ? 'geen feedback tijdens de nulmeting' : RUN.s.feedback === 'end' ? 'feedback volgt in het eindrapport' : 'antwoord met een klik of met A–E'}</p>`,
      (e) => {
        const k = e.key.toUpperCase();
        let idx = LETTERS.indexOf(k);
        if (idx < 0 && /^[1-5]$/.test(e.key)) idx = Number(e.key) - 1;
        if (idx >= 0 && idx < q.opts.length) return submit(idx);
        if (k === 'H') showHint();
      });
    $$('.ans').forEach((b) => (b.onclick = () => submit(Number(b.dataset.i))));
    bindCommands();
    if (C.target) {
      TIMER = setInterval(() => {
        if (panelOpenedAt != null) return;
        const left = C.target - (now() - C.t0) / 1000;
        const t = $('#timer'), bar = $('#tbar');
        if (t) { t.textContent = `${Math.max(0, Math.ceil(left))}s`; t.classList.toggle('low', left <= 5); }
        if (bar) { bar.style.width = `${clamp((left / C.target) * 100, 0, 100)}%`; bar.classList.toggle('low', left <= 5); }
        if (left <= 0) submit(null, true);
      }, 250);
    }
  }

  function submit(idx, timedOut = false) {
    const C = RUN.cur;
    if (!C || C.done) return;
    C.done = true;
    stopTimer();
    const q = C.q;
    const ms = Math.round(now() - C.t0);
    const ok = !timedOut && idx === q.ans;
    const chosen = idx == null ? null : q.opts[idx];
    const tag = ok ? null : timedOut ? 'Tijd op' : (chosen && chosen.tag) || 'Overig';
    const res = { q, chosen: idx, ok, ms, timedOut, hint: C.hint, flag: C.flag, d: C.d, target: C.target, tag };
    RUN.results.push(res);
    RUN.i++;
    SESSION.history.push({ c: q.cat, d: C.d, k: q.kindId, kn: q.kind, ok, t: ms, to: timedOut, tag, m: RUN.mode });
    saveSession();
    const notes = RUN.plan ? [] : adapt(res);
    if (RUN.plan || RUN.s.feedback === 'end') return nextQuestion();
    renderFeedback(res, notes);
  }

  function adapt(res) {
    const c = res.q.cat, notes = [], auto = isAuto(), s = RUN.s;
    if (s.pressure === 'adaptive' && res.target) {
      if (res.ok && res.ms < res.target * 600) RUN.timeF = clamp(RUN.timeF * 0.92, 0.5, 1.6);
      else if (!res.ok) RUN.timeF = clamp(RUN.timeF * 1.1, 0.5, 1.6);
    }
    const fb = s.feedback === 'each';
    if (res.ok) {
      RUN.streak[c]++; RUN.wstreak[c] = 0;
      if (res.flag === 'diag') {
        RUN.retest = { cat: c, kind: res.q.kindId, at: RUN.diag.from };
        RUN.diag = null;
        notes.push('Goed! De volgende vraag test hetzelfde principe weer op je eigen niveau.');
      } else if (res.flag === 'retest') {
        RUN.retest = null;
        notes.push('Hertest gehaald: dit principe beheers je weer.');
      }
      const fast = !res.target || res.ms <= res.target * 1000 * 0.85;
      if (auto && RUN.streak[c] >= 2 && fast && !res.hint && RUN.lv[c] < 5) {
        RUN.lv[c]++; RUN.streak[c] = 0;
        notes.push(`Twee keer overtuigend goed bij ${CATS[c].name}: niveau omhoog naar ${RUN.lv[c]}/5.`);
      }
    } else {
      RUN.wstreak[c]++; RUN.streak[c] = 0;
      if (res.flag === 'diag') {
        RUN.diag.count = (RUN.diag.count || 0) + 1;
        if (RUN.diag.count >= 2) {
          notes.push(`Dit principe (${res.q.kind}) is nog lastig. Probeer het ook eens in de modus 📚 Leren & Uitleggen.`);
          if (auto) RUN.lv[c] = Math.max(1, RUN.diag.from - 1);
          RUN.diag = null; RUN.wstreak[c] = 0;
        } else notes.push('Nog een oefenvraag over hetzelfde principe, weer iets eenvoudiger.');
      } else if (res.flag === 'retest') {
        RUN.retest = null;
        if (auto) { RUN.lv[c] = Math.max(1, RUN.lv[c] - 1); notes.push(`Hertest niet gehaald. Niveau voor ${CATS[c].name} gaat tijdelijk naar ${RUN.lv[c]}/5.`); }
      } else if (RUN.wstreak[c] >= 2 && fb) {
        RUN.diag = { cat: c, kind: res.q.kindId, from: RUN.lv[c], count: 0 };
        RUN.wstreak[c] = 0;
        notes.push(`Twee fouten achter elkaar bij ${CATS[c].name}. Lees eerst de uitleg; de volgende vraag is een iets eenvoudigere diagnostische vraag over hetzelfde principe.`);
      } else if (RUN.wstreak[c] >= 2 && auto) {
        RUN.lv[c] = Math.max(1, RUN.lv[c] - 1); RUN.wstreak[c] = 0;
      }
    }
    return notes;
  }

  function progressHTML() {
    const S = catStats(RUN.results.map((r) => ({ c: r.q.cat, ok: r.ok, t: r.ms, to: r.timedOut })));
    const n = RUN.results.length, ok = RUN.results.filter((r) => r.ok).length;
    const st = strongest(S), wk = weakest(S, 1)[0];
    return `<div class="progress">
      <div><small>Score</small><b>${ok}/${n}</b></div>
      <div><small>Nauwkeurigheid</small><b>${pct(ok, n)}%</b></div>
      <div><small>Huidig niveau</small><b>${curLevel()}/5</b></div>
      <div><small>Sterkste categorie</small><b class="txt">${st ? CATS[st].name : '—'}</b></div>
      <div><small>Extra aandacht</small><b class="txt">${wk ? CATS[wk].name : '—'}</b></div>
    </div>`;
  }

  function othersHTML(q) {
    return `<ul class="others">${q.opts.map((o, i) => (i === q.ans ? `<li><span class="k">${LETTERS[i]}</span><span><b>Juist.</b></span></li>` : `<li><span class="k">${LETTERS[i]}</span><span>${esc(o.why || '')}</span></li>`)).join('')}</ul>`;
  }

  function renderFeedback(res, notes) {
    const q = res.q;
    const secs = (res.ms / 1000).toFixed(1).replace('.', ',');
    const verdict = res.ok ? '<b class="good">✅ Goed</b>' : res.timedOut ? '<b class="bad">⏱️ Tijd op</b>' : '<b class="bad">❌ Fout</b>';
    const count = RUN.total === Infinity ? `${RUN.i}` : `${RUN.i}/${RUN.total}`;
    let miss = '';
    if (!res.ok) {
      miss = res.timedOut
        ? `<h3>Waar ging het mis?</h3><p class="miss">De tijd was op voordat je een antwoord koos. Kom je er niet uit, gok dan en ga door: een lege vraag levert nooit punten op.</p>`
        : `<h3>Waar ging het mis?</h3><p class="miss">Je koos ${LETTERS[res.chosen]}. ${esc(q.opts[res.chosen].why || '')}</p><p class="muted small">Dit is waarom het antwoord niet klopt. Hoe je tot ${LETTERS[res.chosen]} kwam, weet de trainer niet; herken je de fout niet, lees dan de stappen hierboven nog eens.</p>`;
    }
    const timeNote = res.target ? ` <span class="muted">(limiet ${res.target} s)</span>` : '';
    view(`<div class="qbar"><div class="left"><span class="chip">${CATS[q.cat].icon} ${CATS[q.cat].name}</span><span class="chip olive">Niveau ${res.d}/5</span><span class="counter">${esc(q.kind)}</span></div></div>
      <div class="verdict">
        <div><small>Vraag</small><b class="num">${count}</b></div>
        <div><small>Resultaat</small>${verdict}</div>
        <div><small>Juiste antwoord</small><b>${LETTERS[q.ans]}</b></div>
        <div><small>Jouw antwoord</small><b>${res.chosen == null ? '—' : LETTERS[res.chosen]}</b></div>
        <div><small>Tijd</small><b class="num">${secs} s</b>${timeNote}</div>
      </div>
      <div class="card">${stemHTML(q, { chosen: res.chosen })}
        <div class="fb">
          <h3>Uitleg</h3><ol>${q.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
          ${miss}
          <div id="uitleg" hidden><h3>Waarom de andere opties niet kloppen</h3>${othersHTML(q)}</div>
          <h3>Snellere methode</h3><p>${esc(q.quick)}</p>
          <h3>Leerpunt</h3><p class="lesson">${esc(q.lesson)}</p>
        </div>
        ${notes.length ? `<div class="notes">${notes.map((n) => `<div>${esc(n)}</div>`).join('')}</div>` : ''}
        <h3 style="margin:18px 0 0;font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:var(--olive)">Voortgang</h3>
        ${progressHTML()}
        <div class="row" style="margin-top:18px"><button class="btn" id="next">${RUN.i >= RUN.total ? 'Naar het rapport' : 'Volgende vraag'}</button></div>
        ${commandBar('fb')}
      </div>`,
      (e) => { if (e.key === 'Enter' || e.key.toUpperCase() === 'N') nextQuestion(); if (e.key.toUpperCase() === 'U') toggleUitleg(); });
    $('#next').onclick = nextQuestion;
    $('#next').focus({ preventScroll: true });
    bindCommands();
  }
  function toggleUitleg() {
    const u = $('#uitleg');
    if (u) { u.hidden = !u.hidden; if (!u.hidden) u.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }

  function showScore() {
    const n = RUN.results.length, ok = RUN.results.filter((r) => r.ok).length;
    const S = catStats(RUN.results.map((r) => ({ c: r.q.cat, ok: r.ok, t: r.ms, to: r.timedOut })));
    openPanel(`<h2>Score</h2><p><b class="num">${ok}/${n}</b> goed · <b class="num">${pct(ok, n)}%</b> nauwkeurig · niveau <b class="num">${curLevel()}/5</b></p>
      ${catTable(S)}`);
  }
  function showWeak() {
    const H = SESSION.history;
    const S = catStats(H);
    const wk = weakest(S, 3);
    const kinds = {};
    H.filter((r) => !r.ok).forEach((r) => { const k = `${CATS[r.c].name} – ${r.kn}`; kinds[k] = (kinds[k] || 0) + 1; });
    const topK = Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const tags = {};
    H.filter((r) => !r.ok && r.tag).forEach((r) => (tags[r.tag] = (tags[r.tag] || 0) + 1));
    const topT = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const o = openPanel(`<h2>Zwakke punten</h2>
      ${H.length ? '' : '<p>Nog geen resultaten in deze sessie.</p>'}
      ${wk.length ? `<h3>Onderdelen</h3>${catTable(S, wk)}` : H.length ? '<p>Nog geen zwakke onderdelen: alles tot nu toe goed.</p>' : ''}
      ${topK.length ? `<h3 style="margin-top:14px">Soorten patronen die fout gingen</h3><ul class="list">${topK.map(([k, v]) => `<li>${esc(k)} <span class="muted">(${v}×)</span></li>`).join('')}</ul>` : ''}
      ${topT.length ? `<h3 style="margin-top:14px">Meest voorkomende fouten</h3><ul class="list">${topT.map(([k, v]) => `<li><b>${esc(k)}</b> (${v}×): ${esc(TAG_ADVICE[k] || '')}</li>`).join('')}</ul>` : ''}
      ${H.length >= 6 ? '<div class="row" style="margin-top:16px"><button class="btn" id="tw">TRAIN ZWAKKE PUNTEN</button></div>' : ''}`);
    const tw = $('#tw', o);
    if (tw) tw.onclick = () => { closePanel(); stopTimer(); RUN = null; chooseMode(5); };
  }
  function catTable(S, only) {
    const ids = (only || CAT_IDS).filter((c) => S[c].n);
    if (!ids.length) return '<p class="muted">Nog geen vragen beantwoord.</p>';
    return `<div class="tbl"><table><thead><tr><th>Onderdeel</th><th>Score</th><th></th><th>Gem. tijd</th></tr></thead><tbody>${ids.map((c) => {
      const r = S[c].ok / S[c].n;
      return `<tr><td>${CATS[c].icon} ${CATS[c].name}</td><td class="n">${S[c].ok}/${S[c].n}</td><td><div class="meter"><i class="${r >= 0.75 ? '' : r >= 0.5 ? 'mid' : 'low'}" style="width:${Math.max(4, r * 100)}%"></i></div></td><td class="n">${S[c].tn ? (S[c].t / S[c].tn / 1000).toFixed(0) + ' s' : '—'}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  /* ================= Einde: rapport ================= */
  function finishRun(stopped) {
    stopTimer();
    closePanel();
    if (!RUN) return renderMenu();
    if (RUN.plan) return calibrationResult();
    if (!RUN.results.length) return renderMenu();
    renderReport(stopped);
  }

  function calibrationResult() {
    const res = RUN.results;
    const ok = res.filter((r) => r.ok).length;
    const byD = [1, 2, 3, 4, 5].map((d) => res.filter((r) => r.d === d));
    let lv = 1;
    for (let d = 1; d <= 5; d++) { const g = byD[d - 1]; if (g.length && g.filter((r) => r.ok).length >= Math.ceil(g.length / 2)) lv = d; else break; }
    lv = clamp(Math.max(lv, Math.round(ok / 2)), 1, 5);
    const done = RUN.onDone;
    view(`<div class="eyebrow">📏 Nulmeting klaar</div><h2>Startniveau: ${lv}/5 – ${levelName(lv)}</h2>
      <p>Je had <b>${ok} van de ${res.length}</b> vragen goed. De vragen liepen op van niveau 1 naar 5.</p>
      <div class="tbl"><table><thead><tr><th>Vraag</th><th>Onderdeel</th><th>Niveau</th><th>Resultaat</th></tr></thead><tbody>
      ${res.map((r, i) => `<tr><td class="n">${i + 1}</td><td>${CATS[r.q.cat].name}</td><td class="n">${r.d}</td><td>${r.ok ? '✅' : '❌'}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted small" style="margin-top:10px">Dit startniveau is alleen een vertrekpunt voor de training. Tijdens het oefenen past de trainer het verder aan.</p>
      <div class="row" style="margin-top:14px"><button class="btn" id="cont">Verder</button></div>`,
      (e) => { if (e.key === 'Enter') go(); });
    const go = () => { RUN = null; if (done) done(lv); else renderMenu(); };
    $('#cont').onclick = go;
  }

  function renderReport(stopped) {
    const R = RUN.results;
    const n = R.length, ok = R.filter((r) => r.ok).length;
    const S = catStats(R.map((r) => ({ c: r.q.cat, ok: r.ok, t: r.ms, to: r.timedOut })));
    const used = CAT_IDS.filter((c) => S[c].n);
    const strong = used.filter((c) => S[c].n >= 2 && S[c].ok / S[c].n >= 0.75);
    const weak = used.filter((c) => S[c].ok / S[c].n < 0.6);
    const tags = {};
    R.filter((r) => !r.ok).forEach((r) => (tags[r.tag] = (tags[r.tag] || 0) + 1));
    const topTag = Object.entries(tags).sort((a, b) => b[1] - a[1])[0];
    const kindStats = {};
    R.forEach((r) => { const k = `${CATS[r.q.cat].name} – ${r.q.kind}`; kindStats[k] = kindStats[k] || { n: 0, ok: 0 }; kindStats[k].n++; if (r.ok) kindStats[k].ok++; });
    const goodKinds = Object.entries(kindStats).filter(([, v]) => v.n >= 2 && v.ok === v.n).map(([k]) => k);
    const badKinds = Object.entries(kindStats).filter(([, v]) => v.ok < v.n).sort((a, b) => (a[1].ok - a[1].n) - (b[1].ok - b[1].n)).slice(0, 4).map(([k, v]) => `${k} (${v.n - v.ok} fout)`);
    const timed = R.filter((r) => r.target);
    const inTime = timed.filter((r) => !r.timedOut).length;
    const avg = (R.reduce((a, r) => a + r.ms, 0) / n / 1000).toFixed(0);
    let maxStreak = 0, cur = 0;
    R.forEach((r) => { cur = r.ok ? cur + 1 : 0; maxStreak = Math.max(maxStreak, cur); });
    const hints = R.filter((r) => r.hint).length, tos = R.filter((r) => r.timedOut).length;

    const goodList = [];
    if (strong.length) goodList.push(`Sterk in ${strong.map((c) => CATS[c].name).join(', ')}.`);
    if (goodKinds.length) goodList.push(`Foutloos: ${goodKinds.slice(0, 4).join('; ')}.`);
    if (maxStreak >= 3) goodList.push(`Langste reeks goede antwoorden: ${maxStreak}.`);
    if (timed.length && inTime === timed.length) goodList.push('Alle vragen binnen de tijd beantwoord.');
    if (!goodList.length) goodList.push(ok ? `${ok} ${ok === 1 ? 'vraag' : 'vragen'} goed; bouw daarop voort.` : 'Je hebt de eerste stap gezet. Met de uitleg per vraag kom je verder.');
    const betterList = [];
    if (weak.length) betterList.push(`Onderdelen onder de 60%: ${weak.map((c) => CATS[c].name).join(', ')}.`);
    if (badKinds.length) betterList.push(`Patronen die fout gingen: ${badKinds.join('; ')}.`);
    if (topTag) betterList.push(`${topTag[0]}: ${TAG_ADVICE[topTag[0]] || ''}`);
    if (tos) betterList.push(`${tos}× was de tijd op. Oefen eerst zonder of met lichte tijdsdruk en voer die daarna op.`);
    if (hints > n / 3) betterList.push(`Je gebruikte ${hints} hints. Probeer de volgende keer eerst zelf een regel te testen.`);
    if (!betterList.length) betterList.push('Weinig fouten. Verhoog de moeilijkheid of de tijdsdruk om verder te groeien.');

    let rec, recStart;
    const endLv = curLevel();
    if (weak.length) {
      rec = `🎯 Zwakke Punten Training, 10 vragen, met focus op ${weak.slice(0, 2).map((c) => CATS[c].name).join(' en ')}.`;
      recStart = () => { W = { mode: 5, label: '🎯 Zwakke Punten Training', s: { ...MODES[5].fixed, duration: 10, level: endLv }, steps: [], i: 0, weakCats: weak.slice(0, 2) }; renderSummary(); };
    } else if (pct(ok, n) >= 85 && endLv >= 4) {
      rec = '⚓ Mariniers Training Mode (30 gemengde vragen, adaptief) of een ⏱️ Assessment Simulatie met hoge tijdsdruk.';
      recStart = () => { W = { mode: 3, label: '⚓ Mariniers Training Mode', s: { ...MODES[3].fixed, level: endLv }, steps: [], i: 0 }; renderSummary(); };
    } else {
      rec = `🧠 Adaptieve Training, 20 vragen, startniveau ${endLv}.`;
      recStart = () => { W = { mode: 2, label: '🧠 Adaptieve Training', s: { ...MODES[2].def, ...MODES[2].fixed, level: endLv }, steps: [], i: 0 }; renderSummary(); };
    }
    const tagTxt = topTag ? `${topTag[0]} (${topTag[1]}×)` : 'Geen fouten';

    view(`<div class="report">
      <div class="eyebrow">${esc(RUN.label)}${stopped && RUN.total !== Infinity && R.length < RUN.total ? ' · voortijdig gestopt' : ''}</div>
      <h2>📊 Trainingsrapport</h2>
      <div class="kpis">
        <div><small>Totaalscore</small><b>${ok}/${n}</b></div>
        <div><small>Nauwkeurigheid</small><b>${pct(ok, n)}%</b></div>
        <div><small>Niveau aan het begin</small><b>${RUN.startLv}</b></div>
        <div><small>Niveau aan het einde</small><b>${endLv}</b></div>
        <div><small>Gem. tijd per vraag</small><b>${avg} s</b></div>
      </div>
      <h3>Per onderdeel</h3>${catTable(S)}
      <h3>Sterke onderdelen</h3><p>${strong.length ? strong.map((c) => CATS[c].name).join(', ') : 'Nog geen onderdeel met 75% of meer (bij minstens 2 vragen).'}</p>
      <h3>Zwakke onderdelen</h3><p>${weak.length ? weak.map((c) => CATS[c].name).join(', ') : 'Geen onderdelen onder de 60%.'}</p>
      <h3>Meest voorkomende fouttype</h3><p>${esc(tagTxt)}</p>
      <h3>Wat gaat al goed?</h3><ul class="list">${goodList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>Wat moet beter?</h3><ul class="list">${betterList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>Aanbevolen volgende training</h3><p>${esc(rec)}</p>
      <div class="row"><button class="btn" id="rec">Start aanbevolen training</button><button class="btn ghost" id="menu">Terug naar menu</button></div>
      <p class="muted small" style="margin-top:12px">Dit rapport gaat alleen over deze oefentraining. Het voorspelt niet of je het echte assessment haalt.</p>
      <h3>Alle vragen nakijken</h3>
      ${R.map((r, i) => `<details class="rev"><summary><span class="mark ${r.ok ? 'ok' : 'no'}">${r.ok ? '✓' : '✗'}</span><span>${i + 1}. ${CATS[r.q.cat].name} · ${esc(r.q.kind)}</span><span class="muted small" style="margin-left:auto">niveau ${r.d} · ${(r.ms / 1000).toFixed(0)} s${r.timedOut ? ' · tijd op' : ''}</span></summary>
        <div class="body">${stemHTML(r.q, { chosen: r.chosen })}<div class="fb"><h3>Uitleg</h3><ol>${r.q.steps.map((s) => `<li>${s}</li>`).join('')}</ol>${!r.ok && r.chosen != null ? `<p class="miss" style="margin-top:10px">Jouw antwoord ${LETTERS[r.chosen]}: ${esc(r.q.opts[r.chosen].why || '')}</p>` : ''}<p class="lesson" style="margin-top:10px">${esc(r.q.lesson)}</p></div></div></details>`).join('')}
    </div>`, (e) => { if (e.key === 'Escape') renderMenu(); });
    $('#rec').onclick = () => { RUN = null; recStart(); };
    $('#menu').onclick = renderMenu;
  }

  /* ================= Tabs ================= */
  function showTab(t) {
    $$('nav.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    $('#app').hidden = t !== 'train';
    $('#info').hidden = t !== 'info';
  }
  $$('nav.tabs button').forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
  if (location.hash === '#selectie') showTab('info');
  renderMenu();
})();
