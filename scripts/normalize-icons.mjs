#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const checkOnly=process.argv.includes('--check');
const unexpected=process.argv.slice(2).filter(argument=>argument!=='--check');
if(unexpected.length)throw new Error(`Unknown argument(s): ${unexpected.join(', ')}`);

const iconRoot=path.join(root,'assets/icons');
const themeContract={
  light:{radius:10,surface:'white',surfaceOpacity:1},
  dark:{radius:12,surface:'white',surfaceOpacity:.08},
};

function escapeRegExp(value){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}

function extractElement(source,start,tagName){
  const token=new RegExp(`<${tagName}\\b[^>]*\\/?>|</${tagName}>`,'g');
  token.lastIndex=start;
  let depth=0;
  for(let match=token.exec(source);match;match=token.exec(source)){
    if(match.index===start&&match[0].startsWith(`</`))break;
    if(match[0].startsWith(`</`))depth--;
    else if(!match[0].endsWith('/>'))depth++;
    if(depth===0)return source.slice(start,token.lastIndex);
  }
  throw new Error(`Could not find closing </${tagName}>.`);
}

function extractById(source,id){
  const match=new RegExp(`<([A-Za-z][\\w:.-]*)\\b[^>]*\\bid="${escapeRegExp(id)}"[^>]*>`).exec(source);
  if(!match)throw new Error(`Missing referenced SVG definition #${id}.`);
  return extractElement(source,match.index,match[1]);
}

function normalizeSvg(source,fileTheme,fileName){
  const componentStart=/<g\b[^>]*\bid="Name=[^"]+, Theme=(Light|Dark)"[^>]*>/.exec(source);
  if(!componentStart)throw new Error(`${fileName}: missing exported Name/Theme component group.`);
  const componentTheme=componentStart[1].toLowerCase();
  if(componentTheme!==fileTheme)throw new Error(`${fileName}: ${componentTheme} component is stored in the ${fileTheme} directory.`);
  const component=extractElement(source,componentStart.index,'g');
  const contract=themeContract[fileTheme];
  const surface=/<rect\b[^>]*width="60"[^>]*height="60"[^>]*rx="([\d.]+)"[^>]*fill="([^"]+)"([^>]*)\/>/.exec(component);
  if(!surface)throw new Error(`${fileName}: component has no 60×60 rounded surface.`);
  if(Number(surface[1])!==contract.radius)throw new Error(`${fileName}: expected ${contract.radius}px ${fileTheme} radius, received ${surface[1]}px.`);
  if(surface[2].toLowerCase()!==contract.surface)throw new Error(`${fileName}: unexpected surface fill ${surface[2]}.`);
  const opacity=/fill-opacity="([\d.]+)"/.exec(surface[3]);
  const actualOpacity=opacity?Number(opacity[1]):1;
  if(actualOpacity!==contract.surfaceOpacity)throw new Error(`${fileName}: expected surface opacity ${contract.surfaceOpacity}, received ${actualOpacity}.`);

  const referenceIds=[...new Set([...component.matchAll(/url\(#([^)]+)\)/g)].map(match=>match[1]))];
  const definitions=referenceIds.map(id=>extractById(source,id));
  const defs=definitions.length?`\n<defs>\n${definitions.join('\n')}\n</defs>`:'';
  const normalized=`<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">\n${component}${defs}\n</svg>\n`;
  for(const forbidden of ['#1E1E1E','Aident PPT','width="1014"','height="156"','clip0_0_1','paint0_linear_0_1']){
    if(normalized.includes(forbidden))throw new Error(`${fileName}: cleaned component still contains Figma canvas artifact ${forbidden}.`);
  }
  for(const id of referenceIds)if(!normalized.includes(`id="${id}"`))throw new Error(`${fileName}: unresolved SVG definition #${id}.`);
  return normalized;
}

const failures=[];
let changed=0;
let checked=0;
for(const theme of Object.keys(themeContract)){
  const directory=path.join(iconRoot,theme);
  const files=(await fs.readdir(directory)).filter(file=>file.endsWith('.svg')).sort();
  for(const file of files){
    const target=path.join(directory,file);
    try{
      const source=await fs.readFile(target,'utf8');
      const normalized=normalizeSvg(source,theme,`${theme}/${file}`);
      checked++;
      if(source!==normalized){
        if(checkOnly)failures.push(`${theme}/${file} is not a clean component-only 60×60 SVG.`);
        else{await fs.writeFile(target,normalized);changed++;}
      }
    }catch(error){failures.push(error.message)}
  }
}

if(checked!==20)failures.push(`Expected 20 registered theme SVGs, checked ${checked}.`);
if(failures.length){for(const failure of failures)console.error(`ERROR ${failure}`);process.exit(1)}
console.log(checkOnly?`Icon validation passed: ${checked} clean SVGs.`:`Normalized ${changed} of ${checked} icon SVGs.`);
