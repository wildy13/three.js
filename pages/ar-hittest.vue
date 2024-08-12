<script setup>
import { onMounted, ref } from 'vue';
import { SlideOver } from '../src/slideOver.js'
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
    animate();
    const body = document.body;
    const slider = new SlideOver();
    slider.updateOptions({
        body: {
            length: 3,
            name: [{
                name: 'HVAC'
            }, {
                name: 'ELECTRICAL'
            }, {
                name: 'BIOMEDICAL'
            }]
        }
    })
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
        '/bipedal_mech/scene.gltf',
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
            // Create a new pivot point
            const pivot = new THREE.Group();
            pivot.position.setFromMatrixPosition(reticle.matrix);
            scene.add(pivot);

            // Clone the object and add it to the pivot
            const placedObject = object.clone();
            placedObject.visible = true;
            placedObject.scale.set(0.1, 0.1, 0.1);

            // Add the placedObject to the pivot
            const pivotWorldPosition = new THREE.Vector3();
            pivot.getWorldPosition(pivotWorldPosition);
            placedObject.position.copy(pivotWorldPosition)

            // Optionally, add an AxesHelper to the placedObject for visualization
            const axesHelper = new THREE.AxesHelper(1);
            placedObject.add(axesHelper);
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
    </div>
</template>
