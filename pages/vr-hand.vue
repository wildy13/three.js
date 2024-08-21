<script setup>
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

const handMeshes = { left: [], right: [] };

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
        const session = renderer.xr.getSession();
        console.log(handMeshes);

        // Pastikan hand tracking berjalan jika sesi ada
        if (session) {
            const inputSources = session.inputSources;
            inputSources.forEach(inputSource => {
                if (inputSource.hand) {
                    const hand = inputSource.hand;
                    const handedness = inputSource.handedness; // 'left' or 'right'
                    const meshes = handMeshes[handedness];

                    if (meshes.length === 0) {
                        // Membuat mesh untuk setiap sendi tangan
                        for (const key of hand.joints.keys()) {
                            const mesh = createHandMesh();
                            meshes.push(mesh);
                            scene.add(mesh);
                        }
                    }

                    // Memperbarui posisi dan orientasi mesh
                    updateHandMesh(hand, meshes, inputSource);
                }
            });
        }

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
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const geometry = new THREE.SphereGeometry(0.02, 10, 10);
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

function updateHandMesh(hand, handMeshes, inputSource) {
    for (let i = 0; i < handMeshes.length; i++) {
        const jointPose = hand.getJointPose(hand.joints[i], renderer.xr.getReferenceSpace());
        if (jointPose) {
            handMeshes[i].position.copy(jointPose.transform.position);
            handMeshes[i].quaternion.copy(jointPose.transform.orientation);
        }
    }
}
</script>

<template>
    <div ref="Container"></div>
</template>
