/* Marinier Selectietrainer — trainer-app
 * Zelfgemaakte oefenvragen. Geen officiële vragen of simulatie van Defensie of het Korps Mariniers. */
(function () {
  'use strict';
  const MT = window.MT;
  const { esc, shuffle, pick, clamp, LETTERS } = MT.util;
  const CATS = MT.CATS, CAT_IDS = MT.CAT_IDS;
  const RS = MT.reason, PF = MT.profile;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const APP = $('#app');
  const now = () => performance.now();

  /* ================= Opslag ================= */
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* geen opslag beschikbaar */ } },
  };
  let SESSION = { history: [], pending: [], created: Date.now() };
  { const s = store.get('mst-session-v3'); if (s && Array.isArray(s.history)) SESSION = { pending: [], ...s }; }
  const saveSession = () => { SESSION.history = SESSION.history.slice(-600); SESSION.pending = SESSION.pending.slice(-400); store.set('mst-session-v3', SESSION); };
  let PROFILE = store.get('mst-profile-v2');
  const saveProfile = (P) => { if (PROFILE) store.set('mst-profile-prev', PROFILE); PROFILE = P; store.set('mst-profile-v2', P); SESSION.pending = []; saveSession(); };

  /* ================= Instellingen ================= */
  const LEVELS = [
    { v: 1, k: '1', label: 'Beginner', desc: 'Ik heb weinig ervaring met cognitieve assessments.' },
    { v: 2, k: '2', label: 'Basis', desc: 'Ik begrijp de belangrijkste soorten vragen.' },
    { v: 3, k: '3', label: 'Gemiddeld', desc: 'Ik heb al geoefend en herken veel basispatronen.' },
    { v: 4, k: '4', label: 'Gevorderd', desc: 'Ik los standaardvragen meestal goed op en wil moeilijkere patronen.' },
    { v: 5, k: '5', label: 'Expert', desc: 'Ik wil complexe vragen, hoge snelheid en minimale foutmarge.' },
    { v: 'profile', k: '6', label: 'Gebruik mijn Assessmentprofiel', desc: 'Elke categorie start op het niveau uit je profiel.' },
  ];
  const DIFFS = [
    { v: '1', k: '1', label: '1/5 – Makkelijk', desc: 'Eenvoudige patronen en veel tijd.' },
    { v: '2', k: '2', label: '2/5 – Normaal', desc: 'Basisniveau.' },
    { v: '3', k: '3', label: '3/5 – Uitdagend', desc: 'Meer denkstappen en minder voor de hand liggende patronen.' },
    { v: '4', k: '4', label: '4/5 – Moeilijk', desc: 'Complexe patronen, afleiders en hogere tijdsdruk.' },
    { v: '5', k: '5', label: '5/5 – Extreem', desc: 'Complexe combinaties, weinig tijd en hoge nauwkeurigheid vereist.' },
    { v: 'auto', k: 'A', label: 'AUTO – Adaptief', desc: 'Begint passend bij je niveau en past de moeilijkheid automatisch aan.' },
  ];
  const CAT_DESC = { num: 'Welk getal komt hierna?', ana: 'Woord-, getal- en letterverbanden.', dia: 'Bewerkingen op een rij letters.', fig: 'Welke figuur komt hierna?', log: 'Volgordes, conclusies, codes en redeneersommen.', abs: 'Afwijkers, figuuranalogieën en matrices.' };
  const CATEGORY_OPTS = [
    ...CAT_IDS.map((id) => ({ v: id, k: CATS[id].letter, label: `${CATS[id].icon} ${CATS[id].name}`, desc: CAT_DESC[id] })),
    { v: 'mix', k: 'G', label: '🔀 Gemengd', desc: 'Alle onderdelen door elkaar.' },
    { v: 'weak', k: 'H', label: '🎯 Mijn zwakke punten', desc: 'Onderdelen waar je profiel en deze sessie de meeste fouten laten zien.' },
  ];
  const DURATIONS = [
    { v: 5, k: '1', label: '5 vragen', desc: 'Kort' }, { v: 10, k: '2', label: '10 vragen', desc: 'Normaal' }, { v: 20, k: '3', label: '20 vragen', desc: 'Lang' },
    { v: 30, k: '4', label: '30 vragen', desc: 'Intensief' }, { v: 40, k: '5', label: '40 vragen', desc: 'Mariniers Training: gemengd' },
    { v: Infinity, k: '6', label: 'Vrij trainen', desc: 'Doorgaan tot je op STOP drukt.' },
  ];
  const PRESSURES = [
    { v: 'none', k: '1', label: 'Geen', desc: 'Focus volledig op begrijpen.', f: null },
    { v: 'light', k: '2', label: 'Licht', desc: 'Ruime tijd per vraag.', f: 1.6 },
    { v: 'normal', k: '3', label: 'Normaal', desc: 'Gemiddelde tijdsdruk.', f: 1.0 },
    { v: 'high', k: '4', label: 'Hoog', desc: 'Weinig tijd per vraag.', f: 0.7 },
    { v: 'extreme', k: '5', label: 'Extreem', desc: 'Zeer weinig tijd; snelheid en nauwkeurigheid tellen allebei.', f: 0.5 },
    { v: 'adaptive', k: '6', label: 'Adaptief', desc: 'De tijd per vraag past zich aan je prestaties aan.', f: 1.0 },
  ];
  const FEEDBACKS = [{ v: 'each', k: '1', label: 'Na iedere vraag', desc: 'Direct beoordeling en uitleg.' }, { v: 'end', k: '2', label: 'Alleen aan het eind', desc: 'Zoals bij een assessment.' }];
  const HINTS = [{ v: true, k: '1', label: 'Hints aan', desc: 'Per vraag één kleine hint.' }, { v: false, k: '2', label: 'Hints uit', desc: '' }];
  const REASONS = [{ v: true, k: '1', label: 'Redenering vragen', desc: 'Na elk antwoord geef je aan hoe je het aanpakte. Antwoord en denkwijze worden apart beoordeeld.' }, { v: false, k: '2', label: 'Alleen antwoord', desc: 'Sneller, maar minder inzicht in je denkwijze.' }];
  const STEP_DEFS = {
    level: { title: 'Niveau', q: 'Wat is je huidige niveau?', opts: LEVELS },
    difficulty: { title: 'Moeilijkheid', q: 'Hoe moeilijk wil je beginnen?', opts: DIFFS, note: 'Deze niveaus zijn trainingsniveaus van deze oefenomgeving. Ze zeggen niets over het officiële niveau van Defensie.' },
    category: { title: 'Categorie', q: 'Wat wil je oefenen?', opts: CATEGORY_OPTS },
    duration: { title: 'Trainingsduur', q: 'Hoeveel vragen?', opts: DURATIONS },
    pressure: { title: 'Tijdsdruk', q: 'Hoeveel tijdsdruk wil je?', opts: PRESSURES, note: 'Tijdslimieten zijn trainingsinstellingen, geen officiële tijdslimieten.' },
    feedback: { title: 'Feedback', q: 'Wanneer wil je feedback?', opts: FEEDBACKS },
    hints: { title: 'Hints', q: 'Wil je hints kunnen gebruiken?', opts: HINTS },
    reasoning: { title: 'Redenering', q: 'Wil je na elk antwoord je redenering geven?', opts: REASONS },
  };
  const MODES = {
    1: { icon: '📚', name: 'Leren & Uitleggen', bullets: ['Antwoord + redenering', 'Uitgebreide uitleg', 'Geen tijdsdruk', 'Focus op begrijpen'],
      steps: ['level', 'difficulty', 'category', 'duration'], fixed: { pressure: 'none', feedback: 'each', hints: true, reasoning: true }, def: { difficulty: 'auto', category: 'mix', duration: 10 } },
    2: { icon: '🧠', name: 'Adaptieve Training', bullets: ['Moeilijkheid past zich aan je prestaties en profiel aan', 'Herhaalt zwakke onderwerpen met nieuwe vragen'],
      steps: ['level', 'category', 'duration', 'pressure'], fixed: { difficulty: 'auto', feedback: 'each', hints: true, reasoning: false }, def: { category: 'weak', duration: 20, pressure: 'adaptive' } },
    3: { icon: '⚓', name: 'Mariniers Training Mode', bullets: ['Intensief en gemengd', 'Nadruk op snelheid, nauwkeurigheid en logisch denken', 'Geen hints tenzij ingesteld', 'Zelfgemaakt; geen officiële Defensiesimulatie'],
      steps: ['level'], fixed: { category: 'mix', difficulty: 'auto', duration: 30, feedback: 'each', hints: false, pressure: 'adaptive', reasoning: false }, def: {} },
    4: { icon: '⏱️', name: 'Assessment Simulatie', bullets: ['Geen feedback tussendoor', 'Geen hints', 'Assessmentachtige tijdsdruk', 'Analyse na afloop'],
      steps: ['level', 'category', 'duration', 'pressure'], fixed: { difficulty: 'auto', feedback: 'end', hints: false, reasoning: false }, def: { category: 'mix', duration: 20, pressure: 'normal' }, pressureOpts: ['normal', 'high', 'extreme'] },
    5: { icon: '🎯', name: 'Zwakke Punten Training', bullets: ['Gebruikt je Assessmentprofiel en deze sessie', 'Traint gericht je zwakke onderdelen', 'Antwoord + redenering'],
      steps: ['duration'], fixed: { category: 'weak', difficulty: 'auto', feedback: 'each', hints: true, pressure: 'light', reasoning: true }, def: { duration: 10 } },
    6: { icon: '🛠️', name: 'Zelf Instellen', bullets: ['Jij bepaalt alle instellingen'],
      steps: ['level', 'difficulty', 'category', 'duration', 'pressure', 'feedback', 'hints', 'reasoning'], fixed: {}, def: { difficulty: 'auto', category: 'mix', duration: 10, pressure: 'normal', feedback: 'each', hints: true, reasoning: true } },
  };
  const TAG_ADVICE = {
    [RS.ERR.pattern]: 'Controleer een gevonden patroon op álle getallen of figuren, niet alleen op de eerste twee.',
    [RS.ERR.calc]: 'Schrijf tussenstappen op en reken de laatste stap altijd even na.',
    [RS.ERR.read]: 'Lees de vraag en de legenda twee keer; onderstreep wat er gevraagd wordt.',
    [RS.ERR.logic]: 'Zoek bij elke conclusie een tegenvoorbeeld. “Kan waar zijn” is niet genoeg.',
    [RS.ERR.assume]: 'Gebruik alleen de gegeven informatie, niet wat logisch klinkt.',
    [RS.ERR.exec]: 'Je aanpak is goed. Schrijf tussenstappen op om uitvoeringsfouten te voorkomen.',
    [RS.ERR.early]: 'Trek niet na één overgang of één voorbeeld al een conclusie.',
    [RS.ERR.complex]: 'Probeer eerst de eenvoudigste regel en stop zodra die alles verklaart.',
    [RS.ERR.time]: 'Blijf niet hangen: gok na je tijdslimiet en ga door. Bouw tempo op via Licht → Normaal.',
    'Overig': 'Lees de uitleg bij de vragen die fout gingen goed door.',
  };

  /* ================= UI-hulp ================= */
  let keyHandler = null;
  document.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if ($('.overlay')) { if (e.key === 'Escape') closePanel(); return; }
    if (keyHandler) keyHandler(e);
  });
  function view(html, keys) { APP.innerHTML = html; keyHandler = keys || null; window.scrollTo({ top: 0 }); }
  let toastT;
  function toast(msg) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2800);
  }
  let panelOpenedAt = null;
  function openPanel(html, wide) {
    closePanel();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = `<div class="panel ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}<div class="row" style="margin-top:16px"><button class="btn quiet" data-close>Sluiten</button></div></div>`;
    o.addEventListener('click', (e) => { if (e.target === o || e.target.hasAttribute('data-close')) closePanel(); });
    document.body.appendChild(o);
    if (RUN && RUN.cur && !RUN.cur.done) panelOpenedAt = now();
    return o;
  }
  function closePanel() {
    const o = $('.overlay'); if (o) o.remove();
    if (panelOpenedAt != null && RUN && RUN.cur) RUN.cur.t0 += now() - panelOpenedAt;
    panelOpenedAt = null;
  }
  function copyText(text, btn) {
    const done = () => { if (btn) { const t = btn.textContent; btn.textContent = 'Gekopieerd'; setTimeout(() => (btn.textContent = t), 1600); } };
    const fallback = () => { const ta = btn && btn.closest('.profilebox') ? $('textarea', btn.closest('.profilebox')) : null; if (ta) { ta.focus(); ta.select(); } toast('Selecteer de tekst en kopieer met Ctrl+C / Cmd+C'); };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
  }
  const levelName = (v) => PF.LEVEL_NAMES[v] || '';
  const settingLabel = (key, v) => {
    if (key === 'level') return v === 'profile' ? 'Uit mijn Assessmentprofiel' : `${v} – ${levelName(v)}`;
    const list = { difficulty: DIFFS, category: CATEGORY_OPTS, duration: DURATIONS, pressure: PRESSURES, feedback: FEEDBACKS, hints: HINTS, reasoning: REASONS }[key];
    const o = list && list.find((x) => x.v === v);
    return o ? o.label : String(v);
  };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  function catStats(list) {
    const S = {};
    CAT_IDS.forEach((c) => (S[c] = { n: 0, ok: 0, t: 0, tn: 0 }));
    for (const r of list) { const s = S[r.c]; if (!s) continue; s.n++; if (r.ok) s.ok++; if (r.t != null && !r.to) { s.t += r.t; s.tn++; } }
    return S;
  }
  function strongest(S) {
    const c = CAT_IDS.filter((k) => S[k].n >= 2).sort((a, b) => S[b].ok / S[b].n - S[a].ok / S[a].n || S[b].n - S[a].n);
    return c[0] && S[c[0]].ok / S[c[0]].n >= 0.5 ? c[0] : null;
  }
  function weakest(S, n = 2) { return CAT_IDS.filter((k) => S[k].n >= 1 && S[k].ok < S[k].n).sort((a, b) => S[a].ok / S[a].n - S[b].ok / S[b].n || S[b].n - S[a].n).slice(0, n); }
  function weakPoints(n = 2) {
    const fromProfile = PROFILE ? PF.weakCats(PROFILE, 3) : [];
    const fromSession = weakest(catStats(SESSION.history.slice(-60)), 3);
    const all = [...new Set([...fromSession, ...fromProfile])];
    return all.slice(0, n);
  }

  /* ================= 16. Startscherm: profielkeuze ================= */
  function renderStart() {
    stopTimer(); RUN = null;
    const saved = PROFILE ? `<p class="note">In deze browser staat al een profiel: <b>v${PROFILE.version}</b> van ${esc(PROFILE.date)} (niveau ${PF.overall(PROFILE) || '?'}/5). Kies optie 2 of 3 om het te gebruiken.</p>` : '';
    view(`<h2>⚓ Assessmenttrainer</h2>
      <p>Welkom. Voordat we beginnen wil ik weten of je al eerder met deze trainer hebt geoefend.</p>
      <h3 style="margin-top:14px">👤 Kies je profieloptie</h3>
      <div class="choices-list">
        <button class="pick" data-o="1"><span class="k">1</span><b>🆕 Nieuwe gebruiker</b><span class="d">Start intake + volledige nulmeting.</span></button>
        <button class="pick" data-o="2"><span class="k">2</span><b>📂 Bestaand Assessmentprofiel</b><span class="d">Plak je vorige profiel en ga direct verder.</span></button>
        <button class="pick" data-o="3"><span class="k">3</span><b>🔄 Bestaand profiel herkalibreren</b><span class="d">Plak je profiel en controleer met een paar korte vragen of je niveau veranderd is.</span></button>
      </div>
      ${saved}
      <p><b>Welke optie kies je: 1, 2 of 3?</b></p>
      <p class="muted small">Je kunt ook <button class="linkbtn" id="skip">zonder profiel direct naar het trainingsmenu</button>.</p>`,
      (e) => { if (['1', '2', '3'].includes(e.key)) go(e.key); });
    const go = (o) => (o === '1' ? startIntake() : renderPaste(o === '3' ? 'recal' : 'load'));
    $$('[data-o]').forEach((b) => (b.onclick = () => go(b.dataset.o)));
    $('#skip').onclick = renderMenu;
  }

  /* ================= Optie 2 en 3: profiel plakken ================= */
  function renderPaste(mode) {
    const title = mode === 'recal' ? '🔄 Profiel herkalibreren' : '📂 Bestaand profiel laden';
    view(`<div class="eyebrow">${title}</div><h2>Plak hieronder je volledige Assessmentprofiel uit je vorige sessie.</h2>
      ${PROFILE ? `<div class="note" style="margin-bottom:12px">Opgeslagen in deze browser: profiel v${PROFILE.version} van ${esc(PROFILE.date)}. <button class="btn small" id="use-saved" style="margin-left:6px">Gebruik dit profiel</button></div>` : ''}
      <textarea id="paste" class="paste" rows="12" placeholder="================================&#10;ASSESSMENTPROFIEL&#10;================================&#10;…"></textarea>
      <p id="perr" class="miss" hidden></p>
      <div class="row" style="margin-top:12px"><button class="btn" id="load">Profiel laden</button><button class="btn quiet" id="back">Terug</button></div>
      <p class="muted small" style="margin-top:10px">Profielen uit deze trainer bevatten een profielcode en worden volledig ingelezen. Een profiel uit een andere chat (bijv. ChatGPT) lees ik zo goed mogelijk uit de tekst.</p>`,
      (e) => { if (e.key === 'Escape') renderStart(); });
    $('#back').onclick = renderStart;
    const proceed = (P, missing) => afterLoad(P, missing || [], mode);
    if ($('#use-saved')) $('#use-saved').onclick = () => proceed(JSON.parse(JSON.stringify(PROFILE)), []);
    $('#load').onclick = () => {
      const r = PF.parse($('#paste').value);
      const err = $('#perr');
      if (!r) { err.hidden = false; err.textContent = 'Dit lijkt geen Assessmentprofiel. Plak het volledige profiel, van “ASSESSMENTPROFIEL” tot “EINDE ASSESSMENTPROFIEL”.'; return; }
      proceed(r.profile, r.missing);
    };
  }
  function afterLoad(P, missing, mode) {
    const needLevel = missing.includes('aanbevolen niveau') && missing.includes('aanbevolen moeilijkheid') && !PF.overall(P);
    const other = missing.filter((m) => m !== 'aanbevolen niveau' && m !== 'aanbevolen moeilijkheid');
    if (needLevel) {
      view(`<div class="eyebrow">Profiel ingelezen</div><h2>Eén ding ontbreekt: je niveau</h2><p>In het profiel staat geen niveau of startmoeilijkheid. Welk niveau past nu het best bij je?</p>
        <div class="choices-list">${LEVELS.slice(0, 5).map((l) => `<button class="pick" data-l="${l.v}"><span class="k">${l.k}</span><b>${l.label}</b><span class="d">${l.desc}</span></button>`).join('')}</div>`,
        (e) => { if (/^[1-5]$/.test(e.key)) set(Number(e.key)); });
      const set = (lv) => { P.imported = P.imported || {}; P.imported.level = lv; P.imported.startDiff = lv; afterLoad(P, other, mode); };
      $$('[data-l]').forEach((b) => (b.onclick = () => set(Number(b.dataset.l))));
      return;
    }
    if (mode === 'recal') return startRecal(P);
    saveProfile(P);
    SESSION.pending = []; saveSession();
    const weak = PF.weakCats(P, 3), lv = PF.overall(P);
    view(`<div class="eyebrow">📂 Profiel v${P.version}</div><h2>Profiel geladen. Ik gebruik dit als uitgangspunt voor deze trainingssessie.</h2>
      <dl class="summary"><dt>Niveau</dt><dd>${lv ? `${lv}/5 – ${levelName(lv)}` : '—'}</dd><dt>Zwakke punten</dt><dd>${weak.length ? weak.map((c) => CATS[c].name).join(', ') : '—'}</dd><dt>Betrouwbaarheid</dt><dd>${PF.reliability(P)}</dd></dl>
      ${other.length ? `<p class="note">Niet gevonden in het profiel: ${other.join(', ')}. Dit vul ik aan zodra er trainingsgegevens zijn.</p>` : ''}
      <div class="row" style="margin-top:12px"><button class="btn" id="menu">Naar trainingsmenu</button></div>`,
      (e) => { if (e.key === 'Enter') renderMenu(); });
    $('#menu').onclick = renderMenu;
  }

  /* ================= Fase 1: intake ================= */
  const INTAKE_Q = [
    { key: 'exp', q: 'Hoeveel ervaring heb je met cognitieve assessments?', multi: false, opts: ['Geen', 'Een beetje (1–2 keer geoefend)', 'Redelijk (vaker geoefend)', 'Veel (ook echte assessments gedaan)'] },
    { key: 'hard', q: 'Welke onderdelen vind je zelf moeilijk?', multi: true, opts: [...CAT_IDS.map((c) => CATS[c].name), 'Weet ik nog niet'] },
    { key: 'easy', q: 'Welke onderdelen vind je makkelijk?', multi: true, opts: [...CAT_IDS.map((c) => CATS[c].name), 'Weet ik nog niet'] },
    { key: 'struggle', q: 'Waar heb je vooral moeite mee?', multi: true, opts: ['Snelheid', 'Begrijpen wat er gevraagd wordt', 'Rekenen', 'Patronen herkennen', 'Concentratie', 'Weet ik niet'] },
    { key: 'practiced', q: 'Welke soorten assessmentvragen heb je eerder geoefend?', multi: true, opts: [...CAT_IDS.map((c) => CATS[c].name), 'Nog niets'] },
    { key: 'goal', q: 'Wat wil je vooral verbeteren?', multi: false, opts: ['Snelheid', 'Nauwkeurigheid', 'Beide'] },
  ];
  let INTAKE = null;
  function startIntake(then) { INTAKE = { i: 0, a: {}, then: then || null }; renderIntake(); }
  function renderIntake() {
    const Q = INTAKE_Q[INTAKE.i];
    const cur = INTAKE.a[Q.key] || (Q.multi ? [] : null);
    view(`<div class="eyebrow">🆕 Fase 1 · Intake · vraag ${INTAKE.i + 1} van ${INTAKE_Q.length}</div>
      <div class="steps-dots">${INTAKE_Q.map((_, i) => `<i class="${i <= INTAKE.i ? 'on' : ''}"></i>`).join('')}</div>
      <h2>${Q.q}</h2>${Q.multi ? '<p class="muted">Kies alles wat van toepassing is.</p>' : ''}
      <div class="choices-list">${Q.opts.map((o, i) => `<button class="pick" data-i="${i}" aria-pressed="${Q.multi ? cur.includes(o) : cur === o}"><span class="k">${i + 1}</span><b>${o}</b><span></span></button>`).join('')}</div>
      <div class="row">${Q.multi ? '<button class="btn" id="next">Verder</button>' : ''}<button class="btn quiet" id="skip">Overslaan</button><button class="btn quiet" id="back">Terug</button></div>`,
      (e) => { const n = Number(e.key); if (n >= 1 && n <= Q.opts.length) clickOpt(n - 1); if (e.key === 'Enter' && Q.multi) next(); });
    const next = () => { if (INTAKE.i < INTAKE_Q.length - 1) { INTAKE.i++; renderIntake(); } else finishIntake(); };
    const clickOpt = (i) => {
      const o = Q.opts[i];
      if (!Q.multi) { INTAKE.a[Q.key] = o; return next(); }
      let arr = INTAKE.a[Q.key] || [];
      const exclusive = /Weet ik|Nog niets/.test(o);
      if (arr.includes(o)) arr = arr.filter((x) => x !== o);
      else arr = exclusive ? [o] : [...arr.filter((x) => !/Weet ik|Nog niets/.test(x)), o];
      INTAKE.a[Q.key] = arr;
      $$('.pick').forEach((b) => b.setAttribute('aria-pressed', String(arr.includes(Q.opts[Number(b.dataset.i)]))));
    };
    $$('.pick').forEach((b) => (b.onclick = () => clickOpt(Number(b.dataset.i))));
    if ($('#next')) $('#next').onclick = next;
    $('#skip').onclick = () => { delete INTAKE.a[Q.key]; next(); };
    $('#back').onclick = () => { if (INTAKE.i === 0) renderStart(); else { INTAKE.i--; renderIntake(); } };
  }
  function finishIntake() {
    const a = INTAKE.a;
    const clean = (arr) => (arr || []).filter((x) => !/Weet ik|Nog niets/.test(x));
    const intake = { exp: a.exp || null, hard: clean(a.hard), easy: clean(a.easy), struggle: (a.struggle || []).filter((x) => x !== 'Weet ik niet'), practiced: clean(a.practiced), goal: a.goal || null };
    startNulmeting(intake);
  }

  /* ================= Fase 2: nulmeting ================= */
  function startNulmeting(intake) {
    intake = intake || (PROFILE && PROFILE.intake) || {};
    const byName = (n) => CAT_IDS.find((c) => CATS[c].name === n);
    const hard = (intake.hard || []).map(byName).filter(Boolean);
    const cats = shuffle(CAT_IDS);
    const extra = shuffle(hard.length ? hard : CAT_IDS).slice(0, 2);
    const plan = [...cats, ...extra].map((c) => ({ cat: c }));
    const expIdx = ['Geen', 'Een beetje (1–2 keer geoefend)', 'Redelijk (vaker geoefend)', 'Veel (ook echte assessments gedaan)'].indexOf(intake.exp);
    const d0 = [1, 2, 3, 3][expIdx] || 2;
    startRun({ level: d0, difficulty: 'staircase', category: 'plan', duration: plan.length, pressure: 'none', feedback: 'each', hints: false, reasoning: true },
      '📏 Diagnostische nulmeting', 'nulmeting', { plan, intake });
  }
  function startRecal(P) {
    const weak = PF.weakCats(P, 2), strong = PF.strongCats(P, 1);
    const unsure = CAT_IDS.filter((c) => !weak.includes(c) && !strong.includes(c)).sort((a, b) => P.cats[a].n - P.cats[b].n).slice(0, 2);
    const cats = [...new Set([...weak, ...strong, ...unsure])].slice(0, 5);
    while (cats.length < 3) { const c = pick(CAT_IDS.filter((x) => !cats.includes(x))); cats.push(c); }
    const lvl = (c) => PF.catLevel(P.cats[c]) || PF.overall(P) || 2;
    const plan = shuffle(cats).map((c) => ({ cat: c, d: lvl(c) }));
    startRun({ level: 'profile', difficulty: 'fixed', category: 'plan', duration: plan.length, pressure: 'none', feedback: 'each', hints: false, reasoning: true },
      '🔄 Herkalibratie', 'recal', { plan, baseProfile: P });
  }

  /* ================= Fase 5: trainingsmenu ================= */
  function renderMenu() {
    stopTimer(); RUN = null;
    const H = SESSION.history, ok = H.filter((r) => r.ok).length;
    const weak = weakPoints(2);
    const pbar = PROFILE
      ? `<div class="sessionbar"><span>👤 Profiel <b>v${PROFILE.version}</b> · niveau <b>${PF.overall(PROFILE) || '?'}/5</b></span>${weak.length ? `<span>Aandacht: ${weak.map((c) => CATS[c].name).join(', ')}</span>` : ''}${H.length ? `<span>Sessie: <b>${H.length}</b> vragen · <b>${pct(ok, H.length)}%</b></span>` : ''}</div>`
      : `<div class="sessionbar"><span>👤 Nog geen Assessmentprofiel.</span>${H.length ? `<span>Sessie: <b>${H.length}</b> vragen · <b>${pct(ok, H.length)}%</b></span>` : ''}<span style="margin-left:auto"><button class="btn small" id="m-new">Profiel maken</button></span></div>`;
    view(`${pbar}
      <h2>🎯 Kies je trainingsmodus</h2>
      <div class="modes">${Object.entries(MODES).map(([k, m]) => `<button class="mode ${k === '3' ? 'star' : ''}" data-mode="${k}"><span class="no">${k}</span><h3>${m.icon} ${m.name}</h3><ul>${m.bullets.map((b) => `<li>${b}</li>`).join('')}</ul></button>`).join('')}</div>
      <p style="margin-top:16px"><b>Welke modus wil je starten? Kies 1 t/m 6.</b></p>
      <div class="cmds">
        <button class="cmd" data-m="profiel" ${PROFILE ? '' : 'disabled'}>PROFIEL</button>
        <button class="cmd" data-m="update" ${SESSION.pending.length ? '' : 'disabled'}>UPDATE PROFIEL${SESSION.pending.length ? ` (${SESSION.pending.length})` : ''}</button>
        <button class="cmd" data-m="nulmeting">NULMETING</button>
        <button class="cmd" data-m="herkal" ${PROFILE ? '' : 'disabled'}>HERKALIBREER</button>
        <button class="cmd" data-m="zwak">ZWAKKE PUNTEN</button>
        <button class="cmd" data-m="trainzwak">TRAIN ZWAKKE PUNTEN</button>
        <button class="cmd" data-m="start">PROFIELKEUZE</button>
        ${H.length ? '<button class="cmd stop" data-m="clear">SESSIE WISSEN</button>' : ''}
      </div>
      <p class="muted small" style="margin-top:14px">Elke training krijgt nieuwe, ter plekke gemaakte vragen. Het zijn zelfgemaakte oefenvragen, geen officiële vragen van Defensie of het Korps Mariniers.</p>`,
      (e) => { if (/^[1-6]$/.test(e.key)) chooseMode(Number(e.key)); });
    $$('[data-mode]').forEach((b) => (b.onclick = () => chooseMode(Number(b.dataset.mode))));
    if ($('#m-new')) $('#m-new').onclick = () => startIntake();
    $$('[data-m]').forEach((b) => (b.onclick = () => menuCommand(b.dataset.m)));
  }
  function menuCommand(c) {
    switch (c) {
      case 'profiel': return showProfilePanel();
      case 'update': return doProfileUpdate();
      case 'nulmeting': return PROFILE && PROFILE.intake && PROFILE.intake.exp ? startNulmeting(PROFILE.intake) : startIntake();
      case 'herkal': return PROFILE ? startRecal(JSON.parse(JSON.stringify(PROFILE))) : renderPaste('recal');
      case 'zwak': return showWeak();
      case 'trainzwak': return chooseMode(5);
      case 'start': return renderStart();
      case 'clear': {
        const o = openPanel('<h2>Sessie wissen?</h2><p>De resultaten van deze sessie worden verwijderd. Je Assessmentprofiel blijft bewaard.</p><button class="btn" id="yes">Ja, wissen</button>');
        $('#yes', o).onclick = () => { SESSION = { history: [], pending: [], created: Date.now() }; saveSession(); closePanel(); renderMenu(); toast('Sessie gewist'); };
      }
    }
  }

  /* ================= Profiel tonen / bijwerken ================= */
  function profileBox(P) {
    const txt = PF.toText(P);
    return `<div class="profilebox"><div class="row" style="margin-bottom:8px"><button class="btn" data-copy>Kopieer profiel</button></div><textarea readonly rows="18" class="paste mono-small">${esc(txt)}</textarea></div>`;
  }
  function bindCopy(root, P) { const b = $('[data-copy]', root); if (b) b.onclick = () => copyText(PF.toText(P), b); }
  function showProfilePanel() {
    if (!PROFILE) return toast('Nog geen profiel. Kies NULMETING om er een te maken.');
    const o = openPanel(`<h2>👤 Mijn Assessmentprofiel (v${PROFILE.version})</h2>${profileBox(PROFILE)}${SESSION.pending.length ? `<p class="muted small" style="margin-top:8px">Er zijn ${SESSION.pending.length} nieuwe antwoorden die nog niet in dit profiel staan. Gebruik UPDATE PROFIEL.</p>` : ''}`, true);
    bindCopy(o, PROFILE);
  }
  function doProfileUpdate() {
    if (!SESSION.pending.length) return toast('Er zijn nog geen nieuwe trainingsresultaten sinds de laatste profielversie.');
    const P = PF.update(PROFILE, SESSION.pending, {});
    saveProfile(P);
    renderProfilePage(P, { title: PROFILE && P.version > 1 ? `Profiel bijgewerkt naar v${P.version}` : 'Assessmentprofiel gemaakt' });
  }
  function renderProfilePage(P, { title, intro } = {}) {
    stopTimer(); RUN = null;
    view(`<div class="eyebrow">👤 Fase 4 · Assessmentprofiel v${P.version}</div><h2>${esc(title || 'Je Assessmentprofiel')}</h2>
      ${intro || ''}
      <p><b>Bewaar het onderstaande Assessmentprofiel. Je kunt dit bij een volgende sessie plakken zodat je niet opnieuw de volledige nulmeting hoeft te doen.</b></p>
      <p class="muted small">Het profiel staat ook opgeslagen in deze browser. Wil je het op een ander apparaat of in een andere chat gebruiken, kopieer het dan.</p>
      ${P.notes && P.notes.length ? `<div class="notes">${P.notes.map((n) => `<div>${esc(n)}</div>`).join('')}</div>` : ''}
      ${profileBox(P)}
      <div class="row" style="margin-top:14px"><button class="btn" id="menu">Naar trainingsmenu</button></div>`,
      (e) => { if (e.key === 'Escape') renderMenu(); });
    bindCopy(APP, P);
    $('#menu').onclick = renderMenu;
  }

  /* ================= Wizard ================= */
  let W = null;
  function chooseMode(m, preset) {
    const M = MODES[m];
    W = { mode: m, label: `${M.icon} ${M.name}`, s: { ...M.def, ...M.fixed, ...(preset || {}) }, steps: M.steps.slice(), i: 0 };
    if (m === 5) {
      const weak = weakPoints(2);
      if (!weak.length) {
        view(`<div class="eyebrow">${W.label}</div><h2>Nog geen zwakke punten bekend</h2>
          <p>Zwakke Punten Training gebruikt je Assessmentprofiel en je resultaten uit deze sessie. Die zijn er nog niet (of je maakte nog geen fouten).</p>
          <div class="row"><button class="btn" id="go">Start nulmeting</button><button class="btn ghost" id="back">Terug naar menu</button></div>`,
          (e) => { if (e.key === 'Escape') renderMenu(); });
        $('#go').onclick = () => menuCommand('nulmeting');
        $('#back').onclick = renderMenu;
        return;
      }
      W.s.level = PROFILE ? 'profile' : clamp(Math.round(SESSION.history.slice(-20).reduce((a, r) => a + r.d, 0) / Math.max(1, Math.min(20, SESSION.history.length))) || 3, 1, 5);
      W.weakCats = weak;
    }
    renderStep();
  }
  function renderStep() {
    if (W.i >= W.steps.length) return renderSummary();
    const key = W.steps[W.i], D = STEP_DEFS[key];
    let opts = D.opts;
    if (key === 'pressure' && MODES[W.mode].pressureOpts) opts = opts.filter((o) => MODES[W.mode].pressureOpts.includes(o.v));
    const cur = W.s[key];
    const disabled = (o) => (o.v === 'profile' && !PROFILE) || (o.v === 'weak' && !weakPoints(1).length);
    view(`<div class="eyebrow">${esc(W.label)} · stap ${W.i + 1} van ${W.steps.length}</div>
      <div class="steps-dots">${W.steps.map((_, i) => `<i class="${i <= W.i ? 'on' : ''}"></i>`).join('')}</div>
      <h2>${D.title}</h2><p class="muted">${D.q}</p>
      <div class="choices-list">${opts.map((o, i) => `<button class="pick" data-i="${i}" aria-pressed="${cur === o.v}" ${disabled(o) ? 'disabled' : ''}><span class="k">${o.k}</span><b>${o.label}</b><span class="d">${disabled(o) ? (o.v === 'profile' ? 'Nog geen profiel: maak er een via NULMETING.' : 'Nog geen zwakke punten bekend.') : o.desc || ''}</span></button>`).join('')}</div>
      ${D.note ? `<p class="note">${D.note}</p>` : ''}
      <div class="row"><button class="btn ghost" id="back">Terug</button></div>`,
      (e) => { const o = opts.findIndex((x) => x.k.toLowerCase() === e.key.toLowerCase()); if (o >= 0 && !disabled(opts[o])) choose(o); if (e.key === 'Escape' || e.key === 'Backspace') back(); });
    const choose = (i) => {
      const o = opts[i];
      W.s[key] = o.v;
      if (key === 'duration' && o.v === 40) { W.s.category = 'mix'; const ci = W.steps.indexOf('category'); if (ci > W.i) W.steps.splice(ci, 1); }
      W.i++; renderStep();
    };
    const back = () => { if (W.i === 0) renderMenu(); else { W.i--; renderStep(); } };
    $$('.pick').forEach((b) => (b.onclick = () => choose(Number(b.dataset.i))));
    $('#back').onclick = back;
  }
  function renderSummary() {
    const s = W.s;
    const rows = [['Niveau', settingLabel('level', s.level)], ['Moeilijkheid', settingLabel('difficulty', s.difficulty)], ['Categorie', s.category === 'weak' ? `🎯 ${(W.weakCats || weakPoints(2)).map((c) => CATS[c].name).join(' en ') || 'zwakke punten'}` : settingLabel('category', s.category)], ['Aantal vragen', settingLabel('duration', s.duration)], ['Tijdsdruk', settingLabel('pressure', s.pressure)], ['Feedback', settingLabel('feedback', s.feedback)], ['Hints', s.hints ? 'Aan' : 'Uit'], ['Redenering', s.reasoning ? 'Antwoord + redenering' : 'Alleen antwoord']];
    view(`<div class="eyebrow">${esc(W.label)}</div><h2>Klaar om te starten</h2>
      ${W.mode === 3 ? '<p class="muted">Een zelfgemaakte, intensieve trainingsmodus ter voorbereiding. Geen officiële simulatie van Defensie of het Korps Mariniers.</p>' : ''}
      <dl class="summary">${rows.map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join('')}</dl>
      <div class="row"><button class="btn" id="start">Start training</button>${W.mode === 3 ? '<button class="btn ghost" id="adjust">Instellingen aanpassen</button>' : ''}<button class="btn quiet" id="back">Terug</button></div>
      <p class="muted small" style="margin-top:14px">Tijdens de training staan de commando's als knoppen onder elke vraag. Antwoorden kan ook met de toetsen A–E.</p>`,
      (e) => { if (e.key === 'Enter') start(); if (e.key === 'Escape') renderMenu(); });
    const start = () => startRun(W.s, W.label, W.mode, { weakCats: W.weakCats });
    $('#start').onclick = start;
    $('#back').onclick = () => { if (W.steps.length) { W.i = W.steps.length - 1; renderStep(); } else renderMenu(); };
    if ($('#adjust')) $('#adjust').onclick = () => { const s0 = { ...W.s }; W = { mode: 6, label: '⚓ Mariniers Training (aangepast)', s: { ...MODES[6].def, ...s0 }, steps: ['difficulty', 'category', 'duration', 'pressure', 'feedback', 'hints', 'reasoning'], i: 0 }; renderStep(); };
  }

  /* ================= Training ================= */
  let RUN = null, TIMER = null;
  function stopTimer() { clearInterval(TIMER); TIMER = null; }

  function startRun(s, label, mode, extra = {}) {
    s = { ...s };
    let base = typeof s.level === 'number' ? s.level : PROFILE ? PF.overall(PROFILE) || 3 : 3;
    if (s.difficulty !== 'auto' && /^[1-5]$/.test(s.difficulty)) base = Number(s.difficulty);
    RUN = {
      s, label, mode, total: s.duration, i: 0, results: [], lv: {}, streak: {}, wstreak: {}, diag: null, retest: null, review: [],
      timeF: 1, bag: [], seen: new Set(), startLv: base, plan: extra.plan || null, intake: extra.intake || null, baseProfile: extra.baseProfile || null,
      weakCats: extra.weakCats || (s.category === 'weak' ? weakPoints(2) : null), stairD: s.level,
    };
    CAT_IDS.forEach((c) => {
      let l = base;
      if (s.level === 'profile' && PROFILE && s.difficulty === 'auto') l = PF.catLevel(PROFILE.cats[c]) || base;
      RUN.lv[c] = l; RUN.streak[c] = 0; RUN.wstreak[c] = 0;
    });
    nextQuestion();
  }
  const isAuto = () => RUN.s.difficulty === 'auto';
  const reasoningOn = () => !!RUN.s.reasoning;
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
    const pool = RUN.weakCats && RUN.weakCats.length ? RUN.weakCats : CAT_IDS;
    const S = catStats([...SESSION.history.slice(-60), ...RUN.results.map((r) => ({ c: r.q.cat, ok: r.ok }))]);
    const w = pool.map((k) => (S[k].n - S[k].ok + 1) / (S[k].n + 2) + 0.1);
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
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
    const due = RUN.review.findIndex((x) => x.due <= RUN.i);
    if (RUN.plan) {
      cat = RUN.plan[RUN.i].cat;
      d = RUN.plan[RUN.i].d || clamp(RUN.stairD, 1, 5);
    } else if (RUN.diag) { cat = RUN.diag.cat; kind = RUN.diag.kind; d = Math.max(1, RUN.diag.from - 1); flag = 'diag'; }
    else if (RUN.retest) { cat = RUN.retest.cat; kind = RUN.retest.kind; d = RUN.retest.at; flag = 'retest'; }
    else if (due >= 0 && RUN.s.feedback === 'each') { const r = RUN.review.splice(due, 1)[0]; cat = r.cat; kind = r.kind; d = RUN.lv[cat]; flag = 'review'; }
    else { cat = chooseCat(); d = RUN.lv[cat]; }
    let q;
    for (let k = 0; k < 8; k++) {
      q = MT.gens[cat].generate(d, kind ? { kind } : {});
      const sig = q.prompt + q.stem + q.opts.map((o) => o.key).join();
      if (!RUN.seen.has(sig)) { RUN.seen.add(sig); break; }
    }
    RUN.cur = { q, cat, d, flag, t0: now(), target: targetSecs(cat, d), hint: false, done: false, R: reasoningOn() ? RS.build(q) : null };
    renderQuestion();
  }

  const cmdBtn = (id, label, dis, cls = '') => `<button class="cmd ${cls}" data-cmd="${id}" ${dis ? 'disabled' : ''}>${label}</button>`;
  function commandBar(phase) {
    const s = RUN.s, special = RUN.mode === 'nulmeting' || RUN.mode === 'recal';
    if (special) return `<div class="cmds">${phase === 'fb' ? cmdBtn('next', 'VOLGENDE') + cmdBtn('uitleg', 'UITLEG') : ''}${cmdBtn('stop', 'STOP', false, 'stop')}${cmdBtn('menu', 'MENU')}</div>`;
    return `<div class="cmds">
      ${phase === 'q' ? cmdBtn('hint', 'HINT', !s.hints || RUN.cur.hint) : cmdBtn('uitleg', 'UITLEG')}
      ${phase === 'fb' ? cmdBtn('next', 'VOLGENDE') : ''}
      ${cmdBtn('harder', 'MOEILIJKER')}${cmdBtn('easier', 'MAKKELIJKER')}${cmdBtn('score', 'SCORE')}
      ${cmdBtn('weak', 'ZWAKKE PUNTEN')}${cmdBtn('profiel', 'PROFIEL', !PROFILE)}
      ${cmdBtn('stop', 'STOP', false, 'stop')}${cmdBtn('menu', 'MENU')}
    </div>`;
  }
  function bindCommands() { $$('[data-cmd]').forEach((b) => (b.onclick = () => runCommand(b.dataset.cmd))); }
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
      case 'profiel': return showProfilePanel();
      case 'stop': return finishRun(true);
      case 'menu': {
        if (!RUN.results.length) return renderMenu();
        const o = openPanel('<h2>Terug naar het menu?</h2><p>Je antwoorden tot nu toe blijven bewaard in deze sessie.</p><div class="row"><button class="btn" id="to-menu">Naar menu</button><button class="btn ghost" id="to-report">Eerst resultaten tonen</button></div>');
        $('#to-menu', o).onclick = () => { closePanel(); renderMenu(); };
        $('#to-report', o).onclick = () => { closePanel(); finishRun(true); };
      }
    }
  }
  function shiftLevel(dir) {
    const s = RUN.s;
    if (/^[1-5]$/.test(s.difficulty)) s.difficulty = String(clamp(Number(s.difficulty) + dir, 1, 5));
    CAT_IDS.forEach((c) => (RUN.lv[c] = clamp(RUN.lv[c] + dir, 1, 5)));
    toast(`Moeilijkheid ${dir > 0 ? 'omhoog' : 'omlaag'}: nu ${curLevel()}/5, vanaf de volgende vraag`);
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
        if (marks) { if (marks.hide) cls = i === marks.chosen ? 'sel' : ''; else if (i === q.ans) cls = 'ok'; else if (i === marks.chosen) cls = 'no'; }
        const val = q.layout === 'fig' || q.layout === 'op' ? o.html : `<span class="v ${q.layout === 'mono' ? 'mono' : ''}">${o.html}</span>`;
        return `<button class="ans ${cls}" data-i="${i}" ${marks ? 'disabled' : ''} aria-label="Antwoord ${LETTERS[i]}"><span class="k">${LETTERS[i]}</span>${val}</button>`;
      }).join('')}</div>`;
  }
  function qbarHTML(C) {
    const cat = CATS[C.cat];
    const count = RUN.total === Infinity ? `Vraag ${RUN.i + 1} · vrij trainen` : `Vraag ${RUN.i + 1}/${RUN.total}`;
    const flag = { diag: '<span class="chip warn">Eenvoudiger oefenvraag</span>', retest: '<span class="chip olive">Hertest</span>', review: '<span class="chip olive">Herhaling in andere vorm</span>' }[C.flag] || '';
    return `<div class="qbar"><div class="left"><span class="chip">${cat.icon} ${cat.name}</span><span class="chip olive">Niveau ${C.d}/5</span>${flag}<span class="counter">${count}</span></div>${C.target ? `<div class="timer" id="timer">${C.target}s</div>` : ''}</div>`;
  }

  function renderQuestion() {
    const C = RUN.cur, q = C.q;
    const sub = RUN.mode === 'nulmeting' ? 'Nulmeting: geef je antwoord en daarna je redenering.' : RUN.mode === 'recal' ? 'Herkalibratie: controlevraag.' : RUN.s.feedback === 'end' ? 'Feedback volgt in het eindrapport.' : reasoningOn() ? 'Kies je antwoord; daarna vraag ik hoe je het aanpakte.' : 'Antwoord met een klik of met A–E.';
    view(`${qbarHTML(C)}
      ${C.target ? '<div class="tbar"><i id="tbar" style="width:100%"></i></div>' : ''}
      <div class="card">${stemHTML(q)}<div id="hintbox"></div>${commandBar('q')}</div>
      <p class="muted small" style="margin-top:10px">${esc(RUN.label)} · ${sub}</p>`,
      (e) => {
        const k = e.key.toUpperCase();
        let idx = LETTERS.indexOf(k);
        if (idx < 0 && /^[1-5]$/.test(e.key)) idx = Number(e.key) - 1;
        if (idx >= 0 && idx < q.opts.length) return answer(idx);
        if (k === 'H') showHint();
      });
    $$('.ans').forEach((b) => (b.onclick = () => answer(Number(b.dataset.i))));
    bindCommands();
    if (C.target) {
      TIMER = setInterval(() => {
        if (panelOpenedAt != null) return;
        const left = C.target - (now() - C.t0) / 1000;
        const t = $('#timer'), bar = $('#tbar');
        if (t) { t.textContent = `${Math.max(0, Math.ceil(left))}s`; t.classList.toggle('low', left <= 5); }
        if (bar) { bar.style.width = `${clamp((left / C.target) * 100, 0, 100)}%`; bar.classList.toggle('low', left <= 5); }
        if (left <= 0) answer(null, true);
      }, 250);
    }
  }

  /* Stap 1: antwoord gekozen */
  function answer(idx, timedOut = false) {
    const C = RUN.cur;
    if (!C || C.done) return;
    C.done = true;
    stopTimer();
    C.idx = idx; C.timedOut = timedOut; C.ms = Math.round(now() - C.t0);
    if (C.R && !timedOut && idx != null) return renderReasoning();
    finalize(null);
  }

  /* Stap 2: redenering */
  function renderReasoning() {
    const C = RUN.cur, q = C.q, R = C.R;
    const val = q.opts[C.idx].text || q.opts[C.idx].key;
    const multi = R.type === 'multi';
    const sel = new Set();
    view(`${qbarHTML(C)}
      <div class="card">${stemHTML(q, { chosen: C.idx, hide: true })}
        <div class="reason">
          <h3>Waarom koos je ${LETTERS[C.idx]}${q.layout === 'fig' ? '' : ` (${esc(val)})`}?</h3>
          <p class="muted">${esc(R.prompt)}${multi ? ' Je kunt meerdere dingen kiezen.' : ''}</p>
          <div class="choices-list">${R.options.map((o, i) => `<button class="pick" data-r="${o.id}" aria-pressed="false"><span class="k">${i + 1}</span><b>${esc(o.text)}</b><span></span></button>`).join('')}</div>
          <label class="small muted" for="own">In je eigen woorden (optioneel)</label>
          <textarea id="own" class="paste" rows="2" placeholder="Bijv.: er komt steeds 4 bij"></textarea>
          <div class="row" style="margin-top:10px"><button class="btn" id="judge" ${multi ? 'disabled' : 'disabled'}>Beoordeel mijn antwoord</button></div>
          <p class="muted small" style="margin-top:8px">Het juiste antwoord zie je pas na je redenering. Je antwoordtijd is al gestopt.</p>
        </div>
      </div>`,
      (e) => { const n = Number(e.key); if (n >= 1 && n <= R.options.length) toggle(R.options[n - 1].id); if (e.key === 'Enter' && !$('#judge').disabled) go(); });
    const toggle = (id) => {
      if (!multi) { sel.clear(); sel.add(id); }
      else if (id === 'guess') { const had = sel.has('guess'); sel.clear(); if (!had) sel.add('guess'); }
      else { sel.delete('guess'); sel.has(id) ? sel.delete(id) : sel.add(id); }
      $$('[data-r]').forEach((b) => b.setAttribute('aria-pressed', String(sel.has(b.dataset.r))));
      $('#judge').disabled = !sel.size;
    };
    const go = () => finalize({ sel: multi ? [...sel] : [...sel][0], own: $('#own').value.trim().slice(0, 300) });
    $$('[data-r]').forEach((b) => (b.onclick = () => toggle(b.dataset.r)));
    $('#judge').onclick = go;
  }

  /* Stap 3: beoordelen, bijhouden en feedback */
  function finalize(reason) {
    const C = RUN.cur, q = C.q;
    const idx = C.idx, timedOut = C.timedOut, ms = C.ms;
    const ok = !timedOut && idx === q.ans;
    const chosen = idx == null ? null : q.opts[idx];
    const tag = ok ? null : timedOut ? 'Tijd op' : (chosen && chosen.tag) || 'Overig';
    let J = null, qd = null;
    if (reason && C.R) { J = RS.judge(C.R, reason.sel); J.own = reason.own; qd = RS.quadrant(ok, J.status); }
    const base = CATS[q.cat].base * 1000;
    const fast = !ok && !timedOut && ms < Math.max(3500, base * 0.2);
    const fastOk = ok && ms < base * 0.6 && (!J || RS.reasonOk(J.status));
    let err = null;
    if (!ok) {
      if (timedOut) err = RS.ERR.time;
      else if (qd === 'C') err = tag === 'Rekenfout' ? RS.ERR.calc : RS.ERR.exec;
      else if (qd === 'D' && J.err) err = J.err;
      else if (fast && (!J || J.status === 'guess')) err = RS.ERR.early;
      else err = RS.TAG_ERR[tag] || RS.ERR.pattern;
    } else if (J && J.status === 'complex') err = RS.ERR.complex;
    const res = { q, chosen: idx, ok, ms, timedOut, hint: C.hint, flag: C.flag, d: C.d, target: C.target, tag, err, J, qd, fast };
    RUN.results.push(res);
    RUN.i++;
    const rec = { c: q.cat, d: C.d, k: q.kindId, kn: q.kind, ok, t: ms, to: timedOut, tag, err, rs: J ? J.status : null, qd, fast, fastOk, m: RUN.mode };
    SESSION.history.push(rec);
    if (RUN.mode !== 'nulmeting' && RUN.mode !== 'recal') SESSION.pending.push(rec);
    saveSession();
    let notes = [];
    if (RUN.plan) { if (!RUN.plan[RUN.i - 1].d) RUN.stairD = clamp(RUN.stairD + (ok ? 1 : -1), 1, 5); }
    else notes = adapt(res);
    if (RUN.s.feedback === 'end') return nextQuestion();
    renderFeedback(res, notes);
  }

  function adapt(res) {
    const c = res.q.cat, notes = [], auto = isAuto(), s = RUN.s;
    if (s.pressure === 'adaptive' && res.target) {
      if (res.ok && res.ms < res.target * 600) RUN.timeF = clamp(RUN.timeF * 0.92, 0.5, 1.6);
      else if (!res.ok) RUN.timeF = clamp(RUN.timeF * 1.1, 0.5, 1.6);
    }
    const fb = s.feedback === 'each';
    const goodReason = !res.J || RS.reasonOk(res.J.status);
    if (!res.ok && fb && RUN.review.length < 6) RUN.review.push({ cat: c, kind: res.q.kindId, due: RUN.i + 3 + Math.floor(Math.random() * 4) });
    if (res.ok && res.qd === 'B' && fb) { RUN.review.push({ cat: c, kind: res.q.kindId, due: RUN.i + 2 }); notes.push('Je antwoord klopte, maar je redenering niet. Over een paar vragen komt hetzelfde principe terug in een andere vorm.'); }
    if (res.ok) {
      RUN.wstreak[c] = 0;
      if (goodReason) RUN.streak[c]++;
      if (res.flag === 'diag') { RUN.retest = { cat: c, kind: res.q.kindId, at: RUN.diag.from }; RUN.diag = null; notes.push('Goed! De volgende vraag test hetzelfde principe weer op je eigen niveau.'); }
      else if (res.flag === 'retest') { RUN.retest = null; notes.push('Hertest gehaald: dit principe beheers je weer.'); }
      const fast = !res.target || res.ms <= res.target * 1000 * 0.85;
      if (auto && RUN.streak[c] >= 2 && fast && !res.hint && goodReason && RUN.lv[c] < 5) { RUN.lv[c]++; RUN.streak[c] = 0; notes.push(`Twee keer overtuigend goed bij ${CATS[c].name}: niveau omhoog naar ${RUN.lv[c]}/5.`); }
    } else {
      RUN.wstreak[c]++; RUN.streak[c] = 0;
      if (res.flag === 'diag') {
        RUN.diag.count = (RUN.diag.count || 0) + 1;
        if (RUN.diag.count >= 2) { notes.push(`Dit principe (${res.q.kind}) is nog lastig. Het komt later in de training terug.`); if (auto) RUN.lv[c] = Math.max(1, RUN.diag.from - 1); RUN.diag = null; RUN.wstreak[c] = 0; }
        else notes.push('Nog een oefenvraag over hetzelfde principe, weer iets eenvoudiger.');
      } else if (res.flag === 'retest') {
        RUN.retest = null;
        if (auto) { RUN.lv[c] = Math.max(1, RUN.lv[c] - 1); notes.push(`Hertest niet gehaald. Niveau voor ${CATS[c].name} gaat tijdelijk naar ${RUN.lv[c]}/5.`); }
      } else if (fb && (res.qd === 'D' || RUN.wstreak[c] >= 2)) {
        RUN.diag = { cat: c, kind: res.q.kindId, from: RUN.lv[c], count: 0 };
        RUN.wstreak[c] = 0;
        notes.push(res.qd === 'D'
          ? 'Het principe was nog niet duidelijk. Lees de uitleg hieronder; daarna volgt een eenvoudiger voorbeeld van hetzelfde principe, en later een hertest.'
          : `Twee fouten achter elkaar bij ${CATS[c].name}. Lees eerst de uitleg; de volgende vraag is een iets eenvoudigere oefenvraag over hetzelfde principe.`);
      } else if (res.qd === 'C') notes.push('Je aanpak was goed. Het niveau blijft gelijk; let vooral op de uitvoering.');
      else if (RUN.wstreak[c] >= 2 && auto) { RUN.lv[c] = Math.max(1, RUN.lv[c] - 1); RUN.wstreak[c] = 0; }
    }
    return notes;
  }

  function progressHTML() {
    const S = catStats(RUN.results.map((r) => ({ c: r.q.cat, ok: r.ok, t: r.ms, to: r.timedOut })));
    const n = RUN.results.length, ok = RUN.results.filter((r) => r.ok).length;
    const st = strongest(S), wk = weakest(S, 1)[0];
    const withR = RUN.results.filter((r) => r.J), rOk = withR.filter((r) => RS.reasonOk(r.J.status)).length;
    return `<div class="progress">
      <div><small>Score</small><b>${ok}/${n}</b></div>
      <div><small>Nauwkeurigheid</small><b>${pct(ok, n)}%</b></div>
      ${withR.length ? `<div><small>Redenering correct</small><b>${rOk}/${withR.length}</b></div>` : ''}
      <div><small>Huidig niveau</small><b>${RUN.plan ? '—' : curLevel() + '/5'}</b></div>
      <div><small>Sterkste categorie</small><b class="txt">${st ? CATS[st].name : '—'}</b></div>
      <div><small>Extra aandacht</small><b class="txt">${wk ? CATS[wk].name : '—'}</b></div>
    </div>`;
  }
  const othersHTML = (q) => `<ul class="others">${q.opts.map((o, i) => `<li><span class="k">${LETTERS[i]}</span><span>${i === q.ans ? '<b>Juist.</b>' : esc(o.why || '')}</span></li>`).join('')}</ul>`;
  function searchHTML(q) {
    const S = RS.searchSteps(q);
    if (!S) return '';
    return `<h3>🔎 Systematische zoekvolgorde</h3><ol class="search">${S.map((x) => `<li class="${x.state}">${esc(x.s)}${x.state === 'yes' ? ' <b>← hier gevonden, dus stoppen</b>' : x.state === 'no' ? ' – verklaart niet alles' : ''}</li>`).join('')}</ol>`;
  }

  function renderFeedback(res, notes) {
    const q = res.q, J = res.J;
    const count = RUN.total === Infinity ? `${RUN.i}` : `${RUN.i}/${RUN.total}`;
    const secs = (res.ms / 1000).toFixed(1).replace('.', ',');
    const ansTxt = (i) => (i == null ? '—' : q.layout === 'fig' ? LETTERS[i] : `${LETTERS[i]} – ${esc(q.opts[i].text || q.opts[i].key)}`);
    const wrongWhy = res.chosen != null && !res.ok ? esc(q.opts[res.chosen].why || '') : '';
    let head, good = '', bad = '';
    if (J) {
      const rl = { correct: '✅ Correct', inefficient: '✅ Correct, maar omslachtig', partial: '⚠️ Gedeeltelijk', complex: '❌ Onjuist (te ingewikkeld)', wrong: '❌ Onjuist', guess: '⚠️ Gegokt' }[J.status];
      head = `<h3 class="first">🧠 Beoordeling</h3>
        <dl class="summary tight"><dt>Jouw antwoord</dt><dd>${ansTxt(res.chosen)}</dd>
        <dt>Jouw redenering</dt><dd>${J.chosen.map(esc).join('; ')}${J.own ? `<br><span class="muted">“${esc(J.own)}”</span>` : ''}</dd>
        <dt>Juiste antwoord</dt><dd>${ansTxt(q.ans)}</dd>
        <dt>Antwoord</dt><dd>${res.ok ? '<span class="good">✅ Correct</span>' : '<span class="bad">❌ Fout</span>'}</dd>
        <dt>Redenering</dt><dd>${rl}</dd><dt>Tijd</dt><dd class="num">${secs} s</dd></dl>
        <p class="quad q${res.qd}">${esc(RS.QUAD[res.qd])}</p>`;
      const g = [];
      if (J.status === 'correct' || J.status === 'inefficient') g.push(`Je herkende de juiste aanpak: ${esc(J.chosen.join('; ').toLowerCase())}.`);
      if (J.status === 'partial' || (J.status === 'complex' && J.hit && J.hit.length) || (J.status === 'wrong' && J.hit && J.hit.length)) g.push(`Je zag wel: ${esc(J.hit.join(', ').toLowerCase())}.`);
      if (res.ok && !RS.reasonOk(J.status)) g.push('Je eindantwoord klopt.');
      if (!g.length) g.push(J.status === 'guess' ? 'Eerlijk dat je aangaf te gokken: zo zie je precies welk principe je nog moet leren.' : 'Je hebt je redenering benoemd. Daardoor zie je precies waar het misging.');
      good = `<h3>🔍 Wat ging goed?</h3><p>${g.join(' ')}</p>`;
      const b = [];
      if (res.qd === 'A') { if (J.status === 'inefficient') b.push(`Niets fout, maar het kan sneller. ${esc(J.note)}`); }
      else if (res.qd === 'B') b.push(`Je antwoord klopt, maar de aanpak die je noemt verklaart de vraag niet${J.note ? `: ${esc(J.note)}` : '.'} Mogelijk was het goede antwoord toeval; het principe is nog niet helemaal duidelijk.`);
      else if (res.qd === 'C') b.push(`Je aanpak was goed, maar de uitvoering ging mis. ${wrongWhy}`);
      else if (res.qd === 'D') { if (J.note) b.push(esc(J.note)); if (wrongWhy) b.push(`Over je antwoord ${LETTERS[res.chosen]}: ${wrongWhy}`); if (J.status === 'guess') b.push('Je gaf aan dat je gokte. Kijk vooral goed naar de stappen hieronder.'); }
      bad = b.length ? `<h3>❌ Wat ging fout?</h3><p class="${res.qd === 'A' ? '' : 'miss'}">${b.join(' ')}</p>` : '<h3>❌ Wat ging fout?</h3><p>Niets: antwoord en redenering kloppen allebei.</p>';
    } else {
      const verdict = res.ok ? '<b class="good">✅ Goed</b>' : res.timedOut ? '<b class="bad">⏱️ Tijd op</b>' : '<b class="bad">❌ Fout</b>';
      head = `<div class="verdict">
        <div><small>Vraag</small><b class="num">${count}</b></div><div><small>Resultaat</small>${verdict}</div>
        <div><small>Juiste antwoord</small><b>${LETTERS[q.ans]}</b></div><div><small>Jouw antwoord</small><b>${res.chosen == null ? '—' : LETTERS[res.chosen]}</b></div>
        <div><small>Tijd</small><b class="num">${secs} s</b>${res.target ? ` <span class="muted small">(limiet ${res.target} s)</span>` : ''}</div></div>`;
      if (!res.ok) bad = res.timedOut ? '<h3>Waar ging het mis?</h3><p class="miss">De tijd was op voordat je een antwoord koos. Kom je er niet uit, gok dan en ga door: een lege vraag levert nooit punten op.</p>'
        : `<h3>Waar ging het mis?</h3><p class="miss">Je koos ${LETTERS[res.chosen]}. ${wrongWhy}</p><p class="muted small">Dit is waarom dat antwoord niet klopt. Hoe je tot ${LETTERS[res.chosen]} kwam weet ik niet; zet redenering aan (Leren & Uitleggen of Zelf Instellen) voor feedback op je denkwijze.</p>`;
    }
    view(`${J ? '' : `<div class="qbar"><div class="left"><span class="chip">${CATS[q.cat].icon} ${CATS[q.cat].name}</span><span class="chip olive">Niveau ${res.d}/5</span><span class="counter">${esc(q.kind)}</span></div></div>`}
      ${J ? `<div class="qbar"><div class="left"><span class="chip">${CATS[q.cat].icon} ${CATS[q.cat].name}</span><span class="chip olive">Niveau ${res.d}/5</span><span class="counter">Vraag ${count} · ${esc(q.kind)}</span></div></div>` : head}
      <div class="card">${J ? head : ''}${stemHTML(q, { chosen: res.chosen })}
        <div class="fb">
          ${good}${bad}
          <h3>💡 Stap-voor-stap oplossing</h3><ol>${q.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
          ${searchHTML(q)}
          <h3>🧠 Waarom werkt deze methode?</h3><p>${esc(RS.whyWorks(q))}</p>
          <div id="uitleg" hidden><h3>Waarom de andere opties niet kloppen</h3>${othersHTML(q)}</div>
          <h3>⚡ Snellere aanpak</h3><p>${esc(q.quick)}</p>
          <h3>🎯 Leerpunt</h3><p class="lesson">${esc(q.lesson)}</p>
        </div>
        ${notes.length ? `<div class="notes">${notes.map((n) => `<div>${esc(n)}</div>`).join('')}</div>` : ''}
        <h3 class="sect">Voortgang</h3>${progressHTML()}
        <div class="row" style="margin-top:18px"><button class="btn" id="next">${RUN.i >= RUN.total ? (RUN.plan ? 'Naar de analyse' : 'Naar het rapport') : 'Volgende vraag'}</button></div>
        ${commandBar('fb')}
      </div>`,
      (e) => { if (e.key === 'Enter' || e.key.toUpperCase() === 'N') nextQuestion(); if (e.key.toUpperCase() === 'U') toggleUitleg(); });
    $('#next').onclick = nextQuestion;
    $('#next').focus({ preventScroll: true });
    bindCommands();
  }
  function toggleUitleg() { const u = $('#uitleg'); if (u) { u.hidden = !u.hidden; if (!u.hidden) u.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } }

  function showScore() {
    const n = RUN.results.length, ok = RUN.results.filter((r) => r.ok).length;
    const S = catStats(RUN.results.map((r) => ({ c: r.q.cat, ok: r.ok, t: r.ms, to: r.timedOut })));
    openPanel(`<h2>Score</h2><p><b class="num">${ok}/${n}</b> goed · <b class="num">${pct(ok, n)}%</b> nauwkeurig · niveau <b class="num">${curLevel()}/5</b></p>${catTable(S)}`);
  }
  function showWeak() {
    const H = SESSION.history, S = catStats(H);
    const wk = weakPoints(3);
    const kinds = {}, errs = {};
    H.filter((r) => !r.ok).forEach((r) => { const k = `${CATS[r.c].name} – ${r.kn}`; kinds[k] = (kinds[k] || 0) + 1; if (r.err) errs[r.err] = (errs[r.err] || 0) + 1; });
    const topK = Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 5), topE = Object.entries(errs).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const prof = PROFILE ? PF.weakCats(PROFILE, 3) : [];
    const o = openPanel(`<h2>🎯 Zwakke punten</h2>
      ${!H.length && !prof.length ? '<p>Nog geen gegevens. Doe eerst een nulmeting of een training.</p>' : ''}
      ${prof.length ? `<p>Uit je profiel (v${PROFILE.version}): <b>${prof.map((c) => CATS[c].name).join(', ')}</b></p>` : ''}
      ${H.length ? `<h3>Deze sessie</h3>${catTable(S, CAT_IDS.filter((c) => S[c].n && S[c].ok < S[c].n))}` : ''}
      ${topK.length ? `<h3 style="margin-top:14px">Patronen die fout gingen</h3><ul class="list">${topK.map(([k, v]) => `<li>${esc(k)} <span class="muted">(${v}×)</span></li>`).join('')}</ul>` : ''}
      ${topE.length ? `<h3 style="margin-top:14px">Meest voorkomende fouten</h3><ul class="list">${topE.map(([k, v]) => `<li><b>${esc(k)}</b> (${v}×): ${esc(TAG_ADVICE[k] || '')}</li>`).join('')}</ul>` : ''}
      ${wk.length ? '<div class="row" style="margin-top:16px"><button class="btn" id="tw">TRAIN ZWAKKE PUNTEN</button></div>' : ''}`);
    const tw = $('#tw', o);
    if (tw) tw.onclick = () => { closePanel(); stopTimer(); RUN = null; chooseMode(5); };
  }
  function catTable(S, only) {
    const ids = (only || CAT_IDS).filter((c) => S[c].n);
    if (!ids.length) return '<p class="muted">Geen gegevens.</p>';
    return `<div class="tbl"><table><thead><tr><th>Onderdeel</th><th>Score</th><th></th><th>Gem. tijd</th></tr></thead><tbody>${ids.map((c) => {
      const r = S[c].ok / S[c].n;
      return `<tr><td>${CATS[c].icon} ${CATS[c].name}</td><td class="n">${S[c].ok}/${S[c].n}</td><td><div class="meter"><i class="${r >= 0.75 ? '' : r >= 0.5 ? 'mid' : 'low'}" style="width:${Math.max(4, r * 100)}%"></i></div></td><td class="n">${S[c].tn ? (S[c].t / S[c].tn / 1000).toFixed(0) + ' s' : '—'}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  /* ================= Einde ================= */
  const toRecs = (list) => list.map((r) => ({ c: r.q.cat, d: r.d, k: r.q.kindId, kn: r.q.kind, ok: r.ok, t: r.ms, to: r.timedOut, tag: r.tag, err: r.err, rs: r.J ? r.J.status : null, qd: r.qd, fast: r.fast, fastOk: r.ok && r.ms < CATS[r.q.cat].base * 600 && (!r.J || RS.reasonOk(r.J.status)) }));
  function finishRun(stopped) {
    stopTimer(); closePanel();
    if (!RUN) return renderMenu();
    if (!RUN.results.length) return RUN.mode === 'nulmeting' ? renderStart() : renderMenu();
    if (RUN.mode === 'nulmeting') return renderAnalysis(stopped);
    if (RUN.mode === 'recal') return finishRecal();
    renderReport(stopped);
  }

  /* Fase 3: analyse na de nulmeting */
  function renderAnalysis(stopped) {
    const R = RUN.results, intake = RUN.intake || {};
    const recs = toRecs(R);
    const P = PF.update(null, recs, { diag: R.length, intake });
    const S = catStats(recs);
    const quad = { A: 0, B: 0, C: 0, D: 0 }; R.forEach((r) => r.qd && quad[r.qd]++);
    const ok = R.filter((r) => r.ok).length, lv = PF.overall(P);
    const run = RUN;
    view(`<div class="eyebrow">📏 Fase 3 · Analyse${stopped && R.length < run.total ? ' (nulmeting voortijdig gestopt)' : ''}</div>
      <h2>Zo pak je het aan</h2>
      <div class="kpis"><div><small>Score</small><b>${ok}/${R.length}</b></div><div><small>Geschat niveau</small><b>${lv}/5</b></div><div><small>Redenering correct</small><b>${quad.A + quad.C}/${R.filter((r) => r.qd).length}</b></div></div>
      <h3>Per categorie</h3>${catTable(S)}
      <h3>Antwoord en denkwijze</h3>
      <div class="quadgrid">${['A', 'B', 'C', 'D'].map((k) => `<div class="q${k}"><b>${quad[k]}×</b><span>${esc(RS.QUAD[k])}</span></div>`).join('')}</div>
      <h3>Per vraag</h3>
      <div class="tbl"><table><thead><tr><th>#</th><th>Onderdeel</th><th>Niv.</th><th>Antwoord</th><th>Redenering</th></tr></thead><tbody>
      ${R.map((r, i) => `<tr><td class="n">${i + 1}</td><td>${CATS[r.q.cat].name}<br><span class="muted small">${esc(r.q.kind)}</span></td><td class="n">${r.d}</td><td>${r.ok ? '✅' : '❌'}</td><td>${r.J ? ({ correct: '✅', inefficient: '✅ omslachtig', partial: '⚠️ deels', guess: '⚠️ gok', complex: '❌ te ingewikkeld', wrong: '❌' }[r.J.status]) : '—'}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="row" style="margin-top:16px"><button class="btn" id="gen">Genereer mijn Assessmentprofiel</button></div>`,
      (e) => { if (e.key === 'Enter') gen(); });
    const gen = () => { saveProfile(P); renderProfilePage(P, { title: 'Je Assessmentprofiel is klaar' }); };
    $('#gen').onclick = gen;
  }

  function finishRecal() {
    const base = RUN.baseProfile;
    const recs = toRecs(RUN.results);
    const P = PF.update(base, recs, { diag: recs.length });
    const lines = recs.map((r) => `${CATS[r.c].name} (niveau ${r.d}): ${r.ok ? 'goed' : 'fout'}${r.qd ? `, redenering ${RS.reasonOk(r.rs) ? 'correct' : 'niet correct'}` : ''}`);
    saveProfile(P);
    renderProfilePage(P, { title: `Herkalibratie klaar: profiel v${P.version}`, intro: `<p>Controlevragen:</p><ul class="list">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul><p class="muted small" style="margin-top:8px">Oude profielgegevens en nieuwe resultaten zijn gecombineerd. Bij weinig nieuwe vragen past het niveau maar voorzichtig aan.</p>` });
  }

  function renderReport(stopped) {
    const R = RUN.results;
    const n = R.length, ok = R.filter((r) => r.ok).length;
    const S = catStats(R.map((r) => ({ c: r.q.cat, ok: r.ok, t: r.ms, to: r.timedOut })));
    const used = CAT_IDS.filter((c) => S[c].n);
    const strong = used.filter((c) => S[c].n >= 2 && S[c].ok / S[c].n >= 0.75);
    const weak = used.filter((c) => S[c].ok / S[c].n < 0.6);
    const errs = {};
    R.filter((r) => r.err).forEach((r) => (errs[r.err] = (errs[r.err] || 0) + 1));
    const topErr = Object.entries(errs).sort((a, b) => b[1] - a[1])[0];
    const kindStats = {};
    R.forEach((r) => { const k = `${CATS[r.q.cat].name} – ${r.q.kind}`; kindStats[k] = kindStats[k] || { n: 0, ok: 0 }; kindStats[k].n++; if (r.ok) kindStats[k].ok++; });
    const goodKinds = Object.entries(kindStats).filter(([, v]) => v.n >= 2 && v.ok === v.n).map(([k]) => k);
    const badKinds = Object.entries(kindStats).filter(([, v]) => v.ok < v.n).sort((a, b) => (a[1].ok - a[1].n) - (b[1].ok - b[1].n)).slice(0, 4).map(([k, v]) => `${k} (${v.n - v.ok} fout)`);
    const timed = R.filter((r) => r.target), inTime = timed.filter((r) => !r.timedOut).length;
    const avg = (R.reduce((a, r) => a + r.ms, 0) / n / 1000).toFixed(0);
    let maxStreak = 0, cur = 0; R.forEach((r) => { cur = r.ok ? cur + 1 : 0; maxStreak = Math.max(maxStreak, cur); });
    const hints = R.filter((r) => r.hint).length, tos = R.filter((r) => r.timedOut).length;
    const withR = R.filter((r) => r.qd); const quad = { A: 0, B: 0, C: 0, D: 0 }; withR.forEach((r) => quad[r.qd]++);
    const goodList = [];
    if (strong.length) goodList.push(`Sterk in ${strong.map((c) => CATS[c].name).join(', ')}.`);
    if (goodKinds.length) goodList.push(`Foutloos: ${goodKinds.slice(0, 4).join('; ')}.`);
    if (withR.length && quad.A + quad.C >= withR.length * 0.6) goodList.push(`Je redenering klopte in ${quad.A + quad.C} van de ${withR.length} vragen.`);
    if (maxStreak >= 3) goodList.push(`Langste reeks goede antwoorden: ${maxStreak}.`);
    if (timed.length && inTime === timed.length) goodList.push('Alle vragen binnen de tijd beantwoord.');
    if (!goodList.length) goodList.push(ok ? `${ok} ${ok === 1 ? 'vraag' : 'vragen'} goed; bouw daarop voort.` : 'Je hebt de eerste stap gezet. Met de uitleg per vraag kom je verder.');
    const betterList = [];
    if (weak.length) betterList.push(`Onderdelen onder de 60%: ${weak.map((c) => CATS[c].name).join(', ')}.`);
    if (badKinds.length) betterList.push(`Patronen die fout gingen: ${badKinds.join('; ')}.`);
    if (topErr) betterList.push(`${topErr[0]}: ${TAG_ADVICE[topErr[0]] || ''}`);
    if (quad.B) betterList.push(`${quad.B}× een goed antwoord met een verkeerde redenering: die principes komen terug in je volgende training.`);
    if (tos) betterList.push(`${tos}× was de tijd op. Oefen eerst met lichte tijdsdruk en voer die daarna op.`);
    if (hints > n / 3) betterList.push(`Je gebruikte ${hints} hints. Probeer de volgende keer eerst zelf een regel te testen.`);
    if (!betterList.length) betterList.push('Weinig fouten. Verhoog de moeilijkheid of de tijdsdruk om verder te groeien.');
    let rec, recStart;
    const endLv = curLevel();
    if (weak.length) { rec = `🎯 Zwakke Punten Training, 10 vragen, met focus op ${weak.slice(0, 2).map((c) => CATS[c].name).join(' en ')}.`; recStart = () => { W = { mode: 5, label: '🎯 Zwakke Punten Training', s: { ...MODES[5].fixed, duration: 10, level: endLv }, steps: [], i: 0, weakCats: weak.slice(0, 2) }; renderSummary(); }; }
    else if (pct(ok, n) >= 85 && endLv >= 4) { rec = '⚓ Mariniers Training Mode (30 gemengde vragen) of een ⏱️ Assessment Simulatie met hoge tijdsdruk.'; recStart = () => { W = { mode: 3, label: '⚓ Mariniers Training Mode', s: { ...MODES[3].fixed, level: endLv }, steps: [], i: 0 }; renderSummary(); }; }
    else { rec = `🧠 Adaptieve Training, 20 vragen, startniveau ${endLv}.`; recStart = () => { W = { mode: 2, label: '🧠 Adaptieve Training', s: { ...MODES[2].def, ...MODES[2].fixed, level: endLv }, steps: [], i: 0 }; renderSummary(); }; }
    const meaningful = SESSION.pending.length >= 5;
    view(`<div class="report">
      <div class="eyebrow">${esc(RUN.label)}${stopped && RUN.total !== Infinity && R.length < RUN.total ? ' · voortijdig gestopt' : ''}</div>
      <h2>📊 Trainingsrapport</h2>
      <div class="kpis"><div><small>Totaalscore</small><b>${ok}/${n}</b></div><div><small>Nauwkeurigheid</small><b>${pct(ok, n)}%</b></div><div><small>Niveau aan het begin</small><b>${RUN.startLv}</b></div><div><small>Niveau aan het einde</small><b>${endLv}</b></div><div><small>Gem. tijd per vraag</small><b>${avg} s</b></div></div>
      ${meaningful ? `<div class="offer"><p><b>Wil je je Assessmentprofiel bijwerken met de resultaten van deze training?</b></p><div class="row"><button class="btn" id="upd">Ja, profiel bijwerken</button><button class="btn quiet" id="noupd">Nee</button></div></div>` : ''}
      <h3>Per onderdeel</h3>${catTable(S)}
      ${withR.length ? `<h3>Antwoord en denkwijze</h3><div class="quadgrid">${['A', 'B', 'C', 'D'].map((k) => `<div class="q${k}"><b>${quad[k]}×</b><span>${esc(RS.QUAD[k])}</span></div>`).join('')}</div>` : ''}
      <h3>Sterke onderdelen</h3><p>${strong.length ? strong.map((c) => CATS[c].name).join(', ') : 'Nog geen onderdeel met 75% of meer (bij minstens 2 vragen).'}</p>
      <h3>Zwakke onderdelen</h3><p>${weak.length ? weak.map((c) => CATS[c].name).join(', ') : 'Geen onderdelen onder de 60%.'}</p>
      <h3>Meest voorkomende fouttype</h3><p>${topErr ? `${esc(topErr[0])} (${topErr[1]}×)` : 'Geen fouten'}</p>
      <h3>Wat gaat al goed?</h3><ul class="list">${goodList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>Wat moet beter?</h3><ul class="list">${betterList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>Aanbevolen volgende training</h3><p>${esc(rec)}</p>
      <div class="row"><button class="btn" id="rec">Start aanbevolen training</button><button class="btn ghost" id="menu">Terug naar menu</button></div>
      <p class="muted small" style="margin-top:12px">Dit rapport gaat alleen over deze oefentraining. Het voorspelt niet of je het echte assessment haalt.</p>
      <h3>Alle vragen nakijken</h3>
      ${R.map((r, i) => `<details class="rev"><summary><span class="mark ${r.ok ? 'ok' : 'no'}">${r.ok ? '✓' : '✗'}</span><span>${i + 1}. ${CATS[r.q.cat].name} · ${esc(r.q.kind)}${r.qd ? ` · ${r.qd}` : ''}</span><span class="muted small" style="margin-left:auto">niveau ${r.d} · ${(r.ms / 1000).toFixed(0)} s${r.timedOut ? ' · tijd op' : ''}</span></summary>
        <div class="body">${stemHTML(r.q, { chosen: r.chosen })}<div class="fb"><h3>Uitleg</h3><ol>${r.q.steps.map((s) => `<li>${s}</li>`).join('')}</ol>${!r.ok && r.chosen != null ? `<p class="miss" style="margin-top:10px">Jouw antwoord ${LETTERS[r.chosen]}: ${esc(r.q.opts[r.chosen].why || '')}</p>` : ''}${r.J ? `<p class="small" style="margin-top:8px">Jouw redenering: ${esc(r.J.chosen.join('; '))}</p>` : ''}<p class="lesson" style="margin-top:10px">${esc(r.q.lesson)}</p></div></div></details>`).join('')}
    </div>`, (e) => { if (e.key === 'Escape') renderMenu(); });
    $('#rec').onclick = () => { RUN = null; recStart(); };
    $('#menu').onclick = renderMenu;
    if ($('#upd')) $('#upd').onclick = doProfileUpdate;
    if ($('#noupd')) $('#noupd').onclick = () => { $('.offer').remove(); toast('Oké. Je kunt later altijd UPDATE PROFIEL kiezen.'); };
  }

  /* ================= Tabs ================= */
  function showTab(t) {
    $$('nav.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    $('#app').hidden = t !== 'train';
    $('#info').hidden = t !== 'info';
  }
  $$('nav.tabs button').forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
  if (location.hash === '#selectie') showTab('info');
  renderStart();
})();
