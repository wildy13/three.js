<script setup>
import * as THREE from 'three';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { onMounted, ref } from 'vue';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { OculusHandModel } from 'three/addons/webxr/OculusHandModel.js';
import { OculusHandPointerModel } from 'three/addons/webxr/OculusHandPointerModel.js';


const Container = ref(null);

let scene, renderer, camera, controls;
let room;
let mouse;
let raycaster;

let controller1, controller2;

let intersectedObject = null;
let isDragging = false;
let initialPosition = new THREE.Vector3();
let dragOffset = new THREE.Vector3();


raycaster = new THREE.Raycaster();

onMounted(() => {
    _initScene();
    animate();
});


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

    controller1.addEventListener('selectstart', _selectStart);
    controller1.addEventListener('selectend', _selectEnd);
    controller2.addEventListener('selectstart', _selectStart);
    controller2.addEventListener('selectend', _selectEnd);

    const controllerModelFactory = new XRControllerModelFactory();

    // Hand 1
    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    const hand1 = renderer.xr.getHand(0);
    hand1.add(new OculusHandModel(hand1));
    const handPointer1 = new OculusHandPointerModel(hand1, controller1);
    hand1.add(handPointer1);

    scene.add(hand1);

    // Hand 2
    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    const hand2 = renderer.xr.getHand(1);
    hand2.add(new OculusHandModel(hand2));
    const handPointer2 = new OculusHandPointerModel(hand2, controller2);
    hand2.add(handPointer2);
    scene.add(hand2);

    // Tambahkan kontroler ke scene
    scene.add(controller1);
    scene.add(controller2);

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
function update() {
    // Update raycaster with controller1 position
    raycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(controller1.matrixWorld);

    // Raycast to detect intersected objects with controller1
    const intersects1 = raycaster.intersectObjects(scene.children);

    // Update raycaster with controller2 position
    raycaster.ray.origin.setFromMatrixPosition(controller2.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(controller2.matrixWorld);

    // Raycast to detect intersected objects with controller2
    const intersects2 = raycaster.intersectObjects(scene.children);

    // Handle intersections with controller1
    if (intersects1.length > 0) {
        intersectedObject = intersects1[0].object;
    }

    // Handle intersections with controller2
    if (intersects2.length > 0) {
        intersectedObject = intersects2[0].object;
    }

    // Update object position if dragging
    if (isDragging && intersectedObject) {
        const intersection = raycaster.intersectObject(intersectedObject)[0];
        intersectedObject.position.copy(intersection.point).add(dragOffset);
    }
}


function _selectStart(event) {
    isDragging = true;
    if (intersectedObject) {
        intersectedObject.updateMatrixWorld();
        const intersection = raycaster.intersectObject(intersectedObject)[0];
        initialPosition.copy(intersectedObject.position);
        dragOffset.subVectors(intersection.point, intersectedObject.position);
    }
}

function _selectEnd(event) {
    isDragging = false;
    intersectedObject = null;
}


function animate() {
    renderer.setAnimationLoop(() => {
        update();
        renderer.render(scene, camera);
    });
}

</script>

<template>
    <div ref="Container"></div>
</template>
