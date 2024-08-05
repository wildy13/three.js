<script setup>
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { onMounted, ref } from 'vue';

const container3D = ref(null);
const object1Status = ref(false);
const object2Status = ref(false);

onMounted(() => {
    // Inisialisasi scene, kamera, dan renderer
    let mixerObject1, mixerObject2, walkAction1, walkAction2, shutdownAction1, shutdownAction2, CycleBackAction, jumpAction;
    let goal, follow;
    let object1, object2;
    let coronaSafetyDistance = 0.3;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(0, 30, -300);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container3D.value.appendChild(renderer.domElement);

    goal = new THREE.Object3D();
    follow = new THREE.Object3D();
    follow.position.z = -coronaSafetyDistance;


    // Inisialisasi GLTFLoader
    const loader = new GLTFLoader();

    // Fungsi untuk memuat dan menambahkan GLTF ke scene
    function loadGLTF(url, position) {
        return new Promise((resolve, reject) => {
            loader.load(url, (gltf) => {
                gltf.scene.position.copy(position);
                gltf.scene.scale.set(10, 10, 10);
                gltf.scene.add(follow);
                goal.add(camera);
                scene.add(gltf.scene);
                resolve(gltf);
            }, (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            }, reject);
        });
    }

    // Memuat dua file GLTF dan menambahkannya ke scene
    Promise.all([
        loadGLTF('/medium_mech_striker/scene.gltf', new THREE.Vector3(100, -200, 0)),
        loadGLTF('/bipedal_mech/scene.gltf', new THREE.Vector3(-100, -200, 0)) // Contoh posisi yang berbeda
    ]).then(([gltf1, gltf2]) => {
        object1 = gltf1.scene;
        object2 = gltf2.scene;

        mixerObject1 = new THREE.AnimationMixer(object1);
        mixerObject2 = new THREE.AnimationMixer(object2);

        gltf1.animations.forEach((clip) => {
            if (clip.name === 'a5WalkCycle') {
                walkAction1 = mixerObject1.clipAction(clip);
                walkAction1.setEffectiveTimeScale(1);
            } else if (clip.name === 'a1ShutdownPose') {
                shutdownAction1 = mixerObject1.clipAction(clip);
            } else if (clip.name === 'a6WalkCycleBack') {
                CycleBackAction = mixerObject1.clipAction(clip);
            } else if (clip.name === 'a8Jump') {
                jumpAction = mixerObject1.clipAction(clip);
            }
        });

        gltf2.animations.forEach((clip) => {
            if (clip.name === 'Armature|Walk') {
                walkAction2 = mixerObject2.clipAction(clip);
                walkAction2.setEffectiveTimeScale(1);
            } else if (clip.name === 'Armature|idle') {
                shutdownAction2 = mixerObject2.clipAction(clip);

            }
        })

        // Add both objects to scene
        scene.add(object1);
        scene.add(object2);

        // Start with shutdown animation
        if (shutdownAction1) {
            shutdownAction1.play();
        }
        if(shutdownAction2) {
            shutdownAction2.play();
        }
    }).catch((error) => {
        console.error('An error happened while loading the GLTF models:', error);
    });


    // Create plane mesh
    const planeGeometry = new THREE.PlaneGeometry(10000, 10000);
    planeGeometry.rotateX(-Math.PI / 2);
    const planeMaterial = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.2 });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    scene.add(plane);

    const gridHelper = new THREE.GridHelper(2000, 100);
    gridHelper.position.y = -199;
    gridHelper.material.opacity = 0.25;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Light
    scene.add(new THREE.AmbientLight(0xf0f0f0, 3));
    const light = new THREE.SpotLight(0xffffff, 4.5);
    light.position.set(0, 1500, 200);
    light.angle = Math.PI * 0.2;
    light.decay = 0;
    light.castShadow = true;
    light.shadow.camera.near = 200;
    light.shadow.camera.far = 2000;
    light.shadow.bias = -0.000222;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    scene.add(light);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;

    // Handle keyboard input
    const keys = {};
    window.addEventListener('keydown', (event) => {
        keys[event.key] = true;
    });
    window.addEventListener('keyup', (event) => {
        keys[event.key] = false;
    });

    function animate() {
        requestAnimationFrame(animate);

        if (mixerObject1) {
            mixerObject1.update(0.03);
        }
        if (mixerObject2) {
            mixerObject2.update(0.03);
        }
        // Update mixer for object1 if defined
        if (object1) {
            if (object1Status.value) {
                const directionObject1 = new THREE.Vector3();
                object1.getWorldDirection(directionObject1);

                if (keys['w']) {
                    if (shutdownAction1 && shutdownAction1.isRunning()) {
                        shutdownAction1.stop();
                    }
                    if (walkAction1 && !walkAction1.isRunning()) {
                        walkAction1.play();
                    }
                    if (keys['d']) {
                        object1.rotation.y -= 0.05;
                    } else if (keys['a']) {
                        object1.rotation.y += 0.05;
                    } else if (keys[' ']) {
                        if (!jumpAction.isRunning()) jumpAction.play();
                    } else {
                        if (jumpAction.isRunning()) jumpAction.stop();
                    }
                    object1.position.addScaledVector(directionObject1, 1);
                } else if (keys['s']) {
                    if (walkAction1 && walkAction1.isRunning()) {
                        walkAction1.stop();
                    }
                    if (CycleBackAction && !CycleBackAction.isRunning()) {
                        CycleBackAction.play();
                    }
                    object1.position.addScaledVector(directionObject1, -1);
                } else {
                    if (walkAction1 && walkAction1.isRunning()) {
                        walkAction1.stop();
                    }
                    if (shutdownAction1 && !shutdownAction1.isRunning()) {
                        shutdownAction1.setLoop(THREE.LoopRepeat, Infinity);
                        shutdownAction1.play();
                    }
                    if (CycleBackAction && CycleBackAction.isRunning()) {
                        CycleBackAction.stop();
                    }
                }
                const objectPositionObject1 = new THREE.Vector3();
                object1.getWorldPosition(objectPositionObject1);

                const offsetObject1 = new THREE.Vector3(0, 200, -300);
                const goalPositionObject1 = objectPositionObject1.clone().add(offsetObject1);
                camera.position.lerp(goalPositionObject1, 0.05);
                camera.lookAt(objectPositionObject1);
            }
        }

        // Handle object2 movement
        if (object2) {
            if (object2Status.value) {
                const directionObject2 = new THREE.Vector3();
                object2.getWorldDirection(directionObject2);
                if (keys['w']) {
                    if (shutdownAction2 && shutdownAction2.isRunning()) {
                        shutdownAction2.stop();
                    }
                    if (walkAction2 && !walkAction2.isRunning()) {
                        walkAction2.play();
                    }
                    if (keys['d']) {
                        object2.rotation.y -= 0.05;
                    } else if (keys['a']) {
                        object2.rotation.y += 0.05;
                    }
                    object2.position.addScaledVector(directionObject2, 1);
                } else if (keys['s']) {
                    object2.position.addScaledVector(directionObject2, -1);
                } else {
                    if (walkAction2 && walkAction2.isRunning()) {
                        walkAction2.stop();
                    }
                    if (shutdownAction2 && !shutdownAction2.isRunning()) {
                        shutdownAction2.setLoop(THREE.LoopRepeat, Infinity);
                        shutdownAction2.play();
                    }
                }

                const objectPositionObject2 = new THREE.Vector3();
                object2.getWorldPosition(objectPositionObject2);

                const offsetObject2 = new THREE.Vector3(0, 200, -300);
                const goalPositionObject2 = objectPositionObject2.clone().add(offsetObject2);
                camera.position.lerp(goalPositionObject2, 0.05);
                camera.lookAt(objectPositionObject2);
            }
        }

        controls.update();
        renderer.render(scene, camera);
    }


    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

});

const onChangeStatusObject1 = (e) => {
    if (e == 1) {
        object1Status.value = !object1Status.value
        if (object2Status.value == true) {
            object2Status.value = false;
        }
    } else {
        object2Status.value = !object2Status.value
        if (object1Status.value == true) {
            object1Status.value = false;
        }
    }
}
</script>

<template>
    <div ref="container3D">
        <div class="absolute top-5 left-5 flex space-x-4">
            <button @click="onChangeStatusObject1(1)">Striker Mecha {{ object1Status }}</button>
            <button @click="onChangeStatusObject1(2)">Bipedal Mecha {{ object2Status }}</button>
        </div>
        <div class="absolute bottom-4 w-full text-center">
            Walk = W
            Back = S
            Left = D
            Right = E
        </div>
    </div>
</template>