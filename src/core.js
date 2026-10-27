/* Pure game rules, shared by the browser and Node's tests. Units: metres, seconds. */
(function (root) {
  'use strict';
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const wrap = (n, total) => ((n % total) + total) % total;
  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '—';
    const ms = Math.floor(Math.max(0, seconds) * 1000);
    return `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
  }
  class LapTracker {
    constructor(samples, laps = 3, gates = 12) {
      this.samples = samples; this.laps = laps; this.gates = gates;
      this.previous = 0; this.nextGate = 1; this.completed = 0; this.finished = false;
    }
    update(index, onRoad = true) {
      const delta = wrap(index - this.previous + this.samples / 2, this.samples) - this.samples / 2;
      const old = this.previous;
      this.previous = index;
      if (!onRoad || delta <= 0 || delta > this.samples / 8 || this.finished) return false;
      const target = (this.nextGate % this.gates) * this.samples / this.gates;
      const ahead = wrap(target - old, this.samples);
      if (ahead > 0 && ahead <= delta) {
        this.nextGate++;
        if (this.nextGate > this.gates) {
          this.completed++; this.nextGate = 1;
          this.finished = this.completed >= this.laps;
          return true;
        }
      }
      return false;
    }
    get checkpointIndex() { return (this.nextGate - 1) * this.samples / this.gates; }
    get progress() { return this.completed + (this.nextGate - 1) / this.gates; }
  }
  const VEHICLES = {
  "emery": {
    "name": "EMERY",
    "badge": "AVENTUS 1992",
    "drive": "RWD",
    "power": 285,
    "topKph": 240,
    "zero100": 5.8,
    "grip": 8,
    "steering": 1.02,
    "reference": "Fictional model · estimated"
  },
  "diablo": {
    "name": "LAMBORGHINI",
    "badge": "DIABLO 5.7",
    "drive": "RWD",
    "power": 492,
    "topKph": 325,
    "zero100": 4.5,
    "grip": 8,
    "steering": 0.94,
    "reference": "1990 5.7 · factory / published"
  },
  "porsche": {
    "name": "PORSCHE 911",
    "badge": "CARRERA 993",
    "drive": "RWD",
    "power": 272,
    "topKph": 270,
    "zero100": 5.6,
    "grip": 8.5,
    "steering": 1.1,
    "reference": "1994 Carrera · factory"
  },
  "charger": {
    "name": "DODGE",
    "badge": "CHARGER R/T 440",
    "drive": "RWD",
    "power": 375,
    "topKph": 220,
    "zero100": 6.2,
    "grip": 6.4,
    "steering": 0.85,
    "reference": "1969 440 · estimated speed / acceleration"
  },
  "r390": {
    "name": "NISSAN",
    "badge": "R390 GT1 ROAD",
    "drive": "RWD",
    "power": 550,
    "topKph": 354,
    "zero100": 3.9,
    "grip": 9.2,
    "steering": 0.98,
    "reference": "1998 road car · estimated performance"
  },
  "gtone": {
    "name": "TOYOTA",
    "badge": "GT-ONE RACE",
    "drive": "RWD",
    "power": 600,
    "topKph": 380,
    "zero100": 3.2,
    "grip": 10,
    "steering": 1,
    "reference": "Le Mans gearing · estimated performance"
  },
  "gtr": {
    "name": "NISSAN",
    "badge": "GT-R R35 2008",
    "drive": "AWD",
    "power": 480,
    "topKph": 310,
    "zero100": 3.6,
    "grip": 9.7,
    "steering": 0.97,
    "reference": "2008 stock · published performance"
  },
  "crown": {
    "name": "FORD",
    "badge": "CROWN VICTORIA LX",
    "drive": "RWD",
    "power": 239,
    "topKph": 180,
    "zero100": 9.3,
    "grip": 7,
    "steering": 0.9,
    "reference": "2003 LX · estimated / governor"
  },
  "skyline": {
    "name": "NISSAN",
    "badge": "SKYLINE GT-T 1998",
    "drive": "RWD",
    "power": 280,
    "topKph": 180,
    "zero100": 5.8,
    "grip": 8.7,
    "steering": 1,
    "reference": "1998 GT-T · JDM limiter / estimated acceleration"
  },
  "rotary": {
    "name": "MAZDA",
    "badge": "RX-7 FD",
    "drive": "RWD",
    "power": 255,
    "topKph": 250,
    "zero100": 5.3,
    "grip": 8.8,
    "steering": 1.12,
    "reference": "1992 export FD · published baseline"
  },
  "interceptor": {
    "name": "FORD",
    "badge": "POLICE INTERCEPTOR",
    "drive": "RWD",
    "power": 218,
    "topKph": 208,
    "zero100": 9.3,
    "grip": 7,
    "steering": 0.9,
    "reference": "2000 P71 · tested top speed / estimated 0–100"
  },
  "livisa": {
    "name": "SANNIS",
    "badge": "LIVISA 180RS",
    "drive": "RWD",
    "power": 205,
    "topKph": 180,
    "zero100": 7.5,
    "grip": 8.2,
    "steering": 1.06,
    "reference": "Fictional · Nissan 180SX SR20DET baseline / estimate"
  },
  "jv_viper": {
    "name": "DODGE VIPER",
    "badge": "JV / SRT-10",
    "drive": "RWD",
    "power": 507,
    "topKph": 306,
    "zero100": 4.0,
    "grip": 8.4,
    "steering": 0.98,
    "reference": "2005 SRT-10 stock baseline · beta livery"
  },
  "m3gtr": {
    "name": "BMW",
    "badge": "M3 GTR ROAD",
    "drive": "RWD",
    "power": 350,
    "topKph": 295,
    "zero100": 4.7,
    "grip": 9.3,
    "steering": 1.03,
    "reference": "2001 road homologation · estimated acceleration"
  },
  "m3_redfire": {
    "name": "BMW",
    "badge": "M3 GTR REDFIRE",
    "drive": "RWD",
    "power": 350,
    "topKph": 295,
    "zero100": 4.7,
    "grip": 9.3,
    "steering": 1.03,
    "reference": "2001 road homologation · beta livery / estimate"
  },
  "razor": {
    "name": "FORD MUSTANG",
    "badge": "RAZOR / GT 2005",
    "drive": "RWD",
    "power": 304,
    "topKph": 240,
    "zero100": 5.3,
    "grip": 8,
    "steering": 1,
    "reference": "2005 GT stock baseline · beta livery / estimate"
  },
  "jewels": {
    "name": "FORD MUSTANG",
    "badge": "JEWELS / GT 2005",
    "drive": "RWD",
    "power": 304,
    "topKph": 240,
    "zero100": 5.3,
    "grip": 8,
    "steering": 1,
    "reference": "2005 GT stock baseline · beta livery / estimate"
  },
  "golf": {
    "name": "VOLKSWAGEN",
    "badge": "GOLF GTI / SONNY",
    "drive": "FWD",
    "power": 200,
    "topKph": 235,
    "zero100": 7.2,
    "grip": 8.3,
    "steering": 1.1,
    "reference": "2005 Mk5 manual · factory stock baseline"
  },
  "ae86": {
    "name": "TOYOTA",
    "badge": "SPRINTER TRUENO AE86",
    "drive": "RWD",
    "power": 130,
    "topKph": 195,
    "zero100": 8.9,
    "grip": 7.5,
    "steering": 1.15,
    "reference": "JDM AE86 · estimated speed / acceleration"
  },
  "skyline_beta": {
    "name": "NISSAN",
    "badge": "SKYLINE / BETA BLUE",
    "drive": "AWD",
    "power": 280,
    "topKph": 180,
    "zero100": 5.4,
    "grip": 9,
    "steering": 1,
    "reference": "R34 GT-R baseline · JDM limiter / estimate"
  },
  "skyline_java": {
    "name": "NISSAN",
    "badge": "SKYLINE / JAVA",
    "drive": "AWD",
    "power": 280,
    "topKph": 180,
    "zero100": 5.4,
    "grip": 9,
    "steering": 1,
    "reference": "R34 GT-R baseline · JDM limiter / estimate"
  },
  "mia_rx8": {
    "name": "MAZDA",
    "badge": "RX-8 / MIA",
    "drive": "RWD",
    "power": 231,
    "topKph": 235,
    "zero100": 6.4,
    "grip": 8.5,
    "steering": 1.1,
    "reference": "2004 European 6-speed · stock baseline"
  }
};
  Object.assign(VEHICLES,{"taz":{"name":"LEXUS","badge":"IS 300 / TAZ","drive":"RWD","power":215,"topKph":230,"zero100":8.2,"grip":8,"steering":1.05,"reference":"Stock baseline estimate / Blacklist livery · boss uses listed Stage"},"vic":{"name":"TOYOTA","badge":"SUPRA / VIC","drive":"RWD","power":280,"topKph":250,"zero100":5.2,"grip":8.3,"steering":1,"reference":"Stock baseline estimate / Blacklist livery · boss uses listed Stage"},"izzy":{"name":"MAZDA","badge":"RX-8 / IZZY","drive":"RWD","power":231,"topKph":235,"zero100":6.4,"grip":8.5,"steering":1.1,"reference":"Stock baseline estimate / Blacklist livery · boss uses listed Stage"},"big_lou":{"name":"MITSUBISHI","badge":"ECLIPSE GT / BIG LOU","drive":"FWD","power":263,"topKph":240,"zero100":6.8,"grip":8.1,"steering":1.02,"reference":"Stock baseline estimate / Blacklist livery · boss uses listed Stage"},"baron":{"name":"PORSCHE","badge":"CAYMAN S / BARON","drive":"RWD","power":295,"topKph":275,"zero100":5.4,"grip":9.2,"steering":1.08,"reference":"Stock baseline estimate / Blacklist livery · boss uses listed Stage"},"earl":{"name":"MITSUBISHI","badge":"LANCER EVO VIII / EARL","drive":"AWD","power":280,"topKph":245,"zero100":5.7,"grip":9.1,"steering":1.05,"reference":"Stock baseline estimate / Blacklist livery · boss uses listed Stage"},"kaze":{"name":"MERCEDES-BENZ","badge":"CLK 500 / KAZE","drive":"RWD","power":306,"topKph":250,"zero100":6,"grip":8.4,"steering":1,"reference":"Stock baseline estimate / Blacklist livery · boss uses listed Stage"},"ming":{"name":"LAMBORGHINI","badge":"GALLARDO / MING","drive":"AWD","power":500,"topKph":309,"zero100":4.2,"grip":9.5,"steering":1.02,"reference":"Stock baseline estimate / Blacklist livery · boss uses listed Stage"},"webster":{"name":"CHEVROLET","badge":"CORVETTE C6 / WEBSTER","drive":"RWD","power":400,"topKph":300,"zero100":4.3,"grip":9,"steering":1.03,"reference":"Stock baseline estimate / Blacklist livery · boss uses listed Stage"}});
  Object.assign(VEHICLES.m3gtr,{badge:'M3 GTR / RAZOR',power:450,topKph:320,zero100:3.9,reference:'GTR race baseline estimate · MW hero livery'});
  Object.assign(VEHICLES.rotary,{badge:'MAZDASPEED RX-7 A-SPEC',reference:'1999 A-Spec model · existing BLACKLISTED performance baseline'});
  // Local gameplay baselines for the supplied street models; not homologation
  // data or a claim that a fictional concept has real production specifications.
  Object.assign(VEHICLES,{
    tiburon:{name:'HYUNDAI',badge:'TIBURON V6 2003',drive:'FWD',power:170,topKph:220,zero100:8.2,grip:8,steering:1.02,reference:'BLACKLISTED gameplay estimate · V6 coupe'},
    datsun:{name:'DATSUN',badge:'FAIRLADY Z / 280Z',drive:'RWD',power:150,topKph:205,zero100:8.7,grip:7.5,steering:1.03,reference:'BLACKLISTED gameplay estimate · classic Z'},
    road_runner:{name:'PLYMOUTH',badge:'ROAD RUNNER 1971',drive:'RWD',power:335,topKph:210,zero100:6.5,grip:7.4,steering:.95,reference:'BLACKLISTED gameplay estimate · GT2 body'},
    supra:{name:'TOYOTA',badge:'SUPRA 1998',drive:'RWD',power:280,topKph:250,zero100:5.2,grip:8.5,steering:1.05,reference:'BLACKLISTED gameplay estimate · twin-turbo baseline'},
    m5_e39:{name:'BMW',badge:'M5 E39',drive:'RWD',power:400,topKph:250,zero100:5.3,grip:8.6,steering:.98,reference:'BLACKLISTED gameplay estimate · sports saloon'},
    resonanso:{name:'FERRARI F40',badge:'LB-WORKS',drive:'RWD',power:450,topKph:300,zero100:4.4,grip:8.8,steering:1.06,reference:'LB-WORKS · BLACKLISTED gameplay baseline'},
    testarossa:{name:'FERRARI TESTAROSSA',badge:'512 · MIAMI VICE 1986',drive:'RWD',power:390,topKph:290,zero100:5.8,grip:8.4,steering:1.0,reference:'BLACKLISTED gameplay estimate'},
    carrera_gt:{name:'PORSCHE',badge:'CARRERA GT',drive:'RWD',power:612,topKph:330,zero100:3.9,grip:10,steering:1.08,reference:'BLACKLISTED gameplay estimate · V10 roadster'}
  });
  for(const v of Object.values(VEHICLES)){v.max=v.topKph/3.6;v.acceleration=v.max*Math.atanh((100/3.6)/v.max)/v.zero100;}
  const VEHICLE_ORDER=Object.keys(VEHICLES).sort((a,b)=>VEHICLES[b].zero100-VEHICLES[a].zero100||VEHICLES[a].topKph-VEHICLES[b].topKph||a.localeCompare(b));
  function tune(stage=0, vehicle='skyline',setup={}) {
    stage=clamp(Math.round(Number(stage)||0),0,4);
    const base=VEHICLES[vehicle]||VEHICLES.skyline;
    const ratio={short:.9,balanced:1,long:1.1}[setup.gearing]||1;
    const aeroMultiplier=1+(.5-({speed:0,balanced:.5,grip:1}[setup.aero]??.5))*.04;
    return {...base,stage,power:Math.round(base.power*[1,1.19,1.43,1.78,2.22][stage]),
      max:(base.max+[0,7,14,23,32][stage])*ratio*aeroMultiplier, acceleration:base.acceleration*[1,1.2,1.43,1.72,2.05][stage]/ratio,
      brakes:(34+stage*4)*({stock:1,sport:1.15,race:1.3}[setup.brakes]||1),grip:base.grip+stage*.4+({street:0,sport:1.2,semi:2.4,drift:-1.5}[setup.tires]||0),nitroDrain:(28-stage*2)*({duration:.7,balanced:1,power:1.4}[setup.nitrous]||1),nitroPower:({duration:18,balanced:25,power:34}[setup.nitrous]||25),steeringResponse:({relaxed:.78,balanced:1,sharp:1.22}[setup.response]||1),downforce:({speed:0,balanced:.5,grip:1}[setup.aero]??.5)};
  }
  function drive(car, input, dt, stage = 0, vehicle = 'skyline', setup = {}) {
    if(!Number.isFinite(dt)||dt<=0)return;
    // Bound integration steps so steering and boost depletion agree across refresh rates.
    if(dt>1/120+1e-9){const steps=Math.ceil(dt/(1/120));for(let i=0;i<steps;i++)drive(car,input,dt/steps,stage,vehicle,setup);return;}
    const spec=tune(stage,vehicle,setup), max=spec.max;
    if(!input.nitro)car.nitroEmpty=false;
    car.boost=!!(input.nitro&&input.throttle&&!input.brake&&!input.handbrake&&!car.nitroEmpty&&car.nitro>0&&car.speed>4);
    if(car.boost){
      const spent=Math.min(car.nitro,spec.nitroDrain*dt);car.nitro-=spent;
      car.boostFraction=spent/(spec.nitroDrain*dt);car.nitroCooldown=.65;
      if(car.nitro<=1e-8){car.nitro=0;car.nitroEmpty=true;}
    }else{
      car.boostFraction=0;car.nitroCooldown=Math.max(0,(car.nitroCooldown||0)-dt);
      if(!input.nitro&&car.nitroCooldown===0&&car.speed>12)car.nitro=Math.min(100,car.nitro+Math.min(10,(car.speed-12)*.3)*dt);
    }
    if (input.throttle) car.speed += spec.acceleration * dt * Math.max(0,1-(Math.max(0,car.speed)/max)**2);
    if (car.boost) car.speed += spec.nitroPower * car.boostFraction * dt;
    if (input.brake) car.speed -= (car.speed > 0.5 ? spec.brakes : 7) * dt;
    car.speed *= Math.exp(-(input.handbrake ? 1.0 : input.throttle ? 0 : 0.35) * dt);
    car.speed=Math.max(-12,car.speed);
    // Releasing boost sheds excess speed progressively instead of clipping to stock top speed.
    const limit=max+(car.boost?22:0);
    if(car.speed>limit)car.speed=limit+(car.speed-limit)*Math.exp(-1.5*dt);
    // Smooth keyboard steering and progressively reduce lock at speed.
    const requested=clamp(Number(input.steer)||0,-1,1),previousSteer=Number.isFinite(car.steer)?car.steer:0;
    car.steer=previousSteer+(requested-previousSteer)*(1-Math.exp(-10*spec.steeringResponse*dt));
    const speed=Math.abs(car.speed),highSpeed=clamp((speed-20)/65,0,1);
    const steerStrength=(1.25-highSpeed*.65)*spec.steering*spec.steeringResponse*(input.handbrake?1.65:1);
    car.yaw-=car.steer*steerStrength*Math.min(speed/8,1)*Math.sign(car.speed)*dt;
    const targetX=Math.sin(car.yaw)*car.speed,targetZ=Math.cos(car.yaw)*car.speed;
    const grip=1-Math.exp(-(input.handbrake?2.2:spec.grip*(1+highSpeed*spec.downforce*.45))*dt);
    car.vx+=(targetX-car.vx)*grip;car.vz+=(targetZ-car.vz)*grip;
    car.speed*=Math.exp(-Math.abs(car.steer)*highSpeed*(input.handbrake?.22:.035)*dt);
    car.x += car.vx * dt; car.z += car.vz * dt;
  }
  function resolveWorldCollision(car, solids, bounds, previous) {
    const radius=1.7;
    let hit=false;
    // A swept point against expanded building boxes avoids tunnelling at Stage 4 speeds.
    for(const s of solids){
      let low=0,high=1;
      for(const axis of ['x','z']){
        const delta=car[axis]-previous[axis],min=s[axis]-s[axis==='x'?'w':'d']/2-radius,max=s[axis]+s[axis==='x'?'w':'d']/2+radius;
        if(Math.abs(delta)<1e-8){if(previous[axis]<min||previous[axis]>max){low=2;break;}}
        else {const a=(min-previous[axis])/delta,b=(max-previous[axis])/delta;low=Math.max(low,Math.min(a,b));high=Math.min(high,Math.max(a,b));}
      }
      if(low<=high&&low>=0&&low<=1){car.x=previous.x;car.z=previous.z;hit=true;break;}
    }
    if(Math.abs(car.x)>bounds||Math.abs(car.z)>bounds){car.x=clamp(car.x,-bounds,bounds);car.z=clamp(car.z,-bounds,bounds);hit=true;}
    if(hit){car.speed*=.25;car.vx=0;car.vz=0;}
    return hit;
  }
  const api = { clamp, wrap, formatTime, LapTracker, drive, tune, VEHICLES, VEHICLE_ORDER, resolveWorldCollision };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RacingCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

