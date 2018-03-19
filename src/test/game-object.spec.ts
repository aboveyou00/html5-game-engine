/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { GameObject } from '../game-object';
import { Game } from '../game';
import { GameScene } from '../game-scene';
import { GraphicsAdapter } from '../graphics/graphics-adapter';

describe('GameObject', () => {
    it('should start without a resourceLoader, eventQueue, or game', () => {
        let gobj = new GameObject();
        expect(() => gobj.game).to.throw(/hasn't been added to a scene/i);
        expect(() => gobj.resources).to.throw(/hasn't been added to a scene/i);
        expect(() => gobj.events).to.throw(/hasn't been added to a scene/i);
    });
    
    describe('.constructor', () => {
        it('should set the game object name based on the option passed in', () => {
            let expectedName = 'my-name';
            let gobj = new GameObject({ name: expectedName });
            expect(gobj.name).to.eq(expectedName);
        });
        it('should default the game object name to the constructor name if no name is passed in', () => {
            let expectedName = GameObject.name;
            let gobj = new GameObject();
            expect(gobj.name).to.eq(expectedName);
            class MySubclassOfGameObject extends GameObject { constructor() { super(); } }
            expectedName = MySubclassOfGameObject.name;
            gobj = new MySubclassOfGameObject();
            expect(gobj.name).to.eq(expectedName);
        });
        it('should set x and y based on the options passed in', () => {
            let options = { x: 45, y: 12 };
            let gobj = new GameObject(options);
            expect(gobj.x).to.eq(options.x);
            expect(gobj.y).to.eq(options.y);
        });
    });
    
    describe('.addToScene', () => {
        let testGame: Game = <any>{ resourceLoader: 'fake resource loader!', scene: new GameScene() };
        it(`should populate the 'game,' 'resources,' and 'events' helper properties`, () => {
            let gobj = new GameObject();
            testGame.scene!.game = testGame;
            (<any>gobj).addToScene(testGame.scene!);
            expect(gobj.game).to.deep.eq(testGame);
            expect(gobj.resources).to.deep.eq(testGame.resourceLoader);
            expect(gobj.events).to.deep.eq(testGame.eventQueue);
        });
        it('should throw an error if the game object is already added to a game', () => {
            let gobj = new GameObject();
            (<any>gobj).addToScene(new GameScene());
            expect(() => (<any>gobj).addToScene(new GameScene())).to.throw(/already added to a scene/i);
        });
    });
    
    describe('.removeFromScene', () => {
        let testGame: Game = <any>{ resourceLoader: 'fake resource loader!' };
        it(`should depopulate the 'game,' 'resources,' and 'events' helper properties`, () => {
            let gobj = new GameObject();
            (<any>gobj).addToScene(new GameScene());
            (<any>gobj).removeFromScene();
            expect(() => gobj.game).to.throw(/hasn't been added to a scene/i);
            expect(() => gobj.resources).to.throw(/hasn't been added to a scene/i);
            expect(() => gobj.events).to.throw(/hasn't been added to a scene/i);
        });
    });
    
    describe('.handleEvent', () => {
        it('should not throw an error', () => {
            let gobj = new GameObject({ x: 0, y: 0, physics: { hspeed: 0, vspeed: 0 } });
            expect(gobj.handleEvent(<any>void(0))).not.to.throw;
        });
    });
});
