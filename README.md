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
3. ⚓ Mariniers Training Mode: vaste opbouw van 55 vragen (13 cijferreeksen, 13 analogieën, 13 figuurreeksen en 16 Venn-diagrammen), zonder niveaus en hints, met uitgebreide analyse
4. ⏱️ Assessment Simulatie: geen feedback tussendoor, tijdsdruk, eindrapport
5. 🎯 Zwakke Punten Training: kiest automatisch je zwakste onderdelen uit de sessie
6. 🛠️ Zelf Instellen: niveau, moeilijkheid, categorie, duur, tijdsdruk, feedback en hints

**6 categorieën, elk met niveau 1 t/m 5**

| | Categorie | Soorten vragen |
|---|---|---|
| A | 🔢 Cijferreeksen | Alle getallen hebben twee cijfers (10–99); één getal is gevraagd. 13 patronen: vaste stap, afwisselende stappen, veranderende verschillen, twee reeksen door elkaar (ook met veranderende stap), verschillen in twee reeksen, groeiende zigzag, kwadraten, som van vorige twee/drie, priemverschillen … |
| B | 🔤 Analogieën | Woordanalogieën, getalanalogieën en letteranalogieën. In de Mariniers Training Mode kies je bij elke woordanalogie het woord links én rechts (31 eigen woordparen met bewust verleidelijke combinaties) |
| C | ◯ Diagrammen | Uitkomst bepalen, ontbrekende bewerking vinden, terugrekenen; symbolen wisselen per vraag. In de Mariniers Training Mode: Venn-diagrammen met drie begrippen en negen soorten verhoudingen |
| D | 🔷 Figuurreeksen | Draaiing, vulling, vorm, stippen, 1–3 regels tegelijk, rasters met één of twee bewegingen |
| E | 🧩 Logisch redeneren | Volgordes, syllogismen (gecontroleerd met een logica-checker), geheimschrift, redeneersommen |
| F | 🧠 Abstract redeneren | Welke hoort er niet bij, figuuranalogieën, 3×3-matrices |

**Mariniers Training Mode**

Deze modus heeft geen niveaukeuze en past zijn moeilijkheid niet aan. De vragen zijn opgebouwd naar het formaat van de oefenopgaven die gebruikers kennen: cijferreeksen met een lange reeks getallen van twee cijfers en vier antwoordopties, analogieën met twee open plekken, figuurreeksen met vier opties en Venn-diagrammen (kies het diagram dat de verhouding tussen drie begrippen toont). De vragen zijn zelf gemaakt en komen niet uit het echte assessment.

**Adaptief systeem** (de andere modi)

- Twee keer overtuigend goed (binnen de tijd, zonder hint) → niveau omhoog voor die categorie
- Twee keer fout in dezelfde categorie → eerst uitleg, dan een iets eenvoudigere diagnostische vraag over hetzelfde principe, daarna een hertest op het oude niveau
- Adaptieve tijdsdruk: sneller bij goede antwoorden, meer tijd na fouten
- Nulmeting (automatische niveaubepaling) met 10 vragen van niveau 1 naar 5

**Feedback per vraag**: resultaat, juiste antwoord, jouw antwoord, antwoordtijd, stapsgewijze uitleg, waarom jouw antwoord niet klopt, een snellere methode, een leerpunt en je voortgang.

**Commando's** (als knoppen): MENU · PROFIEL · UPDATE PROFIEL · NULMETING · HERKALIBREER · ZWAKKE PUNTEN · TRAIN ZWAKKE PUNTEN · MOEILIJKER · MAKKELIJKER · HINT · UITLEG · VOLGENDE · SCORE · STOP. Antwoorden kan ook met de toetsen A–E.

Resultaten blijven alleen in de eigen browser (localStorage). Er is geen server en er wordt niets verstuurd.

## Licentie

MIT: vrij te gebruiken, aan te passen en te delen.
