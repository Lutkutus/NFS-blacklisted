/* A connected 1.4 km city: freely drive streets, junctions, yards and forest roads. */
window.buildOpenWorld = function ({THREE, world, box, material, addSign, tree, seeded}) {
  const roads=[-540,-270,0,270,540], extent=690, solids=[], markers=[], pickups=[];
  const rand=seeded(7301);
  box(world,0,-.3,0,1600,.5,1600,0x343a31);
  // Cross streets form a network, not a closed racing spline.
  for(const lane of roads)for(const axis of ['x','z']){
    const roadTexture=BlacklineArt.textures.road.clone();roadTexture.repeat.set(axis==='x'?90:2,axis==='x'?2:90);roadTexture.needsUpdate=true;
    const street=new THREE.Mesh(new THREE.PlaneGeometry(axis==='x'?1380:26,axis==='x'?26:1380),BlacklineArt.toon(0xffffff,roadTexture));street.rotation.x=-Math.PI/2;street.position.set(axis==='x'?0:lane,.045,axis==='x'?lane:0);street.receiveShadow=true;world.add(street);
    for(let p=-660;p<=660;p+=24){
      if(roads.some(r=>Math.abs(p-r)<23))continue;
      box(world,axis==='x'?p:lane,.05,axis==='z'?p:lane,axis==='x'?8:.18,.025,axis==='z'?8:.18,0x979b7e);
      for(const side of [-1,1])box(world,axis==='x'?p:lane+side*12.4,.05,axis==='z'?p:lane+side*12.4,axis==='x'?17:.18,.02,axis==='z'?17:.18,0x868d7b);
    }
  }
  // Large traversable garage yard and container terminal.
  box(world,75,.04,65,110,.05,110,0x41423a);
  box(world,420,.04,-400,200,.05,210,0x41413a);
  const building=(x,z,w,d,h,color)=>{
    box(world,x,h/2,z,w,h,d,color);box(world,x,h+.25,z,w+1,.5,d+1,0x252d29);
    solids.push({x,z,w,d});
    for(let y=4;y<h-2;y+=6){
      box(world,x,y,z+d/2+.03,w*.72,1.3,.05,0x8e9276);
      box(world,x+w/2+.03,y,z,.05,1.3,d*.6,0x626c5e);
    }
    // Rust rain streaks on the front wall.
    for(let k=0;k<4;k++)box(world,x+(rand()-.5)*w*.9,h*.3,z+d/2+.07,.3+rand(),h*.5,.03,0x514534);
  };
  for(let ix=0;ix<4;ix++)for(let iz=0;iz<4;iz++){
    const cx=(roads[ix]+roads[ix+1])/2,cz=(roads[iz]+roads[iz+1])/2;
    if(cx>0&&cz>0&&cx<270&&cz<270)continue;
    if(cx>270&&cz< -270)continue;
    for(let a=-1;a<=1;a+=2)for(let b=-1;b<=1;b+=2){
      const x=cx+a*65,z=cz+b*65;
      if(cx< -270){for(let t=0;t<5;t++)tree(x+(rand()-.5)*65,z+(rand()-.5)*65,8+rand()*12);}
      else building(x,z,45+rand()*35,45+rand()*35,10+rand()*(cz>0?65:25),[0x52584c,0x62604d,0x3f4c48][Math.floor(rand()*3)]);
    }
  }
  building(80,115,65,25,9,0x383e36);
  const garageSign=new THREE.Group();garageSign.position.set(80,7,102.4);garageSign.rotation.y=Math.PI;world.add(garageSign);
  addSign(garageSign,'BLACKLISTED / TUNING',0,0,0,45,3);
  for(let i=0;i<18;i++){
    const x=340+(i%3)*43,z=-470+Math.floor(i/3)*25;
    box(world,x,2,z,28,4,10,i%2?0x69513b:0x3f5952);solids.push({x,z,w:28,d:10});
    for(let k=-12;k<13;k+=3)box(world,x+k,2,z+5.03,.12,3.8,.05,0x83725a);
  }
  for(const x of [-530,10,550])for(let z=-620;z<680;z+=100){
    box(world,x+17,5,z,.22,10,.22,0x2b322e);box(world,x+14,10,z,6,.18,.4,0x332e24);
    box(world,x+12,9.85,z,1.8,.08,.5,0xe2bd6e,true);
  }
  // Warehouses, chimneys, power lines and roadside grime.
  for(const x of [180,240,300]){box(world,x,30,-630,7,60,7,0x494b40);box(world,x,58,-630,8,3,8,0x674d3b);}
  for(let i=0;i<100;i++){
    const x=(rand()-.5)*1300,z=(rand()-.5)*1300;
    box(world,x,.075,z,1+rand()*3,.01,3+rand()*9,0x303630).rotation.y=rand()*3;
  }
  function marker(x,z,label,kind,color){
    const group=new THREE.Group();group.position.set(x,0,z);world.add(group);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(7,.14,4,40),material(color,true));ring.rotation.x=Math.PI/2;ring.position.y=.16;group.add(ring);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,12,6),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5}));beam.position.y=6;group.add(beam);
    const sign=new THREE.Group();sign.position.set(0,7,0);group.add(sign);addSign(sign,label,0,0,0,14,1.8);
    markers.push({x,z,label,kind,group});
  }
  marker(70,65,'GARAGE / E','garage',0xd5ed75);
  marker(270,-220,'DOCKSIDE / E','dock',0xe3aa67);
  marker(-540,180,'PINE RIDGE / E','pine',0xa9d5ae);
  marker(0,-380,'SPEED TRAP','speed',0xe6bf6f);
  for(const [x,z] of [[-270,-180],[180,270],[540,150],[-540,-400],[80,0],[270,440],[-120,540],[450,-270]]){
    const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(1.6),material(0xd5ed75,true));mesh.position.set(x,2,z);world.add(mesh);pickups.push({x,z,mesh,collected:false});
  }
  return {roads,extent,solids,markers,pickups,spawn:{x:70,z:55,yaw:Math.PI},lastSafe:{x:70,z:55,yaw:Math.PI},speedBest:0,speedInside:false};
};
