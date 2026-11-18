// A compact display taxonomy. Original source tags remain in the data and search.
export const RESEARCH_AREAS = [
 {id:'learning',zh:'机器学习、数学与统计',en:'Machine learning, mathematics & statistics',tags:'ml|deep_learning|statistics|math|theory|machine learning|deep learning|statistical learning|learning theory|probabilistic modeling|probability|mathematics|机器学习|统计机器学习|统计与概率|概率模型|贝叶斯方法|无监督学习|深度学习|神经网络|生成模型|基础模型'},
 {id:'language',zh:'自然语言与语言学',en:'Language & linguistics',tags:'nlp|ling|linguistics|natural language processing|computational linguistics|csd|自然语言处理|语言学|计算语言学|形式语言|概率语言学|手语与语言学'},
 {id:'vision',zh:'计算机视觉',en:'Computer vision',tags:'vision|computer vision|computer_vision|计算机视觉|图像处理'},
 {id:'robotics',zh:'机器人与强化学习',en:'Robotics & reinforcement learning',tags:'robotics|rl|control|control theory|reinforcement learning|机器人|强化学习|控制理论'},
 {id:'cognition',zh:'认知与神经科学',en:'Cognition & neuroscience',tags:'neuro|neuroscience|cognitive_science|cognitive science|psych|psychology|npath|alzh|ntrauma|psyphys|chronobiology|behavior|hypnosis|insectneuropeptides|认知科学|神经科学|心理学'},
 {id:'trustworthy',zh:'人工智能安全与治理',en:'AI safety & governance',tags:'safety|alignment|interpretability|robustness|ai safety|ai alignment|ai governance|ai ethics|fairness|privacy|security|AI 治理|智能体安全|可扩展监督|可信 AI|隐私与安全|可解释性|鲁棒性|合作 AI|人机协作'},
 {id:'computing',zh:'计算机与工程',en:'Computing & engineering',tags:'ai|computerscience|computer science|engineering|etree|infoscience|artificial intelligence|symbolic ai|reasoning|automated reasoning|planning|knowledge representation|符号 AI|知识表示|逻辑推理|规划与推理|算法博弈论|人工智能'},
 {id:'interdisciplinary',zh:'其他交叉学科',en:'Other interdisciplinary fields',tags:''}
];
const key=value=>String(value||'').normalize('NFKC').toLowerCase().trim().replace(/[_\s]+/g,' ');
const groups=new Map(RESEARCH_AREAS.flatMap(a=>a.tags.split('|').filter(Boolean).map(tag=>[key(tag),a.id])));
export const sourceAreas=p=>Array.isArray(p.areas)?p.areas.map(a=>typeof a==='string'?a:a.id||a.name).filter(Boolean):[];
export function broadAreas(p){
 return [...new Set(sourceAreas(p).map(tag=>groups.get(key(tag))||'interdisciplinary'))];
}
