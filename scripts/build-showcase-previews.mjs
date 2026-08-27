#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {renderShowcasePreview} from './lib/render-showcase-preview.mjs';

const root=process.cwd(),require=createRequire(import.meta.url);
const languageArg=process.argv.includes('--language')?process.argv[process.argv.indexOf('--language')+1]:null;
if(languageArg&&!['en','zh'].includes(languageArg))throw new Error('--language must be en or zh');
const resolved=require.resolve('@napi-rs/canvas',{paths:[process.env.RUNTIME_NODE_MODULES,path.resolve('node_modules')].filter(Boolean)});
const canvasModule=await import(pathToFileURL(resolved).href);

async function slides(relative){
  const directory=path.join(root,relative);
  const names=(await fs.readdir(directory)).filter(name=>/^slide-\d+\.png$/.test(name)).sort();
  if(names.length!==9)throw new Error(`${relative} must contain 9 slide screenshots; received ${names.length}`);
  return names.map(name=>path.join(directory,name));
}

const previewDir=path.join(root,'assets/previews');
await fs.mkdir(previewDir,{recursive:true});
for(const [language,source,file] of [
  ['en','output/example-en/qa','aident-ppt-showcase.png'],
  ['zh','output/example-zh/qa','aident-ppt-showcase.zh.png']
]){
  if(languageArg&&language!==languageArg)continue;
  const size=await renderShowcasePreview({canvasModule,root,language,slidePaths:await slides(source),outPath:path.join(previewDir,file)});
  console.log(`${file}: ${size.width}×${size.height} · direct bundled-font canvas renderer`);
}
