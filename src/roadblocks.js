/* Temporary pursuit deployments. Cars use the shared chassis; cones use streamed-prop debris. */
(function(root){
 'use strict';
 const node=typeof module==='object',N=node?require('./rockport-navigation'):root.RockportNavigation,P=node?require('./rockport-physics'):root.RockportPhysics,V=node?require('./vehicle-physics'):root.BlacklineVehiclePhysics,A=node?require('./pursuit-ai'):root.BlacklinePursuitAI,Traf=node?require('./civilian-traffic'):root.BlacklineCivilianTraffic;
 const box={width:2.4,length:5.8,height:1.4,bottom:.22},distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 function layout(world,player,actors=[]){
  const nav=world.nav,start=N.nearest(nav,player),fx=Math.sin(player.yaw),fz=Math.cos(player.yaw),cells=world.cells();
  const candidates=nav.connected.filter(id=>{const n=nav.nodes[id],dx=n[0]-player.x,dz=n[2]-player.z,d=Math.hypot(dx,dz);return d>200&&d<420&&dx*fx+dz*fz>d*.75&&Math.abs(n[1]-player.y)<14;}).sort((a,b)=>Math.abs(distance(player,{x:nav.nodes[a][0],z:nav.nodes[a][2]})-280)-Math.abs(distance(player,{x:nav.nodes[b][0],z:nav.nodes[b][2]})-280));
  for(const id of candidates.slice(0,32)){
   const ids=N.path(nav,start,id);if(ids.length<4)continue;let length=0;for(let i=1;i<ids.length;i++){const a=nav.nodes[ids[i-1]],b=nav.nodes[ids[i]];length+=Math.hypot(a[0]-b[0],a[2]-b[2]);}if(length>500)continue;
   const n=nav.nodes[id],prev=nav.nodes[ids[Math.max(0,ids.length-4)]],yaw=Math.atan2(n[0]-prev[0],n[2]-prev[2]),center={x:n[0],y:n[1],z:n[2],yaw},rx=Math.cos(yaw),rz=-Math.sin(yaw);
   if(!world.areaReady(center,25)||actors.some(a=>distance(a,center)<26&&Math.abs(a.y-center.y)<4))continue;
   const approach={x:center.x-Math.sin(yaw)*35,y:center.y,z:center.z-Math.cos(yaw)*35};
   if(!A.clearRoad(cells,approach,center,box,P))continue;
   const edge=sign=>{let width=0;for(let d=.5;d<=20;d+=.5){if(!P.surface(cells,center.x+rx*d*sign,center.z+rz*d*sign,center.y,.8,.8)?.road)break;width=d;}return width;},left=edge(-1),right=edge(1),width=left+right;
   if(width<10)continue;
   const offsets=[-left+3.4];if(width>18)offsets.push(-left+9.6);
   const poses=offsets.map(offset=>({x:center.x+rx*offset,y:center.y,z:center.z+rz*offset,yaw:yaw+Math.PI/2}));
   if(!poses.every(p=>Traf.clear(world,p,box)))continue;
   // Leave a continuous >=3.5 m escape lane along the right edge.
   const gapOffset=(offsets.at(-1)+3+right)/2,gapWidth=right-(offsets.at(-1)+3);
   const gap={x:center.x+rx*gapOffset,y:center.y,z:center.z+rz*gapOffset,yaw};
   if(gapWidth<3.5||!A.clearRoad(cells,{x:gap.x-Math.sin(yaw)*10,y:gap.y,z:gap.z-Math.cos(yaw)*10},{x:gap.x+Math.sin(yaw)*10,y:gap.y,z:gap.z+Math.cos(yaw)*10},box,P))continue;
   return {center,poses,gap,gapWidth,yaw};
  }return null;
 }
 function create({THREE:T,world,scene,makeUnit,notice=()=>{}}){
  const blocks=[];let cooldown=12,spawned=0,disposed=false;
  function remove(block){for(const c of block.cars){scene.remove(c.model);c.model.traverse(n=>{n.geometry?.dispose();if(Array.isArray(n.material))n.material.forEach(m=>m.dispose());else n.material?.dispose();});}world.breakables.detach(block.owner);scene.remove(block.props);block.props.traverse(n=>{n.geometry?.dispose();n.material?.dispose();});blocks.splice(blocks.indexOf(block),1);}
  function trySpawn(player,heat,others=[]){if(disposed||blocks.length>=2)return false;const plan=layout(world,player,[...others,...actors()]);if(!plan)return false;
   const cars=plan.poses.map(p=>makeUnit(p,heat)),props=new T.Group(),meshes=[],definitions=[];scene.add(props);
   for(const pose of plan.poses)for(const offset of [-1.8,1.8]){
    const x=pose.x+Math.cos(plan.yaw)*offset-Math.sin(plan.yaw)*4,z=pose.z-Math.sin(plan.yaw)*offset-Math.cos(plan.yaw)*4,y=world.ground(x,z,pose.y),cone=new T.Group();cone.position.set(x,y,z);props.add(cone);const parts=[];
    for(const [h,r,color]of [[.35,.32,0xff6520],[.7,.21,0xffffff],[1,.14,0xff6520]]){const mesh=new T.Mesh(new T.CylinderGeometry(r*.65,r,.34,6),new T.MeshBasicMaterial({color}));mesh.position.y=h;cone.add(mesh);const primitive=meshes.length;meshes.push(mesh);parts.push({node:0,primitive,triangles:Array.from({length:mesh.geometry.index.count/3},(_,i)=>i*3)});}
    props.updateWorldMatrix(true,true);const bounds=new T.Box3().setFromObject(cone);definitions.push({label:'OBJ_ORANGEWHITE_ROADBLOCK',kind:'roadside',min:bounds.min.toArray(),max:bounds.max.toArray(),parts});
   }
   const owner=world.breakables.attach(props,definitions,[meshes]);blocks.push({...plan,cars,props,owner,age:0});spawned++;notice('ROADBLOCK AHEAD · FIND A GAP OR BREAK THROUGH',4);return true;
  }
  function actors(){return blocks.flatMap(b=>b.cars.map(c=>c.state));}
  function update(dt,player,pursuit,others=[]){if(disposed)return;cooldown-=dt;
   for(const b of [...blocks]){b.age+=dt;if(b.age>110||distance(player,b.center)>650||!world.areaReady(b.center,12)){remove(b);continue;}for(const c of b.cars){const s=c.state;world.simulate(s,{throttle:false,brake:s.speed>.5,steer:0,nitro:false},dt);c.red.visible=Math.sin(b.age*18)>0;c.blue.visible=!c.red.visible;world.pose(c.model,s.x,s.z,s.yaw,s.y,s);}}
   if(pursuit.phase==='patrol'){clear();return;}
   if(pursuit.phase==='chase'&&pursuit.heat>=2&&pursuit.unseenFor<2&&cooldown<=0){cooldown=trySpawn(player,pursuit.heat,others)?Math.max(30,60-pursuit.heat*5):4;}
  }
  function clear(){for(const b of [...blocks])remove(b);}
  return {blocks,actors,trySpawn,update,clear,stats:()=>({active:blocks.length,spawned}),pose(){for(const b of blocks)for(const c of b.cars){const s=c.state;world.pose(c.model,s.x,s.z,s.yaw,s.y,s);}},dispose(){if(disposed)return;clear();disposed=true;}};
 }
 const api={layout,create};if(node)module.exports=api;else root.BlacklineRoadblocks=api;
})(typeof window==='object'?window:globalThis);
