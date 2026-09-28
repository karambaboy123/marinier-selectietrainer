/* Assessmentprofiel: opbouwen, samenvoegen, als tekst uitvoeren en weer inlezen */
(function (G) {
  'use strict';
  const MT = G.MT;
  const CATS = MT.CATS, CAT_IDS = MT.CAT_IDS;
  const ERR = MT.reason.ERR;
  const LEVEL_NAMES = { 1: 'Beginner', 2: 'Basis', 3: 'Gemiddeld', 4: 'Gevorderd', 5: 'Expert' };
  const PROFILE_ORDER = ['num', 'ana', 'log', 'dia', 'fig', 'abs'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const inc = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
  const top = (o, n = 3) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  function empty() {
    const cats = {};
    CAT_IDS.forEach((c) => (cats[c] = { n: 0, ok: 0, est: null, kOk: {}, kBad: {}, kFast: {}, errs: {} }));
    return { fmt: 'MST2', version: 0, date: today(), diag: 0, intake: {}, cats, errs: {}, quad: { A: 0, B: 0, C: 0, D: 0 }, rs: {}, fast: { n: 0, wrong: 0 }, total: { n: 0, ok: 0 }, numOk: [0, 0, 0, 0, 0, 0, 0], numBad: [0, 0, 0, 0, 0, 0, 0], notes: [], imported: null };
  }
  const FOUND = { arith: 0, prime: 1, sqdiff: 1, incdiff: 2, pow: 2, diffmul: 2, geo: 3, incmul: 3, plusmin: 4, altop: 4, altinc: 4, alt2: 5, fib: 6, trib: 6, mulminus: 6 };

  /** Voegt nieuwe antwoorden toe aan (een kopie van) een profiel. opts.diag = aantal diagnostische vragen. */
  function update(prev, answers, opts = {}) {
    const P = prev ? JSON.parse(JSON.stringify(prev)) : empty();
    if (!P.cats) Object.assign(P, empty());
    P.version = (P.version || 0) + 1;
    P.date = today();
    P.notes = [];
    if (opts.intake) P.intake = opts.intake;
    P.diag = (P.diag || 0) + (opts.diag || 0);
    const byCat = {};
    for (const a of answers) {
      (byCat[a.c] = byCat[a.c] || []).push(a);
      const C = P.cats[a.c];
      if (!C) continue;
      C.n++; P.total.n++;
      const kn = a.kn || a.k;
      if (a.ok) { C.ok++; P.total.ok++; inc(C.kOk, kn); if (a.fastOk) inc(C.kFast, kn); } else inc(C.kBad, kn);
      if (a.err) { inc(C.errs, a.err); inc(P.errs, a.err); }
      if (a.qd) inc(P.quad, a.qd);
      if (a.rs) inc(P.rs, a.rs);
      if (a.fast) { P.fast.n++; if (!a.ok) P.fast.wrong++; }
      if (a.c === 'num' && FOUND[a.k] != null) (a.ok && a.qd !== 'B' ? P.numOk : P.numBad)[FOUND[a.k]]++;
    }
    for (const c of Object.keys(byCat)) {
      const list = byCat[c];
      const newEst = clamp(list.reduce((s, a) => s + (a.ok ? a.d + 0.5 : a.d - 0.5), 0) / list.length, 1, 5);
      const C = P.cats[c];
      const oldN = C.n - list.length;
      if (C.est == null || oldN <= 0) C.est = newEst;
      else if (list.length < 5 && Math.abs(newEst - C.est) >= 1) {
        P.notes.push(`${CATS[c].name}: voorlopige ${newEst > C.est ? 'verbetering' : 'terugval'} zichtbaar, maar nog onvoldoende vragen (${list.length}) om het eerdere niveau definitief aan te passen.`);
        C.est = C.est + (newEst - C.est) * 0.25;
      } else {
        const w = Math.min(oldN, 10);
        C.est = (C.est * w + newEst * list.length) / (w + list.length);
      }
    }
    return P;
  }

  const catLevel = (C) => (C && C.est != null ? clamp(Math.round(C.est), 1, 5) : null);
  function overall(P) {
    let s = 0, w = 0;
    CAT_IDS.forEach((c) => { const C = P.cats[c]; if (C.n && C.est != null) { s += C.est * C.n; w += C.n; } });
    if (!w) return P.imported && P.imported.level ? P.imported.level : null;
    return clamp(Math.round(s / w), 1, 5);
  }
  function reliability(P) {
    const n = P.total.n, cats = CAT_IDS.filter((c) => P.cats[c].n).length;
    if (n < 8 || cats < 3) return 'laag';
    if (n < 20 || cats < 5) return 'redelijk';
    return 'hoog';
  }
  const acc = (C) => (C.n ? C.ok / C.n : 0);
  function weakCats(P, n = 2) {
    const tested = CAT_IDS.filter((c) => P.cats[c].n);
    const w = tested.filter((c) => acc(P.cats[c]) < 0.7 || catLevel(P.cats[c]) <= 2).sort((a, b) => acc(P.cats[a]) - acc(P.cats[b]) || (P.cats[a].est || 0) - (P.cats[b].est || 0));
    if (w.length) return w.slice(0, n);
    if (P.imported && P.imported.weakCats && P.imported.weakCats.length) return P.imported.weakCats.slice(0, n);
    return [];
  }
  function strongCats(P, n = 2) {
    return CAT_IDS.filter((c) => P.cats[c].n >= 2 && acc(P.cats[c]) >= 0.7).sort((a, b) => (P.cats[b].est || 0) - (P.cats[a].est || 0) || acc(P.cats[b]) - acc(P.cats[a])).slice(0, n);
  }

  const RULES = {
    [ERR.pattern]: 'Controleer een gevonden patroon altijd op álle getallen of figuren, niet alleen op de eerste twee.',
    [ERR.calc]: 'Reken de laatste stap rustig na voordat je een antwoord kiest.',
    [ERR.read]: 'Lees de vraag (en de legenda) twee keer en onderstreep wat er precies gevraagd wordt.',
    [ERR.logic]: '“Kan waar zijn” is niet hetzelfde als “volgt zeker”: zoek eerst een tegenvoorbeeld.',
    [ERR.assume]: 'Gebruik alleen de gegeven informatie, niet wat logisch klinkt of voor de hand ligt.',
    [ERR.exec]: 'Je aanpak is goed: schrijf de tussenstappen op, dan maak je minder uitvoeringsfouten.',
    [ERR.early]: 'Trek niet na één overgang of één voorbeeld al een conclusie.',
    [ERR.complex]: 'Probeer eerst de eenvoudigste regel en stop zodra die alles verklaart.',
    [ERR.time]: 'Blijf niet hangen: na de tijdslimiet gokken en doorgaan.',
  };

  function recommend(P) {
    const lv = overall(P) || 2;
    const weak = weakCats(P);
    const qn = Object.values(P.quad).reduce((a, b) => a + b, 0);
    const dShare = qn ? (P.quad.D + (P.quad.B || 0)) / qn : 0;
    let mode;
    if (qn >= 3 && dShare >= 0.4) mode = '1. 📚 Leren & Uitleggen';
    else if (weak.length) mode = '5. 🎯 Zwakke Punten Training';
    else if (lv >= 4) mode = '3. ⚓ Mariniers Training Mode';
    else mode = '2. 🧠 Adaptieve Training';
    const tooFast = P.fast.wrong >= 2;
    const timeouts = P.errs[ERR.time] || 0;
    let press = 'Normaal';
    if (tooFast) press = 'Licht (eerst nauwkeurig werken, dan pas sneller)';
    else if (timeouts >= 2) press = 'Licht, daarna Normaal';
    else if (P.intake.goal === 'Snelheid' || P.intake.goal === 'Beide') press = 'Normaal, daarna Adaptief';
    return { mode, level: lv, diff: `AUTO – start op ${lv}/5`, cats: weak.length ? weak.map((c) => CATS[c].name).join(', ') : 'Gemengd', press, count: lv <= 2 ? '10 vragen' : '20 vragen' };
  }

  function toText(P) {
    const lv = overall(P);
    const rel = reliability(P);
    const tested = CAT_IDS.filter((c) => P.cats[c].n);
    const ds = [];
    CAT_IDS.forEach((c) => { if (P.cats[c].n) ds.push(P.cats[c].est); });
    const I = P.imported || {};
    const L = [];
    L.push('================================', 'ASSESSMENTPROFIEL', '================================', '');
    L.push(`**Profielversie:** v${P.version}`, '', `**Datum:** ${P.date}`, '', `**Aantal diagnostische vragen:** ${P.diag || 0} (totaal verwerkte oefenvragen: ${P.total.n})`, '');
    L.push('Gemaakt met de Marinier Selectietrainer (onofficiële oefenomgeving). Zelfgemaakte oefenvragen, geen officiële vragen van Defensie of het Korps Mariniers.', '');
    L.push('## ALGEMEEN NIVEAU', '');
    L.push(`**Geschat trainingsniveau:** ${lv ? `${lv}/5 – ${LEVEL_NAMES[lv]}` : 'onvoldoende getest'}`, '');
    L.push(`**Aanbevolen startmoeilijkheid:** ${lv || 2}/5`, '');
    L.push(`**Betrouwbaarheid van inschatting:** ${rel}`, '');
    L.push(`Gebaseerd op ${P.total.n} vragen in ${tested.length} van de 6 categorieën${Object.values(P.quad).some(Boolean) ? `, waarvan ${Object.values(P.quad).reduce((a, b) => a + b, 0)} met opgegeven redenering` : ''}. Het niveau per categorie is geschat uit de moeilijkheid van goed en fout beantwoorde vragen.`, '');
    const it = P.intake || {};
    L.push(`**Ervaringsniveau (intake):** ${it.exp || I.exp || 'niet ingevuld'}`);
    if (it.goal) L.push(`**Trainingsdoel:** ${it.goal}`);
    if (it.hard && it.hard.length) L.push(`**Zelf moeilijk gevonden:** ${it.hard.join(', ')}`);
    if (it.easy && it.easy.length) L.push(`**Zelf makkelijk gevonden:** ${it.easy.join(', ')}`);
    if (it.struggle && it.struggle.length) L.push(`**Ervaart vooral moeite met:** ${it.struggle.join(', ')}`);
    if (it.practiced && it.practiced.length) L.push(`**Eerder geoefend:** ${it.practiced.join(', ')}`);
    P.notes.forEach((n) => L.push(`**Opmerking:** ${n}`));
    L.push('', '## RESULTATEN PER CATEGORIE', '');
    for (const c of PROFILE_ORDER) {
      const C = P.cats[c];
      L.push(`### ${CATS[c].name}`);
      if (!C.n) { L.push('Getest: 0', 'Goed: –', 'Fout: –', 'Geschat niveau: onvoldoende getest', `Observaties: ${(I.obs && I.obs[c]) || 'onvoldoende getest'}`, ''); continue; }
      const obs = [];
      const both = Object.keys(C.kOk).filter((k) => C.kBad[k]);
      const g = top(C.kOk, 3).map(([k]) => k).filter((k) => !both.includes(k)).slice(0, 2), b = top(C.kBad, 3).map(([k]) => k).filter((k) => !both.includes(k)).slice(0, 2), e = top(C.errs, 1)[0];
      if (g.length) obs.push(`goed bij ${g.join(', ').toLowerCase()}`);
      if (b.length) obs.push(`moeite met ${b.join(', ').toLowerCase()}`);
      if (both.length) obs.push(`wisselend bij ${both.slice(0, 2).join(', ').toLowerCase()}`);
      if (e) obs.push(`meest voorkomende fout: ${e[0].toLowerCase()}`);
      if (C.n < 3) obs.push('weinig vragen, inschatting voorlopig');
      const o = obs.join('; ');
      L.push(`Getest: ${C.n}`, `Goed: ${C.ok}`, `Fout: ${C.n - C.ok}`, `Geschat niveau: ${catLevel(C)}/5${C.n < 3 ? ' (voorlopig)' : ''}`, `Observaties: ${o.charAt(0).toUpperCase() + o.slice(1)}.`, '');
    }
    // Denkprofiel
    const qn = Object.values(P.quad).reduce((a, b) => a + b, 0);
    const rs = P.rs || {};
    const allOk = {}, allBad = {}, allFast = {};
    CAT_IDS.forEach((c) => { const C = P.cats[c]; for (const [k, v] of Object.entries(C.kOk)) allOk[`${CATS[c].name}: ${k}`] = v; for (const [k, v] of Object.entries(C.kBad)) allBad[`${CATS[c].name}: ${k}`] = v; for (const [k, v] of Object.entries(C.kFast)) allFast[`${CATS[c].name}: ${k}`] = v; });
    let approach;
    if (!qn) approach = I.approach || 'Nog onbekend: er zijn nog geen vragen met opgegeven redenering.';
    else {
      const good = (rs.correct || 0) + (rs.inefficient || 0);
      approach = `Kiest in ${good} van de ${qn} gevallen een correcte aanpak.`;
      if (rs.inefficient) approach += ` ${rs.inefficient}× een correcte maar omslachtige methode (bijv. alle opties uitproberen).`;
      if (rs.guess) approach += ` ${rs.guess}× aangegeven te gokken.`;
      if (rs.partial) approach += ` ${rs.partial}× maar een deel van de regels gezien.`;
    }
    const numLine = () => {
      const S = MT.reason.SEARCH;
      const okMax = P.numOk.reduce((m, v, i) => (v ? i : m), -1), badMin = P.numBad.findIndex((v) => v > 0);
      if (okMax < 0 && badMin < 0) return I.numApproach || 'Onvoldoende getest.';
      const parts = [];
      if (okMax >= 0) parts.push(`herkent patronen tot en met stap ${okMax + 1} van de zoekvolgorde (“${S[okMax].toLowerCase()}”)`);
      if (badMin >= 0) parts.push(`mist vaker patronen vanaf stap ${badMin + 1} (“${S[badMin].toLowerCase()}”)`);
      return parts.join('; ').replace(/^./, (x) => x.toUpperCase()) + '.';
    };
    const logLine = () => {
      const C = P.cats.log;
      if (!C.n) return I.logicApproach || 'Onvoldoende getest.';
      const g = top(C.kOk, 2).map(([k]) => k.toLowerCase()), b = top(C.kBad, 2).map(([k]) => k.toLowerCase());
      return `${C.ok}/${C.n} goed.${g.length ? ` Sterk bij ${g.join(', ')}.` : ''}${b.length ? ` Moeite met ${b.join(', ')}.` : ''}`;
    };
    L.push('## DENKPROFIEL', '');
    L.push(`**Mijn gebruikelijke aanpak:**`, approach, '');
    const qp = top(allFast, 3).map(([k]) => k);
    L.push(`**Patronen die ik snel herken:**`, qp.length ? qp.join('; ') : I.quick || 'Nog onvoldoende gegevens: nog geen patroon dat snel én met een goede redenering is opgelost.', '');
    L.push(`**Patronen waarmee ik moeite heb:**`, top(allBad, 3).map(([k, v]) => `${k} (${v}× fout)`).join('; ') || I.hard || 'Geen duidelijke probleempatronen gevonden.', '');
    L.push(`**Hoe ik cijferreeksen benader:**`, numLine(), '');
    L.push(`**Hoe ik logische vragen benader:**`, logLine(), '');
    L.push(`**Kwaliteit van mijn uitleg/redenering:**`, qn ? `A (goed + goed): ${P.quad.A} · B (goed antwoord, verkeerde redenering): ${P.quad.B} · C (fout antwoord, goede aanpak): ${P.quad.C} · D (fout + fout): ${P.quad.D}` : I.reasonQuality || 'Nog geen vragen met redenering.', '');
    const fw = P.fast.wrong;
    L.push(`**Neiging tot te snel antwoorden:**`, fw >= 3 ? `Duidelijk aanwezig: ${fw}× binnen enkele seconden een fout antwoord.` : fw ? `Soms: ${fw}× een snel fout antwoord.` : 'Geen aanwijzingen.', '');
    const cx = (rs.complex || 0) + (P.errs[ERR.complex] || 0);
    L.push(`**Neiging tot te ingewikkeld denken:**`, cx >= 2 ? `Aanwezig: ${cx}× een ingewikkelder patroon gezocht dan nodig.` : cx ? 'Eén keer gezien; nog geen patroon.' : 'Geen aanwijzingen.', '');
    // Fouten
    const errs = top(P.errs, 8);
    L.push('## SOORTEN FOUTEN', '');
    L.push(errs.length ? errs.map(([k, v]) => `- ${k}: ${v}×`).join('\n') : '- Nog geen fouten geregistreerd.', '');
    L.push(`**Meest voorkomende fout:** ${errs[0] ? errs[0][0] : I.mostErr || 'geen'}`, '', `**Tweede aandachtspunt:** ${errs[1] ? errs[1][0] : I.secondErr || 'geen'}`, '');
    // Sterk / zwak
    const strong = [], weak = [];
    strongCats(P, 2).forEach((c) => strong.push(`${CATS[c].name} (${P.cats[c].ok}/${P.cats[c].n} goed, niveau ${catLevel(P.cats[c])}/5)`));
    if (qn >= 3 && (P.quad.A + P.quad.C) / qn >= 0.6) strong.push('Redenering is meestal correct, ook als het antwoord niet klopt.');
    if (qp.length && strong.length < 3) strong.push(`Snel en correct bij: ${qp[0]}`);
    if (!strong.length && I.strengths) strong.push(...I.strengths.slice(0, 3));
    weakCats(P, 2).forEach((c) => { const C = P.cats[c]; if (C.n) weak.push(`${CATS[c].name} (${C.ok}/${C.n} goed${top(C.kBad, 1)[0] ? `, vooral ${top(C.kBad, 1)[0][0].toLowerCase()}` : ''})`); });
    if (errs[0] && weak.length < 3) weak.push(`Fouttype: ${errs[0][0].toLowerCase()} (${errs[0][1]}×)`);
    if (!weak.length && I.weaknesses) weak.push(...I.weaknesses.slice(0, 3));
    const fill = (a) => { const out = a.slice(0, 3); while (out.length < 3) out.push('Nog onvoldoende gegevens.'); return out; };
    L.push('## STERKE PUNTEN', '', ...fill(strong).map((s, i) => `${i + 1}. ${s}`), '');
    L.push('## ZWAKKE PUNTEN', '', ...fill(weak).map((s, i) => `${i + 1}. ${s}`), '');
    // Aanbevolen training
    const pr = [];
    weakCats(P, 3).forEach((c) => { const C = P.cats[c]; const k = top(C.kBad, 1)[0]; const e = top(C.errs, 1)[0]; pr.push([`${CATS[c].name}${k ? ` – ${k[0].toLowerCase()}` : ''}`, `${C.ok}/${C.n} goed${e ? `; meest voorkomende fout: ${e[0].toLowerCase()}` : ''}.`]); });
    CAT_IDS.filter((c) => !P.cats[c].n).slice(0, 3 - pr.length).forEach((c) => pr.push([CATS[c].name, 'Nog niet getest; eerst een beeld krijgen van dit onderdeel.']));
    if (pr.length < 3) pr.push(['Tempo en tijdsdruk', 'Nauwkeurigheid is op orde; nu snelheid opbouwen met Normaal → Adaptief.']);
    if (pr.length < 3) pr.push(['Moeilijkheid verhogen', 'Start één niveau hoger dan het huidige niveau.']);
    L.push('## AANBEVOLEN TRAINING', '');
    pr.slice(0, 3).forEach(([a, b], i) => L.push(`**Prioriteit ${i + 1}:** ${a}`, `**Waarom:** ${b}`, ''));
    const R = recommend(P);
    L.push('## AANBEVOLEN INSTELLINGEN', '', `**Trainingsmodus:** ${R.mode}`, `**Niveau:** ${R.level} – ${LEVEL_NAMES[R.level]}`, `**Moeilijkheid:** ${R.diff}`, `**Categorieën:** ${R.cats}`, `**Tijdsdruk:** ${R.press}`, `**Aantal vragen:** ${R.count}`, '');
    // Leerregels
    const rules = [];
    errs.forEach(([k]) => { if (RULES[k] && !rules.includes(RULES[k])) rules.push(RULES[k]); });
    if (P.cats.num.n && P.cats.num.ok < P.cats.num.n) rules.push('Bekijk bij cijferreeksen eerst de verschillen, en daarna pas ingewikkelder patronen.');
    if ((P.rs.partial || 0) > 0 || (P.cats.fig.errs[ERR.pattern] || 0) > 0) rules.push('Bekijk bij figuren elke eigenschap apart: richting, vulling, vorm, aantal.');
    if (!rules.length && I.rules) rules.push(...I.rules);
    if (!rules.length) rules.push('Blijf je gevonden regel op alle onderdelen controleren, ook als het snel gaat.');
    L.push('## PERSOONLIJKE LEERREGELS', '', ...[...new Set(rules)].slice(0, 5).map((r, i) => `${i + 1}. ${r}`), '');
    L.push('## TRAININGSINSTRUCTIE VOOR NIEUWE CHAT', '', '"Gebruik dit profiel als uitgangspunt voor mijn training. Voer geen volledige nulmeting uit tenzij ik daar expliciet om vraag. Pas vragen, uitleg en moeilijkheid aan op bovenstaande sterke en zwakke punten. Werk het profiel na voldoende nieuwe trainingsgegevens bij."', '');
    L.push(`Profielcode voor de Marinier Selectietrainer (niet aanpassen): ${encode(P)}`, '');
    L.push('================================', 'EINDE ASSESSMENTPROFIEL', '================================');
    return L.join('\n');
  }

  function encode(P) {
    const json = JSON.stringify(P);
    const b = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, 'utf8').toString('base64');
    return 'MST2:' + b;
  }
  function decode(s) {
    const json = typeof atob === 'function' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8');
    return JSON.parse(json);
  }

  /** Leest een geplakt profiel. Geeft {profile, missing[], source:'code'|'text'} of null. */
  function parse(text) {
    if (!text || text.trim().length < 20) return null;
    const m = text.match(/MST2:([A-Za-z0-9+/=]+)/);
    if (m) {
      try {
        const P = decode(m[1]);
        if (P && P.cats) return { profile: P, missing: [], source: 'code' };
      } catch (e) { /* val terug op tekst */ }
    }
    const P = empty();
    const I = (P.imported = {});
    const get = (re) => { const r = text.match(re); return r ? r[1].trim() : null; };
    const ver = get(/Profielversie:\**\s*v?(\d+)/i);
    P.version = ver ? Number(ver) : 0;
    const date = get(/Datum:\**\s*([^\n]+)/i);
    if (date) P.date = date.replace(/\*/g, '');
    const lvTxt = get(/Geschat trainingsniveau:\**\s*([^\n]+)/i);
    let lv = null;
    if (lvTxt) { const d = lvTxt.match(/[1-5]/); if (d) lv = Number(d[0]); else for (const [k, v] of Object.entries(LEVEL_NAMES)) if (lvTxt.toLowerCase().includes(v.toLowerCase())) lv = Number(k); }
    const sd = get(/startmoeilijkheid:\**\s*(\d)/i);
    I.level = lv || (sd ? Number(sd) : null);
    I.startDiff = sd ? Number(sd) : null;
    I.exp = get(/Ervaringsniveau[^:\n]*:\**\s*([^\n]+)/i);
    const names = { num: 'Cijferreeksen', ana: 'Analogie', log: 'Logisch redeneren', dia: 'Diagrammen', fig: 'Figuurreeksen', abs: 'Abstract redeneren' };
    I.obs = {};
    let anyCat = false;
    for (const [c, nm] of Object.entries(names)) {
      const idx = text.search(new RegExp('#+\\s*' + nm, 'i'));
      if (idx < 0) continue;
      const rest = text.slice(idx + 3);
      const end = rest.search(/\n#+\s/);
      const block = end >= 0 ? rest.slice(0, end) : rest;
      const n = block.match(/Getest:\**\s*(\d+)/i), ok = block.match(/Goed:\**\s*(\d+)/i), gl = block.match(/Geschat niveau:\**\s*(\d)/i), ob = block.match(/Observaties:\**\s*([^\n]+)/i);
      if (n && Number(n[1]) > 0) {
        anyCat = true;
        const C = P.cats[c];
        C.n = Number(n[1]); C.ok = ok ? Math.min(C.n, Number(ok[1])) : 0;
        C.est = gl ? Number(gl[1]) : I.level || 3;
        P.total.n += C.n; P.total.ok += C.ok;
      }
      if (ob) I.obs[c] = ob[1].trim();
    }
    const list = (hdr) => { const i = text.search(new RegExp('#+\\s*' + hdr, 'i')); if (i < 0) return []; const r = text.slice(i).split('\n').slice(1); const out = []; for (const l of r) { if (/^\s*#/.test(l)) break; const mm = l.match(/^\s*(?:\d+[.)]|[-*•])\s*(.+)/); if (mm && !/\[\.\.\.\]/.test(mm[1])) out.push(mm[1].trim()); } return out; };
    I.strengths = list('STERKE PUNTEN');
    I.weaknesses = list('ZWAKKE PUNTEN');
    I.rules = list('PERSOONLIJKE LEERREGELS');
    I.mostErr = get(/Meest voorkomende fout:\**\s*([^\n]+)/i);
    I.secondErr = get(/Tweede aandachtspunt:\**\s*([^\n]+)/i);
    I.approach = get(/gebruikelijke aanpak:\**\s*\n?([^\n]+)/i);
    I.numApproach = get(/cijferreeksen benader:\**\s*\n?([^\n]+)/i);
    I.logicApproach = get(/logische vragen benader:\**\s*\n?([^\n]+)/i);
    I.weakCats = CAT_IDS.filter((c) => I.weaknesses.some((w) => w.toLowerCase().includes(names[c].toLowerCase().slice(0, 8))));
    const missing = [];
    if (!ver && !date) missing.push('datum of versie');
    if (!I.exp) missing.push('ervaringsniveau');
    if (!anyCat) missing.push('geteste categorieën en resultaten');
    if (!I.strengths.length) missing.push('sterke punten');
    if (!I.weaknesses.length) missing.push('zwakke punten');
    if (!I.mostErr) missing.push('terugkerende fouten');
    if (!I.approach) missing.push('redeneerpatronen');
    if (!I.level) missing.push('aanbevolen niveau');
    if (!I.startDiff) missing.push('aanbevolen moeilijkheid');
    if (!anyCat && !I.level && !I.strengths.length) return null;
    return { profile: P, missing, source: 'text' };
  }

  MT.profile = { empty, update, toText, parse, overall, catLevel, weakCats, strongCats, reliability, recommend, LEVEL_NAMES };
})(typeof window !== 'undefined' ? window : globalThis);
