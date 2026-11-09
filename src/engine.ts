import * as THREE from 'three';
import {Body, Scale, solar, displayPosition} from './catalog';
import {FlightControls} from './controls';
function softPoints(parameters:THREE.PointsMaterialParameters){
  const material=new THREE.PointsMaterial(parameters);
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    float pointRadius=length(gl_PointCoord-vec2(0.5));
    if(pointRadius>0.5)discard;
    diffuseColor.a*=1.0-smoothstep(0.12,0.5,pointRadius);`);};
  return material;
}
const globeVertex = `varying vec3 vNormal;varying vec3 vLocal;varying vec3 vWorld;varying vec2 vUv;void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vLocal=position;vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const globeFragment = `uniform vec3 uColor;uniform float uEarth;uniform float uGas;uniform float uTime;uniform sampler2D uEarthTexture;uniform float uEarthReady;varying vec2 vUv;varying vec3 vNormal;varying vec3 vLocal;varying vec3 vWorld;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
void main(){vec3 p=normalize(vLocal);float n=noise(p*4.)*.6+noise(p*9.)*.25+noise(p*23.)*.15;vec3 col=uColor*(.72+n*.5);if(uGas>.5)col=uColor*(.65+.4*sin(p.y*35.+noise(p*9.)*4.));if(uEarth>.5){float land=smoothstep(.49,.54,n);col=mix(vec3(.018,.12,.26),mix(vec3(.1,.27,.19),vec3(.46,.42,.22),noise(p*12.)),land);col=mix(col,vec3(.84,.91,.92),smoothstep(.83,.96,abs(p.y)));col=mix(col,texture2D(uEarthTexture,vUv).rgb,uEarthReady);float clouds=smoothstep(.58,.73,noise(p*8.+vec3(uTime*.005,0.,0.))*.7+noise(p*22.)*.3);col=mix(col,vec3(.95),clouds*.3);}float light=max(dot(normalize(vNormal),normalize(vec3(-.65,.45,1.))),0.);col*=.06+light*.94;float rim=pow(1.-max(vNormal.z,0.),3.5);col+=vec3(.15,.45,.63)*rim*uEarth*.55;gl_FragColor=vec4(col,1.);}`;
export interface EngineCallbacks {onSelect:(b:Body)=>void;onFrame:(fps:number)=>void;onAction:(a:string)=>void;onLock:(locked:boolean)=>void}
export class UniverseEngine {
  renderer:THREE.WebGLRenderer;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(55,1,.01,30000);controls:FlightControls;
  scale:Scale='solar'; selected:Body=solar[3];labels=true;darkMatter=false;paused=false;
  private world=new THREE.Group();private backdrop=new THREE.Group();private matter=new THREE.Group();private selection=new THREE.Group();
  private pickables:THREE.Object3D[]=[];private starPoints:THREE.Points|undefined;private starBodies:Body[]=[];
  private earthTexture=new THREE.Texture();private earthReady=false;
  private bodies:Body[]=[];private clock=new THREE.Clock();private frameId=0;private time=0;private frames=0;private elapsed=0;
  private labelElements:{body:Body;el:HTMLDivElement}[]=[];
  private travel:{from:THREE.Vector3;to:THREE.Vector3;target:THREE.Vector3;elapsed:number}|undefined;
  private raycaster=new THREE.Raycaster();private reticle=new THREE.Vector2();private labelRoot:HTMLDivElement;
  constructor(private host:HTMLElement,private cb:EngineCallbacks){
    this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor('#04070d');this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('aria-label','Interactive 3D universe. Click to look around; use WASD to fly.');
    this.earthTexture=new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}textures/earth-daymap.jpg`,()=>{
      this.earthReady=true;this.world.traverse(o=>{if(o instanceof THREE.Mesh&&o.material instanceof THREE.ShaderMaterial)o.material.uniforms.uEarthReady.value=1;});
    });this.earthTexture.colorSpace=THREE.SRGBColorSpace;
    host.append(this.renderer.domElement);this.labelRoot=document.createElement('div');this.labelRoot.className='world-labels';host.append(this.labelRoot);
    this.controls=new FlightControls(this.camera,this.renderer.domElement);this.controls.onAction=a=>a==='release'?this.controls.release():this.cb.onAction(a);this.controls.onLock=cb.onLock;
    this.scene.add(this.world,this.backdrop,this.matter,this.selection);
    this.createBackdrop();this.createMatter();this.resize();window.addEventListener('resize',()=>this.resize());
    this.renderer.domElement.addEventListener('dblclick',()=>this.pick());
    this.camera.position.set(18,14,24);this.controls.lookAt(new THREE.Vector3(0,0,0));
    this.animate();
  }
  private random(seed:number){let n=seed;return ()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
  private createBackdrop(){
    const rand=this.random(82),positions=[],colors=[];
    for(let i=0;i<11000;i++){
      const a=rand()*Math.PI*2,y=rand()*2-1,r=Math.sqrt(1-y*y),d=4200;
      positions.push(Math.cos(a)*r*d,y*d,Math.sin(a)*r*d);
      const c=new THREE.Color().setHSL(.52+rand()*.16,.1+rand()*.3,.3+rand()*.6);colors.push(c.r,c.g,c.b);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const p=new THREE.Points(g,softPoints({size:1.7,vertexColors:true,sizeAttenuation:false,transparent:true,opacity:.75}));p.frustumCulled=false;this.backdrop.add(p);
    // A subtle procedural Milky Way band. Decorative, not a catalog of individual stars.
    const gp=[],gc=[];
    for(let i=0;i<19000;i++){
      const a=rand()*Math.PI*2, width=(rand()+rand()+rand()-1.5)*.16;
      const v=new THREE.Vector3(Math.cos(a)*Math.cos(width),Math.sin(width),Math.sin(a)*Math.cos(width)).applyAxisAngle(new THREE.Vector3(0,0,1),.52).multiplyScalar(3900);
      gp.push(v.x,v.y,v.z);const c=new THREE.Color().setHSL(.61+rand()*.09,.22,.14+rand()*.16);gc.push(c.r,c.g,c.b);
    }
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));gg.setAttribute('color',new THREE.Float32BufferAttribute(gc,3));
    this.backdrop.add(new THREE.Points(gg,softPoints({size:2,vertexColors:true,sizeAttenuation:false,transparent:true,opacity:.36,blending:THREE.AdditiveBlending,depthWrite:false})));
  }
  private createMatter(){
    const rand=this.random(178),pos=[];
    for(let arm=0;arm<14;arm++){
      const direction=new THREE.Vector3(rand()-.5,rand()-.5,rand()-.5).normalize();
      for(let i=0;i<650;i++){
        const t=(rand()-.5)*1700;const v=direction.clone().multiplyScalar(t);
        v.x+=Math.sin(t*.011+arm)*35+(rand()-.5)*40;v.y+=Math.cos(t*.008+arm)*40+(rand()-.5)*40;v.z+=Math.sin(t*.009)*40+(rand()-.5)*40;pos.push(v.x,v.y,v.z);
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    this.matter.add(new THREE.Points(g,softPoints({color:'#7f72cf',size:3,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false})));this.matter.visible=false;
  }
  private dispose(group:THREE.Group){group.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line||o instanceof THREE.Points){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});group.clear();}
  setCatalog(bodies:Body[]){this.bodies=bodies;this.setScale(this.scale);}
  setScale(scale:Scale){
    this.scale=scale;this.dispose(this.world);this.pickables=[];this.starBodies=[];this.starPoints=undefined;this.labelRoot.replaceChildren();this.labelElements=[];
    if(scale==='solar')this.buildSolar();else this.buildAtlas();
    this.updateSelection();
  }
  private addLabel(b:Body){const el=document.createElement('div');el.className='world-label';el.textContent=b.name;el.dataset.id=b.id;el.addEventListener('click',e=>{e.stopPropagation();this.cb.onSelect(b);});this.labelRoot.append(el);this.labelElements.push({body:b,el});}
  private buildSolar(){
    for(const b of solar){
      const r=this.bodyRadius(b),g=new THREE.SphereGeometry(r,56,40);
      const mat=b.id==='sun'?new THREE.MeshBasicMaterial({color:'#ffe4a3'}):new THREE.ShaderMaterial({vertexShader:globeVertex,fragmentShader:globeFragment,uniforms:{uColor:{value:new THREE.Color(b.color)},uEarth:{value:b.id==='earth'?1:0},uGas:{value:['jupiter','saturn','uranus','neptune'].includes(b.id)?1:0},uTime:{value:0},uEarthTexture:{value:this.earthTexture},uEarthReady:{value:this.earthReady?1:0}}});
      const mesh=new THREE.Mesh(g,mat);mesh.position.fromArray(displayPosition(b,'solar'));mesh.userData.body=b;this.world.add(mesh);this.pickables.push(mesh);this.addLabel(b);
      if(b.id==='sun'){
        const glow=new THREE.Mesh(new THREE.SphereGeometry(r*1.22,32,24),new THREE.MeshBasicMaterial({color:'#ffbb66',transparent:true,opacity:.1,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));mesh.add(glow);
      }
      if(b.au){const points=[];for(let i=0;i<=256;i++){const a=i/256*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*b.au*8,0,Math.sin(a)*b.au*8));}
        this.world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#668595',transparent:true,opacity:.17})));}
      if(b.id==='saturn'){
        const ring=new THREE.Mesh(new THREE.RingGeometry(r*1.35,r*2.3,96),new THREE.MeshBasicMaterial({color:'#d8c5a1',transparent:true,opacity:.55,side:THREE.DoubleSide}));ring.rotation.x=Math.PI/2-.35;mesh.add(ring);
      }
      if(b.id==='earth'){
        const ring=new THREE.Mesh(new THREE.RingGeometry(r*1.16,r*1.18,80),new THREE.MeshBasicMaterial({color:'#8fe9dc',transparent:true,opacity:.75,side:THREE.DoubleSide}));ring.rotation.x=Math.PI/2;mesh.add(ring);
      }
    }
  }
  private buildAtlas(){
    const pos:number[]=[],colors:number[]=[];
    const candidates=this.bodies.filter(b=>b.kind==='Star' && b.scale==='stellar');
    for(const b of candidates){
      const p=displayPosition(b,this.scale);pos.push(...p);const c=new THREE.Color(b.color);colors.push(c.r,c.g,c.b);this.starBodies.push(b);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    this.starPoints=new THREE.Points(g,softPoints({size:this.scale==='stellar'?2:1,vertexColors:true,sizeAttenuation:false,transparent:true,opacity:this.scale==='stellar'?.8:.18}));this.world.add(this.starPoints);
    const ep:number[]=[];for(const b of this.bodies)if(b.kind==='Planet'&&b.host)ep.push(...displayPosition(b,this.scale));
    const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.Float32BufferAttribute(ep,3));this.world.add(new THREE.Points(eg,softPoints({color:'#81d9c3',size:1.8,sizeAttenuation:false,transparent:true,opacity:.35})));
    for(const b of this.bodies.filter(b=>b.kind==='Galaxy'||b.kind==='Black hole')){
      if(this.scale==='stellar'&&b.scale==='cosmic')continue;
      const group=new THREE.Group();group.position.fromArray(displayPosition(b,this.scale));this.world.add(group);
      if(b.kind==='Black hole'){
        const hole=new THREE.Mesh(new THREE.SphereGeometry(1.25,32,24),new THREE.MeshBasicMaterial({color:'#000000'}));hole.userData.body=b;group.add(hole);this.pickables.push(hole);
        const disk=new THREE.Mesh(new THREE.RingGeometry(1.6,4.1,80),new THREE.MeshBasicMaterial({color:'#ffad68',side:THREE.DoubleSide,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));disk.rotation.x=-.9;group.add(disk);
        const edge=new THREE.Mesh(new THREE.TorusGeometry(1.4,.065,8,96),new THREE.MeshBasicMaterial({color:'#ffdc9b'}));group.add(edge);
      }else{
        const rand=this.random(b.name.length*35),gp=[],gc=[];
        for(let i=0;i<2200;i++){
          const radius=Math.pow(rand(),.65)*12,arm=i%3,angle=radius*.6+arm*Math.PI*2/3+(rand()-.5)*.8;
          gp.push(Math.cos(angle)*radius,(rand()-.5)*(.8+2*(1-radius/12)),Math.sin(angle)*radius*.65);
          const c=new THREE.Color(b.color).multiplyScalar(.4+rand()*.6);gc.push(c.r,c.g,c.b);
        }
        const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));gg.setAttribute('color',new THREE.Float32BufferAttribute(gc,3));group.add(new THREE.Points(gg,softPoints({size:1.5,vertexColors:true,sizeAttenuation:false,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})));
        const center=new THREE.Mesh(new THREE.SphereGeometry(.9,16,12),new THREE.MeshBasicMaterial({color:b.color}));center.userData.body=b;group.add(center);this.pickables.push(center);
        group.rotation.z=.4;group.rotation.x=.3;
      }
      this.addLabel(b);
    }
    const home=new THREE.Mesh(new THREE.SphereGeometry(.65,20,16),new THREE.MeshBasicMaterial({color:'#8fdfcf'}));home.userData.body=solar[3];this.world.add(home);this.pickables.push(home);this.addLabel({...solar[3],name:'Solar System · Home'});
    if(this.scale==='stellar')for(const b of candidates.filter(b=>Math.hypot(...b.position)<18&&b.magnitude!<9).slice(0,18))this.addLabel(b);
  }
  bodyRadius(b:Body){return b.id==='sun'?2:b.kind==='Planet'&&b.au? .32+Math.sqrt((b.radius||6371)/6371)*.33:b.kind==='Galaxy'?12:b.kind==='Black hole'?4:.7;}
  focus(b:Body,instant=false){
    this.selected=b;
    const desired:Scale=b.scale;
    if(this.scale!==desired)this.setScale(desired);
    this.updateSelection();const target=new THREE.Vector3().fromArray(displayPosition(b,this.scale));
    const r=this.bodyRadius(b);const offset=new THREE.Vector3(r*2.6,r*1.15,r*3.5);const to=target.clone().add(offset);
    if(instant||window.matchMedia('(prefers-reduced-motion: reduce)').matches){this.camera.position.copy(to);this.controls.lookAt(target);this.travel=undefined;}
    else this.travel={from:this.camera.position.clone(),to,target,elapsed:0};
  }
  overview(){this.travel=undefined;this.camera.position.set(...(this.scale==='solar'?[90,115,160]:this.scale==='stellar'?[200,180,350]:[250,250,430]) as [number,number,number]);this.controls.lookAt(new THREE.Vector3());}
  select(b:Body){this.selected=b;this.updateSelection();}
  private updateSelection(){
    this.dispose(this.selection);const b=this.selected;
    if(this.scale==='solar'&&b.scale!=='solar')return;
    const target=new THREE.Vector3().fromArray(displayPosition(b,this.scale)),r=this.bodyRadius(b)*1.5;
    const ring=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:80},(_,i)=>new THREE.Vector3(Math.cos(i/80*Math.PI*2)*r,Math.sin(i/80*Math.PI*2)*r,0))),new THREE.LineBasicMaterial({color:'#99f1df',transparent:true,opacity:.6}));ring.position.copy(target);this.selection.add(ring);
    if(!this.labelElements.some(l=>l.body.id===b.id))this.addLabel(b);
  }
  pick(){
    this.raycaster.setFromCamera(this.reticle,this.camera);this.raycaster.params.Points!.threshold=.9;
    const objects=this.raycaster.intersectObjects(this.pickables,false);if(objects[0]){this.cb.onSelect(objects[0].object.userData.body);return;}
    if(this.starPoints){const hit=this.raycaster.intersectObject(this.starPoints)[0];if(hit&&hit.index!==undefined)this.cb.onSelect(this.starBodies[hit.index]);}
  }
  setQuality(high:boolean){this.renderer.setPixelRatio(Math.min(devicePixelRatio,high?2:1));this.resize();}
  resize(){const {clientWidth:w,clientHeight:h}=this.host;this.camera.aspect=w/Math.max(h,1);this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
  private animate=()=>{
    this.frameId=requestAnimationFrame(this.animate);const dt=Math.min(this.clock.getDelta(),.05);this.time+=dt;
    const typing=document.activeElement instanceof HTMLInputElement||document.activeElement instanceof HTMLSelectElement;
    this.controls.enabled=!this.paused&&!typing;
    this.controls.update(dt);
    if(this.travel&&!this.paused){
      // Any deliberate flight input cancels cinematic travel.
      if(this.controls.keys.size||this.controls.moving)this.travel=undefined;
      else {this.travel.elapsed+=dt;const t=Math.min(this.travel.elapsed/1.6,1),ease=t*t*(3-2*t);this.camera.position.lerpVectors(this.travel.from,this.travel.to,ease);this.controls.lookAt(this.travel.target);if(t===1)this.travel=undefined;}
    }
    this.backdrop.position.copy(this.camera.position);this.matter.visible=this.darkMatter;
    this.world.traverse(o=>{if(o instanceof THREE.Mesh&&o.material instanceof THREE.ShaderMaterial)o.material.uniforms.uTime.value=this.time;});
    for(const ring of this.selection.children)ring.quaternion.copy(this.camera.quaternion);
    for(const l of this.labelElements){
      const p=new THREE.Vector3().fromArray(displayPosition(l.body,this.scale));p.y+=this.bodyRadius(l.body)*1.5;
      const view=p.clone().applyMatrix4(this.camera.matrixWorldInverse);p.project(this.camera);
      const visible=this.labels&&view.z<0&&p.z<1&&Math.abs(p.x)<.95&&Math.abs(p.y)<.95;
      l.el.hidden=!visible;if(visible){l.el.style.transform=`translate(${(p.x*.5+.5)*this.host.clientWidth}px,${(-p.y*.5+.5)*this.host.clientHeight}px)`;l.el.classList.toggle('selected',l.body.id===this.selected.id);}
    }
    this.renderer.render(this.scene,this.camera);this.frames++;this.elapsed+=dt;if(this.elapsed>.7){this.cb.onFrame(Math.round(this.frames/this.elapsed));this.frames=0;this.elapsed=0;}
  };
  disposeAll(){cancelAnimationFrame(this.frameId);this.dispose(this.world);this.dispose(this.backdrop);this.dispose(this.selection);this.dispose(this.matter);this.renderer.dispose();this.earthTexture.dispose();}
}
