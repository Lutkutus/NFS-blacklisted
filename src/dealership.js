/* Persistent ownership and the local game's progression economy. */
(function(root){
 const C=typeof module==='object'?require('./career'):root.BlacklineCareer;
 const stock=[
  ['crown',16000,0,'STARTER'],['livisa',28000,0,'STREET'],['emery',50000,2,'SPORT'],
  ['charger',34000,1,'MUSCLE'],['skyline',48000,2,'SPORT'],
  ['rotary',72000,4,'SPORT'],['porsche',88000,5,'SPORT'],
  ['gtr',125000,7,'SUPER'],['diablo',165000,8,'SUPER'],['r390',215000,10,'GT'],['gtone',285000,12,'GT'],
  ['testarossa',115000,6,'CLASSIC'],['datsun',20000,0,'CLASSIC'],['tiburon',22000,0,'STREET'],['road_runner',32000,1,'MUSCLE'],['supra',68000,3,'SPORT'],['m5_e39',82000,4,'SPORT'],['resonanso',145000,7,'SUPER'],['carrera_gt',195000,9,'SUPER']
 ].map(([id,price,wins,category])=>({id,price,wins,category})).sort((a,b)=>a.price-b.price);
 const catalog=Object.fromEntries(stock.map(c=>[c.id,c]));
 const starter='crown';
 function raceOpponents(config,tune){
  const player=tune(config.stage,config.vehicle,config),pool=[];
  for(const car of stock)for(let stage=0;stage<=Math.min(4,config.stage+1);stage++){
   const spec=tune(stage,car.id);if(spec.max>player.max*1.16||spec.acceleration>player.acceleration*1.22)continue;
   pool.push({vehicle:car.id,stage,score:Math.abs(Math.log(spec.max/(player.max*1.06)))+Math.abs(Math.log(spec.acceleration/(player.acceleration*1.1)))});
  }
  pool.sort((a,b)=>a.score-b.score);const unique=pool.filter((c,i)=>pool.findIndex(p=>p.vehicle===c.vehicle)===i);if(!unique.length)unique.push({vehicle:starter,stage:0});
  return Array.from({length:3},(_,i)=>({vehicle:unique[i%unique.length].vehicle,stage:unique[i%unique.length].stage}));
 }
 function normalize(saved={}){
  const state=C.normalizeProgress(saved),owned=new Set(Array.isArray(saved.ownedCars)?saved.ownedCars.filter(id=>catalog[id]):[]);owned.add(starter);
  if(saved.economyVersion!==1){
   // A free selection in an old menu is not proof of a purchase. Preserve the
   // equipped car and paid engine packages; keep other builds for later reuse.
   const id=saved.config?.vehicle;if(catalog[id])owned.add(id);
   for(const [id,stage]of Object.entries(saved.ownedStages||{}))if(catalog[id]&&Number(stage)>0)owned.add(id);
  }
  return {...state,economyVersion:1,ownedCars:stock.filter(c=>owned.has(c.id)).map(c=>c.id),cash:Number.isFinite(saved.cash)&&saved.cash>=0?saved.cash:8000};
 }
 function owns(saved,id){const s=normalize(saved);return s.ownedCars.includes(id)||C.ownedPinkSlips(s).includes(id);}
 function available(saved,id){const c=catalog[id];return !!c&&(saved.cheats?.unlockAll===true||normalize(saved).blacklistWins.length>=c.wins);}
 function purchase(saved,id){const state=normalize(saved),item=catalog[id];
  if(!item)return {ok:false,state,reason:'This car is not sold at the dealership.'};
  if(owns(state,id))return {ok:false,state,reason:'You already own this car.'};
  if(!available(state,id))return {ok:false,state,reason:`Win ${item.wins} Blacklist boss challenges first.`};
  if(state.cash<item.price)return {ok:false,state,reason:`You need another ${item.price-state.cash} €.`};
  return {ok:true,state:{...state,cash:state.cash-item.price,ownedCars:[...state.ownedCars,id]},reason:'Car added to your garage.'};
 }
 // Longer sprints pay better; repeating a route remains useful without making
 // an entire car affordable after just one short event. Boss bonuses stay once.
 function raceReward(type,place,metres){const km=Math.max(2,Math.min(12,Number(metres)/1000||2)),base=Math.round((1800+km*300)/100)*100;
  return type==='time'?Math.round(base*.35/100)*100:place===1?base:place===2?Math.round(base*.4/100)*100:Math.round(base*.2/100)*100;
 }
 function unlockAll(saved={}){
  const state=normalize(saved),cheats={...state.cheats,unlockAll:true},unlocked={...state,cheats},ids=[...stock.map(c=>c.id),...C.ownedPinkSlips(unlocked)];
  return {...unlocked,ownedCars:stock.map(c=>c.id),ownedStages:{...state.ownedStages,...Object.fromEntries(ids.map(id=>[id,Math.max(4,Number(state.ownedStages[id])||0)]))},cash:Math.max(state.cash,1000000)};
 }
 const api={unlockAll,stock,catalog,starter,normalize,owns,available,purchase,raceReward,raceOpponents};if(typeof module==='object')module.exports=api;else root.BlacklineDealership=api;
})(typeof globalThis!=='undefined'?globalThis:this);
