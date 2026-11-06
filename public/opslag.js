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
  const haal = async (r) => { const s = await F.getDoc(r); return s.exists() ? s.data() : null; };
  let klaar = false, bezig = false, klasData = null, klasId = "";

  /* ---------- Poort: inloggen of klascode ---------- */
  function poortMeld(t) { $("poortMeld").textContent = t || ""; }
  function toonPoort(t) {
    $("poort").hidden = false;
    if (t !== undefined) poortMeld(t);
    const c = schoon(new URLSearchParams(location.search).get("code"));
    if (c && !$("poortCode").value) $("poortCode").value = c;
  }
  function verbergPoort() { $("poort").hidden = true; }

  $("poortJuf").addEventListener("click", async () => {
    if (bezig) return; bezig = true; poortMeld("Bezig met inloggen…");
    const pr = new F.GoogleAuthProvider();
    pr.setCustomParameters({ prompt: "select_account" });
    try {
      if (auth.currentUser && auth.currentUser.isAnonymous) await F.signOut(auth);
      const r = await F.signInWithPopup(auth, pr);
      await alsLeerkracht(r.user);
    } catch (e) {
      if (e && /popup/.test(e.code || "") && !/closed-by-user|cancelled/.test(e.code || "")) {
        await F.signInWithRedirect(auth, pr); return;
      }
      console.warn(e);
      poortMeld(e && /closed-by-user|cancelled/.test(e.code || "") ? "" : "Inloggen lukte niet. Probeer het nog eens.");
    }
    bezig = false;
  });
  $("poortForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const c = schoon($("poortCode").value);
    if (c.length !== 5) { poortMeld("Een klascode heeft 5 tekens."); return; }
    if (bezig) return; bezig = true; poortMeld("Bezig met koppelen…");
    try { await meedoen(c); } catch (err) { console.warn(err); poortMeld("Koppelen lukte niet. Klopt de code?"); }
    bezig = false;
  });

  /* ---------- Leerkracht: eigen klas met een klascode ---------- */
  async function alsLeerkracht(u) {
    const kid = u.uid;
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
      }
    });
    if (rol === "juf") vulKlasBlok();
  }

  /* ---------- Instellen: klascode, QR-code, nieuwe code, uitloggen ---------- */
  function adres() { return location.origin + location.pathname; }
  function vulKlasBlok() {
    $("klasBlok").hidden = false;
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
    $("klasQR").innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }
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
  $("ontkoppel").addEventListener("click", uitloggen);

  /* ---------- Begin: wie is er al ingelogd? ---------- */
  const eerste = await new Promise((res) => { const stop = F.onAuthStateChanged(auth, (u) => { stop(); res(u); }); });
  const linkCode = schoon(new URLSearchParams(location.search).get("code"));
  if (eerste && !eerste.isAnonymous) { await alsLeerkracht(eerste); return; }
  if (eerste && eerste.isAnonymous) {
    const kid = lees(KLAS_SLEUTEL);
    if (kid && !linkCode && await nogLid(kid)) { klaarMet(kid, "lid"); return; }
    if (kid && !linkCode) { bewaar(KLAS_SLEUTEL, ""); toonPoort("Deze iPad is niet meer gekoppeld. Vul de klascode van het digibord in."); return; }
  }
  if (linkCode) {
    bezig = true;
    try { if (await meedoen(linkCode)) { bezig = false; return; } } catch (e) { console.warn(e); }
    bezig = false;
  }
  toonPoort();
}
