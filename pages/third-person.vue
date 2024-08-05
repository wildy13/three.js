<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { onMounted, ref } from 'vue';

const container3D = ref(null);

onMounted(() => {
    let object, mixer, walkAction, shutdownAction, CycleBackAction, jumpAction;
    let goal, follow;
    let coronaSafetyDistance = 0.3;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 30, -300);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container3D.value.appendChild(renderer.domElement);

    goal = new THREE.Object3D();
    follow = new THREE.Object3D();
    follow.position.z = -coronaSafetyDistance;

    const loader = new GLTFLoader();
    loader.load(
        '/medium_mech_striker/scene.gltf',
        (gltf) => {
            object = gltf.scene;
            object.scale.set(10, 10, 10);
            object.position.y = -200;
            object.frustumCulled = false;
            object.add(follow);
            goal.add(camera);
            scene.add(object);

            // Setup animations
            mixer = new THREE.AnimationMixer(object);
            gltf.animations.forEach((clip) => {
                if (clip.name === 'a5WalkCycle') {
                    walkAction = mixer.clipAction(clip);
                    walkAction.setEffectiveTimeScale(1);
                } else if (clip.name === 'a1ShutdownPose') {
                    shutdownAction = mixer.clipAction(clip);
                } else if (clip.name === 'a6WalkCycleBack') {
                    CycleBackAction = mixer.clipAction(clip);
                } else if (clip.name === 'a8Jump') {
                    jumpAction = mixer.clipAction(clip);
                }
            });

            // Start with shutdown animation
            if (shutdownAction) {
                shutdownAction.play();
            }
        },
        undefined,
        (error) => {
            console.error('An error happened while loading the GLTF model:', error);
        }
    );

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

    // Animation function
    function animate() {
        requestAnimationFrame(animate);

        // Update mixer if defined
        if (mixer) {
            mixer.update(0.03);
        }

        // Handle animations
        if (object) {
            const direction = new THREE.Vector3();
            object.getWorldDirection(direction);

            if (keys['w']) {
                if (shutdownAction && shutdownAction.isRunning()) {
                    shutdownAction.stop();
                }
                if (walkAction && !walkAction.isRunning()) {
                    walkAction.play();
                }
                if (keys['d']) {
                    object.rotation.y -= 0.05;
                } else if (keys['a']) {
                    object.rotation.y += 0.05;
                } else if (keys[' ']) {
                    if (!jumpAction.isRunning()) jumpAction.play();
                } else {
                    if (jumpAction.isRunning()) jumpAction.stop();
                }
                object.position.addScaledVector(direction, 1);
            } else if (keys['s']) {
                if (walkAction && walkAction.isRunning()) {
                    walkAction.stop();
                }
                if (CycleBackAction && !CycleBackAction.isRunning()) {
                    CycleBackAction.play();
                }
                object.position.addScaledVector(direction, -1);
            } else {
                if (walkAction && walkAction.isRunning()) {
                    walkAction.stop();
                }
                if (shutdownAction && !shutdownAction.isRunning()) {
                    shutdownAction.play();
                }
                if (CycleBackAction && CycleBackAction.isRunning()) {
                    CycleBackAction.stop();
                }
            }

            const objectPosition = new THREE.Vector3();
            object.getWorldPosition(objectPosition);

            const offset = new THREE.Vector3(0, 200, -300);
            const goalPosition = objectPosition.clone().add(offset);
            camera.position.lerp(goalPosition, 0.05);
            camera.lookAt(objectPosition);
        }

        controls.update();
        renderer.render(scene, camera);
    }

    // Start animation
    animate();

    // Adjust camera and renderer size when window is resized
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});


</script>

<template>
    <div ref="container3D">
        <div class="absolute bottom-5 right-5">
            <NuxtLink to="https://github.com/wildy13/three.js/blob/master/pages/third-person.vue">View Code</NuxtLink>
        </div>
        <div class="absolute bottom-4 w-full text-center">
            Walk = W
            Back = S
            Left = D
            Right = E
        </div>
    </div>
</template>
