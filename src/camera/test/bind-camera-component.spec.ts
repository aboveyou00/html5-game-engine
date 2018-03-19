/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { Camera } from '../camera';
import { BindCameraComponent } from '../bind-camera-component';
import { Component } from '../../component';
import { Game } from '../../game';
import { GameScene } from '../../game-scene';
import { GameObject } from '../../game-object';
import { GraphicsAdapter } from '../../graphics/graphics-adapter';
import { MockGame } from '../../test/mock-game';

describe('BindCameraComponent', () => {
    let camera: Camera;
    let game: Game;
    let scene: GameScene;
    let gobj: GameObject;
    let bindCamera: BindCameraComponent;
    beforeEach(() => {
        camera = new Camera();
        bindCamera = new BindCameraComponent({ camera: camera });
        gobj = new GameObject();
        gobj.addComponent(bindCamera);
        game = <Game><any>new MockGame(scene = new GameScene());
        scene.addObject(gobj);
    });
    
    describe('.offset', () => {
        it('should start as [0, 0]', () => {
            expect(bindCamera.offset).to.deep.eq([0, 0]);
        });
        it('should return an array that does not change the follow offset when changed', () => {
            let offset = bindCamera.offset;
            offset[0] = NaN;
            expect(bindCamera.offset[0]).not.to.be.NaN;
        });
    });
    describe('.offset=', () => {
        it('should copy the values to prevent further changes to the object modifying the follow offset', () => {
            let newOffset: [number, number] = [25, 92];
            bindCamera.offset = newOffset;
            newOffset[0] = NaN;
            expect(bindCamera.offset).to.deep.eq([25, 92]);
        });
    });
    
    describe('.tick', () => {
        let superStub: sinon.SinonStub;
        beforeEach(() => {
            superStub = sinon.stub(Component.prototype, 'tick');;
        });
        afterEach(() => {
            superStub.restore();
        });
        
        it('should call the base class implementation', () => {
            bindCamera.tick(.05);
            expect(Component.prototype.tick).to.have.been.calledOnce;
        });
        describe('when there is no camera specified', () => {
            it('should not fail if there is no camera specified', () => {
                bindCamera.camera = null;
                expect(() => bindCamera.tick(.05)).not.to.throw;
            });
        });
        describe('when there is a camera specified', () => {
            it(`should center the camera at the component's game object`, () => {
                camera.center = [128, 256];
                gobj.x = 500;
                gobj.y = 1000;
                bindCamera.tick(.05);
                expect(camera.center).to.deep.eq([500, 1000]);
            });
            it('should should offset the camera by followOffset', () => {
                camera.center = [128, 256];
                bindCamera.offset = [50, 25];
                gobj.x = 500;
                gobj.y = 1000;
                bindCamera.tick(.05);
                expect(camera.center).to.deep.eq([550, 1025]);
            });
        });
    });
});
