import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { OculusHandModel } from 'three/addons/webxr/OculusHandModel.js';
import { OculusHandPointerModel } from 'three/addons/webxr/OculusHandPointerModel.js';
import * as THREE from 'three';

export const useHand = () => {

    let intersectedObject = null;
    let isDragging = false;
    let initialPosition = new THREE.Vector3();
    let dragOffset = new THREE.Vector3();

    function _hand(scene, renderer, controller1, controller2) {
        const controllerModelFactory = new XRControllerModelFactory();

        // Hand 1
        const controllerGrip1 = renderer.xr.getControllerGrip(0);
        controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
        scene.add(controllerGrip1);

        const hand1 = renderer.xr.getHand(0);
        hand1.add(new OculusHandModel(hand1));
        const handPointer1 = new OculusHandPointerModel(hand1, controller1);
        hand1.add(handPointer1);

        scene.add(hand1);

        // Hand 2
        const controllerGrip2 = renderer.xr.getControllerGrip(1);
        controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
        scene.add(controllerGrip2);

        const hand2 = renderer.xr.getHand(1);
        hand2.add(new OculusHandModel(hand2));
        const handPointer2 = new OculusHandPointerModel(hand2, controller2);
        hand2.add(handPointer2);
        scene.add(hand2);

        controller1.addEventListener('selectstart', _selectStart);
        controller1.addEventListener('selectend', _selectEnd);
        controller2.addEventListener('selectstart', _selectStart);
        controller2.addEventListener('selectend', _selectEnd);

    }

    function _selectStart(event) {
        isDragging = true;
        if (intersectedObject) {
            intersectedObject.updateMatrixWorld();
            const intersection = raycaster.intersectObject(intersectedObject)[0];
            initialPosition.copy(intersectedObject.position);
            dragOffset.subVectors(intersection.point, intersectedObject.position);
        }
    }

    function _selectEnd(event) {
        isDragging = false;
        intersectedObject = null;
    }

    function update(scene, raycaster, controller1, controller2) {
        // Update raycaster with controller1 position
        raycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(controller1.matrixWorld);

        // Raycast to detect intersected objects with controller1
        const intersects1 = raycaster.intersectObjects(scene.children);

        // Update raycaster with controller2 position
        raycaster.ray.origin.setFromMatrixPosition(controller2.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(controller2.matrixWorld);

        // Raycast to detect intersected objects with controller2
        const intersects2 = raycaster.intersectObjects(scene.children);

        // Handle intersections with controller1
        if (intersects1.length > 0) {
            intersectedObject = intersects1[0].object;
        }

        // Handle intersections with controller2
        if (intersects2.length > 0) {
            intersectedObject = intersects2[0].object;
        }

        // Update object position if dragging
        if (isDragging && intersectedObject) {
            const intersection = raycaster.intersectObject(intersectedObject)[0];
            intersectedObject.position.copy(intersection.point).add(dragOffset);
        }
    }

    return {
        _hand,
        update,
        intersectedObject,
        isDragging,
        initialPosition,
        dragOffset
    }
}
