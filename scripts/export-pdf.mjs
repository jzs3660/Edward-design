#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

function argsOf(argv){const a={};for(let i=2;i<argv.length;i++){if(argv[i]==='--html')a.html=argv[++i];else if(argv[i]==='--out')a.out=argv[++i];else throw new Error(`Unknown argument: ${argv[i]}`)}return a}
async function importPackage(name){const require=createRequire(import.meta.url);const resolved=require.resolve(name,{paths:[process.env.RUNTIME_NODE_MODULES,path.resolve('node_modules')].filter(Boolean)});return import(pathToFileURL(resolved).href)}
async function browserExecutable(){for(const candidate of [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium'].filter(Boolean)){if(await fs.access(candidate).then(()=>true).catch(()=>false))return candidate}return undefined}
const args=argsOf(process.argv);if(!args.html||!args.out)throw new Error('Usage: node scripts/export-pdf.mjs --html output/deck/index.html --out output/deck.pdf');
const playwrightModule=await importPackage('playwright');const {chromium}=playwrightModule.default||playwrightModule;const browser=await chromium.launch({headless:true,executablePath:await browserExecutable()});const page=await browser.newPage({viewport:{width:1920,height:1080}});
await page.goto(pathToFileURL(path.resolve(args.html)).href,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);await page.emulateMedia({media:'print'});
await fs.mkdir(path.dirname(path.resolve(args.out)),{recursive:true});await page.pdf({path:path.resolve(args.out),width:'1920px',height:'1080px',printBackground:true,preferCSSPageSize:true,margin:{top:'0',right:'0',bottom:'0',left:'0'}});
await browser.close();console.log(`PDF exported: ${path.resolve(args.out)}`);
