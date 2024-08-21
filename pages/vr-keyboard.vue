<script setup>
import * as THREE from 'three';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import * as ThreeMeshUI from 'three-mesh-ui';
import Backspace from 'three-mesh-ui/examples/assets/backspace.png';
import Enter from 'three-mesh-ui/examples/assets/enter.png';
import Shift from 'three-mesh-ui/examples/assets/shift.png';
import VRControl from '../assets/js/VRControl';
import { onMounted, ref } from 'vue';

const Container = ref(null);

let scene, renderer, camera, controls;
let room, intersectionRoom;
let raycaster, userText, currentLayoutButton, keyboard, layoutOptions, mouse, vrControl, selectState, touchState;

let isShiftActive = false;

const objsToTest = [];
const colors = {
    keyboardBack: 0x858585,
    panelBack: 0x262626,
    button: 0x363636,
    hovered: 0x1c1c1c,
    selected: 0x109c5d
};
raycaster = new THREE.Raycaster();

onMounted(() => {
    mouse = new THREE.Vector2();
    mouse.x = mouse.y = null;

    selectState = false;
    touchState = false;


    window.addEventListener('pointermove', (event) => {

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    });

    window.addEventListener('pointerdown', () => {

        selectState = true;

    });

    window.addEventListener('pointerup', () => {

        selectState = false;

    });

    window.addEventListener('touchstart', (event) => {

        touchState = true;
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;

    });

    window.addEventListener('touchend', () => {

        touchState = false;
        mouse.x = null;
        mouse.y = null;

    });

    //

    window.addEventListener('load', _initScene);
    window.addEventListener('resize', onWindowResize);

    _initScene();
    animate();
});

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
    intersectionRoom = new THREE.Mesh(
        new THREE.BoxGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
        new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
            transparent: true,
            opacity: 0
        })
    );
    scene.add(room, intersectionRoom);
    objsToTest.push(intersectionRoom);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    // VR
    Container.value.appendChild(renderer.domElement);
    Container.value.appendChild(VRButton.createButton(renderer));
    // Memanggil VRControl untuk mendapatkan kontroler dan grip
    vrControl = VRControl(renderer);

    // Menambahkan kontroler grip dan kontroler ke scene
    if (vrControl.controllerGrips.length > 0) {
        scene.add(vrControl.controllerGrips[0]);
    }
    if (vrControl.controllers.length > 0) {
        scene.add(vrControl.controllers[0]);
    }

    // Menambahkan event listener untuk kontroler
    if (vrControl.controllers[0]) {
        vrControl.controllers[0].addEventListener('selectstart', () => {
            selectState = true;
        });
        vrControl.controllers[0].addEventListener('selectend', () => {
            selectState = false;
        });
    }


    // Controls orbit
    controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 1.6, 0);
    controls.target = new THREE.Vector3(0, 1.2, -1);
    controls.update();

    makeUI();
}

function animate() {
    renderer.setAnimationLoop(() => {
        updateButtons();
        renderer.render(scene, camera);
        ThreeMeshUI.update();
    });
}

function updateButtons() {
    let intersect;

    if (renderer.xr.isPresenting) {
        vrControl.setFromController(0, raycaster.ray);
        intersect = raycast();
        if (intersect) vrControl.setPointerAt(0, intersect.point);
    } else if (mouse.x !== null && mouse.y !== null) {
        raycaster.setFromCamera(mouse, camera);
        intersect = raycast();
    }

    if (intersect && intersect.object.isUI) {
        if ((selectState && intersect.object.currentState === 'hovered') || touchState) {
            if (intersect.object.states['selected']) intersect.object.setState('selected');
        } else if (!selectState && !touchState) {
            if (intersect.object.states['hovered']) intersect.object.setState('hovered');
        }
    }

    objsToTest.forEach((obj) => {
        if ((!intersect || obj !== intersect.object) && obj.isUI) {
            if (obj.states['idle']) obj.setState('idle');
        }
    });
}


function raycast() {

    return objsToTest.reduce((closestIntersection, obj) => {

        // keys in panels that are hidden are not tested
        if (!layoutOptions.getObjectById(obj.id) &&
            !keyboard.getObjectById(obj.id) &&
            intersectionRoom !== obj
        ) {

            return closestIntersection;

        }

        const intersection = raycaster.intersectObject(obj, true);

        // if intersection is an empty array, we skip
        if (!intersection[0]) return closestIntersection;

        // if this intersection is closer than any previous intersection, we keep it
        if (!closestIntersection || intersection[0].distance < closestIntersection.distance) {

            // Make sure to return the UI object, and not one of its children (text, frame...)
            intersection[0].object = obj;

            return intersection[0];

        }

        return closestIntersection;

    }, null);

}

function clear(uiComponent) {

    scene.remove(uiComponent);

    // We must call this method when removing a component,
    // to make sure it's removed from the update registry.
    uiComponent.clear();

    uiComponent.traverse((child) => {

        if (objsToTest.includes(child)) objsToTest.splice(objsToTest.indexOf(child), 1);

    });

}

function makeUI() {
    const container = new THREE.Group();
    container.position.set(0, 1.4, -1.2);
    container.rotation.x = -0.15;
    scene.add(container);

    const textPanel = new ThreeMeshUI.Block({
        fontFamily: '/fonts/Roboto-msdf.json',
        fontTexture: '/fonts/Roboto-msdf.png',
        width: 1,
        height: 0.35,
        backgroundColor: new THREE.Color(colors.panelBack),
        backgroundOpacity: 1
    });

    textPanel.position.set(0, -0.15, 0);
    container.add(textPanel);

    const title = new ThreeMeshUI.Block({
        width: 1,
        height: 0.1,
        justifyContent: 'center',
        fontSize: 0.045,
        backgroundOpacity: 0
    }).add(
        new ThreeMeshUI.Text({ content: 'Type some text on the keyboard' })
    );

    userText = new ThreeMeshUI.Text({ content: '' });

    const textField = new ThreeMeshUI.Block({
        width: 1,
        height: 0.4,
        fontSize: 0.033,
        padding: 0.02,
        backgroundOpacity: 0
    }).add(userText);

    textPanel.add(title, textField);

    let layoutButtons = [
        ['English', 'eng'],
        ['Nordic', 'nord'],
        ['German', 'de'],
        ['Spanish', 'es'],
        ['French', 'fr'],
        ['Russian', 'ru'],
        ['Greek', 'el']
    ];
    layoutButtons = layoutButtons.map((options) => {

        const button = new ThreeMeshUI.Block({
            height: 0.06,
            width: 0.2,
            margin: 0.012,
            justifyContent: 'center',
            backgroundColor: new THREE.Color(colors.button),
            backgroundOpacity: 1
        }).add(
            new ThreeMeshUI.Text({
                offset: 0,
                fontSize: 0.035,
                content: options[0]
            })
        );

        button.setupState({
            state: 'idle',
            attributes: {
                offset: 0.02,
                backgroundColor: new THREE.Color(colors.button),
                backgroundOpacity: 1
            }
        });

        button.setupState({
            state: 'hovered',
            attributes: {
                offset: 0.02,
                backgroundColor: new THREE.Color(colors.hovered),
                backgroundOpacity: 1
            }
        });

        button.setupState({
            state: 'selected',
            attributes: {
                offset: 0.01,
                backgroundColor: new THREE.Color(colors.selected),
                backgroundOpacity: 1
            },
            onSet: () => {

                // enable intersection checking for the previous layout button,
                // then disable it for the current button

                if (currentLayoutButton) objsToTest.push(currentLayoutButton);

                if (keyboard) {

                    clear(keyboard);

                    keyboard.panels.forEach(panel => clear(panel));

                }

                currentLayoutButton = button;

                makeKeyboard(options[1]);

            }

        });

        objsToTest.push(button);

        // Set English button as selected from the start

        if (options[1] === 'eng') {

            button.setState('selected');

            currentLayoutButton = button;

        }

        return button;

    });

    layoutOptions = new ThreeMeshUI.Block({
        fontFamily: '/fonts/Roboto-msdf.json',
        fontTexture: '/fonts/Roboto-msdf.png',
        height: 0.25,
        width: 1,
        offset: 0,
        backgroundColor: new THREE.Color(colors.panelBack),
        backgroundOpacity: 1
    }).add(
        new ThreeMeshUI.Block({
            height: 0.1,
            width: 0.6,
            offset: 0,
            justifyContent: 'center',
            backgroundOpacity: 0
        }).add(
            new ThreeMeshUI.Text({
                fontSize: 0.04,
                content: 'Select a keyboard layout :'
            })
        ),

        new ThreeMeshUI.Block({
            height: 0.075,
            width: 1,
            offset: 0,
            contentDirection: 'row',
            justifyContent: 'center',
            backgroundOpacity: 0
        }).add(
            layoutButtons[0],
            layoutButtons[1],
            layoutButtons[2],
            layoutButtons[3]
        ),

        new ThreeMeshUI.Block({
            height: 0.075,
            width: 1,
            offset: 0,
            contentDirection: 'row',
            justifyContent: 'center',
            backgroundOpacity: 0
        }).add(
            layoutButtons[4],
            layoutButtons[5],
            layoutButtons[6]
        )
    );

    layoutOptions.position.set(0, 0.2, 0);
    container.add(layoutOptions);
    objsToTest.push(layoutOptions);
}

function makeKeyboard(language) {

    keyboard = new ThreeMeshUI.Keyboard({
        language: language,
        fontFamily: '/fonts/Roboto-msdf.json',
        fontTexture: '/fonts/Roboto-msdf.png',
        fontSize: 0.035, // fontSize will propagate to the keys blocks
        backgroundColor: new THREE.Color(colors.keyboardBack),
        backgroundOpacity: 1,
        backspaceTexture: Backspace,
        shiftTexture: Shift,
        enterTexture: Enter
    });

    keyboard.position.set(0, 0.88, -1);
    keyboard.rotation.x = -0.55;
    scene.add(keyboard);

    //

    keyboard.keys.forEach((key) => {
        objsToTest.push(key);

        key.setupState({
            state: 'idle',
            attributes: {
                offset: 0,
                backgroundColor: new THREE.Color(colors.button),
                backgroundOpacity: 1
            }
        });

        key.setupState({
            state: 'hovered',
            attributes: {
                offset: 0,
                backgroundColor: new THREE.Color(colors.hovered),
                backgroundOpacity: 1
            }
        });

        key.setupState({
            state: 'selected',
            attributes: {
                offset: -0.009,
                backgroundColor: new THREE.Color(colors.selected),
                backgroundOpacity: 1
            },
            // triggered when the user clicked on a keyboard's key
            onSet: () => {

                // if the key have a command (eg: 'backspace', 'switch', 'enter'...)
                // special actions are taken
                if (key.info.command) {

                    switch (key.info.command) {

                        // switch between panels
                        case 'switch':
                            keyboard.setNextPanel();
                            break;

                        // switch between panel charsets (eg: russian/english)
                        case 'switch-set':
                            keyboard.setNextCharset();
                            break;

                        case 'enter':
                            userText.set({ content: userText.content + '\n' });
                            break;

                        case 'space':
                            userText.set({ content: userText.content + ' ' });
                            break;

                        case 'backspace':
                            if (!userText.content.length) break;
                            userText.set({
                                content: userText.content.substring(0, userText.content.length - 1) || ''
                            });
                            break;

                        case 'shift':
                            isShiftActive = !isShiftActive; // Toggle Shift state
                            keyboard.keys.forEach((key) => {
                                key.info.input = isShiftActive ? key.info.input.toUpperCase() : key.info.input.toLowerCase();
                            });
                            break;

                    }

                    // print a glyph, if any
                } else if (key.info.input) {

                    userText.set({ content: userText.content + key.info.input });

                }

            }
        });

    });

}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}

</script>

<template>
    <div ref="Container"></div>
</template>
