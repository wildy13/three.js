<script setup>
import * as THREE from 'three';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OculusHandModel } from 'three/examples/jsm/webxr/OculusHandModel.js';
import { onMounted, ref } from 'vue';

const Container = ref(null);

let scene, renderer, camera, controls;
let room;
let mouse;
let raycaster;
let controller1, controller2;

let hand1, hand2;
let trail = []; // Inisialisasi trail sebagai array kosong
let i;

onMounted(() => {
    _listener();
    _initScene();
    _hand();
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

    // Tambahkan controller VR
    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);
    scene.add(controller1);
    scene.add(controller2);

    // Kontrol orbit
    controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 1.6, 0);
    controls.target = new THREE.Vector3(0, 1.2, -1);
    controls.update();
}

function animate() {
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);

        // Periksa jika hand1 dan trail[i] sudah didefinisikan
        if (hand1 && hand1.joints && hand1.joints['index-finger-tip'] && trail[i]) {
            const jointPosition = hand1.joints['index-finger-tip'].position;
            if (jointPosition) {
                trail[i].position.copy(jointPosition);
                i++;
                if (i > 99) {
                    i = 0;
                }
            }
        }
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

function _hand() {
    // hand 1
    hand1 = renderer.xr.getHand(1);
    hand1.add(new OculusHandModel(hand1));
    scene.add(hand1);

    // hand 2
    hand2 = renderer.xr.getHand(0);
    hand2.add(new OculusHandModel(hand2));
    scene.add(hand2);

    // Inisialisasi trail
    for (let j = 0; j < 100; j++) {
        const geometry = new THREE.BoxGeometry(0.005, 0.005, 0.005);
        trail[j] = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        trail[j].material.wireframe = true;
        trail[j].position.set(0, 0, 0);
        scene.add(trail[j]);
    }
    i = 0;
}
</script>

<template>
    <div ref="Container"></div>
</template>
