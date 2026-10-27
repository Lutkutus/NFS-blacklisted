/* BLACKLISTED — procedural 3D prototype. No remote assets or build step required. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const { clamp, wrap, formatTime, LapTracker, drive, tune, VEHICLES, resolveWorldCollision } = RacingCore;
  const TRACKS = [
    { name: 'DOCKSIDE', width: 22, sky: 0xb5b2a0, ground: 0x9b926e, fog: 0xb5b2a0,
      points: [[0,0],[0,180],[100,290],[290,270],[350,100],[290,-90],[130,-140],[65,-65]], theme: 'dock' },
    { name: 'PINE RIDGE', width: 20, sky: 0xb1beb2, ground: 0x809367, fog: 0xb1beb2,
      points: [[0,0],[-40,180],[60,290],[180,220],[150,90],[270,80],[330,230],[440,150],[410,-40],[250,-130],[100,-100]], theme: 'forest' }
  ];
  const SAMPLE_COUNT = 480;
  let psx, renderer, scene, camera, world, hero, garageScene, garageCamera;
  let trackId = 0, track, samples = [], curve, length, roadGroup;
  let mode = 'menu', previousMode = 'race', raceType = 'race', laps = 3, elapsed = 0, lapStart = 0;
  let lapTimes = [], timer = 3, noticeTimer = 0, cameraMode = 0, frameTime = 0;
  let car, rivals = [], tracker, raceCar, checkpointMarker, lastIndex = 0;
  let engineAudio, muted = true, keys = new Set(), saved = {}, garageTime = 0;
  let garageAngle=.74;
  const garageView=BlacklineGarageControls.create();let placementKey='',placementMouse=false,placementDrag=null;
  let tuningGarage=null,tuningPromise=null,tuningActive=false,tuningBase=null,enterTuningWorkshop=null;
  const tuningLookAt=new THREE.Vector3();
  const config = { ...BlacklineCars.defaults, stage: 0, vehicle: 'skyline' };
  let openWorld=null, interaction=null, rockRace=null, raceCatalog=[],careerFromDrive=false;
  let cityMapData=null,cityMapUI=null,mapReturnMode='menu',mapHiddenState=null,waypoint=null,mapNav=null;
  const career=BlacklineCareer,V=BlacklineVehiclePhysics,D=BlacklineDealership;
  const driveCamera=BlacklineDriveCamera,mouseLook=driveCamera.create();let mouseLookInput=null;
  let dealerShowroom=null,dealerLoading=null,dealerReturnMode='menu',dealerSelection='livisa';
  let activeChallenge=null,pursuit=career.createPursuit(),police=[],policeSpawnTimer=0,policeSequence=0,breakerEnergy=100,driftScore=0,driftBank=0,selectedStage=0;
  let dust=null;
  const smokeWheelPoint=new THREE.Vector3();
  function createDust(){dust=BlacklineDriftSmoke.create(THREE,scene);}
  function updateDust(dt,input){
    if(!dust)return;raceCar.updateMatrixWorld(true);
    const emitters=raceCar.userData.wheels.filter(w=>w.position.z<0).map(w=>{w.getWorldPosition(smokeWheelPoint);return {x:smokeWheelPoint.x,y:smokeWheelPoint.y-w.userData.radius+.04,z:smokeWheelPoint.z};});
    dust.update(dt,car,input,emitters);
  }
  function wallet(){return Number.isFinite(saved.cash)?saved.cash:8000;}
  function addCash(amount){saved.cash=Math.max(0,wallet()+amount);save();}
  function ownedStage(){return saved.ownedStages?.[config.vehicle]||0;}
  function spendStage(){
    if(!D.owns(saved,config.vehicle))return;
    const purchase=career.buyUpgrade(wallet(),ownedStage(),selectedStage);if(!purchase)return;
    saved.cash=purchase.balance;saved.ownedStages={...(saved.ownedStages||{}),[config.vehicle]:purchase.owned};config.stage=selectedStage;save();syncGarageUI();updateMenuBest();
  }
  function closeCareer(){ $('career-panel').hidden=true;if(careerFromDrive&&mode==='paused')resumeGame();careerFromDrive=false; }
  function openCareer(){if(multiplayer?.isRacing){showNotice('END THE MULTIPLAYER RACE FIRST',2);return;}
    const fromDrive=mode==='race'&&openWorld?.rockport&&!rockRace&&pursuit.phase==='patrol';if(mode!=='menu'&&!fromDrive)return;careerFromDrive=fromDrive;if(fromDrive){pauseGame();$('overlay').hidden=true;}
    const wins=career.normalizeProgress(saved).blacklistWins;$('career-panel').hidden=false;$('career-drive').hidden=fromDrive;
    $('career-close').textContent=fromDrive?'← RESUME FREE ROAM':'← BACK TO GARAGE';
    $('career-race-progress').textContent=saved.cheats?.unlockAll===true?'UNLOCK ALL · All Blacklist challenges unlocked. Earned wins are still saved.':career.nextChallenge(saved)<0?'BLACKLIST COMPLETE · Keep racing sprints and rematches.':`RACE WINS ${career.normalizeProgress(saved).raceWinsSinceBoss} / ${career.requiredRaceWins} · Only first place in a regular sprint counts. Rematch wins also count. The counter resets when you beat a new boss.`;
    if(!fromDrive)$('career-race-progress').textContent+=' GARAGE: view only. Drive to Rockport and press B to start a challenge.';
    $('challenge-list').replaceChildren();
    career.challenges.forEach((c,i)=>{
      const won=wins.includes(c.id),available=career.canChallenge(i,saved),b=document.createElement('button');b.className='challenge';b.disabled=!available||!fromDrive;
      b.innerHTML=`<span>#${c.rank} ${c.name}</span><small>${c.car} · ${(Math.min(c.metres,raceCatalog[c.track].length-c.start)/1000).toFixed(1)} km · STAGE ${c.stage}</small><b>${available&&!fromDrive?'UNLOCKED · CHALLENGE IN ROCKPORT / B':won?'CAR OWNED':available?'PINK SLIP + '+c.reward+' €':i===career.nextChallenge(saved)?'RACE WINS '+career.normalizeProgress(saved).raceWinsSinceBoss+' / '+career.requiredRaceWins:'DEFEAT THE PREVIOUS BOSS'}</b>`;
      b.onclick=()=>{if(!careerFromDrive||mode!=='paused')return;careerFromDrive=false;activeChallenge=i;trackId=c.track;$('mode').value=c.mode;$('career-panel').hidden=true;startRace();};$('challenge-list').append(b);
    });
  }
  function selectOwnedVehicle(id){
    if(!Object.hasOwn(VEHICLES,id)||!D.owns(saved,id))return;
    saved.builds||={};saved.builds[config.vehicle]={...config};config.vehicle=id;
    Object.assign(config,BlacklineCars.defaults,validateCustom(saved.builds[id]||{}));
    const equipped=saved.builds[id]?.stage;config.stage=Number.isInteger(equipped)?clamp(equipped,0,ownedStage()):ownedStage();
    rebuildHero();syncGarageUI();updateMenuBest();save();
  }
  function refreshDealer(message=''){
    const stockScroll=$('dealer-list').scrollTop;
    const wins=career.normalizeProgress(saved).blacklistWins.length;
    $('dealer-wallet').textContent=wallet().toLocaleString('en-GB')+' €';$('dealer-progress').textContent=`BLACKLIST ${wins} / 13`;
    $('dealer-list').replaceChildren(...D.stock.map(item=>{const v=VEHICLES[item.id],b=document.createElement('button'),owned=D.owns(saved,item.id),ready=D.available(saved,item.id);b.className='dealer-car'+(dealerSelection===item.id?' selected':'');b.setAttribute('aria-pressed',String(dealerSelection===item.id));b.innerHTML=`<span>${v.name} ${v.badge}</span><small>${item.category} · ${v.zero100.toFixed(1)} s · ${v.topKph} KM/H</small><b>${owned?'OWNED':ready?item.price.toLocaleString('en-GB')+' €':`UNLOCKS AT · ${item.wins} BOSS WINS`}</b>`;b.onclick=()=>{dealerSelection=item.id;dealerShowroom?.select(item.id);refreshDealer();};return b;}));
    $('dealer-list').scrollTop=stockScroll;
    const item=D.catalog[dealerSelection],v=VEHICLES[dealerSelection],owned=D.owns(saved,item.id),ready=D.available(saved,item.id);
    $('dealer-car-title').textContent=v.name+' '+v.badge;$('dealer-specs').textContent=`STOCK · ${v.power} HP · ${v.drive} · 0–100 ${v.zero100.toFixed(1)} s · ${v.topKph} KM/H`;
    $('dealer-price').textContent=item.price.toLocaleString('en-GB')+' €';
    $('dealer-buy').disabled=!!(!dealerShowroom||owned||!ready||wallet()<item.price);$('dealer-buy').textContent=owned?'CAR ALREADY OWNED':!ready?`DEFEAT ${item.wins} BLACKLIST BOSSES`:wallet()<item.price?`NEED ${(item.price-wallet()).toLocaleString('en-GB')} €`:'BUY CAR · '+item.price.toLocaleString('en-GB')+' €';
    $('dealer-use').hidden=!owned;$('dealer-use').disabled=!dealerShowroom;
    $('dealer-message').textContent=message||(!dealerShowroom?'LOADING SHOWROOM…':owned?'This car is in your garage and ready to drive.':ready?'The price is for a stock car. Buy upgrades separately.':`Win ${item.wins-wins} more boss challenges to unlock this car.`);
  }
  async function openDealer(){
    if(!['menu','race'].includes(mode)||rockRace||mode==='race'&&(pursuit.phase!=='patrol'||Math.abs(car.speed)>8))return;
    mouseLookInput?.release();dealerReturnMode=mode;mode='dealer';keys.clear();$('menu').hidden=true;$('hud').hidden=true;$('dealer-panel').hidden=false;refreshDealer();
    try{if(!dealerLoading)dealerLoading=BlacklineDealerShowroom.create();dealerShowroom=await dealerLoading;if(mode!=='dealer')return;dealerShowroom.select(dealerSelection);dealerShowroom.resize();refreshDealer();}
    catch(e){dealerLoading=null;$('dealer-message').textContent='Could not load the showroom. Close and reopen the dealership to retry.';console.error(e);}
  }
  function closeDealer(){if(mode!=='dealer')return;$('dealer-panel').hidden=true;mode=dealerReturnMode;$('menu').hidden=mode!=='menu';$('hud').hidden=mode==='menu';keys.clear();frameTime=performance.now();syncGarageUI();resize();}
  function buyDealerCar(){
    if(mode!=='dealer'||!dealerShowroom)return;const result=D.purchase(saved,dealerSelection);if(result.ok){saved=result.state;save();syncGarageUI();}refreshDealer(result.reason);
  }
  const materialCache = new Map();
  const meshGeometry = new THREE.BoxGeometry(1, 1, 1);
  const wheelGeometry = new THREE.CylinderGeometry(.36, .36, .24, 12);
  const rimGeometry = new THREE.CylinderGeometry(.24, .24, .25, 8);
  const lightGeometry = new THREE.CylinderGeometry(.11, .11, .035, 12);

  function material(color, glow = false) {
    const key = `${color}-${glow}`;
    if (!materialCache.has(key)) {
      const palette={ [0x343a31]:0xa19470,[0x292d2c]:0x64606b,[0x41423a]:0xb6ab86,[0x41413a]:0x9e9579,
        [0x52584c]:0xaaa18b,[0x62604d]:0xc6b799,[0x3f4c48]:0x7b9290,[0x626a5c]:0x9da18d,[0x737663]:0xb6b293,[0x4e5c55]:0x839a91,[0x666c62]:0xa3aa96 };
      materialCache.set(key,glow?new THREE.MeshBasicMaterial({color}):BlacklineArt.toon(palette[color]||color));
    }
    return materialCache.get(key);
  }
  function box(parent, x, y, z, sx, sy, sz, color, glow = false) {
    const mesh = new THREE.Mesh(meshGeometry, typeof color === 'object' ? color : material(color, glow));
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);mesh.receiveShadow=true;mesh.castShadow=true; parent.add(mesh); return mesh;
  }
  function carPanel(parent,x,y,z,w,h,d,paint){
    const bevel=Math.min(.075,h*.2),shape=new THREE.Shape();
    shape.moveTo(-w/2+bevel,-h/2+bevel);shape.lineTo(w/2-bevel,-h/2+bevel);shape.lineTo(w/2-bevel,h/2-bevel);shape.lineTo(-w/2+bevel,h/2-bevel);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:d-bevel*2,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,steps:1,curveSegments:1});
    geo.translate(0,0,-d/2+bevel);
    const mesh=new THREE.Mesh(geo,paint);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function makeCar(color,custom=true,vehicle='skyline'){return BlacklineCars.create(custom?{...BlacklineCars.defaults,...config}:{...BlacklineCars.defaults,vehicle,color,rims:'silver',spoiler:false});}
  function rebuildHero(){placementDrag=null;garageScene.remove(hero);disposeScene(hero);hero=makeCar(config.color);hero.position.y=.025;hero.rotation.y=tuningActive?tuningGarage.bayYaw:0;garageScene.add(hero);refreshPlacementUI();}
  function applyCarConfig(){rebuildHero();}
  function terrainTheme(){return openWorld?'city':track.theme;}
  function ground(x,z){return openWorld?.rockport?openWorld.ground(x,z,car?.y??openWorld.spawn.y):BlacklineTerrain.height(x,z,terrainTheme());}
  function lightScene(target) {
    target.add(new THREE.HemisphereLight(0xf5e6c9,0x55516b,1.7));
    const sun=new THREE.DirectionalLight(0xffdd9d,2.6); sun.position.set(-130,180,70); target.add(sun);
    sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;
    sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;sun.shadow.camera.near=1;sun.shadow.camera.far=220;
    sun.shadow.normalBias=.12;sun.shadow.bias=-.0002;target.add(sun.target);target.userData.sun=sun;
  }
  function createGarage() {
    garageScene=new THREE.Scene();
    hero=BlacklineArt.workshop({scene:garageScene,box,material,makeCar});
    garageCamera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,80);
    garageCamera.position.set(7.1,1.7,7.8);garageCamera.lookAt(0,1,0);
  }
  function tuningEnvironment(active){
    if(active===tuningActive)return;
    if(active){tuningBase={nodes:garageScene.children.filter(n=>n!==hero).map(n=>[n,n.visible]),background:garageScene.background,fog:garageScene.fog,view:{...garageView},angle:garageAngle};for(const [n]of tuningBase.nodes)n.visible=false;garageScene.add(tuningGarage.group);garageScene.background=new THREE.Color('#222827');garageScene.fog=new THREE.Fog('#252b29',32,70);Object.assign(garageView,BlacklineGarageControls.create());garageAngle=garageView.yaw+tuningGarage.bayYaw;}
    else{tuningGarage.group.removeFromParent();for(const [n,visible]of tuningBase.nodes)n.visible=visible;garageScene.background=tuningBase.background;garageScene.fog=tuningBase.fog;Object.assign(garageView,tuningBase.view);garageAngle=tuningBase.angle;tuningBase=null;}
    tuningActive=active;hero.rotation.y=active?tuningGarage.bayYaw:0;garageScene.userData.tuning=active;
  }
  function makeTrack(id) {
    track=TRACKS[id];
    curve=new THREE.CatmullRomCurve3(track.points.map(p=>new THREE.Vector3(p[0],0,p[1])),true,'centripetal');
    length=curve.getLength();
    samples=Array.from({length:SAMPLE_COUNT},(_,i)=>{
      const p=curve.getPointAt(i/SAMPLE_COUNT),t=curve.getTangentAt(i/SAMPLE_COUNT).normalize();
      return {p,t,n:new THREE.Vector3(t.z,0,-t.x)};
    });
    scene=new THREE.Scene();scene.background=new THREE.Color(track.sky);scene.fog=new THREE.Fog(track.fog,160,560);lightScene(scene);
    world=new THREE.Group();scene.add(world);
    box(world,150,-.3,80,2400,.5,2400,track.ground);
    roadGroup=new THREE.Group();world.add(roadGroup);
    ribbon(-track.width/2-3,track.width/2+3,.01,0x777665);
    ribbon(-track.width/2,track.width/2,.03,0x343b3b);
    ribbon(-track.width/2+.3,-track.width/2+.48,.045,0xd1d0b8);
    ribbon(track.width/2-.48,track.width/2-.3,.045,0xd1d0b8);
    for(let i=0;i<SAMPLE_COUNT;i+=4){
      const s=samples[i];
      const dash=box(roadGroup,s.p.x,.05,s.p.z,.15,.02,3.3,0xa6ad99);dash.rotation.y=Math.atan2(s.t.x,s.t.z);
      if(i%8===0)for(const side of [-1,1]){
        const edge=s.p.clone().addScaledVector(s.n,side*(track.width/2+1));
        const curb=box(roadGroup,edge.x,.13,edge.z,1.4,.24,5.7,i%16===0?0xb1bc98:0x454c42);curb.rotation.y=dash.rotation.y;
      }
    }
    // Checkerboard finish line and overhead gantry.
    const start=new THREE.Group(); start.position.copy(samples[0].p);start.rotation.y=Math.atan2(samples[0].t.x,samples[0].t.z);world.add(start);
    for(let x=0;x<16;x++)for(let z=0;z<2;z++)box(start,-track.width/2+(x+.5)*track.width/16,.065,z*1.2,track.width/16,.02,1.2,(x+z)%2?0xe0e3ce:0x1b2725);
    for(const x of [-track.width/2-1,track.width/2+1])box(start,x,4,0,.4,8,.4,0x252f2f);
    box(start,0,7.8,0,track.width+3,1.5,.45,0x1c2926);
    addSign(start,'BLACKLISTED  /  FINISH',0,7.8,.24,track.width+1,1.2);
    // Deterministic environment placement keeps the road clear.
    const rand=seeded(id+23);
    for(let i=0;i<110;i++){
      const index=Math.floor(rand()*SAMPLE_COUNT),s=samples[index];
      const p=s.p.clone().addScaledVector(s.n,(rand()>.5?1:-1)*(track.width/2+15+rand()*95));
      if(nearest(p.x,p.z).distance<track.width/2+12)continue;
      if(track.theme==='forest')tree(p.x,p.z,4+rand()*9);
      else {
        const h=6+rand()*35,w=9+rand()*18,d=9+rand()*18;
        box(world,p.x,h/2,p.z,w,h,d,[0x626a5c,0x737663,0x4e5c55,0x666c62][i%4]);
        box(world,p.x,h+.3,p.z,w+.5,.6,d+.5,0x3c4942);
        if(i%3===0)for(let y=3;y<h-2;y+=5)box(world,p.x,y,p.z+d/2+.02,w*.76,1.2,.04,0xa9b898);
      }
    }
    for(let i=12;i<SAMPLE_COUNT;i+=24){
      const s=samples[i],p=s.p.clone().addScaledVector(s.n,track.width/2+4);
      box(world,p.x,4,p.z,.18,8,.18,0x343f37);
      box(world,p.x,7.9,p.z,2.5,.15,.4,0xced6ae,true);
      if(track.theme==='dock'){
        const container=new THREE.Group();container.position.copy(p).addScaledVector(s.n,12);container.rotation.y=Math.atan2(s.t.x,s.t.z);world.add(container);
        box(container,0,1.5,0,3,3,10,i%48===12?0x76513b:0x596b61);
        for(let z=-4;z<=4;z++)box(container,1.51,1.5,z,.03,2.8,.06,0x85907a);
      }
    }
    for(let i=0;i<20;i++){
      const angle=i/20*Math.PI*2,r=700;
      const mountain=new THREE.Mesh(new THREE.ConeGeometry(100+rand()*100,90+rand()*150,5),material(track.theme==='forest'?0x65755e:0x727c6a));
      mountain.position.set(180+Math.cos(angle)*r,20,100+Math.sin(angle)*r);world.add(mountain);
    }
    checkpointMarker=new THREE.Group();
    const beamMat=new THREE.MeshBasicMaterial({color:0xd5ed75,transparent:true,opacity:.48,depthWrite:false});
    for(const side of [-1,1])box(checkpointMarker,side*(track.width/2-.8),2.5,0,.22,5,.22,beamMat);
    box(checkpointMarker,0,5,0,track.width-1.6,.16,.16,beamMat);world.add(checkpointMarker);
    checkpointMarker.traverse(m=>m.userData.noTerrain=true);BlacklineTerrain.conform(world,track.theme);
    camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,1000);
  }
  function ribbon(left,right,y,color) {
    const vertices=[],indices=[],uv=[];
    for(let i=0;i<=SAMPLE_COUNT;i++){
      const s=samples[i%SAMPLE_COUNT];
      for(const offset of [left,right])vertices.push(s.p.x+s.n.x*offset,y,s.p.z+s.n.z*offset);
      uv.push(0,i*.35,1,i*.35);
      if(i<SAMPLE_COUNT){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
    const tex=color===0x343b3b?BlacklineArt.textures.road.clone():null;if(tex)tex.needsUpdate=true;
    const mat=BlacklineArt.toon(tex?0xffffff:color,tex);mat.side=THREE.DoubleSide;
    const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=true;roadGroup.add(mesh);
  }
  function tree(x,z,h) {
    box(world,x,h*.2,z,.6,h*.4,.6,0x514b38);
    const mesh=new THREE.Mesh(new THREE.ConeGeometry(h*.35,h,5),material(0x344d39));mesh.position.set(x,h*.65,z);world.add(mesh);
  }
  function addSign(parent,text,x,y,z,w,h) {
    const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');
    ctx.fillStyle='#1b2822';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#d5ed75';ctx.font='bold italic 58px Arial';ctx.textAlign='center';ctx.fillText(text,512,85);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));sign.position.set(x,y,z);parent.add(sign);
  }
  function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
  function nearest(x,z) {
    let best=Infinity,index=0,closestX=0,closestZ=0;
    for(let i=0;i<samples.length;i++){
      const a=samples[i].p,b=samples[(i+1)%samples.length].p,dx=b.x-a.x,dz=b.z-a.z;
      const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
      const px=a.x+dx*t,pz=a.z+dz*t,d=(x-px)**2+(z-pz)**2;
      if(d<best){best=d;index=i+t;closestX=px;closestZ=pz;}
    }
    return {index:index%SAMPLE_COUNT,distance:Math.sqrt(best),x:closestX,z:closestZ};
  }
  function disposeScene(target) {
    if(!target)return;
    const geometries=new Set(),materials=new Set(),textures=new Set();
    target.traverse(o=>{if(o.geometry&&!([meshGeometry,wheelGeometry,rimGeometry,lightGeometry].includes(o.geometry)))geometries.add(o.geometry);
      if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])if(![...materialCache.values()].includes(m)){materials.add(m);if(m.map)textures.add(m.map);}}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
  }
  async function startRockport(options={}){
    if(multiplayer?.isRacing){showNotice('END THE MULTIPLAYER RACE FIRST',3);return false;}
    if(tuningActive)$('custom-close').click();
    if(!D.owns(saved,config.vehicle))return;
    if(!$('loading').hidden)return;
    if(location.protocol==='file:'){alert('Rockport needs a local server. Run Kaynnista.bat and open http://127.0.0.1:4175/');return}
    $('loading').hidden=false;$('loading').querySelector('p').textContent='ROCKPORT · PREPARING';$('rockport').disabled=true;
    let next;
    try{
      const nextScene=new THREE.Scene();nextScene.background=new THREE.Color(0xb0aa83);nextScene.fog=new THREE.Fog(0xb0aa83,100,380);lightScene(nextScene);const nextWorld=new THREE.Group();nextScene.add(nextWorld);
      options.route=options.race?(options.challenge!==null&&options.challenge!==undefined?career.challengeRoute(options.challenge,raceCatalog,RockportNavigation):raceCatalog[trackId]):null;
      const raceSpawn=options.race?RockportNavigation.sample(options.route,0):options.travelTarget||BlacklineWorldMap.garage(cityMapData,saved.lastGarageId);
      next=await BlacklineRockport.create({THREE,world:nextWorld,spawn:raceSpawn,onImpact:playImpact,onProgress:text=>{if(!$('loading').hidden)$('loading').querySelector('p').textContent=text}});
      if(options.travelTarget){
        const pose=BlacklineWorldMap.travelPose(next.nav,options.travelTarget,RockportNavigation,next.cells(),RockportPhysics,hero?.userData.hitbox||raceCar?.userData.hitbox||{width:2.2,length:5,height:1.1,bottom:.22});
        if(!pose){disposeScene(nextScene);throw Error('No safe place for the car was found near this destination');}
        next.spawn=pose;next.lastSafe={...pose};
      }
      const trafficModels=await BlacklineCivilianTraffic.loadModels(THREE);
      next.traffic=BlacklineCivilianTraffic.create({THREE,world:next,scene:nextWorld,models:trafficModels,isVisible:p=>{if(!camera)return false;const v=new THREE.Vector3(p.x,p.y+1,p.z).project(camera);return v.z>-1&&v.z<1&&Math.abs(v.x)<1.2&&Math.abs(v.y)<1.2;}});
      multiplayerCars.clear();openWorld?.dispose?.();disposeScene(scene);scene=nextScene;world=nextWorld;openWorld=next;rockRace=null;activeChallenge=options.challenge??null;pursuit=career.createPursuit();police=[];policeSpawnTimer=0;policeSequence=0;breakerEnergy=100;driftScore=0;driftBank=0;
      camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,900);raceCar=makeCar(config.color);scene.add(raceCar);car=V.create(next.spawn,{vehicle:config.vehicle,stage:config.stage,setup:{...config},box:raceCar.userData.hitbox});rivals=[];tracker=null;
      for(const s of cityMapData.garages.filter(g=>g.available)){
        next.markers.push({...s,kind:'garage'});
        const ring=new THREE.Mesh(new THREE.TorusGeometry(5,.12,4,32),new THREE.MeshBasicMaterial({color:0xb7e979}));ring.rotation.x=-Math.PI/2;ring.position.set(s.x,s.y+.12,s.z);world.add(ring);
      }
      if(waypoint&&!options.race){const result=BlacklineWorldMap.directions(next.nav,car,waypoint.target,RockportNavigation);waypoint=result.error?null:result;}else waypoint=null;
      next.manifest.pickups.forEach((p,i)=>{const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(1.2),new THREE.MeshBasicMaterial({color:0xe6c55b}));mesh.position.set(p[0],p[1]+2,p[2]);world.add(mesh);const collected=(saved.rockportFound||[]).includes(i);mesh.visible=!collected;next.pickups.push({x:p[0],z:p[2],y:p[1],mesh,collected})});
      next.speedBest=saved.rockportSpeedTrap||0;
      next.routes.forEach((route,i)=>{const p=RockportNavigation.sample(route,0);next.markers.push({...p,kind:'race-'+i,label:route.name});});
      next.markers.push({...RockportNavigation.sample(next.routes[0],180),kind:'speed',label:'SPEED TRAP'});
      const workshop=cityMapData.tuning;next.markers.push({...workshop});const workshopRing=new THREE.Mesh(new THREE.TorusGeometry(4.2,.14,4,32),new THREE.MeshBasicMaterial({color:0xd0a4f0}));const workshopFloor=RockportPhysics.surface(next.cells(),workshop.x,workshop.z,workshop.y,1,1);workshopRing.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(-(workshopFloor?.dx||0),1,-(workshopFloor?.dz||0)).normalize());workshopRing.position.set(workshop.x,(workshopFloor?.y??workshop.y)+.14,workshop.z);world.add(workshopRing);const workshopSign=new THREE.Group();workshopSign.position.set(workshop.x+Math.cos(workshop.yaw)*12,workshop.y,workshop.z-Math.sin(workshop.yaw)*12);workshopSign.rotation.y=workshop.yaw-Math.PI/2;world.add(workshopSign);box(workshopSign,-1.2,1.8,0,.12,3.6,.12,0x353e37);box(workshopSign,1.2,1.8,0,.12,3.6,.12,0x353e37);BlacklineArt.panel(workshopSign,'TUNING|GARAGE',0,3.5,.02,4.2,1.5,{bg:'#29202f',ink:'#dfc8f0'});
      const dealer=await fetch('assets/dealer/location.json').then(r=>r.json());next.markers.push({...dealer,kind:'dealer',label:dealer.name});
      const shopSign=new THREE.Group();shopSign.position.set(dealer.x+Math.cos(dealer.yaw)*12,dealer.y,dealer.z-Math.sin(dealer.yaw)*12);shopSign.rotation.y=dealer.yaw;world.add(shopSign);
      box(shopSign,0,2.6,0,.18,5.2,.18,0x5d6442);box(shopSign,0,4.7,0,4.8,1.4,.25,0x202a20);addSign(shopSign,'ROSEWOOD / MOTORS',0,4.7,.15,4.6,1.2);
      const shopRing=new THREE.Mesh(new THREE.TorusGeometry(4.2,.1,4,32),new THREE.MeshBasicMaterial({color:0xdab857}));shopRing.rotation.x=-Math.PI/2;shopRing.position.set(dealer.x,dealer.y+.13,dealer.z);world.add(shopRing);
      createDust();elapsed=0;timer=0;raceType='roam';mode='race';keys.clear();interaction=null;$('countdown').textContent='';$('menu').hidden=true;$('hud').hidden=false;$('overlay').hidden=true;$('map-legend').textContent='T WORKSHOP · A DEALERSHIP · G GARAGE';document.body.classList.add('playing');showNotice('ROCKPORT · E INTERACT · H PURSUIT · R RESET',5);if(options.race)setupRockRace(options);updateModels(0);updateCamera(1,true);updateHUD();ensureAudio();$('rockport').blur();
      if(options.travelTarget?.kind==='garage'){saved.lastGarageId=options.travelTarget.id;save();}
      return true;
    }catch(e){next?.dispose?.();console.error(e);alert('Could not load Rockport: '+e.message+' · Please try again.');return false;}finally{$('loading').hidden=true;$('rockport').disabled=false}
  }
  function updateOpenWorld(dt,previous) {
    if(openWorld.rockport){const actors=[...rivals,...police].map(a=>a.state).filter(Boolean).concat(openWorld.roadblocks?.actors()||[]);openWorld.traffic?.update(dt,car,actors);openWorld.tick(dt,car,[...actors,...(openWorld.traffic?.actors()||[])]);}
    const hit=openWorld.rockport?car.hit:resolveWorldCollision(car,openWorld.solids,openWorld.extent,previous);
    if(openWorld.rockport)openWorld.waitingForRoad=car.waiting;
    if(!rockRace)updatePolice(dt);
    if(pursuit.phase==='busted'){car.speed=0;car.vx=0;car.vz=0;}
    if(hit)showNotice('IMPACT · R TO RESET TO THE ROAD',.5);
    const onRoad=openWorld.rockport?(car.grounded&&car.wheelsOnGround===4&&!!RockportPhysics.surface(openWorld.cells(),car.x,car.z,car.y,.15,.3)?.road):openWorld.roads.some(r=>Math.abs(car.x-r)<13||Math.abs(car.z-r)<13);
    if(onRoad&&!hit)openWorld.lastSafe={x:car.x,y:car.y,z:car.z,yaw:car.yaw};
    else if(!openWorld.rockport&&Math.abs(car.speed)>22)car.speed*=Math.exp(-.6*dt);
    $('hud-track').textContent=rockRace?rockRace.route.name+(activeChallenge!==null?' / '+career.challenges[activeChallenge].name:''):openWorld.rockport?'ROCKPORT':car.x< -300?'PINE OUTSKIRTS':car.z< -220?'RUST DOCKS':'BLACKLISTED DISTRICT';
    if(openWorld.rockport&&hit)showNotice(openWorld.error||'OBSTACLE OR ROAD EDGE · R TO RESET',.7);
    if(openWorld.rockport&&openWorld.waitingForRoad)showNotice(openWorld.error||'LOADING ROAD · PLEASE WAIT',.7);
    
    interaction=null;
    for(const m of openWorld.markers){
      const distance=Math.hypot(car.x-m.x,car.z-m.z);
      if(m.kind!=='speed'&&distance<(m.kind==='tuning'?m.entryRadius||6.5:19)&&(!['dealer','garage','tuning'].includes(m.kind)||Math.abs(car.y-m.y)<4))interaction=m;
      if(m.kind==='speed'){
        const inside=distance<16;
        if(inside&&!openWorld.speedInside){const speed=Math.round(Math.abs(car.speed)*3.6);openWorld.speedBest=Math.max(speed,openWorld.speedBest);saved.rockportSpeedTrap=openWorld.speedBest;save();showNotice(`SPEED TRAP · ${speed} KM/H`,3);}
        openWorld.speedInside=inside;
      }
    }
    if(waypoint&&Math.hypot(car.x-waypoint.target.x,car.z-waypoint.target.z)<19&&Math.abs(car.y-waypoint.target.y)<4){showNotice('DESTINATION REACHED · '+waypoint.target.label,4);waypoint=null;}
    $('interact').hidden=!!rockRace||!!multiplayer?.isRacing||!interaction||pursuit.phase!=='patrol';
    if(interaction)$('interact').textContent=Math.abs(car.speed)>8?'SLOW DOWN TO INTERACT':interaction.kind==='dealer'?'E · ENTER DEALERSHIP':interaction.kind==='garage'?'E · ENTER GARAGE':interaction.kind==='tuning'?'E · ENTER TUNING GARAGE':`E · START ${interaction.label}`;
    for(const [i,p] of openWorld.pickups.entries()){
      if(p.collected)continue;p.mesh.rotation.y+=dt;p.mesh.position.y=(openWorld.rockport?p.y:ground(p.mesh.position.x,p.mesh.position.z))+2+Math.sin(elapsed*2+i)*.3;
      if(Math.hypot(car.x-p.x,car.z-p.z)<5&&(!openWorld.rockport||Math.abs(car.y-p.y)<3)){p.collected=true;p.mesh.visible=false;const k=openWorld.rockport?'rockportFound':'found';saved[k]=openWorld.pickups.flatMap((v,j)=>v.collected?[j]:[]);if(openWorld.rockport)addCash(250);save();showNotice(`STREET MARKER FOUND · ${saved[k].length} / 8${openWorld.rockport?' · +250 €':''}`,3);}
    }
  }
  function interact(){if(multiplayer?.isRacing){showNotice('END THE MULTIPLAYER RACE FIRST',2);return;}
    if(rockRace||!openWorld||!interaction||mode!=='race'||Math.abs(car.speed)>8||pursuit.phase!=='patrol')return;
    if(interaction.kind==='garage'){saved.lastGarageId=interaction.id;save();backToMenu();return;}
    if(interaction.kind==='tuning'){enterTuningWorkshop();return;}
    if(interaction.kind==='dealer'){openDealer();return;}
    if(!interaction.kind.startsWith('race-'))return;activeChallenge=null;trackId=Number(interaction.kind.replace('race-',''))||0;$('mode').value='race';pauseGame();$('overlay').hidden=true;$('race-entry-title').textContent=raceCatalog[trackId].name;updateMenuBest();$('race-entry-panel').hidden=false;
  }
  function drawWorldMap(ctx){
    if(openWorld.rockport){const heading=Math.atan2(cameraTarget.x-camera.position.x,cameraTarget.z-camera.position.z),rotation=heading+Math.PI;openWorld.map(ctx,car,heading);
      const xy=p=>BlacklineWorldMap.minimap(p,car,.4,heading);
      if(waypoint&&!rockRace){ctx.beginPath();waypoint.route.points.forEach((p,i)=>{const q=xy({x:p[0],z:p[2]});i?ctx.lineTo(...q):ctx.moveTo(...q)});ctx.strokeStyle='#7ae4de';ctx.lineWidth=2;ctx.stroke();}
      if(rockRace){ctx.beginPath();rockRace.route.points.forEach((p,i)=>{const q=xy({x:p[0],z:p[2]});i?ctx.lineTo(...q):ctx.moveTo(...q)});ctx.strokeStyle='#797947';ctx.lineWidth=1.5;ctx.stroke();const distance=rockRace.guidance?.distance??rockRace.distance,segment=[];for(let d=Math.max(0,distance-12);d<=Math.min(rockRace.route.length,distance+320);d+=5)segment.push(RockportNavigation.sample(rockRace.route,d));for(const [color,width]of [['#10221c',7],['#a8fff0',4]]){ctx.beginPath();segment.forEach((p,i)=>i?ctx.lineTo(...xy(p)):ctx.moveTo(...xy(p)));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}for(let d=distance+35;d<Math.min(rockRace.route.length,distance+300);d+=65){const p=RockportNavigation.sample(rockRace.route,d);ctx.save();ctx.translate(...xy(p));ctx.rotate(rotation-p.yaw);ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(-3,-3);ctx.lineTo(3,-3);ctx.closePath();ctx.fillStyle='#ffffff';ctx.fill();ctx.restore();}const g=raceGate(rockRace.next),rx=Math.cos(g.yaw),rz=-Math.sin(g.yaw);ctx.beginPath();ctx.moveTo(...xy({x:g.x-rx*g.left,z:g.z-rz*g.left}));ctx.lineTo(...xy({x:g.x+rx*g.right,z:g.z+rz*g.right}));ctx.strokeStyle='#fff49a';ctx.lineWidth=4;ctx.stroke();}
      ctx.font='bold 10px Arial';for(const m of openWorld.markers){if(rockRace)continue;ctx.fillStyle=m.kind==='tuning'?'#d0a4f0':m.kind==='dealer'?'#f4d779':'#dfbd6d';const q=xy(m);if(['dealer','tuning'].includes(m.kind)&&!rockRace){const dx=q[0]-110,dz=q[1]-90,f=Math.min(1,98/Math.max(1,Math.abs(dx)),76/Math.max(1,Math.abs(dz)));q[0]=110+dx*f;q[1]=90+dz*f;if(f<1){ctx.save();ctx.translate(...q);ctx.rotate(Math.atan2(dz,dx));ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(-3,-3);ctx.lineTo(-3,3);ctx.closePath();ctx.fill();ctx.restore();q[0]=clamp(q[0]-10,5,205);q[1]=clamp(q[1]+12,12,174);}}ctx.fillText(({garage:'G',speed:'S',dealer:'A',tuning:'T'}[m.kind]||String(Number(m.kind.replace('race-',''))+1)),...q);}
      if(multiplayer?.isRacing){const g=multiplayer.race.goal,q=xy(g),dx=q[0]-110,dz=q[1]-90,f=Math.min(1,98/Math.max(1,Math.abs(dx)),76/Math.max(1,Math.abs(dz)));ctx.fillStyle='#ffe77d';ctx.font='bold 13px Arial';ctx.fillText('M',110+dx*f,90+dz*f);}
      if(!rockRace)for(const p of multiplayer?.peers||[])if(p.phase==='roam'){ctx.fillStyle='#82e7df';ctx.beginPath();ctx.arc(...xy(p),4,0,Math.PI*2);ctx.fill();}
      for(const c of [...police,...rivals]){ctx.fillStyle=police.includes(c)?'#ff5040':'#f0b984';ctx.beginPath();ctx.arc(...xy(c.model.position),3,0,Math.PI*2);ctx.fill();}{ctx.save();ctx.translate(110,90);ctx.rotate(rotation-car.yaw);ctx.beginPath();ctx.moveTo(0,7);ctx.lineTo(-5,-5);ctx.lineTo(5,-5);ctx.closePath();ctx.strokeStyle='#10221c';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff8d0';ctx.fill();ctx.restore();}return}
    const scale=.115,xy=(x,z)=>[110+x*scale,90+z*scale];
    ctx.strokeStyle='#68776a';ctx.lineWidth=3;
    for(const r of openWorld.roads){ctx.beginPath();ctx.moveTo(...xy(-690,r));ctx.lineTo(...xy(690,r));ctx.moveTo(...xy(r,-690));ctx.lineTo(...xy(r,690));ctx.stroke();}
    for(const p of openWorld.pickups)if(!p.collected){const [x,y]=xy(p.x,p.z);ctx.fillStyle='#adbd81';ctx.fillRect(x-1.5,y-1.5,3,3);}
    ctx.font='bold 10px Arial';ctx.textAlign='center';
    for(const m of openWorld.markers){const [x,y]=xy(m.x,m.z);ctx.fillStyle=m.kind==='garage'?'#d5ed75':'#f1a16b';ctx.fillText({garage:'G',dock:'D',pine:'P',speed:'S'}[m.kind],x,y);}
    for(const cop of police){ctx.beginPath();ctx.arc(...xy(cop.model.position.x,cop.model.position.z),3,0,Math.PI*2);ctx.fillStyle='#f17460';ctx.fill();}
    for(const b of openWorld.roadblocks?.blocks||[]){const [x,y]=xy(b.center.x,b.center.z);ctx.fillStyle='#ff593e';ctx.fillRect(x-4,y-2,8,4);}
    ctx.save();ctx.translate(...xy(car.x,car.z));ctx.rotate(-car.yaw);ctx.fillStyle='#efffc5';ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(-4,-4);ctx.lineTo(4,-4);ctx.closePath();ctx.fill();ctx.restore();
  }
  function makePoliceUnit(pose,heat){
    const loadout=BlacklinePursuitAI.loadout(config,heat,tune);
    const model=makeCar('#dadbd4',false,loadout.vehicle);scene.add(model);const roof=(model.userData.hitbox?.height||1.3)+(model.userData.hitbox?.bottom||.22);
    box(model,0,roof+.05,-.2,1.25,.13,.3,0x20292d);
    const red=box(model,-.36,roof+.16,-.2,.45,.12,.25,0xff3932,true),blue=box(model,.36,roof+.16,-.2,.45,.12,.25,0x427dff,true);
    return {model,red,blue,state:V.create(pose,{...loadout,box:model.userData.hitbox})};
  }
  function spawnPolice(){
    const A=BlacklinePursuitAI,loadout=A.loadout(config,pursuit.heat,tune),pose=A.spawn(openWorld.nav,car,[...police.map(c=>c.state),...(openWorld.traffic?.actors()||[]),...(openWorld.roadblocks?.actors()||[])],openWorld.cells(),RockportPhysics,{width:2.4,length:5.8,height:1.4,bottom:.22},policeSequence++);if(!pose)return false;
    const {model,red,blue,state}=makePoliceUnit(pose,pursuit.heat),speed=Math.min(Math.abs(car.speed)*.85,tune(loadout.stage,loadout.vehicle).max*.8);state.speed=speed;state.vx=Math.sin(pose.yaw)*speed;state.vz=Math.cos(pose.yaw)*speed;
    police.push({model,red,blue,state,safe:{...pose},id:policeSequence,replan:0,distance:0,stuck:0,sightTimer:0,visible:false});return true;
  }
  function movePolice(cop,dt){
    const N=RockportNavigation,state=cop.state,A=BlacklinePursuitAI;cop.replan-=dt;cop.sightTimer-=dt;
    if(cop.replan<=0){const known=pursuit.lastSeen||state;cop.target=A.tacticalTarget(state,known,cop.id,pursuit.heat,pursuit.phase==='cooldown');cop.direct=pursuit.phase==='chase'&&cop.visible&&Math.hypot(state.x-known.x,state.z-known.z)<65&&A.clearDrive(openWorld.cells(),state,cop.target,state.box,RockportPhysics);cop.route=cop.direct?null:A.plan(openWorld.nav,state,cop.target,openWorld.cells(),RockportPhysics);cop.distance=0;cop.replan=cop.direct?.22:.5+cop.id%3*.06;}
    if(cop.route){const projection=N.project(cop.route,state,cop.distance);if(projection)cop.distance=projection.distance;}
    const input=cop.direct?A.engage(state,cop.target,pursuit.heat,tune):cop.route?V.aiInput(state,cop.route,cop.distance,openWorld,dt):{throttle:false,steer:0,brake:state.speed>1};
    recoverAI(cop,input,dt);openWorld.simulate(state,input,dt);
    if(cop.sightTimer<=0){cop.sightTimer=.25;cop.visible=A.visible(openWorld.cells(),state,car,pursuit.heat,RockportPhysics);}
    if(state.hit)cop.replan=Math.min(cop.replan,.2);
    if(state.grounded&&state.wheelsOnGround===4&&!state.hit)cop.safe={x:state.x,y:state.y,z:state.z,yaw:state.yaw};
    if(V.needsReset(state)){V.reset(state,cop.safe);cop.replan=0;}
    cop.red.visible=Math.sin(elapsed*18+cop.id)>0;cop.blue.visible=!cop.red.visible;
  }
  function recoverAI(actor,input,dt){
    const state=actor.state;
    if(!state.grounded||state.waiting){actor.stuck=0;return;}
    if(actor.reverse>0){actor.reverse-=dt;Object.assign(input,{throttle:false,brake:true,steer:-input.steer});return;}
    const previous=state.previous||state,actualSpeed=Math.hypot(state.x-previous.x,state.z-previous.z)/Math.max(.001,state.stepDt||dt);
    actor.stuck=(input.throttle||state.hit)&&actualSpeed<1?(actor.stuck||0)+dt:0;
    if(actor.stuck>2.5){actor.stuck=0;actor.reverse=1.1;}
  }
  function clearPolice(){for(const cop of police){scene.remove(cop.model);disposeScene(cop.model);}police=[];openWorld?.roadblocks?.clear();}
  function updatePolice(dt){
    if(!openWorld.roadblocks)openWorld.roadblocks=BlacklineRoadblocks.create({THREE,world:openWorld,scene,makeUnit:makePoliceUnit,notice:showNotice});
    openWorld.roadblocks.update(dt,car,pursuit,[...police.map(c=>c.state),...(openWorld.traffic?.actors()||[])]);
    for(const cop of police)movePolice(cop,dt);
    const units=[...police,...openWorld.roadblocks.blocks.flatMap(b=>b.cars).map(c=>({...c,visible:BlacklinePursuitAI.visible(openWorld.cells(),c.state,car,pursuit.heat,RockportPhysics)}))];
    const nearest=Math.min(Infinity,...units.map(c=>Math.hypot(c.state.x-car.x,c.state.z-car.z,(c.state.y-car.y)*3)));
    const visible=units.some(c=>c.visible);pursuit.unseenFor=visible?0:(pursuit.unseenFor||0)+dt;
    if(visible)pursuit.lastSeen={x:car.x,y:car.y,z:car.z,vx:car.vx,vz:car.vz,yaw:car.yaw};
    const bustDistance=Math.min(Infinity,...units.filter(c=>c.visible&&Math.abs(c.state.y-car.y)<2.5).map(c=>Math.hypot(c.state.x-car.x,c.state.z-car.z)));
    const event=career.updatePursuit(pursuit,dt,{speed:Math.abs(car.speed),nearest,visible,bustDistance});
    if(event==='spotted'){showNotice('POLICE SPOTTED YOU · ESCAPE!',3);if(!police.length){pursuit.lastSeen={x:car.x,y:car.y,z:car.z,vx:car.vx,vz:car.vz,yaw:car.yaw};pursuit.unseenFor=0;spawnPolice();spawnPolice();policeSpawnTimer=3;}}
    policeSpawnTimer-=dt;if(pursuit.phase==='chase'&&pursuit.unseenFor<4&&police.length<Math.min(6,pursuit.heat+2)&&policeSpawnTimer<=0){spawnPolice();policeSpawnTimer=3;}
    for(let i=police.length-1;i>=0;i--)if(Math.hypot(police[i].state.x-car.x,police[i].state.z-car.z)>900){scene.remove(police[i].model);disposeScene(police[i].model);police.splice(i,1);}
    if(event==='hidden')showNotice('LINE OF SIGHT LOST · STAY HIDDEN',3);
    if(event==='escaped'){const reward=1000+pursuit.bounty;addCash(reward);showNotice(`YOU ESCAPED · +${reward} €`,5);clearPolice();}
    if(event==='busted'){addCash(-Math.min(1500,wallet()));showNotice('BUSTED · FINE UP TO €1,500',3);}
    if(event==='released'){clearPolice();V.reset(car,openWorld.spawn);}
    $('pursuit-status').textContent={patrol:'PATROL · SPEEDING DRAWS ATTENTION',chase:'PURSUIT',cooldown:`HIDDEN · ${Math.ceil(pursuit.cooldown)} s`,busted:'BUSTING'}[pursuit.phase];
    const roadblock=openWorld.roadblocks.blocks.filter(b=>(b.center.x-car.x)*Math.sin(car.yaw)+(b.center.z-car.z)*Math.cos(car.yaw)>0).sort((a,b)=>Math.hypot(a.center.x-car.x,a.center.z-car.z)-Math.hypot(b.center.x-car.x,b.center.z-car.z))[0];
    if(roadblock&&pursuit.phase==='chase')$('pursuit-status').textContent+=` · ROADBLOCK ${Math.round(Math.hypot(roadblock.center.x-car.x,roadblock.center.z-car.z))} m`;
    $('heat').textContent=`HEAT ${'★'.repeat(pursuit.phase==='patrol'?0:pursuit.heat)}`;
    $('pursuit-meter').style.width=`${pursuit.phase==='cooldown'?(1-pursuit.cooldown/pursuit.cooldownTotal)*100:pursuit.bust/5*100}%`;
    $('bounty').textContent=`BOUNTY ${pursuit.bounty} € · CASH ${wallet()} €`;
  }
  function closeRaceEntry(){ $('race-entry-panel').hidden=true;if(mode==='paused')resumeGame(); }
  function startRace(){if(!openWorld?.rockport||mode==='menu')return;if(activeChallenge!==null&&!career.canChallenge(activeChallenge,saved))return;return startRockport({race:true,type:activeChallenge!==null?'race':$('mode').value,challenge:activeChallenge});}
  function setupRockRace(options){
    const route=options.route||openWorld.routes[trackId];length=route.length;raceType=options.type;laps=1;
    rockRace={route,next:route.checkpoints[0],passed:0,distance:0,gate:0,progress:0,gates:new Map()};tracker={completed:0,finished:false};
    rockRace.guide=BlacklineRaceGuide.create(THREE,route,RockportNavigation);rockRace.roadWidths=new Map();rockRace.guideTimer=0;world.add(rockRace.guide.mesh);
    Object.assign(car,RockportNavigation.sample(route,0));lapStart=0;lapTimes=[];timer=3;mode='countdown';
    checkpointMarker=BlacklineRaceGates.create(THREE);world.add(checkpointMarker);
    if(raceType==='race'){
      const boss=activeChallenge===null?null:career.challenges[activeChallenge];
      const entries=boss?[{vehicle:boss.vehicle,stage:boss.stage,name:boss.name}]:D.raceOpponents(config,tune);
      entries.forEach((entry,i)=>{const model=makeCar(['#be7845','#d7d6c4','#698276'][i],false,entry.vehicle),spec=tune(entry.stage,entry.vehicle);scene.add(model);
        const distance=6+i*7,state=V.create(RockportNavigation.sample(route,distance),{vehicle:entry.vehicle,stage:entry.stage,box:model.userData.hitbox});
        rivals.push({model,state,name:entry.name||VEHICLES[entry.vehicle].name,vehicle:entry.vehicle,distance,speed:0,spec,stuck:0,race:{route,next:route.checkpoints[0],passed:0,distance,driveDistance:distance,gate:0},delay:0,finishedAt:null});});
    }
    $('best').textContent=formatTime(getBest());$('map-legend').textContent='HIGHLIGHTED ROUTE · ARROWS / NEXT GATE';updateCheckpoint();updateRaceGuidance(0,true);showNotice('FOLLOW ROAD ARROWS · PASS EACH GATE IN ORDER',7);
  }
  function raceGate(distance){const r=rockRace,N=RockportNavigation;let g=r.gates.get(distance)||N.gate(r.route,distance);if(!g.measured&&openWorld.areaReady(g,65)){g=N.measureGate(g,openWorld.cells(),RockportPhysics);r.gates.set(distance,g);}return g;}
  function updateCheckpoint(){BlacklineRaceGates.pose(checkpointMarker,raceGate(rockRace.next));}
  function updateRaceGuidance(dt,force=false){
    if(!rockRace)return;const r=rockRace,N=RockportNavigation;r.guideTimer-=dt;if(!force&&r.guideTimer>0)return;r.guideTimer=.18;
    const p=BlacklineRaceGuide.locate(r.route,car,r.passed,r.next),d=p?.distance??r.distance,key=Math.floor(d/35)*35;
    let width=r.roadWidths.get(key);if(!width){const gate=N.gate(r.route,key);if(openWorld.areaReady(gate,65)){width=N.measureGate(gate,openWorld.cells(),RockportPhysics);if(width.measured)r.roadWidths.set(key,width);}}
    const guide=BlacklineRaceGuide.describe(r.route,car,r,N,r.guide.maneuvers,width||{left:22,right:22});r.guidance=guide;
    const panel=$('race-guide');panel.hidden=false;panel.dataset.status=guide.status;$('race-guide-arrow').textContent=guide.status==='turn'?(guide.direction==='left'?'↰':'↱'):guide.status==='wrong-way'?'↶':guide.status==='off-route'||guide.status==='missed-gate'?'!':guide.status==='finish'?'⚑':'↑';$('race-guide-title').textContent=guide.text;$('race-guide-detail').textContent=guide.detail;
    r.guide.update(d,car.speed,{areaReady:(p,radius)=>openWorld.areaReady(p,radius),surface:p=>RockportPhysics.surface(openWorld.cells(),p.x,p.z,p.y,1,1)},elapsed);
  }
  function updateRockRace(dt){
    const r=rockRace,N=RockportNavigation;updateCheckpoint();updateRaceGuidance(dt);
    r.progress=r.distance;
    if(N.advance(r,car,raceGate(r.next))){
      r.progress=r.distance;
      if(r.next>=length){const t=elapsed-lapStart;lapTimes.push(t);lapStart=elapsed;tracker.completed++;r.passed=0;
        if(t<getBest()){saved[bestKey()]=t;save();$('best').textContent=formatTime(t);}
        if(tracker.completed>=laps){tracker.finished=true;finishRace();return;}
        showNotice(`LAP ${tracker.completed} · ${formatTime(t)}`,3);
      }
      r.gate++;r.next=r.route.checkpoints[r.gate]??length;updateCheckpoint();
    }
    r.progress=r.distance;
    for(const rival of rivals){
      if(elapsed<rival.delay||rival.finishedAt!==null)continue;
      const state=rival.state,rr=rival.race,input=V.aiInput(state,r.route,rr.driveDistance,openWorld,dt);
      recoverAI(rival,input,dt);openWorld.simulate(state,input,dt);rival.speed=state.speed;
      const onLine=N.project(r.route,state,rr.driveDistance);if(onLine)rr.driveDistance=onLine.distance;
      if(N.advance(rr,state,raceGate(rr.next))){
        rr.gate++;if(rr.next>=length){rival.finishedAt=elapsed;rival.distance=length;state.speed=0;state.vx=0;state.vz=0;continue;}
        rr.next=r.route.checkpoints[rr.gate]??length;
      }
      rival.distance=rr.distance;
      if(V.needsReset(state)){V.reset(state,N.sample(r.route,rr.passed));rr.previous=null;rr.distance=rr.driveDistance=rr.passed;rival.distance=rr.passed;}
    }
  }
  function resetCar(){if(multiplayer?.isRacing){showNotice('END THE MULTIPLAYER RACE FIRST',2);return;}
    if(rockRace){const r=rockRace,d=clamp((r.guidance?.distance??r.distance)-18,r.passed,Math.max(r.passed,r.next-22)),p=RockportNavigation.sample(r.route,d),pose=openWorld.areaReady(p,8)?BlacklineWorldMap.travelPose(openWorld.nav,p,RockportNavigation,openWorld.cells(),RockportPhysics,car.box):null;r.distance=r.progress=pose?d:r.passed;r.previous=null;V.reset(car,pose||RockportNavigation.sample(r.route,r.passed));updateRaceGuidance(0,true);updateCamera(1,true);return;}
    if(openWorld){V.reset(car,openWorld.lastSafe);showNotice('RESET TO THE ROAD',2);updateCamera(1,true);return;}
    const index=tracker.checkpointIndex,s=samples[index];
    car.x=s.p.x;car.z=s.p.z;car.yaw=Math.atan2(s.t.x,s.t.z);car.speed=0;car.vx=0;car.vz=0;
    tracker.previous=index;lastIndex=index;showNotice('BACK ON TRACK',1.5);updateCamera(1,true);
  }
  function updateRace(dt,realDt=dt) {
    elapsed+=realDt;
    const input={throttle:keys.has('KeyW')||keys.has('ArrowUp'),brake:keys.has('KeyS')||keys.has('ArrowDown'),steer:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),handbrake:keys.has('Space'),nitro:keys.has('ShiftLeft')||keys.has('ShiftRight')};
    const previous={x:car.x,y:car.y,z:car.z};
    if(multiplayer?.hold&&!rockRace){car.speed=car.vx=car.vz=0;car.boost=false;updateOpenWorld(0,previous);updateModels(dt);updateCamera(dt);updateHUD();return;}
    if(openWorld?.rockport)openWorld.simulate(car,input,dt);
    else drive(car,input,dt,config.stage,config.vehicle,config);
    if(openWorld){
      if(car.grounded&&input.handbrake&&Math.abs(car.speed)>12&&input.steer){driftScore+=Math.abs(car.speed)*dt*3;driftBank=1.2;showNotice(`DRIFT · ${Math.floor(driftScore)} POINTS`,.2);}
      else if(driftBank>0){driftBank-=realDt;if(driftBank<=0&&driftScore>0){const reward=Math.floor(driftScore/10);addCash(reward);showNotice(`DRIFT +${reward} €`,2);driftScore=0;}}
      updateOpenWorld(dt,previous);if(rockRace){updateRockRace(dt);if(mode==='finished')return;}
      if(openWorld.rockport){V.collide([car,...rivals.map(r=>r.state),...police.map(c=>c.state),...(openWorld.traffic?.actors()||[]),...(openWorld.roadblocks?.actors()||[])],openWorld);if(V.needsReset(car))resetCar();if(car.hit)showNotice('IMPACT',.5);if(car.landed)showNotice('LANDING',.6);}
      document.body.classList.toggle('boosting',car.boost);updateModels(dt,input);updateCamera(dt);updateHUD();return;
    }
    const near=nearest(car.x,car.z);
    if(near.distance>track.width/2-.9){
      const nx=(car.x-near.x)/near.distance,nz=(car.z-near.z)/near.distance;
      car.x=near.x+nx*(track.width/2-.9);car.z=near.z+nz*(track.width/2-.9);
      const outward=car.vx*nx+car.vz*nz;
      if(outward>0){car.vx-=nx*outward*1.3;car.vz-=nz*outward*1.3;}
      car.speed*=Math.exp(-2.5*dt);showNotice('BARRIER IMPACT · R TO RESET',.3);
    }
    const previousGate=tracker.nextGate;
    if(tracker.update(near.index,near.distance<=track.width/2+2)){
      const lapTime=elapsed-lapStart;lapTimes.push(lapTime);lapStart=elapsed;
      if(lapTime<getBest()){saved[bestKey()]=lapTime;save();$('best').textContent=formatTime(lapTime);}
      showNotice(`LAP ${tracker.completed} · ${formatTime(lapTime)}`,3);
      if(tracker.finished){finishRace();return;}
    }
    if(previousGate!==tracker.nextGate)updateCheckpoint();
    const delta=wrap(near.index-lastIndex+SAMPLE_COUNT/2,SAMPLE_COUNT)-SAMPLE_COUNT/2;
    if(delta<-.15&&car.speed>10)showNotice('WRONG WAY',.4);
    lastIndex=near.index;
    for(const rival of rivals){
      const u=wrap(rival.distance/length,1);
      const t1=curve.getTangentAt(u),t2=curve.getTangentAt(wrap(u+.025,1));
      const bend=Math.acos(clamp(t1.dot(t2),-1,1));
      const target=rival.base*(1-clamp(bend*1.2,0,.48));
      rival.speed=target<rival.speed?Math.max(target,rival.speed-rival.spec.brakes*dt):Math.min(target,rival.speed+rival.spec.acceleration*dt*Math.max(0,1-(rival.speed/rival.spec.max)**2));rival.distance+=rival.speed*dt;
      if(rival.distance>=length*laps&&rival.finishedAt===null){rival.finishedAt=elapsed;rival.distance=length*laps;rival.speed=0;}
      const p=curve.getPointAt(wrap(rival.distance/length,1)),t=curve.getTangentAt(wrap(rival.distance/length,1));
      p.x+=t.z*rival.lane;p.z-=t.x*rival.lane;
      const dx=car.x-p.x,dz=car.z-p.z,dist=Math.hypot(dx,dz);
      if(dist<3&&dist>.01){car.x+=dx/dist*dt*7;car.z+=dz/dist*dt*7;car.speed*=Math.exp(-.8*dt);}
    }
    document.body.classList.toggle('boosting',car.boost);
    updateModels(dt,input);updateCamera(dt);updateHUD();
  }
  function updateModels(dt,input={}) {

    if(openWorld?.rockport)openWorld.pose(raceCar,car.x,car.z,car.yaw,car.y,car);else BlacklineTerrain.pose(raceCar,car.x,car.z,car.yaw,terrainTheme());
    raceCar.rotation.z+=-(input.steer||0)*Math.min(Math.abs(car.speed)*.0012,.055);
    BlacklineCars.animate(raceCar,car.speed,dt,car.steer||0);
    updateDust(dt,input);
    raceCar.userData.flames.visible=car.boost;
    openWorld?.roadblocks?.pose();
    for(const c of openWorld?.traffic?.cars||[]){const p=c.state;openWorld.pose(c.model,p.x,p.z,p.yaw,p.y,p);}
    for(const cop of police){const p=cop.state;openWorld.pose(cop.model,p.x,p.z,p.yaw,p.y,p);BlacklineCars.animate(cop.model,p.speed,dt,p.steer||0);}
    raceCar.userData.tails.forEach(t=>t.material.color.set(input.brake||input.handbrake?0xff6d47:0xcf302c));
    for(const rival of rivals){
      if(rockRace){const p=rival.state;openWorld.pose(rival.model,p.x,p.z,p.yaw,p.y,p);BlacklineCars.animate(rival.model,p.speed,dt,p.steer||0);continue;}
      const u=wrap(rival.distance/length,1),p=curve.getPointAt(u),t=curve.getTangentAt(u);
      BlacklineTerrain.pose(rival.model,p.x+t.z*rival.lane,p.z-t.x*rival.lane,Math.atan2(t.x,t.z),terrainTheme());BlacklineCars.animate(rival.model,rival.speed,dt);
    }
  }
  const cameraTarget=new THREE.Vector3(),cameraDesired=new THREE.Vector3(),cameraAnchor=new THREE.Vector3();
  let cameraAnchored=false;
  function updateCamera(dt,snap=false) {
    if(snap){mouseLookInput?.release();driveCamera.reset(mouseLook);}else driveCamera.step(mouseLook,dt);
    if(scene.userData.sun){const sun=scene.userData.sun;sun.position.set(car.x-50,ground(car.x,car.z)+80,car.z+40);sun.target.position.set(car.x,ground(car.x,car.z),car.z);}
    const view=driveCamera.pose(mouseLook,{x:car.x,y:openWorld?.rockport?car.y:ground(car.x,car.z),z:car.z,yaw:car.yaw},cameraMode);
    // Carry the camera with the car's translation. Smoothing the entire world
    // position made follow distance grow by speed / 5 during acceleration.
    // Keep smoothing for heading changes, height and camera-mode transitions.
    if(cameraAnchored&&!snap){camera.position.x+=car.x-cameraAnchor.x;camera.position.z+=car.z-cameraAnchor.z;}
    cameraAnchor.set(car.x,car.y,car.z);cameraAnchored=true;
    cameraDesired.set(view.position.x,view.position.y,view.position.z);
    camera.position.lerp(cameraDesired,snap?1:1-Math.exp(-(mouseLook.held?16:5)*dt));
    if(openWorld?.rockport){const safe=RockportPhysics.clipCamera(openWorld.cells(),{x:car.x,y:car.y+1.4,z:car.z},camera.position);camera.position.set(safe.x,safe.y,safe.z)}
    cameraTarget.set(view.target.x,view.target.y,view.target.z);camera.lookAt(cameraTarget);
    const fov=60+(car.boost?3:0)+Math.min(Math.abs(car.speed)*.02,2);camera.fov+=(fov-camera.fov)*(snap?1:Math.min(dt*3,1));camera.updateProjectionMatrix();
  }
  function playerDistance(){
    if(rockRace)return rockRace.progress;
    // Gate-based progress prevents ranking shortcuts around the start line.
    const sectorStart=tracker.checkpointIndex,within=clamp(wrap(lastIndex-sectorStart,SAMPLE_COUNT),0,SAMPLE_COUNT/tracker.gates);
    return (tracker.completed+(sectorStart+within)/SAMPLE_COUNT)*length;
  }
  function position(){return 1+rivals.filter(r=>r.distance>playerDistance()).length;}
  function updateHUD() {
    $('pursuit-hud').hidden=!openWorld||!!rockRace;
    $('breaker').textContent=`X · SPEEDBREAKER ${Math.round(breakerEnergy)}%`;
    $('speed').textContent=Math.round(Math.abs(car.speed)*3.6);
    $('gear').textContent=car.speed<-.5?'R':car.speed<1?'N':Math.min(6,1+Math.floor(car.speed/(tune(config.stage,config.vehicle,config).max/6)));
    $('lap').textContent=openWorld&&!rockRace?`${openWorld.pickups.filter(p=>p.collected).length} / 8`: rockRace?`${Math.min(100,Math.floor(rockRace.distance/length*100))}%`:`${Math.min(tracker.completed+1,laps)} / ${laps}`;
    $('lap').previousElementSibling.textContent=openWorld&&!rockRace?'COLLECTIBLES':rockRace?'PROGRESS':'LAP';
    $('position').innerHTML=openWorld&&!rockRace?'OW':raceType==='time'?'TT':`${position()} <small>/ ${rivals.length+1}</small>`;
    $('position-label').textContent=openWorld&&!rockRace?'FREE ROAM':raceType==='time'?'TIME TRIAL':'POSITION';
    $('best').previousElementSibling.textContent=openWorld&&!rockRace?'SPEED TRAP':'BEST TIME';
    if(openWorld&&!rockRace)$('best').textContent=`${openWorld.speedBest} km/h`;
    $('race-gates').hidden=!rockRace;if(rockRace)$('race-gates').textContent=`GATE ${Math.min(rockRace.gate+1,rockRace.route.checkpoints.length)} / ${rockRace.route.checkpoints.length} · ${Math.round(Math.hypot(car.x-RockportNavigation.sample(rockRace.route,rockRace.next).x,car.z-RockportNavigation.sample(rockRace.route,rockRace.next).z))} M${activeChallenge!==null?' · '+career.challenges[activeChallenge].name:''}`;
    $('race-guide').hidden=!rockRace||!['race','countdown'].includes(mode);
    $('time').textContent=formatTime(elapsed);$('nitro').style.width=`${car.nitro}%`;$('nitro-text').textContent=car.nitroEmpty?'RELEASE SHIFT':`${Math.round(car.nitro)}%`;
    $('rev').style.width=`${Math.min(100,Math.abs(car.speed)/87*100)}%`;
    drawMap();
  }
  function drawMap(){
    const ctx=$('map').getContext('2d');ctx.clearRect(0,0,220,180);
    if(openWorld){drawWorldMap(ctx);return;}
    const xs=samples.map(s=>s.p.x),zs=samples.map(s=>s.p.z),minX=Math.min(...xs),minZ=Math.min(...zs),maxX=Math.max(...xs),maxZ=Math.max(...zs);
    const scale=Math.min(180/(maxX-minX),140/(maxZ-minZ));
    const xy=(x,z)=>[110+(x-(maxX+minX)/2)*scale,90+(z-(maxZ+minZ)/2)*scale];
    ctx.beginPath();samples.forEach((s,i)=>{const p=xy(s.p.x,s.p.z);i?ctx.lineTo(...p):ctx.moveTo(...p);});ctx.closePath();ctx.strokeStyle='#839483';ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle='#27382d';ctx.lineWidth=3;ctx.stroke();
    const gate=samples[(tracker.nextGate%tracker.gates)*SAMPLE_COUNT/tracker.gates],gp=xy(gate.p.x,gate.p.z);ctx.fillStyle='#d5ed75';ctx.fillRect(gp[0]-3,gp[1]-3,6,6);
    for(const r of rivals){const p=xy(r.model.position.x,r.model.position.z);ctx.beginPath();ctx.arc(...p,3,0,Math.PI*2);ctx.fillStyle='#f1a16b';ctx.fill();}
    const p=xy(car.x,car.z);ctx.save();ctx.translate(...p);ctx.rotate(-car.yaw);ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(-4,-4);ctx.lineTo(4,-4);ctx.closePath();ctx.fillStyle='#e4ff8b';ctx.fill();ctx.restore();
  }
  function showNotice(text,duration){$('notice').textContent=text;noticeTimer=duration;}
  function pauseGame(){if(!['race','countdown'].includes(mode))return;mouseLookInput?.release();previousMode=mode;mode='paused';keys.clear();$('overlay').hidden=false;$('overlay-label').textContent='PIT STOP';$('overlay-title').textContent='PAUSE.';$('overlay-description').textContent='Take a breather. The road is waiting.';$('results').innerHTML='';$('resume').hidden=false;}
  function resumeGame(){if(mode!=='paused')return;mode=previousMode;$('overlay').hidden=true;frameTime=performance.now();}
  function finishRace(){
    if(mode==='finished')return;
    mode='finished';keys.clear();car.boost=false;document.body.classList.remove('boosting');
    updateHUD();$('overlay').hidden=false;$('resume').hidden=true;$('overlay-label').textContent='SESSION COMPLETE';
    const place=1+rivals.filter(r=>r.finishedAt!==null&&r.finishedAt<elapsed).length;
    let reward=D.raceReward(raceType,place,length);
    let challengeText='',pinkSlipText='';
    if(activeChallenge!==null){const c=career.challenges[activeChallenge],won=career.challengeWon(c,{elapsed,place});
      const claim=career.claimPinkSlip(saved,activeChallenge,{elapsed,place});saved=claim.state;
      if(claim.firstWin){reward+=claim.bonus;challengeText=`#${c.rank} ${c.name} DEFEATED`;pinkSlipText=`<div><span>PINK SLIP · CAR ADDED TO GARAGE</span><b>${c.car} · STAGE ${c.stage}</b></div>`;if(claim.unlocked.includes('razor'))pinkSlipText+='<div><span>BONUS CAR</span><b>Razor prologue Mustang GT</b></div>';}
      else challengeText=won?'CHALLENGE WON AGAIN · CAR ALREADY OWNED':'CHALLENGE NOT YET WON';
    }
    if(activeChallenge===null)saved=career.recordRaceWin(saved,{mode:raceType,place,elapsed});
    addCash(reward);
    $('overlay-title').textContent=raceType==='time'?'FINISHED.':place===1?'VICTORY.':`${place}${place===2?'ND':place===3?'RD':'TH'} PLACE`;
    $('overlay-description').textContent=raceType==='time'?'Sprint time saved.':`Sprint complete. Race wins toward the next Blacklist challenge: ${career.normalizeProgress(saved).raceWinsSinceBoss} / ${career.requiredRaceWins}.`;
    $('results').innerHTML=`<div><span>${challengeText||'Race reward'}</span><b>+${reward} €</b></div>${pinkSlipText}<div><span>Total time</span><b>${formatTime(elapsed)}</b></div>`+lapTimes.map((t,i)=>`<div><span>Sprint ${i+1}</span><b>${formatTime(t)}</b></div>`).join('');
  }
  function backToMenu(){multiplayerCars.clear();mouseLookInput?.release();rockRace=null;mode='menu';if(openWorld?.rockport){openWorld.dispose();openWorld=null;disposeScene(scene);scene=null;}activeChallenge=null;keys.clear();$('menu').hidden=false;$('hud').hidden=true;$('overlay').hidden=true;$('interact').hidden=true;document.body.classList.remove('playing','boosting','speedbreaking');syncGarageUI();updateMenuBest();}
  function bestKey(){return `v025-sprint-best-${activeChallenge===null?`track-${trackId}`:`boss-${career.challenges[activeChallenge].id}`}-${config.vehicle}-${config.stage}-${config.tires}-${config.gearing}-${config.brakes}-${config.response}-${config.aero}-${config.nitrous}`;}
  function getBest(){const value=saved[bestKey()];return typeof value==='number'&&Number.isFinite(value)&&value>0?value:Infinity;}
  function updateMenuBest(){$('menu-best').textContent=`Best sprint (${config.vehicle.toUpperCase()} / Stage ${config.stage}): ${formatTime(getBest())}`;}
  function save(){saved.builds||={};saved.builds[config.vehicle]={...config};try{localStorage.setItem('blackline-v1',JSON.stringify({...saved,config}));}catch{/* Private browsing can disable storage. */}}
  function ensureAudio(){
    if(muted){engineAudio?.impacts.setEnabled(false);return;}
    try{
      if(!engineAudio){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;const ctx=new Context(),osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='sawtooth';filter.type='lowpass';filter.frequency.value=380;gain.gain.value=0;osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);osc.start();
        const siren=ctx.createOscillator(),sirenGain=ctx.createGain();siren.type='sine';sirenGain.gain.value=0;siren.connect(sirenGain);sirenGain.connect(ctx.destination);siren.start();const impacts=BlacklineImpactEffects.createAudio(ctx);engineAudio={ctx,osc,gain,siren,sirenGain,impacts};}
      engineAudio.ctx.resume();
    }catch{muted=true;$('sound').textContent='SOUND OFF';}
  }
  function playImpact(event){
    if(muted||mode!=='race'||!engineAudio||!car)return;
    engineAudio.impacts.setEnabled(true);
    const p=event.position,distance=Math.hypot(p.x-car.x,p.y-car.y,p.z-car.z);
    engineAudio.impacts.play({...event,distance});
  }
  function garageDistance(){if(tuningActive)return 10.5;const x=Math.sin(garageAngle),z=Math.cos(garageAngle);return Math.min(10.5,z<0?4.6/-z:10.5,x<0?8.5/-x:10.5);}
  function resize(){
    dealerShowroom?.resize();
    renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);psx.resize(innerWidth,innerHeight);
    if(camera){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
    garageCamera.aspect=innerWidth/innerHeight;
    garageCamera.fov=innerWidth<=760?Math.max(38,2*Math.atan(5.8/(2*garageDistance()*garageCamera.aspect))*180/Math.PI):38;
    const customizing=document.body.classList.contains('customizing'),narrow=innerWidth<=760;
    garageCamera.setViewOffset(innerWidth,innerHeight,innerWidth*(customizing?(narrow?0:.08):narrow?-.18:-.075),customizing&&narrow?innerHeight*.26:0,innerWidth,innerHeight);
    garageCamera.updateProjectionMatrix();
  }
  let multiplayer,mpPaused=false,mpFinish=null;
  function updateMultiplayerRace(){
    multiplayer?.frame(car);
    const r=multiplayer?.isRacing&&openWorld?.rockport?multiplayer.race:null;
    if(mpFinish&&(!r||mpFinish.id!==r.id||mpFinish.mesh.parent!==world)){mpFinish.mesh.removeFromParent();disposeScene(mpFinish.mesh);mpFinish=null;}
    if(r?.goal&&!mpFinish){const mesh=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(r.goal.radius,.22,5,64),new THREE.MeshBasicMaterial({color:0xf5d66f}));ring.rotation.x=-Math.PI/2;mesh.add(ring);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,32,8),new THREE.MeshBasicMaterial({color:0xf5d66f,transparent:true,opacity:.5,depthWrite:false}));beam.position.y=16;mesh.add(beam);mesh.position.set(r.goal.x,r.goal.y+.2,r.goal.z);world.add(mesh);mpFinish={id:r.id,mesh};}
    if(r&&multiplayer.hold&&r.status==='countdown'&&r.anchors?.[multiplayer.session.id]){Object.assign(car,r.anchors[multiplayer.session.id]);car.speed=car.vx=car.vz=0;}
  }
  const multiplayerCars=BlacklineMultiplayerCars.create();
  function multiplayerSnapshot(){
    const roaming=!!openWorld?.rockport&&!rockRace&&!['menu','workshop','dealer','loading'].includes(mode);
    const moving=roaming&&mode==='race'&&!multiplayer?.isOpen;
    return {phase:rockRace?'race':roaming?'roam':'garage',config:{...config},x:car?.x||0,y:car?.y||0,z:car?.z||0,yaw:car?.yaw||0,pitch:car?.pitch||0,roll:car?.roll||0,speed:moving?car.speed:0,vx:moving?car.vx:0,vz:moving?car.vz:0,steer:car?.steer||0};
  }
  function bindMultiplayer(){
    multiplayer=BlacklineMultiplayer.create({snapshot:multiplayerSnapshot,
      onOpen:()=>{mpPaused=['race','countdown'].includes(mode);if(mpPaused){pauseGame();$('overlay').hidden=true;}keys.clear();},
      onClose:()=>{if(mpPaused){resumeGame();mpPaused=false;}},
      onDrive:()=>{if(mode==='map')closeCityMap();return startRockport({travelTarget:{kind:'multiplayer',x:1728,y:147.719,z:-2508,yaw:Math.PI/2}});}
    });
  }
  function frame(now){
    requestAnimationFrame(frame);const dt=Math.min((now-frameTime)/1000||0,.05);frameTime=now;
    updateMultiplayerRace();
    multiplayerCars.update({scene:openWorld?.rockport&&!rockRace&&!['menu','workshop','dealer'].includes(mode)?scene:null,world:openWorld,local:car,peers:multiplayer?.peers||[],dt});
    if(mode==='map'){
      // Simulation, countdown and pursuit clocks stay frozen while the map owns the view.
    }else if(mode==='dealer'){
      if(dealerShowroom){dealerShowroom.frame(dt);psx.render(dealerShowroom.scene,dealerShowroom.camera);}else psx.render(garageScene,garageCamera);
    }else if(mode==='menu'||mode==='workshop'){
      const distance=garageDistance()*garageView.zoom;garageView.yaw=garageAngle;
      garageTime+=dt;garageCamera.position.set(clamp(garageView.panX+Math.sin(garageAngle)*Math.cos(garageView.pitch)*distance,tuningActive?-12:-8.2,tuningActive?12:8.2),clamp(1+garageView.panY+Math.sin(garageView.pitch)*distance,.18,6),clamp(garageView.panZ+Math.cos(garageAngle)*Math.cos(garageView.pitch)*distance,tuningActive?-12:-4.4,tuningActive?12:10.5));tuningLookAt.set(garageView.panX,1+garageView.panY,garageView.panZ);if(tuningActive){tuningGarage.frame(hero);garageCamera.position.copy(tuningGarage.clip(garageCamera.position,tuningLookAt));}garageCamera.lookAt(tuningLookAt);
      psx.render(garageScene,garageCamera);
    }else{
      if(mode==='countdown'){updateCamera(dt);timer-=dt;$('countdown').textContent=timer>0?Math.ceil(timer):'GO';if(timer<=0){mode='race';timer=-.85;}}
      else if(mode==='race'){
        const slow=keys.has('KeyX')&&breakerEnergy>1;breakerEnergy=clamp(breakerEnergy+(slow?-24:10)*dt,0,100);
        document.body.classList.toggle('speedbreaking',slow);updateRace(slow?dt*.38:dt,dt);
        if(timer<0){timer+=dt;$('countdown').textContent=timer<0?'GO':'';}
      }
      if(noticeTimer>0&&mode==='race'){noticeTimer-=dt;if(noticeTimer<=0)$('notice').textContent='';}
      psx.render(scene,camera);
    }
    if(engineAudio){const driving=mode==='race'&&!muted;engineAudio.impacts.setEnabled(driving);engineAudio.osc.frequency.setTargetAtTime(40+(car?Math.abs(car.speed)*2.7:0),engineAudio.ctx.currentTime,.08);engineAudio.gain.gain.setTargetAtTime(driving?.035:0,engineAudio.ctx.currentTime,.08);
      engineAudio.siren.frequency.setTargetAtTime(650+Math.sin(elapsed*5)*250,engineAudio.ctx.currentTime,.08);engineAudio.sirenGain.gain.setTargetAtTime(driving&&openWorld&&pursuit.phase==='chase'?.025:0,engineAudio.ctx.currentTime,.12);}
  }
  function closeCityMap(){
    if(mode!=='map')return;
    cityMapUI.close();mode=mapReturnMode;keys.clear();frameTime=performance.now();
    for(const [id,hidden] of Object.entries(mapHiddenState))$(id).hidden=hidden;
  }
  function openCityMap(){
    if(!cityMapUI||!$('loading').hidden||!['menu','race','countdown','paused'].includes(mode)||!$('career-panel').hidden||!$('race-entry-panel').hidden||document.body.classList.contains('customizing'))return;
    mapReturnMode=mode;mapHiddenState=Object.fromEntries(['menu','hud','overlay'].map(id=>[id,$(id).hidden]));
    for(const id of Object.keys(mapHiddenState))$(id).hidden=true;
    mouseLookInput?.release();keys.clear();mode='map';
    const player=openWorld?.rockport&&car?{x:car.x,y:car.y,z:car.z,yaw:car.yaw}:BlacklineWorldMap.garage(cityMapData,saved.lastGarageId);
    const dealer=cityMapData.dealer;
    const markers=[...cityMapData.garages,cityMapData.tuning,...(cityMapData.landmarks||[]),{...dealer,kind:'dealer',label:dealer.name},...raceCatalog.map((r,i)=>({...RockportNavigation.sample(r,0),kind:'race-'+i,label:r.name,number:i+1}))];
    if(multiplayer?.isRacing)markers.push({...multiplayer.race.goal,id:'mp-finish',kind:'landmark',label:'MULTIPLAYER FINISH',available:true});
    cityMapUI.open({player,markers,race:rockRace?.route,waypoint,canTeleport:!multiplayer?.isRacing&&BlacklineWorldMap.travelAllowed(mapReturnMode,!!rockRace,pursuit.phase)});
  }
  async function teleportFromMap(target){
    if(multiplayer?.isRacing)return {error:'Fast travel is disabled during a multiplayer race.'};
    if(mode!=='map'||!BlacklineWorldMap.travelAllowed(mapReturnMode,!!rockRace,pursuit.phase))return {error:'Fast travel is only available in free roam outside a pursuit.'};
    if(target.available===false||!['x','y','z'].every(k=>Number.isFinite(target[k])))return {error:'This destination is unavailable.'};
    closeCityMap();if(mode==='race')pauseGame();
    const ok=await startRockport({travelTarget:target});
    if(ok){waypoint=null;mouseLookInput?.release();driveCamera.reset(mouseLook);updateCamera(1,true);showNotice('FAST TRAVEL · '+target.label,4);}
    return ok?{}:{error:'Fast travel failed. Your current drive was preserved.'};
  }
  async function loadRaceCatalog(){
    cityMapData=await fetch('assets/rockport/world-map.json').then(r=>{if(!r.ok)throw Error('City map data is missing');return r.json();});
    cityMapData.dealer=await fetch('assets/dealer/location.json').then(r=>r.json());
    cityMapData.tuning=await fetch('assets/tuning/location.json').then(r=>{if(!r.ok)throw Error('Tuning garage location is missing');return r.json();});
    cityMapUI=BlacklineWorldMapUI.create({data:cityMapData,onClose:closeCityMap,onTeleport:teleportFromMap,onClear:()=>{waypoint=null;},onNavigate:target=>{
      const nav=openWorld?.nav||mapNav;
      if(!nav)return {error:'Loading the road network. Please try again shortly.'};
      const start=openWorld?.rockport&&car?car:BlacklineWorldMap.garage(cityMapData,saved.lastGarageId);
      const result=BlacklineWorldMap.directions(nav,start,target,RockportNavigation);if(!result.error)waypoint=result;return result;
    }});
    // The large graph is already loaded during driving; menu-only use loads it on demand.
    const loadMap=()=>{if(!openWorld?.nav&&!mapNav)fetch('assets/rockport/navigation.json').then(r=>r.json()).then(n=>{mapNav=n;}).catch(console.error);openCityMap();};
    $('open-map').onclick=loadMap;$('drive-map').onclick=loadMap;
    raceCatalog=await fetch('assets/rockport/routes.json').then(r=>{if(!r.ok)throw Error('Race routes are missing');return r.json()});

  }
  function refreshVehicles(){
    const pinkSlips=career.ownedPinkSlips(saved);
    $('garage-count').textContent='OWNED CARS / '+RacingCore.VEHICLE_ORDER.filter(id=>D.owns(saved,id)).length;
    $('vehicle').replaceChildren(...RacingCore.VEHICLE_ORDER.filter(id=>D.owns(saved,id)).map(id=>{const v=VEHICLES[id],o=document.createElement('option');o.value=id;o.textContent=`${v.name} ${v.badge} · ${v.zero100.toFixed(1)} s${pinkSlips.includes(id)?' · PINK SLIP':''}`;return o;}));
  }
  function bindUI(){
    mouseLookInput=driveCamera.bind(mouseLook,$('game'),()=>mode==='race'||mode==='countdown');
    refreshVehicles();
    $('vehicle').setAttribute('aria-label','Cars from slowest to fastest · Stock 0–100 km/h');
    $('start').onclick=()=>{if($('race-entry-panel').hidden||mode!=='paused'||!openWorld?.rockport)return;$('race-entry-panel').hidden=true;activeChallenge=null;startRace();};$('race-entry-close').onclick=closeRaceEntry;$('rockport').onclick=()=>startRockport();$('interact').onclick=interact;
    $('career').onclick=openCareer;$('career-close').onclick=closeCareer;$('career-drive').onclick=()=>{if(mode!=='menu')return;closeCareer();startRockport();};$('buy-stage').onclick=spendStage;
    $('dealership').onclick=openDealer;$('dealer-close').onclick=closeDealer;$('dealer-buy').onclick=buyDealerCar;
    $('dealer-use').onclick=()=>{if(!D.owns(saved,dealerSelection))return;const id=dealerSelection;closeDealer();if(mode!=='menu')backToMenu();selectOwnedVehicle(id);};
    $('pause').onclick=pauseGame;$('resume').onclick=resumeGame;$('restart').onclick=()=>rockRace?startRace():startRockport();$('back').onclick=backToMenu;
    document.querySelector('.brand').onclick=e=>{e.preventDefault();if(mode!=='menu')pauseGame();};

    document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{config.color=b.dataset.color;config.paint='custom';applyCarConfig(hero);syncGarageUI();save();});
    for(const name of ['rims','spoiler'])$(name).onchange=()=>{config[name]=$(name).type==='checkbox'?$(name).checked:$(name).value;applyCarConfig(hero);syncGarageUI();updateMenuBest();save();};
    $('stage').onchange=()=>{selectedStage=Number($('stage').value);if(selectedStage<=ownedStage()){config.stage=selectedStage;save();}syncGarageUI(true);updateMenuBest();};
    $('vehicle').onchange=()=>selectOwnedVehicle($('vehicle').value);
    $('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'SOUND OFF':'SOUND ON';$('sound').setAttribute('aria-label',muted?'Enable sound':'Disable sound');ensureAudio();};
    const controlled=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyW','KeyA','KeyS','KeyD','KeyR','KeyC','KeyE','KeyB','KeyX','KeyH','Escape'];
    $('cheat-form').onsubmit=e=>{e.preventDefault();submitCheatCode();};
    addEventListener('keydown',e=>{
      if(multiplayer?.isOpen){if(e.code==='Escape')multiplayer.close();return;}
      if(e.code==='F10'&&e.ctrlKey&&e.shiftKey&&!e.altKey&&!e.metaKey){e.preventDefault();if(!e.repeat)activateUnlockCheat();return;}
      if(e.code==='KeyM'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName)){
        e.preventDefault();if(e.repeat)return;
        if(mode==='map')closeCityMap();else $('open-map').click();return;
      }
      if(!$('career-panel').hidden){if(e.code==='Escape'){e.preventDefault();closeCareer();}return;}
      if(!$('race-entry-panel').hidden){if(e.code==='Escape'){e.preventDefault();closeRaceEntry();}return;}
      if(mode==='map'){if(e.code==='Escape'){e.preventDefault();closeCityMap();}return;}
      if(mode==='workshop'){if(e.code==='Escape'){e.preventDefault();$('custom-close').click();}return;}
      if(mode==='menu'||!controlled.includes(e.code))return;
      e.preventDefault();if(e.repeat)return;
      if(e.code==='Escape'){if(mode==='dealer')closeDealer();else mode==='paused'?resumeGame():pauseGame();return;}
      if(mode==='countdown'){if(!['KeyR','KeyC'].includes(e.code))keys.add(e.code);return;}
      if(mode!=='race')return;
      if(e.code==='KeyH'&&openWorld&&!rockRace&&pursuit.phase==='patrol')pursuit.offence=6;
      else if(e.code==='KeyB')openCareer();else if(e.code==='KeyE')interact();else if(e.code==='KeyR')resetCar();else if(e.code==='KeyC')cameraMode=1-cameraMode;else keys.add(e.code);
    });
    addEventListener('keyup',e=>keys.delete(e.code));
    addEventListener('blur',()=>{keys.clear();pauseGame();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();pauseGame();}});
    document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(mode==='race')keys.add(b.dataset.key);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.key);});
    addEventListener('resize',resize);
  }
  function submitCheatCode(){
    if(!['BLACKLISTED','BLACKLINE'].includes($('cheat-code').value.trim().toUpperCase())){$('cheat-feedback').textContent='Unknown code. Enter BLACKLISTED and press UNLOCK.';return;}
    if(activateUnlockCheat()){$('cheat-code').value='';$('cheat-feedback').textContent='Code accepted. Cars, Stage 4 and challenges unlocked. Cash set to at least €1,000,000.';}
  }
  function activateUnlockCheat(){
    if(mode!=='menu'&&mode!=='paused'){showNotice('UNLOCK ALL · Use this code in the garage or while paused',4);return false;}
    saved=BlacklineDealership.unlockAll(saved);save();syncGarageUI();
    if(mode==='paused')$('overlay-description').textContent='UNLOCK ALL · Cars, Stage 4 and challenges unlocked. Cash set to at least €1,000,000. Earned wins are preserved.';
    return true;
  }
  function syncGarageUI(preview=false){
    $('cheat-status').hidden=saved.cheats?.unlockAll!==true;
    refreshVehicles();
    if(!preview)selectedStage=config.stage;
    document.querySelectorAll('[data-color]').forEach(b=>{const active=b.dataset.color===config.color;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active);});
    const spec=tune(selectedStage,config.vehicle,config);
    $('rims').value=config.rims;$('spoiler').checked=config.spoiler;$('stage').value=selectedStage;$('vehicle').value=config.vehicle;
    $('power').textContent=spec.power;$('grip').textContent=spec.grip.toFixed(1);$('setup-summary').textContent='GRIP '+spec.grip.toFixed(1)+' / BRAKES '+Math.round(spec.brakes)+' / N₂O '+(100/spec.nitroDrain).toFixed(1)+' s · '+Math.round(spec.nitroPower)+' m/s²';
    $('power').textContent=spec.power;$('top-speed').textContent=Math.round(spec.max*3.6);
    $('car-title').innerHTML=`${spec.name} <span>${spec.badge}</span>`;$('drivetrain').textContent=spec.drive;
    $('car-sub').textContent=`STOCK 0–100: ${VEHICLES[config.vehicle].zero100.toFixed(1)} s · ${VEHICLES[config.vehicle].topKph} KM/H · ${VEHICLES[config.vehicle].reference}`;
    $('tune-description').textContent=['Stock · Factory engine and street brakes.','ECU + exhaust · Stronger acceleration and better brakes.','Big turbo + intercooler · More grip and nitrous.','Built engine + suspension · Ready for the track.','Full race build · Maximum power, race brakes and long-lasting nitrous.'][selectedStage];
    const locked=selectedStage>ownedStage();$('buy-stage').hidden=!locked;$('buy-stage').disabled=wallet()<career.costs[selectedStage];
    $('buy-stage').textContent=`BUY ${career.costs[selectedStage]} € · EQUIPPED STAGE ${config.stage}`;
    $('tune-meter').style.width=`${selectedStage*25}%`;
    $('cash').textContent=wallet().toLocaleString('en-GB');$('career-summary').textContent=`${saved.blacklistMW||0} / ${career.challenges.length}`;
    if($('tuning-wallet'))$('tuning-wallet').textContent=`CASH ${wallet().toLocaleString('en-GB')} €`;
    if($('tuning-performance-summary'))$('tuning-performance-summary').textContent=`STAGE ${selectedStage} · ${spec.power} HP · ${Math.round(spec.max*3.6)} KM/H`;
  }

  const customSchema={
    skin:['01 / COLOR TINT',{original:'Original texture',warm:'Warm tint',cold:'Cool tint',primer:'Dark tint'}],
    wear:['02 / SURFACE WEAR',{clean:'Clean',road:'Road dust',race:'Race grime'}],
    color:['BODY COLOR','color'],
    wheel:['03 / WHEELS',{original:'Stock wheels',...Object.fromEntries(Object.entries(window.BLACKLINE_PARTS.rims).map(([id,p])=>[id,p.name]))}],
    rims:['04 / RIM FINISH',{silver:'Original',gold:'Bronze',black:'Black',custom:'Custom color'}],
    rimColor:['CUSTOM RIM COLOR','color'],
    wingStyle:['REAR WING',{stock:'Original',street:'Low street wing',race:'High race wing',...Object.fromEntries(Object.entries(window.BLACKLINE_PARTS.wings).map(([id,p])=>[id,p.name])),...BlacklineWorkshop.options('wing')}],
    splitter:['FRONT SPLITTER',{stock:'Stock',street:'Street',race:'Race',...BlacklineWorkshop.options('splitter')}],
    skirts:['SIDE SKIRTS',{stock:'Stock',street:'Street',race:'Race',...BlacklineWorkshop.options('skirts')}],
    diffuser:['REAR DIFFUSER',{stock:'Stock',...BlacklineWorkshop.options('diffuser')}],
    canards:['CANARDS',{stock:'No extra parts',...BlacklineWorkshop.options('canards')}],
    hoodVent:['HOOD VENTS',{stock:'Stock',...BlacklineWorkshop.options('hood')}],
    spats:['REAR SPATS',{stock:'No extra parts',...BlacklineWorkshop.options('spats')}],
    arches:['FENDER FLARES',{stock:'Stock',...BlacklineWorkshop.options('arches')}],
    offset:['WHEEL OFFSET · M',[0,.18,.01]],
    response:['STEERING RESPONSE',{relaxed:'Relaxed',balanced:'Balanced',sharp:'Sharp'}],
    aero:['DOWNFORCE',{speed:'Top speed',balanced:'Balanced',grip:'Cornering grip'}],
    nitrous:['NITROUS TUNING',{duration:'Long duration · Less power',balanced:'Balanced',power:'High power · Short duration'}],
    tires:['05 / TIRE COMPOUND',{street:'Street tires · Standard handling',sport:'Sport · More grip',semi:'Semi-slick · Maximum grip',drift:'Drift · Easier slides'}],
    gearing:['06 / GEARING',{short:'Short · Acceleration',balanced:'Balanced',long:'Long · Top speed'}],
    brakes:['07 / BRAKES',{stock:'Stock',sport:'Sport',race:'Race'}],
    ride:['08 / RIDE HEIGHT · M',[-.09,.04,.01]],camber:['09 / CAMBER · DEGREES',[-10,0,.5]]
  };
  function validateCustom(value){
    const clean={};for(const [key,[label,rule]] of Object.entries(customSchema)){
      let v=key==='camber'?-Math.abs(Number(value[key])):value[key];if(key==='wheel'&&v!==undefined&&v!=='original'&&!window.BLACKLINE_PARTS.rims[v])v='jdm1';if(rule==='color'){if(typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v))clean[key]=v;}
      else if(Array.isArray(rule)){if(Number.isFinite(Number(v))&&v!==undefined)clean[key]=clamp(Number(v),rule[0],rule[1]);}
      else if(Object.hasOwn(rule,v))clean[key]=v;
    }if(value.paint==='custom'||value.paint==='original')clean.paint=value.paint;if(typeof value.spoiler==='boolean')clean.spoiler=value.spoiler;clean.partOffsets=BlacklinePartPlacement.sanitize(value.partOffsets);return clean;
  }
  function refreshPlacementUI(){
    const select=$('placement-part');if(!select||!hero)return;
    const parts=hero.userData.adjustableParts||[];if(!parts.some(p=>p.key===placementKey))placementKey=parts[0]?.key||'';
    select.replaceChildren(...parts.map(p=>{const o=document.createElement('option');o.value=p.key;o.textContent=p.label;return o;}));select.value=placementKey;
    const values=config.partOffsets?.[placementKey]||[0,0,0];
    for(const [i,axis] of ['x','y','z'].entries()){const el=$('placement-'+axis);el.value=values[i].toFixed(3);el.disabled=!placementKey;}
    if(!placementKey)placementMouse=false;select.disabled=!placementKey;for(const id of ['placement-mouse','placement-reset'])$(id).disabled=!placementKey;
    $('game').classList.toggle('placing-part',placementMouse&&!$('custom-panel').hidden);
    const mirrored=parts.find(p=>p.key===placementKey)?.mirrorX;
    $('placement-x').parentElement.firstChild.textContent=mirrored?'X · WIDTH (− IN / + OUT)':'X · LEFT / RIGHT';
    $('placement-status').textContent=placementKey?(mirrored?'X: + outward, − toward the car. Both sides move together.':placementMouse?'Drag the part in the car view. Scroll to zoom.':'Select a part and adjust its position in meters.'):'Select an aftermarket part or wheels in the customization menu first.';
    $('placement-mouse').setAttribute('aria-pressed',String(placementMouse));
  }
  function setPlacement(values,commit=false){
    if(!placementKey)return;const clean=values.map(n=>clamp(Number.isFinite(n)?n:0,-1.5,1.5));
    config.partOffsets={...config.partOffsets,[placementKey]:clean};BlacklinePartPlacement.apply(hero,config.partOffsets);
    for(const [i,axis]of ['x','y','z'].entries())$('placement-'+axis).value=clean[i].toFixed(3);if(commit)save();
  }
  function placementRay(e){const rect=$('game').getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),garageCamera);return ray;}
  function beginPlacementDrag(e){
    if(!placementMouse||$('custom-panel').hidden)return false;
    hero.updateMatrixWorld(true);const ray=placementRay(e),parts=hero.userData.adjustableParts||[],hits=ray.intersectObjects(parts.flatMap(p=>p.targets),true);
    if(hits.length){let object=hits[0].object;while(object){const selected=parts.find(p=>p.targets.includes(object));if(selected){placementKey=selected.key;refreshPlacementUI();break;}object=object.parent;}}
    const part=parts.find(p=>p.key===placementKey);if(!part)return false;
    const box=new THREE.Box3();for(const target of part.targets)box.union(new THREE.Box3().setFromObject(target));
    const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(garageCamera.getWorldDirection(new THREE.Vector3()),box.getCenter(new THREE.Vector3())),start=ray.ray.intersectPlane(plane,new THREE.Vector3());if(!start)return false;
    const side=part.mirrorX?(Math.sign(hero.worldToLocal((hits[0]?.point||garageCamera.position).clone()).x)||1):1;
    placementDrag={plane,start,side,offset:[...(config.partOffsets?.[placementKey]||[0,0,0])]};return true;
  }
  function movePlacementDrag(e){if(!placementDrag)return;const point=placementRay(e).ray.intersectPlane(placementDrag.plane,new THREE.Vector3());if(point){const delta=hero.worldToLocal(point).sub(hero.worldToLocal(placementDrag.start.clone()));setPlacement(placementDrag.offset.map((n,i)=>n+delta.getComponent(i)*(i===0?placementDrag.side:1)));}}
  function bindGarageEditing(){
    BlacklineGarageControls.bind({canvas:$('game'),state:garageView,active:()=>['menu','workshop'].includes(mode)&&$('career-panel').hidden&&$('loading').hidden,
      change:()=>{garageAngle=garageView.yaw;$('orbit').value=Math.round(garageAngle*180/Math.PI);},partStart:beginPlacementDrag,partMove:movePlacementDrag,partEnd:()=>{if(placementDrag){save();placementDrag=null;}}});
    $('workshop-camera-reset').onclick=()=>$('garage-camera-reset').click();
    $('garage-camera-reset').onclick=()=>{Object.assign(garageView,BlacklineGarageControls.create());garageAngle=garageView.yaw+(tuningActive?tuningGarage.bayYaw:0);$('orbit').value=Math.round(garageAngle*180/Math.PI);resize();};
    $('placement-part').onchange=e=>{placementKey=e.target.value;refreshPlacementUI();};
    for(const [i,axis]of ['x','y','z'].entries())$('placement-'+axis).onchange=e=>{const values=[...(config.partOffsets?.[placementKey]||[0,0,0])];values[i]=Number(e.target.value);setPlacement(values,true);};
    $('placement-mouse').onclick=()=>{placementMouse=!placementMouse;refreshPlacementUI();$('game').classList.toggle('placing-part',placementMouse);};
    $('placement-reset').onclick=()=>setPlacement([0,0,0],true);
    refreshPlacementUI();
  }
  function bindCustom(){
    bindGarageEditing();
    for(const [key,[label,rule]] of Object.entries(customSchema)){
      const row=document.createElement('label');row.className='custom-field';row.dataset.section=['color','rimColor','skin','wear','wheel','rims','wingStyle','splitter','skirts','diffuser','canards','hoodVent','spats','arches','offset','ride','camber'].includes(key)?'look':'drive';const caption=document.createElement('span');caption.textContent=label;row.append(caption);
      const el=document.createElement(typeof rule==='object'&&!Array.isArray(rule)?'select':'input');el.id='custom-'+key;el.setAttribute('aria-label',label);
      if(rule==='color')el.type='color';else if(Array.isArray(rule)){el.type='range';[el.min,el.max,el.step]=rule;}
      else for(const [v,text]of Object.entries(rule)){const opt=document.createElement('option');opt.value=v;opt.textContent=text;if(key==='wheel'&&v==='original')opt.hidden=true;el.append(opt);}
      const out=document.createElement('output');row.append(el,out);$('custom-fields').append(row);
      el.oninput=()=>{config[key]=Array.isArray(rule)?Number(el.value):el.value;if(key==='color')config.paint='custom';if(key==='rimColor'){config.rims='custom';$('custom-rims').value='custom';}if(rule==='color')$('custom-'+key+'-hex').value=el.value;out.value=Array.isArray(rule)?el.value:'';if(key==='wheel')wheelColorEnabled();colorLabels();rebuildHero();save();syncGarageUI();updateMenuBest();};
      if(rule==='color'){
        const editor=document.createElement('span');editor.className='color-editor';row.insertBefore(editor,el);editor.append(el);const text=document.createElement('input');text.id='custom-'+key+'-hex';text.type='text';text.maxLength=7;text.placeholder='#RRGGBB';text.setAttribute('aria-label',label+' as a HEX code');editor.append(text);
        text.onchange=()=>{const value=BlacklineCarColors.hex(text.value);text.setCustomValidity(value?'':'Enter a HEX color, for example #ff8800.');if(!value){text.reportValidity();return;}text.value=value;el.value=value;el.oninput();};
        const reset=document.createElement('button');reset.type='button';reset.textContent='↺';reset.title='Restore original color';reset.setAttribute('aria-label','Reset '+label.toLowerCase());editor.append(reset);reset.onclick=e=>{e.preventDefault();if(key==='color')config.paint='original';else{config.rims='silver';$('custom-rims').value='silver';}colorLabels();rebuildHero();save();};
      }
    }
    function colorLabels(){for(const key of ['color','rimColor'])$('custom-'+key).closest('.custom-field').querySelector('output').value=key==='color'?(config.paint==='custom'?'Custom color':'Original'):(config.rims==='custom'?'Custom color':'Not active');}
    function wheelColorEnabled(){for(const id of ['custom-rims','custom-rimColor','custom-rimColor-hex'])$(id).disabled=config.wheel==='original';}
    function sync(){wheelColorEnabled();for(const [key,[label,rule]]of Object.entries(customSchema)){const el=$('custom-'+key);el.value=config[key];if(rule==='color')$('custom-'+key+'-hex').value=config[key];else el.nextElementSibling.value=Array.isArray(rule)?config[key]:'';}colorLabels();}
    $('customize').onclick=()=>{openCityMap();cityMapUI.focus('tuning-garage');};
    enterTuningWorkshop=async()=>{
      if(mode!=='race'||rockRace||!$('loading').hidden||$('customize').disabled)return;if(pursuit.phase!=='patrol'){showNotice('ESCAPE THE POLICE BEFORE ENTERING THE WORKSHOP',3);return;}$('customize').disabled=true;showNotice('LOADING TUNING GARAGE…',2);$('tuning-feedback').textContent='LOADING TUNING GARAGE…';
      try{if(!tuningGarage){tuningPromise||=BlacklineTuningGarage.create(THREE);tuningGarage=await tuningPromise;}if(mode!=='race'||rockRace||!$('loading').hidden||pursuit.phase!=='patrol'||Math.hypot(car.x-cityMapData.tuning.x,car.z-cityMapData.tuning.z)>(cityMapData.tuning.entryRadius||6.5)||Math.abs(car.y-cityMapData.tuning.y)>4)return;mode='workshop';$('notice').textContent='';noticeTimer=0;keys.clear();car.speed=0;car.vx=car.vz=0;rebuildHero();$('menu').hidden=true;$('hud').hidden=true;$('interact').hidden=true;tuningEnvironment(true);$('engine-workshop').append($('engine-upgrade'));sync();syncGarageUI();document.querySelector('[data-setup-tab="look"]').click();$('custom-panel').hidden=false;document.body.classList.add('customizing');$('tuning-feedback').textContent='';resize();}
      catch(error){tuningPromise=null;$('tuning-feedback').textContent=error.message;if(mode==='race')showNotice('WORKSHOP LOAD FAILED · TRY AGAIN',4);}
      finally{$('customize').disabled=false;if(mode!=='menu'||!$('loading').hidden)$('tuning-feedback').textContent='';}
    };
    $('custom-close').onclick=()=>{placementMouse=false;placementDrag=null;$('game').classList.remove('placing-part');$('custom-panel').hidden=true;document.body.classList.remove('customizing');$('engine-home').append($('engine-upgrade'));tuningEnvironment(false);if(mode==='workshop'){scene.remove(raceCar);disposeScene(raceCar);raceCar=makeCar(config.color);scene.add(raceCar);car.stage=config.stage;car.setup={...config};car.box=raceCar.userData.hitbox;mode='race';$('menu').hidden=true;$('hud').hidden=false;keys.clear();frameTime=performance.now();showNotice('CHANGES SAVED',2);}refreshPlacementUI();resize();};
    document.querySelectorAll('[data-setup-tab]').forEach(b=>b.onclick=()=>{
      const look=b.dataset.setupTab==='look';document.querySelectorAll('[data-setup-tab]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));document.querySelectorAll('.custom-field').forEach(row=>row.hidden=row.dataset.section!==b.dataset.setupTab);document.querySelector('.placement-panel').hidden=!look;$('tuning-performance').hidden=look;$('setup-summary').hidden=look;document.querySelectorAll('[data-preset]').forEach(p=>p.hidden=look);$('workshop-title').textContent=look?'CUSTOMIZATION':'TUNING';$('custom-reset').textContent=look?'RESET APPEARANCE':'RESET DRIVING SETUP';document.querySelector('.custom-note').textContent=look?'Colors, wheels and body parts. Changes are saved per car.':'Buy engine packages with race earnings. Tires, gearing, brakes, steering and nitrous affect driving.';
      if(!look){placementMouse=false;$('game').classList.remove('placing-part');refreshPlacementUI();}
    });
    document.querySelector('[data-setup-tab="look"]').click();
    document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{Object.assign(config,{street:{tires:'street',gearing:'balanced',brakes:'stock',response:'balanced',aero:'balanced',nitrous:'balanced'},track:{tires:'semi',gearing:'short',brakes:'race',response:'sharp',aero:'grip',nitrous:'power'},drift:{tires:'drift',gearing:'short',brakes:'sport',response:'sharp',aero:'speed',nitrous:'duration'}}[b.dataset.preset]);rebuildHero();sync();syncGarageUI();updateMenuBest();save();});
    $('custom-reset').onclick=()=>{const section=document.querySelector('[data-setup-tab][aria-pressed="true"]').dataset.setupTab;for(const key of Object.keys(customSchema))if($('custom-'+key).closest('.custom-field').dataset.section===section)config[key]=BlacklineCars.defaults[key];if(section==='look'){config.paint='original';config.partOffsets={};}rebuildHero();sync();syncGarageUI();updateMenuBest();save();};
    document.querySelectorAll('[data-custom-angle]').forEach(b=>b.onclick=()=>{garageAngle=Number(b.dataset.customAngle)*Math.PI/180+(tuningActive?tuningGarage.bayYaw:0);garageAngle=Math.atan2(Math.sin(garageAngle),Math.cos(garageAngle));$('orbit').value=Math.round(garageAngle*180/Math.PI);resize();});
    $('orbit').oninput=()=>{garageAngle=Number($('orbit').value)*Math.PI/180;resize();};
    for(const [id,angle]of [['view-front',43],['view-side',90],['view-rear',145]])$(id).onclick=()=>{$('orbit').value=angle;garageAngle=angle*Math.PI/180;resize();};
  }

  (async()=>{try{
    await loadRaceCatalog();
    try{saved=JSON.parse(localStorage.getItem('blackline-v1')||'{}')||{};if(typeof saved!=='object')saved={};if(saved.config){
      const c=saved.config;Object.assign(config,validateCustom(c));if(/^#[0-9a-f]{6}$/i.test(c.color))config.color=c.color;
      if(['silver','gold','black'].includes(c.rims))config.rims=c.rims;
      if(typeof c.spoiler==='boolean')config.spoiler=c.spoiler;
      config.stage=Number.isInteger(c.stage)?clamp(c.stage,0,4):c.upgrade?1:0;
      if(Object.hasOwn(VEHICLES,c.vehicle))config.vehicle=c.vehicle;else {const migrated={r34:'skyline',rx7:'rotary',fiat:'emery',camaro:'charger',m3:'porsche',supra:'r390',silvia:'gtr',evo:'crown'}[c.vehicle]||'skyline';config.vehicle=migrated;Object.assign(config,BlacklineCars.defaults);config.stage=Number.isInteger(c.stage)?clamp(c.stage,0,4):0;if(saved.ownedStages)saved.ownedStages[migrated]=Math.max(saved.ownedStages[migrated]||0,saved.ownedStages[c.vehicle]||config.stage);}
    }}catch{saved={};}
    if(!saved.config){config.vehicle=D.starter;config.stage=0;}else saved.config={...saved.config,vehicle:config.vehicle};
    if(!saved.ownedStages||typeof saved.ownedStages!=='object')saved.ownedStages={[config.vehicle]:config.stage};
    saved=D.normalize(saved);
    if(!D.owns(saved,config.vehicle)){config.vehicle=D.starter;Object.assign(config,BlacklineCars.defaults,validateCustom(saved.builds?.[D.starter]||{}));config.stage=saved.ownedStages?.[D.starter]||0;}
    renderer=new THREE.WebGLRenderer({canvas:$('game'),antialias:false,powerPreference:'high-performance'});
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    psx=BlacklinePSX.pipeline(renderer);createGarage();bindUI();bindCustom();bindMultiplayer();syncGarageUI();updateMenuBest();resize();save();$('loading').hidden=true;requestAnimationFrame(frame);
  }catch(error){$('loading').hidden=true;$('error').hidden=false;console.error(error);}
  })();
})();


