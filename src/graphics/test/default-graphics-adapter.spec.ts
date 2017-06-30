/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { DefaultGraphicsAdapter } from '../default-graphics-adapter';
import { GameObject } from '../../game-object';
import { ResourceLoader } from '../../resource-loader';
import { simpleSprite, tiledSprite, animatedSprite } from '../../utils/test/sample-sprites';
import _ = require('lodash');
let any = sinon.match.any;

declare let global: any;

describe('DefaultGraphicsAdapter', () => {
    let context: CanvasRenderingContext2D;
    let adapter: DefaultGraphicsAdapter;
    beforeEach(() => {
        context = new HTMLCanvasElement().getContext('2d');
        adapter = new DefaultGraphicsAdapter(context);
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
                .calledWith(any, any, sinon.match(v => typeof v === 'number' && v > 0), any);
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
    describe('.renderObject', () => {
        it('should render the sprite if the game object has one', () => {
            sinon.stub(adapter, 'drawSprite');
            let sprite = { src: 'blah' };
            let gobj = new GameObject('name', { sprite: sprite, animationAge: 14.3 });
            adapter.renderObject(gobj);
            expect(adapter.drawSprite).to.have.been.calledOnce.calledWith(any, sprite, 0, 0, 14.3);
        });
        it('should render a rect and a question mark if the game object has no sprite', () => {
            sinon.stub(context, 'fillRect');
            sinon.stub(context, 'fillText');
            let gobj = new GameObject('name');
            adapter.renderObject(gobj);
            expect(context.fillRect).to.have.been.calledOnce;
            expect(context.fillText).to.have.been.calledOnce.calledWith('?');
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
    
    describe('.drawSprite', () => {
        let img = <any>'this is my image!';
        let loader: ResourceLoader = <any>{ loadImage: () => img };

        describe('with an invalid resource loader', () => {
            it('should throw an error', () => {
                expect(() => adapter.drawSprite(null, { src: 'some-source' })).to.throw(/ResourceLoader/i);
            });
        });

        describe('with an invalid sprite', () => {
            it('should throw an error if sprite is falsey', () => {
                expect(() => adapter.drawSprite(loader, <any>null)).to.throw(/invalid sprite/i);
            });
            it('should throw an error if sprite has no src', () => {
                expect(() => adapter.drawSprite(loader, <any>{})).to.throw(/invalid sprite/i);
            });
        });

        describe('with a simple sprite', () => {
            let sprite = simpleSprite;

            it('should render the image', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, sprite);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWith(img);
            });
            it('should render the image offset by x, y, and the sprite pivot', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, _.merge({ pivot: { x: 5, y: 3 } }, sprite), 13, 28);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWithExactly(any, 8, 25);
            });
        });

        describe('with a tiled sprite', () => {
            let sprite = tiledSprite;

            it('should render the image', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, sprite);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWith(img);
            });
            it('should render only the tile specified in sprite.tileset', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, sprite);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWithExactly(any, 32, 32, 32, 32, any, any, 32, 32);
            });
            it('should render the image offset by x, y, and the sprite pivot', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, _.merge({ pivot: { x: 5, y: 3 } }, sprite), 13, 28);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWithExactly(any, any, any, any, any, 8, 25, any, any);
            });
        });

        describe('with an animated sprite', () => {
            let sprite = animatedSprite;

            it('should render the image', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, sprite);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWith(img);
            });
            it('should render only the tile specified in sprite.tileset and sprite.frames', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, sprite, 0, 0, 0 / 30, 30);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWithExactly(any, 0, 0, 32, 32, any, any, 32, 32);
            });
            it('should render the correct frame when an image index is passed in', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, sprite, 0, 0, 1 / 30, 30);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWithExactly(any, 32, 0, 32, 32, any, any, 32, 32);
            });
            it('should wrap the image index around the number of frames', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, sprite, 0, 0, 5 / 30, 30);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWithExactly(any, 64, 0, 32, 32, any, any, 32, 32);
            });
            it('should allow negative image indexes', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, sprite, 0, 0, -2 / 30, 30);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWithExactly(any, 32, 0, 32, 32, any, any, 32, 32);
            });
            it('should round down when the image index is not a evenly divisible by the sprite fps', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, sprite, 0, 0, .8 / 30, 30);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWithExactly(any, 0, 0, 32, 32, any, any, 32, 32);
            });
            it('should render the image offset by x, y, and the sprite pivot', () => {
                sinon.stub(context, 'drawImage');
                adapter.drawSprite(loader, _.merge({ pivot: { x: 5, y: 3 } }, sprite), 13, 28);
                let subject = expect(context.drawImage).to.have.been;
                subject.calledOnce;
                subject.calledWithExactly(any, any, any, any, any, 8, 25, any, any);
            });
        });
    });
});
