/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { Context2dGraphicsAdapter } from '../context2d-graphics-adapter';
import { Game } from '../../game';
import { sharedGraphicsAdapterTests } from './shared-graphics-adapter-tests';
let any = sinon.match.any;

declare let global: any;

describe('Context2dGraphicsAdapter', () => {
    sharedGraphicsAdapterTests(true, () => new Context2dGraphicsAdapter(), adapter => adapter.cleanUp());
    
    describe('specific Context2dGraphicsAdapter behavior', () => {
        let context: CanvasRenderingContext2D;
        let adapter: Context2dGraphicsAdapter;
        let game: Game;
        beforeEach(() => {
            let canvas = new HTMLCanvasElement();
            adapter = new Context2dGraphicsAdapter(canvas);
            game = new Game({ graphicsAdapter: adapter });
            adapter.init(game);
            context = adapter.context!;
        });
        afterEach(() => {
            adapter.cleanUp();
        });
        
        describe('.canvasSize=', () => {
            it('should short-circuit without sending an event if the new size is the same as the last one', () => {
                sinon.stub(game.eventQueue, 'enqueue');
                adapter.canvasSize = [640, 480];
                expect(game.eventQueue.enqueue).not.to.have.been.called;
            });
            it('should copy the values to prevent further changes to the object modifying the follow offset', () => {
                let newCanvasSize: [number, number] = [25, 92];
                adapter.canvasSize = newCanvasSize;
                newCanvasSize[0] = NaN;
                expect(adapter.canvasSize).to.deep.eq([25, 92]);
            });
            it(`should queue a 'canvasResize' event in the EventQueue`, () => {
                sinon.stub(game.eventQueue, 'enqueue');
                adapter.canvasSize = [123, 987];
                expect(game.eventQueue.enqueue).to.have.been.called;
            });
        });
        
        describe('.clear', () => {
            it('should fill the screen with the clear color if it is specified', () => {
                sinon.stub(context, 'fillRect');
                (<any>adapter)._canvas = { width: 400, height: 400 };
                adapter.clear('green');
                expect(context.fillRect).to.have.been.calledOnce;
                expect(context.fillStyle).to.eq('green');
            });
        });
        
        describe('.renderResourceLoader', () => {
            it('should not throw an error', () => {
                expect(() => adapter.renderResourceLoader(0, 0)).not.to.throw;
            });
            it('should fill the canvas with a solid color', () => {
                sinon.stub(context, 'fillRect');
                adapter.renderResourceLoader(0, 0);
                expect(context.fillRect).to.have.been.calledOnce.calledWith(0, 0, context.canvas.scrollWidth, context.canvas.scrollHeight);
            });
            it('should render a progress bar if totalResources > 0', () => {
                sinon.stub(context, 'fillRect');
                adapter.renderResourceLoader(0, 1);
                expect(context.fillRect).to.have.been.calledThrice
                    .calledWith(0, 0, context.canvas.scrollWidth, context.canvas.scrollHeight)
                    .calledWith(any, any, 0, any)
                    .calledWith(any, any, sinon.match((v: any) => typeof v === 'number' && v > 0), any);
            });
            it('should render the loaded and total resources as text', () => {
                sinon.stub(context, 'fillText');
                adapter.renderResourceLoader(0, 0);
                expect(context.fillText).to.have.been.calledOnce.calledWith('0/0');
            });
            it('should render the loaded and total resources as text even if not all resources are loaded', () => {
                sinon.stub(context, 'fillText');
                adapter.renderResourceLoader(0, 1);
                expect(context.fillText).to.have.been.calledOnce.calledWith('0/1');
            });
            it('should render any errors that occur as text', () => {
                sinon.stub(context, 'fillText');
                adapter.renderResourceLoader(0, 0, 'FISH and CHIPS');
                expect(context.fillText).to.have.been.calledTwice
                    .calledWith(sinon.match(/0\/0/))
                    .calledWith(sinon.match(/FISH and CHIPS/));
            });
        });
        
        describe('.renderTransformed', () => {
            it('should save and restore the context state', () => {
                sinon.stub(context, 'save');
                sinon.stub(context, 'restore');
                adapter.renderTransformed(0, 0, 0, 1, 1, () => void(0));
                expect(context.save).to.have.been.calledOnce;
                expect(context.restore).to.have.been.calledOnce.calledAfter(<any>context.save);
            });
            it('should translate, rotate, and scale the image based on the arguments', () => {
                sinon.stub(context, 'translate');
                sinon.stub(context, 'rotate');
                sinon.stub(context, 'scale');
                adapter.renderTransformed(13, -27, -Math.PI, 3, 2, () => void(0));
                expect(context.translate).to.have.been.calledOnce.calledWith(13, -27);
                expect(context.rotate).to.have.been.calledOnce.calledWith(-Math.PI).calledAfter(<any>context.translate);
                expect(context.scale).to.have.been.calledOnce.calledWith(3, 2).calledAfter(<any>context.rotate);
            });
            it('should invoke the callback function', () => {
                let invoked = false;
                adapter.renderTransformed(13, -27, -Math.PI, 3, 2, () => invoked = true);
                expect(invoked).to.be.true;
            });
        });
    });
});
