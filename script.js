import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 100);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 2, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(10, 20, 10);
scene.add(sun);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x555555 }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Simple distant buildings
for (let i = 0; i < 20; i++) {
  const h = 5 + Math.random() * 10;
  const building = new THREE.Mesh(new THREE.BoxGeometry(5, h, 5),
    new THREE.MeshStandardMaterial({ color: 0x777777 }));
  building.position.set(Math.random() * 60 - 30, h / 2, -Math.random() * 60 - 10);
  scene.add(building);
}

const targets = [];
function createTarget() {
  const target = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshStandardMaterial({ color: 0xff2222 }));
  target.position.set(Math.random() * 20 - 10, 2, -Math.random() * 30 - 10);
  scene.add(target);
  targets.push(target);
}
for (let i = 0; i < 8; i++) createTarget();

const raycaster = new THREE.Raycaster();
const scoreText = document.getElementById("score");
const message = document.getElementById("message");
let score = 0, gameStarted = false, yaw = 0, pitch = 0;

function shoot() {
  if (!gameStarted) return;
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(targets);
  if (hits.length) {
    const target = hits[0].object;
    scene.remove(target);
    targets.splice(targets.indexOf(target), 1);
    score++;
    scoreText.textContent = score;
    createTarget();
    message.textContent = "TARGET HIT!";
  } else {
    message.textContent = "MISSED!";
  }
}
document.getElementById("shootBtn").addEventListener("click", shoot);

document.getElementById("startBtn").addEventListener("click", () => {
  gameStarted = true;
  document.getElementById("startBtn").style.display = "none";
  message.textContent = "Shoot the red targets!";
});

renderer.domElement.addEventListener("click", () => {
  if (gameStarted && innerWidth >= 800) renderer.domElement.requestPointerLock?.();
});
document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === renderer.domElement) {
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-1.4, Math.min(1.4, pitch));
  }
});

let touchX = 0, touchY = 0;
renderer.domElement.addEventListener("touchstart", e => {
  touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
}, { passive:true });
renderer.domElement.addEventListener("touchmove", e => {
  const x = e.touches[0].clientX, y = e.touches[0].clientY;
  yaw -= (x - touchX) * 0.005;
  pitch -= (y - touchY) * 0.005;
  pitch = Math.max(-1.4, Math.min(1.4, pitch));
  touchX = x; touchY = y;
}, { passive:true });

const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function animate() {
  requestAnimationFrame(animate);
  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
  if (gameStarted) {
    if (keys.w) camera.translateZ(-0.15);
    if (keys.s) camera.translateZ(0.15);
    if (keys.a) camera.translateX(-0.15);
    if (keys.d) camera.translateX(0.15);
    camera.position.y = 2;
  }
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
