/* Shared continuous height field: roads, scenery, tyres and camera use the same surface. */
(function(root){
 function height(x,z,theme='city'){
  if(theme==='forest')return 19*Math.sin(x/135)+13*Math.sin(z/115)+5*Math.sin((x+z)/90);
  if(theme==='dock')return 7*Math.sin(x/175)+5*Math.sin(z/130);
  return 19*Math.sin(x/250)+14*Math.sin(z/210)+7*Math.sin((x-z)/180);
 }
 function conform(world,theme){
  const T=THREE;world.updateMatrixWorld(true);
  world.traverse(m=>{
   if(!m.isMesh||m.userData.noTerrain)return;
   const old=m.geometry,p=old.parameters||{};let geo;
   if(old.type==='BoxGeometry')geo=new T.BoxGeometry(p.width,p.height,p.depth,Math.max(1,Math.ceil(p.width*m.scale.x/12)),1,Math.max(1,Math.ceil(p.depth*m.scale.z/12)));
   else if(old.type==='PlaneGeometry')geo=new T.PlaneGeometry(p.width,p.height,Math.max(1,Math.ceil(p.width/12)),Math.max(1,Math.ceil(p.height/12)));
   else geo=old.clone();
   const pos=geo.attributes.position,v=new T.Vector3(),inv=m.matrixWorld.clone().invert();
   for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld);v.y+=height(v.x,v.z,theme);v.applyMatrix4(inv);pos.setXYZ(i,v.x,v.y,v.z);}
   geo.computeVertexNormals();geo.computeBoundingSphere();m.geometry=geo;
  });
 }
 function pose(model,x,z,yaw,theme){
  const h=height(x,z,theme),dx=Math.sin(yaw),dz=Math.cos(yaw);
  const pitch=Math.atan2(height(x+dx,z+dz,theme)-height(x-dx,z-dz,theme),2);
  const roll=Math.atan2(height(x+dz,z-dx,theme)-height(x-dz,z+dx,theme),2);
  model.position.set(x,h+.08,z);model.rotation.order='YXZ';model.rotation.set(-pitch,yaw,roll);
 }
 const api={height,conform,pose};if(typeof module==='object')module.exports=api;else root.BlacklineTerrain=api;
})(typeof window==='object'?window:globalThis);
