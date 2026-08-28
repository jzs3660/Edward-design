#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const ignored=new Set(['assets/manifest.json']);
async function walk(dir){const out=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(p));else out.push(p)}return out}
const rasterRoots=['assets/backgrounds','assets/textures','assets/previews'];
const rasterErrors=[];
for(const relativeRoot of rasterRoots){
  for(const file of await walk(path.join(root,relativeRoot))){
    const ext=path.extname(file).toLowerCase();
    if(ext==='.png')rasterErrors.push(`${path.relative(root,file)} must be converted to lossless WebP.`);
    if(ext==='.webp'){
      const bytes=await fs.readFile(file);
      const validContainer=bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP';
      const hasLosslessChunk=bytes.indexOf(Buffer.from('VP8L'),12)>=0;
      if(!validContainer||!hasLosslessChunk)rasterErrors.push(`${path.relative(root,file)} is not a lossless WebP bitstream.`);
    }
  }
}
const compiledDir=path.join(root,'assets/backgrounds/compiled');
const compiledFiles=await fs.readdir(compiledDir).catch(()=>[]);
if(compiledFiles.length)rasterErrors.push('assets/backgrounds/compiled must stay empty/absent; PPTX rasterizes canonical WebP assets in memory.');
if(rasterErrors.length)throw new Error(`Raster asset validation failed:\n- ${rasterErrors.join('\n- ')}`);
const files=(await walk(path.join(root,'assets'))).sort();
const entries=[];
for(const file of files){const rel=path.relative(root,file).split(path.sep).join('/');if(ignored.has(rel))continue;const bytes=await fs.readFile(file);entries.push({path:rel,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')})}
const manifest={version:1,generatedAt:new Date().toISOString(),fileCount:entries.length,totalBytes:entries.reduce((n,e)=>n+e.bytes,0),files:entries};
await fs.writeFile(path.join(root,'assets/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Indexed ${manifest.fileCount} assets (${manifest.totalBytes} bytes).`);
