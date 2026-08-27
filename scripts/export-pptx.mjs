#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
function parseArgs(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i]==='--input')a.input=argv[++i];else if(argv[i]==='--asset-root')a.assetRoot=argv[++i];else if(argv[i]==='--out')a.out=argv[++i];else if(argv[i]==='--preview-dir')a.previewDir=argv[++i];else throw new Error(`Unknown argument: ${argv[i]}`)}return a}
async function importPackage(name){const require=createRequire(import.meta.url);const resolved=require.resolve(name,{paths:[process.env.RUNTIME_NODE_MODULES,path.resolve('node_modules')].filter(Boolean)});return import(pathToFileURL(resolved).href)}
const args=parseArgs(process.argv);if(!args.input||!args.out)throw new Error('Usage: node scripts/export-pptx.mjs --input output/deck/deck.resolved.json --asset-root output/deck --out output/deck.pptx [--preview-dir output/pptx-qa]');
const {Presentation,PresentationFile}=await importPackage('@oai/artifact-tool');
const sharpModule=await importPackage('sharp');
const sharp=sharpModule.default||sharpModule;
const deck=JSON.parse(await fs.readFile(path.resolve(args.input),'utf8'));
const assetRoot=path.resolve(args.assetRoot||path.dirname(path.resolve(args.input)));
const presentation=Presentation.create({slideSize:{width:1920,height:1080}});
const lang=deck.meta.language;
const colors={light:{primary:'#111114',secondary:'#5E6263',hair:'#D9DCDA',surface:'#F7F8F6',stepNumber:'#008089'},dark:{primary:'#FFFFFF',secondary:'#B9B6C0',hair:'#3C3648',surface:'#181123',stepNumber:'#1EEAEA'}};
const fonts=lang==='zh'?{display:'Smiley Sans',item:'Noto Sans SC',body:'Noto Sans SC',number:'Smiley Sans',callout:'Noto Serif SC'}:{display:'Outfit',item:'Outfit',body:'Noto Sans',number:'Instrument Serif',callout:'Outfit'};
const normalizeImage=value=>typeof value==='string'?{src:value,alt:''}:value&&typeof value==='object'?value:null;
const coverLayout=s=>s.type==='cover'?(s.coverLayout||(normalizeImage(s.image)?.src?'media-bottom':'text-only')):'';
const coverIdentity=s=>s.type==='cover'?(s.coverIdentity||(String(s.kicker||'').trim()?'kicker':'none')):'';
function backgroundTreatment(s){const requested=s.background||(s.type==='cover'?'elements-cover':'elements-inner');if(requested==='elements')return s.type==='cover'?'elements-cover':'elements-inner';if(requested==='paper'||requested==='ink')return 'base';if(requested==='motion'||requested==='aurora')return 'atmosphere';return requested}

function mime(file){const ext=path.extname(file).toLowerCase();return ext==='.svg'?'image/svg+xml':ext==='.jpg'||ext==='.jpeg'?'image/jpeg':ext==='.webp'?'image/webp':'image/png'}
async function imageBytes(rel){if(!rel||/^(https?:|data:)/i.test(rel))return null;const file=path.resolve(assetRoot,rel);const bytes=await fs.readFile(file);return {blob:bytes,contentType:mime(file)}}
async function imageDimensions(rel){if(!rel||/^(https?:|data:)/i.test(rel))return null;const metadata=await sharp(path.resolve(assetRoot,rel)).metadata();return metadata.width&&metadata.height?{width:metadata.width,height:metadata.height}:null}
function addText(slide,value,pos,style={}){const shape=slide.shapes.add({geometry:'textbox',name:style.name||'text',position:pos,fill:'none',line:{style:'solid',fill:'none',width:0}});shape.text=String(value??'');shape.text.style={fontFamily:style.fontFamily||fonts.body,fontSize:style.fontSize||22,color:style.color||'#111114',bold:Boolean(style.bold),italic:Boolean(style.italic),alignment:style.alignment||'left'};return shape}
function addBox(slide,pos,fill,line='none',radius=24,name='box'){return slide.shapes.add({geometry:radius?'roundRect':'rect',name,position:pos,fill,line:line==='none'?{style:'solid',fill:'none',width:0}:line,borderRadius:radius})}
function approximateTextWidth(value,fontSize){let units=0;for(const char of Array.from(String(value||''))){if(/\s/.test(char))units+=.34;else if(/[\u2e80-\u9fff\uf900-\ufaff]/u.test(char))units+=1.05;else if(/[A-Z0-9]/.test(char))units+=.62;else units+=.54}return Math.max(40,Math.min(520,units*fontSize+16))}
function fitOneLineFontSize(value,width,preferred,min){const measured=approximateTextWidth(value,preferred)*1.08;return measured<=width?preferred:Math.max(min,Math.floor(preferred*width/measured))}
async function addImage(slide,rel,pos,{fit='cover',radius=0,alt=''}={}){const data=await imageBytes(rel);if(!data)return addBox(slide,pos,'linear(135deg,#039987/18 0%,#4B56F8/18 100%)',{style:'solid',fill:'#111114/14',width:1},radius,'image-placeholder');return slide.images.add({...data,alt,fit,position:pos,geometry:radius?'roundRect':'rect',borderRadius:radius})}
async function addLogo(slide,rel,{left,top,maxWidth,maxHeight,align='left'},alt){const dimensions=await imageDimensions(rel).catch(()=>null);if(!dimensions)return addImage(slide,rel,{left,top,width:maxWidth,height:maxHeight},{fit:'contain',alt});const ratio=dimensions.width/dimensions.height;let height=maxHeight,width=height*ratio;if(width>maxWidth){width=maxWidth;height=width/ratio}const x=align==='center'?left+(maxWidth-width)/2:left;const y=top+(maxHeight-height)/2;const ext=path.extname(rel).toLowerCase();if(ext==='.svg'||ext==='.webp'){const rasterScale=4,png=await sharp(path.resolve(assetRoot,rel),{density:384}).resize({width:Math.max(1,Math.round(width*rasterScale)),height:Math.max(1,Math.round(height*rasterScale)),fit:'fill'}).png().toBuffer();return slide.images.add({blob:png,contentType:'image/png',alt,fit:'contain',position:{left:x,top:y,width,height},geometry:'rect',borderRadius:0})}return addImage(slide,rel,{left:x,top:y,width,height},{fit:'contain',alt})}
function backgroundRel(s){return `assets/backgrounds/compiled/${s.theme}-${backgroundTreatment(s)}.png`}
async function addPageHeader(slide,s){
  if(s.type==='cover')return;
  const header={show:true,showLogo:true,showRightText:true,...deck.meta.header,...s.header};
  if(header.show!==false){if(header.showLogo!==false){const custom=typeof deck.meta.logo==='string'?deck.meta.logo:deck.meta.logo?.[s.theme],logo=custom||`assets/logos/wordmark-${s.theme}.svg`;await addLogo(slide,logo,{left:110,top:64,maxWidth:320,maxHeight:40},deck.meta.brandName||'Brand')}if(header.showRightText!==false)addText(slide,header.rightText||deck.meta.url||'example.com',{left:1110,top:58,width:700,height:48},{fontFamily:fonts.display,fontSize:30,color:s.theme==='dark'?'#BFFAF4':'#028C94',alignment:'right',name:'header-right'})}
}
async function addChrome(slide,s){await addImage(slide,backgroundRel(s),{left:0,top:0,width:1920,height:1080},{fit:'cover',alt:''});await addPageHeader(slide,s)}
async function addCoverIdentity(slide,s,top){
  const identity=coverIdentity(s);
  if(identity==='none')return;
  if(identity==='kicker'){if(s.kicker)addText(slide,s.kicker,{left:300,top,width:1320,height:48},{fontSize:24,color:s.theme==='dark'?'#BFFAF4':'#028C94',alignment:'center',name:'cover-kicker'});return;}
  const custom=typeof deck.meta.logo==='string'?deck.meta.logo:deck.meta.logo?.[s.theme];
  await addLogo(slide,custom||`assets/logos/wordmark-${s.theme}.svg`,{left:800,top,maxWidth:320,maxHeight:56,align:'center'},deck.meta.brandName||'Brand');
}
function coverGeometry(s){
  const titleLength=Array.from(String(s.title||'')).length;
  const titleLines=lang==='zh'?(titleLength>12?2:1):(titleLength>30?2:1);
  const identityHeight=coverIdentity(s)==='none'?0:72;
  const titleHeight=titleLines===2?280:150;
  const subtitleHeight=s.subtitle?116:0;
  const textHeight=identityHeight+titleHeight+subtitleHeight;
  const mediaHeight=coverLayout(s)==='media-bottom'?392:0;
  const top=Math.max(60,(1080-textHeight-mediaHeight)/2);
  return {top,titleTop:top+identityHeight,titleHeight,subtitleTop:top+identityHeight+titleHeight+24,imageTop:top+textHeight+32};
}
async function addHeading(slide,s){
  const c=colors[s.theme];
  if(s.type==='cover'){
    const g=coverGeometry(s);
    await addCoverIdentity(slide,s,g.top);
    addText(slide,s.title,{left:180,top:g.titleTop,width:1560,height:g.titleHeight},{fontFamily:fonts.display,fontSize:116,color:c.primary,alignment:'center',italic:lang==='zh',name:'cover-title'});
    if(s.subtitle)addText(slide,s.subtitle,{left:340,top:g.subtitleTop,width:1240,height:92},{fontSize:30,color:c.secondary,alignment:'center',name:'cover-subtitle'});
    return 0;
  }
  if(s.type==='full-bleed'){
    if(s.kicker)addText(slide,s.kicker,{left:110,top:s.callout?570:700,width:1500,height:42},{fontSize:24,color:'#BFFAF4',name:'kicker'});
    addText(slide,s.title,{left:110,top:s.callout?620:750,width:1500,height:140},{fontFamily:fonts.display,fontSize:100,color:'#FFFFFF',italic:lang==='zh',name:'slide-title'});
    if(s.subtitle)addText(slide,s.subtitle,{left:110,top:s.callout?760:890,width:1420,height:70},{fontSize:28,color:'#D8D5DE',name:'slide-subtitle'});
    return 0;
  }
  const titleLength=Array.from(String(s.title||'')).length;
  const titleLines=lang==='zh'?(titleLength>14?2:1):(titleLength>30?2:1);
  const titleHeight=titleLines===2?220:110;
  const subtitleTop=190+titleHeight+12;
  if(s.kicker)addText(slide,s.kicker,{left:110,top:145,width:1500,height:42},{fontSize:24,color:s.theme==='dark'?'#BFFAF4':'#028C94',name:'kicker'});
  addText(slide,s.title,{left:110,top:190,width:1640,height:titleHeight},{fontFamily:fonts.display,fontSize:100,color:c.primary,italic:lang==='zh',name:'slide-title'});
  if(s.subtitle)addText(slide,s.subtitle,{left:110,top:subtitleTop,width:1580,height:70},{fontSize:28,color:c.secondary,name:'slide-subtitle'});
  return Math.max(450,s.subtitle?subtitleTop+84:190+titleHeight+30);
}
function gridPositions(n,y,height,gap=60){const cols=n===6?3:n;const rows=n===6?2:1;const width=(1700-gap*(cols-1))/cols;return Array.from({length:n},(_,i)=>({left:110+(i%cols)*(width+gap),top:y+Math.floor(i/cols)*(height+36),width,height}));}
async function addIcon(slide,s,item,pos){if(item.showIcon===false||!item.icon)return;await addImage(slide,`assets/icons/${s.theme}/${item.icon}.svg`,{left:pos.left,top:pos.top,width:60,height:60},{fit:'contain',alt:''})}
async function addPoints(slide,s,y){const c=colors[s.theme],n=s.items.length,positions=gridPositions(n,y,n===6?180:270);for(let i=0;i<n;i++){const p=positions[i],item=s.items[i];if(i%((n===6)?3:n)!==0)addBox(slide,{left:p.left-30,top:p.top,width:1,height:p.height},c.hair,'none',0,'divider');await addIcon(slide,s,item,p);let ty=p.top+(item.icon&&item.showIcon!==false?76:0);if(item.label&&item.showLabel!==false){addText(slide,item.label,{left:p.left,top:ty,width:p.width,height:30},{fontSize:18,bold:true,color:s.theme==='dark'?'#9AFFF8':'#008C94',name:'point-label'});ty+=35}addText(slide,item.title,{left:p.left,top:ty,width:p.width,height:72},{fontFamily:fonts.item,fontSize:n>=4?42:n===3?48:52,color:c.primary,name:'point-title'});addText(slide,item.body,{left:p.left,top:ty+76,width:p.width,height:90},{fontSize:22,color:c.secondary,name:'point-body'})}}
async function addCards(slide,s,y){
  const c=colors[s.theme],n=s.items.length,compact=n===6,positions=gridPositions(n,y,compact?220:n===4?190:330,30);
  for(let i=0;i<n;i++){
    const p=positions[i],item=s.items[i],hasImage=Boolean(item.image),padX=compact?24:28;
    addBox(slide,p,c.surface,{style:'solid',fill:c.hair,width:1},24,'card');
    let x=p.left+padX,ty=p.top+(compact?18:26),w=p.width-padX*2;
    if(hasImage){
      const image=normalizeImage(item.image),mediaH=n<=3?150:p.height,mediaW=n<=3?p.width:p.width*.35;
      await addImage(slide,image?.src,{left:p.left,top:p.top,width:mediaW,height:mediaH},{fit:image?.fit||'cover',radius:n<=3?24:0,alt:image?.alt||''});
      if(n<=3)ty=p.top+mediaH+18;else{x=p.left+mediaW+22;ty=p.top+20;w=p.width-mediaW-44}
    }else if(item.icon&&item.showIcon!==false){
      const iconSize=compact?48:60;
      await addImage(slide,`assets/icons/${s.theme}/${item.icon}.svg`,{left:x,top:ty,width:iconSize,height:iconSize},{fit:'contain',alt:''});
      ty+=compact?56:68;
    }
    if(item.label&&item.showLabel!==false){const labelH=compact?24:28;addText(slide,item.label,{left:x,top:ty,width:w,height:labelH},{fontSize:compact?16:18,bold:true,color:s.theme==='dark'?'#9AFFF8':'#008C94'});ty+=compact?26:30}
    const titleH=compact?44:58;
    addText(slide,item.title,{left:x,top:ty,width:w,height:titleH},{fontFamily:fonts.item,fontSize:compact?34:n<=2?44:38,color:c.primary,name:'card-title'});
    addText(slide,item.body,{left:x,top:ty+titleH,width:w,height:compact?58:72},{fontSize:compact?18:n>=4?18:21,color:c.secondary,name:'card-body'});
  }
}
function addMetrics(slide,s,y){const c=colors[s.theme],n=s.items.length,positions=gridPositions(n,y,n===6?175:260);for(let i=0;i<n;i++){const p=positions[i],item=s.items[i];if(i%((n===6)?3:n)!==0)addBox(slide,{left:p.left-30,top:p.top,width:1,height:p.height},c.hair,'none',0,'divider');let ty=p.top;if(item.label&&item.showLabel!==false){addText(slide,item.label,{left:p.left,top:ty,width:p.width,height:30},{fontSize:18,bold:true,color:s.theme==='dark'?'#9AFFF8':'#008C94'});ty+=32}addText(slide,item.value,{left:p.left,top:ty,width:p.width,height:96},{fontFamily:fonts.item,fontSize:n>=4?68:84,color:s.theme==='dark'?'#B7F6EE':'#028C94',name:'metric-value'});ty+=96;if(item.title)addText(slide,item.title,{left:p.left,top:ty,width:p.width,height:54},{fontFamily:fonts.item,fontSize:n>=4?34:40,color:c.primary,name:'metric-title'});addText(slide,item.body,{left:p.left,top:ty+52,width:p.width,height:64},{fontSize:20,color:c.secondary})}}
function addWorkflow(slide,s,y){
  const c=colors[s.theme],n=s.steps.length,hasWorkflowLabel=s.showWorkflowLabel!==false&&Boolean(s.workflowLabel);
  const arrowY=y+(hasWorkflowLabel?45:0),stepY=arrowY+(s.showArrows===false?0:48);
  if(hasWorkflowLabel)addText(slide,s.workflowLabel,{left:110,top:y,width:900,height:33},{fontFamily:fonts.display,fontSize:22,bold:true,color:s.theme==='dark'?'#FFFFFF/70':'#111114/70',name:'workflow-label'});
  if(s.showArrows!==false){
    const arrowGap=60,arrowWidth=(1700-arrowGap*(n-1))/n,arrowFill=s.theme==='dark'?'linear(0deg,#F3B6FF/40 0%,#6DE4F9/40 51%,#77FAB4/40 100%)':'linear(0deg,#1F1F23/50 0%,#029090/50 100%)',arrowHead=s.theme==='dark'?'#77FAB4/40':'#029090/50';
    for(let i=0;i<n;i++){const left=110+i*(arrowWidth+arrowGap);addBox(slide,{left,top:arrowY+7,width:arrowWidth-10,height:1},arrowFill,'none',0,'step-arrow-line');addText(slide,'›',{left:left+arrowWidth-18,top:arrowY-7,width:18,height:30},{fontFamily:fonts.display,fontSize:24,color:arrowHead,alignment:'right',name:'step-arrow-head'})}
  }
  const stepGap=120,stepWidth=(1700-stepGap*(n-1))/n;
  for(let i=0;i<n;i++){
    const left=110+i*(stepWidth+stepGap),item=s.steps[i];
    if(i&&s.showDividers!==false)addBox(slide,{left:left-60,top:stepY,width:1,height:270},c.hair,'none',0,'divider');
    addText(slide,item.number||String(i+1).padStart(2,'0'),{left,top:stepY,width:90,height:60},{fontFamily:fonts.number,fontSize:lang==='zh'?40:50,italic:true,color:c.stepNumber,name:'step-number'});
    let ty=stepY+68;
    if(item.label&&s.showStepLabels!==false){addText(slide,item.label,{left,top:ty,width:stepWidth,height:27},{fontSize:18,bold:true,color:s.theme==='dark'?'#1EEAEA':'#008089',name:'step-label'});ty+=35}
    const titleFontSize=fitOneLineFontSize(item.title,stepWidth,44,30);
    addText(slide,item.title,{left,top:ty,width:stepWidth,height:66},{fontFamily:fonts.item,fontSize:titleFontSize,color:c.primary,name:'step-title'});
    addText(slide,item.body,{left,top:ty+74,width:stepWidth,height:99},{fontSize:22,color:c.secondary,name:'step-body'});
  }
}
function addComparison(slide,s,y){const c=colors[s.theme],positions=gridPositions(2,y,380,30);for(let i=0;i<2;i++){const p=positions[i],item=s.items[i];addBox(slide,p,item.tone==='accent'?'linear(0deg,#F3B6FF/16 0%,#6DE4F9/16 51%,#77FAB4/16 100%)':c.surface,{style:'solid',fill:item.tone==='accent'?'none':c.hair,width:item.tone==='accent'?0:1},24,'comparison-card');let ty=p.top+36;if(item.label)addText(slide,item.label,{left:p.left+38,top:ty,width:p.width-76,height:30},{fontSize:18,bold:true,color:s.theme==='dark'?'#9AFFF8':'#008C94'});ty+=40;addText(slide,item.title,{left:p.left+38,top:ty,width:p.width-76,height:70},{fontFamily:fonts.item,fontSize:50,color:c.primary});ty+=72;if(item.body){addText(slide,item.body,{left:p.left+38,top:ty,width:p.width-76,height:55},{fontSize:22,color:c.secondary});ty+=62}for(const point of item.points||[]){addText(slide,`• ${point}`,{left:p.left+38,top:ty,width:p.width-76,height:36},{fontSize:20,color:c.secondary});ty+=42}}}
async function addImageCards(slide,s,y){const c=colors[s.theme],n=s.items.length,positions=gridPositions(n,y,390,30);for(let i=0;i<n;i++){const p=positions[i],item=s.items[i],image=normalizeImage(item.image);await addImage(slide,image?.src,{left:p.left,top:p.top,width:p.width,height:230},{fit:image?.fit||'cover',radius:24,alt:image?.alt||''});addText(slide,item.title,{left:p.left,top:p.top+246,width:p.width,height:62},{fontFamily:fonts.item,fontSize:42,color:c.primary});addText(slide,item.body,{left:p.left,top:p.top+310,width:p.width,height:70},{fontSize:21,color:c.secondary})}}
async function addTeam(slide,s,y){
  const c=colors[s.theme],positions=gridPositions(3,y,145,60);
  for(let i=0;i<3;i++){
    const p=positions[i],item=s.items[i];let ty=p.top;
    if(item.label){addText(slide,item.label,{left:p.left,top:ty,width:p.width,height:27},{fontSize:18,bold:true,color:s.theme==='dark'?'#1EEAEA':'#008089',name:'team-label'});ty+=31}
    addText(slide,item.title,{left:p.left,top:ty,width:p.width,height:52},{fontFamily:fonts.item,fontSize:40,color:c.primary,name:'team-title'});
    addText(slide,item.body,{left:p.left,top:ty+54,width:p.width,height:58},{fontSize:19,color:c.secondary,name:'team-body'});
  }
  const image=normalizeImage(s.image);await addImage(slide,image?.src,{left:110,top:y+177,width:1700,height:340},{fit:image?.fit||'cover',alt:image?.alt||''});
}
async function addSplit(slide,s,y){const c=colors[s.theme],image=normalizeImage(s.image),imageLeft=s.imageSide!=='right',imageX=imageLeft?110:1050,textX=imageLeft?950:110;await addImage(slide,image?.src,{left:imageX,top:y,width:760,height:428},{fit:image?.fit||'cover',radius:24,alt:image?.alt||''});addText(slide,s.contentTitle||s.title,{left:textX,top:y+38,width:760,height:130},{fontFamily:fonts.item,fontSize:52,color:c.primary});addText(slide,s.body||s.subtitle||'',{left:textX,top:y+190,width:760,height:140},{fontSize:25,color:c.secondary})}
function addCallout(slide,s){
  if(!s.callout)return;
  const c=colors[s.theme],tallContent=['split-image-text','image-cards'].includes(s.type),y=!s.source&&tallContent?938:875,metric=s.callout.metric||s.callout.label,hasMetric=Boolean(metric),tone=s.callout.tone==='accent'?'accent':'default',height=hasMetric||tone==='accent'?88:70;
  const fill=tone==='accent'?'linear(0deg,#A0A9FE/16 0%,#2EEEEE/16 48%,#93FCB8/16 100%)':s.theme==='dark'?'#FFFFFF/6':'#111114/4';
  addBox(slide,{left:110,top:y,width:1700,height},fill,'none',16,'callout');
  addBox(slide,{left:130,top:y+(height-12)/2,width:12,height:12},s.theme==='dark'?'#1EEAEA':'#008089','none',6,'callout-bullet');
  if(hasMetric){
    const metricWidth=Math.min(480,Math.ceil(approximateTextWidth(metric,40)*1.35)),metricLeft=154,bodyLeft=metricLeft+metricWidth+12;
    addText(slide,metric,{left:metricLeft,top:y+20,width:metricWidth,height:48},{fontFamily:fonts.callout,fontSize:40,bold:lang==='zh',color:s.theme==='dark'?'#B7F6EE':'#028C94',name:'callout-metric'});
    addText(slide,s.callout.body,{left:bodyLeft,top:y+29,width:1780-bodyLeft,height:30},{fontFamily:fonts.callout,fontSize:20,bold:lang==='zh',color:c.primary,name:'callout-body'});
  }else{
    addText(slide,s.callout.body,{left:154,top:y+(height-30)/2,width:1636,height:30},{fontFamily:fonts.callout,fontSize:20,bold:lang==='zh',color:s.theme==='dark'?'#FFFFFF':'#008089',name:'callout-body'});
  }
}

for(const [index,s] of deck.slides.entries()){
  const slide=presentation.slides.add();
  const image=normalizeImage(s.image),fullImage=s.type==='full-bleed'||coverLayout(s)==='full-bleed';
  if(fullImage&&image?.src){await addImage(slide,image.src,{left:0,top:0,width:1920,height:1080},{fit:image.fit||'cover',alt:image.alt||''});addBox(slide,{left:0,top:0,width:1920,height:1080},s.type==='cover'?'#090711/45':'#0F091D/50','none',0,'image-wash');await addPageHeader(slide,s)}else await addChrome(slide,s);
  const y=await addHeading(slide,s);
  if(s.type==='cover'&&coverLayout(s)==='media-bottom'&&image?.src)await addImage(slide,image.src,{left:280,top:coverGeometry(s).imageTop,width:1360,height:360},{fit:image.fit||'cover',radius:24,alt:image.alt||''});
  if(s.type==='points')await addPoints(slide,s,y);else if(s.type==='cards')await addCards(slide,s,y);else if(s.type==='metrics')addMetrics(slide,s,y);else if(s.type==='workflow')addWorkflow(slide,s,y);else if(s.type==='comparison')addComparison(slide,s,y);else if(s.type==='image-cards')await addImageCards(slide,s,y);else if(s.type==='team')await addTeam(slide,s,390);else if(s.type==='split-image-text')await addSplit(slide,s,y);
  if(s.type!=='cover')addCallout(slide,s);
  if(s.source)addText(slide,s.source,{left:110,top:1018,width:1700,height:30},{fontSize:16,bold:true,color:s.theme==='dark'?'#FFFFFF/55':'#919596',name:'source'});
  const notes=s.notes||{};const noteLines=[notes.title||s.title,notes.purpose||'',...(notes.talk||[]),notes.transition?`Transition: ${notes.transition}`:''].filter(Boolean);if(noteLines.length){slide.speakerNotes.textFrame.setText(noteLines);slide.speakerNotes.setVisible(true)}
  slide.name=s.id||`slide-${index+1}`;
}

if(args.previewDir){const preview=path.resolve(args.previewDir);await fs.mkdir(preview,{recursive:true});for(const [i,slide] of presentation.slides.items.entries()){const png=await presentation.export({slide,format:'png',scale:1});await fs.writeFile(path.join(preview,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));const layout=await slide.export({format:'layout'});await fs.writeFile(path.join(preview,`slide-${String(i+1).padStart(2,'0')}.layout.json`),await layout.text())}const montage=await presentation.export({format:'webp',montage:true,scale:1});await fs.writeFile(path.join(preview,'montage.webp'),new Uint8Array(await montage.arrayBuffer()))}
await fs.mkdir(path.dirname(path.resolve(args.out)),{recursive:true});const pptx=await PresentationFile.exportPptx(presentation);await pptx.save(path.resolve(args.out));console.log(`PPTX exported: ${path.resolve(args.out)}`);
