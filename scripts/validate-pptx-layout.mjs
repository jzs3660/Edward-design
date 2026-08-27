#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

function parseArgs(argv){const args={};for(let i=2;i<argv.length;i++){if(argv[i]==='--layouts')args.layouts=argv[++i];else if(argv[i]==='--help')args.help=true;else throw new Error(`Unknown argument: ${argv[i]}`)}return args}
const usage='Usage: node scripts/validate-pptx-layout.mjs --layouts output/deck/pptx-qa\n';
const args=parseArgs(process.argv);
if(args.help){process.stdout.write(usage);process.exit(0)}
if(!args.layouts)throw new Error(usage.trim());

const directory=path.resolve(args.layouts);
const files=(await fs.readdir(directory)).filter(name=>/^slide-\d+\.layout\.json$/.test(name)).sort();
if(!files.length)throw new Error(`No slide layout JSON files found in ${directory}`);

const errors=[];
const oneLineNames=new Set(['point-title','card-title','metric-title','step-title','step-number','step-label','callout-metric','source']);
for(const file of files){
  const layout=JSON.parse(await fs.readFile(path.join(directory,file),'utf8'));
  const [slideWidth,slideHeight]=[layout.slide?.frame?.width||1920,layout.slide?.frame?.height||1080];
  for(const element of layout.elements||[]){
    const [left,top,width,height]=element.bbox||[];
    if([left,top,width,height].every(Number.isFinite)&&(left<-.5||top<-.5||left+width>slideWidth+.5||top+height>slideHeight+.5))errors.push(`${file}: ${element.name||element.kind} leaves slide bounds.`);
    if(oneLineNames.has(element.name)&&Number(element.textLayout?.lineCount||0)>1)errors.push(`${file}: ${element.name} wraps to ${element.textLayout.lineCount} lines: "${element.text||''}".`);
  }
}

for(const error of errors)console.error(`ERROR ${error}`);
console.log(`PPTX layout validation: ${files.length} slides, ${errors.length} errors.`);
if(errors.length)process.exitCode=1;
