/* Right-drag orbit for the chase camera. Does not change driving input. */
(function(root){
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
 function create(){return {held:false,yaw:0,pitch:0,targetYaw:0,targetPitch:0,weight:0};}
 function reset(s){Object.assign(s,create());}
 function begin(s){s.held=true;s.targetYaw=s.yaw;s.targetPitch=s.pitch;}
 function move(s,dx,dy){if(!s.held||!Number.isFinite(dx)||!Number.isFinite(dy))return;s.targetYaw=angle(s.targetYaw-dx*.006);s.targetPitch=clamp(s.targetPitch+dy*.004,-.22,.85);}
 function end(s){s.held=false;s.targetYaw=0;s.targetPitch=0;}
 function step(s,dt){if(!Number.isFinite(dt)||dt<=0)return;const rate=s.held?16:6,f=1-Math.exp(-rate*dt);s.yaw=angle(s.yaw+angle(s.targetYaw-s.yaw)*f);s.pitch+=(s.targetPitch-s.pitch)*f;s.weight+=((s.held?1:0)-s.weight)*f;if(!s.held&&Math.abs(s.yaw)+Math.abs(s.pitch)+s.weight<.0001)reset(s);}
 function pose(s,car,mode=0){const distance=mode===0?7:15,height=mode===0?3.1:8,radius=Math.hypot(distance,height-1.1),pitch=clamp(Math.atan2(height-1.1,distance)+s.pitch,.06,1.2),horizontal=Math.cos(pitch)*radius,yaw=car.yaw+s.yaw,lead=4*(1-s.weight);
  return {position:{x:car.x-Math.sin(yaw)*horizontal,y:car.y+1.1+Math.sin(pitch)*radius,z:car.z-Math.cos(yaw)*horizontal},target:{x:car.x+Math.sin(car.yaw)*lead,y:car.y+1.1,z:car.z+Math.cos(car.yaw)*lead}};
 }
 function bind(s,canvas,active,win=window,doc=document){let pointer=null,x=0,y=0;
  function release(){const id=pointer;pointer=null;end(s);if(id!==null&&canvas.hasPointerCapture?.(id))try{canvas.releasePointerCapture(id);}catch{/* Capture may already be gone after focus changes. */}}
  canvas.addEventListener('pointerdown',e=>{if(e.button!==2||!active()||e.pointerType&&e.pointerType!=='mouse')return;e.preventDefault();pointer=e.pointerId;x=e.clientX;y=e.clientY;begin(s);try{canvas.setPointerCapture(e.pointerId);}catch{/* Window listeners still release the button. */}});
  win.addEventListener('pointermove',e=>{if(pointer===null||e.pointerId!==pointer)return;if(!active()||!(e.buttons&2)){release();return;}move(s,e.clientX-x,e.clientY-y);x=e.clientX;y=e.clientY;});
  win.addEventListener('pointerup',e=>{if(e.pointerId===pointer&&(e.button===2||!(e.buttons&2)))release();});
  win.addEventListener('pointercancel',e=>{if(e.pointerId===pointer)release();});
  canvas.addEventListener('lostpointercapture',e=>{if(e.pointerId===pointer)release();});
  canvas.addEventListener('contextmenu',e=>{if(active()||s.held)e.preventDefault();});
  win.addEventListener('blur',release);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)release();});
  return {release};
 }
 const api={create,reset,begin,move,end,step,pose,bind};if(typeof module==='object')module.exports=api;else root.BlacklineDriveCamera=api;
})(typeof globalThis!=='undefined'?globalThis:this);
