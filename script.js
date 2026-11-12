import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9db0bb);
scene.fog = new THREE.Fog(0x9db0bb, 24, 95);
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 150);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game').prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xddeaff,0x80613f,2.0));
const sun = new THREE.DirectionalLight(0xffe0ad,2.1);
sun.position.set(-15,30,12); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);

const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});
const sand=mat(0xb69a70), wall=mat(0xc4ae88), dark=mat(0x45494a), metal=mat(0x30383c,.55), crateMat=mat(0x80613f), green=mat(0x56664d), red=mat(0x9b3d32);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(140,140),sand); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

function box(x,y,z,sx,sy,sz,material,cast=true){
 const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;scene.add(m);return m;
}
// Desert outpost walls and cover
box(0,2,-23,48,4,1.2,wall); box(-24,2,0,1.2,4,48,wall); box(24,2,0,1.2,4,48,wall);
box(-9,1.5,-10,8,3,8,wall); box(10,1.5,-12,9,3,7,wall);
box(-11,3.2,-10,8.5,.5,8.5,dark); box(10,3.2,-12,9.5,.5,7.5,dark);
for(let i=0;i<9;i++){box(-17+i*4,1.1,8,2.1,2.2,2.1,crateMat);box(-17+i*4,2.25,8,2.2,.12,2.2,dark,false)}
box(0,1.1,15,5,2.2,2.5,crateMat);box(15,1.1,3,3,2.2,3,crateMat);box(-17,1.1,-1,3,2.2,3,crateMat);
for(let i=0;i<7;i++){let x=(Math.random()-.5)*38,z=(Math.random()-.5)*35;if(Math.abs(x)<7&&Math.abs(z)<7)continue;box(x,.7,z,.35,1.4,.35,green);}
// simple distant buildings
for(let i=0;i<12;i++){const x=(i%4-1.5)*28,z=-38-Math.floor(i/4)*16;box(x,4,z,15,8,12,mat(0x9c8b75));}

// Player weapon view model
const weapon=new THREE.Group();camera.add(weapon);scene.add(camera);
const gunBody=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.75),metal);gunBody.position.set(.36,-.28,-.62);weapon.add(gunBody);
const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.62,12),dark);barrel.rotation.x=Math.PI/2;barrel.position.set(.36,-.22,-1.18);weapon.add(barrel);
const stock=new THREE.Mesh(new THREE.BoxGeometry(.18,.2,.35),crateMat);stock.position.set(.36,-.32,-.18);weapon.add(stock);
const sight=new THREE.Mesh(new THREE.BoxGeometry(.08,.09,.12),dark);sight.position.set(.36,-.12,-.65);weapon.add(sight);
const grip=new THREE.Mesh(new THREE.BoxGeometry(.12,.3,.15),dark);grip.position.set(.36,-.48,-.48);grip.rotation.x=-.2;weapon.add(grip);

// Enemy soldiers made from simple original 3D shapes
const enemies=[];
function soldier(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);
 const body=new THREE.Mesh(new THREE.BoxGeometry(.65,1,.38),red);body.position.y=1.05;g.add(body);
 const vest=new THREE.Mesh(new THREE.BoxGeometry(.7,.48,.42),green);vest.position.set(0,1.08,-.015);g.add(vest);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.23,12,10),mat(0xb98562));head.position.y=1.72;g.add(head);
 const helmet=new THREE.Mesh(new THREE.SphereGeometry(.25,12,8,0,Math.PI*2,0,Math.PI/2),green);helmet.position.y=1.82;g.add(helmet);
 for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.22,.65,.25),dark);leg.position.set(side*.18,.35,0);g.add(leg)}
 const arm1=new THREE.Mesh(new THREE.BoxGeometry(.2,.65,.22),red);arm1.position.set(-.42,1.05,0);arm1.rotation.z=-.2;g.add(arm1);
 const arm2=arm1.clone();arm2.position.x=.42;arm2.rotation.z=.2;g.add(arm2);
 const gun=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.65),metal);gun.position.set(.1,1.02,-.43);g.add(gun);
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.userData.enemyRoot=g}});
 scene.add(g);enemies.push({group:g,hp:100,alive:true,attack:Math.random()*2});
}
[[-5,-17],[6,-19],[17,-5],[-17,5],[5,17]].forEach(p=>soldier(...p));

const raycaster=new THREE.Raycaster();let yaw=0,pitch=0,health=100,ammo=30,kills=0,started=false,dead=false,moveX=0,moveY=0,velY=0,onGround=true,fireHeld=false,lastShot=0;
const el=id=>document.getElementById(id);
function hud(){el('health').textContent=health;el('healthfill').style.width=health+'%';el('ammo').innerHTML=ammo+' <small>/ ∞</small>';el('remaining').textContent=(enemies.length-kills)+' ENEMIES';el('score').textContent=kills+' : 0'}
function say(t){el('message').textContent=t;setTimeout(()=>{if(el('message').textContent===t)el('message').textContent=''},1400)}
function aim(){camera.rotation.set(pitch,yaw,0,'YXZ')}
function shoot(){
 if(!started||dead)return;
 const now=performance.now();if(now-lastShot<115)return;lastShot=now;
 if(ammo<=0){say('PRESS RELOAD');return}
 ammo--;hud();weapon.position.z=.06;setTimeout(()=>weapon.position.z=0,55);
 raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
 const targets=enemies.filter(e=>e.alive).flatMap(e=>e.group.children);
 const hits=raycaster.intersectObjects(targets,false);
 if(hits.length){const root=hits[0].object.userData.enemyRoot;const enemy=enemies.find(e=>e.group===root);if(enemy&&enemy.alive){enemy.hp-=50;el('hitmarker').style.display='block';setTimeout(()=>el('hitmarker').style.display='none',100);if(enemy.hp<=0){enemy.alive=false;enemy.group.visible=false;kills++;hud();say('HOSTILE ELIMINATED');if(kills===enemies.length)finish(true)}}}
}
function finish(win){dead=true;el('end-title').textContent=win?'MISSION COMPLETE':'MISSION FAILED';el('end-text').textContent=win?'All hostiles eliminated. Good work, soldier.':'Your soldier was eliminated. Try again.';el('end-screen').classList.remove('hidden')}
function reload(){if(!started||dead)return;ammo=30;hud();say('RELOADED')}
function start(){started=true;el('start-screen').classList.add('hidden');el('loading').style.display='none';camera.position.set(0,1.65,20);yaw=0;pitch=0;aim();say('ELIMINATE ALL HOSTILES')}
el('start').onclick=start;el('again').onclick=()=>location.reload();el('fire').addEventListener('pointerdown',e=>{e.preventDefault();fireHeld=true;shoot()});['pointerup','pointercancel','pointerleave'].forEach(ev=>el('fire').addEventListener(ev,()=>fireHeld=false));el('reload').onclick=reload;
el('jump').addEventListener('pointerdown',e=>{e.preventDefault();if(onGround&&started){velY=5.5;onGround=false}});
window.addEventListener('keydown',e=>{if(e.code==='Space'&&onGround){velY=5.5;onGround=false}if(e.code==='KeyR')reload();if(e.code==='KeyW')moveY=1;if(e.code==='KeyS')moveY=-1;if(e.code==='KeyA')moveX=-1;if(e.code==='KeyD')moveX=1;if(e.code==='Enter'&&!started)start()});
window.addEventListener('keyup',e=>{if(['KeyW','KeyS'].includes(e.code))moveY=0;if(['KeyA','KeyD'].includes(e.code))moveX=0});
let lookPointer=null,lastX=0,lastY=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(!started||e.clientX<innerWidth*.38)return;lookPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.004;pitch-=dy*.004;pitch=Math.max(-1.35,Math.min(1.35,pitch));aim()});
renderer.domElement.addEventListener('pointerup',e=>{if(e.pointerId===lookPointer)lookPointer=null});
const area=el('stick-area'),stick=el('stick');let stickId=null,center={x:0,y:0};
area.addEventListener('pointerdown',e=>{stickId=e.pointerId;area.setPointerCapture(stickId);const r=area.getBoundingClientRect();center={x:r.left+r.width/2,y:r.top+r.height/2};stickMove(e)});
area.addEventListener('pointermove',e=>{if(e.pointerId===stickId)stickMove(e)});
function stickMove(e){let dx=e.clientX-center.x,dy=e.clientY-center.y;const len=Math.hypot(dx,dy),max=38;if(len>max){dx=dx/len*max;dy=dy/len*max}stick.style.transform=`translate(${dx}px,${dy}px)`;moveX=dx/max;moveY=-dy/max}
function stickEnd(e){if(e.pointerId===stickId){stickId=null;moveX=moveY=0;stick.style.transform='translate(0,0)'}}
area.addEventListener('pointerup',stickEnd);area.addEventListener('pointercancel',stickEnd);
function update(dt){
 if(!started||dead)return;
 const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 const movement=forward.multiplyScalar(moveY).add(right.multiplyScalar(moveX));if(movement.length()>1)movement.normalize();
 camera.position.addScaledVector(movement,5*dt);
 camera.position.x=THREE.MathUtils.clamp(camera.position.x,-21,21);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-21,21);
 velY-=13*dt;camera.position.y+=velY*dt;if(camera.position.y<1.65){camera.position.y=1.65;velY=0;onGround=true}
 weapon.position.y=Math.sin(performance.now()*.009)*.008*(movement.length()>0?1:0);
 for(const e of enemies){if(!e.alive)continue;e.attack-=dt;const dx=camera.position.x-e.group.position.x,dz=camera.position.z-e.group.position.z,dist=Math.hypot(dx,dz);if(dist>5){e.group.position.x+=dx/dist*.65*dt;e.group.position.z+=dz/dist*.65*dt;e.group.rotation.y=Math.atan2(-dx,-dz)}else if(e.attack<=0){health=Math.max(0,health-5);e.attack=1.2;hud();if(health<=0)finish(false)}}
}
let previous=performance.now();function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-previous)/1000,.04);previous=now;if(fireHeld)shoot();update(dt);renderer.render(scene,camera)}requestAnimationFrame(loop);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
hud();el('loading').style.display='none';
