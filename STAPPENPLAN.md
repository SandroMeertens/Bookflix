# Bookflix online zetten

Net als bij Alfabet Race: een eigen Firebase-project, en GitHub zet de site daar vanzelf neer.

## 1. Firebase-project maken
1. Ga naar **console.firebase.google.com** en klik op **Project maken**.
2. Naam: **bookflix** (Firebase maakt er een project-ID van, bijvoorbeeld `bookflix-1a2b3`). Google Analytics mag uit.

## 2. Inloggen aanzetten
1. Links: **Bouwen → Authentication → Aan de slag**.
2. Zet **Google** aan (kies je eigen e-mailadres als ondersteuningsadres) en sla op.
3. Zet ook **Anoniem** aan. Dat is voor de iPads met de klascode.

## 3. Database maken
1. Links: **Bouwen → Firestore Database → Database maken**.
2. Locatie: **eur3 (Europe)**. Kies **productiemodus**. De regels zet GitHub er straks zelf in.

## 4. Webapp-gegevens
1. Tandwiel → **Projectinstellingen** → onderaan **Jouw apps** → het icoon **</>**.
2. Naam: **Bookflix**. Klik op **App registreren**.
3. Kopieer het blok `firebaseConfig = { ... }` en zet het in `public/config.js` (of stuur het naar Claude).

## 5. Sleutel voor GitHub
1. **Projectinstellingen → Serviceaccounts → Nieuwe privésleutel genereren**. Er wordt een JSON-bestand gedownload.
2. Ga in GitHub naar de map **Bookflix → Settings → Secrets and variables → Actions → New repository secret** en maak er twee:
   - `FIREBASE_SERVICE_ACCOUNT`: plak de hele inhoud van het JSON-bestand.
   - `FIREBASE_PROJECT_ID`: het project-ID, bijvoorbeeld `bookflix-1a2b3`.
3. Gooi het JSON-bestand daarna weg; het is een wachtwoord.

## 6. Vragen per boek (AI Logic)
1. Firebase: links **AI services → AI Logic → Get started**.
2. Kies **Gemini Developer API** (gratis, zonder betaalgegevens) en zet hem aan.
3. Daarna maakt Bookflix bij elk nieuw boek zelf drie leesvragen. Staat dit uit, dan krijgen leerlingen de standaardvragen.

## 7. Online
1. In GitHub: **Actions → Online zetten → Run workflow** (of doe een wijziging op `main`).
2. Na een paar minuten staat Bookflix op **https://JOUW-PROJECT-ID.web.app**.

## In de klas
- Open de site op het digibord en log in met Google.
- **Instellen → iPads koppelen**: scan de QR-code met de iPad, of vul de klascode in.
- Code uitgelekt of nieuwe klas? **Nieuwe code**: alle iPads moeten dan opnieuw koppelen.
