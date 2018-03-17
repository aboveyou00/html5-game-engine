/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { GameObject } from '../game-object';
import { Game } from '../game';
import * as renderUtils from '../utils/render';
import { GameScene } from '../game-scene';
import { Rect } from '../utils/rect';
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
        it('should default the game object name to the constructor name is no name is passed in', () => {
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
        it('should set direction and speed based on the options passed in', () => {
            let options = { physics: { direction: 195, speed: 4.5 } };
            let gobj = new GameObject(options);
            expect(gobj.physics!.direction).to.eq(options.physics.direction);
            expect(gobj.physics!.speed).to.eq(options.physics.speed);
        });
        it('should set hspeed and vspeed based on the options passed in', () => {
            let options = { physics: { hspeed: 6, vspeed: 4 } };
            let gobj = new GameObject(options);
            expect(gobj.physics!.hspeed).to.eq(options.physics.hspeed);
            expect(gobj.physics!.vspeed).to.eq(options.physics.vspeed);
        });
        it('should set sprite, animationAge, animationSpeed, and imageAngle based on the options passed in', () => {
            let options = <any>{ shouldRender: 'aaa', spriteRenderer: { sprite: 'bbb', animationAge: 'ccc', animationSpeed: 'ddd', imageAngle: 'eee' } };
            let gobj = new GameObject(options);
            expect(gobj.spriteRenderer!.sprite).to.eq(options.spriteRenderer.sprite);
            expect(gobj.spriteRenderer!.animationAge).to.eq(options.spriteRenderer.animationAge);
            expect(gobj.spriteRenderer!.animationSpeed).to.eq(options.spriteRenderer.animationSpeed);
            expect(gobj.spriteRenderer!.imageAngle).to.eq(options.spriteRenderer.imageAngle);
        });
    });
    
    describe('.direction', () => {
        it('should modify hspeed and vspeed when it changes', () => {
            let gobj = new GameObject({ physics: { hspeed: -4, vspeed: 0 } });
            expect(gobj.physics!.direction).to.be.closeTo(180, .00001);
            gobj.physics!.direction = 90;
            expect(gobj.physics!.hspeed).to.be.closeTo(0, .00001);
            expect(gobj.physics!.vspeed).to.be.closeTo(-4, .00001);
        });
        it('should normalize the value when it is less than 0 or greater than 360', () => {
            let gobj = new GameObject();
            gobj.physics!.direction = -20;
            expect(gobj.physics!.direction).to.be.closeTo(340, .00001);
            gobj.physics!.direction += 40;
            expect(gobj.physics!.direction).to.be.closeTo(20, .00001);
            gobj.physics!.direction = 42 + (360 * 25);
            expect(gobj.physics!.direction).to.be.closeTo(42, .00001);
        });
        it('should invoke console.log when the setter is called if DEBUG_MOVEMENT is true', () => {
            let stub: sinon.SinonStub | null = null;
            try {
                stub = sinon.stub(console, 'log');
                let gobj = new GameObject();
                (<any>gobj.physics).DEBUG_MOVEMENT = true;
                gobj.physics!.direction = 32;
                expect(console.log).to.have.been.calledWith(sinon.match(/setting direction/i));
                expect(console.log).to.have.been.calledWith(sinon.match(/hspeed:.*vspeed:/i));
            } finally { if (stub) stub.restore(); }
        });
        
        it('should be 0 when facing east', () => {
            let gobj = new GameObject({ physics: { hspeed: 1, vspeed: 0 } });
            expect(gobj.physics!.direction).to.eql(0);
        });
        it('should be 45 when facing northeast', () => {
            let gobj = new GameObject({ physics: { hspeed: 1, vspeed: -1 } });
            expect(gobj.physics!.direction).to.eql(45);
        });
        it('should be 90 when facing north', () => {
            let gobj = new GameObject({ physics: { hspeed: 0, vspeed: -1 } });
            expect(gobj.physics!.direction).to.eql(90);
        });
        it('should be 135 when facing northwest', () => {
            let gobj = new GameObject({ physics: { hspeed: -1, vspeed: -1 } });
            expect(gobj.physics!.direction).to.eql(135);
        });
        it('should be 180 when facing west', () => {
            let gobj = new GameObject({ physics: { hspeed: -1, vspeed: 0 } });
            expect(gobj.physics!.direction).to.eql(180);
        });
        it('should be 225 when facing southwest', () => {
            let gobj = new GameObject({ physics: { hspeed: -1, vspeed: 1 } });
            expect(gobj.physics!.direction).to.eql(225);
        });
        it('should be 270 when facing south', () => {
            let gobj = new GameObject({ physics: { hspeed: 0, vspeed: 1 } });
            expect(gobj.physics!.direction).to.eql(270);
        });
        it('should be 315 when facing southeast', () => {
            let gobj = new GameObject({ physics: { hspeed: 1, vspeed: 1 } });
            expect(gobj.physics!.direction).to.eql(315);
        });
        it('should be the same direction regardless of magnitude', () => {
            let dx = Math.random() - .5;
            let dy = Math.random() - .5;
            let gobj = new GameObject({ physics: { hspeed: dx, vspeed: dy } });
            let dir = gobj.physics!.direction;
            gobj.physics!.hspeed = dx * 5;
            gobj.physics!.vspeed = dy * 5;
            expect(gobj.physics!.direction).to.be.closeTo(dir, .00001);
        });
    });
    describe('.speed', () => {
        it('should modify hspeed and vspeed when it changes', () => {
            let gobj = new GameObject({ physics: { hspeed: -4, vspeed: 0 } });
            expect(gobj.physics!.direction).to.be.closeTo(180, .00001);
            gobj.physics!.speed = 2;
            expect(gobj.physics!.hspeed).to.be.closeTo(-2, .00001);
            expect(gobj.physics!.vspeed).to.be.closeTo(0, .00001);
        });
        it('should throw an error if you try to set a negative speed', () => {
            let gobj = new GameObject();
            expect(() => gobj.physics!.speed = -2).to.throw(/invalid speed/i);
        });
        it('should not change direction if set to 0', () => {
            let gobj = new GameObject({ physics: { hspeed: -4, vspeed: 0 } });
            expect(gobj.physics!.direction).to.be.closeTo(180, .00001);
            expect(gobj.physics!.speed).to.be.closeTo(4, .00001);
            gobj.physics!.speed = 0;
            expect(gobj.physics!.hspeed).to.be.closeTo(0, .00001);
            expect(gobj.physics!.vspeed).to.be.closeTo(0, .00001);
            expect(gobj.physics!.direction).to.be.closeTo(180, .00001);
        });
        it('should not change hspeed and vspeed if set to the same value', () => {
            let gobj = new GameObject({ physics: { hspeed: -4, vspeed: 0 } });
            (<any>gobj.physics)._hspeed = 29;
            (<any>gobj.physics)._vspeed = 63;
            gobj.physics!.speed = 4;
            expect(gobj.physics!.hspeed).to.be.closeTo(29, .00001);
            expect(gobj.physics!.vspeed).to.be.closeTo(63, .00001);
        });
        it('should invoke console.log when the setter is called if DEBUG_MOVEMENT is true', () => {
            let stub: sinon.SinonStub | null = null;
            try {
                stub = sinon.stub(console, 'log');
                let gobj = new GameObject();
                (<any>gobj.physics).DEBUG_MOVEMENT = true;
                gobj.physics!.speed = 12;
                expect(console.log).to.have.been.calledWith(sinon.match(/setting speed/i));
                expect(console.log).to.have.been.calledWith(sinon.match(/hspeed:.*vspeed:/i));
            } finally { if (stub) stub.restore(); }
        });
    });
    describe('.hspeed', () => {
        it('should modify speed and direction when it changes', () => {
            let gobj = new GameObject({ physics: { speed: 4, direction: 0 } });
            expect(gobj.physics!.hspeed).to.be.closeTo(4, .00001);
            expect(gobj.physics!.vspeed).to.be.closeTo(0, .00001);
            gobj.physics!.hspeed = -2;
            expect(gobj.physics!.direction).to.be.closeTo(180, .00001);
            expect(gobj.physics!.speed).to.be.closeTo(2, .00001);
        });
        it('should not change direction if set to 0 and vspeed is already 0', () => {
            let gobj = new GameObject({ physics: { hspeed: -4, vspeed: 0 } });
            expect(gobj.physics!.direction).to.be.closeTo(180, .00001);
            gobj.physics!.hspeed = 0;
            expect(gobj.physics!.hspeed).to.be.closeTo(0, .00001);
            expect(gobj.physics!.vspeed).to.be.closeTo(0, .00001);
            expect(gobj.physics!.direction).to.be.closeTo(180, .00001);
        });
        it('should invoke console.log when the setter is called if DEBUG_MOVEMENT is true', () => {
            let stub: sinon.SinonStub | null = null;
            try {
                stub = sinon.stub(console, 'log');
                let gobj = new GameObject();
                (<any>gobj.physics).DEBUG_MOVEMENT = true;
                gobj.physics!.hspeed = 12;
                expect(console.log).to.have.been.calledWith(sinon.match(/setting hspeed/i));
                expect(console.log).to.have.been.calledWith(sinon.match(/speed:.*direction:/i));
            } finally { if (stub) stub.restore(); }
        });
    });
    describe('.vspeed', () => {
        it('should modify speed and direction when it changes', () => {
            let gobj = new GameObject({ physics: { speed: 4, direction: 90 } });
            expect(gobj.physics!.hspeed).to.be.closeTo(0, .00001);
            expect(gobj.physics!.vspeed).to.be.closeTo(-4, .00001);
            gobj.physics!.vspeed = 2;
            expect(gobj.physics!.direction).to.be.closeTo(270, .00001);
            expect(gobj.physics!.speed).to.be.closeTo(2, .00001);
        });
        it('should not change direction if set to 0 and hspeed is already 0', () => {
            let gobj = new GameObject({ physics: { hspeed: 0, vspeed: 4 } });
            expect(gobj.physics!.direction).to.be.closeTo(270, .00001);
            gobj.physics!.vspeed = 0;
            expect(gobj.physics!.hspeed).to.be.closeTo(0, .00001);
            expect(gobj.physics!.vspeed).to.be.closeTo(0, .00001);
            expect(gobj.physics!.direction).to.be.closeTo(270, .00001);
        });
        it('should invoke console.log when the setter is called if DEBUG_MOVEMENT is true', () => {
            let stub: sinon.SinonStub | null = null;
            try {
                stub = sinon.stub(console, 'log');
                let gobj = new GameObject();
                (<any>gobj.physics).DEBUG_MOVEMENT = true;
                gobj.physics!.vspeed = 12;
                expect(console.log).to.have.been.calledWith(sinon.match(/setting vspeed/i));
                expect(console.log).to.have.been.calledWith(sinon.match(/speed:.*direction:/i));
            } finally { if (stub) stub.restore(); }
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
    
    describe('.tick', () => {
        it('should not modify the position of the game object if speed == 0', () => {
            let gobj = new GameObject({ x: 0, y: 0, physics: { hspeed: 0, vspeed: 0 } });
            gobj.tick(1);
            expect(gobj.x).to.eq(0);
            expect(gobj.y).to.eq(0);
        });
        it('should translate the game object by (hspeed, vspeed) * delta', () => {
            let gobj = new GameObject({ x: 0, y: 0, physics: { hspeed: 13, vspeed: -29 } });
            gobj.tick(.5);
            expect(gobj.x).to.eq(gobj.physics!.hspeed * .5);
            expect(gobj.y).to.eq(gobj.physics!.vspeed * .5);
        });
        it('should not modify the animation age if animationSpeed == 0', () => {
            let gobj = new GameObject({ spriteRenderer: { animationSpeed: 0 } });
            gobj.tick(1);
            expect(gobj.spriteRenderer!.animationAge).to.eq(0);
        });
        it('should increase the animation age by animationSpeed * delta', () => {
            let gobj = new GameObject({ spriteRenderer: { animationSpeed: .3 } });
            gobj.tick(.5);
            expect(gobj.spriteRenderer!.animationAge).to.eq(.5 * .3);
        });
    });
    
    describe('.render', () => {
        let adapter: GraphicsAdapter;
        beforeEach(() => {
            adapter = <any>{ renderTransformed: (tx: any, ty: any, r: any, sx: any, sy: any, act: any) => act() };
        });
        
        it('should invoke renderTransformed', () => {
            let gobj = new GameObject();
            sinon.stub(adapter, 'renderTransformed');
            gobj.render(adapter);
            expect(adapter.renderTransformed).to.have.been.calledOnce;
        });
    });
});
