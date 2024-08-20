<script setup>
import { onMounted, ref } from 'vue';
import { Carousel } from 'three-ui-ar'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import * as THREE from 'three';

const container = ref(null);
const content = ref(null);
let camera, scene, renderer;
let controller;
let reticle;
let object;
let hitTestSource = null;
let hitTestSourceRequested = false;

let isRotating = false;
let initialRotation = { x: 0, y: 0 };
let initialScale = 1;
let initialDistance = 0;

onMounted(() => {
    init();
    animate();
    const carousel = new Carousel({
        id: 'crl-1',
        items: [
            { src: 'https://picsum.photos/600/800?random=1', alt: 'Image 1' },
            { src: 'https://picsum.photos/600/800?random=2', alt: 'Image 2' },
            { src: 'https://picsum.photos/600/800?random=3', alt: 'Image 3' },
            { src: 'https://picsum.photos/600/800?random=4', alt: 'Image 4' },
            { src: 'https://picsum.photos/600/800?random=5', alt: 'Image 5' }
        ],
        itemWidth: '200px',
        gap: '10px'
    });

    carousel.onButtonClick((slug) => {
        console.log('Item clicked:', slug);
    });
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
            addTouchListeners();
        },
        undefined,
        (error) => {
            console.error('An error happened while loading the GLTF model:', error);
        }
    );

    function onSelect() {
        if (reticle.visible && object) {
            const pivot = new THREE.Group();
            pivot.position.setFromMatrixPosition(reticle.matrix);
            scene.add(pivot);

            const placedObject = object.clone();
            placedObject.visible = true;
            placedObject.scale.set(0.1, 0.1, 0.1);

            const pivotWorldPosition = new THREE.Vector3();
            pivot.getWorldPosition(pivotWorldPosition);
            placedObject.position.copy(pivotWorldPosition)

            const axesHelper = new THREE.AxesHelper(1);
            placedObject.add(axesHelper);
            scene.add(placedObject);

            object = placedObject; // set the placed object as the one to interact with
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

function addTouchListeners() {
    let initialTouch = null;

    content.value.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            initialTouch = { x: event.touches[0].pageX, y: event.touches[0].pageY };
            initialRotation.x = object.rotation.x;
            initialRotation.y = object.rotation.y;
        } else if (event.touches.length === 2) {
            initialDistance = getDistance(event.touches[0], event.touches[1]);
            initialScale = object.scale.x; // assuming uniform scaling
        }
    });

    content.value.addEventListener('touchmove', (event) => {
        if (event.touches.length === 1 && initialTouch) {
            const deltaX = event.touches[0].pageX - initialTouch.x;
            const deltaY = event.touches[0].pageY - initialTouch.y;

            object.rotation.y = initialRotation.y + deltaX * 0.01;
            object.rotation.x = initialRotation.x + deltaY * 0.01;
        } else if (event.touches.length === 2) {
            const currentDistance = getDistance(event.touches[0], event.touches[1]);
            const scale = initialScale * (currentDistance / initialDistance);
            object.scale.set(scale, scale, scale);
        }
    });

    content.value.addEventListener('touchend', () => {
        initialTouch = null;
    });
}

function getDistance(touch1, touch2) {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
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
