#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

function parseArgs(argv){const args={};for(let i=2;i<argv.length;i++){if(argv[i]==='--screenshots')args.screenshots=argv[++i];else if(argv[i]==='--out')args.out=argv[++i];else throw new Error(`Unknown argument: ${argv[i]}`)}return args}
async function importPackage(name){const require=createRequire(import.meta.url);const resolved=require.resolve(name,{paths:[process.env.RUNTIME_NODE_MODULES,path.resolve('node_modules')].filter(Boolean)});return import(pathToFileURL(resolved).href)}

const args=parseArgs(process.argv);
if(!args.screenshots||!args.out)throw new Error('Usage: node scripts/build-preview.mjs --screenshots output/<example>/qa --out assets/previews/<showcase>.webp');
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
  const row=Math.floor(index/columns),column=index%columns;
  const itemsInRow=Math.min(columns,files.length-row*columns);
  const fullRowWidth=columns*thumbWidth+(columns-1)*gap;
  const currentRowWidth=itemsInRow*thumbWidth+(itemsInRow-1)*gap;
  const rowOffset=Math.round((fullRowWidth-currentRowWidth)/2);
  composites.push({input,left:padding+rowOffset+column*(thumbWidth+gap),top:padding+row*(thumbHeight+gap)});
}
await fs.mkdir(path.dirname(path.resolve(args.out)),{recursive:true});
const pipeline=sharp({create:{width,height,channels:4,background:'#09080d'}}).composite(composites);
if(path.extname(args.out).toLowerCase()==='.webp')await pipeline.webp({lossless:true,effort:6}).toFile(path.resolve(args.out));
else await pipeline.png({compressionLevel:9,adaptiveFiltering:true}).toFile(path.resolve(args.out));
console.log(`Preview montage: ${files.length} slides, ${width}×${height}, ${path.resolve(args.out)}`);
