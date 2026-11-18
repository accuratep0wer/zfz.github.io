// Interface translations are separate from source records and identity labels.
export const languageKey='ai-academic-lineages.language.v1';
let language='zh';
try { if(localStorage.getItem(languageKey)==='en')language='en'; } catch {}
export const isEnglish=()=>language==='en';
export const currentLanguage=()=>language;
export const phrase=(zh,en)=>isEnglish()?en:zh;
const english={
 'AI 学脉 · 学术谱系探索':'AI Lineages · Academic Lineage Explorer',
 'AI 学脉':'AI Lineages','学':'AI','脉':'MAP','中文':'Chinese',
 '界面语言':'Language','视图导航':'Views','谱系图':'Lineage map','人物索引':'Researchers','数据与来源':'Data & sources','共建草稿':'Contribute',
 '公开图谱 · 本机草稿':'Public atlas · Browser drafts','从思想的来处，走向新的研究。':'TRACE IDEAS ACROSS GENERATIONS.',
 '一代研究者，':'One generation, ','连接下一代。':'connected to the next.',
 '沿着有出处的指导关系，探索 AI 与统计、语言、认知等领域的交汇。':'Explore documented mentorship across AI, statistics, language and cognition.',
 '从早期先驱，到仍在生长的学术分支。':'From early pioneers to branches still taking shape.',
 '正在载入图谱数据快照…':'Loading the graph snapshot…','本次数据规模':'Snapshot statistics',
 '学脉候选人物':'Lineage candidates','指导关系记录':'Mentorship records','合著作者对':'Coauthor pairs','本次选定起点':'Selected roots',
 '公开来源快照，不代表全球完整名录。':'A public-source snapshot, not a complete global directory.',
 '选定起点的谱系候选；AI 相关性与最新职位尚未逐人核验。':'Descendants of selected roots; AI relevance and current roles have not been individually verified.',
 '寻找一位研究者':'Find a researcher','姓名、别名、机构…':'Name, Chinese name, alias, institution…','清除搜索':'Clear search',
 '研究方向':'Research area','全部方向':'All areas','谱系起点':'Lineage root','全部起点':'All roots','探索范围':'Explore',
 '邻近 1 代':'1 generation down','向下 2 代':'2 generations down','向下 3 代':'3 generations down','全网概览 ↗':'Full network ↗',
 '学术传承图':'ACADEMIC LINEAGES','选择人物，展开关系':'Select a researcher to explore','＋ 补充关系':'+ Add connection',
 '指导关系':'Mentorship','合著关系':'Coauthorship','我的待核验草稿':'My unreviewed drafts','着色':'Color','距起点代次':'Generation from root',
 '可缩放的研究者师承图；也可使用人物索引访问全部人物与关系':'Zoomable mentorship graph. The researcher index also provides access to people and connections.',
 '此筛选下没有可显示的关系。请换一个方向或起点。':'No connections match these filters. Try another area or root.',
 '缩小':'Zoom out','放大':'Zoom in','适应画布':'Fit to view',
 '缩小时省略姓名 · 放大或点击节点查看人物 · 可拖动画布':'Zoom in or select a node for names · Drag to pan',
 '研究生指导':'Graduate supervision','明确博士指导':'Explicit PhD supervision','博士后 / 研究指导':'Postdoctoral / research mentorship',
 '共同导师':'Co-advisor','合著':'Coauthor','本地草稿':'Local draft','导出当前关系 JSON ↓':'Export this view ↓',
 '人物与关系详情':'Researcher and connection details','点击一个节点，沿着师承继续探索。':'Select a node to explore its academic lineage.',
 '实线 / 虚线区分关系类型，不表示强弱。来源库的“研究生”未自动改称“博士”；合著不会被当作师承，图中不包含自动推断的导师关系。':'Line styles indicate relationship types, not strength. Graduate supervision does not automatically mean PhD supervision. Coauthorship is separate from mentorship; no mentorship is inferred automatically.',
 '从一个名字开始。':'Start with a name.','搜索姓名、机构、研究方向':'Search names, Chinese names, institutions or areas','搜索人物索引':'Search researchers',
 '上一页':'Previous','下一页':'Next','每条连线，都有来处。':'Every connection has a source.',
 '这张图收录什么？':'What belongs in this atlas?',
 '只沿本次选定起点的明确指导关系向下展开。研究生、博士后及研究指导分别保留类型；合著不自动扩大人物收录范围。跨学科人物按关系路径收录，方向标签可多选。':'Only documented mentorship paths from the selected roots admit people. Graduate, postdoctoral and research mentorship retain separate types. Coauthorship does not admit additional people. Interdisciplinary researchers can have multiple area tags.',
 '来源记录 ≠ 独立核验':'Source records ≠ independent verification',
 '批量谱系库中的关系标为“来源记录”。学校、实验室和本人公开资料补证的关系单独显示出处。未标注方向不表示不研究 AI；身份、导师类型与当前职位的缺口均保留。':'Bulk genealogy records are labeled as source records. Additional university, lab and personal evidence is identified separately. Missing area tags do not rule out AI research; unresolved identities, mentorship types and current roles remain unresolved.',
 '数据时间与可复核性':'Dates and reproducibility',
 '图谱保留来源链接、资料版本与许可说明。页面载入公开的整理结果；浏览时不调用外部模型或学术接口。':'The graph preserves source links, snapshot versions and attribution. It loads a public derived dataset without calling external model or scholarly APIs.',
 '来源记录，可滚动查看':'Source records, scroll to explore','本次收集、筛选与限制':'Collection, selection and limitations',
 '补上一条你知道的连线。':'Add a connection you know.','导出草稿':'Export drafts','导入草稿':'Import drafts',
 '关系草稿仅保存在当前浏览器，标为待核验，不会自动上传或修改公开图谱。可导出草稿文件，供后续核查与整理。':'Relationship drafts stay in this browser as unreviewed contributions. They are not automatically uploaded and do not change the public graph. Export drafts for later review.',
 '导师 / 作者 A':'Advisor / author A','学生 / 作者 B':'Student / author B','姓名或选择现有人物':'Name, Chinese name, or existing person',
 '关系类型':'Relationship','博士导师 → 博士生':'PhD advisor → PhD student','共同导师 → 学生':'Co-advisor → student',
 '研究生指导（学位未明确）':'Graduate supervision (degree unspecified)','博士后导师 → 博士后':'Postdoctoral advisor → postdoc','明确研究指导':'Documented research mentorship','共同作者（无方向）':'Coauthors (undirected)',
 '时间或年份（可选）':'Date or year (optional)','例如 2023–至今':'e.g. 2023–present','公开证据链接':'Public evidence URL','https://大学、实验室或论文页面':'https://university, lab or paper page',
 '证据说明':'Evidence note','说明该来源如何明确支持这条关系；仅同校或同实验室不能证明指导关系。':'Explain how the source explicitly supports this connection. Sharing an institution or lab does not establish mentorship.',
 '保存为待核验草稿':'Save unreviewed draft','取消编辑':'Cancel edit','我的共建记录':'My contributions','AI 学脉 · 学术谱系探索':'AI Lineages · Academic Lineage Explorer',
 '公开资料 · 保留来源 · 允许纠错':'Public evidence · Retained sources · Open to corrections',
 '博士导师':'PhD advisor','博士后指导':'Postdoctoral mentorship','研究指导':'Research mentorship','共同作者':'Coauthors',
 '可解释性':'Interpretability','鲁棒性':'Robustness','机器学习':'Machine learning','深度学习':'Deep learning','自然语言处理':'Natural language processing',
 '统计与概率':'Statistics & probability','语言学（来源分类）':'Linguistics (source category)','认知科学':'Cognitive science','神经科学':'Neuroscience',
 '强化学习':'Reinforcement learning','机器人':'Robotics','计算机视觉':'Computer vision','理论与逻辑':'Theory & logic','人工智能':'Artificial intelligence',
 '神经科学（来源分类）':'Neuroscience (source category)','心理学（来源分类）':'Psychology (source category)','数学（来源分类）':'Mathematics (source category)',
 '计算机科学（来源分类）':'Computer science (source category)','物理（来源分类）':'Physics (source category)','化学（来源分类）':'Chemistry (source category)',
 '生物学（来源分类）':'Biology (source category)','工程（来源分类）':'Engineering (source category)','经济学（来源分类）':'Economics (source category)',
 '哲学（来源分类）':'Philosophy (source category)','遗传学（来源分类）':'Genetics (source category)','医学（来源分类）':'Medicine (source category)',
 '本地待核验':'Locally saved · unreviewed','公开来源补证':'Primary-source evidence','来源记录':'Source record','查看证据与来源':'Evidence & sources',
 '关系来自所列公开数据快照；本项目未将批量记录当作逐条独立核验。':'This relationship is recorded in the cited public snapshot. Bulk records have not been independently verified one by one.',
 '打开关系来源 ↗':'Open relationship source ↗','论文标识与来源 ↗':'Paper identifier & source ↗','选择人物查看关系与证据。':'Select a researcher for connections and evidence.',
 '本次谱系起点':'Selected root','研究方向待补充':'Research areas unknown','AI 相关性未逐人核验':'AI relevance not individually verified','未进入来源数据库':'Not in the source database',
 '以此人为中心':'Center on person','补充此人关系':'Add connection','导师与研究指导':'Advisors & mentors','学生与受指导者':'Students & mentees',
 '本次数据中暂无记录。':'No records in this snapshot.','人物资料与收录口径':'Profile sources & scope','人物来源 ↗':'Profile source ↗','中文姓名来源 ↗':'Chinese-name source ↗',
 '此人仅为本地草稿，尚未核验。':'This person exists only in an unreviewed local draft.','职位和研究方向以具体来源日期为准；未填写的字段保持未知。':'Roles and research areas reflect the dated sources. Missing fields remain unknown.',
 '来源中的学脉候选人物':'Lineage candidate in the source','本次收录中未找到；可在共建草稿补充。':'No match in this snapshot. You can add a contribution draft.',
 '机构待补充':'Institution unknown','方向未标注':'Area not tagged','按原站说明；未统一重新授权':'See the original site; no blanket relicensing','查看原始来源 ↗':'View original source ↗',
 '草稿 ID 格式无效。':'Invalid draft ID.','不支持的关系类型。':'Unsupported relationship type.','人物字段无效。':'Invalid person fields.',
 '关系两端不能为同一人。':'A connection must link two different people.','证据链接须为 HTTP 或 HTTPS 公开页面。':'Evidence must link to a public HTTP or HTTPS page.',
 '证据说明需为 8–2,000 字符。':'The evidence note must contain 8–2,000 characters.','每个浏览器最多保存 500 条草稿，请先导出。':'This browser can store up to 500 drafts. Please export them first.',
 '发现同名人物，请用来源中的完整姓名区分。':'Multiple people match this name. Use a full source name to distinguish them.',
 '已保存在此浏览器，状态为待核验。可在谱系图勾选“我的待核验草稿”查看。':'Saved in this browser as unreviewed. Enable “My unreviewed drafts” on the map to view it.',
 '浏览器未能保存草稿，请检查站点存储权限。':'The browser could not save the draft. Check site storage permissions.','保存修改':'Save changes','正在编辑本地草稿。':'Editing a local draft.',
 '还没有草稿。补充一条带有公开证据的关系，或导入之前导出的文件。':'No drafts yet. Add a connection with public evidence, or import a previous export.',
 '待核验 · 仅本地':'Unreviewed · local only','证据链接 ↗':'Evidence link ↗','编辑':'Edit','删除':'Delete','已删除这条本地草稿。':'Local draft deleted.',
 '删除失败，请检查浏览器存储权限。':'Could not delete the draft. Check site storage permissions.','草稿文件不得超过 2 MiB。':'Draft files must not exceed 2 MiB.',
 '不是有效的本项目草稿文件。':'Not a valid draft file for this project.','存在同 ID 的不同版本；请先在原浏览器整理后再导入。':'Conflicting versions share the same ID. Resolve them in the original browser before importing.',
 '文件未导入，现有草稿保留。':'The file was not imported. Existing drafts are unchanged.','数据文件尚未生成，请待收集完成后刷新。':'The data file is not available yet. Refresh after collection finishes.',
 '数据快照格式无效。':'Invalid data snapshot format.','已有本地草稿无法读取；未覆盖原数据，可先导出浏览器原始记录再处理。':'Existing local drafts could not be read. Stored data was not overwritten; export the original browser records before repairing them.',
 '草稿日期格式无效。':'Invalid draft date.','未知':'Unknown','本地整理日期不代表每一项资料均在当天重新核验。':'The local snapshot date does not imply that every fact was reverified that day.'
};
export function t(text){if(text==null)return '';const value=String(text);if(!isEnglish())return value;const trimmed=value.trim();return Object.hasOwn(english,trimmed)?value.replace(trimmed,english[trimmed]):value;}
export async function loadDataTranslations(){const response=await fetch('./data-en.json');if(!response.ok)throw new Error('English translations could not be loaded.');Object.assign(english,await response.json());}
const originalText=[],originalAttributes=[];
export function captureStatic(root=document){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let item;
 while((item=walker.nextNode()))if(item.textContent.trim()&&!['SCRIPT','STYLE'].includes(item.parentElement?.tagName))originalText.push([item,item.textContent]);
 for(const element of root.querySelectorAll('[title],[aria-label],[placeholder]'))for(const attr of ['title','aria-label','placeholder'])if(element.hasAttribute(attr))originalAttributes.push([element,attr,element.getAttribute(attr)]);
}
export function applyStatic(){
 document.documentElement.lang=isEnglish()?'en':'zh-CN';
 for(const [item,value] of originalText)if(item.isConnected)item.textContent=t(value);
 for(const [element,attr,value] of originalAttributes)element.setAttribute(attr,t(value));
 const selector=document.getElementById('language-select');if(selector)selector.value=language;
}
export function setLanguage(value){language=value==='en'?'en':'zh';try{localStorage.setItem(languageKey,language);}catch{}applyStatic();}
export function translatedRecord(value){if(typeof value==='string')return t(value);if(Array.isArray(value))return value.map(translatedRecord);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,translatedRecord(v)]));return value;}
// Store calendar dates explicitly, so reloads and travel do not move a snapshot day.
export function dateOn(value=new Date().toISOString()){
 const d=new Date(value);if(Number.isNaN(d.getTime()))return '';
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
 const get=key=>parts.find(p=>p.type===key).value;return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
