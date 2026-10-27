/* Soft billboard smoke, a fixed particle pool and one instanced draw call. */
(function(root){
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),capacity=256;
 function intensity(car,input={}){
  const speed=Math.hypot(car.vx||0,car.vz||0)||Math.abs(car.speed||0);if(car.grounded===false||speed<7)return 0;
  const side=Math.abs((car.vx||0)*Math.cos(car.yaw)-(car.vz||0)*Math.sin(car.yaw))/Math.max(speed,1);
  return clamp(Math.max((side-.12)*2.4,input.handbrake?.55+Math.abs(input.steer||0)*.3:0)*clamp((speed-7)/8,0,1),0,1);
 }
 function create(T,scene,{random=Math.random}={}){
  const size=128,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const u=(x+.5)/size*2-1,v=(y+.5)/size*2-1,a=Math.atan2(v,u),edge=.84+.08*Math.sin(a*5+.4)+.05*Math.sin(a*9-1),r=Math.hypot(u,v)/edge;
   const wisps=.55+.23*Math.sin(u*12+Math.sin(v*6)*1.4)*Math.sin(v*11-u*4)+.12*Math.sin(u*23+v*17)*Math.sin(v*21-u*13),alpha=Math.pow(Math.max(0,1-r*r),1.55)*wisps,i=(y*size+x)*4;
   pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=Math.round(clamp(alpha,0,1)*255);
  }
  const texture=new T.DataTexture(pixels,size,size,T.RGBAFormat);texture.minFilter=texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
  const geometry=new T.PlaneGeometry(1,1),opacity=new T.InstancedBufferAttribute(new Float32Array(capacity),1),angles=new T.InstancedBufferAttribute(new Float32Array(capacity),1);
  geometry.setAttribute('smokeOpacity',opacity);geometry.setAttribute('smokeAngle',angles);opacity.setUsage(T.DynamicDrawUsage);angles.setUsage(T.DynamicDrawUsage);
  const material=new T.MeshBasicMaterial({map:texture,color:0xffffff,transparent:true,depthWrite:false,fog:true,toneMapped:true});
  material.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float smokeOpacity;attribute float smokeAngle;varying float vSmokeOpacity;')
    .replace('#include <project_vertex>',`vSmokeOpacity=smokeOpacity;
     vec4 mvPosition=modelViewMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);
     vec2 puff=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));
     float ca=cos(smokeAngle),sa=sin(smokeAngle);
     mvPosition.xy+=mat2(ca,-sa,sa,ca)*puff;gl_Position=projectionMatrix*mvPosition;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vSmokeOpacity;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vSmokeOpacity;');
  };
  material.customProgramCacheKey=()=> 'drift-smoke-billboard-v1';
  const mesh=new T.InstancedMesh(geometry,material,capacity);mesh.name='drift-smoke';mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.renderOrder=2;scene.add(mesh);
  const slots=Array.from({length:capacity},()=>({life:0})),dummy=new T.Object3D(),color=new T.Color();let cursor=0,accumulator=0,strength=0;
  dummy.scale.setScalar(0);dummy.updateMatrix();for(let i=0;i<capacity;i++){mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,color.setRGB(.55,.56,.54));}
  mesh.instanceColor.setUsage(T.DynamicDrawUsage);
  function emit(car,emitter,power,delay){
   const index=cursor++%capacity,p=slots[index],life=2.6+random()*1.1;
   Object.assign(p,{life,maxLife:life,age:0,x:emitter.x-(car.vx||0)*delay,y:emitter.y+.08,z:emitter.z-(car.vz||0)*delay,
    vx:(car.vx||0)*.07+(random()-.5)*.6,vz:(car.vz||0)*.07+(random()-.5)*.6,vy:.32+random()*.3,
    start:.5+random()*.45,end:3.8+power*2+random()*.8,stretch:.8+random()*.35,power,angle:random()*Math.PI*2,spin:(random()-.5)*.24,phase:random()*6.28});
   const shade=.5+random()*.14;color.setRGB(shade,shade*1.01,shade*.96);mesh.setColorAt(index,color);mesh.instanceColor.needsUpdate=true;
  }
  function update(dt,car,input={},emitters=[]){
   dt=clamp(dt||0,0,.1);const target=intensity(car,input);strength+=(target-strength)*(1-Math.exp(-dt*12));
   if(target>0&&emitters.length){accumulator+=dt;const step=1/(12+strength*22);let count=0;while(accumulator>=step&&count++<4){accumulator-=step;for(const emitter of emitters)emit(car,emitter,strength,accumulator);}}else accumulator=0;
   for(let i=0;i<capacity;i++){
    const p=slots[i];if(p.life<=0){opacity.setX(i,0);continue;}p.life=Math.max(0,p.life-dt);p.age+=dt;
    const t=clamp(p.age/p.maxLife,0,1),drag=Math.exp(-dt*.8);p.vx*=drag;p.vz*=drag;p.x+=(p.vx+.2+Math.sin(p.phase+p.age*1.6)*.15)*dt;p.z+=(p.vz+.1+Math.cos(p.phase+p.age*1.4)*.13)*dt;p.y+=p.vy*dt;
    const diameter=p.start+(p.end-p.start)*(1-Math.exp(-p.age*.9));dummy.position.set(p.x,p.y,p.z);dummy.scale.set(diameter,diameter*p.stretch,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    opacity.setX(i,Math.min(1,p.age/.12)*Math.pow(1-t,1.3)*(.32+p.power*.35));angles.setX(i,p.angle+p.spin*p.age);
   }
   mesh.instanceMatrix.needsUpdate=true;opacity.needsUpdate=true;angles.needsUpdate=true;
  }
  return {mesh,update,slots,capacity};
 }
 const api={create,intensity,capacity};if(typeof module==='object')module.exports=api;else root.BlacklineDriftSmoke=api;
})(typeof globalThis!=='undefined'?globalThis:this);
