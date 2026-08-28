const deckData=window.AIDENT_DECK||{slides:[]};
const slides=[...document.querySelectorAll('.slide')];
const viewport=document.getElementById('viewport');
const deck=document.getElementById('deck');
const count=document.getElementById('page-count');
const dots=document.getElementById('dots');
const overview=document.getElementById('overview');
const params=new URLSearchParams(location.search);
const channelName=`aident-ppt:${location.pathname}`;
const channel='BroadcastChannel'in window?new BroadcastChannel(channelName):null;
let index=Math.max(0,Math.min(slides.length-1,Number(params.get('slide')||0)));
let audienceWindow=null;
let frozen=false;
let timerStarted=0;
let elapsed=0;
let timerHandle=0;

const pad=n=>String(n).padStart(2,'0');
const formatTime=ms=>`${pad(Math.floor(ms/60000))}:${pad(Math.floor(ms/1000)%60)}`;
const pageUrl=(mode,i)=>{
  const url=new URL(location.href);
  url.search='';
  url.searchParams.set(mode,'1');
  url.searchParams.set('slide',String(i));
  return url.href;
};

function fitOneLine(){
  document.querySelectorAll('[data-one-line]').forEach(node=>{
    node.style.fontSize='';
    const initial=parseFloat(getComputedStyle(node).fontSize)||16;
    const minimum=node.classList.contains('metric-value')?46:node.classList.contains('item-title')?32:14;
    let size=initial;
    while(node.scrollWidth>node.clientWidth+1&&size>minimum){size-=1;node.style.fontSize=`${size}px`}
    node.dataset.fittedSize=String(size);
  });
}

function fit(){
  const scale=Math.min(innerWidth/1920,innerHeight/1080);
  document.documentElement.style.setProperty('--scale',String(scale));
  document.querySelectorAll('.presenter-frame').forEach(frame=>{
    const iframe=frame.querySelector('iframe');
    if(!iframe)return;
    const r=frame.getBoundingClientRect();
    const s=Math.min(r.width/1920,r.height/1080);
    iframe.style.transform=`scale(${s})`;
  });
}

function broadcast(type,payload={}){
  const message={source:'aident-ppt',type,index,...payload,at:Date.now()};
  channel?.postMessage(message);
  try{audienceWindow?.postMessage(message,'*')}catch{}
}

function show(next,{emit=true}={}){
  if(!slides.length)return;
  index=Math.max(0,Math.min(slides.length-1,next));
  slides.forEach((slide,i)=>{
    const active=i===index;
    slide.classList.toggle('is-active',active);
    slide.setAttribute('aria-hidden',String(!active));
    if(active){slide.querySelectorAll('[data-anim]').forEach(node=>{node.style.animation='none';void node.offsetWidth;node.style.animation='';});}
  });
  count.textContent=`${index+1} / ${slides.length}`;
  [...dots.children].forEach((dot,i)=>dot.classList.toggle('is-active',i===index));
  history.replaceState(null,'',`${location.pathname}${location.search.replace(/([?&])slide=\d+(&?)/,(_,a,b)=>b?a:'').replace(/[?&]$/,'')}${location.search?'&':'?'}slide=${index}${location.hash}`);
  updatePresenter();
  if(emit&&!frozen)broadcast('goto',{index});
}

function buildDots(){
  dots.innerHTML='';
  slides.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.ariaLabel=`Go to slide ${i+1}`;b.onclick=()=>show(i);dots.appendChild(b);});
}

function openOverview(){
  overview.classList.toggle('is-open');
  if(!overview.classList.contains('is-open'))return;
  const grid=overview.querySelector('.overview-grid');
  if(grid.childElementCount)return;
  slides.forEach((slide,i)=>{
    const item=document.createElement('button');item.type='button';item.className='overview-item';
    const iframe=document.createElement('iframe');iframe.src=pageUrl('embed',i);iframe.tabIndex=-1;
    const label=document.createElement('strong');label.textContent=`${i+1}. ${deckData.slides?.[i]?.title||slide.dataset.id||'Slide'}`;
    item.append(iframe,label);item.onclick=()=>{overview.classList.remove('is-open');show(i)};grid.appendChild(item);
  });
}

function openAudience(){
  audienceWindow=window.open(pageUrl('audience',index),'aident-ppt-audience','popup=yes,width=1280,height=720');
  setTimeout(()=>broadcast('hello',{index}),500);
}

function setScreen(mode){
  const cover=document.getElementById('screen-cover');
  cover.className=mode==='normal'?'':mode;
  broadcast('screen',{mode});
}

function openPresenter(){
  document.body.classList.add('presenter');
  openAudience();fit();updatePresenter();
}

function exitPresenter(){document.body.classList.remove('presenter');try{audienceWindow?.close()}catch{}audienceWindow=null}

function updatePresenter(){
  if(!document.body.classList.contains('presenter'))return;
  const current=document.getElementById('current-frame');
  const next=document.getElementById('next-frame');
  const currentSrc=pageUrl('embed',index),nextSrc=pageUrl('embed',Math.min(index+1,slides.length-1));
  if(current.src!==currentSrc)current.src=currentSrc;
  if(next.src!==nextSrc)next.src=nextSrc;
  const note=deckData.slides?.[index]?.notes||{};
  document.getElementById('note-title').textContent=note.title||deckData.slides?.[index]?.title||`Slide ${index+1}`;
  document.getElementById('note-purpose').textContent=note.purpose||'';
  document.getElementById('note-talk').innerHTML=(note.talk||[]).map(item=>`<li>${String(item).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</li>`).join('');
  document.getElementById('note-transition').textContent=note.transition?`Next: ${note.transition}`:'';
  fit();
}

function toggleTimer(){
  const button=document.querySelector('[data-p="timer"]');
  if(timerStarted){elapsed+=Date.now()-timerStarted;timerStarted=0;clearInterval(timerHandle);timerHandle=0;button.textContent='Continue';}
  else{timerStarted=Date.now();timerHandle=setInterval(()=>{document.getElementById('timer').textContent=formatTime(elapsed+Date.now()-timerStarted)},250);button.textContent='Pause';}
}

document.querySelector('[data-action="prev"]').onclick=()=>show(index-1);
document.querySelector('[data-action="next"]').onclick=()=>show(index+1);
document.querySelector('[data-action="overview"]').onclick=openOverview;
document.querySelector('[data-action="presenter"]').onclick=openPresenter;
document.querySelectorAll('[data-p]').forEach(button=>button.onclick=()=>{
  const action=button.dataset.p;
  if(action==='first')show(0);if(action==='prev')show(index-1);if(action==='next')show(index+1);if(action==='last')show(slides.length-1);
  if(action==='timer')toggleTimer();if(action==='black')setScreen('black');if(action==='white')setScreen('white');
  if(action==='freeze'){frozen=!frozen;button.textContent=frozen?'Unfreeze':'Freeze';if(!frozen)broadcast('goto',{index});}
  if(action==='reopen')openAudience();if(action==='exit')exitPresenter();
});

addEventListener('keydown',event=>{
  if(event.target.matches('input,textarea,[contenteditable]'))return;
  if(event.key==='ArrowRight'||event.key==='PageDown'||event.key===' '){event.preventDefault();show(index+1)}
  if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();show(index-1)}
  if(event.key==='Home')show(0);if(event.key==='End')show(slides.length-1);
  if(event.key.toLowerCase()==='g'||event.key==='Escape')openOverview();
  if(event.key.toLowerCase()==='p')openPresenter();
  if(event.key.toLowerCase()==='b'&&!document.body.classList.contains('presenter'))document.body.classList.toggle('low-power');
  if(document.body.classList.contains('presenter')&&event.key.toLowerCase()==='b')setScreen('black');
  if(document.body.classList.contains('presenter')&&event.key.toLowerCase()==='w')setScreen('white');
  if(document.body.classList.contains('presenter')&&event.key.toLowerCase()==='f'){frozen=!frozen;if(!frozen)broadcast('goto',{index});}
});

function receive(message){
  if(!message||message.source!=='aident-ppt')return;
  if(message.type==='goto'&&!params.has('presenter'))show(Number(message.index),{emit:false});
  if(message.type==='screen'){const cover=document.getElementById('screen-cover');cover.className=message.mode==='normal'?'':message.mode;}
  if(message.type==='hello'&&params.has('audience'))broadcast('ready',{index});
  if(message.type==='ready')document.querySelector('.sync-state').textContent='Audience · connected';
}
channel&&(channel.onmessage=event=>receive(event.data));
addEventListener('message',event=>receive(event.data));
addEventListener('resize',fit);

buildDots();fitOneLine();fit();show(index,{emit:false});
if(params.has('embed')){document.body.classList.add('embed');document.getElementById('nav').remove();slides.forEach((s,i)=>s.setAttribute('aria-hidden',String(i!==index)));}
if(params.has('audience')){document.getElementById('nav').remove();broadcast('ready',{index});}
if(params.has('presenter'))openPresenter();
requestAnimationFrame(()=>document.body.classList.add('ready'));
