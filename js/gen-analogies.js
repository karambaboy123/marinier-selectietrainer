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
      cat: 'ana', diff: d, kindId: 'word', kind: 'Woordanalogie', meta: { sub: 'word', rel },
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
        if (v >= 0) pool.push({ rn: g.n, key: String(v), html: String(v), text: String(v), tag: 'Verkeerde regel', why: `Met de regel “${g.n}” klopt ${a1 ? `${xs[0]} → ${y[0]}` : `${xs[1]} → ${y[1]}`}, maar ${a1 ? `${xs[1]} → ${y[1]}` : `${xs[0]} → ${y[0]}`} niet. Controleer altijd beide voorbeelden.` });
      }
      if (pool.length > 8) break;
    }
    pool.push(...shuffle([ans + 1, ans - 1, ans + 2, ans + 10].map((v) => ({ key: String(v), html: String(v), text: String(v), tag: 'Rekenfout', why: 'Rekenfout: je zit er net naast.' }))));
    const built = buildOptions({ key: String(ans), html: String(ans), text: String(ans) }, pool, optCount(d));
    if (!built) return null;
    return {
      cat: 'ana', diff: d, kindId: 'num', kind: 'Getalanalogie', meta: { sub: 'num', rule: R.n, say: R.say, oneFit: pool.filter((p) => p.tag === 'Verkeerde regel').map((p) => p.rn).filter(Boolean) },
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
      cat: 'ana', diff: d, kindId: 'let', kind: 'Letteranalogie', meta: { sub: 'let', rule: R.n, others: shuffle(LF.filter((g) => !fits.includes(g))).slice(0, 4).map((g) => g.n) },
      prompt: 'Welke lettercombinatie hoort op de open plek?',
      stem: `<div class="analogy mono"><b>${toS(E)}</b><span class="op">:</span><b>${eOut}</b><span class="op">=</span><b>${toS(T)}</b><span class="op">:</span><span class="gap">?</span></div>`,
      opts: built.opts, ans: built.ans, layout: 'mono',
      steps: [`Vergelijk ${toS(E)} met ${eOut}, letter voor letter.`, `De regel is: ${R.n}.`, `Toepassen op ${toS(T)} geeft ${ans}.`],
      hint: 'Zijn het dezelfde letters in een andere volgorde, of zijn het andere letters?',
      quick: 'Check eerst: zelfde letters (dan is de volgorde veranderd) of andere letters (dan zijn ze verschoven)? Dat halveert de opties.',
      lesson: 'Zelfde letters = volgorde veranderd. Andere letters = verschoven in het alfabet.',
    };
  }

  /* ---- Woordanalogieën met twee open plekken (Mariniers Training Mode) ----
   * "…… : b = c : ……": links kies je een woord dat bij b past, rechts een woord dat bij c past, zodat
   * beide paren dezelfde relatie hebben. Elk antwoord is een combinatie (links + rechts).
   * [x, b, c, y, [foute x], [foute y], relatie, uitleg, niveau] */
  const WORDS2 = [
    ['honing', 'bij', 'melk', 'koe', ['raat', 'imker'], ['kalf', 'kaas'], 'afkomstig van', 'Honing komt van een bij, melk komt van een koe.', 1],
    ['vol', 'leeg', 'aan', 'uit', ['half', 'glas'], ['lamp', 'stekker'], 'tegenstelling', 'Vol is het tegenovergestelde van leeg, aan van uit.', 1],
    ['oog', 'zien', 'neus', 'ruiken', ['bril', 'hoofd'], ['geur', 'parfum'], 'zintuig en wat je ermee doet', 'Met je oog zie je, met je neus ruik je.', 1],
    ['steen', 'muur', 'woord', 'zin', ['cement', 'huis'], ['taal', 'letter'], 'bouwsteen en geheel', 'Stenen vormen samen een muur, woorden vormen samen een zin.', 1],
    ['dokter', 'ziekenhuis', 'leraar', 'school', ['patiënt', 'stethoscoop'], ['les', 'schoolbord'], 'beroep en werkplek', 'Een dokter werkt in een ziekenhuis, een leraar in een school.', 1],
    ['veulen', 'paard', 'lam', 'schaap', ['ruiter', 'hooi'], ['wol', 'wei'], 'jong en ouder', 'Een veulen is het jong van een paard, een lam het jong van een schaap.', 1],
    ['wiel', 'auto', 'vleugel', 'vliegtuig', ['weg', 'chauffeur'], ['piloot', 'lucht'], 'onderdeel en geheel', 'Een wiel is een onderdeel van een auto, een vleugel van een vliegtuig.', 1],
    ['koe', 'gras', 'leeuw', 'vlees', ['melk', 'stal'], ['kooi', 'bos'], 'dier en zijn voedsel', 'Een koe eet gras, een leeuw eet vlees.', 1],
    ['schilder', 'penseel', 'chirurg', 'scalpel', ['verf', 'atelier'], ['operatie', 'ziekenhuis'], 'beroep en zijn gereedschap', 'Een schilder werkt met een penseel, een chirurg met een scalpel.', 1],
    ['ontbijt', 'ochtend', 'diner', 'avond', ['brood', 'tafel'], ['restaurant', 'honger'], 'maaltijd en moment van de dag', 'Je ontbijt in de ochtend, je dineert in de avond.', 1],
    ['weg', 'auto', 'spoor', 'trein', ['stad', 'asfalt'], ['station', 'wissel'], 'route en voertuig dat erop rijdt', 'Een auto rijdt over een weg, een trein over een spoor.', 1],
    ['laken', 'bed', 'tafelkleed', 'tafel', ['slaapkamer', 'kussen'], ['servies', 'eten'], 'wat iets bedekt', 'Een laken ligt over een bed, een tafelkleed over een tafel.', 1],
    ['bezem', 'vloer', 'ruitenwisser', 'voorruit', ['stof', 'emmer'], ['regen', 'auto'], 'gereedschap en wat het schoonmaakt', 'Met een bezem maak je een vloer schoon, met een ruitenwisser een voorruit.', 2],
    ['timmerman', 'hout', 'metselaar', 'steen', ['hamer', 'werkplaats'], ['muur', 'kelder'], 'ambachtsman en zijn materiaal', 'Een timmerman werkt met hout, een metselaar met steen.', 2],
    ['afstand', 'liniaal', 'gewicht', 'weegschaal', ['snelheid', 'hout'], ['kilo', 'boodschappen'], 'wat je meet en het meetinstrument', 'Afstand meet je met een liniaal, gewicht met een weegschaal.', 2],
    ['bries', 'storm', 'motregen', 'stortbui', ['zeil', 'weerbericht'], ['regenjas', 'plas'], 'zwakke en zeer sterke vorm', 'Een storm is een veel sterkere vorm van een bries, een stortbui van motregen.', 2],
    ['regisseur', 'film', 'componist', 'lied', ['camera', 'acteur'], ['piano', 'orkest'], 'maker en zijn werk', 'Een regisseur maakt een film, een componist maakt een lied.', 2],
    ['zwemmer', 'zwembad', 'schaatser', 'ijsbaan', ['medaille', 'water'], ['schaatsen', 'winter'], 'sporter en zijn sportlocatie', 'Een zwemmer zwemt in een zwembad, een schaatser schaatst op een ijsbaan.', 2],
    ['plant', 'water', 'auto', 'benzine', ['pot', 'tuin'], ['garage', 'wiel'], 'wat iets nodig heeft om te werken', 'Een plant heeft water nodig om te groeien, een auto benzine om te rijden.', 2],
    ['bril', 'zien', 'hoortoestel', 'horen', ['oog', 'glas'], ['oor', 'geluid'], 'hulpmiddel en wat het mogelijk maakt', 'Een bril helpt je zien, een hoortoestel helpt je horen.', 2],
    ['brandweer', 'blussen', 'politie', 'arresteren', ['slang', 'brand'], ['uniform', 'misdaad'], 'beroep en zijn taak', 'De brandweer blust branden, de politie arresteert verdachten.', 2],
    ['suiker', 'zoet', 'citroen', 'zuur', ['koffie', 'lepel'], ['geel', 'vrucht'], 'voedsel en zijn smaak', 'Suiker smaakt zoet, een citroen smaakt zuur.', 2],
    ['hoofdpijn', 'paracetamol', 'dorst', 'water', ['dokter', 'pijn'], ['fles', 'zomer'], 'probleem en middel ertegen', 'Paracetamol helpt tegen hoofdpijn, water helpt tegen dorst.', 2],
    ['vlieg', 'spin', 'muis', 'kat', ['web', 'insect'], ['kaas', 'hol'], 'prooi en jager', 'Een vlieg wordt gevangen door een spin, een muis door een kat.', 2],
    ['klas', 'school', 'hoofdstuk', 'boek', ['leraar', 'bank'], ['bladzijde', 'bibliotheek'], 'onderdeel en geheel', 'Een klas is een onderdeel van een school, een hoofdstuk van een boek.', 2],
    ['olie', 'smeren', 'lijm', 'plakken', ['motor', 'fles'], ['papier', 'stift'], 'middel en wat je ermee doet', 'Met olie smeer je, met lijm plak je.', 2],
    ['architect', 'plattegrond', 'componist', 'partituur', ['bouwvakker', 'huis'], ['concert', 'orkest'], 'ontwerper en zijn ontwerp op papier', 'Een architect tekent een plattegrond, een componist schrijft een partituur.', 3],
    ['zaaien', 'oogst', 'studeren', 'diploma', ['tuin', 'boer'], ['school', 'boek'], 'inspanning en het resultaat daarvan', 'Door te zaaien krijg je een oogst, door te studeren een diploma.', 3],
    ['gids', 'toerist', 'loods', 'schip', ['museum', 'tour'], ['haven', 'kust'], 'wie begeleidt wie of wat', 'Een gids begeleidt een toerist, een loods begeleidt een schip.', 3],
    ['chirurg', 'operatie', 'rechter', 'vonnis', ['mes', 'ziekenhuis'], ['wetboek', 'toga'], 'beroep en wat die persoon uitvoert of uitspreekt', 'Een chirurg voert een operatie uit, een rechter spreekt een vonnis uit.', 3],
    ['oorlog', 'vrede', 'chaos', 'orde', ['soldaat', 'wapen'], ['rommel', 'verwarring'], 'tegenstelling', 'Oorlog is het tegenovergestelde van vrede, chaos van orde.', 3],
  ];

  function word2Q(d, n = 4) {
    return attempt(() => {
      const [x, b, c, y, wx, wy, rel, why] = pick(WORDS2);
      const mk = (l, r, text) => ({ key: `${l}|${r}`, html: `<b>${esc(l)}</b>&ensp;·&ensp;<b>${esc(r)}</b>`, text: `${l} en ${r}`, why: text, tag: 'Relatie niet gelijk' });
      const leftBad = (w) => `Links past “${w}” niet bij “${b}” volgens de relatie (${rel}).`;
      const rightBad = (w) => `Rechts past “${w}” niet bij “${c}” volgens de relatie (${rel}).`;
      const half = shuffle([
        ...wx.map((w) => mk(w, y, `${leftBad(w)} Rechts heb je het goed.`)),
        ...wy.map((w) => mk(x, w, `${rightBad(w)} Links heb je het goed.`)),
      ]);
      const both = shuffle(wx.flatMap((l) => wy.map((r) => mk(l, r, `Beide woorden kloppen niet: ${leftBad(l)} ${rightBad(r)}`))));
      const built = buildOptions({ key: `${x}|${y}`, html: `<b>${esc(x)}</b>&ensp;·&ensp;<b>${esc(y)}</b>`, text: `${x} en ${y}` }, [...half.slice(0, 2), ...both, ...half.slice(2)], n);
      if (!built) return null;
      return {
        cat: 'ana', diff: d, kindId: 'word', kind: 'Woordanalogie (twee woorden)', meta: { sub: 'word', rel },
        prompt: 'Kies het woord links en het woord rechts dat op de open plekken hoort.',
        stem: `<div class="analogy"><span class="gap">?</span><span class="op">:</span><b>${esc(b)}</b><span class="op">=</span><b>${esc(c)}</b><span class="op">:</span><span class="gap">?</span></div>`,
        opts: built.opts, ans: built.ans, layout: 'text',
        steps: [`Zoek de relatie bij het linkerpaar: “${x}” en “${b}” → ${rel}.`, `Pas dezelfde relatie toe op het rechterpaar: “${c}” en “${y}”. ${why}`, 'Controleer beide kanten: pas als links én rechts kloppen, is de combinatie goed.'],
        hint: `Bedenk eerst welk woord links bij “${b}” past, en welk woord rechts bij “${c}”. De relatie moet in beide paren hetzelfde zijn.`,
        quick: 'Begin bij het paar waar je de relatie het snelst ziet, en test dan of de andere kant dezelfde relatie heeft. Een combinatie waarvan één kant klopt is dus nog fout.',
        lesson: 'Beide kanten moeten kloppen. Opties met één goed woord zijn bewuste valkuilen.',
      };
    });
  }

  function generate(d, opt = {}) {
    if (opt.exam) return word2Q(d);
    const pW = [0, 0.9, 0.65, 0.45, 0.3, 0.25][d];
    let kind = opt.kind;
    if (!kind) kind = chance(pW) ? 'word' : d >= 2 && chance(0.5) ? 'num' : d >= 2 ? 'let' : 'word';
    if (kind === 'word') return wordQ(d);
    return attempt(() => (kind === 'num' ? numQ(d) : letQ(d)));
  }

  MT.gens.ana = { generate, _words: WORDS.concat(WORDS2.map((w) => [w[0], w[1], w[2], w[3], [], w[6], w[7], w[8]])) };
})(typeof window !== 'undefined' ? window : globalThis);
