/* Original procedural art: broad painted shapes and a compact tuner workshop. */
window.BlacklineArt = (() => {
  const bands=new THREE.DataTexture(new Uint8Array([65,133,205,255]),4,1,THREE.RedFormat);
  bands.minFilter=bands.magFilter=THREE.NearestFilter;bands.needsUpdate=true;
  function paintedTexture(kind) {
    const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
    let seed=kind==='floor'?64:120;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const palette=kind==='floor'?['#a49b7a','#b0a889','#938d71','#c0b491']:kind==='road'?['#50505a','#55545e','#484951','#605d64']:['#a9ad98','#989f8c','#bbc0a8','#8d9587'];
    ctx.fillStyle=palette[0];ctx.fillRect(0,0,128,128);
    const pixels=ctx.getImageData(0,0,128,128);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;const dirt=(rnd()-.5)*58-(Math.sin(x*.14+y*.08)+Math.sin(y*.19))*12;for(let k=0;k<3;k++)pixels.data[i+k]=Math.max(0,Math.min(255,pixels.data[i+k]+dirt));}
    ctx.putImageData(pixels,0,0);
    for(let i=0;i<40;i++){ctx.fillStyle=i%2?'#25251c42':'#ccc2a02a';ctx.fillRect(Math.floor(rnd()*128),Math.floor(rnd()*128),1+Math.floor(rnd()*14),1+Math.floor(rnd()*3));}
    if(kind==='wall'){ctx.fillStyle='#24251f55';for(let i=0;i<12;i++)ctx.fillRect(i*11,0,1,128);ctx.fillRect(0,97,128,2);}
    if(kind==='floor'){
      ctx.strokeStyle='#746e58';ctx.lineWidth=1;ctx.strokeRect(.5,.5,127,127);
      ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(24,18);ctx.lineTo(17,26);ctx.lineTo(21,40);ctx.stroke();
    }
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;return tex;
  }
  const textures={floor:paintedTexture('floor'),wall:paintedTexture('wall'),road:paintedTexture('road')};
  function toon(color,map){return BlacklinePSX.material(new THREE.MeshLambertMaterial({color,map:map||textures.wall,flatShading:true}));}
  function panel(parent,text,x,y,z,w,h,options={}) {
    const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
    ctx.fillStyle=options.bg||'#28302d';ctx.fillRect(0,0,512,256);
    ctx.strokeStyle=options.ink||'#d4c591';ctx.lineWidth=8;ctx.strokeRect(12,12,488,232);
    ctx.fillStyle=options.ink||'#d4c591';ctx.font='italic 900 62px Arial';ctx.textAlign='center';
    text.split('|').forEach((line,i)=>ctx.fillText(line,256,105+i*70));
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);parent.add(m);return m;
  }
  function workshop({scene,box,material,makeCar}) {
    scene.background=new THREE.Color(0x333d38);scene.fog=new THREE.Fog(0x535d4b,23,55);
    const hemi=new THREE.HemisphereLight(0xd9c68b,0x292b1e,1.25);scene.add(hemi);
    const key=new THREE.SpotLight(0xe8d294,105,35,Math.PI/3,.65,1.2);key.position.set(-3,7,4);key.target.position.set(0,0,0);
    key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.0003;key.shadow.normalBias=.025;scene.add(key,key.target);
    const fill=new THREE.DirectionalLight(0xb4ac78,1.05);fill.position.set(6,4,-2);scene.add(fill);
    const floorTex=textures.floor.clone();floorTex.repeat.set(8,7);floorTex.needsUpdate=true;
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(27,23),toon(0xffffff,floorTex));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
    const wallMat=toon(0xc1c6a4,textures.wall);
    box(scene,0,3.8,-6,23,7.6,.3,wallMat);box(scene,-10,3.8,1,.3,7.6,14,wallMat);
    // Lower painted concrete band, exposed uprights and corrugated wall panels.
    box(scene,0,.65,-5.81,23,1.3,.05,0x565f50);
    for(let x=-10;x<=10;x+=2.5){box(scene,x,3.8,-5.7,.16,7.6,.18,0x566257);}
    for(let x=-5;x<9;x+=.32)box(scene,x,2.3,-5.77,.04,2.1,.04,0x7e8973);
    for(const z of [-5,0,5]){box(scene,-9.7,3.6,z,.3,7.2,.3,0x424d46);box(scene,0,7.1,z,20,.23,.23,0x414b43);}
    // A shutter on the left; windows and posters behind the car.
    box(scene,-6,2.3,-5.6,4.5,4.6,.15,0x485a53);
    for(let y=.3;y<4.6;y+=.27)box(scene,-6,y,-5.48,4.4,.045,.07,0x718276);
    for(let x=-2.5;x<=7.5;x+=2.5){
      box(scene,x,4.4,-5.55,2.1,2.6,.14,0xeee7ba,true);
      box(scene,x,4.4,-5.42,.08,2.6,.08,0x526558);box(scene,x,4.4,-5.42,2.1,.08,.08,0x526558);
      box(scene,x,3.07,-5.35,2.3,.12,.35,0x697463);
    }
    panel(scene,'BLACKLISTED|MOTOR WORKS',2,6.35,-5.35,5,1.4);
    panel(scene,'BOOST|NOT EXCUSES',-8.7,3.2,-5.35,1.4,1.8,{bg:'#78463a',ink:'#e6d2a3'});
    panel(scene,'04|NIGHT SHIFT',7.8,2,-5.35,1.6,1.7,{bg:'#344c55',ink:'#c2cfb4'});
    // Original broad graffiti strokes, not copied logos.
    for(let i=0;i<6;i++){const stroke=box(scene,-2+i*.36,1.9+(i%2)*.25,-5.42,.13,1.15,.03,0x3b4c46);stroke.rotation.z=-.6;}
    // Workshop cabinets with drawers, handles, caster wheels and workbench.
    for(const x of [-5.5,-3.4]){
      box(scene,x,.62,-3.9,1.6,1.1,.75,0x8e4c3d);box(scene,x,1.22,-3.9,1.75,.12,.9,0x9fa68e);
      for(let y=.3;y<1.1;y+=.2){box(scene,x,y,-3.5,1.45,.025,.04,0x3c3a33);box(scene,x,y+.07,-3.46,.8,.035,.04,0xb9b49b);}
      for(const side of [-1,1])box(scene,x+side*.55,.08,-3.9,.15,.16,.3,0x202725);
      box(scene,x+.2,1.34,-3.9,.5,.12,.3,0x665e48);
    }
    box(scene,-8,1.35,-3,2.3,.15,1,0x99836a);for(const x of [-8.9,-7.1])box(scene,x,.65,-3,.12,1.3,.65,0x3f4a44);
    // Stacks of faceted tyres with open centres, and display alloy wheels.
    const tyreGeo=new THREE.TorusGeometry(.48,.15,6,12);
    function tyre(x,y,z,horizontal=true){const m=new THREE.Mesh(tyreGeo,toon(0x242a2b));m.position.set(x,y,z);if(horizontal)m.rotation.x=Math.PI/2;m.castShadow=true;scene.add(m);return m;}
    for(const [x,z,n] of [[4,-3.8,4],[5.3,-4,3],[6.5,-3.8,4]])for(let i=0;i<n;i++)tyre(x,.18+i*.29,z);
    for(const [x,z] of [[4,-3.8],[6.5,-3.8]]){
      const wheel=new THREE.Group();wheel.position.set(x,1.6,z);wheel.rotation.y=-.3;scene.add(wheel);
      const outer=new THREE.Mesh(new THREE.TorusGeometry(.4,.045,4,12),toon(0xc4c4a9));wheel.add(outer);
      for(let i=0;i<6;i++){const spoke=box(wheel,0,0,0,.07,.77,.05,0xc4c4a9);spoke.rotation.z=i*Math.PI/3;}
    }
    // Drums and ventilation ductwork.
    for(const x of [-7,8]){
      const drum=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,1.25,10),toon(0x96704c));drum.position.set(x,.63,-4.5);drum.castShadow=true;scene.add(drum);
      const band=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.32,10),toon(0xcac7a2));band.position.set(x,.7,-4.5);scene.add(band);
    }
    box(scene,-4,6,0,1.1,.7,11,0x87998c);box(scene,0,6,-4.6,9,.7,1.1,0x87998c);
    for(let z=-4;z<5;z+=1.5)box(scene,-4,6,z,1.15,.74,.07,0xa8b5a0);
    for(const x of [-3,3]){
      box(scene,x,6.6,.5,2.6,.14,.55,0x4c5950);box(scene,x,6.49,.5,2.4,.04,.4,0xffedb2,true);
    }
    // Painted service-bay markings and broad, angular oil marks.
    for(const x of [-1.7,1.7])box(scene,x,.002,0,.07,.012,5.6,0xd3c48d);
    box(scene,0,.002,2.8,3.4,.012,.07,0xd3c48d);
    for(let i=0;i<16;i++){
      const x=Math.sin(i*4.3)*7,z=Math.cos(i*2.7)*4;
      const stain=new THREE.Mesh(new THREE.CircleGeometry(.25+(i%4)*.12,5),toon(i%2?0x777961:0x8a866a));stain.rotation.x=-Math.PI/2;stain.rotation.z=i;stain.position.set(x,.009,z);scene.add(stain);
    }
    const hero=makeCar('#315bcf');hero.position.y=.025;scene.add(hero);
    scene.traverse(o=>{if(o.isMesh){o.receiveShadow=true;if(o.geometry.type!=='PlaneGeometry')o.castShadow=true;}});
    return hero;
  }
  function bodyShell(variant,paint){
    const rotary=variant==='rx7',bmw=variant==='m3',shape=new THREE.Shape();
    // Side silhouette follows the rocker, both wheel arches and sloping bonnet.
    shape.moveTo(-2.23,.34);shape.lineTo(-2.23,.78);shape.lineTo(-1.95,.91);
    shape.lineTo(-.9,.94);shape.lineTo(.7,.92);shape.lineTo(1.5,rotary?.79:.86);shape.lineTo(2.19,rotary?.63:.76);shape.lineTo(2.26,.37);
    shape.lineTo(1.91,.29);
    for(let i=0;i<=10;i++){const angle=i*Math.PI/10;shape.lineTo(1.4+Math.cos(angle)*.49,.35+Math.sin(angle)*.49);}
    shape.lineTo(-.91,.29);
    for(let i=0;i<=10;i++){const angle=i*Math.PI/10;shape.lineTo(-1.4+Math.cos(angle)*.49,.35+Math.sin(angle)*.49);}
    shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:1.84,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:1,steps:1,curveSegments:1});
    geo.translate(0,0,-.92);geo.rotateY(-Math.PI/2);
    const mesh=new THREE.Mesh(geo,paint);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }
  return {bands,textures,toon,workshop,bodyShell,panel};
})();
