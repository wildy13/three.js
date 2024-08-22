<!-- <script setup>
import * as THREE from 'three';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { onMounted, ref } from 'vue';

const Container = ref(null);

let scene, renderer, camera, controls;
let room;
let mouse;
let raycaster;
let controller1, controller2;
let hand1, hand2;

onMounted(() => {
    _listener();
    _initScene();
    animate();
});

function _listener() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    window.addEventListener('click', onMouseClick, false);
}

function _initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x505050);

    // Cahaya
    scene.add(new THREE.HemisphereLight(0xa5a5a5, 0x898989, 3));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    // Kamera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.set(0, 1, 3);

    // Ruangan
    room = new THREE.LineSegments(
        new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
        new THREE.LineBasicMaterial({ color: 0xbcbcbc })
    );
    scene.add(room);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    // VR
    Container.value.appendChild(renderer.domElement);
    Container.value.appendChild(VRButton.createButton(renderer));

    // Kontroler atau Hand Tracking
    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);
    scene.add(controller1);
    scene.add(controller2);

    // Periksa apakah hand tracking didukung
    if (renderer.xr.isHandTrackingSupported) {
        hand1 = renderer.xr.getHand(0);
        hand2 = renderer.xr.getHand(1);
        scene.add(hand1);
        scene.add(hand2);
    } else {
        // Jika hand tracking tidak didukung, gunakan controller dengan mesh tangan biasa
        const leftHandMesh = createHandMesh();
        controller1.add(leftHandMesh);

        const rightHandMesh = createHandMesh();
        controller2.add(rightHandMesh);
    }

    // Kontrol orbit
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(0, 1.2, -1);
    controls.update();
}

function animate() {
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
}

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        // Lakukan sesuatu dengan objek yang terinterseksi
    }
}

function createHandMesh() {
    const handGroup = new THREE.Group(); // Grup untuk menampung bagian tangan

    // Membuat telapak tangan
    const palmGeometry = new THREE.BoxGeometry(0.1, 0.02, 0.2);
    const palmMaterial = new THREE.MeshStandardMaterial({ color: 0x8f8f8f });
    const palmMesh = new THREE.Mesh(palmGeometry, palmMaterial);
    handGroup.add(palmMesh);

    // Membuat jari-jari
    const fingerGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 32);
    const fingerMaterial = new THREE.MeshStandardMaterial({ color: 0x8f8f8f });

    for (let i = 0; i < 5; i++) {
        const fingerMesh = new THREE.Mesh(fingerGeometry, fingerMaterial);
        fingerMesh.position.set(-0.04 + i * 0.02, 0.06, -0.05);
        fingerMesh.rotation.x = Math.PI / 2;
        handGroup.add(fingerMesh);
    }

    return handGroup;
}
</script>

<template>
    <div ref="Container"></div>
</template> -->
<script setup>
import * as THREE from 'three';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { onMounted, ref } from 'vue';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const Container = ref(null);

let scene, renderer, camera, controls;
let room;
let mouse;
let raycaster;

let controller1, controller2;
let leftHandMesh, rightHandMesh;

const loader = new GLTFLoader();

onMounted(() => {
    _listener();
    _initScene();
    animate();
});

function _listener() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    window.addEventListener('click', onMouseClick, false);
}

function _initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x505050);

    // Cahaya
    scene.add(new THREE.HemisphereLight(0xa5a5a5, 0x898989, 3));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    // Kamera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.set(0, 1, 3);

    // Ruangan
    room = new THREE.LineSegments(
        new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
        new THREE.LineBasicMaterial({ color: 0xbcbcbc })
    );
    scene.add(room);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    // VR
    Container.value.appendChild(renderer.domElement);
    Container.value.appendChild(VRButton.createButton(renderer));

    // Kontrol orbit
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(0, 1.2, -1);
    controls.update();

    // Kontroler VR
    controller1 = renderer.xr.getController(0); // Tangan kiri
    controller2 = renderer.xr.getController(1); // Tangan kanan

    // Tambahkan kontroler ke scene
    scene.add(controller1);
    scene.add(controller2);

    // Muat model tangan
    loadHandModels();
}

function animate() {
    renderer.setAnimationLoop(() => {
        // Jika ada update spesifik yang diperlukan, lakukan di sini
        renderer.render(scene, camera);
    });
}

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        // Lakukan sesuatu dengan objek yang terinterseksi
    }
}

function loadHandModels() {
    loader.load('/left.glb', (gltf) => {
        leftHandMesh = gltf.scene;
        controller1.add(leftHandMesh);
    });

    loader.load('/right.glb', (gltf) => {
        rightHandMesh = gltf.scene;
        controller2.add(rightHandMesh);
    });
}

</script>

<template>
    <div ref="Container"></div>
</template>
