/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { PhysicsComponent } from '../physics-component';
import { GameObject } from '../../game-object';
import { GameScene } from '../../game-scene';
import { Game } from '../../game';
import { MockGame } from '../../test/mock-game';

describe('PhysicsComponent', () => {
    let physics: PhysicsComponent;
    let gobj: GameObject;
    let scene: GameScene;
    let game: Game;
    beforeEach(() => {
        physics = new PhysicsComponent();
        gobj = new GameObject({ physics: physics });
        game = <any>(new MockGame(scene = new GameScene()));
        scene.addObject(gobj);
    });
    
    describe('.constructor', () => {
        it('should set direction and speed based on the options passed in', () => {
            let expectedDir = 195;
            let expectedSpeed = 4.5;
            let physics = new PhysicsComponent({ direction: expectedDir, speed: expectedSpeed });
            expect(physics.direction).to.eq(expectedDir);
            expect(physics.speed).to.eq(expectedSpeed);
        });
        it('should set hspeed and vspeed based on the options passed in', () => {
            let expectedHspeed = 6;
            let expectedVspeed= 4;
            let physics = new PhysicsComponent({ hspeed: 6, vspeed: 4 });
            expect(physics.hspeed).to.eq(expectedHspeed);
            expect(physics.vspeed).to.eq(expectedVspeed);
        });
    });
    
    describe('.direction', () => {
        it('should modify hspeed and vspeed when it changes', () => {
            Object.assign(physics, { hspeed: -4, vspeed: 0 });
            expect(physics.direction).to.be.closeTo(180, .00001);
            physics.direction = 90;
            expect(physics.hspeed).to.be.closeTo(0, .00001);
            expect(physics.vspeed).to.be.closeTo(-4, .00001);
        });
        it('should normalize the value when it is less than 0 or greater than 360', () => {
            physics.direction = -20;
            expect(physics.direction).to.be.closeTo(340, .00001);
            physics.direction += 40;
            expect(physics.direction).to.be.closeTo(20, .00001);
            physics.direction = 42 + (360 * 25);
            expect(physics.direction).to.be.closeTo(42, .00001);
        });
        it('should invoke console.log when the setter is called if DEBUG_MOVEMENT is true', () => {
            let stub: sinon.SinonStub | null = null;
            try {
                stub = sinon.stub(console, 'log');
                (<any>physics).DEBUG_MOVEMENT = true;
                physics.direction = 32;
                expect(console.log).to.have.been.calledWith(sinon.match(/setting direction/i));
                expect(console.log).to.have.been.calledWith(sinon.match(/hspeed:.*vspeed:/i));
            } finally { if (stub) stub.restore(); }
        });
        
        it('should be 0 when facing east', () => {
            Object.assign(physics, { hspeed: 1, vspeed: 0 });
            expect(physics.direction).to.eql(0);
        });
        it('should be 45 when facing northeast', () => {
            Object.assign(physics, { hspeed: 1, vspeed: -1 });
            expect(physics.direction).to.eql(45);
        });
        it('should be 90 when facing north', () => {
            Object.assign(physics, { hspeed: 0, vspeed: -1 });
            expect(physics.direction).to.eql(90);
        });
        it('should be 135 when facing northwest', () => {
            Object.assign(physics, { hspeed: -1, vspeed: -1 });
            expect(physics.direction).to.eql(135);
        });
        it('should be 180 when facing west', () => {
            Object.assign(physics, { hspeed: -1, vspeed: 0 });
            expect(physics.direction).to.eql(180);
        });
        it('should be 225 when facing southwest', () => {
            Object.assign(physics, { hspeed: -1, vspeed: 1 });
            expect(physics.direction).to.eql(225);
        });
        it('should be 270 when facing south', () => {
            Object.assign(physics, { hspeed: 0, vspeed: 1 });
            expect(physics.direction).to.eql(270);
        });
        it('should be 315 when facing southeast', () => {
            Object.assign(physics, { hspeed: 1, vspeed: 1 });
            expect(physics.direction).to.eql(315);
        });
        it('should be the same direction regardless of magnitude', () => {
            let dx = Math.random() - .5;
            let dy = Math.random() - .5;
            Object.assign(physics, { hspeed: dx, vspeed: dy });
            let dir = physics.direction;
            physics.hspeed = dx * 5;
            physics.vspeed = dy * 5;
            expect(physics.direction).to.be.closeTo(dir, .00001);
        });
    });
    describe('.speed', () => {
        it('should modify hspeed and vspeed when it changes', () => {
            Object.assign(physics, { hspeed: -4, vspeed: 0 });
            expect(physics.direction).to.be.closeTo(180, .00001);
            physics.speed = 2;
            expect(physics.hspeed).to.be.closeTo(-2, .00001);
            expect(physics.vspeed).to.be.closeTo(0, .00001);
        });
        it('should throw an error if you try to set a negative speed', () => {
            expect(() => physics.speed = -2).to.throw(/invalid speed/i);
        });
        it('should not change direction if set to 0', () => {
            Object.assign(physics, { hspeed: -4, vspeed: 0 });
            expect(physics.direction).to.be.closeTo(180, .00001);
            expect(physics.speed).to.be.closeTo(4, .00001);
            physics.speed = 0;
            expect(physics.hspeed).to.be.closeTo(0, .00001);
            expect(physics.vspeed).to.be.closeTo(0, .00001);
            expect(physics.direction).to.be.closeTo(180, .00001);
        });
        it('should not change hspeed and vspeed if set to the same value', () => {
            Object.assign(physics, { hspeed: -4, vspeed: 0 });
            (<any>physics)._hspeed = 29;
            (<any>physics)._vspeed = 63;
            physics.speed = 4;
            expect(physics.hspeed).to.be.closeTo(29, .00001);
            expect(physics.vspeed).to.be.closeTo(63, .00001);
        });
        it('should invoke console.log when the setter is called if DEBUG_MOVEMENT is true', () => {
            let stub: sinon.SinonStub | null = null;
            try {
                stub = sinon.stub(console, 'log');
                (<any>physics).DEBUG_MOVEMENT = true;
                physics.speed = 12;
                expect(console.log).to.have.been.calledWith(sinon.match(/setting speed/i));
                expect(console.log).to.have.been.calledWith(sinon.match(/hspeed:.*vspeed:/i));
            } finally { if (stub) stub.restore(); }
        });
    });
    describe('.hspeed', () => {
        it('should modify speed and direction when it changes', () => {
            Object.assign(physics, { speed: 4, direction: 0 });
            expect(physics.hspeed).to.be.closeTo(4, .00001);
            expect(physics.vspeed).to.be.closeTo(0, .00001);
            physics.hspeed = -2;
            expect(physics.direction).to.be.closeTo(180, .00001);
            expect(physics.speed).to.be.closeTo(2, .00001);
        });
        it('should not change direction if set to 0 and vspeed is already 0', () => {
            Object.assign(physics, { hspeed: -4, vspeed: 0 });
            expect(physics.direction).to.be.closeTo(180, .00001);
            physics.hspeed = 0;
            expect(physics.hspeed).to.be.closeTo(0, .00001);
            expect(physics.vspeed).to.be.closeTo(0, .00001);
            expect(physics.direction).to.be.closeTo(180, .00001);
        });
        it('should invoke console.log when the setter is called if DEBUG_MOVEMENT is true', () => {
            let stub: sinon.SinonStub | null = null;
            try {
                stub = sinon.stub(console, 'log');
                (<any>physics).DEBUG_MOVEMENT = true;
                physics.hspeed = 12;
                expect(console.log).to.have.been.calledWith(sinon.match(/setting hspeed/i));
                expect(console.log).to.have.been.calledWith(sinon.match(/speed:.*direction:/i));
            } finally { if (stub) stub.restore(); }
        });
    });
    describe('.vspeed', () => {
        it('should modify speed and direction when it changes', () => {
            Object.assign(physics, { speed: 4, direction: 90 });
            expect(physics.hspeed).to.be.closeTo(0, .00001);
            expect(physics.vspeed).to.be.closeTo(-4, .00001);
            physics.vspeed = 2;
            expect(physics.direction).to.be.closeTo(270, .00001);
            expect(physics.speed).to.be.closeTo(2, .00001);
        });
        it('should not change direction if set to 0 and hspeed is already 0', () => {
            Object.assign(physics, { hspeed: 0, vspeed: 4 });
            expect(physics.direction).to.be.closeTo(270, .00001);
            physics.vspeed = 0;
            expect(physics.hspeed).to.be.closeTo(0, .00001);
            expect(physics.vspeed).to.be.closeTo(0, .00001);
            expect(physics.direction).to.be.closeTo(270, .00001);
        });
        it('should invoke console.log when the setter is called if DEBUG_MOVEMENT is true', () => {
            let stub: sinon.SinonStub | null = null;
            try {
                stub = sinon.stub(console, 'log');
                (<any>physics).DEBUG_MOVEMENT = true;
                physics.vspeed = 12;
                expect(console.log).to.have.been.calledWith(sinon.match(/setting vspeed/i));
                expect(console.log).to.have.been.calledWith(sinon.match(/speed:.*direction:/i));
            } finally { if (stub) stub.restore(); }
        });
    });
    
    describe('.tick', () => {
        it('should not modify the position of the game object if speed == 0', () => {
            Object.assign(physics, { hspeed: 0, vspeed: 0 });
            gobj.tick(1);
            expect(gobj.x).to.eq(0);
            expect(gobj.y).to.eq(0);
        });
        it('should translate the game object by (hspeed, vspeed) * delta', () => {
            Object.assign(physics, { hspeed: 13, vspeed: -29 });
            gobj.tick(.5);
            expect(gobj.x).to.eq(physics.hspeed * .5);
            expect(gobj.y).to.eq(physics.vspeed * .5);
        });
    });
});
