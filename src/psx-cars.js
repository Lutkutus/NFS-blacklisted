/* Runtime for the user-supplied PSX cars. Original texture atlases stay intact. */
window.BlacklineCars=(()=>{
 const T=THREE,defaults={skin:'original',wear:'road',wheel:'original',rims:'silver',rimColor:'#ffffff',paint:'original',ride:0,camber:0,tires:'street',gearing:'balanced',brakes:'stock',color:'#ffffff',response:'balanced',aero:'balanced',nitrous:'balanced',wingStyle:'stock',splitter:'stock',skirts:'stock',diffuser:'stock',canards:'stock',hoodVent:'stock',spats:'stock',arches:'stock',offset:0,partOffsets:{}};
 const parts=window.BLACKLINE_PARTS||{rims:{},wings:{}};
 function partMesh(part,material){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(part.position,3));geo.setAttribute('uv',new T.Float32BufferAttribute(part.uv,2));if(part.index)geo.setIndex(new T.BufferAttribute(part.index,1));geo.computeVertexNormals();return new T.Mesh(geo,material);}
 const profiles=Object.fromEntries(Object.keys(PSX_CARS).map(k=>[k,{}]));
 function create(input){
  const c={...defaults,...input},d=PSX_CARS[c.vehicle]||PSX_CARS.skyline,g=new T.Group(),body=new T.Group();g.add(body);body.position.y=Number(c.ride)||0;
  if(c.wheel!=='original'&&!parts.rims[c.wheel])c.wheel='jdm1';
  const textures={},mats={},rolls={},wheels=[],rims=[];
  for(const[key,url]of Object.entries(d.textures)){const tx=new T.TextureLoader().load(url);tx.colorSpace=T.SRGBColorSpace;tx.magFilter=tx.minFilter=T.NearestFilter;tx.generateMipmaps=false;tx.wrapS=tx.wrapT=T.RepeatWrapping;textures[key]=tx;}
  const tint={original:0xffffff,warm:0xffc99b,cold:0xa8bcca,primer:0x93978d}[c.skin];
  for(const[key,desc]of Object.entries(d.materials)){
   const col=new T.Color().setRGB(...desc.color);if(c.skin!=='original')col.multiply(new T.Color(tint));
   const mat=BlacklinePSX.material(new T.MeshLambertMaterial({color:col,map:desc.texture?textures[desc.texture]:null,side:T.DoubleSide,alphaTest:.3,flatShading:true,vertexColors:!!desc.vertexColors}));
   const original=mat.onBeforeCompile;mat.onBeforeCompile=s=>{original(s);s.vertexShader='varying vec3 vDirtPosition;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDirtPosition=position;');s.fragmentShader='varying vec3 vDirtPosition;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat grime=fract(sin(dot(floor(vDirtPosition.xz*75.),vec2(12.98,78.23)))*43758.5);diffuseColor.rgb*=1.-${c.wear==='clean'?'0.0':c.wear==='race'?'0.36':'0.20'}*(1.-smoothstep(.15,1.1,vDirtPosition.y))*(.5+.5*grime);`);};if(desc.muteMagenta){const prior=mat.onBeforeCompile;mat.onBeforeCompile=s=>{prior(s);s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif(diffuseColor.r>diffuseColor.g*1.7 && diffuseColor.b>diffuseColor.g*1.7) diffuseColor.rgb=vec3(.12,.10,.08);');};}mat.customProgramCacheKey=()=>c.wear+(desc.muteMagenta?'muted':'');BlacklineCarColors.body(T,mat,c,desc);mats[key]=mat;
  }
  for(const[key,w]of Object.entries(d.wheels)){
   const pivot=new T.Group();pivot.position.fromArray(w.center);pivot.position.x+=Math.sign(w.center[0])*T.MathUtils.clamp(Number(c.offset)||0,0,.18);g.add(pivot);const cam=new T.Group();pivot.add(cam);cam.rotation.z=Math.sign(w.center[0])*Math.abs(T.MathUtils.clamp(Number(c.camber)||0,-10,10))*Math.PI/180;
   const roll=new T.Group();cam.add(roll);rolls[key]=roll;pivot.userData={roll,radius:w.radius};wheels.push(pivot);
   if(parts.rims[c.wheel]){
    const side=Math.sign(w.center[0]),selected=parts.rims[c.wheel],replacement=new T.Group();replacement.name='imported-rim';roll.add(replacement);
    let lo=Infinity,hi=-Infinity;for(const p of d.parts)if(p.wheel===key)for(let i=0;i<p.position.length;i+=3){lo=Math.min(lo,p.position[i]);hi=Math.max(hi,p.position[i]);}
    replacement.scale.set(side*(hi-lo)/(selected.fitWidth||.36),w.radius,w.radius);
    for(const p of selected.parts){
     const rubber=p.rubber??(p.material.startsWith('Material.')||p.material==='rubber'),image=({'Material.002':'side_tire','Material.003':'tire',Rim1:'Rim1_BaseColor',Rim2:'Rim2_BaseColor',Rim3:'Rim3_BaseColor',Rim3Gold:'Rim3Gold_BaseColor',Rim4:'Rim4V2_BaseColor',Bolt:'Bolt_BaseColor',BoltM:'BoltM_BaseColor'})[p.material],url=p.texture||(p.color?null:image?'assets/custom/textures/'+image+'.png':null);
     let tx=url?textures['part-'+url]:null;if(url&&!tx){tx=new T.TextureLoader().load(url);tx.colorSpace=T.SRGBColorSpace;tx.magFilter=tx.minFilter=T.NearestFilter;tx.generateMipmaps=false;tx.wrapS=tx.wrapT=T.RepeatWrapping;textures['part-'+url]=tx;}
     const color=p.color?new T.Color().setRGB(...p.color.slice(0,3)):new T.Color(rubber?(p.material==='rubber'?0x242822:0x77776a):0xffffff);if(!rubber)color.multiply(new T.Color({silver:0xffffff,gold:0xc9a556,black:0x383a32}[c.rims]||0xffffff));
     const mat=BlacklinePSX.material(new T.MeshLambertMaterial({map:tx,color,side:T.DoubleSide,alphaTest:.25,flatShading:!selected.groundFit}));if(!rubber){if(c.rims==='custom')BlacklineCarColors.rim(T,mat,c.rimColor);rims.push(mat);}const mesh=partMesh(p,mat);mesh.userData.rubber=rubber;replacement.add(mesh);
    }
    if(selected.groundFit){
     let bottom=Infinity;const v=new T.Vector3();
     for(const p of selected.parts)for(let i=0;i<p.position.length;i+=3){v.fromArray(p.position,i).multiply(replacement.scale).applyEuler(cam.rotation);bottom=Math.min(bottom,v.y);}
     pivot.position.y=-bottom;
    }
   }
  }
  for(const part of d.parts){if(part.wheel&&parts.rims[c.wheel])continue;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(part.position,3));geo.setAttribute('normal',new T.Float32BufferAttribute(part.normal,3));geo.setAttribute('carPaint',new T.BufferAttribute(BlacklineCarColors.weights(part,d),1));geo.setAttribute('uv',new T.Float32BufferAttribute(part.uv,2));if(part.color)geo.setAttribute('color',new T.Float32BufferAttribute(part.color,3));if(part.index)geo.setIndex(new T.BufferAttribute(part.index,1));const mesh=new T.Mesh(geo,mats[part.material]);mesh.name=part.name;mesh.castShadow=true;mesh.receiveShadow=true;(part.wheel?rolls[part.wheel]:body).add(mesh);}
  const flames=new T.Group();g.add(flames);flames.visible=false;const f=new T.Mesh(new T.ConeGeometry(.085,.45,4),new T.MeshBasicMaterial({color:0xfdd888}));f.rotation.x=-Math.PI/2;f.position.set(-.5,.25,-d.length/2-.2);flames.add(f);
  body.updateMatrixWorld(true);const bodyBox=new T.Box3().setFromObject(body),bodyWidth=bodyBox.max.x-bodyBox.min.x;
  const trimMaterial=BlacklinePSX.material(new T.MeshLambertMaterial({color:0x292b23,flatShading:true})),trim=new T.Group();body.add(trim);trim.name='body-trim';
  if(c.splitter!=='stock'&&!window.BLACKLINE_WORKSHOP?.[c.splitter]){const depth=c.splitter==='race'?.32:.16,m=new T.Mesh(new T.BoxGeometry(bodyWidth*.94,.055,depth+.14),trimMaterial);m.position.set(0,bodyBox.min.y-body.position.y+.1,bodyBox.max.z-.06+depth/2);trim.add(m);}
  if(c.skirts!=='stock'&&!window.BLACKLINE_WORKSHOP?.[c.skirts]){
   const front=Math.min(...Object.values(d.wheels).filter(w=>w.center[2]>0).map(w=>w.center[2]-w.radius)),rear=Math.max(...Object.values(d.wheels).filter(w=>w.center[2]<0).map(w=>w.center[2]+w.radius)),length=Math.max(.3,front-rear);
   for(const sign of [-1,1]){const m=new T.Mesh(new T.BoxGeometry(c.skirts==='race'?.16:.09,.1,length),trimMaterial);m.position.set(sign*bodyWidth*.48,bodyBox.min.y-body.position.y+.1,(front+rear)/2);trim.add(m);}
  }
  const wing=new T.Group();body.add(wing);if(c.wingStyle!=='stock'&&!window.BLACKLINE_WORKSHOP?.[c.wingStyle]){
   // Sample this body's rear deck; the attachment follows ride height with the body.
   body.updateMatrixWorld(true);
   const box=new T.Box3().setFromObject(body),width=box.max.x-box.min.x,z=box.min.z+(box.max.z-box.min.z)*.12;
   const ray=new T.Raycaster(),mounts=[];
   for(const x of [-width*.24,width*.24]){
    ray.set(new T.Vector3(x,box.max.y+1,z),new T.Vector3(0,-1,0));
    const hit=ray.intersectObjects(body.children,true)[0];
    mounts.push({x,y:hit?body.worldToLocal(hit.point.clone()).y:box.min.y-body.position.y+(box.max.y-box.min.y)*.55});
   }
   const material=BlacklinePSX.material(new T.MeshLambertMaterial({color:0x272922,flatShading:true}));
   if(parts.wings[c.wingStyle]){
    const selected=parts.wings[c.wingStyle],span=width*.88,top=Math.max(...mounts.map(m=>m.y))+.025;
    for(const p of selected.parts){const mesh=partMesh(p,material);mesh.scale.setScalar(span);mesh.position.set(0,top,z);wing.add(mesh);}
   }else{
   const height=c.wingStyle==='race'?.34:.16,top=Math.max(...mounts.map(m=>m.y))+height;
   for(const m of mounts){const h=top-m.y,post=new T.Mesh(new T.BoxGeometry(.045,h,.09),material);post.position.set(m.x,m.y+h/2,z);wing.add(post);}
   const blade=new T.Mesh(new T.BoxGeometry(width*(c.wingStyle==='race'?.88:.72),.055,.25),material);blade.position.set(0,top,z);wing.add(blade);
   }
  }
  const paint=Object.values(mats)[0],hitbox={width:+bodyWidth.toFixed(5),length:+(bodyBox.max.z-bodyBox.min.z).toFixed(5),height:+Math.max(.65,bodyBox.max.y-body.position.y-.18).toFixed(5),bottom:.18};g.userData={wheels,rims,tails:[],flames,wing,trim,paint,hitbox,psx:true};g.userData.workshop=window.BlacklineWorkshop?.add(body,d,c)||[];window.BlacklinePartPlacement?.attach(g,c);return g;
 }
 function animate(model,speed,dt,steer=0){for(const w of model.userData.wheels){if(w.position.z>0)w.rotation.y=-steer*.4;w.userData.roll.rotation.x+=speed*dt/w.userData.radius;}}
 return {create,animate,defaults,profiles};
})();

