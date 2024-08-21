<script setup>
import * as THREE from 'three';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { onMounted, ref, watch } from 'vue';

const Container = ref(null);

let scene, renderer, camera, controls;
let room;
let mouse;
let raycaster;
let controller1, controller2;

var xrRefSpace;
let boxes_left = [];
let bones_left = [];
let boxes_right = [];
let bones_right = [];
let boxes = { left: boxes_left, right: boxes_right, leftBones: bones_left, rightBones: bones_right };
let jointConnections = [
    { startJoint: 2, endJoint: 3 },
    { startJoint: 3, endJoint: 4 },

    { startJoint: 6, endJoint: 7 },
    { startJoint: 7, endJoint: 8 },
    { startJoint: 8, endJoint: 9 },

    { startJoint: 11, endJoint: 12 },
    { startJoint: 12, endJoint: 13 },
    { startJoint: 13, endJoint: 14 },

    { startJoint: 16, endJoint: 17 },
    { startJoint: 17, endJoint: 18 },
    { startJoint: 18, endJoint: 19 },

    { startJoint: 21, endJoint: 22 },
    { startJoint: 22, endJoint: 23 },
    { startJoint: 23, endJoint: 24 },

    { startJoint: 6, endJoint: 11 },
    { startJoint: 11, endJoint: 16 },
    { startJoint: 16, endJoint: 21 },

    { startJoint: 0, endJoint: 1 },
    { startJoint: 0, endJoint: 20 },
    { startJoint: 1, endJoint: 2 },
    { startJoint: 1, endJoint: 6 },

    { startJoint: 20, endJoint: 1 },
    { startJoint: 20, endJoint: 21 },

];


onMounted(() => {
    _listener();
    _initScene();
    animate();
    if ('XRHand' in window) {
        // XRHand tersedia
        console.log("XRHand tersedia");
    } else {
        console.error("XRHand tidak tersedia di lingkungan ini.");
    }

    initHands();
});

function _listener() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('click', onMouseClick, false);
}

function _initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x505050);

    // Light
    scene.add(new THREE.HemisphereLight(0xa5a5a5, 0x898989, 3));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    // Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.set(0, 1, 3);

    // Room
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

    // Add VR controllers
    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);
    scene.add(controller1);
    scene.add(controller2);

    // Controls orbit
    controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 1.6, 0);
    controls.target = new THREE.Vector3(0, 1.2, -1);
    controls.update();
}

function animate() {
    renderer.setAnimationLoop(function (time, frame) {
        if (frame != null && xrRefSpace != null) {
            updateInputSources(renderer.xr.getSession(), frame, xrRefSpace);

            cube.geometry.computeBoundingBox();
            var sphereBBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
            sphereBBox.setFromObject(cube);

            if (grabCheck(boxes.left)) {
                if (sphereBBox.containsPoint(boxes.left[XRHand.INDEX_PHALANX_TIP].mesh.position)) {
                    if (offsetLeft === null) {
                        offsetLeft = new THREE.Vector3().subVectors(boxes.left[XRHand.INDEX_PHALANX_TIP].mesh.position, cube.position);
                    }
                    cube.position.set(boxes.left[XRHand.INDEX_PHALANX_TIP].mesh.position.x - offsetLeft.x, boxes.left[XRHand.INDEX_PHALANX_TIP].mesh.position.y - offsetLeft.y, boxes.left[XRHand.INDEX_PHALANX_TIP].mesh.position.z - offsetLeft.z);
                }
            } else {
                offsetLeft = null;
            }
            if (grabCheck(boxes.right)) {
                if (sphereBBox.containsPoint(boxes.right[8].mesh.position)) {
                    if (offsetRight === null) {
                        offsetRight = new THREE.Vector3().subVectors(boxes.right[XRHand.INDEX_PHALANX_TIP].mesh.position, cube.position);
                    }
                    cube.position.set(boxes.right[XRHand.INDEX_PHALANX_TIP].mesh.position.x - offsetRight.x, boxes.right[XRHand.INDEX_PHALANX_TIP].mesh.position.y - offsetRight.y, boxes.right[XRHand.INDEX_PHALANX_TIP].mesh.position.z - offsetRight.z);
                }
            } else {
                offsetRight = null;
            }
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
    }
}

function addBox(x, y, z, box_list, offset) {
    var geometry = new THREE.SphereGeometry(1, 16, 16);
    var material = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.8,
        metalness: 0.4
    });
    material.color.setRGB(0, 0.1, 1.0);
    var cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    box_list.push({
        mesh: cube,
        position: [x, y, z],
        offset: offset
    });
}

function addBone(startJoint, endJoint, box_list) {
    var cylindergeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.1, 16);
    var cylindermaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.4
    });
    var cylinder = new THREE.Mesh(cylindergeometry, cylindermaterial);
    box_list.push({
        mesh: cylinder,
        startJoint,
        endJoint
    });
}

var updateCylinderMesh = function (mesh, vstart, vend) {

    var HALF_PI = Math.PI * .5;
    var distance = vstart.distanceTo(vend);
    var position = vend.clone().add(vstart).divideScalar(2);
    mesh.geometry.dispose();
    // TODO: creating a new geometry every frame is very bad for the performance
    mesh.geometry = new THREE.CylinderBufferGeometry(0.006, 0.006, distance, 16);

    var orientation = new THREE.Matrix4();//a new orientation matrix to offset pivot
    var offsetRotation = new THREE.Matrix4();//a matrix to fix pivot rotation
    var offsetPosition = new THREE.Matrix4();//a matrix to fix pivot position
    orientation.lookAt(vstart, vend, new THREE.Vector3(0, 1, 0));//look at destination
    offsetRotation.makeRotationX(HALF_PI);//rotate 90 degs on X
    orientation.multiply(offsetRotation);//combine orientation with rotation transformations
    mesh.geometry.applyMatrix4(orientation)
    mesh.position.copy(position);
}

function initHands() {
    for (const box of boxes_left) {
        scene.remove(box.mesh);
    }
    for (const box of boxes_right) {
        scene.remove(box.mesh);
    }
    for (const bone of bones_left) {
        scene.remove(bone.mesh);
    }
    for (const bone of bones_right) {
        scene.remove(bone.mesh);
    }
    boxes_left = [];
    bones_left = [];
    boxes_right = [];
    bones_right = [];
    // skeleton for hands
    boxes = { left: boxes_left, right: boxes_right, leftBones: bones_left, rightBones: bones_right };
    if (XRHand) {
        for (let i = 0; i <= XRHand.LITTLE_PHALANX_TIP; i++) {
            addBox(0, 0, 0, boxes_left, i);
            addBox(0, 0, 0, boxes_right, i);
        }
        for (const connection of jointConnections) {
            addBone(connection.startJoint, connection.endJoint, bones_left);
            addBone(connection.startJoint, connection.endJoint, bones_right);
        }
    }
}

function updateInputSources(session, frame, refSpace) {
    for (let inputSource of session.inputSources) {
        if (!inputSource.hand) {
            continue;
        } else {
            let visible = false;
            for (const box of boxes[inputSource.handedness]) {
                let jointPose = null;
                if (inputSource.hand[box.offset] !== null) {
                    jointPose = frame.getJointPose(inputSource.hand[box.offset], refSpace);
                }
                if (jointPose !== null) {
                    visible = true;
                    scene.add(box.mesh);
                    box.mesh.position.set(jointPose.transform.position.x, jointPose.transform.position.y + 1.5, jointPose.transform.position.z);
                    const q = new THREE.Quaternion(jointPose.transform.orientation.x, jointPose.transform.orientation.y, jointPose.transform.orientation.z, jointPose.transform.orientation.w);
                    box.mesh.quaternion.copy(q);
                    const radius = 0.008;
                    box.mesh.scale.set(radius, radius, radius);
                } else {
                    scene.remove(box.mesh);
                }
            }
            if (visible) {
                for (const bone of boxes.leftBones) {
                    scene.add(bone.mesh);
                    updateCylinderMesh(bone.mesh, boxes.left[bone.startJoint].mesh.position, boxes.left[bone.endJoint].mesh.position);
                }
                for (const bone of boxes.rightBones) {
                    scene.add(bone.mesh);
                    updateCylinderMesh(bone.mesh, boxes.right[bone.startJoint].mesh.position, boxes.right[bone.endJoint].mesh.position);
                }
            } else {
                for (const bone of boxes.leftBones) {
                    scene.remove(bone.mesh);
                }
                for (const bone of boxes.rightBones) {
                    scene.remove(bone.mesh);
                }
            }
        }
    }
}

function grabCheck(hand) {
    const indexTip = hand[XRHand.INDEX_PHALANX_TIP].mesh;
    const thumbTip = hand[XRHand.THUMB_PHALANX_TIP].mesh;
    const distance = indexTip.position.distanceTo(thumbTip.position);
    return distance < 0.01;
}

let offsetLeft = null;
let offsetRight = null;


</script>

<template>
    <div ref="Container"></div>
</template>
