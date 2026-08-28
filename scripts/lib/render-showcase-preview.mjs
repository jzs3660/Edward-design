import {registerBundledFonts} from './render-system-preview.mjs';

function drawText(ctx,x,y,value,size,{fill='#FFFFFF',weight=400,family='Noto Sans',align='left',spacing=0,maxWidth}={}){
  ctx.save();
  ctx.fillStyle=fill;
  ctx.font=`normal ${weight} ${size}px "${family}"`;
  ctx.fontVariationSettings=`'wght' ${weight}`;
  ctx.textAlign=align;
  ctx.textBaseline='alphabetic';
  ctx.letterSpacing=`${spacing}px`;
  ctx.textRendering='optimizeLegibility';
  if(maxWidth)ctx.fillText(String(value),x,y,maxWidth);
  else ctx.fillText(String(value),x,y);
  ctx.restore();
}

function roundRect(ctx,x,y,width,height,radius,fill,stroke){
  ctx.beginPath();ctx.roundRect(x,y,width,height,radius);ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}

export async function renderShowcasePreview({canvasModule,sharp,root,language,slidePaths,outPath}){
  if(slidePaths.length!==9)throw new Error(`Showcase needs 9 slides; received ${slidePaths.length}`);
  const {createCanvas,GlobalFonts,loadImage}=canvasModule;
  registerBundledFonts(GlobalFonts,root);
  const width=2048,height=1340;
  const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.fillStyle='#0B0A0F';ctx.fillRect(0,0,width,height);

  const teal=ctx.createRadialGradient(1700,0,20,1700,0,780);
  teal.addColorStop(0,'rgba(35,58,63,.60)');teal.addColorStop(1,'rgba(35,58,63,0)');ctx.fillStyle=teal;ctx.fillRect(0,0,width,height);
  const purple=ctx.createRadialGradient(360,1340,10,360,1340,850);
  purple.addColorStop(0,'rgba(34,22,59,.75)');purple.addColorStop(1,'rgba(34,22,59,0)');ctx.fillStyle=purple;ctx.fillRect(0,0,width,height);

  if(language==='zh'){
    drawText(ctx,48,66,'中文系统 · 9 SLIDES',17,{fill:'#43EEE2',weight:700,family:'Noto Sans SC',spacing:1.2});
    drawText(ctx,48,122,'九种中文页面版式',54,{weight:400,family:'Smiley Sans',spacing:-1});
    drawText(ctx,1400,78,'与英文示例保持同样的九页覆盖，用真实中文层级验证字号、',18,{fill:'#B7B5C0',family:'Noto Sans SC'});
    drawText(ctx,1400,108,'行高、字距、密集卡片和图片版式。',18,{fill:'#B7B5C0',family:'Noto Sans SC'});
  }else{
    drawText(ctx,48,66,'ENGLISH SYSTEM · 9 SLIDES',17,{fill:'#43EEE2',weight:700,family:'Noto Sans',spacing:1.2});
    drawText(ctx,48,122,'Nine real English layouts',54,{weight:400,family:'Outfit',spacing:-1.5});
    drawText(ctx,1334,78,'A complete example deck covering cover, points, workflow, metrics,',18,{fill:'#B7B5C0',family:'Noto Sans'});
    drawText(ctx,1334,108,'comparison, dense cards, image cards, team, and split image/text.',18,{fill:'#B7B5C0',family:'Noto Sans'});
  }

  const gridX=48,gridY=188,gap=28,cardW=(width-96-gap*2)/3,cardH=cardW*9/16;
  for(let index=0;index<slidePaths.length;index++){
    const column=index%3,row=Math.floor(index/3),x=gridX+column*(cardW+gap),y=gridY+row*(cardH+gap);
    const image=await loadImage(slidePaths[index]);
    ctx.save();ctx.beginPath();ctx.roundRect(x,y,cardW,cardH,12);ctx.clip();ctx.drawImage(image,x,y,cardW,cardH);ctx.restore();
    ctx.beginPath();ctx.roundRect(x,y,cardW,cardH,12);ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1;ctx.stroke();
    roundRect(ctx,x+cardW-50,y+12,38,27,14,'rgba(11,10,15,.84)','rgba(255,255,255,.14)');
    drawText(ctx,x+cardW-31,y+31,String(index+1).padStart(2,'0'),12,{fill:'#9FFFF7',weight:600,family:'Outfit',align:'center'});
  }

  await sharp(canvas.toBuffer('image/png')).webp({lossless:true,effort:6}).toFile(outPath);
  return {width,height};
}
