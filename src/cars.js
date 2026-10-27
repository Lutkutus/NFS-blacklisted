(function(){
'use strict';
const profiles={
 r34:{width:.96,length:2.3,axle:1.42,hood:.93,roof:1.48,front:.52,rear:-.82,tail:.91,lights:'quad',name:'R34'},
 rx7:{width:.94,length:2.22,axle:1.36,hood:.77,roof:1.25,front:.2,rear:-.9,tail:.79,lights:'pop',name:'FD'},
 m3:{width:.94,length:2.28,axle:1.43,hood:.9,roof:1.48,front:.48,rear:-.88,tail:.92,lights:'euro',name:'E46'},
 supra:{width:1,length:2.34,axle:1.4,hood:.86,roof:1.36,front:.18,rear:-.92,tail:.94,lights:'oval',name:'A80'},
 silvia:{width:.91,length:2.26,axle:1.41,hood:.81,roof:1.32,front:.37,rear:-.91,tail:.83,lights:'slim',name:'S15'},
 evo:{width:.94,length:2.27,axle:1.37,hood:.93,roof:1.54,front:.64,rear:-1.02,tail:1.01,lights:'evo',name:'IX'}
};
const defaults={kit:'street',wheel:'split',wheelSize:18,ride:0,camber:0,finish:'gloss',livery:'none',accent:'#e8d9ad',hood:'paint',exhaust:'single',wing:'gt'};
function create(config){
 if(window.BlacklineImportedCars && ['fiat','camaro'].includes(config.vehicle))return window.BlacklineImportedCars.create({...defaults,...config});
 const c={...defaults,...config},p=profiles[c.vehicle]||profiles.r34,T=THREE,g=new T.Group(),body=new T.Group();g.add(body);body.position.y=Number(c.ride);
 const paint=new T.MeshStandardMaterial({color:c.color,roughness:c.finish==='matte'?.86:c.finish==='metal'?.24:.36,metalness:c.finish==='metal'?.8:.25,flatShading:true});
 const dark=new T.MeshStandardMaterial({color:0x10171b,roughness:.7}),glass=new T.MeshStandardMaterial({color:0x233b46,metalness:.5,roughness:.18}),accent=new T.MeshStandardMaterial({color:c.accent,roughness:.5});
 const metal=new T.MeshStandardMaterial({color:0xa7aaa6,metalness:.8,roughness:.3});
 function mesh(geo,mat,parent=body){const m=new T.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(x,y,z,w,h,d,mat=paint,parent=body){const m=mesh(new T.BoxGeometry(w,h,d),mat,parent);m.position.set(x,y,z);return m;}
 function panel(v,mat=paint,parent=body){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v.flat(),3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();const m=mesh(geo,mat,parent);m.material.side=T.DoubleSide;return m;}
 // Continuous loft: bevelled shoulders, tapered nose and rear, with actual wheel cutouts.
 const zs=[-p.length,-p.length+.2,-.35,.55,p.length-.22,p.length,...[-p.axle,p.axle].flatMap(a=>Array.from({length:13},(_,i)=>a-.53+i*1.06/12))].sort((a,b)=>a-b);
 const verts=[],indices=[];
 for(const z of zs){const taper=Math.abs(z)>p.length-.25?.9:1;const w=p.width*taper;const top=z>0?p.hood:p.tail;const arch=Math.max(...[-p.axle,p.axle].map(a=>Math.abs(z-a)<.53?.39+Math.sqrt(Math.max(0,.53**2-(z-a)**2)):.27));
  const shoulder=Math.max(top-.1,arch+.025);verts.push(-w,arch,z,-w,shoulder,z,-w*.75,top,z,w*.75,top,z,w,shoulder,z,w,arch,z);
 }
 for(let i=0;i<zs.length-1;i++)for(let k=0;k<5;k++){const a=i*6+k,b=a+6;indices.push(a,b,a+1,b,b+1,a+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));indices.push(0,1,2,0,2,3,0,3,4,0,4,5);const last=(zs.length-1)*6;for(let i=1;i<5;i++)indices.push(last,last+i+1,last+i);geo.setIndex(indices);geo.computeVertexNormals();mesh(geo,paint);
 box(0,.38,0,p.width*1.65,.17,p.length*1.9,dark);
 // Windshield, rear glass, and framed side windows follow each model's cabin profile.
 const w=p.width*.84,rw=p.width*.72,base=p.hood+.02,back=-1.4,front=1.02;
 panel([[-w,base,front],[w,base,front],[rw,p.roof,p.front],[-rw,p.roof,p.front]],glass);
 panel([[-rw,p.roof,p.rear],[rw,p.roof,p.rear],[w,p.tail+.03,back],[-w,p.tail+.03,back]],glass);
 panel([[-rw,p.roof,p.front],[rw,p.roof,p.front],[rw,p.roof,p.rear],[-rw,p.roof,p.rear]],paint);
 function bar(a,b,r,mat){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const m=mesh(new T.CylinderGeometry(r,r,v.length(),6),mat);m.position.copy(new T.Vector3(...a).addScaledVector(v,.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
 for(const s of [-1,1]){
 panel([[s*w,base,front],[s*rw,p.roof,p.front],[s*rw,p.roof,p.rear],[s*w,p.tail,back]],glass);
 bar([s*w,base,front],[s*rw,p.roof,p.front],.035,paint);bar([s*w,p.tail,back],[s*rw,p.roof,p.rear],.055,paint);bar([s*rw,p.roof,p.front],[s*rw,p.roof,p.rear],.035,paint);
 bar([s*w,base,-.35],[s*rw,p.roof,-.35],.032,dark);
 box(s*(p.width+.055),base+.12,.66,.22,.12,.26);box(s*(p.width+.016),base-.13,-.42,.035,.045,.19,metal);
 if(c.vehicle==='evo'){bar([s*p.width,.35,-.65],[s*p.width,p.tail,-.65],.008,dark);box(s*(p.width+.016),base-.13,-1.1,.035,.04,.16,metal);}
 box(s*p.width,.27,0,.08,c.kit==='race'?.16:.08,1.8,c.kit==='stock'?paint:dark);
 for(const z of [-p.axle,p.axle]){const a=mesh(new T.TorusGeometry(.53,c.kit==='wide'?.1:.035,5,20,Math.PI),paint);a.rotation.y=Math.PI/2;a.position.set(s*(p.width+.015),.39,z);if(c.kit==='wide')for(let j=0;j<7;j++){const t=j/6*Math.PI;box(s*(p.width+.12),.39+Math.sin(t)*.53,z+Math.cos(t)*.53,.018,.025,.025,metal);}}
 }
 const nose=p.length+.01;
 box(0,.55,nose,p.width*1.85,.32,.16);box(0,.49,nose+.09,p.width*1.08,.19,.025,dark);
 for(const s of [-1,1]){box(s*p.width*.78,.5,nose+.09,.24,.17,.03,dark);for(let k=0;k<3;k++)box(s*p.width*.78,.45+k*.05,nose+.11,.22,.014,.02,metal);}
 box(0,.29,nose+.03,p.width*2.03,.045,c.kit==='race'?.45:.22,dark);
 box(0,.61,-nose,p.width*1.9,.36,.13);box(0,.34,-nose-.01,p.width*1.7,.14,.18,dark);
 for(let k=-3;k<=3;k++)box(k*.19,.3,-nose-.09,.025,.16,.3,dark);
 const lamp=new T.MeshBasicMaterial({color:0xf9efcb}),tails=[];
 for(const s of [-1,1]){
 if(p.lights==='pop'){box(s*.62,p.hood+.08,1.83,.43,.15,.34);box(s*.62,p.hood+.09,2.01,.35,.08,.025,lamp);}
 else if(p.lights==='euro'){for(const offset of [-.115,.115]){const m=mesh(new T.CylinderGeometry(.105,.105,.035,16),lamp);m.rotation.x=Math.PI/2;m.position.set(s*.62+offset,.84,nose+.09);}box(s*.16,.75,nose+.1,.22,.22,.03,dark);}
 else {const m=box(s*.63,p.hood-.08,nose+.09,p.lights==='slim'?.5:.48,p.lights==='slim'?.065:.13,.035,lamp);m.rotation.z=s*(p.lights==='evo'?.15:-.06);box(s*.88,p.hood-.08,nose+.08,.07,.08,.04,new T.MeshBasicMaterial({color:0xf1a14d}));}
 if(['quad','oval','pop'].includes(p.lights)){for(const o of [-.13,.13]){const mat=new T.MeshBasicMaterial({color:0xcf302c});const m=mesh(new T.CylinderGeometry(o<0?.105:.085,o<0?.105:.085,.04,16),mat);m.rotation.x=Math.PI/2;m.position.set(s*.62+o,p.tail-.12,-nose-.08);tails.push(m);}}
 else tails.push(box(s*.65,p.tail-.14,-nose-.08,.48,.13,.035,new T.MeshBasicMaterial({color:0xcf302c})));
 }
 box(0,.57,-nose-.09,.42,.12,.02,metal);
 if(c.hood==='carbon')box(0,p.hood+.008,1.45,p.width*1.5,.018,.72,dark);
 if(c.kit==='race'||c.hood==='vented')for(const s of [-1,1])for(let i=0;i<4;i++)box(s*.42,p.hood+.022,1.2+i*.12,.24,.02,.055,dark);
 if(c.livery==='stripe')for(const x of [-.2,.2]){box(x,p.hood+.035,1.52,.22,.012,.9,accent);box(x,p.roof+.013,(p.front+p.rear)/2,.22,.015,p.front-p.rear,accent);box(x,p.tail+.025,-1.86,.22,.015,.55,accent);}
 if(c.livery==='side')for(const s of [-1,1]){box(s*(p.width+.02),.57,0,.02,.12,1.8,accent);for(let i=0;i<3;i++){const m=box(s*(p.width+.025),.68,-.1+i*.21,.02,.2,.09,accent);m.rotation.x=-.35;}}
 const wing=new T.Group();body.add(wing);wing.visible=c.spoiler;
 const wh=c.wing==='duck'?.12:c.wing==='street'?.3:.55;
 for(const s of [-1,1])box(s*.64,p.tail+wh/2,-1.95,.055,wh,.11,dark,wing);
 box(0,p.tail+wh,-1.95,p.width*2.13,.055,.36,c.wing==='street'?paint:dark,wing);
 if(c.wing==='gt')for(const s of [-1,1])box(s*p.width*1.07,p.tail+wh+.035,-1.95,.035,.2,.4,paint,wing);
 const flames=new T.Group();body.add(flames);flames.visible=false;
 for(const s of c.exhaust==='dual'?[-1,1]:[-1]){const pipe=mesh(new T.CylinderGeometry(.09,.09,.3,12),metal);pipe.rotation.x=Math.PI/2;pipe.position.set(s*.7,.29,-nose-.18);const hole=mesh(new T.CircleGeometry(.068,12),dark);hole.rotation.y=Math.PI;hole.position.set(s*.7,.29,-nose-.335);const f=mesh(new T.ConeGeometry(.1,.6,6),new T.MeshBasicMaterial({color:0x88bbff}),flames);f.rotation.x=-Math.PI/2;f.position.set(s*.7,.29,-nose-.55);}
 const wheels=[],rims=[],radius=.36+(Number(c.wheelSize)-18)*.009;
 const rimColor={silver:0xb8bec3,gold:0xb89a55,black:0x272c30}[c.rims];
 for(const s of [-1,1])for(const z of [-p.axle,p.axle]){
 const pivot=new T.Group();pivot.position.set(s*(p.width+(c.kit==='wide'?.07:0)),radius,z);g.add(pivot);
 const cam=new T.Group();cam.rotation.z=-s*Number(c.camber)*Math.PI/180;pivot.add(cam);const roll=new T.Group();cam.add(roll);pivot.userData.roll=roll;pivot.userData.radius=radius;
 const tire=mesh(new T.CylinderGeometry(radius,radius,.245,24),dark,roll);tire.rotation.z=Math.PI/2;
 const face=new T.Group();face.position.x=s*.135;face.rotation.y=s*Math.PI/2;roll.add(face);
 const rm=new T.MeshStandardMaterial({color:rimColor,metalness:.8,roughness:.32});rims.push(rm);
 mesh(new T.TorusGeometry(radius*.77,.024,6,24),rm,face);mesh(new T.CircleGeometry(radius*.65,24),new T.MeshStandardMaterial({color:0x454b4d,metalness:.6,roughness:.6}),face);
 const n=c.wheel==='mesh'?12:c.wheel==='five'?5:6;
 for(let i=0;i<n;i++)for(const offset of c.wheel==='split'?[-.045,.045]:[0]){const a=i/n*Math.PI*2+offset;const spoke=box(Math.sin(a)*radius*.43,Math.cos(a)*radius*.43,.018,.038,radius*.65,.035,rm,face);spoke.rotation.z=-a;}
 const hub=mesh(new T.CylinderGeometry(.07,.07,.045,12),rm,face);hub.rotation.x=Math.PI/2;hub.position.z=.05;
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;box(Math.sin(a)*.045,Math.cos(a)*.045,.08,.014,.014,.014,dark,face);}
 // Fixed brake caliper does not rotate with the wheel.
 box(s*.14,.02,-.17,.07,.16,.08,new T.MeshStandardMaterial({color:0xbe3c27}),cam);wheels.push(pivot);
 }
 g.userData={paint,wing,wheels,rims,tails,flames};return g;
}
function animate(model,speed,dt,steer=0){for(const w of model.userData.wheels){if(w.position.z>0)w.rotation.y=steer*.4;w.userData.roll.rotation.x+=speed*dt/w.userData.radius;}}
window.BlacklineCars={create,animate,defaults,profiles};
})();
