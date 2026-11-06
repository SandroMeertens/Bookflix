/* Bookflix — opslag en inloggen.
   Met Firebase-gegevens in config.js logt de leerkracht in met Google en bewaart Firestore de stand.
   iPads van de klas doen mee met de klascode (anoniem inloggen). Zonder gegevens draait Bookflix
   als demo en blijft de stand op dit apparaat.
   Het scorebord (index.html) wacht op window.bookflixOpslag; dit bestand vult die in met
   { ref, klas, rol } of met null (demo). */
import { firebaseConfig } from "./config.js";

const zet = window.bookflixZet || (() => {});
const $ = (id) => document.getElementById(id);
const CODETEKENS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const KLAS_SLEUTEL = "bookflix.klas";

function nieuweCode() {
  let s = "";
  for (const x of crypto.getRandomValues(new Uint8Array(5))) s += CODETEKENS[x % CODETEKENS.length];
  return s;
}
function lees(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
function bewaar(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} }
/* Duidelijke melding bij een fout, met de code erbij zodat je weet waar het zit */
function foutTekst(e) {
  const c = (e && e.code) || "";
  if (/closed-by-user|cancelled-popup/.test(c)) return "";
  if (c === "auth/configuration-not-found" || c === "auth/operation-not-allowed" || c === "auth/admin-restricted-operation")
    return "Deze manier van inloggen staat nog uit. Zet in Firebase bij Authentication 'Google' en 'Anonymous' aan.";
  if (c === "auth/unauthorized-domain")
    return "Dit adres mag nog niet inloggen. Voeg het in Firebase toe bij Authentication > Settings > Authorized domains.";
  if (c === "auth/popup-blocked") return "Het inlogvenster werd tegengehouden. Sta pop-ups toe voor deze site.";
  if (c === "permission-denied" || c === "firestore/permission-denied")
    return "Inloggen is gelukt, maar de database weigert nog. Staan de regels er al? (GitHub Actions moet helemaal groen zijn.)";
  if (c === "not-found" || c === "failed-precondition" || c === "firestore/not-found")
    return "De database bestaat nog niet. Maak in Firebase een Firestore Database aan.";
  if (c === "traag") return "De database reageert niet. Maak in Firebase een Firestore Database aan (Databases & Storage > Firestore) en probeer het opnieuw.";
  if (c === "unavailable") return "Geen verbinding met de database. Controleer de internetverbinding.";
  return "Dat lukte niet" + (c ? " (" + c + ")" : "") + ". Probeer het nog eens.";
}
function schoon(c) { return String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5); }

if (!firebaseConfig || !firebaseConfig.apiKey) {
  document.body.classList.add("demo");
  zet(null);
} else {
  begin().catch((e) => { console.warn(e); zet(null); });
}

async function begin() {
  const F = await import("./vendor/firebase.js");
  const app = F.initializeApp(firebaseConfig);
  const auth = F.getAuth(app);
  const db = F.initializeFirestore(app, {});
  const d = (...p) => F.doc(db, ...p);
  /* Antwoordt de database niet binnen 10 seconden, dan zeggen we dat (meestal bestaat hij dan nog niet) */
  const traag = (p) => Promise.race([p, new Promise((_, nee) => setTimeout(() => nee({ code: "traag" }), 10000))]);
  const haal = async (r) => { const s = await traag(F.getDoc(r)); return s.exists() ? s.data() : null; };
  let klaar = false, bezig = false, klasData = null, klasId = "";

  /* ---------- Poort: inloggen of klascode ---------- */
  function poortMeld(t) { $("poortMeld").textContent = t || ""; }
  /* iPad, telefoon of als app op het beginscherm: eerst de klascode voor de kinderen */
  const isTablet = /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const alsApp = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  let ikJuf = false;
  try { ikJuf = localStorage.getItem("bookflix.leerkracht") === "1"; } catch (e) {}
  function toonPoort(t) {
    $("poort").classList.toggle("kind", (isTablet || alsApp) && !ikJuf);
    $("poort").hidden = false;
    if (t !== undefined) poortMeld(t);
    const c = schoon(new URLSearchParams(location.search).get("code"));
    if (c && !$("poortCode").value) $("poortCode").value = c;
  }
  function verbergPoort() { $("poort").hidden = true; }

  $("poortIkJuf").addEventListener("click", () => { $("poort").classList.remove("kind"); poortMeld(""); });
  /* Vijf tekens ingetikt? Dan meteen koppelen */
  $("poortCode").addEventListener("input", () => {
    const c = schoon($("poortCode").value);
    if (c.length === 5 && !bezig) $("poortForm").requestSubmit ? $("poortForm").requestSubmit() : $("poortForm").dispatchEvent(new Event("submit", { cancelable: true }));
  });
  $("poortJuf").addEventListener("click", async () => {
    if (bezig) return; bezig = true; poortMeld("Bezig met inloggen…");
    const pr = new F.GoogleAuthProvider();
    pr.setCustomParameters({ prompt: "select_account" });
    poortMeld("Kies je Google-account in het venster dat opent…");
    try {
      if (auth.currentUser && auth.currentUser.isAnonymous) await F.signOut(auth);
      const r = await F.signInWithPopup(auth, pr);
      await alsLeerkracht(r.user);
    } catch (e) {
      if (e && e.code === "auth/popup-blocked") { await F.signInWithRedirect(auth, pr); return; }
      console.warn(e);
      poortMeld(foutTekst(e));
    }
    bezig = false;
  });
  $("poortForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const c = schoon($("poortCode").value);
    if (c.length !== 5) { poortMeld("Een klascode heeft 5 tekens."); return; }
    if (bezig) return; bezig = true; poortMeld("Bezig met koppelen…");
    try { await meedoen(c); } catch (err) { console.warn(err); poortMeld(foutTekst(err)); }
    bezig = false;
  });

  /* ---------- Leerkracht: eigen klas met een klascode ---------- */
  async function alsLeerkracht(u) {
    const kid = u.uid;
    bewaar("bookflix.leerkracht", "1");
    let k = await haal(d("klassen", kid));
    if (!k) {
      k = { owner: kid, code: "", t: Date.now() };
      await F.setDoc(d("klassen", kid), k);
    }
    if (!k.code) k.code = await maakCode(kid);
    klasData = k;
    klaarMet(kid, "juf");
  }
  async function maakCode(kid) {
    for (let i = 0; i < 8; i++) {
      const c = nieuweCode();
      if (await haal(d("codes", c))) continue;
      await F.setDoc(d("codes", c), { klas: kid, owner: kid });
      await F.updateDoc(d("klassen", kid), { code: c });
      return c;
    }
    throw new Error("Geen vrije klascode gevonden");
  }

  /* ---------- iPad: meedoen met de klascode ---------- */
  async function meedoen(c) {
    if (!auth.currentUser) await F.signInAnonymously(auth);
    const u = auth.currentUser;
    const info = await haal(d("codes", c));
    if (!info) { poortMeld("Deze klascode bestaat niet. Kijk nog eens op het digibord."); return false; }
    await F.setDoc(d("klassen", info.klas, "leden", u.uid), { code: c, t: Date.now() });
    bewaar(KLAS_SLEUTEL, info.klas);
    if (location.search) history.replaceState(null, "", location.pathname);
    klaarMet(info.klas, "lid");
    return true;
  }
  async function nogLid(kid) {
    try { return !!(await haal(d("klassen", kid))); } catch (e) { return false; }
  }

  /* ---------- Klaar: het scorebord krijgt zijn opslag ---------- */
  function klaarMet(kid, rol) {
    if (klaar) return;
    klaar = true; klasId = kid;
    verbergPoort();
    document.body.classList.add(rol === "juf" ? "juf" : "lid");
    const r = d("klassen", kid, "bord", "seizoen");
    zet({
      klas: kid,
      rol,
      ref: {
        set: (body) => F.setDoc(r, body),
        onSnapshot: (cb, fout) => F.onSnapshot(r,
          (s) => cb({ exists: s.exists(), data: () => s.data(), metadata: s.metadata }),
          (e) => { console.warn(e); if (fout) fout(e); })
      },
      /* Antwoorden op de leesvragen: aparte documenten. iPads mogen ze alleen toevoegen, de leerkracht leest ze. */
      ai: maakAI(),
      antwoorden: {
        voegToe: (data) => F.addDoc(F.collection(db, "klassen", kid, "antwoorden"), data),
        luister: (cb) => F.onSnapshot(F.collection(db, "klassen", kid, "antwoorden"),
          (s) => cb(s.docs.map((x) => Object.assign({ id: x.id }, x.data()))),
          (e) => console.warn(e)),
        zet: (id, data) => F.updateDoc(d("klassen", kid, "antwoorden", id), data),
        weg: (id) => F.deleteDoc(d("klassen", kid, "antwoorden", id))
      }
    });
    if (rol === "juf") vulKlasBlok();
  }

  /* ---------- AI voor leesvragen (Firebase AI Logic, Gemini Developer API) ----------
     Werkt alleen als AI Logic in de Firebase-console aanstaat. Lukt het niet, dan gebruikt
     Bookflix de standaardvragen. Modelnamen veranderen in de loop van de tijd: we proberen ze op volgorde. */
  const MODELLEN = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
  function maakAI() {
    let ai = null;
    try { ai = F.getAI(app, { backend: new F.GoogleAIBackend() }); } catch (e) { console.warn(e); return null; }
    let begin = Math.max(0, MODELLEN.indexOf(lees("bookflix.model")));
    return {
      async vraag(prompt) {
        let laatste = null;
        for (let i = begin; i < MODELLEN.length; i++) {
          try {
            const m = F.getGenerativeModel(ai, { model: MODELLEN[i], generationConfig: { responseMimeType: "application/json", temperature: 0.4 } });
            const r = await m.generateContent(prompt);
            if (i !== begin) { begin = i; bewaar("bookflix.model", MODELLEN[i]); }
            return r.response.text();
          } catch (e) {
            laatste = e;
            const t = String((e && (e.message || e.code)) || "");
            /* Alleen als dit model niet (meer) bestaat, het volgende proberen */
            if (!/not.?found|404|is not supported|unsupported|deprecat|no longer available/i.test(t)) throw e;
          }
        }
        throw laatste || new Error("geen model");
      }
    };
  }

  /* ---------- Instellen: klascode, QR-code, nieuwe code, uitloggen ---------- */
  function adres() { return location.origin + location.pathname; }
  let ledenStop = null;
  function vulKlasBlok() {
    $("klasBlok").hidden = false;
    $("koppelKnop").hidden = false; $("startKoppel").hidden = false;
    const vak = $("koppelCode"); vak.textContent = ""; vak.setAttribute("aria-label", "Klascode " + klasData.code.split("").join(" "));
    klasData.code.split("").forEach((ch) => { const s = document.createElement("span"); s.textContent = ch; s.setAttribute("aria-hidden", "true"); vak.appendChild(s); });
    /* Hoeveel iPads zijn er gekoppeld? */
    if (!ledenStop) ledenStop = F.onSnapshot(F.collection(db, "klassen", klasId, "leden"), (s) => {
      const n = s.size;
      $("koppelTel").textContent = n ? n + (n === 1 ? " iPad gekoppeld" : " iPads gekoppeld") : "";
    }, (e) => console.warn(e));
    $("klasCode").textContent = klasData.code;
    $("klasAdres").textContent = location.host;
    tekenQR();
  }
  let qrLaden = null;
  function laadQR() {
    if (!qrLaden) qrLaden = new Promise((res) => {
      if (window.qrcode) return res();
      const s = document.createElement("script");
      s.src = "vendor/qrcode.js"; s.onload = () => res(); s.onerror = () => res();
      document.head.appendChild(s);
    });
    return qrLaden;
  }
  async function tekenQR() {
    await laadQR();
    if (!window.qrcode || !klasData) return;
    const q = window.qrcode(0, "M");
    q.addData(adres() + "?code=" + klasData.code);
    q.make();
    const svg = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    $("klasQR").innerHTML = svg;
    $("koppelQR").innerHTML = svg;
  }
  /* Het grote koppelscherm voor het digibord */
  function koppelOpen() { if (!klasData) return; $("koppelScherm").hidden = false; tekenQR(); setTimeout(() => $("koppelDicht").focus(), 30); }
  function koppelDicht() { $("koppelScherm").hidden = true; }
  $("koppelKnop").addEventListener("click", koppelOpen);
  $("startKoppel").addEventListener("click", koppelOpen);
  $("koppelDicht").addEventListener("click", koppelDicht);
  $("koppelScherm").addEventListener("click", (e) => { if (e.target === $("koppelScherm")) koppelDicht(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("koppelScherm").hidden) koppelDicht(); });
  $("nieuweCode").addEventListener("click", async () => {
    if (!klasData || bezig) return;
    bezig = true; $("klasMeld").textContent = "Nieuwe code maken…";
    try {
      const oud = klasData.code;
      const leden = await F.getDocs(F.collection(db, "klassen", klasId, "leden"));
      await Promise.all(leden.docs.map((x) => F.deleteDoc(x.ref)));
      if (oud) await F.deleteDoc(d("codes", oud)).catch(() => {});
      klasData.code = await maakCode(klasId);
      vulKlasBlok();
      $("klasMeld").textContent = "Nieuwe code klaar. De iPads moeten opnieuw koppelen.";
    } catch (e) { console.warn(e); $("klasMeld").textContent = "Dat lukte niet. Probeer het nog eens."; }
    bezig = false;
  });
  async function uitloggen() {
    if (document.body.classList.contains("lid") && auth.currentUser) {
      await F.deleteDoc(d("klassen", klasId, "leden", auth.currentUser.uid)).catch(() => {});
      bewaar(KLAS_SLEUTEL, "");
    }
    await F.signOut(auth).catch(() => {});
    location.replace(adres());
  }
  $("uitloggen").addEventListener("click", uitloggen);
  /* Ontkoppelen op de iPad: twee keer tikken, zodat een kind het niet per ongeluk doet */
  let zekerKlok = null;
  $("ontkoppel").addEventListener("click", () => {
    const k = $("ontkoppel");
    if (k.classList.contains("zeker")) { uitloggen(); return; }
    k.classList.add("zeker"); k.dataset.svg = k.innerHTML; k.textContent = "Tik nog eens om te ontkoppelen";
    clearTimeout(zekerKlok);
    zekerKlok = setTimeout(() => { k.classList.remove("zeker"); k.innerHTML = k.dataset.svg; }, 4000);
  });

  /* ---------- Begin: wie is er al ingelogd? ---------- */
  const eerste = await new Promise((res) => { const stop = F.onAuthStateChanged(auth, (u) => { stop(); res(u); }); });
  const linkCode = schoon(new URLSearchParams(location.search).get("code"));
  if (eerste && !eerste.isAnonymous) {
    try { await alsLeerkracht(eerste); } catch (e) { console.warn(e); toonPoort(foutTekst(e)); }
    return;
  }
  if (eerste && eerste.isAnonymous) {
    const kid = lees(KLAS_SLEUTEL);
    if (kid && !linkCode && await nogLid(kid)) { klaarMet(kid, "lid"); return; }
    if (kid && !linkCode) { bewaar(KLAS_SLEUTEL, ""); toonPoort("Deze iPad is niet meer gekoppeld. Vul de klascode van het digibord in."); return; }
  }
  if (linkCode) {
    bezig = true;
    try { if (await meedoen(linkCode)) { bezig = false; return; } } catch (e) { console.warn(e); poortMeld(foutTekst(e)); }
    bezig = false;
  }
  toonPoort();
}
