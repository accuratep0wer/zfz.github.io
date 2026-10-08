const DATA_URL = 'https://raw.githubusercontent.com/navarog/wingsearch/master/src/assets/data/master.json';
const IMAGE_BASE = 'https://raw.githubusercontent.com/navarog/wingsearch/master/src/assets/cards';

const i18n = {
  zh: {
    appTitle:'鸟牌图鉴 · 双语排序器', hero:'按鸟名、分数、能力、栖息地与食物成本搜索、筛选和排序 Wingspan 鸟牌。每张牌显示中英文名称与 Wingsearch 鸟类画像。',
    visible:'显示', total:'总牌数', avg:'平均分', search:'搜索中文名 / English / 学名 / 能力…', filter:'筛选', sort:'排序',
    expansions:'扩展', habitats:'栖息地', powers:'能力颜色', nests:'巢型', minPoints:'最低分', maxPoints:'最高分', reset:'重置筛选',
    loading:'正在加载牌库…', loadFail:'在线牌库加载失败，已显示内置示例。请检查网络后刷新。', noResults:'没有符合条件的鸟牌。',
    footer:'非官方玩家工具。鸟类画像来自 Wingsearch 图像资源；并非实体桌游官方卡牌插画。', close:'关闭',
    points:'分数', eggs:'蛋容量', wingspan:'翅展', foodCost:'食物成本', habitat:'栖息地', nest:'巢型', power:'能力', set:'扩展',
    name:'鸟名', forest:'森林', grassland:'草原', wetland:'湿地', any:'任意', none:'无', unknown:'—', scientific:'学名',
    powerCategory:'能力类别', foods:'食物', source:'数据来源', color:'能力颜色', native:'中文名', imageSource:'图像来源：Wingsearch',
    missingZh:'中文名待补充', sortOptions:{points:'分数',name:'鸟名',eggs:'蛋容量',wingspan:'翅展',food:'食物成本',set:'扩展'}
  },
  en: {
    appTitle:'Bird Atlas · Bilingual Sorter', hero:'Search, filter and sort Wingspan bird cards by name, points, powers, habitat and food cost. Each card shows bilingual naming and Wingsearch bird art.',
    visible:'Visible', total:'Total cards', avg:'Avg points', search:'Search Chinese / English / scientific name / power…', filter:'Filters', sort:'Sort',
    expansions:'Expansions', habitats:'Habitats', powers:'Power color', nests:'Nest type', minPoints:'Min points', maxPoints:'Max points', reset:'Reset filters',
    loading:'Loading card database…', loadFail:'Could not load the online dataset; showing built-in samples. Check your connection and refresh.', noResults:'No birds match these filters.',
    footer:'Unofficial fan utility. Bird images are sourced from Wingsearch assets and are not the official physical-card artwork.', close:'Close',
    points:'Points', eggs:'Egg limit', wingspan:'Wingspan', foodCost:'Food cost', habitat:'Habitat', nest:'Nest', power:'Power', set:'Expansion',
    name:'Name', forest:'Forest', grassland:'Grassland', wetland:'Wetland', any:'Any', none:'None', unknown:'—', scientific:'Scientific name',
    powerCategory:'Power category', foods:'Food', source:'Data source', color:'Power color', native:'Chinese name', imageSource:'Image source: Wingsearch',
    missingZh:'Chinese name pending', sortOptions:{points:'Points',name:'Name',eggs:'Egg limit',wingspan:'Wingspan',food:'Food cost',set:'Expansion'}
  }
};

const labels = {
  set:{core:['基础','Core'],european:['欧洲','European'],oceania:['大洋洲','Oceania'],asia:['亚洲','Asia'],americas:['美洲','Americas']},
  color:{brown:['棕色','Brown'],pink:['粉色','Pink'],teal:['蓝绿色','Teal'],white:['白色','White'],yellow:['黄色','Yellow'],none:['无','None']},
  nest:{bowl:['杯状','Bowl'],cavity:['洞巢','Cavity'],ground:['地面','Ground'],platform:['平台','Platform'],wild:['万能','Wild'],none:['无巢','None']}
};

const fallbackCards = [
  {id:14,'Common name':'Barn Swallow','Scientific name':'Hirundo rustica',Set:'core',Color:'brown','Power text':'Fallback sample card','Victory points':1,'Nest type':'wild','Egg limit':3,Wingspan:'38',Forest:null,Grassland:'X',Wetland:'X',Invertebrate:1,Seed:null,Fruit:null,Fish:null,Nectar:null,Rodent:null,'Wild (food)':null,'Total food cost':1,CardType:'Bird'},
  {id:181,'Common name':'Peregrine Falcon','Scientific name':'Falco peregrinus',Set:'core',Color:'brown','Power text':'Fallback sample card','Victory points':5,'Nest type':'platform','Egg limit':2,Wingspan:'102',Forest:'X',Grassland:'X',Wetland:'X',Invertebrate:null,Seed:null,Fruit:null,Fish:null,Nectar:null,Rodent:1,'Wild (food)':1,'Total food cost':2,CardType:'Bird'},
  {id:350,'Common name':'Tawny Frogmouth','Scientific name':'Podargus strigoides',Set:'oceania',Color:'brown','Power text':'Fallback sample card','Victory points':0,'Nest type':'platform','Egg limit':2,Wingspan:'74',Forest:'X',Grassland:null,Wetland:null,Invertebrate:1,Seed:1,Fruit:null,Fish:null,Nectar:null,Rodent:null,'Wild (food)':null,'Total food cost':2,CardType:'Bird'}
];

const state = {lang:'zh', cards:[], filtered:[], sort:'points', desc:true, compact:false, filters:{sets:new Set(),habitats:new Set(),colors:new Set(),nests:new Set(),min:'',max:''}};
const $ = id => document.getElementById(id);

function normalize(raw){
  const arr = Array.isArray(raw) ? raw : Object.values(raw || {});
  return arr.filter(c => c && (c.CardType === 'Bird' || c.CardType === 'Hummingbird' || ('Common name' in c && 'Victory points' in c)));
}

function num(v){ const n=parseFloat(String(v??'').replace(/[^0-9.-]/g,'')); return Number.isFinite(n)?n:0; }
function trLabel(group,key){ const pair=labels[group]?.[String(key??'none').toLowerCase()]; return pair ? pair[state.lang==='zh'?0:1] : (key||i18n[state.lang].unknown); }
function zhName(c){ return window.ZH_BIRD_NAMES?.[c['Common name']] || ''; }
function displayName(c){ const en=c['Common name']||'Unknown bird'; const zh=zhName(c); return state.lang==='zh' ? (zh || en) : en; }
function secondaryName(c){ const en=c['Common name']||''; const zh=zhName(c); return state.lang==='zh' ? en : (zh || i18n.en.missingZh); }
function habitatList(c){ const out=[]; if(c.Forest) out.push('forest'); if(c.Grassland) out.push('grassland'); if(c.Wetland) out.push('wetland'); return out; }
function foodList(c){
  const map=[['Invertebrate','🐛'],['Seed','🌾'],['Fruit','🫐'],['Fish','🐟'],['Rodent','🐭'],['Nectar','🌸'],['Wild (food)','✦']];
  return map.flatMap(([k,icon]) => num(c[k])>0 ? [{key:k,icon,n:num(c[k])}] : []);
}
function powerText(c){ return c['Power text'] || c.Power || ''; }
function imageUrl(c){ return `${IMAGE_BASE}/birds-diffusion/${encodeURIComponent(c.id)}.webp`; }
function fallbackImageUrl(c){ return `${IMAGE_BASE}/birds/${encodeURIComponent(c.id)}.webp`; }
function imageMarkup(c, cls='bird-art'){
  if(c.id===undefined || c.id===null) return `<div class="${cls} art-placeholder">🐦</div>`;
  return `<img class="${cls}" src="${imageUrl(c)}" alt="${esc(c['Common name']||'Bird')}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${fallbackImageUrl(c)}'">`;
}

function setupChips(){
  const groups = [
    ['expansionFilters','sets',['core','european','oceania','asia','americas'],'set'],
    ['habitatFilters','habitats',['forest','grassland','wetland'],null],
    ['powerFilters','colors',['brown','pink','teal','white','yellow'],'color'],
    ['nestFilters','nests',['bowl','cavity','ground','platform','wild','none'],'nest']
  ];
  for(const [id,key,items,labelGroup] of groups){
    const el=$(id); el.innerHTML='';
    items.forEach(item=>{
      const b=document.createElement('button'); b.className='chip'+(state.filters[key].has(item)?' active':'');
      b.textContent = labelGroup ? trLabel(labelGroup,item) : i18n[state.lang][item];
      b.onclick=()=>{ state.filters[key].has(item)?state.filters[key].delete(item):state.filters[key].add(item); setupChips(); apply(); };
      el.appendChild(b);
    });
  }
}

function apply(){
  const q=$('searchInput').value.trim().toLowerCase();
  state.filters.min=$('minPoints').value; state.filters.max=$('maxPoints').value;
  state.filtered=state.cards.filter(c=>{
    const hay=[c['Common name'],c['Scientific name'],zhName(c),powerText(c),c.PowerCategory].join(' ').toLowerCase();
    if(q && !hay.includes(q)) return false;
    if(state.filters.sets.size && !state.filters.sets.has(String(c.Set).toLowerCase())) return false;
    const habitats=habitatList(c);
    if(state.filters.habitats.size && ![...state.filters.habitats].some(h=>habitats.includes(h))) return false;
    const color=String(c.Color||'none').toLowerCase();
    if(state.filters.colors.size && !state.filters.colors.has(color)) return false;
    const nest=String(c['Nest type']||'none').toLowerCase();
    if(state.filters.nests.size && !state.filters.nests.has(nest)) return false;
    const p=num(c['Victory points']);
    if(state.filters.min!=='' && p<num(state.filters.min)) return false;
    if(state.filters.max!=='' && p>num(state.filters.max)) return false;
    return true;
  });
  sortCards(); render();
}

function sortCards(){
  const getters={
    points:c=>num(c['Victory points']), name:c=>displayName(c).toLowerCase(), eggs:c=>num(c['Egg limit']),
    wingspan:c=>num(c.Wingspan), food:c=>num(c['Total food cost']), set:c=>String(c.Set||'')
  };
  const g=getters[state.sort];
  state.filtered.sort((a,b)=>{const A=g(a),B=g(b);let r=typeof A==='number'?A-B:String(A).localeCompare(String(B),state.lang==='zh'?'zh-CN':'en');return state.desc?-r:r;});
}

function render(){
  const t=i18n[state.lang], cardsEl=$('cards'); cardsEl.classList.toggle('compact',state.compact); cardsEl.innerHTML='';
  $('visibleCount').textContent=state.filtered.length; $('totalCount').textContent=state.cards.length;
  $('avgPoints').textContent=state.filtered.length ? (state.filtered.reduce((s,c)=>s+num(c['Victory points']),0)/state.filtered.length).toFixed(1) : '—';
  $('status').textContent=state.filtered.length ? '' : t.noResults;
  const frag=document.createDocumentFragment();
  state.filtered.forEach(c=>{
    const el=document.createElement('article'); el.className='bird-card'; el.tabIndex=0;
    const habitats=habitatList(c).map(h=>t[h]).join(' · ')||t.none;
    const foods=foodList(c);
    el.innerHTML=`
      <div class="art-wrap">${imageMarkup(c)}<div class="art-score">${num(c['Victory points'])}</div></div>
      <div class="card-body">
        <div class="card-head"><div><div class="bird-name">${esc(displayName(c))}</div><div class="native-name">${esc(secondaryName(c))}</div><div class="scientific">${esc(c['Scientific name']||'')}</div></div></div>
        <div class="meta"><span class="tag">${esc(trLabel('set',c.Set))}</span><span class="tag ${esc(String(c.Color||'none').toLowerCase())}">${esc(trLabel('color',c.Color))}</span><span class="tag">${esc(trLabel('nest',c['Nest type']))}</span></div>
        <div class="facts"><div class="fact"><b>${num(c['Egg limit'])}</b><small>${t.eggs}</small></div><div class="fact"><b>${num(c.Wingspan)||'—'}</b><small>${t.wingspan}</small></div><div class="fact"><b>${num(c['Total food cost'])}</b><small>${t.foodCost}</small></div><div class="fact"><b>${esc(habitats)}</b><small>${t.habitat}</small></div></div>
        ${foods.length?`<div class="foods">${foods.map(f=>`<span class="food">${f.icon} ×${f.n}</span>`).join('')}</div>`:''}
        ${powerText(c)?`<div class="power">${esc(powerText(c))}</div>`:''}
      </div>`;
    el.onclick=()=>showDetail(c); el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showDetail(c)}}; frag.appendChild(el);
  });
  cardsEl.appendChild(frag);
}

function showDetail(c){
  const t=i18n[state.lang], habitats=habitatList(c).map(h=>t[h]).join(' · ')||t.none, foods=foodList(c).map(f=>`${f.icon} ×${f.n}`).join('  ')||t.none;
  $('detailCard').innerHTML=`<div class="detail-art">${imageMarkup(c,'detail-bird-art')}</div><h2>${esc(displayName(c))}</h2><div class="native-name">${esc(secondaryName(c))}</div><div class="scientific">${esc(c['Scientific name']||'')}</div>
    <div class="detail-grid"><div><small>${t.points}</small><b>${num(c['Victory points'])}</b></div><div><small>${t.set}</small><b>${esc(trLabel('set',c.Set))}</b></div><div><small>${t.habitat}</small><b>${esc(habitats)}</b></div><div><small>${t.nest}</small><b>${esc(trLabel('nest',c['Nest type']))}</b></div><div><small>${t.eggs}</small><b>${num(c['Egg limit'])}</b></div><div><small>${t.wingspan}</small><b>${num(c.Wingspan)||'—'}</b></div><div><small>${t.foodCost}</small><b>${num(c['Total food cost'])}</b></div><div><small>${t.foods}</small><b>${foods}</b></div></div>
    ${c.PowerCategory?`<p><b>${t.powerCategory}:</b> ${esc(c.PowerCategory)}</p>`:''}${powerText(c)?`<p class="detail-power"><b>${t.power}:</b><br>${esc(powerText(c))}</p>`:''}<p class="image-credit">${t.imageSource}</p>`;
  $('detailDialog').showModal();
}
function esc(s){return String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}

function translateUI(){
  const t=i18n[state.lang]; document.documentElement.lang=state.lang==='zh'?'zh-CN':'en'; $('appTitle').textContent=t.appTitle; $('heroText').textContent=t.hero;
  $('visibleLabel').textContent=t.visible;$('totalLabel').textContent=t.total;$('avgLabel').textContent=t.avg;$('searchInput').placeholder=t.search;$('filterToggle').textContent=t.filter;$('sortLabel').textContent=t.sort;
  $('expansionHeading').textContent=t.expansions;$('habitatHeading').textContent=t.habitats;$('powerHeading').textContent=t.powers;$('nestHeading').textContent=t.nests;$('minPointsLabel').textContent=t.minPoints;$('maxPointsLabel').textContent=t.maxPoints;$('resetBtn').textContent=t.reset;$('footerText').textContent=t.footer;$('closeDialog').textContent=t.close;
  [...$('sortSelect').options].forEach(o=>o.textContent=t.sortOptions[o.value]); $('langBtn').textContent=state.lang==='zh'?'EN':'中'; setupChips();
}

function resetFilters(){ state.filters={sets:new Set(),habitats:new Set(),colors:new Set(),nests:new Set(),min:'',max:''}; $('minPoints').value='';$('maxPoints').value='';$('searchInput').value=''; setupChips();apply(); }

$('filterToggle').onclick=()=>$('filterPanel').classList.toggle('hidden');
$('sortSelect').onchange=e=>{state.sort=e.target.value;apply();}; $('sortDir').onclick=()=>{state.desc=!state.desc;$('sortDir').textContent=state.desc?'↓':'↑';apply();};
$('viewToggle').onclick=()=>{state.compact=!state.compact;$('viewToggle').textContent=state.compact?'☷':'▦';render();}; $('searchInput').oninput=apply; $('minPoints').oninput=apply; $('maxPoints').oninput=apply; $('resetBtn').onclick=resetFilters;
$('langBtn').onclick=()=>{state.lang=state.lang==='zh'?'en':'zh';translateUI();apply();}; $('closeDialog').onclick=()=>$('detailDialog').close();

async function boot(){
  translateUI(); $('status').textContent=i18n[state.lang].loading;
  try{ const res=await fetch(DATA_URL,{cache:'no-store'}); if(!res.ok) throw new Error(res.status); state.cards=normalize(await res.json()); if(!state.cards.length) throw new Error('No bird records'); $('status').textContent=''; }
  catch(err){ console.warn(err); state.cards=fallbackCards; $('status').textContent=i18n[state.lang].loadFail; }
  apply();
}
boot();