<script setup>
import { onMounted, ref } from 'vue';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { } from 'three/addons/libs/lil-gui.module.min.js';
import * as THREE from 'three';

const container = ref(null);
let camera, scene, renderer;
let controller;
let reticle;
let object;
let hitTestSource = null;
let hitTestSourceRequested = false;

onMounted(() => {
    init();
    animate();
});

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    camera.position.set(0, 5, 20)

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);



    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.value.appendChild(renderer.domElement);

    let options = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay']
    }

    options.domOverlay = { root: document.getElementById('content') }
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
            // reticle.matrix.decompose(placedObject.position, placedObject.quaternion, placedObject.scale);
            // placedObject.scale.set(0.1, 0.1, 0.1);
            placedObject.position.setFromMatrixPosition(reticle.matrix);
            placedObject.visible = true; // Ensure the cloned object is visible
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
                document.getElementById("myButton").style.display = "none"
            });

            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                document.getElementById("myButton").style.display = "block"
            } else {
                reticle.visible = false;
                document.getElementById("myButton").style.display = "none"
            }
        }
    }

    renderer.render(scene, camera);
}
</script>

<template>
    <div>
        <div ref="container"></div>
        <div>
            <button id="myButton" class="z-[99999] absolute top-5 left-5 text-slate-100">Click Me</button>
        </div>
    </div>

</template>
