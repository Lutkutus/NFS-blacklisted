(function(root){
  'use strict';
  function garage(data,id){return data.garages.find(g=>g.id===id&&g.available)||data.garages.find(g=>g.available);}
  function project(bounds,p){return {x:(p.x-bounds.minX)/(bounds.maxX-bounds.minX),y:(p.z-bounds.minZ)/(bounds.maxZ-bounds.minZ)};}
  function unproject(bounds,p){return {x:bounds.minX+p.x*(bounds.maxX-bounds.minX),z:bounds.minZ+p.y*(bounds.maxZ-bounds.minZ)};}
  function minimap(p,origin,scale=.4,heading){const x=(p.x-origin.x)*scale,z=(p.z-origin.z)*scale;if(heading===undefined)return [110+x,90+z];const c=Math.cos(heading),s=Math.sin(heading);return [110-x*c+z*s,90-x*s-z*c];}
  function travelAllowed(mode,race,phase){return !race&&['menu','race','paused'].includes(mode)&&(mode==='menu'||phase==='patrol');}
  function travelPose(nav,target,N,cells,P,box){
    if(target.available===false||!['x','y','z'].every(k=>Number.isFinite(target[k])))return null;
    const approach=target.approach?{...target,...target.approach}:target;
    const near=nav.connected.map(i=>nav.nodes[i]).filter(p=>Math.hypot(p[0]-approach.x,p[2]-approach.z)<70&&Math.abs(p[1]-approach.y)<6).sort((a,b)=>Math.hypot(a[0]-approach.x,a[2]-approach.z)-Math.hypot(b[0]-approach.x,b[2]-approach.z));
    for(const p of [{...approach},...near.map(p=>({x:p[0],y:p[1],z:p[2]}))]){
      const s=P.surface(cells,p.x,p.z,p.y,1.2,1.2);if(!s?.road)continue;
      for(const yaw of [approach.yaw||0,...Array.from({length:8},(_,i)=>i*Math.PI/4)]){
        let supported=true;
        for(const side of [-box.width/2,box.width/2])for(const f of [-box.length/2,0,box.length/2]){
          const x=p.x+Math.cos(yaw)*side+Math.sin(yaw)*f,z=p.z-Math.sin(yaw)*side+Math.cos(yaw)*f,reference=s.y+s.dx*(x-p.x)+s.dz*(z-p.z),h=P.surface(cells,x,z,reference,.35,.35);
          if(!h?.road)supported=false;
        }
        const pose={x:p.x,y:s.y,z:p.z,yaw,pitch:Math.atan(s.dx*Math.sin(yaw)+s.dz*Math.cos(yaw)),roll:Math.atan(s.dx*Math.cos(yaw)-s.dz*Math.sin(yaw))};
        if(supported&&!P.boxHit(cells,pose,box))return {x:p.x,y:s.y,z:p.z,yaw};
      }
    }
    return null;
  }
  function directions(nav,start,target,N){
    if(target.available===false)return {error:target.reason||'This destination is closed.'};
    const approach=target.approach?{...target,...target.approach}:target,a=N.nearest(nav,start),b=N.nearest(nav,approach);
    if(a<0||b<0)return {error:'No drivable road connection was found.'};
    const near=(p,i)=>Math.hypot(p.x-nav.nodes[i][0],p.z-nav.nodes[i][2])<100&&(p.y==null||Math.abs(p.y-nav.nodes[i][1])<6);
    if(!near(start,a)||!near(approach,b))return {error:'There is no continuous road connection to this destination.'};
    const ids=N.path(nav,a,b);
    if(!ids.length)return {error:'There is no continuous road connection to this destination.'};
    return {route:N.route(ids.map(i=>nav.nodes[i]),{closed:false}),target};
  }
  const api={garage,project,unproject,minimap,travelAllowed,travelPose,directions};
  if(typeof module==='object')module.exports=api;else root.BlacklineWorldMap=api;
})(typeof window==='object'?window:globalThis);
