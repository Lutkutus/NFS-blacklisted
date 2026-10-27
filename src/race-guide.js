/* Race guidance is visual; it never constrains which road or shortcut can be driven. */
(function(root){
 const angle=a=>Math.atan2(Math.sin(a),Math.cos(a)),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function heading(route,d,N){const a=N.sample(route,d-12),b=N.sample(route,d+12);return Math.atan2(b.x-a.x,b.z-a.z);}
 function turns(route,N){const found=[];
  for(let d=35;d<route.length-35;d+=8){const bend=angle(heading(route,d+24,N)-heading(route,d-24,N));if(Math.abs(bend)<.55)continue;
   const last=found.at(-1);if(last&&d-last.end<48&&Math.sign(last.bend)===Math.sign(bend)){last.end=d;if(Math.abs(bend)>Math.abs(last.bend)){last.distance=d;last.bend=bend;}}else found.push({distance:d,end:d,bend});
  }return found.map(t=>({distance:t.distance,bend:t.bend,direction:t.bend>0?'left':'right',sharp:Math.abs(t.bend)>1.65}));
 }
 function locate(route,car,passed,next){let best;
  for(let i=0;i<route.points.length-1;i++){if(route.distances[i+1]<passed-15||route.distances[i]>next+60)continue;const a=route.points[i],b=route.points[i+1],dx=b[0]-a[0],dz=b[2]-a[2],sq=dx*dx+dz*dz,t=clamp(((car.x-a[0])*dx+(car.z-a[2])*dz)/Math.max(.001,sq),0,1),y=a[1]+(b[1]-a[1])*t;if(Math.abs(car.y-y)>5)continue;const x=a[0]+dx*t,z=a[2]+dz*t,error=Math.hypot(car.x-x,car.z-z);if(!best||error<best.error){const yaw=Math.atan2(dx,dz);best={distance:route.distances[i]+Math.sqrt(sq)*t,error,lateral:(car.x-x)*Math.cos(yaw)-(car.z-z)*Math.sin(yaw),yaw,x,y,z};}}
  return best;
 }
 function describe(route,car,state,N,maneuvers,road={left:18,right:18}){
  const p=locate(route,car,state.passed,state.next);if(!p)return {status:'off-route',text:'RETURN TO THE RACE ROUTE',detail:'Follow the signs · R resets you to the route',distance:state.distance||state.passed,point:N.sample(route,state.passed)};
  const point=N.sample(route,p.distance),vx=car.vx??Math.sin(car.yaw)*car.speed,vz=car.vz??Math.cos(car.yaw)*car.speed,speed=Math.hypot(vx||0,vz||0),forward=(vx||0)*Math.sin(p.yaw)+(vz||0)*Math.cos(p.yaw),limit=p.lateral<0?road.left:road.right;
  if(p.distance>state.next+12)return {status:'missed-gate',text:'MISSED GATE',detail:'Return to the gate · R resets you before it',distance:p.distance,point:N.sample(route,state.next-18)};
  if(p.error>Math.max(18,limit+5))return {status:'off-route',text:'RETURN TO THE RACE ROUTE',detail:'Follow the signs · R resets you to the route',distance:p.distance,point};
  if(speed>4&&forward< -speed*.45&&p.error<Math.max(28,limit+5))return {status:'wrong-way',text:'WRONG WAY',detail:'Turn toward the route signs',distance:p.distance,point:N.sample(route,p.distance+40)};
  const turn=maneuvers.find(t=>t.distance>p.distance-14&&t.distance-p.distance<clamp(speed*4.5+90,150,400));
  const remaining=route.length-p.distance;
  if(remaining<110)return {status:'finish',text:'FINISH',detail:Math.max(0,Math.round(remaining))+' M',distance:p.distance,point:N.sample(route,route.length)};
  if(turn){const metres=Math.max(0,Math.round((turn.distance-p.distance)/5)*5),direction=turn.direction==='left'?'LEFT':'RIGHT';return {status:'turn',text:(turn.sharp?'SHARP ':'')+direction,detail:metres<=15?'NOW':metres+' M',direction:turn.direction,distance:p.distance,point:N.sample(route,turn.distance)};}
  return {status:'straight',text:'CONTINUE STRAIGHT',detail:Math.round(Math.max(0,state.next-p.distance))+' M TO NEXT GATE',distance:p.distance,point:N.sample(route,Math.min(route.length,p.distance+120))};
 }
 function create(T,route,N){
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-.95,0,-1.1,0,0,.05,-.95,0,-.4, 0,0,.05,0,0,.75,-.95,0,-.4, .95,0,-1.1,.95,0,-.4,0,0,.05, .95,0,-.4,0,0,.75,0,0,.05],3));
  const material=new T.MeshBasicMaterial({color:0x8ef2df,transparent:true,opacity:.78,side:T.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const mesh=new T.InstancedMesh(geometry,material,42);mesh.name='race-road-arrows';mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);const dummy=new T.Object3D();dummy.rotation.order='YXZ';let last=-Infinity;
  const maneuvers=turns(route,N);
  function update(distance,speed,world,now){if(now-last<.15)return;last=now;const spacing=10,first=Math.floor(Math.max(0,distance-10)/spacing)*spacing,horizon=clamp(160+Math.abs(speed)*3,200,400);let used=0;
   for(let i=0;i<42;i++){const d=first+i*spacing,p=N.sample(route,Math.min(route.length,d));let visible=d<=route.length&&d<=distance+horizon&&(!world.areaReady||world.areaReady(p,4));if(visible){const s=world.surface?world.surface(p):null;if(world.surface&&!s?.road)visible=false;const yaw=heading(route,d,N);dummy.position.set(p.x,(s?.y??p.y)+.085,p.z);dummy.rotation.set(-Math.atan((s?.dx||0)*Math.sin(yaw)+(s?.dz||0)*Math.cos(yaw)),yaw,Math.atan((s?.dx||0)*Math.cos(yaw)-(s?.dz||0)*Math.sin(yaw)));dummy.scale.setScalar(visible?(d<distance+65?1.25:1):0);used+=Number(visible);}else dummy.scale.setScalar(0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;return used;
  }
  return {mesh,maneuvers,update};
 }
 const api={heading,turns,locate,describe,create};if(typeof module==='object')module.exports=api;else root.BlacklineRaceGuide=api;
})(typeof globalThis!=='undefined'?globalThis:this);
