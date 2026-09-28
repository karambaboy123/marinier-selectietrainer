/* A. Cijferreeksen */
(function (G) {
  'use strict';
  const MT = G.MT;
  const { rand, pick, chance, shuffle, fmtNum, sgn, optCount, buildOptions, attempt } = MT.util;

  const diffs = (a) => a.slice(1).map((v, i) => v - a[i]);
  const fd = (d) => (d >= 0 ? '+' + d : '−' + Math.abs(d));
  const P = [];
  const def = (o) => P.push(o);

  // Elk patroon: id, naam, niveaus [min,max], make(d) -> {seq, rule, derive(i), traps(i), midOk}
  def({
    id: 'arith', name: 'Vaste stap', lv: [1, 3],
    hint: 'Kijk naar het verschil tussen twee opeenvolgende getallen.',
    quick: 'Trek twee buren van elkaar af. Is dat verschil steeds gelijk, dan ben je klaar.',
    lesson: 'Begin altijd met de verschillen tussen de getallen.',
    make(d) {
      const st = d === 1 ? rand(2, 6) : rand(3, 14) * (chance(0.4) ? -1 : 1);
      let a = rand(1, d === 1 ? 20 : 70);
      if (st < 0) a += Math.abs(st) * 7;
      const seq = Array.from({ length: 6 }, (_, k) => a + k * st);
      return {
        seq, rule: `Elke stap is ${fd(st)}.`,
        derive: (i) => `${fmtNum(seq[i - 1])} ${sgn(st)} = ${fmtNum(seq[i])}`,
        traps: (i) => [{ v: seq[i - 1] + 2 * st, why: `Je deed de stap (${fd(st)}) twee keer.`, tag: 'Rekenfout' }],
      };
    },
  });
  def({
    id: 'geo', name: 'Vermenigvuldigen / delen', lv: [1, 3],
    hint: 'De getallen groeien (of krimpen) steeds sneller. Probeer delen in plaats van aftrekken.',
    quick: 'Deel een getal door het vorige. Komt er steeds hetzelfde uit, dan is het ×.',
    lesson: 'Groeien de verschillen snel? Denk aan vermenigvuldigen.',
    make(d) {
      const r = d === 1 ? 2 : pick([2, 3]);
      const a = rand(1, d === 1 ? 4 : 5);
      const down = d === 3 && chance(0.5);
      const up = Array.from({ length: 6 }, (_, k) => a * r ** k);
      const seq = down ? up.slice().reverse() : up;
      return {
        seq, rule: down ? `Elke stap wordt het getal gedeeld door ${r}.` : `Elke stap wordt het getal ×${r}.`,
        derive: (i) => (down ? `${seq[i - 1]} ÷ ${r} = ${seq[i]}` : `${seq[i - 1]} × ${r} = ${seq[i]}`),
        traps: (i) => [{
          v: down ? seq[i - 1] - (seq[i - 2] - seq[i - 1]) : seq[i - 1] + (seq[i - 1] - seq[i - 2]),
          why: 'Je herhaalde het laatste verschil. Hier wordt niet opgeteld maar vermenigvuldigd of gedeeld.', tag: 'Verkeerde regel',
        }],
      };
    },
  });
  def({
    id: 'plusmin', name: 'Afwisselend + en −', lv: [2, 3],
    hint: 'Het verschil is niet steeds hetzelfde, maar wisselt om en om.',
    quick: 'Schrijf de verschillen onder de reeks. Een zigzag (+ − + −) valt dan meteen op.',
    lesson: 'Wisselen de verschillen van teken? Dan zijn er twee stappen die om en om gaan.',
    make() {
      const a = rand(3, 9), b = rand(1, a - 1), s0 = rand(1, 25);
      const seq = [s0];
      for (let k = 0; k < 6; k++) seq.push(seq[k] + (k % 2 === 0 ? a : -b));
      return {
        seq, rule: `De stappen wisselen om en om: +${a}, −${b}, +${a}, −${b}, …`,
        derive: (i) => `${seq[i - 1]} ${(i - 1) % 2 === 0 ? '+ ' + a : '− ' + b} = ${seq[i]}`,
        traps: (i) => [{
          v: seq[i - 1] + ((i - 1) % 2 === 0 ? -b : a),
          why: 'Je gebruikte de verkeerde stap. De stappen wisselen om en om, kijk welke nu aan de beurt is.', tag: 'Verkeerde regel',
        }],
      };
    },
  });
  def({
    id: 'incdiff', name: 'Oplopende verschillen', lv: [2, 4],
    hint: 'Bekijk de verschillen. Is daar zelf een patroon in?',
    quick: 'Schrijf de verschillen op een tweede regel. Die vormen vaak zelf een simpele reeks.',
    lesson: 'Geen vaste stap? Zoek het patroon in de verschillen.',
    make(d) {
      const d0 = rand(1, 5), st = d >= 4 ? rand(2, 4) : rand(1, 3), a = rand(1, 25);
      const seq = [a];
      for (let k = 0; k < 6; k++) seq.push(seq[k] + d0 + k * st);
      const df = diffs(seq);
      return {
        seq, rule: `De verschillen lopen steeds met ${st} op: ${df.map(fd).join(', ')}.`,
        derive: (i) => `${seq[i - 1]} ${sgn(seq[i] - seq[i - 1])} = ${seq[i]}`,
        traps: (i) => [
          { v: seq[i - 1] + (seq[i - 1] - seq[i - 2]), why: 'Je herhaalde het vorige verschil, maar de verschillen lopen op.', tag: 'Verkeerde regel' },
          { v: seq[i] + st, why: `De verschillen groeien met ${st}, niet met ${2 * st}.`, tag: 'Rekenfout' },
        ],
      };
    },
  });
  def({
    id: 'alt2', name: 'Twee reeksen door elkaar', lv: [2, 4],
    hint: 'Kijk alleen naar de 1e, 3e, 5e… getallen, en daarna naar de 2e, 4e, 6e…',
    quick: 'Springt de reeks op en neer? Lees om en om: dan zie je twee simpele reeksen.',
    lesson: 'Rare sprongen? Probeer om-en-om te lezen.',
    make(d) {
      const a = rand(1, 20), d1 = rand(2, 7);
      const geoB = d >= 4 && chance(0.6);
      const b = geoB ? rand(1, 3) : rand(30, 70), d2 = rand(2, 6);
      const seq = [];
      for (let k = 0; k < 8; k++) {
        const j = Math.floor(k / 2);
        seq.push(k % 2 === 0 ? a + j * d1 : geoB ? b * 2 ** j : b - j * d2);
      }
      const opB = geoB ? '×2' : '−' + d2;
      return {
        seq, rule: `Twee reeksen om en om. De 1e, 3e, 5e… gaan steeds +${d1}. De 2e, 4e, 6e… gaan steeds ${opB}.`,
        derive: (i) => {
          const first = i % 2 === 0;
          return `Plek ${i + 1} hoort bij de ${first ? 'eerste' : 'tweede'} reeks: ${seq[i - 2]} ${first ? '+ ' + d1 : geoB ? '× 2' : '− ' + d2} = ${seq[i]}`;
        },
        traps: (i) => {
          const first = i % 2 === 0;
          return [
            { v: first ? seq[i - 1] + d1 : geoB ? seq[i - 1] * 2 : seq[i - 1] - d2, why: 'Je paste de juiste stap toe op het getal ervoor. Die hoort bij de andere reeks.', tag: 'Verkeerde regel' },
            { v: first ? (geoB ? seq[i - 2] * 2 : seq[i - 2] - d2) : seq[i - 2] + d1, why: 'Je gebruikte de stap van de andere reeks.', tag: 'Verkeerde regel' },
          ];
        },
      };
    },
  });
  def({
    id: 'altop', name: 'Afwisselende bewerkingen', lv: [3, 4],
    hint: 'Er zijn twee verschillende bewerkingen die elkaar afwisselen.',
    quick: 'Kijk naar paren stappen: één kleine (+ of −) en één grote (×).',
    lesson: 'Groot, klein, groot, klein? Twee bewerkingen die afwisselen.',
    make(d) {
      const m = d >= 4 ? pick([2, 3]) : 2, x = rand(1, 5), neg = d >= 4 && m === 2 && chance(0.5);
      const a = rand(neg ? 4 : 1, neg ? 8 : 6);
      const seq = [a];
      for (let k = 0; k < 6; k++) seq.push(k % 2 === 0 ? seq[k] + (neg ? -x : x) : seq[k] * m);
      const op1 = neg ? '−' + x : '+' + x;
      if (seq.some((v) => v <= 0)) return null;
      return {
        seq, rule: `De bewerkingen wisselen om en om: ${op1}, ×${m}, ${op1}, ×${m}, …`,
        derive: (i) => ((i - 1) % 2 === 0 ? `${seq[i - 1]} ${neg ? '− ' + x : '+ ' + x} = ${seq[i]}` : `${seq[i - 1]} × ${m} = ${seq[i]}`),
        traps: (i) => [{
          v: (i - 1) % 2 === 0 ? seq[i - 1] * m : seq[i - 1] + (neg ? -x : x),
          why: 'Je paste de verkeerde bewerking toe. Ze wisselen om en om; kijk welke nu aan de beurt is.', tag: 'Verkeerde regel',
        }],
      };
    },
  });
  def({
    id: 'fib', name: 'Som van de vorige twee', lv: [3, 4],
    hint: 'Tel eens twee getallen naast elkaar bij elkaar op.',
    quick: 'Klopt er geen vaste stap, probeer dan: getal 1 + getal 2 = getal 3?',
    lesson: 'Groeien de verschillen mee met de reeks zelf? Denk aan optellen van vorige getallen.',
    make() {
      const seq = [rand(1, 6), rand(1, 9)];
      for (let k = 2; k < 7; k++) seq.push(seq[k - 1] + seq[k - 2]);
      return {
        seq, rule: 'Elk getal is de som van de twee getallen ervoor.',
        derive: (i) => `${seq[i - 2]} + ${seq[i - 1]} = ${seq[i]}`,
        traps: (i) => [
          { v: seq[i - 1] * 2, why: 'Je verdubbelde alleen het vorige getal. Je moet de twee vorige getallen optellen.', tag: 'Verkeerde regel' },
          { v: seq[i - 1] + (seq[i - 1] - seq[i - 2]), why: 'Je herhaalde het vorige verschil.', tag: 'Verkeerde regel' },
        ],
      };
    },
  });
  def({
    id: 'pow', name: 'Kwadraten en machten', lv: [2, 5],
    hint: 'Denk aan bekende getallen: 1, 4, 9, 16, 25… of 1, 8, 27, 64…',
    quick: 'Ken de kwadraten tot 15 en de derde machten tot 6 uit je hoofd. Dan herken je ze direct.',
    lesson: 'Verschillen van 3, 5, 7, 9…? Dat zijn kwadraten.',
    make(d) {
      const kind = d >= 5 ? pick(['rect', 'cube', 'sq']) : d === 4 ? pick(['cube', 'sq']) : 'sq';
      const n0 = kind === 'cube' ? rand(1, 3) : rand(1, 6);
      const c = d === 2 ? 0 : pick([0, 1, -1, 2, -2, 3]);
      const f = (n) => (kind === 'sq' ? n * n : kind === 'cube' ? n ** 3 : n * (n + 1)) + c;
      const fs = (n) => (kind === 'sq' ? `${n}×${n}` : kind === 'cube' ? `${n}×${n}×${n}` : `${n}×${n + 1}`) + (c ? (c > 0 ? ` + ${c}` : ` − ${-c}`) : '');
      const seq = Array.from({ length: 6 }, (_, k) => f(n0 + k));
      const nm = { sq: 'kwadraten (n × n)', cube: 'derde machten (n × n × n)', rect: 'n × (n + 1)' }[kind];
      return {
        seq, rule: `De reeks bestaat uit ${nm}${c ? `, steeds ${c > 0 ? 'plus ' + c : 'min ' + -c}` : ''}.`,
        derive: (i) => `${fs(n0 + i)} = ${seq[i]}`,
        traps: (i) => [
          { v: f(n0 + i + 1), why: 'Je nam een grondtal te ver.', tag: 'Rekenfout' },
          { v: seq[i - 1] + (seq[i - 1] - seq[i - 2]), why: 'Je herhaalde het vorige verschil, maar de verschillen lopen op.', tag: 'Verkeerde regel' },
        ],
      };
    },
  });
  def({
    id: 'mulminus', name: 'Twee bewerkingen per stap', lv: [3, 4],
    hint: 'Elke stap bestaat uit twee bewerkingen: eerst vermenigvuldigen, dan iets erbij of eraf.',
    quick: 'Is het volgende getal bijna het dubbele of driedubbele? Kijk dan hoeveel het ernaast zit.',
    lesson: 'Bijna ×2? Dan zit er vaak nog een + of − achter.',
    make(d) {
      const m = d >= 4 ? pick([2, 3]) : 2, c = rand(1, 4) * (chance(0.6) ? -1 : 1), a = rand(2, 6);
      const seq = [a];
      for (let k = 0; k < 5; k++) seq.push(seq[k] * m + c);
      if (seq.some((v) => v <= 0) || seq[5] > 2000) return null;
      return {
        seq, rule: `Elke stap: ×${m} en dan ${fd(c)}.`,
        derive: (i) => `${seq[i - 1]} × ${m} ${sgn(c)} = ${seq[i]}`,
        traps: (i) => [
          { v: seq[i - 1] * m, why: `Je vergat de tweede bewerking (${fd(c)}).`, tag: 'Tweede regel gemist' },
          { v: seq[i - 1] * m - c, why: `Je deed ${fd(-c)} in plaats van ${fd(c)}.`, tag: 'Verkeerde richting' },
        ],
      };
    },
  });
  def({
    id: 'diffmul', name: 'Verschillen vermenigvuldigen', lv: [4, 5],
    hint: 'Schrijf de verschillen op. Hoe hangen die met elkaar samen?',
    quick: 'Schrijf de verschillen op en deel ze door elkaar.',
    lesson: 'Verschillen kunnen zelf ×2 of ×3 gaan.',
    make(d) {
      const r = d >= 5 && chance(0.5) ? 3 : 2, d0 = rand(1, 4), a = rand(1, 20);
      const seq = [a];
      for (let k = 0; k < 6; k++) seq.push(seq[k] + d0 * r ** k);
      if (seq[6] > 3000) return null;
      const df = diffs(seq);
      return {
        seq, rule: `De verschillen worden steeds ×${r}: ${df.map(fd).join(', ')}.`,
        derive: (i) => `${seq[i - 1]} + ${seq[i] - seq[i - 1]} = ${seq[i]}`,
        traps: (i) => {
          const a1 = seq[i - 1] - seq[i - 2], a0 = seq[i - 2] - seq[i - 3];
          return [
            { v: seq[i - 1] + a1 + (a1 - a0), why: `Je liet de verschillen met een vast getal groeien. Ze worden ×${r}.`, tag: 'Verkeerde regel' },
            { v: seq[i - 1] + a1, why: 'Je herhaalde het vorige verschil.', tag: 'Verkeerde regel' },
          ];
        },
      };
    },
  });
  def({
    id: 'incmul', name: 'Oplopende vermenigvuldiger', lv: [4, 5],
    hint: 'Deel elk getal door het vorige. Verandert de uitkomst?',
    quick: 'Deel buren door elkaar: ×1, ×2, ×3… is een bekend patroon.',
    lesson: 'Groeit de reeks steeds harder? Misschien loopt de vermenigvuldiger op.',
    make() {
      const m0 = rand(1, 2), a = rand(1, 3);
      const seq = [a];
      for (let k = 0; k < 5; k++) seq.push(seq[k] * (m0 + k));
      return {
        seq, rule: `Het getal wordt steeds met een oplopend getal vermenigvuldigd: ×${m0}, ×${m0 + 1}, ×${m0 + 2}, …`,
        derive: (i) => `${seq[i - 1]} × ${m0 + i - 1} = ${seq[i]}`,
        traps: (i) => [
          { v: seq[i - 1] * (m0 + i - 2), why: 'Je gebruikte dezelfde vermenigvuldiger als bij de vorige stap. Die loopt op.', tag: 'Verkeerde regel' },
          { v: seq[i - 1] * (m0 + i), why: 'Je nam de vermenigvuldiger één te hoog.', tag: 'Rekenfout' },
        ],
      };
    },
  });
  def({
    id: 'sqdiff', name: 'Verschillen zijn kwadraten', lv: [4, 5],
    hint: 'Bekijk de verschillen. Herken je die getallen?',
    quick: 'Verschillen 1, 4, 9, 16…? Die herken je alleen als je de kwadraten uit je hoofd kent.',
    lesson: 'De verschillen kunnen zelf een bekende reeks zijn.',
    make() {
      const k0 = rand(1, 3), a = rand(1, 15);
      const seq = [a];
      for (let k = 0; k < 5; k++) seq.push(seq[k] + (k0 + k) ** 2);
      const df = diffs(seq);
      return {
        seq, rule: `De verschillen zijn kwadraten: ${df.map(fd).join(', ')}.`,
        derive: (i) => `${seq[i - 1]} + ${k0 + i - 1}×${k0 + i - 1} = ${seq[i]}`,
        traps: (i) => {
          const a1 = seq[i - 1] - seq[i - 2], a0 = seq[i - 2] - seq[i - 3];
          return [{ v: seq[i - 1] + a1 + (a1 - a0), why: 'Je liet de verschillen met een vaste stap groeien. Het zijn kwadraten.', tag: 'Verkeerde regel' }];
        },
      };
    },
  });
  def({
    id: 'trib', name: 'Som van de vorige drie', lv: [5, 5],
    hint: 'Twee getallen optellen werkt niet. Probeer er drie.',
    quick: 'Test snel: getal 1 + 2 + 3 = getal 4?',
    lesson: 'Werkt “som van twee” niet? Probeer de som van drie.',
    make() {
      const seq = [rand(1, 4), rand(1, 5), rand(1, 6)];
      for (let k = 3; k < 8; k++) seq.push(seq[k - 1] + seq[k - 2] + seq[k - 3]);
      return {
        seq, rule: 'Elk getal is de som van de drie getallen ervoor.',
        derive: (i) => `${seq[i - 3]} + ${seq[i - 2]} + ${seq[i - 1]} = ${seq[i]}`,
        traps: (i) => [{ v: seq[i - 1] + seq[i - 2], why: 'Je telde maar twee vorige getallen op. Het zijn er drie.', tag: 'Verkeerde regel' }],
      };
    },
  });
  def({
    id: 'altinc', name: 'Afwisselend met oplopende stap', lv: [5, 5],
    hint: 'Er wisselen twee bewerkingen af, en één ervan verandert steeds een beetje.',
    quick: 'Schrijf onder elke stap de bewerking. Kijk dan apart naar de oneven en de even stappen.',
    lesson: 'Twee afwisselende bewerkingen kunnen elk hun eigen patroon hebben.',
    make() {
      const x0 = rand(1, 3), a = rand(1, 5);
      const seq = [a];
      for (let k = 0; k < 6; k++) seq.push(k % 2 === 0 ? seq[k] + x0 + k / 2 : seq[k] * 2);
      return {
        seq, rule: `Om en om: een optelling die steeds 1 groter wordt (+${x0}, +${x0 + 1}, +${x0 + 2}…) en ×2.`,
        derive: (i) => ((i - 1) % 2 === 0 ? `${seq[i - 1]} + ${x0 + (i - 1) / 2} = ${seq[i]}` : `${seq[i - 1]} × 2 = ${seq[i]}`),
        traps: (i) => [{
          v: (i - 1) % 2 === 0 ? seq[i - 1] + x0 + (i - 1) / 2 - 1 : seq[i - 1] + x0 + (i - 2) / 2,
          why: (i - 1) % 2 === 0 ? 'Je gebruikte dezelfde optelling als de vorige keer. Die wordt steeds 1 groter.' : 'Nu is ×2 aan de beurt, niet de optelling.',
          tag: 'Verkeerde regel',
        }],
      };
    },
  });
  def({
    id: 'prime', name: 'Verschillen zijn priemgetallen', lv: [5, 5],
    hint: 'De verschillen zijn getallen die alleen deelbaar zijn door 1 en zichzelf.',
    quick: 'Ken de priemgetallen: 2, 3, 5, 7, 11, 13, 17, 19, 23.',
    lesson: 'Onregelmatige maar stijgende verschillen? Denk aan priemgetallen.',
    make() {
      const PR = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
      const p0 = rand(0, 2), a = rand(1, 20);
      const seq = [a];
      for (let k = 0; k < 6; k++) seq.push(seq[k] + PR[p0 + k]);
      return {
        seq, rule: `De verschillen zijn opeenvolgende priemgetallen: ${diffs(seq).map(fd).join(', ')}.`,
        derive: (i) => `${seq[i - 1]} + ${seq[i] - seq[i - 1]} = ${seq[i]}`,
        traps: (i) => [{ v: seq[i - 1] + (seq[i - 1] - seq[i - 2]) + 2, why: 'Je liet de verschillen steeds met 2 groeien. Het zijn priemgetallen.', tag: 'Verkeerde regel' }],
      };
    },
  });

  function generate(d, opt = {}) {
    return attempt(() => {
      let pool = P.filter((p) => d >= p.lv[0] && d <= p.lv[1]);
      let p = pick(pool);
      if (opt.kind) {
        const k = P.find((x) => x.id === opt.kind);
        if (k) p = k;
      }
      const r = p.make(d);
      if (!r) return null;
      const s = r.seq;
      const last = s.length - 1;
      const gi = d >= 3 && chance(0.3) ? rand(3, last - 1) : last;
      const ans = s[gi];
      const n = optCount(d);
      const near = shuffle([
        { v: ans + 1, why: 'Rekenfout: je zit er net naast. Reken de laatste stap nog eens na.', tag: 'Rekenfout' },
        { v: ans - 1, why: 'Rekenfout: je zit er net naast. Reken de laatste stap nog eens na.', tag: 'Rekenfout' },
        { v: ans + 2, why: 'Rekenfout: net niet goed. Controleer de stap.', tag: 'Rekenfout' },
        { v: ans - 2, why: 'Rekenfout: net niet goed. Controleer de stap.', tag: 'Rekenfout' },
        { v: ans + 10, why: 'Rekenfout met de tientallen.', tag: 'Rekenfout' },
        { v: ans - 10, why: 'Rekenfout met de tientallen.', tag: 'Rekenfout' },
      ]);
      const pool2 = [...r.traps(gi), ...near].map((t) => ({ key: String(t.v), html: fmtNum(t.v), text: fmtNum(t.v), why: t.why, tag: t.tag }));
      const built = buildOptions({ key: String(ans), html: fmtNum(ans), text: fmtNum(ans) }, pool2, n);
      if (!built) return null;
      const shown = s.map((v, i) => (i === gi ? '<span class="q">?</span>' : `<span>${fmtNum(v)}</span>`)).join('');
      const steps = [r.rule, `Dus: ${r.derive(gi)}.`];
      if (gi < last) steps.push(`Controle: het getal na het vraagteken klopt dan ook: ${r.derive(gi + 1)}.`);
      return {
        cat: 'num', diff: d, kindId: p.id, kind: p.name,
        prompt: gi === last ? 'Welk getal komt hierna?' : 'Welk getal hoort op de plek van het vraagteken?',
        stem: `<div class="seq">${shown}</div>`,
        opts: built.opts, ans: built.ans, layout: 'mono',
        steps, hint: p.hint, quick: p.quick, lesson: p.lesson,
      };
    });
  }

  MT.gens.num = { generate, kinds: P.map((p) => ({ id: p.id, name: p.name, lv: p.lv })) };
})(typeof window !== 'undefined' ? window : globalThis);
