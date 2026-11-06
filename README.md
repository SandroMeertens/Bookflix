# Bookflix (groep 8)

Leesscorebord voor de klas in Netflix-stijl. Elk gelezen boek krijgt een duim en een eigen getekende kaft, de klas speelt samen beloningen vrij en het seizoen eindigt met de Bookflix Awards.

De leerkracht logt in met Google; de stand wordt bij dat account bewaard. iPads van de klas doen mee met een klascode (staat bij **Instellen**, met QR-code).

## Mappen

| Bestand | Wat |
|---|---|
| `public/` | De site zelf (dit komt online) |
| `public/index.html` | Het scorebord: schermen, kaften en spelregels |
| `public/opslag.js` | Inloggen, klascode en opslag in Firestore |
| `public/config.js` | Hier komen de Firebase-gegevens. Leeg = demo-modus |
| `public/vendor/` | Firebase en de QR-code-maker (vaste bestanden) |
| `firestore.rules` | Wie mag wat zien en veranderen |
| `.github/workflows/deploy.yml` | Zet de site vanzelf online bij elke wijziging |

## Uitproberen zonder Firebase

Laat `config.js` op `null` staan en open de map `public` via een webserver, bijvoorbeeld:

```
npx serve public
```

De stand blijft dan alleen in deze browser.

## Online zetten

Zie [STAPPENPLAN.md](STAPPENPLAN.md). Kort: Firebase-project (Spark, gratis) → Authentication (Google + Anoniem) → Firestore → webapp-gegevens in `config.js` → GitHub-secrets → push naar `main`.

## Privacy

Vul geen achternamen of foto's van leerlingen in: de site bewaart alleen boektitels, aantallen duimen en beloningen.

Echte kaften worden opgezocht bij Google Boeken (en anders Open Library). Daarbij gaat alleen de boektitel naar die zoekdienst. Wordt er geen kaft gevonden, dan krijgt het boek een getekende kaft. Bij **Boeken** kan de leerkracht met **Andere kaft** een andere uitgave kiezen of terug naar de getekende kaft. Houd deze GitHub-map **privé**.
