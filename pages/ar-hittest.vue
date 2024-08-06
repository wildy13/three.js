<script setup>
import { onMounted, ref } from 'vue';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import * as THREE from 'three';

const container = ref(null);
const button = ref(null);
const content = ref(null);
const isAr = ref(false);
let camera, scene, renderer;
let controller;
let reticle;
let object;
let hitTestSource = null;
let hitTestSourceRequested = false;

onMounted(() => {
    init();
    animate();
    const arButton = document.getElementById("ARButton");
    if (arButton) {
        arButton.addEventListener('click', () => {
            isAr.value = true;
        });
    } else {
        console.error("ARButton element not found");
    }
});

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    camera.position.set(0, 5, 20);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.value.appendChild(renderer.domElement);

    // Set up ARButton with domOverlay
    const options = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: content.value }
    };
    document.body.appendChild(ARButton.createButton(renderer, options));

    const loader = new GLTFLoader();
    loader.load(
        '/food/scene.gltf',
        (gltf) => {
            object = gltf.scene;
            object.visible = true;
        },
        undefined,
        (error) => {
            console.error('An error happened while loading the GLTF model:', error);
        }
    );

    function onSelect() {
        if (reticle.visible && object) {
            const placedObject = object.clone();
            placedObject.position.setFromMatrixPosition(reticle.matrix);
            placedObject.visible = true;
            placedObject.scale.set(0.1, 0.1, 0.1);
            scene.add(placedObject);
        }
    }

    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
    if (frame && isAr.value === true) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                    hitTestSource = source;
                });
            });

            session.addEventListener('end', () => {
                hitTestSourceRequested = false;
                hitTestSource = null;
                isAr.value = false;
                reticle.visible = false;
            });

            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
    }

    renderer.render(scene, camera);
}
</script>

<template>
    <div ref="content">
        <div ref="container" class="fixed"></div>
        <button ref="button" class="z-[99999] absolute top-5 left-5 text-slate-100">Click Me</button>
        <div id="mySidenav" class="sidenav">
            <a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>
            <a class="ar-object" id="1" href="#">item_1</a>
            <a class="ar-object" id="2" href="#">item_2</a>
            <a class="ar-object" id="3" href="#">item_3</a>
            <a class="ar-object" id="4" href="#">item_4</a>
        </div>
    </div>
</template>

<style>
body {
    background-color: aqua;
    color: #fff;
    font-family: "Lato", sans-serif;
}

.sidenav {
    height: 100%;
    width: 0;
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    background-color: #111;
    overflow-x: hidden;
    transition: 0.5s;
    padding-top: 60px;
}

.sidenav a {
    padding: 8px 8px 8px 32px;
    text-decoration: none;
    font-size: 25px;
    color: #818181;
    display: block;
    transition: 0.3s;
}

.sidenav a:hover {
    color: #f1f1f1;
}

.sidenav .closebtn {
    position: absolute;
    top: 0;
    right: 25px;
    font-size: 36px;
    margin-left: 50px;
}

@media screen and (max-height: 450px) {
    .sidenav {
        padding-top: 15px;
    }

    .sidenav a {
        font-size: 18px;
    }
}

#place-button {
    position: absolute;
    bottom: 20px;
    left: calc(50% - 50px);
    width: 100px;
    height: 35px;
    display: none;
}

#VRButton {
    margin-bottom: 70px !important;
}
</style>
