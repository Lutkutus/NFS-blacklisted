(function(root){
 class Heap{constructor(){this.a=[]}push(v){let i=this.a.push(v)-1;while(i){const p=(i-1)>>1;if(this.a[p][0]<=v[0])break;this.a[i]=this.a[p];i=p}this.a[i]=v}pop(){const r=this.a[0],v=this.a.pop();if(this.a.length){let i=0;while(i*2+1<this.a.length){let c=i*2+1;if(c+1<this.a.length&&this.a[c+1][0]<this.a[c][0])c++;if(this.a[c][0]>=v[0])break;this.a[i]=this.a[c];i=c}this.a[i]=v}return r}}
 function nearest(nav,p,ids=nav.connected){let best=-1,d=Infinity;for(const i of ids){const n=nav.nodes[i],dd=(n[0]-p.x)**2+(n[2]-p.z)**2+(n[1]-(p.y??n[1]))**2*16;if(dd<d){d=dd;best=i}}return best}
 const edge=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
 function path(nav,start,end,blocked=new Set(nav.blocked||[])){if(start===end)return [start];const score=new Float64Array(nav.nodes.length);score.fill(Infinity);score[start]=0;const prev=new Int32Array(nav.nodes.length);prev.fill(-1);const h=new Heap(),target=nav.nodes[end],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);h.push([0,start]);while(h.a.length){const [,i]=h.pop();if(i===end){const r=[end];while(r.at(-1)!==start)r.push(prev[r.at(-1)]);return r.reverse()}for(const j of nav.edges[i]){if(blocked.has(edge(i,j)))continue;const g=score[i]+dist(nav.nodes[i],nav.nodes[j]);if(g>=score[j])continue;score[j]=g;prev[j]=i;h.push([g+dist(nav.nodes[j],target),j])}}return []}
 function route(points,options={}){const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][2]-points[i-1][2]));return {points,distances,length:distances.at(-1),...options}}
 function sample(r,d){d=r.closed===false?Math.max(0,Math.min(r.length,d)):((d%r.length)+r.length)%r.length;let lo=0,hi=r.distances.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(r.distances[m]<=d)lo=m;else hi=m}const a=r.points[lo],b=r.points[lo+1],t=(d-r.distances[lo])/Math.max(.0001,r.distances[lo+1]-r.distances[lo]);return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,z:a[2]+(b[2]-a[2])*t,yaw:Math.atan2(b[0]-a[0],b[2]-a[2])}}
 function project(r,car,distance=0){
  let best=null;const lo=Math.max(0,distance-55),hi=Math.min(r.length,distance+80);
  for(let i=0;i<r.points.length-1;i++){
   if(r.distances[i+1]<lo||r.distances[i]>hi)continue;
   const a=r.points[i],b=r.points[i+1],dx=b[0]-a[0],dz=b[2]-a[2],len=dx*dx+dz*dz;
   const t=Math.max(0,Math.min(1,((car.x-a[0])*dx+(car.z-a[2])*dz)/Math.max(.0001,len))),y=a[1]+(b[1]-a[1])*t;
   if(Math.abs(car.y-y)>3)continue;
   const lateral=Math.hypot(car.x-a[0]-dx*t,car.z-a[2]-dz*t),along=r.distances[i]+Math.sqrt(len)*t;
   if(lateral<=15&&(!best||lateral<best.lateral))best={distance:along,lateral};
  }
  return best;
 }
 function checkpoints(r){
  const result=[];for(let d=700;d<r.length-300;d+=700){let best=d,score=Infinity;
   for(let offset=-140;offset<=140;offset+=10){const p=d+offset,a=sample(r,p-35),b=sample(r,p+35),near=sample(r,p+65),turn=Math.abs(Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))),approach=Math.abs(Math.atan2(Math.sin(near.yaw-a.yaw),Math.cos(near.yaw-a.yaw))),s=turn*120+approach*35+Math.abs(offset)*.04;if(s<score){score=s;best=p}}
   result.push(best);
  }result.push(r.length);return result;
 }
 function gate(r,d){const p=sample(r,d),a=sample(r,Math.max(0,d-12)),b=sample(r,Math.min(r.length,d+12));return {...p,yaw:Math.atan2(b.x-a.x,b.z-a.z),left:16,right:16,slope:0};}
 function measureGate(g,cells,P){
  const floor=P.surface(cells,g.x,g.z,g.y,1.5,1.5);if(!floor?.road)return g;
  const rx=Math.cos(g.yaw),rz=-Math.sin(g.yaw),slope=floor.dx*rx+floor.dz*rz,edges=[];
  for(const sign of [-1,1]){let edge=0,gap=0;for(let d=.75;d<=60;d+=.75){const h=P.surface(cells,g.x+rx*d*sign,g.z+rz*d*sign,floor.y+slope*d*sign,1.2,1.2);if(h&&Math.abs(h.y-floor.y-slope*d*sign)>1.2)break;if(h?.road){edge=d;gap=0}else if((gap+=.75)>9)break;}edges.push(edge+2);}
  return {...g,y:floor.y,left:Math.max(9,edges[0]),right:Math.max(9,edges[1]),slope,measured:true};
 }
 function raceProgress(r,car){
  let best=Infinity,distance=r.passed;for(let i=0;i<r.route.points.length-1;i++){
   if(r.route.distances[i+1]<r.passed||r.route.distances[i]>r.next)continue;
   const a=r.route.points[i],b=r.route.points[i+1],dx=b[0]-a[0],dz=b[2]-a[2],len=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((car.x-a[0])*dx+(car.z-a[2])*dz)/Math.max(.0001,len))),y=a[1]+(b[1]-a[1])*t;
   if(Math.abs(car.y-y)>6)continue;const error=(car.x-a[0]-dx*t)**2+(car.z-a[2]-dz*t)**2;
   if(error<best){best=error;distance=r.route.distances[i]+Math.sqrt(len)*t;}
  }return Math.max(r.passed,Math.min(r.next-.001,distance));
 }
 function advance(r,car,g=gate(r.route,r.next)){
  if(!Number.isFinite(r.next))return false;
  if(r.route.closed!==false){const g=sample(r.route,r.next);if(Math.hypot(car.x-g.x,car.z-g.z)>=9||Math.abs(car.y-g.y)>=3)return false;r.passed=r.next;return true}
  const previous=r.previous||sample(r.route,r.passed);r.previous={x:car.x,y:car.y,z:car.z};r.distance=raceProgress(r,car);
  // Only crossing the next ordered road-wide plane matters. The route line is
  // guidance, never an invisible corridor the player has to follow.
  if(Math.hypot(car.x-previous.x,car.z-previous.z)>60)return false;
  const fx=Math.sin(g.yaw),fz=Math.cos(g.yaw),rx=fz,rz=-fx;
  const before=(previous.x-g.x)*fx+(previous.z-g.z)*fz,after=(car.x-g.x)*fx+(car.z-g.z)*fz;
  if(before>1||after<-.05||after<=before||before>0&&after>1)return false;
  const t=Math.max(0,Math.min(1,-before/(after-before))),x=previous.x+(car.x-previous.x)*t-g.x,z=previous.z+(car.z-previous.z)*t-g.z,lateral=x*rx+z*rz,y=previous.y+(car.y-previous.y)*t;
  const height=y-g.y-g.slope*lateral;
  if(lateral< -g.left-1.5||lateral>g.right+1.5||height< -4||height>(car.grounded===false?12:4))return false;
  r.passed=r.next;r.distance=r.next;return true;
 }
 const api={nearest,path,edge,route,sample,advance,project,checkpoints,gate,measureGate,raceProgress};if(typeof module==='object')module.exports=api;else root.RockportNavigation=api;
})(typeof window==='object'?window:globalThis);
