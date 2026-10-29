# المجهر والأجهزة البصرية

استخدم هذا المرجع للمجهر والمنظار والعدسة المكبّرة. يغطي مجال الرؤية والبؤرة وبرج العدسات.

افصل المشهدين التاليين (راجع `interaction-patterns.md` §3):

| المشهد | ظاهر | مخفي |
|---|---|---|
| `bench` (الطاولة) | المجهر، الشريحة، الأدوات، البصلة/العينة الخام | لوحة مجال الرؤية |
| `eyepiece` (العدسة العينية) | لوحة مجال الرؤية الدائرية، مفاتيح البؤرة، برج العدسات (مصغّراً) | **العينة الخام والأدوات** (لا تبقَ خلف اللوحة ولا تستقبل لمساً) |

---

## 1. نموذج التكبير ومجال الرؤية

```javascript
var OCULAR = 10;                 // تكبير العينية
var FIELD_NUMBER = 18;           // رقم المجال (مم) نموذجي للعينية 10x
var OBJ = [ {m:4, ang:0}, {m:10, ang:Math.PI/2}, {m:40, ang:Math.PI}, {m:100, ang:3*Math.PI/2} ];

function totalMag(o)  { return o.m * OCULAR; }                 // 4x → 40x ... 100x → 1000x
function fovMM(o)     { return FIELD_NUMBER / o.m; }           // قطر مجال الرؤية = رقم المجال ÷ تكبير الشيئية
function umPerPx(o, R){ return (fovMM(o) * 1000) / (2 * R); }  // R = نصف قطر دائرة المجال بالبكسل
function depthTol(o)  { return 1.2 / o.m; }                    // عمق المجال: يضيق كلما زاد التكبير (4x→0.30 … 100x→0.012)
```
* بزيادة التكبير يصغر المجال وتظهر خلايا أقل وأكبر.
* اختيارياً، اعكس الصورة 180°: تحريك الشريحة يحرّك الصورة بالاتجاه المعاكس.

---

## 2. بيانات العينة

خزّن الخلايا كبيانات (موضع وحجم ونوع بالميكرومتر)، وارسم ما يقع داخل مجال الرؤية فقط.

```javascript
var specimen = { w: 3000, h: 2000, cells: [] };   // µm
(function seed(rng) {                              // rng حتمي (seeded) ليتكرر المشهد نفسه
  for (var y = 0; y < specimen.h; y += 90)
    for (var x = 0; x < specimen.w; x += 220) {
      specimen.cells.push({ x: x + rng()*14, y: y + rng()*10, w: 200, h: 80, nuc: rng() });
    }
})(mulberry32(7));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
```

---

## 3. رسم المجال

```javascript
var field = { R: 0, c: null, g: null, blur: [], dirty: true };
var view  = { cx: 1500, cy: 1000, obj: OBJ[0], focus: 0.2, best: 0.5 };   // الموضع بالميكرومتر

function ensureField(R) {
  if (field.R === R && field.c) return;
  field.R = R; field.c = document.createElement('canvas');
  field.c.width = field.c.height = 2 * R; field.g = field.c.getContext('2d'); field.dirty = true;
}
function renderField() {                           // يرسم الخلايا داخل النافذة فقط
  var g = field.g, R = field.R, s = umPerPx(view.obj, R);
  var x0 = view.cx - R * s, y0 = view.cy - R * s, x1 = view.cx + R * s, y1 = view.cy + R * s;
  g.clearRect(0, 0, 2*R, 2*R);
  g.fillStyle = '#f7f3ea'; g.fillRect(0, 0, 2*R, 2*R);              // خلفية الضوء
  specimen.cells.forEach(function (c) {
    if (c.x + c.w < x0 || c.x > x1 || c.y + c.h < y0 || c.y > y1) return;   // قصّ: لا ترسم ما خارج المجال
    var px = (c.x - x0) / s, py = (c.y - y0) / s, pw = c.w / s, ph = c.h / s;
    g.fillStyle = 'rgba(214,170,196,.45)'; g.strokeStyle = 'rgba(120,70,110,.8)'; g.lineWidth = Math.max(1, 1.4 / s * 4);
    g.beginPath(); g.roundRect(px, py, pw, ph, Math.min(4, pw * .08)); g.fill(); g.stroke();
    if (pw > 14) { g.fillStyle = 'rgba(90,40,110,.65)'; g.beginPath();
      g.ellipse(px + pw*.5, py + ph*.5, pw*.07, ph*.16, 0, 0, 6.2832); g.fill(); }   // النواة تظهر عند التكبير
  });
  field.blur = makeBlurLevels(field.c);            // §4
  field.dirty = false;
}
```
أعد الرسم عند تغيّر التكبير أو موضع الشريحة فقط، لا في كل إطار.

---

## 4. البؤرة دون `ctx.filter`

أنشئ مستويات تمويه مخزّنة بالتصغير والتكبير، وامزج مستويين حسب بُعد البؤرة عن موضعها الأمثل.

```javascript
function makeBlurLevels(src) {
  var size = src.width, out = [src];
  [2, 4, 8].forEach(function (k) {
    var s = Math.max(2, Math.round(size / k));
    var a = document.createElement('canvas'); a.width = a.height = s;
    var ag = a.getContext('2d'); ag.imageSmoothingEnabled = true; ag.imageSmoothingQuality = 'high';
    ag.drawImage(src, 0, 0, s, s);
    var b = document.createElement('canvas'); b.width = b.height = size;
    var bg = b.getContext('2d'); bg.imageSmoothingEnabled = true; bg.imageSmoothingQuality = 'high';
    bg.drawImage(a, 0, 0, size, size);
    out.push(b);
  });
  return out;                                       // حاد ثم مستويات تمويه
}

function drawField(ctx, cx, cy) {                   // كل إطار: عمليتا drawImage فقط
  if (field.dirty) renderField();
  var d = Math.abs(view.focus - view.best) / depthTol(view.obj);   // 0 = حاد تماماً
  var t = Math.min(1, d) * (field.blur.length - 1);
  var i = Math.floor(t), f = t - i, R = field.R;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.clip();   // قناع مجال الرؤية الدائري
  ctx.drawImage(field.blur[i], cx - R, cy - R);
  if (f > 0 && field.blur[i + 1]) { ctx.globalAlpha = f; ctx.drawImage(field.blur[i + 1], cx - R, cy - R); }
  ctx.restore();
  drawFieldMask(ctx, cx, cy, R);                    // §5
}
```
* غيّر `view.best` قليلاً بين العدسات؛ بعد تبديلها يحتاج المتعلم إلى ضبط دقيق فقط.
* استخدم حلقتي ضبط خشنة (`pxPerUnit` أصغر) ودقيقة (`pxPerUnit` أكبر) مع `bindAxial`.
* لا تُكمل خطوة البؤرة حتى يبقى `|focus - best| < depthTol * 0.25` مدة محددة.

---

## 5. قناع المجال ومقياس الرسم

```javascript
function drawFieldMask(ctx, cx, cy, R) {
  var g = ctx.createRadialGradient(cx, cy, R * .86, cx, cy, R);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');     // تعتيم الحواف (vignette)
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = '#1b2530'; ctx.stroke(); ctx.restore();
  var s = umPerPx(view.obj, R), bar = niceBar(s, R * .35), px = bar / s;         // شريط مقياس بالميكرومتر
  ctx.fillStyle = '#fff'; ctx.fillRect(cx + R*.55 - px, cy + R*.82, px, 4);
  ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(bar + ' µm', cx + R*.55 - px/2, cy + R*.82 - 6);
}
function niceBar(umPerPx, targetPx) {
  var raw = umPerPx * targetPx, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
  return (m < 2 ? 1 : m < 5 ? 2 : 5) * p;
}
```
خلال دوران برج العدسات بين نقطتي توقف: اجعل المجال أسود (`ctx.fillStyle='#000'`) ولا ترسم العينة، وعند الاستقرار على عدسة اضبط `view.obj` وضع `field.dirty = true`.

---

## 6. رسم المجهر وتحجيمه

* استخدم `Kit.microscope(g, cx, baseY, s, {obj, focus, lamp, slide, specimen})`. `obj` يحدد العدسة المتقدمة (0=4x، 1=10x، 2=40x)، و`focus` (0..1) يضبط المنصة والمقبض.

* استخدم `scopeScale()` و`fitInside` من `performance-and-scaling.md` §2.
* اربط برج العدسات بـ`bindRotary` بأربع نقاط توقف؛ الشريحة هي الأداة المسحوبة.
* اسحب داخل المجال لتحريك `view.cx/cy` ضمن حدود العينة، ثم علّم المجال متسخاً واستدعِ `invalidate()`.
