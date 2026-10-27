const crypto=require('node:crypto');
const {VEHICLES}=require('./src/core');
const placement=require('./src/part-placement');
const {createDuels}=require('./multiplayer-race.cjs');
const TTL=90000;
function fail(status,message){throw Object.assign(new Error(message),{status});}
function appearance(value={}){
  if(!value||typeof value!=='object')value={};
  const c={vehicle:Object.hasOwn(VEHICLES,value.vehicle)?value.vehicle:'crown',stage:Number.isFinite(value.stage)?Math.floor(Math.max(0,Math.min(4,value.stage))):0};
  for(const key of ['skin','wear','wheel','rims','paint','tires','gearing','brakes','response','aero','nitrous','wingStyle','splitter','skirts','diffuser','canards','hoodVent','spats','arches'])if(typeof value[key]==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(value[key])&&!Object.hasOwn(Object.prototype,value[key])&&value[key]!=='prototype')c[key]=value[key];
  for(const key of ['color','rimColor'])if(/^#[a-f0-9]{6}$/i.test(value[key]))c[key]=value[key];
  for(const [key,lo,hi]of [['ride',-.5,.5],['camber',-10,10],['offset',0,.18]])if(Number.isFinite(value[key]))c[key]=Math.max(lo,Math.min(hi,value[key]));
  if(typeof value.spoiler==='boolean')c.spoiler=value.spoiler;
  c.partOffsets=placement.sanitize(value.partOffsets);return c;
}
function state(value={}){
  if(!value||typeof value!=='object')fail(400,'Invalid car state.');
  const out={phase:['roam','race','garage'].includes(value.phase)?value.phase:'garage',config:appearance(value.config)};
  for(const [key,limit]of Object.entries({x:30000,y:4000,z:30000,yaw:100,pitch:4,roll:4,speed:250,vx:250,vz:250,steer:2})){
    if(!Number.isFinite(value[key])){if(out.phase==='roam')fail(400,'Invalid car position.');out[key]=0;}
    else out[key]=Math.max(-limit,Math.min(limit,value[key]));
  }return out;
}
function createRooms({now=Date.now,pickGoal}={}){
  const duels=createDuels({now,pickGoal});
  const rooms=new Map(),rates=new Map();
  function cleanup(){const t=now();for(const [code,room]of rooms){for(const [id,p]of room.players)if(t-p.seen>TTL)room.players.delete(id);if(!room.players.size)rooms.delete(code);}for(const [ip,r]of rates)if(t-r.start>60000)rates.delete(ip);}
  function player(name){return {id:crypto.randomBytes(8).toString('hex'),token:crypto.randomBytes(24).toString('hex'),name:String(name||'Driver').replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,18)||'Driver',seen:now(),state:state(),lastSync:-Infinity};}
  function snapshot(room){return {room:room.code,serverTime:now(),race:duels.view(room),players:[...room.players.values()].map(p=>({id:p.id,name:p.name,...p.state,...(now()-p.seen>6000?{phase:'away',speed:0}:{} )}))};}
  function handle(action,body={},ip='local'){
    cleanup();if(!body||typeof body!=='object'||Array.isArray(body))fail(400,'Invalid request.');
    if(action==='create'||action==='join'){
      const r=rates.get(ip)||{start:now(),count:0};rates.set(ip,r);if(++r.count>30)fail(429,'Please wait before joining again.');
      let room;if(action==='create'){if(rooms.size>=32)fail(503,'The server is full.');let code;do{code=crypto.randomBytes(4).toString('hex').toUpperCase();}while(rooms.has(code));room={code,players:new Map()};rooms.set(code,room);}
      else room=rooms.get(String(body.room||'').toUpperCase());
      if(!room)fail(404,'Room not found. Check the code.');if(room.players.size>=8)fail(409,'The room is full (8 players).');
      const p=player(body.name);room.players.set(p.id,p);return {...snapshot(room),id:p.id,token:p.token};
    }
    const room=rooms.get(String(body.room||'').toUpperCase()),p=room?.players.get(body.id);
    if(!room||!p)fail(404,'Your room session expired. Please rejoin.');if(typeof body.token!=='string'||body.token!==p.token)fail(401,'Invalid session.');
    if(action==='leave'){room.players.delete(p.id);cleanup();return {ok:true};}
    if(['challenge','accept','decline','cancel-race'].includes(action)){duels.action(room,p,action,body);return snapshot(room);}
    if(action!=='sync')fail(404,'Unknown action.');
    if(now()-p.lastSync<45)fail(429,'Too many updates.');
    const previous=p.state,previousAt=p.seen;
    p.state=state(body.state);p.seen=now();p.lastSync=now();duels.observe(room,p,previous,previousAt);return snapshot(room);
  }
  return {handle,cleanup};
}
function roomHandler(rooms=createRooms()){
  return async(req,res,pathname)=>{
    if(!pathname.startsWith('/api/'))return false;
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
    if(pathname==='/api/health'&&req.method==='GET'){send(200,{game:'BLACKLINE',multiplayer:1});return true;}
    if(req.method!=='POST'||!/^\/api\/rooms\/(create|join|sync|leave|challenge|accept|decline|cancel-race)$/.test(pathname)){send(404,{error:'Unknown action.'});return true;}
    if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host){send(403,{error:'Invalid origin.'});return true;}}catch{send(403,{error:'Invalid origin.'});return true;}}
    if(!String(req.headers['content-type']).startsWith('application/json')){send(415,{error:'JSON required.'});return true;}
    try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16384){send(413,{error:'Request too large.'});return true;}chunks.push(chunk);}
      const body=JSON.parse(Buffer.concat(chunks).toString());send(200,rooms.handle(pathname.split('/').pop(),body,req.socket.remoteAddress));
    }catch(e){send(e.status||400,{error:e.status?e.message:'Invalid request.'});}return true;
  };
}
module.exports={createRooms,roomHandler,appearance,state,TTL};
