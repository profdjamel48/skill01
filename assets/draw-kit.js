/* ===== DRAWKIT:BEGIN (v2) — مكتبة الرسم المتجهية الموحدة =====
   كل جهاز: Kit.<name>(g, x, y, s, opts)
   - (x, y) = نقطة الإمساك/الاستقرار (انظر الجدول في drawing-standards.md)
   - s = مقياس (استخدم U من القالب)
   - الضوء من أعلى اليسار دائماً. لا تعدّل الألوان خارج Kit.pal.
   ES5 فقط. يحتاج ctx.roundRect (polyfill موجود في القالب).               */
var Kit = (function () {
  var K = {}, TAU = Math.PI * 2;
  K.pal = { ink: '#1f2f3d', acc: '#2f6f8f', warm: '#b8503a', ok: '#27ae60',
            ivory: [236, 238, 235], graphite: [48, 60, 70], steel: [168, 178, 186],
            glassEdge: 'rgba(104,140,160,.95)' };

  /* ───── أدوات اللون ───── */
  function c255(v) { return Math.max(0, Math.min(255, Math.round(v))); }
  function shade(c, k) { return [c255(c[0] * k), c255(c[1] * k), c255(c[2] * k)]; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function lg(g, x0, y0, x1, y1, stops) {
    var gr = g.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    return gr;
  }
  K.shade = shade; K.rgba = rgba;

  /* ───── ظل التماس: يثبّت الجهاز على الطاولة ───── */
  K.contactShadow = function (g, x, y, w, a) {
    g.save(); g.translate(x, y); g.scale(1, 0.2);
    var r = g.createRadialGradient(0, 0, 0, 0, 0, w / 2);
    r.addColorStop(0, 'rgba(31,47,61,' + (a || 0.3) + ')'); r.addColorStop(0.6, 'rgba(31,47,61,' + (a || 0.3) * 0.4 + ')');
    r.addColorStop(1, 'rgba(31,47,61,0)');
    g.fillStyle = r; g.beginPath(); g.arc(0, 0, w / 2, 0, TAU); g.fill(); g.restore();
  };

  /* ───── جزء معتم (معدن/بلاستيك) بتدرج أسطواني ───── */
  K.part = function (g, x, y, w, h, r, base, horizontalLight) {
    var vertical = horizontalLight === false;
    var gr = vertical
      ? lg(g, x, y, x, y + h, [[0, rgba(shade(base, 1.12), 1)], [0.25, rgba(shade(base, 1.04), 1)], [0.7, rgba(shade(base, 0.82), 1)], [1, rgba(shade(base, 0.62), 1)]])
      : lg(g, x, y, x + w, y, [[0, rgba(shade(base, 0.72), 1)], [0.18, rgba(shade(base, 1.14), 1)], [0.42, rgba(shade(base, 1.02), 1)], [0.8, rgba(shade(base, 0.8), 1)], [1, rgba(shade(base, 0.6), 1)]]);
    g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
    g.lineWidth = 1; g.strokeStyle = rgba(shade(base, 0.42), 0.75); g.stroke();
    if (h > 8 && w > 8) {                       // لمعة علوية دقيقة
      g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath();
      g.roundRect(x + 1.5, y + 1, w - 3, Math.min(3, h * 0.2), 1.5); g.fill();
    }
  };

  /* ───── زجاج: pathFn يبني المسار، وshine يحدد اتجاه اللمعة ───── */
  K.glass = function (g, pathFn, x, y, w, h, opts) {
    opts = opts || {};
    pathFn(g);
    g.fillStyle = lg(g, x, 0, x + w, 0, [[0, 'rgba(176,206,224,.50)'], [0.10, 'rgba(255,255,255,.60)'], [0.28, 'rgba(226,241,250,.16)'],
      [0.7, 'rgba(206,228,240,.10)'], [0.9, 'rgba(176,208,226,.34)'], [1, 'rgba(130,168,192,.55)']]);
    g.fill();
    g.lineWidth = 1.5; g.strokeStyle = K.pal.glassEdge; g.stroke();
    var shine = opts.shine || (w > h * 1.6 ? 'ellipse' : 'vertical');
    g.save(); pathFn(g); g.clip(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,.75)';
    if (shine === 'flask') {
      g.lineWidth = Math.max(1.2, Math.min(3.2, w * 0.027));
      g.beginPath();
      g.moveTo(x + w * 0.37, y + h * 0.09);
      g.lineTo(x + w * 0.37, y + h * 0.33);
      g.lineTo(x + w * 0.12, y + h * 0.78);
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = Math.max(0.8, Math.min(1.6, w * 0.014));
      g.beginPath();
      g.moveTo(x + w * 0.65, y + h * 0.12);
      g.lineTo(x + w * 0.65, y + h * 0.33);
      g.lineTo(x + w * 0.88, y + h * 0.73);
      g.stroke();
    }
    if (shine === 'ellipse') {
      g.lineWidth = Math.max(0.8, Math.min(3, h * 0.07));
      g.beginPath(); g.ellipse(x + w * 0.5, y + h * 0.66, w * 0.39, h * 0.26, 0, Math.PI * 1.12, Math.PI * 1.48); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = Math.max(0.7, Math.min(1.8, h * 0.04));
      g.beginPath(); g.ellipse(x + w * 0.5, y + h * 0.66, w * 0.44, h * 0.3, 0, Math.PI * 1.62, Math.PI * 1.82); g.stroke();
    } else if (shine === 'horizontal') {
      g.lineWidth = Math.max(0.8, Math.min(2.4, h * 0.16));
      g.beginPath(); g.moveTo(x + w * 0.14, y + h * 0.28); g.lineTo(x + w * 0.72, y + h * 0.28); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = Math.max(0.6, Math.min(1.4, h * 0.09));
      g.beginPath(); g.moveTo(x + w * 0.34, y + h * 0.72); g.lineTo(x + w * 0.86, y + h * 0.72); g.stroke();
    } else if (shine === 'diagonal') {
      g.lineWidth = Math.max(0.8, Math.min(2.5, w * 0.035));
      g.beginPath(); g.moveTo(x + w * 0.18, y + h * 0.08); g.quadraticCurveTo(x + w * 0.36, y + h * 0.32, x + w * 0.48, y + h * 0.5); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = Math.max(0.6, Math.min(1.5, w * 0.02));
      g.beginPath(); g.moveTo(x + w * 0.84, y + h * 0.12); g.quadraticCurveTo(x + w * 0.66, y + h * 0.35, x + w * 0.52, y + h * 0.5); g.stroke();
    } else if (shine === 'vertical') {
      g.lineWidth = Math.max(0.7, Math.min(3, w * 0.045));
      g.beginPath(); g.moveTo(x + w * 0.17, y + h * 0.12); g.lineTo(x + w * 0.17, y + h * 0.7); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = Math.max(0.6, Math.min(1.8, w * 0.02));
      g.beginPath(); g.moveTo(x + w * 0.84, y + h * 0.2); g.lineTo(x + w * 0.84, y + h * 0.62); g.stroke();
    }
    g.restore();
  };

  /* ───── سائل داخل مسار (قص): أفتح في الوسط، أغمق عند الجدار، سطح بيضاوي + تقوّس ───── */
  K.liquid = function (g, pathFn, cx, w, topY, botY, color, surfRy) {
    var ry = surfRy === undefined ? 3.2 : surfRy;
    g.save(); pathFn(g); g.clip();
    g.fillStyle = lg(g, cx - w / 2, 0, cx + w / 2, 0, [[0, rgba(shade(color, 0.7), 0.92)], [0.25, rgba(shade(color, 1.1), 0.82)],
      [0.5, rgba(shade(color, 1.18), 0.76)], [0.8, rgba(shade(color, 0.92), 0.84)], [1, rgba(shade(color, 0.62), 0.94)]]);
    g.fillRect(cx - w / 2 - 2, topY, w + 4, botY - topY + 2);
    g.fillStyle = lg(g, 0, topY, 0, botY, [[0, 'rgba(255,255,255,.10)'], [1, 'rgba(0,0,0,.16)']]);   // تعتيم القاع
    g.fillRect(cx - w / 2 - 2, topY, w + 4, botY - topY + 2);
    g.fillStyle = rgba(shade(color, 1.3), 0.55);                                                    // السطح (Meniscus)
    g.beginPath(); g.ellipse(cx, topY, w / 2 - 1, ry, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(cx, topY, w / 2 - 1.5, ry, 0, Math.PI * 0.05, Math.PI * 0.95); g.stroke();
    g.restore();
  };

  /* ═════════ الأدوات الزجاجية ═════════ */
  // origin = منتصف القاعدة على الطاولة. opts: level 0..1, color [r,g,b], marks
  K.beaker = function (g, cx, by, s, o) {
    o = o || {}; var w = 112, h = 134, x = -w / 2, y = -h, r = 12, color = o.color || [78, 150, 205];
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 1, w * 1.05, 0.32);
    function path(g2) { g2.beginPath(); g2.moveTo(x, y); g2.lineTo(x, y + h - r); g2.arcTo(x, y + h, x + r, y + h, r);
      g2.lineTo(x + w - r, y + h); g2.arcTo(x + w, y + h, x + w, y + h - r, r); g2.lineTo(x + w, y); }
    g.fillStyle = 'rgba(210,228,240,.18)'; g.beginPath(); g.ellipse(0, y, w / 2, 5, 0, 0, TAU); g.fill();    // فتحة خلفية
    if (o.level > 0) K.liquid(g, path, 0, w - 4, y + h - (h - 14) * o.level, y + h, color, 4);
    K.glass(g, path, x, y, w, h);
    g.strokeStyle = K.pal.glassEdge; g.lineWidth = 1.8; g.beginPath(); g.ellipse(0, y, w / 2, 5, 0, 0, TAU); g.stroke();
    if (o.marks !== false) {                                                                                  // تدريج
      g.strokeStyle = 'rgba(31,47,61,.6)'; g.lineWidth = 1.2;
      for (var i = 1; i <= 5; i++) { var ty = y + h - 12 - i * ((h - 34) / 5), long_ = (i % 2 === 1);
        g.beginPath(); g.moveTo(x + w - 3, ty); g.lineTo(x + w - (long_ ? 24 : 15), ty); g.stroke(); }
    }
    g.restore();
  };

  // origin = منتصف القاعدة (الأنبوب واقف في حامل). opts: level, color, cap(bool)
  K.testTube = function (g, cx, by, s, o) {
    o = o || {}; var w = 28, h = 150, x = -w / 2, y = -h, r = w / 2, color = o.color || [200, 70, 70];
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 1, w * 1.6, 0.25);
    function path(g2) { g2.beginPath(); g2.moveTo(x, y); g2.lineTo(x, y + h - r); g2.arc(0, y + h - r, r, Math.PI, 0, true); g2.lineTo(x + w, y); }
    if (o.level > 0) K.liquid(g, path, 0, w - 2, y + h - (h - 30) * o.level, y + h, color, 2.4);
    K.glass(g, path, x, y, w, h);
    g.strokeStyle = K.pal.glassEdge; g.lineWidth = 2.2; g.beginPath(); g.ellipse(0, y, w / 2 + 1.5, 3, 0, 0, TAU); g.stroke();   // حلقة الفوهة
    if (o.cap) { K.part(g, x - 2, y - 14, w + 4, 16, 4, o.capColor || [47, 111, 143]);
      g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1; for (var i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x - 1 + i * (w + 2) / 5, y - 12); g.lineTo(x - 1 + i * (w + 2) / 5, y - 1); g.stroke(); } }
    g.restore();
  };

  // دورق إرلنماير. origin = منتصف القاعدة
  K.flask = function (g, cx, by, s, o) {
    o = o || {}; var bw = 128, nw = 38, h = 168, nh = 56, color = o.color || [92, 180, 140];
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 1, bw * 1.05, 0.3);
    function path(g2) { g2.beginPath(); g2.moveTo(-nw / 2, -h); g2.lineTo(-nw / 2, -h + nh); g2.lineTo(-bw / 2, -9); g2.quadraticCurveTo(-bw / 2, 0, -bw / 2 + 11, 0);
      g2.lineTo(bw / 2 - 11, 0); g2.quadraticCurveTo(bw / 2, 0, bw / 2, -9); g2.lineTo(nw / 2, -h + nh); g2.lineTo(nw / 2, -h); }
    if (o.level > 0) K.liquid(g, path, 0, bw, -(h - nh - 4) * o.level * 0.8 - 6, 0, color, 5);
    K.glass(g, path, -bw / 2, -h, bw, h, { shine: 'flask' });
    g.strokeStyle = K.pal.glassEdge; g.lineWidth = 2.2; g.beginPath(); g.ellipse(0, -h, nw / 2 + 3, 3.4, 0, 0, TAU); g.stroke();
    g.restore();
  };

  /* ═════════ الماصات ═════════ */
  // ميكروماصة. origin = طرف الرأس السفلي (نقطة الإمساك). opts: vol '100', tip(bool), liquid [r,g,b] , fill 0..1
  K.micropipette = function (g, x, y, s, o) {
    o = o || {}; g.save(); g.translate(x, y); g.scale(s, s);
    var tipLen = 64;
    if (o.tip !== false) {                                              // الرأس الشفاف المعقم
      g.beginPath(); g.moveTo(-1.6, 0); g.lineTo(-5.6, -tipLen); g.lineTo(5.6, -tipLen); g.lineTo(1.6, 0); g.closePath();
      g.fillStyle = 'rgba(232,242,248,.62)'; g.fill(); g.strokeStyle = 'rgba(120,150,168,.9)'; g.lineWidth = 1; g.stroke();
      if (o.liquid && o.fill > 0) { var fh = (tipLen - 8) * o.fill; g.save(); g.beginPath(); g.moveTo(-1.6, 0); g.lineTo(-5.6, -tipLen); g.lineTo(5.6, -tipLen); g.lineTo(1.6, 0); g.closePath(); g.clip();
        g.fillStyle = rgba(o.liquid, 0.85); g.fillRect(-7, -fh, 14, fh); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(0, -fh, 4.4, 1.2, 0, 0, TAU); g.fill(); g.restore(); }
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-3, -6); g.lineTo(-4.3, -tipLen + 4); g.stroke();
    }
    K.part(g, -6.5, -tipLen - 44, 13, 46, 3, K.pal.steel);              // الساق المعدنية
    K.part(g, -9, -tipLen - 50, 18, 9, 3, [208, 214, 220]);             // طوق الرأس
    var bodyTop = -tipLen - 168, bodyH = 120;                           // المقبض
    g.beginPath(); g.moveTo(-14, bodyTop + bodyH); g.lineTo(-17, bodyTop + 26); g.quadraticCurveTo(-17, bodyTop, 0, bodyTop); g.quadraticCurveTo(17, bodyTop, 17, bodyTop + 26);
    g.lineTo(14, bodyTop + bodyH); g.quadraticCurveTo(0, bodyTop + bodyH + 8, -14, bodyTop + bodyH); g.closePath();
    g.fillStyle = lg(g, -17, 0, 17, 0, [[0, '#cfd6dc'], [0.2, '#ffffff'], [0.55, '#eef1f4'], [1, '#b9c2ca']]); g.fill();
    g.strokeStyle = 'rgba(60,80,95,.55)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = K.pal.acc; g.beginPath(); g.roundRect(-17, bodyTop + 14, 34, 9, 2); g.fill();            // شريط لون التمييز
    g.fillStyle = '#1c262e'; g.beginPath(); g.roundRect(-11, bodyTop + 34, 22, 28, 3); g.fill();             // شاشة الحجم
    g.fillStyle = '#9fe3b5'; g.font = 'bold 12px monospace'; g.textAlign = 'center'; g.fillText(o.vol || '100', 0, bodyTop + 53);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-11, bodyTop + 34, 22, 6);
    K.part(g, -9, bodyTop - 26, 18, 28, 5, [30, 90, 120]);                                                   // زر المكبس
    K.part(g, -12, bodyTop - 4, 24, 7, 3, [60, 70, 80]);                                                     // طوق الزر
    K.part(g, 14, bodyTop + 70, 8, 30, 3, [150, 160, 170]);                                                  // زر القذف
    g.restore();
  };

  // قطّارة زجاجية (Pasteur). origin = طرف القطّارة. opts: liquid [r,g,b], fill 0..1
  K.dropper = function (g, x, y, s, o) {
    o = o || {}; g.save(); g.translate(x, y); g.scale(s, s);
    function tube(g2) { g2.beginPath(); g2.moveTo(-1.2, 0); g2.lineTo(-4.5, -26); g2.lineTo(-4.5, -122); g2.lineTo(4.5, -122); g2.lineTo(4.5, -26); g2.lineTo(1.2, 0); g2.closePath(); }
    if (o.liquid && o.fill > 0) K.liquid(g, tube, 0, 9, -122 * 0.9 * o.fill - 4, 0, o.liquid, 1.3);
    K.glass(g, tube, -4.5, -122, 9, 122);
    K.part(g, -6.5, -132, 13, 12, 3, [220, 224, 228]);                                                       // طوق
    var gr = g.createRadialGradient(-6, -158, 2, 0, -156, 26);                                               // الكُرة المطاطية
    gr.addColorStop(0, '#d9795d'); gr.addColorStop(0.55, '#b8503a'); gr.addColorStop(1, '#7a2f20');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-9, -131); g.bezierCurveTo(-18, -150, -14, -186, 0, -190); g.bezierCurveTo(14, -186, 18, -150, 9, -131); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(70,25,15,.6)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(-6, -160, 2.6, 13, 0.1, 0, TAU); g.fill();
    g.restore();
  };

  // ساق تحريك زجاجية. origin = الطرف السفلي
  K.stirrer = function (g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    function rod(g2) { g2.beginPath(); g2.roundRect(-3.6, -150, 7.2, 150, 3.6); }
    rod(g); g.fillStyle = lg(g, -3.6, 0, 3.6, 0, [[0, 'rgba(150,185,205,.75)'], [0.3, 'rgba(240,248,252,.85)'], [1, 'rgba(110,150,175,.8)']]); g.fill();
    K.glass(g, rod, -3.6, -150, 7.2, 150);
    g.restore();
  };

  /* ═════════ شريحة مجهرية. origin = مركز الشريحة ═════════ */
  K.slide = function (g, cx, cy, s, o) {
    o = o || {}; g.save(); g.translate(cx, cy); g.scale(s, s);
    function sl(g2) { g2.beginPath(); g2.roundRect(-38, -6, 76, 12, 1.5); }
    K.glass(g, sl, -38, -6, 76, 12, { shine: 'horizontal' });
    g.fillStyle = 'rgba(245,242,230,.95)'; g.beginPath(); g.roundRect(-36, -4.5, 17, 9, 1); g.fill();       // ملصق
    g.fillStyle = 'rgba(31,47,61,.55)'; g.fillRect(-34, -1.6, 12, 1); g.fillRect(-34, 1, 8, 1);
    if (o.specimen) { g.fillStyle = o.specimen; g.beginPath(); g.ellipse(6, 0, 8, 3.6, 0, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.roundRect(-4, -4, 20, 8, 1); g.fill();          // الساترة
    g.strokeStyle = 'rgba(120,150,168,.7)'; g.lineWidth = 0.8; g.stroke();
    g.restore();
  };

  /* ═════════ المجهر الضوئي المركّب (منظر جانبي) =====================
     origin = منتصف القاعدة على الطاولة. الارتفاع الكلي ≈ 350 وحدة، العرض ≈ 215.
     opts: obj 0|1|2 (4x/10x/40x), focus 0..1, lamp bool, slide bool, specimen 'rgba(...)'  */
  var OBJ_RING = [[200, 60, 50], [230, 190, 40], [50, 100, 200]], OBJ_LEN = [26, 32, 40];
  function objective(g, cx, top, i, k) {
    var len = OBJ_LEN[i] - (k < 1 ? 4 : 0), base = shade([84, 94, 104], k);
    K.part(g, cx - 9, top, 18, len * 0.5, 2, base);
    K.part(g, cx - 6.2, top + len * 0.5 - 1, 12.4, len * 0.5 + 1, 2, shade([120, 130, 140], k));
    K.part(g, cx - 9, top + len * 0.22, 18, 4.5, 1, shade(OBJ_RING[i], k));
    g.fillStyle = '#10161b'; g.beginPath(); g.ellipse(cx, top + len + 0.5, 4.6, 1.8, 0, 0, TAU); g.fill();
  }
  K.microscope = function (g, cx, by, s, o) {
    o = o || {}; var ob = o.obj || 0, f = o.focus === undefined ? 0.5 : o.focus, ivory = K.pal.ivory, gr = K.pal.graphite;
    var AX = 0, sy = -150 - f * 40;                                                     // محور بصري، ارتفاع المنصة
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 2, 250, 0.34);

    if (o.lamp) {                                                                         // توهج المصباح (خلف الجهاز)
      var gl = g.createRadialGradient(AX, -78, 2, AX, -78, 78);
      gl.addColorStop(0, 'rgba(255,238,170,.42)'); gl.addColorStop(1, 'rgba(255,238,170,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(AX, -78, 78, 0, TAU); g.fill();
    }
    // الذراع المنحني: أكثر اتساعاً واستقراراً مع بُعد واضح بين الجذع والمنصة.
    g.beginPath(); g.moveTo(18, -18); g.lineTo(94, -18); g.bezierCurveTo(118, -102, 112, -214, 82, -286);
    g.lineTo(24, -290); g.bezierCurveTo(62, -228, 68, -112, 18, -18); g.closePath();
    g.fillStyle = lg(g, 22, 0, 116, 0, [[0, rgba(shade(ivory, 0.78), 1)], [0.25, rgba(shade(ivory, 1.04), 1)], [0.6, rgba(shade(ivory, 0.92), 1)], [1, rgba(shade(ivory, 0.6), 1)]]);
    g.fill(); g.strokeStyle = rgba(shade(ivory, 0.4), 0.8); g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(42, -62); g.bezierCurveTo(66, -128, 74, -210, 48, -278); g.stroke();

    // أنبوب العينية المائل (خلف كتلة الرأس)
    g.save(); g.translate(-22, -292); g.rotate(-0.52);
    K.part(g, -13, -66, 26, 70, 5, gr);
    K.part(g, -10, -90, 20, 28, 4, shade(gr, 0.62));
    K.part(g, -12.5, -96, 25, 8, 3, [18, 22, 26]);
    g.fillStyle = '#0a0e11'; g.beginPath(); g.ellipse(0, -96, 9, 2.4, 0, 0, TAU); g.fill();
    g.restore();
    K.part(g, -60, -308, 126, 48, 11, ivory);                                             // كتلة الرأس
    g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.roundRect(-54, -304, 100, 5, 2.5); g.fill();

    // البرج + العدسات الشيئية
    K.part(g, -66, -262, 72, 14, 5, gr);
    var others = [0, 1, 2].filter(function (i) { return i !== ob; });
    objective(g, AX - 24, -248, others[0], 0.7);
    objective(g, AX + 24, -248, others[1], 0.7);
    objective(g, AX, -248, ob, 1);

    // مصباح وعاكس/مكثّف
    K.part(g, AX - 11, sy + 22, 22, 17, 3, gr);
    K.part(g, AX - 16, -24, 32, 7, 3, [60, 70, 80]);
    var dome = g.createRadialGradient(AX - 3, -30, 1, AX, -26, 16);
    dome.addColorStop(0, o.lamp ? '#fffbe0' : '#dde6ec'); dome.addColorStop(1, o.lamp ? '#f2c84b' : '#8798a4');
    g.fillStyle = dome; g.beginPath(); g.ellipse(AX, -26, 14, 7, 0, Math.PI, 0); g.fill();
    if (o.lamp) { g.fillStyle = 'rgba(255,240,170,.16)'; g.beginPath(); g.moveTo(AX - 14, -30); g.lineTo(AX - 8, sy + 22); g.lineTo(AX + 8, sy + 22); g.lineTo(AX + 14, -30); g.closePath(); g.fill(); }

    // المنصة وآليتها: تكتيك متوازن مع محور المجهر.
    K.part(g, 18, sy - 1, 58, 17, 5, ivory);                                              // كتف المنصة إلى الذراع
    K.part(g, -64, sy + 9, 80, 12, 3, ivory);                                             // آلية المنصة
    K.part(g, -92, sy - 2, 120, 11, 3, [66, 78, 88], false);                              // سطح المنصة
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-90, sy - 1, 116, 1.4);
    if (o.slide) K.slide(g, AX, sy - 8, 1, { specimen: o.specimen });
    K.part(g, -66, sy - 7, 26, 3.4, 1.4, K.pal.steel); K.part(g, 10, sy - 7, 26, 3.4, 1.4, K.pal.steel);   // مشبكا الشريحة

    // القاعدة
    K.part(g, -104, -20, 208, 20, 9, ivory, false);
    K.part(g, -100, -6, 200, 6, 3, shade(gr, 0.9));
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.roundRect(-96, -18, 192, 3, 1.5); g.fill();

    // مقبضا البؤرة (خشن + دقيق) — يدوران مع focus
    var ang = f * 14, kx = 84, ky = -128;
    var kg = g.createRadialGradient(kx - 5, ky - 6, 2, kx, ky, 20);
    kg.addColorStop(0, rgba(shade(gr, 1.9), 1)); kg.addColorStop(1, rgba(shade(gr, 0.7), 1));
    g.fillStyle = kg; g.beginPath(); g.arc(kx, ky, 19, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1.4;
    for (var i = 0; i < 18; i++) { var a = ang + i * TAU / 18; g.beginPath(); g.moveTo(kx + Math.cos(a) * 14.5, ky + Math.sin(a) * 14.5); g.lineTo(kx + Math.cos(a) * 18.4, ky + Math.sin(a) * 18.4); g.stroke(); }
    var fg = g.createRadialGradient(kx - 2, ky - 3, 1, kx, ky, 10);
    fg.addColorStop(0, rgba(shade(ivory, 1.1), 1)); fg.addColorStop(1, rgba(shade(ivory, 0.62), 1));
    g.fillStyle = fg; g.beginPath(); g.arc(kx, ky, 9.5, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.45)'; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx + Math.cos(-ang * 2) * 8, ky + Math.sin(-ang * 2) * 8); g.stroke();
    g.restore();
  };

  /* ═════════════════════════════════════════════════════════════════
     دفعة 1 — زجاجيات وأدوات مخبرية لعلوم الطبيعة والحياة
     كل دالة: origin موثّق في تعليقها وفي drawing-standards.md §3
     ═════════════════════════════════════════════════════════════════ */
  function disc(g2, rx, rY, topY, h) {            // أسطوانة قصيرة بمنظور مائل (طبق بتري، غطاء)
    g2.beginPath(); g2.moveTo(-rx, topY); g2.lineTo(-rx, topY + h); g2.ellipse(0, topY + h, rx, rY, 0, Math.PI, 0, true);
    g2.lineTo(rx, topY); g2.ellipse(0, topY, rx, rY, 0, 0, Math.PI, true); g2.closePath();
  }
  function dropBulb(g, cx, base, h, w) {           // كُرة مطاطية حمراء (قطّارة / ماصة)
    var gr = g.createRadialGradient(cx - w * 0.35, base - h * 0.6, 2, cx, base - h * 0.5, h * 0.7);
    gr.addColorStop(0, '#d9795d'); gr.addColorStop(0.55, '#b8503a'); gr.addColorStop(1, '#7a2f20');
    g.fillStyle = gr; g.beginPath(); g.moveTo(cx - w * 0.5, base); g.bezierCurveTo(cx - w, base - h * 0.35, cx - w * 0.7, base - h * 0.95, cx, base - h);
    g.bezierCurveTo(cx + w * 0.7, base - h * 0.95, cx + w, base - h * 0.35, cx + w * 0.5, base); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(70,25,15,.6)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(cx - w * 0.36, base - h * 0.55, w * 0.13, h * 0.3, 0.1, 0, TAU); g.fill();
  }

  // مخبار مدرّج. origin = منتصف القاعدة. opts: level 0..1, color [r,g,b]
  K.graduatedCylinder = function (g, cx, by, s, o) {
    o = o || {}; var w = 34, h = 190, x = -w / 2, y = -h - 9, color = o.color || [78, 150, 205];
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 1, 80, 0.3);
    function path(g2) { g2.beginPath(); g2.moveTo(x, y); g2.lineTo(x, y + h - 3); g2.arcTo(x, y + h, x + 3, y + h, 3);
      g2.lineTo(x + w - 3, y + h); g2.arcTo(x + w, y + h, x + w, y + h - 3, 3); g2.lineTo(x + w, y); }
    function foot(g2) { g2.beginPath(); g2.moveTo(-14, -9); g2.lineTo(-34, -4); g2.quadraticCurveTo(-37, 0, -30, 0); g2.lineTo(30, 0); g2.quadraticCurveTo(37, 0, 34, -4); g2.lineTo(14, -9); g2.closePath(); }
    K.glass(g, foot, -36, -9, 72, 9);
    if (o.level > 0) K.liquid(g, path, 0, w - 3, y + h - (h - 14) * o.level, y + h, color, 2.2);
    K.glass(g, path, x, y, w, h);
    g.strokeStyle = K.pal.glassEdge; g.lineWidth = 1.6; g.beginPath(); g.ellipse(0, y, w / 2, 3, 0, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(31,47,61,.65)'; g.lineWidth = 1;
    for (var i = 1; i <= 10; i++) { var ty = y + h - 6 - i * ((h - 22) / 10);
      g.beginPath(); g.moveTo(x + w - 2, ty); g.lineTo(x + w - (i % 5 === 0 ? 17 : (i % 2 === 0 ? 12 : 8)), ty); g.stroke(); }
    g.restore();
  };

  // طبق بتري (منظور مائل). origin = منتصف القاعدة.
  // opts: agar [r,g,b], colonies [{x,y,r}] (x,y ∈ -1..1), lid (bool), lift (رفع الغطاء بوحدات)
  K.petriDish = function (g, cx, by, s, o) {
    o = o || {}; var R = 72, ry = 19, H = 15, agar = o.agar || [236, 196, 110], ay = -H + 6;
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 2, R * 2.15, 0.3);
    K.glass(g, function (g2) { disc(g2, R, ry, -H, H); }, -R, -H - ry, R * 2, H + ry * 2, { shine: 'ellipse' });
    var ag = g.createRadialGradient(-12, ay - 3, 4, 0, ay, R);
    ag.addColorStop(0, rgba(shade(agar, 1.12), 0.92)); ag.addColorStop(1, rgba(shade(agar, 0.84), 0.95));
    g.fillStyle = ag; g.beginPath(); g.ellipse(0, ay, R - 5, ry - 3.5, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, ay, R - 6, ry - 4.5, 0, Math.PI * 0.08, Math.PI * 0.6); g.stroke();
    (o.colonies || []).forEach(function (c) {
      var px = c.x * (R - 14), py = ay + c.y * (ry - 7), r = c.r || 3.2;
      g.fillStyle = 'rgba(60,40,10,.25)'; g.beginPath(); g.ellipse(px + 0.8, py + 1.2, r, r * 0.55, 0, 0, TAU); g.fill();
      g.fillStyle = c.color || 'rgba(250,246,232,.97)'; g.beginPath(); g.ellipse(px, py, r, r * 0.6, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(px - r * 0.3, py - r * 0.22, r * 0.32, r * 0.18, 0, 0, TAU); g.fill();
    });
    g.strokeStyle = K.pal.glassEdge; g.lineWidth = 1.6; g.beginPath(); g.ellipse(0, -H, R, ry, 0, 0, TAU); g.stroke();
    if (o.lid) {
      var ly = -H - 4 - (o.lift || 0);
      K.glass(g, function (g2) { disc(g2, R + 4, ry + 2, ly, 9); }, -R - 4, ly - ry, (R + 4) * 2, 9 + ry * 2, { shine: 'ellipse' });
      g.fillStyle = 'rgba(235,246,252,.28)'; g.beginPath(); g.ellipse(0, ly, R + 4, ry + 2, 0, 0, TAU); g.fill();
      g.strokeStyle = K.pal.glassEdge; g.lineWidth = 1.4; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, ly, R, ry, 0, Math.PI * 1.05, Math.PI * 1.45); g.stroke();
    }
    g.restore();
  };

  // قمع زجاجي. origin = طرف الساق السفلي (يوضع في فوهة وعاء). opts: paper (ورقة ترشيح)
  K.funnel = function (g, cx, by, s, o) {
    o = o || {}; g.save(); g.translate(cx, by); g.scale(s, s);
    function path(g2) { g2.beginPath(); g2.moveTo(-46, -104); g2.lineTo(-5, -52); g2.lineTo(-4, -3); g2.lineTo(-2, 0); g2.lineTo(2, 0); g2.lineTo(4, -3); g2.lineTo(5, -52); g2.lineTo(46, -104); }
    g.fillStyle = 'rgba(210,228,240,.22)'; g.beginPath(); g.ellipse(0, -104, 46, 5.5, 0, 0, TAU); g.fill();
    if (o.paper) { g.fillStyle = 'rgba(250,246,230,.92)'; g.beginPath(); g.moveTo(-40, -102); g.lineTo(0, -58); g.lineTo(40, -102); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(150,140,110,.7)'; g.lineWidth = 1; g.stroke(); }
    K.glass(g, path, -46, -104, 92, 104, { shine: 'diagonal' });
    g.strokeStyle = K.pal.glassEdge; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -104, 46, 5.5, 0, 0, TAU); g.stroke();
    g.restore();
  };

  // زجاجة ساعة. origin = منتصف القاعدة. opts: sample [r,g,b]
  K.watchGlass = function (g, cx, by, s, o) {
    o = o || {}; g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 1, 100, 0.22);
    function path(g2) { g2.beginPath(); g2.moveTo(-50, -12); g2.quadraticCurveTo(0, 10, 50, -12); g2.ellipse(0, -12, 50, 7, 0, 0, Math.PI, true); g2.closePath(); }
    g.fillStyle = 'rgba(210,228,240,.2)'; g.beginPath(); g.ellipse(0, -12, 50, 7, 0, 0, TAU); g.fill();
    if (o.sample) { g.fillStyle = rgba(o.sample, 0.9); g.beginPath(); g.ellipse(0, -6, 20, 4.2, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(-6, -7.5, 6, 1.2, 0, 0, TAU); g.fill(); }
    K.glass(g, path, -50, -19, 100, 20, { shine: 'ellipse' });
    g.strokeStyle = K.pal.glassEdge; g.lineWidth = 1.6; g.beginPath(); g.ellipse(0, -12, 50, 7, 0, 0, TAU); g.stroke();
    g.restore();
  };

  // أنبوب طرد مخروطي 15 مل بغطاء لولبي. origin = طرف القاع. opts: level, color, cap (افتراضي true), capColor
  K.centrifugeTube = function (g, cx, by, s, o) {
    o = o || {}; var w = 26, h = 128, color = o.color || [200, 70, 70];
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 1, 30, 0.22);
    function path(g2) { g2.beginPath(); g2.moveTo(-w / 2, -h); g2.lineTo(-w / 2, -48); g2.quadraticCurveTo(-w / 2, -20, -3, -1); g2.lineTo(3, -1);
      g2.quadraticCurveTo(w / 2, -20, w / 2, -48); g2.lineTo(w / 2, -h); }
    if (o.level > 0) K.liquid(g, path, 0, w - 2, -5 - (h - 30) * o.level, 0, color, 2.2);
    K.glass(g, path, -w / 2, -h, w, h);
    g.strokeStyle = K.pal.glassEdge; g.lineWidth = 1.8; g.beginPath(); g.ellipse(0, -h, w / 2, 2.4, 0, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.88)'; g.beginPath(); g.roundRect(-1, -98, 11, 34, 1.5); g.fill();       // خانة الكتابة
    g.strokeStyle = 'rgba(31,47,61,.6)'; g.lineWidth = 1;
    for (var i = 1; i <= 4; i++) { var ty = -22 - i * 17; g.beginPath(); g.moveTo(-w / 2 + 1, ty); g.lineTo(-w / 2 + (i % 2 ? 7 : 11), ty); g.stroke(); }
    if (o.cap !== false) { K.part(g, -w / 2 - 1.5, -h - 13, w + 3, 16, 3, o.capColor || [47, 111, 143]);
      g.strokeStyle = 'rgba(0,0,0,.18)'; for (var k = 1; k < 6; k++) { g.beginPath(); g.moveTo(-w / 2 - 1 + k * (w + 2) / 6, -h - 11); g.lineTo(-w / 2 - 1 + k * (w + 2) / 6, -h - 1); g.stroke(); } }
    g.restore();
  };

  // أنبوب مايكرو 1.5 مل (إبندورف). origin = طرف القاع. opts: level, color, open (غطاء مفتوح)
  K.microtube = function (g, cx, by, s, o) {
    o = o || {}; var w = 12, h = 44, color = o.color || [210, 80, 90];
    g.save(); g.translate(cx, by); g.scale(s, s);
    function path(g2) { g2.beginPath(); g2.moveTo(-w / 2, -h); g2.lineTo(-w / 2, -18); g2.quadraticCurveTo(-w / 2, -6, -1.4, -0.5); g2.lineTo(1.4, -0.5);
      g2.quadraticCurveTo(w / 2, -6, w / 2, -18); g2.lineTo(w / 2, -h); }
    if (o.level > 0) K.liquid(g, path, 0, w - 1, -4 - (h - 12) * o.level, 0, color, 1.2);
    K.glass(g, path, -w / 2, -h, w, h);
    g.strokeStyle = K.pal.glassEdge; g.lineWidth = 1.4; g.beginPath(); g.ellipse(0, -h, w / 2, 1.8, 0, 0, TAU); g.stroke();
    if (o.open) {                                                          // الغطاء مقلوب على مفصّله
      g.save(); g.translate(w / 2, -h); g.rotate(1.9); K.part(g, 0, -4, 15, 7, 3, [236, 238, 240]); g.restore();
    } else {
      K.part(g, -w / 2 - 0.5, -h - 6, w + 1, 7, 3, [236, 238, 240]); K.part(g, w / 2 - 1, -h - 5, 6, 4, 1.5, [226, 230, 234]);
    }
    g.restore();
  };

  // حامل أنابيب. origin = منتصف القاعدة. opts: n (افتراضي 5), spacing (44), color, front (يرسم الحافة الأمامية للفتحات فقط بعد رسم الأنابيب)
  // يُرجع مواضع الفتحات x (وحدات تصميمية نسبة إلى cx). قاعدة الأنبوب الواقف تكون عند y = by - 14*s
  K.tubeRack = function (g, cx, by, s, o) {
    o = o || {}; var n = o.n || 5, sp = o.spacing || 44, W = n * sp + 20, color = o.color || [47, 111, 143], slots = [], i;
    for (i = 0; i < n; i++) slots.push((i - (n - 1) / 2) * sp);
    g.save(); g.translate(cx, by); g.scale(s, s);
    if (o.front) {
      g.strokeStyle = 'rgba(15,30,42,.6)'; g.lineWidth = 1.8;
      slots.forEach(function (sx) { g.beginPath(); g.ellipse(sx, -72, 15.5, 4.4, 0, 0.05, Math.PI - 0.05); g.stroke(); });
      g.restore(); return slots;
    }
    K.contactShadow(g, 0, 1, W * 1.05, 0.28);
    K.part(g, -W / 2, -80, 9, 80, 2, color); K.part(g, W / 2 - 9, -80, 9, 80, 2, color);
    K.part(g, -W / 2, -14, W, 14, 3, color, false);
    K.part(g, -W / 2, -82, W, 17, 3, color, false);
    g.fillStyle = 'rgba(10,25,35,.6)'; slots.forEach(function (sx) { g.beginPath(); g.ellipse(sx, -73, 15, 4.2, 0, 0, TAU); g.fill(); });
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-W / 2 + 3, -81, W - 6, 1.5);
    g.restore(); return slots;
  };

  // قارورة غسيل (ماء مقطّر). origin = منتصف القاعدة. opts: level, color
  K.washBottle = function (g, cx, by, s, o) {
    o = o || {}; var color = o.color || [190, 222, 240];
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 1, 90, 0.28);
    function path(g2) { g2.beginPath(); g2.moveTo(-14, -140); g2.lineTo(-14, -124); g2.quadraticCurveTo(-37, -114, -37, -92); g2.lineTo(-37, -8);
      g2.quadraticCurveTo(-37, 0, -29, 0); g2.lineTo(29, 0); g2.quadraticCurveTo(37, 0, 37, -8); g2.lineTo(37, -92); g2.quadraticCurveTo(37, -114, 14, -124); g2.lineTo(14, -140); g2.closePath(); }
    if (o.level > 0) K.liquid(g, path, 0, 74, -8 - 96 * o.level, 0, color, 3);
    K.glass(g, path, -37, -140, 74, 140);
    K.part(g, -16, -156, 32, 18, 4, [60, 140, 90]);
    g.lineCap = 'round'; g.strokeStyle = '#d7dde1'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, -156); g.lineTo(0, -176); g.lineTo(30, -190); g.stroke();
    g.strokeStyle = '#8f9aa2'; g.lineWidth = 1.4; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-1.5, -158); g.lineTo(-1.5, -175); g.stroke();
    g.restore();
  };

  // محقنة. origin = طرف الإبرة (أو طرف الفوهة بدون إبرة). opts: fill 0..1, liquid [r,g,b], needle (bool)
  K.syringe = function (g, cx, by, s, o) {
    o = o || {}; var f = o.fill === undefined ? 0.5 : o.fill, B = o.needle ? -44 : -14, top = B - 100, sy = B - 100 * f;
    g.save(); g.translate(cx, by); g.scale(s, s);
    if (o.needle) { g.strokeStyle = '#aab4bb'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, B + 2); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-0.4, -2); g.lineTo(-0.4, B + 4); g.stroke(); }
    K.part(g, -3.6, B - 12, 7.2, 14, 2, [210, 216, 222]);                                // الفوهة
    function bar(g2) { g2.beginPath(); g2.roundRect(-9, top, 18, 100, 2); }
    if (o.liquid && f > 0) K.liquid(g, bar, 0, 17, sy, B, o.liquid, 1.2);
    K.glass(g, bar, -9, top, 18, 100);
    g.strokeStyle = 'rgba(31,47,61,.6)'; g.lineWidth = 1; for (var i = 1; i < 10; i++) { var ty = B - i * 10; g.beginPath(); g.moveTo(-9, ty); g.lineTo(i % 5 === 0 ? 0 : -4, ty); g.stroke(); }
    K.part(g, -3, sy - 100, 6, 100, 1, [236, 238, 240]); K.part(g, -9, sy - 6, 18, 6, 2, [40, 44, 48]);   // الساق والمكبس المطاطي
    K.part(g, -13, sy - 108, 26, 8, 4, [236, 238, 240]);                                 // قرص الإبهام
    K.part(g, -15, top - 2, 30, 5, 2, [226, 230, 234]);                                  // جناحا الأصابع
    g.restore();
  };

  // مقياس حرارة كحولي. origin = أسفل المستودع (نقطة الغمر). opts: temp (°م، من -10 إلى 110)
  K.thermometer = function (g, cx, by, s, o) {
    o = o || {}; var t = o.temp === undefined ? 20 : o.temp, ty = -16 - (Math.max(-10, Math.min(110, t)) + 10) * (160 / 120);
    g.save(); g.translate(cx, by); g.scale(s, s);
    g.fillStyle = 'rgba(255,255,255,.78)'; g.beginPath(); g.roundRect(-5.5, -198, 11, 186, 5); g.fill();
    g.strokeStyle = 'rgba(31,47,61,.7)'; g.lineWidth = 1;
    for (var d = -10; d <= 110; d += 10) { var y = -16 - (d + 10) * (160 / 120); g.beginPath(); g.moveTo(-5, y); g.lineTo(d % 50 === 0 ? 1 : -2, y); g.stroke(); }
    g.fillStyle = '#c0392b'; g.fillRect(-1.5, ty, 3, -12 - ty); g.beginPath(); g.arc(0, -7, 6.5, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-2.2, -9, 1.6, 3, 0, 0, TAU); g.fill();
    K.glass(g, function (g2) { g2.beginPath(); g2.roundRect(-5.5, -198, 11, 186, 5); }, -5.5, -198, 11, 186);
    g.strokeStyle = K.pal.glassEdge; g.lineWidth = 1.4; g.beginPath(); g.arc(0, -7, 7, 0, TAU); g.stroke();
    g.restore();
  };

  // قارورة كاشف (عنبرية) بغطاء عادي أو قطّارة. origin = منتصف القاعدة. opts: color, level, label (نص قصير), dropper (bool)
  K.bottle = function (g, cx, by, s, o) {
    o = o || {}; var color = o.color || [150, 90, 40], lv = o.level === undefined ? 0.85 : o.level;
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 1, 70, 0.28);
    function path(g2) { g2.beginPath(); g2.moveTo(-11, -98); g2.lineTo(-11, -84); g2.quadraticCurveTo(-30, -76, -30, -60); g2.lineTo(-30, -6); g2.quadraticCurveTo(-30, 0, -24, 0);
      g2.lineTo(24, 0); g2.quadraticCurveTo(30, 0, 30, -6); g2.lineTo(30, -60); g2.quadraticCurveTo(30, -76, 11, -84); g2.lineTo(11, -98); g2.closePath(); }
    K.liquid(g, path, 0, 60, -8 - 70 * lv, 0, color, 3);
    K.glass(g, path, -30, -98, 60, 98);
    g.fillStyle = 'rgba(248,245,232,.96)'; g.beginPath(); g.roundRect(-22, -56, 44, 32, 2); g.fill();
    g.fillStyle = K.pal.acc; g.fillRect(-22, -56, 44, 5);
    g.fillStyle = K.pal.ink; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText(o.label || '', 0, -35);
    if (o.dropper) { K.part(g, -12, -108, 24, 11, 3, [48, 60, 70]); dropBulb(g, 0, -108, 38, 14); }
    else { K.part(g, -13, -110, 26, 14, 3, [30, 35, 40]); g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 1;
      for (var i = 1; i < 6; i++) { g.beginPath(); g.moveTo(-13 + i * 26 / 6, -108); g.lineTo(-13 + i * 26 / 6, -98); g.stroke(); } }
    g.restore();
  };

  // ماصة مدرّجة 10 مل. origin = الطرف السفلي. opts: fill 0..1, liquid [r,g,b], bulb (bool)
  K.gradPipette = function (g, cx, by, s, o) {
    o = o || {}; g.save(); g.translate(cx, by); g.scale(s, s);
    function path(g2) { g2.beginPath(); g2.moveTo(-1, 0); g2.lineTo(-4, -26); g2.lineTo(-4, -224); g2.lineTo(4, -224); g2.lineTo(4, -26); g2.lineTo(1, 0); g2.closePath(); }
    if (o.liquid && o.fill > 0) K.liquid(g, path, 0, 8, -30 - 190 * o.fill, 0, o.liquid, 1);
    K.glass(g, path, -4, -224, 8, 224);
    g.strokeStyle = 'rgba(31,47,61,.7)'; g.lineWidth = 1;
    for (var i = 0; i <= 10; i++) { var y = -34 - i * 17.5; g.beginPath(); g.moveTo(-4, y); g.lineTo(i % 5 === 0 ? 3 : 0, y); g.stroke(); }
    g.fillStyle = K.pal.acc; g.fillRect(-4, -219, 8, 4);
    K.part(g, -5.5, -234, 11, 11, 3, [226, 230, 234]);
    if (o.bulb !== false) dropBulb(g, 0, -234, 44, 14);
    g.restore();
  };

  // برطمان عيّنات. origin = منتصف القاعدة. opts: level, color (سائل حافظ), label, specimen (لون CSS لكتلة تمثّل العيّنة)
  K.jar = function (g, cx, by, s, o) {
    o = o || {}; var color = o.color || [236, 228, 170], lv = o.level === undefined ? 0.85 : o.level;
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 1, 100, 0.3);
    function path(g2) { g2.beginPath(); g2.moveTo(-34, -92); g2.lineTo(-38, -88); g2.lineTo(-42, -80); g2.lineTo(-42, -8); g2.quadraticCurveTo(-42, 0, -34, 0);
      g2.lineTo(34, 0); g2.quadraticCurveTo(42, 0, 42, -8); g2.lineTo(42, -80); g2.lineTo(38, -88); g2.lineTo(34, -92); }
    K.liquid(g, path, 0, 84, -6 - 80 * lv, 0, color, 4);
    if (o.specimen) { g.fillStyle = o.specimen; g.beginPath(); g.ellipse(0, -44, 17, 24, 0.25, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(-5, -52, 5, 11, 0.25, 0, TAU); g.fill(); }
    K.glass(g, path, -42, -92, 84, 92);
    g.fillStyle = 'rgba(248,245,232,.95)'; g.beginPath(); g.roundRect(-26, -30, 52, 20, 2); g.fill();
    g.fillStyle = K.pal.ink; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText(o.label || '', 0, -16);
    K.part(g, -38, -106, 76, 16, 4, o.capColor || [48, 60, 70]);
    g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1; for (var i = 1; i < 10; i++) { g.beginPath(); g.moveTo(-38 + i * 7.6, -104); g.lineTo(-38 + i * 7.6, -92); g.stroke(); }
    g.restore();
  };

  /* ═════════════════════════════════════════════════════════════════
     دفعة 2 — الأجهزة الكبيرة (تقف على الطاولة؛ origin = منتصف القاعدة)
     ═════════════════════════════════════════════════════════════════ */
  function lcd(g, x, y, w, h, text, size) {           // شاشة رقمية موحّدة
    g.fillStyle = '#1c262e'; g.beginPath(); g.roundRect(x, y, w, h, 3); g.fill();
    g.fillStyle = '#9fe3b5'; g.font = 'bold ' + (size || 13) + 'px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, x + w / 2, y + h / 2 + 1); g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x, y, w, h * 0.3);
  }
  function knob(g, x, y, r, ang, base) {              // مقبض دوّار بتدرج ومؤشّر
    var kg = g.createRadialGradient(x - r * 0.3, y - r * 0.35, 1, x, y, r);
    kg.addColorStop(0, rgba(shade(base, 1.7), 1)); kg.addColorStop(1, rgba(shade(base, 0.7), 1));
    g.fillStyle = kg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x + Math.cos(ang) * r * 0.3, y + Math.sin(ang) * r * 0.3); g.lineTo(x + Math.cos(ang) * r * 0.85, y + Math.sin(ang) * r * 0.85); g.stroke();
  }

  // لهب بنزن. origin = منتصف القاعدة. opts: flame 0..1 (0 = مطفأ), yellow (لهب أصفر آمن)، air 0..1 (فتح الطوق)
  K.bunsen = function (g, cx, by, s, o) {
    o = o || {}; var f = o.flame || 0, air = o.air === undefined ? 0.5 : o.air;
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 1, 90, 0.32);
    g.strokeStyle = '#2c3338'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-50, -9); g.bezierCurveTo(-78, -9, -86, -30, -112, -26); g.stroke();   // خرطوم الغاز
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-50, -11); g.bezierCurveTo(-78, -11, -86, -32, -112, -28); g.stroke();
    K.part(g, -54, -13, 24, 9, 3, K.pal.steel);                                                  // مدخل الغاز
    g.beginPath(); g.moveTo(-38, 0); g.quadraticCurveTo(-38, -13, -14, -18); g.lineTo(14, -18); g.quadraticCurveTo(38, -13, 38, 0); g.closePath();   // القاعدة
    g.fillStyle = lg(g, -38, 0, 38, 0, [[0, '#3c4852'], [0.22, '#8493a0'], [0.5, '#59676f'], [1, '#222c34']]); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1; g.stroke();
    K.part(g, -7, -128, 14, 112, 2, K.pal.steel);                                                // الأنبوب
    K.part(g, -11, -52, 22, 26, 3, [184, 80, 58]);                                               // طوق الهواء
    g.fillStyle = '#1c1410'; var open = 2 + air * 5;
    g.beginPath(); g.ellipse(-3.5, -39, 2.6, open, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(4, -39, 2.2, open * 0.9, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-11, -52); g.lineTo(11, -52); g.moveTo(-11, -26); g.lineTo(11, -26); g.stroke();
    K.part(g, -8.5, -132, 17, 6, 2, [204, 212, 218]);                                            // الفوهة
    if (f > 0) {
      var top = -132, H1 = (o.yellow ? 96 : 74) * f;
      var gl = g.createRadialGradient(0, top - H1 * 0.45, 2, 0, top - H1 * 0.45, 70 * f + 20);
      gl.addColorStop(0, o.yellow ? 'rgba(255,190,80,.38)' : 'rgba(150,190,255,.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(0, top - H1 * 0.45, 70 * f + 20, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(-7.5, top); g.bezierCurveTo(-13, top - H1 * 0.4, -5, top - H1 * 0.75, 0, top - H1); g.bezierCurveTo(5, top - H1 * 0.75, 13, top - H1 * 0.4, 7.5, top); g.closePath();
      g.fillStyle = o.yellow ? lg(g, 0, top, 0, top - H1, [[0, 'rgba(255,230,120,.95)'], [0.55, 'rgba(255,160,50,.8)'], [1, 'rgba(255,110,30,0)']])
                              : lg(g, 0, top, 0, top - H1, [[0, 'rgba(70,110,255,.95)'], [0.5, 'rgba(140,185,255,.6)'], [1, 'rgba(200,220,255,0)']]);
      g.fill();
      if (!o.yellow) { g.beginPath(); g.moveTo(-4, top); g.bezierCurveTo(-6, top - H1 * 0.25, -2, top - H1 * 0.4, 0, top - H1 * 0.46); g.bezierCurveTo(2, top - H1 * 0.4, 6, top - H1 * 0.25, 4, top); g.closePath();
        g.fillStyle = 'rgba(40,70,200,.75)'; g.fill(); }
    }
    g.restore();
  };

  // ميزان رقمي. origin = منتصف القاعدة. مركز الكفة (0,-68). opts: value (نص مثل '12.48')، unit ('g')
  K.balance = function (g, cx, by, s, o) {
    o = o || {}; var iv = K.pal.ivory;
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 2, 190, 0.32);
    K.part(g, -80, -46, 160, 42, 10, iv, false);                                                  // الصندوق
    K.part(g, -76, -58, 152, 15, 6, iv);                                                          // السطح العلوي
    g.fillStyle = 'rgba(31,47,61,.18)'; g.fillRect(-72, -44, 144, 1.5);
    lcd(g, -56, -38, 62, 24, (o.value || '0.00') + ' ' + (o.unit || 'g'), 13);
    [[30, -28], [52, -28]].forEach(function (b) { var bg = g.createRadialGradient(b[0] - 2, b[1] - 3, 1, b[0], b[1], 8);       // زرّا التصفير والتشغيل
      bg.addColorStop(0, '#6f7f8c'); bg.addColorStop(1, '#2a343c'); g.fillStyle = bg; g.beginPath(); g.arc(b[0], b[1], 7, 0, TAU); g.fill(); });
    g.fillStyle = 'rgba(31,47,61,.7)'; g.font = 'bold 7px sans-serif'; g.textAlign = 'center'; g.direction = 'rtl'; g.fillText('صفر', 30, -14); g.fillText('تشغيل', 52, -14);
    K.part(g, -72, -4, 16, 5, 2, [30, 36, 42]); K.part(g, 56, -4, 16, 5, 2, [30, 36, 42]);       // القوائم
    K.part(g, -6, -70, 12, 14, 2, K.pal.steel);                                                   // عمود الكفة
    var pg = g.createRadialGradient(-12, -74, 4, 0, -68, 46); pg.addColorStop(0, '#f2f5f7'); pg.addColorStop(0.7, '#b6c1c9'); pg.addColorStop(1, '#8696a2');
    g.fillStyle = pg; g.beginPath(); g.ellipse(0, -68, 44, 9, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(60,80,95,.6)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(0, -68, 38, 6.4, 0, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
    g.restore();
  };

  // جهاز طرد مركزي مكتبي. origin = منتصف القاعدة.
  // opts: open (غطاء مفتوح)، angle (دوران الدوّار)، tubes (bool أنابيب في الدوّار)، running، rpm (نص)، time (نص)، dial (زاوية المقبض)
  K.centrifuge = function (g, cx, by, s, o) {
    o = o || {}; var iv = K.pal.ivory, gr = K.pal.graphite, ang = o.angle || 0;
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 2, 250, 0.34);
    if (o.open) {                                                                                   // الغطاء المرفوع (خلف الجهاز)
      g.beginPath(); g.moveTo(-84, -86); g.lineTo(-92, -176); g.quadraticCurveTo(0, -196, 92, -176); g.lineTo(84, -86); g.closePath();
      g.fillStyle = lg(g, -92, 0, 92, 0, [[0, rgba(shade(iv, 0.78), 1)], [0.3, rgba(shade(iv, 1.04), 1)], [1, rgba(shade(iv, 0.6), 1)]]); g.fill();
      g.strokeStyle = rgba(shade(iv, 0.4), 0.8); g.lineWidth = 1.2; g.stroke();
      g.fillStyle = 'rgba(31,47,61,.35)'; g.beginPath(); g.ellipse(0, -140, 46, 20, 0, 0, TAU); g.fill();
    }
    K.part(g, -100, -86, 200, 86, 14, iv, false);                                                   // الجسم
    K.part(g, -90, -6, 22, 6, 2, [30, 36, 42]); K.part(g, 68, -6, 22, 6, 2, [30, 36, 42]);
    if (o.open) {
      g.fillStyle = '#10161b'; g.beginPath(); g.ellipse(0, -86, 86, 15, 0, 0, TAU); g.fill();       // التجويف
      var rg = g.createRadialGradient(-20, -90, 5, 0, -86, 72); rg.addColorStop(0, '#9aa8b3'); rg.addColorStop(1, '#4f5c66');
      g.fillStyle = rg; g.beginPath(); g.ellipse(0, -86, 72, 11.5, 0, 0, TAU); g.fill();
      for (var k = 0; k < 8; k++) { var a = ang + k * TAU / 8, hx = Math.cos(a) * 56, hy = -86 + Math.sin(a) * 8.2;
        if (Math.sin(a) < 0) { g.fillStyle = '#0c1216'; g.beginPath(); g.ellipse(hx, hy, 6, 2.4, 0, 0, TAU); g.fill(); if (o.tubes) { K.part(g, hx - 3.4, hy - 22, 6.8, 22, 2, [236, 238, 240]); } }
        else { g.fillStyle = '#0c1216'; g.beginPath(); g.ellipse(hx, hy, 6, 2.4, 0, 0, TAU); g.fill(); if (o.tubes) { K.part(g, hx - 3.4, hy - 22, 6.8, 22, 2, [236, 238, 240]); g.fillStyle = 'rgba(47,111,143,.9)'; g.beginPath(); g.ellipse(hx, hy - 22, 3.4, 1.4, 0, 0, TAU); g.fill(); } } }
      g.fillStyle = '#d5dde3'; g.beginPath(); g.ellipse(0, -86, 8, 2.8, 0, 0, TAU); g.fill();
    } else {
      g.beginPath(); g.moveTo(-92, -86); g.bezierCurveTo(-92, -140, 92, -140, 92, -86); g.closePath();   // غطاء مغلق
      g.fillStyle = lg(g, -92, 0, 92, 0, [[0, rgba(shade(iv, 0.78), 1)], [0.22, rgba(shade(iv, 1.12), 1)], [0.6, rgba(shade(iv, 0.95), 1)], [1, rgba(shade(iv, 0.62), 1)]]); g.fill();
      g.strokeStyle = rgba(shade(iv, 0.4), 0.8); g.lineWidth = 1.2; g.stroke();
      g.fillStyle = 'rgba(30,44,56,.62)'; g.beginPath(); g.ellipse(0, -108, 50, 14, 0, 0, TAU); g.fill();    // نافذة داكنة
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-16, -113, 18, 3.2, -0.1, 0, TAU); g.fill();
      K.part(g, -14, -94, 28, 8, 3, gr);
    }
    g.fillStyle = lg(g, 0, -64, 0, -12, [[0, rgba(shade(gr, 1.25), 1)], [1, rgba(shade(gr, 0.85), 1)]]); g.beginPath(); g.roundRect(-88, -64, 176, 50, 7); g.fill();   // اللوحة
    lcd(g, -76, -56, 66, 22, (o.rpm || '0') + ' د/د', 12);
    lcd(g, -76, -30, 66, 12, o.time || '00:00', 10);
    knob(g, 28, -39, 15, o.dial === undefined ? -2.2 : o.dial, [110, 124, 134]);
    g.fillStyle = o.running ? '#27ae60' : '#3a4650'; g.beginPath(); g.arc(62, -48, 4, 0, TAU); g.fill();
    g.fillStyle = '#b8503a'; g.beginPath(); g.arc(62, -30, 6, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(60, -32, 1.8, 0, TAU); g.fill();
    g.restore();
  };

  // حمّام مائي. origin = منتصف القاعدة. سطح الماء عند y≈-74 (ضع الأنابيب هناك). opts: temp (نص)، on، steam 0..1
  K.waterBath = function (g, cx, by, s, o) {
    o = o || {}; g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 2, 230, 0.32);
    K.part(g, -100, -64, 200, 64, 8, K.pal.steel, false);                                          // الجسم
    g.beginPath(); g.moveTo(-100, -64); g.lineTo(100, -64); g.lineTo(84, -90); g.lineTo(-84, -90); g.closePath();   // السطح العلوي
    g.fillStyle = lg(g, 0, -90, 0, -64, [[0, '#d9e0e5'], [1, '#aab5bd']]); g.fill(); g.strokeStyle = 'rgba(60,80,95,.7)'; g.lineWidth = 1; g.stroke();
    g.beginPath(); g.moveTo(-88, -67); g.lineTo(88, -67); g.lineTo(74, -86); g.lineTo(-74, -86); g.closePath();   // الحوض والماء
    g.fillStyle = lg(g, 0, -86, 0, -67, [[0, 'rgba(70,140,190,.95)'], [1, 'rgba(120,190,225,.9)']]); g.fill(); g.strokeStyle = 'rgba(40,70,90,.6)'; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2;
    for (var i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-50 + i * 24, -73 - i * 2); g.quadraticCurveTo(-40 + i * 24, -76 - i * 2, -30 + i * 24, -73 - i * 2); g.stroke(); }
    lcd(g, -80, -52, 56, 24, (o.temp || '37.0') + '°C', 13);
    knob(g, 44, -40, 13, -2.0, [120, 132, 142]);
    g.fillStyle = o.on ? '#e8412c' : '#3a4650'; g.beginPath(); g.arc(76, -48, 4, 0, TAU); g.fill();
    K.part(g, -100, -46, 7, 18, 3, [60, 70, 80]); K.part(g, 93, -46, 7, 18, 3, [60, 70, 80]);   // مقبضا الحمل
    if (o.steam > 0) { g.strokeStyle = 'rgba(255,255,255,' + (0.5 * o.steam) + ')'; g.lineWidth = 2.4; g.lineCap = 'round';
      for (var k = 0; k < 4; k++) { var x0 = -48 + k * 32; g.beginPath(); g.moveTo(x0, -88); g.bezierCurveTo(x0 - 10, -104, x0 + 10, -116, x0, -136 * (0.6 + o.steam * 0.4)); g.stroke(); } }
    g.restore();
  };

  // سخّانة كهربائية. origin = منتصف القاعدة. سطح التسخين (0,-30). opts: on، knob (زاوية)
  K.hotPlate = function (g, cx, by, s, o) {
    o = o || {}; g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 2, 170, 0.32);
    K.part(g, -76, -26, 152, 26, 9, K.pal.graphite, false);
    var pg = g.createRadialGradient(-16, -32, 4, 0, -28, 76);
    pg.addColorStop(0, o.on ? '#ffb38a' : '#eef2f5'); pg.addColorStop(0.7, o.on ? '#d4683a' : '#b3bfc8'); pg.addColorStop(1, o.on ? '#8c3c1e' : '#7f8f9b');
    g.fillStyle = pg; g.beginPath(); g.ellipse(0, -27, 68, 12, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(40,55,65,.7)'; g.lineWidth = 1; g.stroke();
    if (o.on) { var hg = g.createRadialGradient(0, -34, 4, 0, -34, 70); hg.addColorStop(0, 'rgba(255,140,60,.35)'); hg.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = hg; g.fillRect(-80, -80, 160, 60); }
    knob(g, 48, -12, 8.5, o.knob === undefined ? -1.9 : o.knob, [150, 160, 170]);
    g.fillStyle = o.on ? '#e8412c' : '#3a4650'; g.beginPath(); g.arc(-52, -12, 3.4, 0, TAU); g.fill();
    g.restore();
  };

  // حاضنة مكتبية (باب زجاجي). origin = منتصف القاعدة. opts: temp (نص)، plates (0..3 أطباق مكدّسة على كل رف)
  K.incubator = function (g, cx, by, s, o) {
    o = o || {}; var iv = K.pal.ivory;
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 2, 180, 0.32);
    K.part(g, -72, -176, 144, 176, 9, iv, false);
    K.part(g, -72, -176, 144, 24, 9, K.pal.graphite, false);
    lcd(g, -52, -172, 62, 16, (o.temp || '37.0') + '°C', 11);
    knob(g, 48, -164, 8, -2.0, [130, 142, 150]);
    g.fillStyle = '#0f171d'; g.beginPath(); g.roundRect(-56, -148, 112, 118, 5); g.fill();         // الداخل
    g.strokeStyle = 'rgba(190,205,215,.5)'; g.lineWidth = 2;
    [-108, -68].forEach(function (y) { g.beginPath(); g.moveTo(-54, y); g.lineTo(54, y); g.stroke(); });   // الرفوف
    var n = Math.max(0, Math.min(3, o.plates || 0));
    [-108, -68, -30].forEach(function (y) { for (var i = 0; i < n; i++) { g.fillStyle = 'rgba(210,228,240,.55)'; g.beginPath(); g.ellipse(-24 + i * 26, y - 3, 11, 3.2, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(236,196,110,.7)'; g.beginPath(); g.ellipse(-24 + i * 26, y - 5, 9, 2.4, 0, 0, TAU); g.fill(); } });
    K.glass(g, function (g2) { g2.beginPath(); g2.roundRect(-56, -148, 112, 118, 5); }, -56, -148, 112, 118);
    K.part(g, 56, -112, 6, 36, 3, K.pal.steel);                                                    // مقبض الباب
    K.part(g, -64, -4, 16, 5, 2, [30, 36, 42]); K.part(g, 48, -4, 16, 5, 2, [30, 36, 42]);
    g.restore();
  };

  // ساعة إيقاف. origin = منتصف القاعدة. opts: sec (ثوانٍ)
  K.stopwatch = function (g, cx, by, s, o) {
    o = o || {}; var sec = o.sec || 0;
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 1, 70, 0.28);
    K.part(g, -5, -68, 10, 12, 2, K.pal.steel); K.part(g, -4, -72, 8, 5, 2, [210, 216, 222]);
    var cg = g.createRadialGradient(-10, -42, 2, 0, -32, 30); cg.addColorStop(0, '#f4f6f8'); cg.addColorStop(0.6, '#a8b4bd'); cg.addColorStop(1, '#5d6b75');
    g.fillStyle = cg; g.beginPath(); g.arc(0, -32, 28, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#fbfbf8'; g.beginPath(); g.arc(0, -32, 22, 0, TAU); g.fill(); g.strokeStyle = 'rgba(31,47,61,.35)'; g.stroke();
    g.strokeStyle = K.pal.ink; for (var i = 0; i < 60; i++) { var a = i * TAU / 60, r1 = i % 5 === 0 ? 17 : 19.5; g.lineWidth = i % 5 === 0 ? 1.4 : 0.7;
      g.beginPath(); g.moveTo(Math.cos(a) * r1, -32 + Math.sin(a) * r1); g.lineTo(Math.cos(a) * 21, -32 + Math.sin(a) * 21); g.stroke(); }
    var sa = sec / 60 * TAU - Math.PI / 2; g.strokeStyle = K.pal.warm; g.lineWidth = 1.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-Math.cos(sa) * 4, -32 - Math.sin(sa) * 4); g.lineTo(Math.cos(sa) * 18, -32 + Math.sin(sa) * 18); g.stroke();
    g.fillStyle = K.pal.ink; g.beginPath(); g.arc(0, -32, 2.2, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-8, -44, 9, 4, -0.5, 0, TAU); g.fill();
    g.restore();
  };

  // حامل رباعي (ستاند) مع مشبك. origin = منتصف القاعدة. نقطة الإمساك (30, clampY). opts: clampY (افتراضي -170)
  K.standClamp = function (g, cx, by, s, o) {
    o = o || {}; var cy = o.clampY === undefined ? -170 : o.clampY;
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 2, 150, 0.3);
    K.part(g, -64, -9, 128, 9, 3, [58, 68, 78], false);
    K.part(g, -42, -280, 7, 272, 3, K.pal.steel);
    K.part(g, -48, cy - 9, 19, 18, 3, K.pal.graphite);                                             // رأس التثبيت
    K.part(g, -30, cy - 3, 60, 6, 2, K.pal.steel);                                                 // ذراع المشبك
    K.part(g, 22, cy - 14, 6, 28, 2, [150, 160, 170]); K.part(g, 34, cy - 14, 6, 28, 2, [150, 160, 170]);   // الفكّان
    g.fillStyle = '#2a2f33'; g.fillRect(27.5, cy - 12, 2.5, 24); g.fillRect(31.5, cy - 12, 2.5, 24);
    knob(g, -38, cy, 5, 0.6, [120, 130, 140]);
    g.restore();
  };

  // جهاز قياس pH مكتبي بمسبار معلّق. origin = منتصف القاعدة. opts: ph (نص)، dip (0..1 طول نزول المسبار)
  K.pHMeter = function (g, cx, by, s, o) {
    o = o || {}; var iv = K.pal.ivory, d = o.dip || 0, tipY = -112 + d * 52;
    g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 2, 170, 0.3);
    K.part(g, -64, -40, 92, 40, 9, iv, false);
    lcd(g, -54, -34, 52, 20, (o.ph || '7.00') + ' pH', 12);
    g.fillStyle = K.pal.acc; g.beginPath(); g.roundRect(-52, -10, 16, 6, 2); g.fill(); g.fillStyle = '#6f7f8c'; g.beginPath(); g.roundRect(-30, -10, 16, 6, 2); g.fill();
    K.part(g, 52, -190, 6, 186, 3, K.pal.steel); K.part(g, 30, -190, 28, 6, 2, K.pal.steel);
    K.part(g, 40, -4, 36, 4, 2, [58, 68, 78], false);
    g.strokeStyle = '#2c3338'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(34, -186); g.bezierCurveTo(10, -170, 30, -90, 26, -40); g.stroke();   // الكبل
    K.part(g, 30, -184, 10, 8, 2, [48, 60, 70]);
    function probe(g2) { g2.beginPath(); g2.moveTo(31, -178); g2.lineTo(31, tipY - 8); g2.quadraticCurveTo(31, tipY + 8, 35, tipY + 8); g2.quadraticCurveTo(39, tipY + 8, 39, tipY - 8); g2.lineTo(39, -178); g2.closePath(); }
    K.glass(g, probe, 31, -178, 8, 178 + tipY);
    g.fillStyle = 'rgba(120,180,225,.55)'; g.beginPath(); g.ellipse(35, tipY + 2, 3.6, 6, 0, 0, TAU); g.fill();
    g.restore();
  };

  /* ═════════════════════════════════════════════════════════════════
     دفعة 3 — أدوات التشريح والفحص (الأدوات المسحوبة: origin = الطرف العامل)
     opts.angle (راديان) يدوّر الأداة حول الطرف
     ═════════════════════════════════════════════════════════════════ */
  // مشرط. origin = رأس الشفرة
  K.scalpel = function (g, x, y, s, o) {
    o = o || {}; g.save(); g.translate(x, y); g.rotate(o.angle || 0); g.scale(s, s);
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(5, -4, 6.5, -14, 5.5, -26); g.lineTo(-1.5, -26); g.lineTo(-0.5, -6); g.closePath();
    g.fillStyle = lg(g, -2, 0, 6, 0, [[0, '#9aa8b2'], [0.4, '#f4f7f9'], [1, '#8796a1']]); g.fill(); g.strokeStyle = 'rgba(40,55,65,.7)'; g.lineWidth = 0.8; g.stroke();
    K.part(g, -5, -34, 10, 10, 2, [190, 198, 204]);
    K.part(g, -3.8, -112, 7.6, 80, 3, K.pal.steel);
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 0.9; for (var i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-3.8, -40 - i * 4); g.lineTo(3.8, -40 - i * 4); g.stroke(); }
    g.restore();
  };

  // ملقط تشريح. origin = طرف الملقط. opts: open 0..1
  K.forceps = function (g, x, y, s, o) {
    o = o || {}; var gap = 1 + (o.open || 0) * 9;
    g.save(); g.translate(x, y); g.rotate(o.angle || 0); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
    function arms(w, style) { g.lineWidth = w; g.strokeStyle = style;
      [-1, 1].forEach(function (sg) { g.beginPath(); g.moveTo(sg * gap / 2, 0); g.lineTo(sg * (gap / 2 + 2), -26); g.quadraticCurveTo(sg * 9, -86, sg * 12, -134); g.stroke(); });
      g.beginPath(); g.moveTo(-12, -134); g.quadraticCurveTo(-12, -148, 0, -148); g.quadraticCurveTo(12, -148, 12, -134); g.stroke(); }
    arms(7, 'rgb(70,82,92)'); arms(5, lg(g, -12, 0, 12, 0, [[0, '#8e9ca6'], [0.45, '#dfe6eb'], [1, '#6f7e89']])); arms(1.2, 'rgba(255,255,255,.55)');
    g.strokeStyle = 'rgba(40,55,65,.55)'; g.lineWidth = 0.8; for (var i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-gap / 2 - 3, -3 - i * 3.5); g.lineTo(-gap / 2 + 1, -3 - i * 3.5); g.moveTo(gap / 2 - 1, -3 - i * 3.5); g.lineTo(gap / 2 + 3, -3 - i * 3.5); g.stroke(); }
    g.restore();
  };

  // مقص تشريح. origin = رأس الشفرتين المغلقتين. opts: open 0..1
  K.scissors = function (g, x, y, s, o) {
    o = o || {}; var op = (o.open || 0) * 0.22;
    g.save(); g.translate(x, y); g.rotate(o.angle || 0); g.scale(s, s); g.lineCap = 'round';
    [1, -1].forEach(function (sg) {
      g.save(); g.translate(0, -40); g.rotate(sg * op); g.translate(0, 40);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(sg * 4.8, -9); g.lineTo(sg * 4.8, -40); g.lineTo(0, -40); g.closePath();
      g.fillStyle = lg(g, 0, 0, sg * 5, 0, [[0, '#f1f5f8'], [1, '#98a6b0']]); g.fill(); g.strokeStyle = 'rgba(40,55,65,.7)'; g.lineWidth = 0.8; g.stroke();
      g.strokeStyle = '#9aa8b2'; g.lineWidth = 5; g.beginPath(); g.moveTo(sg * 1, -40); g.lineTo(-sg * 17, -112); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(sg * 0.4, -40); g.lineTo(-sg * 17.6, -112); g.stroke();
      g.strokeStyle = K.pal.acc; g.lineWidth = 5; g.beginPath(); g.ellipse(-sg * 20, -126, 8.5, 12, -sg * 0.28, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(-sg * 20.4, -126.6, 8.5, 12, -sg * 0.28, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
      g.restore();
    });
    var pv = g.createRadialGradient(-1, -41, 0.5, 0, -40, 4); pv.addColorStop(0, '#e6ebef'); pv.addColorStop(1, '#6d7b86');
    g.fillStyle = pv; g.beginPath(); g.arc(0, -40, 3.6, 0, TAU); g.fill();
    g.restore();
  };

  // إبرة تشريح. origin = رأس الإبرة
  K.dissectingNeedle = function (g, x, y, s, o) {
    o = o || {}; g.save(); g.translate(x, y); g.rotate(o.angle || 0); g.scale(s, s);
    g.strokeStyle = '#9aa8b2'; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -64); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-0.5, -2); g.lineTo(-0.5, -62); g.stroke();
    K.part(g, -4.4, -72, 8.8, 10, 2, K.pal.steel);
    K.part(g, -4.8, -150, 9.6, 80, 4, [176, 124, 74]);
    g.strokeStyle = 'rgba(80,45,15,.25)'; g.lineWidth = 0.8; for (var i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-3, -90 - i * 14); g.quadraticCurveTo(0, -94 - i * 14, 3, -90 - i * 14); g.stroke(); }
    g.restore();
  };

  // صينية تشريح (منظور مائل). origin = منتصف القاعدة. مركز الشمع (0,-40). opts: pins [{x,y}] (x,y ∈ -1..1)
  K.dissectingTray = function (g, cx, by, s, o) {
    o = o || {}; g.save(); g.translate(cx, by); g.scale(s, s);
    K.contactShadow(g, 0, 2, 320, 0.3);
    K.part(g, -140, -22, 280, 22, 8, [150, 162, 172], false);                                      // الجدار الأمامي
    g.fillStyle = lg(g, 0, -70, 0, -22, [[0, '#dfe6eb'], [1, '#b3bec7']]); g.beginPath(); g.roundRect(-140, -70, 280, 52, 14); g.fill();   // الحافة العلوية
    g.strokeStyle = 'rgba(60,80,95,.6)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = lg(g, 0, -64, 0, -26, [[0, '#2b4358'], [1, '#456079']]); g.beginPath(); g.roundRect(-124, -62, 248, 36, 9); g.fill();    // الشمع
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.roundRect(-118, -60, 236, 5, 3); g.fill();
    (o.pins || []).forEach(function (p) { var px = p.x * 108, py = -44 + p.y * 14;
      g.strokeStyle = '#7f8c96'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py + 5); g.stroke();
      var pg = g.createRadialGradient(px - 1, py - 1, 0.3, px, py, 3); pg.addColorStop(0, '#fff'); pg.addColorStop(1, '#7f8c96'); g.fillStyle = pg; g.beginPath(); g.arc(px, py, 2.6, 0, TAU); g.fill(); });
    g.restore();
  };

  // عدسة مكبّرة يدوية. origin = نهاية المقبض السفلية. مركز العدسة (0,-114). opts: angle
  K.handLens = function (g, x, y, s, o) {
    o = o || {}; g.save(); g.translate(x, y); g.rotate(o.angle || 0); g.scale(s, s);
    K.part(g, -4.6, -72, 9.2, 72, 4, [64, 46, 36]);
    K.part(g, -3.4, -90, 6.8, 20, 2, K.pal.steel);
    g.strokeStyle = lg(g, -36, 0, 36, 0, [[0, '#6c7a85'], [0.3, '#f1f4f6'], [1, '#6c7a85']]); g.lineWidth = 6;
    g.beginPath(); g.arc(0, -126, 35, 0, TAU); g.stroke();
    var lgl = g.createRadialGradient(-12, -138, 3, 0, -126, 33); lgl.addColorStop(0, 'rgba(240,250,255,.5)'); lgl.addColorStop(0.7, 'rgba(200,225,238,.18)'); lgl.addColorStop(1, 'rgba(150,190,210,.3)');
    g.fillStyle = lgl; g.beginPath(); g.arc(0, -126, 32, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.arc(0, -126, 25, Math.PI * 1.08, Math.PI * 1.38); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, -126, 25, Math.PI * 0.1, Math.PI * 0.28); g.stroke();
    g.restore();
  };

  // عروة تلقيح (مجس معدني). origin = رأس العروة. opts: hot (متوهجة)
  K.inoculatingLoop = function (g, x, y, s, o) {
    o = o || {}; g.save(); g.translate(x, y); g.rotate(o.angle || 0); g.scale(s, s); g.lineCap = 'round';
    if (o.hot) { var hg = g.createRadialGradient(0, -5, 1, 0, -5, 20); hg.addColorStop(0, 'rgba(255,120,50,.6)'); hg.addColorStop(1, 'rgba(255,120,50,0)'); g.fillStyle = hg; g.beginPath(); g.arc(0, -5, 20, 0, TAU); g.fill(); }
    g.strokeStyle = o.hot ? '#ff6b35' : '#aab4bb'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, -5, 4.2, 5, 0, 0, TAU); g.stroke();
    g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, -10); g.lineTo(0, -92); g.stroke();
    K.part(g, -3.6, -100, 7.2, 14, 2, K.pal.steel);
    K.part(g, -5.2, -146, 10.4, 50, 4, [48, 60, 70]);
    g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 0.8; for (var i = 0; i < 7; i++) { g.beginPath(); g.moveTo(-5, -140 + i * 6); g.lineTo(5, -140 + i * 6); g.stroke(); }
    g.restore();
  };

  // عيّنة صخرية. origin = منتصف القاعدة. opts: color [r,g,b], seed (رقم)، vein (لون CSS)
  K.rock = function (g, cx, by, s, o) {
    o = o || {}; var base = o.color || [128, 120, 112], seed = o.seed === undefined ? 3 : o.seed, pts = [], n = 9, i;
    function rnd(k) { var v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); }
    for (i = 0; i < n; i++) { var a = Math.PI + i * TAU / n, r = 30 + rnd(i) * 14; pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.78]); }
    g.save(); g.translate(cx, by - 22); g.scale(s, s);
    K.contactShadow(g, 0, 22, 90, 0.34);
    function blob() { g.beginPath(); g.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
      for (i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } g.closePath(); }
    blob(); var rg = g.createRadialGradient(-14, -14, 3, 0, 0, 52);                                  // الضوء من أعلى اليسار
    rg.addColorStop(0, rgba(shade(base, 1.28), 1)); rg.addColorStop(0.55, rgba(shade(base, 0.96), 1)); rg.addColorStop(1, rgba(shade(base, 0.6), 1));
    g.fillStyle = rg; g.fill(); g.strokeStyle = rgba(shade(base, 0.42), 0.8); g.lineWidth = 1; g.stroke();
    g.save(); blob(); g.clip();
    g.strokeStyle = rgba(shade(base, 0.45), 0.35); g.lineWidth = 1;
    for (i = 0; i < 4; i++) { g.beginPath(); g.moveTo((rnd(i + 30) - 0.5) * 70, (rnd(i + 33) - 0.5) * 40); g.lineTo((rnd(i + 36) - 0.5) * 70, (rnd(i + 39) - 0.5) * 40); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(-12, -14, 16, 7, -0.5, 0, TAU); g.fill();
    g.restore();
    if (o.vein) { g.strokeStyle = o.vein; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[1][0] * 0.9, pts[1][1] * 0.9); g.quadraticCurveTo(2, -4, pts[5][0] * 0.9, pts[5][1] * 0.9); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.1)'; for (i = 0; i < 18; i++) { g.beginPath(); g.arc((rnd(i + 40) - 0.5) * 50, (rnd(i + 60) - 0.5) * 34, 0.9 + rnd(i + 80), 0, TAU); g.fill(); }
    g.restore();
  };

  /* ═════════ سطح الطاولة الموحّد (خلفية + حافة + انعكاس) ═════════ */
  K.bench = function (g, W, H, safeTop, edgeRatio) {
    var er = edgeRatio === undefined ? 0.6 : edgeRatio, ty = safeTop + (H - safeTop) * er;
    g.fillStyle = lg(g, 0, 0, 0, ty, [[0, '#f3f6f8'], [1, '#e6edf1']]); g.fillRect(0, 0, W, ty);                 // الجدار
    g.fillStyle = lg(g, 0, ty, 0, H, [[0, '#dde5ea'], [0.12, '#d3dde3'], [1, '#c6d2d9']]); g.fillRect(0, ty, W, H - ty);   // السطح
    g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(0, ty, W, 2);                                               // لمعة الحافة
    g.fillStyle = lg(g, 0, ty + 2, 0, ty + 22, [[0, 'rgba(31,47,61,.10)'], [1, 'rgba(31,47,61,0)']]); g.fillRect(0, ty + 2, W, 20);
    return ty;
  };

  return K;
})();
/* ===== DRAWKIT:END ===== */
