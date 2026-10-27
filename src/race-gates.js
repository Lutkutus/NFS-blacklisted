(function(root){
 function create(THREE){
  const group=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0xd5ed75,transparent:true,opacity:.75});
  function beam(x,y,w,h){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,.3),mat);mesh.position.set(x,y,0);group.add(mesh);}
  beam(-9,5,.3,10);beam(9,5,.3,10);beam(0,10,18,.35);
  const curtain=new THREE.Mesh(new THREE.PlaneGeometry(18,10),new THREE.MeshBasicMaterial({color:0xd5ed75,transparent:true,opacity:.065,side:THREE.DoubleSide,depthWrite:false}));curtain.position.y=5;group.add(curtain);return group;
 }
 function pose(group,g){const offset=(g.right-g.left)/2;group.position.set(g.x+Math.cos(g.yaw)*offset,g.y+g.slope*offset,g.z-Math.sin(g.yaw)*offset);group.rotation.set(0,g.yaw,Math.atan(g.slope));group.scale.x=(g.left+g.right)/18;}
 root.BlacklineRaceGates={create,pose};
})(window);
