/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { ResourceLoader } from '../resource-loader';
import { GraphicsAdapter } from '../graphics/graphics-adapter';

declare let global: any;
let any = sinon.match.any;

describe('ResourceLoader', () => {
    let loader: ResourceLoader;
    beforeEach(() => {
        loader = new ResourceLoader();
    });

    describe('.isDone', () => {
        it('should be true if no resources have been requested', () => {
            expect(loader.isDone).to.be.true;
        });
        it('should be false if an image has started loading but not yet completed', () => {
            loader.loadImage("I_like_chocolate.milk");
            expect(loader.isDone).to.be.false;
        });
        it('should be true if an image was requested but has since finished loading', () => {
            let img = loader.loadImage("I_like_chocolate.milk");
            img.onload(<any>void(0));
            expect(loader.isDone).to.be.true;
        });
        it('should be false if two images were requested but only one has finished loading', () => {
            let img1 = loader.loadImage("I_like_chocolate.milk");
            loader.loadImage("I_like.trains");
            img1.onload(<any>void(0));
            expect(loader.isDone).to.be.false;
        });
        it('should be false if a requested image returned an error', () => {
            let img = loader.loadImage("I_like_chocolate.milk");
            img.onerror(<any>void(0));
            expect(loader.isDone).to.be.false;
        });
    });

    let resourceTypes: [string, string, string, () => any][] = [
        ['loadImage', 'image', 'an HTMLImageElement', () => global.HTMLImageElement],
        ['loadAudio', 'audio', 'an HTMLAudioElement', () => global.HTMLAudioElement]
    ];
    resourceTypes.forEach(([methodName, resourceName, returnTypeName, returnType]) => {
        describe(`.${methodName}`, () => {
            it(`should increase the total number of ${resourceName} if the requested url was never requested before`, () => {
                let total = loader.totalResources;
                loader[methodName]("I_like_chocolate.milk");
                expect(loader.totalResources).to.eq(total + 1);
            });
            it(`should not reload a ${resourceName} if it was already requested`, () => {
                loader[methodName]("I_like_chocolate.milk");
                let total = loader.totalResources;
                loader[methodName]("I_like_chocolate.milk");
                expect(loader.totalResources).to.eq(total);
            });
            it(`should return ${returnTypeName}`, () => {
                let result = loader[methodName]("I_like_chocolate.milk");
                let type = returnType();
                expect(result).to.be.an.instanceOf(type);
            });
            it(`should invoke console.log if DEBUG_RESOURCES is true and the ${resourceName} has not been loaded before`, () => {
                let stub: sinon.SinonStub;
                try {
                    stub = sinon.stub(console, 'log');
                    (<any>loader).DEBUG_RESOURCES = true;
                    loader[methodName]('I_like_chocolate.milk');
                    expect(console.log).to.have.been.calledWith(sinon.match(new RegExp(`loading ${resourceName}`, 'i')));
                } finally { if (stub) stub.restore(); }
            });
            it(`should not invoke console.log if DEBUG_RESOURCES is true but the ${resourceName} has been loaded before`, () => {
                let stub: sinon.SinonStub;
                try {
                    stub = sinon.stub(console, 'log');
                    loader[methodName]('I_like_chocolate.milk');
                    (<any>loader).DEBUG_RESOURCES = true;
                    loader[methodName]('I_like_chocolate.milk');
                    expect(console.log).not.to.have.been.called;
                } finally { if (stub) stub.restore(); }
            });
        });
    });
    
    describe('.render', () => {
        it('should invoke adapter.renderResourceLoader', () => {
            let adapter: GraphicsAdapter = <any>{ renderResourceLoader: () => void(0) };
            sinon.stub(adapter, 'renderResourceLoader');
            loader.render(adapter);
            expect(adapter.renderResourceLoader).to.have.been.calledOnce;
        });
    });
});
