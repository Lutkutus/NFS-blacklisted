(function(root){
  'use strict';
  const $=id=>document.getElementById(id),storage={get(k){try{return sessionStorage.getItem(k);}catch{return null;}},set(k,v){try{v?sessionStorage.setItem(k,v):sessionStorage.removeItem(k);}catch{}}};
  function create({snapshot,onDrive,onOpen,onClose}){
    let shareOrigin=location.origin,session=null,players=[],lastSeen=0,timer,busy=false,joining=false,generation=0,failures=0,race=null,clockOffset=0,raceBusy=false;
    try{session=JSON.parse(storage.get('blackline-room'));}catch{}
    const button=document.createElement('button');button.id='multiplayer-open';button.className='outline';button.textContent='MULTIPLAYER';document.querySelector('#topbar .top-right').prepend(button);
    const panel=document.createElement('section');panel.id='multiplayer-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','mp-title');
    panel.innerHTML='<div class="modal"><p class="eyebrow">BLACKLISTED / FRIENDS</p><h2 id="mp-title">MULTIPLAYER.</h2><p>Shared free roam · Up to 8 players. Friends see your car and customization. Challenge a friend to a random destination race. Solo races, traffic and police run separately for each player. Player cars pass through one another.</p><div id="mp-entry"><label for="mp-name">NICKNAME</label><input id="mp-name" maxlength="18" autocomplete="nickname" placeholder="Driver"><button id="mp-create" class="primary">CREATE ROOM</button><label for="mp-code">ROOM CODE</label><div class="mp-row"><input id="mp-code" maxlength="8" placeholder="8 CHARACTERS" autocapitalize="characters" spellcheck="false"><button id="mp-join" class="outline">JOIN</button></div></div><div id="mp-room" hidden><p>ROOM <strong id="mp-room-code"></strong> · <span id="mp-count"></span></p><input id="mp-link" aria-label="Invite link" readonly><button id="mp-copy" class="outline">COPY INVITE LINK</button><p id="mp-local-note">Run Moninpeli.bat to share an online invite link. The address 127.0.0.1 only works on your own computer.</p><ul id="mp-players"></ul><button id="mp-drive" class="primary">DRIVE WITH FRIENDS ↗</button><div class="mp-duel"><label for="mp-opponent">RACE A FRIEND</label><select id="mp-opponent" aria-label="Player to challenge"></select><button id="mp-challenge" class="outline">CHALLENGE TO A RACE</button><p>Drive close to each other (within 60 m). Accept the challenge and wait for the shared start. Random finish, any route, no checkpoints.</p></div><button id="mp-leave" class="text-button">LEAVE ROOM</button></div><p id="mp-status" role="status" aria-live="polite"></p><button id="mp-close" class="text-button">CLOSE</button></div>';
    document.body.append(panel);
    const raceHUD=document.createElement('section');raceHUD.id='mp-race-hud';raceHUD.hidden=true;raceHUD.setAttribute('aria-label','Multiplayer race');raceHUD.innerHTML='<span id="mp-race-arrow">↑</span><div><strong id="mp-race-title"></strong><p id="mp-race-detail"></p><div class="mp-race-actions"><button id="mp-race-accept">ACCEPT</button><button id="mp-race-decline">DECLINE</button><button id="mp-race-cancel">CANCEL RACE</button><button id="mp-race-dismiss">DISMISS RESULT</button></div></div>';document.body.append(raceHUD);let dismissed=null,statusUntil=0;
    $('mp-name').value=storage.get('blackline-name')||'';
    const invitation=new URLSearchParams(location.search).get('room')||new URLSearchParams(location.hash.slice(1)).get('room');if(/^[a-f0-9]{8}$/i.test(invitation||''))$('mp-code').value=invitation.toUpperCase();
    async function request(action,body,keepalive=false){const sent=Date.now(),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5000);try{const response=await fetch('/api/rooms/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal,keepalive});let data;try{data=await response.json();}catch{throw Error('Multiplayer is unavailable on this server. Restart the game server.');}if(!response.ok)throw Object.assign(Error(data.error||'Connection failed.'),{status:response.status});if(Number.isFinite(data.serverTime))data.clientClockOffset=data.serverTime-(sent+Date.now())/2;return data;}finally{clearTimeout(timeout);}}
    function applyRace(result){race=result.race||null;clockOffset=result.clientClockOffset||0;if(race?.status==='countdown'&&race.ids.includes(session?.id)&&!panel.hidden)close();}
    function activeRace(){return !!session&&race?.ids.includes(session.id)&&['countdown','running'].includes(race.status);}
    async function raceAction(action){if(!session||raceBusy)return;raceBusy=true;
      try{const result=await request(action,{...session,raceId:race?.id,opponent:$('mp-opponent').value});applyRace(result);draw();if(action==='challenge'||action==='accept')close();}
      catch(e){status(e.message,true);if(panel.hidden)open();}finally{raceBusy=false;}
    }
    function raceFrame(local){
      const mine=!!session&&race?.ids.includes(session.id);raceHUD.hidden=!mine||race.id===dismissed;if(raceHUD.hidden)return;
      const phase=race.status,opponent=race.names[race.ids.find(id=>id!==session.id)],incoming=phase==='offered'&&race.ids[1]===session.id,finished=phase==='finished'||phase==='cancelled',connected=performance.now()-lastSeen<3000;
      $('mp-race-accept').hidden=$('mp-race-decline').hidden=!incoming;$('mp-race-cancel').hidden=finished||incoming;$('mp-race-dismiss').hidden=!finished;
      $('mp-race-arrow').hidden=!race.goal||finished;
      let title='',detail='';
      if(phase==='offered'){title=incoming?opponent+' CHALLENGES YOU TO A RACE':'CHALLENGE SENT';detail=incoming?'Accept the challenge. A random finish and shared start await.':'Waiting for '+opponent;}
      else if(phase==='cancelled'){title='RACE CANCELLED';detail=race.reason;}
      else if(phase==='finished'){title=race.winner===session.id?'YOU WON THE RACE!':race.names[race.winner]+' WON';detail=(race.timeMs/1000).toFixed(2)+' s · First to the finish wins.';}
      else {
        const remaining=race.startsAt-(Date.now()+clockOffset),distance=local?Math.hypot(local.x-race.goal.x,local.z-race.goal.z):0;
        title=!connected?'CONNECTION LOST · PLEASE WAIT':remaining>0?'START '+Math.ceil(remaining/1000):race.arrivals?.[session.id]!==undefined?'FINISHED · CONFIRMING RESULT':'RACE TO THE FINISH · '+Math.round(distance)+' m';
        detail='OPPONENT '+opponent+' · Any route · No checkpoints';
        if(local)$('mp-race-arrow').style.transform='rotate('+Math.atan2(Math.sin(Math.atan2(race.goal.x-local.x,race.goal.z-local.z)-local.yaw),Math.cos(Math.atan2(race.goal.x-local.x,race.goal.z-local.z)-local.yaw))+'rad)';
      }
      $('mp-race-title').textContent=title;$('mp-race-detail').textContent=detail;
    }
    function status(text,sticky=false){if(!sticky&&performance.now()<statusUntil)return;if(sticky)statusUntil=performance.now()+5000;$('mp-status').textContent=text;}
    function draw(){
      root.BlacklineMultiplayer.playersCount=players.length;
      $('mp-entry').hidden=!!session;$('mp-room').hidden=!session;button.textContent=session?'FRIENDS · '+players.length+'/8':'MULTIPLAYER';
      $('mp-create').disabled=$('mp-join').disabled=joining;
      button.classList.toggle('mp-offline',!!session&&failures>0);
      if(!session){race=null;raceHUD.hidden=true;return;}
      if(race?.status==='offered'&&race.ids[1]===session.id)button.textContent='RACE CHALLENGE!';
      const options=players.filter(p=>p.id!==session.id&&p.phase==='roam'),signature=JSON.stringify(options.map(p=>[p.id,p.name]));
      if($('mp-opponent').dataset.signature!==signature){const selected=$('mp-opponent').value;$('mp-opponent').replaceChildren(...options.map(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.name;return option;}));if(options.some(p=>p.id===selected))$('mp-opponent').value=selected;$('mp-opponent').dataset.signature=signature;}
      $('mp-challenge').disabled=!options.length||!!race&&['offered','countdown','running'].includes(race.status);$('mp-drive').disabled=activeRace();
      $('mp-room-code').textContent=session.room;$('mp-count').textContent=players.length+'/8';$('mp-link').value=shareOrigin+'/?room='+session.room;
      $('mp-local-note').hidden=shareOrigin!==location.origin||!['127.0.0.1','localhost'].includes(location.hostname);
      $('mp-players').replaceChildren(...players.map(p=>{const row=document.createElement('li');row.textContent=p.name+(p.id===session.id?' (you)':'')+' · '+({roam:'driving',race:'racing',garage:'in the garage',away:'disconnected'}[p.phase]||'in the garage');return row;}));

    }
    function schedule(delay=250){clearTimeout(timer);if(session)timer=setTimeout(sync,delay);}
    async function sync(){if(!session||busy){schedule();return;}busy=true;const version=generation,current=session;
      try{const result=await request('sync',{...current,state:snapshot()});if(version!==generation)return;players=result.players.map(p=>({...p,receivedAt:performance.now()}));lastSeen=performance.now();failures=0;applyRace(result);status('CONNECTED · Cars are visible in shared free roam.');draw();}
      catch(e){if(version!==generation)return;failures++;status(e.status===404||e.status===401?e.message:'Connection lost. Reconnecting…');if(e.status===404||e.status===401){session=null;players=[];storage.set('blackline-room',null);draw();}}
      finally{busy=false;schedule(Math.min(5000,failures?500*2**Math.min(failures,3):Math.max(250,players.length*65)));}
    }
    async function join(action){if(joining||session)return;joining=true;draw();status('Connecting…');const version=++generation;
      try{const name=$('mp-name').value.trim()||'Driver';storage.set('blackline-name',name);const result=await request(action,{name,room:$('mp-code').value.trim().toUpperCase()});if(version!==generation)return;session={room:result.room,id:result.id,token:result.token};players=result.players.map(p=>({...p,receivedAt:performance.now()}));lastSeen=performance.now();failures=0;storage.set('blackline-room',JSON.stringify(session));applyRace(result);status('Room ready. Copy the invite link and start free roam.');schedule();}
      catch(e){status(e.message);}finally{joining=false;draw();}
    }
    function close(){if(panel.hidden)return;panel.hidden=true;onClose?.();button.focus();}
    async function refreshShare(){if(['127.0.0.1','localhost'].includes(location.hostname))try{const data=await (await fetch('/api/share',{cache:'no-store'})).json();shareOrigin=/^https:\/\/[a-z0-9-]+\.(?:trycloudflare\.com|lhr\.life|localhost\.run|tunnl\.gg)$/.test(data.url)?data.url:location.origin;draw();}catch{}}
    function open(){if(!panel.hidden)return;refreshShare();onOpen?.();panel.hidden=false;draw();(session?$('mp-drive'):$('mp-name')).focus();}
    $('mp-challenge').onclick=()=>raceAction('challenge');$('mp-race-accept').onclick=()=>raceAction('accept');$('mp-race-decline').onclick=()=>raceAction('decline');$('mp-race-cancel').onclick=()=>raceAction('cancel-race');$('mp-race-dismiss').onclick=()=>{dismissed=race?.id;raceHUD.hidden=true;};
    button.onclick=open;$('mp-close').onclick=close;$('mp-create').onclick=()=>join('create');$('mp-join').onclick=()=>join('join');
    $('mp-code').addEventListener('keydown',e=>{if(e.key==='Enter')join('join');});
    $('mp-copy').onclick=async()=>{await refreshShare();try{await navigator.clipboard.writeText($('mp-link').value);status('Invite link copied.');}catch{$('mp-link').select();status('Copy the selected link: Ctrl+C.');}};
    $('mp-leave').onclick=()=>{const old=session;generation++;clearTimeout(timer);session=null;players=[];storage.set('blackline-room',null);status('You left the room.');draw();if(old)request('leave',old,true).catch(()=>{});};
    $('mp-drive').onclick=async()=>{if(!session||!$('loading').hidden)return;close();await onDrive();};
    panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}e.stopPropagation();});
    draw();if(session)schedule(0);if((invitation&&!session)||location.hash==='#multiplayer')open();
    return {open,close,frame:raceFrame,get race(){return race;},get isRacing(){return activeRace();},get hold(){return activeRace()&&((Date.now()+clockOffset)<race.startsAt||performance.now()-lastSeen>3000||race.arrivals?.[session.id]!==undefined);},get isOpen(){return !panel.hidden;},get session(){return session;},get peers(){return session&&performance.now()-lastSeen<6000?players.filter(p=>p.id!==session.id):[];}};
  }
  root.BlacklineMultiplayer={create};
})(window);
