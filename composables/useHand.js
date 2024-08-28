import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { OculusHandModel } from 'three/addons/webxr/OculusHandModel.js';
import { OculusHandPointerModel } from 'three/addons/webxr/OculusHandPointerModel.js';
import * as THREE from 'three';
import { World, System, Component, TagComponent, Types } from 'three/addons/libs/ecsy.module.js';

let world, clock;
export const useHand = (renderer, scene, camera) => {
    clock = new THREE.Clock();

    const left = createHand(scene, renderer, camera, 0);
    const right = createHand(scene, renderer, camera, 1);
    return {
        left,
        right,
        objectEntity,
        update
    }
}

const createHand = (scene, renderer, camera, index) => {
    const controllerModelFactory = new XRControllerModelFactory();

    const controller1 = renderer.xr.getController(0);
    scene.add(controller1);
    const controller2 = renderer.xr.getController(1);
    scene.add(controller2);

    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);
    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    const left = renderer.xr.getHand(0);
    left.add(new OculusHandModel(hand));
    const handPointer1 = new OculusHandPointerModel(left, controller1);
    left.add(handPointer1);

    const right = renderer.xr.getHand(0);
    right.add(new OculusHandModel(hand));
    const handPointer2 = new OculusHandPointerModel(right, controller2);
    right.add(handPointer2);


    register(controllerGrip1, controllerGrip2, handPointer1, handPointer2, renderer, camera)

    scene.add(left);
    scene.add(right);
}

const update = (renderer, camera) => {
    const delta = clock.getDelta();
    const elapsedTime = clock.elapsedTime;
    world.execute(delta, elapsedTime);
    renderer.xr.updateCamera(camera);
}

const register = (controllerGrip1, controllerGrip2, handPointer1, handPointer2, renderer, camera) => {
    world = new World();

    world
        .registerComponent(Object3D)
        .registerComponent(Button)
        .registerComponent(Intersectable)
        .registerComponent(HandsInstructionText)
        .registerComponent(OffsetFromCamera)
        .registerComponent(NeedCalibration)
        .registerComponent(Randomizable)
        .registerComponent(Draggable);

    world
        .registerSystem(RandomizerSystem)
        .registerSystem(InstructionSystem, { controllers: [controllerGrip1, controllerGrip2] })
        .registerSystem(CalibrationSystem, { renderer: renderer, camera: camera })
        .registerSystem(ButtonSystem)
        .registerSystem(DraggableSystem)
        .registerSystem(HandRaySystem, { handPointers: [handPointer1, handPointer2] });
}

const objectEntity = (object) => {
    const entity = world.createEntity();
    entity.addComponent(Intersectable);
    entity.addComponent(Randomizable);
    entity.addComponent(Object3D, { object: object });
    entity.addComponent(Draggable);
}


// class
class Object3D extends Component { }
Object3D.schema = {
    object: {
        type: Types.Ref
    }
}


class Button extends Component { }
Button.schema = {
    currState: { type: Types.String, default: 'none' },
    prevState: { type: Types.String, default: 'none' },
    action: { type: Types.Ref, default: () => { } }
}

class ButtonSystem extends System {
    execute( /*delta, time*/) {

        this.queries.buttons.results.forEach(entity => {

            const button = entity.getMutableComponent(Button);
            const buttonMesh = entity.getComponent(Object3D).object;
            if (button.currState == 'none') {

                buttonMesh.scale.set(1, 1, 1);

            } else {

                buttonMesh.scale.set(1.1, 1.1, 1.1);

            }

            if (button.currState == 'pressed' && button.prevState != 'pressed') {

                button.action();

            }
            button.prevState = button.currState;
            button.currState = 'none';

        });
    }
}

ButtonSystem.queries = {
    buttons: {
        components: [Button]
    }
};

class Draggable extends Component { }

Draggable.schema = {
    state: { type: Types.String, default: 'none' },
    originalParent: { type: Types.Ref, default: null },
    attachedPointer: { type: Types.Ref, default: null }
};

class DraggableSystem extends System {

    execute( /*delta, time*/) {

        this.queries.draggable.results.forEach(entity => {

            const draggable = entity.getMutableComponent(Draggable);
            const object = entity.getComponent(Object3D).object;
            if (draggable.originalParent == null) {

                draggable.originalParent = object.parent;

            }

            switch (draggable.state) {

                case 'to-be-attached':
                    draggable.attachedPointer.children[0].attach(object);
                    draggable.state = 'attached';
                    break;
                case 'to-be-detached':
                    draggable.originalParent.attach(object);
                    draggable.state = 'detached';
                    break;
                default:
                    object.scale.set(1, 1, 1);

            }

        });

    }

}

DraggableSystem.queries = {
    draggable: {
        components: [Draggable]
    }
};

class Intersectable extends TagComponent { }

class HandRaySystem extends System {

    init(attributes) {

        this.handPointers = attributes.handPointers;

    }

    execute( /*delta, time*/) {

        this.handPointers.forEach(hp => {

            let distance = null;
            let intersectingEntity = null;
            this.queries.intersectable.results.forEach(entity => {

                const object = entity.getComponent(Object3D).object;
                const intersections = hp.intersectObject(object, false);
                if (intersections && intersections.length > 0) {

                    if (distance == null || intersections[0].distance < distance) {

                        distance = intersections[0].distance;
                        intersectingEntity = entity;

                    }

                }

            });
            if (distance) {

                hp.setCursor(distance);
                if (intersectingEntity.hasComponent(Button)) {

                    const button = intersectingEntity.getMutableComponent(Button);
                    if (hp.isPinched()) {

                        button.currState = 'pressed';

                    } else if (button.currState != 'pressed') {

                        button.currState = 'hovered';

                    }

                }

                if (intersectingEntity.hasComponent(Draggable)) {

                    const draggable = intersectingEntity.getMutableComponent(Draggable);
                    const object = intersectingEntity.getComponent(Object3D).object;
                    object.scale.set(1.1, 1.1, 1.1);
                    if (hp.isPinched()) {

                        if (!hp.isAttached() && draggable.state != 'attached') {

                            draggable.state = 'to-be-attached';
                            draggable.attachedPointer = hp;
                            hp.setAttached(true);

                        }

                    } else {

                        if (hp.isAttached() && draggable.state == 'attached') {

                            console.log('hello');
                            draggable.state = 'to-be-detached';
                            draggable.attachedPointer = null;
                            hp.setAttached(false);

                        }

                    }

                }

            } else {

                hp.setCursor(1.5);

            }

        });

    }

}

HandRaySystem.queries = {
    intersectable: {
        components: [Intersectable]
    }
};

class HandsInstructionText extends TagComponent { }
class InstructionSystem extends System {

    init(attributes) {

        this.controllers = attributes.controllers;

    }

    execute( /*delta, time*/) {

        let visible = false;
        this.controllers.forEach(controller => {

            if (controller.visible) {

                visible = true;

            }

        });

        this.queries.instructionTexts.results.forEach(entity => {

            const object = entity.getComponent(Object3D).object;
            object.visible = visible;

        });

    }

}
InstructionSystem.queries = {
    instructionTexts: {
        components: [HandsInstructionText]
    }
};

class OffsetFromCamera extends Component { }

OffsetFromCamera.schema = {
    x: { type: Types.Number, default: 0 },
    y: { type: Types.Number, default: 0 },
    z: { type: Types.Number, default: 0 },
};

class NeedCalibration extends TagComponent { }
class CalibrationSystem extends System {

    init(attributes) {

        this.camera = attributes.camera;
        this.renderer = attributes.renderer;

    }

    execute( /*delta, time*/) {

        this.queries.needCalibration.results.forEach(entity => {

            if (this.renderer.xr.getSession()) {

                const offset = entity.getComponent(OffsetFromCamera);
                const object = entity.getComponent(Object3D).object;
                const xrCamera = this.renderer.xr.getCamera();
                object.position.x = xrCamera.position.x + offset.x;
                object.position.y = xrCamera.position.y + offset.y;
                object.position.z = xrCamera.position.z + offset.z;
                entity.removeComponent(NeedCalibration);

            }

        });

    }

}
CalibrationSystem.queries = {
    needCalibration: {
        components: [NeedCalibration]
    }
};

class Randomizable extends TagComponent { }
class RandomizerSystem extends System {

    init( /*attributes*/) {

        this.needRandomizing = true;

    }

    execute( /*delta, time*/) {

        if (!this.needRandomizing) {

            return;

        }

        this.queries.randomizable.results.forEach(entity => {

            const object = entity.getComponent(Object3D).object;

            object.material.color.setHex(Math.random() * 0xffffff);

            object.position.x = Math.random() * 2 - 1;
            object.position.y = Math.random() * 2;
            object.position.z = Math.random() * 2 - 1;

            object.rotation.x = Math.random() * 2 * Math.PI;
            object.rotation.y = Math.random() * 2 * Math.PI;
            object.rotation.z = Math.random() * 2 * Math.PI;

            object.scale.x = Math.random() + 0.5;
            object.scale.y = Math.random() + 0.5;
            object.scale.z = Math.random() + 0.5;
            this.needRandomizing = false;

        });

    }

}
RandomizerSystem.queries = {
    randomizable: {
        components: [Randomizable]
    }
};