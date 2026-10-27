/* Static workshop from the supplied NFS 2015 model, loaded only on entry. */
(function(root){
 async function create(T){
  async function get(url,binary=false){const r=await fetch(url);if(!r.ok)throw Error('Could not load the tuning garage: '+url);return binary?r.arrayBuffer():r.json();}
  const [data,buffer]=await Promise.all([get('assets/tuning/garage.json'),get('assets/tuning/garage.bin',true)]),group=new T.Group();group.name='tuning-garage';
  const loaded=await Promise.allSettled(data.materials.map(m=>new T.TextureLoader().loadAsync(m.texture))),textures=loaded.filter(r=>r.status==='fulfilled').map(r=>r.value);
  if(loaded.some(r=>r.status==='rejected')){textures.forEach(t=>t.dispose());throw Error('Could not load a tuning garage texture.');}
  for(const texture of textures){texture.colorSpace=T.SRGBColorSpace;texture.magFilter=texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;texture.wrapS=texture.wrapT=T.RepeatWrapping;}
  const materials=data.materials.map((m,i)=>BlacklinePSX.material(new T.MeshBasicMaterial({map:textures[i],color:new T.Color().setScalar(m.name==='Lights_D'?1.7:1.1),side:T.DoubleSide}))),meshes=[];
  function decode(q,size){const source=new Uint16Array(buffer,q.offset,q.count),a=new Float32Array(q.count);for(let i=0;i<a.length;i++)a[i]=q.min[i%size]+source[i]*q.scale[i%size];return new T.BufferAttribute(a,size);}
  for(const part of data.parts){const geo=new T.BufferGeometry();geo.setAttribute('position',decode(part.position,3));geo.setAttribute('uv',decode(part.uv,2));geo.setIndex(new T.BufferAttribute(new Uint16Array(buffer,part.index.offset,part.index.count),1));geo.computeBoundingSphere();const mesh=new T.Mesh(geo,materials[part.material]);mesh.name='tuning-'+part.name;group.add(mesh);meshes.push(mesh);}
  group.add(new T.HemisphereLight(0xe9f0ff,0x4b4941,2.1));const light=new T.DirectionalLight(0xfff2dc,2.0);light.position.set(3,6,4);group.add(light);const fill=new T.DirectionalLight(0xadc9ff,.9);fill.position.set(-4,3,-3);group.add(fill);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,4,32,32,32);gradient.addColorStop(0,'rgba(0,0,0,.65)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const shadowTexture=new T.CanvasTexture(canvas),shadow=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.008;group.add(shadow);
  const ray=new T.Raycaster(),direction=new T.Vector3(),oldPosition=new T.Vector3(Infinity,0,0),oldTarget=new T.Vector3(),clipped=new T.Vector3();let disposed=false;
  return {group,bayYaw:data.layout.yaw||0,triangles:data.triangles,frame(car){shadow.rotation.order='YXZ';shadow.rotation.set(-Math.PI/2,car.rotation.y,0);shadow.scale.set((car.userData.hitbox?.width||2)+1,(car.userData.hitbox?.length||5)+1,1);},
   clip(position,target){if(position.distanceToSquared(oldPosition)<.0001&&target.distanceToSquared(oldTarget)<.0001)return clipped;oldPosition.copy(position);oldTarget.copy(target);direction.subVectors(position,target);const distance=direction.length();ray.set(target,direction.normalize());ray.near=2.6;ray.far=distance;group.updateWorldMatrix(true,true);const hit=ray.intersectObjects(meshes,false)[0];clipped.copy(position);if(hit&&hit.distance<distance-.3)clipped.copy(target).addScaledVector(direction,Math.max(2.6,hit.distance-.3));return clipped;},
   dispose(){if(disposed)return;disposed=true;group.removeFromParent();for(const mesh of meshes)mesh.geometry.dispose();materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());shadow.geometry.dispose();shadow.material.dispose();shadowTexture.dispose();}
  };
 }
 const api={create};if(typeof module==='object')module.exports=api;else root.BlacklineTuningGarage=api;
})(typeof window==='object'?window:globalThis);
