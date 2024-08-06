<script setup>
import { onMounted, ref } from 'vue';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import * as THREE from 'three';

const container = ref(null);
const dropdown = ref(null);
const button = ref(null);
const content = ref(null);
let camera, scene, renderer;
let controller;
let reticle;
let object;
let hitTestSource = null;
let hitTestSourceRequested = false;

onMounted(() => {
    init();
    _createButton();
    animate();
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
        optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
        domOverlay: { root: document.body }
    };
    document.body.appendChild(ARButton.createButton(renderer, options));

    const loader = new GLTFLoader();
    loader.load(
        '/food/scene.gltf',
        (gltf) => {
            object = gltf.scene;
            object.visible = true;

            var box = new THREE.Box3();
            box.setFromObject(object);
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

    renderer.domElement.addEventListener('touchstart', function (e) {
        e.preventDefault();
        console.log(e);
    }, false);

    renderer.domElement.addEventListener('touchend', function (e) {
        e.preventDefault();
        console.log(e);
    }, false);

    renderer.domElement.addEventListener('touchmove', function (e) {
        e.preventDefault();
        console.log(e);
    }, false);
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
    if (frame) {
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
                var box = new THREE.Box3();
                const objectClone = object.clone();
                box.setFromObject(objectClone);
                if (button.value) {
                    button.value.style.display = "none";
                }
            });

            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                if (button.value) {
                    button.value.style.display = "block";
                }
            } else {
                reticle.visible = false;
                if (button.value) {
                    button.value.style.display = "none";
                }
            }
        }
    }

    renderer.render(scene, camera);
}

function _createButton() {
    // const button = document.createElement("button");
    // document.body.appendChild(button);
    // button.innerHTML = "Click Me";
    // button.className = "z-[99999] absolute top-5 left-5 text-slate-100";
    // button.ref = "button";
    // button.addEventListener('click', function () {
    //     alert('Button CLick')
    // })
    document.body.appendChild(dropdown.value);
}
</script>

<template>
    <div ref="content">
        <div ref="container" class="fixed"></div>
        <div ref="dropdown" class="absolute z-[99999] top-5 left-5">

            <button id="dropdownDefaultButton" data-dropdown-toggle="dropdown"
                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                type="button">Dropdown button <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="m1 1 4 4 4-4" />
                </svg>
            </button>

            <div id="dropdown"
                class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
                <ul class="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
                    <li>
                        <a href="#"
                            class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Dashboard</a>
                    </li>
                    <li>
                        <a href="#"
                            class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Settings</a>
                    </li>
                    <li>
                        <a href="#"
                            class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Earnings</a>
                    </li>
                    <li>
                        <a href="#"
                            class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Sign
                            out</a>
                    </li>
                </ul>
            </div>

        </div>
    </div>
</template>
