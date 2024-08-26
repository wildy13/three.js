<script setup>
import * as THREE from 'three';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { onMounted, ref } from 'vue';



const Container = ref(null);

let scene, renderer, camera, controls;
let room;
let raycaster;

let controller1, controller2;

const { _hand, update } = useHand();
raycaster = new THREE.Raycaster();

onMounted(() => {
    _init();
    animate();
});


function _init() {
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
    const sessionInit = {
        requiredFeatures: ['hand-tracking']
    };

    Container.value.appendChild(renderer.domElement);
    Container.value.appendChild(VRButton.createButton(renderer, sessionInit));

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

    // hand
    _hand(scene, renderer, controller1, controller2);

    // Cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const cubeCount = 3;
    const distance = 2; // Jarak antara kubus

    for (let i = 0; i < cubeCount; i++) {
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(i * distance - (distance * (cubeCount - 1)) / 2, 1, 0);
        cube.scale.set(0.25, 0.25, 0.25);
        scene.add(cube);
    }

}

function animate() {
    renderer.setAnimationLoop(() => {
        update(scene, raycaster, controller1, controller2);
        renderer.render(scene, camera);
    });
}

</script>

<template>
    <div ref="Container"></div>
</template>
