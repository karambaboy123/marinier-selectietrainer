/* A. Cijferreeksen
 * Elke vraag toont een reeks waarvan de laatste twee getallen ontbreken. Het antwoord is één keuze
 * waarin beide getallen staan (bijv. "22  21"). Elke reeks volgt een duidelijke regel. */
(function (G) {
  'use strict';
  const MT = G.MT;
  const { rand, pick, chance, shuffle, fmtNum, sgn, optCount, buildOptions, attempt } = MT.util;

  const LO = 1, HI = 150; // kleinste en grootste getal dat in een reeks mag voorkomen
  const diffs = (a) => a.slice(1).map((v, i) => v - a[i]);
  const fd = (d) => (d >= 0 ? '+' + d : '−' + Math.abs(d));
  const sg = () => (chance(0.5) ? 1 : -1);
  const nz = (m) => { let v = 0; while (!v) v = rand(-m, m); return v; };
  const cum = (start, ds) => ds.reduce((a, d) => (a.push(a[a.length - 1] + d), a), [start]);
  // Schuift een reeks zo op dat het laagste getal LO + extra wordt
  const lift = (arr, extra) => { const mn = Math.min(...arr); return arr.map((v) => v - mn + LO + extra); };
  const P = [];
  const def = (o) => P.push(o);

  // Elk patroon: id, naam, niveaus [min,max], exam (komt voor in de Mariniers Training Mode),
  // make(d) -> {seq, rule, derive(i), traps(i)}; seq heeft minstens 7 getallen, de laatste twee worden gevraagd.
  def({
    id: 'arith', name: 'Vaste stap', lv: [1, 3],
    hint: 'Kijk naar het verschil tussen twee opeenvolgende getallen.',
    quick: 'Trek twee buren van elkaar af. Is dat verschil steeds gelijk, dan ben je klaar.',
    lesson: 'Begin altijd met de verschillen tussen de getallen.',
    make(d) {
      const st = d === 1 ? rand(2, 6) : rand(3, 12) * (chance(0.4) ? -1 : 1);
      const seq = lift(Array.from({ length: 9 }, (_, k) => k * st), rand(0, 20));
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
      const a = rand(1, 2), len = a === 1 ? 8 : 7, down = d === 3 && chance(0.5);
      const up = Array.from({ length: len }, (_, k) => a * 2 ** k);
      const seq = down ? up.slice().reverse() : up;
      return {
        seq, rule: down ? 'Elke stap wordt het getal gedeeld door 2.' : 'Elke stap wordt het getal ×2.',
        derive: (i) => (down ? `${seq[i - 1]} ÷ 2 = ${seq[i]}` : `${seq[i - 1]} × 2 = ${seq[i]}`),
        traps: (i) => [{
          v: down ? seq[i - 1] - (seq[i - 2] - seq[i - 1]) : seq[i - 1] + (seq[i - 1] - seq[i - 2]),
          why: 'Je herhaalde het laatste verschil. Hier wordt niet opgeteld maar vermenigvuldigd of gedeeld.', tag: 'Verkeerde regel',
        }],
      };
    },
  });
  def({
    id: 'plusmin', name: 'Afwisselende stappen', lv: [2, 4], exam: true,
    hint: 'Het verschil is niet steeds hetzelfde, maar wisselt om en om.',
    quick: 'Schrijf de verschillen onder de reeks. Een zigzag (bijv. −5, +20, −5, +20) valt dan meteen op.',
    lesson: 'Wisselen de verschillen om en om? Dan zijn er twee stappen die elkaar afwisselen.',
    make() {
      const p = rand(2, 9) * sg(), q = rand(2, 20) * sg();
      if (p === q) return null;
      const seq = lift(cum(0, Array.from({ length: 8 }, (_, k) => (k % 2 === 0 ? p : q))), rand(0, 60));
      return {
        seq, rule: `De stappen wisselen om en om: ${fd(p)}, ${fd(q)}, ${fd(p)}, ${fd(q)}, …`,
        derive: (i) => `${fmtNum(seq[i - 1])} ${sgn(seq[i] - seq[i - 1])} = ${fmtNum(seq[i])}`,
        traps: (i) => [
          { v: seq[i - 1] + ((i - 1) % 2 === 0 ? q : p), why: 'Je gebruikte de verkeerde stap. De stappen wisselen om en om, kijk welke nu aan de beurt is.', tag: 'Verkeerde regel' },
          { v: seq[i - 1] + (seq[i - 1] - seq[i - 2]), why: 'Je herhaalde het vorige verschil, maar de stappen wisselen af.', tag: 'Verkeerde regel' },
        ],
      };
    },
  });
  def({
    id: 'incdiff', name: 'Verschillen veranderen vast', lv: [2, 4], exam: true,
    hint: 'Bekijk de verschillen. Is daar zelf een patroon in?',
    quick: 'Schrijf de verschillen op een tweede regel. Die vormen vaak zelf een simpele reeks (+1, +2, +3 … of −2, −4, −6 …).',
    lesson: 'Geen vaste stap? Zoek het patroon in de verschillen.',
    make(d) {
      const s = d >= 3 ? sg() : 1;
      const d0 = s * rand(1, d >= 4 ? 6 : 4), st = s * (d >= 4 ? rand(1, 3) : rand(1, 2));
      const seq = lift(cum(0, Array.from({ length: 8 }, (_, k) => d0 + k * st)), rand(0, 40));
      const df = diffs(seq);
      return {
        seq, rule: `De verschillen veranderen steeds met ${fd(st)}: ${df.slice(0, 6).map(fd).join(', ')}, …`,
        derive: (i) => `${fmtNum(seq[i - 1])} ${sgn(seq[i] - seq[i - 1])} = ${fmtNum(seq[i])}`,
        traps: (i) => {
          const last = seq[i - 1] - seq[i - 2];
          return [
            { v: seq[i - 1] + last, why: 'Je herhaalde het vorige verschil, maar de verschillen veranderen steeds.', tag: 'Verkeerde regel' },
            { v: seq[i - 1] + last + 2 * st, why: `De verschillen veranderen met ${fd(st)} per stap, niet met ${fd(2 * st)}.`, tag: 'Rekenfout' },
          ];
        },
      };
    },
  });
  def({
    id: 'alt2', name: 'Twee reeksen door elkaar', lv: [2, 4], exam: true,
    hint: 'Kijk alleen naar de 1e, 3e, 5e… getallen, en daarna naar de 2e, 4e, 6e…',
    quick: 'Springt de reeks op en neer? Lees om en om: dan zie je twee simpele reeksen.',
    lesson: 'Rare sprongen? Probeer om-en-om te lezen.',
    make(d) {
      const d1 = nz(d >= 3 ? 9 : 4), geoB = d >= 4 && chance(0.35), d2 = nz(d >= 3 ? 9 : 4);
      let seq;
      if (geoB) {
        const a = rand(15, 60), b = rand(1, 3);
        seq = Array.from({ length: 9 }, (_, k) => { const j = Math.floor(k / 2); return k % 2 === 0 ? a + j * d1 : b * 2 ** j; });
      } else {
        const off = nz(25);
        const raw = Array.from({ length: 9 }, (_, k) => { const j = Math.floor(k / 2); return k % 2 === 0 ? j * d1 : off + j * d2; });
        seq = lift(raw, rand(0, 40));
      }
      const opB = geoB ? '×2' : fd(d2);
      return {
        seq, rule: `Twee reeksen om en om. De 1e, 3e, 5e… gaan steeds ${fd(d1)}. De 2e, 4e, 6e… gaan steeds ${opB}.`,
        derive: (i) => {
          const first = i % 2 === 0;
          return `Plek ${i + 1} hoort bij de ${first ? 'eerste' : 'tweede'} reeks: ${fmtNum(seq[i - 2])} ${first ? sgn(d1) : geoB ? '× 2' : sgn(d2)} = ${fmtNum(seq[i])}`;
        },
        traps: (i) => {
          const first = i % 2 === 0;
          return [
            { v: first ? seq[i - 1] + d1 : geoB ? seq[i - 1] * 2 : seq[i - 1] + d2, why: 'Je paste de juiste stap toe op het getal ervoor. Die hoort bij de andere reeks.', tag: 'Verkeerde regel' },
            { v: first ? (geoB ? seq[i - 2] * 2 : seq[i - 2] + d2) : seq[i - 2] + d1, why: 'Je gebruikte de stap van de andere reeks.', tag: 'Verkeerde regel' },
          ];
        },
      };
    },
  });
  def({
    id: 'altdiff', name: 'Verschillen in twee reeksen', lv: [3, 5], exam: true,
    hint: 'Schrijf de verschillen op. Kijk dan alleen naar de 1e, 3e, 5e… verschillen, en daarna naar de 2e, 4e, 6e…',
    quick: 'Verschillen zoals −7, −2, −8, −3, −9, −4 springen heen en weer. Lees ze om en om: −7, −8, −9 en −2, −3, −4.',
    lesson: 'Geen vast patroon in de verschillen? Lees de verschillen zelf om en om.',
    make() {
      const p0 = nz(9), ps = pick([-2, -1, 1, 2]), q0 = nz(6), qs = pick([-2, -1, 1, 2]);
      const ds = Array.from({ length: 8 }, (_, k) => (k % 2 === 0 ? p0 + (k / 2) * ps : q0 + ((k - 1) / 2) * qs));
      if (ds.some((v) => v === 0)) return null;
      const seq = lift(cum(0, ds), rand(0, 50));
      return {
        seq, rule: `De verschillen vormen zelf twee reeksen om en om: ${ds.slice(0, 6).map(fd).join(', ')}, … De 1e, 3e, 5e… verschillen veranderen steeds met ${fd(ps)}, de 2e, 4e, 6e… met ${fd(qs)}.`,
        derive: (i) => `${fmtNum(seq[i - 1])} ${sgn(seq[i] - seq[i - 1])} = ${fmtNum(seq[i])}`,
        traps: (i) => {
          const last = seq[i - 1] - seq[i - 2], prev = seq[i - 2] - seq[i - 3];
          return [
            { v: seq[i - 1] + last, why: 'Je herhaalde het vorige verschil.', tag: 'Verkeerde regel' },
            { v: seq[i - 1] + last + (last - prev), why: 'Je liet de verschillen met één vaste stap veranderen, maar het zijn twee reeksen om en om.', tag: 'Verkeerde regel' },
          ];
        },
      };
    },
  });
  def({
    id: 'alt2inc', name: 'Twee reeksen met veranderende stap', lv: [3, 5], exam: true,
    hint: 'Lees de reeks om en om. Bij beide reeksen veranderen de stappen zelf ook steeds een beetje.',
    quick: 'Splits in twee reeksen en schrijf per reeks de verschillen op. Die lopen bijvoorbeeld −7, −5, −3.',
    lesson: 'Twee reeksen door elkaar kunnen elk hun eigen veranderende stap hebben.',
    make() {
      const mk = () => { const e = nz(8); return { e, s: chance(0.7) ? -Math.sign(e) * rand(1, 2) : Math.sign(e) * rand(1, 2) }; };
      const A = mk(), B = mk(), off = nz(12);
      const a = [0], b = [off];
      for (let k = 0; k < 4; k++) a.push(a[k] + A.e + k * A.s);
      for (let k = 0; k < 3; k++) b.push(b[k] + B.e + k * B.s);
      const raw = Array.from({ length: 9 }, (_, k) => (k % 2 === 0 ? a[k / 2] : b[(k - 1) / 2]));
      const seq = lift(raw, rand(0, 40));
      const da = [0, 1, 2].map((k) => A.e + k * A.s), db = [0, 1].map((k) => B.e + k * B.s);
      return {
        seq, rule: `Twee reeksen om en om. Bij de 1e, 3e, 5e… zijn de stappen ${da.map(fd).join(', ')}, … (steeds ${fd(A.s)}). Bij de 2e, 4e, 6e… zijn de stappen ${db.map(fd).join(', ')}, … (steeds ${fd(B.s)}).`,
        derive: (i) => `Plek ${i + 1}: ${fmtNum(seq[i - 2])} ${sgn(seq[i] - seq[i - 2])} = ${fmtNum(seq[i])}`,
        traps: (i) => [
          { v: seq[i - 2] + (seq[i - 2] - seq[i - 4]), why: 'Je herhaalde de vorige stap van dezelfde reeks, maar die stap verandert elke keer.', tag: 'Verkeerde regel' },
          { v: seq[i - 2] + (seq[i - 3] - seq[i - 5]), why: 'Je gebruikte de stap van de andere reeks.', tag: 'Verkeerde regel' },
        ],
      };
    },
  });
  def({
    id: 'zigzag', name: 'Groeiende zigzag met +1 / −1', lv: [4, 5], exam: true,
    hint: 'Schrijf de verschillen op. Er zitten twee regels door elkaar: kleine stappen van +1 en −1, en grote stappen die steeds groter worden.',
    quick: 'Verschillen zoals −18, +1, +19, −1, −20, +1: lees ze om en om. De 2e, 4e, 6e… zijn +1/−1, de rest wisselt van teken en groeit.',
    lesson: 'Zie je grote en kleine verschillen om en om? Lees ze als twee aparte reeksen.',
    make() {
      const c = rand(12, 22), fl = sg(), ds = [];
      for (let k = 0; k < 8; k++) {
        if (k % 2 === 0) { const m = k / 2; ds.push(fl * (m % 2 === 0 ? -(c + m) : c + m)); } else ds.push(fl * (((k - 1) / 2) % 2 === 0 ? 1 : -1));
      }
      const seq = lift(cum(0, ds), rand(0, 5));
      return {
        seq, rule: `De verschillen vormen twee reeksen om en om: ${ds.slice(0, 7).map(fd).join(', ')}, … De 1e, 3e, 5e… verschillen worden steeds 1 groter en wisselen van teken. De 2e, 4e, 6e… verschillen zijn om en om +1 en −1.`,
        derive: (i) => `${fmtNum(seq[i - 1])} ${sgn(seq[i] - seq[i - 1])} = ${fmtNum(seq[i])}`,
        traps: (i) => {
          const last = seq[i - 1] - seq[i - 2];
          return [
            { v: seq[i - 1] + last, why: 'Je herhaalde het vorige verschil.', tag: 'Verkeerde regel' },
            { v: seq[i - 1] - last, why: 'Je draaide het vorige verschil om, maar er zitten twee reeksen door elkaar.', tag: 'Verkeerde regel' },
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
      const x = rand(1, 5), neg = d >= 4 && chance(0.5), a = rand(neg ? 4 : 1, neg ? 8 : 6);
      const seq = [a];
      for (let k = 0; k < 8; k++) seq.push(k % 2 === 0 ? seq[k] + (neg ? -x : x) : seq[k] * 2);
      const op1 = neg ? '−' + x : '+' + x;
      if (seq.some((v) => v <= 0)) return null;
      return {
        seq, rule: `De bewerkingen wisselen om en om: ${op1}, ×2, ${op1}, ×2, …`,
        derive: (i) => ((i - 1) % 2 === 0 ? `${seq[i - 1]} ${neg ? '− ' + x : '+ ' + x} = ${seq[i]}` : `${seq[i - 1]} × 2 = ${seq[i]}`),
        traps: (i) => [{
          v: (i - 1) % 2 === 0 ? seq[i - 1] * 2 : seq[i - 1] + (neg ? -x : x),
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
      const seq = [rand(1, 4), rand(1, 6)];
      for (let k = 2; k < 9; k++) seq.push(seq[k - 1] + seq[k - 2]);
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
    hint: 'Denk aan bekende getallen: 1, 4, 9, 16, 25… of 2, 6, 12, 20…',
    quick: 'Ken de kwadraten tot 12 uit je hoofd. Dan herken je ze direct.',
    lesson: 'Verschillen die steeds 2 groter worden (3, 5, 7, 9…)? Dat zijn kwadraten.',
    make(d) {
      const kind = d >= 4 && chance(0.5) ? 'rect' : 'sq';
      const c = d === 2 ? 0 : pick([0, 1, -1, 2, -2, 3]);
      const n0 = kind === 'sq' ? rand(1, 4) : rand(1, 3);
      const f = (n) => (kind === 'sq' ? n * n : n * (n + 1)) + c;
      const fs = (n) => (kind === 'sq' ? `${n}×${n}` : `${n}×${n + 1}`) + (c ? (c > 0 ? ` + ${c}` : ` − ${-c}`) : '');
      const seq = Array.from({ length: 9 }, (_, k) => f(n0 + k));
      const nm = { sq: 'kwadraten (n × n)', rect: 'n × (n + 1)' }[kind];
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
    quick: 'Is het volgende getal bijna het dubbele? Kijk dan hoeveel het ernaast zit.',
    lesson: 'Bijna ×2? Dan zit er vaak nog een + of − achter.',
    make() {
      const c = rand(1, 4) * (chance(0.6) ? -1 : 1), a = rand(2, 6);
      const seq = [a];
      for (let k = 0; k < 6; k++) seq.push(seq[k] * 2 + c);
      if (seq.some((v) => v <= 0)) return null;
      return {
        seq, rule: `Elke stap: ×2 en dan ${fd(c)}.`,
        derive: (i) => `${seq[i - 1]} × 2 ${sgn(c)} = ${seq[i]}`,
        traps: (i) => [
          { v: seq[i - 1] * 2, why: `Je vergat de tweede bewerking (${fd(c)}).`, tag: 'Tweede regel gemist' },
          { v: seq[i - 1] * 2 - c, why: `Je deed ${fd(-c)} in plaats van ${fd(c)}.`, tag: 'Verkeerde richting' },
        ],
      };
    },
  });
  def({
    id: 'diffmul', name: 'Verschillen vermenigvuldigen', lv: [4, 5],
    hint: 'Schrijf de verschillen op. Hoe hangen die met elkaar samen?',
    quick: 'Schrijf de verschillen op en deel ze door elkaar.',
    lesson: 'Verschillen kunnen zelf ×2 gaan.',
    make() {
      const seq = [rand(1, 20)];
      for (let k = 0; k < 7; k++) seq.push(seq[k] + 2 ** k);
      const df = diffs(seq);
      return {
        seq, rule: `De verschillen worden steeds ×2: ${df.slice(0, 5).map(fd).join(', ')}, …`,
        derive: (i) => `${seq[i - 1]} + ${seq[i] - seq[i - 1]} = ${seq[i]}`,
        traps: (i) => {
          const a1 = seq[i - 1] - seq[i - 2], a0 = seq[i - 2] - seq[i - 3];
          return [
            { v: seq[i - 1] + a1 + (a1 - a0), why: 'Je liet de verschillen met een vast getal groeien. Ze worden ×2.', tag: 'Verkeerde regel' },
            { v: seq[i - 1] + a1, why: 'Je herhaalde het vorige verschil.', tag: 'Verkeerde regel' },
          ];
        },
      };
    },
  });
  def({
    id: 'sqdiff', name: 'Verschillen zijn kwadraten', lv: [4, 5],
    hint: 'Bekijk de verschillen. Herken je die getallen?',
    quick: 'Verschillen 1, 4, 9, 16…? Die herken je alleen als je de kwadraten uit je hoofd kent.',
    lesson: 'De verschillen kunnen zelf een bekende reeks zijn.',
    make() {
      const seq = [rand(1, 10)];
      for (let k = 0; k < 7; k++) seq.push(seq[k] + (k + 1) ** 2);
      const df = diffs(seq);
      return {
        seq, rule: `De verschillen zijn kwadraten: ${df.slice(0, 5).map(fd).join(', ')}, …`,
        derive: (i) => `${seq[i - 1]} + ${i}×${i} = ${seq[i]}`,
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
      const seq = [rand(1, 2), rand(1, 2), rand(1, 3)];
      for (let k = 3; k < 9; k++) seq.push(seq[k - 1] + seq[k - 2] + seq[k - 3]);
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
      for (let k = 0; k < 8; k++) seq.push(k % 2 === 0 ? seq[k] + x0 + k / 2 : seq[k] * 2);
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
      const p0 = rand(0, 2), seq = [rand(1, 20)];
      for (let k = 0; k < 8; k++) seq.push(seq[k] + PR[p0 + k]);
      return {
        seq, rule: `De verschillen zijn opeenvolgende priemgetallen: ${diffs(seq).slice(0, 6).map(fd).join(', ')}, …`,
        derive: (i) => `${seq[i - 1]} + ${seq[i] - seq[i - 1]} = ${seq[i]}`,
        traps: (i) => [{ v: seq[i - 1] + (seq[i - 1] - seq[i - 2]) + 2, why: 'Je liet de verschillen steeds met 2 groeien. Het zijn priemgetallen.', tag: 'Verkeerde regel' }],
      };
    },
  });

  const pairHtml = (x, y) => `${fmtNum(x)}&emsp;${fmtNum(y)}`;
  const pairText = (x, y) => `${fmtNum(x)} en ${fmtNum(y)}`;

  /** opt.exam (Mariniers Training Mode): alleen patronen die in de echte opgaven voorkomen, 4 antwoordopties. */
  function generate(d, opt = {}) {
    return attempt(() => {
      let p = opt.kind ? P.find((x) => x.id === opt.kind) : null;
      if (!p) p = pick(opt.exam ? P.filter((x) => x.exam) : P.filter((x) => d >= x.lv[0] && d <= x.lv[1]));
      const r = p.make(opt.exam ? rand(p.lv[0], p.lv[1]) : d);
      if (!r) return null;
      const s = r.seq, n = s.length;
      if (n < 7 || s.some((v) => !Number.isInteger(v) || v < LO || v > HI)) return null;
      const gi = n - 2, a = s[gi], b = s[gi + 1]; // de twee gevraagde getallen
      const ok = (x, y) => x >= 0 && y >= 0 && x <= HI + 50 && y <= HI + 50;
      const mk = (x, y, why, tag) => (ok(x, y) ? { key: `${x},${y}`, html: pairHtml(x, y), text: pairText(x, y), why, tag } : null);
      const step = b - a;
      const traps = r.traps(gi).flatMap((t) => [
        mk(t.v, t.v + step, t.why, t.tag),
        mk(t.v, b, `${t.why} Ook het eerste getal hoort er dan niet bij.`, t.tag),
      ]);
      const prev = s[gi - 1] - s[gi - 2];
      const near = shuffle([
        mk(a, b + 1, 'Het eerste getal klopt, maar het tweede zit er net naast. Pas de regel twee keer na elkaar toe.', 'Rekenfout'),
        mk(a, b - 1, 'Het eerste getal klopt, maar het tweede zit er net naast. Pas de regel twee keer na elkaar toe.', 'Rekenfout'),
        mk(a, b + 2, 'Het eerste getal klopt, het tweede niet. Controleer de tweede stap.', 'Rekenfout'),
        mk(a, b - 2, 'Het eerste getal klopt, het tweede niet. Controleer de tweede stap.', 'Rekenfout'),
        mk(a + 1, b, 'Het tweede getal klopt, maar het eerste zit er net naast. Controleer de eerste stap.', 'Rekenfout'),
        mk(a - 1, b, 'Het tweede getal klopt, maar het eerste zit er net naast. Controleer de eerste stap.', 'Rekenfout'),
        mk(a + 10, b + 10, 'Rekenfout met de tientallen.', 'Rekenfout'),
        mk(a - 10, b - 10, 'Rekenfout met de tientallen.', 'Rekenfout'),
        a !== b ? mk(b, a, 'Je zette de twee getallen in de verkeerde volgorde.', 'Leesfout') : null,
        mk(s[gi - 1] + prev, s[gi - 1] + 2 * prev, 'Je herhaalde het laatste verschil, zonder de regel van de reeks te volgen.', 'Verkeerde regel'),
      ]);
      const built = buildOptions({ key: `${a},${b}`, html: pairHtml(a, b), text: pairText(a, b) }, [...traps, ...near].filter(Boolean), opt.exam ? 4 : optCount(d));
      if (!built) return null;
      const shown = s.slice(0, gi).map((v) => `<span>${fmtNum(v)}</span>`).join('') + '<span class="q">?</span><span class="q">?</span>';
      const dl = [];
      for (let i = 1; i < gi && dl.length < 4; i++) dl.push(`${fmtNum(s[i])} − ${fmtNum(s[i - 1])} = ${fmtNum(s[i] - s[i - 1])}`);
      const steps = [`Bekijk eerst de verschillen: ${dl.join(', ')}${dl.length < gi - 1 ? ', …' : ''}.`, r.rule, `Dus: ${r.derive(gi)}, en daarna ${r.derive(gi + 1)}.`, 'Deze regel verklaart álle overgangen. Dan kun je stoppen met zoeken.'];
      return {
        cat: 'num', diff: d, kindId: p.id, kind: p.name, meta: { gap: gi, pair: true },
        prompt: 'Welke twee getallen komen hierna?',
        stem: `<div class="seq">${shown}</div>`,
        opts: built.opts, ans: built.ans, layout: 'mono',
        steps, hint: p.hint, quick: p.quick, lesson: p.lesson,
      };
    });
  }

  MT.gens.num = { generate, kinds: P.map((p) => ({ id: p.id, name: p.name, lv: p.lv, exam: !!p.exam })) };
})(typeof window !== 'undefined' ? window : globalThis);
