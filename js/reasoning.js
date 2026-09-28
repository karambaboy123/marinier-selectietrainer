/* Redenering: per vraag vragen hoe je tot je antwoord kwam, en die denkwijze apart beoordelen.
 * De trainer verzint je gedachtegang niet: hij beoordeelt alleen wat je zelf kiest of opschrijft. */
(function (G) {
  'use strict';
  const MT = G.MT;
  const { shuffle, pick } = MT.util;

  const ERR = {
    pattern: 'Patroonherkenningsfout',
    calc: 'Rekenfout',
    read: 'Leesfout',
    logic: 'Logische fout',
    assume: 'Verkeerde aanname',
    exec: 'Correcte methode verkeerd uitgevoerd',
    early: 'Te vroeg antwoord gekozen',
    complex: 'Onnodig ingewikkeld gedacht',
    time: 'Tempo: tijd op',
  };
  // Van het soort afleider naar een fouttype (als de redenering onbekend is)
  const TAG_ERR = {
    'Rekenfout': ERR.calc, 'Verkeerde regel': ERR.pattern, 'Tweede regel gemist': ERR.pattern, 'Regel gemist': ERR.pattern,
    'Verkeerde richting': ERR.assume, 'Volgorde van bewerkingen': ERR.assume, 'Bewerking overgeslagen': ERR.read, 'Bewerking verward': ERR.read,
    'Relatie niet gelijk': ERR.assume, 'Mogelijk maar niet zeker': ERR.logic, 'In strijd met de gegevens': ERR.logic, 'Volgorde verkeerd': ERR.logic,
    'Regel niet gevonden': ERR.pattern, 'Tijd op': ERR.time,
  };

  /* ---------- Cijferreeksen: systematische zoekvolgorde ---------- */
  const SEARCH = ['Optellen of aftrekken (vaste stap)', 'Verschillen bekijken', 'Verschillen van verschillen', 'Vermenigvuldigen of delen', 'Afwisselende bewerkingen', 'Oneven en even posities apart', 'Combinaties van meerdere regels'];
  const FOUND_AT = { arith: 0, prime: 1, sqdiff: 1, incdiff: 2, pow: 2, diffmul: 2, geo: 3, incmul: 3, plusmin: 4, altop: 4, altinc: 4, alt2: 5, fib: 6, trib: 6, mulminus: 6 };
  const NUM_DESC = {
    arith: 'Vaste stap: steeds hetzelfde getal erbij of eraf',
    geo: 'Steeds keer (of gedeeld door) hetzelfde getal',
    plusmin: 'Afwisselend een vaste stap erbij en een vaste stap eraf',
    incdiff: 'De verschillen worden steeds een vast getal groter',
    alt2: 'Twee reeksen door elkaar (om en om lezen)',
    altop: 'Twee verschillende bewerkingen wisselen elkaar af (bijv. +3 en ×2)',
    fib: 'Elk getal is de som van de twee getallen ervoor',
    pow: 'Kwadraten of machten (1, 4, 9, 16 … of 1, 8, 27 …)',
    mulminus: 'Elke stap: vermenigvuldigen en dan iets erbij of eraf',
    diffmul: 'De verschillen worden steeds ×2 of ×3',
    incmul: 'De vermenigvuldiger loopt op (×1, ×2, ×3 …)',
    sqdiff: 'De verschillen zijn kwadraten (1, 4, 9 …)',
    trib: 'Elk getal is de som van de drie getallen ervoor',
    altinc: 'Twee bewerkingen om en om, waarvan er één steeds groter wordt',
    prime: 'De verschillen zijn priemgetallen (2, 3, 5, 7 …)',
  };
  // Wiskundig gelijkwaardige beschrijvingen: die gelden ook als juist
  const EQUIV = { pow: ['incdiff'], incdiff: ['pow'], plusmin: ['alt2'], alt2: ['plusmin'], mulminus: ['diffmul'], geo: ['diffmul'] };
  const SIMPLE = ['arith', 'geo'];

  const GUESS = { id: 'guess', text: 'Ik heb gegokt / ik zag geen duidelijk patroon', status: 'guess' };

  function numReason(q) {
    const k = q.kindId, eq = EQUIV[k] || [];
    const all = Object.keys(NUM_DESC).filter((x) => x !== k && !eq.includes(x));
    const near = all.filter((x) => Math.abs((FOUND_AT[x] || 0) - (FOUND_AT[k] || 0)) <= 2);
    const wrong = shuffle(near.length >= 2 ? near : all).slice(0, 2).map((x) => ({ id: x, text: NUM_DESC[x], status: 'wrong', err: ERR.pattern }));
    const opts = [{ id: k, text: NUM_DESC[k], status: 'correct' }, ...wrong];
    if (SIMPLE.includes(k)) opts.push({ id: 'complex', text: 'Een combinatie van meerdere regels tegelijk', status: 'complex', err: ERR.complex, note: 'Er was een eenvoudige regel die alle getallen verklaart. Een ingewikkelder patroon is dan niet nodig.' });
    else opts.push({ id: 'one', text: 'Ik keek alleen naar de laatste twee getallen', status: 'wrong', err: ERR.early, note: 'Eén overgang past bij heel veel regels. Controleer je regel altijd op alle getallen.' });
    return { type: 'single', prompt: 'Welk patroon of welke regel zag je?', options: [...shuffle(opts), GUESS] };
  }

  function anaReason(q) {
    const m = q.meta || {};
    if (m.sub === 'word') {
      const rels = [...new Set(MT.gens.ana._words.map((w) => w[5]).filter((r) => r !== m.rel))];
      const opts = [{ id: 'rel', text: `De relatie “${m.rel}”`, status: 'correct' }, ...shuffle(rels).slice(0, 2).map((r, i) => ({ id: 'r' + i, text: `De relatie “${r}”`, status: 'wrong', err: ERR.pattern, note: `Dat is niet de relatie tussen het eerste woordpaar.` })),
        { id: 'topic', text: 'Het woord dat het meest met het derde woord te maken heeft', status: 'wrong', err: ERR.assume, note: 'Een woord dat “erbij hoort” is vaak een valkuil. Het gaat om dezelfde relatie, niet om hetzelfde onderwerp.' }];
      return { type: 'single', prompt: 'Welke relatie gebruikte je?', options: [...shuffle(opts), GUESS] };
    }
    if (m.sub === 'num') {
      const w = shuffle(m.oneFit || []).slice(0, 2).map((n, i) => ({ id: 'w' + i, text: `Regel: ${n}`, status: 'wrong', err: ERR.early, note: 'Deze regel past maar bij één van de twee voorbeelden. Je trok te vroeg een conclusie.' }));
      const opts = [{ id: 'ok', text: `Regel: ${m.rule} (${m.say})`, status: 'correct' }, ...w];
      if (w.length < 2) opts.push({ id: 'first', text: 'Ik keek alleen naar het eerste voorbeeld', status: 'wrong', err: ERR.early, note: 'Eén voorbeeld past bij veel regels. Test altijd op beide voorbeelden.' });
      opts.push({ id: 'all', text: 'Ik heb elke antwoordoptie teruggerekend tot er één klopte', status: 'inefficient', note: 'Dat werkt, maar kost veel tijd. Een regel zoeken bij de voorbeelden is sneller.' });
      return { type: 'single', prompt: 'Welke regel gebruikte je?', options: [...shuffle(opts), GUESS] };
    }
    const opts = [{ id: 'ok', text: `Regel: ${m.rule}`, status: 'correct' }, ...(m.others || []).slice(0, 3).map((n, i) => ({ id: 'o' + i, text: `Regel: ${n}`, status: 'wrong', err: ERR.pattern, note: 'Deze regel verklaart het voorbeeld niet.' }))];
    return { type: 'single', prompt: 'Welke regel gebruikte je?', options: [...shuffle(opts), GUESS] };
  }

  function diaReason(q) {
    const mode = (q.meta || {}).mode;
    let opts;
    if (mode === 'op') opts = [
      { id: 'fb', text: 'Vooruit gerekend tot het vraagteken en terug vanaf de uitkomst', status: 'correct' },
      { id: 'try', text: 'Elke bewerking uit de legenda op die plek uitgeprobeerd', status: 'inefficient', note: 'Dat werkt, maar kost bij veel bewerkingen veel tijd.' },
      { id: 'freq', text: 'Gekozen welke bewerking het meest voor de hand lag', status: 'wrong', err: ERR.early, note: 'Zonder narekenen weet je niet of de bewerking de juiste uitkomst geeft.' },
      { id: 'skip', text: 'Alleen de bewerkingen vóór het vraagteken bekeken', status: 'wrong', err: ERR.read, note: 'Ook de bewerkingen ná het vraagteken bepalen de uitkomst.' },
    ];
    else if (mode === 'in') opts = [
      { id: 'back', text: 'Teruggerekend: laatste bewerking eerst, telkens omgekeerd', status: 'correct' },
      { id: 'try', text: 'Elke optie vooruit uitgeprobeerd tot de uitkomst klopte', status: 'inefficient', note: 'Correct, maar trager dan terugrekenen.' },
      { id: 'fwd', text: 'De bewerkingen vooruit toegepast op de uitkomst', status: 'wrong', err: ERR.assume, note: 'Vooruit rekenen vanaf de uitkomst geeft niet de invoer. Je moet de bewerkingen omkeren.' },
      { id: 'noinv', text: 'Van rechts naar links gewerkt, maar dezelfde bewerkingen gebruikt', status: 'wrong', err: ERR.exec, note: 'De richting klopte, maar elke bewerking moet ook omgekeerd worden.' },
    ];
    else opts = [
      { id: 'lr', text: 'De bewerkingen één voor één van links naar rechts uitgevoerd', status: 'correct' },
      { id: 'track', text: 'Eén letter gevolgd door alle bewerkingen en opties weggestreept', status: 'correct' },
      { id: 'rl', text: 'De bewerkingen van rechts naar links uitgevoerd', status: 'wrong', err: ERR.assume, note: 'De pijlen lopen van links naar rechts; de volgorde bepaalt de uitkomst.' },
      { id: 'look', text: 'Gekozen welke uitkomst er het meest op leek', status: 'wrong', err: ERR.early, note: 'Opties lijken bewust op elkaar. Zonder narekenen is dat gokken.' },
    ];
    return { type: 'single', prompt: 'Hoe heb je het aangepakt?', options: [...shuffle(opts), GUESS] };
  }

  const ATTR = {
    rot: 'De pijl draait', fill: 'De vulling verandert', shape: 'De vorm verandert', dots: 'Het aantal stippen verandert',
    m1: 'Het gekleurde vak beweegt', m2: 'De stip beweegt',
  };
  function multiReason(q, prompt) {
    const m = q.meta || {};
    const keys = m.grid ? ['m1', 'm2'] : ['rot', 'fill', 'shape', 'dots'];
    return { type: 'multi', prompt, correct: m.changes.slice(), options: [...keys.map((k) => ({ id: k, text: ATTR[k] })), GUESS] };
  }

  function absReason(q) {
    if (q.kindId === 'odd') {
      const ODD = MT.gens.abs.ODD;
      const r = ODD.find((x) => x.id === q.meta.rule);
      const others = shuffle(ODD.filter((x) => x.id !== r.id)).slice(0, 2);
      const opts = [{ id: r.id, text: `Regel: ${r.name.toLowerCase()}`, status: 'correct' }, ...others.map((o) => ({ id: o.id, text: `Regel: ${o.name.toLowerCase()}`, status: 'wrong', err: ERR.pattern, note: 'Die regel onderscheidt de afwijkende figuur niet van de rest.' })),
        { id: 'looks', text: 'De figuur die er op het eerste gezicht het meest anders uitzag', status: 'wrong', err: ERR.early, note: 'Het eerste wat opvalt is vaak een afleider. Zoek de regel die alle andere figuren delen.' }];
      return { type: 'single', prompt: 'Welke regel volgden de andere figuren volgens jou?', options: [...shuffle(opts), GUESS] };
    }
    if (q.kindId === 'figana') return multiReason(q, 'Welke veranderingen zag je van de eerste naar de tweede figuur?');
    return { type: 'multi', prompt: 'Voor welke eigenschappen vond je een regel in de matrix?', correct: q.meta.changes.slice(), options: [...['shape', 'fill', 'rot', 'dots'].map((k) => ({ id: k, text: { shape: 'Vorm', fill: 'Vulling', rot: 'Richting van de pijl', dots: 'Aantal stippen' }[k] })), GUESS] };
  }

  function logReason(q) {
    const m = q.meta || {};
    let opts;
    if (q.kindId === 'order') opts = [
      { id: 'line', text: `Alle zinnen omgeschreven naar “${m.more} dan” en op een lijn gezet`, status: 'correct' },
      { id: 'head', text: 'In mijn hoofd bijgehouden zonder op te schrijven', status: 'inefficient', note: 'Dat kan goed gaan, maar bij 4–5 personen raak je snel het overzicht kwijt.' },
      { id: 'mention', text: 'Uitgegaan van de volgorde waarin de namen genoemd worden', status: 'wrong', err: ERR.assume, note: 'De volgorde van de zinnen zegt niets over de volgorde van de personen.' },
      { id: 'swap', text: 'Ik haalde de twee richtingen (bijv. ouder/jonger) door elkaar', status: 'wrong', err: ERR.read, note: 'Omschrijven naar één richting voorkomt dit.' },
    ];
    else if (q.kindId === 'syl') opts = [
      { id: 'venn', text: 'Groepen als cirkels getekend en gezocht naar een tegenvoorbeeld', status: 'correct' },
      { id: 'real', text: 'Gekozen wat het meest logisch klinkt', status: 'wrong', err: ERR.assume, note: 'Wat logisch klinkt hoeft niet te volgen uit de gegevens.' },
      { id: 'flip', text: 'Een zin omgedraaid (bijv. “alle A zijn B” dus “alle B zijn A”)', status: 'wrong', err: ERR.logic, note: '“Alle A zijn B” betekent niet dat alle B ook A zijn.' },
      { id: 'can', text: 'Gekozen wat waar kán zijn', status: 'wrong', err: ERR.logic, note: '“Kan waar zijn” is niet hetzelfde als “volgt zeker”.' },
    ];
    else if (q.kindId === 'code') opts = [
      { id: 'ok', text: `Code: ${m.rule}`, status: 'correct' },
      ...(m.others || []).slice(0, 2).map((n, i) => ({ id: 'o' + i, text: `Code: ${n}`, status: 'wrong', err: ERR.pattern, note: 'Die code verklaart het voorbeeld niet.' })),
      { id: 'first', text: 'Alleen de eerste letter vergeleken', status: 'wrong', err: ERR.early, note: 'Eén letter past bij meerdere codes. Vergelijk minstens twee of drie letters.' },
    ];
    else opts = [
      { id: 'ok', text: m.method, status: 'correct' },
      ...(m.wrong || []).map((t, i) => ({ id: 'w' + i, text: t, status: 'wrong', err: ERR.assume, note: 'Deze aanpak klopt niet voor deze som.' })),
    ];
    return { type: 'single', prompt: 'Hoe heb je het aangepakt?', options: [...shuffle(opts), GUESS] };
  }

  function build(q) {
    switch (q.cat) {
      case 'num': return numReason(q);
      case 'ana': return anaReason(q);
      case 'dia': return diaReason(q);
      case 'fig': return multiReason(q, 'Welke veranderingen zag je in de reeks? Kies alles wat je zag.');
      case 'abs': return absReason(q);
      case 'log': return logReason(q);
    }
  }

  /** sel: single -> id ; multi -> array van ids */
  function judge(R, sel) {
    if (R.type === 'single') {
      const o = R.options.find((x) => x.id === sel) || GUESS;
      return { status: o.status, chosen: [o.text], note: o.note || '', err: o.err || null, partial: null };
    }
    const ids = sel || [];
    if (!ids.length || ids.includes('guess')) return { status: 'guess', chosen: [GUESS.text], note: '', err: null };
    const C = new Set(R.correct), S = new Set(ids);
    const hit = ids.filter((x) => C.has(x)), extra = ids.filter((x) => !C.has(x)), missed = R.correct.filter((x) => !S.has(x));
    const txt = (a) => a.map((k) => (R.options.find((o) => o.id === k) || {}).text).filter(Boolean);
    const chosen = txt(ids);
    if (!extra.length && !missed.length) return { status: 'correct', chosen, note: '', err: null, hit: txt(hit) };
    if (!extra.length && hit.length) return { status: 'partial', chosen, hit: txt(hit), missed: txt(missed), err: ERR.pattern, note: `Je zag ${txt(hit).join(' en ').toLowerCase()}, maar miste: ${txt(missed).join(', ').toLowerCase()}.` };
    if (!missed.length) return { status: 'complex', chosen, hit: txt(hit), extra: txt(extra), err: ERR.complex, note: `Je zag ook veranderingen die er niet zijn: ${txt(extra).join(', ').toLowerCase()}.` };
    return { status: 'wrong', chosen, hit: txt(hit), missed: txt(missed), extra: txt(extra), err: ERR.pattern, note: `${missed.length ? 'Gemist: ' + txt(missed).join(', ').toLowerCase() + '. ' : ''}${extra.length ? 'Verandert niet: ' + txt(extra).join(', ').toLowerCase() + '.' : ''}` };
  }

  const reasonOk = (st) => st === 'correct' || st === 'inefficient';
  /** A: goed+goed, B: goed antwoord/verkeerde redenering, C: fout antwoord/goede aanpak, D: fout+fout */
  function quadrant(ansOk, st) {
    if (ansOk) return reasonOk(st) ? 'A' : 'B';
    return reasonOk(st) ? 'C' : 'D';
  }
  const QUAD = {
    A: 'A — Goed antwoord + goede redenering: volledig begrepen.',
    B: 'B — Goed antwoord + verkeerde redenering: mogelijk toevallig goed.',
    C: 'C — Fout antwoord + goede aanpak: waarschijnlijk een reken-, lees- of uitvoeringsfout.',
    D: 'D — Fout antwoord + verkeerde aanpak: het principe opnieuw bekijken.',
  };

  const WHY = {
    num: 'Een regel is pas bewezen als hij álle overgangen verklaart, niet alleen één. Daarom begin je bij de eenvoudigste soort patroon en ga je pas naar ingewikkelder patronen als de eenvoudige niet alles verklaart. Zo kies je nooit een regel die toevallig bij één overgang past.',
    'ana-word': 'Bij een analogie gaat het om de relatie, niet om het onderwerp. Door van het eerste paar een zin te maken, leg je die relatie vast. Het juiste woord past precies in dezelfde zin.',
    'ana-num': 'Eén voorbeeld past bij heel veel regels (3 → 6 kan +3 zijn, maar ook ×2). Met twee voorbeelden blijft er meestal één regel over. Daarom test je elke regel op alle voorbeelden.',
    'ana-let': 'Door letter voor letter te vergelijken zie je of de letters verschuiven (andere letters) of van plek wisselen (zelfde letters). Die ene vaststelling bepaalt al welk soort regel het is.',
    dia: 'Elke bewerking werkt op de uitkomst van de vorige. De volgorde bepaalt dus het resultaat: wie een stap verwisselt of overslaat, krijgt een andere uitkomst. Stap voor stap werken sluit dat uit.',
    'dia-in': 'Elke bewerking heeft een tegenbewerking (omkeren ↔ omkeren, eerste naar achteren ↔ laatste naar voren). Door achteraan te beginnen, maak je stap voor stap ongedaan wat er gebeurd is.',
    fig: 'In een figuurreeks kunnen meerdere eigenschappen tegelijk veranderen, elk met een eigen regel. Door ze apart te bekijken raak je er geen kwijt, en voorkom je dat één opvallende verandering een andere verbergt.',
    'abs-odd': 'Een afwijker is pas overtuigend als alle andere figuren één gemeenschappelijke regel delen. Daarom zoek je eerst de regel die de meerderheid volgt en pas daarna de uitzondering.',
    'abs-figana': 'Een figuuranalogie zegt: doe met de derde figuur precies wat er met de eerste gebeurde. Wie alle veranderingen van A naar B opschrijft, kan ze één voor één toepassen.',
    'abs-matrix': 'Een matrix is opgebouwd uit regels per rij en per kolom. Het lege vak moet aan allebei tegelijk voldoen, dus je kunt elke eigenschap apart invullen.',
    'log-order': 'Als alle zinnen dezelfde richting hebben (“ouder dan”), vormen ze één keten. Een keten kun je op een lijn zetten zonder te onthouden welke zinnen omgekeerd waren.',
    'log-syl': 'Een conclusie is alleen “zeker” als ze klopt in elke situatie die bij de gegevens past. Eén tegenvoorbeeld is genoeg om een conclusie af te wijzen.',
    'log-code': 'Een code is een vaste regel per letter of per positie. Door het voorbeeld letter voor letter te vergelijken, vind je de regel die je daarna op het nieuwe woord toepast.',
    'log-sum': 'Door met één totaal te rekenen (manuren, mandagen, minuten) voorkom je dat je eenheden door elkaar haalt. De vraag wordt dan een simpele deling of aftrekking.',
  };
  function whyWorks(q) {
    if (q.cat === 'num') return WHY.num;
    if (q.cat === 'ana') return WHY['ana-' + ((q.meta && q.meta.sub) || 'word')];
    if (q.cat === 'dia') return q.meta && q.meta.mode === 'in' ? WHY['dia-in'] : WHY.dia;
    if (q.cat === 'fig') return WHY.fig;
    if (q.cat === 'abs') return WHY['abs-' + q.kindId] || WHY['abs-odd'];
    return WHY['log-' + q.kindId] || WHY['log-sum'];
  }
  function searchSteps(q) {
    if (q.cat !== 'num') return null;
    const f = FOUND_AT[q.kindId];
    return SEARCH.map((s, i) => ({ s, state: i < f ? 'no' : i === f ? 'yes' : 'skip' }));
  }

  MT.reason = { build, judge, quadrant, reasonOk, whyWorks, searchSteps, SEARCH, QUAD, ERR, TAG_ERR };
})(typeof window !== 'undefined' ? window : globalThis);
