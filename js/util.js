/* Marinier Selectietrainer — gedeelde hulpfuncties
 * Alle vragen worden willekeurig gegenereerd. Niets hiervan zijn officiële
 * vragen van Defensie of het Korps Mariniers. */
(function (G) {
  'use strict';
  const MT = (G.MT = G.MT || {});

  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const chance = (p) => Math.random() < p;
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmtNum = (n) => (n < 0 ? '−' + Math.abs(n) : String(n));
  const sgn = (d) => (d >= 0 ? '+ ' + d : '− ' + Math.abs(d));
  const LETTERS = 'ABCDE';

  /** Aantal antwoordopties per moeilijkheid. */
  const optCount = (d) => (d >= 3 ? 5 : 4);

  /**
   * Maakt de antwoordopties.
   * correct: {key, html, text}
   * pool: [{key, html, text, why, tag}] in volgorde van voorkeur (meest verleidelijke eerst)
   * Geeft null terug als er te weinig unieke afleiders zijn (generator probeert opnieuw).
   */
  function buildOptions(correct, pool, n) {
    const seen = new Set([correct.key]);
    const chosen = [];
    for (const p of pool) {
      if (p == null || p.key == null || seen.has(p.key)) continue;
      seen.add(p.key);
      chosen.push(p);
      if (chosen.length === n - 1) break;
    }
    if (chosen.length < n - 1) return null;
    const opts = shuffle([{ ...correct, why: null, tag: null, correct: true }, ...chosen]);
    return { opts, ans: opts.findIndex((o) => o.correct) };
  }

  /** Probeer een generator meerdere keren tot hij een geldige vraag oplevert. */
  function attempt(fn, tries = 400) {
    for (let i = 0; i < tries; i++) {
      const q = fn();
      if (q) return q;
    }
    throw new Error('Kon geen geldige vraag maken');
  }

  const CATS = {
    num: { id: 'num', letter: 'A', name: 'Cijferreeksen', short: 'Cijfers', icon: '🔢', base: 40 },
    ana: { id: 'ana', letter: 'B', name: 'Analogieën', short: 'Analogieën', icon: '🔤', base: 30 },
    dia: { id: 'dia', letter: 'C', name: 'Diagrammen', short: 'Diagrammen', icon: '◯', base: 50 },
    fig: { id: 'fig', letter: 'D', name: 'Figuurreeksen', short: 'Figuren', icon: '🔷', base: 45 },
    log: { id: 'log', letter: 'E', name: 'Logisch redeneren', short: 'Logisch', icon: '🧩', base: 70 },
    abs: { id: 'abs', letter: 'F', name: 'Abstract redeneren', short: 'Abstract', icon: '🧠', base: 50 },
  };
  const CAT_IDS = Object.keys(CATS);

  MT.util = { rand, pick, chance, shuffle, esc, clamp, fmtNum, sgn, LETTERS, optCount, buildOptions, attempt };
  MT.CATS = CATS;
  MT.CAT_IDS = CAT_IDS;
  MT.gens = MT.gens || {};
})(typeof window !== 'undefined' ? window : globalThis);
