<script setup>
import * as THREE from 'three';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { onMounted, ref, watch } from 'vue';

const Container = ref(null);

let scene, renderer, camera, controls;
let room;
let mouse;
let raycaster;
let controller1, controller2;



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

    // Light
    scene.add(new THREE.HemisphereLight(0xa5a5a5, 0x898989, 3));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    // Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.set(0, 1, 3);

    // Room
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
    // Add VR controllers
    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);
    scene.add(controller1);
    scene.add(controller2);

    // Controls orbit
    controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 1.6, 0);
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
        console.log(intersectedObject);
    }
}

</script>

<template>
    <div ref="Container"></div>
</template>
