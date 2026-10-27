/* Bounded transient collision effects. Two draw calls, shared sound buffers. */
(function(root){
 'use strict';
 const SPARKS=192,DUST=64,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function material(prop){
  const label=(prop.labels||[]).join(' ').toUpperCase();
  if(/GLASS|WINDOW/.test(label))return 'glass';
  if(/WOOD|CARDBOARD|CRATE|PAPER|SHOEBOX/.test(label))return 'wood';
  if(/PLASTIC|PLAS|ORANGEWHITE|CONE|PYLON|ROADDIVIDER_JG|TIRE|RUBBER/.test(label))return 'plastic';
  if(/CONCRETE|STONE|PLANTER/.test(label))return 'stone';
  if(prop.kind==='rubbish'||/GARBAGE|TRASH|CLOTH/.test(label))return 'soft';
  return 'metal';
 }
 function create(T,world,{onImpact,random=Math.random}={}){
  const sparks=Array.from({length:SPARKS},()=>({life:0})),dust=Array.from({length:DUST},()=>({life:0}));
  const sparkPosition=new Float32Array(SPARKS*6),sparkColor=new Float32Array(SPARKS*6),dustPosition=new Float32Array(DUST*3),dustSize=new Float32Array(DUST),dustAlpha=new Float32Array(DUST),dustColor=new Float32Array(DUST*3);
  const sparkGeo=new T.BufferGeometry(),dustGeo=new T.BufferGeometry();
  function attribute(g,name,array,size){const a=new T.BufferAttribute(array,size);a.setUsage(T.DynamicDrawUsage);g.setAttribute(name,a);return a;}
  attribute(sparkGeo,'position',sparkPosition,3);attribute(sparkGeo,'color',sparkColor,3);
  attribute(dustGeo,'position',dustPosition,3);attribute(dustGeo,'puffSize',dustSize,1);attribute(dustGeo,'puffAlpha',dustAlpha,1);attribute(dustGeo,'color',dustColor,3);
  const sparkMat=new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false,fog:true,toneMapped:false});
  const dustMat=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,fog:true,uniforms:T.UniformsUtils.clone(T.UniformsLib.fog),vertexShader:`
   attribute float puffSize;attribute float puffAlpha;varying float alpha;varying vec3 shade;
   #include <fog_pars_vertex>
   void main(){alpha=puffAlpha;shade=color;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mvPosition;gl_PointSize=clamp(puffSize*500.0/max(1.0,-mvPosition.z),0.0,110.0);
   #include <fog_vertex>
   }`,fragmentShader:`
   varying float alpha;varying vec3 shade;
   #include <fog_pars_fragment>
   void main(){vec2 q=gl_PointCoord*2.0-1.0;float r=dot(q,q);if(r>1.0)discard;float noise=.78+.14*sin(q.x*17.0+sin(q.y*11.0))*sin(q.y*19.0);gl_FragColor=vec4(shade,alpha*pow(1.0-r,1.7)*noise);
   #include <fog_fragment>
   }`});
  const sparkMesh=new T.LineSegments(sparkGeo,sparkMat),dustMesh=new T.Points(dustGeo,dustMat);sparkMesh.name='impact-sparks';dustMesh.name='impact-dust';sparkMesh.frustumCulled=dustMesh.frustumCulled=false;dustMesh.renderOrder=3;sparkMesh.visible=dustMesh.visible=false;world.add(sparkMesh,dustMesh);
  let sparkCursor=0,dustCursor=0,listener=null,emissions=0,disposed=false;
  function emit({owner,prop,car}){
   if(disposed)return;
   const position={x:clamp(car.x,prop.min[0],prop.max[0]),y:clamp(car.y+.55,prop.min[1],prop.max[1]),z:clamp(car.z,prop.min[2],prop.max[2])};
   const distance=listener?Math.hypot(position.x-listener.x,position.y-listener.y,position.z-listener.z):0;if(distance>110)return;
   const speed=Math.hypot(car.vx||0,car.vz||0)||Math.abs(car.speed||0),power=clamp(speed/24,.15,1),kind=material(prop),dx=speed>.1?(car.vx||0)/speed:Math.sin(car.yaw||0),dz=speed>.1?(car.vz||0)/speed:Math.cos(car.yaw||0);
   const count=kind==='metal'?Math.round(7+power*15):kind==='glass'?14:kind==='stone'?5:0;
   for(let j=0;j<count;j++){const p=sparks[sparkCursor++%SPARKS],life=.2+random()*.45;Object.assign(p,{owner,life,maxLife:life,x:position.x,y:position.y,z:position.z,vx:dx*(2+power*7)+(random()-.5)*8,vy:1.5+random()*5*power,vz:dz*(2+power*7)+(random()-.5)*8,kind});}
   for(let j=0;j<(kind==='metal'?4:kind==='stone'?11:8);j++){const p=dust[dustCursor++%DUST],life=.65+random()*.65;Object.assign(p,{owner,life,maxLife:life,age:0,x:position.x+(random()-.5)*.3,y:car.y+.18+random()*.25,z:position.z+(random()-.5)*.3,vx:dx*(1+power*2)+(random()-.5),vz:dz*(1+power*2)+(random()-.5),vy:.4+random()*.5,size:.35+random()*.4,power,kind});}
   emissions++;onImpact?.({kind,speed,position,distance});
  }
  function clearOwner(owner){for(const list of [sparks,dust])for(const p of list)if(p.owner===owner){p.life=0;p.owner=null;}update(0);}
  function update(dt,car){
   if(disposed)return;if(car)listener={x:car.x,y:car.y,z:car.z};dt=clamp(dt||0,0,.1);let ns=0,nd=0;
   for(let i=0;i<SPARKS;i++){const p=sparks[i],offset=i*6;p.life=Math.max(0,p.life-dt);if(!p.life){sparkColor.fill(0,offset,offset+6);p.owner=null;continue;}ns++;p.vy-=12*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;const tail=.025,fade=p.life/p.maxLife;
    sparkPosition.set([p.x,p.y,p.z,p.x-p.vx*tail,p.y-p.vy*tail,p.z-p.vz*tail],offset);const rgb=p.kind==='glass'?[.55,.85,1]:p.kind==='stone'?[.65,.55,.35]:[1,.7,.2];for(let k=0;k<6;k++)sparkColor[offset+k]=rgb[k%3]*fade*(k<3?1:.12);
   }
   for(let i=0;i<DUST;i++){const p=dust[i];p.life=Math.max(0,p.life-dt);if(!p.life){dustAlpha[i]=dustSize[i]=0;p.owner=null;continue;}nd++;p.age+=dt;const drag=Math.exp(-dt*2);p.vx*=drag;p.vz*=drag;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;dustPosition.set([p.x,p.y,p.z],i*3);dustSize[i]=p.size+p.age*(1.5+p.power);dustAlpha[i]=Math.min(1,p.age/.05)*Math.pow(p.life/p.maxLife,1.2)*.65;dustColor.set(p.kind==='glass'?[.65,.74,.75]:p.kind==='metal'?[.52,.49,.4]:[.57,.5,.36],i*3);
   }
   sparkMesh.visible=ns>0;dustMesh.visible=nd>0;for(const g of [sparkGeo,dustGeo])for(const a of Object.values(g.attributes))a.needsUpdate=true;
  }
  return {emit,update,clearOwner,sparks,dust,sparkMesh,dustMesh,stats:()=>({emissions,sparks:sparks.filter(p=>p.life>0).length,dust:dust.filter(p=>p.life>0).length}),dispose(){if(disposed)return;disposed=true;world.remove(sparkMesh,dustMesh);sparkGeo.dispose();dustGeo.dispose();sparkMat.dispose();dustMat.dispose();for(const p of [...sparks,...dust]){p.life=0;p.owner=null;}}};
 }
 function createAudio(ctx,{random=Math.random}={}){
  const output=ctx.createGain();output.gain.value=1;output.connect(ctx.destination);
  const noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.4),ctx.sampleRate),samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=random()*2-1;
  const voices=new Set();let last=-Infinity,played=0;
  function play({kind,speed,distance=0}){
   const now=ctx.currentTime;if(output.gain.value===0||ctx.state!=='running'||distance>85||now-last<.035||voices.size>=6)return false;last=now;
   const duration=kind==='metal'?.42:kind==='glass'?.32:.2,gain=ctx.createGain(),filter=ctx.createBiquadFilter(),source=ctx.createBufferSource(),nodes=[source,filter,gain],level=clamp(speed/25,.15,1)*.14/(1+distance*distance/225);
   gain.connect(output);gain.gain.setValueAtTime(Math.max(.001,level),now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);source.buffer=noise;filter.type=kind==='metal'||kind==='glass'?'highpass':'lowpass';filter.frequency.value=kind==='glass'?2500:kind==='metal'?1300:kind==='wood'?800:400;source.connect(filter);filter.connect(gain);
   if(kind!=='soft')for(const ratio of kind==='metal'?[1,2.37]:kind==='glass'?[1,1.48,2.1]:[1]){const osc=ctx.createOscillator(),tone=ctx.createGain();osc.type=kind==='metal'||kind==='glass'?'sine':'triangle';const frequency=(kind==='metal'?640:kind==='glass'?2400:kind==='wood'?130:190)*ratio*(.9+random()*.2);osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(frequency*.65,now+duration);tone.gain.value=kind==='metal'?.55:.25;osc.connect(tone);tone.connect(gain);osc.start(now);osc.stop(now+duration);nodes.push(osc,tone);}
   const voice={nodes,source};voices.add(voice);source.onended=()=>{for(const n of nodes)n.disconnect();voices.delete(voice)};source.start(now);source.stop(now+duration);played++;return true;
  }
  return {play,setEnabled(enabled){output.gain.value=enabled?1:0;},stats:()=>({played,voices:voices.size}),dispose(){output.gain.value=0;for(const v of voices){v.source.onended=null;for(const n of v.nodes){try{n.stop?.()}catch{}n.disconnect()}}voices.clear();output.disconnect();}};
 }
 const api={create,createAudio,material,SPARKS,DUST};if(typeof module==='object')module.exports=api;else root.BlacklineImpactEffects=api;
})(typeof window==='object'?window:globalThis);
