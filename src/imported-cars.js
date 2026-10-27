/* User-supplied bodies, converted once into offline geometry; no runtime FBX dependency. */
window.BlacklineImportedCars=(()=>{
 const T=THREE;
 function create(c){
  const id=c.vehicle,data=BlacklineModelData[id],fiat=id==='fiat',g=new T.Group(),body=new T.Group();g.add(body);body.position.y=Number(c.ride)||0;
  const paint=new T.MeshStandardMaterial({color:c.color,roughness:c.finish==='matte'?.87:c.finish==='metal'?.24:.34,metalness:c.finish==='metal'?.75:.22});
  const dark=new T.MeshStandardMaterial({color:0x17191b,roughness:.85}),chrome=new T.MeshStandardMaterial({color:0xb8c0c3,metalness:.85,roughness:.24});
  const glass=new T.MeshStandardMaterial({color:0x20373f,metalness:.38,roughness:.2});
  const rimColor={silver:0xb8bec3,gold:0xb89a55,black:0x272c30}[c.rims]||0xb8bec3;
  const rim=new T.MeshStandardMaterial({color:rimColor,metalness:.8,roughness:.28});
  const textures={},mats={},tails=[],wheels=[],wing=new T.Group(),flames=new T.Group();
  const width=fiat?.81:.96,length=fiat?1.88:2.44;
  // Colour graphics follow the actual body surfaces, including curved panels.
  paint.onBeforeCompile=shader=>{
   shader.uniforms.customAccent={value:new T.Color(c.accent)};
   shader.vertexShader='varying vec3 vBodyPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBodyPosition=position;');
   shader.fragmentShader='varying vec3 vBodyPosition;\nuniform vec3 customAccent;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\n${c.livery==='stripe'?'if(abs(vBodyPosition.x)>.10 && abs(vBodyPosition.x)<.24 && vBodyPosition.y>.65) diffuseColor.rgb=customAccent;':c.livery==='side'?`if(abs(vBodyPosition.x)>${width*.8} && vBodyPosition.y>.43 && vBodyPosition.y<.56) diffuseColor.rgb=customAccent;`:''}\n${c.hood==='carbon'?`if(vBodyPosition.z>${fiat?1.03:.95} && vBodyPosition.y>${fiat?.66:.76}) diffuseColor.rgb=vec3(.025,.03,.033);`:''}`);
  };
  paint.customProgramCacheKey=()=>[id,c.livery,c.hood].join('-');
  for(const [name,url]of Object.entries(data.textures)){const tex=new T.TextureLoader().load(url);tex.colorSpace=T.SRGBColorSpace;textures[name]=tex;}
  function material(part){
   const key=part.material;if(mats[key])return mats[key];const desc=data.materials[key],name=desc.name;
   let mat;if((fiat&&name==='PBR'&&!/BackSide/.test(part.name))||(!fiat&&name==='Material'))mat=paint;
   else if((fiat&&name==='Uber')||(!fiat&&name==='Material.001'))mat=glass;
   else if(/Gant|^Rin_/.test(part.name))mat=rim;
   else if(/Tire|Ruedas/.test(part.name))mat=new T.MeshStandardMaterial({color:0x242629,roughness:.95,map:desc.texture?textures[desc.texture]:null});
   else if(desc.texture)mat=new T.MeshStandardMaterial({color:0xffffff,map:textures[desc.texture],roughness:.6,metalness:.05});
   else if(/BackLight|Luz_Tr/.test(part.name))mat=new T.MeshStandardMaterial({color:0xb82b23,emissive:0x5b0803,roughness:.3});
   else if(/FrontLight|^Faro_2/.test(part.name))mat=new T.MeshStandardMaterial({color:0xffefd0,emissive:0x6e674c,roughness:.25});
   else if(/Shell|Disc|Rejilla/.test(part.name)||name==='Material.014')mat=dark;
   else mat=chrome;
   return mats[key]=mat;
  }
  const rolls={};for(const [key,w]of Object.entries(data.wheels)){
   const pivot=new T.Group();pivot.position.fromArray(w.center);g.add(pivot);
   const cam=new T.Group();cam.rotation.z=-Math.sign(pivot.position.x)*(Number(c.camber)||0)*Math.PI/180;pivot.add(cam);
   const roll=new T.Group();cam.add(roll);const factor=1+(Number(c.wheelSize||18)-18)*.025;roll.scale.setScalar(factor);pivot.position.y=w.radius*factor;
   pivot.userData={roll,radius:w.radius*factor};wheels.push(pivot);rolls[key]=roll;
   if(c.wheel!=='original'){
    const face=new T.Group();face.position.x=Math.sign(pivot.position.x)*(fiat?.085:.125);face.rotation.y=Math.sign(pivot.position.x)*Math.PI/2;roll.add(face);
    const r=w.radius*.7,ring=new T.Mesh(new T.TorusGeometry(r,.018,6,28),rim);face.add(ring);
    const disc=new T.Mesh(new T.CircleGeometry(r*.9,24),dark);face.add(disc);
    const count=c.wheel==='five'?5:c.wheel==='mesh'?12:6;
    for(let i=0;i<count;i++)for(const off of c.wheel==='split'?[-.055,.055]:[0]){const a=i/count*Math.PI*2+off,m=new T.Mesh(new T.BoxGeometry(.025,r*.85,.025),rim);m.position.set(Math.sin(a)*r*.48,Math.cos(a)*r*.48,.025);m.rotation.z=-a;face.add(m);}
    const hub=new T.Mesh(new T.CircleGeometry(.055,12),rim);hub.position.z=.045;face.add(hub);
   }
  }
  for(const part of data.parts){
   if(part.wheel&&/Gant|^Rin_/.test(part.name)&&c.wheel!=='original')continue;
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(part.position,3));if(part.normal.length)geo.setAttribute('normal',new T.Float32BufferAttribute(part.normal,3));else geo.computeVertexNormals();if(part.uv.length)geo.setAttribute('uv',new T.Float32BufferAttribute(part.uv,2));
   const mat=material(part),mesh=new T.Mesh(geo,mat);mesh.name=part.name;mesh.castShadow=true;mesh.receiveShadow=true;(part.wheel?rolls[part.wheel]:body).add(mesh);
   if(/BackLight|Luz_Tr/.test(part.name))tails.push(mesh);
  }
  function box(parent,x,y,z,w,h,d,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  // Lightweight upholstery replaces the FBX's 74k hidden seat triangles.
  if(fiat)for(const x of [-.34,.34]){box(body,x,.55,-.1,.45,.12,.5,dark);box(body,x,.75,-.3,.45,.5,.12,dark);}
  body.updateMatrixWorld(true);
  function surface(x,z,fallback){const ray=new T.Raycaster(new T.Vector3(x,4,z),new T.Vector3(0,-1,0));const hits=ray.intersectObjects(body.children,true);return hits.length?hits[0].point.y-body.position.y:fallback;}
  if(c.kit!=='stock'){
   for(const side of [-1,1])box(body,side*width,fiat?.22:.31,0,.08,c.kit==='race'?.14:.07,fiat?1.6:2.2,dark);
   box(body,0,fiat?.215:.299,length-.1,width*2.03,.035,c.kit==='race'?.4:.22,dark);
  }
  if(c.kit==='wide')for(const w of wheels){const radius=w.userData.radius+.065;const arch=new T.Mesh(new T.TorusGeometry(radius,.055,5,24,Math.PI),paint);arch.rotation.y=Math.PI/2;arch.position.copy(w.position);arch.position.x=Math.sign(w.position.x)*(width+.025);body.add(arch);w.position.x+=Math.sign(w.position.x)*.045;}
  if(c.hood==='vented')for(const side of [-1,1])for(let i=0;i<4;i++){const z=(fiat?1.18:1.1)+i*.11,x=side*.28;box(body,x,surface(x,z,.8)+.012,z,.22,.015,.04,dark);}
  const deckZ=-length+.24,deck=surface(0,deckZ,.8),wh=c.wing==='duck'?.1:c.wing==='street'?.2:.38;
  body.add(wing);wing.visible=!!c.spoiler;
  for(const side of [-1,1])box(wing,side*.52,deck+wh/2,deckZ,.045,wh,.07,dark);
  box(wing,0,deck+wh,deckZ,width*2,.045,.26,c.wing==='street'?paint:dark);
  if(c.wing==='gt')for(const side of [-1,1])box(wing,side*width,deck+wh+.035,deckZ,.025,.13,.3,paint);
  body.add(flames);flames.visible=false;
  for(const side of c.exhaust==='dual'?[-1,1]:[-1]){const x=side*width*.65,y=fiat?.19:.21,z=-length-.06;
   const pipe=new T.Mesh(new T.CylinderGeometry(.065,.065,.22,12),chrome);pipe.rotation.x=Math.PI/2;pipe.position.set(x,y,z);body.add(pipe);
   const opening=new T.Mesh(new T.CircleGeometry(.05,12),dark);opening.rotation.y=Math.PI;opening.position.set(x,y,z-.115);body.add(opening);
   const flame=new T.Mesh(new T.ConeGeometry(.08,.5,6),new T.MeshBasicMaterial({color:0x88bbff}));flame.rotation.x=-Math.PI/2;flame.position.set(x,y,z-.35);flames.add(flame);
  }
  g.userData={paint,wing,wheels,rims:[rim],tails,flames,imported:true};return g;
 }
 return {create};
})();
