# الأداء والتحجيم والتوافق

---

## 1. الأداء والرسم عند الحاجة

### 1.1 الرسم عند الحاجة (Dirty Rendering)
```javascript
var dirty = true, raf = 0;
function invalidate() { dirty = true; if (!raf) raf = requestAnimationFrame(frame); }
function frame(now) {
  raf = 0;
  var busy = stepAnims(tools, now);                 // تحريكات جارية؟
  if (dirty) { dirty = false; draw(now); }
  if (busy || dirty) invalidate();                  // استمر فقط إن لزم
}
document.addEventListener('visibilitychange', function () { if (!document.hidden) invalidate(); });
```
المحاكاة الساكنة لا تحتاج إلى رسم مستمر؛ تجنب `setInterval` وحلقة `rAF` الدائمة.

### 1.2 طبقات مخزّنة (Offscreen Cache)
خزّن العناصر الثابتة (الطاولة، الأجهزة الكبيرة والعينات الكثيفة) في طبقات offscreen وأعد بناءها عند تغيّر الحجم أو المشهد فقط:
```javascript
function makeLayer(w, h, dpr) {
  var c = document.createElement('canvas');
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  var g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c: c, g: g, w: w, h: h };
}
var layers = {};                                    // مثلاً layers.bench, layers.specimen
function rebuildStaticLayers() {                    // عند resize أو setScene فقط
  layers.bench = makeLayer(W, H, DPR);  paintBench(layers.bench.g);
  layers.specimen = makeLayer(SPEC_W, SPEC_H, 1);   // العينة بدقة مستقلة عن الشاشة
  paintSpecimen(layers.specimen.g);                 // مئات الخلايا هنا مرة واحدة
}
// في كل إطار:
ctx.drawImage(layers.bench.c, 0, 0, W, H);          // سطر واحد بدل آلاف أوامر الرسم
```
* **العينة المتكررة** (خلايا بصل، دم، ورقة): ارسمها مرة في layer بإحداثيات العينة، وللعرض/التكبير استخدم `drawImage` بمستطيل مصدر (قص) ومستطيل وجهة. (انظر optical-instruments.)
* ارسم العنصر الصغير المتكرر مرةً في canvas sprite ثم أعد استخدامه بـ`drawImage`.

### 1.3 ما يُمنع داخل حلقة متكررة
* `shadowBlur` > 0 على كل عنصر (مكلف جداً). ارسم الظل مرة داخل الطبقة المخزّنة.
* `ctx.filter` (انظر القسم 3).
* إنشاء `createLinearGradient/RadialGradient` لكل عنصر كل إطار: أنشئها مرة وأعد استخدامها أو أدخلها في الطبقة.
* قياس النص (`measureText`) كل إطار لنصوص ثابتة.

### 1.4 سقف الدقة وميزانية الإطار
```javascript
DPR = Math.min(window.devicePixelRatio || 1, 2);    // 3x يضاعف التكلفة بلا فائدة تعليمية
```
هدف التصميم: زمن `draw()` أقل من 6ms على جهاز متوسط. قِسه أثناء التطوير بـ `performance.now()`.
احترم `prefers-reduced-motion`: قلّل مدة التحريكات إلى 0–80ms.

---

## 2. تحجيم الأجهزة

عرّف مساحة تصميم (`DESIGN_W × DESIGN_H`) واحسب `U` من المساحة المتاحة أسفل `SAFE_TOP`. كل بُعد تصميمي يُضرب في `U`.

```javascript
var DESIGN_W = 1000, DESIGN_H = 560;                // مساحة التصميم المرجعية للطاولة الفعّالة
function computeScale() {
  var effH = H - SAFE_TOP, effW = W;
  U = clamp(Math.min(effW / DESIGN_W, effH / DESIGN_H), 0.55, 1.25);
}
// مثال: جهاز مجهر مصمَّم بارتفاع 340 وحدة
function scopeScale() { return clamp((H - SAFE_TOP) * 0.92 / 340, 0.5, 1.3); }   // نسبي لارتفاع الطاولة
```
* استخدم مرساة نسبية ثم `translate` و`scale`؛ تأكد أن حدود الجهاز تبقى داخل `[0,W]×[SAFE_TOP,H]`، وصغّره عند الحاجة:
```javascript
function fitInside(w, h, margin) {                  // أكبر معامل يجعل w×h ضمن الطاولة
  return Math.min((W - 2*margin) / w, (H - SAFE_TOP - 2*margin) / h);
}
```
* كبّر أهداف اللمس مع `U` واجعل نصف قطرها 22px على الأقل.
* عند `resize()` أعد حساب التحجيم والتخطيط والطبقات المخزنة.

```javascript
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
else window.addEventListener('resize', resize);
```

---

## 3. التوافق والبدائل

### `ctx.roundRect` (غير موجود في المتصفحات القديمة)
```javascript
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    var a = Array.isArray(r) ? r.slice() : [r];     // [tl,tr,br,bl] أو 1–4 قيم
    if (a.length === 1) a = [a[0], a[0], a[0], a[0]];
    else if (a.length === 2) a = [a[0], a[1], a[0], a[1]];
    else if (a.length === 3) a = [a[0], a[1], a[2], a[1]];
    var m = Math.min(Math.abs(w), Math.abs(h)) / 2;
    var tl = Math.min(a[0] || 0, m), tr = Math.min(a[1] || 0, m),
        br = Math.min(a[2] || 0, m), bl = Math.min(a[3] || 0, m);
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);     this.arcTo(x + w, y,     x + w, y + tr,     tr);
    this.lineTo(x + w, y + h - br); this.arcTo(x + w, y + h, x + w - br, y + h, br);
    this.lineTo(x + bl, y + h);     this.arcTo(x,     y + h, x, y + h - bl,     bl);
    this.lineTo(x, y + tl);         this.arcTo(x,     y,     x + tl, y,         tl);
    this.closePath();
  };
}
```
ضع polyfill في أول السكربت قبل أي رسم؛ تستخدمه أمثلة المراجع.

### `ctx.filter`
لا تعتمد عليه؛ استخدم مستويات تمويه مخزنة عبر التصغير والتكبير (راجع `optical-instruments.md` §4).

### أخرى
* `structuredClone`, `Array.prototype.at`, `?.`/`??`: تجنّبها إن كان الجمهور على أجهزة قديمة؛ استخدم `var` والصياغة التقليدية.
* `100dvh`: يُكتب بعد `100vh` كبديل (موجود في CSS القياسي).
* لا تعتمد على `OffscreenCanvas` (غير شامل)؛ استخدم `document.createElement('canvas')`.
