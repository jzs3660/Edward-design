#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {renderSystemPreview} from './lib/render-system-preview.mjs';
import {renderShowcasePreview} from './lib/render-showcase-preview.mjs';

const root=process.cwd();
const outputDir=path.join(root,'output/readme-preview');
const previewDir=path.join(root,'assets/previews');

async function importPackage(name){
  const require=createRequire(import.meta.url);
  const resolved=require.resolve(name,{paths:[process.env.RUNTIME_NODE_MODULES,path.resolve('node_modules')].filter(Boolean)});
  return import(pathToFileURL(resolved).href);
}

async function browserExecutable(){
  for(const candidate of [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium'].filter(Boolean)){
    if(await fs.access(candidate).then(()=>true).catch(()=>false))return candidate;
  }
  return undefined;
}

const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const toTitle=value=>String(value).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ').replace(/^./,char=>char.toUpperCase());

function splitGradientParts(value){
  const parts=[];let depth=0,start=0;
  for(let i=0;i<value.length;i++){
    if(value[i]==='(')depth++;
    else if(value[i]===')')depth--;
    else if(value[i]===','&&depth===0){parts.push(value.slice(start,i).trim());start=i+1;}
  }
  parts.push(value.slice(start).trim());return parts;
}
function parseColor(value){
  if(/^#[0-9a-f]{6}$/i.test(value))return [parseInt(value.slice(1,3),16),parseInt(value.slice(3,5),16),parseInt(value.slice(5,7),16),1];
  const rgba=value.match(/^rgba?\(([^)]+)\)$/i);
  if(!rgba)throw new Error(`Unsupported gradient color: ${value}`);
  const parts=rgba[1].split(',').map(part=>Number(part.trim()));return [parts[0],parts[1],parts[2],parts[3]??1];
}
async function gradientDataUrl(sharp,css){
  const inner=css.replace(/^linear-gradient\(/,'').replace(/\)$/,'');
  const parts=splitGradientParts(inner);
  if(/deg$/.test(parts[0]))parts.shift();
  const stops=parts.map((part,index,array)=>{
    const match=part.match(/^(rgba?\([^)]+\)|#[0-9a-f]{6})(?:\s+([0-9.]+)%?)?$/i);
    if(!match)throw new Error(`Unsupported gradient stop: ${part}`);
    return {color:parseColor(match[1]),position:match[2]===undefined?index/(array.length-1):Number(match[2])/100};
  });
  const width=720,height=60,raw=Buffer.alloc(width*height*4);
  for(let x=0;x<width;x++){
    const position=x/(width-1);let left=stops[0],right=stops.at(-1);
    for(let i=0;i<stops.length-1;i++)if(position>=stops[i].position&&position<=stops[i+1].position){left=stops[i];right=stops[i+1];break;}
    const span=Math.max(.00001,right.position-left.position),mix=Math.max(0,Math.min(1,(position-left.position)/span));
    const channels=left.color.map((value,index)=>value+(right.color[index]-value)*mix);
    const alpha=channels[3],rgb=channels.slice(0,3).map(channel=>Math.round(channel*alpha+255*(1-alpha)));
    for(let y=0;y<height;y++){const offset=(y*width+x)*4;raw[offset]=rgb[0];raw[offset+1]=rgb[1];raw[offset+2]=rgb[2];raw[offset+3]=255;}
  }
  const png=await sharp(raw,{raw:{width,height,channels:4}}).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}
async function screenshotNames(relativeDir){
  const absolute=path.join(root,relativeDir);
  const files=(await fs.readdir(absolute)).filter(name=>/^slide-\d+\.png$/.test(name)).sort();
  if(files.length!==9)throw new Error(`${relativeDir} must contain exactly 9 slide screenshots; received ${files.length}.`);
  return files.map(name=>`../${relativeDir.replace(/^output\//,'')}/${name}`);
}

const [tokens,components,fontManifest,iconManifest,backgroundManifest,enSlides,zhSlides]=await Promise.all([
  fs.readFile(path.join(root,'assets/tokens/tokens.json'),'utf8').then(JSON.parse),
  fs.readFile(path.join(root,'assets/components/registry.json'),'utf8').then(JSON.parse),
  fs.readFile(path.join(root,'assets/fonts/manifest.json'),'utf8').then(JSON.parse),
  fs.readFile(path.join(root,'assets/icons/manifest.json'),'utf8').then(JSON.parse),
  fs.readFile(path.join(root,'assets/backgrounds/manifest.json'),'utf8').then(JSON.parse),
  screenshotNames('output/example-en/qa'),
  screenshotNames('output/example-zh/qa')
]);

const colors=Object.entries(tokens.color);
const gradients=Object.entries(tokens.gradients);
const layouts=Object.entries(components.layouts);
const componentCount=Object.keys(components.components).length;
const stats=[
  [String(layouts.length).padStart(2,'0'),'layouts'],
  [String(componentCount).padStart(2,'0'),'components'],
  [String(backgroundManifest.treatments.length).padStart(2,'0'),'backgrounds'],
  [String(colors.length).padStart(2,'0'),'base colors'],
  [String(gradients.length).padStart(2,'0'),'gradients'],
  [String(fontManifest.families.length).padStart(2,'0'),'font families'],
  [String(iconManifest.icons.length).padStart(2,'0'),'curated icons'],
  ['02','languages']
];

function slideGrid(slides,language,title,description){
  return `<section class="showcase" id="showcase-${language}">
    <header class="showcase-head">
      <div><span class="eyebrow">${language==='en'?'ENGLISH SYSTEM':'中文系统'} · 9 SLIDES</span><h2>${escapeHtml(title)}</h2></div>
      <p>${escapeHtml(description)}</p>
    </header>
    <div class="showcase-grid">${slides.map((src,index)=>`<figure><img src="${src}" alt=""><figcaption>${String(index+1).padStart(2,'0')}</figcaption></figure>`).join('')}</div>
  </section>`;
}

const colorHtml=colors.map(([name,value])=>`<div class="swatch"><span style="background:${value}"></span><b>${escapeHtml(toTitle(name))}</b><code>${escapeHtml(value)}</code></div>`).join('');
const sharpModule=await importPackage('sharp');
const sharp=sharpModule.default||sharpModule;
const canvasModule=await importPackage('@napi-rs/canvas');
const gradientImages=await Promise.all(gradients.map(([,value])=>gradientDataUrl(sharp,value)));
const gradientHtml=gradients.map(([name],index)=>`<div class="gradient"><span><img src="${gradientImages[index]}" alt=""></span><b>${escapeHtml(toTitle(name))}</b></div>`).join('');
const layoutHtml=layouts.map(([name,value])=>{
  const counts=value.counts?.join(' / ')||'—';
  const themes=value.themes?.map(theme=>toTitle(theme)).join(' + ')||'—';
  const extras=[value.callout?'Callout':'',value.media?'Media':'',value.image?'Image':''].filter(Boolean).join(' · ')||'Core';
  return `<tr><th>${escapeHtml(toTitle(name))}</th><td>${escapeHtml(counts)}</td><td>${escapeHtml(themes)}</td><td>${escapeHtml(extras)}</td></tr>`;
}).join('');

const html=`<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Outfit;src:url('../../assets/fonts/outfit/Outfit-VariableFont_wght.ttf')}@font-face{font-family:NotoSans;src:url('../../assets/fonts/noto-sans/NotoSans-Variable.ttf')}@font-face{font-family:Instrument;src:url('../../assets/fonts/instrument-serif/InstrumentSerif-Italic.ttf');font-style:italic}@font-face{font-family:Smiley;src:url('../../assets/fonts/smiley-sans/SmileySans-Oblique.ttf')}@font-face{font-family:NotoSansSC;src:url('../../assets/fonts/noto-sans-sc/NotoSansSC-Variable.ttf')}@font-face{font-family:NotoSerifSC;src:url('../../assets/fonts/noto-serif-sc/NotoSerifCJKsc-Bold.otf');font-weight:700}
*{box-sizing:border-box}html,body{margin:0;background:#08070c;color:#111114;font-family:NotoSans,Arial,sans-serif}body{width:2200px;padding:80px 0}.capture{position:relative;margin:0 0 80px;overflow:hidden}.eyebrow{display:inline-block;color:#43eee2;font-size:17px;font-weight:650;letter-spacing:.08em;text-transform:uppercase}.hero{width:1920px;height:1080px;margin-left:140px;border-radius:26px;background:#0c0b11 url('../../assets/backgrounds/dark-elements-cover.png') center/cover;color:#fff;box-shadow:0 34px 90px #0008}.hero:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(12,11,17,.98) 0%,rgba(12,11,17,.92) 39%,rgba(12,11,17,.38) 69%,rgba(12,11,17,.18) 100%)}.hero-top{position:absolute;z-index:2;left:100px;right:100px;top:70px;display:flex;justify-content:space-between;align-items:center;font-family:Outfit}.hero-brand{font-size:23px}.hero-brand span{margin-left:7px;padding:3px 8px;border-radius:6px;background:linear-gradient(90deg,#9a8bff,#48ede4);color:#15131b}.hero-version{font-size:17px;color:#a9fffa;letter-spacing:.06em}.hero-copy{position:absolute;z-index:2;left:100px;top:206px;width:690px}.hero h1{font:400 103px/1.02 Outfit;margin:22px 0 28px;letter-spacing:-.04em}.hero h1 em{font-style:normal;background:linear-gradient(90deg,#f3b6ff,#6de4f9 52%,#77fab4);-webkit-background-clip:text;color:transparent}.hero-lead{max-width:620px;font-size:25px;line-height:1.55;color:#d5d4dc;margin:0 0 42px}.hero-chips{display:flex;flex-wrap:wrap;gap:12px}.hero-chips span{padding:12px 17px;border:1px solid #ffffff20;border-radius:999px;background:#ffffff0b;color:#e8e7ed;font-size:16px}.hero-stats{position:absolute;z-index:2;left:100px;bottom:74px;display:flex;gap:38px}.hero-stat b{display:block;font:400 43px/1 Outfit;color:#9afff7}.hero-stat span{display:block;margin-top:9px;color:#a9a7b2;font-size:15px;text-transform:uppercase;letter-spacing:.08em}.hero-stage{position:absolute;z-index:1;inset:0}.deck-card{position:absolute;border-radius:12px;overflow:hidden;border:1px solid #ffffff22;background:#111;box-shadow:0 34px 80px #000b}.deck-card img{display:block;width:100%;height:auto}.deck-card.a{width:800px;right:65px;top:175px;transform:rotate(1.4deg)}.deck-card.b{width:610px;right:310px;top:564px;transform:rotate(-2.2deg)}.deck-card.c{width:500px;right:34px;top:660px;transform:rotate(2.1deg)}
.system{width:1920px;height:1760px;margin-left:140px;padding:76px 84px;border-radius:0;background:#f2f4f0;color:#111114;box-shadow:none;isolation:isolate}.system:before{content:"";position:absolute;inset:0;background:#f2f4f0;z-index:0}.system>*{position:relative;z-index:1}.system-head{display:flex;justify-content:space-between;align-items:end}.system h2,.showcase h2{font:400 66px/1.03 Outfit;margin:14px 0 0;letter-spacing:-.035em}.system-head p{width:530px;margin:0;font-size:20px;line-height:1.55;color:#5e6263}.stat-row{display:grid;grid-template-columns:repeat(8,1fr);gap:12px;margin-top:42px}.stat-card{padding:19px 17px;border-radius:15px;background:#fff;border:1px solid #11111415}.stat-card b{display:block;font:400 36px/1 Outfit;color:#008089}.stat-card span{display:block;margin-top:8px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#626668}.system-main{display:grid;grid-template-columns:1.18fr .82fr;gap:24px;margin-top:24px}.panel{border-radius:22px;background:#fff;border:1px solid #11111415;overflow:hidden}.panel-head{display:flex;align-items:center;justify-content:space-between;padding:24px 26px 18px}.panel h3{font:500 27px/1 Outfit;margin:0}.panel-head span{font-size:13px;color:#008089}.swatches{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;padding:0 26px 25px}.swatch{min-width:0}.swatch span{display:block;height:42px;border-radius:9px;border:1px solid #11111414}.swatch b,.swatch code{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.swatch b{font-size:11px;margin-top:7px}.swatch code{font:9px/1.3 NotoSans;color:#777b7d;margin-top:2px}.gradients{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 26px 25px}.gradient span{display:block;height:43px;border-radius:10px;border:1px solid #11111412;overflow:hidden}.gradient img{display:block;width:100%;height:100%;object-fit:cover}.gradient b{display:block;font-size:10px;margin-top:6px;color:#4d5153}.type-stack{padding:0 26px 25px;display:grid;gap:10px}.type-card{padding:15px 17px;border-radius:14px;background:#f4f5f2;border:1px solid #11111410}.type-card small{display:flex;justify-content:space-between;color:#008089;font-size:10px;text-transform:uppercase;letter-spacing:.06em}.type-card strong{display:block;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.font-outfit strong{font:400 34px/1.15 Outfit}.font-noto strong{font:400 25px/1.3 NotoSans}.font-instrument strong{font:italic 36px/1 Instrument}.font-smiley strong{font:400 34px/1.2 Smiley}.font-notosc strong{font:500 25px/1.4 NotoSansSC}.font-serifsc strong{font:700 26px/1.4 NotoSerifSC}.layout-panel{margin-top:24px;padding:24px 28px 27px}.layout-panel .panel-head{padding:0 0 18px}.layout-table{width:100%;border-collapse:collapse;font-size:15px;background:#fff;border-radius:14px;overflow:hidden}.layout-table th,.layout-table td{padding:13px 18px;text-align:left;border-top:1px solid #11111410}.layout-table thead th{border-top:0;color:#717577;font-size:11px;text-transform:uppercase;letter-spacing:.06em}.layout-table tbody th{font:500 17px Outfit}.layout-table td{color:#55595b}.system-note{display:flex;align-items:center;gap:13px;margin-top:20px;padding:16px 18px;border-radius:14px;background:#e5f6f1;font:500 16px/1.5 Outfit}.system-note:before{content:"";width:10px;height:10px;flex:0 0 auto;border-radius:50%;background:#008089}
.showcase{width:2048px;height:1340px;margin-left:76px;padding:48px;border-radius:26px;background:#0b0a0f;color:#fff;box-shadow:0 34px 90px #0007}.showcase:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 0%,#233a3f80,transparent 30%),radial-gradient(circle at 18% 100%,#22163b90,transparent 35%);pointer-events:none}.showcase-head{position:relative;z-index:1;height:150px;display:flex;align-items:flex-start;justify-content:space-between}.showcase-head h2{font-size:54px;margin-top:10px}.showcase-head p{width:600px;margin:18px 0 0;color:#b7b5c0;font-size:18px;line-height:1.5}.showcase-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);gap:28px}.showcase figure{position:relative;margin:0;border-radius:12px;overflow:hidden;border:1px solid #ffffff1c;background:#111;box-shadow:0 18px 45px #0007}.showcase figure img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}.showcase figcaption{position:absolute;right:12px;top:12px;display:grid;place-items:center;width:36px;height:26px;border-radius:999px;background:#0b0a0fcc;color:#9ffff7;font:500 12px Outfit;border:1px solid #ffffff20}
</style></head><body>
<section class="capture hero" id="hero">
  <div class="hero-top"><div class="hero-brand">Aident <span>PPT Skill</span></div><div class="hero-version">HTML-FIRST · BILINGUAL · SELF-CONTAINED</div></div>
  <div class="hero-copy"><span class="eyebrow">FROM OUTLINE TO PRESENTATION</span><h1>Present ideas.<br><em>Keep the system.</em></h1><p class="hero-lead">A reusable presentation engine with editable content, bundled assets, responsive layouts, and visual quality gates.</p><div class="hero-chips"><span>English + 中文</span><span>Motion-ready HTML</span><span>PDF / PPTX optional</span><span>No Figma runtime</span></div></div>
  <div class="hero-stats"><div class="hero-stat"><b>${String(layouts.length).padStart(2,'0')}</b><span>Layouts</span></div><div class="hero-stat"><b>${String(colors.length).padStart(2,'0')}</b><span>Base colors</span></div><div class="hero-stat"><b>${String(fontManifest.families.length).padStart(2,'0')}</b><span>Font families</span></div><div class="hero-stat"><b>${String(iconManifest.icons.length).padStart(2,'0')}</b><span>Curated icons</span></div></div>
  <div class="hero-stage"><div class="deck-card a"><img src="${enSlides[1]}"></div><div class="deck-card b"><img src="${enSlides[2]}"></div><div class="deck-card c"><img src="${zhSlides[5]}"></div></div>
</section>
<section class="capture system" id="system">
  <header class="system-head"><div><span class="eyebrow">PACKAGED DESIGN SYSTEM</span><h2>Everything needed to stay consistent</h2></div><p>Counts are read directly from the packaged registries. Fonts, colors, backgrounds, components, and layout rules travel with the Skill.</p></header>
  <div class="stat-row">${stats.map(([number,label])=>`<div class="stat-card"><b>${number}</b><span>${label}</span></div>`).join('')}</div>
  <div class="system-main">
    <section class="panel"><div class="panel-head"><h3>Color tokens</h3><span>${colors.length} base · ${gradients.length} gradients</span></div><div class="swatches">${colorHtml}</div><div class="gradients">${gradientHtml}</div></section>
    <section class="panel"><div class="panel-head"><h3>Typography</h3><span>3 English · 3 中文</span></div><div class="type-stack">
      <div class="type-card font-outfit"><small><span>Outfit</span><span>Display / title</span></small><strong>Clarity at every scale</strong></div>
      <div class="type-card font-noto"><small><span>Noto Sans</span><span>Body / label</span></small><strong>Readable supporting information for every slide.</strong></div>
      <div class="type-card font-instrument"><small><span>Instrument Serif</span><span>Step numerals</span></small><strong>01 02 03 04</strong></div>
      <div class="type-card font-smiley"><small><span>Smiley Sans</span><span>中文大标题</span></small><strong>让复杂内容保持清晰</strong></div>
      <div class="type-card font-notosc"><small><span>Noto Sans SC</span><span>中文正文 / 标签</span></small><strong>可靠的正文层级与信息说明</strong></div>
      <div class="type-card font-serifsc"><small><span>Noto Serif SC</span><span>中文强调文字</span></small><strong>让重点被准确看见</strong></div>
    </div></section>
  </div>
  <section class="panel layout-panel"><div class="panel-head"><h3>Layout inventory</h3><span>Every visible field remains editable</span></div><table class="layout-table"><thead><tr><th>Layout</th><th>Supported count</th><th>Themes</th><th>Options</th></tr></thead><tbody>${layoutHtml}</tbody></table><div class="system-note">Only cover titles are centered. Inner titles stay left-aligned, content budgets are enforced, and browser preflight checks overlap and overflow.</div></section>
</section>
${slideGrid(enSlides,'en','Nine real English layouts','A complete example deck covering cover, points, workflow, metrics, comparison, dense cards, image cards, team, and split image/text.')}
${slideGrid(zhSlides,'zh','九种中文页面版式','与英文示例保持同样的九页覆盖，用真实中文层级验证字号、行高、字距、密集卡片和图片版式。')}
</body></html>`;

await fs.mkdir(outputDir,{recursive:true});
await fs.mkdir(previewDir,{recursive:true});
const htmlPath=path.join(outputDir,'index.html');
await fs.writeFile(htmlPath,html);

const playwrightModule=await importPackage('playwright');
const {chromium}=playwrightModule.default||playwrightModule;
const browser=await chromium.launch({headless:true,executablePath:await browserExecutable(),args:['--disable-gpu','--disable-features=Accelerated2dCanvas']});

const targets=[
  ['#hero','aident-ppt-hero.png'],
  ['#system','aident-ppt-system.png'],
  ['#showcase-en','aident-ppt-showcase.png'],
  ['#showcase-zh','aident-ppt-showcase.zh.png']
];
for(const [selector,file] of targets){
  const finalPath=path.join(previewDir,file);
  if(selector==='#system'){
    const size=await renderSystemPreview({canvasModule,root,tokens,components,fontManifest,iconManifest,backgroundManifest,outPath:finalPath});
    console.log(`${file}: ${size.width}×${size.height} · direct bundled-font canvas renderer`);
    continue;
  }
  if(selector==='#showcase-en'||selector==='#showcase-zh'){
    const language=selector.endsWith('-zh')?'zh':'en';
    const slides=language==='zh'?zhSlides:enSlides;
    const size=await renderShowcasePreview({canvasModule,root,language,slidePaths:slides.map(src=>path.resolve(outputDir,src)),outPath:finalPath});
    console.log(`${file}: ${size.width}×${size.height} · direct bundled-font canvas renderer`);
    continue;
  }
  const isolatedPath=path.join(outputDir,`${file}.html`);
  const isolatedHtml=html.replace('</head>',`<style>.capture{display:none!important}${selector}{display:block!important}</style></head>`);
  await fs.writeFile(isolatedPath,isolatedHtml);
  // Use a fresh page for every asset so Chromium cannot reuse a composited
  // gradient layer from the preceding hero/showcase capture.
  const page=await browser.newPage({viewport:{width:2200,height:2100},deviceScaleFactor:1});
  await page.goto(pathToFileURL(isolatedPath).href,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(120);
  const locator=page.locator(selector),box=await locator.boundingBox();
  if(!box)throw new Error(`Unable to resolve preview bounds for ${selector}`);
  await page.screenshot({path:finalPath,clip:{x:box.x,y:box.y,width:box.width,height:box.height}});
  const size=await locator.evaluate(element=>({width:element.offsetWidth,height:element.offsetHeight}));
  console.log(`${file}: ${size.width}×${size.height}`);
  await page.close();
}
await browser.close();
