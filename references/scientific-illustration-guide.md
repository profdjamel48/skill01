# دليل الرسم العلمي

استخدم رسوماً علمية واضحة، ولا ترسم أعضاء أو أطرافاً معلقة أو مقطوعة.

---

## 1. القاعدة الذهبية: حظر الأطراف المعلقة في الفراغ (Zero Disembodied Limbs)

يُمنع رسم يد كفاعل يمسك الأداة؛ تتبع الأداة المؤشر. يجوز رسم يد المريض كموضوع ثابت إذا كانت مستندة على وسادة.

* لا ترسم يداً أو إصبعاً أو قدماً مقطوعة أو عائمة.
* عند الحاجة إلى يد للفحص الطبي:
  1. **الاستناد الطبي الواقعي (Medical Resting Posture):**
     - ارسم اليد أو الساعد بوضع طبيعي على وسادة فحص فوق الطاولة.
     - استخدم تدرجات بشرة طبيعية، تفاصيل خفيفة للظفر والمفاصل، وظلاً يثبت اليد على الوسادة.
  2. **التركيز البؤري الدقيق (Macrophotography Zoom Frame):**
     - يمكن تكبير موضع الفحص داخل إطار دائري أو مستطيل مع وسم توضيحي.

---

## 2. الأجهزة الطبية والمخبرية

استخدم طبقات وتفاصيل واقعية، لا مستطيلات مسطحة:

### جهاز قياس السكر (Glucometer):
- **الهيكل الخارجي:** هيكل ذو زوايا منحنية بلون كحلي فاحم أو رصاصي طبي معتم (`#2c3e50`) وظلال داخلية.
- **الشاشة الرقمية (LCD Display):**
  - خلفية الشاشة رمادية خضراء فاتحة محاكاة لشاشات الكريستال السائل (`#8b9d83` أو `#a4b59d`).
  - حدود الشاشة ذات شطفات ناعمة (Beveled edges).
  - الأرقام بخط رقمي دقيق ذو تباين عالٍ (`#1a2518`).
- **منفذ الشريط (Strip Slot):** شق دقيق وواضح في الأعلى أو الأسفل، تتوهج حوافه عند اقتراب الشريط منه.

### جهاز الوخز الآلي (Lancet Device):
- قلم أنيق أسطواني بتدرجات معدنية أو بلاستيكية طبية (`#ecf0f1` مع لمعان أبيض).
- زر إطلاق ملون بلون مميز في المنتصف، مع تدريج رقمي دقيق لعمق الوخز.

### قطرة الدم والمسحة (Blood Droplet & Swab):
- **قطرة الدم:** شكل بيضاوي دمعي أحمر ياقوتي غني متدرج (`#c0392b` إلى `#962d22`) مع نقطة لمعان بيضاء صغيرة في الزاوية العلوية (`#ffffff`) تمنحها بعداً ثلاثي الأبعاد واقعياً فورياً.
- **قطنة الكحول:** وسادة قطنية ناعمة بحواف منقطة وظل ناعم خفيف يوحي بالملمس القطني.

---

## 3. مثال Canvas: يد مستندة على وسادة

> أضف polyfill لـ`ctx.roundRect` (راجع `performance-and-scaling.md` §3)، وخزّن الرسم في طبقة لأنه ثابت.

```javascript
// رسم يد على وسادة فحص
function drawRestingHandOnMat(ctx, cx, cy) {
  ctx.save();
  
  // وسادة الفحص
  const matW = 340, matH = 130;
  ctx.fillStyle = '#d4e6f1';
  ctx.beginPath();
  ctx.roundRect(cx - matW / 2, cy - matH / 2, matW, matH, 16);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#a9cce3';
  ctx.stroke();

  // خياطة الوسادة
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#7fb3d5';
  ctx.beginPath();
  ctx.roundRect(cx - matW / 2 + 6, cy - matH / 2 + 6, matW - 12, matH - 12, 12);
  ctx.stroke();
  ctx.setLineDash([]);

  // ظل اليد
  ctx.fillStyle = 'rgba(41, 128, 185, 0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 28, 120, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // الساعد واليد
  ctx.fillStyle = '#e8beac';
  ctx.beginPath();
  // المعصم والساعد
  ctx.moveTo(cx - 140, cy + 30);
  ctx.lineTo(cx - 60, cy + 25);
  // راحة اليد
  ctx.bezierCurveTo(cx - 20, cy + 25, cx, cy + 20, cx + 30, cy + 15);
  // السبابة
  ctx.lineTo(cx + 95, cy + 12);
  ctx.bezierCurveTo(cx + 112, cy + 12, cx + 112, cy - 8, cx + 95, cy - 8);
  ctx.lineTo(cx + 35, cy - 8);
  // الأصابع الأخرى
  ctx.bezierCurveTo(cx + 20, cy - 18, cx - 10, cy - 20, cx - 40, cy - 15);
  ctx.lineTo(cx - 140, cy - 10);
  ctx.closePath();
  ctx.fill();

  // حدود اليد
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = '#cb9b88';
  ctx.stroke();

  // 4. رسم ظفر السبابة
  ctx.fillStyle = 'rgba(255, 235, 230, 0.75)';
  ctx.beginPath();
  ctx.roundRect(cx + 82, cy - 5, 14, 14, [2, 5, 5, 2]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200, 150, 135, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // خطوط مفاصل الأصابع الخفيفة
  ctx.strokeStyle = 'rgba(180, 130, 115, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx + 45, cy - 2);
  ctx.lineTo(cx + 45, cy + 6);
  ctx.stroke();

  ctx.restore();
}
```

---

## 4. قطرة دم متدرجة

قطرة بطرف مدبب وتدرج ولمعة:

```javascript
// الطرف المدبب للأعلى؛ radius بوحدات تصميمية × U
function drawBloodDroplet(ctx, x, y, radius) {
  var r = radius || 7;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.7);                               // الطرف
  ctx.bezierCurveTo(r * 0.25, -r * 1.0, r, -r * 0.45, r, r * 0.25);
  ctx.arc(0, r * 0.25, r, 0, Math.PI, false);            // القاع المستدير
  ctx.bezierCurveTo(-r, -r * 0.45, -r * 0.25, -r * 1.0, 0, -r * 1.7);
  ctx.closePath();
  var g = ctx.createRadialGradient(-r * 0.3, -r * 0.1, r * 0.1, 0, r * 0.2, r * 1.2);
  g.addColorStop(0, '#e74c3c'); g.addColorStop(0.7, '#c0392b'); g.addColorStop(1, '#781e14');
  ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)';               // لمعة
  ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.05, r * 0.18, r * 0.3, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
```

---

## 5. اللون والأداء
1. استخدم تدرجات ضوئية للأسطح، لا لوناً مصمتاً واحداً.
2. أضف ظلالاً للأجسام المستندة أو المرتفعة، ولا تستخدم `shadowBlur` في الحلقات؛ خزّن الظلال الثابتة (راجع `performance-and-scaling.md` §1).
3. أعد استخدام التدرجات أو ارسمها في طبقة مخزنة بدلاً من إنشائها لكل عنصر كل إطار.
4. اجعل السائل أفتح في الوسط وأغمق قرب جدار الوعاء.
