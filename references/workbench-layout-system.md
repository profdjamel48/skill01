# تخطيط الشريط الجانبي وطاولة العمل

---

## 1. مناطق الأمان

يحتوي `player.html` على شريط علوي (`#bar`) بارتفاع 60–70px وعنوان `#stitle`. اعرض تعليمات جميع الخطوات مباشرةً في قائمة الشريط الجانبي، دون بطاقة منفصلة تكرر الخطوة الحالية. افتح الشريط افتراضياً، واسمح بطيّه دون تعتيم الساحة. ميّز الخطوة الحالية، ومرّر القائمة عند التقدم لإبقاء الحالية والتالية ظاهرتين قدر الإمكان. ضع تلميح الخطأ تحت الخطوة الحالية. اترك منطقتي الأمان التاليتين:

### توضيح الرقمين 64/76 و70 (ليسا تعارضاً)

| | القيمة | يخص | لماذا |
|---|---|---|---|
| `--player-safe-top` | 64px | ارتفاع الشريط المُعتمد | مرجع للشريط الجانبي |
| حشوة الشريط الجانبي | `calc(64px + 12px)` = **76px** | **نصوص** الشريط الجانبي | 12px تنفّس حتى لا يلتصق العنوان بالشريط |
| `--bench-safe-top` / `SAFE_TOP` | **70px** | **أدوات** طاولة العمل | الحد الأعلى لارتفاع الشريط (60–70) |

حشوة النص 76px لحماية العنوان، بينما تمنع منطقة 70px تداخل الأدوات مع الشريط.

---

## 2. التوزيع

```
┌──────────────────────────────────────────────────────┬───────────────────────────┐
│ [ 70px فارغة لشريط player.html — طاولة العمل ]        │ [ 76px حشوة علوية ]       │
├──────────────────────────────────────────────────────┤ الشريط الجانبي (يمين/RTL) │
│          رفوف جدارية منفصلة للأدوات والزجاجيات        │ عرض clamp(260,30vw,320)   │
│          والطاولة تحتل الجزء السفلي من الساحة          │ 1. ترويسة التجربة         │
│          الساحة تتقلص بجانب الشريط المفتوح           │ 2. قائمة التعليمات [✓]   │
│  - عند الطي تستعيد الساحة كامل العرض                 │ ───────────────────────── │
│  - لا تعتيم ولا طبقة حاجبة للساحة                    │ 3. تذييل ثابت: [إعادة] [التقدم] [التالي] │
│  - الشاشات الصغيرة: تنبيه أسود يطلب فتح المحاكاة على الحاسوب │                  │
└──────────────────────────────────────────────────────┴───────────────────────────┘
```
(المحاكاة عربية فقط (`lang="ar"`, `dir="rtl"`)، لذلك يظهر الشريط يميناً. اجعل `<aside>` أول عنصر في الـ DOM.)

---

## 3. CSS القياسي

```css
:root{
  --ink:#1f2f3d; --mut:#4b5b66; --line:#d7dcd9; --acc:#2f6f8f; --warm:#b8503a;
  --ok:#27ae60; --bg:#f5f6f4; --bench:#f0f4f7; --bench-2:#e8eff2; --panel:#fff;
  --sidebar-w:clamp(260px,30vw,320px);
  --player-safe-top:64px;   /* الشريط الجانبي */
  --bench-safe-top:70px;    /* طاولة العمل — يقرؤها JS كـ SAFE_TOP */
}
html,body{margin:0;height:100%;background:var(--bg);color:var(--ink);
  font-family:'IBM Plex Sans Arabic','Montserrat',-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,sans-serif}
#app{display:flex;flex-direction:row;width:100%;height:100vh;height:100dvh;overflow:hidden}

#app.panel-open #bench-stage{margin-right:min(var(--sidebar-w),88vw)}
#sidebar{position:fixed;inset-block:0;right:0;width:min(var(--sidebar-w),88vw);height:100%;
  background:var(--panel);border-inline-end:1px solid var(--line);
  box-shadow:0 0 24px rgba(31,47,61,.12);display:flex;flex-direction:column;z-index:30;
  transform:translateX(105%);visibility:hidden;transition:transform .24s ease,visibility .24s}
#sidebar.open{transform:translateX(0);visibility:visible}
#bench-stage{transition:margin .24s ease}
.sb-head{position:relative;padding:calc(var(--player-safe-top) + 12px) 20px 12px;flex:0 0 auto}
.sb-scroll{direction:ltr;flex:1 1 auto;min-height:0;overflow-y:auto;padding:0 20px;scroll-behavior:smooth}
#steps{direction:rtl}
#steps li.cur{background:#eaf4f8;border-color:#c9e0ea;box-shadow:inset -3px 0 0 var(--acc)}
.step-hint{color:var(--warm);font-size:12px}
.sb-foot{flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:8px 14px 12px;
  border-top:1px solid var(--line);background:var(--panel)}
.icon-btn{width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;
  padding:0;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--mut);cursor:pointer}
.progress{flex:1 1 auto;min-width:0;display:grid;gap:5px}
.progress-label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--mut)}
.progress-track{height:4px;overflow:hidden;border-radius:99px;background:#e8edef}
.progress-fill{height:100%;border-radius:inherit;background:var(--acc);transition:width .2s ease}
.collapse-tab{position:fixed;top:50%;right:min(var(--sidebar-w),88vw);transform:translateY(-50%)}
.panel-toggle{position:fixed;top:50%;right:14px}

#bench-stage{flex:1 1 auto;min-width:0;height:100%;position:relative;background:var(--bench)}
#bench{position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block}

```
يوضع زر الطي على حافة اللوحة، وزر الفتح خارجها، دون تعتيم الساحة. يضمن فصل `.sb-scroll` عن `.sb-foot` بقاء أزرار `#rst` و`#next` ومؤشر التقدم ظاهرة. `#next` ينقل الخطوة الحالية للأمام، ويُعطّل بعد اكتمال القائمة؛ و`#rst` يعيد التجربة كاملة. استهدف `#bench` تحديداً كي لا يتأثر أي canvas مخزّن. عند تغيير حالة الطي، أعد حساب أبعاد الكانفاس.

هذه النسخة للحاسوب فقط: عند عرض ≤800px أو ارتفاع ≤500px أخفِ `#app` وزر فتح الشريط، وأظهر `#desktop-warning` كطبقة سوداء ثابتة تملأ الشاشة بالنص: «هذه المحاكاة مخصصة للشاشات الكبيرة. يرجى فتحها من جهاز حاسوب.»

---

## 4. اللغة والاتجاه

المحاكاة بالعربية فقط. لا تضف `?lang=` أو مبدّل لغة أو قاموس ترجمة؛ ثبّت اللغة والاتجاه على الجذر:

```js
document.documentElement.lang = 'ar';
document.documentElement.dir  = 'rtl';
```
لا يرث Canvas اتجاه الصفحة؛ اضبط `ctx.direction = 'rtl'` و`textAlign` للنص العربي.

---

## 5. تخطيط الرفوف والطاولة

- اجعل الرفوف منفصلة فوق سطح الطاولة، وبطاقات أسمائها مثبتة على واجهة ألواحها لا معلّقة. استخدم دعامات بسيطة واضبط مواضع الرفوف لتناسب مساحة الحاسوب. أسماء البطاقات حرة وتُختار بحسب محتوى كل رف وتجربة؛ لا تفترض فئات ثابتة كالزجاجيات أو المحاليل.
- ارسم الأدوات المطلوبة بأشكال `Kit` الفعلية؛ اجعل الأدوات القابلة للسحب تبدأ على الرف الملائم وتعود إليه، واضبط نقطة ارتكاز كل أداة حتى تستقر قاعدتها فوق سطح اللوح دون أن تتداخل خشبته مع الرسم. توضع العينة أو منطقة العمل على الطاولة. احذف الرفوف أو المحتويات غير اللازمة للتجربة.
- اجعل حافة الطاولة العليا قرب 72% من ارتفاع الساحة، مع واجهة أمامية رفيعة وتدرج ظل خفيف. احتفظ بألوان الهوية الباردة وطبّق اللمسات على طبقة الخلفية بعد `Kit.bench` بدلاً من تعديل كتلة `Kit`.
- اجعل الرفوف والخلفية طبقة ثابتة يعاد بناؤها عند التحجيم، ولا تدخلها في مسارات السحب أو hit-testing.

## 6. مراعاة SAFE_TOP في الكانفاس

```js
var SAFE_TOP = parseFloat(getComputedStyle(document.documentElement)
                 .getPropertyValue('--bench-safe-top')) || 70;   // مصدر واحد للرقم

function layout(){                 // يُستدعى من resize()
  bench.edgeY = Math.max(SAFE_TOP, H * 0.72);
  bench.rackY = Math.max(SAFE_TOP + 80, bench.edgeY - 210);
}
```
وكل سحب يُحصَر: `y >= SAFE_TOP + r` حتى لا تُسحب أداة تحت الشريط.
