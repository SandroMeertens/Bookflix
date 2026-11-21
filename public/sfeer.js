/* Sfeerbeelden voor de leestijd: een kampvuur en een leeslamp bij een regenachtig raam.
   Getekend met canvas, dus geen video's, geen downloads en geen rechten van anderen.
   Gebruik: var stop = Sfeer.start(canvas, "vuur" | "lamp"); stop() om te stoppen. */
(function () {
  var VW = 1000, VH = 1400;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function maakDoek(w, h) { var c = document.createElement("canvas"); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
  function vlek(r, g, b, kern) {
    var c = maakDoek(64, 64), x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",1)");
    gr.addColorStop(kern || 0.35, "rgba(" + r + "," + g + "," + b + ",0.45)");
    gr.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c;
  }
  var KORREL = (function () {
    var c = maakDoek(200, 200), x = c.getContext("2d"), d = x.createImageData(200, 200);
    for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); return c;
  })();
  /* Zacht flakkeren: een paar sinussen door elkaar */
  function flakker(t) { return 0.86 + 0.07 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 13.1 + 1.3) + 0.03 * Math.sin(t * 23.7 + 0.4); }

  /* ---------- Kampvuur ---------- */
  function Vuur() {
    var deeltjes = [], vonken = [], rook = [];
    var KLEUR = [vlek(255, 246, 214, 0.5), vlek(255, 206, 110), vlek(255, 150, 50), vlek(232, 84, 24), vlek(150, 36, 12)];
    var VONK = vlek(255, 200, 120, 0.2), ROOK = vlek(90, 84, 92, 0.2);
    var FX = 500, FY = 1010;
    this.focus = [500, 880];
    this.achtergrond = function (x) {
      var g = x.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, "#03040a"); g.addColorStop(0.55, "#0b0a12"); g.addColorStop(0.75, "#170d0c"); g.addColorStop(1, "#0a0707");
      x.fillStyle = g; x.fillRect(-1500, -300, VW + 3000, VH + 600);
      for (var i = 0; i < 420; i++) {
        x.fillStyle = "rgba(255,255,255," + rnd(0.15, 0.7) + ")";
        var s = rnd(0.8, 2.2); x.fillRect(rnd(-1500, VW + 1500), rnd(0, 640), s, s);
      }
      /* Bomenrij in de verte */
      x.fillStyle = "#06060b"; x.beginPath(); x.moveTo(-1500, 820);
      for (var xx = -1500; xx <= VW + 1500; xx += 22) x.lineTo(xx, 700 + Math.sin(xx * 0.05) * 30 + rnd(-60, 20) + (Math.abs(xx) % 66 === 0 ? -70 : 0));
      x.lineTo(VW + 1500, 860); x.lineTo(-1500, 860); x.fill();
      /* Grond */
      g = x.createLinearGradient(0, 820, 0, VH); g.addColorStop(0, "#0d0a0c"); g.addColorStop(1, "#060505");
      x.fillStyle = g; x.beginPath(); x.ellipse(500, 1180, 2200, 380, 0, Math.PI, 0); x.lineTo(VW + 1500, VH + 300); x.lineTo(-1500, VH + 300); x.fill();
      /* Stenen rond het vuur */
      for (var k = 0; k < 11; k++) {
        var a = Math.PI * (0.02 + k * 0.096), sx = FX + Math.cos(a) * 250, sy = FY + 40 + Math.sin(a) * 60;
        var sg = x.createLinearGradient(sx, sy - 40, sx, sy + 30); sg.addColorStop(0, "#6b5a52"); sg.addColorStop(1, "#1a1414");
        x.fillStyle = sg; x.beginPath(); x.ellipse(sx, sy, rnd(42, 58), rnd(26, 34), rnd(-0.2, 0.2), 0, Math.PI * 2); x.fill();
      }
    };
    function blok(x, cx, cy, l, d, hoek, licht) {
      x.save(); x.translate(cx, cy); x.rotate(hoek);
      var g = x.createLinearGradient(0, -d / 2, 0, d / 2);
      g.addColorStop(0, licht); g.addColorStop(0.45, "#3b2417"); g.addColorStop(1, "#120a07");
      x.fillStyle = g; x.beginPath(); x.roundRect(-l / 2, -d / 2, l, d, d / 2); x.fill();
      /* Schors */
      x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 3;
      for (var i = 0; i < 9; i++) { var px = rnd(-l / 2 + 20, l / 2 - 40); x.beginPath(); x.moveTo(px, rnd(-d / 2, 0)); x.lineTo(px + rnd(20, 60), rnd(-d / 3, d / 3)); x.stroke(); }
      /* Kopse kant */
      /* Verkoolde plekken */
      for (var c = 0; c < 6; c++) { x.fillStyle = "rgba(10,6,4," + rnd(0.35, 0.7) + ")"; x.beginPath(); x.ellipse(rnd(-l / 2 + 40, l / 2 - 60), rnd(-d / 4, d / 3), rnd(20, 60), rnd(8, 18), 0, 0, Math.PI * 2); x.fill(); }
      /* Gloeiende scheuren: onthouden, ze gloeien per beeld anders */
      for (var q = 0; q < 6; q++) {
        var p0 = rnd(-l / 2 + 40, l / 2 - 80), pts = [], yy = rnd(-d / 4, d / 4);
        for (var z = 0; z < 4; z++) { var lx = p0 + z * rnd(10, 22), ly = yy + rnd(-6, 6);
          pts.push([cx + lx * Math.cos(hoek) - ly * Math.sin(hoek), cy + lx * Math.sin(hoek) + ly * Math.cos(hoek)]); }
        scheuren.push({ p: pts, z: rnd(0, 6.28), s: rnd(0.6, 1.6) });
      }
      x.fillStyle = "#6e4a2e"; x.beginPath(); x.ellipse(l / 2 - d / 4, 0, d / 4, d / 2 - 2, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "rgba(40,22,12,.7)"; x.lineWidth = 2;
      for (var r = 6; r < d / 2 - 4; r += 7) { x.beginPath(); x.ellipse(l / 2 - d / 4, 0, r / 2, r, 0, 0, Math.PI * 2); x.stroke(); }
      x.restore();
    }
    var blokken = null, kolen = null, scheuren = [], gloeiers = [];
    var BLAUW = vlek(90, 120, 255, 0.3);
    for (var gi = 0; gi < 26; gi++) gloeiers.push({ x: FX + rnd(-190, 190), y: FY + 40 + rnd(-14, 26), r: rnd(18, 40), z: rnd(0, 6.28), s: rnd(0.7, 2) });
    this.teken = function (x, t, dt, f) {
      /* Gloed op de grond en in de lucht */
      x.globalCompositeOperation = "lighter";
      var g = x.createRadialGradient(FX, FY - 60, 20, FX, FY - 60, 760);
      g.addColorStop(0, "rgba(255,130,50," + 0.42 * f + ")"); g.addColorStop(0.35, "rgba(200,70,20," + 0.16 * f + ")"); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.fillRect(-1500, -300, VW + 3000, VH + 600);
      x.globalCompositeOperation = "source-over";
      /* Blokken hout */
      /* Bed van kolen onder het hout */
      if (!kolen) { kolen = maakDoek(520, 120); var kc = kolen.getContext("2d");
        for (var kk = 0; kk < 140; kk++) { var kx = 260 + rnd(-230, 230) * Math.random(), ky = 60 + rnd(-30, 30) * Math.random();
          var kg = kc.createRadialGradient(kx - 3, ky - 3, 1, kx, ky, 14); kg.addColorStop(0, "#3a2a24"); kg.addColorStop(1, "#0c0807");
          kc.fillStyle = kg; kc.beginPath(); kc.ellipse(kx, ky, rnd(8, 16), rnd(6, 11), rnd(0, 3), 0, Math.PI * 2); kc.fill(); } }
      x.drawImage(kolen, FX - 260, FY + 0);
      x.globalCompositeOperation = "lighter";
      gloeiers.forEach(function (o) { x.globalAlpha = (0.25 + 0.3 * (0.5 + 0.5 * Math.sin(t * o.s + o.z))) * f; x.drawImage(KLEUR[3], o.x - o.r, o.y - o.r * 0.6, o.r * 2, o.r * 1.2); });
      x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
      if (!blokken) { blokken = maakDoek(700, 300); var b = blokken.getContext("2d"); b.translate(350, 150);
        blok(b, -40, 30, 470, 70, -0.2, "#7a4a2a"); blok(b, 40, 40, 470, 74, 0.22, "#86522e"); blok(b, 0, 70, 380, 64, 0.02, "#6a3f24"); }
      x.drawImage(blokken, FX - 350, FY - 150);
      /* Het vuur verlicht het hout; scheuren gloeien op */
      x.globalCompositeOperation = "lighter";
      var lg = x.createRadialGradient(FX, FY - 40, 10, FX, FY + 20, 280);
      lg.addColorStop(0, "rgba(255,120,40," + 0.38 * f + ")"); lg.addColorStop(1, "rgba(255,90,20,0)");
      x.fillStyle = lg; x.fillRect(FX - 300, FY - 200, 600, 400);
      x.lineCap = "round"; x.lineJoin = "round";
      scheuren.forEach(function (c) {
        var a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * c.s + c.z));
        x.strokeStyle = "rgba(255," + Math.round(70 + 70 * a) + ",20," + (0.45 * a * f) + ")"; x.lineWidth = 2.2;
        x.beginPath(); c.p.forEach(function (pt, i) { var px = FX + pt[0], py = FY + pt[1]; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke();
      });
      x.globalCompositeOperation = "source-over";
      /* Gloeiende sintels tussen het hout */
      x.globalCompositeOperation = "lighter";
      for (var s = 0; s < 7; s++) {
        var pulse = 0.55 + 0.45 * Math.sin(t * (1.3 + s * 0.37) + s * 2.1);
        x.globalAlpha = 0.4 * pulse * f; x.drawImage(KLEUR[3], FX - 170 + s * 55 - 35, FY - 5 + (s % 3) * 14 - 35, 70, 70);
      }
      x.globalAlpha = 1;
      /* Vlammen */
      var n = Math.min(8, Math.round(dt * 60 * 4));
      for (var i = 0; i < n; i++) {
        var u = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
        deeltjes.push({ x: FX + u * 280, y: FY - 20 + rnd(-10, 20), vx: rnd(-10, 10), vy: -rnd(300, 470) * (1 - Math.abs(u) * 1.2),
          a: 0, l: rnd(0.8, 1.45) * (1 - Math.abs(u) * 1.1), r: rnd(34, 58) * (1 - Math.abs(u) * 0.5), z: rnd(0, 6.28) });
        /* Af en toe een lange, smalle vlammentong */
        if (Math.random() < 0.12) deeltjes.push({ x: FX + u * 160, y: FY - 40, vx: rnd(-8, 8), vy: -rnd(520, 640), a: 0, l: rnd(1, 1.5), r: rnd(18, 26), z: rnd(0, 6.28) });
      }
      for (var j = deeltjes.length - 1; j >= 0; j--) {
        var p = deeltjes[j]; p.a += dt / p.l;
        if (p.a >= 1) { deeltjes.splice(j, 1); continue; }
        p.vx += (FX - p.x) * 0.9 * dt + Math.sin(t * 2.2 + p.z + p.y * 0.01) * 40 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 60 * dt;
        var k = Math.min(4, Math.floor(Math.pow(p.a, 0.8) * 5)), rr = p.r * (1 - p.a * 0.6);
        x.globalAlpha = (p.a < 0.12 ? p.a / 0.12 : 1) * (1 - p.a) * 0.42;
        x.drawImage(KLEUR[k], p.x - rr, p.y - rr * 1.6, rr * 2, rr * 3.2);
        if (p.a < 0.12) { x.globalAlpha = 0.25 * (1 - p.a / 0.12); x.drawImage(BLAUW, p.x - rr * 0.7, p.y - rr * 0.4, rr * 1.4, rr * 0.9); }
      }
      /* Vonken */
      if (Math.random() < dt * 5) vonken.push({ x: FX + rnd(-80, 80), y: FY - 80, vx: rnd(-40, 40), vy: -rnd(200, 380), a: 0, l: rnd(1.6, 3.2), z: rnd(0, 6) });
      for (var v = vonken.length - 1; v >= 0; v--) {
        var q = vonken[v]; q.a += dt / q.l;
        if (q.a >= 1) { vonken.splice(v, 1); continue; }
        q.vx += Math.sin(t * 3 + q.z) * 60 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy *= 0.995;
        x.globalAlpha = (1 - q.a) * (0.6 + 0.4 * Math.sin(t * 20 + q.z)); x.drawImage(VONK, q.x - 7, q.y - 7, 14, 14);
      }
      x.globalCompositeOperation = "source-over";
      /* Een beetje rook */
      if (false) rook.push({ x: FX + rnd(-50, 50), y: FY - 380, a: 0, l: rnd(5, 8), r: rnd(60, 100), z: rnd(0, 6) });
      for (var m = rook.length - 1; m >= 0; m--) {
        var o = rook[m]; o.a += dt / o.l;
        if (o.a >= 1) { rook.splice(m, 1); continue; }
        o.y -= 45 * dt; o.x += Math.sin(t * 0.7 + o.z) * 18 * dt; var rr2 = o.r * (1 + o.a * 1.6);
        x.globalAlpha = 0.045 * Math.sin(o.a * Math.PI); x.drawImage(ROOK, o.x - rr2, o.y - rr2, rr2 * 2, rr2 * 2);
      }
      x.globalAlpha = 1;
    };
  }

  /* ---------- Leeslamp bij een regenachtig raam ---------- */
  function Lamp() {
    var DRUP = [], GLIJ = [], STOF = [], DAMP = [], STREEP = [];
    var RAAM = { x: 400, y: 150, w: 560, h: 720 };
    var LX = 220, LY = 640, WARM = vlek(255, 196, 120, 0.25), WIT = vlek(255, 255, 255, 0.3);
    this.focus = [430, 760];
    for (var i = 0; i < 170; i++) DRUP.push({ x: rnd(RAAM.x, RAAM.x + RAAM.w), y: rnd(RAAM.y, RAAM.y + RAAM.h), r: Math.pow(Math.random(), 2) * 7 + 1.5 });
    for (var j = 0; j < 14; j++) GLIJ.push(nieuwGlij(true));
    for (var k = 0; k < 70; k++) STREEP.push({ x: rnd(RAAM.x, RAAM.x + RAAM.w), y: rnd(RAAM.y, RAAM.y + RAAM.h), s: rnd(900, 1500), l: rnd(18, 40) });
    for (var m = 0; m < 34; m++) STOF.push({ x: rnd(80, 400), y: rnd(640, 900), z: rnd(0, 6.28), s: rnd(0.15, 0.45), r: rnd(1.2, 2.6) });
    function nieuwGlij(begin) { return { x: rnd(RAAM.x + 20, RAAM.x + RAAM.w - 20), y: begin ? rnd(RAAM.y, RAAM.y + RAAM.h) : RAAM.y - 10, y0: 0, r: rnd(5, 9), v: 0, rust: rnd(0, 3) }; }
    this.achtergrond = function (x) {
      /* Muur in een donkere kamer */
      var g = x.createLinearGradient(-600, 0, VW + 400, 0); g.addColorStop(0, "#0d0a09"); g.addColorStop(0.4, "#1d140e"); g.addColorStop(1, "#0d0a09");
      x.fillStyle = g; x.fillRect(-1500, -300, VW + 3000, VH + 600);
      /* Buiten: avondlucht met wazige lichtjes */
      x.save(); x.beginPath(); x.rect(RAAM.x, RAAM.y, RAAM.w, RAAM.h); x.clip();
      g = x.createLinearGradient(0, RAAM.y, 0, RAAM.y + RAAM.h); g.addColorStop(0, "#0a1020"); g.addColorStop(0.7, "#141a2a"); g.addColorStop(1, "#1c1a24");
      x.fillStyle = g; x.fillRect(RAAM.x, RAAM.y, RAAM.w, RAAM.h);
      var kleuren = [[255, 190, 110], [255, 160, 80], [150, 180, 240], [255, 220, 170], [120, 200, 220]];
      for (var b = 0; b < 46; b++) {
        var c = kleuren[b % kleuren.length], rr = rnd(14, 60), bx = rnd(RAAM.x - 20, RAAM.x + RAAM.w + 20), by = rnd(RAAM.y + RAAM.h * 0.35, RAAM.y + RAAM.h);
        var bg = x.createRadialGradient(bx, by, 0, bx, by, rr);
        bg.addColorStop(0, "rgba(" + c + "," + rnd(0.18, 0.4) + ")"); bg.addColorStop(0.75, "rgba(" + c + "," + rnd(0.08, 0.15) + ")"); bg.addColorStop(1, "rgba(" + c + ",0)");
        x.fillStyle = bg; x.beginPath(); x.arc(bx, by, rr, 0, Math.PI * 2); x.fill();
      }
      x.restore();
    };
    this.voorgrond = function (x) {
      /* Kozijn */
      x.fillStyle = "#1a120c";
      x.fillRect(RAAM.x - 26, RAAM.y - 26, RAAM.w + 52, 26); x.fillRect(RAAM.x - 26, RAAM.y + RAAM.h, RAAM.w + 52, 20);
      x.fillRect(RAAM.x - 26, RAAM.y - 26, 26, RAAM.h + 46); x.fillRect(RAAM.x + RAAM.w, RAAM.y - 26, 26, RAAM.h + 46);
      x.fillRect(RAAM.x + RAAM.w / 2 - 11, RAAM.y, 22, RAAM.h); x.fillRect(RAAM.x, RAAM.y + RAAM.h * 0.42 - 11, RAAM.w, 22);
      /* Licht van de lamp op de randen van het kozijn */
      var g = x.createLinearGradient(RAAM.x - 26, 0, RAAM.x + 120, 0); g.addColorStop(0, "rgba(255,190,120,.35)"); g.addColorStop(1, "rgba(255,190,120,0)");
      x.fillStyle = g; x.fillRect(RAAM.x - 26, RAAM.y - 26, 150, RAAM.h + 46);
      /* Tafelblad */
      g = x.createLinearGradient(0, 880, 0, 1000); g.addColorStop(0, "#5a3a22"); g.addColorStop(0.08, "#3d2716"); g.addColorStop(1, "#1a110b");
      x.fillStyle = g; x.fillRect(-1500, 880, VW + 3000, 140);
      g = x.createLinearGradient(0, 1020, 0, VH); g.addColorStop(0, "#120c08"); g.addColorStop(1, "#070505");
      x.fillStyle = g; x.fillRect(-1500, 1020, VW + 3000, VH - 1020 + 300);
      x.fillStyle = "#24170e"; x.fillRect(-1500, 1012, VW + 3000, 10);
      /* Houtnerf */
      for (var n = 0; n < 26; n++) { x.strokeStyle = "rgba(20,10,4," + rnd(0.12, 0.3) + ")"; x.lineWidth = rnd(1, 2.5); var ny = rnd(886, 1008);
        x.beginPath(); x.moveTo(-1500, ny); for (var nx = -1500; nx <= VW + 1500; nx += 50) x.lineTo(nx, ny + Math.sin(nx * 0.01 + n) * 3); x.stroke(); }
      /* Stapel boeken */
      var boeken = [["#7d2a24", 560, 70], ["#25395a", 540, 54], ["#3c5a3a", 580, 62], ["#8a6a24", 520, 46]], yb = 880;
      boeken.forEach(function (b, i) {
        var bx = 400 + i * 6 - (i % 2) * 14, bh = b[2]; yb -= bh;
        var bg = x.createLinearGradient(bx, 0, bx + b[1], 0); bg.addColorStop(0, b[0]); bg.addColorStop(1, "#0d0908");
        x.fillStyle = bg; x.fillRect(bx, yb, b[1] * 0.5, bh - 3);
        x.fillStyle = "rgba(240,225,195,.55)"; x.fillRect(bx + b[1] * 0.5, yb + 4, 6, bh - 11);
        x.fillStyle = "rgba(255,220,170,.25)"; x.fillRect(bx, yb, b[1] * 0.5, 3);
        /* Rug met goudkleurige banden en een titel */
        x.fillStyle = "rgba(225,185,110,.55)"; x.fillRect(bx + 18, yb + 3, 3, bh - 9); x.fillRect(bx + b[1] * 0.5 - 24, yb + 3, 3, bh - 9);
        x.fillStyle = "rgba(235,215,170,.35)"; x.fillRect(bx + 40, yb + bh / 2 - 4, b[1] * 0.5 - 90, 6);
        /* Bladzijden aan de zijkant */
        x.strokeStyle = "rgba(120,100,70,.5)"; x.lineWidth = 1; for (var pl = 6; pl < bh - 9; pl += 4) { x.beginPath(); x.moveTo(bx + b[1] * 0.5, yb + pl); x.lineTo(bx + b[1] * 0.5 + 6, yb + pl); x.stroke(); }
      });
      /* Mok */
      var mg = x.createLinearGradient(700, 0, 790, 0); mg.addColorStop(0, "#c9c2b6"); mg.addColorStop(1, "#4a4640");
      x.fillStyle = mg; x.beginPath(); x.roundRect(700, 780, 90, 102, [6, 6, 16, 16]); x.fill();
      x.strokeStyle = "#6a655d"; x.lineWidth = 12; x.beginPath(); x.arc(792, 830, 26, -1.2, 1.2); x.stroke();
      x.fillStyle = "#3a2416"; x.beginPath(); x.ellipse(745, 782, 44, 9, 0, 0, Math.PI * 2); x.fill();
      /* Lamp: voet en stang */
      var vg = x.createLinearGradient(LX - 70, 0, LX + 70, 0); vg.addColorStop(0, "#d9a95a"); vg.addColorStop(0.5, "#8a6428"); vg.addColorStop(1, "#3a2a12");
      x.fillStyle = vg; x.beginPath(); x.ellipse(LX, 872, 85, 16, 0, 0, Math.PI * 2); x.fill();
      x.fillRect(LX - 8, LY + 60, 16, 812 - LY);
    };
    this.teken = function (x, t, dt, f) {
      var lf = 0.97 + 0.03 * Math.sin(t * 0.8);
      /* Regen buiten */
      x.save(); x.beginPath(); x.rect(RAAM.x, RAAM.y, RAAM.w, RAAM.h); x.clip();
      x.strokeStyle = "rgba(170,195,235,.13)"; x.lineWidth = 1.4; x.beginPath();
      STREEP.forEach(function (s) { s.y += s.s * dt; if (s.y > RAAM.y + RAAM.h) { s.y = RAAM.y - s.l; s.x = rnd(RAAM.x, RAAM.x + RAAM.w); } x.moveTo(s.x, s.y); x.lineTo(s.x - 3, s.y + s.l); });
      x.stroke();
      /* Druppels op het glas */
      function drup(px, py, r) {
        x.fillStyle = "rgba(10,14,24,.55)"; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
        x.fillStyle = "rgba(200,215,240,.22)"; x.beginPath(); x.arc(px, py + r * 0.35, r * 0.7, 0, Math.PI); x.fill();
        x.fillStyle = "rgba(255,255,255,.75)"; x.beginPath(); x.arc(px - r * 0.35, py - r * 0.4, Math.max(0.6, r * 0.22), 0, Math.PI * 2); x.fill();
      }
      DRUP.forEach(function (d) { drup(d.x, d.y, d.r); });
      GLIJ.forEach(function (d, i) {
        if (d.rust > 0) d.rust -= dt; else { d.v = Math.min(260, d.v + 300 * dt); d.y += d.v * dt; if (Math.random() < dt * 0.8) { d.rust = rnd(0.2, 1.4); d.v = 0; } d.x += Math.sin(t * 3 + i) * 6 * dt; }
        if (!d.y0) d.y0 = d.y;
        x.strokeStyle = "rgba(160,185,225,.12)"; x.lineWidth = d.r * 0.7; x.beginPath(); x.moveTo(d.x, Math.max(RAAM.y, d.y - 140)); x.lineTo(d.x, d.y); x.stroke();
        drup(d.x, d.y, d.r);
        if (d.y > RAAM.y + RAAM.h + 20) GLIJ[i] = nieuwGlij(false);
      });
      x.restore();
    };
    this.licht = function (x, t, dt) {
      var lf = 0.97 + 0.03 * Math.sin(t * 0.8);
      /* Warm licht in de kamer */
      x.globalCompositeOperation = "lighter";
      var g = x.createRadialGradient(LX, LY + 30, 10, LX, LY + 30, 720);
      g.addColorStop(0, "rgba(255,190,110," + 0.5 * lf + ")"); g.addColorStop(0.3, "rgba(255,150,70," + 0.18 * lf + ")"); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.fillRect(-1500, -300, VW + 3000, VH + 600);
      /* Lichtplas op het tafelblad */
      x.save(); x.scale(1, 0.18); g = x.createRadialGradient(LX + 60, 890 / 0.18, 0, LX + 60, 890 / 0.18, 420);
      g.addColorStop(0, "rgba(255,200,130,.5)"); g.addColorStop(1, "rgba(255,200,130,0)"); x.fillStyle = g; x.fillRect(-1500, 700 / 0.18, VW + 3000, 400 / 0.18); x.restore();
      /* Spiegeling van de lamp in het raam en op het gelakte tafelblad */
      x.save(); x.beginPath(); x.rect(RAAM.x, RAAM.y, RAAM.w / 2 - 11, RAAM.h * 0.42 - 11); x.rect(RAAM.x, RAAM.y + RAAM.h * 0.42 + 11, RAAM.w / 2 - 11, RAAM.h * 0.58 - 11); x.clip();
      var sp = x.createRadialGradient(RAAM.x + 150, LY - 10, 0, RAAM.x + 150, LY - 10, 120);
      sp.addColorStop(0, "rgba(255,200,130,.22)"); sp.addColorStop(1, "rgba(255,200,130,0)"); x.fillStyle = sp; x.fillRect(RAAM.x, RAAM.y, RAAM.w, RAAM.h); x.restore();
      x.save(); x.scale(1, 2.2); var tg = x.createRadialGradient(LX, 930 / 2.2, 0, LX, 930 / 2.2, 70);
      tg.addColorStop(0, "rgba(255,210,150,.35)"); tg.addColorStop(1, "rgba(255,210,150,0)"); x.fillStyle = tg; x.fillRect(LX - 80, 880 / 2.2, 160, 130 / 2.2); x.restore();
      x.globalCompositeOperation = "source-over";
      /* Kap van stof, van binnen verlicht */
      var kg = x.createLinearGradient(0, LY - 110, 0, LY + 70);
      kg.addColorStop(0, "#a8682e"); kg.addColorStop(0.6, "#f0b367"); kg.addColorStop(1, "#ffe0a8");
      x.fillStyle = kg; x.beginPath(); x.moveTo(LX - 80, LY - 110); x.lineTo(LX + 80, LY - 110); x.lineTo(LX + 135, LY + 70); x.lineTo(LX - 135, LY + 70); x.closePath(); x.fill();
      x.strokeStyle = "rgba(90,50,20,.18)"; x.lineWidth = 2;
      for (var s = -6; s <= 6; s++) { x.beginPath(); x.moveTo(LX + s * 13, LY - 110); x.lineTo(LX + s * 22, LY + 70); x.stroke(); }
      x.fillStyle = "rgba(255,240,210,.9)"; x.beginPath(); x.ellipse(LX, LY + 70, 135, 14, 0, 0, Math.PI * 2); x.fill();
      x.globalCompositeOperation = "lighter"; x.globalAlpha = 0.55 * lf; x.drawImage(WARM, LX - 260, LY - 200, 520, 460); x.globalAlpha = 1;
      /* Stofjes in het licht */
      STOF.forEach(function (d) {
        d.y -= d.s * 8 * dt; d.x += Math.sin(t * d.s + d.z) * 6 * dt; if (d.y < 600) { d.y = 900; d.x = rnd(80, 400); }
        x.globalAlpha = 0.35 + 0.35 * Math.sin(t * 0.9 + d.z); x.drawImage(WARM, d.x - d.r * 3, d.y - d.r * 3, d.r * 6, d.r * 6);
      });
      x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
      /* Damp uit de mok */
      if (Math.random() < dt * 2.4) DAMP.push({ x: 745 + rnd(-20, 20), y: 770, a: 0, l: rnd(3, 4.5), z: rnd(0, 6) });
      for (var i = DAMP.length - 1; i >= 0; i--) {
        var p = DAMP[i]; p.a += dt / p.l; if (p.a >= 1) { DAMP.splice(i, 1); continue; }
        p.y -= 34 * dt; p.x += Math.sin(t * 1.4 + p.z) * 14 * dt; var r = 14 + p.a * 40;
        x.globalAlpha = 0.16 * Math.sin(p.a * Math.PI); x.drawImage(WIT, p.x - r, p.y - r, r * 2, r * 2);
      }
      x.globalAlpha = 1;
    };
  }

  function start(cv, soort, plek, hoogte) {
    plek = plek || [0.5, 0.5];
    var x = cv.getContext("2d"), sc = soort === "vuur" ? new Vuur() : new Lamp();
    var achter = null, voor = null, vignet = null, w = 0, h = 0, dpr = 1, s = 1, ox = 0, oy = 0, vorige = 0, t = rnd(0, 50), loopt = true, id = 0, zicht = true;
    /* Kwaliteit past zich aan het apparaat aan: is tekenen traag (oude iPad, zwakke digibordcomputer),
       dan tekenen we op een lagere resolutie. Het beeld blijft vullend, de beweging blijft vloeiend. */
    var kwal = 1, gem = 0, metingen = 0;
    var stil = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function maat() {
      w = cv.clientWidth; h = cv.clientHeight; if (!w || !h) return false;
      dpr = Math.min(2, window.devicePixelRatio || 1) * kwal;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      /* Met 'hoogte' kiezen we zelf hoeveel van de scène in beeld komt (breed digibord); anders vullend */
      if (hoogte) { s = h / hoogte; ox = w * plek[0] - sc.focus[0] * s; oy = h * plek[1] - sc.focus[1] * s; }
      else {
        s = Math.max(w / VW, h / VH);
        ox = Math.min(0, Math.max(w - VW * s, w * plek[0] - sc.focus[0] * s));
        oy = Math.min(0, Math.max(h - VH * s, h * plek[1] - sc.focus[1] * s));
      }
      achter = maakDoek(cv.width, cv.height); var a = achter.getContext("2d");
      a.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy); sc.achtergrond(a);
      if (sc.voorgrond) { voor = maakDoek(cv.width, cv.height); var v = voor.getContext("2d"); v.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy); sc.voorgrond(v); }
      /* Vignet één keer klaarzetten in plaats van elk beeld opnieuw */
      vignet = maakDoek(cv.width, cv.height); var vc = vignet.getContext("2d");
      var g = vc.createRadialGradient(cv.width / 2, cv.height / 2, Math.min(cv.width, cv.height) * 0.3, cv.width / 2, cv.height / 2, Math.max(cv.width, cv.height) * 0.75);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.55)"); vc.fillStyle = g; vc.fillRect(0, 0, cv.width, cv.height);
      return true;
    }
    function frame(nu) {
      if (!loopt) return;
      id = requestAnimationFrame(frame);
      if (!zicht || document.hidden) { vorige = nu; return; }
      if (nu - vorige < 30 && vorige) return; /* rond 30 beelden per seconde: rustig voor de iPad */
      var tussen = vorige ? nu - vorige : 33;
      var dt = Math.min(0.1, tussen / 1000); vorige = nu; t += dt;
      if (cv.clientWidth !== w || cv.clientHeight !== h) { if (!maat()) return; }
      var f = flakker(t);
      x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(achter, 0, 0);
      x.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      sc.teken(x, t, dt, f);
      if (voor) { x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(voor, 0, 0); x.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy); }
      if (sc.licht) sc.licht(x, t, dt);
      /* Vignet en filmkorrel maken het echter */
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.drawImage(vignet, 0, 0);
      if (kwal === 1) { /* filmkorrel alleen op volle kwaliteit: 'overlay' is duur */
        x.globalAlpha = 0.045; x.globalCompositeOperation = "overlay";
        var kx = -Math.random() * 200, ky = -Math.random() * 200;
        for (var px = kx; px < cv.width; px += 200) for (var py = ky; py < cv.height; py += 200) x.drawImage(KORREL, px, py);
        x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
      }
      /* Tijd tussen de beelden bijhouden (daar zit ook het echte schilderen in). Haalt het apparaat
         nog geen 20 beelden per seconde, dan een stapje lagere resolutie, hooguit tot de helft. */
      metingen++;
      gem = metingen === 1 ? tussen : gem * 0.8 + tussen * 0.2;
      if (metingen > 10 && gem > 50 && kwal > 0.5) { kwal = Math.max(0.5, kwal - 0.25); metingen = 0; maat(); }
      if (stil) { loopt = false; cancelAnimationFrame(id); }
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { zicht = e[0].isIntersecting; }).observe(cv);
    id = requestAnimationFrame(frame);
    if (stil) { /* Bij 'minder beweging': een paar beelden vooruit en dan stilstaand */ }
    return function () { loopt = false; cancelAnimationFrame(id); };
  }
  window.Sfeer = { start: start };
})();
