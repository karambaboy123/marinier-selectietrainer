/* B. Analogieën: woorden, getallen en letters */
(function (G) {
  'use strict';
  const MT = G.MT;
  const { rand, pick, chance, shuffle, esc, optCount, buildOptions, attempt } = MT.util;

  // [a, b, c, antwoord, [afleiders], relatie, uitleg, niveau]
  const WORDS = [
    ['vis', 'water', 'vogel', 'lucht', ['nest', 'veer', 'vleugel', 'ei'], 'leefomgeving', 'Een vis beweegt zich in het water, een vogel in de lucht.', 1],
    ['oog', 'zien', 'oor', 'horen', ['geluid', 'muziek', 'hoofd', 'praten'], 'functie', 'Met je oog zie je, met je oor hoor je.', 1],
    ['dag', 'week', 'maand', 'jaar', ['uur', 'seizoen', 'kalender', 'datum'], 'deel en geheel', 'Een dag is een deel van een week, een maand een deel van een jaar.', 1],
    ['warm', 'koud', 'hoog', 'laag', ['berg', 'lang', 'toren', 'boven'], 'tegenstelling', 'Warm is het tegenovergestelde van koud, hoog van laag.', 1],
    ['kapitein', 'schip', 'piloot', 'vliegtuig', ['vliegveld', 'uniform', 'passagier', 'wolk'], 'wie bestuurt wat', 'Een kapitein bestuurt een schip, een piloot een vliegtuig.', 1],
    ['bakker', 'brood', 'slager', 'vlees', ['mes', 'winkel', 'koe', 'schort'], 'maker en product', 'Een bakker verkoopt en maakt brood, een slager vlees.', 1],
    ['hand', 'vinger', 'voet', 'teen', ['schoen', 'been', 'lopen', 'sok'], 'geheel en deel', 'Een vinger zit aan je hand, een teen aan je voet.', 1],
    ['lamp', 'licht', 'kachel', 'warmte', ['hout', 'winter', 'vuur', 'kamer'], 'wat het geeft', 'Een lamp geeft licht, een kachel geeft warmte.', 1],
    ['eik', 'boom', 'roos', 'bloem', ['doorn', 'tuin', 'rood', 'vaas'], 'soort en categorie', 'Een eik is een soort boom, een roos een soort bloem.', 1],
    ['zaag', 'hout', 'schaar', 'papier', ['mes', 'knippen', 'lijm', 'potlood'], 'gereedschap en materiaal', 'Met een zaag snijd je hout, met een schaar papier.', 1],
    ['rups', 'vlinder', 'kikkervisje', 'kikker', ['vijver', 'vis', 'ei', 'sloot'], 'jong stadium en volwassen dier', 'Een rups wordt een vlinder, een kikkervisje wordt een kikker.', 1],
    ['klok', 'tijd', 'thermometer', 'temperatuur', ['koorts', 'graden', 'warmte', 'kwik'], 'instrument en wat het meet', 'Een klok meet tijd, een thermometer meet temperatuur.', 1],
    ['pen', 'schrijven', 'schaar', 'knippen', ['papier', 'scherp', 'lijm', 'mes'], 'functie', 'Met een pen schrijf je, met een schaar knip je.', 1],
    ['nat', 'droog', 'vol', 'leeg', ['glas', 'zwaar', 'half', 'water'], 'tegenstelling', 'Nat is het tegenovergestelde van droog, vol van leeg.', 1],
    ['koe', 'kalf', 'paard', 'veulen', ['stal', 'zadel', 'hooi', 'ezel'], 'dier en jong', 'Het jong van een koe is een kalf, het jong van een paard een veulen.', 1],
    ['boom', 'bos', 'huis', 'dorp', ['dak', 'deur', 'tuin', 'straat'], 'deel en groter geheel', 'Veel bomen samen vormen een bos, veel huizen samen een dorp.', 1],
    ['zomer', 'warm', 'winter', 'koud', ['sneeuw', 'december', 'jas', 'ijs'], 'seizoen en temperatuur', 'In de zomer is het warm, in de winter is het koud.', 1],
    ['auto', 'garage', 'vliegtuig', 'hangar', ['piloot', 'lucht', 'vleugel', 'motor'], 'waar het gestald wordt', 'Een auto staat in een garage, een vliegtuig in een hangar.', 1],
    ['schoen', 'voet', 'handschoen', 'hand', ['wol', 'winter', 'vinger', 'sjaal'], 'kleding en lichaamsdeel', 'Een schoen draag je aan je voet, een handschoen aan je hand.', 1],
    ['drie', 'driehoek', 'vier', 'vierkant', ['getal', 'hoek', 'lijn', 'cirkel'], 'aantal hoeken en vorm', 'Een driehoek heeft drie hoeken, een vierkant vier.', 1],
    ['kok', 'keuken', 'monteur', 'werkplaats', ['auto', 'sleutel', 'olie', 'overall'], 'beroep en werkplek', 'Een kok werkt in een keuken, een monteur in een werkplaats.', 2],
    ['ijs', 'smelten', 'water', 'koken', ['nat', 'vloeibaar', 'drinken', 'zee'], 'wat er bij verwarmen gebeurt', 'IJs smelt als het warm wordt, water kookt als het heet wordt.', 2],
    ['woord', 'zin', 'noot', 'melodie', ['muziek', 'zingen', 'piano', 'klank'], 'bouwsteen en geheel', 'Woorden vormen samen een zin, noten samen een melodie.', 2],
    ['helm', 'hoofd', 'scheenbeschermer', 'been', ['voetbal', 'sok', 'schop', 'knie'], 'bescherming en lichaamsdeel', 'Een helm beschermt je hoofd, een scheenbeschermer je been.', 2],
    ['vliegtuig', 'piloot', 'trein', 'machinist', ['conducteur', 'spoor', 'reiziger', 'station'], 'voertuig en bestuurder', 'Een piloot bestuurt een vliegtuig, een machinist een trein.', 2],
    ['bij', 'honing', 'koe', 'melk', ['weide', 'gras', 'boer', 'stier'], 'dier en wat het levert', 'Een bij levert honing, een koe levert melk.', 2],
    ['gram', 'kilogram', 'meter', 'kilometer', ['centimeter', 'lengte', 'liniaal', 'afstand'], 'eenheid en 1000 keer zo groot', 'Een kilogram is 1000 gram, een kilometer is 1000 meter.', 2],
    ['kompas', 'richting', 'weegschaal', 'gewicht', ['kilo', 'balans', 'markt', 'groente'], 'instrument en wat het bepaalt', 'Met een kompas bepaal je de richting, met een weegschaal het gewicht.', 2],
    ['anker', 'schip', 'rem', 'auto', ['wiel', 'weg', 'motor', 'snelheid'], 'waarmee je iets stilzet', 'Een anker houdt een schip op zijn plek, een rem zet een auto stil.', 2],
    ['uniform', 'soldaat', 'toga', 'rechter', ['rechtbank', 'wet', 'hamer', 'vonnis'], 'beroepskleding', 'Een soldaat draagt een uniform, een rechter een toga.', 2],
    ['sergeant', 'peloton', 'kapitein', 'compagnie', ['soldaat', 'kazerne', 'rang', 'oefening'], 'commandant en eenheid', 'Een sergeant leidt een peloton, een kapitein een compagnie.', 2],
    ['druppel', 'oceaan', 'zandkorrel', 'woestijn', ['steen', 'zon', 'kameel', 'zandloper'], 'kleinste deel en enorm geheel', 'Een druppel is een piepklein deel van een oceaan, een zandkorrel van een woestijn.', 2],
    ['ei', 'kip', 'zaad', 'plant', ['grond', 'water', 'zak', 'tuin'], 'begin en wat eruit groeit', 'Uit een ei komt een kip, uit een zaad groeit een plant.', 2],
    ['schip', 'haven', 'vliegtuig', 'luchthaven', ['wolk', 'piloot', 'vleugel', 'ticket'], 'waar het aankomt', 'Een schip meert aan in een haven, een vliegtuig landt op een luchthaven.', 2],
    ['boek', 'bladzijde', 'trein', 'wagon', ['rails', 'station', 'conducteur', 'reis'], 'geheel en deel', 'Een boek bestaat uit bladzijden, een trein uit wagons.', 2],
    ['brand', 'brandweer', 'ziekte', 'arts', ['ziekenhuis', 'medicijn', 'patiënt', 'koorts'], 'probleem en wie het bestrijdt', 'De brandweer bestrijdt brand, een arts bestrijdt ziekte.', 2],
    ['leeuw', 'welp', 'hond', 'puppy', ['blaffen', 'hok', 'kat', 'riem'], 'dier en jong', 'Een jonge leeuw is een welp, een jonge hond een puppy.', 2],
    ['regen', 'paraplu', 'zon', 'zonnebril', ['strand', 'warmte', 'zomer', 'hitte'], 'waar je je mee beschermt', 'Tegen regen gebruik je een paraplu, tegen de zon een zonnebril.', 2],
    ['lauw', 'heet', 'koel', 'koud', ['warm', 'ijs', 'winter', 'sneeuw'], 'gradatie: mild en sterk', 'Heet is een sterkere vorm van lauw, koud een sterkere vorm van koel.', 3],
    ['fluisteren', 'schreeuwen', 'wandelen', 'rennen', ['stilstaan', 'schoen', 'sport', 'pad'], 'gradatie: rustig en heftig', 'Schreeuwen is een heftige vorm van fluisteren, rennen een heftige vorm van wandelen.', 3],
    ['dirigent', 'orkest', 'trainer', 'team', ['sport', 'veld', 'fluit', 'wedstrijd'], 'wie een groep leidt', 'Een dirigent leidt een orkest, een trainer leidt een team.', 3],
    ['sleutel', 'slot', 'wachtwoord', 'account', ['computer', 'letters', 'internet', 'geheim'], 'wat iets opent', 'Een sleutel opent een slot, een wachtwoord opent een account.', 3],
    ['kilometer', 'afstand', 'liter', 'inhoud', ['water', 'fles', 'melk', 'gewicht'], 'eenheid en grootheid', 'Kilometer is een eenheid van afstand, liter van inhoud.', 3],
    ['vergrootglas', 'klein', 'verrekijker', 'ver', ['groot', 'oog', 'glas', 'vogel'], 'hulpmiddel en wat je ermee kunt zien', 'Met een vergrootglas zie je kleine dingen, met een verrekijker dingen die ver weg zijn.', 3],
    ['alarm', 'gevaar', 'koorts', 'ziekte', ['thermometer', 'warm', 'bed', 'arts'], 'signaal en oorzaak', 'Een alarm wijst op gevaar, koorts wijst op ziekte.', 3],
    ['recept', 'koken', 'kaart', 'navigeren', ['vouwen', 'papier', 'kompas', 'land'], 'leidraad en activiteit', 'Een recept gebruik je bij het koken, een kaart bij het navigeren.', 3],
    ['voorwoord', 'boek', 'ouverture', 'opera', ['zanger', 'muziek', 'theater', 'applaus'], 'opening en geheel', 'Een voorwoord opent een boek, een ouverture opent een opera.', 3],
    ['training', 'conditie', 'studie', 'kennis', ['school', 'boek', 'examen', 'docent'], 'activiteit en wat het oplevert', 'Door training krijg je conditie, door studie krijg je kennis.', 3],
    ['droogte', 'oogst', 'blessure', 'prestatie', ['arts', 'pijn', 'sport', 'rust'], 'wat iets schaadt', 'Droogte schaadt de oogst, een blessure schaadt de prestatie.', 3],
  ];

  function wordQ(d) {
    const lvl = d <= 1 ? [1] : d === 2 ? [1, 2] : [2, 3];
    const it = pick(WORDS.filter((w) => lvl.includes(w[7])));
    const [a, b, c, dd, wrong, rel, why] = it;
    const n = optCount(d);
    const pool = shuffle(wrong).map((w) => ({
      key: w, html: esc(w), text: w, tag: 'Relatie niet gelijk',
      why: `“${w}” heeft wel met “${c}” te maken, maar niet op dezelfde manier als “${b}” met “${a}” (${rel}).`,
    }));
    const built = buildOptions({ key: dd, html: esc(dd), text: dd }, pool, n);
    return {
      cat: 'ana', diff: d, kindId: 'word', kind: 'Woordanalogie',
      prompt: 'Welk woord hoort op de open plek?',
      stem: `<div class="analogy"><b>${esc(a)}</b><span class="op">:</span><b>${esc(b)}</b><span class="op">=</span><b>${esc(c)}</b><span class="op">:</span><span class="gap">?</span></div>`,
      opts: built.opts, ans: built.ans, layout: 'text',
      steps: [`Bepaal eerst de relatie tussen “${a}” en “${b}”: ${rel}.`, `Pas dezelfde relatie toe op “${c}”. ${why}`],
      hint: `Maak een korte zin die “${a}” en “${b}” verbindt.`,
      quick: 'Maak een zin van het eerste paar en zet het derde woord in dezelfde zin. Het woord dat precies past, wint.',
      lesson: 'Zoek de relatie, niet het onderwerp. Een woord dat alleen “erbij hoort” is vaak een valkuil.',
    };
  }

  /* ---- Getalanalogieën ---- */
  function numFamily() {
    const F = [];
    for (let k = 1; k <= 40; k++) F.push({ n: `+${k}`, f: (x) => x + k }, { n: `−${k}`, f: (x) => x - k });
    for (let k = 2; k <= 9; k++) F.push({ n: `×${k}`, f: (x) => x * k });
    F.push({ n: 'x × x', f: (x) => x * x }, { n: 'x × x × x', f: (x) => x ** 3 }, { n: 'x × (x + 1)', f: (x) => x * (x + 1) }, { n: 'x × (x − 1)', f: (x) => x * (x - 1) }, { n: '2 × x × x', f: (x) => 2 * x * x });
    for (let a = 2; a <= 5; a++) for (let b = -9; b <= 9; b++) if (b) F.push({ n: `×${a} ${b > 0 ? '+' : '−'} ${Math.abs(b)}`, f: (x) => a * x + b });
    for (let k = -9; k <= 9; k++) if (k) F.push({ n: `x × x ${k > 0 ? '+' : '−'} ${Math.abs(k)}`, f: (x) => x * x + k }, { n: `x × x × x ${k > 0 ? '+' : '−'} ${Math.abs(k)}`, f: (x) => x ** 3 + k });
    return F;
  }
  const NF = numFamily();
  const NUM_RULES = {
    2: () => pick([() => { const k = rand(3, 15); return { n: `+${k}`, f: (x) => x + k, say: `er komt steeds ${k} bij` }; }, () => { const k = rand(2, 6); return { n: `×${k}`, f: (x) => x * k, say: `het getal wordt ×${k}` }; }])(),
    3: () => pick([() => ({ n: 'x × x', f: (x) => x * x, say: 'het getal wordt met zichzelf vermenigvuldigd' }), () => { const a = rand(2, 4), b = rand(1, 7) * (chance(0.5) ? 1 : -1); return { n: `×${a} ${b > 0 ? '+' : '−'} ${Math.abs(b)}`, f: (x) => a * x + b, say: `het getal wordt ×${a} en dan ${b > 0 ? '+' : '−'}${Math.abs(b)}` }; }])(),
    4: () => pick([() => { const k = rand(1, 6) * (chance(0.5) ? 1 : -1); return { n: `x × x ${k > 0 ? '+' : '−'} ${Math.abs(k)}`, f: (x) => x * x + k, say: `het kwadraat van het getal, ${k > 0 ? 'plus' : 'min'} ${Math.abs(k)}` }; }, () => ({ n: 'x × x × x', f: (x) => x ** 3, say: 'het getal tot de derde macht' }), () => { const a = rand(3, 5), b = rand(2, 9) * (chance(0.5) ? 1 : -1); return { n: `×${a} ${b > 0 ? '+' : '−'} ${Math.abs(b)}`, f: (x) => a * x + b, say: `het getal wordt ×${a} en dan ${b > 0 ? '+' : '−'}${Math.abs(b)}` }; }])(),
    5: () => pick([() => ({ n: 'x × (x + 1)', f: (x) => x * (x + 1), say: 'het getal keer het getal erna' }), () => ({ n: 'x × (x − 1)', f: (x) => x * (x - 1), say: 'het getal keer het getal ervoor' }), () => ({ n: '2 × x × x', f: (x) => 2 * x * x, say: 'twee keer het kwadraat' }), () => { const k = rand(1, 5) * (chance(0.5) ? 1 : -1); return { n: `x × x × x ${k > 0 ? '+' : '−'} ${Math.abs(k)}`, f: (x) => x ** 3 + k, say: `de derde macht, ${k > 0 ? 'plus' : 'min'} ${Math.abs(k)}` }; }])(),
  };

  function numQ(d) {
    const R = NUM_RULES[Math.max(2, d)]();
    const xs = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2).sort((a, b) => a - b);
    const x3 = rand(2, 11);
    if (xs.includes(x3)) return null;
    const y = xs.map(R.f), ans = R.f(x3);
    if (y.some((v) => v < 0) || ans < 0) return null;
    const fits = NF.filter((g) => g.f(xs[0]) === y[0] && g.f(xs[1]) === y[1]);
    if (fits.some((g) => g.f(x3) !== ans)) return null; // niet eenduidig
    const pool = [];
    for (const g of shuffle(NF)) {
      const a1 = g.f(xs[0]) === y[0], a2 = g.f(xs[1]) === y[1];
      if (a1 !== a2) {
        const v = g.f(x3);
        if (v >= 0) pool.push({ key: String(v), html: String(v), text: String(v), tag: 'Verkeerde regel', why: `Met de regel “${g.n}” klopt ${a1 ? `${xs[0]} → ${y[0]}` : `${xs[1]} → ${y[1]}`}, maar ${a1 ? `${xs[1]} → ${y[1]}` : `${xs[0]} → ${y[0]}`} niet. Controleer altijd beide voorbeelden.` });
      }
      if (pool.length > 8) break;
    }
    pool.push(...shuffle([ans + 1, ans - 1, ans + 2, ans + 10].map((v) => ({ key: String(v), html: String(v), text: String(v), tag: 'Rekenfout', why: 'Rekenfout: je zit er net naast.' }))));
    const built = buildOptions({ key: String(ans), html: String(ans), text: String(ans) }, pool, optCount(d));
    if (!built) return null;
    return {
      cat: 'ana', diff: d, kindId: 'num', kind: 'Getalanalogie',
      prompt: `Welk getal hoort bij ${x3}, volgens dezelfde regel?`,
      stem: `<div class="pairs"><span>${xs[0]} <i>→</i> ${y[0]}</span><span>${xs[1]} <i>→</i> ${y[1]}</span><span>${x3} <i>→</i> <b class="q">?</b></span></div>`,
      opts: built.opts, ans: built.ans, layout: 'mono',
      steps: [`Zoek één regel die bij beide voorbeelden past: ${R.say}.`, `Controle: ${xs[0]} → ${y[0]} en ${xs[1]} → ${y[1]} kloppen allebei.`, `Toepassen op ${x3}: ${ans}.`],
      hint: 'Zoek een regel die bij BEIDE voorbeelden past, niet alleen bij het eerste.',
      quick: 'Bedenk een regel bij het eerste paar en test hem meteen op het tweede. Klopt hij niet, gooi hem weg.',
      lesson: 'Een regel is pas goed als hij bij alle voorbeelden klopt.',
    };
  }

  /* ---- Letteranalogieën ---- */
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const toS = (a) => a.map((i) => AL[((i % 26) + 26) % 26]).join('');
  const LF = [];
  for (const k of [-3, -2, -1, 1, 2, 3]) LF.push({ id: 's' + k, n: `elke letter ${Math.abs(k)} ${Math.abs(k) === 1 ? 'plek' : 'plekken'} ${k > 0 ? 'verder' : 'terug'} in het alfabet`, f: (a) => a.map((x) => x + k) });
  LF.push({ id: 'rev', n: 'de volgorde omdraaien', f: (a) => a.slice().reverse() });
  for (const k of [-1, 1, 2]) LF.push({ id: 'rs' + k, n: `omdraaien én elke letter ${Math.abs(k)} ${k > 0 ? 'verder' : 'terug'}`, f: (a) => a.slice().reverse().map((x) => x + k) });
  LF.push({ id: 'pos', n: 'de 1e letter +0, de 2e +1, de 3e +2, …', f: (a) => a.map((x, i) => x + i) });
  LF.push({ id: 'pos1', n: 'de 1e letter +1, de 2e +2, de 3e +3, …', f: (a) => a.map((x, i) => x + i + 1) });
  LF.push({ id: 'ends', n: 'eerste en laatste letter wisselen', f: (a) => [a[a.length - 1], ...a.slice(1, -1), a[0]] });
  LF.push({ id: 'rotl', n: 'eerste letter naar achteren', f: (a) => [...a.slice(1), a[0]] });
  LF.push({ id: 'rotr', n: 'laatste letter naar voren', f: (a) => [a[a.length - 1], ...a.slice(0, -1)] });
  LF.push({ id: 'mir', n: 'spiegelen in het alfabet (A↔Z, B↔Y, …)', f: (a) => a.map((x) => 25 - x) });
  const LET_BY = { 2: ['s1', 's2', 's-1'], 3: ['rev', 'rotl', 'rotr', 's2', 's-2', 's3'], 4: ['rs1', 'rs-1', 'pos', 'ends'], 5: ['mir', 'pos1', 'rs2', 'rs-1'] };

  function letQ(d) {
    const rid = pick(LET_BY[Math.max(2, d)]);
    const R = LF.find((r) => r.id === rid);
    const len = d >= 4 ? 4 : rand(3, 4);
    const mk = () => shuffle([...Array(18).keys()].map((i) => i + 4)).slice(0, len);
    const E = mk(), T = mk();
    const eOut = toS(R.f(E)), ans = toS(R.f(T));
    if (toS(E) === eOut || toS(T) === ans) return null;
    const fits = LF.filter((g) => toS(g.f(E)) === eOut);
    if (fits.some((g) => toS(g.f(T)) !== ans)) return null;
    const pool = shuffle(LF.filter((g) => g !== R)).map((g) => {
      const v = toS(g.f(T));
      return { key: v, html: v, text: v, tag: 'Verkeerde regel', why: `Dit krijg je met de regel “${g.n}”. Maar dan zou ${toS(E)} veranderen in ${toS(g.f(E))}, niet in ${eOut}.` };
    });
    const built = buildOptions({ key: ans, html: ans, text: ans }, pool, optCount(d));
    if (!built) return null;
    return {
      cat: 'ana', diff: d, kindId: 'let', kind: 'Letteranalogie',
      prompt: 'Welke lettercombinatie hoort op de open plek?',
      stem: `<div class="analogy mono"><b>${toS(E)}</b><span class="op">:</span><b>${eOut}</b><span class="op">=</span><b>${toS(T)}</b><span class="op">:</span><span class="gap">?</span></div>`,
      opts: built.opts, ans: built.ans, layout: 'mono',
      steps: [`Vergelijk ${toS(E)} met ${eOut}, letter voor letter.`, `De regel is: ${R.n}.`, `Toepassen op ${toS(T)} geeft ${ans}.`],
      hint: 'Zijn het dezelfde letters in een andere volgorde, of zijn het andere letters?',
      quick: 'Check eerst: zelfde letters (dan is de volgorde veranderd) of andere letters (dan zijn ze verschoven)? Dat halveert de opties.',
      lesson: 'Zelfde letters = volgorde veranderd. Andere letters = verschoven in het alfabet.',
    };
  }

  function generate(d, opt = {}) {
    const pW = [0, 0.9, 0.65, 0.45, 0.3, 0.25][d];
    let kind = opt.kind;
    if (!kind) kind = chance(pW) ? 'word' : d >= 2 && chance(0.5) ? 'num' : d >= 2 ? 'let' : 'word';
    if (kind === 'word') return wordQ(d);
    return attempt(() => (kind === 'num' ? numQ(d) : letQ(d)));
  }

  MT.gens.ana = { generate, _words: WORDS };
})(typeof window !== 'undefined' ? window : globalThis);
