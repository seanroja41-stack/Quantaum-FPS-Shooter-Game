

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 30, 100);

const camera = new THREE.PerspectiveCamera(
  80, innerWidth / innerHeight, 0.1, 300
);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(10, 20, 10);
scene.add(sun);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x556644 })
);

ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Player
const player = new THREE.Group();
scene.add(player);

const body = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 1.3, 0.5),
  new THREE.MeshStandardMaterial({ color: 0x2244aa })
);

body.position.y = 1.3;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xd8a477 })
);

head.position.y = 2.2;
player.add(head);

// Weapon
const gun = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 0.18, 1),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);

gun.position.set(0.5, 1.5, -0.6);
player.add(gun);

// Enemies
const enemies = [];

function spawnEnemy(x, z) {
  const enemy = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0xcc2222 })
  );

  enemy.position.set(x, 1, z);
  scene.add(enemy);
  enemies.push(enemy);
}

for (let i = 0; i < 8; i++) {
  spawnEnemy(
    Math.random() * 30 - 15,
    -10 - Math.random() * 30
  );
}

// Controls
let moveX = 0;
let moveY = 0;
let yaw = 0;
let score = 0;
let jumping = false;
let velocityY = 0;
let playerY = 0;

const stick = document.getElementById("stick");
const knob = document.getElementById("knob");

stick.addEventListener("pointerdown", e => {
  stick.setPointerCapture(e.pointerId);
  moveJoystick(e);
});

stick.addEventListener("pointermove", e => {
  if (stick.hasPointerCapture(e.pointerId)) {
    moveJoystick(e);
  }
});

function moveJoystick(e) {
  const rect = stick.getBoundingClientRect();

  let x = e.clientX - rect.left - 55;
  let y = e.clientY - rect.top - 55;

  const length = Math.hypot(x, y);

  if (length > 40) {
    x *= 40 / length;
    y *= 40 / length;
  }

  knob.style.left = 32 + x + "px";
  knob.style.top = 32 + y + "px";

  moveX = x / 40;
  moveY = y / 40;
}

function resetJoystick() {
  moveX = 0;
  moveY = 0;

  knob.style.left = "32px";
  knob.style.top = "32px";
}

stick.addEventListener("pointerup", resetJoystick);
stick.addEventListener("pointercancel", resetJoystick);

// Jump
document.getElementById("jump").onclick = () => {
  if (!jumping) {
    jumping = true;
    velocityY = 0.18;
  }
};

// Shooting
document.getElementById("shoot").onclick = () => {
  const origin = player.position.clone();
  origin.y += 1.5;

  const direction = new THREE.Vector3(
    -Math.sin(yaw), 0, -Math.cos(yaw)
  );

  let closest = null;
  let distance = 100;

  for (const enemy of enemies) {
    const toEnemy = enemy.position.clone().sub(origin);
    const along = toEnemy.dot(direction);

    if (along > 0) {
      const side = toEnemy.clone()
        .sub(direction.clone().multiplyScalar(along))
        .length();

      if (side < 1.5 && along < distance) {
        closest = enemy;
        distance = along;
      }
    }
  }

  if (closest) {
    scene.remove(closest);
    enemies.splice(enemies.indexOf(closest), 1);

    score++;

    document.getElementById("score").textContent =
      "Enemies: " + score;

    spawnEnemy(
      Math.random() * 40 - 20,
      -20 - Math.random() * 20
    );
  }
};

// Keyboard
const keys = {};

addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});

addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// Game loop
function animate() {
  requestAnimationFrame(animate);

  let forward = moveY;
  let side = moveX;

  if (keys["w"]) forward = -1;
  if (keys["s"]) forward = 1;
  if (keys["a"]) side = -1;
  if (keys["d"]) side = 1;

  player.position.x +=
    (Math.cos(yaw) * side - Math.sin(yaw) * forward) * 0.12;

  player.position.z +=
    (Math.sin(yaw) * side + Math.cos(yaw) * forward) * 0.12;

  if (keys["arrowleft"]) yaw += 0.03;
  if (keys["arrowright"]) yaw -= 0.03;

  player.rotation.y = yaw;

  if (jumping) {
    playerY += velocityY;
    velocityY -= 0.009;

    if (playerY <= 0) {
      playerY = 0;
      jumping = false;
    }
  }

  player.position.y = playerY;

  // Third-person camera
  const target = new THREE.Vector3(
    player.position.x + Math.sin(yaw) * 5,
    player.position.y + 4,
    player.position.z + Math.cos(yaw) * 5
  );

  camera.position.lerp(target, 0.1);

  camera.lookAt(
    player.position.x,
    player.position.y + 1.5,
    player.position.z
  );

  renderer.render(scene, camera);
}

animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
  
