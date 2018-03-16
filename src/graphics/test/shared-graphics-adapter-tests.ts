/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { GraphicsAdapter } from '../graphics-adapter';
import { Game } from '../../game';

export function sharedGraphicsAdapterTests(getObjects: () => [GraphicsAdapter, Game]) {
    describe('shared GraphicsAdapter behavior', () => {
        let adapter: GraphicsAdapter;
        let game: Game;
        beforeEach(() => {
            [adapter, game] = getObjects();
        });
        
        describe('.canvasSize', () => {
            it('should start as [0, 0]', () => {
                expect(adapter.canvasSize).to.deep.eq([0, 0]);
            });
            it('should return an array that does not change the follow offset when changed', () => {
                let offset = adapter.canvasSize;
                offset[0] = NaN;
                expect(adapter.canvasSize[0]).not.to.be.NaN;
            });
            it('should be updated any time the window is resized', () => {
                [(<any>window).innerWidth, (<any>window).innerHeight] = [123, 456];
                expect(adapter.canvasSize).not.to.deep.eq([123, 456]);
                window.onresize(<any>void(0));
                expect(adapter.canvasSize).to.deep.eq([123, 456]);
            });
        });
    });
}
