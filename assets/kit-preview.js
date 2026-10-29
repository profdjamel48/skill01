// أداة معاينة بصرية (للتطوير فقط، ليست جزءاً من المحاكاة): npm i @napi-rs/canvas && node kit-preview.js [مجلد_الإخراج]
// تولّد kit-preview-1.png (الأجهزة الكبيرة) و kit-preview-2.png (الزجاجيات والأدوات). افتحهما وتحقق بصرياً من كل جهاز قبل التسليم.
const fs = require('fs'); const path = require('path'); const { createCanvas } = require('@napi-rs/canvas');
const Kit = new Function(fs.readFileSync(path.join(__dirname, 'draw-kit.js'), 'utf8') + ';return Kit;')();
const outDir = process.argv[2] || process.cwd();

function sheet(name, W, H, draw) {
  const c = createCanvas(W, H), g = c.getContext('2d');
  const ty = Kit.bench(g, W, H, 40, 0.42), by = ty + (H - ty) * 0.72;
  draw(g, by, W, H);
  fs.writeFileSync(path.join(outDir, name), c.toBuffer('image/png')); console.log('ok', name);
}

// الورقة 1: الأجهزة الكبيرة
sheet('kit-preview-1.png', 2000, 620, (g, by) => {
  Kit.microscope(g, 150, by, 1.0, { obj: 1, focus: .6, lamp: true, slide: true, specimen: 'rgba(190,120,170,.8)' });
  Kit.centrifuge(g, 430, by, 1.0, { open: true, tubes: true, angle: .3 });
  Kit.centrifuge(g, 690, by, 1.0, { rpm: '3000', time: '05:00', running: true });
  Kit.incubator(g, 900, by, 1.0, { temp: '37.0', plates: 2 });
  Kit.waterBath(g, 1130, by, 1.0, { temp: '40.0', on: true, steam: .7 });
  Kit.balance(g, 1360, by, 1.0, { value: '12.48' });
  Kit.bunsen(g, 1600, by, 1.0, { flame: 1 });
  Kit.bunsen(g, 1760, by, 1.0, { flame: .8, yellow: true });
  Kit.hotPlate(g, 1920, by, 0.9, { on: true });
});

// الورقة 2: زجاجيات وأدوات
sheet('kit-preview-2.png', 1900, 560, (g, by) => {
  Kit.beaker(g, 70, by, .9, { level: .55 }); Kit.flask(g, 190, by, .9, { level: .5 });
  Kit.graduatedCylinder(g, 290, by, 1.0, { level: .55 });
  Kit.testTube(g, 360, by, .95, { level: .6, color: [210, 60, 70], cap: true });
  const slots = Kit.tubeRack(g, 560, by, 1.0, { n: 4 });
  slots.forEach((sx, i) => Kit.centrifugeTube(g, 560 + sx, by - 14, 1.0, { level: .3 + i * .15, color: [[200, 70, 70], [70, 160, 90], [70, 120, 200], [220, 180, 60]][i], capColor: [[47, 111, 143], [184, 80, 58], [60, 140, 90], [220, 180, 60]][i] }));
  Kit.tubeRack(g, 560, by, 1.0, { n: 4, front: true });
  Kit.microtube(g, 740, by, 1.5, { level: .5 }); Kit.microtube(g, 780, by, 1.5, { open: true, level: .3 });
  Kit.petriDish(g, 900, by, 1.0, { lid: true, lift: 0, colonies: [{ x: -.5, y: -.2 }, { x: .1, y: .3, r: 4 }, { x: .5, y: -.3 }, { x: -.1, y: -.4, r: 2.4 }, { x: .6, y: .35, r: 2.6 }] });
  Kit.petriDish(g, 1060, by, 1.0, { agar: [200, 70, 70], colonies: [{ x: -.3, y: .1 }, { x: .4, y: -.1 }] });
  Kit.watchGlass(g, 1190, by, 1.0, { sample: [120, 90, 60] });
  Kit.funnel(g, 1290, by, 1.0, { paper: true });
  Kit.washBottle(g, 1390, by, 1.0, { level: .6 });
  Kit.bottle(g, 1490, by, 1.0, { label: 'IODE', dropper: true });
  Kit.bottle(g, 1570, by, 1.0, { label: 'NaCl', color: [210, 225, 235], level: .8 });
  Kit.jar(g, 1670, by, 1.0, { label: 'SPEC', specimen: 'rgba(200,120,120,.85)' });
  Kit.thermometer(g, 1760, by, 1.0, { temp: 37 });
  Kit.syringe(g, 1810, by, 1.0, { fill: .5, liquid: [90, 150, 210], needle: true });
  Kit.gradPipette(g, 1860, by, 1.0, { fill: .5, liquid: [90, 150, 210] });
});

// الورقة 3: أدوات التشريح والفحص وبقية الأجهزة
sheet('kit-preview-3.png', 1500, 520, (g, by) => {
  Kit.dissectingTray(g, 200, by + 10, 1.0, { pins: [{ x: -.6, y: -.2 }, { x: .6, y: -.2 }, { x: -.6, y: .5 }, { x: .6, y: .5 }] });
  Kit.scalpel(g, 420, by - 30, 1.2); Kit.forceps(g, 490, by - 30, 1.2, { open: .5 }); Kit.scissors(g, 570, by - 30, 1.2, { open: .5 });
  Kit.dissectingNeedle(g, 650, by - 30, 1.2); Kit.handLens(g, 740, by - 30, 1.2); Kit.inoculatingLoop(g, 840, by - 30, 1.2, { hot: true });
  Kit.stopwatch(g, 940, by, 1.2, { sec: 18 }); Kit.standClamp(g, 1060, by, 1.0); Kit.pHMeter(g, 1250, by, 1.0, { ph: '6.80', dip: .5 });
  Kit.rock(g, 1400, by, 1.3, { seed: 3, vein: 'rgba(240,230,200,.9)' }); Kit.rock(g, 1480, by, 1.0, { seed: 7, color: [150, 100, 80] });
});
