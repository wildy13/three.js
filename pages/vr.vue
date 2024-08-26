<script setup>
import * as THREE from 'three';


import { onMounted, ref } from 'vue';
import { useTemplate } from '../composables/useTemplate';
import { useHand } from '../composables/useHand';



const Container = ref(null);

let scene, renderer, camera, controls;
let room;
let raycaster;

let controller1, controller2;

const { _hand, update } = useHand();


onMounted(() => {
    const {
        _create,
        initScene,
        initRenderer,
        initCamera,
        initControls,
        initRoom,
        initRaycaster,
        initControler1,
        initController2
    } = useTemplate();

    scene = initScene,
        renderer = initRenderer,
        camera = initCamera,
        controls = initControls,
        room = initRoom,
        raycaster = initRaycaster,
        controller1 = initControler1,
        controller2 = initController2

    // template
    _create(Container.value);

    // hand
    _hand(scene, renderer, controller1, controller2);

    _init();
    animate();
});


function _init() {



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
