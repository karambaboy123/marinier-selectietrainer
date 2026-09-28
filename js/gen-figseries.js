/* D. Figuurreeksen */
(function (G) {
  'use strict';
  const MT = G.MT;
  const { rand, pick, chance, shuffle, optCount, buildOptions, attempt } = MT.util;
  const F = MT.fig;
  const { norm, SHAPE_NL, FILL_NL, DIR_NL } = F;
  const cw = (d) => (d > 0 ? 'met de klok mee' : 'tegen de klok in');

  /* ---------- Reeks met eigenschappen (vorm, vulling, pijl, stippen) ---------- */
  function makeRules(d, total) {
    const nChange = [0, 1, 1, 2, rand(2, 3), 3][d];
    const pool = d <= 2 ? ['rot', 'dots', ...(d === 2 ? ['fill'] : [])] : ['rot', 'fill', 'shape', 'dots'];
    const attrs = shuffle(pool).slice(0, nChange);
    const rules = {};
    for (const a of attrs) {
      if (a === 'rot') {
        const st = d === 1 ? 90 : pick([45, 90, 135]), dir = pick([1, -1]), a0 = rand(0, 7) * 45;
        if (d >= 5 && chance(0.5)) {
          const s2 = pick([45, 90, 180].filter((x) => x !== st));
          rules.rot = { v: (k) => norm(a0 + dir * (Math.ceil(k / 2) * st + Math.floor(k / 2) * s2)), txt: `De pijl draait om en om ${st}° en ${s2}° ${cw(dir)}.`, step: st, dir };
        } else rules.rot = { v: (k) => norm(a0 + dir * st * k), txt: `De pijl draait elke stap ${st}° ${cw(dir)}.`, step: st, dir };
      }
      if (a === 'fill') {
        const cyc = d >= 3 && chance(0.5) ? shuffle(['empty', 'half', 'full']) : shuffle(pick([['empty', 'full'], ['empty', 'half'], ['half', 'full']]));
        rules.fill = { v: (k) => cyc[k % cyc.length], txt: `De vulling wisselt steeds in de volgorde ${cyc.map((c) => FILL_NL[c]).join(' → ')}${cyc.length === 3 ? ' en begint dan opnieuw' : ''}.`, cyc };
      }
      if (a === 'shape') {
        const cyc = shuffle(F.SHAPES).slice(0, d >= 4 ? 3 : 2);
        rules.shape = { v: (k) => cyc[k % cyc.length], txt: `De vorm wisselt steeds: ${cyc.map((c) => SHAPE_NL[c]).join(' → ')}${cyc.length === 3 ? ' en weer opnieuw' : ''}.`, cyc };
      }
      if (a === 'dots') {
        const st = (d <= 2 ? 1 : pick([1, 2])) * (d >= 3 && chance(0.4) ? -1 : 1);
        const span = Math.abs(st) * (total - 1);
        if (span > 6) { const st1 = st > 0 ? 1 : -1; const s0 = st1 > 0 ? rand(0, 6 - (total - 1)) : rand(total - 1, 6); rules.dots = { v: (k) => s0 + st1 * k, txt: `Er komt steeds 1 stip ${st1 > 0 ? 'bij' : 'af'}.`, step: st1 }; }
        else { const s0 = st > 0 ? rand(0, 6 - span) : rand(span, 6); rules.dots = { v: (k) => s0 + st * k, txt: `Er ${Math.abs(st) === 1 ? 'komt' : 'komen'} steeds ${Math.abs(st)} ${Math.abs(st) === 1 ? 'stip' : 'stippen'} ${st > 0 ? 'bij' : 'af'}.`, step: st }; }
      }
    }
    return rules;
  }

  function attrQ(d) {
    const shownN = d <= 2 ? 4 : 5;
    const middle = d >= 4 && chance(0.25);
    const total = middle ? shownN + 1 : shownN + 1; // frames 0..shownN (één daarvan is de vraag)
    const rules = makeRules(d, total);
    const cons = { shape: pick(F.SHAPES), fill: pick(['empty', 'full', 'half']), rot: rand(0, 7) * 45, dots: rand(0, 4) };
    const frame = (k) => ({
      shape: rules.shape ? rules.shape.v(k) : cons.shape,
      fill: rules.fill ? rules.fill.v(k) : cons.fill,
      rot: rules.rot ? rules.rot.v(k) : cons.rot,
      dots: rules.dots ? rules.dots.v(k) : cons.dots,
    });
    const gi = middle ? rand(2, total - 2) : total - 1;
    const frames = Array.from({ length: total }, (_, k) => frame(k));
    const ans = frames[gi];
    const pool = [];
    const add = (f, why, tag) => pool.push({ f, why, tag });
    const changing = Object.keys(rules);
    for (const a of shuffle(changing)) {
      if (a === 'rot') {
        add({ ...ans, rot: frames[gi - 1].rot }, 'De pijl draait wel: je vergat de draaiing.', 'Regel gemist');
        add({ ...ans, rot: norm(ans.rot + 180) }, 'De pijl wijst de verkeerde kant op. Tel de draaiing per stap na.', 'Verkeerde richting');
        add({ ...ans, rot: norm(frames[gi - 1].rot - (ans.rot - frames[gi - 1].rot)) }, `Je draaide de pijl de verkeerde kant op. Hij draait ${cw(rules.rot.dir)}.`, 'Verkeerde richting');
        add({ ...ans, rot: norm(ans.rot + 45) }, 'De pijl is 45° te ver of te weinig gedraaid.', 'Rekenfout');
      }
      if (a === 'fill') for (const v of ['empty', 'half', 'full']) if (v !== ans.fill) add({ ...ans, fill: v }, `De vulling klopt niet. ${rules.fill.txt}`, 'Regel gemist');
      if (a === 'shape') for (const v of rules.shape.cyc) if (v !== ans.shape) add({ ...ans, shape: v }, `De vorm klopt niet. ${rules.shape.txt}`, 'Regel gemist');
      if (a === 'dots') for (const v of [ans.dots + 1, ans.dots - 1]) if (v >= 0 && v <= 7) add({ ...ans, dots: v }, `Het aantal stippen klopt niet. ${rules.dots.txt}`, 'Rekenfout');
    }
    const first = shuffle(pool);
    const extra = [];
    if (!rules.shape) extra.push({ f: { ...ans, shape: pick(F.SHAPES.filter((s) => s !== ans.shape)) }, why: 'De vorm verandert niet in deze reeks.', tag: 'Verkeerde regel' });
    if (!rules.fill) extra.push({ f: { ...ans, fill: pick(['empty', 'full', 'half'].filter((s) => s !== ans.fill)) }, why: 'De vulling verandert niet in deze reeks.', tag: 'Verkeerde regel' });
    if (changing.length >= 2) {
      const [x, y] = changing;
      const px = first.find((p) => p.f[x] !== ans[x]), py = first.find((p) => p.f[y] !== ans[y]);
      if (px && py) first.unshift({ f: { ...ans, [x]: px.f[x], [y]: py.f[y] }, why: 'Twee eigenschappen kloppen hier niet. Controleer elke eigenschap apart.', tag: 'Tweede regel gemist' });
    }
    // Bij meerdere regels: zet een optie met precies één fout vooraan (meest verleidelijk)
    const P = [...first, ...shuffle(extra)].map((p) => ({ key: F.key(p.f), html: F.draw(p.f), text: F.describe(p.f), why: p.why, tag: changing.length > 1 && p.tag === 'Regel gemist' ? 'Tweede regel gemist' : p.tag }));
    const built = buildOptions({ key: F.key(ans), html: F.draw(ans), text: F.describe(ans) }, P, optCount(d));
    if (!built) return null;
    const stem = `<div class="figs">${frames.map((f, k) => (k === gi ? '<div class="fig q">?</div>' : `<div class="fig">${F.draw(f)}</div>`)).join('')}</div>`;
    const ruleTxt = changing.map((a) => rules[a].txt);
    return {
      cat: 'fig', diff: d, kindId: changing.length > 1 ? 'multi' : 'fig-' + changing[0], kind: changing.length > 1 ? `${changing.length} regels tegelijk` : { rot: 'Draaiing', fill: 'Vulling', shape: 'Vorm', dots: 'Aantal stippen' }[changing[0]],
      prompt: gi === total - 1 ? 'Welke figuur komt hierna?' : 'Welke figuur hoort op de plek van het vraagteken?',
      stem, opts: built.opts, ans: built.ans, layout: 'fig',
      steps: [`Bekijk elke eigenschap apart: vorm, vulling, pijl en stippen.`, ...ruleTxt, `${changing.length < 4 ? 'De andere eigenschappen blijven gelijk. ' : ''}Het antwoord: ${F.describe(ans)}.`],
      hint: changing.length > 1 ? `Er veranderen ${changing.length} dingen tegelijk. Kijk naar één eigenschap per keer.` : 'Er verandert maar één ding. Welk?',
      quick: 'Streep per eigenschap af: eerst alle opties met de verkeerde pijlrichting, dan de verkeerde vulling, enzovoort.',
      lesson: 'Eén eigenschap tegelijk: pijl, vulling, vorm, stippen.',
    };
  }

  /* ---------- Rasterreeks ---------- */
  function gridQ(d) {
    const n = d >= 5 ? 4 : 3;
    const per = F.perimeter(n), L = per.length;
    const nm = d >= 3 ? 2 : 1;
    const shownN = d <= 2 ? 4 : 5, total = shownN + 1;
    const ms = [];
    for (let m = 0; m < nm; m++) {
      const st = d === 1 ? 1 : pick(d >= 4 ? [1, 2, 3] : [1, 2]), dir = pick([1, -1]);
      ms.push({ m: m + 1, st, dir, p0: rand(0, L - 1) });
    }
    if (nm === 2 && ms[0].st === ms[1].st && ms[0].dir === ms[1].dir) return null;
    const at = (mk, k) => per[(((mk.p0 + mk.dir * mk.st * k) % L) + L) % L];
    const frame = (k) => ms.map((mk) => ({ pos: at(mk, k), m: mk.m }));
    for (let k = 0; k < total; k++) { const f = frame(k); if (nm === 2 && f[0].pos === f[1].pos) return null; }
    const ans = frame(total - 1);
    const kf = (f) => f.map((x) => x.m + '@' + x.pos).sort().join(',');
    const name = (m) => (m === 1 ? 'Het gekleurde vak' : 'De stip');
    const pool = [];
    ms.forEach((mk, i) => {
      const mod = (pos) => ans.map((x, j) => (j === i ? { ...x, pos } : x));
      const pi = per.indexOf(ans[i].pos);
      pool.push({ f: mod(per[(pi - mk.dir * mk.st + L * 3) % L]), why: `${name(mk.m)} staat nog op de vorige plek. Hij moet nog ${mk.st} ${mk.st === 1 ? 'vak' : 'vakken'} verder.`, tag: 'Regel gemist' });
      pool.push({ f: mod(per[(pi - 2 * mk.dir * mk.st + L * 3) % L]), why: `${name(mk.m)} loopt de verkeerde kant op. Hij gaat ${cw(mk.dir)}.`, tag: 'Verkeerde richting' });
      pool.push({ f: mod(per[(pi + mk.dir + L) % L]), why: `${name(mk.m)} is één vak te ver.`, tag: 'Rekenfout' });
      pool.push({ f: mod(per[(pi - mk.dir + L) % L]), why: `${name(mk.m)} is één vak te kort.`, tag: 'Rekenfout' });
      pool.push({ f: mod(n === 3 ? 4 : 5), why: `${name(mk.m)} blijft altijd langs de rand lopen.`, tag: 'Verkeerde regel' });
    });
    if (nm === 2) pool.unshift({ f: [{ pos: ans[0].pos, m: 2 }, { pos: ans[1].pos, m: 1 }], why: 'De plekken kloppen, maar het gekleurde vak en de stip zijn verwisseld.', tag: 'Tweede regel gemist' });
    const clean = pool.filter((p) => p.f.length < 2 || p.f[0].pos !== p.f[1].pos);
    const P = shuffle(clean).map((p) => ({ key: kf(p.f), html: F.drawGrid(n, p.f), text: 'raster', why: p.why, tag: p.tag }));
    const built = buildOptions({ key: kf(ans), html: F.drawGrid(n, ans), text: 'raster' }, P, optCount(d));
    if (!built) return null;
    const txt = ms.map((mk) => `${name(mk.m)} loopt langs de rand, steeds ${mk.st} ${mk.st === 1 ? 'vak' : 'vakken'} ${cw(mk.dir)}.`);
    return {
      cat: 'fig', diff: d, kindId: nm > 1 ? 'grid2' : 'grid', kind: nm > 1 ? 'Raster met twee bewegingen' : 'Raster',
      prompt: 'Welk raster komt hierna?',
      stem: `<div class="figs">${Array.from({ length: shownN }, (_, k) => `<div class="fig">${F.drawGrid(n, frame(k))}</div>`).join('')}<div class="fig q">?</div></div>`,
      opts: built.opts, ans: built.ans, layout: 'fig',
      steps: [nm > 1 ? 'Volg het gekleurde vak en de stip elk apart.' : 'Volg het gekleurde vak van plaatje naar plaatje.', ...txt],
      hint: nm > 1 ? 'Het gekleurde vak en de stip bewegen elk volgens hun eigen regel.' : 'Tel hoeveel vakken het gekleurde vak per stap opschuift.',
      quick: 'Tel alleen de sprong tussen de laatste twee plaatjes en zet die ene stap nog één keer.',
      lesson: 'Twee bewegende dingen? Volg ze apart.',
    };
  }

  function generate(d, opt = {}) {
    return attempt(() => {
      const wantGrid = opt.kind ? opt.kind.startsWith('grid') : chance(0.35);
      const q = wantGrid ? gridQ(d) : attrQ(d);
      if (q && opt.kind && !opt.kind.startsWith('grid') && q.kindId !== opt.kind && chance(0.7)) return null;
      return q;
    });
  }
  MT.gens.fig = { generate };
})(typeof window !== 'undefined' ? window : globalThis);
