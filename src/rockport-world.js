window.BlacklineRockport={async create({THREE,world,onProgress,spawn,onImpact}){
 // Public tunnels limit request bursts. Pace map assets without slowing local play.
 const remote=typeof location!=='undefined'&&/\.tunnl\.gg$/.test(location.hostname),assetQueue=[];let assetTimer=null,assetActive=0,assetNext=0;
 function pumpAssets(){clearTimeout(assetTimer);assetTimer=null;if(!assetQueue.length||assetActive>=4)return;
  const wait=Math.max(0,assetNext-performance.now());if(wait>1){assetTimer=setTimeout(pumpAssets,wait);return;}
  const job=assetQueue.shift();assetActive++;assetNext=performance.now()+Math.max(100,(window.BlacklineMultiplayer?.playersCount||1)*120);
  Promise.resolve().then(job.work).then(job.resolve,job.reject).finally(()=>{assetActive--;pumpAssets();});pumpAssets();
 }
 function asset(work){if(!remote)return work();return new Promise((resolve,reject)=>{assetQueue.push({work,resolve,reject});pumpAssets();});}
 const P=RockportPhysics,base='assets/rockport/',manifest=await fetch(base+'manifest.json').then(r=>{if(!r.ok)throw Error('Rockport data is missing');return r.json()}),loaded=new Map(),textures=new Map(),failed=new Map();let stopped=false,busy=false,latest={...(spawn||manifest.spawn)},interests=[],nextUpdate=0;
 const [nav,routes,propIndex]=await Promise.all(['navigation.json','routes.json','breakables.json'].map(f=>fetch(base+f).then(r=>{if(!r.ok)throw Error('Rockport routes are missing');return r.json()})));
 const effects=BlacklineImpactEffects.create(THREE,world,{onImpact}),breakables=BlacklineBreakables.create(THREE,world,{effects});
 const DT={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},SZ={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
 const distance=(c,x,z)=>Math.hypot(Math.max(c.bounds.min[0]-x,0,x-c.bounds.max[0]),Math.max(c.bounds.min[2]-z,0,z-c.bounds.max[2]));
 async function texture(url,sampler){const k=url+JSON.stringify(sampler);if(!textures.has(k))textures.set(k,asset(()=>new THREE.TextureLoader().loadAsync(url)).then(t=>{t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.flipY=false;t.wrapS=({33071:THREE.ClampToEdgeWrapping,33648:THREE.MirroredRepeatWrapping}[sampler.wrapS]||THREE.RepeatWrapping);t.wrapT=({33071:THREE.ClampToEdgeWrapping,33648:THREE.MirroredRepeatWrapping}[sampler.wrapT]||THREE.RepeatWrapping);return t}));return textures.get(k)}
 function attribute(d,bin,index){const a=d.accessors[index],v=d.bufferViews[a.bufferView],T=DT[a.componentType],size=SZ[a.type],offset=(v.byteOffset||0)+(a.byteOffset||0),stride=(v.byteStride||size*T.BYTES_PER_ELEMENT)/T.BYTES_PER_ELEMENT;let arr;if(stride===size)arr=new T(bin,offset,a.count*size);else{const src=new T(bin,offset,(a.count-1)*stride+size);arr=new T(a.count*size);for(let i=0;i<a.count;i++)for(let j=0;j<size;j++)arr[i*size+j]=src[i*stride+j]}return new THREE.BufferAttribute(arr,size,!!a.normalized)}
 async function get(url,type){const r=await asset(()=>fetch(url));if(!r.ok)throw Error('Could not load the map area');return type==='json'?r.json():r.arrayBuffer()}
 async function load(c){const d=await get(base+c.url,'json'),dir=base+'cells/',[bin,col]=await Promise.all([get(dir+d.buffers[0].uri),get(base+c.collision)]);const mats=await Promise.all(d.materials.map(async m=>{const p=m.pbrMetallicRoughness||{},ti=p.baseColorTexture?.index,t=ti===undefined?null:d.textures[ti],map=t?await texture(dir+d.images[t.source].uri,d.samplers[t.sampler]||{}):null;const material=new THREE.MeshBasicMaterial({map,color:new THREE.Color(...(p.baseColorFactor||[1,1,1]).slice(0,3)),side:m.doubleSided?THREE.DoubleSide:THREE.FrontSide,alphaTest:m.alphaMode==='MASK'?(m.alphaCutoff??.5):0,transparent:m.alphaMode==='BLEND',fog:true});return BlacklinePSX.material(material)}));
  const definitions=propIndex.cells.includes(c.id)?await get(base+'breakables/'+c.id+'.json','json'):[],meshes=[];const group=new THREE.Group();for(const n of d.nodes){if(n.mesh===undefined)continue;const node=new THREE.Group();node.position.fromArray(n.translation||[0,0,0]);node.scale.fromArray(n.scale||[1,1,1]);group.add(node);const nodeMeshes=[];meshes[d.nodes.indexOf(n)]=nodeMeshes;for(const p of d.meshes[n.mesh].primitives){const geo=new THREE.BufferGeometry();geo.setAttribute('position',attribute(d,bin,p.attributes.POSITION));if(p.attributes.TEXCOORD_0!==undefined)geo.setAttribute('uv',attribute(d,bin,p.attributes.TEXCOORD_0));geo.setIndex(attribute(d,bin,p.indices));geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,mats[p.material]);node.add(mesh);nodeMeshes.push(mesh)}}
  if(stopped){group.traverse(n=>n.geometry?.dispose());mats.forEach(m=>m.dispose());return}const data=new Float32Array(col);for(const p of definitions)for(const i of p.collision)data[i+9]=0;world.add(group);loaded.set(c.id,{group,physics:P.cell(data),props:breakables.attach(group,definitions,meshes),c});
 }
 function unload(item){breakables.detach(item.props);world.remove(item.group);item.group.traverse(n=>{n.geometry?.dispose();if(n.material)n.material.dispose()})}
 async function stream(initial=false){
  if(busy||stopped)return;busy=true;
  try{
   // Load ahead of a fast car while retaining a full neighbourhood behind it.
   const ahead={x:latest.x+Math.sin(latest.yaw||0)*Math.min(300,Math.max(0,latest.speed||0)*3),z:latest.z+Math.cos(latest.yaw||0)*Math.min(300,Math.max(0,latest.speed||0)*3)};
   const priority=c=>Math.min(distance(c,latest.x,latest.z),distance(c,ahead.x,ahead.z)+80,...interests.map(p=>distance(c,p.x,p.z)+180));
   const todo=manifest.cells.filter(c=>priority(c)<(initial?400:460)&&!loaded.has(c.id)&&(!failed.has(c.id)||Date.now()-failed.get(c.id)>3000)).sort((a,b)=>priority(a)-priority(b));
   let index=0,done=0;
   async function worker(){while(index<todo.length&&!stopped){const c=todo[index++];try{await load(c);failed.delete(c.id);onProgress?.(`ROCKPORT · LOADING ${++done}/${todo.length}`)}catch(e){failed.set(c.id,Date.now());if(initial)throw e;api.error=e.message}}}
   await Promise.all([worker(),worker()]);
   if(!failed.size)api.error=null;
   for(const [id,item]of loaded)if(distance(item.c,latest.x,latest.z)>950&&interests.every(p=>distance(item.c,p.x,p.z)>500)){unload(item);loaded.delete(id)}
  }finally{busy=false}
 }
 const mapCache=document.createElement('canvas');mapCache.width=mapCache.height=320;let mapAt=-Infinity,mapOrigin={x:0,z:0};
 const api={rockport:true,spawn:{...(spawn||manifest.spawn)},lastSafe:{...(spawn||manifest.spawn)},markers:[],pickups:[],speedBest:0,speedInside:false,roads:[],solids:[],extent:12000,manifest,nav,routes,
  breakables,breakProps:(car,old)=>breakables.hit(car,old),cells:()=>[...loaded.values()].map(i=>i.physics),
  areaReady(p,radius){return !manifest.cells.some(c=>c.collisionTriangles>0&&distance(c,p.x,p.z)<radius&&!loaded.has(c.id));},
  ground(x,z,reference){return P.surface(api.cells(),x,z,reference,1.5,5)?.y??reference},
  tick(dt,car,actors=[]){breakables.tick(dt,car);api.actors=[car,...actors];latest={x:car.x,z:car.z,yaw:car.yaw,speed:car.speed};interests=actors;nextUpdate-=dt;if(nextUpdate<=0){nextUpdate=.6;stream()}},
  ready(car){const ready=!manifest.cells.some(c=>c.collisionTriangles>0&&distance(c,car.x,car.z)<Math.hypot(car.box?.width||2,car.box?.length||5)/2+1&&!loaded.has(c.id));if(!ready)nextUpdate=0;return ready},
  simulate(car,input,dt){return BlacklineVehiclePhysics.step(car,input,dt,api)},
  move(car,previous){
   api.waitingForRoad=manifest.cells.some(c=>c.collisionTriangles>0&&distance(c,car.x,car.z)<12&&!loaded.has(c.id));
   if(api.waitingForRoad){car.x=previous.x;car.z=previous.z;car.y=previous.y;car.speed=0;car.vx=0;car.vz=0;nextUpdate=0;return false}
   const result=P.move(api.cells(),car,previous);breakables.hit(car,previous);return result
  },
  pose(model,x,z,yaw,reference,state){const h=state?reference:api.ground(x,z,reference),dx=Math.sin(yaw),dz=Math.cos(yaw),pitch=state?state.pitch:Math.atan2(api.ground(x+dx,z+dz,h)-api.ground(x-dx,z-dz,h),2),roll=state?state.roll:Math.atan2(api.ground(x+dz,z-dx,h)-api.ground(x-dz,z+dx,h),2);model.position.set(x,h+.08,z);model.rotation.order='YXZ';model.rotation.set(-pitch,yaw,roll)},
  map(ctx,car,heading=car.yaw){
   if(performance.now()-mapAt>=150){mapAt=performance.now();mapOrigin={x:car.x,z:car.z};
   const road=mapCache.getContext('2d');road.clearRect(0,0,320,320);road.save();road.translate(160,160);
   // Filled road faces form a continuous street silhouette. Sparse triangle
   // outlines previously looked like a jagged road centreline on the minimap.
   road.fillStyle='#535c40';
   for(const item of loaded.values()){const a=item.physics.data;
    for(let i=0;i<a.length;i+=10){if(a[i+9]!==3)continue;
     const x0=(a[i]-car.x)*.4,z0=(a[i+2]-car.z)*.4,x1=(a[i+3]-car.x)*.4,z1=(a[i+5]-car.z)*.4,x2=(a[i+6]-car.x)*.4,z2=(a[i+8]-car.z)*.4;
     if(Math.min(x0,x1,x2)>160||Math.max(x0,x1,x2)<-160||Math.min(z0,z1,z2)>160||Math.max(z0,z1,z2)<-160)continue;
     road.beginPath();road.moveTo(x0,z0);road.lineTo(x1,z1);road.lineTo(x2,z2);road.closePath();road.fill();
    }
   }
   road.restore();}
   ctx.fillStyle='#1a211b';ctx.fillRect(0,0,220,180);
   ctx.save();ctx.translate(110,90);ctx.rotate(heading+Math.PI);ctx.drawImage(mapCache,-160+(mapOrigin.x-car.x)*.4,-160+(mapOrigin.z-car.z)*.4);ctx.restore();
   for(const p of api.pickups)if(!p.collected){const dx=(p.x-car.x)*.4,dz=(p.z-car.z)*.4,c=Math.cos(heading),s=Math.sin(heading),q=[110-dx*c+dz*s,90-dx*s-dz*c];ctx.fillStyle='#dfc759';ctx.fillRect(q[0]-2,q[1]-2,4,4)}
   ctx.save();ctx.translate(110,90);ctx.rotate(heading+Math.PI-car.yaw);ctx.fillStyle='#fff5bc';ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(-4,-4);ctx.lineTo(4,-4);ctx.fill();ctx.restore();
  },
  dispose(){stopped=true;clearTimeout(assetTimer);for(const job of assetQueue.splice(0))job.reject(Error('Map closed')); api.roadblocks?.dispose();api.traffic?.dispose();for(const item of loaded.values())unload(item);loaded.clear();breakables.dispose();for(const promise of textures.values())promise.then(t=>t.dispose(),()=>{});textures.clear()}
 };
 try{await stream(true);const surface=P.surface(api.cells(),api.spawn.x,api.spawn.z,api.spawn.y,2,5);if(!surface)throw Error('The road surface at the starting position did not load');api.spawn.y=surface.y;api.lastSafe={...api.spawn};return api}catch(e){api.dispose();throw e}
}};


