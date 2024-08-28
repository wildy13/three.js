import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const useTemplate = () => {
    let initScene, initRenderer, initCamera, initControls;
    let initRoom;
    let initRaycaster;

    // raycaster

    initRaycaster = new THREE.Raycaster();

    // Scene
    initScene = new THREE.Scene();
    initScene.background = new THREE.Color(0x505050);

    // Cahaya
    initScene.add(new THREE.HemisphereLight(0xa5a5a5, 0x898989, 3));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(1, 1, 1).normalize();
    initScene.add(light);

    // Kamera
    initCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    initCamera.position.set(0, 1, 3);

    // Ruangan
    initRoom = new THREE.LineSegments(
        new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
        new THREE.LineBasicMaterial({ color: 0xbcbcbc })
    );
    initScene.add(initRoom);

    // Renderer
    initRenderer = new THREE.WebGLRenderer({ antialias: true });
    initRenderer.setPixelRatio(window.devicePixelRatio);
    initRenderer.setSize(window.innerWidth, window.innerHeight);
    initRenderer.xr.enabled = true;

    // Kontrol orbit
    initControls = new OrbitControls(initCamera, initRenderer.domElement);
    initControls.target = new THREE.Vector3(0, 1.2, -1);
    initControls.update();


    function _create(Container) {
        // VR
        const sessionInit = {
            requiredFeatures: ['hand-tracking']
        };

        Container.appendChild(initRenderer.domElement);
        Container.appendChild(VRButton.createButton(initRenderer, sessionInit));
    }


    return {
        _create,
        initScene,
        initRenderer,
        initCamera,
        initControls,
        initRoom,
        initRaycaster,
    }
}