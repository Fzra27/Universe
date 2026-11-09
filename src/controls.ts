import * as THREE from 'three';
export const deadzone = (v:number, threshold=.16) => Math.abs(v)<threshold?0:Math.sign(v)*(Math.abs(v)-threshold)/(1-threshold);
export class FlightControls {
  yaw=0; pitch=0; speed=3; enabled=true; moving=false; keys=new Set<string>(); locked=false; gamepadName='';
  private euler=new THREE.Euler(0,0,0,'YXZ'); private direction=new THREE.Vector3();
  private priorButtons:boolean[]=[];
  onAction: (action:string)=>void=()=>{};
  onLock: (locked:boolean)=>void=()=>{};
  constructor(private camera:THREE.PerspectiveCamera,private canvas:HTMLCanvasElement){
    window.addEventListener('keydown', e=>{
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement;
      if(typing || !this.enabled)return;
      if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
      this.keys.add(e.code);
      if(!e.repeat && e.code==='KeyH')this.onAction('home');
      if(!e.repeat && e.code==='KeyF')this.onAction('focus');
      if(!e.repeat && e.code==='KeyC')this.onAction('catalog');
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>this.keys.clear());
    document.addEventListener('visibilitychange',()=>this.keys.clear());
    document.addEventListener('pointerlockchange',()=>{this.locked=document.pointerLockElement===canvas;this.keys.clear();this.onLock(this.locked);});
    document.addEventListener('mousemove',e=>{if(!this.locked||!this.enabled)return;this.yaw-=e.movementX*.002;this.pitch-=e.movementY*.002;this.pitch=THREE.MathUtils.clamp(this.pitch,-1.55,1.55);});
    canvas.addEventListener('click',()=>{if(this.enabled&&!this.locked) this.capture();});
  }
  capture(){this.canvas.requestPointerLock()?.catch(()=>this.onAction('lock-failed'));}
  release(){if(this.locked)document.exitPointerLock();this.keys.clear();}
  lookAt(target:THREE.Vector3){this.camera.lookAt(target);this.euler.setFromQuaternion(this.camera.quaternion,'YXZ');this.yaw=this.euler.y;this.pitch=this.euler.x;}
  update(dt:number){
    const pads=navigator.getGamepads?.()||[];
    const pad=Array.from(pads).find(p=>p?.connected&&p.mapping==='standard');
    this.gamepadName=pad?pad.id:'';this.moving=false;
    // The menu button must still work while a menu has paused flight.
    if(pad?.buttons[9]?.pressed&&!this.priorButtons[9])this.onAction('catalog');
    if(!this.enabled){this.keys.clear();this.priorButtons=pad?pad.buttons.map(b=>b.pressed):[];return;}
    let x=0,y=0,z=0,boost=this.keys.has('ShiftLeft')||this.keys.has('ShiftRight');
    if(this.keys.has('KeyW'))z-=1;if(this.keys.has('KeyS'))z+=1;
    if(this.keys.has('KeyA'))x-=1;if(this.keys.has('KeyD'))x+=1;
    if(this.keys.has('Space'))y+=1;if(this.keys.has('ControlLeft')||this.keys.has('KeyQ'))y-=1;
    if(pad){
      x+=deadzone(pad.axes[0]||0);z+=deadzone(pad.axes[1]||0);
      this.yaw-=deadzone(pad.axes[2]||0)*dt*1.6;this.pitch-=deadzone(pad.axes[3]||0)*dt*1.6;
      y+=(pad.buttons[7]?.value||0)-(pad.buttons[6]?.value||0);boost ||=!!pad.buttons[4]?.pressed;
      for(const [index,action] of [[0,'focus'],[1,'release'],[2,'home'],[3,'next']] as const){if(pad.buttons[index]?.pressed&&!this.priorButtons[index])this.onAction(action);}
      this.priorButtons=pad.buttons.map(b=>b.pressed);
    }else this.priorButtons=[];
    this.moving=!!(x||y||z||(pad&&(deadzone(pad.axes[2]||0)||deadzone(pad.axes[3]||0))));
    this.pitch=THREE.MathUtils.clamp(this.pitch,-1.55,1.55);
    this.euler.set(this.pitch,this.yaw,0);this.camera.quaternion.setFromEuler(this.euler);
    this.direction.set(x,y,z);if(this.direction.lengthSq()>1)this.direction.normalize();
    this.direction.applyQuaternion(this.camera.quaternion);
    this.camera.position.addScaledVector(this.direction,dt*this.speed*(boost?8:1));
    // Avoid floating-point overflow after unattended flight.
    this.camera.position.clampLength(0,100000);
  }
}
