#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
async function importPackage(name){const require=createRequire(import.meta.url);const resolved=require.resolve(name,{paths:[process.env.RUNTIME_NODE_MODULES,path.resolve('node_modules')].filter(Boolean)});return import(pathToFileURL(resolved).href)}
const sharpModule=await importPackage('sharp');
const sharp=sharpModule.default||sharpModule;
const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/backgrounds/manifest.json'),'utf8'));

const outDir=path.join(root,'assets/backgrounds/compiled');
await fs.mkdir(outDir,{recursive:true});
for(const entry of manifest.treatments){
  const source=path.join(root,'assets/backgrounds',entry.source);
  const out=path.join(root,'assets/backgrounds',entry.compiledPptx);
  await sharp(source).resize(1920,1080,{fit:'cover'}).png().toFile(out);
  console.log(`Compiled ${path.relative(root,out)} (${entry.theme}/${entry.usage})`);
}
