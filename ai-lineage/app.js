import {t, phrase, isEnglish, captureStatic, applyStatic, setLanguage, loadDataTranslations, dateOn, validDate} from './i18n.js';
import {RESEARCH_AREAS, broadAreas, sourceAreas} from './research-areas.js';
const $=id=>document.getElementById(id);
captureStatic();applyStatic();
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=t(text);if(cls)e.className=cls;return e;};
const names={graduate:'研究生指导',phd:'博士导师',coadvisor:'共同导师',postdoc:'博士后指导',research_mentor:'研究指导',coauthor:'共同作者'};
const areaNames=Object.fromEntries(RESEARCH_AREAS.map(a=>[a.id,a.zh]));
const colors=['#a34a3d','#b99051','#70998b','#7e879f','#9e7d99','#87a165','#c49e7e','#768d9c'];
const styles={graduate:{color:'#a69887',dash:[]},phd:{color:'#a95547',dash:[]},coadvisor:{color:'#8e7ca4',dash:[6,4]},postdoc:{color:'#6c9588',dash:[6,4]},research_mentor:{color:'#6c9588',dash:[3,4]},coauthor:{color:'#c6a15e',dash:[2,5]},draft:{color:'#d99143',dash:[5,5]}};
const draftKey='ai-academic-lineages.drafts.v1';
let data,people,byId,mentorEdges,allEdges,seeds,adjDown,adjUp,depths,seedCache=new Map(),selected=null,mode='focus',visiblePeople=[],visibleEdges=[],positions=new Map(),contextual=new Set(),drafts=[],searchCursor=-1,pageNumber=0,detailLimit=30;
let transform={x:0,y:0,k:1},width=900,height=450,pointer=null,hover=null,renderQueued=false;
let coverageAudit=null,caseReview=null,facultyCoverage=null;
const canvas=$('graph'),ctx=canvas.getContext('2d');
const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
const labelArea=s=>{const area=RESEARCH_AREAS.find(a=>a.id===s);return area?phrase(area.zh,area.en):phrase('其他交叉学科','Other interdisciplinary fields');};
const format=n=>Number(n||0).toLocaleString('en-US');
const seedId=s=>typeof s==='string'?s:s.id;
const safeURL=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}};
function link(text,url){const a=node('a',text);const safe=safeURL(url);if(safe){a.href=safe;a.target='_blank';a.rel='noopener noreferrer';}return a;}
const sourceURL=s=>typeof s==='string'?s:s?.url||s?.sourceUrl;
const personAreas=broadAreas;
const isMentor=e=>['graduate','phd','coadvisor','postdoc','research_mentor'].includes(e.type);
const role=p=>t(typeof p.role==='string'?p.role:p.role?.label||'');
const displayName=p=>p?(isEnglish()?(p.nameMissing?'Name not recorded ('+p.id.replace('aft:','AFT ')+')':p.name):(p.nameZh||p.name)):'';
const remarkName=p=>isEnglish()&&p?.nameZh&&p.nameZh!==p.name?'Chinese name: '+p.nameZh:'';
const allNames=p=>[p.name,p.nameZh,...p.aliases||[],...p.aliasesZh||[]].filter(Boolean);
function appendNameRemark(parent,p){const remark=remarkName(p);if(remark)parent.append(node('small',remark,'name-remark'));}
function sourceFor(url,id){return data.sources.find(s=>id?s.id===id:s.url===url);}
function appendSource(parent,label,url,record={}){const row=node('div',null,'source-entry'),a=link(label,url);if(label==='人物来源 ↗'||label==='中文姓名来源 ↗')a.className='person-source';row.append(a);const date=record.sourceSnapshotDate??record.localSnapshotDate??data.localSnapshotDate??data.informationAsOf;const caption=record.draft?phrase('来源提交日期：','Source submitted: '):phrase('快照日期（本地记录）：','Local snapshot: ');const stamp=node('span',caption,'source-date');if(validDate(date)){const time=node('time',date);time.dateTime=date;stamp.append(time);}else stamp.append(node('span',t('未知')));row.append(stamp);parent.append(row);return row;}
const institution=p=>{const value=typeof p.institution==='string'?p.institution:p.institution?.name||'';return value?(p.aiRelevance==='documented'?'':phrase('源记录机构：','Source institution: '))+t(value):'';};
function clear(e){e.replaceChildren();return e;}
function button(text,action,cls='text-button'){const b=node('button',text,cls);b.type='button';b.addEventListener('click',action);return b;}
function showView(id){for(const p of document.querySelectorAll('.view'))p.hidden=p.id!=='view-'+id;for(const b of document.querySelectorAll('[data-view]')){const active=b.dataset.view===id;b.classList.toggle('active',active);active?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');}if(id==='atlas')requestAnimationFrame(resize);if(id==='people')renderIndex();if(id==='contribute')renderDrafts();}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>showView(b.dataset.view));
function descendants(start){if(seedCache.has(start))return seedCache.get(start);const seen=new Set([start]),q=[start];for(let i=0;i<q.length;i++)for(const e of adjDown.get(q[i])||[])if(!seen.has(e.target)){seen.add(e.target);q.push(e.target);}seedCache.set(start,seen);return seen;}
function makeIndexes(){adjDown=new Map();adjUp=new Map();for(const e of mentorEdges){if(!adjDown.has(e.source))adjDown.set(e.source,[]);adjDown.get(e.source).push(e);if(!adjUp.has(e.target))adjUp.set(e.target,[]);adjUp.get(e.target).push(e);}depths=new Map();const q=[];for(const s of seeds){const id=seedId(s);if(byId.has(id)){depths.set(id,0);q.push(id);}}for(let i=0;i<q.length;i++)for(const e of adjDown.get(q[i])||[])if(!depths.has(e.target)){depths.set(e.target,depths.get(q[i])+1);q.push(e.target);}}
function effectiveData(){const map=new Map(byId),edges=[...allEdges];if($('show-drafts').checked)for(const d of drafts){for(const p of [d.from,d.to])if(!map.has(p.id))map.set(p.id,{id:p.id,name:p.name,areas:[],draft:true});edges.push({id:d.id,source:d.from.id,target:d.to.id,type:d.type,draft:true,sourceUrl:d.url,evidence:d.note,status:'draft',start:d.year,sourceSnapshotDate:d.sourceSnapshotDate});}return {map,edges};}
function eligible(map){let ids=new Set(map.keys());const seed=$('seed-filter').value;if(seed!=='all'){const allowed=descendants(seed);ids=new Set([...ids].filter(id=>allowed.has(id)||map.get(id).draft));}contextual=new Set();const area=$('area-filter').value;if(area!=='all'){const hits=new Set([...ids].filter(id=>personAreas(map.get(id)).includes(area)));const q=[...hits];for(let i=0;i<q.length;i++)for(const e of adjUp.get(q[i])||[])if(ids.has(e.source)&&!hits.has(e.source)){hits.add(e.source);contextual.add(e.source);q.push(e.source);}ids=hits;}return ids;}
function computeVisible(){const {map,edges}=effectiveData(),allowed=eligible(map),down=new Map();for(const e of edges)if(isMentor(e)){if(!down.has(e.source))down.set(e.source,[]);down.get(e.source).push(e.target);}let ids=new Set();if(mode==='overview')ids=allowed;else if(selected&&allowed.has(selected)){
 ids.add(selected);let frontier=[selected];const max=Number($('depth-filter').value);
 for(let d=0;d<max;d++){const next=[];for(const id of frontier)for(const child of down.get(id)||[])if(allowed.has(child)&&!ids.has(child)){ids.add(child);next.push(child);}frontier=next;}
 for(const e of edges)if(isMentor(e)&&e.target===selected&&allowed.has(e.source))ids.add(e.source);
 if($('show-coauthors').checked)for(const e of edges)if(e.type==='coauthor'&&(e.source===selected||e.target===selected)){const other=e.source===selected?e.target:e.source;if(allowed.has(other))ids.add(other);}
 // A newly entered local person never becomes a source-backed member.
 for(const e of edges)if(e.draft&&(ids.has(e.source)||ids.has(e.target))){ids.add(e.source);ids.add(e.target);}
 }
 const idsSorted=[...ids].sort((a,b)=>{if(a===selected)return -1;if(b===selected)return 1;return (depths.get(a)??99)-(depths.get(b)??99)||map.get(a).name.localeCompare(map.get(b).name);});
 const limit=mode==='overview'?30000:240;const shown=new Set(idsSorted.slice(0,limit));
 visiblePeople=[...shown].map(id=>map.get(id));visibleEdges=edges.filter(e=>shown.has(e.source)&&shown.has(e.target)&&((isMentor(e)&&$('show-mentors').checked)||(e.type==='coauthor'&&$('show-coauthors').checked)));
 $('graph-empty').hidden=visiblePeople.length>0;
 updateGraphLabels(map,shown.size,ids.size);

 layout();fit();renderPerson();
}
function layout(){
 positions=new Map();if(!visiblePeople.length)return;
 if(mode==='overview'){
  const groups=new Map();for(const p of visiblePeople){const d=depths.get(p.id)??0;if(!groups.has(d))groups.set(d,[]);groups.get(d).push(p);}
  for(const [generation,list] of groups){const baseRadius=generation?180+generation*175:85;list.forEach((p,i)=>{const angle=(i/list.length)*Math.PI*2-Math.PI/2;const offset=list.length>250?(i%7-3)*11:0;const radius=baseRadius+offset;positions.set(p.id,{x:Math.cos(angle)*radius,y:Math.sin(angle)*radius,id:p.id});});}
 }else{
  const level=new Map([[selected,0]]),q=[selected],down=new Map();
  for(const e of visibleEdges)if(isMentor(e)){if(!down.has(e.source))down.set(e.source,[]);down.get(e.source).push(e.target);}
  for(let i=0;i<q.length;i++)for(const child of down.get(q[i])||[])if(!level.has(child)){level.set(child,level.get(q[i])+1);q.push(child);}
  for(const e of visibleEdges)if(isMentor(e)&&e.target===selected&&!level.has(e.source))level.set(e.source,-1);
  const groups=new Map();for(const p of visiblePeople){const d=level.get(p.id)??1;if(!groups.has(d))groups.set(d,[]);groups.get(d).push(p);}
  let bandY=0;const rowLimit=width<500?5:10;
  for(const d of [...groups.keys()].sort((a,b)=>a-b)){const list=groups.get(d).sort((a,b)=>a.name.localeCompare(b.name));list.forEach((p,i)=>{const row=Math.floor(i/rowLimit),col=i%rowLimit,n=Math.min(rowLimit,list.length-row*rowLimit);positions.set(p.id,{id:p.id,x:(col-(n-1)/2)*130,y:bandY+row*78});});bandY+=Math.ceil(list.length/rowLimit)*78+80;}
 }
}
function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const changed=width!==r.width||height!==r.height;width=r.width;height=r.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);if(changed)fit();else draw();}
new ResizeObserver(resize).observe(canvas);
function fit(){if(!positions.size){transform={x:width/2,y:height/2,k:1};draw();return;}const pts=[...positions.values()],xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),minX=Math.min(...xs)-75,maxX=Math.max(...xs)+75,minY=Math.min(...ys)-40,maxY=Math.max(...ys)+50;const k=Math.min(1.5,(width-60)/(maxX-minX),(height-100)/(maxY-minY));transform={x:width/2-(minX+maxX)*k/2,y:(height-35)/2-(minY+maxY)*k/2,k:Math.max(.025,k)};draw();}
function nodeColor(p){if(p.draft)return '#d89b4b';if($('color-mode').value==='area'){const area=personAreas(p)[0];if(!area)return '#b7b1a6';let n=0;for(const c of area)n+=c.codePointAt(0);return colors[n%colors.length];}return colors[(depths.get(p.id)??0)%colors.length];}
function draw(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;ctx.clearRect(0,0,width,height);const k=transform.k;ctx.save();ctx.translate(transform.x,transform.y);ctx.scale(k,k);
 for(const e of visibleEdges){const a=positions.get(e.source),b=positions.get(e.target);if(!a||!b)continue;const style=styles[e.draft?'draft':e.type]||styles.graduate;const active=e.source===selected||e.target===selected;ctx.strokeStyle=style.color;ctx.globalAlpha=mode==='overview'?(active?.8:.12):(active?.82:.36);ctx.lineWidth=(active?1.5:1)/Math.max(k,.35);ctx.setLineDash(style.dash.map(v=>v/Math.max(k,.5)));ctx.beginPath();ctx.moveTo(a.x,a.y);if(mode==='overview')ctx.lineTo(b.x,b.y);else ctx.bezierCurveTo(a.x,(a.y+b.y)/2,b.x,(a.y+b.y)/2,b.x,b.y);ctx.stroke();if(isMentor(e)&&mode!=='overview'&&k>.3){const angle=Math.atan2(b.y-a.y,b.x-a.x),r=9/Math.sqrt(k),size=4/Math.sqrt(k);ctx.setLineDash([]);ctx.fillStyle=style.color;const x=b.x-Math.cos(angle)*r,y=b.y-Math.sin(angle)*r;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(angle-.5)*size*2,y-Math.sin(angle-.5)*size*2);ctx.lineTo(x-Math.cos(angle+.5)*size*2,y-Math.sin(angle+.5)*size*2);ctx.closePath();ctx.fill();}}
 ctx.setLineDash([]);for(const p of visiblePeople){const pos=positions.get(p.id);if(!pos)continue;const screenX=pos.x*k+transform.x,screenY=pos.y*k+transform.y;if(screenX<-90||screenX>width+90||screenY<-30||screenY>height+30)continue;const chosen=p.id===selected;const radius=(mode==='overview'?(chosen?7:3.2):(chosen?14:8))/Math.sqrt(Math.max(k,.18));ctx.globalAlpha=contextual.has(p.id)?.48:1;ctx.fillStyle=nodeColor(p);ctx.beginPath();ctx.arc(pos.x,pos.y,radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle=chosen?'#45322a':'#fffefb';ctx.lineWidth=(chosen?2:1.5)/Math.sqrt(Math.max(k,.18));ctx.stroke();if(chosen){ctx.strokeStyle='#b28d6733';ctx.lineWidth=5/Math.sqrt(Math.max(k,.18));ctx.beginPath();ctx.arc(pos.x,pos.y,radius+5/Math.sqrt(Math.max(k,.18)),0,Math.PI*2);ctx.stroke();}if(chosen||hover===p.id||k>=.8){ctx.globalAlpha=1;ctx.font=`${(chosen?12:10)/Math.max(k,.38)}px Georgia, serif`;ctx.textAlign='center';ctx.textBaseline='top';const fullName=displayName(p),label=fullName.length>31?fullName.slice(0,29)+'…':fullName;ctx.lineWidth=3/Math.max(k,.38);ctx.strokeStyle='#fffefbef';ctx.strokeText(label,pos.x,pos.y+radius+7/Math.max(k,.5));ctx.fillStyle=chosen?'#753b31':'#756655';ctx.fillText(label,pos.x,pos.y+radius+7/Math.max(k,.5));if(remarkName(p)){ctx.font=`${9/Math.max(k,.38)}px system-ui, sans-serif`;ctx.fillStyle='#8a7c6d';ctx.strokeText(p.nameZh,pos.x,pos.y+radius+23/Math.max(k,.5));ctx.fillText(p.nameZh,pos.x,pos.y+radius+23/Math.max(k,.5));}}}
 ctx.restore();ctx.globalAlpha=1;$('zoom-label').textContent=Math.round(k*100)+'%';});}
function hit(x,y){let found=null,best=Infinity;for(const p of visiblePeople){const pos=positions.get(p.id);const d=Math.hypot(pos.x*transform.k+transform.x-x,pos.y*transform.k+transform.y-y);const r=mode==='overview'?9:Math.max(11,12*Math.sqrt(transform.k));if(d<r&&d<best){found=p.id;best=d;}}return found;}
function zoom(factor,x=width/2,y=height/2){const next=Math.max(.02,Math.min(5,transform.k*factor)),r=next/transform.k;transform.x=x-(x-transform.x)*r;transform.y=y-(y-transform.y)*r;transform.k=next;draw();}
canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoom(e.deltaY<0?1.13:1/1.13,e.clientX-r.left,e.clientY-r.top);},{passive:false});
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();pointer={x:e.clientX,y:e.clientY,tx:transform.x,ty:transform.y,moved:false,hit:hit(e.clientX-r.left,e.clientY-r.top)};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();if(pointer){const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.hypot(dx,dy)>4)pointer.moved=true;transform.x=pointer.tx+dx;transform.y=pointer.ty+dy;draw();$('graph-tooltip').hidden=true;return;}const id=hit(e.clientX-r.left,e.clientY-r.top);if(id!==hover){hover=id;draw();}canvas.style.cursor=id?'pointer':'grab';const tip=$('graph-tooltip');tip.hidden=!id;if(id){const person=byId.get(id)||effectiveData().map.get(id);tip.textContent=displayName(person)+(remarkName(person)?' · '+remarkName(person):'');tip.style.left=Math.min(e.clientX-r.left+12,width-180)+'px';tip.style.top=Math.max(8,e.clientY-r.top-38)+'px';}});
canvas.addEventListener('pointerup',()=>{if(pointer&&!pointer.moved&&pointer.hit)focusPerson(pointer.hit);pointer=null;canvas.classList.remove('dragging');});canvas.addEventListener('pointercancel',()=>{pointer=null;canvas.classList.remove('dragging');});canvas.addEventListener('pointerleave',()=>{$('graph-tooltip').hidden=true;hover=null;});canvas.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='=')zoom(1.2);else if(e.key==='-')zoom(1/1.2);else if(e.key==='0')fit();else return;e.preventDefault();});
$('zoom-in').addEventListener('click',()=>zoom(1.2));$('zoom-out').addEventListener('click',()=>zoom(1/1.2));$('fit-graph').addEventListener('click',fit);
function focusPerson(id,{resetFilters=true}={}){const map=effectiveData().map;if(!map.has(id))return;selected=id;mode='focus';detailLimit=30;if(resetFilters){const area=$('area-filter').value;if(area!=='all'&&!personAreas(map.get(id)).includes(area))$('area-filter').value='all';const seed=$('seed-filter').value;if(seed!=='all'&&!descendants(seed).has(id))$('seed-filter').value='all';}showView('atlas');$('search-results').hidden=true;$('person-search').setAttribute('aria-expanded','false');computeVisible();}
$('overview').addEventListener('click',()=>{mode='overview';computeVisible();});$('depth-filter').addEventListener('change',()=>{mode='focus';computeVisible();});$('seed-filter').addEventListener('change',()=>{if($('seed-filter').value!=='all')focusPerson($('seed-filter').value,{resetFilters:false});else{mode='overview';computeVisible();}});$('area-filter').addEventListener('change',()=>{mode='overview';computeVisible();});for(const id of ['show-mentors','show-coauthors','show-drafts'])$(id).addEventListener('change',computeVisible);$('color-mode').addEventListener('change',draw);
function badge(edge){const documented=edge.confidence==='documented'||edge.status==='documented';return node('span',edge.draft?'本地待核验':documented?'公开来源补证':'来源记录','badge '+(edge.draft?'draft':documented?'documented':''));}
function appendConnection(parent,e,other){
 const box=node('div',null,'connection');box.append(button(displayName(other),()=>focusPerson(other.id),'connection-name'));appendNameRemark(box,other);
 const meta=node('div',null,'evidence-line');meta.append(node('span',names[e.type]||e.type,'relation-label'),badge(e));box.append(meta);
 if(e.start||e.year)box.append(node('div',String(e.start||e.year),'relation-label'));
 if(e.type==='coauthor'){const count=e.weight||e.paperCount||e.count||1;box.append(node('div',phrase(`至少 ${count} 篇共同论文（跨来源合并的下界；一对人只计一条边）`,`At least ${count} shared paper(s) (a lower bound across sources; one edge per pair)`),'relation-label'));}
 const details=node('details');details.append(node('summary','查看证据与来源'));details.append(node('p',e.evidence||'关系来自所列公开数据快照；本项目未将批量记录当作逐条独立核验。'));
 if(e.yearNotes)details.append(node('p',Array.isArray(e.yearNotes)?e.yearNotes.map(t).join('; '):t(e.yearNotes)));
 if(e.sourceUrl)appendSource(details,'打开关系来源 ↗',e.sourceUrl,e.draft?e:sourceFor(e.sourceUrl,e.sourceId));
 for(const paper of (e.papers||[]).slice(0,3)){const url=typeof paper==='string'?paper:paper.url||paper.doi&&'https://doi.org/'+paper.doi;if(url)appendSource(details,paper.title||paper.doi||'论文标识与来源 ↗',url,sourceFor(url));}
 if(e.sourceId){const src=sourceFor(null,e.sourceId);if(src&&src.url!==e.sourceUrl)appendSource(details,src.title||src.id,src.url,src);}
 box.append(details);parent.append(box);
}
function renderPerson(){const {map,edges}=effectiveData(),p=map.get(selected),panel=clear($('person-panel'));if(!p){panel.append(node('div','选择人物查看关系与证据。','person-placeholder'));return;}const heading=node('div',null,'person-heading');heading.append(node('div',p.draft?'LOCAL CONTRIBUTION':'ACADEMIC PROFILE','eyebrow'),node('h2',displayName(p)));appendNameRemark(heading,p);const aliases=(isEnglish()?p.aliases: p.nameZh?p.aliasesZh:p.aliases)||[];if(aliases.length)heading.append(node('div',aliases.filter(a=>a!==displayName(p)&&a!==p.nameZh).join(' · '),'alias'));if(role(p)||institution(p))heading.append(node('div',[role(p),institution(p)].filter(Boolean).join(' · '),'person-role'));const tags=node('div',null,'tags');if(seeds.some(s=>seedId(s)===p.id))tags.append(node('span','本次谱系起点','tag seed'));for(const a of personAreas(p))tags.append(node('span',labelArea(a),'tag'));if(!personAreas(p).length)tags.append(node('span','研究方向待补充','tag unknown'));if(p.aiRelevance!=='documented'&&!p.draft)tags.append(node('span',phrase('人工智能相关性尚未逐人核验','AI relevance not individually verified'),'tag unknown'));if(p.draft)tags.append(node('span','未进入来源数据库','tag unknown'));heading.append(tags);const actions=node('div',null,'person-actions');actions.append(button('以此人为中心',()=>focusPerson(p.id),'secondary'),button('补充此人关系',()=>newDraft(displayName(p),p.id),'primary'));heading.append(actions);panel.append(heading);
 const groups=[['导师与研究指导',edges.filter(e=>isMentor(e)&&e.target===p.id),'source'],['学生与受指导者',edges.filter(e=>isMentor(e)&&e.source===p.id),'target'],['共同作者',edges.filter(e=>e.type==='coauthor'&&(e.source===p.id||e.target===p.id)),null]];
 for(const [title,group,direction] of groups){const section=node('section',null,'detail-section');section.append(node('h3',`${t(title)} · ${format(group.length)}`));if(!group.length)section.append(node('p','本次数据中暂无记录。','detail-empty'));for(const e of group.slice(0,detailLimit)){const id=direction?e[direction]:e.source===p.id?e.target:e.source;const other=map.get(id);if(other)appendConnection(section,e,other);}if(group.length>detailLimit)section.append(button(phrase(`再显示 ${Math.min(30,group.length-detailLimit)} 条`,`Show ${Math.min(30,group.length-detailLimit)} more`),()=>{detailLimit+=30;renderPerson();}));panel.append(section);}
 const sources=node('section',null,'detail-section');sources.append(node('h3','人物资料与收录口径'));for(const s of (p.sources||[]).slice(0,8)){const url=sourceURL(s);appendSource(sources,typeof s==='string'?'人物来源 ↗':s.title||'人物来源 ↗',url,sourceFor(url));}for(const s of p.nameZhSources||[])appendSource(sources,'中文姓名来源 ↗',s.url,s);if(!p.sources?.length)sources.append(node('p','此人仅为本地草稿，尚未核验。','detail-empty'));sources.append(node('p',p.roleNote||'职位和研究方向以具体来源日期为准；未填写的字段保持未知。','detail-empty'));panel.append(sources);
}
const searchNorm=s=>String(s||'').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase();
function matches(p,query){const terms=searchNorm(query).match(/[\p{L}\p{N}]+/gu)||[];if(!terms.length)return !String(query).trim();const haystack=searchNorm([...allNames(p),institution(p),...sourceAreas(p),...personAreas(p).flatMap(id=>{const area=RESEARCH_AREAS.find(a=>a.id===id);return [area.zh,area.en];})].join(' '));return terms.every(term=>haystack.includes(term));}
function search(){const q=$('person-search').value.trim(),box=clear($('search-results'));searchCursor=-1;if(!q){box.hidden=true;$('person-search').setAttribute('aria-expanded','false');return;}const results=people.filter(p=>matches(p,q)).slice(0,20);box.hidden=false;$('person-search').setAttribute('aria-expanded','true');for(const p of results){const b=button('',()=>focusPerson(p.id),'search-result');b.dataset.personId=p.id;b.append(node('strong',displayName(p)));appendNameRemark(b,p);b.append(node('small',[institution(p),...personAreas(p).slice(0,2).map(labelArea)].filter(Boolean).join(' · ')||'来源中的学脉候选人物'));box.append(b);}const rosterMatches=(facultyCoverage?.people||[]).filter(p=>!byId.has(p.reviewedPersonId)&&matches({name:p.name,areas:[]},q)).slice(0,6);for(const p of rosterMatches){const b=button('',()=>{showView('sources');const section=$('faculty-coverage');section.open=true;const input=$('faculty-roster-search');input.value=p.name;input.dispatchEvent(new Event('input'));section.scrollIntoView({block:'start'});box.hidden=true;},'search-result');b.dataset.rosterName=p.name;b.append(node('strong',p.name),node('small',phrase('官方名册中的人物 · 身份或谱系关系尚待核查','Official roster entry · identity or lineage review pending')));box.append(b);}if(!results.length&&!rosterMatches.length)box.append(node('p','本次收录中未找到；可在共建草稿补充。'));}
$('person-search').addEventListener('input',search);$('person-search').addEventListener('keydown',e=>{const items=[...$('search-results').querySelectorAll('button')];if(e.key==='Escape'){$('search-results').hidden=true;$('person-search').setAttribute('aria-expanded','false');return;}if(e.key==='ArrowDown'){e.preventDefault();if(items.length)items[0].focus();}if(e.key==='Enter'&&items.length){e.preventDefault();items[0].click();}});$('search-results').addEventListener('keydown',e=>{const items=[...$('search-results').querySelectorAll('button')],i=items.indexOf(document.activeElement);if(e.key==='ArrowDown'){e.preventDefault();items[(i+1)%items.length]?.focus();}else if(e.key==='ArrowUp'){e.preventDefault();if(i===0)$('person-search').focus();else items[i-1]?.focus();}else if(e.key==='Escape'){$('search-results').hidden=true;$('person-search').focus();}});$('clear-search').addEventListener('click',()=>{$('person-search').value='';search();$('person-search').focus();});document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap')){$('search-results').hidden=true;$('person-search').setAttribute('aria-expanded','false');}});
function renderIndex(){const q=$('index-search').value.trim(),list=people.filter(p=>matches(p,q)),pages=Math.max(1,Math.ceil(list.length/24));pageNumber=Math.min(pageNumber,pages-1);$('index-count').textContent=phrase(`找到 ${format(list.length)} 人 · 包括尚待核验 AI 相关性的谱系候选`,`${format(list.length)} people · Includes candidates whose AI relevance is unverified`);$('index-page').textContent=`${pageNumber+1} / ${format(pages)}`;$('index-prev').disabled=pageNumber===0;$('index-next').disabled=pageNumber>=pages-1;const grid=clear($('people-grid'));for(const p of list.slice(pageNumber*24,(pageNumber+1)*24)){const card=button('',()=>focusPerson(p.id),'person-tile');card.append(node('strong',displayName(p)));appendNameRemark(card,p);card.append(node('small',institution(p)||'机构待补充'));const tags=node('div',null,'tags');for(const a of personAreas(p).slice(0,3))tags.append(node('span',labelArea(a),'tag'));if(!personAreas(p).length)tags.append(node('span','方向未标注','tag unknown'));card.append(tags);grid.append(card);}}
$('index-search').addEventListener('input',()=>{pageNumber=0;renderIndex();});$('index-prev').addEventListener('click',()=>{pageNumber--;renderIndex();});$('index-next').addEventListener('click',()=>{pageNumber++;renderIndex();});
function renderSources(){
 renderCoverageAudit();
 renderFacultyCoverage();
 const wrap=clear($('source-cards'));
 for(const s of data.sources){const card=node('article',null,'source-card');card.append(node('h3',s.title||s.id));if(s.description||s.note)card.append(node('p',s.description||s.note));card.append(node('p',phrase('许可：','License: ')+t(s.license||'按原站说明；未统一重新授权')));if(s.retrievedAt||s.date||s.observedAt)card.append(node('p',phrase('原始版本 / 读取日期：','Original version / access date: ')+(s.date||s.retrievedAt||s.observedAt)));appendSource(card,'查看原始来源 ↗',s.url,s);wrap.append(card);}
 const summary=clear($('source-summary'));
 for(const [label,value] of [[phrase('原始数据版本','Original dataset snapshot'),data.snapshot],[phrase('本地整理日期','Local compilation date'),data.informationAsOf],[phrase('人物 / 指导记录 / 合著关系','People / mentorship records / coauthor pairs'),[data.people.length,data.stats.displayedMentorRecords,data.stats.displayedCoauthorPairs].map(format).join(' / ')],[phrase('收录起点','Selected roots'),format(seeds.length)]]){const row=node('div',null,'summary-row');row.append(node('strong',label),node('span',value));summary.append(row);}
 summary.append(node('p',phrase('只沿已记录的指导关系收录后裔。原始来源记录与独立补证分别标明；未知身份、缺失路径和不确定日期保留说明。','Admission follows recorded mentorship paths. Source records and independently documented evidence are distinguished; uncertain identities, missing paths and dates remain explicit.')));
}
function renderCoverageAudit(){
 let box=$('coverage-audit');
 if(!box){box=node('details',null,'coverage-audit');box.id='coverage-audit';$('source-cards').before(box);}
 clear(box);
 const stats=data.stats||{},audit=coverageAudit;
 box.append(node('summary',phrase('覆盖检查与仍待补证的缺口','Coverage checks and remaining gaps')));
 box.append(node('p',phrase(`本次补入 ${format(stats.supplementalRawPeople)} 个来源人物，恢复 ${format(stats.supplementalRawMentorRecords)} 条来源指导记录。`,`${format(stats.supplementalRawPeople)} source people and ${format(stats.supplementalRawMentorRecords)} source mentorship records restored.`)));
 box.append(node('p',phrase('扩展后重新沿指导关系展开全部可达后裔；合著不用于推断师承。同名记录只有经过证据核对才合并。','Descendants are recomputed over all recorded mentorship paths after expansion. Coauthorship does not imply mentorship; identity merges require reviewed evidence.')));
 if(!audit){box.append(node('p',phrase('详细覆盖检查报告暂不可用；请查看下方本次收集与限制。','The detailed coverage report is unavailable. See the collection notes and limitations below.')));return;}
 box.append(node('p',phrase(`抽查名单：${format(audit.reviewedNames)} 人 · 检查日期：${audit.asOf}。这是一份用于找出缺口的诊断名单，不是随机抽样，也不代表全球覆盖率。`,`Diagnostic roster: ${format(audit.reviewedNames)} names · Checked ${audit.asOf}. This is a gap-finding checklist, not a random sample or an estimate of global coverage.`)));
 const gaps=audit.unresolved||[];
 box.append(node('p',phrase(`这份名单中仍有 ${gaps.length} 项待补证；全球缺失谱系的总数尚未测定。`,`${gaps.length} cases remain unresolved on this checklist. The worldwide total of missing lineages has not been measured.`)));
 if(caseReview?.complete)renderCaseReview(box);
 else if(gaps.length){box.append(node('h3',phrase('仍需核对的例子','Examples still needing review')));const list=node('ul');for(const gap of gaps.slice(0,10)){const item=node('li',gap.name);const why=isEnglish()?(gap.reason||gap.status):(gap.reasonZh||gap.reason||gap.status);if(why)item.append(node('small',why));list.append(item);}box.append(list);}
 box.append(node('p',phrase('收录仍受原始资料缺口、未核实身份和指导关系证据限制。源库中的关系不等于本项目逐条独立核验。','Coverage remains limited by source gaps, unresolved identities and missing mentorship evidence. Source-recorded relations are not all independently verified by this project.')));
}
function renderFacultyCoverage(){
 let box=$('faculty-coverage');
 if(!box){box=node('details',null,'coverage-audit');box.id='faculty-coverage';$('source-cards').before(box);}
 clear(box);
 box.append(node('summary',phrase('院系名册与逐人核查进度','Department roster and individual review progress')));
 if(!facultyCoverage){box.append(node('p',phrase('名册核查报告暂不可用。','The roster review report is unavailable.')));return;}
 const report=facultyCoverage,roster=report.people||[];
 const labels={unreviewed:phrase('待核查','Awaiting review'),identity_ambiguous:phrase('身份待确认','Identity unresolved'),evidence_verified:phrase('关系已补证','Relationship verified'),upstream_path_missing:phrase('上游路径待补证','Upstream path missing'),integrated:phrase('已进入图谱','In the graph')};
 const checkLabels={homepage:phrase('个人主页','Homepage'),official_profile:phrase('官方资料页','Official profile'),cv:phrase('简历','CV'),thesis:phrase('学位论文','Thesis'),advisor_alumni:phrase('导师及校友名单','Advisor/alumni roster'),adviser_alumni:phrase('导师及校友名单','Advisor/alumni roster')};
 const stateLabels={checked:phrase('已核查','Reviewed'),blocked:phrase('来源受阻','Source unavailable'),not_checked:phrase('待核查','Not reviewed')};
 box.append(node('p',phrase(`普渡大学计算机科学系官方名册：${format(roster.length)} 条人物记录；记录日期：${report.asOf}。`,`Purdue Computer Science official roster: ${format(roster.length)} people; recorded ${report.asOf}.`)));
 box.append(node('p',phrase('已进入图谱与已完成全部关系核查分别统计。相邻院系尚未核查完毕；此名册不能代表整所学校或前一百所学校已经覆盖。','Graph inclusion and completed relationship review are separate. Adjacent departments remain incomplete; this roster does not certify coverage of the university or the top 100 schools.')));
 const counts=node('div',null,'faculty-counts');
 for(const [key,label]of Object.entries(labels))counts.append(node('span',`${label}: ${format(report.counts?.[key])}`,'tag'));
 box.append(counts);
 if(report.backlog?.reviewQueueUrls)box.append(node('p',phrase(`全局个人资料核查队列另有 ${format(report.backlog.reviewQueueUrls)} 个网址。网址数不是人数；下载与筛查不等于关系核验完成。`,`The global profile-review queue tracks ${format(report.backlog.reviewQueueUrls)} URLs. URL counts are not people counts; downloading and screening do not complete relationship review.`)));
 for(const url of report.school?.officialRosterUrls||[])appendSource(box,phrase('查看官方名册 ↗','View the official roster ↗'),url,{localSnapshotDate:report.asOf});
 const label=node('label',phrase('查找名册中的人物','Find a person in the roster'));label.htmlFor='faculty-roster-search';
 const input=node('input');input.id='faculty-roster-search';input.type='search';input.placeholder=phrase('姓名，例如 Ming Yin','Name, e.g. Ming Yin');
 const count=node('p',null,'detail-empty'),list=node('div',null,'faculty-roster-list');
 box.append(label,input,count,list);
 const render=()=>{clear(list);const query=searchNorm(input.value).trim(),rows=roster.filter(p=>searchNorm(p.name).includes(query));count.textContent=phrase(`找到 ${format(rows.length)} 条记录`,`${format(rows.length)} records found`);
  for(const p of rows){const card=node('details',null,'case-card');card.dataset.rosterName=p.name;card.dataset.status=p.status;
   const heading=node('summary');heading.append(node('strong',p.name),node('span',labels[p.status]||labels.unreviewed,'case-status'));card.append(heading);
   card.append(node('p',p.reviewComplete?phrase('已完成所列来源范围内的核查；仍未知的关系单独保留说明。','Review of the listed sources is complete; remaining unknown relationships are recorded separately.'):phrase('此人的关系核查尚未完成；未收录的关系不表示不存在。','Relationship review is incomplete; an absent connection does not establish that no relationship exists.')));
   const gaps=isEnglish()?p.remainingGaps:p.remainingGapsZh;if(gaps?.length){const ul=node('ul');for(const gap of gaps)ul.append(node('li',gap));card.append(ul);}
   if(p.officialProfileUrl)appendSource(card,phrase('官方人物资料 ↗','Official profile ↗'),p.officialProfileUrl,{localSnapshotDate:report.asOf});
   for(const check of p.sourceChecks||[]){const checkTitle=checkLabels[check.kind]||phrase('其他来源','Other source');card.append(node('p',`${checkTitle}: ${stateLabels[check.status]||stateLabels.not_checked}`));for(const url of check.urls||[])appendSource(card,phrase('查看来源 ↗','View source ↗'),url,{localSnapshotDate:report.asOf});}
   if(p.reviewedPersonId&&byId.has(p.reviewedPersonId))card.append(button(phrase('在谱系图中查看','View in the lineage map'),()=>focusPerson(p.reviewedPersonId)));
   list.append(card);
  }
 };input.addEventListener('input',render);render();
}
function renderCaseReview(parent){
 const report=caseReview,section=node('details',null,'case-review');section.id='review34-results';
 section.append(node('summary',phrase(`三十四项逐案核查：已补入 ${report.resolved} 项，仍待补证 ${report.remaining} 项`,`All 34 case reviews: ${report.resolved} integrated, ${report.remaining} unresolved`)));
 const profile=id=>byId.get(id)||report.people[id]||{name:phrase('身份待核实','Identity not yet verified')};
 for(const item of [...report.cases].sort((a,b)=>(a.status==='resolved_in_graph')-(b.status==='resolved_in_graph'))){
  const card=node('details',null,'case-card'),resolved=item.status==='resolved_in_graph';card.dataset.caseName=item.name;card.dataset.status=item.status;
  const heading=node('summary');heading.append(node('strong',displayName(profile(item.personId))),node('span',resolved?phrase('已补入谱系','Integrated'):phrase('仍待补证','Unresolved'),'case-status'));card.append(heading);
  card.append(node('p',isEnglish()?item.reason:item.reasonZh));
  card.append(node('small',phrase('核查日期：','Reviewed: ')+item.reviewedAt));
  if(resolved){card.append(node('p',phrase('指导路径：','Mentorship path: ')+item.rootPath.map(id=>displayName(profile(id))).join(' → ')));card.append(button(phrase('在谱系图中查看','View in the lineage map'),()=>focusPerson(item.personId)));}
  for(const e of item.verifiedRelationships){const row=node('div',null,'case-evidence');row.append(node('p',`${displayName(profile(e.source))} → ${displayName(profile(e.target))} · ${t(names[e.type]||e.type)}`));if(e.evidenceKind==='primary_thesis_transcription')row.append(node('p',phrase('证据为博士论文的第三方转录本；校方原始文件未能下载，已保留这一来源限制。','Evidence is a third-party transcription of the doctoral thesis. The original university-hosted file could not be retrieved.')));appendSource(row,'查看原始来源 ↗',e.sourceUrl,{localSnapshotDate:item.reviewedAt});card.append(row);}
  if(!item.verifiedRelationships.length)for(const url of item.sources||[])appendSource(card,phrase('查看已核查资料 ↗','View reviewed source ↗'),url,{localSnapshotDate:item.reviewedAt});
  section.append(card);
 }
 parent.append(section);
}
function validatedDraft(d){
 if(!d||typeof d!=='object'||typeof d.id!=='string'||!/^draft:[a-zA-Z0-9-]{1,80}$/.test(d.id))throw Error('草稿 ID 格式无效。');
 if(typeof d.type!=='string'||!Object.hasOwn(names,d.type))throw Error('不支持的关系类型。');
 for(const p of [d.from,d.to])if(!p||typeof p.id!=='string'||p.id.length>140||typeof p.name!=='string'||!p.name.trim()||p.name.length>140)throw Error('人物字段无效。');
 if(d.from.id===d.to.id||norm(d.from.name)===norm(d.to.name))throw Error('关系两端不能为同一人。');
 const url=safeURL(d.url);if(!url||url.length>1500)throw Error('证据链接须为 HTTP 或 HTTPS 公开页面。');
 if(typeof d.note!=='string'||d.note.trim().length<8||d.note.length>2000)throw Error('证据说明需为 8–2,000 字符。');
 const timestamp=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(value)&&Number.isFinite(Date.parse(value));
 if(d.createdAt&&!timestamp(d.createdAt)||d.updatedAt&&!timestamp(d.updatedAt)||d.sourceSnapshotDate&&!validDate(d.sourceSnapshotDate))throw Error('草稿日期格式无效。');
 const createdAt=timestamp(d.createdAt)?d.createdAt:'',sourceSnapshotDate=d.sourceSnapshotDate||(createdAt?dateOn(createdAt):'');
 return {id:d.id,from:{id:d.from.id,name:d.from.name.trim()},to:{id:d.to.id,name:d.to.name.trim()},type:d.type,url,note:d.note.trim(),year:typeof d.year==='string'?d.year.slice(0,60):'',createdAt,sourceSnapshotDate,...(d.updatedAt?{updatedAt:d.updatedAt}:{})};
}
function saveDrafts(next){if(next.length>500)throw Error('每个浏览器最多保存 500 条草稿，请先导出。');const checked=next.map(validatedDraft);localStorage.setItem(draftKey,JSON.stringify({schema_version:1,drafts:checked}));drafts=checked;renderDrafts();if($('show-drafts').checked)computeVisible();}
let statusMessage='',statusError=false;
function status(text,error=false){statusMessage=text;statusError=error;$('draft-status').textContent=t(text);$('draft-status').classList.toggle('error',error);}
function resolveName(name,field){const known=field?.dataset.personId&&byId.get(field.dataset.personId);if(known&&allNames(known).some(a=>norm(a)===norm(name)))return {id:known.id,name:known.name};const found=people.filter(p=>allNames(p).some(a=>norm(a)===norm(name)));if(found.length>1)throw Error('发现同名人物，请用来源中的完整姓名区分。');if(found.length===1)return {id:found[0].id,name:found[0].name};const existing=drafts.flatMap(d=>[d.from,d.to]).find(p=>norm(p.name)===norm(name));return existing||{id:'draftp:'+crypto.randomUUID(),name:name.trim()};}
function newDraft(name='',personId=''){showView('contribute');$('contribution-form').reset();$('edit-draft-id').value='';$('from-name').value=name;$('from-name').dataset.personId=personId;$('to-name').dataset.personId='';$('save-draft').textContent=t('保存为待核验草稿');$('cancel-edit').hidden=true;status('');$('to-name').focus();}
$('add-connection').addEventListener('click',()=>newDraft(displayName(byId.get(selected)),selected));$('cancel-edit').addEventListener('click',()=>newDraft());
$('contribution-form').addEventListener('submit',e=>{e.preventDefault();try{const id=$('edit-draft-id').value||'draft:'+crypto.randomUUID(),previous=drafts.find(x=>x.id===id),now=new Date().toISOString(),url=safeURL($('evidence-url').value),d=validatedDraft({id,from:resolveName($('from-name').value,$('from-name')),to:resolveName($('to-name').value,$('to-name')),type:$('relationship-type').value,url:$('evidence-url').value,note:$('evidence-note').value,year:$('relationship-year').value,createdAt:previous?previous.createdAt:now,sourceSnapshotDate:previous&&previous.url===url?previous.sourceSnapshotDate:dateOn(now),...(previous?{updatedAt:now}:{})});const next=drafts.filter(x=>x.id!==id);next.push(d);saveDrafts(next);newDraft();status('已保存在此浏览器，状态为待核验。可在谱系图勾选“我的待核验草稿”查看。');}catch(error){status(error.message||'浏览器未能保存草稿，请检查站点存储权限。',true);}});
function editDraft(d){showView('contribute');$('edit-draft-id').value=d.id;$('from-name').dataset.personId=d.from.id;$('to-name').dataset.personId=d.to.id;$('from-name').value=displayName(byId.get(d.from.id)||d.from);$('to-name').value=displayName(byId.get(d.to.id)||d.to);$('relationship-type').value=d.type;$('relationship-year').value=d.year;$('evidence-url').value=d.url;$('evidence-note').value=d.note;$('save-draft').textContent=t('保存修改');$('cancel-edit').hidden=false;status('正在编辑本地草稿。');}
function renderDrafts(){
 $('draft-count').textContent=String(drafts.length);const list=clear($('draft-list'));
 if(!drafts.length)list.append(node('p','还没有草稿。补充一条带有公开证据的关系，或导入之前导出的文件。','draft-empty'));
 for(const d of drafts){const from=byId.get(d.from.id)||d.from,to=byId.get(d.to.id)||d.to,card=node('article',null,'draft-card');card.dataset.draftId=d.id;
 card.append(node('h4',displayName(from)+(d.type==='coauthor'?' ↔ ':' → ')+displayName(to)));appendNameRemark(card,from);appendNameRemark(card,to);
 card.append(node('span','待核验 · 仅本地','badge draft'),node('span',names[d.type]),node('p',d.note));appendSource(card,'证据链接 ↗',d.url,{...d,draft:true});
 const actions=node('div');actions.append(button('编辑',()=>editDraft(d)),button('删除',()=>{try{saveDrafts(drafts.filter(x=>x.id!==d.id));status('已删除这条本地草稿。');}catch{status('删除失败，请检查浏览器存储权限。',true);}}));card.append(actions);list.append(card);}
}
function download(value,filename){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('export-drafts').addEventListener('click',()=>download({schema_version:1,scope:'local-unreviewed-contributions',exportedAt:new Date().toISOString(),drafts},'ai-lineages-drafts.json'));
$('import-drafts').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>2*1024*1024)throw Error('草稿文件不得超过 2 MiB。');const incoming=JSON.parse(await file.text());if(incoming.schema_version!==1||!Array.isArray(incoming.drafts)||incoming.drafts.length>500)throw Error('不是有效的本项目草稿文件。');const checked=incoming.drafts.map(validatedDraft),map=new Map(drafts.map(d=>[d.id,d]));for(const d of checked){if(map.has(d.id)&&JSON.stringify(map.get(d.id))!==JSON.stringify(d))throw Error('存在同 ID 的不同版本；请先在原浏览器整理后再导入。');map.set(d.id,d);}saveDrafts([...map.values()]);status(phrase(`已导入 ${checked.length} 条草稿；所有关系仍为本地待核验。`,`${checked.length} draft(s) imported; all remain local and unreviewed.`));}catch(error){status(error.message||'文件未导入，现有草稿保留。',true);}finally{e.target.value='';}});
$('graph-export').addEventListener('click',()=>download({schema_version:1,scope:'current-view',exportedAt:new Date().toISOString(),people:visiblePeople,relations:visibleEdges,sources:data.sources,limitations:data.limitations},'ai-lineages-current-view.json'));
async function initialize(){try{await loadDataTranslations();applyStatic();const response=await fetch('./data/graph.json');if(!response.ok)throw Error('数据文件尚未生成，请待收集完成后刷新。');data=await response.json();coverageAudit=await fetch('./data/coverage-audit.json').then(r=>r.ok?r.json():null).catch(()=>null);caseReview=await fetch('./data/review34.json').then(r=>r.ok?r.json():null).catch(()=>null);facultyCoverage=await fetch('./data/faculty-coverage.json').then(r=>r.ok?r.json():null).catch(()=>null);if(!Array.isArray(data.people)||!Array.isArray(data.relations))throw Error('数据快照格式无效。');people=data.people.slice().sort((a,b)=>a.name.localeCompare(b.name));byId=new Map(people.map(p=>[p.id,p]));allEdges=data.relations.filter(e=>byId.has(e.source)&&byId.has(e.target)&&names[e.type]);mentorEdges=allEdges.filter(isMentor);seeds=data.seeds||[];makeIndexes();
 try{const saved=JSON.parse(localStorage.getItem(draftKey));if(saved?.schema_version===1&&Array.isArray(saved.drafts)&&saved.drafts.length<=500)drafts=saved.drafts.map(validatedDraft);}catch{drafts=[];status('已有本地草稿无法读取；未覆盖原数据，可先导出浏览器原始记录再处理。',true);}
 $('stat-people').textContent=format(people.length);$('stat-mentors').textContent=format(mentorEdges.length);$('stat-coauthors').textContent=format(allEdges.filter(e=>e.type==='coauthor').length);$('stat-seeds').textContent=format(seeds.length);
 const requestedPerson=new URLSearchParams(location.search).get('person');
 selected=byId.has(requestedPerson)?requestedPerson:byId.has('aft:1446')?'aft:1446':byId.has('aft:10457')?'aft:10457':seedId(seeds[0])||people[0]?.id;$('depth-filter').value='1';
 refreshLanguage();$('loading').hidden=true;$('app').hidden=false;computeVisible();resize();
 }catch(error){$('loading').textContent=phrase('未能载入图谱：','Could not load the graph: ')+t(error.message);}}

function updateGraphLabels(map=effectiveData().map,count=visiblePeople.length,total=count){
 $('graph-title').textContent=mode==='overview'?phrase('全部谱系 · 关系概览','All lineages · Network overview'):(displayName(map.get(selected))||phrase('请选择人物','Select a researcher'))+phrase(' · 邻近学脉',' · Nearby lineages');
 $('visible-count').textContent=phrase(`显示 ${format(count)} 人 · ${format(visibleEdges.length)} 条关系`,`${format(count)} people · ${format(visibleEdges.length)} connections`)+(count<total?phrase(`（此视图共 ${format(total)} 人，缩小范围可逐一查看）`,` (${format(total)} total; narrow the view to explore all)`):'')+(contextual.size?phrase(' · 含连接路径上的背景人物',' · Includes connecting ancestors'):'');
}
function refreshLanguage(){
 if(!data)return;applyStatic();
 $('dataset-note').textContent=t('选定起点的谱系候选；AI 相关性与最新职位尚未逐人核验。');
 $('scope-note').textContent=t('实线 / 虚线区分关系类型，不表示强弱。来源库的“研究生”未自动改称“博士”；合著不会被当作师承，图中不包含自动推断的导师关系。');
 const currentArea=$('area-filter').value,currentSeed=$('seed-filter').value;
 for(const [id,label] of [['area-filter','全部方向'],['seed-filter','全部起点']]){const option=node('option',label);option.value='all';clear($(id)).append(option);}
 for(const a of [...new Set(people.flatMap(personAreas))].sort()){const option=node('option',labelArea(a));option.value=a;$('area-filter').append(option);}
 for(const s of seeds){const id=seedId(s),p=byId.get(id);if(p){const option=node('option',displayName(p));option.value=id;$('seed-filter').append(option);}}
 $('area-filter').value=currentArea||'all';$('seed-filter').value=currentSeed||'all';
 const options=clear($('person-options')),suggestions=[...people.filter(p=>p.nameZh),...people.filter(p=>!p.nameZh).slice(0,3000)];
 for(const p of suggestions){const option=node('option');option.value=displayName(p);if(remarkName(p))option.label=remarkName(p);options.append(option);}
 renderDrafts();renderSources();renderPerson();renderIndex();updateGraphLabels();draw();
 if(!$('search-results').hidden)search();
 $('graph-tooltip').hidden=true;$('save-draft').textContent=t($('edit-draft-id').value?'保存修改':'保存为待核验草稿');
 status(statusMessage,statusError);
 $('footer-version').textContent=phrase('资料整理截至 ','Information compiled as of ')+(data.informationAsOf||data.localSnapshotDate||'2026-11-17')+phrase(' · 具体资料以各来源日期为准。',' · Source-specific dates apply.');
 $('footer-date-note').textContent=t('本地整理日期不代表每一项资料均在当天重新核验。');
}
$('language-select').addEventListener('change',event=>{setLanguage(event.target.value);refreshLanguage();});

initialize();
