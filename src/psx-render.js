/* Fixed-resolution framebuffer, ordered dithering and a dirty yellow-green grade. */
window.BlacklinePSX=(()=>{
 function material(mat){
  mat.onBeforeCompile=s=>{
   s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
    vec2 psxGrid=vec2(400.0,300.0);
    gl_Position.xy=floor(gl_Position.xy/gl_Position.w*psxGrid+0.5)/psxGrid*gl_Position.w;`);
  };return mat;
 }
 function pipeline(renderer){
  const target=new THREE.WebGLRenderTarget(512,288,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true});
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const shader=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{screen:{value:target.texture},resolution:{value:new THREE.Vector2(512,288)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
   uniform sampler2D screen;uniform vec2 resolution;varying vec2 vUv;
   float bayer(vec2 p){vec2 a=mod(floor(p),2.);return mod(a.x+2.*a.y,4.);}
   void main(){
    vec3 c=texture2D(screen,vUv).rgb;
    c=pow(max(c,vec3(0.)),vec3(0.4545));
    float grey=dot(c,vec3(.299,.587,.114));c=mix(vec3(grey),c,.68);
    c=(c-.38)*1.16+.38;
    c*=vec3(1.06,1.00,.48);c+=vec3(.045,.035,-.015);
    vec2 p=floor(vUv*resolution);float d=(bayer(p)*4.+bayer(floor(p/2.)))/16.-.5;
    float grain=fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453)-.5;
    c=floor(clamp(c+(d*.5+grain*.16)/24.,0.,1.)*31.)/31.;
    float vignette=1.-.38*pow(length((vUv-.5)*vec2(1.,.8))*1.6,2.);
    c*=vignette*(.97+.03*mod(p.y,2.));gl_FragColor=vec4(c,1.);
   }`});
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),shader));
  return {resize(w,h){const width=Math.max(1,Math.min(800,Math.round(w*.625)));const height=Math.max(1,Math.round(width*h/w));target.setSize(width,height);shader.uniforms.resolution.value.set(width,height);},render(world,cam){renderer.setRenderTarget(target);renderer.render(world,cam);renderer.setRenderTarget(null);renderer.render(scene,camera);}};
 }
 return {material,pipeline};
})();
