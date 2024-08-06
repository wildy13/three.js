<script setup>
import { onMounted, ref } from 'vue';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import * as THREE from 'three';

const container = ref(null);
const button = ref(null);
const content = ref(null);
const isCardVisible = ref(false);
let camera, scene, renderer;
let controller;
let reticle;
let object;
let hitTestSource = null;
let hitTestSourceRequested = false;

onMounted(() => {
    init();
    _createSlideBar();
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

function _createSlideBar() {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.innerHTML = "Click Me";
    button.className = "z-[99999] absolute top-5 left-5 text-slate-100 bg-blue-500 p-2 rounded";
    button.ref = "button";

    button.addEventListener('click', function () {
        const card = document.querySelector('.card');
        if (card.classList.contains('-translate-x-full')) {
            card.classList.remove('-translate-x-full');
            card.classList.add('translate-x-0');
        } else {
            card.classList.remove('translate-x-0');
            card.classList.add('-translate-x-full');
        }
    });

    // Create card element
    const card = document.createElement('div');
    card.className = 'card fixed top-0 left-0 w-1/2 h-full bg-slate-100 z-[99999] p-4 transform -translate-x-full transition-transform duration-300';
    document.body.appendChild(card);

    // Create parent close button
    const parentCloseButton = document.createElement('div');
    parentCloseButton.className = "w-full rounded p-1 flex justify-end items-center";
    card.appendChild(parentCloseButton);

    // create close button
    const closeButton = document.createElement('button');
    closeButton.innerText = "Close";
    closeButton.addEventListener('click', function () {
        card.classList.add('-translate-x-full');
        card.classList.remove('translate-x-0');
    });
    parentCloseButton.appendChild(closeButton);


    // create body
    const bodyCard = document.createElement('div');
    card.appendChild(bodyCard);
    bodyCard.className = "relative top-10 w-full";
    bodyCard.innerText = "body"
}

</script>

<template>
    <div ref="content">
        <div ref="container" class="fixed"></div>
    </div>
</template>
