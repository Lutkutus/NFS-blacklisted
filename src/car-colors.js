/* Paint is separate from glass, lights, rubber and the source texture details. */
(function(root){
 const profiles=new WeakMap(),paintWeights=new WeakMap();
 function hex(value){if(typeof value!=='string')return null;let s=value.trim().replace(/^#/,'');if(/^[\da-f]{3}$/i.test(s))s=[...s].map(c=>c+c).join('');return /^[\da-f]{6}$/i.test(s)?'#'+s.toLowerCase():null;}
 function weights(part,data){
  if(paintWeights.has(part))return paintWeights.get(part);const result=new Float32Array(part.position.length/3);paintWeights.set(part,result);if(part.wheel)return result;
  const name=part.material||'',explicit=/paint|remap|car.?body|body.?colou?r|primary|carrosser/i.test(name);
  if(/glass|window|light|lamp|lens|signal/i.test(name))return result;if(explicit){result.fill(2);return result;}
  if(/glass|window|light|lamp|chrome|rubber|interior|seat|bottom|exhaust|engine|tire|tyre|wheel|signal|plate|brake|lens|badge|logo|grill|reflect|dash|steer|carbon|matte|freio/i.test(name))return result;
  let profile=profiles.get(data);if(!profile){let height=0;for(const p of data.parts)if(!p.wheel)for(let i=1;i<p.position.length;i+=3)height=Math.max(height,p.position[i]);const wheels=Object.values(data.wheels);profile={height,front:Math.max(...wheels.map(w=>w.center[2])),rear:Math.min(...wheels.map(w=>w.center[2]))};profiles.set(data,profile);}
  // Atlas-based cars share a material across panels and windows. Mark panels
  // geometrically instead of tinting their entire texture atlas.
  const pos=part.position,index=part.index||Array.from({length:result.length},(_,i)=>i),seen=new Uint8Array(result.length);result.fill(2);
  for(let k=0;k<index.length;k+=3){const ids=[index[k],index[k+1],index[k+2]],p=ids.map(i=>pos.subarray?pos.subarray(i*3,i*3+3):pos.slice(i*3,i*3+3)),y=(p[0][1]+p[1][1]+p[2][1])/3,z=(p[0][2]+p[1][2]+p[2][2])/3,ax=p[1][0]-p[0][0],ay=p[1][1]-p[0][1],az=p[1][2]-p[0][2],bx=p[2][0]-p[0][0],by=p[2][1]-p[0][1],bz=p[2][2]-p[0][2],nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx,len=Math.hypot(nx,ny,nz)||1,up=Math.abs(ny)/len,side=Math.abs(nx)/len;
   const panel=y>.12&&((side>.65&&y<profile.height*.62)||(up>.8&&y>profile.height*.88)||(up>.65&&y<profile.height*.78&&(z>profile.front*.7||z<profile.rear*.7))||y<profile.height*.38);
   const mask=panel?2:(side>.65&&y<profile.height*.9&&y>.12?1:0);for(const i of ids){seen[i]=1;result[i]=Math.min(result[i],mask);}
  }for(let i=0;i<result.length;i++)if(!seen[i])result[i]=0;return result;
 }
 function body(T,mat,config,desc){
  if(config.paint!=='custom'||!hex(config.color))return;
  const color=new T.Color(hex(config.color)),source=desc.color||[1,1,1],reference=desc.texture?.45:Math.max(.03,source[0]*.2126+source[1]*.7152+source[2]*.0722),previous=mat.onBeforeCompile;
  mat.onBeforeCompile=shader=>{previous?.(shader);shader.uniforms.carUserPaint={value:color};shader.uniforms.carPaintReference={value:reference};shader.vertexShader='attribute float carPaint; varying float vCarPaint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCarPaint=carPaint;');shader.fragmentShader='uniform vec3 carUserPaint; uniform float carPaintReference; varying float vCarPaint;\n'+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat paintDetail=clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))/carPaintReference,.12,1.6);\nfloat paintPixel=smoothstep(.25,.5,dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)));float paintMask=clamp(vCarPaint,0.,1.)*mix(paintPixel,1.,step(1.5,vCarPaint));diffuseColor.rgb=mix(diffuseColor.rgb,carUserPaint*paintDetail,paintMask);');};
  const cache=mat.customProgramCacheKey?.bind(mat);mat.customProgramCacheKey=()=>String(cache?.()||'')+'-custom-car-paint';mat.userData.paintColor=hex(config.color);
 }
 function rim(T,mat,color){
  color=hex(color);if(!color)return;mat.color.set(color);const previous=mat.onBeforeCompile;
  mat.onBeforeCompile=shader=>{previous?.(shader);shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
   vec4 wheelTexel=texture2D(map,vMapUv);
   diffuseColor*=vec4(vec3(dot(wheelTexel.rgb,vec3(.2126,.7152,.0722))),wheelTexel.a);
   #endif`);};mat.customProgramCacheKey=()=> 'custom-rim-paint';mat.userData.rimColor=color;
 }
 const api={hex,weights,body,rim};if(typeof module==='object')module.exports=api;else root.BlacklineCarColors=api;
})(typeof window==='object'?window:globalThis);
