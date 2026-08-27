#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

function parseArgs(argv){const args={};for(let i=2;i<argv.length;i++){if(argv[i]==='--html')args.html=argv[++i];else if(argv[i]==='--require-notes')args.requireNotes=true;else if(argv[i]==='--help')args.help=true;else throw new Error(`Unknown argument: ${argv[i]}`)}return args}
const usage='Usage: node scripts/validate-presenter.mjs --html output/deck/index.html [--require-notes]\n';
const args=parseArgs(process.argv);if(args.help){process.stdout.write(usage);process.exit(0)}if(!args.html)throw new Error(usage.trim());

const htmlPath=path.resolve(args.html),html=await fs.readFile(htmlPath,'utf8');
const errors=[],warnings=[];
const check=(condition,message)=>{if(!condition)errors.push(message)};
const slideIds=[...html.matchAll(/<section\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*data-id="([^"]+)"/g)].map(match=>match[1]);
check(slideIds.length>0,'No slide IDs found.');
check(new Set(slideIds).size===slideIds.length,'Slide IDs must be unique.');
slideIds.forEach(id=>check(/^[a-z0-9][a-z0-9-]*$/.test(id),`Invalid stable slide ID: ${id}`));

const dataMatch=html.match(/window\.AIDENT_DECK=([\s\S]*?);<\/script>/);
let deckData=null;
if(!dataMatch)errors.push('Missing window.AIDENT_DECK presenter data.');
else try{deckData=JSON.parse(dataMatch[1]);}catch(error){errors.push(`Presenter data is invalid JSON: ${error.message}`);}
if(deckData){
  check(Array.isArray(deckData.slides),'Presenter data slides must be an array.');
  if(Array.isArray(deckData.slides)){
    check(deckData.slides.length===slideIds.length,`Presenter data has ${deckData.slides.length} slides for ${slideIds.length} rendered slides.`);
    deckData.slides.forEach((slide,index)=>{
      check(slide?.id===slideIds[index],`Presenter slide ${index+1} ID does not match rendered order.`);
      if(args.requireNotes){
        const notes=slide?.notes||{};
        if(!String(notes.purpose||'').trim()||!Array.isArray(notes.talk)||!notes.talk.length||!String(notes.transition||'').trim())errors.push(`Slide ${slide?.id||index+1} requires purpose, talk points, and transition notes.`);
      }else if(!Object.keys(slide?.notes||{}).length)warnings.push(`Slide ${slide?.id||index+1} has no presenter notes.`);
    });
  }
}

for(const id of ['nav','overview','presenter','current-frame','next-frame','note-title','note-purpose','note-talk','note-transition','timer','screen-cover'])check(new RegExp(`id="${id}"`).test(html),`Presenter shell is missing #${id}.`);
for(const action of ['prev','next','overview','presenter'])check(new RegExp(`data-action="${action}"`).test(html),`Audience controls are missing ${action}.`);
for(const action of ['first','prev','next','last','timer','black','white','freeze','reopen','exit'])check(new RegExp(`data-p="${action}"`).test(html),`Presenter controls are missing ${action}.`);

const runtimeRef=html.match(/<script src="([^"]*deck\.js)"><\/script>/)?.[1];
let runtime=html;
if(runtimeRef&&!/^(?:https?:|data:)/i.test(runtimeRef))runtime=await fs.readFile(path.resolve(path.dirname(htmlPath),runtimeRef),'utf8');
for(const [label,pattern] of [
  ['BroadcastChannel synchronization',/BroadcastChannel/],
  ['direct-window synchronization',/postMessage/],
  ['current/next preview update',/updatePresenter/],
  ['audience reopen',/openAudience/],
  ['timer',/toggleTimer/],
  ['black/white screen',/setScreen/],
  ['freeze/unfreeze',/frozen/],
  ['keyboard navigation',/addEventListener\('keydown'/],
])check(pattern.test(runtime),`Runtime is missing ${label}.`);

if(errors.length){errors.forEach(error=>console.error(`ERROR ${error}`));warnings.forEach(warning=>console.warn(`WARN ${warning}`));console.error(`Presenter validation failed: ${errors.length} error(s), ${warnings.length} warning(s).`);process.exit(1);}
warnings.forEach(warning=>console.warn(`WARN ${warning}`));
console.log(`Presenter validation passed: ${slideIds.length} slides, ${warnings.length} warning(s).`);
