/* Full city map. Coordinates use the streamed world's X/Z axes, independent of the schematic reference. */
(function(root){
  'use strict';
  function create({data,onClose,onNavigate,onClear,onTeleport}){
    const $=id=>document.getElementById(id),panel=$('world-map'),canvas=$('city-map'),ctx=canvas.getContext('2d');
    const roads=new Image(),reference=new Image();roads.src=data.roadImage;
    $('map-availability-note').textContent=data.garages.some(g=>!g.available)?'Closed garages have no drivable road connection.':'All three garages are available.';
    let state=null,selected=null,referenceMode=false,zoom=1,cx=0,cy=0,w=1,h=1,drag=null,focusBefore=null;
    const bounds=data.bounds,ww=bounds.maxX-bounds.minX,wh=bounds.maxZ-bounds.minZ;
    const symbol=m=>m.kind==='garage'?'G':m.kind==='dealer'?'A':m.kind==='tuning'?'T':m.kind==='landmark'?'◆':m.number||'K';
    const scale=()=>Math.min((w-50)/ww,(h-50)/wh)*zoom;
    const xy=p=>({x:w/2+(p.x-cx)*scale(),y:h/2+(p.z-cy)*scale()});
    function fit(){zoom=1;cx=(bounds.minX+bounds.maxX)/2;cy=(bounds.minZ+bounds.maxZ)/2;draw();}
    function resize(){const r=canvas.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw();}
    function line(points,color,width){if(!points?.length)return;ctx.beginPath();points.forEach((p,i)=>{const q=xy({x:p[0],z:p[2]});i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke();}
    function draw(){
      if(!state)return;
      ctx.fillStyle='#151e1c';ctx.fillRect(0,0,w,h);
      if(referenceMode){if(reference.complete&&reference.naturalWidth){const s=Math.min(w/reference.width,h/reference.height);ctx.drawImage(reference,(w-reference.width*s)/2,(h-reference.height*s)/2,reference.width*s,reference.height*s);}return;}
      const p=xy({x:bounds.minX,z:bounds.minZ}),s=scale();
      ctx.strokeStyle='#25312c';ctx.lineWidth=1;
      for(let x=Math.ceil(bounds.minX/500)*500;x<bounds.maxX;x+=500){const q=xy({x,z:0});ctx.beginPath();ctx.moveTo(q.x,0);ctx.lineTo(q.x,h);ctx.stroke();}
      for(let z=Math.ceil(bounds.minZ/500)*500;z<bounds.maxZ;z+=500){const q=xy({x:0,z});ctx.beginPath();ctx.moveTo(0,q.y);ctx.lineTo(w,q.y);ctx.stroke();}
      if(roads.complete&&roads.naturalWidth)ctx.drawImage(roads,p.x,p.y,ww*s,wh*s);
      ctx.font='700 12px monospace';ctx.textAlign='center';ctx.fillStyle='#83967e';
      for(const label of data.labels){const q=xy(label);ctx.fillText(label.name,q.x,q.y);}
      line(state.race?.points,'#eaba61',3);line(state.waypoint?.route.points,'#7ae4de',3);
      for(const m of state.markers){const q=xy(m),isSelected=selected===m;
        ctx.fillStyle=m.available===false?'#6c7470':m.kind==='garage'?'#b7e979':m.kind==='dealer'?'#8acde1':m.kind==='tuning'?'#d0a4f0':'#eaba61';
        ctx.strokeStyle=isSelected?'#fff6cf':'#111b18';ctx.lineWidth=isSelected?3:2;ctx.beginPath();ctx.arc(q.x,q.y,isSelected?13:10,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.fillStyle='#13201a';ctx.font='bold 11px monospace';ctx.fillText(symbol(m),q.x,q.y+4);
      }
      const q=xy(state.player);ctx.save();ctx.translate(q.x,q.y);ctx.rotate(-state.player.yaw);ctx.fillStyle='#fff8d3';ctx.strokeStyle='#15211e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,12);ctx.lineTo(-7,-8);ctx.lineTo(0,-4);ctx.lineTo(7,-8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
      ctx.textAlign='left';ctx.font='11px monospace';ctx.fillStyle='#e4e3b5';ctx.fillText('N ↑  /  '+Math.round(100/s)+' m',18,h-20);ctx.fillRect(18,h-14,100,2);
    }
    function select(m){selected=m;$('map-destination').textContent=m?m.label:'SELECT DESTINATION';$('map-description').textContent=m?(m.available===false?m.reason:m.kind==='garage'?'Green house · Stop at the entrance and press E.':m.kind==='dealer'?'Dealership · Stop and press E.':m.kind==='tuning'?'Tuning Garage · Customization and performance tuning. Drive to the purple entry marker and press E.':m.kind==='landmark'?'Road access point · Follow the blue GPS route.':'Sprint start · Stop and press E.'):'Choose a destination on the map or in the list.';$('map-navigate').disabled=!m||m.available===false||!!state.race;$('map-teleport').disabled=!m||m.available===false||!state.canTeleport;$('map-teleport').textContent=state.canTeleport?'FAST TRAVEL':'FAST TRAVEL LOCKED';$('map-teleport').title=state.canTeleport?'Travel to a safe road near the destination.':'Unavailable during a race or pursuit.';$('map-reference').setAttribute('aria-pressed',String(referenceMode));draw();}
    function changeZoom(f,x=w/2,y=h/2){if(referenceMode)return;const old=scale(),wx=cx+(x-w/2)/old,wz=cy+(y-h/2)/old;zoom=Math.max(.65,Math.min(8,zoom*f));cx=wx-(x-w/2)/scale();cy=wz-(y-h/2)/scale();draw();}
    $('map-teleport').onclick=async()=>{
      if(!selected||selected.available===false||!state?.canTeleport)return;
      $('map-teleport').disabled=true;
      try{const result=await onTeleport(selected);if(state&&result?.error)$('map-description').textContent=result.error;}
      catch(e){if(state)$('map-description').textContent='Travel failed: '+e.message;}
      finally{if(state)$('map-teleport').disabled=!selected||selected.available===false||!state.canTeleport;}
    };
    $('map-close').onclick=onClose;$('map-fit').onclick=fit;
    $('map-player').onclick=()=>{referenceMode=false;cx=state.player.x;cy=state.player.z;zoom=3;select(selected);};
    $('map-plus').onclick=()=>changeZoom(1.35);$('map-minus').onclick=()=>changeZoom(1/1.35);
    $('map-reference').onclick=()=>{referenceMode=!referenceMode;if(referenceMode&&!reference.src)reference.src=data.referenceImage;select(selected);};
    $('map-navigate').onclick=()=>{if(!selected||selected.available===false||state.race)return;const result=onNavigate(selected);if(result.error){$('map-description').textContent=result.error;return;}state.waypoint=result;$('map-description').textContent=`GPS ROUTE ${(result.route.length/1000).toFixed(1)} km · Close the map and follow the blue line.`;draw();};
    $('map-clear').onclick=()=>{onClear();state.waypoint=null;$('map-description').textContent='GPS route cleared.';draw();};
    canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();changeZoom(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});
    canvas.onpointerdown=e=>{if(e.button!==0||referenceMode)return;canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,cx,cy,moved:false};};
    canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;cx=drag.cx-dx/scale();cy=drag.cy-dy/scale();draw();};
    canvas.onpointerup=e=>{if(!drag)return;const moved=drag.moved;drag=null;if(moved)return;const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const found=state.markers.map(m=>({m,d:Math.hypot(xy(m).x-x,xy(m).y-y)})).filter(a=>a.d<20).sort((a,b)=>a.d-b.d)[0];select(found?.m||null);};
    canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null;};
    roads.onload=reference.onload=draw;addEventListener('resize',()=>{if(!panel.hidden)resize();});
    panel.addEventListener('keydown',e=>{if(e.code!=='Tab')return;const nodes=[...panel.querySelectorAll('button:not(:disabled)')],first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
    return {focus(id){const m=state?.markers.find(m=>m.id===id);if(!m)return;referenceMode=false;cx=m.x;cy=m.z;zoom=Math.max(zoom,2);select(m);},open(next){state=next;selected=null;referenceMode=false;focusBefore=document.activeElement;panel.hidden=false;
      $('map-context').textContent=state.race?'RACE PAUSED WHILE MAP IS OPEN':'G GARAGE  /  T TUNING GARAGE  /  A DEALERSHIP  /  ◆ AREAS  /  NUMBERS: RACES';
      $('map-locations').replaceChildren(...state.markers.map(m=>{const b=document.createElement('button');b.textContent=symbol(m)+' / '+m.label+(m.available===false?' · CLOSED':'');b.onclick=()=>{referenceMode=false;select(m);cx=m.x;cy=m.z;draw();};return b;}));
      resize();fit();select(null);$('map-close').focus();},close(){panel.hidden=true;drag=null;state=null;focusBefore?.focus?.();},resize};
  }
  root.BlacklineWorldMapUI={create};
})(window);
