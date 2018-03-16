/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { EmptyGraphicsAdapter } from '../empty-graphics-adapter';
import { Game } from '../../game';
import { sharedGraphicsAdapterTests } from './shared-graphics-adapter-tests';

declare let global: any;

describe('EmptyGraphicsAdapter', () => {
    sharedGraphicsAdapterTests(false, () => new EmptyGraphicsAdapter(), adapter => adapter.cleanUp());
    
    describe('specific EmptyGraphicsAdapter behavior', () => {
        let adapter: EmptyGraphicsAdapter;
        let game: Game;
        beforeEach(() => {
            adapter = new EmptyGraphicsAdapter();
            game = new Game({ graphicsAdapter: adapter });
            adapter.init(game);
        });
        afterEach(() => {
            adapter.cleanUp();
        });
    });
});
