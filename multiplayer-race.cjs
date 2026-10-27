const crypto=require('node:crypto');
function fail(message){throw Object.assign(Error(message),{status:409});}
const active=r=>r&&['offered','countdown','running'].includes(r.status);
function chooseGoal(start){
 const nav=require('./assets/rockport/navigation.json'),routes=require('./assets/rockport/routes.json'),N=require('./src/rockport-navigation');
 const a=N.nearest(nav,start);if(a<0||Math.hypot(nav.nodes[a][0]-start.x,nav.nodes[a][2]-start.z)>100)fail('Drive onto a road first.');
 const candidates=[];
 for(const route of routes){let last=null;for(const p of route.points){if(last&&Math.hypot(p[0]-last[0],p[2]-last[2])<90)continue;last=p;const d=Math.hypot(p[0]-start.x,p[2]-start.z);if(d>450&&d<1900)candidates.push(p);}}
 // Outer districts need not have a solo race: their validated road nodes are valid destinations too.
 if(!candidates.length)for(let i=0;i<nav.connected.length;i+=4){const id=nav.connected[i],p=nav.nodes[id],d=Math.hypot(p[0]-start.x,p[2]-start.z);if(nav.edges[id].length>=2&&d>450&&d<1900)candidates.push(p);}
 while(candidates.length){const i=crypto.randomInt(candidates.length),p=candidates.splice(i,1)[0],b=N.nearest(nav,{x:p[0],y:p[1],z:p[2]});if(!N.path(nav,a,b).length)continue;return {x:p[0],y:p[1],z:p[2],radius:12,label:'RANDOM FINISH'};}
 fail('No reachable finish was found nearby. Try another location.');
}
// Entering a finish area counts at the swept entry time, not whichever poll arrives first.
function crossing(a,b,goal){
 const dx=b.x-a.x,dz=b.z-a.z,ox=a.x-goal.x,oz=a.z-goal.z,A=dx*dx+dz*dz,C=ox*ox+oz*oz-goal.radius**2;
 let t=0;if(C>0){const B=2*(ox*dx+oz*dz),disc=B*B-4*A*C;if(A<1e-9||disc<0)return null;t=(-B-Math.sqrt(disc))/(2*A);if(t<0||t>1)return null;}
 return Math.abs(a.y+(b.y-a.y)*t-goal.y)<=4?t:null;
}
function createDuels({now=Date.now,pickGoal=chooseGoal}={}){
 function cancel(r,reason){r.status='cancelled';r.reason=reason;r.endedAt=now();}
 function finish(r){const results=Object.entries(r.arrivals||{}).sort((a,b)=>a[1]-b[1]);if(!results.length)return false;r.status='finished';r.winner=results[0][0];r.timeMs=Math.max(0,results[0][1]-r.startsAt);r.endedAt=now();return true;}
 function stop(r,reason){if(!finish(r))cancel(r,reason);}
 function update(room){const r=room.race;if(!active(r))return;
  if(r.ids.some(id=>!room.players.has(id)||now()-room.players.get(id).seen>10000)){stop(r,'A player disconnected or left the room.');return;}
  if(r.status==='offered'){if(now()>r.expiresAt)cancel(r,'The challenge expired.');return;}
  if(now()-r.startsAt>600000){stop(r,'The race time limit was reached.');return;}
  if(now()>=r.startsAt)r.status='running';
  if(r.settleAt&&now()>=r.settleAt)finish(r);
 }
 function action(room,p,action,body){update(room);let r=room.race;
  if(action==='challenge'){
   if(active(r))fail('A challenge or race is already active in this room.');const other=room.players.get(body.opponent);
   if(!other||other.id===p.id||[p,other].some(v=>v.state.phase!=='roam'||now()-v.seen>3000))fail('Both players must be in free roam.');
   if(Math.hypot(p.state.x-other.state.x,p.state.z-other.state.z)>60||Math.abs(p.state.y-other.state.y)>4)fail('Move closer together (within 60 m and on the same road level).');
   room.race={id:crypto.randomBytes(8).toString('hex'),status:'offered',ids:[p.id,other.id],names:{[p.id]:p.name,[other.id]:other.name},expiresAt:now()+45000};return;
  }
  if(!active(r)||r.id!==body.raceId||!r.ids.includes(p.id))fail('This challenge or race is no longer active.');
  if(action==='decline'||action==='cancel-race'){stop(r,action==='decline'?'The challenge was declined.':'A player cancelled the race.');return;}
  if(action!=='accept'||r.status!=='offered'||p.id!==r.ids[1])fail('Only the challenged player can accept.');
  const pair=r.ids.map(id=>room.players.get(id));if(pair.some(v=>v.state.phase!=='roam'||now()-v.seen>3000))fail('Both players must be in free roam.');
  if(Math.hypot(pair[0].state.x-p.state.x,pair[0].state.z-p.state.z)>60||Math.abs(pair[0].state.y-p.state.y)>4)fail('Move closer together before starting (within 60 m).');
  r.goal=pickGoal(pair[0].state);r.anchors=Object.fromEntries(pair.map(v=>[v.id,{...v.state}]));r.startsAt=now()+5000;r.status='countdown';r.arrivals={};
 }
 function observe(room,p,previous,previousAt){const r=room.race;update(room);if(!active(r)||r.status==='offered'||!r.ids.includes(p.id))return;
  if(p.state.phase!=='roam'){stop(r,'A player left free roam.');return;}
  if(now()<r.startsAt){Object.assign(p.state,r.anchors[p.id],{speed:0,vx:0,vz:0});return;}
  if(r.arrivals[p.id]!==undefined)return;
  const from=Math.max(previousAt,r.startsAt),dt=Math.max(0,now()-from),distance=Math.hypot(p.state.x-previous.x,p.state.z-previous.z);
  if(distance>Math.max(20,dt*.18+8)){stop(r,'Race cancelled: a car moved too far in one update.');return;}
  const t=crossing(previous,p.state,r.goal);if(t===null)return;
  r.arrivals[p.id]=from+dt*t;r.settleAt||=now()+1200;
 }
 function view(room){update(room);const r=room.race;if(!r)return null;const {anchors,...publicRace}=r;return {...publicRace,anchors:anchors?Object.fromEntries(Object.entries(anchors).map(([id,s])=>[id,{x:s.x,y:s.y,z:s.z,yaw:s.yaw,pitch:s.pitch,roll:s.roll}])):undefined};}
 return {action,observe,update,view};
}
module.exports={createDuels,chooseGoal,crossing,active};
