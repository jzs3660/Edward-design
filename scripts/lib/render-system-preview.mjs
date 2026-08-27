import fs from 'node:fs/promises';
import path from 'node:path';

const title=value=>String(value)
  .replace(/([a-z])([A-Z])/g,'$1 $2')
  .replace(/[-_]/g,' ')
  .replace(/^./,char=>char.toUpperCase());

export function registerBundledFonts(GlobalFonts,root){
  const fonts=[
    ['Outfit','assets/fonts/outfit/Outfit-VariableFont_wght.ttf'],
    ['Instrument Serif','assets/fonts/instrument-serif/InstrumentSerif-Regular.ttf'],
    ['Instrument Serif Italic','assets/fonts/instrument-serif/InstrumentSerif-Italic.ttf'],
    ['Noto Sans','assets/fonts/noto-sans/NotoSans-Variable.ttf'],
    ['Noto Sans SC','assets/fonts/noto-sans-sc/NotoSansSC-Variable.ttf'],
    ['Smiley Sans','assets/fonts/smiley-sans/SmileySans-Oblique.ttf'],
    ['Noto Serif SC','assets/fonts/noto-serif-sc/NotoSerifCJKsc-Bold.otf']
  ];
  for(const [family,relative] of fonts){
    if(GlobalFonts.has?.(family))continue;
    const key=GlobalFonts.registerFromPath(path.join(root,relative),family);
    if(!key)throw new Error(`Unable to register bundled preview font: ${family}`);
  }
}

function roundedRect(ctx,x,y,width,height,fill,radius=16,stroke='rgba(17,17,20,.08)'){
  ctx.beginPath();
  ctx.roundRect(x,y,width,height,radius);
  ctx.fillStyle=fill;
  ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}

function drawText(ctx,x,y,value,size,{fill='#111114',weight=400,family='Noto Sans',align='left',spacing=0,style='normal',maxWidth}={}){
  ctx.save();
  ctx.fillStyle=fill;
  ctx.font=`${style} ${weight} ${size}px "${family}"`;
  ctx.textAlign=align;
  ctx.textBaseline='alphabetic';
  ctx.letterSpacing=`${spacing}px`;
  ctx.fontVariationSettings=`'wght' ${weight}`;
  ctx.textRendering='optimizeLegibility';
  if(maxWidth)ctx.fillText(String(value),x,y,maxWidth);
  else ctx.fillText(String(value),x,y);
  ctx.restore();
}

function parseGradientStops(value){
  const matches=[...String(value).matchAll(/(#[0-9a-f]{6}|rgba?\([^)]+\))\s*([0-9.]+)?%?/gi)];
  return matches.map((match,index)=>({
    color:match[1],
    offset:Number(match[2]??(matches.length===1?0:index/(matches.length-1)*100))/100
  }));
}

function gradientFill(ctx,x,width,value){
  const gradient=ctx.createLinearGradient(x,0,x+width,0);
  for(const stop of parseGradientStops(value))gradient.addColorStop(stop.offset,stop.color);
  return gradient;
}

export async function renderSystemPreview({canvasModule,root,tokens,components,fontManifest,iconManifest,backgroundManifest,outPath}){
  const {createCanvas,GlobalFonts}=canvasModule;
  registerBundledFonts(GlobalFonts,root);

  const width=1920,height=1760,paper='#F2F4F0';
  const canvas=createCanvas(width,height);
  const ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.fillStyle=paper;
  ctx.fillRect(0,0,width,height);

  const colors=Object.entries(tokens.color);
  const gradients=Object.entries(tokens.gradients);
  const layouts=Object.entries(components.layouts);
  const stats=[
    [String(layouts.length).padStart(2,'0'),'LAYOUTS'],
    [String(Object.keys(components.components).length).padStart(2,'0'),'COMPONENTS'],
    [String(backgroundManifest.treatments.length).padStart(2,'0'),'BACKGROUNDS'],
    [String(colors.length).padStart(2,'0'),'BASE COLORS'],
    [String(gradients.length).padStart(2,'0'),'GRADIENTS'],
    [String(fontManifest.families.length).padStart(2,'0'),'FONT FAMILIES'],
    [String(iconManifest.icons.length).padStart(2,'0'),'CURATED ICONS'],
    ['02','LANGUAGES']
  ];

  drawText(ctx,84,92,'PACKAGED DESIGN SYSTEM',17,{fill:'#22DCD1',weight:700,family:'Noto Sans',spacing:1.4});
  drawText(ctx,84,165,'Everything needed to stay consistent',66,{weight:400,family:'Outfit',spacing:-2.2});
  drawText(ctx,1312,108,'Counts are read directly from the packaged registries.',20,{fill:'#5E6263',family:'Noto Sans'});
  drawText(ctx,1312,140,'Fonts, colors, backgrounds, components, and layout',20,{fill:'#5E6263',family:'Noto Sans'});
  drawText(ctx,1312,172,'rules travel with the Skill.',20,{fill:'#5E6263',family:'Noto Sans'});

  const statW=208.5;
  stats.forEach(([number,label],index)=>{
    const x=84+index*(statW+12);
    roundedRect(ctx,x,196,statW,96,'#FFFFFF',15);
    drawText(ctx,x+18,241,number,36,{fill:'#008089',family:'Outfit'});
    drawText(ctx,x+18,272,label,12,{fill:'#626668',weight:600,family:'Noto Sans',spacing:.45});
  });

  roundedRect(ctx,84,320,1026,648,'#FFFFFF',22);
  drawText(ctx,112,366,'Color tokens',27,{weight:600,family:'Outfit'});
  drawText(ctx,1082,366,`${colors.length} base · ${gradients.length} gradients`,13,{fill:'#008089',weight:600,family:'Noto Sans',align:'right'});

  const swatchW=178,swatchGap=10;
  colors.forEach(([name,value],index)=>{
    const column=index%5,row=Math.floor(index/5),x=112+column*(swatchW+swatchGap),y=408+row*88;
    roundedRect(ctx,x,y,swatchW,42,value,9);
    drawText(ctx,x,y+60,title(name),12,{weight:700,family:'Noto Sans'});
    drawText(ctx,x,y+76,String(value).toUpperCase(),9,{fill:'#777B7D',weight:500,family:'Noto Sans'});
  });

  const gradientW=296;
  gradients.forEach(([name,value],index)=>{
    const column=index%3,row=Math.floor(index/3),x=112+column*(gradientW+12),y=774+row*72;
    roundedRect(ctx,x,y,gradientW,42,gradientFill(ctx,x,gradientW,value),9);
    drawText(ctx,x,y+60,title(name),11,{fill:'#4D5153',weight:700,family:'Noto Sans'});
  });

  roundedRect(ctx,1134,320,702,648,'#FFFFFF',22);
  drawText(ctx,1162,366,'Typography',27,{weight:600,family:'Outfit'});
  drawText(ctx,1808,366,'3 English · 3 中文',13,{fill:'#008089',weight:600,family:'Noto Sans SC',align:'right'});

  const typeRows=[
    ['OUTFIT','DISPLAY / TITLE','Clarity at every scale',34,'Outfit',400,'normal'],
    ['NOTO SANS','BODY / LABEL','Readable supporting information for every slide.',24,'Noto Sans',400,'normal'],
    ['INSTRUMENT SERIF','STEP NUMERALS','01 02 03 04',38,'Instrument Serif Italic',400,'normal'],
    ['SMILEY SANS','中文大标题','让复杂内容保持清晰',32,'Smiley Sans',400,'normal'],
    ['NOTO SANS SC','中文正文 / 标签','可靠的正文层级与信息说明',25,'Noto Sans SC',500,'normal'],
    ['NOTO SERIF SC','中文强调文字','让重点被准确看见',27,'Noto Serif SC',700,'normal']
  ];
  typeRows.forEach(([family,role,sample,size,fontFamily,weight,style],index)=>{
    const x=1162,y=408+index*92,w=646,h=78;
    roundedRect(ctx,x,y,w,h,'#F4F5F2',14,'rgba(17,17,20,.07)');
    drawText(ctx,x+18,y+24,family,10,{fill:'#008089',weight:700,family:'Noto Sans',spacing:.7});
    drawText(ctx,x+w-18,y+24,role,10,{fill:'#008089',weight:700,family:'Noto Sans SC',align:'right',spacing:.3});
    drawText(ctx,x+18,y+62,sample,size,{weight,family:fontFamily,style,maxWidth:w-36});
  });

  roundedRect(ctx,84,992,1752,680,'#FFFFFF',22);
  drawText(ctx,112,1045,'Layout inventory',27,{weight:600,family:'Outfit'});
  drawText(ctx,1808,1045,'Every visible field remains editable',13,{fill:'#008089',weight:600,family:'Noto Sans',align:'right'});
  drawText(ctx,132,1116,'LAYOUT',11,{fill:'#717577',weight:700,family:'Noto Sans',spacing:.8});
  drawText(ctx,590,1116,'SUPPORTED COUNT',11,{fill:'#717577',weight:700,family:'Noto Sans',spacing:.8});
  drawText(ctx,1045,1116,'THEMES',11,{fill:'#717577',weight:700,family:'Noto Sans',spacing:.8});
  drawText(ctx,1408,1116,'OPTIONS',11,{fill:'#717577',weight:700,family:'Noto Sans',spacing:.8});

  const rowHeight=44,tableY=1140;
  layouts.forEach(([name,value],index)=>{
    const y=tableY+index*rowHeight;
    ctx.beginPath();ctx.moveTo(112,y);ctx.lineTo(1808,y);ctx.strokeStyle='rgba(17,17,20,.07)';ctx.lineWidth=1;ctx.stroke();
    const counts=value.counts?.join(' / ')||'—';
    const themes=value.themes?.map(theme=>title(theme)).join(' + ')||'—';
    const extras=[value.callout?'Callout':'',value.media?'Media':'',value.image?'Image':''].filter(Boolean).join(' · ')||'Core';
    drawText(ctx,132,y+29,title(name),16,{weight:600,family:'Outfit'});
    drawText(ctx,590,y+29,counts,15,{fill:'#55595B',family:'Noto Sans'});
    drawText(ctx,1045,y+29,themes,15,{fill:'#55595B',family:'Noto Sans'});
    drawText(ctx,1408,y+29,extras,15,{fill:'#55595B',family:'Noto Sans'});
  });

  roundedRect(ctx,112,1600,1696,54,'#E5F6F1',14,null);
  ctx.beginPath();ctx.arc(135,1627,5,0,Math.PI*2);ctx.fillStyle='#008089';ctx.fill();
  drawText(ctx,154,1633,'Only cover titles are centered. Inner titles stay left-aligned, content budgets are enforced, and browser preflight checks overlap and overflow.',15,{weight:600,family:'Outfit'});

  await fs.writeFile(outPath,canvas.toBuffer('image/png'));
  return {width,height,fonts:['Outfit','Instrument Serif','Noto Sans','Smiley Sans','Noto Sans SC','Noto Serif SC']};
}
