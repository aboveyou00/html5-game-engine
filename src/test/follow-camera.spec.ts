/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { Camera } from '../camera';
import { FollowCamera } from '../follow-camera';
import { Game } from '../game';
import { GameScene } from '../game-scene';
import { GameObject } from '../game-object';
import { GraphicsAdapter } from '../graphics/graphics-adapter';

describe('FollowCamera', () => {
    let camera: FollowCamera;
    beforeEach(() => {
        camera = new FollowCamera();
    });
    
    describe('.followOffset', () => {
        it('should start as [0, 0]', () => {
            expect(camera.followOffset).to.deep.eq([0, 0]);
        });
        it('should return an array that does not change the follow offset when changed', () => {
            let offset = camera.followOffset;
            offset[0] = NaN;
            expect(camera.followOffset[0]).not.to.be.NaN;
        });
    });
    describe('.followOffset=', () => {
        it('should copy the values to prevent further changes to the object modifying the follow offset', () => {
            let newOffset: [number, number] = [25, 92];
            camera.followOffset = newOffset;
            newOffset[0] = NaN;
            expect(camera.followOffset).to.deep.eq([25, 92]);
        });
    });
    
    describe('.renderTransformed', () => {
        let adapter: GraphicsAdapter;
        let superStub: sinon.SinonStub;
        beforeEach(() => {
            adapter = <any>{ canvasSize: [640, 480] };
            superStub = sinon.stub(Camera.prototype, 'renderTransformed');;
        });
        afterEach(() => {
            superStub.restore();
        });
        
        it('should call the base class implementation', () => {
            camera.renderTransformed(adapter, () => void(0));
            expect(Camera.prototype.renderTransformed).to.have.been.calledOnce;
        });
        it('should not modify the camera position if there is no follow object', () => {
            camera.center = [128, 256];
            camera.renderTransformed(adapter, () => void(0));
            expect(camera.center).to.deep.eq([128, 256]);
        });
        it('should center the camera at the follow object if it exists', () => {
            camera.center = [128, 256];
            let gobj = new GameObject({ x: 500, y: 1000 });
            camera.follow = gobj;
            camera.renderTransformed(adapter, () => void(0));
            expect(camera.center).to.deep.eq([500, 1000]);
        });
        it('should should offset the camera by followOffset', () => {
            camera.center = [128, 256];
            camera.followOffset = [50, 25];
            let gobj = new GameObject({ x: 500, y: 1000 });
            camera.follow = gobj;
            camera.renderTransformed(adapter, () => void(0));
            expect(camera.center).to.deep.eq([550, 1025]);
        });
    });
});
