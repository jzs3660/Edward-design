#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/fonts/manifest.json'),'utf8'));
let failed=false;
for(const family of manifest.families){
  if(family.bundled){
    const files=new Set([...(family.files||[]),...(family.web||[]).map(face=>face.file)]);
    for(const rel of files){const file=path.join(root,'assets/fonts',rel);const ok=await fs.stat(file).then(s=>s.isFile()&&s.size>1000).catch(()=>false);console.log(`${ok?'OK':'MISSING'} bundled ${family.family}: ${rel}`);if(!ok)failed=true}
    if(!family.web?.length){console.log(`MISSING web face ${family.family}`);failed=true}
  }
  else console.log(`LOCAL required ${family.family}: ${family.cssLocalNames.join(' | ')}`);
}
if(failed)process.exitCode=1;
