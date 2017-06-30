/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { fillText, measureSprite } from '../render';
import { ResourceLoader } from '../../resource-loader';
import { simpleSprite, tiledSprite, animatedSprite } from './sample-sprites';
import _ = require('lodash');
let any = sinon.match.any;

describe('utils/fillText', () => {
    let context: CanvasRenderingContext2D;
    beforeEach(() => {
        context = new HTMLCanvasElement().getContext("2d");
    });

    it('should split strings on new lines and render to context', () => {
        expect(() => fillText(context, "和書委\n和書委\n和書委\n和書委", 0, 0)).not.to.throw;
    });

    it('should invoke context.renderText for every line of text', () => {
        sinon.stub(context, 'fillText');
        fillText(context, 'a\nb\nHello\nWorld', 0, 0);
        let subject = expect(context.fillText).to.have.been;
        subject.callCount(4);
        subject.calledWith('a');
        subject.calledWith('b');
        subject.calledWith('Hello');
        subject.calledWith('World');
    });
});

describe('utils/measureSprite', () => {
    let img = <any>{ width: 42, height: 64 };
    let expectedDims = { width: img.width, height: img.height };
    let loader: ResourceLoader = <any>{ loadImage: () => img };

    describe('with an invalid resource loader', () => {
        it('should not throw an error', () => {
            expect(() => measureSprite(null, { src: 'some-source' })).not.to.throw;
        });
    });

    describe('with an invalid sprite', () => {
        it('should throw an error if sprite is falsey', () => {
            expect(() => measureSprite(loader, <any>null)).to.throw(/invalid sprite/i);
        });
        it('should throw an error if sprite has no src', () => {
            expect(() => measureSprite(loader, <any>{})).to.throw(/invalid sprite/i);
        });
    });

    describe('with a simple sprite', () => {
        let sprite = simpleSprite;

        it(`should return the load image's dimensions`, () => {
            let result = measureSprite(loader, sprite);
            expect(result).to.deep.eq(expectedDims);
        });
        it(`should return { width: 0, height: 0 } if the image is not done loading`, () => {
            let result = measureSprite(<any>{ loadImage: () => (<any>{ }) }, sprite);
            expect(result).to.deep.eq({ width: 0, height: 0 });
        });
    });

    describe('with a tiled sprite', () => {
        let sprite = tiledSprite;

        it('should return the tile width and height', () => {
            let result = measureSprite(loader, sprite);
            expect(result).to.deep.eq({ width: 32, height: 32 });
        });
    });

    describe('with a animated sprite', () => {
        let sprite = animatedSprite;

        it('should return the tile width and height', () => {
            let result = measureSprite(loader, sprite);
            expect(result).to.deep.eq({ width: 32, height: 32 });
        });
    });
});
