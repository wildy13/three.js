<script setup>
import * as THREE from 'three';
import { onMounted, ref } from 'vue';
import { useTemplate } from '../composables/useTemplate';
import { useHand } from '../composables/useHand';



const Container = ref(null);

let scene, renderer, camera, controls;
let room;
let raycaster;




onMounted(() => {
    const {
        _create,
        initScene,
        initRenderer,
        initCamera,
        initControls,
        initRoom,
        initRaycaster,
    } = useTemplate();

    scene = initScene,
        renderer = initRenderer,
        camera = initCamera,
        controls = initControls,
        room = initRoom,
        raycaster = initRaycaster,

        // template
        _create(Container.value);
    _init();
});


function _init() {
    // Cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const cubeCount = 3;
    const distance = 2; // Jarak antara kubus


    // hand
    const { objectEntity, update } = useHand(renderer, scene, camera);
    for (let i = 0; i < cubeCount; i++) {
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(i * distance - (distance * (cubeCount - 1)) / 2, 1, 0);
        cube.scale.set(0.25, 0.25, 0.25);
        scene.add(cube);

        objectEntity(cube);
    }

    renderer.setAnimationLoop(() => {
        update(renderer, camera);
        renderer.render(scene, camera);
    });
}


</script>

<template>
    <div ref="Container"></div>
</template>
