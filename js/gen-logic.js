/* E. Logisch redeneren: volgorde, syllogismen, codes en redeneersommen */
(function (G) {
  'use strict';
  const MT = G.MT;
  const { rand, pick, chance, shuffle, esc, optCount, buildOptions, attempt } = MT.util;

  const NAMES = ['Anouk', 'Bram', 'Chris', 'Daan', 'Emma', 'Fleur', 'Gijs', 'Hamza', 'Iris', 'Jesse', 'Kim', 'Lars', 'Mila', 'Noah', 'Omar', 'Pim', 'Rik', 'Sara', 'Tess', 'Yara'];
  const DIMS = [
    { more: 'ouder', less: 'jonger', top: 'oudste', bot: 'jongste' },
    { more: 'langer', less: 'korter', top: 'langste', bot: 'kortste' },
    { more: 'sneller', less: 'langzamer', top: 'snelste', bot: 'langzaamste' },
    { more: 'zwaarder', less: 'lichter', top: 'zwaarste', bot: 'lichtste' },
    { more: 'sterker', less: 'zwakker', top: 'sterkste', bot: 'zwakste' },
  ];
  function perms(a) {
    if (a.length <= 1) return [a];
    const out = [];
    a.forEach((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).forEach((p) => out.push([x, ...p])));
    return out;
  }

  /* ---------- Volgorde ---------- */
  function orderQ(d) {
    const n = [0, 3, 4, 4, 5, 5][d];
    const names = shuffle(NAMES).slice(0, n);
    const truth = shuffle(names); // truth[0] = meest (oudste)
    const D = pick(DIMS);
    const rank = (p, x) => p.indexOf(x);
    // vraag
    const qs = [
      { t: `Wie is de ${D.top}?`, pos: 0 },
      { t: `Wie is de ${D.bot}?`, pos: n - 1 },
    ];
    if (n >= 4) qs.push({ t: `Wie is de op één na ${D.top}?`, pos: 1 }, { t: `Wie is de op één na ${D.bot}?`, pos: n - 2 });
    if (n === 5) qs.push({ t: `Wie staat precies in het midden?`, pos: 2 });
    const Q = d <= 1 ? qs[rand(0, 1)] : pick(qs);
    const all = perms(names);
    const facts = [];
    let cands = all;
    const allPairs = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) allPairs.push([truth[i], truth[j], j - i]);
    let pairPool = d <= 2 ? allPairs.filter((p) => p[2] === 1) : shuffle(allPairs).sort((a, b) => (d >= 4 ? 0 : a[2] - b[2]));
    if (d >= 4) pairPool = shuffle(allPairs);
    for (const [hi, lo] of pairPool) {
      const answers = new Set(cands.map((p) => p[Q.pos]));
      if (answers.size === 1 && facts.length >= n - 1) break;
      const next = cands.filter((p) => rank(p, hi) < rank(p, lo));
      if (next.length === cands.length) continue; // voegt niets toe
      facts.push([hi, lo]);
      cands = next;
    }
    const answers = new Set(cands.map((p) => p[Q.pos]));
    if (answers.size !== 1) return null;
    const ans = [...answers][0];
    const sentences = shuffle(facts).map(([hi, lo]) => (d >= 2 && chance(0.5) ? `${lo} is ${D.less} dan ${hi}.` : `${hi} is ${D.more} dan ${lo}.`));
    const fullKnown = cands.length === 1;
    const orderTxt = fullKnown ? truth.join(' > ') : null;
    const pool = shuffle(names.filter((x) => x !== ans)).map((x) => ({
      key: x, html: esc(x), text: x, tag: 'Volgorde verkeerd',
      why: fullKnown ? `${x} staat op plek ${truth.indexOf(x) + 1} van ${n} (van ${D.top} naar ${D.bot}).` : `${x} kan niet op die plek staan als je alle zinnen combineert.`,
    }));
    pool.push({ key: '?', html: 'Dat is niet te bepalen', text: 'Niet te bepalen', tag: 'Volgorde verkeerd', why: `Het is wel te bepalen: ${ans} is de enige die op die plek past.` });
    const built = buildOptions({ key: ans, html: esc(ans), text: ans }, pool, optCount(d));
    if (!built) return null;
    return {
      cat: 'log', diff: d, kindId: 'order', kind: 'Volgorde bepalen',
      prompt: Q.t,
      stem: `<ul class="facts">${sentences.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`,
      opts: built.opts, ans: built.ans, layout: 'text',
      steps: [
        `Zet iedereen op één lijn, van ${D.top} naar ${D.bot}. Schrijf “${D.less} dan” om naar “${D.more} dan”, zodat alle zinnen dezelfde kant op wijzen.`,
        fullKnown ? `De volgorde is: ${orderTxt}.` : `Niet de hele volgorde ligt vast, maar wel wie er op de gevraagde plek staat.`,
        `Antwoord: ${ans}.`,
      ],
      hint: `Schrijf alle zinnen om naar “${D.more} dan” en teken een lijn.`,
      quick: 'Teken een verticale lijn en zet de namen erop terwijl je leest. Omschrijven naar één richting voorkomt denkfouten.',
      lesson: `Draai elke zin om naar dezelfde richting (“${D.more} dan”) voordat je gaat ordenen.`,
    };
  }

  /* ---------- Syllogismen (met controle via alle mogelijke situaties) ---------- */
  const WORDS = ['blimpers', 'kroters', 'spanels', 'dolvers', 'grimsels', 'plofters', 'zwakels', 'murvels', 'tringels', 'flonters', 'snaters', 'pluimers'];
  // uitspraak: {t:'A'|'E'|'I'|'O', x, y}
  const say = (s, W) => ({
    A: `Alle ${W[s.x]} zijn ${W[s.y]}.`,
    E: `Geen enkele ${W[s.x].replace(/s$/, '')} is een ${W[s.y].replace(/s$/, '')}.`,
    I: `Sommige ${W[s.x]} zijn ${W[s.y]}.`,
    O: `Sommige ${W[s.x]} zijn geen ${W[s.y]}.`,
  }[s.t]);
  function holds(s, regions) {
    const hasX = (r) => (r >> s.x) & 1, hasY = (r) => (r >> s.y) & 1;
    switch (s.t) {
      case 'A': return !regions.some((r) => hasX(r) && !hasY(r));
      case 'E': return !regions.some((r) => hasX(r) && hasY(r));
      case 'I': return regions.some((r) => hasX(r) && hasY(r));
      case 'O': return regions.some((r) => hasX(r) && !hasY(r));
    }
  }
  function models(nSets, premises) {
    const regs = [];
    for (let r = 1; r < 1 << nSets; r++) regs.push(r);
    const out = [];
    for (let m = 1; m < 1 << regs.length; m++) {
      const occ = regs.filter((_, i) => (m >> i) & 1);
      let ok = true;
      for (let s = 0; s < nSets && ok; s++) if (!occ.some((r) => (r >> s) & 1)) ok = false; // alle groepen bestaan
      if (ok && premises.every((p) => holds(p, occ))) out.push(occ);
    }
    return out;
  }
  // Sjablonen: premissen + geldige conclusie. Termen 0,1,2(,3)
  const SYL = [
    { lv: 2, n: 3, p: [['A', 0, 1], ['A', 1, 2]], c: ['A', 0, 2], ex: 'Alle 1 zijn 2, en alle 2 zijn 3. Dus zijn alle 1 ook 3.' },
    { lv: 2, n: 3, p: [['A', 0, 1], ['E', 1, 2]], c: ['E', 0, 2], ex: 'Alle 1 zijn 2, en 2 en 3 hebben niets gemeen. Dus hebben 1 en 3 ook niets gemeen.' },
    { lv: 3, n: 3, p: [['I', 0, 1], ['A', 1, 2]], c: ['I', 0, 2], ex: 'Sommige 1 zijn 2, en alle 2 zijn 3. Die “sommige” zijn dus ook 3.' },
    { lv: 3, n: 3, p: [['I', 0, 1], ['E', 1, 2]], c: ['O', 0, 2], ex: 'Sommige 1 zijn 2, en 2 en 3 hebben niets gemeen. Die “sommige” 1 zijn dus geen 3.' },
    { lv: 4, n: 3, p: [['A', 0, 1], ['O', 2, 1]], c: ['O', 2, 0], ex: 'Alle 1 zijn 2. Sommige 3 zijn geen 2, dus kunnen die ook geen 1 zijn.' },
    { lv: 4, n: 3, p: [['A', 1, 0], ['A', 1, 2]], c: ['I', 0, 2], ex: 'Alle 2 zijn zowel 1 als 3. Omdat er 2 bestaan, zijn er dus 1 die ook 3 zijn.' },
    { lv: 5, n: 4, p: [['A', 0, 1], ['A', 1, 2], ['E', 2, 3]], c: ['E', 0, 3], ex: 'Alle 1 zijn 2, alle 2 zijn 3, en 3 en 4 hebben niets gemeen. Dus hebben 1 en 4 ook niets gemeen.' },
    { lv: 5, n: 4, p: [['I', 0, 1], ['A', 1, 2], ['E', 2, 3]], c: ['O', 0, 3], ex: 'Sommige 1 zijn 2, alle 2 zijn 3, en 3 en 4 hebben niets gemeen. Die “sommige” 1 zijn dus geen 4.' },
  ];
  const cache = new Map();
  function sylQ(d) {
    const T = pick(SYL.filter((s) => s.lv <= d && s.lv >= d - 2));
    const W = shuffle(WORDS).slice(0, T.n);
    const prem = T.p.map(([t, x, y]) => ({ t, x, y }));
    const ck = JSON.stringify(T.p);
    if (!cache.has(ck)) cache.set(ck, models(T.n, prem));
    const M = cache.get(ck);
    const valid = (s) => M.every((occ) => holds(s, occ));
    const possible = (s) => M.some((occ) => holds(s, occ));
    const concl = { t: T.c[0], x: T.c[1], y: T.c[2] };
    if (!valid(concl)) throw new Error('Sjabloon ongeldig');
    const cands = [];
    for (const t of ['A', 'E', 'I', 'O']) for (let x = 0; x < T.n; x++) for (let y = 0; y < T.n; y++) if (x !== y) cands.push({ t, x, y });
    const isPrem = (s) => prem.some((p) => p.t === s.t && p.x === s.x && p.y === s.y);
    const bad = cands.filter((s) => !valid(s) && !isPrem(s));
    // meest verleidelijk: zelfde termen als de conclusie
    const same = (s) => (s.x === concl.x && s.y === concl.y) || (s.x === concl.y && s.y === concl.x);
    const ordered = [...shuffle(bad.filter(same)), ...shuffle(bad.filter((s) => !same(s)))];
    const pool = ordered.map((s) => ({
      key: s.t + s.x + s.y, html: esc(say(s, W)), text: say(s, W),
      tag: possible(s) ? 'Mogelijk maar niet zeker' : 'In strijd met de gegevens',
      why: possible(s) ? 'Dit kán waar zijn, maar het volgt niet zeker uit de gegevens.' : 'Dit is in strijd met de gegevens: het kan dus niet waar zijn.',
    }));
    const built = buildOptions({ key: concl.t + concl.x + concl.y, html: esc(say(concl, W)), text: say(concl, W) }, pool, optCount(d));
    if (!built) return null;
    let ex = T.ex;
    for (let i = T.n; i >= 1; i--) ex = ex.split(String(i)).join(W[i - 1]);
    return {
      cat: 'log', diff: d, kindId: 'syl', kind: 'Syllogisme (wat volgt zeker?)',
      prompt: 'Welke conclusie volgt zeker uit de gegevens?',
      stem: `<ul class="facts">${shuffle(prem).map((p) => `<li>${esc(say(p, W))}</li>`).join('')}</ul><p class="muted small">Ga ervan uit dat alle genoemde groepen bestaan. Gebruik alleen deze gegevens.</p>`,
      opts: built.opts, ans: built.ans, layout: 'text',
      steps: ['Teken elke groep als een cirkel en zet de cirkels zo neer als de zinnen zeggen.', ex, 'Een conclusie volgt alleen “zeker” als ze in elke tekening die bij de gegevens past waar is.'],
      hint: 'Teken de groepen als cirkels. Zoek een tekening waarin een optie niet klopt: dan valt die af.',
      quick: 'Probeer bij elke optie een tegenvoorbeeld te bedenken. Lukt dat, dan volgt die optie niet zeker.',
      lesson: '“Kan waar zijn” is niet hetzelfde als “volgt zeker”.',
    };
  }

  /* ---------- Geheimschrift ---------- */
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const CW = ['KAMP', 'BOOT', 'DUIK', 'TANK', 'MARS', 'SCHIP', 'HAVEN', 'LAARS', 'ANKER', 'RADAR', 'KUST', 'STORM', 'GOLF', 'DEK', 'WACHT', 'VLOOT', 'TOUW', 'KOERS', 'ROER', 'MAST', 'PIER', 'BRUG', 'DOEL', 'RUGZAK', 'HELM'];
  const enc = (w, f) => f(w.split('').map((c) => AL.indexOf(c))).map((i) => AL[((i % 26) + 26) % 26]).join('');
  const CODES = [
    { id: 'p1', lv: 1, n: 'elke letter 1 plek verder in het alfabet', f: (a) => a.map((x) => x + 1) },
    { id: 'm1', lv: 1, n: 'elke letter 1 plek terug in het alfabet', f: (a) => a.map((x) => x - 1) },
    { id: 'p2', lv: 2, n: 'elke letter 2 plekken verder', f: (a) => a.map((x) => x + 2) },
    { id: 'rev', lv: 2, n: 'het woord achterstevoren', f: (a) => a.slice().reverse() },
    { id: 'revp1', lv: 3, n: 'achterstevoren én elke letter 1 verder', f: (a) => a.slice().reverse().map((x) => x + 1) },
    { id: 'alt', lv: 3, n: 'om en om 1 verder en 1 terug', f: (a) => a.map((x, i) => x + (i % 2 ? -1 : 1)) },
    { id: 'pos', lv: 4, n: 'de 1e letter +1, de 2e +2, de 3e +3, …', f: (a) => a.map((x, i) => x + i + 1) },
    { id: 'm2', lv: 2, n: 'elke letter 2 plekken terug', f: (a) => a.map((x) => x - 2) },
  ];
  function codeQ(d) {
    const R = pick(CODES.filter((c) => c.lv <= d && c.lv >= d - 2));
    const [w1, w2] = shuffle(CW);
    const noWrap = (w) => w.split('').every((c) => { const i = AL.indexOf(c); return i >= 3 && i <= 21; });
    if (d <= 2 && (!noWrap(w1) || !noWrap(w2))) return null;
    if (w1.length === w2.length && d <= 1) return null;
    const e1 = enc(w1, R.f), ans = enc(w2, R.f);
    const fits = CODES.filter((c) => enc(w1, c.f) === e1);
    if (fits.some((c) => enc(w2, c.f) !== ans)) return null;
    const pool = shuffle(CODES.filter((c) => c !== R)).map((c) => {
      const v = enc(w2, c.f);
      return { key: v, html: v, text: v, tag: 'Verkeerde regel', why: `Dit is de code “${c.n}”. Dan zou ${w1} als ${enc(w1, c.f)} geschreven worden, niet als ${e1}.` };
    });
    // één letter fout
    for (let i = 0; i < 3; i++) {
      const arr = ans.split('');
      const j = rand(0, arr.length - 1);
      arr[j] = AL[(AL.indexOf(arr[j]) + pick([1, -1]) + 26) % 26];
      pool.push({ key: arr.join(''), html: arr.join(''), text: arr.join(''), tag: 'Rekenfout', why: 'Eén letter is verkeerd omgezet. Controleer letter voor letter.' });
    }
    const built = buildOptions({ key: ans, html: ans, text: ans }, pool, optCount(d));
    if (!built) return null;
    return {
      cat: 'log', diff: d, kindId: 'code', kind: 'Geheimschrift',
      prompt: `In een geheimtaal wordt ${w1} geschreven als ${e1}. Hoe schrijf je ${w2}?`,
      stem: `<div class="analogy mono"><b>${w1}</b><span class="op">→</span><b>${e1}</b></div><div class="analogy mono"><b>${w2}</b><span class="op">→</span><span class="gap">?</span></div>`,
      opts: built.opts, ans: built.ans, layout: 'mono',
      steps: [`Vergelijk ${w1} en ${e1} letter voor letter.`, `De code is: ${R.n}.`, `${w2} wordt dan ${ans}.`],
      hint: 'Zet het alfabet op papier en tel hoeveel plekken elke letter verschuift.',
      quick: 'Check alleen de eerste en laatste letter van de opties. Daarmee valt de rest vaak al af.',
      lesson: 'Schrijf bij twijfel het alfabet uit; tellen in je hoofd geeft snel fouten.',
    };
  }

  /* ---------- Redeneersommen ---------- */
  const hm = (min) => { const h = Math.floor(min / 60), m = min % 60; return m ? `${h} uur en ${m} min` : `${h} uur`; };
  const clock = (min) => { min = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; };
  const SUMS = [
    { lv: [1, 3], make() {
      const v = pick([4, 5, 6]), mins = pick([30, 45, 60, 75, 90, 120, 150, 180, 210]), km = (v * mins) / 60;
      if (km % 0.5) return null;
      const kmT = String(km).replace('.', ',');
      const hrs = km / v, h = Math.floor(hrs), fr = Math.round((hrs - h) * 100);
      const wrong = [{ m: mins + 30, why: 'Reken na: tijd = afstand ÷ snelheid.' }, { m: mins - 15, why: 'Reken na: tijd = afstand ÷ snelheid.' }, { m: mins + 15, why: 'Reken na: tijd = afstand ÷ snelheid.' }];
      if (fr) wrong.unshift({ m: h * 60 + fr, why: `Je las ${String(hrs).replace('.', ',')} uur als ${h} uur en ${fr} minuten. Maar een uur heeft 60 minuten, geen 100.` });
      return { q: `Een groep marcheert met een snelheid van ${v} km per uur. Hoe lang doet de groep over ${kmT} km?`, a: hm(mins), vals: wrong.filter((x) => x.m > 0 && x.m !== mins).map((x) => ({ v: hm(x.m), why: x.why })),
        steps: [`Tijd = afstand ÷ snelheid = ${kmT} ÷ ${v} = ${String(km / v).replace('.', ',')} uur.`, `${String(km / v).replace('.', ',')} uur = ${hm(mins)}.`], kind: 'Snelheid, afstand, tijd', lesson: 'Tijd = afstand ÷ snelheid. Een half uur is 30 minuten, niet 50.' };
    } },
    { lv: [1, 3], make() {
      const start = rand(18, 23) * 60 + pick([0, 15, 30, 45]), dur = rand(5, 9) * 60 + pick([10, 20, 35, 40, 50]);
      const end = start + dur;
      return { q: `Een wacht begint om ${clock(start)} en duurt ${hm(dur)}. Hoe laat is de wacht voorbij?`, a: clock(end), vals: [{ v: clock(end + 60), why: 'Je telde een uur te veel.' }, { v: clock(end - 60), why: 'Je telde een uur te weinig.' }, { v: clock(end - (dur % 60)), why: 'Je vergat de minuten op te tellen.' }, { v: clock(end + 10), why: 'De minuten kloppen niet.' }],
        steps: [`${clock(start)} + ${Math.floor(dur / 60)} uur = ${clock(start + Math.floor(dur / 60) * 60)}.`, `Daarna nog ${dur % 60} minuten erbij: ${clock(end)}. Let op middernacht.`], kind: 'Kloktijden', lesson: 'Tel eerst de hele uren op en daarna pas de minuten.' };
    } },
    { lv: [2, 4], make() {
      const a = pick([2, 3, 4, 6]), t = pick([6, 8, 12, 9]), b = pick([3, 4, 6, 8, 2].filter((x) => x !== a)), tot = a * t;
      if (tot % b) return null;
      const r = tot / b;
      return { q: `${a} mariniers graven samen een stelling in ${t} uur. Hoe lang doen ${b} mariniers erover, als iedereen even hard werkt?`, a: `${r} uur`, vals: [{ v: `${(t * b) / a} uur`, why: 'Je rekende alsof meer mensen er langer over doen. Meer mensen = minder tijd.' }, { v: `${r + 1} uur`, why: 'Rekenfout.' }, { v: `${Math.max(1, r - 1)} uur`, why: 'Rekenfout.' }, { v: `${t + (a - b)} uur`, why: 'Je rekende met optellen en aftrekken. Dit is een omgekeerd evenredige som.' }].filter((x) => x.v !== `${r} uur`),
        steps: [`Totaal werk = ${a} mariniers × ${t} uur = ${tot} “manuren”.`, `Met ${b} mariniers: ${tot} ÷ ${b} = ${r} uur.`], kind: 'Omgekeerd evenredig', lesson: 'Meer mensen, minder tijd: reken eerst het totaal aantal manuren uit.' };
    } },
    { lv: [3, 5], make() {
      const n = pick([200, 240, 300, 360, 400, 480, 600]), p = pick([10, 20, 25, 30, 40]), fr = pick([[1, 4], [1, 3], [1, 2], [2, 3]]);
      const after1 = n - (n * p) / 100;
      if (after1 % 1 || (after1 * fr[0]) % fr[1]) return null;
      const out = (after1 * fr[0]) / fr[1];
      const r = after1 - out;
      const wrong1 = n - (n * p) / 100 - (n * fr[0]) / fr[1];
      return { q: `Van ${n} kandidaten valt ${p}% af bij de sporttest. Van de rest valt daarna nog ${fr[0]}/${fr[1]} deel af bij het gesprek. Hoeveel kandidaten blijven er over?`, a: String(r), vals: [{ v: String(wrong1), why: `Je nam ${fr[0]}/${fr[1]} van alle ${n} kandidaten. Het gaat om ${fr[0]}/${fr[1]} van de rest.` }, { v: String(out), why: 'Dat is het aantal dat afvalt bij het gesprek, niet het aantal dat overblijft.' }, { v: String(after1), why: 'Je vergat de tweede ronde.' }, { v: String(r + 10), why: 'Rekenfout.' }].filter((x) => x.v !== String(r) && Number(x.v) > 0),
        steps: [`${p}% van ${n} = ${(n * p) / 100}. Er blijven ${after1} over.`, `${fr[0]}/${fr[1]} van ${after1} = ${out} vallen af. Er blijven ${r} over.`], kind: 'Procenten en breuken', lesson: 'Let op: “van de rest” betekent dat je met het nieuwe aantal verder rekent.' };
    } },
    { lv: [4, 5], make() {
      const p = pick([10, 12, 15, 20]), dd = pick([15, 20, 24, 30]), passed = pick([3, 5, 6, 10]), extra = pick([5, 8, 10, 15, 20]);
      const left = (dd - passed) * p;
      if (passed >= dd || left % (p + extra)) return null;
      const r = left / (p + extra);
      return { q: `Een voorraad eten is genoeg voor ${p} mariniers gedurende ${dd} dagen. Na ${passed} dagen komen er ${extra} mariniers bij. Hoeveel dagen doen ze nog met de rest van de voorraad?`, a: `${r} dagen`, vals: [{ v: `${(dd * p) / (p + extra)} dagen`, why: `Je vergat dat er al ${passed} dagen voorbij waren.` }, { v: `${dd - passed - extra} dagen`, why: 'Je trok mensen af van dagen. Reken met “mandagen”.' }, { v: `${r + 1} dagen`, why: 'Rekenfout.' }, { v: `${dd - passed} dagen`, why: 'Met meer mensen gaat de voorraad sneller op.' }].filter((x) => x.v !== `${r} dagen` && !x.v.includes('.') && !x.v.startsWith('-') && !x.v.startsWith('0')),
        steps: [`Na ${passed} dagen is er nog eten voor ${p} mariniers × ${dd - passed} dagen = ${left} mandagen.`, `Nu zijn er ${p + extra} mariniers: ${left} ÷ ${p + extra} = ${r} dagen.`], kind: 'Voorraad (mandagen)', lesson: 'Reken met één totaal (mandagen) en verdeel dat daarna.' };
    } },
  ];
  function sumQ(d) {
    const S = pick(SUMS.filter((s) => d >= s.lv[0] && d <= s.lv[1]));
    const r = S.make();
    if (!r) return null;
    const pool = shuffle(r.vals).map((x) => ({ key: x.v, html: esc(x.v), text: x.v, why: x.why, tag: /Rekenfout/.test(x.why) ? 'Rekenfout' : 'Verkeerde regel' }));
    const built = buildOptions({ key: r.a, html: esc(r.a), text: r.a }, pool, Math.min(optCount(d), pool.length + 1));
    if (!built || built.opts.length < 4) return null;
    return {
      cat: 'log', diff: d, kindId: 'sum', kind: r.kind,
      prompt: r.q, stem: '', opts: built.opts, ans: built.ans, layout: 'text',
      steps: r.steps, hint: 'Schrijf de gegevens eerst op in een klein lijstje.',
      quick: 'Schat eerst het antwoord. Opties die ver van je schatting af liggen, kun je meteen wegstrepen.',
      lesson: r.lesson,
    };
  }

  function generate(d, opt = {}) {
    const kinds = d <= 1 ? ['order', 'code', 'sum'] : ['order', 'syl', 'code', 'sum'];
    const k = opt.kind && kinds.includes(opt.kind) ? opt.kind : pick(kinds);
    return attempt(() => ({ order: orderQ, syl: sylQ, code: codeQ, sum: sumQ }[k](d)));
  }
  MT.gens.log = { generate, _models: models, _holds: holds, SYL };
})(typeof window !== 'undefined' ? window : globalThis);
