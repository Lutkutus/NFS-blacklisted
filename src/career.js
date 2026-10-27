/* Career and pursuit rules, independent of rendering. */
(function(root){
  // Original ranks and owners. Ronnie (#3) and Bull (#2) are omitted at the
  // user's request because no corresponding source models were supplied.
  const challenges=[
    [15,'sonny','SONNY','Volkswagen Golf GTI','golf',0,0,2600,0,3500],
    [14,'taz','TAZ','Lexus IS 300','taz',0,2800,2600,1,4500],
    [13,'vic','VIC','Toyota Supra','vic',1,0,3200,1,5000],
    [12,'izzy','IZZY','Mazda RX-8','izzy',2,0,3500,1,6000],
    [11,'big_lou','BIG LOU','Mitsubishi Eclipse GT','big_lou',0,800,3500,1,6500],
    [10,'baron','BARON','Porsche Cayman S','baron',0,1500,4500,2,7000],
    [9,'earl','EARL','Mitsubishi Lancer Evolution VIII','earl',0,4200,4000,2,7500],
    [8,'jewels','JEWELS','Ford Blackng GT','jewels',1,1000,5000,2,8000],
    [7,'kaze','KAZE','Mercedes-Benz CLK 500','kaze',2,0,4800,2,9000],
    [6,'ming','MING','Lamborghini Gallardo','ming',3,0,6000,3,10000],
    [5,'webster','WEBSTER','Chevrolet Corvette C6','webster',0,0,7500,3,11000],
    [4,'jv','JV','Dodge Viper SRT-10','jv_viper',3,2000,7000,3,12000],
    [1,'razor','RAZOR','BMW M3 GTR','m3gtr',3,0,11000,4,18000]
  ].map(([rank,id,name,car,vehicle,track,start,metres,stage,reward])=>({rank,id,name,car,vehicle,track,start,metres,stage,reward,mode:'race',target:Infinity}));
  const opponentVehicles=[...challenges.map(c=>c.vehicle),'razor','m3_redfire'];
  const legacyWinners=['sonny','jewels','jv','razor'];
  const retiredVehicles=['ae86','mia_rx8','interceptor','skyline_beta','skyline_java'];
  const requiredRaceWins=10;
  const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
  function normalizeProgress(saved={}){
    let wins=Array.isArray(saved.blacklistWins)?saved.blacklistWins:[];
    if(saved.blacklistVersion!==2){const count=Math.max(0,Math.min(4,Math.floor(Number(saved.blacklistMW)||0)));wins=[...wins,...legacyWinners.slice(0,count)];}
    wins=challenges.filter(c=>wins.includes(c.id)).map(c=>c.id);
    const ownedStages={...(saved.ownedStages||{})};
    for(const c of challenges)if(wins.includes(c.id))ownedStages[c.vehicle]=Math.max(Number(ownedStages[c.vehicle])||0,c.stage);
    if(wins.includes('razor'))ownedStages.razor=Math.max(Number(ownedStages.razor)||0,2);
    return {...saved,blacklistVersion:2,blacklistWins:wins,blacklistMW:wins.length,ownedStages,raceWinsSinceBoss:Math.min(requiredRaceWins,count(saved.raceWinsSinceBoss)),regularRaceWins:count(saved.regularRaceWins)};
  }
  function ownedPinkSlips(saved={}){const s=normalizeProgress(saved),cars=challenges.filter(c=>(s.cheats?.unlockAll===true||s.blacklistWins.includes(c.id))).map(c=>c.vehicle);if(s.cheats?.unlockAll===true||s.blacklistWins.includes('razor'))cars.push('razor');return cars;}
  function selectableVehicle(id,saved={}){return !retiredVehicles.includes(id)&&(!opponentVehicles.includes(id)||ownedPinkSlips(saved).includes(id));}
  function nextChallenge(saved){const s=normalizeProgress(saved);return challenges.findIndex(c=>!s.blacklistWins.includes(c.id));}
  function canChallenge(index,saved){const c=challenges[index],s=normalizeProgress(saved);return !!c&&(s.cheats?.unlockAll===true||s.blacklistWins.includes(c.id)||index===nextChallenge(s)&&s.raceWinsSinceBoss>=requiredRaceWins);}
  function recordRaceWin(saved,{mode,place,elapsed}){const s=normalizeProgress(saved);if(mode!=='race'||place!==1||!Number.isFinite(elapsed)||elapsed<=0)return s;return {...s,raceWinsSinceBoss:Math.min(requiredRaceWins,s.raceWinsSinceBoss+1),regularRaceWins:Math.min(Number.MAX_SAFE_INTEGER,s.regularRaceWins+1)};}
  function claimPinkSlip(saved,index,result){
    const state=normalizeProgress(saved),c=challenges[index];
    if(!c||!canChallenge(index,state)||!challengeWon(c,result)||state.blacklistWins.includes(c.id))return {state,firstWin:false,unlocked:[],bonus:0};
    const won=normalizeProgress({...state,blacklistWins:[...state.blacklistWins,c.id],raceWinsSinceBoss:0});
    return {state:won,firstWin:true,unlocked:c.id==='razor'?[c.vehicle,'razor']:[c.vehicle],bonus:c.reward};
  }
  function challengeRoute(index,bases,N){const c=challenges[index],base=bases[c.track],start=Math.min(c.start,base.length-500),end=Math.min(base.length,start+c.metres),points=[];const a=N.sample(base,start);points.push([a.x,a.y,a.z]);for(let i=0;i<base.points.length;i++)if(base.distances[i]>start&&base.distances[i]<end)points.push(base.points[i]);const b=N.sample(base,end);points.push([b.x,b.y,b.z]);const r=N.route(points,{closed:false,name:`${c.name} / ${base.name}`});r.checkpoints=N.checkpoints(r);return r;}
  const costs=[0,1500,4500,9000,18000];
  function buyUpgrade(balance,owned,stage){
    if(!Number.isFinite(balance)||!Number.isInteger(stage)||stage<1||stage>4||stage<=owned||balance<costs[stage])return null;
    return {balance:balance-costs[stage],owned:stage};
  }
  function createPursuit(){return {phase:'patrol',heat:1,offence:0,time:0,escape:0,bust:0,cooldown:0,cooldownTotal:24,bounty:0};}
  function updatePursuit(p,dt,{speed,nearest=Infinity,visible=nearest<280,bustDistance=nearest}){
    let event=null;
    if(p.phase==='patrol'){
      p.offence=Math.max(0,p.offence+(speed>32?dt:-dt*.7));
      if(p.offence>5){p.phase='chase';p.time=0;p.heat=1;event='spotted';}
    }else if(p.phase==='chase'){
      p.time+=dt;p.heat=Math.min(5,1+Math.floor(p.time/35));p.bounty=Math.floor(p.time*18*p.heat);
      p.bust=Math.max(0,Math.min(5,p.bust+(visible&&bustDistance<16&&speed<6?dt:-dt*2)));
      p.escape=Math.max(0,p.escape+(!visible&&nearest>110?dt:-dt*4));
      if(p.bust>=5){p.phase='busted';p.cooldown=3;event='busted';}
      else if(p.escape>=12+p.heat*2){p.phase='cooldown';p.cooldownTotal=20+p.heat*4;p.cooldown=p.cooldownTotal;event='hidden';}
    }else if(p.phase==='cooldown'){
      if(visible||nearest<65){p.phase='chase';p.escape=0;event='spotted';}
      else {p.cooldown-=dt;if(p.cooldown<=0){event='escaped';p.phase='patrol';p.offence=0;p.escape=0;p.bust=0;}}
    }else if(p.phase==='busted'){p.cooldown-=dt;if(p.cooldown<=0){Object.assign(p,createPursuit());event='released';}}
    return event;
  }
  function challengeWon(challenge,{elapsed,place}){return Number.isFinite(elapsed)&&elapsed>=0&&elapsed<=challenge.target&&(challenge.mode!=='race'||place===1);}
  const api={challenges,opponentVehicles,selectableVehicle,normalizeProgress,ownedPinkSlips,nextChallenge,canChallenge,claimPinkSlip,recordRaceWin,requiredRaceWins,challengeRoute,costs,createPursuit,updatePursuit,challengeWon,buyUpgrade};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BlacklineCareer=api;
})(typeof globalThis!=='undefined'?globalThis:this);
