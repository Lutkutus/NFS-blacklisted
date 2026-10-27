/* Manual offsets are applied after automatic fitting and stored per car + selected part. */
(function(root){
 const limit=1.5;
 function sanitize(value){const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
  for(const [key,v] of Object.entries(value).slice(0,128))if(/^(splitter|skirts|diffuser|wingStyle|canards|hoodVent|spats|arches|wheel)-(?:[a-z0-9_-]+)$/.test(key)&&Array.isArray(v)&&v.length===3&&v.every(Number.isFinite))out[key]=v.map(n=>Math.max(-limit,Math.min(limit,n)));
  return out;
 }
 function attach(model,c){
  const list=[],labels={splitter:'Front splitter',skirts:'Side skirts',diffuser:'Rear diffuser',wingStyle:'Rear wing',canards:'Canards',hoodVent:'Hood vents',spats:'Rear spats',arches:'Fender flares'};
  function register(field,id,targets,label){if(!targets.length)return;const key=field+'-'+id,entry={key,label:label||labels[field],targets,mirrorX:field==='skirts'||field==='arches'};for(const object of targets){object.userData.placementBase=object.position.clone();if(entry.mirrorX)object.userData.placementSide=object.userData.placementSide||Math.sign(object.position.x)||1;}list.push(entry);}
  const fields={splitter:'splitter',skirts:'skirts',diffuser:'diffuser',wing:'wingStyle',canards:'canards',hood:'hoodVent',spats:'spats',arches:'arches'};
  for(const group of model.getObjectByName('workshop-parts')?.children||[]){const field=fields[group.userData.family];register(field,c[field],field==='skirts'||field==='arches'?group.children:[group]);}
  if(c.wingStyle&&c.wingStyle!=='stock'&&model.userData.wing.children.length)register('wingStyle',c.wingStyle,[model.userData.wing]);
  const trim=model.userData.trim.children,hasSplitter=c.splitter!=='stock'&&!root.BLACKLINE_WORKSHOP?.[c.splitter];
  if(hasSplitter&&trim.length)register('splitter',c.splitter,[trim[0]]);
  if(c.skirts!=='stock'&&!root.BLACKLINE_WORKSHOP?.[c.skirts])register('skirts',c.skirts,trim.slice(hasSplitter?1:0));
  if(c.wheel&&c.wheel!=='original')for(const wheel of model.userData.wheels){const side=wheel.position.x<0?'Left':'Right',front=wheel.position.z>0;register('wheel',c.wheel+'-'+(wheel.position.x<0?'l':'r')+(front?'f':'r'),[wheel],side+' '+(front?'front wheel':'rear wheel'));}
  model.userData.adjustableParts=list;apply(model,c.partOffsets);return list;
 }
 function apply(model,offsets){const clean=sanitize(offsets);for(const entry of model.userData.adjustableParts||[])for(const object of entry.targets){const p=clean[entry.key]||[0,0,0];object.position.copy(object.userData.placementBase);object.position.x+=p[0]*(entry.mirrorX?object.userData.placementSide:1);object.position.y+=p[1];object.position.z+=p[2];}}
 const api={sanitize,attach,apply,limit};if(typeof module==='object')module.exports=api;else root.BlacklinePartPlacement=api;
})(typeof window!=='undefined'?window:globalThis);
