const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {roomHandler,createRooms}=require('./multiplayer-server.cjs');
const root=__dirname;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.bin':'application/octet-stream','.gltf':'model/gltf+json','.glb':'model/gltf-binary'};
function allowed(p){return p==='/index.html'||p==='/style.css'||/^\/src\/[\w-]+\.js$/.test(p)||p==='/vendor/three.min.js'||/^\/assets\/(psx|blacklist|street|custom|dealer|rockport|tuning)\/[\w./ -]+$/.test(p);}
function createServer({roomsOptions}={}){const api=roomHandler(createRooms(roomsOptions));return http.createServer(async(req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
  if(pathname==='/api/share'&&req.method==='GET'){
    let url=null;try{const data=JSON.parse(fs.readFileSync(path.join(root,'tmp/multiplayer-tunnel.json'),'utf8').replace(/^\uFEFF/,''));if(/^https:\/\/[a-z0-9-]+\.(?:trycloudflare\.com|lhr\.life|localhost\.run|tunnl\.gg)$/.test(data.url)&&Number.isInteger(data.pid)&&data.pid>0){process.kill(data.pid,0);url=data.url;}}catch{}
    res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify({url}));
  }
  if(await api(req,res,pathname))return;
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  if(pathname==='/')pathname='/index.html';
  if(!allowed(pathname)||pathname.split('/').some(p=>p==='..'||p==='.')||pathname.includes('\\')){res.writeHead(404);return res.end('Not found');}
  const file=path.resolve(root,'.'+pathname);
  try{const real=await fs.promises.realpath(file);if(!real.startsWith(root+path.sep))throw Error();const stat=await fs.promises.stat(real);if(!stat.isFile())throw Error();
    const etag='"'+stat.size+'-'+stat.mtimeMs+'"';const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','ETag':etag,'Vary':'Accept-Encoding'};
    if(req.headers['if-none-match']===etag){res.writeHead(304,headers);return res.end();}
    const gzip=stat.size>1024&&/\.(js|json|css|html|bin|gltf)$/.test(file)&&/\bgzip\b/.test(req.headers['accept-encoding']||'');
    if(gzip)headers['Content-Encoding']='gzip';else headers['Content-Length']=stat.size;
    res.writeHead(200,headers);if(req.method==='HEAD')return res.end();const stream=fs.createReadStream(real);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());if(gzip)stream.pipe(zlib.createGzip({level:1})).pipe(res);else stream.pipe(res);
  }catch{if(!res.headersSent){res.writeHead(404);res.end('Not found');}else res.destroy();}
});}
if(require.main===module){const port=Number(process.env.PORT)||4175,host=process.env.HOST||(process.env.RENDER?'0.0.0.0':'127.0.0.1'),server=createServer();server.listen(port,host,()=>console.log(`Need for Speed: Blacklisted: http://${host}:${server.address().port}`));server.on('error',e=>{console.error(e.message);process.exitCode=1;});}
module.exports={createServer,allowed};
