/* F. Abstract redeneren: welke hoort er niet bij, figuuranalogieën en matrices */
(function (G) {
  'use strict';
  const MT = G.MT;
  const { rand, pick, chance, shuffle, optCount, buildOptions, attempt } = MT.util;
  const F = MT.fig;
  const { norm, SHAPE_NL, FILL_NL, DIR_NL, CORNERS } = F;
  const FILLS = ['empty', 'full', 'half'];
  const randFig = (d) => ({ shape: pick(F.SHAPES), fill: pick(FILLS), rot: rand(0, 7) * (d <= 2 ? 90 : 45) % 360, dots: rand(0, 5) });
  const axis = (r) => (norm(r) % 180 === 0 ? 'v' : norm(r) % 180 === 90 ? 'h' : 'd');

  /* ---------- Welke hoort er niet bij ---------- */
  const ODD = [
    { id: 'shape', lv: [1, 3], name: 'Zelfde vorm', rule: 'Alle andere figuren hebben dezelfde vorm.',
      setup() { this.s = pick(F.SHAPES); }, sat(f) { return f.shape === this.s; },
      make(ok) { const f = randFig(3); f.shape = ok ? this.s : pick(F.SHAPES.filter((x) => x !== this.s)); return f; },
      ex(f) { return `Een ${SHAPE_NL[f.shape]}.`; } },
    { id: 'fill', lv: [2, 3], name: 'Zelfde vulling', rule: 'Alle andere figuren hebben dezelfde vulling.',
      setup() { this.v = pick(FILLS); }, sat(f) { return f.fill === this.v; },
      make(ok) { const f = randFig(3); f.fill = ok ? this.v : pick(FILLS.filter((x) => x !== this.v)); return f; },
      ex(f) { return `Deze is ${FILL_NL[f.fill]}.`; } },
    { id: 'parity', lv: [2, 4], name: 'Even of oneven stippen', rule: '',
      setup() { this.even = chance(0.5); this.rule = `Alle andere figuren hebben een ${this.even ? 'even' : 'oneven'} aantal stippen.`; },
      sat(f) { return (f.dots % 2 === 0) === this.even; },
      make(ok) { const f = randFig(3); const wantEven = ok ? this.even : !this.even; f.dots = pick([0, 1, 2, 3, 4, 5, 6].filter((x) => (x % 2 === 0) === wantEven && x > 0)); return f; },
      ex(f) { return `${f.dots} stippen: ${f.dots % 2 === 0 ? 'even' : 'oneven'}.`; } },
    { id: 'axis', lv: [3, 4], name: 'Richting van de pijl', rule: '',
      setup() { this.ax = pick(['v', 'h']); this.rule = `Bij alle andere figuren wijst de pijl ${this.ax === 'v' ? 'recht omhoog of omlaag' : 'recht naar links of rechts'}.`; },
      sat(f) { return axis(f.rot) === this.ax; },
      make(ok) { const f = randFig(3); const v = this.ax === 'v' ? [0, 180] : [90, 270]; f.rot = ok ? pick(v) : pick([0, 45, 90, 135, 180, 225, 270, 315].filter((r) => !v.includes(r))); return f; },
      ex(f) { return `Pijl wijst ${DIR_NL[norm(f.rot)]}.`; } },
    { id: 'corners', lv: [3, 5], name: 'Stippen = hoeken', rule: 'Bij alle andere figuren is het aantal stippen gelijk aan het aantal hoeken van de vorm.',
      setup() {}, sat(f) { return f.dots === CORNERS[f.shape]; },
      make(ok) { const f = randFig(3); f.shape = pick(F.SHAPES.filter((s) => s !== 'circle')); f.dots = ok ? CORNERS[f.shape] : pick([2, 3, 4, 5, 6].filter((x) => x !== CORNERS[f.shape])); return f; },
      ex(f) { return `${SHAPE_NL[f.shape]} met ${CORNERS[f.shape]} hoeken en ${f.dots} stippen.`; } },
    { id: 'fillaxis', lv: [4, 5], name: 'Vulling hangt samen met de pijl', rule: '',
      setup() { this.fullAx = pick(['v', 'h']); this.rule = `Bij alle andere figuren geldt: gevuld = pijl ${this.fullAx === 'v' ? 'verticaal' : 'horizontaal'}, leeg = pijl ${this.fullAx === 'v' ? 'horizontaal' : 'verticaal'}.`; },
      sat(f) { return (f.fill === 'full' && axis(f.rot) === this.fullAx) || (f.fill === 'empty' && axis(f.rot) !== this.fullAx && axis(f.rot) !== 'd'); },
      make(ok) { const f = randFig(3); f.fill = pick(['full', 'empty']); const other = this.fullAx === 'v' ? 'h' : 'v'; const want = (f.fill === 'full') === ok ? this.fullAx : other; f.rot = want === 'v' ? pick([0, 180]) : pick([90, 270]); return f; },
      ex(f) { return `${FILL_NL[f.fill]}, pijl ${axis(f.rot) === 'v' ? 'verticaal' : 'horizontaal'}.`; } },
    { id: 'filldots', lv: [5, 5], name: 'Vulling hangt samen met de stippen', rule: 'Bij alle andere figuren geldt: gevuld = even aantal stippen, leeg = oneven aantal stippen.',
      setup() {}, sat(f) { return f.fill !== 'half' && (f.fill === 'full') === (f.dots % 2 === 0); },
      make(ok) { const f = randFig(3); f.fill = pick(['full', 'empty']); const even = (f.fill === 'full') === ok; f.dots = pick([1, 2, 3, 4, 5, 6].filter((x) => (x % 2 === 0) === even)); return f; },
      ex(f) { return `${FILL_NL[f.fill]} met ${f.dots} stippen (${f.dots % 2 === 0 ? 'even' : 'oneven'}).`; } },
  ];
  const FEATURES = [(f) => f.shape, (f) => f.fill, (f) => norm(f.rot), (f) => f.dots, (f) => f.dots % 2, (f) => axis(f.rot), (f) => CORNERS[f.shape] === f.dots, (f) => (f.fill === 'full') + axis(f.rot)];

  function oddQ(d) {
    const R = Object.create(pick(ODD.filter((r) => d >= r.lv[0] && d <= r.lv[1])));
    R.setup();
    const n = optCount(d);
    const figs = Array.from({ length: n - 1 }, () => R.make(true));
    const odd = R.make(false);
    if (!figs.every((f) => R.sat(f)) || R.sat(odd)) return null;
    const all = [...figs, odd];
    if (new Set(all.map(F.key)).size !== all.length) return null;
    // Geen andere eigenschap mag een figuur net zo duidelijk laten afwijken
    for (const feat of FEATURES) {
      const vals = all.map(feat);
      const counts = {};
      vals.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
      const keys = Object.keys(counts);
      if (keys.length === 2) {
        const loneKey = keys.find((k) => counts[k] === 1);
        if (loneKey !== undefined && String(feat(odd)) !== loneKey) return null;
      }
      if (keys.length === 1 && feat !== FEATURES[0]) continue;
    }
    const pool = figs.map((f) => ({ key: F.key(f), html: F.draw(f), text: F.describe(f), tag: 'Regel niet gevonden', why: `Deze figuur volgt de regel wel. ${R.ex(f)}` }));
    const built = buildOptions({ key: F.key(odd), html: F.draw(odd), text: F.describe(odd) }, pool, n);
    return {
      cat: 'abs', diff: d, kindId: 'odd', meta: { rule: R.id }, kind: 'Welke hoort er niet bij',
      prompt: 'Welke figuur hoort er niet bij?',
      stem: '<p class="muted small">Vier van de figuren volgen dezelfde regel. Eén niet.</p>'.replace('Vier', n === 4 ? 'Drie' : 'Vier'),
      opts: built.opts, ans: built.ans, layout: 'fig',
      steps: [R.rule, `De afwijkende figuur: ${R.ex(odd)}`],
      hint: d >= 4 ? 'Kijk of twee eigenschappen met elkaar samenhangen, bijvoorbeeld vulling en pijl.' : 'Vergelijk één eigenschap tegelijk: vorm, vulling, pijl, stippen.',
      quick: 'Loop de eigenschappen af (vorm, vulling, pijl, stippen). Zoek bij elke eigenschap of er precies één figuur anders is.',
      lesson: 'Vind je geen enkele afwijker? Zoek dan naar een verband tussen twee eigenschappen.',
    };
  }

  /* ---------- Figuuranalogie A : B = C : ? ---------- */
  const TX = {
    rotcw: { n: 'de pijl draait 90° met de klok mee', f: (x) => ({ ...x, rot: norm(x.rot + 90) }), g: 'rot' },
    rotccw: { n: 'de pijl draait 90° tegen de klok in', f: (x) => ({ ...x, rot: norm(x.rot - 90) }), g: 'rot' },
    rot180: { n: 'de pijl draait 180°', f: (x) => ({ ...x, rot: norm(x.rot + 180) }), g: 'rot' },
    fill: { n: 'leeg wordt gevuld en gevuld wordt leeg', f: (x) => ({ ...x, fill: x.fill === 'full' ? 'empty' : 'full' }), g: 'fill' },
    dup: { n: 'er komt 1 stip bij', f: (x) => ({ ...x, dots: x.dots + 1 }), g: 'dots' },
    ddown: { n: 'er gaat 1 stip af', f: (x) => ({ ...x, dots: x.dots - 1 }), g: 'dots' },
    dbl: { n: 'het aantal stippen verdubbelt', f: (x) => ({ ...x, dots: x.dots * 2 }), g: 'dots' },
  };
  function anaQ(d) {
    const nT = d <= 2 ? 1 : d <= 4 ? 2 : 3;
    const groups = shuffle(['rot', 'fill', 'dots']).slice(0, nT);
    const tx = groups.map((g) => pick(Object.keys(TX).filter((k) => TX[k].g === g && (k !== 'dbl' || d >= 4))));
    const mk = () => { const f = randFig(d); f.fill = pick(['empty', 'full']); f.dots = rand(1, 3); return f; };
    const A = mk(), C = mk();
    if (A.shape === C.shape) return null;
    const T = (x, list = tx) => list.reduce((y, k) => TX[k].f(y), x);
    const B = T(A), ans = T(C);
    if (F.key(B) === F.key(A)) return null;
    const pool = [];
    tx.forEach((k, i) => {
      const rest = tx.filter((_, j) => j !== i);
      pool.push({ f: T(C, rest), why: `Je vergat één verandering: ${TX[k].n}.`, tag: nT > 1 ? 'Tweede regel gemist' : 'Regel gemist' });
      const alt = Object.keys(TX).filter((z) => TX[z].g === TX[k].g && z !== k);
      for (const z of alt) pool.push({ f: T(C, [...rest, z]), why: `Bijna: maar niet “${TX[z].n}”. Het is: ${TX[k].n}.`, tag: 'Verkeerde richting' });
    });
    pool.push({ f: C, why: 'Er verandert wel iets: kijk wat er van A naar B gebeurt.', tag: 'Regel gemist' });
    pool.push({ f: { ...ans, shape: A.shape }, why: 'De vorm blijft gelijk aan die van C; alleen de veranderingen van A naar B worden overgenomen.', tag: 'Verkeerde regel' });
    const valid = (f) => f.dots >= 0 && f.dots <= 7;
    if (!valid(B) || !valid(ans)) return null;
    const P = shuffle(pool.filter((p) => valid(p.f))).map((p) => ({ key: F.key(p.f), html: F.draw(p.f), text: F.describe(p.f), why: p.why, tag: p.tag }));
    const built = buildOptions({ key: F.key(ans), html: F.draw(ans), text: F.describe(ans) }, P, optCount(d));
    if (!built) return null;
    return {
      cat: 'abs', diff: d, kindId: 'figana', meta: { changes: groups.slice() }, kind: 'Figuuranalogie',
      prompt: 'Welke figuur hoort op de open plek?',
      stem: `<div class="figs ana"><div class="fig">${F.draw(A)}</div><span class="op">:</span><div class="fig">${F.draw(B)}</div><span class="op">=</span><div class="fig">${F.draw(C)}</div><span class="op">:</span><div class="fig q">?</div></div>`,
      opts: built.opts, ans: built.ans, layout: 'fig',
      steps: [`Wat verandert er van de eerste naar de tweede figuur? ${tx.map((k) => TX[k].n).join('; ')}.`, `Doe precies hetzelfde met de derde figuur: ${F.describe(ans)}.`],
      hint: nT > 1 ? `Er veranderen ${nT} dingen tussen de eerste en de tweede figuur.` : 'Er verandert één ding tussen de eerste en de tweede figuur.',
      quick: 'Maak een lijstje van alle veranderingen van A naar B. Streep opties weg die er één missen.',
      lesson: 'Neem alle veranderingen over, niet alleen de eerste die je ziet.',
    };
  }

  /* ---------- Matrix 3×3 ---------- */
  function matrixQ(d) {
    const shapes = shuffle(F.SHAPES).slice(0, 3);
    const fills = shuffle(FILLS);
    const r0 = rand(0, 3) * 90, dotBase = rand(0, 2);
    let cell, txt;
    if (d <= 3) {
      cell = (r, c) => ({ shape: shapes[r], fill: fills[c], rot: r0, dots: dotBase + 1 });
      txt = ['In elke rij is de vorm steeds hetzelfde.', 'In elke kolom is de vulling steeds hetzelfde.'];
    } else if (d === 4) {
      cell = (r, c) => ({ shape: shapes[(r + c) % 3], fill: fills[r], rot: r0, dots: dotBase + c + 1 });
      txt = ['Elke vorm komt in elke rij en kolom precies één keer voor.', 'In elke rij is de vulling gelijk.', 'Van links naar rechts komt er steeds 1 stip bij.'];
    } else {
      cell = (r, c) => ({ shape: shapes[(r + c) % 3], fill: fills[(r + 2 * c) % 3], rot: norm(r0 + 90 * c), dots: dotBase + r + 1 });
      txt = ['Elke vorm komt in elke rij en kolom precies één keer voor.', 'Ook elke vulling komt in elke rij en kolom één keer voor.', 'Van links naar rechts draait de pijl steeds 90° met de klok mee.', 'Van boven naar beneden komt er steeds 1 stip bij.'];
    }
    const ans = cell(2, 2);
    const pool = [];
    for (const s of shapes) if (s !== ans.shape) pool.push({ f: { ...ans, shape: s }, why: 'De vorm klopt niet met de regel voor vormen.', tag: 'Regel gemist' });
    for (const v of FILLS) if (v !== ans.fill) pool.push({ f: { ...ans, fill: v }, why: 'De vulling klopt niet met de regel voor vullingen.', tag: 'Regel gemist' });
    for (const v of [ans.dots - 1, ans.dots + 1]) if (v >= 0) pool.push({ f: { ...ans, dots: v }, why: 'Het aantal stippen klopt niet.', tag: 'Rekenfout' });
    pool.push({ f: { ...ans, rot: norm(ans.rot + 90) }, why: 'De pijlrichting klopt niet.', tag: 'Verkeerde richting' });
    pool.push({ f: { ...ans, rot: norm(ans.rot + 180) }, why: 'De pijlrichting klopt niet.', tag: 'Verkeerde richting' });
    pool.push({ f: cell(2, 1), why: 'Dit is een kopie van het vakje ernaast. Het ontbrekende vak volgt de regels voor zijn eigen rij en kolom.', tag: 'Verkeerde regel' });
    const P = shuffle(pool).map((p) => ({ key: F.key(p.f), html: F.draw(p.f), text: F.describe(p.f), why: p.why, tag: d >= 4 && p.tag === 'Regel gemist' ? 'Tweede regel gemist' : p.tag }));
    const built = buildOptions({ key: F.key(ans), html: F.draw(ans), text: F.describe(ans) }, P, optCount(d));
    if (!built) return null;
    let grid = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) grid += r === 2 && c === 2 ? '<div class="fig q">?</div>' : `<div class="fig">${F.draw(cell(r, c))}</div>`;
    return {
      cat: 'abs', diff: d, kindId: 'matrix', meta: { changes: d <= 3 ? ['shape', 'fill'] : d === 4 ? ['shape', 'fill', 'dots'] : ['shape', 'fill', 'rot', 'dots'] }, kind: 'Matrix',
      prompt: 'Welke figuur hoort in het lege vak?',
      stem: `<div class="matrix">${grid}</div>`,
      opts: built.opts, ans: built.ans, layout: 'fig',
      steps: ['Zoek de regels per rij (horizontaal) en per kolom (verticaal).', ...txt, `Het lege vak wordt dus: ${F.describe(ans)}.`],
      hint: 'Kijk eerst per rij en daarna per kolom. Wat blijft gelijk en wat verandert?',
      quick: 'Bepaal per eigenschap wat er in de onderste rij en rechterkolom nog ontbreekt.',
      lesson: 'Matrix: elke eigenschap heeft een eigen regel, per rij of per kolom.',
    };
  }

  function generate(d, opt = {}) {
    const kinds = d <= 1 ? ['odd'] : d === 2 ? ['odd', 'figana'] : ['odd', 'figana', 'matrix'];
    const k = opt.kind && kinds.includes(opt.kind) ? opt.kind : pick(kinds);
    return attempt(() => (k === 'odd' ? oddQ(d) : k === 'figana' ? anaQ(d) : matrixQ(d)));
  }
  MT.gens.abs = { generate, ODD };
})(typeof window !== 'undefined' ? window : globalThis);
