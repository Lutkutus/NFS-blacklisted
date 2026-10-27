(function(root){
 'use strict';
 const GRID=24,key=(x,z)=>`${Math.floor(x/GRID)},${Math.floor(z/GRID)}`;
 // Include the adjacent bin only within the same centimetre seam tolerance
 // used by height(). Otherwise a quantized triangle can vanish at a bin edge.
 function candidates(c,x,z){const x0=Math.floor((x-.035)/GRID),x1=Math.floor((x+.035)/GRID),z0=Math.floor((z-.035)/GRID),z1=Math.floor((z+.035)/GRID);if(x0===x1&&z0===z1)return c.bins.get(key(x,z))||[];const ids=new Set();for(let a=x0;a<=x1;a++)for(let b=z0;b<=z1;b++)for(const i of c.bins.get(`${a},${b}`)||[])ids.add(i);return ids;}
 function cell(data){
  const bins=new Map();
  for(let i=0;i<data.length;i+=10){const x0=Math.floor(Math.min(data[i],data[i+3],data[i+6])/GRID),x1=Math.floor(Math.max(data[i],data[i+3],data[i+6])/GRID),z0=Math.floor(Math.min(data[i+2],data[i+5],data[i+8])/GRID),z1=Math.floor(Math.max(data[i+2],data[i+5],data[i+8])/GRID);for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){const k=`${x},${z}`;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(i)}}
  return {data,bins};
 }
 function height(t,i,x,z){const ax=t[i],az=t[i+2],bx=t[i+3],bz=t[i+5],cx=t[i+6],cz=t[i+8],den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-8)return null;const a=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,b=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den,c=1-a-b;
  // Quantized neighbouring cells can differ by centimetres. Use a world-space
  // seam tolerance, not a barycentric epsilon that grows with triangle size.
  const tolerance=.035/Math.abs(den);
  return a>=-tolerance*Math.hypot(bx-cx,bz-cz)&&b>=-tolerance*Math.hypot(cx-ax,cz-az)&&c>=-tolerance*Math.hypot(ax-bx,az-bz)?a*t[i+1]+b*t[i+4]+c*t[i+7]:null}
 function surfaceInfo(t,i,y){const ax=t[i+3]-t[i],ay=t[i+4]-t[i+1],az=t[i+5]-t[i+2],bx=t[i+6]-t[i],by=t[i+7]-t[i+1],bz=t[i+8]-t[i+2],ny=az*bx-ax*bz;return {y,road:t[i+9]===3,dx:-(ay*bz-az*by)/ny,dz:-(ax*by-ay*bx)/ny};}
 function surface(cells,x,z,reference=0,rise=1.1,drop=4){let best=null;for(const c of cells)for(const i of candidates(c,x,z)){if(!(c.data[i+9]&1))continue;const y=height(c.data,i,x,z);if(y===null||y>reference+rise||y<reference-drop)continue;if(!best||Math.abs(y-reference)<Math.abs(best.y-reference))best=surfaceInfo(c.data,i,y)}return best}
 // A small walkable step can overlap the road underneath it. Select its top
 // explicitly; normal surface() still preserves bridge-level selection.
 function stepSurface(cells,x,z,reference,maxRise=.26){let best=null;for(const c of cells)for(const i of candidates(c,x,z)){if(!(c.data[i+9]&1))continue;const y=height(c.data,i,x,z);if(y!==null&&y>reference+.035&&y<=reference+maxRise&&(!best||y>best.y))best={y,road:c.data[i+9]===3}}return best}
 function rayTriangle(t,i,o,d){const e1=[t[i+3]-t[i],t[i+4]-t[i+1],t[i+5]-t[i+2]],e2=[t[i+6]-t[i],t[i+7]-t[i+1],t[i+8]-t[i+2]],p=[d[1]*e2[2]-d[2]*e2[1],d[2]*e2[0]-d[0]*e2[2],d[0]*e2[1]-d[1]*e2[0]],det=e1[0]*p[0]+e1[1]*p[1]+e1[2]*p[2];if(Math.abs(det)<1e-8)return null;const v=[o[0]-t[i],o[1]-t[i+1],o[2]-t[i+2]],u=(v[0]*p[0]+v[1]*p[1]+v[2]*p[2])/det;if(u<0||u>1)return null;const q=[v[1]*e1[2]-v[2]*e1[1],v[2]*e1[0]-v[0]*e1[2],v[0]*e1[1]-v[1]*e1[0]],w=(d[0]*q[0]+d[1]*q[1]+d[2]*q[2])/det;if(w<0||u+w>1)return null;const f=(e2[0]*q[0]+e2[1]*q[1]+e2[2]*q[2])/det;return f>=0&&f<=1?f:null}
 function blocked(cells,a,b){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<1e-6)return false;const nx=-dz/len,nz=dx/len;
  for(const c of cells){const ids=new Set();for(let x=Math.floor((Math.min(a.x,b.x)-2)/GRID);x<=Math.floor((Math.max(a.x,b.x)+2)/GRID);x++)for(let z=Math.floor((Math.min(a.z,b.z)-2)/GRID);z<=Math.floor((Math.max(a.z,b.z)+2)/GRID);z++)for(const i of c.bins.get(`${x},${z}`)||[])if(c.data[i+9]===2)ids.add(i);
   for(const i of ids)for(const offset of [-.85,0,.85])for(const h of [.2,.45,1.05])if(rayTriangle(c.data,i,[a.x+nx*offset,a.y+h,a.z+nz*offset],[dx+dx/len*1.3,b.y-a.y,dz+dz/len*1.3])!==null)return true;
  }return false;
 }
 function move(cells,car,previous){const n=Math.max(1,Math.ceil(Math.hypot(car.x-previous.x,car.z-previous.z)/.7)),end={x:car.x,z:car.z};let a={...previous,y:Number.isFinite(previous.y)?previous.y:car.y};let hit=false;
  for(let j=1;j<=n;j++){const x=previous.x+(end.x-previous.x)*j/n,z=previous.z+(end.z-previous.z)*j/n,s=surface(cells,x,z,a.y,1.0,2.5);if(!s){hit=true;break}const b={x,y:s.y,z};if(blocked(cells,a,b)){hit=true;break}a=b}
  car.x=a.x;car.z=a.z;car.y=a.y;if(hit){car.speed*=.15;car.vx=0;car.vz=0}return hit;
 }
 function clipCamera(cells,origin,target){const d=[target.x-origin.x,target.y-origin.y,target.z-origin.z];let fraction=1;for(const c of cells){const ids=new Set();for(let x=Math.floor(Math.min(origin.x,target.x)/GRID);x<=Math.floor(Math.max(origin.x,target.x)/GRID);x++)for(let z=Math.floor(Math.min(origin.z,target.z)/GRID);z<=Math.floor(Math.max(origin.z,target.z)/GRID);z++)for(const i of c.bins.get(`${x},${z}`)||[])ids.add(i);for(const i of ids){if(!c.data[i+9])continue;const f=rayTriangle(c.data,i,[origin.x,origin.y,origin.z],d);if(f!==null&&f>.02)fraction=Math.min(fraction,f)}}if(fraction<1)fraction=Math.max(.05,fraction-.2/Math.max(1,Math.hypot(...d)));return {x:origin.x+d[0]*fraction,y:origin.y+d[1]*fraction,z:origin.z+d[2]*fraction}}
 // Chassis OBB against the actual structural triangles. Broad phase uses the
 // existing cell bins; SAT checks the box axes, triangle normal and edge axes.
 function triangleBox(t,i,p,box){
  const c=Math.cos(p.yaw||0),s=Math.sin(p.yaw||0),cp=Math.cos(p.pitch||0),sp=Math.sin(p.pitch||0),cr=Math.cos(p.roll||0),sr=Math.sin(p.roll||0),half=[box.width/2,box.height/2,box.length/2],cy=(box.bottom??.18)+half[1],v=[];
  for(let j=0;j<9;j+=3){const dx=t[i+j]-p.x,dy=t[i+j+1]-p.y,dz=t[i+j+2]-p.z,x=dx*c-dz*s,z=dx*s+dz*c,y=dy*cp-z*sp;v.push([x*cr+y*sr,-x*sr+y*cr-cy,dy*sp+z*cp])}
  const sub=(a,b)=>a.map((n,k)=>n-b[k]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],edges=[sub(v[1],v[0]),sub(v[2],v[1]),sub(v[0],v[2])],axes=[[1,0,0],[0,1,0],[0,0,1],cross(edges[0],edges[1])];
  for(const e of edges)for(const a of [[1,0,0],[0,1,0],[0,0,1]])axes.push(cross(e,a));
  for(const a of axes){if(a.every(n=>Math.abs(n)<1e-10))continue;const dots=v.map(q=>q[0]*a[0]+q[1]*a[1]+q[2]*a[2]),r=half.reduce((n,h,k)=>n+h*Math.abs(a[k]),0);if(Math.min(...dots)>r+1e-6||Math.max(...dots)<-r-1e-6)return false}
  return true;
 }
 // A long kerb triangle may climb several metres with the hillside. Its
 // distant highest vertex does not describe the step at this contact point.
 function localTop(t,i,x,z,nx,nz){const u=-nz*x+nx*z,vertices=[0,3,6].map(j=>({u:-nz*t[i+j]+nx*t[i+j+2],y:t[i+j+1]})),heights=[];for(let j=0;j<3;j++){const a=vertices[j],b=vertices[(j+1)%3];if(Math.abs(a.u-b.u)<1e-7){if(Math.abs(u-a.u)<.04)heights.push(a.y,b.y);continue}const f=(u-a.u)/(b.u-a.u);if(f>=-.001&&f<=1.001)heights.push(a.y+(b.y-a.y)*Math.max(0,Math.min(1,f)))}return heights.length?Math.max(...heights):Math.max(t[i+1],t[i+4],t[i+7]);}
 function boxHit(cells,p,box){
  const radius=Math.hypot(box.width,box.length,box.height)/2+.2;
  for(const c of cells){const ids=new Set();for(let x=Math.floor((p.x-radius)/GRID);x<=Math.floor((p.x+radius)/GRID);x++)for(let z=Math.floor((p.z-radius)/GRID);z<=Math.floor((p.z+radius)/GRID);z++)for(const i of c.bins.get(`${x},${z}`)||[])if(c.data[i+9]===2)ids.add(i);
   for(const i of ids){const t=c.data;if(Math.min(t[i],t[i+3],t[i+6])>p.x+radius||Math.max(t[i],t[i+3],t[i+6])<p.x-radius||Math.min(t[i+2],t[i+5],t[i+8])>p.z+radius||Math.max(t[i+2],t[i+5],t[i+8])<p.z-radius||Math.min(t[i+1],t[i+4],t[i+7])>p.y+box.height+radius*.5||Math.max(t[i+1],t[i+4],t[i+7])<p.y-radius*.5)continue;if(triangleBox(c.data,i,p,box)){
    const t=c.data,ax=t[i+3]-t[i],ay=t[i+4]-t[i+1],az=t[i+5]-t[i+2],bx=t[i+6]-t[i],by=t[i+7]-t[i+1],bz=t[i+8]-t[i+2],nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx,len=Math.hypot(nx,nz);
    if(len<1e-8)continue;
    const signed=(nx*(p.x-t[i])+ny*(p.y+(box.bottom??.18)+box.height/2-t[i+1])+nz*(p.z-t[i+2]))/len,side=signed>=0?1:-1;
    const x=p.x-nx/len*signed,z=p.z-nz/len*signed;return {nx:nx/len*side,nz:nz/len*side,x,z,minY:Math.min(t[i+1],t[i+4],t[i+7]),maxY:Math.max(t[i+1],t[i+4],t[i+7]),localMaxY:localTop(t,i,x,z,nx/len,nz/len)};
   }}
  }return null;
 }
 function sweepBox(cells,car,previous){
  const box=car.box||{width:1.8,length:4.5,height:1.1,bottom:.18},yawDelta=Math.atan2(Math.sin(car.yaw-previous.yaw),Math.cos(car.yaw-previous.yaw));
  const n=Math.max(1,Math.ceil(Math.hypot(car.x-previous.x,car.z-previous.z)/.25),Math.ceil(Math.abs(car.y-previous.y)/.15),Math.ceil(Math.abs(yawDelta)/.04)),end={x:car.x,y:car.y,z:car.z,yaw:car.yaw};let safe={...previous};
  for(let j=1;j<=n;j++){const f=j/n,p={x:previous.x+(end.x-previous.x)*f,y:previous.y+(end.y-previous.y)*f,z:previous.z+(end.z-previous.z)*f,yaw:previous.yaw+yawDelta*f,pitch:(previous.pitch||0)+((car.pitch||0)-(previous.pitch||0))*f,roll:(previous.roll||0)+((car.roll||0)-(previous.roll||0))*f},hit=boxHit(cells,p,box);
   if(hit){Object.assign(car,{x:safe.x,y:safe.y,z:safe.z,yaw:safe.yaw,pitch:safe.pitch||0,roll:safe.roll||0});return {...hit,fraction:(j-1)/n}}safe=p;
  }return null;
 }
 const api={cell,height,surface,stepSurface,blocked,move,clipCamera,triangleBox,boxHit,sweepBox};if(typeof module==='object')module.exports=api;else root.RockportPhysics=api;
})(typeof window==='object'?window:globalThis);


