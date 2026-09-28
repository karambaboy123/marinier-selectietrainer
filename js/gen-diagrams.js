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
  MT.gens.dia = { generate, OPS };
})(typeof window !== 'undefined' ? window : globalThis);
