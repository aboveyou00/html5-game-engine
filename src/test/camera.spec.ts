﻿/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { Camera } from '../camera';
import { GraphicsAdapter } from '../graphics/graphics-adapter';
import { Context2dGraphicsAdapter } from '../graphics/context2d-graphics-adapter';
import { Game } from '../game';

describe('Camera', () => {
    let camera: Camera;
    beforeEach(() => {
        camera = new Camera();
    });
    
    describe('.clearColor', () => {
        it('should start as null', () => {
            expect(camera.clearColor).to.be.null;
        });
    });
    
    describe('.center', () => {
        it('should start as [0, 0]', () => {
            expect(camera.center).to.deep.eq([0, 0]);
        });
        it('should return an array that does not change the center when changed', () => {
            let center = camera.center;
            center[0] = NaN;
            expect(camera.center[0]).not.to.be.NaN;
        });
    });
    describe('.center=', () => {
        it('should copy the values to prevent further changes to the object modifying the center', () => {
            let newCenter: [number, number] = [25, 92];
            camera.center = newCenter;
            newCenter[0] = NaN;
            expect(camera.center).to.deep.eq([25, 92]);
        });
    });
    
    describe('.zoomScale', () => {
        it('should start at 1', () => {
            expect(camera.zoomScale).to.be.closeTo(1, .00001);
        });
    });
    describe('.zoomScale=', () => {
        it('should throw an error if a nonnegative value is passed in', () => {
            expect(() => camera.zoomScale = -25).to.throw(/must be positive/i);
            expect(() => camera.zoomScale = 0).to.throw(/must be positive/i);
        });
        it('should update the zoom scale if a valid value is passed in', () => {
            camera.zoomScale = .5;
            expect(camera.zoomScale).to.be.closeTo(.5, .00001);
        });
        it('should clamp the zoom scale to between the min and max zoom scales', () => {
            camera.zoomScale = .1;
            expect(camera.zoomScale).to.be.closeTo(.25, .00001);
            camera.zoomScale = 5;
            expect(camera.zoomScale).to.be.closeTo(4, .00001);
        });
    });
    
    describe('.minZoomScale', () => {
        it('should start at .25', () => {
            expect(camera.minZoomScale).to.be.closeTo(.25, .00001);
        });
    });
    describe('.minZoomScale=', () => {
        it('should throw an error if a nonnegative value is passed in', () => {
            expect(() => camera.minZoomScale = -25).to.throw(/must be positive/i);
            expect(() => camera.minZoomScale = 0).to.throw(/must be positive/i);
        });
        it('should throw an error if the value passed in is greater than the max zoom scale', () => {
            expect(() => camera.minZoomScale = 5).to.throw(/max zoom scale is less than .*min zoom scale/i);
        });
        it('should not throw an error if the value passed in is the max zoom scale', () => {
            expect(() => camera.minZoomScale = 4).not.to.throw;
        });
        it('should clamp the zoom scale to the new min zoom scale', () => {
            camera.minZoomScale = 2;
            expect(camera.zoomScale).to.be.closeTo(2, .00001);
        });
    });
    
    describe('.maxZoomScale', () => {
        it('should start at 4', () => {
            expect(camera.maxZoomScale).to.be.closeTo(4, .00001);
        });
    });
    describe('.maxZoomScale=', () => {
        it('should throw an error if a nonnegative value is passed in', () => {
            expect(() => camera.maxZoomScale = -25).to.throw(/must be positive/i);
            expect(() => camera.maxZoomScale = 0).to.throw(/must be positive/i);
        });
        it('should throw an error if the value passed in is less than the min zoom scale', () => {
            expect(() => camera.maxZoomScale = .2).to.throw(/min zoom scale is greater than .*max zoom scale/i);
        });
        it('should not throw an error if the value passed in is the max zoom scale', () => {
            expect(() => camera.maxZoomScale = .25).not.to.throw;
        });
        it('should clamp the zoom scale to the new max zoom scale', () => {
            camera.maxZoomScale = .5;
            expect(camera.zoomScale).to.be.closeTo(.5, .00001);
        });
    });
    
    describe('.getBounds', () => {
        it('should be centered around the center position', () => {
            camera.center = [10, -10];
            let canvasSize: [number, number] = [640, 480];
            let bounds = camera.getBounds(canvasSize);
            expect((bounds.right + bounds.left) / 2).to.be.closeTo(camera.center[0], .00001);
            expect((bounds.top + bounds.bottom) / 2).to.be.closeTo(camera.center[1], .00001);
        });
        it('should have the same ratio as the canvas', () => {
            camera.center = [10, -10];
            let canvasSize: [number, number] = [295, 332];
            let canvasRatio = canvasSize[0] / canvasSize[1];
            let bounds = camera.getBounds(canvasSize);
            let [width, height] = [bounds.right - bounds.left, bounds.top - bounds.bottom];
            let cameraRatio = width / height;
            expect(cameraRatio).to.be.closeTo(canvasRatio, .00001);
        });
        it('should be the size of the canvas if zoomScale is 1', () => {
            camera.center = [10, -10];
            let canvasSize: [number, number] = [640, 480];
            let bounds = camera.getBounds(canvasSize);
            expect(bounds.right - bounds.left).to.be.closeTo(canvasSize[0], .00001);
            expect(bounds.top - bounds.bottom).to.be.closeTo(canvasSize[1], .00001);
        });
        it('should be half the size of the canvas if zoomScale is 2', () => {
            camera.center = [10, -10];
            camera.zoomScale = 2;
            let canvasSize: [number, number] = [640, 480];
            let bounds = camera.getBounds(canvasSize);
            expect(bounds.right - bounds.left).to.be.closeTo(canvasSize[0] * .5, .00001);
            expect(bounds.top - bounds.bottom).to.be.closeTo(canvasSize[1] * .5, .00001);
        });
        it('should be twice the size of the canvas if zoomScale is .5', () => {
            camera.center = [10, -10];
            camera.zoomScale = .5;
            let canvasSize: [number, number] = [640, 480];
            let bounds = camera.getBounds(canvasSize);
            expect(bounds.right - bounds.left).to.be.closeTo(canvasSize[0] * 2, .00001);
            expect(bounds.top - bounds.bottom).to.be.closeTo(canvasSize[1] * 2, .00001);
        });
    });
    
    describe('.tick', () => {
        it('should not throw an error', () => {
            expect(() => camera.tick(.02)).not.to.throw;
        });
    });
    
    describe('.clear', () => {
        let adapter: GraphicsAdapter;
        beforeEach(() => {
            adapter = <any>{ clear: () => void(0) };
        });
        
        it('should call adapter.clear', () => {
            sinon.stub(adapter, 'clear');
            camera.clearColor = 'green';
            camera.clear(adapter);
            expect(adapter.clear).to.have.been.calledOnce.calledWith('green');
        });
        it('should not call adapter.clear if the clearColor is null', () => {
            sinon.stub(adapter, 'clear');
            camera.clearColor = null;
            camera.clear(adapter);
            expect(adapter.clear).not.to.have.been.called;
        });
    });
    
    describe('.renderTransformed', () => {
        let canvas: HTMLCanvasElement;
        let context: CanvasRenderingContext2D;
        let adapter: Context2dGraphicsAdapter;
        let game: Game;
        beforeEach(() => {
            canvas = new HTMLCanvasElement();
            adapter = new Context2dGraphicsAdapter(canvas);
            game = new Game({ graphicsAdapter: adapter });
            game.start();
            context = adapter.context!;
        });
        afterEach(() => {
            if (game.isRunning) game.stop();
        });
        
        it('should invoke context.save', () => {
            sinon.stub(context, 'save');
            camera.renderTransformed(adapter, () => void(0));
            expect(context.save).to.have.been.calledOnce;
        });
        it('should translate further draw calls by the camera center position', () => {
            adapter.canvasSize = [0, 0];
            camera.center = [52, 199];
            sinon.stub(context, 'translate');
            camera.renderTransformed(adapter, () => void(0));
            expect(context.translate).to.have.been.calledWith(-52, -199);
        });
        it('should translate further draw calls by one half of the canvas size', () => {
            adapter.canvasSize = [800, 600];
            sinon.stub(context, 'translate');
            camera.renderTransformed(adapter, () => void(0));
            expect(context.translate).to.have.been.calledWith(400, 300);
        });
        it('should scale further draw calls by the zoom scale', () => {
            camera.zoomScale = .25;
            sinon.stub(context, 'scale');
            camera.renderTransformed(adapter, () => void(0));
            expect(context.scale).to.have.been.calledWith(.25, .25);
        });
        it('should invoke context.restore', () => {
            sinon.stub(context, 'restore');
            camera.renderTransformed(adapter, () => void(0));
            expect(context.restore).to.have.been.calledOnce;
        });
    });
});
