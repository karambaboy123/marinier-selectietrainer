/* C. Diagrammen: bewerkingen op een rij letters */
(function (G) {
  'use strict';
  const MT = G.MT;
  const { rand, pick, chance, shuffle, optCount, buildOptions, attempt } = MT.util;

  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const sh = (c, k) => AL[(AL.indexOf(c) + k + 26) % 26];
  const OPS = {
    rev: { n: 'Omkeren', f: (s) => s.slice().reverse(), inv: 'rev', lv: 1 },
    sw12: { n: '1e en 2e wisselen', f: (s) => [s[1], s[0], ...s.slice(2)], inv: 'sw12', lv: 1 },
    rotl: { n: 'Eerste naar achteren', f: (s) => [...s.slice(1), s[0]], inv: 'rotr', lv: 1 },
    rotr: { n: 'Laatste naar voren', f: (s) => [s[s.length - 1], ...s.slice(0, -1)], inv: 'rotl', lv: 1 },
    ends: { n: 'Eerste en laatste wisselen', f: (s) => [s[s.length - 1], ...s.slice(1, -1), s[0]], inv: 'ends', lv: 2 },
    sw23: { n: '2e en 3e wisselen', f: (s) => [s[0], s[2], s[1], ...s.slice(3)], inv: 'sw23', lv: 2 },
    up: { n: 'Elke letter 1 verder in het alfabet', f: (s) => s.map((c) => sh(c, 1)), inv: 'down', lv: 3 },
    down: { n: 'Elke letter 1 terug in het alfabet', f: (s) => s.map((c) => sh(c, -1)), inv: 'up', lv: 4 },
    up1: { n: 'Alleen de 1e letter 1 verder', f: (s) => [sh(s[0], 1), ...s.slice(1)], inv: null, lv: 4 },
  };
  const CONFUSE = { rotl: 'rotr', rotr: 'rotl', sw12: 'sw23', sw23: 'sw12', ends: 'rev', rev: 'ends', up: 'down', down: 'up', up1: 'up' };
  const SYMS = ['◆', '●', '▲', '■', '★', '✚'];
  const S = (a) => a.join('');
  const run = (s, ch) => ch.reduce((x, k) => OPS[k].f(x), s);

  function example(k, len) {
    const base = 'ABCDEF'.slice(0, len).split('');
    return `${S(base)}→${S(OPS[k].f(base))}`;
  }

  function one(d) {
    const len = d >= 4 ? 5 : 4;
    const chainLen = [0, 1, 2, rand(2, 3), 3, 4][d];
    const avail = Object.keys(OPS).filter((k) => OPS[k].lv <= d);
    const chain = [];
    while (chain.length < chainLen) {
      const k = pick(avail);
      if (chain[chain.length - 1] === k) continue;
      if (chain.length && OPS[chain[chain.length - 1]].inv === k) continue; // geen bewerking die de vorige opheft
      chain.push(k);
    }
    const legendSize = Math.min(avail.length, [0, 3, 4, 5, 6, 6][d]);
    const legendOps = shuffle([...new Set([...chain, ...shuffle(avail)])].slice(0, Math.max(legendSize, new Set(chain).size)));
    const sym = {};
    shuffle(SYMS).slice(0, legendOps.length).forEach((s, i) => (sym[legendOps[i]] = s));
    const input = shuffle('BCDFGHKLMNPRSTVW'.split('')).slice(0, len);
    const out = run(input, chain);
    if (S(out) === S(input)) return null;

    const types = ['out'];
    if (d >= 3) types.push('op', 'op');
    if (d >= 4 && chain.every((k) => OPS[k].inv)) types.push('in');
    const mode = pick(types);
    const n = optCount(d);
    const trace = (inp) => {
      const lines = [];
      let cur = inp;
      for (const k of chain) {
        const nx = OPS[k].f(cur);
        lines.push(`${S(cur)} → ${sym[k]} (${OPS[k].n.toLowerCase()}) → ${S(nx)}`);
        cur = nx;
      }
      return lines;
    };
    const opLabel = (k) => `<span class="opbox">${sym[k]}</span>`;

    let built, prompt, flowIn, flowOut, hole = -1, steps;
    if (mode === 'out') {
      const pool = [];
      const rv = run(input, chain.slice().reverse());
      pool.push({ v: rv, why: 'Je voerde de bewerkingen in de verkeerde volgorde uit. Werk altijd van links naar rechts.', tag: 'Volgorde van bewerkingen' });
      chain.forEach((k, i) => {
        const c = chain.slice(); c.splice(i, 1);
        pool.push({ v: run(input, c), why: `Je sloeg bewerking ${sym[k]} (${OPS[k].n.toLowerCase()}) over.`, tag: 'Bewerking overgeslagen' });
        if (CONFUSE[k]) {
          const c2 = chain.slice(); c2[i] = CONFUSE[k];
          pool.push({ v: run(input, c2), why: `Je verwarde ${sym[k]} (${OPS[k].n.toLowerCase()}) met “${OPS[CONFUSE[k]].n.toLowerCase()}”.`, tag: 'Bewerking verward' });
        }
      });
      for (let i = 0; i < 6; i++) {
        const c = shuffle(out.slice());
        pool.push({ v: c, why: 'De letters staan niet in de volgorde die de bewerkingen opleveren.', tag: 'Volgorde van bewerkingen' });
      }
      const P = [...shuffle(pool.slice(0, pool.length - 6)), ...pool.slice(pool.length - 6)].map((p) => ({ key: S(p.v), html: S(p.v), text: S(p.v), why: p.why, tag: p.tag }));
      built = buildOptions({ key: S(out), html: S(out), text: S(out) }, P, n);
      prompt = 'Wat komt eruit?';
      flowIn = S(input); flowOut = null;
      steps = trace(input);
    } else if (mode === 'op') {
      hole = rand(0, chain.length - 1);
      const good = legendOps.filter((k) => { const c = chain.slice(); c[hole] = k; return S(run(input, c)) === S(out); });
      if (good.length !== 1 || legendOps.length < n) return null;
      const P = shuffle(legendOps.filter((k) => k !== good[0])).map((k) => {
        const c = chain.slice(); c[hole] = k;
        return { key: k, html: `${opLabel(k)}<span class="small">${OPS[k].n}</span>`, text: `${sym[k]} ${OPS[k].n}`, tag: 'Bewerking verward', why: `Met ${sym[k]} (${OPS[k].n.toLowerCase()}) op die plek komt er ${S(run(input, c))} uit, niet ${S(out)}.` };
      });
      const g = good[0];
      built = buildOptions({ key: g, html: `${opLabel(g)}<span class="small">${OPS[g].n}</span>`, text: `${sym[g]} ${OPS[g].n}` }, P, n);
      prompt = 'Welke bewerking hoort op de plek van het vraagteken?';
      flowIn = S(input); flowOut = S(out);
      steps = [`Werk vanaf de invoer vooruit tot aan het vraagteken, en vanaf de uitkomst terug. Wat moet er op de lege plek gebeuren?`, ...trace(input)];
    } else {
      const invChain = chain.slice().reverse().map((k) => OPS[k].inv);
      const back = run(out, invChain);
      const P = [
        { v: run(out, chain), why: 'Je voerde de bewerkingen vooruit uit op de uitkomst. Je moet terugrekenen: van rechts naar links, met de omgekeerde bewerkingen.', tag: 'Verkeerde richting' },
        { v: run(out, chain.map((k) => OPS[k].inv)), why: 'Je gebruikte de omgekeerde bewerkingen, maar in de verkeerde volgorde. Begin bij de laatste.', tag: 'Volgorde van bewerkingen' },
        { v: run(out, chain.slice().reverse()), why: 'Je werkte van rechts naar links, maar vergat de bewerkingen om te keren.', tag: 'Verkeerde richting' },
        ...Array.from({ length: 6 }, () => ({ v: shuffle(back.slice()), why: 'Deze volgorde levert niet de gegeven uitkomst op.', tag: 'Rekenfout' })),
      ].map((p) => ({ key: S(p.v), html: S(p.v), text: S(p.v), why: p.why, tag: p.tag }));
      built = buildOptions({ key: S(back), html: S(back), text: S(back) }, P, n);
      prompt = 'Wat ging erin?';
      flowIn = null; flowOut = S(out);
      steps = [`Reken terug vanaf ${S(out)}: begin bij de laatste bewerking en doe telkens het omgekeerde.`, `Controle vooruit:`, ...trace(back)];
    }
    if (!built) return null;

    const legend = `<div class="legend">${legendOps.map((k) => `<div><span class="opbox">${sym[k]}</span><span>${OPS[k].n}<span class="ex">${example(k, len)}</span></span></div>`).join('')}</div>`;
    const boxes = chain.map((k, i) => `<span class="arr">→</span><span class="opbox ${i === hole ? 'q' : ''}">${i === hole ? '?' : sym[k]}</span>`).join('');
    const stem = `${legend}<div class="flow"><span class="str ${flowIn ? '' : 'q'}">${flowIn || '?'.repeat(len)}</span>${boxes}<span class="arr">→</span><span class="str ${flowOut ? '' : 'q'}">${flowOut || '?'.repeat(len)}</span></div>`;
    return {
      cat: 'dia', diff: d, kindId: 'dia-' + mode, meta: { mode, chainLen: chain.length }, kind: { out: 'Uitkomst bepalen', op: 'Ontbrekende bewerking', in: 'Terugrekenen' }[mode],
      prompt, stem, opts: built.opts, ans: built.ans, layout: mode === 'op' ? 'op' : 'mono',
      steps,
      hint: mode === 'in' ? 'Begin bij de uitkomst en doe de laatste bewerking eerst omgekeerd.' : 'Volg één letter door alle bewerkingen heen.',
      quick: 'Volg alleen de eerste letter van de uitkomst: waar komt die terecht? Daarmee streep je meestal al 2 of 3 opties weg.',
      lesson: mode === 'in' ? 'Terugrekenen = omgekeerde bewerkingen, in omgekeerde volgorde.' : 'Werk strikt van links naar rechts en schrijf elke tussenstap op.',
    };
  }

  function generate(d, opt = {}) {
    return attempt(() => {
      const q = one(d);
      if (q && opt.kind && q.kindId !== opt.kind && chance(0.8)) return null;
      return q;
    });
  }
  /* ---- Venn-diagrammen (Mariniers Training Mode) ----
   * Drie begrippen; kies het diagram dat hun onderlinge verhouding laat zien. */
  const { esc } = MT.util;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const VS = 'fill="none" stroke="currentColor" stroke-width="1.7"';
  const ven = (inner) => `<svg viewBox="0 0 100 60" style="width:118px;height:71px" role="img" aria-hidden="true">${inner}</svg>`;
  const C = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${VS}/>`;
  const E = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${VS}/>`;
  const SHAPES = {
    nest: ven(C(50, 30, 27) + C(50, 30, 18) + C(50, 30, 9)),
    in2d: ven(E(50, 30, 45, 26) + C(32, 30, 11) + C(68, 30, 11)),
    in2o: ven(E(50, 30, 45, 26) + C(41, 30, 14) + C(59, 30, 14)),
    tri: ven(C(50, 20, 16) + C(38, 40, 16) + C(62, 40, 16)),
    sep3: ven(C(17, 30, 13) + C(50, 30, 13) + C(83, 30, 13)),
    chain: ven(C(27, 30, 18) + C(50, 30, 18) + C(73, 30, 18)),
    insep: ven(C(32, 30, 25) + C(32, 30, 13) + C(82, 30, 14)),
    ovsep: ven(C(23, 30, 17) + C(43, 30, 17) + C(83, 30, 13)),
    nestover: ven(E(35, 30, 30, 24) + C(23, 30, 9) + E(67, 30, 30, 24)),
  };
  const GEN = {
    nest: 'drie begrippen die elk helemaal in het volgende passen',
    in2d: 'een groot begrip met daarin twee delen die elkaar niet raken',
    in2o: 'een groot begrip met daarin twee delen die elkaar overlappen',
    tri: 'drie begrippen die elkaar alle drie gedeeltelijk overlappen',
    sep3: 'drie begrippen zonder enige overlap',
    chain: 'drie begrippen waarvan alleen het middelste beide andere gedeeltelijk overlapt',
    insep: 'een begrip dat helemaal in een tweede past, plus een derde dat er los van staat',
    ovsep: 'twee begrippen die elkaar overlappen, plus een derde dat er los van staat',
    nestover: 'een begrip dat helemaal in een tweede past, terwijl een derde dat tweede gedeeltelijk overlapt',
  };
  const REASON = {
    nest: ([a, b, c]) => `${cap(a)} zijn altijd ${b}, en ${b} zijn altijd ${c}.`,
    in2d: ([c, a, b]) => `${cap(a)} en ${b} horen allebei bij ${c}, maar iets is nooit tegelijk ${a} en ${b}.`,
    in2o: ([c, a, b]) => `${cap(a)} en ${b} horen allebei bij ${c}, en sommige ${c} zijn tegelijk ${a} en ${b}.`,
    tri: ([a, b, c]) => `Elk paar overlapt: sommige ${a} zijn ook ${b}, sommige ${b} zijn ook ${c} en sommige ${a} zijn ook ${c}. Geen enkel begrip valt helemaal binnen een ander.`,
    sep3: ([a, b, c]) => `${cap(a)}, ${b} en ${c} sluiten elkaar volledig uit.`,
    chain: ([a, b, c]) => `${cap(b)} overlapt zowel ${a} als ${c}, maar ${a} en ${c} sluiten elkaar uit.`,
    insep: ([a, b, c]) => `${cap(a)} zijn altijd ${b}. ${cap(c)} heeft daar niets mee te maken.`,
    ovsep: ([a, b, c]) => `Sommige ${a} zijn ook ${b}. ${cap(c)} staat daar los van.`,
    nestover: ([a, b, c]) => `${cap(a)} zijn altijd ${b}. ${cap(c)} overlapt ${b} gedeeltelijk, maar nooit ${a}.`,
  };
  const NEAR = {
    in2d: ['in2o', 'nest'], in2o: ['in2d', 'tri'], nest: ['in2d', 'insep'], tri: ['chain', 'in2o'], sep3: ['ovsep', 'insep'],
    chain: ['tri', 'ovsep'], insep: ['nest', 'sep3'], ovsep: ['chain', 'sep3'], nestover: ['in2o', 'chain'],
  };
  // [soort, begrippen in de volgorde van REASON]
  const VEN = [
    ['in2d', 'dieren', 'honden', 'katten'], ['in2d', 'fruit', 'appels', 'bananen'], ['in2d', 'voertuigen', 'auto\'s', 'fietsen'], ['in2d', 'meubels', 'tafels', 'stoelen'],
    ['in2d', 'gebouwen', 'kerken', 'scholen'], ['in2d', 'groenten', 'wortels', 'uien'], ['in2d', 'gereedschappen', 'hamers', 'zagen'], ['in2d', 'hemellichamen', 'sterren', 'planeten'],
    ['in2o', 'mensen', 'vrouwen', 'studenten'], ['in2o', 'boeken', 'kinderboeken', 'prentenboeken'], ['in2o', 'films', 'komedies', 'familiefilms'], ['in2o', 'gebouwen', 'oude gebouwen', 'kerken'],
    ['in2o', 'planten', 'bomen', 'giftige planten'], ['in2o', 'voertuigen', 'elektrische voertuigen', 'fietsen'], ['in2o', 'gerechten', 'soepen', 'warme gerechten'], ['in2o', 'dieren', 'roofdieren', 'vogels'],
    ['in2o', 'kleding', 'sportkleding', 'jassen'], ['in2o', 'muziek', 'klassieke muziek', 'filmmuziek'],
    ['nest', 'poedels', 'honden', 'dieren'], ['nest', 'tulpen', 'bloemen', 'planten'], ['nest', 'sedans', 'auto\'s', 'voertuigen'], ['nest', 'eiken', 'bomen', 'planten'],
    ['nest', 'fregatten', 'schepen', 'vaartuigen'], ['nest', 'sonnetten', 'gedichten', 'teksten'], ['nest', 'Amsterdammers', 'Nederlanders', 'Europeanen'], ['nest', 'mussen', 'vogels', 'dieren'], ['nest', 'kleuters', 'kinderen', 'mensen'],
    ['tri', 'studenten', 'sporters', 'muzikanten'], ['tri', 'Nederlanders', 'fietsers', 'studenten'], ['tri', 'rokers', 'sporters', 'automobilisten'], ['tri', 'wandelaars', 'fotografen', 'vogelaars'],
    ['tri', 'lezers', 'reizigers', 'kookliefhebbers'], ['tri', 'kinderen', 'zwemmers', 'vegetariërs'],
    ['sep3', 'bloemen', 'schoenen', 'sterren'], ['sep3', 'honden', 'tafels', 'wolken'], ['sep3', 'boeken', 'vulkanen', 'fietsen'], ['sep3', 'kerken', 'bananen', 'vliegtuigen'], ['sep3', 'kussens', 'muren', 'vogels'],
    ['chain', 'kleine dieren', 'huisdieren', 'grote dieren'], ['chain', 'goedkope producten', 'biologische producten', 'dure producten'], ['chain', 'korte films', 'familiefilms', 'lange films'],
    ['chain', 'zomerkleding', 'katoenen kleding', 'winterkleding'], ['chain', 'jonge mensen', 'studenten', 'oude mensen'], ['chain', 'warme dranken', 'zoete dranken', 'koude dranken'], ['chain', 'kleine auto\'s', 'elektrische auto\'s', 'grote auto\'s'],
    ['insep', 'mussen', 'vogels', 'vlinders'], ['insep', 'appels', 'fruit', 'groenten'], ['insep', 'honden', 'dieren', 'planten'], ['insep', 'haaien', 'vissen', 'zoogdieren'],
    ['insep', 'pianos', 'muziekinstrumenten', 'gereedschappen'], ['insep', 'fietsen', 'voertuigen', 'gebouwen'],
    ['ovsep', 'studenten', 'sporters', 'vulkanen'], ['ovsep', 'vrouwen', 'artsen', 'bergen'], ['ovsep', 'kinderen', 'zwemmers', 'sterren'], ['ovsep', 'muzikanten', 'leraren', 'wolken'], ['ovsep', 'fietsers', 'Nederlanders', 'planeten'],
    ['nestover', 'dolfijnen', 'zoogdieren', 'landdieren'], ['nestover', 'koeien', 'zoogdieren', 'zeedieren'], ['nestover', 'kolibries', 'vogels', 'roofdieren'], ['nestover', 'struisvogels', 'vogels', 'zeedieren'],
  ];

  function vennQ(d, n = 4) {
    return attempt(() => {
      const [t, ...roles] = pick(VEN);
      const why = (T) => `Dit diagram laat zien: ${GEN[T]}. Bij deze begrippen klopt dat niet. ${REASON[t](roles)}`;
      const others = Object.keys(SHAPES).filter((k) => k !== t);
      const order = [...NEAR[t], ...shuffle(others.filter((k) => !NEAR[t].includes(k)))];
      const pool = order.map((T) => ({ key: T, html: SHAPES[T], text: cap(GEN[T]), why: why(T), tag: 'Relatie niet gelijk' }));
      const built = buildOptions({ key: t, html: SHAPES[t], text: cap(GEN[t]) }, pool, n);
      if (!built) return null;
      return {
        cat: 'dia', diff: 3, kindId: 'venn', kind: 'Venn-diagram', meta: { mode: 'venn', rule: t },
        prompt: 'Welk diagram laat de verhouding tussen deze drie begrippen het best zien?',
        stem: `<div class="venn">${shuffle(roles).map((r) => `<div>${esc(r)}</div>`).join('')}</div>`,
        opts: built.opts, ans: built.ans, layout: 'fig',
        steps: ['Bekijk elk paar begrippen apart: valt het ene altijd binnen het andere, kunnen ze tegelijk voorkomen, of sluiten ze elkaar uit?', REASON[t](roles), `Het diagram met precies deze verhoudingen toont ${GEN[t]}.`],
        hint: 'Vraag je per paar: valt het ene altijd binnen het andere, overlappen ze, of hebben ze niets met elkaar te maken?',
        quick: 'Zoek eerst het begrip dat de andere omvat (als dat er is). Kijk daarna of de overige twee elkaar overlappen of uitsluiten.',
        lesson: 'Bekijk elk paar apart: helemaal binnen, gedeeltelijk overlappend, of los van elkaar.',
      };
    });
  }

  MT.gens.dia = { generate: (d, opt = {}) => (opt.exam || opt.kind === 'venn' ? vennQ(d, opt.exam ? 4 : optCount(d)) : generate(d, opt)), OPS };
})(typeof window !== 'undefined' ? window : globalThis);
