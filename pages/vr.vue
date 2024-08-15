<script setup>
import * as THREE from 'three';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { onMounted } from 'vue';

const container = ref(null);

let scene, renderer, camera;
let room;

onMounted(() => {
    // Scene
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
    renderer.setAnimationLoop(function () {
        renderer.render(scene, camera);
    });
    renderer.xr.addEventListener('sessionstart', () => baseReferenceSpace = renderer.xr.getReferenceSpace());
    renderer.xr.enabled = true;

    // VR
    container.value.appendChild(renderer.domElement);
    container.value.appendChild(VRButton.createButton(renderer));
})
</script>

<template>
    <div ref="container" />
</template>