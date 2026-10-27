/* Transient props belong to a streamed cell, never to the save or camera. */
(function(root){
 'use strict';
 const GRID=24,TTL=4,MAX_DEBRIS=48;
 function overlaps(p,car){
  const box=car.box||{width:1.8,length:4.5,height:1.1,bottom:.18},cx=(p.min[0]+p.max[0])/2,cz=(p.min[2]+p.max[2])/2,ex=(p.max[0]-p.min[0])/2,ez=(p.max[2]-p.min[2])/2,s=Math.sin(car.yaw),c=Math.cos(car.yaw),dx=cx-car.x,dz=cz-car.z,w=box.width/2,l=box.length/2;
  if(p.max[1]<car.y+(box.bottom||0)-.15||p.min[1]>car.y+box.height+(box.bottom||0)+.25)return false;
  return Math.abs(dx)<=ex+Math.abs(c)*w+Math.abs(s)*l&&Math.abs(dz)<=ez+Math.abs(s)*w+Math.abs(c)*l&&Math.abs(dx*c-dz*s)<=w+ex*Math.abs(c)+ez*Math.abs(s)&&Math.abs(dx*s+dz*c)<=l+ex*Math.abs(s)+ez*Math.abs(c);
 }
 function create(THREE,world,{effects=null}={}){
  const cells=new Set(),debris=[];let hits=0;
  function remove(d){world.remove(d.group);d.group.traverse(n=>n.geometry?.dispose());debris.splice(debris.indexOf(d),1)}
  function attach(group,definitions,meshes){
   const owner={props:definitions.map(p=>({...p,broken:false})),bins:new Map()};cells.add(owner);
   for(const p of owner.props){p.meshes=meshes;for(let x=Math.floor(p.min[0]/GRID);x<=Math.floor(p.max[0]/GRID);x++)for(let z=Math.floor(p.min[2]/GRID);z<=Math.floor(p.max[2]/GRID);z++){const key=x+','+z;if(!owner.bins.has(key))owner.bins.set(key,[]);owner.bins.get(key).push(p)}}
   return owner;
  }
  function strike(owner,p,car){
   p.broken=true;hits++;const group=new THREE.Group(),pivot=new THREE.Vector3((p.min[0]+p.max[0])/2,(p.min[1]+p.max[1])/2,(p.min[2]+p.max[2])/2);group.position.copy(pivot);
   for(const part of p.parts){const mesh=p.meshes[part.node][part.primitive],source=mesh.geometry,index=source.index,indices=[];
    for(const j of part.triangles){indices.push(index.getX(j),index.getX(j+1),index.getX(j+2));index.setX(j+1,index.getX(j));index.setX(j+2,index.getX(j))}index.needsUpdate=true;
    const geo=new THREE.BufferGeometry(),pos=source.getAttribute('position'),uv=source.getAttribute('uv');geo.setAttribute('position',new THREE.Float32BufferAttribute(indices.flatMap(i=>[pos.getX(i),pos.getY(i),pos.getZ(i)]),3));if(uv)geo.setAttribute('uv',new THREE.Float32BufferAttribute(indices.flatMap(i=>[uv.getX(i),uv.getY(i)]),2));mesh.updateWorldMatrix(true,false);geo.applyMatrix4(mesh.matrixWorld);geo.translate(-pivot.x,-pivot.y,-pivot.z);geo.computeBoundingSphere();group.add(new THREE.Mesh(geo,mesh.material));
   }
   while(debris.length>=MAX_DEBRIS)remove(debris[0]);world.add(group);
   const speed=Math.hypot(car.vx||0,car.vz||0),factor=Math.min(22,Math.max(3,speed*.65))/Math.max(.01,speed),sign=Math.sign(car.speed)||1;
   debris.push({owner,group,age:0,vx:speed>.1?car.vx*factor:Math.sin(car.yaw)*3*sign,vz:speed>.1?car.vz*factor:Math.cos(car.yaw)*3*sign,vy:Math.min(7,2+speed*.12),floor:p.min[1]+.08,spin:2+Math.min(5,speed*.1)});
   effects?.emit({owner,prop:p,car});
  }
  function hit(car,old){
   const n=Math.max(1,Math.ceil(Math.hypot(car.x-old.x,car.z-old.z)/.3),Math.ceil(Math.abs(Math.atan2(Math.sin(car.yaw-old.yaw),Math.cos(car.yaw-old.yaw)))/.05)),r=Math.hypot(car.box?.width||2,car.box?.length||5)/2+.3;
   for(let j=0;j<=n;j++){const f=j/n,p={...car,x:old.x+(car.x-old.x)*f,y:old.y+(car.y-old.y)*f,z:old.z+(car.z-old.z)*f,yaw:old.yaw+Math.atan2(Math.sin(car.yaw-old.yaw),Math.cos(car.yaw-old.yaw))*f};
    for(const owner of cells){const nearby=new Set();for(let x=Math.floor((p.x-r)/GRID);x<=Math.floor((p.x+r)/GRID);x++)for(let z=Math.floor((p.z-r)/GRID);z<=Math.floor((p.z+r)/GRID);z++)for(const prop of owner.bins.get(x+','+z)||[])if(!prop.broken)nearby.add(prop);for(const prop of nearby)if(overlaps(prop,p))strike(owner,prop,car)}
   }
  }
  return {attach,hit,effects,stats:()=>({hits,debris:debris.length,cells:cells.size,props:[...cells].reduce((n,c)=>n+c.props.length,0)}),
   tick(dt,car){effects?.update(dt,car);for(const d of [...debris]){d.age+=dt;if(d.age>=TTL){remove(d);continue}const h=Math.min(dt,.05);d.vy-=9.81*h;d.group.position.x+=d.vx*h;d.group.position.z+=d.vz*h;d.group.position.y+=d.vy*h;d.group.rotation.x+=d.spin*h;d.group.rotation.z+=d.spin*.6*h;if(d.group.position.y<d.floor){d.group.position.y=d.floor;d.vy=Math.abs(d.vy)*.25;d.vx*=.92;d.vz*=.92;d.spin*=.95}}},
   detach(owner){effects?.clearOwner(owner);for(const d of [...debris])if(d.owner===owner)remove(d);cells.delete(owner)},
   dispose(){effects?.dispose();for(const d of [...debris])remove(d);cells.clear()}
  };
 }
 const api={create,overlaps,TTL,MAX_DEBRIS};if(typeof module==='object')module.exports=api;else root.BlacklineBreakables=api;
})(typeof window==='object'?window:globalThis);
