#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[];
let checks=0;
const check=(condition,message)=>{checks++;if(!condition)errors.push(message)};
const read=relative=>fs.readFile(path.join(root,relative),'utf8');

async function walk(directory){
  const files=[];
  for(const entry of await fs.readdir(directory,{withFileTypes:true})){
    const target=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

const [tokens,registry,css,generator,pptx,schema]=await Promise.all([
  read('assets/tokens/tokens.json').then(JSON.parse),
  read('assets/components/registry.json').then(JSON.parse),
  read('assets/runtime/deck.css'),
  read('scripts/generate-deck.mjs'),
  read('scripts/export-pptx.mjs'),
  read('references/deck.schema.json').then(JSON.parse),
]);

const callout=registry.components?.callout||{};
const workflow=registry.components?.workflow||{};
check(tokens.gradients?.calloutAccent==='linear-gradient(90deg,rgba(160,169,254,.16) 0%,rgba(46,238,238,.16) 47.9%,rgba(147,252,184,.16) 100%)','Token gradients.calloutAccent drifted from the registered 16% gradient.');
check(callout.accentPaintOpacity===0.16,'Callout accentPaintOpacity must be 0.16.');
check(callout.blurPx===20,'Callout blurPx must be 20.');
check(callout.stroke===false,'Callout stroke must remain disabled.');
check(callout.itemGap===12,'Callout adjacent-item gap must be 12px.');
check(JSON.stringify(callout.padding)==='[20,20]','Callout padding must be 20px on both axes.');
check(callout.heights?.default===70&&callout.heights?.accent===88,'Callout minimum heights must be 70px default and 88px Accent.');
check(callout.bullet?.required===true&&callout.bullet?.size===12,'Callout must retain its required 12px dot.');

const compactCss=css.replace(/\s+/g,'').toLowerCase();
for(const stop of ['rgba(160,169,254,.16)','rgba(46,238,238,.16)','rgba(147,252,184,.16)'])check(compactCss.includes(stop),`Runtime CSS is missing registered Callout stop ${stop}.`);
check(compactCss.includes('.callout{width:100%;min-height:70px;height:auto;border:0;border-radius:16px;padding:20px;'),'Runtime Callout base geometry drifted.');
check(compactCss.includes('gap:12px;')&&compactCss.includes('backdrop-filter:blur(20px);'),'Runtime Callout spacing or blur drifted.');
check(compactCss.includes('.callout.accent{min-height:88px;background:var(--callout-accent)}'),'Runtime Accent Callout must keep an 88px minimum and registered token.');
check(compactCss.includes('.slide[data-theme="dark"].callout.accent{background:var(--callout-accent)}')||compactCss.includes('.slide[data-theme="dark"] .callout.accent{background:var(--callout-accent)}'),'Dark-theme specificity must not override the Accent Callout gradient.');

check(workflow.arrow?.renderedCount==='steps-1'&&workflow.arrow?.trailingArrow===false,'Workflow arrow contract must render only between adjacent steps.');
check(workflow.arrow?.separateFromStep===true,'Workflow arrows must stay outside Step components.');
check(compactCss.includes('.workflow-arrow:last-child{visibility:hidden}'),'HTML workflow must hide the terminal arrow slot.');
check(compactCss.includes('.workflow.no-dividers.workflow-step+.workflow-step::before{display:none}')||compactCss.includes('.workflow.no-dividers .workflow-step+.workflow-step::before{display:none}'),'HTML workflow must implement showDividers:false.');
check(generator.includes("slide.showDividers===false?'no-dividers':''"),'Generator must bind showDividers:false to HTML.');
check(generator.includes('is not a registered field.'),'Generator must reject unknown fields rather than silently ignore typos.');
check(pptx.includes('for(let i=0;i<n-1;i++)'),'PPTX workflow must omit a trailing arrow.');
check(pptx.includes("height=hasMetric||tone==='accent'?88:70"),'PPTX Callout height contract drifted.');

const slideProperties=schema.$defs?.slide?.properties||{};
check(schema.$defs?.slide?.additionalProperties===false,'Slide schema must reject unknown fields.');
check(schema.$defs?.item?.additionalProperties===false,'Item schema must reject unknown fields.');
for(const property of ['workflowLabel','showWorkflowLabel','showArrows','showDividers','showStepLabels'])check(property in slideProperties,`Slide schema is missing ${property}.`);

const jsonRoots=['agents','assets','examples','references'];
const jsonFiles=[path.join(root,'package.json')];
for(const directory of jsonRoots)for(const file of await walk(path.join(root,directory)))if(file.endsWith('.json'))jsonFiles.push(file);
for(const file of jsonFiles){
  try{JSON.parse(await fs.readFile(file,'utf8'));checks++;}
  catch(error){errors.push(`${path.relative(root,file)} is invalid JSON: ${error.message}`);}
}

const markdownFiles=[path.join(root,'SKILL.md'),path.join(root,'README.md'),path.join(root,'README.en.md'),path.join(root,'NOTICE.md'),path.join(root,'AGENTS.md'),...(await walk(path.join(root,'references'))).filter(file=>file.endsWith('.md'))];
for(const file of markdownFiles){
  const source=await fs.readFile(file,'utf8');
  for(const match of source.matchAll(/!?(?:\[[^\]]*\])\(([^)]+)\)/g)){
    let target=match[1].trim().replace(/^<|>$/g,'').split('#')[0].split('?')[0];
    if(!target||/^(?:https?:|mailto:|data:|#|\/)/i.test(target))continue;
    try{target=decodeURIComponent(target);}catch{}
    const resolved=path.resolve(path.dirname(file),target);
    check(await fs.access(resolved).then(()=>true).catch(()=>false),`${path.relative(root,file)} links to missing ${target}.`);
  }
}

const publishableTextExtensions=new Set(['.css','.html','.js','.json','.md','.mjs','.txt','.yml','.yaml']);
const publishableRoots=['agents','assets','examples','references','scripts'];
const publishableFiles=[
  path.join(root,'SKILL.md'),
  path.join(root,'README.md'),
  path.join(root,'README.en.md'),
  path.join(root,'NOTICE.md'),
  path.join(root,'AGENTS.md'),
  path.join(root,'package.json'),
];
for(const directory of publishableRoots){
  for(const file of await walk(path.join(root,directory))){
    if(publishableTextExtensions.has(path.extname(file).toLowerCase()))publishableFiles.push(file);
  }
}
const localMacPathMarker=['','Users',''].join('/');
const privateDesignKeyMarker=['s3tgmr5U','cp3VeGNQQrhCF0'].join('');
for(const file of publishableFiles){
  const source=await fs.readFile(file,'utf8');
  check(!source.includes(localMacPathMarker),`${path.relative(root,file)} contains a local macOS user path.`);
  check(!source.includes(privateDesignKeyMarker),`${path.relative(root,file)} contains the private Figma file key.`);
}

if(errors.length){for(const error of errors)console.error(`ERROR ${error}`);console.error(`System validation failed: ${errors.length} error(s), ${checks} checks.`);process.exit(1);}
console.log(`System validation passed: ${checks} contract and package checks.`);
