#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');

function parseArgs(argv){
  const args={language:'en',formats:['html']};
  for(let i=2;i<argv.length;i++){
    if(argv[i]==='--brief')args.brief=argv[++i];
    else if(argv[i]==='--out')args.out=argv[++i];
    else if(argv[i]==='--language')args.language=argv[++i];
    else if(argv[i]==='--formats')args.formats=argv[++i].split(',').map(v=>v.trim()).filter(Boolean);
    else if(argv[i]==='--help')args.help=true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

const usage='Usage: node scripts/init-multi-agent-run.mjs --brief /path/brief.md --out /path/run [--language en|zh] [--formats html,single-html,web,pdf,pptx]\n';
const args=parseArgs(process.argv);
if(args.help){process.stdout.write(usage);process.exit(0)}
if(!args.brief||!args.out)throw new Error(usage.trim());
if(!['en','zh'].includes(args.language))throw new Error('--language must be en or zh.');
const supported=new Set(['html','single-html','web','pdf','pptx']);
for(const format of args.formats)if(!supported.has(format))throw new Error(`Unsupported format: ${format}`);

const brief=path.resolve(args.brief);
const out=path.resolve(args.out);
const briefStat=await fs.stat(brief).catch(()=>null);
if(!briefStat?.isFile())throw new Error(`Brief file not found: ${brief}`);
const existing=await fs.readdir(out).catch(()=>[]);
if(existing.length)throw new Error(`Run directory must be empty: ${out}`);

await fs.mkdir(path.join(out,'input/assets'),{recursive:true});
await fs.mkdir(path.join(out,'handoffs'),{recursive:true});
const requestedFormats=new Set(args.formats);
const requestedQa=[];
if([...requestedFormats].some(format=>['html','single-html','web'].includes(format)))requestedQa.push('html');
if(requestedFormats.has('pdf'))requestedQa.push('pdf');
if(requestedFormats.has('pptx'))requestedQa.push('pptx');
for(const format of requestedQa)await fs.mkdir(path.join(out,`qa/${format}`),{recursive:true});
await fs.mkdir(path.join(out,'output'),{recursive:true});

const briefName=`brief${path.extname(brief)||'.md'}`;
await fs.copyFile(brief,path.join(out,'input',briefName));
const roleRegistry=JSON.parse(await fs.readFile(path.join(root,'agents/roles.json'),'utf8'));
const runId=path.basename(out).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||`aident-ppt-${Date.now()}`;
const qaRequested={'html-qa':requestedQa.includes('html'),'pdf-qa':requestedQa.includes('pdf'),'pptx-qa':requestedQa.includes('pptx')};
const roles=roleRegistry.roles.map(role=>({id:role.id,status:role.id==='lead'?'running':role.id in qaRequested&&!qaRequested[role.id]?'waived':'pending',writes:role.writes,agentId:null,notes:role.id in qaRequested&&!qaRequested[role.id]?'Optional format not requested.':''}));
const run={version:1,runId,createdAt:new Date().toISOString(),status:'initialized',language:args.language,formats:[...new Set(args.formats)],briefFile:`input/${briefName}`,roles};

const narrative={_status:'pending',meta:{role:'narrative-architect',assumptions:[],openQuestions:[]},deck:null};
const assets={_status:'pending',meta:{role:'asset-curator',assumptions:[],missingAssets:[]},brand:{logo:null,rightText:null},slides:{}};
const notes={_status:'pending',meta:{role:'speaker-notes-editor',assumptions:[],openQuestions:[]},slides:{}};
await fs.writeFile(path.join(out,'run.json'),JSON.stringify(run,null,2)+'\n');
await fs.writeFile(path.join(out,'handoffs/narrative.json'),JSON.stringify(narrative,null,2)+'\n');
await fs.writeFile(path.join(out,'handoffs/assets.json'),JSON.stringify(assets,null,2)+'\n');
await fs.writeFile(path.join(out,'handoffs/notes.json'),JSON.stringify(notes,null,2)+'\n');
console.log(`Initialized multi-agent run: ${out}`);
console.log(`Brief: input/${briefName}`);
console.log(`Formats: ${run.formats.join(', ')}`);
