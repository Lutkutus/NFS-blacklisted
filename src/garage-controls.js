(function(root){
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function create(){return {yaw:.74,pitch:.067,zoom:1,panX:0,panY:0,panZ:0};}
 function orbit(s,dx,dy){s.yaw=Math.atan2(Math.sin(s.yaw-dx*.008),Math.cos(s.yaw-dx*.008));s.pitch=clamp(s.pitch+dy*.006,-.1,1.2);}
 function zoom(s,delta){s.zoom=clamp(s.zoom*Math.exp(clamp(delta,-500,500)*.0015),.24,1.65);}
 function pan(s,dx,dy,distance,height){const k=2*distance*Math.tan(19*Math.PI/180)/Math.max(1,height);s.panX=clamp(s.panX-dx*k*Math.cos(s.yaw),-3,3);s.panZ=clamp(s.panZ+dx*k*Math.sin(s.yaw),-3,3);s.panY=clamp(s.panY+dy*k,-1,2);}
 function bind({canvas,state,active,change,partStart,partMove,partEnd,win=window,doc=document}){
  let pointer=null,lastX=0,lastY=0,kind;
  function release(){if(pointer===null)return;const id=pointer;pointer=null;try{canvas.releasePointerCapture(id);}catch{}if(kind==='part')partEnd?.();canvas.classList.remove('garage-dragging');}
  canvas.addEventListener('pointerdown',e=>{if(!active()||![0,2].includes(e.button)||pointer!==null)return;pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;kind=e.button===2||e.shiftKey?'pan':partStart?.(e)?'part':'orbit';canvas.setPointerCapture(pointer);canvas.classList.add('garage-dragging');e.preventDefault();});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;if(!active()||!(e.buttons&3)){release();return;}const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;if(kind==='part')partMove?.(e);else if(kind==='pan')pan(state,dx,dy,10.5*state.zoom,canvas.clientHeight);else orbit(state,dx,dy);change();e.preventDefault();});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{if(e.pointerId===pointer)release();});
  canvas.addEventListener('wheel',e=>{if(!active())return;e.preventDefault();zoom(state,e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1));change();},{passive:false});
  canvas.addEventListener('contextmenu',e=>{if(active())e.preventDefault();});win.addEventListener('blur',release);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)release();});return {release};
 }
 const api={create,orbit,zoom,pan,bind};if(typeof module==='object')module.exports=api;else root.BlacklineGarageControls=api;
})(typeof globalThis!=='undefined'?globalThis:this);
