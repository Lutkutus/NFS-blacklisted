/* Surface fitting shared by the game and the geometry audit. Coordinates are body-local metres. */
window.BlacklineWorkshop=(()=>{
 const T=THREE,library=window.BLACKLINE_WORKSHOP||{},cache=new Map();
 const fields={splitter:'splitter',skirts:'skirts',diffuser:'diffuser',wing:'wingStyle',canards:'canards',hood:'hoodVent',spats:'spats',arches:'arches'};
 function options(family){return Object.fromEntries(Object.entries(library).filter(([,p])=>p.family===family).map(([id,p])=>[id,p.name]));}
 function surface(body,d,id){
  if(cache.has(id))return cache.get(id);
  body.updateMatrixWorld(true);
  const meshes=body.children.filter(m=>m.isMesh),box=new T.Box3();for(const m of meshes)box.union(new T.Box3().setFromObject(m));box.translate(new T.Vector3(0,-body.position.y,0));
  const ray=new T.Raycaster(),memo=new Map(),width=box.max.x-box.min.x,length=box.max.z-box.min.z;
  const wheels=Object.values(d.wheels),front=wheels.filter(w=>w.center[2]>0),rear=wheels.filter(w=>w.center[2]<0);
  const frontAxle=front.reduce((n,w)=>n+w.center[2],0)/front.length,rearAxle=rear.reduce((n,w)=>n+w.center[2],0)/rear.length;
  const low=Math.max(.12,Math.min(...wheels.map(w=>w.center[1]-w.radius))+.19);
  function hit(axis,a,b,sign=1){
   const key=[axis,a.toFixed(3),b.toFixed(3),sign].join(':');if(memo.has(key))return memo.get(key);
   const origin=axis==='y'?new T.Vector3(a,box.max.y+1,b):axis==='x'?new T.Vector3(sign*(width+1),a,b):new T.Vector3(a,b,sign*(length+1));
   origin.y+=body.position.y;const direction=new T.Vector3();direction[axis]=-sign;ray.set(origin,direction);
   const h=ray.intersectObjects(meshes,false)[0],value=h?(axis==='y'?h.point.y-body.position.y:h.point[axis]):null;memo.set(key,value);return value;
  }
  function sample(axis,a,b,sign=1){
   let value=hit(axis,a,b,sign);if(value!==null)return value;
   // Scan nearby actual surfaces when a low polygon bumper has an opening.
   for(const delta of [.025,-.025,.06,-.06,.12,-.12,.2]){value=hit(axis,axis==='y'?a:a+delta,axis==='y'?b+delta:b,sign);if(value!==null)return value;}
   throw Error(`Could not find the part mounting surface: ${id} / ${axis} ${a.toFixed(2)} ${b.toFixed(2)}`);
  }
  // Nearest points resolve genuine openings and tapered bumper ends without inventing a surface.
  let triangles;
  function contact(axis,a,b,sign=1){
   const value=hit(axis,a,b,sign);if(value!==null&&(axis!=='x'||value*sign>width*.2))return axis==='x'?new T.Vector3(value,a,b):new T.Vector3(a,b,value);
   const key=['contact',axis,a.toFixed(3),b.toFixed(3),sign].join(':');if(memo.has(key))return memo.get(key).clone();
   if(!triangles){triangles=[];for(const m of meshes){const p=m.geometry.attributes.position,index=m.geometry.index;for(let i=0;i<(index?.count||p.count);i+=3){const vertices=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j));triangles.push(new T.Triangle(...vertices));}}}
   const target=axis==='x'?new T.Vector3(sign*width/2,a,b):new T.Vector3(a,b,sign*length/2),point=new T.Vector3();let best,distance=Infinity;
   for(const tri of triangles){const center=tri.getMidpoint(new T.Vector3());if(axis==='x'&&center.x*sign<width*.25)continue;if(axis==='z'&&center.z*sign<(sign>0?frontAxle:-rearAxle)+.15)continue;tri.closestPointToPoint(target,point);const dist=point.distanceToSquared(target);if(dist<distance){distance=dist;best=point.clone();}}
   if(!best)throw Error('Missing attachment surface '+id);memo.set(key,best);return best.clone();
  }
  function nearest(v){
   if(!triangles)contact('x',low,0,1);
   // contact may hit directly, so initialize the triangle snapshot explicitly.
   if(!triangles){triangles=[];for(const m of meshes){const p=m.geometry.attributes.position,index=m.geometry.index;for(let i=0;i<(index?.count||p.count);i+=3)triangles.push(new T.Triangle(...[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j))));}}
   const point=new T.Vector3();let best,distance=Infinity;
   for(const tri of triangles){if(tri.getArea()<1e-10)continue;tri.closestPointToPoint(v,point);const d=point.distanceToSquared(v);if(Number.isFinite(d)&&d<distance){distance=d;best=point.clone();}}
   return best;
  }
  const result={box,width,length,frontAxle,rearAxle,front,rear,low,sample,contact,nearest,sideHit(y,z,sign){const x=hit('x',y,z,sign);return x!==null&&x*sign>width*.2?x:null;}};cache.set(id,result);return result;
 }
 function add(body,d,c){
  const selected=Object.entries(fields).map(([family,key])=>[family,c[key]]).filter(([,id])=>library[id]);if(!selected.length)return [];
  const s=surface(body,d,c.vehicle),root=new T.Group();root.name='workshop-parts';body.add(root);const reports=[];
  const colors={carbon:0x282c28,graphite:0x383d36,aluminium:0xaaa99a,anodized:0x252923,titanium:0x999785,rubber:0x171a17,billet:0x9c8a62};
  function mat(name){const key=name.toLowerCase(),color=/carbon/.test(key)?colors.carbon:/alum/.test(key)?colors.aluminium:/titan/.test(key)?colors.titanium:/rubber/.test(key)?colors.rubber:/billet/.test(key)?colors.billet:/anod/.test(key)?colors.anodized:colors.graphite;return BlacklinePSX.material(new T.MeshLambertMaterial({color,flatShading:true,side:T.DoubleSide}));}
  // Interpolated contact grids keep the fit continuous without casting a ray per bolt vertex.
  function grid(a0,a1,b0,b1,fn,n=12){const rows=[];for(let j=0;j<=n;j++){const row=[];for(let i=0;i<=n;i++)row.push(fn(a0+(a1-a0)*i/n,b0+(b1-b0)*j/n));rows.push(row);}return (a,b)=>{let u=T.MathUtils.clamp((a-a0)/(a1-a0),0,1)*n,v=T.MathUtils.clamp((b-b0)/(b1-b0),0,1)*n;const i=Math.min(n-1,Math.floor(u)),j=Math.min(n-1,Math.floor(v));u-=i;v-=j;return T.MathUtils.lerp(T.MathUtils.lerp(rows[j][i],rows[j][i+1],u),T.MathUtils.lerp(rows[j+1][i],rows[j+1][i+1],u),v);};}
  for(const [family,id] of selected){
   const entry=library[id],group=new T.Group();group.name=id;root.add(group);
   const all=entry.parts.flatMap(p=>Array.from(p.position)),bounds=new T.Box3();for(let i=0;i<all.length;i+=3)bounds.expandByPoint(new T.Vector3(all[i],all[i+1],all[i+2]));
   const sourceWidth=bounds.max.x-bounds.min.x,span=s.width*(family==='wing'?.89:family==='hood'?.56:.95),sx=span/sourceWidth;
   let transform,contacts=[];
   if(family==='wing'||family==='hood'){
    const z=family==='wing'?s.box.min.z+s.length*.13:s.frontAxle+.16;
    const scale=family==='wing'?sx:Math.min(sx,1),z0=bounds.min.z*scale+z,z1=bounds.max.z*scale+z;
    const fit=family==='wing'?grid(-span*.30,span*.30,z-.1*scale,z+.08*scale,(x,z)=>s.sample('y',x,z)):grid(bounds.min.x*scale,bounds.max.x*scale,z0,z1,(x,z)=>s.sample('y',x,z));
    const plane=family==='wing'?(fit(-span*.25,z)+fit(span*.25,z))/2:0;
    transform=(x,y,zz)=>[x*scale,(family==='wing'?T.MathUtils.lerp(fit(x*scale,zz*scale+z),plane,T.MathUtils.clamp(y/.12,0,1)):fit(x*scale,zz*scale+z))+y*scale-.008,zz*scale+z];
    contacts=entry.anchors.map(a=>{const [x,y,zz]=a.position;return {source:a.name,point:transform(x,0,zz),axis:'y'};});
   }else if(family==='splitter'||family==='diffuser'){
    const sign=family==='splitter'?1:-1,y=s.low+(family==='diffuser'?.025:0),depth=family==='splitter'?.21:.28;
    const contact=x=>s.contact('z',x,y,sign);
    const fits=['x','y','z'].map(axis=>grid(-span/2,span/2,0,1,x=>contact(x)[axis],24));
    const anchorZ=family==='splitter'?Math.max(bounds.min.z,-.18):.24;
    transform=(x,yy,z)=>{const xx=x*sx;return [fits[0](xx,0),fits[1](xx,0)+yy,fits[2](xx,0)+(z-anchorZ)*Math.min(sx,1)*depth/(family==='splitter'?.45:.7)-sign*.018];};
    contacts=entry.anchors.map(a=>({source:a.name,point:transform(a.position[0],0,anchorZ),axis:'z'}));
   }else if(family==='skirts'||family==='canards'||family==='spats'){
    const rearEnd=Math.max(...s.rear.map(w=>w.center[2]+w.radius+.055)),frontEnd=Math.min(...s.front.map(w=>w.center[2]-w.radius-.055));
    const center=family==='skirts'?(frontEnd+rearEnd)/2:family==='canards'?s.box.max.z-.32:s.box.min.z+.27;
    const zscale=family==='skirts'?Math.max(.2,frontEnd-rearEnd)/2.05:Math.min(1,s.width/1.9),y=s.low+(family==='canards'?.19:0);
    const origin=family==='skirts'?.92:family==='canards'?.88:.85;
    const base=family==='canards'?.02:.06;
    const fits=Object.fromEntries([-1,1].map(sign=>[sign,['x','y','z'].map(axis=>grid(center+bounds.min.z*zscale,center+bounds.max.z*zscale,0,1,z=>s.contact('x',y+base,z,sign)[axis],24))]));
    transform=(x,yy,z,side)=>{const sign=side||Math.sign(x),zz=center+z*zscale,fit=fits[sign];return [fit[0](zz,0)+(x-sign*origin)*Math.min(1,s.width/1.9)-sign*.012,fit[1](zz,0)+yy-base,fit[2](zz,0)];};
    contacts=entry.anchors.map(a=>({source:a.name,point:transform(...a.position,Math.sign(a.position[0])),axis:'x'}));
   }else if(family==='arches'){
    // The source contains a left/right pair; repeat it at both actual axles.
    // Sample both edges of the band: the outer flange follows the body taper,
    // while only the lip over the tire widens with wheel offset.
    if(!s.archCurves){s.archCurves=new Map();for(const w of Object.values(d.wheels)){
     const sign=Math.sign(w.center[0]),band=T.MathUtils.clamp(w.radius*.27,.075,.11),steps=64;
     // Trace the near-side opening independently at every wheel, rather than
     // forcing the same circle onto square, stretched and tapered fenders.
     const raw=Array.from({length:steps+1},(_,i)=>{const a=i/steps*Math.PI;for(let radius=w.radius+.012;radius<=w.radius+.25;radius+=.018){if(s.sideHit(w.center[1]+Math.sin(a)*radius,w.center[2]+Math.cos(a)*radius,sign)!==null)return radius+.008;}return w.radius+.08;});
     const opening=raw.map((r,i)=>{const near=[raw[Math.max(0,i-1)],r,raw[Math.min(steps,i+1)]].sort((a,b)=>a-b);return near[1];});
     const edges=[0,.25,.5,.75,1].map(outer=>opening.map((radius,i)=>{const a=i/steps*Math.PI,r=radius+outer*band,y=w.center[1]+Math.sin(a)*r,z=w.center[2]+Math.cos(a)*r;return new T.Vector3(s.contact('x',y,z,sign).x,y,z);}));
     s.archCurves.set(w,{edges,opening,band,steps});
    }}
    // Keep the original shell thickness. Collapsing its two faces at the
    // mounting flange made the body cut through it, especially on the Tiburon.
    const backs=new Map();for(const sign of [-1,1]){const source=entry.parts.find(p=>p.side===sign),bins=Array(65).fill(Infinity);for(let i=0;i<source.position.length;i+=3){const x=source.position[i],y=source.position[i+1],z=source.position[i+2],r=Math.hypot(y,z);if(r<.48||r>.66)continue;const at=Math.round(Math.atan2(Math.max(0,y),z)/Math.PI*64);bins[at]=Math.min(bins[at],Math.abs(x));}const known=bins.map((x,i)=>Number.isFinite(x)?i:-1).filter(i=>i>=0);backs.set(sign,bins.map((x,i)=>Number.isFinite(x)?x:bins[known.reduce((best,k)=>Math.abs(k-i)<Math.abs(best-i)?k:best,known[0])]));}
    function backAt(angle,sign){const u=angle/Math.PI*64,i=Math.min(63,Math.floor(u)),back=backs.get(sign);return T.MathUtils.lerp(back[i],back[i+1],u-i);}
    transform=(x,y,z,side,w)=>{const sign=side||Math.sign(x),scale=(w.radius+.09)/.5,radius=Math.hypot(y,z),angle=Math.atan2(Math.max(0,y),z),fit=s.archCurves.get(w),u=angle/Math.PI*fit.steps,i=Math.min(fit.steps-1,Math.floor(u)),t=T.MathUtils.clamp((radius-.5)/.14,0,1),v=t*4,j=Math.min(3,Math.floor(v)),edges=[fit.edges[j],fit.edges[j+1]].map(points=>points[i].clone().lerp(points[i+1],u-i)),point=edges[0].lerp(edges[1],v-j),extra=(radius-(.5+t*.14))*fit.band/.14;
     const thickness=T.MathUtils.clamp(Math.abs(x)-backAt(angle,sign),0,.05)*scale,samples=fit.edges.map(points=>T.MathUtils.lerp(points[i].x,points[i+1].x,u-i)*sign),outer=samples[4]+.003,lip=Math.max(...samples)+.035+T.MathUtils.clamp(Number(c.offset)||0,0,.18),skin=Math.max(point.x*sign+.003,T.MathUtils.lerp(lip,outer,t));
     return [(skin+thickness)*sign,point.y+Math.sin(angle)*extra,point.z+Math.cos(angle)*extra];};
    for(const w of Object.values(d.wheels))for(const i of [4,12,20,28,36,44,52,60]){const sign=Math.sign(w.center[0]),fit=s.archCurves.get(w),a=i/fit.steps*Math.PI,edge=fit.edges[4][i];if(s.sideHit(edge.y,edge.z,sign)===null)continue;contacts.push({source:'wheel_arch_body_flange',point:transform(sign*backAt(a,sign),Math.sin(a)*.64,Math.cos(a)*.64,sign,w),axis:'x'});}
   }
   // Correct each actual mounting neighbourhood after interpolation. This keeps
   // brackets seated even across a sharp boot-lid crease or a split bumper.
   const corrections=family==='arches'?[]:contacts.map(c=>{const from=new T.Vector3(...c.point),to=s.nearest(from);if(!to)throw Error('Missing mount '+id);if(c.axis==='y')to.y-=.004;else to[c.axis]-=Math.sign(to[c.axis])*.004;return {from,delta:to.clone().sub(from),to};});
   function seated(v){let nearest,dist=Infinity;for(const fix of corrections){const d=fix.from.distanceToSquared(v);if(d<dist){dist=d;nearest=fix;}}if(nearest&&dist<.09)v.addScaledVector(nearest.delta,(1-Math.sqrt(dist)/.3)**2);return v;}
   contacts=contacts.map((c,i)=>({...c,point:seated(new T.Vector3(...c.point)).toArray()}));
   for(const p of entry.parts){
    const wheelTargets=family==='arches'?Object.values(d.wheels).filter(w=>Math.sign(w.center[0])===p.side):[null];
    for(const w of wheelTargets){
     const a=new Float32Array(p.position.length);for(let i=0;i<a.length;i+=3)a.set(seated(new T.Vector3(...transform(p.position[i],p.position[i+1],p.position[i+2],p.side,w))).toArray(),i);
     const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(a,3));geo.setAttribute('uv',new T.BufferAttribute(p.uv,2));geo.setIndex(new T.BufferAttribute(p.index,1));geo.computeVertexNormals();const mesh=new T.Mesh(geo,mat(p.material));mesh.name=id+'/'+p.material;mesh.userData.placementSide=p.side;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
    }
   }
   group.userData={family,contacts};if(family==='arches')group.userData.archFit=Object.values(d.wheels).map(w=>({center:[...w.center],radius:w.radius,opening:[...s.archCurves.get(w).opening],band:s.archCurves.get(w).band}));reports.push({id,family,contacts});
  }
  return reports;
 }
 return {add,options,fields};
})();
