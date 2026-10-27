/* Shared chassis simulation: player, race opponents and police use this path. */
(function(root){
 'use strict';
 const C=typeof module==='object'?require('./core.js'):root.RacingCore,P=typeof module==='object'?require('./rockport-physics.js'):root.RockportPhysics,N=typeof module==='object'?require('./rockport-navigation.js'):root.RockportNavigation;
 const angle=n=>Math.atan2(Math.sin(n),Math.cos(n)),clamp=C.clamp,GRAVITY=9.81;
 function reset(car,pose){Object.assign(car,pose,{speed:0,vx:0,vz:0,vy:0,steer:0,boost:false,grounded:true,settled:false,airTime:0,pitch:0,roll:0,groundSlope:0,aiBoostRest:0,aiBoostFor:0,aiTrafficSpeed:Infinity,aiTimer:0,aiLane:0,aiLaneOffset:0,aiBlocked:false,wallContact:null,hit:false,waiting:false,wheelsOnGround:0,groundEffect:0,lastGroundY:pose.y,jumpHeight:0,landingAvailable:false});car.previous={x:car.x,y:car.y,z:car.z,yaw:car.yaw};return car}
 function create(pose,{vehicle='skyline',stage=0,setup={},box}={}){
  return reset({vehicle,stage,setup,box:box||{width:1.8,length:4.5,height:1.05,bottom:.18},nitro:100,boost:false},pose);
 }
 function slope(cells,car){
  const dx=Math.sin(car.yaw),dz=Math.cos(car.yaw),a=P.surface(cells,car.x+dx,car.z+dz,car.y,1.2,1.2),b=P.surface(cells,car.x-dx,car.z-dz,car.y,1.2,1.2);
  return clamp(a&&b?(a.y-b.y)/2:a?a.y-car.y:b?car.y-b.y:(car.groundSlope||0),-.8,.8);
 }
 const pose=car=>({x:car.x,y:car.y,z:car.z,yaw:car.yaw,pitch:car.pitch||0,roll:car.roll||0}),CURB=.26;
 // Four tire contact probes, rather than a single ray under the body. The
 // fallback plane is only used when an axle/side straddles a mesh seam/edge.
 // References: SuspensionRacerMW::DoWheelForces and ChassisMW::DoJumpStabilizer.
 // This is an independent reduced model; its units and coefficients are local.
 function wheelGround(cells,car,reference,rise,drop){
  const fwd=[Math.sin(car.yaw),Math.cos(car.yaw)],right=[fwd[1],-fwd[0]],halfBase=car.box.length*.32,halfTrack=car.box.width*.40,grade=clamp(car.groundSlope||0,-.8,.8),bank=clamp(Math.tan(car.roll||0),-.6,.6),contacts=[];
  for(const end of [-1,1])for(const side of [-1,1]){
   const f=end*halfBase,r=side*halfTrack,x=car.x+fwd[0]*f+right[0]*r,z=car.z+fwd[1]*f+right[1]*r;
   const top=P.surface(cells,x,z,reference+grade*f+bank*r,rise,drop);
   if(top)contacts.push({...top,f,r});
  }
  const center=P.surface(cells,car.x,car.z,reference,rise,drop);
  if(!contacts.length)return center?{...center,count:0,grade:center.dx*fwd[0]+center.dz*fwd[1],bank:center.dx*right[0]+center.dz*right[1]}:null;
  if(contacts.length<2&&!center)return null;
  const average=list=>list.reduce((n,p)=>n+p.y,0)/list.length,front=contacts.filter(p=>p.f>0),rear=contacts.filter(p=>p.f<0),left=contacts.filter(p=>p.r<0),rightSide=contacts.filter(p=>p.r>0);
  const g=front.length&&rear.length?clamp((average(front)-average(rear))/(2*halfBase),-.8,.8):contacts.reduce((n,p)=>n+p.dx*fwd[0]+p.dz*fwd[1],0)/contacts.length,b=left.length&&rightSide.length?clamp((average(rightSide)-average(left))/(2*halfTrack),-.6,.6):contacts.reduce((n,p)=>n+p.dx*right[0]+p.dz*right[1],0)/contacts.length;
  const y=contacts.reduce((n,p)=>n+p.y-g*p.f-b*p.r,0)/contacts.length;
  return {y,grade:g,bank:b,count:contacts.length,road:contacts.every(p=>p.road)&&(!center||center.road)};
 }
 function landingGravity(car,altitude){
  // MW adds 3 m/s² in flight, with extra landing assistance after a long jump.
  // Do not turn this into magnetic ground snapping: the chassis still sweeps
  // through a real tire contact height before landing.
  let extra=3;
  if(car.airTime>1&&car.jumpHeight>2&&car.vy<0&&altitude!==null&&altitude<6&&Math.cos(car.pitch)*Math.cos(car.roll)>.96)extra+=(1-clamp(altitude/6,0,1))*10*clamp(Math.hypot(car.vx,car.vz)/20,0,1);
  return GRAVITY+extra;
 }
 function wallResponse(car,hit,dt){
  // Remove only velocity INTO the wall. Outward and tangential motion survive.
  const closing=Math.min(0,car.vx*hit.nx+car.vz*hit.nz),sign=Math.sign(car.vx*Math.sin(car.yaw)+car.vz*Math.cos(car.yaw))||Math.sign(car.speed)||1;
  car.vx-=hit.nx*closing;car.vz-=hit.nz*closing;
  const friction=Math.exp(-.12*dt);car.vx*=friction;car.vz*=friction;
  car.speed=Math.hypot(car.vx,car.vz)*sign;car.hit=true;
 }
 function curbSupport(cells,car,support,grade){
  const forward=[Math.sin(car.yaw),Math.cos(car.yaw)],right=[forward[1],-forward[0]],bank=Math.tan(car.roll||0);let lift=0;
  for(const side of [-1,1])for(const end of [-1,1]){
   const f=end*car.box.length*.48,r=side*car.box.width*.48,x=car.x+forward[0]*f+right[0]*r,z=car.z+forward[1]*f+right[1]*r,expected=support.y+grade*f+bank*r;
   const top=P.stepSurface(cells,x,z,expected,CURB);if(top)lift=Math.max(lift,top.y-expected);
  }
  return lift?{...support,y:support.y+lift}:support;
 }
 function tryCurb(cells,car,old,target,hit){
  const dx=hit.x-old.x,dz=hit.z-old.z,expected=old.y+(car.groundSlope||0)*(dx*Math.sin(old.yaw)+dz*Math.cos(old.yaw))+Math.tan(old.roll||0)*(dx*Math.cos(old.yaw)-dz*Math.sin(old.yaw));
  if(!car.grounded||(hit.localMaxY??hit.maxY)>expected+CURB+.015)return false;
  const top=P.stepSurface(cells,hit.x-hit.nx*.12,hit.z-hit.nz*.12,expected,CURB);if(!top)return false;
  const rise=top.y-expected+.015,start={...old,y:old.y+rise},end={...target,y:target.y+rise,box:car.box};
  if(P.boxHit(cells,start,car.box)||P.sweepBox(cells,end,start))return false;
  Object.assign(car,pose(end));car.vy=0;return true;
 }
 function moveBody(cells,car,old,input,dt){
  let start=old,target=pose(car),lastHit=null;
  for(let pass=0;pass<4;pass++){
   Object.assign(car,target);const hit=P.sweepBox(cells,car,start);if(!hit)break;
   if(tryCurb(cells,car,start,target,hit))break;
   lastHit=hit;wallResponse(car,hit,dt/4);
   const safe=pose(car),dx=target.x-safe.x,dz=target.z-safe.z,into=Math.min(0,dx*hit.nx+dz*hit.nz);
   for(const skin of [.008,.025,.06,.12]){
    const out={...safe,x:safe.x+hit.nx*skin,z:safe.z+hit.nz*skin},next=P.boxHit(cells,out,car.box);
    if(!next||next.nx*hit.nx+next.nz*hit.nz<.95){Object.assign(car,out);break;}
   }
   start=pose(car);target={...start,x:start.x+dx-hit.nx*into,z:start.z+dz-hit.nz*into};
   if(Math.hypot(target.x-start.x,target.z-start.z)<1e-6)break;
  }
  if(lastHit)car.wallContact={nx:lastHit.nx,nz:lastHit.nz,left:.25};
  else if(car.wallContact){car.wallContact.left-=dt;if(car.wallContact.left<=0)car.wallContact=null;}
  const contact=lastHit||car.wallContact;
  if(contact){
   const speed=Math.hypot(car.vx,car.vz),nose=Math.sin(car.yaw)*contact.nx+Math.cos(car.yaw)*contact.nz,facing=Math.abs(nose);
   // Gentle wall alignment during a scrape, plus a low-speed nose escape with
   // throttle + steering. Inspired by MW's wall-steer concept, implemented here.
   let turn=0;
   if(lastHit&&speed>5&&facing<.75){const yaw=Math.atan2(car.vx,car.vz)+(car.speed<0?Math.PI:0),change=angle(yaw-car.yaw);if(!input.steer||change*-input.steer>=0)turn=clamp(change,-dt*1.2,dt*1.2);}
   else if(speed<4&&nose<-.7&&car.grounded&&input.throttle&&Math.abs(input.steer)>.75)turn=-input.steer*dt*.75;
   if(turn){const turned={...pose(car),yaw:car.yaw+turn};
    if(!P.boxHit(cells,turned,car.box))car.yaw=turned.yaw;
    else if(speed<4){const cleared={...turned,x:turned.x+contact.nx*.015,z:turned.z+contact.nz*.015};if(!P.boxHit(cells,cleared,car.box))Object.assign(car,cleared);}
   }
  }
  return lastHit;
 }
 function step(car,input,dt,world){
  if(!Number.isFinite(dt)||dt<=0)return car;
  const cells=typeof world.cells==='function'?world.cells():world.cells;
  // Route samples interpolate between graph heights; settle a new spawn once.
  // Flight never uses this correction, so bridge decks cannot pull cars upward.
  if(car.grounded&&!car.settled){const floor=P.surface(cells,car.x,car.z,car.y,1.5,3);if(floor){car.y=floor.y;car.settled=true;}}
  car.previous=pose(car);car.stepDt=dt;car.hit=false;car.landed=false;car.waiting=false;
  const count=Math.ceil(dt/(1/120)),h=dt/count;
  for(let j=0;j<count;j++){
   const old={x:car.x,y:car.y,z:car.z,yaw:car.yaw,pitch:car.pitch,roll:car.roll,vy:car.vy},grounded=car.grounded,grade=grounded?slope(cells,car):0;
   if(grounded)car.groundSlope=grade;
   if(grounded){
    if(input.throttle||input.brake||Math.abs(car.speed)>.6)car.speed-=GRAVITY*grade*h;
    else {car.speed=0;car.vx=0;car.vz=0;}
    C.drive(car,input,h,car.stage,car.vehicle,car.setup);
   }else{
    // Airborne tires cannot accelerate, steer or brake the chassis.
    car.boost=false;car.x+=car.vx*h;car.z+=car.vz*h;
   }
   if(world.ready&&!world.ready(car)){Object.assign(car,old,{speed:0,vx:0,vz:0,waiting:true});break}
   const travel=Math.hypot(car.x-old.x,car.z-old.z);let support=wheelGround(cells,car,old.y,.26+travel*.65,.45+travel*.65);
   if(grounded&&support)support=curbSupport(cells,car,support,grade);
   const launchY=old.y+car.vy*h-GRAVITY*h*h;
   if(grounded&&support&&!(Math.abs(car.speed)>8&&support.y<launchY-.18)){
    car.y=support.y;car.vy=support.grade*(car.vx*Math.sin(car.yaw)+car.vz*Math.cos(car.yaw));car.airTime=0;car.jumpHeight=0;car.lastGroundY=car.y;car.wheelsOnGround=support.count;car.groundEffect=support.count/4;car.groundSlope=support.grade;
    // Supported shortcuts keep the same drivetrain response as asphalt.
    // Surface road tags describe navigation, not an artificial speed limiter.
    car.pitch+=(Math.atan(support.grade)-car.pitch)*(1-Math.exp(-12*h));
    car.roll+=(Math.atan(support.bank)-car.roll)*(1-Math.exp(-12*h));
   }else{
    car.grounded=false;car.wheelsOnGround=0;car.groundEffect=0;
    const below=wheelGround(cells,car,old.y,0,60),altitude=below?Math.max(0,old.y-below.y):null;car.landingAvailable=!!below;car.jumpHeight=Math.max(car.jumpHeight||0,altitude||0);
    car.vy-=landingGravity(car,altitude)*h;car.y=old.y+car.vy*h;car.airTime+=h;
    // Stabilize toward the landing plane instead of pitching down with the
    // velocity vector. Tire inputs never redirect an airborne chassis.
    const proximity=altitude===null?0:1-clamp(altitude/15,0,1),stabilize=clamp(Math.hypot(car.vx,car.vz)/5,0,1)*proximity;
    car.pitch+=((below?Math.atan(below.grade):0)-car.pitch)*(1-Math.exp(-(1.4+4*stabilize)*h));
    car.roll+=((below?Math.atan(below.bank):0)-car.roll)*(1-Math.exp(-(1+3*stabilize)*h));
    const landing=wheelGround(cells,car,old.y+.035,0,Math.max(.1,old.y-car.y+.04));
    if(car.vy<=0&&landing&&car.y<=landing.y&&old.y>=landing.y-.035){
     const impact=-car.vy;car.y=landing.y;car.vy=0;car.grounded=true;car.airTime=0;car.landed=true;car.lastGroundY=car.y;car.jumpHeight=0;car.wheelsOnGround=landing.count;car.groundEffect=landing.count/4;car.groundSlope=landing.grade;
     const damping=1-clamp((impact-4)/70,0,.3);car.speed*=damping;car.vx*=damping;car.vz*=damping;
    }
    // Floors also have a solid underside when a rising chassis reaches them.
    if(!car.grounded&&car.vy>0){const top=car.y+car.box.bottom+car.box.height,oldTop=old.y+car.box.bottom+car.box.height,ceiling=P.surface(cells,car.x,car.z,top,0,Math.max(.01,top-oldTop));if(ceiling&&ceiling.y>=oldTop&&ceiling.y<=top){car.y=ceiling.y-car.box.bottom-car.box.height-.01;car.vy=0;}}
   }
   moveBody(cells,car,old,input,h);world.breakProps?.(car,old);
  }
  return car;
 }
 function overlap(a,b){
  const ab=a.box,bb=b.box;if(a.y+ab.bottom+ab.height<=b.y+bb.bottom||b.y+bb.bottom+bb.height<=a.y+ab.bottom)return null;
  const axes=[[Math.cos(a.yaw),-Math.sin(a.yaw)],[Math.sin(a.yaw),Math.cos(a.yaw)],[Math.cos(b.yaw),-Math.sin(b.yaw)],[Math.sin(b.yaw),Math.cos(b.yaw)]];let best=null;
  for(const [nx,nz]of axes){
   const radius=(p,box)=>Math.abs(nx*Math.cos(p.yaw)-nz*Math.sin(p.yaw))*box.width/2+Math.abs(nx*Math.sin(p.yaw)+nz*Math.cos(p.yaw))*box.length/2;
   const delta=(b.x-a.x)*nx+(b.z-a.z)*nz,depth=radius(a,ab)+radius(b,bb)-Math.abs(delta);if(depth<=0)return null;
   if(!best||depth<best.depth)best={nx:nx*(delta>=0?1:-1),nz:nz*(delta>=0?1:-1),depth};
  }return best;
 }
 function collide(actors,world){
  const before=new Map(actors.map(p=>[p,pose(p)])),changed=new Set();
  for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){
   const a=actors[i],b=actors[j],ap=a.previous||a,bp=b.previous||b,relative=Math.hypot((a.x-ap.x)-(b.x-bp.x),(a.z-ap.z)-(b.z-bp.z)),steps=Math.max(1,Math.ceil(relative/.25));let contact=null;
   for(let k=0;k<=steps;k++){
    const f=k/steps,at=(p,prev)=>({...p,x:prev.x+(p.x-prev.x)*f,y:prev.y+(p.y-prev.y)*f,z:prev.z+(p.z-prev.z)*f,yaw:prev.yaw+angle(p.yaw-prev.yaw)*f}),aa=at(a,ap),ba=at(b,bp),hit=overlap(aa,ba);
    if(hit){contact={hit,aa,ba,f};break}
   }
   if(!contact)continue;const {hit,aa,ba}=contact;
   a.x=aa.x-hit.nx*(hit.depth/2+.01);a.z=aa.z-hit.nz*(hit.depth/2+.01);b.x=ba.x+hit.nx*(hit.depth/2+.01);b.z=ba.z+hit.nz*(hit.depth/2+.01);
   const relativeVelocity=(b.vx-a.vx)*hit.nx+(b.vz-a.vz)*hit.nz;
   if(relativeVelocity<0){const impulse=-relativeVelocity*.55;a.vx-=hit.nx*impulse;a.vz-=hit.nz*impulse;b.vx+=hit.nx*impulse;b.vz+=hit.nz*impulse;}
   const remaining=Math.max(a.stepDt||0,b.stepDt||0)*(1-contact.f);
   for(const p of [a,b]){p.x+=p.vx*remaining;p.z+=p.vz*remaining;p.speed=p.vx*Math.sin(p.yaw)+p.vz*Math.cos(p.yaw);p.hit=true;changed.add(p);}
  }
  // Only validate displacements introduced by car-to-car contact. Replaying the
  // entire frame as one diagonal used to undo valid piecewise wall sliding.
  if(world){const cells=typeof world.cells==='function'?world.cells():world.cells;for(const p of changed)moveBody(cells,p,before.get(p),{},p.stepDt||1/60);}
 }
 function aiInput(car,route,distance=0,world=null,dt=1/60){
  // Follow a physical stretch of road, rather than the heading of one short
  // navigation edge. More preview at speed keeps pursuit steering stable.
  const roadPoint=d=>{d=clamp(d,0,route.length);const p=N.sample(route,d),a=N.sample(route,Math.max(0,d-6)),b=N.sample(route,Math.min(route.length,d+6));p.yaw=Math.atan2(b.x-a.x,b.z-a.z);return p;};
  const spec=C.tune(car.stage,car.vehicle,car.setup),look=clamp(Math.abs(car.speed)*.45+8,8,42),target=roadPoint(distance+look),far=roadPoint(distance+look+20);
  // Route lines were validated for the older point collider. Look for a clear
  // lane with this car's full chassis instead of driving through roadside props.
  if(world){
   car.aiTimer=(car.aiTimer||0)-dt;
   if(car.aiTimer<=0){
    car.aiTimer=.2;const cells=typeof world.cells==='function'?world.cells():world.cells;let best=null;
    const traffic=(world.actors||[]).filter(a=>a!==car&&Math.abs(a.y-car.y)<3).map(a=>({car:a,forward:(a.x-car.x)*Math.sin(car.yaw)+(a.z-car.z)*Math.cos(car.yaw),lateral:(a.x-car.x)*Math.cos(car.yaw)-(a.z-car.z)*Math.sin(car.yaw)+(car.aiLaneOffset||0)})).filter(a=>a.forward>0&&a.forward<38),leader=traffic.find(a=>Math.abs(a.lateral-(car.aiLaneOffset||0))<2.5);
    car.aiTrafficSpeed=leader&&leader.forward<12&&Math.abs(car.aiLaneOffset||0)<2?Math.max(4,leader.car.speed*.85):Infinity;
    for(const lane of [0,-3.2,3.2,-6.4,6.4]){
     if(traffic.some(a=>Math.abs(a.lateral-lane)<2.5))continue;
     let clear=true;
     for(const d of [.5,3,7,12,Math.max(16,look)]){
      const p=d<1?{x:car.x+Math.sin(car.yaw)*d,y:car.y,z:car.z+Math.cos(car.yaw)*d,yaw:car.yaw}:roadPoint(distance+d);const offset=d<1?lane-(car.aiLaneOffset||0):lane;p.x+=Math.cos(p.yaw)*offset;p.z-=Math.sin(p.yaw)*offset;
      const floor=P.surface(cells,p.x,p.z,p.y,1.5,3);if(!floor?.road){clear=false;break}p.y=floor.y;
      const ahead=P.surface(cells,p.x+Math.sin(p.yaw),p.z+Math.cos(p.yaw),p.y,1.2,1.2),behind=P.surface(cells,p.x-Math.sin(p.yaw),p.z-Math.cos(p.yaw),p.y,1.2,1.2);p.pitch=ahead&&behind?Math.atan2(ahead.y-behind.y,2):car.pitch;p.roll=car.roll;
      if(P.boxHit(cells,p,car.box)){clear=false;break}
     }
     const score=Math.abs(lane)+Math.abs(lane-(car.aiLane||0))*.35+(!lane&&car.aiLane&&distance<(car.aiAvoidUntil||0)?6:0);
     if(clear&&(!best||score<best.score))best={lane,score};
    }
    const nextLane=best?.lane??car.aiLane??0;if(nextLane&&nextLane!==car.aiLane)car.aiAvoidUntil=distance+30;
    car.aiLane=nextLane;car.aiBlocked=!best;
   }
   car.aiLaneOffset=(car.aiLaneOffset||0)+clamp((car.aiLane||0)-(car.aiLaneOffset||0),-dt*2,dt*2);
   target.x+=Math.cos(target.yaw)*car.aiLaneOffset;target.z-=Math.sin(target.yaw)*car.aiLaneOffset;
  }
  const dx=target.x-car.x,dz=target.z-car.z,error=angle(Math.atan2(dx,dz)-car.yaw),curvature=Math.abs(angle(far.yaw-target.yaw))/20;
  const lateralGrip=clamp(spec.grip*.9,6.5,10);
  let plannedSpeed=Math.min(spec.max*.99,car.aiTrafficSpeed??Infinity);
  for(const ahead of [6,12,20,35,55,85,130,180]){
   const a=roadPoint(distance+ahead-6),b=roadPoint(distance+ahead+6),bend=Math.abs(angle(b.yaw-a.yaw))/12,cornerSpeed=Math.sqrt(lateralGrip/Math.max(.00001,bend));
   // Leave room for tire slip and steering response on narrow city bends.
   plannedSpeed=Math.min(plannedSpeed,Math.sqrt(cornerSpeed*cornerSpeed+2*spec.brakes*.8*Math.max(0,ahead-6)));
  }
  car.aiBoostRest=Math.max(0,(car.aiBoostRest||0)-dt-1e-9);car.aiBoostFor=Math.max(0,(car.aiBoostFor||0)-dt-1e-9);
  const straight=Math.abs(error)<.08&&curvature<.0015&&plannedSpeed>spec.max*.97&&!car.aiBlocked&&!car.hit&&car.grounded!==false&&route.length-distance>180&&car.speed>16;
  if(straight&&!car.aiBoostRest&&!car.aiBoostFor&&car.nitro>55){car.aiBoostFor=1.6;car.aiBoostRest=5;}
  const nitro=straight&&car.aiBoostFor>0&&car.nitro>12;
  const targetSpeed=Math.min(plannedSpeed+(nitro?18:0),Math.sqrt(lateralGrip/Math.max(.00001,curvature)),car.aiBlocked?8:Infinity)*Math.max(.16,Math.cos(error));
  const high=clamp((Math.abs(car.speed)-20)/65,0,1),strength=(1.25-high*.65)*spec.steering*spec.steeringResponse;
  const steer=clamp(-2*Math.max(8,Math.abs(car.speed))*Math.sin(error)/Math.max(3,Math.hypot(dx,dz))/strength,-1,1);
  const stopping=distance>=route.length-3;
  const cruising=!car.aiBlocked&&Math.abs(error)<.2&&curvature<.002&&plannedSpeed>spec.max*.95;
  return {steer,throttle:!stopping&&(cruising||car.speed<targetSpeed+1),brake:(stopping&&car.speed>1)||(!cruising&&car.speed>targetSpeed+2),nitro,handbrake:false};
 }
 const api={create,reset,step,overlap,collide,aiInput,wheelGround,needsReset:car=>car.y<-500||(!car.grounded&&car.airTime>1.5&&car.y<car.lastGroundY-12&&!car.landingAvailable)};
 if(typeof module==='object')module.exports=api;else root.BlacklineVehiclePhysics=api;
})(typeof window==='object'?window:globalThis);
