# Marinier Selectietrainer

Een gratis, **onofficiële** trainer voor de cognitieve capaciteitentest. Bedoeld voor iedereen die zich voorbereidt op een assessment bij Defensie, bijvoorbeeld voor het Korps Mariniers.

Alle vragen worden **ter plekke gegenereerd**. Elke training heeft dus andere getallen, woorden, letters en figuren. Na elke vraag krijg je stap-voor-stap uitleg, en aan het eind een trainingsrapport met je sterke en zwakke punten.

> Dit project is niet verbonden aan Defensie of het Korps Mariniers. Het zijn zelfgemaakte oefenvragen, geen echte assessmentvragen. Niveaus en tijdslimieten zijn trainingsinstellingen en zeggen niets over het officiële assessment.

## Functies

**Profielsysteem**

- Start met een keuze: 🆕 nieuwe gebruiker (intake + nulmeting), 📂 bestaand Assessmentprofiel laden, of 🔄 profiel laden + korte herkalibratie (3–5 controlevragen).
- Intake van 6 korte vragen (ervaring, moeilijke/makkelijke onderdelen, waar je moeite mee hebt, doel), daarna een adaptieve nulmeting van 6–10 vragen over alle categorieën.
- Na de nulmeting volgt een analyse en een volledig **Assessmentprofiel** in tekst: niveau per categorie, denkprofiel, soorten fouten, sterke en zwakke punten, aanbevolen training en instellingen, en persoonlijke leerregels. Kopieer het en plak het later weer in (of in een andere chat).
- Het profiel bevat een profielcode, zodat de trainer het exact kan terugladen. Een profiel zonder code (bijv. uit ChatGPT) wordt zo goed mogelijk uit de tekst gelezen; de trainer vraagt alleen naar wat echt ontbreekt.
- Na een training van minstens 5 vragen: “Wil je je Assessmentprofiel bijwerken?” → een volledige nieuwe versie (v1 → v2 → v3). Oude gegevens en nieuwe resultaten worden gecombineerd; bij weinig nieuwe vragen past het niveau maar voorzichtig aan.

**Antwoord én denkwijze**

- In de nulmeting, Leren & Uitleggen en Zwakke Punten Training geef je na je antwoord ook aan hoe je het aanpakte (welk patroon, welke regel, welke veranderingen je zag), plus optioneel in eigen woorden.
- Antwoord en redenering worden apart beoordeeld: **A** goed + goed, **B** goed antwoord met verkeerde redenering, **C** fout antwoord met goede aanpak, **D** fout + fout.
- Fouttypes: patroonherkenning, rekenen, lezen, logica, verkeerde aanname, correcte methode verkeerd uitgevoerd, te vroeg antwoord gekozen, onnodig ingewikkeld gedacht.
- Feedback: wat ging goed, wat ging fout, stap-voor-stap oplossing, waarom de methode werkt, snellere aanpak en leerpunt. Bij cijferreeksen zie je de systematische zoekvolgorde en waar je kunt stoppen.
- Principes die fout gingen komen later in de training terug in een andere vorm.

**6 trainingsmodi**

1. 📚 Leren & Uitleggen: één vraag per keer, direct uitleg, geen tijdsdruk
2. 🧠 Adaptieve Training: moeilijkheid en tijd passen zich aan je prestaties aan
3. ⚓ Mariniers Training Mode: 30 gemengde vragen, adaptief, geen hints, uitgebreide analyse
4. ⏱️ Assessment Simulatie: geen feedback tussendoor, tijdsdruk, eindrapport
5. 🎯 Zwakke Punten Training: kiest automatisch je zwakste onderdelen uit de sessie
6. 🛠️ Zelf Instellen: niveau, moeilijkheid, categorie, duur, tijdsdruk, feedback en hints

**6 categorieën, elk met niveau 1 t/m 5**

| | Categorie | Soorten vragen |
|---|---|---|
| A | 🔢 Cijferreeksen | 15 patronen: vaste stap, ×/÷, oplopende verschillen, twee reeksen door elkaar, kwadraten, som van vorige twee/drie, priemverschillen … |
| B | 🔤 Analogieën | Woordanalogieën (bijna 50 paren), getalanalogieën en letteranalogieën |
| C | ◯ Diagrammen | Uitkomst bepalen, ontbrekende bewerking vinden, terugrekenen; symbolen wisselen per vraag |
| D | 🔷 Figuurreeksen | Draaiing, vulling, vorm, stippen, 1–3 regels tegelijk, rasters met één of twee bewegingen |
| E | 🧩 Logisch redeneren | Volgordes, syllogismen (gecontroleerd met een logica-checker), geheimschrift, redeneersommen |
| F | 🧠 Abstract redeneren | Welke hoort er niet bij, figuuranalogieën, 3×3-matrices |

**Adaptief systeem**

- Twee keer overtuigend goed (binnen de tijd, zonder hint) → niveau omhoog voor die categorie
- Twee keer fout in dezelfde categorie → eerst uitleg, dan een iets eenvoudigere diagnostische vraag over hetzelfde principe, daarna een hertest op het oude niveau
- Adaptieve tijdsdruk: sneller bij goede antwoorden, meer tijd na fouten
- Nulmeting (automatische niveaubepaling) met 10 vragen van niveau 1 naar 5

**Feedback per vraag**: resultaat, juiste antwoord, jouw antwoord, antwoordtijd, stapsgewijze uitleg, waarom jouw antwoord niet klopt, een snellere methode, een leerpunt en je voortgang.

**Commando's** (als knoppen): MENU · PROFIEL · UPDATE PROFIEL · NULMETING · HERKALIBREER · ZWAKKE PUNTEN · TRAIN ZWAKKE PUNTEN · MOEILIJKER · MAKKELIJKER · HINT · UITLEG · VOLGENDE · SCORE · STOP. Antwoorden kan ook met de toetsen A–E.

Resultaten blijven alleen in de eigen browser (localStorage). Er is geen server en er wordt niets verstuurd.

## Gebruiken

Het is een statische website zonder build-stap: open `index.html` in een browser.

### Online zetten met GitHub Pages

1. Maak een nieuwe repository op GitHub, bijvoorbeeld `marinier-selectietrainer`.
2. Upload alle bestanden uit deze map (via **Add file → Upload files** of met `git push`).
3. Ga naar **Settings → Pages**, kies bij *Source* “Deploy from a branch”, branch `main`, map `/ (root)`.
4. Na een minuut staat de trainer op `https://<gebruikersnaam>.github.io/marinier-selectietrainer/`.

Netlify, Vercel of Cloudflare Pages werken ook: sleep de map erin, er is geen build-commando nodig.

### Eén los bestand

```bash
python3 tools/build_single.py
```

Dit maakt `dist/marinier-selectietrainer.html`, met alle CSS en JavaScript erin. Dat bestand kun je delen of los openen.

## Vragen controleren

```bash
node tests/check.js 500
```

Genereert 500 vragen per categorie per niveau (15.000 in totaal) en controleert onder meer: precies één juist antwoord, geen dubbele opties, uitleg bij elke foute optie, of elk syllogisme logisch klopt, of er bij elke vraag een juiste redeneeroptie is, en of een profiel correct heen en terug gaat.

## Projectstructuur

```
index.html            pagina + tab met selectie-informatie
css/style.css         opmaak (licht en donker thema)
js/util.js            hulpfuncties en categorieën
js/figures.js         SVG-figuren en rasters
js/gen-*.js           vraaggeneratoren per categorie
js/reasoning.js       redeneeropties, A/B/C/D-beoordeling, fouttypes
js/profile.js         Assessmentprofiel: opbouwen, samenvoegen, tekst, inlezen
js/app.js             menu, modi, adaptief systeem, feedback, rapport
tests/check.js        automatische controle van de generatoren
tools/build_single.py bouwt één los HTML-bestand
```

## Uitbreiden

Elke generator exporteert `MT.gens.<categorie>.generate(niveau, { kind })` en geeft een vraag terug met `prompt`, `stem`, `opts` (elke foute optie met `why` en `tag`), `ans`, `steps`, `hint`, `quick` en `lesson`. Een nieuw patroon toevoegen = één object in de juiste generator. Draai daarna `node tests/check.js`.

## Licentie

MIT: vrij te gebruiken, aan te passen en te delen.
