(function(root){
 const N=typeof module==='object'?require('./rockport-navigation'):root.RockportNavigation;
 function loadout(player,heat,tune){
  const spec=tune(player.stage,player.vehicle,player),max=spec.max*(.98+heat*.018),acceleration=spec.acceleration*(.98+heat*.025);let best;
  for(const vehicle of ['interceptor','porsche','gtr','r390'])for(let stage=1;stage<=4;stage++){
   const s=tune(stage,vehicle),score=Math.abs(Math.log(s.max/max))+Math.abs(Math.log(s.acceleration/acceleration))+Math.max(0,1-s.max/max)*4+Math.max(0,1-s.acceleration/acceleration)*3;
   if(!best||score<best.score)best={vehicle,stage,score};
  }return {vehicle:best.vehicle,stage:best.stage};
 }
 function clearRoad(cells,a,b,box,P,offroad=false){
  const length=Math.hypot(b.x-a.x,b.z-a.z);if(length>75)return false;const yaw=Math.atan2(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.ceil(length/4));
  for(let i=0;i<=steps;i++){
   const t=i/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,ref=a.y+(b.y-a.y)*t,f=P.surface(cells,x,z,ref,1.5,1.5);if(!f||(!offroad&&!f.road))return false;
   for(const side of [-box.width/2,box.width/2])for(const ahead of [-box.length/2,box.length/2]){
    const dx=Math.cos(yaw)*side+Math.sin(yaw)*ahead,dz=-Math.sin(yaw)*side+Math.cos(yaw)*ahead;
    const top=P.surface(cells,x+dx,z+dz,f.y+f.dx*dx+f.dz*dz,.8,.8);if(!top||(!offroad&&!top.road))return false;
   }
   if(P.boxHit(cells,{x,y:f.y,z,yaw,pitch:Math.atan(f.dx*Math.sin(yaw)+f.dz*Math.cos(yaw)),roll:Math.atan(f.dx*Math.cos(yaw)-f.dz*Math.sin(yaw))},box))return false;
  }return true;
 }
 function tacticalTarget(state,known,id=0,heat=1,search=false){
  const speed=Math.hypot(known.vx||0,known.vz||0),yaw=speed>2?Math.atan2(known.vx,known.vz):(known.yaw||0),range=Math.hypot(state.x-known.x,state.z-known.z),role=id%3;
  if(search)return {...known,x:known.x+Math.cos(yaw)*(role-1)*8,z:known.z-Math.sin(yaw)*(role-1)*8,vx:0,vz:0};
  const lead=range<14?.08:Math.min(role===0?.55:role===1?1.8:1.1,Math.max(.15,range/Math.max(25,speed)*.6)),side=range<12?0:(role===0?0:role===1?1:-1)*Math.min(4,1.5+heat*.4);
  return {...known,x:known.x+(known.vx||0)*lead+Math.cos(yaw)*side,z:known.z+(known.vz||0)*lead-Math.sin(yaw)*side,yaw};
 }
 function engage(state,target,heat,tune){const dx=target.x-state.x,dz=target.z-state.z,range=Math.hypot(dx,dz),error=Math.atan2(Math.sin(Math.atan2(dx,dz)-state.yaw),Math.cos(Math.atan2(dx,dz)-state.yaw)),speed=Math.hypot(target.vx||0,target.vz||0),spec=tune(state.stage,state.vehicle,state.setup),goal=Math.min(spec.max*.99,Math.max(7,speed+4+heat*1.1))*Math.max(.2,Math.cos(error)),steer=Math.max(-1,Math.min(1,-2*Math.max(8,Math.abs(state.speed))*Math.sin(error)/Math.max(5,range)/Math.max(.65,spec.steering*1.1)));
  return {throttle:state.speed<goal+.5,brake:state.speed>.6&&state.speed>goal+2,steer,nitro:range>28&&Math.abs(error)<.1&&state.grounded!==false&&state.nitro>20&&state.speed<goal-1,handbrake:false};
 }
 function plan(nav,state,target,cells,P){
  const speed=Math.hypot(target.vx||0,target.vz||0),lead=Math.min(1.1,65/Math.max(1,speed)),predicted={x:target.x+(target.vx||0)*lead,y:target.y,z:target.z+(target.vz||0)*lead};
  const ids=N.path(nav,N.nearest(nav,state),N.nearest(nav,predicted));if(ids.length<2)return null;
  const raw=[{x:state.x,y:state.y,z:state.z},...ids.slice(1,61).map(i=>({x:nav.nodes[i][0],y:nav.nodes[i][1],z:nav.nodes[i][2]}))],points=[[state.x,state.y,state.z]];
  let at=0;while(at<raw.length-1){let next=at+1;for(let j=Math.min(raw.length-1,at+10);j>at+1;j--)if(clearRoad(cells,raw[at],raw[j],state.box,P)){next=j;break;}points.push([raw[next].x,raw[next].y,raw[next].z]);at=next;}
  return N.route(points,{closed:false});
 }
 function visible(cells,observer,target,heat,P){
  if(Math.hypot(observer.x-target.x,observer.z-target.z)>280+heat*25||Math.abs(observer.y-target.y)>18)return false;
  const end={x:target.x,y:target.y+1.3,z:target.z},ray=P.clipCamera(cells,{x:observer.x,y:observer.y+1.3,z:observer.z},end);
  return Math.hypot(ray.x-end.x,ray.y-end.y,ray.z-end.z)<.6;
 }
 function spawn(nav,player,actors,cells,P,box,sequence=0){
  const forward=sequence%2===1?1:-1,candidates=nav.connected.filter(i=>{const p=nav.nodes[i],d=Math.hypot(p[0]-player.x,p[2]-player.z);return d>120&&d<250&&Math.abs(p[1]-player.y)<12&&actors.every(a=>Math.hypot(a.x-p[0],a.z-p[2])>18)});
  const score=i=>{const p=nav.nodes[i],dx=p[0]-player.x,dz=p[2]-player.z,d=Math.hypot(dx,dz);return Math.abs(d-180)-forward*(dx*Math.sin(player.yaw)+dz*Math.cos(player.yaw))*.5;};candidates.sort((a,b)=>score(a)-score(b));
  for(const id of candidates.slice(0,24)){
   const path=N.path(nav,id,N.nearest(nav,player));if(path.length<3||path.length>110)continue;
   const a=nav.nodes[id],b=nav.nodes[path[Math.min(4,path.length-1)]],pose={x:a[0],y:a[1],z:a[2],yaw:Math.atan2(b[0]-a[0],b[2]-a[2])},ahead={x:pose.x+Math.sin(pose.yaw)*4,y:pose.y,z:pose.z+Math.cos(pose.yaw)*4};
   if(clearRoad(cells,pose,ahead,box,P))return pose;
  }return null;
 }
 const api={loadout,clearRoad,clearDrive:(cells,a,b,box,P)=>clearRoad(cells,a,b,box,P,true),tacticalTarget,engage,plan,visible,spawn};if(typeof module==='object')module.exports=api;else root.BlacklinePursuitAI=api;
})(typeof window==='object'?window:globalThis);
