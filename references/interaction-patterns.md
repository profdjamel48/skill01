# أنماط التفاعل

يوضح هذا المرجع جيوب الاستقرار والسحب والمشاهد والدوّارات/المنزلقات وآلة الحالة.

تستقر الأدوات في جيوب على الطاولة فوق `SAFE_TOP`، لا في شريط سفلي.

الإحداثيات بوحدات CSS px لأن canvas مضبوط بـ`ctx.setTransform(DPR,0,0,DPR,0,0)`؛ لا تضرب إحداثيات المؤشر بـDPR.

---

## 1. جيوب الاستقرار وإرجاع الأداة

```javascript
function layoutTools(tools, W, H, SAFE_TOP, U) {
  var y = SAFE_TOP + (H - SAFE_TOP) * 0.78;       // صف الأدوات على الطاولة
  var gap = W / (tools.length + 1);
  tools.forEach(function (t, i) {
    t.slotX = gap * (i + 1);
    t.slotY = y;
    t.r = t.baseR * U;                              // نصف قطر اللمس يتحجّم
    if (!t.dragging && !t.anim) { t.x = t.slotX; t.y = t.slotY; }
  });
}

// تُدار العودة السلسة من حلقة الرسم المشتركة.
function sendHome(t) {
  t.anim = { fx: t.x, fy: t.y, t0: performance.now(), dur: 280 };
}
function stepAnims(tools, now) {                    // يُستدعى كل إطار؛ يُرجع true إن بقي تحريك
  var busy = false;
  tools.forEach(function (t) {
    if (!t.anim) return;
    var k = Math.min(1, (now - t.anim.t0) / t.anim.dur), e = 1 - Math.pow(1 - k, 3);
    t.x = t.anim.fx + (t.slotX - t.anim.fx) * e;
    t.y = t.anim.fy + (t.slotY - t.anim.fy) * e;
    if (k >= 1) { t.x = t.slotX; t.y = t.slotY; t.anim = null; } else busy = true;
  });
  return busy;
}
```

---

## 2. السحب (مؤشر واحد وحصر داخل الطاولة)

```javascript
var activeId = null, active = null, off = {x:0, y:0};

function pt(e) {                                    // إحداثيات CSS داخل canvas
  var r = cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

cv.addEventListener('pointerdown', function (e) {
  if (activeId !== null) return;                    // تجاهل اللمسة الثانية
  var p = pt(e);
  for (var i = tools.length - 1; i >= 0; i--) {
    var t = tools[i];
    if (!isVisible(t) || t.anim) continue;          // مهم: لا لمس لعنصر مخفي (القسم 3)
    if (Math.hypot(p.x - t.x, p.y - t.y) <= t.r) {
      active = t; activeId = e.pointerId; t.dragging = true;
      off.x = p.x - t.x; off.y = p.y - t.y;
      cv.setPointerCapture(e.pointerId);
      invalidate(); return;
    }
  }
});

cv.addEventListener('pointermove', function (e) {
  if (!active || e.pointerId !== activeId) return;
  var p = pt(e);
  active.x = clamp(p.x - off.x, active.r, W - active.r);
  active.y = clamp(p.y - off.y, SAFE_TOP + active.r, H - active.r);   // لا تحت شريط المشغّل
  targets.forEach(function (g) {
    g.hover = isVisible(g) && g.accepts === active.id &&
              Math.hypot(active.x - g.x(), active.y - g.y()) <= g.r();
  });
  invalidate();
});

function endDrag(e, cancel) {
  if (!active || e.pointerId !== activeId) return;
  var t = active, hit = null;
  active = null; activeId = null; t.dragging = false;
  try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
  targets.forEach(function (g) { if (g.hover && !cancel) hit = g; g.hover = false; });
  if (!(hit && onDrop(t, hit))) sendHome(t);        // خطأ أو فراغ = عودة
  invalidate();
}
cv.addEventListener('pointerup',     function (e) { endDrag(e, false); });
cv.addEventListener('pointercancel', function (e) { endDrag(e, true);  });
```

---

## 3. المشاهد والظهور

عرّف لكل أداة وهدف وعنصر تحكم ورسم `scenes` أو `visible()`. استخدم الشرط نفسه للرسم واللمس والتمرير، كي لا تتفاعل العناصر المخفية:

```javascript
var state = { scene: 'bench' };

function isVisible(o) {
  if (o.visible) return !!o.visible(state);
  return !o.scenes || o.scenes.indexOf(state.scene) !== -1;
}

function setScene(name) {
  if (state.scene === name) return;
  state.scene = name;
  if (active) { active.dragging = false; sendHome(active); active = null; activeId = null; }  // أنهِ أي سحب
  targets.forEach(function (g) { g.hover = false; });
  rebuildStaticLayers();                            // طبقات offscreen تعتمد على المشهد
  invalidate();
}

function draw() {
  clearAndDrawBench();
  drawables.forEach(function (o) { if (isVisible(o)) o.draw(ctx, o); });   // ترتيب z ثابت
}
```
العنصر الذي تغطيه لوحة يجب إخفاؤه منطقياً، لا الاكتفاء برسم اللوحة فوقه.

---

## 4. الدوّارات والمنزلقات

لا تسحبها كأدوات؛ اربطها بتدوير حول مركز أو حركة على محور:

### 4.1 دوّار بنقاط توقف

```javascript
// ctrl = { cx(), cy(), r(), inner(), value, detents:[…rad], continuous, onChange(v) }
function bindRotary(ctrl) {
  var drag = null;
  function ang(p) { return Math.atan2(p.y - ctrl.cy(), p.x - ctrl.cx()); }
  function wrap(a) { while (a > Math.PI) a -= 2*Math.PI; while (a < -Math.PI) a += 2*Math.PI; return a; }

  cv.addEventListener('pointerdown', function (e) {
    if (activeId !== null || !isVisible(ctrl)) return;
    var p = pt(e), d = Math.hypot(p.x - ctrl.cx(), p.y - ctrl.cy());
    if (d > ctrl.r() || d < ctrl.inner()) return;   // حلقة فقط
    drag = { id: e.pointerId, a0: ang(p), v0: ctrl.value };
    activeId = e.pointerId; cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = wrap(ang(pt(e)) - drag.a0);             // فرق الزاوية مفكوك اللف
    ctrl.value = drag.v0 + d;                        // لا قفزة عند عبور ±π
    ctrl.onChange(ctrl.value); invalidate();
  });
  function end(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null; activeId = null;
    try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
    if (!ctrl.continuous) snapToDetent(ctrl);       // الانزلاق للنقطة الأقرب بتحريك سلس
  }
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}
function snapToDetent(c) {
  var best = c.detents[0];
  c.detents.forEach(function (d) { if (Math.abs(d - c.value) < Math.abs(best - c.value)) best = d; });
  c.value = best; c.onChange(best, true);           // true = استقر (عندها فقط تُنجَز الخطوة)
  invalidate();
}
```
**برج العدسات:** `detents` = زوايا العدسات (مثلاً 0، 90°، 180°، 270°). لا تُنجَز خطوة «اختر العدسة 40x» إلا عند الاستقرار (`settled === true`) وليس أثناء الدوران.

### 4.2 منزلق محوري للبؤرة الخشنة/الدقيقة

```javascript
function bindAxial(ctrl) {                           // ctrl = { hit(p), min, max, pxPerUnit, value, onChange }
  var d = null;
  cv.addEventListener('pointerdown', function (e) {
    if (activeId !== null || !isVisible(ctrl) || !ctrl.hit(pt(e))) return;
    d = { id: e.pointerId, y0: pt(e).y, v0: ctrl.value }; activeId = e.pointerId;
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', function (e) {
    if (!d || e.pointerId !== d.id) return;
    ctrl.value = clamp(d.v0 + (d.y0 - pt(e).y) / ctrl.pxPerUnit, ctrl.min, ctrl.max);
    ctrl.onChange(ctrl.value); invalidate();
  });
  function end(e) { if (d && e.pointerId === d.id) { d = null; activeId = null; } }
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
}
```
* اجعل `pxPerUnit` أكبر للحلقة **الدقيقة** منه للخشنة.
* إتاحة الوصول: اجعل `cv.tabIndex = 0` واربط ←/→ و↑/↓ بنفس `onChange` كبديل للوحة المفاتيح.
* في مؤشر الفأرة أضف عجلة التمرير على الحلقة (`wheel` مع `preventDefault`)، واكتفِ بـ `{passive:false}`.

---

## 5. آلة الحالة والتلميح

```javascript
function Workflow(steps, ui) {
  this.steps = steps; this.i = 0; this.ui = ui;      // ui = { onStep(step,done), onReject(hintKey) }
}
Workflow.prototype.cur  = function () { return this.steps[this.i]; };
Workflow.prototype.done = function () { return this.i >= this.steps.length; };
Workflow.prototype.try  = function (key) {
  var c = this.cur();
  if (c && c.key === key) { this.i++; this.ui.onStep(this.cur(), this.done()); return true; }
  if (c) this.ui.onReject(c.hintWrong || 'wrong'); // تلميح هادئ تحت تعليمات الخطوة الحالية
  return false;
};
Workflow.prototype.reset = function () { this.i = 0; this.ui.onStep(this.cur(), false); };
```
* اعرض تعليمات جميع الخطوات مباشرةً في القائمة؛ ميّز الخطوة الحالية بـ`aria-current="step"` وخلفية مختلفة، ومرّر القائمة عند التقدم لإبقاء الحالية والتالية ظاهرتين قدر الإمكان.
* لا تكرر التعليمات في بطاقة منفصلة. أدرج تلميح الرفض تحت نص الخطوة الحالية، وأظهر رسالة الإكمال بعد القائمة.
* الشريط الجانبي مفتوح افتراضياً وقابل للطي دون تعتيم الساحة؛ عند الطي تتسع الساحة، وعلى الهاتف يصبح الشريط درجاً سفلياً. أعد قياس الكانفاس عند التبديل.
* تذييل ثابت: `#next` ينقل إلى الخطوة التالية ويحدّث التقدم، ويُعطّل عند اكتمال القائمة؛ `#rst` يعيد **كل** الحالة: الخطوات، المشهد، مواضع الأدوات، قيم الدوّارات/المنزلقات، البؤرة، والطبقات المخزّنة.
