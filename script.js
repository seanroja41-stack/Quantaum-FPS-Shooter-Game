// =====================================
// QUANTAUM: TACTICAL ASSAULT
// =====================================

const errorBox = document.getElementById("error");

if (typeof THREE === "undefined") {
    errorBox.style.display = "block";
    errorBox.textContent =
        "Three.js could not load. Check your internet connection and reload.";
    throw new Error("Three.js failed to load.");
}

let scene, camera, renderer;
let player, rifle, muzzleFlash;
let enemies = [];
let enemyMeshes = [];

let health = 100;
let kills = 0;

let cameraYaw = 0;
let cameraPitch = 0.18;

let moveX = 0;
let moveY = 0;

let isRunning = false;
let isJumping = false;
let jumpVelocity = 0;
let isFiring = false;

let lastShot = 0;
let recoil = 0;

const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

const game = document.getElementById("game");

// =====================================
// INITIALIZE GAME
// =====================================

try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x879ba5);
    scene.fog = new THREE.Fog(0x879ba5, 35, 110);

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        200
    );

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.5)
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    game.prepend(renderer.domElement);

    createLighting();
    createMap();
    createSoldier();
    createEnemies();
    setupControls();

    animate();

} catch (error) {
    errorBox.style.display = "block";
    errorBox.textContent = "Game error: " + error.message;
    console.error(error);
}

// =====================================
// LIGHTING
// =====================================

function createLighting() {
    const ambient = new THREE.HemisphereLight(
        0xffffff,
        0x38432d,
        1.5
    );

    scene.add(ambient);

    const sunlight = new THREE.DirectionalLight(
        0xffffff,
        1.5
    );

    sunlight.position.set(15, 25, 10);
    sunlight.castShadow = true;

    scene.add(sunlight);
}

// =====================================
// MAP
// =====================================

function createMap() {
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(150, 150),
        new THREE.MeshStandardMaterial({
            color: 0x52634b,
            roughness: 1
        })
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(
        150, 60, 0x40513b, 0x65745b
    );

    grid.position.y = 0.01;
    scene.add(grid);

    const buildingMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x626a6c,
            roughness: 1
        });

    for (let i = 0; i < 14; i++) {
        const width = 4 + Math.random() * 5;
        const height = 3 + Math.random() * 5;
        const depth = 4 + Math.random() * 5;

        const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            buildingMaterial
        );

        const side = i % 2 === 0 ? -1 : 1;

        building.position.set(
            side * (8 + Math.random() * 25),
            height / 2,
            -15 + Math.random() * 45
        );

        building.castShadow = true;
        building.receiveShadow = true;

        scene.add(building);
    }
}

// =====================================
// SOLDIER MATERIALS
// =====================================

const uniformMat = new THREE.MeshStandardMaterial({
    color: 0x394a31,
    roughness: 1
});

const darkMat = new THREE.MeshStandardMaterial({
    color: 0x202820,
    roughness: 1
});

const helmetMat = new THREE.MeshStandardMaterial({
    color: 0x263626,
    roughness: 0.9
});

const skinMat = new THREE.MeshStandardMaterial({
    color: 0xc99572,
    roughness: 1
});

const bootMat = new THREE.MeshStandardMaterial({
    color: 0x171a16,
    roughness: 1
});

const metalMat = new THREE.MeshStandardMaterial({
    color: 0x252a2d,
    metalness: 0.65,
    roughness: 0.4
});

// =====================================
// SOLDIER PART CREATOR
// =====================================

function soldierBox(
    parent,
    width,
    height,
    depth,
    material,
    x,
    y,
    z
) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);
    return mesh;
}

// =====================================
// CREATE PLAYER CHARACTER
// =====================================

function createSoldier() {
    player = new THREE.Group();

    scene.add(player);

    // BODY
    soldierBox(
        player, 0.65, 0.85, 0.38,
        uniformMat, 0, 1.45, 0
    );

    // TACTICAL VEST
    soldierBox(
        player, 0.70, 0.55, 0.42,
        darkMat, 0, 1.48, -0.025
    );

    // VEST POCKETS
    for (let i = -1; i <= 1; i++) {
        soldierBox(
            player, 0.15, 0.18, 0.06,
            uniformMat, i * 0.19, 1.45, -0.25
        );
    }

    // HEAD
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.23, 16, 12),
        skinMat
    );

    head.position.set(0, 2.08, 0);
    head.castShadow = true;
    player.add(head);

    // HELMET
    const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.265, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2
        ),
        helmetMat
    );

    helmet.position.set(0, 2.21, 0);
    helmet.castShadow = true;
    player.add(helmet);

    // HELMET FRONT BRIM
    soldierBox(
        player, 0.48, 0.055, 0.20,
        helmetMat, 0, 2.16, -0.12
    );

    // ARMS
    soldierBox(
        player, 0.21, 0.70, 0.23,
        uniformMat, -0.45, 1.47, -0.12
    );

    soldierBox(
        player, 0.21, 0.70, 0.23,
        uniformMat, 0.45, 1.47, -0.12
    );

    // HANDS
    soldierBox(
        player, 0.18, 0.18, 0.18,
        skinMat, -0.45, 1.08, -0.28
    );

    soldierBox(
        player, 0.18, 0.18, 0.18,
        skinMat, 0.45, 1.08, -0.28
    );

    // LEGS
    soldierBox(
        player, 0.25, 0.72, 0.29,
        uniformMat, -0.19, 0.55, 0
    );

    soldierBox(
        player, 0.25, 0.72, 0.29,
        uniformMat, 0.19, 0.55, 0
    );

    // BOOTS
    soldierBox(
        player, 0.29, 0.18, 0.42,
        bootMat, -0.19, 0.09, -0.06
    );

    soldierBox(
        player, 0.29, 0.18, 0.42,
        bootMat, 0.19, 0.09, -0.06
    );

    // BACKPACK
    soldierBox(
        player, 0.48, 0.55, 0.20,
        darkMat, 0, 1.55, 0.28
    );

    // CREATE RIFLE
    createRifle();

    player.position.set(0, 0, 5);
}

// =====================================
// 3D RIFLE
// =====================================

function createRifle() {
    rifle = new THREE.Group();

    // Main rifle body
    soldierBox(
        rifle, 0.16, 0.17, 0.85,
        metalMat, 0, 0, -0.35
    );

    // Long barrel
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.035, 0.035, 0.85, 10
        ),
        metalMat
    );

    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -1.05);
    rifle.add(barrel);

    // Muzzle
    soldierBox(
        rifle, 0.12, 0.12, 0.15,
        darkMat, 0, 0.02, -1.48
    );

    // Magazine
    soldierBox(
        rifle, 0.15, 0.38, 0.20,
        darkMat, 0, -0.24, -0.30
    );

    // Stock
    soldierBox(
        rifle, 0.16, 0.18, 0.40,
        darkMat, 0, 0.02, 0.27
    );

    // Grip
    soldierBox(
        rifle, 0.12, 0.28, 0.15,
        darkMat, 0, -0.19, 0.05
    );

    // Top rail
    soldierBox(
        rifle, 0.09, 0.06, 0.55,
        darkMat, 0, 0.13, -0.40
    );

    // Scope
    const scope = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.07, 0.07, 0.25, 12
        ),
        metalMat
    );

    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.24, -0.38);
    rifle.add(scope);

    // Muzzle flash
    muzzleFlash = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshBasicMaterial({
            color: 0xffcc33
        })
    );

    muzzleFlash.position.set(0, 0.02, -1.58);
    muzzleFlash.visible = false;
    rifle.add(muzzleFlash);

    // Position rifle in soldier's hands
    rifle.position.set(0.34, 1.48, -0.43);

    player.add(rifle);
}

// =====================================
// ENEMIES
// =====================================

function createEnemy(x, z) {
    const enemy = new THREE.Group();

    const enemyBody = new THREE.MeshStandardMaterial({
        color: 0x8c2929
    });

    const enemyHead = new THREE.MeshStandardMaterial({
        color: 0xb77b59
    });

    soldierBox(
        enemy, 0.65, 0.85, 0.38,
        enemyBody, 0, 1.45, 0
    );

    soldierBox(
        enemy, 0.22, 0.65, 0.22,
        enemyBody, -0.43, 1.45, 0
    );

    soldierBox(
        enemy, 0.22, 0.65, 0.22,
        enemyBody, 0.43, 1.45, 0
    );

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.23, 12, 12),
        enemyHead
    );

    head.position.set(0, 2.08, 0);
    enemy.add(head);

    soldierBox(
        enemy, 0.25, 0.72, 0.28,
        enemyBody, -0.18, 0.55, 0
    );

    soldierBox(
        enemy, 0.25, 0.72, 0.28,
        enemyBody, 0.18, 0.55, 0
    );

    enemy.position.set(x, 0, z);

    enemy.traverse(function (object) {
        if (object.isMesh) {
            object.castShadow = true;
            object.userData.enemy = enemy;
            enemyMeshes.push(object);
        }
    });

    scene.add(enemy);
    enemies.push(enemy);
}

function createEnemies() {
    for (let i = 0; i < 8; i++) {
        const x = (Math.random() - 0.5) * 35;
        const z = -10 - Math.random() * 35;

        createEnemy(x, z);
    }
}

// =====================================
// REMOVE AND RESPAWN ENEMIES
// =====================================

function removeEnemy(enemy) {
    if (!enemy || !scene.children.includes(enemy)) return;

    scene.remove(enemy);

    enemy.traverse(function (object) {
        if (object.isMesh) {
            const index = enemyMeshes.indexOf(object);

            if (index !== -1) {
                enemyMeshes.splice(index, 1);
            }
        }
    });

    const enemyIndex = enemies.indexOf(enemy);

    if (enemyIndex !== -1) {
        enemies.splice(enemyIndex, 1);
    }

    kills++;
    document.getElementById("kills").textContent = kills;

    setTimeout(function () {
        const x = (Math.random() - 0.5) * 35;
        const z = -10 - Math.random() * 35;

        createEnemy(x, z);
    }, 1500);
}

// =====================================
// SHOOTING
// =====================================

function shoot() {
    const now = performance.now();

    if (now - lastShot < 160) return;

    lastShot = now;

    raycaster.setFromCamera(
        new THREE.Vector2(0, 0),
        camera
    );

    const hits = raycaster.intersectObjects(
        enemyMeshes,
        false
    );

    if (hits.length > 0) {
        const enemy = hits[0].object.userData.enemy;

        if (enemy) {
            removeEnemy(enemy);
        }
    }

    recoil = 0.12;
    muzzleFlash.visible = true;

    setTimeout(function () {
        if (muzzleFlash) {
            muzzleFlash.visible = false;
        }
    }, 70);
}

// =====================================
// MOBILE CONTROLS
// =====================================

function setupControls() {
    const joystick = document.getElementById("joystick");
    const knob = document.getElementById("knob");

    let joystickPointer = null;

    joystick.addEventListener("pointerdown", function (event) {
        joystickPointer = event.pointerId;
        joystick.setPointerCapture(event.pointerId);
        updateJoystick(event);
    });

    joystick.addEventListener("pointermove", function (event) {
        if (event.pointerId === joystickPointer) {
            updateJoystick(event);
        }
    });

    function resetJoystick() {
        moveX = 0;
        moveY = 0;
        knob.style.left = "32px";
        knob.style.top = "32px";
        joystickPointer = null;
    }

    joystick.addEventListener("pointerup", resetJoystick);
    joystick.addEventListener("pointercancel", resetJoystick);

    function updateJoystick(event) {
        const rect = joystick.getBoundingClientRect();

        let x = event.clientX - rect.left - rect.width / 2;
        let y = event.clientY - rect.top - rect.height / 2;

        const max = 34;
        const distance = Math.sqrt(x * x + y * y);

        if (distance > max) {
            x = x / distance * max;
            y = y / distance * max;
        }

        moveX = x / max;
        moveY = y / max;

        knob.style.left = (32 + x) + "px";
        knob.style.top = (32 + y) + "px";
    }

    // CAMERA DRAG
    let cameraPointer = null;
    let lastX = 0;
    let lastY = 0;

    renderer.domElement.addEventListener(
        "pointerdown",
        function (event) {
            if (event.clientX < window.innerWidth * 0.30) return;

            cameraPointer = event.pointerId;
            lastX = event.clientX;
            lastY = event.clientY;

            renderer.domElement.setPointerCapture(
                event.pointerId
            );
        }
    );

    renderer.domElement.addEventListener(
        "pointermove",
        function (event) {
            if (event.pointerId !== cameraPointer) return;

            const dx = event.clientX - lastX;
            const dy = event.clientY - lastY;

            cameraYaw -= dx * 0.006;
            cameraPitch += dy * 0.004;

            cameraPitch = Math.max(
                -0.15,
                Math.min(0.65, cameraPitch)
            );

            lastX = event.clientX;
            lastY = event.clientY;
        }
    );

    function stopCamera(event) {
        if (event.pointerId === cameraPointer) {
            cameraPointer = null;
        }
    }

    renderer.domElement.addEventListener("pointerup", stopCamera);
    renderer.domElement.addEventListener("pointercancel", stopCamera);

    // FIRE
    const fireButton = document.getElementById("fire");

    fireButton.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        isFiring = true;
        shoot();
    });

    function stopFire() {
        isFiring = false;
    }

    fireButton.addEventListener("pointerup", stopFire);
    fireButton.addEventListener("pointercancel", stopFire);
    fireButton.addEventListener("lostpointercapture", stopFire);

    // JUMP
    document.getElementById("jump").addEventListener(
        "pointerdown",
        function (event) {
            event.preventDefault();

            if (!isJumping) {
                jumpVelocity = 6;
                isJumping = true;
            }
        }
    );

    // RUN
    const runButton = document.getElementById("run");

    runButton.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        isRunning = true;
    });

    function stopRun() {
        isRunning = false;
    }

    runButton.addEventListener("pointerup", stopRun);
    runButton.addEventListener("pointercancel", stopRun);
    runButton.addEventListener("lostpointercapture", stopRun);
}

// =====================================
// CAMERA FOLLOW
// =====================================

function updateCamera() {
    const distance = 7;
    const height = 3.2 + cameraPitch * 3;

    const offsetX = Math.sin(cameraYaw) * distance;
    const offsetZ = Math.cos(cameraYaw) * distance;

    camera.position.set(
        player.position.x + offsetX,
        player.position.y + height,
        player.position.z + offsetZ
    );

    camera.lookAt(
        player.position.x,
        player.position.y + 1.45,
        player.position.z
    );
}

// =====================================
// PLAYER MOVEMENT
// =====================================

function updatePlayer(delta) {
    const speed = isRunning ? 8 : 4.5;

    const forward = new THREE.Vector3(
        -Math.sin(cameraYaw),
        0,
        -Math.cos(cameraYaw)
    );

    const right = new THREE.Vector3(
        Math.cos(cameraYaw),
        0,
        -Math.sin(cameraYaw)
    );

    const movement = new THREE.Vector3();

    movement.addScaledVector(forward, -moveY);
    movement.addScaledVector(right, moveX);

    if (movement.length() > 0) {
        movement.normalize();

        player.position.x += movement.x * speed * delta;
        player.position.z += movement.z * speed * delta;

        player.rotation.y = Math.atan2(
            -movement.x,
            -movement.z
        );
    }

    // JUMP PHYSICS
    if (isJumping) {
        player.position.y += jumpVelocity * delta;
        jumpVelocity -= 16 * delta;

        if (player.position.y <= 0) {
            player.position.y = 0;
            jumpVelocity = 0;
            isJumping = false;
        }
    }
}

// =====================================
// ANIMATION LOOP
// =====================================

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    if (isFiring) {
        shoot();
    }

    updatePlayer(delta);
    updateCamera();

    // RIFLE RECOIL
    if (recoil > 0) {
        rifle.position.z = -0.43 + recoil;
        recoil *= 0.75;

        if (recoil < 0.005) {
            recoil = 0;
            rifle.position.z = -0.43;
        }
    }

    renderer.render(scene, camera);
}

// =====================================
// RESIZE
// =====================================

window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});
