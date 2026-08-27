#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

function parseArgs(argv){const args={};for(let i=2;i<argv.length;i++){if(argv[i]==='--screenshots')args.screenshots=argv[++i];else if(argv[i]==='--out')args.out=argv[++i];else throw new Error(`Unknown argument: ${argv[i]}`)}return args}
async function importPackage(name){const require=createRequire(import.meta.url);const resolved=require.resolve(name,{paths:[process.env.RUNTIME_NODE_MODULES,path.resolve('node_modules')].filter(Boolean)});return import(pathToFileURL(resolved).href)}

const args=parseArgs(process.argv);
if(!args.screenshots||!args.out)throw new Error('Usage: node scripts/build-preview.mjs --screenshots output/example-en/qa --out assets/previews/aident-ppt-showcase.png');
const sharpModule=await importPackage('sharp');
const sharp=sharpModule.default||sharpModule;
const dir=path.resolve(args.screenshots);
const files=(await fs.readdir(dir)).filter(name=>/^slide-\d+\.png$/.test(name)).sort();
if(!files.length)throw new Error(`No slide screenshots found in ${dir}`);
const columns=3,thumbWidth=640,thumbHeight=360,gap=24,padding=24,rows=Math.ceil(files.length/columns);
const width=padding*2+columns*thumbWidth+(columns-1)*gap;
const height=padding*2+rows*thumbHeight+(rows-1)*gap;
const composites=[];
for(const [index,file] of files.entries()){
  const input=await sharp(path.join(dir,file)).resize(thumbWidth,thumbHeight,{fit:'cover'}).png().toBuffer();
  composites.push({input,left:padding+(index%columns)*(thumbWidth+gap),top:padding+Math.floor(index/columns)*(thumbHeight+gap)});
}
await fs.mkdir(path.dirname(path.resolve(args.out)),{recursive:true});
await sharp({create:{width,height,channels:4,background:'#09080d'}}).composite(composites).png().toFile(path.resolve(args.out));
console.log(`Preview montage: ${files.length} slides, ${width}×${height}, ${path.resolve(args.out)}`);
