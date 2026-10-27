(function(root){
  'use strict';
  function dispose(model){const geometries=new Set(),materials=new Set(),textures=new Set();model.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());model.removeFromParent();}
  function label(name){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;const c=canvas.getContext('2d');c.fillStyle='#132326dc';c.fillRect(0,0,512,64);c.fillStyle='#8ef0ed';c.font='bold 30px monospace';c.textAlign='center';c.fillText(name,256,43,490);const map=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:false}));sprite.position.y=3;sprite.scale.set(5,.625,1);sprite.renderOrder=10;return sprite;}
  function create(){const cars=new Map();let parent=null;
    function clear(){for(const car of cars.values())dispose(car.model);cars.clear();parent=null;}
    function update({scene,world,local,peers,dt}){
      if(parent!==scene){clear();parent=scene;}const wanted=new Set();
      if(scene&&world&&local)for(const p of peers){if(p.phase!=='roam'||Math.hypot(p.x-local.x,p.z-local.z)>480||!world.areaReady(p,4))continue;
        wanted.add(p.id);let entry=cars.get(p.id);const signature=JSON.stringify(p.config);
        if(entry&&entry.signature!==signature){dispose(entry.model);cars.delete(p.id);entry=null;}
        if(!entry){const model=BlacklineCars.create(p.config);model.name='multiplayer-'+p.id;model.userData.multiplayerId=p.id;model.add(label(p.name));scene.add(model);entry={model,signature,x:p.x,y:p.y,z:p.z,yaw:p.yaw,pitch:p.pitch,roll:p.roll};cars.set(p.id,entry);}
        const age=Math.min(.2,Math.max(0,(performance.now()-(p.receivedAt||performance.now()))/1000)),target={...p,x:p.x+p.vx*age,z:p.z+p.vz*age};
        const a=1-Math.exp(-dt*14),snap=Math.hypot(entry.x-p.x,entry.z-p.z)>60;
        for(const k of ['x','y','z','pitch','roll'])entry[k]=snap?target[k]:entry[k]+(target[k]-entry[k])*a;
        entry.yaw+=Math.atan2(Math.sin(p.yaw-entry.yaw),Math.cos(p.yaw-entry.yaw))*(snap?1:a);
        world.pose(entry.model,entry.x,entry.z,entry.yaw,entry.y,entry);BlacklineCars.animate(entry.model,p.speed,dt,p.steer);
      }
      for(const [id,entry]of cars)if(!wanted.has(id)){dispose(entry.model);cars.delete(id);}
    }
    return {update,clear};
  }
  root.BlacklineMultiplayerCars={create};
})(window);
