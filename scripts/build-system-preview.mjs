#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {renderSystemPreview} from './lib/render-system-preview.mjs';

const root=process.cwd();
const require=createRequire(import.meta.url);
const resolved=require.resolve('@napi-rs/canvas',{paths:[process.env.RUNTIME_NODE_MODULES,path.resolve('node_modules')].filter(Boolean)});
const canvasModule=await import(pathToFileURL(resolved).href);
const sharpResolved=require.resolve('sharp',{paths:[process.env.RUNTIME_NODE_MODULES,path.resolve('node_modules')].filter(Boolean)});
const sharpModule=await import(pathToFileURL(sharpResolved).href);
const sharp=sharpModule.default||sharpModule;

const readJson=relative=>fs.readFile(path.join(root,relative),'utf8').then(JSON.parse);
const [tokens,components,fontManifest,iconManifest,backgroundManifest]=await Promise.all([
  readJson('assets/tokens/tokens.json'),
  readJson('assets/components/registry.json'),
  readJson('assets/fonts/manifest.json'),
  readJson('assets/icons/manifest.json'),
  readJson('assets/backgrounds/manifest.json')
]);

const outPath=path.join(root,'assets/previews/aident-ppt-system.webp');
await fs.mkdir(path.dirname(outPath),{recursive:true});
const size=await renderSystemPreview({canvasModule,sharp,root,tokens,components,fontManifest,iconManifest,backgroundManifest,outPath});
console.log(`aident-ppt-system.webp: ${size.width}×${size.height} · lossless WebP direct bundled-font canvas renderer`);
