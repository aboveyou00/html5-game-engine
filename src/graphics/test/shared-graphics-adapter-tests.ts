/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { GraphicsAdapter } from '../graphics-adapter';
import { Game } from '../../game';

export function sharedGraphicsAdapterTests<T extends GraphicsAdapter>(isFullscreen: boolean, factory: () => T, cleanUp: (adapter: T) => void) {
    describe('shared GraphicsAdapter behavior', () => {
        let adapter: T;
        beforeEach(() => {
            adapter = factory();
        });
        afterEach(() => {
            if (adapter.game && adapter.game.isRunning) adapter.game.stop();
            cleanUp(adapter);
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
            
            describe('when the game is started', () => {
                let game: Game;
                beforeEach(() => {
                    game = new Game({ graphicsAdapter: adapter });
                    game.start();
                });
                
                if (isFullscreen) {
                    it('should be updated any time the window is resized', () => {
                        [(<any>window).innerWidth, (<any>window).innerHeight] = [123, 456];
                        expect(adapter.canvasSize).not.to.deep.eq([123, 456]);
                        window.onresize(<any>void(0));
                        expect(adapter.canvasSize).to.deep.eq([123, 456]);
                    });
                }
            });
        });
    });
}
