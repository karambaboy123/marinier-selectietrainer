// Controleert duizenden gegenereerde vragen op basisfouten.
// Gebruik: node tests/check.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { console, Math, JSON, Set, Map, Object, Array, String, Number, Error };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['util.js', 'figures.js', 'gen-numbers.js', 'gen-analogies.js', 'gen-diagrams.js', 'gen-figseries.js', 'gen-abstract.js', 'gen-logic.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
}
const MT = ctx.MT;
const N = Number(process.argv[2] || 300);
let fails = 0, total = 0;
const kinds = {};
const t0 = Date.now();
for (const cat of MT.CAT_IDS) {
  for (let d = 1; d <= 5; d++) {
    const seen = new Set();
    for (let i = 0; i < N; i++) {
      total++;
      let q;
      try { q = MT.gens[cat].generate(d); } catch (e) { fails++; console.log(`FOUT ${cat} d${d}: ${e.message}`); continue; }
      const err = [];
      const need = MT.util.optCount(d);
      if (q.opts.length !== need && !(q.kindId === 'sum' && q.opts.length >= 4)) err.push(`aantal opties ${q.opts.length} != ${need}`);
      if (!(q.ans >= 0 && q.ans < q.opts.length)) err.push('ans buiten bereik');
      if (!q.opts[q.ans] || !q.opts[q.ans].correct) err.push('juiste optie niet gemarkeerd');
      if (q.opts.filter((o) => o.correct).length !== 1) err.push('niet precies 1 juiste optie');
      if (new Set(q.opts.map((o) => o.key)).size !== q.opts.length) err.push('dubbele opties');
      if (q.opts.some((o) => !o.correct && !o.why)) err.push('afleider zonder uitleg');
      if (q.opts.some((o) => !o.html)) err.push('lege optie');
      if (!q.steps || !q.steps.length || !q.lesson || !q.quick || !q.hint) err.push('uitleg ontbreekt');
      if (q.cat !== cat || q.diff !== d) err.push('cat/diff klopt niet');
      if (JSON.stringify(q).includes('undefined') || JSON.stringify(q).includes('NaN')) err.push('undefined/NaN in tekst');
      if (err.length) { fails++; if (fails < 40) console.log(`FOUT ${cat} d${d} ${q.kindId}: ${err.join('; ')}`); }
      seen.add(q.stem + q.prompt + q.opts.map((o) => o.key).sort().join());
      kinds[`${cat}:${q.kindId}`] = (kinds[`${cat}:${q.kindId}`] || 0) + 1;
    }
    const uniq = seen.size / N;
    if (uniq < 0.6) console.log(`LET OP: ${cat} d${d} weinig variatie (${Math.round(uniq * 100)}% uniek)`);
  }
}
// Syllogismen: elk sjabloon moet geldig zijn
for (const T of MT.gens.log.SYL) {
  const prem = T.p.map(([t, x, y]) => ({ t, x, y }));
  const M = MT.gens.log._models(T.n, prem);
  const c = { t: T.c[0], x: T.c[1], y: T.c[2] };
  if (!M.length || !M.every((occ) => MT.gens.log._holds(c, occ))) { fails++; console.log('Ongeldig syllogisme', JSON.stringify(T.p)); }
}
console.log(`\n${total} vragen gecontroleerd in ${((Date.now() - t0) / 1000).toFixed(1)} s, ${fails} fouten.`);
console.log('Soorten:', Object.keys(kinds).sort().join(', '));
process.exit(fails ? 1 : 0);
