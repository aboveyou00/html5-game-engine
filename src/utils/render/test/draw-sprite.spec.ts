/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);
let any = sinon.match.any;

import { ResourceLoader } from '../../../resource-loader';
import { simpleSprite, tiledSprite, animatedSprite } from './sample-sprites';
import _ = require('lodash');

import { drawSprite } from '../draw-sprite';

describe('utils/drawSprite', () => {
    let context: CanvasRenderingContext2D;
    beforeEach(() => {
        let canvas = new HTMLCanvasElement();
        context = canvas.getContext('2d')!;
    });
    
    let img = <any>'this is my image!';
    let loader: ResourceLoader = <any>{ loadImage: () => img };
    
    describe('with an invalid resource loader', () => {
        it('should throw an error', () => {
            expect(() => drawSprite(context, <any>null, { src: 'some-source' })).to.throw(/ResourceLoader/i);
        });
    });
    
    describe('with an invalid sprite', () => {
        it('should throw an error if sprite is falsey', () => {
            expect(() => drawSprite(context, loader, <any>null)).to.throw(/invalid sprite/i);
        });
        it('should throw an error if sprite has no src', () => {
            expect(() => drawSprite(context, loader, <any>{})).to.throw(/invalid sprite/i);
        });
    });
    
    describe('with a simple sprite', () => {
        let sprite = simpleSprite;
        
        it('should render the image', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, sprite);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWith(img);
        });
        it('should render the image offset by x, y, and the sprite pivot', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, _.merge({ pivot: { x: 5, y: 3 } }, sprite), 13, 28);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWith(any, 8, 25);
        });
    });
    
    describe('with a tiled sprite', () => {
        let sprite = tiledSprite;
        
        it('should render the image', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, sprite);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWith(img);
        });
        it('should render only the tile specified in sprite.tileset', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, sprite);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWithExactly(any, 32, 32, 32, 32, any, any, 32, 32);
        });
        it('should render the image offset by x, y, and the sprite pivot', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, _.merge({ pivot: { x: 5, y: 3 } }, sprite), 13, 28);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWithExactly(any, any, any, any, any, 8, 25, any, any);
        });
    });
    
    describe('with an animated sprite', () => {
        let sprite = animatedSprite;
        
        it('should render the image', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, sprite);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWith(img);
        });
        it('should render only the tile specified in sprite.tileset and sprite.frames', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, sprite, 0, 0, 0 / 30, 30);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWithExactly(any, 0, 0, 32, 32, any, any, 32, 32);
        });
        it('should render the correct frame when an image index is passed in', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, sprite, 0, 0, 1 / 30, 30);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWithExactly(any, 32, 0, 32, 32, any, any, 32, 32);
        });
        it('should wrap the image index around the number of frames', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, sprite, 0, 0, 5 / 30, 30);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWithExactly(any, 64, 0, 32, 32, any, any, 32, 32);
        });
        it('should allow negative image indexes', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, sprite, 0, 0, -2 / 30, 30);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWithExactly(any, 32, 0, 32, 32, any, any, 32, 32);
        });
        it('should round down when the image index is not a evenly divisible by the sprite fps', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, sprite, 0, 0, .8 / 30, 30);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWithExactly(any, 0, 0, 32, 32, any, any, 32, 32);
        });
        it('should render the image offset by x, y, and the sprite pivot', () => {
            sinon.stub(context, 'drawImage');
            drawSprite(context, loader, _.merge({ pivot: { x: 5, y: 3 } }, sprite), 13, 28);
            let subject = expect(context.drawImage).to.have.been;
            subject.calledOnce;
            subject.calledWithExactly(any, any, any, any, any, 8, 25, any, any);
        });
    });
});
